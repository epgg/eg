/**
 * Test specs for HicProvider, HicFormatter, and custom additions to Juicebox.js.
 *
 * @author Silas Hsu
 */
"use strict"

/**
 * In the browser, print2console prints to a little window, but we won't have that during our tests.  Instead, print to
 * the browser console.
 */
print2console = function(message, level) {
    console.log(`(print2console level ${level}): ${message}`);
}

describe("Unit tests - HicProvider", function() {
    const makeRegion = function(chromosome, startBasePair, endBasePair) {
        let region = [];
        region[RegionWrapper.CHROMOSOME_INDEX] = chromosome;
        region[RegionWrapper.START_BASE_PAIR_INDEX] = startBasePair;
        region[RegionWrapper.END_BASE_PAIR_INDEX] = endBasePair;
        return region;
    }
    /////////////////
    // Test inputs //
    /////////////////
    const REGIONS = [
        makeRegion("chr1", 0, 10000),
        makeRegion("chr2", 10000, 50000)
    ];
    const LONGEST_REGION_LENGTH = 50000-10000;

    const HIC_TRACK = {
        name: "A HiC track",
        url: "myUrl",
        ft: FT_hi_c,
        mode: 5,
        qtc: { bin_size: scale_auto, norm: "NONE" }
    };

    //////////////////////////////////
    // Mocks to give to HicProvider //
    //////////////////////////////////
    const mockDatasetStubs = sinon.sandbox.create();
    const mockDataset = {
        binsizeToZoomIndex: mockDatasetStubs.stub(),
        regionLengthToZoomIndex: mockDatasetStubs.stub(),
        findChromosomeIndex: mockDatasetStubs.stub(),
        getNormalizedBlock: mockDatasetStubs.stub(),
        getMatrix: mockDatasetStubs.stub(),
        bpResolutions: [],
        reset: function() { mockDatasetStubs.reset(); this.bpResolutions = []; }
    };
    const MOCK_HIC_READER = {
        loadDataset: function() { return Promise.resolve(mockDataset); }
    }

    const getHicProviderInstance = function() {
        return new HicProvider(MOCK_HIC_READER, BrowserHicFormatter);
    }

    ///////////////////////////////
    // Finally - the test specs! //
    ///////////////////////////////
    describe("getData", function() {
        const INSTANCE = getHicProviderInstance();
        let stubs = null;
        let getRecordsStub = null;
        let _constructTrackDataStub = null;

        before(function() {
            stubs = sinon.sandbox.create();
            getRecordsStub = stubs.stub(HicProvider.prototype, "getRecords");
            _constructTrackDataStub = stubs.stub(HicProvider.prototype, "_constructTrackData")
            stubs.stub(hic.HiCReader, "fromUrl").returns(MOCK_HIC_READER);
        });

        beforeEach(function() {
            stubs.reset();
        });

        after(function() {
            stubs.restore();
        });

        it("returns empty object when the track argument is missing", function() {
            let tests = [
                INSTANCE.getData(),
                INSTANCE.getData(null, REGIONS)
            ]
            return Promise.all(tests).then(function (results) {
                expect(results[0]).to.deep.equal({});
                expect(results[1]).to.deep.equal({})
            });
        });

        it("still passes the track to _constructTrackData given no regions", function() {
            return INSTANCE.getData(HIC_TRACK, null).then(function () {
                expect(_constructTrackDataStub).to.have.been.calledWith(HIC_TRACK, []);
            });
        });

        it("passes each region's information to getRecords", function() {
            INSTANCE.getData(HIC_TRACK, REGIONS);
            for (let region of REGIONS) {
                let wrapper = new RegionWrapper(region);
                let chromosome = wrapper.chromosome;
                let startBasePair = wrapper.startBasePair;
                let endBasePair = wrapper.endBasePair;
                expect(getRecordsStub).to.have.been.calledWith(chromosome, startBasePair, endBasePair, chromosome,
                    startBasePair, endBasePair, HIC_TRACK.qtc.norm, LONGEST_REGION_LENGTH, null);
            }
        });

        it("passes the HiC track and retrieved records to _constructTrackData", function() {
            const RECORDS = [];
            getRecordsStub.returns(RECORDS);

            let recordsForEachRegion = Array(REGIONS.length).fill(RECORDS);
            return INSTANCE.getData(HIC_TRACK, REGIONS).then(function() {
                expect(_constructTrackDataStub).to.have.been.calledWith(HIC_TRACK, recordsForEachRegion);
            });
        });
    });

    describe("_constructTrackData", function() {
        const BIN_SIZE = 1000;
        const RECORDS = [
            [],
            [new CoordinateRecord("id", "chr", 0, 10, BIN_SIZE, 0.5)]
        ];
        const INSTANCE = getHicProviderInstance();

        it("automatically gets the bin size from the given records", function() {
            expect(INSTANCE._constructTrackData(HIC_TRACK, RECORDS).d_binsize).to.equal(BIN_SIZE);
            expect(INSTANCE._constructTrackData(HIC_TRACK, [[],[]]).d_binsize).to.equal(0);
        });

        it("copies record data and certain properties to the result", function() {
            let result = INSTANCE._constructTrackData(HIC_TRACK, RECORDS);
            expect(result.name).to.equal(HIC_TRACK.name);
            expect(result.ft).to.equal(HIC_TRACK.ft);
            expect(result.mode).to.equal(HIC_TRACK.mode);
            expect(result.bin_size).to.equal(HIC_TRACK.qtc.bin_size);
            expect(result.data).to.equal(RECORDS);
            expect(result[HicProvider.TRACK_PROP_NAME]).to.equal(INSTANCE);
        });
    });

    describe("getRecords", function() {
        const INSTANCE = getHicProviderInstance();

        let getBlocksStub = null;
        before(function() {
            getBlocksStub = sinon.stub(HicProvider, "_getBlocks");
        });

        beforeEach(function() {
            getBlocksStub.resolves([]);
            mockDataset.reset();
        });

        after(function() {
            getBlocksStub.restore();
        });

        it("uses the target bin size parameter to calculate zoom index if it exists", function() {
            return INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", "regionLength", "binSize")
                .then(function() {
                    expect(mockDataset.binsizeToZoomIndex).to.have.been.calledWith("binSize");
                    expect(mockDataset.regionLengthToZoomIndex).to.not.have.been.called;
                });
        });

        it("uses region length parameter to calculate zoom index if it exists", function() {
            return INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", "regionLength", null)
                .then(function() {
                    expect(mockDataset.regionLengthToZoomIndex).to.have.been.calledWith("regionLength");
                    expect(mockDataset.binsizeToZoomIndex).to.not.have.been.called;
                });
        });

        it("uses the longest region to calculate zoom index if there are no overrides", function() {
            return INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", null, null)
                .then(function() {
                    // Longest region is chr2: 0-2
                    expect(mockDataset.regionLengthToZoomIndex).to.have.been.calledWith(2);
                    expect(mockDataset.binsizeToZoomIndex).to.not.have.been.called;
                });
        });

        it("resolves with empty array if there is a problem", function() {
            getBlocksStub.rejects(new Error("This error should be caught"));
            return INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", null, null)
                .then(function(result) {
                    expect(result).to.deep.equal([]);
                });
        });
    });

    describe("_toBinCoordinates", function() {
        const ZOOM_INDEX = 0;

        beforeEach(function() {
            mockDataset.reset();
        });

        it("throws an error if it couldn't find chromosome indices", function() {
            mockDataset.findChromosomeIndex.returns(-1);
            expect(() => HicProvider._toBinCoordinates(mockDataset, "chr1", 1, 2, "chr2", 3, 4, ZOOM_INDEX)).to.throw();
        });

        it("calculates bins correctly", function() {
            mockDataset.bpResolutions[ZOOM_INDEX] = 1; // Bin size
            let result = HicProvider._toBinCoordinates(mockDataset, "chr1", 1, 2, "chr2", 3, 4, ZOOM_INDEX);
            expect(result.xBin).to.equal(1);
            expect(result.yBin).to.equal(3);
            expect(result.widthInBins).to.equal(1);
            expect(result.heightInBins).to.equal(1);
        });

        it("copies certain properties to the result", function() {
            mockDataset.findChromosomeIndex.returns(0);
            let result = HicProvider._toBinCoordinates(mockDataset, "chr1", 1, 2, "chr2", 3, 4, ZOOM_INDEX);
            expect(result.chr1).to.equal(0);
            expect(result.chr2).to.equal(0);
            expect(result.zoomIndex).to.equal(ZOOM_INDEX);
        });
    });

    describe("_getBlocks", function() {
        const ZOOM_INDEX = 0;
        const BIN_COORS = {
            xBin: 0,
            yBin: 0,
            widthInBins: 2,
            heightInBins: 2,
            chr1: 0,
            chr2: 0,
            zoomIndex: ZOOM_INDEX
        }

        it("returns empty array if there is no contact matrix for the chromosomes", function() {
            mockDataset.getMatrix.resolves(null);
            return HicProvider._getBlocks(mockDataset, BIN_COORS, null).then(function (blocks) {
                expect(blocks).to.deep.equal([]);
            });
        });

        it("queries the right number of blocks", function() {
            let mockMatrix = {
                bpZoomData: []
            }
            mockMatrix.bpZoomData[ZOOM_INDEX] = {
                blockBinCount: 1
            }
            mockDataset.getMatrix.resolves(mockMatrix);

            return HicProvider._getBlocks(mockDataset, BIN_COORS, null).then(function (blocks) {
                expect(blocks).to.have.lengthOf(9);
            });
        });
    });

    describe("_calculateBlockNumber", function() {
        it("calculates the right number", function() {
            const ZOOM_DATA = {
                chr1: 0,
                chr2: 1,
                blockColumnCount: 2
            }
            expect(HicProvider._calculateBlockNumber(ZOOM_DATA, 1, 2)).to.equal(4);
        });

        it("returns the same number when row and column are switched and chromosome is the same", function() {
            const ZOOM_DATA = {
                chr1: 0,
                chr2: 0,
                blockColumnCount: 2,
            }
            let block1 = HicProvider._calculateBlockNumber(ZOOM_DATA, 1, 2);
            let block2 = HicProvider._calculateBlockNumber(ZOOM_DATA, 2, 1);
            expect(block1).to.equal(block2);
        });
    });
}); // End describe("Unit tests - HicProvider", function() {...})

describe("Unit tests - BrowserHicFormatter", function() {
    const ZOOM_DATA = {zoom: {binSize: 1}};
    const BLOCKS = [
        new hic.Block(null, ZOOM_DATA, [
            new hic.ContactRecord(0, 0, 0),
            new hic.ContactRecord(0, 1, 0), // Missing (1, 0) since it's the other triangle of the matrix
            new hic.ContactRecord(1, 1, 0)
        ]),
        new hic.Block(null, ZOOM_DATA, [
            new hic.ContactRecord(0, 0, 0),
            new hic.ContactRecord(1, 0, 0), // Ditto, except for (0, 1)
            new hic.ContactRecord(1, 1, 0)
        ]),
    ];

    describe("formatBlocks", function() {
        it("returns empty array if passed null/undefined", function() {
            expect(BrowserHicFormatter.formatBlocks(null, null)).to.deep.equal([]);
            expect(BrowserHicFormatter.formatBlocks(undefined, undefined)).to.deep.equal([]);
        });

        it("merges blocks into one array, and infers the other half of the triangular matrix", function() {
            expect(BrowserHicFormatter.formatBlocks(BLOCKS, "chr")).to.have.lengthOf(8);
        });

        it("does not error if some blocks are null", function() {
            expect(BrowserHicFormatter.formatBlocks([null, null], "chr")).to.be.empty;
        });

        it("gives each record a unique ID", function() {
            let result = BrowserHicFormatter.formatBlocks(BLOCKS, "chr");
            let seenIds = {}
            for (let record of result) {
                expect(seenIds[record.id]).to.not.equal(record);
                seenIds[record.id] = record;
            }
        });
    });

    describe("_toCoordinateRecords", function() {
        it("was tested indirectly by formatBlocks", function() {

        });
    });

    describe("CoordinateRecord constructor", function() {
        it("constructs correctly (except strand)", function() {
            let record = new CoordinateRecord(0, "chr1", 0, 1, 2, 3);
            expect(record.id).to.equal(0);
            expect(record.name).to.equal("chr1:0-2,3.000");
            expect(record.start).to.equal(2);
            expect(record.stop).to.equal(4);
        });

        it("sets strand correctly", function() {
            expect(new CoordinateRecord(null, null, 0, 1, null, null).strand).to.equal("<");
            expect(new CoordinateRecord(null, null, 1, 0, null, null).strand).to.equal(">");
        });
    });
}); // End describe("Unit tests - BrowserHicFormatter", function() {...})

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

describe("Integration test (HicProvider + HicFormatter + Juicebox; does NOT include base.js)", function() {
    it("properly retrieves real data from chr9, chr10, and chr11 at a bin size of 2.5MB", function() {
        this.timeout(10000);
        let track = HicIntegrationTestData.inputHicTrack;
        let instance = new HicProvider(hic.HiCReader.fromUrl(track.url), BrowserHicFormatter);
        let expected = HicIntegrationTestData.expectedOutput;
        return instance.getData(track, HicIntegrationTestData.inputRegionLst).then(function(result) {
            /*
             * expectedTrack does not have an instance of HicProvider, because including it would also include a LOT of
             * of Juicebox internal data.  We still expect testTrack to have the property, but then delete it before
             * doing a comparsion.
             */
            expect(result[DataProvider.TRACK_PROP_NAME]).to.be.an.instanceof(HicProvider);
            delete result[DataProvider.TRACK_PROP_NAME];

            // Added these lines because one time, a bug resulted in a really small bin size and got TONS of records,
            // more than the browser could handle.
            expect(result.data).to.have.lengthOf(expected.data.length);
            for (let i = 0; i < result.data.length; i++) {
                expect(result.data[i]).to.have.lengthOf(expected.data[i].length);
            }

            expect(result).to.deep.equal(expected);
        });
    });

});
