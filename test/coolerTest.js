/**
 * Test specs for coolerProvider.js
 *
 * @author Silas Hsu
 */
 "use strict"

describe("Unit tests - CoolerProvider", function() {

    /**
     * A way to get an instance without the code complaining about not being able to connect to the backend
     */
    const getInstance = function() {
        let _requestJsonStub = sinon.stub(CoolerProvider, "_requestJson");
        _requestJsonStub.returns(Promise.resolve( {binSizes: [], chromosomes: []} ))
        let instance = new CoolerProvider("", CoolerFormatter);
        _requestJsonStub.restore();
        return instance
    }

    describe("constructor", function() {
        it("should request metadata from the right endpoint", function() {
            let _requestJsonStub = sinon.stub(CoolerProvider, "_requestJson");
            _requestJsonStub.returns(Promise.resolve( {binSizes: [], chromosomes: []} ))

            let coolerProvider = new CoolerProvider("My% File", CoolerFormatter);
            expect(_requestJsonStub).to.have.been.calledWith(CoolerProvider.METADATA_URL + "fileName=My%25+File");

            _requestJsonStub.restore();
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
            return CoolerProvider._requestJson("myUrl").then(function(obj) {
                expect(obj).to.deep.equal(response);
            });
        });

        const expectRejectedPromise = function() {
            let promiseRejected = false;
            return CoolerProvider._requestJson("myUrl")
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

    describe("getRecords", function() {
        const mockMetadataObj = {
            regionLengthToBinSize: sinon.stub(),
            chromosomeLength: function() { return 1; }
        }

        const INSTANCE = getInstance();
        INSTANCE.metadataPromise = Promise.resolve(mockMetadataObj);

        let _getBlocks2Stub = null;
        before(function() {
            _getBlocks2Stub = sinon.stub(CoolerProvider.prototype, "_getBlocks2");
        });

        beforeEach(function() {
            _getBlocks2Stub.reset();
            mockMetadataObj.regionLengthToBinSize.reset();
            mockMetadataObj.regionLengthToBinSize.returns("Bin size from region length");
        });

        after(function() {
            _getBlocks2Stub.restore();
        });

        it("uses the target bin size if provided", function() {
            return INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", "regionLength", "binSize")
                .then(function() {
                    expect(mockMetadataObj.regionLengthToBinSize).to.not.have.been.called;
                    expect(_getBlocks2Stub).to.have.been.calledWith("chr1", 0, 1, "binSize", 1);
                });
        });

        it("throws an error if a bin size of 0 is requested", function() {
            expect(function() {
                INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", "regionLength", 0);
            }).to.throw();
        });

        it("uses region length parameter to calculate zoom index if it exists", function() {
            return INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", "regionLength", null)
                .then(function() {
                    expect(mockMetadataObj.regionLengthToBinSize).to.have.been.calledWith("regionLength");
                    expect(_getBlocks2Stub).to.have.been.calledWith("chr1", 0, 1, "Bin size from region length", 1);
                });
        });

        it("uses the longest region to calculate zoom index if there are no overrides", function() {
            return INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", null, null)
                .then(function() {
                    // Longest region is chr2: 0-2
                    expect(mockMetadataObj.regionLengthToBinSize).to.have.been.calledWith(2);
                    expect(_getBlocks2Stub).to.have.been.calledWith("chr1", 0, 1, "Bin size from region length", 1);
                });
        });

        it("resolves with empty array if there is a problem", function() {
            _getBlocks2Stub.rejects(new Error("This error should be caught"));
            return INSTANCE.getRecords("chr1", 0, 1, "chr2", 0, 2, "norm", null, null)
                .then(function(result) {
                    expect(result).to.deep.equal([]);
                });
        });
    });

    describe("_getBlocks2", function() {
        const INSTANCE = getInstance();
        const oldBinsPerBlock = CoolerProvider.BINS_PER_BLOCK;
        let _requestJsonStub = null;

        before(function() {
            _requestJsonStub = sinon.stub(CoolerProvider, "_requestJson").callsFake(url => Promise.resolve(url));
            CoolerProvider.BINS_PER_BLOCK = 10;
        });

        after(function() {
            _requestJsonStub.restore();
            CoolerProvider.BINS_PER_BLOCK = oldBinsPerBlock;
        });

        it("only requests coordinates in consistent blocks", function() {
            return INSTANCE._getBlocks2("chr1", 5, 25, 1, 100).then(function(urls) {
                expect(urls).to.have.lengthOf(3);
                expect(urls[0]).to.include("startBase=0");
                expect(urls[0]).to.include("endBase=9");
                expect(urls[1]).to.include("startBase=10");
                expect(urls[1]).to.include("endBase=19");
                expect(urls[2]).to.include("startBase=20");
                expect(urls[2]).to.include("endBase=29");
            });
        });

        it("ensures coordinates do not exceed the chromosome's length", function() {
            return INSTANCE._getBlocks2("chr1", 95, 115, 1, 100).then(function(urls) {
                expect(urls).to.have.lengthOf(2);
                expect(urls[0]).to.include("startBase=90");
                expect(urls[0]).to.include("endBase=99");
                expect(urls[1]).to.include("startBase=100");
                expect(urls[1]).to.include("endBase=100");
            });
        });
    });

});

describe("Unit tests - CoolerFormatter", function() {

    describe("_toCoordinateRecords", function() {
        it("constructs the array of CoordinateRecord properly", function() {
            const BLOCK = {
                records: [
                    [1, 2],
                    [3, 4]
                ],
                binSize: 10,
                startBase: 100
            };
            const CHR = "chr"
            const EXPECTED = [
                new CoordinateRecord(0, CHR, 10, 10, 10, 1),
                new CoordinateRecord(1, CHR, 10, 11, 10, 2),
                new CoordinateRecord(2, CHR, 11, 10, 10, 3),
                new CoordinateRecord(3, CHR, 11, 11, 10, 4)
            ];

            expect(CoolerFormatter._toCoordinateRecords(BLOCK, CHR)).to.deep.equal(EXPECTED);
        });
    });
});

describe("Integration test (HicProvider + CoolerProvider + CoolerFormatter)", function() {
    // It would be nice to test the backend too, but it's too much of a pain to set up...
    let fakeServer = null;

    const FILE_NAME = "myFile";
    const REGION_LST = [["chr1",0,141213431,1,299,192,""],["chr2",0,135534747,1,299,2790,""]];
    const METADATA_BLOB = {
        binSizes: [1, 10],
        chromosomes: [
            {name: "chr1", numBasePairs: 99},
            {name: "chr2", numBasePairs: 300}
        ]
    };
    // chr1:1-299, chr2:1-299
    // Taking into account numBasePairs and CoolerProvider.BINS_PER_BLOCK, =one block for chr1 and two blocks for chr2
    const makeDataBlob = function(startBase) {
        return {
            binSize: 1,
            startBase: startBase,
            records: [[0]]
        };
    };

    const EXPECTED = {
        data: [
            [
                new CoordinateRecord(0, "chr1", 0, 0, 1, 0)
            ],
            [
                new CoordinateRecord(0, "chr2", 0, 0, 1, 0),
                new CoordinateRecord(1, "chr2", 150, 150, 1, 0)
            ]
        ],
        "label":FILE_NAME,"name":"35616758416129213","ft":34,"mode":4,bin_size:0,d_binsize:1,matrix:"observed",
    }

    it("works", function() {
        let fakeServer = sinon.fakeServer.create({respondImmediately: true});
        fakeServer.respondWith(new RegExp(CoolerProvider.METADATA_URL), JSON.stringify(METADATA_BLOB));
        fakeServer.respondWith(new RegExp(CoolerProvider.DATA_URL), function(requestObj) {
            let queryParam = requestObj.url.match(/startBase=\d+/)[0];
            let startBase = parseInt(queryParam.split("=")[1]);
            requestObj.respond(200, {}, JSON.stringify(makeDataBlob(startBase)));
        });

        let instance = new CoolerProvider(FILE_NAME, CoolerFormatter);
        return instance.getData(coolerTestData.track, REGION_LST).then(function(result) {
            expect(fakeServer.requests).to.have.lengthOf(4); // One metadata request, three block requests

            expect(result[DataProvider.TRACK_PROP_NAME]).to.be.an.instanceof(CoolerProvider);
            delete result[DataProvider.TRACK_PROP_NAME];

            expect(result).to.deep.equal(EXPECTED);

            fakeServer.restore(); // Needed since fakeServer replaces the native XMLHttpRequest
        });
    });
});
