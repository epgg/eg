'use strict';

/**
 * DataProvider for tracks that display binned interaction data, such as HiC and cool.
 * 
 * About bins: HiC stores contact matrix data.  Becuase the entire matrix is very large, we aggregate adjacent entries
 * into larger cells.  The number of rows and columns we aggregate is the bin size.  Bin size is measured in base pairs.
 * 
 * @author Silas Hsu
 */
class LongRangeProvider extends DataProvider {
    /**
     * Makes a new instance.
     * 
     * @param {FetchStrategy} fetchStrategy - fetch algorithm to use
     */
    constructor(fetchStrategy) {
        super();
        this.fetchStrategy = fetchStrategy;
    }

    /**
     * Fetches interaction data for a track.
     * 
     * @param {Track} track - object to assist in constructing track metadata
     * @param {Region[]} regionLst - list of regions from which to get data
     * @return {Promise<Object>} a promise for a track data object
     * @override
     */
    getData(track, regionLst) {
        if (!track) {
            return Promise.resolve({});
        }
        if (!regionLst || regionLst.length == 0) {
            let defaultObj = this._constructDefaultTrackObject(track, []);
            return Promise.resolve(this.fetchStrategy.constructTrackObject(track, defaultObj));
        }

        const regions = RegionWrapper.wrapRegions(regionLst);
        const longestRegion = regions.reduce((longestLengthSoFar, currentRegion) => {
            let currentLength = currentRegion.getLength();
            return currentLength > longestLengthSoFar ? currentLength : longestLengthSoFar;
        }, 0);
        // User-set bin size?
        const binSizeOverride = track.qtc.bin_size == scale_auto ? null : Number.parseInt(track.qtc.bin_size);

        let promisesForEachRegion = regions.map(region => 
            this.fetchStrategy.fetchRecords(region, region, track.qtc.norm, longestRegion, binSizeOverride)
                .catch((error) => { // Catch error here because we don't want the failure of one region to fail the rest
                    console.error(error);
                    print2console(`${error.toString()}`, 2);
                    return [];
                })
        );

        return Promise.all(promisesForEachRegion).then(recordsForEachRegion => {
            const filteredRecords = this._filterRecords(track, recordsForEachRegion);
            let defaultObj = this._constructDefaultTrackObject(track, filteredRecords);
            return this.fetchStrategy.constructTrackObject(track, defaultObj);
        });
    }

    /**
     * Filters CoordinateRecords based on a track's options.
     * 
     * @param {Track} track - object that stores track options
     * @param {CoordinateRecord[][]} recordsForEachRegion - records to filter
     * @return {CoordinateRecord[][]} filtered records
     */
    _filterRecords(track, recordsForEachRegion) {
        const positiveFilterScore = track.qtc.pfilterscore || 0;
        const negativeFilterScore = track.qtc.nfilterscore || 0;
        return recordsForEachRegion.map(records => 
            records.filter(record => {
                if (record.value >= 0) {
                    return record.value > positiveFilterScore;
                } else {
                    return record.value < negativeFilterScore;
                }
            })
        );
    }

    /**
     * Constructs a track data object like the one that would be returned from the server.
     * 
     * @param {Track} track - track off of which to base the return object
     * @param {CoordinateRecord[][]} recordsForEachRegion - records to attach to the object
     * @return {Object} track data object
     */
    _constructDefaultTrackObject(track, recordsForEachRegion) {
        // Infer bin size from the records
        const regionWithRecords = recordsForEachRegion.find(records => records.length > 0);
        const binSize = regionWithRecords !== undefined ? (regionWithRecords[0].stop - regionWithRecords[0].start) : 0;

        let trackData = {
            url: track.url,
            data: recordsForEachRegion,
            name: track.name,
            label: track.label,
            ft: track.ft,
            mode: track.mode,
            bin_size: track.qtc.bin_size || scale_auto,
            d_binsize: binSize,
            matrix: "observed",
        }
        trackData[DataProvider.TRACK_PROP_NAME] = this;

        /*
        By putting `this` in the track data, we expect Browser.prototype.jsonTrackdata (in base.js) to attach `this` to
        the HiC track, and then we can take advantage of juicebox.js's caching if the Track appears again in
        getHicPromises().
        */
        return trackData;
    }
}
