'use strict';

describe("Unit tests - LongRangeProvider", () => {
    const HIC_TRACK = {
        name: "A HiC track",
        url: "myUrl",
        ft: FT_hi_c,
        mode: 5,
        qtc: { bin_size: scale_auto, norm: "NONE" }
    };

    let mockFetchStrategy = {
        fetchRecords: sinon.stub().resolves([]),
        constructTrackObject: sinon.stub().returnsArg(1),
    };

    let instance;
    beforeEach(function() {
        mockFetchStrategy.fetchRecords.resetHistory();
        mockFetchStrategy.constructTrackObject.resetHistory();
        instance = new LongRangeProvider(mockFetchStrategy);
    });

    describe("getData", function() {
        const REGIONS = [
            makeRegion("chr1", 0, 10000, false),
            makeRegion("chr2", 10000, 50000, false)
        ];
        const LONGEST_REGION_LENGTH = 50000-10000;

        it("returns empty object when the track argument is missing", function() {
            let tests = [
                instance.getData(),
                instance.getData(null, REGIONS)
            ];
            return Promise.all(tests).then(function (results) {
                expect(results[0]).to.deep.equal({});
                expect(results[1]).to.deep.equal({})
            });
        });

        it("still returns track data given no regions", function() {
            return instance.getData(HIC_TRACK, null).then(function (result) {
                expect(result).to.deep.equal(instance._constructDefaultTrackObject(HIC_TRACK, []));
            });
        });

        it("passes each region's information to getRecords", function() {
            instance.getData(HIC_TRACK, REGIONS);
            for (let region of REGIONS) {
                let wrappedRegion = new RegionWrapper(region);
                expect(mockFetchStrategy.fetchRecords).to.have.been.calledWith(
                    wrappedRegion, wrappedRegion, HIC_TRACK.qtc.norm, LONGEST_REGION_LENGTH, null
                );
            }
        });

        it("passes the track and records to the fetch strategy's constructTrackObject", function() {
            const defaultTrackObj = instance._constructDefaultTrackObject(
                HIC_TRACK, new Array(REGIONS.length).fill([])
            );
            return instance.getData(HIC_TRACK, REGIONS).then(function() {
                expect(mockFetchStrategy.constructTrackObject).to.have.been.calledWith(HIC_TRACK, defaultTrackObj);
            });
        });
    });

    describe("_filterRecords", function() {
        const qtc = {
            pfilterscore: 1,
            nfilterscore: -1,
        };
        const RECORDS = [
            {value: -2},
            {value: -1},
            {value: 0},
            {value: 1},
            {value: 2},
        ];
        const FILTERED_RECORDS = [
            {value: -2},
            {value: 2},
        ];

        it('filters out records correctly', function() {
            expect(instance._filterRecords({qtc: qtc}, [RECORDS, RECORDS]))
                .to.deep.equal([FILTERED_RECORDS, FILTERED_RECORDS])
        });
    });

    describe("_constructDefaultTrackObject", function() {
        const BIN_SIZE = 1000;
        const RECORDS = [
            [],
            [new CoordinateRecord("id", "chr", 0, 10, BIN_SIZE, 0.5)]
        ];

        it("automatically gets the bin size from the given records", function() {
            expect(instance._constructDefaultTrackObject(HIC_TRACK, RECORDS).d_binsize).to.equal(BIN_SIZE);
            expect(instance._constructDefaultTrackObject(HIC_TRACK, [ [], [] ]).d_binsize).to.equal(0);
        });

        it("copies record data and certain properties to the result", function() {
            let result = instance._constructDefaultTrackObject(HIC_TRACK, RECORDS);
            expect(result.name).to.equal(HIC_TRACK.name);
            expect(result.ft).to.equal(HIC_TRACK.ft);
            expect(result.mode).to.equal(HIC_TRACK.mode);
            expect(result.bin_size).to.equal(HIC_TRACK.qtc.bin_size);
            expect(result.data).to.deep.equal(RECORDS);
            expect(result[DataProvider.TRACK_PROP_NAME]).to.equal(instance);
        });
    });

});
