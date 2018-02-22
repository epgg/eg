"use strict";

describe("Unit tests - RequestSplitter", function() {
    const INSTANCE = new RequestSplitter();

    it("splits regions correctly in 1d", function() {
        let regions = INSTANCE.splitRegion1d(10, 5, 20, 27);
        expect(regions).to.be.an('array').with.lengthOf(3);
        expect(regions).to.deep.include({startBase: 0, endBase: 9});
        expect(regions).to.deep.include({startBase: 10, endBase: 19});
        expect(regions).to.deep.include({startBase: 20, endBase: 27});
    });

    it("splits regions correctly in 2d", function() {
        let regions = INSTANCE.splitRegion2d(10, 5, 20, 27);
        expect(regions).to.be.an('array').with.lengthOf(9);

        expect(regions).to.deep.include({startBaseX: 0, endBaseX: 9, startBaseY: 0, endBaseY: 9});
        expect(regions).to.deep.include({startBaseX: 0, endBaseX: 9, startBaseY: 10, endBaseY: 19});
        expect(regions).to.deep.include({startBaseX: 0, endBaseX: 9, startBaseY: 20, endBaseY: 27});

        expect(regions).to.deep.include({startBaseX: 10, endBaseX: 19, startBaseY: 0, endBaseY: 9});
        expect(regions).to.deep.include({startBaseX: 10, endBaseX: 19, startBaseY: 10, endBaseY: 19});
        expect(regions).to.deep.include({startBaseX: 10, endBaseX: 19, startBaseY: 20, endBaseY: 27});

        expect(regions).to.deep.include({startBaseX: 20, endBaseX: 27, startBaseY: 0, endBaseY: 9});
        expect(regions).to.deep.include({startBaseX: 20, endBaseX: 27, startBaseY: 10, endBaseY: 19});
        expect(regions).to.deep.include({startBaseX: 20, endBaseX: 27, startBaseY: 20, endBaseY: 27});
    });

    it("throws away blocks outside of the chromosome", function() {
        let regions1d = INSTANCE.splitRegion1d(10, 10, 19, 0);
        let regions2d = INSTANCE.splitRegion2d(10, 10, 19, 0);
        expect(regions1d).to.have.lengthOf(0);
        expect(regions2d).to.have.lengthOf(0);
    });
});
