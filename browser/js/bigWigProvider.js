/**
 * TODO This class is untested and incomplete!
 *
 * @author Silas Hsu
 */
class BigWigProvider extends DataProvider {
    /**
     *
     */
    constructor(bigWigSource, recordFormatter) {
        super()
        this.bigWigSource = bigWigSource;
        this.recordFormatter = recordFormatter;
    }

    /**
     * @override
     */
    getData(bigWigTrack, regionLst) {
        if (!bigWigTrack) {
            return Promise.resolve({});
        }
        if (!regionLst || regionLst.length == 0) {
            return Promise.resolve(this._constructTrackData(hicTrack, []));
        }

        let regions = RegionWrapper.wrapRegions(regionLst);
        let promisesForEachRegion = [];
        for (let region of regions) {
            let promise = getRecords(region.chromosome, region.startBasePair, region.endBasePair);
            promisesForEachRegion.push(promise);
        }

        return Promise.all(promisesForEachRegion)
            .then(recordsForEachRegion => this._constructTrackData(bigWigTrack, recordsForEachRegion));
    }

    /**
     *
     */
    getRecords(chromosomeName, startBasePair, endBasePair) {
        return this.bigWigSource.getFeatures(chromosomeName, startBasePair, endBasePair)
            .then(features => this.recordFormatter.format(features));
    }

    /**
     * TODO
     */
    _constructTrackData(track, recordsForEachRegion) {

    }
}

/**
 * Formats BigWig records in a way our Browser can understand.
 */
class BrowserBigWigFormatter /* extends RecordsFormatter */{ // TODO merge this API and the HiCFormatter API?

    /**
     *
     */
    static format(records) {
        if (!records) {
            return [];
        }
        return records.map(record => record.value);
    }
}
