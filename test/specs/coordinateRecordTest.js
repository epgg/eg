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
