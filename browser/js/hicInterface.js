'use strict'

hic.Dataset.prototype.findChromosomeIndex = function(name) {
    var nameToFind = name.replace("chr", "");
    nameToFind = nameToFind.replace("M", "MT");
    let found = this.chromosomes.find(function (chromosome) {
        return chromosome.name == nameToFind;
    });
    if (found) {
        return found.index;
    }
    return -1;
}

class HicInterface {

    constructor(hicTrack) {
        this.hicTrack = hicTrack;
        this.reader = new hic.HiCReader({
            url: hicTrack.url,
            config: {}
        });
        this.datasetPromise = this.reader.loadDataset();
    }

    static getHicPromises(browser, tracks) {
        var promises = [];

        let hicTracks = tracks.filter(function (track) {
        	return track.ft == FT_hi_c;
        });

        for (let hicTrack of hicTracks) {
        	/*
        	hicTrack.qtc {
        		bin_size: {number} the index
        		d_binsize: {number} the actual value
        		norm: {string} the normalization type
        	}
        	browser.regionLst[0] : left boundary of region info
        	browser.regionLst[-1]: right boundary of region info
        	browser.regionLst[i][0]: {string} chromosome
        	browser.regionLst[i][3]: {number} start base pair
        	browser.regionLst[i][4]: {number} end base pair
        	*/
            if (!hicTrack.hicInterface) {
                hicTrack.hicInterface = new HicInterface(hicTrack);
            }
        	let theRegion = 0; //FIXME when there's multiple regions...
        	let chromosome = browser.regionLst[theRegion][0];
        	let startBasePair = browser.regionLst[theRegion][3];
        	let endBasePair = browser.regionLst[theRegion][4];
        	promises.push(hicTrack.hicInterface.getData(chromosome, startBasePair, endBasePair, chromosome,
                startBasePair, endBasePair, null)); // TODO add bin option
        }

        return promises;
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
    getData(chr1, bpX, bpXMax, chr2, bpY, bpYMax, minResolution) {
        if (!minResolution) {
            minResolution = HicInterface.DEFAULT_MIN_RESOLUTION; // Defined at the bottom of file, after class definition
        }

        var d_binsize = 0;
        let promise = this.datasetPromise.then(function (dataset) {
            let chr1Index = dataset.findChromosomeIndex(chr1);
            let chr2Index = dataset.findChromosomeIndex(chr2);
            let state = HicInterface.coordinatesToState(dataset, chr1Index, bpX, bpXMax, chr2Index, bpY, bpYMax,
                minResolution);
            this.hicTrack.d_binsize = dataset.bpResolutions[state.zoom];
            return HicInterface.getBlocks(dataset, state, this.hicTrack.qtc.norm);
        }.bind(this)).then(function (blocks) {
            return this.formatBlocks(blocks, chr1);
        }.bind(this));
        return promise;
    }

    static coordinatesToState(dataset, chr1, bpX, bpXMax, chr2, bpY, bpYMax, minResolution) { // hic.Browser.prototype.goto
        var xCenter,
            yCenter,
            targetResolution,
            viewDimensions = { //this.contactMatrixView.getViewDimensions(), // TODO need replacement for this
                width: 200,
                height: 50
            },
            maxExtent;

        targetResolution = Math.max((bpXMax - bpX) / viewDimensions.width, (bpYMax - bpY) / viewDimensions.height);

        if (targetResolution < minResolution) {
            maxExtent = viewDimensions.width * minResolution;
            xCenter = (bpX + bpXMax) / 2;
            yCenter = (bpY + bpYMax) / 2;
            bpX = Math.max(xCenter - maxExtent / 2);
            bpY = Math.max(0, yCenter - maxExtent / 2);
            targetResolution = minResolution;
        }

        var bpResolutions = dataset.bpResolutions,
            newZoom = HicInterface.findMatchingZoomIndex(targetResolution, bpResolutions),
            newResolution = bpResolutions[newZoom],
            newPixelSize = Math.max(1, newResolution / targetResolution),
            newXBin = bpX / newResolution,
            newYBin = bpY / newResolution;

        var state = {};
        state.chr1 = chr1;
        state.chr2 = chr2;
        state.zoom = newZoom;
        state.x = newXBin; // Stores the FIRST bin number
        state.y = newYBin;
        state.pixelSize = newPixelSize;
        return state;
    }

    static findMatchingZoomIndex(targetResolution, resolutionArray) { // Basically gets bin size
        for (let z = resolutionArray.length - 1; z > 0; z--) {
            if (resolutionArray[z] >= targetResolution) {
                return z;
            }
        }
        return 0;
    }


    static calculateBlockNumber(zd, row, column) { // Based off of hic.ContactMatrixView.prototype.getImageTile
        var sameChr = zd.chr1 === zd.chr2;
        var blockColumnCount = zd.blockColumnCount;

        if (sameChr && row < column) {
            return column * blockColumnCount + row;
        }
        else {
            return row * blockColumnCount + column;
        }
    }

    static getBlocks(dataset, state, normalization) { // hic.ContactMatrixView.prototype.update

        return dataset.getMatrix(state.chr1, state.chr2).then(function (matrix) {

            var //widthInBins = self.$viewport.width() / state.pixelSize, // TODO need this.
                //heightInBins = self.$viewport.height() / state.pixelSize,
                widthInBins = 50,
                heightInBins = 50,
                zd = matrix.bpZoomData[state.zoom], // zd = zoomData.
                blockBinCount = zd.blockBinCount,
                col1 = Math.floor(state.x / blockBinCount),
                col2 = Math.floor((state.x + widthInBins) / blockBinCount),
                row1 = Math.floor(state.y / blockBinCount),
                row2 = Math.floor((state.y + heightInBins) / blockBinCount),
                promises = [];

            for (let r = row1; r <= row2; r++) {
                for (let c = col1; c <= col2; c++) {
                    let blockNumber = HicInterface.calculateBlockNumber(zd, r, c);
                    promises.push(dataset.getNormalizedBlock(zd, blockNumber, normalization));
                }
            }

            return Promise.all(promises);
        });
    }

    /*
        data: {array} of {array}; data for each chromosome.  index not important.  Not sure if can we combine.
        name: {string} we can use this to tell tracks uniquely
        other attributes: see base.js line 17215.  It just replaces track.qtc attributes with the ones that the server
        sends if names match
    */
    formatBlocks(blocks, chromosome) {
        let blocksAsCoorData = blocks.map(function(block) {
            return HicInterface.blockToCoordinateData(block, chromosome);
        });

        let combinedCoorData = [].concat.apply([], blocksAsCoorData); // Concatenate all the data into one array
        for (let i = 0; i < combinedCoorData.length; i++) { // Make sure ids are unique
            combinedCoorData[i].id = i;
        }

        return {
            data: [combinedCoorData],
            name: this.hicTrack.name,
            ft: this.hicTrack.ft,
            mode: this.hicTrack.mode,
            bin_size: this.hicTrack.bin_size,
            d_binsize: this.hicTrack.d_binsize
        };
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

        this.id = id;
        this.name = `${chromosome}:${coor1Start}-${coor1Stop},${counts}`;
        this.start = coor2Start;
        this.stop = coor2Stop;
        this.strand = (bin1 < bin2) ? "<" : ">";
    }
}

HicInterface.DEFAULT_MIN_RESOLUTION = 200;
