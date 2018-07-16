"use strict";

describe("Unit tests - custom additions to Juicebox.js' Dataset", function() {
    const BIN_SIZES = [100, 10, 1];
    const SMALLEST_BIN_INDEX = BIN_SIZES.length - 1;
    const LARGEST_BIN_INDEX = 0;

    let instance;
    beforeEach(function () {
        instance = new hic.Dataset({path: null});
    });

    describe("findChromosomeIndex", function() {
        const CHROMOSOMES = [
            {name: "1", index: 0},
            {name: "2", index: 1},
            {name: "MT", index: 2}
        ];
        beforeEach(function() {
            instance.chromosomes = CHROMOSOMES;
        });

        it("finds the right indices when given an exactly matching name", function() {
            expect(instance.findChromosomeIndex("1")).to.equal(0);
            expect(instance.findChromosomeIndex("2")).to.equal(1);
            expect(instance.findChromosomeIndex("MT")).to.equal(2);
        });

        it("interprets inputs to some extent", function() {
            expect(instance.findChromosomeIndex("chr1")).to.equal(0);
            expect(instance.findChromosomeIndex("chr2")).to.equal(1);
            expect(instance.findChromosomeIndex("chrM")).to.equal(2);
        });

        it("returns -1 if not found", function() {
            expect(instance.findChromosomeIndex("invalid name")).to.equal(-1);
            expect(instance.findChromosomeIndex("")).to.equal(-1);
            expect(instance.findChromosomeIndex(null)).to.equal(-1);
            expect(instance.findChromosomeIndex(undefined)).to.equal(-1);
        });
    });

    describe("regionLengthToZoomIndex", function() {
        beforeEach(function() {
            instance.bpResolutions = BIN_SIZES;
        });

        it("returns the right index", function() {
            const INDEX = 1;
            let exactlyFits = hic.Dataset.MIN_BINS_PER_REGION * BIN_SIZES[INDEX];
            let aLittleBigger = (hic.Dataset.MIN_BINS_PER_REGION + 1) * BIN_SIZES[INDEX];
            let aLittleSmaller = (hic.Dataset.MIN_BINS_PER_REGION - 1) * BIN_SIZES[INDEX];
            // "At least" doesn't include equality, so exactlyFits should equal the next smallest bin size.
            expect(instance.regionLengthToZoomIndex(exactlyFits)).to.equal(INDEX + 1);
            expect(instance.regionLengthToZoomIndex(aLittleBigger)).to.equal(INDEX);
            expect(instance.regionLengthToZoomIndex(aLittleSmaller)).to.equal(INDEX + 1);
        });

        it("returns the index of the smallest bin size when given 0, negative, or invalid input", function() {
            expect(instance.regionLengthToZoomIndex(0)).to.equal(SMALLEST_BIN_INDEX);
            expect(instance.regionLengthToZoomIndex(-1)).to.equal(SMALLEST_BIN_INDEX);
            expect(instance.regionLengthToZoomIndex(null)).to.equal(SMALLEST_BIN_INDEX);
            expect(instance.regionLengthToZoomIndex(undefined)).to.equal(SMALLEST_BIN_INDEX);
        });
    });

    describe("binsizeToZoomIndex", function() {
        beforeEach(function() {
            instance.bpResolutions = BIN_SIZES;
        });

        it("returns the right index", function() {
            let INDEX = 1;
            let exactlyFits = BIN_SIZES[INDEX];
            let aLittleBigger = exactlyFits + 1;
            let aLittleSmaller = exactlyFits - 1;
            expect(instance.binsizeToZoomIndex(exactlyFits)).to.equal(INDEX);
            expect(instance.binsizeToZoomIndex(aLittleBigger)).to.equal(INDEX - 1);
            expect(instance.binsizeToZoomIndex(aLittleSmaller)).to.equal(INDEX);
        });

        it("returns the index of the smallest bin size when given 0 or negative input", function() {
            expect(instance.binsizeToZoomIndex(0)).to.equal(SMALLEST_BIN_INDEX);
            expect(instance.binsizeToZoomIndex(-1)).to.equal(SMALLEST_BIN_INDEX);
        });

        it("returns the index of the largest bin size when given very large or invalid input", function() {
            let veryLarge = BIN_SIZES[0] * 100;
            expect(instance.binsizeToZoomIndex(veryLarge)).to.equal(LARGEST_BIN_INDEX);
            expect(instance.binsizeToZoomIndex(null)).to.equal(LARGEST_BIN_INDEX);
            expect(instance.binsizeToZoomIndex(undefined)).to.equal(LARGEST_BIN_INDEX);
        });
    });
});
