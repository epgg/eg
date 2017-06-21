'use strict'

class HicInterface {

    /*
     * One would think that a HicTrack depends on a HicInterface, and therefore HicTracks should take a HicInterface in
     * the constructor.  Unfortunately, tracks in the browser are plain objects, so we have this solution instead, where
     * HicInterfaces depend on HicTracks.
     */
    constructor(url) {
        this.url = url;
        this.reader = new hic.HiCReader({
            url: url,
            config: {}
        });
        this.datasetPromise = this.reader.loadDataset();
    }

    static getHicPromises(regionLst, tracks) {
        if (regionLst.length == 0) {
            return [];
        }

        let hicTracks = tracks.filter(function (track) {
            return track.ft == FT_hi_c;
        });
        if (hicTracks.length == 0) {
            return [];
        }

        let longestRegion = regionLst.reduce(function (longestLengthSoFar, currentRegion) {
            let currentLength = currentRegion[4] - currentRegion[3];
            return currentLength > longestLengthSoFar ? currentLength : longestLengthSoFar;
        }, regionLst[0][4] - regionLst[0][3]);

        let promisesForEachTrack = [];
        for (let hicTrack of hicTracks) {
            // Each hicTrack may cover multiple regions.  So each track's promise is a Promise.all for all regions
            /*
            hicTrack.qtc {
                bin_size: {number} the index
                d_binsize: {number} the actual value
                norm: {string} the normalization type
            }
            browser.regionLst[0] : leftmost region
            browser.regionLst[-1]: rightmost region
            browser.regionLst[i][0]: {string} chromosome
            browser.regionLst[i][3]: {number} start base pair
            browser.regionLst[i][4]: {number} end base pair
            */
            let hicInterface = hicTrack.hicInterface || new HicInterface(hicTrack.url);
            if (hicTrack.url != hicInterface.url) { // This should never be true, but just in case...
                hicInterface = new HicInterface(hicTrack.url);
            }

            let promisesForEachRegion = [];
            for (let region of regionLst) {
                let chromosome = region[0];
                let startBasePair = region[3];
                let endBasePair = region[4];
                let binSizeOverride = hicTrack.qtc.bin_size == scale_auto ?
                    null : Number.parseInt(hicTrack.qtc.bin_size);
                promisesForEachRegion.push(hicInterface.getRecords(chromosome, startBasePair, endBasePair, chromosome,
                    startBasePair, endBasePair, hicTrack.qtc.norm, longestRegion, binSizeOverride));
            }

            let trackPromise = Promise.all(promisesForEachRegion)
                .then(function (recordsObjForEachRegion) {
                    return hicInterface.constructTrackData(hicTrack, recordsObjForEachRegion);
                });
            promisesForEachTrack.push(trackPromise);
        }

        return promisesForEachTrack;
    }

    constructTrackData(hicTrack, recordsObjForEachRegion) {
        let binSize = recordsObjForEachRegion.find(function (recordsObj) { // The first obj where binSize is not null
            return recordsObj.binSize != null;
        }).binSize;
        let recordsForEachRegion = recordsObjForEachRegion.map(function (recordsObj) {
            return recordsObj.records;
        });

        let trackData = {
            data: recordsForEachRegion,
            name: hicTrack.name,
            ft: hicTrack.ft,
            mode: hicTrack.mode,
            bin_size: hicTrack.qtc.bin_size || scale_auto,
            d_binsize: binSize,
            matrix: "observed",
            hicInterface: this
        }
        /*
        By putting `hicInterface: this`, we expect Browser.prototype.jsonTrackdata (in base.js) to attach `this` to
        the HiC track, and then we can take advantage of juicebox.js' caching when the track appears again in
        getHicPromises().
        */
        return trackData;
    }

    /**
     * Gets a promise for an object of records in the weird format that the browser reads.  It is structured like so:
     * {
     *    data: {array} [each element is an {array} of records]
     *    name: {string}
     * }
     * @param {number} chr1 -
     * (all params except normalization are number)
     */
    getRecords(chr1, bpX, bpXMax, chr2, bpY, bpYMax, normalization, regionLengthOverride, binSizeOverride) {
        let regionLength = regionLengthOverride || Math.max(bpXMax - bpX, bpYMax - bpY);
        let recordsObj = {
            binSize: null,
            records: []
        };

        let promise = this.datasetPromise.then(function (dataset) {
            let chr1Index = dataset.findChromosomeIndex(chr1);
            let chr2Index = dataset.findChromosomeIndex(chr2);
            if (chr1Index == -1 || chr2Index == -1) {
                print2console(`Couldn't find valid chromosome indices for ${chr1} and/or ${chr2}`, 2);
                return [];
            }

            let zoomIndex = HicInterface.getZoomIndex(dataset, regionLength, binSizeOverride);
            let binSize = dataset.bpResolutions[zoomIndex];
            recordsObj.binSize = binSize
            let binCoors = HicInterface.getBinCoordinates(chr1Index, bpX, bpXMax, chr2Index, bpY, bpYMax,
                zoomIndex, binSize);

            return HicInterface.getBlocks(dataset, binCoors, normalization);
        }).then(function (blocks) {
            if (!blocks) {
                print2console(`No HiC data for ${chr1}`, 0);
            } else {
                recordsObj.records = HicInterface.formatAndMergeBlocks(blocks, chr1);
            }
            return recordsObj;
        });
        return promise;
    }

    static getZoomIndex(dataset, regionLength, desiredBinSize) {
        if (desiredBinSize > 0) {
            return dataset.binsizeToZoomIndex(desiredBinSize);
        } else if (regionLength > 0) {
            return dataset.regionLengthToZoomIndex(regionLength);
        } else {
            return 0;
        }
    }

    static getBinCoordinates(chr1, bpX, bpXMax, chr2, bpY, bpYMax, zoomIndex, binSize) { // hic.Browser.prototype.goto
        let xBin = bpX / binSize, // First bin number of the region
            yBin = bpY / binSize,
            widthInBins = Math.ceil((bpXMax - bpX) / binSize),
            heightInBins = Math.ceil((bpYMax - bpY) / binSize);

        let binCoors = {
            chr1: chr1,
            chr2: chr2,
            zoomIndex: zoomIndex,
            xBin: xBin,
            yBin: yBin,
            widthInBins: widthInBins,
            heightInBins: heightInBins
        };
        return binCoors;
    }

    static getBlocks(dataset, binCoors, normalization) { // hic.ContactMatrixView.prototype.update

        return dataset.getMatrix(binCoors.chr1, binCoors.chr2).then(function (matrix) {
            if (!matrix) {
                return null;
            }

            // Calculate the row and column of block
            var zoomData = matrix.bpZoomData[binCoors.zoomIndex],
                blockBinCount = zoomData.blockBinCount,
                colMin = Math.floor(binCoors.xBin / blockBinCount),
                colMax = Math.floor((binCoors.xBin + binCoors.widthInBins) / blockBinCount),
                rowMin = Math.floor(binCoors.yBin / blockBinCount),
                rowMax = Math.floor((binCoors.yBin + binCoors.heightInBins) / blockBinCount),
                promises = [];

            for (let r = rowMin; r <= rowMax; r++) {
                for (let c = colMin; c <= colMax; c++) {
                    let blockNumber = HicInterface.calculateBlockNumber(zoomData, r, c);
                    promises.push(dataset.getNormalizedBlock(zoomData, blockNumber, normalization));
                }
            }

            return Promise.all(promises);
        });
    }

    static calculateBlockNumber(zoomData, row, column) { // Based off of hic.ContactMatrixView.prototype.getImageTile
        var sameChr = zoomData.chr1 === zoomData.chr2;
        var blockColumnCount = zoomData.blockColumnCount;

        if (sameChr && row < column) {
            return column * blockColumnCount + row;
        }
        else {
            return row * blockColumnCount + column;
        }
    }

    /*
        data: {array} of {array}; data for each chromosome.  index not important.  Not sure if can we combine.
        name: {string} we can use this to tell tracks uniquely
        other attributes: see base.js line 17215.  It just replaces track.qtc attributes with the ones that the server
        sends if names match
    */
    static formatAndMergeBlocks(blocks, chromosome) {
        if (!blocks) {
            return [];
        }

        let blocksAsCoorData = blocks.map(function(block) {
            return HicInterface.blockToCoordinateData(block, chromosome);
        });

        let combinedCoorData = [].concat.apply([], blocksAsCoorData); // Concatenate all the data into one array
        for (let i = 0; i < combinedCoorData.length; i++) { // Make sure ids are unique
            combinedCoorData[i].id = i;
        }
        return combinedCoorData;
    }

    static blockToCoordinateData(block, chromosome) {
        if (!block) {
            print2console(`No HiC data for block in ${chromosome}, possibly corrupt file?`, 2);
            return [];
        }
        var binSize = block.zoomData.zoom.binSize;
        var allData = [];
        var id = 0;
        for (let record of block.records) {
            allData.push(new CoordinateRecord(id, chromosome, record.bin1, record.bin2, binSize, record.counts));
            id++;
            // Apparently, our API cannot infer the other half of a symmetric matrix from just a triangular part,
            // so we have to make a new record with bin1 and bin2 switched...
            allData.push(new CoordinateRecord(id, chromosome, record.bin2, record.bin1, binSize, record.counts));
            id++;
        }
        return allData;
    }
}

class CoordinateRecord {
    constructor(id, chromosome, bin1, bin2, binSize, counts) {
        let coor1Start = bin1 * binSize;
        let coor1Stop = (bin1 + 1) * binSize;
        let coor2Start = bin2 * binSize;
        let coor2Stop = (bin2 + 1) * binSize;
        let roundedCounts = counts.toFixed(CoordinateRecord.DIGITS_TO_ROUND);

        this.id = id;
        this.name = `${chromosome}:${coor1Start}-${coor1Stop},${roundedCounts}`;
        this.start = coor2Start;
        this.stop = coor2Stop;
        this.strand = (bin1 < bin2) ? "<" : ">";
    }
}

CoordinateRecord.DIGITS_TO_ROUND = 3;
