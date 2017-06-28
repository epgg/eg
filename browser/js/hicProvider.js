/**
 * This file contains the main interface for the epigenome browser to retrieve HiC data.  It contains HicProvider and
 * helpers for it.
 *
 * @author Silas Hsu
 * @since version 43, June 2017
 */
'use strict'

/**
 * Class that wraps juicebox.js's HiCReader and Dataset, providing a way to retrieve HiC from genomic coordinates.
 *
 * About bins: HiC stores contact matrix data.  Becuase the entire matrix is very large, we aggregate adjacent entries
 * into larger cells.  The number of rows and columns we aggregate is the bin size.  Bin size is measured in base pairs.
 *
 * Dependencies: juicebox-1.0-modified.js and base.js.  Juicebox.js further depends on jQuery, igv.js,
 * and underscore.js.
 *
 * @author Silas Hsu
 */
class HicProvider {
    /**
     * Makes a new HicProvider, specialized to serve HiC data from the given HiCReader and format results in a certain
     * way
     *
     * @param {hic.HiCReader} reader - the HiCReader from which to get a dataset
     * @param {HicFormatter} hicFormatter - used to format blocks from the HiCReader
     */
    constructor(hicReader, hicFormatter) {
        this.reader = hicReader;
        this.datasetPromise = hicReader.loadDataset();
        this.hicFormatter = hicFormatter;
    }

    /**
     * (This function would logically be part of some HiCTrack class.  However, that doesn't exist, so I stuck the code
     * here.)
     *
     * Looks for HiC tracks in the given track list.  For each HiC track, retrieves data in all the input regions.  The
     * result is an array of promises for TrackData, one for each HiC track.
     *
     * Additional details:
     * - Given an empty array for any of the parameters, returns an empty array.
     * - HiC tracks can specify automatic bin size.  In this case, the choosen bin size will depend on the length of the
     *     longest region passed to the function.
     * - For more info on bins, see the class documentation: {@link HicProvider}
     *
     * @param {Track[]} tracks - an array of Track-like objects that base.js uses
     * @param {Region[]} regions - an array of Regions
     * @return {Promise.<TrackData>[]} - an array of Promise for track data, one for each HiC track
     * @see {@link _constructTrackData} for details of TrackData
     * @see {@link RegionWrapper} for a class that fulfills the region API
     */
    static getHicPromises(tracks, regions) {
        if (!tracks || !regions || regions.length == 0) {
            return [];
        }

        let hicTracks = tracks.filter(track => track.ft == FT_hi_c);
        if (hicTracks.length == 0) {
            return [];
        }

        regions = RegionWrapper.wrapRegions(regions);
        let longestRegion = regions.reduce((longestLengthSoFar, currentRegion) => {
            let currentLength = currentRegion.lengthInBasePairs;
            return currentLength > longestLengthSoFar ? currentLength : longestLengthSoFar;
        }, regions[0].lengthInBasePairs); // regions[0] ok since we checked for empty region array.

        let promisesForEachTrack = [];
        for (let hicTrack of hicTracks) {
            let hicInstance = hicTrack[HicProvider.TRACK_PROP_NAME] ||
                new HicProvider(hic.HiCReader.fromUrl(hicTrack.url), BrowserHicFormatter);

            // Each track's promise is a Promise.all for all regions.
            let promisesForEachRegion = [];
            for (let region of regions) {
                let chromosome = region.chromosome;
                let startBasePair = region.startBasePair;
                let endBasePair = region.endBasePair;
                let binSizeOverride = hicTrack.qtc.bin_size == scale_auto ? // User-set bin size?
                    null : Number.parseInt(hicTrack.qtc.bin_size);
                promisesForEachRegion.push(hicInstance.getRecords(chromosome, startBasePair, endBasePair, chromosome,
                    startBasePair, endBasePair, hicTrack.qtc.norm, longestRegion, binSizeOverride));
            }

            let trackPromise = Promise.all(promisesForEachRegion)
                .then(recordsForEachRegion => hicInstance._constructTrackData(hicTrack, recordsForEachRegion));
            promisesForEachTrack.push(trackPromise);
        }

        return promisesForEachTrack;
    }

    /**
     * (This function would logically be part of some HiCTrack class.  However, that doesn't exist, so I stuck the code
     * here.)
     *
     * Uses the given parameters to construct an object formatted in the way base.js expects when updating tracks.
     * Mainly copies certain properties of the parameters.  The main exception is bin size, which will be inferred from
     * the first CoordinateRecord of recordsForEachRegion.
     *
     * @param {Track} hicTrack - a Track-like object from base.js
     * @param {Array.<CoordinateRecord[]>} recordsForEachRegion - an array of arrays; the outer array indexes region and
     *     the inner arrays contain CoordinateRecords for each region
     * @return {TrackData} an object that base.js reads when updating a track
     */
    _constructTrackData(hicTrack, recordsForEachRegion) {
        // Find the first region with records
        let regionWithRecords = recordsForEachRegion.find(records => records.length > 0);
        let binSize = regionWithRecords !== undefined ? (regionWithRecords[0].stop - regionWithRecords[0].start) : 0;
        let trackData = {
            data: recordsForEachRegion,
            name: hicTrack.name,
            ft: hicTrack.ft,
            mode: hicTrack.mode,
            bin_size: hicTrack.qtc.bin_size || scale_auto,
            d_binsize: binSize,
            matrix: "observed",
        }
        trackData[HicProvider.TRACK_PROP_NAME] = this;
        /*
        By putting `this` in the track data, we expect Browser.prototype.jsonTrackdata (in base.js) to attach `this` to
        the HiC track, and then we can take advantage of juicebox.js's caching if the Track appears again in
        getHicPromises().
        */
        return trackData;
    }

    /**
     * Converts the input genomic range to the corresponding row and column range of a HiC contact matrix.  Returns a
     * promise for an array of CoordinateRecord containing the data in the contact matrix.  The records will at minimum
     * cover the requested genomic coordinates, but there may be more records than requested.
     *
     * Automatically selects a bin size based on the longest dimension (row or column), but the last two arguments can
     * manually adjust bin size as well.  For more info on bins, see the class documentation: {@link HicProvider}.
     *
     * Additional details:
     * - As the arguments suggest, this method can request only the contact matrix between two chromosomes or the
     *     same chromosome.  If multiple chromosomes are needed, make multiple calls to this method.
     * - Although contact matrices are symmetric, the retrieved records will contain the full matrix since base.js
     *     requires it.
     *
     * @param {string} chr1Name - chromosome for the row range of the matrix
     * @param {number} bpX - lower base pair for the row range
     * @param {number} bpXMax - higher base pair for row range
     * @param {string} chr2Name - chromosome for the column range of the matrix
     * @param {number} bpY - lower base pair for the column range
     * @param {number} bpYMax - higher base pair for column range
     * @param {string} [normalization] - (optional) type of normalization to apply to the record data
     * @param {number} [regionLengthOverride] - (optional) forces the use of a certain region length when selecting
     *     bin size.  Ignored if targetBinSize is present.
     * @param {number} [targetBinSize] - (optional) forces the smallest bin size >= the value of this parameter
     * @return {Promise.<CoordinateRecord[]>} a promise for an array of CoordinateRecord containing the requested data
     */
    getRecords(chr1Name, bpX, bpXMax, chr2Name, bpY, bpYMax, normalization, regionLengthOverride, targetBinSize) {
        let regionLength = regionLengthOverride || Math.max(bpXMax - bpX, bpYMax - bpY);
        let promise = this.datasetPromise
            .then((dataset) => {
                let zoomIndex = targetBinSize != undefined ?
                    dataset.binsizeToZoomIndex(targetBinSize) : dataset.regionLengthToZoomIndex(regionLength);
                let binCoors = HicProvider._toBinCoordinates(
                    dataset, chr1Name, bpX, bpXMax, chr2Name, bpY, bpYMax, zoomIndex
                );
                return HicProvider.getBlocks(dataset, binCoors, normalization);
            })
            .catch((error) => { // Catch error here because we don't want the failure of one region to fail the rest
                print2console(error.toString(), 2);
                return [];
            })
            .then((blocks) => {
                if (blocks.length == 0) {
                    print2console(`No HiC data for ${chr1Name}`, 0);
                    return [];
                }
                return this.hicFormatter.formatBlocks(blocks, chr1Name, chr2Name);
            });
        return promise;
    }

    /**
     * Converts matrix coordinates in base pairs to coordinates in bin numbers, and returns the results in one object.
     * For more info on what bins are, see the class documentation: {@link HicProvider}
     *
     * @param {hic.Dataset} dataset - used for conversion of chromosome names and looking up bin size
     * @param {string} chr1Name - chromosome for the row range of the matrix
     * @param {number} bpX - lower base pair for the row range
     * @param {number} bpXMax - higher base pair for row range
     * @param {string} chr2Name - chromosome for the column range of the matrix
     * @param {number} bpY - lower base pair for the column range
     * @param {number} bpYMax - higher base pair for column range
     * @param {number} zoomIndex - index in `dataset` containing the bin size
     * @return {Object} an object containing chromosome numbers, bin coordinates, and zoom index
     * @throws {Error} if a chromosome name could not be understood
     */
    static _toBinCoordinates(dataset, chr1Name, bpX, bpXMax, chr2Name, bpY, bpYMax, zoomIndex) {
        let chr1Index = dataset.findChromosomeIndex(chr1Name);
        let chr2Index = dataset.findChromosomeIndex(chr2Name);
        if (chr1Index == -1 || chr2Index == -1) {
            throw new Error(`Couldn't find valid chromosome indices for ${chr1Name} and/or ${chr2Name}`);
        }

        let binSize = dataset.bpResolutions[zoomIndex];
        let xBin = bpX / binSize; // First bin number of the region
        let yBin = bpY / binSize;
        let widthInBins = Math.ceil((bpXMax - bpX) / binSize);
        let heightInBins = Math.ceil((bpYMax - bpY) / binSize);

        return {
            chr1: chr1Index,
            chr2: chr2Index,
            xBin: xBin,
            yBin: yBin,
            widthInBins: widthInBins,
            heightInBins: heightInBins,
            zoomIndex: zoomIndex
        };
    }

    /**
     * HiC contact matrices consist of blocks or tiles of data.  Given a bin number range, retrieves the blocks that
     * cover the bins.
     *
     * @param {hic.Dataset} dataset - the dataset from which to retrieve data
     * @param {Object} binCoors - object containing chromosome numbers, bin coordinates, and zoom index
     * @param {string} [normalization] - (optional) type of normalization to apply to the data
     * @return {Promise.<hic.Block[]>} - promise for an array of blocks containing the requested data
     * @see {@link _toBinCoordinates}
     */
    static getBlocks(dataset, binCoors, normalization) { // Based on hic.ContactMatrixView.prototype.update
        return dataset.getMatrix(binCoors.chr1, binCoors.chr2).then((matrix) => {
            if (!matrix) {
                return [];
            }

            // Calculate the row and column of block
            let zoomData = matrix.bpZoomData[binCoors.zoomIndex];
            let blockBinCount = zoomData.blockBinCount;
            let colMin = Math.floor(binCoors.xBin / blockBinCount);
            let colMax = Math.floor((binCoors.xBin + binCoors.widthInBins) / blockBinCount);
            let rowMin = Math.floor(binCoors.yBin / blockBinCount);
            let rowMax = Math.floor((binCoors.yBin + binCoors.heightInBins) / blockBinCount);

            let promises = [];
            for (let row = rowMin; row <= rowMax; row++) {
                for (let col = colMin; col <= colMax; col++) {
                    let blockNumber = HicProvider._calculateBlockNumber(zoomData, row, col);
                    promises.push(dataset.getNormalizedBlock(zoomData, blockNumber, normalization));
                }
            }

            return Promise.all(promises);
        });
    }

    /**
     * Converts a block row and column to a single block number that can index a HiC file.
     *
     * @param {MatrixZoomData} zoomData - see juicebox.js for more details
     * @param {number} row - row number of a block
     * @param {number} column - column number of a block
     * @return {number} block number that can index a HiC file
     */
    static _calculateBlockNumber(zoomData, row, column) { // Based on hic.ContactMatrixView.prototype.getImageTile
        var sameChr = zoomData.chr1 === zoomData.chr2;
        var blockColumnCount = zoomData.blockColumnCount;

        if (sameChr && row < column) {
            return column * blockColumnCount + row;
        }
        else {
            return row * blockColumnCount + column;
        }
    }
}

HicProvider.TRACK_PROP_NAME = "hicInstance";

/**
 * base.js uses arrays to represent genomic regions.  This class extends such arrays to provide named access to region
 * info.  Otherwise, magic numbers or named consts would be needed.
 */
class RegionWrapper {
    constructor(arrayLikeRegion) {
        for (let key in arrayLikeRegion) {
            this[key] = arrayLikeRegion[key];
        }
    }

    static wrapRegions(regions) {
        return regions.map(region => new RegionWrapper(region));
    }

    /**
     * Returns a new RegionWrapper with the underlying region's chromosome, start base pair, and end base pair set.
     * Other indicies of the underlying region will NOT be set.
     */
    static make(chromosome, startBasePair, endBasePair) {
        let wrapper = new RegionWrapper([]);
        wrapper[RegionWrapper.CHROMOSOME_INDEX] = chromosome;
        wrapper[RegionWrapper.START_BASE_PAIR_INDEX] = startBasePair;
        wrapper[RegionWrapper.END_BASE_PAIR_INDEX] = endBasePair;
        return wrapper;
    }

    get chromosome() { return this[RegionWrapper.CHROMOSOME_INDEX]; }
    get startBasePair() { return this[RegionWrapper.START_BASE_PAIR_INDEX]; }
    get endBasePair() { return this[RegionWrapper.END_BASE_PAIR_INDEX]; }
    get lengthInBasePairs() { return this.endBasePair - this.startBasePair; }
}

RegionWrapper.CHROMOSOME_INDEX = 0;
RegionWrapper.START_BASE_PAIR_INDEX = 3;
RegionWrapper.END_BASE_PAIR_INDEX = 4;
