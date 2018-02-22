'use strict';

/**
 * base.js reads matrix data in a strange way.  For a specific location, row range and the value at the location are
 * stored combined in a single string, and column range is stored as numbers in two instance variables.  This class
 * makes construction of such strange records easier.
 * 
 * @author Silas Hsu
 */
class CoordinateRecord {
    /**
     * Constructs a new instance.
     * 
     * @param {any} id - id of the record
     * @param {string} chromosome - chromosome name
     * @param {number} bin1 - row coordinate in the binned matrix
     * @param {number} bin2 - column coordinate in the binned matrix
     * @param {number} binSize - bin size 
     * @param {number} value - value at the matrix location
     */
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
