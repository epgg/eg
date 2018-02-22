'use strict';

/**
 * Class that wraps juicebox.js's HiCReader and Dataset, providing a way to retrieve HiC from genomic coordinates.
 *
 * Dependencies: juicebox.min.js and CoordinateRecord.js.  Juicebox.js further depends on jQuery, igv.js, and
 * underscore.js.
 *
 * @extends FetchStrategy
 * @author Silas Hsu
 * @since version 43, June 2017
 */
class HicFetchStrategy {
    /**
     * Makes a new HicProvider, specialized to serve HiC data from the given HiCReader and format results in a certain
     * way.
     *
     * @param {hic.HiCReader} reader - the HiCReader from which to get a dataset
     * @param {string} trackLabel - the track's name to use for logging messages
     */
    constructor(hicReader, trackLabel) {
        this.reader = hicReader;
        this.datasetPromise = hicReader.loadDataset({});
        this.datasetPromise
            .then(dataset => hicReader.readNormExpectedValuesAndNormVectorIndex(dataset)) // Load in background
            .then(() => print2console(`${trackLabel}: Finished loading normalization data`, 1));
        this.trackLabel = trackLabel || "";
    }

    /**
     * @inheritdoc
     */
    fetchRecords(region1, region2, normalization, regionLengthOverride, targetBinSize) {
        const regionLength = regionLengthOverride || Math.max(region1.getLength(), region2.getLength());
        let promise = this.datasetPromise
            .then((dataset) => {
                const zoomIndex = targetBinSize != undefined ?
                    dataset.binsizeToZoomIndex(targetBinSize) : dataset.regionLengthToZoomIndex(regionLength);
                const binCoors = this._toBinCoordinates(dataset, region1, region2, zoomIndex);
                return this._getBlocks(dataset, binCoors, normalization);
            })
            .then((blocks) => {
                if (blocks.length == 0) {
                    print2console(`${this.trackLabel}: no HiC data for ${region1.chromosome}`, 0);
                    return [];
                }
                return this._formatBlocks(blocks, region1.chromosome);
            });
        return promise;
    }

    /**
     * @inheritdoc
     */
    constructTrackObject(track, template) {
        let actualNorm = track.qtc.norm;
        if (!this.reader.normVectorIndex) {
            print2console(`${this.trackLabel}: normalization data not loaded yet`, 2);
            actualNorm = "NONE";
        }
        template.norm = actualNorm;
        return template;
    }

    /**
     * Converts matrix coordinates in base pairs to coordinates in bin numbers, and returns the results in one object.
     * For more info on what bins are, see the class documentation: {@link HicProvider}
     *
     * @param {hic.Dataset} dataset - used for conversion of chromosome names and looking up bin size
     * @param {RegionWrapper} region1 - genomic interval for the row range of the matrix
     * @param {RegionWrapper} region2 - genomic interval for the column range of the matrix
     * @return {Object} an object containing chromosome numbers, bin coordinates, and zoom index
     * @throws {Error} if a chromosome name could not be understood
     */
    _toBinCoordinates(dataset, region1, region2, zoomIndex) {
        const chr1Name = region1.chromosome;
        const chr2Name = region2.chromosome;
        let chr1Index = dataset.findChromosomeIndex(chr1Name);
        let chr2Index = dataset.findChromosomeIndex(chr2Name);
        if (chr1Index == -1 || chr2Index == -1) {
            throw new Error(
                `${this.trackLabel}: Couldn't find valid chromosome indices for ${chr1Name} and/or ${chr2Name}`
            );
        }
        const binSize = dataset.bpResolutions[zoomIndex];

        return {
            chr1: chr1Index,
            chr2: chr2Index,
            xBin: region1.start / binSize, // First bin number of the region
            yBin: region2.start / binSize,
            widthInBins: Math.ceil(region1.getLength() / binSize),
            heightInBins: Math.ceil(region2.getLength() / binSize),
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
    _getBlocks(dataset, binCoors, normalization) { // Based on hic.ContactMatrixView.prototype.update
        return dataset.getMatrix(binCoors.chr1, binCoors.chr2).then((matrix) => {
            if (!matrix) {
                return [];
            }

            // Calculate the row and column of block
            const zoomData = matrix.bpZoomData[binCoors.zoomIndex];
            const blockBinCount = zoomData.blockBinCount;
            const colMin = Math.floor(binCoors.xBin / blockBinCount);
            const colMax = Math.floor((binCoors.xBin + binCoors.widthInBins) / blockBinCount);
            const rowMin = Math.floor(binCoors.yBin / blockBinCount);
            const rowMax = Math.floor((binCoors.yBin + binCoors.heightInBins) / blockBinCount);

            let promises = [];
            for (let row = rowMin; row <= rowMax; row++) {
                for (let col = colMin; col <= colMax; col++) {
                    let blockNumber = this._calculateBlockNumber(zoomData, row, col);
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
    _calculateBlockNumber(zoomData, row, column) { // Based on hic.ContactMatrixView.prototype.getImageTile
        var sameChr = zoomData.chr1 === zoomData.chr2;
        var blockColumnCount = zoomData.blockColumnCount;

        if (sameChr && row < column) {
            return column * blockColumnCount + row;
        }
        else {
            return row * blockColumnCount + column;
        }
    }

    /**
     * Merges an array of blocks into one array of CoordinateRecord.
     *
     * @param {hic.Block[]} blocks - array of HiC blocks
     * @param {string} chrName - chromosome name used for construction of all the CoordinateRecords
     * @return {CoordinateRecord[]} array of CoordinateRecord containing the data in all the blocks
     */
    _formatBlocks(blocks, chrName) {
        if (!blocks) {
            return [];
        }

        const blocksAsCoorRecords = blocks.map(block => this._convertBlockToCoordinateRecords(block, chrName));
        let combinedCoorRecords = [].concat.apply([], blocksAsCoorRecords); // Concatenate all the data into one array
        for (let i = 0; i < combinedCoorRecords.length; i++) { // Make sure ids are unique
            combinedCoorRecords[i].id = i;
        }
        return combinedCoorRecords;
    }

    /**
     * Puts the data in a HiC block into an array of CoordinateRecord.  HiC blocks express only a triangular portion of
     * the contact matrix, and this method also adds records corresponding to the other triangular half.
     *
     * @param {hic.Block[]} block - the block to convert
     * @param {string} chromosome - chromosome name used for construction of all the CoordinateRecords
     * @return {CoordinateRecord[]} array of CoordinateRecord containing the data in the block
     */
    _convertBlockToCoordinateRecords(block, chrName) {
        if (!block) {
            print2console(`${this.trackLabel}: no HiC data for block in ${chrName}, possibly corrupt file?`, 2);
            return [];
        }

        const binSize = block.zoomData.zoom.binSize;
        let coordinateRecords = [];
        let id = 0;
        for (let record of block.records) {
            coordinateRecords.push(new CoordinateRecord(id, chrName, record.bin1, record.bin2, binSize, record.counts));
            id++;
            // Blocks only contain a triangular portion of the matrix, so for the other triangle, switch bin1 and bin2
            if (record.bin1 !== record.bin2) {
                coordinateRecords.push(
                    new CoordinateRecord(id, chrName, record.bin2, record.bin1, binSize, record.counts)
                );
                id++;
            }
        }
        return coordinateRecords;
    }

}
