"use strict";
/**
 * Tests for HicFetchStrategy and the HiC integration test.
 * 
 * @author Silas Hsu
 */

describe("Unit tests - HicFetchStrategy", function() {
    /////////////////
    // Test inputs //
    /////////////////
    const HIC_TRACK = {
        name: "A HiC track",
        url: "myUrl",
        ft: FT_hi_c,
        mode: 5,
        qtc: { bin_size: scale_auto, norm: "NONE" }
    };

    ///////////
    // Mocks //
    ///////////
    let mockDatasetStubs = sinon.sandbox.create();
    let mockDataset = {
        binsizeToZoomIndex: mockDatasetStubs.stub(),
        regionLengthToZoomIndex: mockDatasetStubs.stub(),
        findChromosomeIndex: mockDatasetStubs.stub(),
        getNormalizedBlock: mockDatasetStubs.stub(),
        getMatrix: mockDatasetStubs.stub(),
        bpResolutions: [],
        reset: function() { mockDatasetStubs.reset(); this.bpResolutions = []; }
    };
    const MOCK_HIC_READER = {
        loadDataset: function() { return Promise.resolve(mockDataset); },
        readNormExpectedValuesAndNormVectorIndex: function(dataset) {}
    }

    var instance;
    beforeEach(function() {
        mockDataset.reset();
        instance = new HicFetchStrategy(MOCK_HIC_READER, "");
    });

    ///////////////////////////////
    // Finally - the test specs! //
    ///////////////////////////////
    describe("fetchRecords", function() {
        const REGION_1 = makeRegion("chr1", 0, 1);
        const REGION_2 = makeRegion("chr2", 0, 2);

        beforeEach(function () {
            mockDataset.getMatrix.resolves(null);
        });

        it("uses the target bin size parameter to calculate zoom index if it exists", function() {
            return instance.fetchRecords(REGION_1, REGION_2, "norm", "regionLength", "binSize")
                .then(function() {
                    expect(mockDataset.binsizeToZoomIndex).to.have.been.calledWith("binSize");
                    expect(mockDataset.regionLengthToZoomIndex).to.not.have.been.called;
                });
        });

        it("uses region length parameter to calculate zoom index if it exists", function() {
            return instance.fetchRecords(REGION_1, REGION_2, "norm", "regionLength", null)
                .then(function() {
                    expect(mockDataset.regionLengthToZoomIndex).to.have.been.calledWith("regionLength");
                    expect(mockDataset.binsizeToZoomIndex).to.not.have.been.called;
                });
        });

        it("uses the longest region to calculate zoom index if there are no overrides", function() {
            return instance.fetchRecords(REGION_1, REGION_2, "norm", null, null)
                .then(function() {
                    // Longest region is chr2: 0-2
                    expect(mockDataset.regionLengthToZoomIndex).to.have.been.calledWith(2);
                    expect(mockDataset.binsizeToZoomIndex).to.not.have.been.called;
                });
        });
    });

    describe('constructTrackObject', function() {
        it('copies props of the template', function() {
            expect(instance.constructTrackObject({qtc: {}}, {prop: 1}).prop).to.equal(1);
        });
    });

    describe("_toBinCoordinates", function() {
        const ZOOM_INDEX = 0;
        const REGION_1 = makeRegion("chr1", 1, 2);
        const REGION_2 = makeRegion("chr2", 3, 4);

        beforeEach(function() {
            mockDataset.reset();
        });

        it("throws an error if it couldn't find chromosome indices", function() {
            mockDataset.findChromosomeIndex.returns(-1);
            expect(() => instance._toBinCoordinates(mockDataset, REGION_1, REGION_2, ZOOM_INDEX)).to.throw();
        });

        it("calculates bins correctly", function() {
            mockDataset.bpResolutions[ZOOM_INDEX] = 1; // Bin size
            let result = instance._toBinCoordinates(mockDataset, REGION_1, REGION_2, ZOOM_INDEX);
            expect(result.xBin).to.equal(1);
            expect(result.yBin).to.equal(3);
            expect(result.widthInBins).to.equal(1);
            expect(result.heightInBins).to.equal(1);
        });

        it("copies certain properties to the result", function() {
            mockDataset.findChromosomeIndex.returns(0);
            let result = instance._toBinCoordinates(mockDataset, REGION_1, REGION_2, ZOOM_INDEX);
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
            return instance._getBlocks(mockDataset, BIN_COORS, null).then(function (blocks) {
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

            return instance._getBlocks(mockDataset, BIN_COORS, null).then(function (blocks) {
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
            expect(instance._calculateBlockNumber(ZOOM_DATA, 1, 2)).to.equal(4);
        });

        it("returns the same number when row and column are switched and chromosome is the same", function() {
            const ZOOM_DATA = {
                chr1: 0,
                chr2: 0,
                blockColumnCount: 2,
            }
            let block1 = instance._calculateBlockNumber(ZOOM_DATA, 1, 2);
            let block2 = instance._calculateBlockNumber(ZOOM_DATA, 2, 1);
            expect(block1).to.equal(block2);
        });
    });

    describe("_formatBlocks", function() {
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

        it("returns empty array if passed null/undefined", function() {
            expect(instance._formatBlocks(null, null)).to.deep.equal([]);
            expect(instance._formatBlocks(undefined, undefined)).to.deep.equal([]);
        });

        it("merges blocks into one array, and infers the other half of the triangular matrix", function() {
            expect(instance._formatBlocks(BLOCKS, "chr")).to.have.lengthOf(8);
        });

        it("does not error if some blocks are null", function() {
            expect(instance._formatBlocks([null, null], "chr")).to.be.empty;
        });

        it("gives each record a unique ID", function() {
            let result = instance._formatBlocks(BLOCKS, "chr");
            let seenIds = {}
            for (let record of result) {
                expect(seenIds[record.id]).to.not.equal(record);
                seenIds[record.id] = record;
            }
        });
    });
}); // End describe("Unit tests - HicFetchStrategy", function() {...})

describe("Integration test (LongRangeProvider + HicFetchStrategy + Juicebox; does NOT include base.js)", function() {
    it("properly retrieves real data from chr9, chr10, and chr11 at a bin size of 2.5MB", function() {
        this.timeout(10000);
        const track = HicIntegrationTestData.inputHicTrack;
        const expected = HicIntegrationTestData.expectedOutput;

        let fetchStrategy = new HicFetchStrategy(hic.HiCReader.fromUrl(track.url), track.label);
        let dataProvider = new LongRangeProvider(fetchStrategy);
        return dataProvider.getData(track, HicIntegrationTestData.inputRegionLst).then(function(result) {
            /*
             * expectedTrack does not have an instance of HicProvider, because including it would also include a LOT of
             * of Juicebox internal data.  We still expect testTrack to have the property, but then delete it before
             * doing a comparsion.
             */
            expect(result[DataProvider.TRACK_PROP_NAME]).to.be.an.instanceof(DataProvider);
            delete result[DataProvider.TRACK_PROP_NAME];
            window.result = result;
            window.expected = expected;
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
