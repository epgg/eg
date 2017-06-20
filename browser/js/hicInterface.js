'use strict'

class HicInterface {

    constructor(hicTrack) {
        this.hicTrack = hicTrack;
        this.reader = new hic.HiCReader({
            url: hicTrack.url,
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
            if (!hicTrack.hicInterface) {
                hicTrack.hicInterface = new HicInterface(hicTrack);
            }

            let promisesAcrossRegions = [];
            for (let region of regionLst) {
                let chromosome = region[0];
                let startBasePair = region[3];
                let endBasePair = region[4];
                promisesAcrossRegions.push(hicTrack.hicInterface.getData(chromosome, startBasePair, endBasePair,
                    chromosome, startBasePair, endBasePair, longestRegion));
            }

            let promise = Promise.all(promisesAcrossRegions)
                .then(function (dataForEachRegion) {
                    return {
                        data: dataForEachRegion,
                        name: hicTrack.name,
                        ft: hicTrack.ft,
                        mode: hicTrack.mode,
                        bin_size: hicTrack.qtc.bin_size || scale_auto,
                        d_binsize: hicTrack.qtc.d_binsize,
                        matrix: "observed"
                    }
                });

            promisesForEachTrack.push(promise);
        }

        return promisesForEachTrack;
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
    getData(chr1, bpX, bpXMax, chr2, bpY, bpYMax, regionLengthOverride) {
        let desiredBinSize = this.hicTrack.qtc.bin_size == scale_auto ?
            null : Number.parseInt(this.hicTrack.qtc.bin_size);
        let promise = this.datasetPromise.then(function (dataset) {
            let chr1Index = dataset.findChromosomeIndex(chr1);
            let chr2Index = dataset.findChromosomeIndex(chr2);
            if (chr1Index == -1 || chr2Index == -1) {
                print2console(`Couldn't find valid chromosome indices for ${chr1} and ${chr2} (hicInterface.js:130)`, 2);
                return [];
            }

            let binCoors = HicInterface.getBinCoordinates(dataset, chr1Index, bpX, bpXMax, chr2Index, bpY, bpYMax,
                desiredBinSize, regionLengthOverride);

            this.hicTrack.qtc.d_binsize = dataset.bpResolutions[binCoors.zoomIndex];
            return HicInterface.getBlocks(dataset, binCoors, this.hicTrack.qtc.norm);
        }.bind(this)).then(function (blocks) {
            return HicInterface.formatBlocks(blocks, chr1);
        });
        return promise;
    }

    static getBinCoordinates(dataset, chr1, bpX, bpXMax, chr2, bpY, bpYMax, desiredBinSize, regionLengthOverride) { // hic.Browser.prototype.goto
        let zoomIndex;

        if (desiredBinSize == null) {
            let regionLength = regionLengthOverride || Math.max(bpXMax - bpX, bpYMax - bpY);
            zoomIndex = dataset.regionLengthToZoomIndex(regionLength);
        } else {
            zoomIndex = dataset.binsizeToZoomIndex(desiredBinSize);
        }
        let newBinsize = dataset.bpResolutions[zoomIndex],
            newXBin = bpX / newBinsize, // First bin number of the region
            newYBin = bpY / newBinsize,
            widthInBins = Math.ceil((bpXMax - bpX) / newBinsize),
            heightInBins = Math.ceil((bpYMax - bpY) / newBinsize);

        let binCoors = {
            chr1: chr1,
            chr2: chr2,
            zoomIndex: zoomIndex,
            xBin: newXBin,
            yBin: newYBin,
            widthInBins: widthInBins,
            heightInBins: heightInBins
        };
        return binCoors;
    }

    static getBlocks(dataset, binCoors, normalization) { // hic.ContactMatrixView.prototype.update

        return dataset.getMatrix(binCoors.chr1, binCoors.chr2).then(function (matrix) {
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
    static formatBlocks(blocks, chromosome) {
        let blocksAsCoorData = blocks.map(function(block) {
            if (!block) {
                print2console(`No HiC data for block in ${chromosome}; try zooming in or re-adding the track`, 2);
                return [];
            }
            return HicInterface.blockToCoordinateData(block, chromosome);
        });

        let combinedCoorData = [].concat.apply([], blocksAsCoorData); // Concatenate all the data into one array
        for (let i = 0; i < combinedCoorData.length; i++) { // Make sure ids are unique
            combinedCoorData[i].id = i;
        }
        return combinedCoorData;
    }

    static blockToCoordinateData(block, chromosome) {
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
