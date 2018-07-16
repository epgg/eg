"use strict";

describe("Unit tests - CoolerFetchStrategy", function() {
    /**
     * A way to get an instance without the code complaining about not being able to connect to the backend
     */
    const getInstance = function() {
        let _requestJsonStub = sinon.stub(CoolerFetchStrategy.prototype, "_requestJson");
        _requestJsonStub.returns(Promise.resolve( {binSizes: [], chromosomes: []} ))
        let instance = new CoolerFetchStrategy("myFileName", "myLabel");
        _requestJsonStub.restore();
        return instance;
    }

    describe("constructor", function() {
        it("should request metadata from the right endpoint", function() {
            let _requestJsonStub = sinon.stub(CoolerFetchStrategy.prototype, "_requestJson");
            _requestJsonStub.returns(Promise.resolve( {binSizes: [], chromosomes: []} ))

            let coolerProvider = new CoolerFetchStrategy("My% File", "my label");
            expect(_requestJsonStub).to.have.been.calledWith(CoolerFetchStrategy.METADATA_URL + "fileName=My%25+File");

            _requestJsonStub.restore();
        });
    });

    describe("getRecords", function() {
        const mockMetadataObj = {
            regionLengthToBinSize: sinon.stub(),
            chromosomeLength: function() { return 1; }
        }

        const INSTANCE = getInstance();
        INSTANCE.metadataPromise = Promise.resolve(mockMetadataObj);
        const REGION_1 = makeRegion("chr1", 0, 1);
        const REGION_2 = makeRegion("chr2", 0, 2);

        let _getBlocksStub = null;
        before(function() {
            _getBlocksStub = sinon.stub(CoolerFetchStrategy.prototype, "_getBlocks");
        });

        beforeEach(function() {
            _getBlocksStub.reset();
            mockMetadataObj.regionLengthToBinSize.reset();
            mockMetadataObj.regionLengthToBinSize.returns("Bin size from region length");
        });

        after(function() {
            _getBlocksStub.restore();
        });

        it("uses the target bin size if provided", function() {
            return INSTANCE.fetchRecords(REGION_1, REGION_2, "norm", "regionLength", "binSize")
                .then(function() {
                    expect(mockMetadataObj.regionLengthToBinSize).to.not.have.been.called;
                    expect(_getBlocksStub).to.have.been.calledWith(REGION_1, "binSize", 1);
                });
        });

        it("throws an error if a bin size of 0 is requested", function() {
            expect(function() {
                INSTANCE.fetchRecords(REGION_1, REGION_2, "norm", "regionLength", 0);
            }).to.throw();
        });

        it("uses region length parameter to calculate zoom index if it exists", function() {
            return INSTANCE.fetchRecords(REGION_1, REGION_2, "norm", "regionLength", null)
                .then(function() {
                    expect(mockMetadataObj.regionLengthToBinSize).to.have.been.calledWith("regionLength");
                    expect(_getBlocksStub).to.have.been.calledWith(REGION_1, "Bin size from region length", 1);
                });
        });

        it("uses the longest region to calculate zoom index if there are no overrides", function() {
            return INSTANCE.fetchRecords(REGION_1, REGION_2, "norm", null, null)
                .then(function() {
                    // Longest region is chr2: 0-2
                    expect(mockMetadataObj.regionLengthToBinSize).to.have.been.calledWith(2);
                    expect(_getBlocksStub).to.have.been.calledWith(REGION_1, "Bin size from region length", 1);
                });
        });
    });

    describe("constructTrackObject", function() {
        it("sets certain props of the template", function() {
            expect(getInstance().constructTrackObject({}, {})).to.deep.equal({url: "myFileName", norm: "NONE"});
        });
    });

    describe("_requestJson", function() {
        let fakeServer = null;

        before(function() {
            fakeServer = sinon.fakeServer.create({respondImmediately: true});
        });

        after(function() {
            fakeServer.restore(); // Needed since fakeServer replaces the native XMLHttpRequest
        });

        it("should parse JSON on a HTTP 200 OK", function() {
            let response = {prop: 0};
            fakeServer.respondWith(JSON.stringify(response));
            return getInstance()._requestJson("myUrl").then(function(obj) {
                expect(obj).to.deep.equal(response);
            });
        });

        const expectRejectedPromise = function() {
            let promiseRejected = false;
            return getInstance()._requestJson("myUrl")
                .catch(function(err) {
                    promiseRejected = true;
                })
                .then(function() {
                    expect(promiseRejected, "promise should have been rejected").to.be.true;
                });
        };

        it("should return a rejected promise on HTTP 400-level errors", function() {
            fakeServer.respondWith([404, {}, "{}"]);
            return expectRejectedPromise();
        });

        it("should return a rejected promise on HTTP 500-level errors", function() {
            fakeServer.respondWith([500, {}, "{}"]);
            return expectRejectedPromise();
        });

        it("should return a rejected promise on network failure", function() {
            fakeServer.respondWith(requestObj => requestObj.error());
            return expectRejectedPromise();
        })
    });

    describe("_getBlocks", function() {
        const INSTANCE = getInstance();
        const oldBinsPerBlock = CoolerFetchStrategy.BINS_PER_BLOCK;
        let _requestJsonStub = null;

        before(function() {
            _requestJsonStub = sinon.stub(CoolerFetchStrategy.prototype, "_requestJson")
                .callsFake(url => Promise.resolve(url));
            CoolerFetchStrategy.BINS_PER_BLOCK = 10;
        });

        after(function() {
            _requestJsonStub.restore();
            CoolerFetchStrategy.BINS_PER_BLOCK = oldBinsPerBlock;
        });

        it("requests to the right URL", function() {
            return INSTANCE._getBlocks(makeRegion("chr1", 0, 9), 1, 100).then(function(urls) {
                expect(urls[0]).to.equal("/cgi-bin/cooler/dump.py?fileName=myFileName&chromosomeX=chr1&startBaseX=0" +
                    "&endBaseX=9&chromosomeY=chr1&startBaseY=0&endBaseY=9&binSize=1");
            });
        });
    });

    describe("_convertBlockToCoordinateRecords", function() {
        it("constructs the array of CoordinateRecord properly", function() {
            const BLOCK = {
                records: [
                    [1, 2],
                    [3, 4]
                ],
                binSize: 10,
                startBaseX: 100,
                startBaseY: 100,
            };
            const CHR = "chr"
            const EXPECTED = [
                new CoordinateRecord(0, CHR, 10, 10, 10, 1),
                new CoordinateRecord(1, CHR, 10, 11, 10, 2),
                new CoordinateRecord(2, CHR, 11, 10, 10, 3),
                new CoordinateRecord(3, CHR, 11, 11, 10, 4)
            ];

            expect(getInstance()._convertBlockToCoordinateRecords(BLOCK, CHR)).to.deep.equal(EXPECTED);
        });
    });

});

describe("Integration test (LongRangeProvider + RequestSplitter + CoolerFetchStrategy)", function() {
    // It would be nice to test the backend too, but it's too much of a pain to set up...
    let fakeServer = null;

    const FILE_NAME = "myFile";
    // Both regions base pair 1-299
    const REGION_LST = [["chr1",0,141213431,1,299,192,""],["chr2",0,135534747,1,299,2790,""]];
    const METADATA_BLOB = {
        binSizes: [1, 10],
        chromosomes: [
            {name: "chr1", numBasePairs: 99},
            {name: "chr2", numBasePairs: 300}
        ]
    };
    // chr1:1-299, chr2:1-299
    // Taking into account numBasePairs and CoolerFetchStrategy.BINS_PER_BLOCK = 400, 1 block for chr1 and 1 block for chr2
    const makeDataBlob = function(startBaseX, startBaseY) {
        return {
            binSize: 1,
            startBaseX: startBaseX,
            startBaseY: startBaseY,
            records: [[1]]
        };
    };

    const EXPECTED = {
        data: [
            [
                new CoordinateRecord(0, "chr1", 0, 0, 1, 1)
            ],
            [
                new CoordinateRecord(0, "chr2", 0, 0, 1, 1),
            ]
        ],
        "label":"myLabel","name":"35616758416129213","ft":34,"mode":4,bin_size:0,d_binsize:1,norm:"NONE",
        matrix:"observed",url:"myFile"
    }

    it("works", function() {
        let fakeServer = sinon.fakeServer.create({respondImmediately: true});
        fakeServer.respondWith(new RegExp(CoolerFetchStrategy.METADATA_URL), JSON.stringify(METADATA_BLOB));
        fakeServer.respondWith(new RegExp(CoolerFetchStrategy.DATA_URL), function(requestObj) {
            let paramStartBaseX = requestObj.url.match(/startBaseX=\d+/)[0];
            let paramStartBaseY = requestObj.url.match(/startBaseY=\d+/)[0];
            let startBaseX = parseInt(paramStartBaseX.split("=")[1]);
            let startBaseY = parseInt(paramStartBaseY.split("=")[1]);
            requestObj.respond(200, {}, JSON.stringify(makeDataBlob(startBaseX, startBaseY)));
        });

        let dataProvider = new LongRangeProvider(new CoolerFetchStrategy(FILE_NAME, coolerTestData.track.label));
        return dataProvider.getData(coolerTestData.track, REGION_LST).then(function(result) {
            expect(fakeServer.requests).to.have.lengthOf(3); // One metadata request, two block requests

            expect(result[DataProvider.TRACK_PROP_NAME]).to.be.an.instanceof(DataProvider);
            delete result[DataProvider.TRACK_PROP_NAME];

            expect(result).to.deep.equal(EXPECTED);
            fakeServer.restore(); // Needed since fakeServer replaces the native XMLHttpRequest
        });
    });
});
