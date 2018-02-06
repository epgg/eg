/**
 * This file contains classes to convert the data in hic.Block to other formats.
 *
 * @author Silas Hsu
 * @since version 43, June 2017
 */
'use strict'

/**
 * Base class for a hic.Block formatter.  Provides an overridable static formatBlocks method.
 */
class HicFormatter {
    /**
     * Format an array of hic.Block.  Default implementation simply returns the same array without modification.
     *
     * @param {hic.Block[]} blocks - array of HiC blocks
     * @param {string} chr1Name - chromosome name that may or may not be useful
     * @param {string} chr2Name - second chromosome name that may or may not be useful
     * @return {Object} the formatted blocks
     */
    static formatBlocks(blocks, chr1Name, chr2Name) {
        return blocks;
    }
}

/**
 * Formats blocks into records that our Epigenome Browser can understand.
 */
class BrowserHicFormatter extends HicFormatter {
    /**
     * Merges an array of blocks into one array of CoordinateRecord.
     *
     * @override
     * @param {hic.Block[]} blocks - array of HiC blocks
     * @param {string} chr1Name - chromosome name used for construction of all the CoordinateRecords
     * @param {string} [chr2Name] - unused and ignored
     * @return {CoordinateRecord[]} array of CoordinateRecord containing the data in all the blocks
     */
    static formatBlocks(blocks, chr1Name, chr2Name) {
        if (!blocks) {
            return [];
        }

        let blocksAsCoorData = blocks.map(block => this._toCoordinateRecords(block, chr1Name));

        let combinedCoorData = [].concat.apply([], blocksAsCoorData); // Concatenate all the data into one array
        for (let i = 0; i < combinedCoorData.length; i++) { // Make sure ids are unique
            combinedCoorData[i].id = i;
        }
        return combinedCoorData;
    }

    /**
     * Puts the data in a HiC block into an array of CoordinateRecord.  HiC blocks express only a triangular portion of
     * the contact matrix, and this method also adds records corresponding to the other triangular half.
     *
     * @param {hic.Block[]} block - the block to convert
     * @param {string} chromosome - chromosome name used for construction of all the CoordinateRecords
     * @return {CoordinateRecord[]} array of CoordinateRecord containing the data in the block
     */
    static _toCoordinateRecords(block, chromosome) {
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
            // Blocks only contain a triangular portion of the matrix, so for the other triangle, switch bin1 and bin2
            if (record.bin1 != record.bin2) {
                allData.push(new CoordinateRecord(id, chromosome, record.bin2, record.bin1, binSize, record.counts));
                id++;
            }
        }
        return allData;
    }
}

/**
 * base.js reads matrix data in a strange way.  For a specific location, row range and the value at the location are
 * stored combined in a single string, and column range is stored as numbers in two instance variables.  This class
 * makes construction of such strange records easier.
 */
class CoordinateRecord {
    constructor(id, chromosome, bin1, bin2, binSize, value) {
        let coor1Start = bin1 * binSize;
        let coor1Stop = (bin1 + 1) * binSize;
        let coor2Start = bin2 * binSize;
        let coor2Stop = (bin2 + 1) * binSize;
        let roundedCounts = (value != null) ? value.toFixed(CoordinateRecord.DIGITS_TO_ROUND) : 0;

        this.id = id;
        this.name = `${chromosome}:${coor1Start}-${coor1Stop},${roundedCounts}`;
        this.start = coor2Start;
        this.stop = coor2Stop;
        this.strand = (bin1 < bin2) ? "<" : ">";
        this.value = value;
    }
}

CoordinateRecord.DIGITS_TO_ROUND = 3;
