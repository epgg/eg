class HicFormatter {
    static formatBlocks(blocks, chr1Name, chr2Name) {
        return blocks;
    }
}

class BrowserHicFormatter extends HicFormatter {
    /**
     * Merges an array of blocks into one array of CoordinateRecord.
     *
     * @param {hic.Block[]} blocks - array of HiC blocks
     * @param {string} chromosome - chromosome name used for construction of all the CoordinateRecords
     * @return {CoordinateRecord[]} array of CoordinateRecord containing the data in all the blocks
     */
    static formatBlocks(blocks, chr1Name, chr2Name) {
        if (!blocks) {
            return [];
        }

        let blocksAsCoorData = blocks.map(block => BrowserHicFormatter._toCoordinateRecords(block, chr1Name));

        let combinedCoorData = [].concat.apply([], blocksAsCoorData); // Concatenate all the data into one array
        for (let i = 0; i < combinedCoorData.length; i++) { // Make sure ids are unique
            combinedCoorData[i].id = i;
        }
        return combinedCoorData;
    }

    /**
     * Puts the data in a HiC block in an array of CoordinateRecord.
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
            allData.push(new CoordinateRecord(id, chromosome, record.bin2, record.bin1, binSize, record.counts));
            id++;
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
    constructor(id, chromosome, bin1, bin2, binSize, counts) {
        let coor1Start = bin1 * binSize;
        let coor1Stop = (bin1 + 1) * binSize;
        let coor2Start = bin2 * binSize;
        let coor2Stop = (bin2 + 1) * binSize;
        let roundedCounts = (counts != null) ? counts.toFixed(CoordinateRecord.DIGITS_TO_ROUND) : 0;

        this.id = id;
        this.name = `${chromosome}:${coor1Start}-${coor1Stop},${roundedCounts}`;
        this.start = coor2Start;
        this.stop = coor2Stop;
        this.strand = (bin1 < bin2) ? "<" : ">";
    }
}

CoordinateRecord.DIGITS_TO_ROUND = 3;
