'use strict'

/**
 * An abstract class for objects that get track data.  How to modify a track type's endpoint from the default:
 *   1.  Make a new class that extends this class
 *   2.  Modify DataProvider.makeProviderForTrack() so it actually uses your new class
 *   3.  Done!
 *
 * @see {@link DataProvider.prototype.getData} for more information on "track data"
 * @author Silas Hsu
 */
class DataProvider {
    /**
     * Runs setup for a new DataProvider, such as setting the URL of the data or accepting dependencies
     */
    constructor() {
        if (this.constructor === DataProvider) {
            throw new Error("Cannot instantiate abstract class");
        }
    }

    /**
     * Gets track data.  "Track data" means material inside the `tkdatalst` array which the Browser retrieves from a
     * Browser.prototype.ajax() call.
     *
     * TODO
     * In an ideal world, Tracks would have the responsibility of constructing their own metadata (never mind that
     * Tracks don't render themselves; instead they give the data to the Browser).  Unfortunately, since Tracks are
     * plain objects, it's difficult to implement polymorphism.  So, I have delegated constructing track metadata to the
     * DataProviders.  That is why getData()'s first argument is a Track object.
     *
     * Note: we can persist DataProvider objects by adding the DataProvider.TRACK_PROP_NAME property to the return
     * value of this function, and then any track created from the data will automatically set the property.  The line
     * that does this is in base.js and says `if (lst[i][DataProvider.TRACK_PROP_NAME])`
     *
     * @param {Track} track - object to assist in constructing track metadata
     * @param {Region[]} regionLst - list of regions from which to get data
     * @return {Promise<Object>} a promise for track data
     */
    getData(track, regionLst) {
        return Promise.resolve({});
    }

    /**
     * Makes an appropriate DataProvider for a track, depending on its type.
     *
     * @param {Track} track - a track to make the DataProvider for
     * @param {Browser} browser - the Browser, currently used exclusively for construction of DefaultDataProvider
     * @param {string} params - query parameters, currently used exclusively for construction of DefaultDataProvider
     * @return {DataProvider} a DataProvider for the track
     */
    static makeProviderForTrack(track, browser, params) {
        switch (track.ft) {
            case FT_hi_c:
                return new HicProvider(hic.HiCReader.fromUrl(track.url), BrowserHicFormatter);
            case FT_cool_c:
                return new CoolerProvider(track.url, track.label, CoolerFormatter);
            case FT_bigwighmtk_n:
            case FT_bigwighmtk_c:
                //return new BigWigProvider(new igv.BWSource({url:track.url}), BrowserBigWigFormatter);
            default:
                return new DefaultDataProvider(browser, params);
        }
    }
}

DataProvider.TRACK_PROP_NAME = "dataProvider";

/**
 * The DefaultDataProvider gets data from the main server.  It calls Browser.prototype.ajax().
 */
class DefaultDataProvider extends DataProvider {
    /**
     * Sets up the query parameters with which Browser.prototype.ajax() will be called.
     *
     * @param {Browser} browser - Browser object with ajax function
     * @param {Object} params - query parameters object to send to ajax
     */
    constructor(browser, params) {
        super();
        this.browser = browser;
        this.params = params;
    }

    /**
     * Call the Browser's ajax method.  The response's regionLst property will be ignored, and only the first element of
     * tkdatalst will be returned.
     *
     * @override
     * @param {Track} track - unused and ignored
     * @param {Region[]} regionLst - unused and ignored
     * @return {Promise<Object>} a promise for track data
     */
    getData(track, regionLst) {
        return this.browser.promisfyAjax(this.params)
            .then(response => response.tkdatalst[0]);
    }
}
