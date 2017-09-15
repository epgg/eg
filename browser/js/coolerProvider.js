/**
 * This file contains the main interface for the epigenome browser to retrieve Cooler data.  The classes in this file
 * depend on jQuery, hicProvider.js and hicFormatter.js.
 *
 * @author Silas Hsu
 * @since version 43.4, August 2017
 */
"use strict"

/**
 * Class that retrieves Cooler data from the main server's Python CGI scripts.
 *
 * @extends HicProvider
 * @author Silas Hsu
 */
class CoolerProvider extends HicProvider {
    /**
     * Makes a new CoolerProvider, specialized to request data from a certain .cool file on the server and format
     * results according to the given HicFormatter.
     *
     * @param {string} fileName - the name of the .cool file stored on the server
     * @param {string} label - the label to add to the track data
     * @param {HicFormatter} hicFormatter - used to format results
     */
    constructor(fileName, label, formatter) {
        super({loadDataset: () => null}, null);

        this.fileName = fileName;
        this.label = label;
        this.formatter = formatter;
        this.metadataUrl = CoolerProvider.METADATA_URL + $.param({fileName: fileName});
        this.metadataPromise = CoolerProvider._requestJson(this.metadataUrl)
            .then(jsonObj => new _CoolerMetadata(jsonObj));
        this.requestSplitter = new RequestSplitter();
    }

    /**
     * Makes an AJAX call to the main server and parses the response as JSON.
     *
     * @param {string} apiURL - the URL which to send the request
     * @return {Promise.<Object>} A promise for the server response parsed as JSON
     */
    static _requestJson(apiURL) {
        let ajaxPromise = new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();

            request.onload = function() {
                if (request.status == 200) {
                    resolve(JSON.parse(request.responseText));
                } else if (Math.floor(request.status/100) == 4 || Math.floor(request.status/100) == 5) {
                    // 400 or 500 level
                    let reason = `HTTP ${request.status}: ${request.responseText}`;
                    print2console(reason, 2);
                    reject(new Error(reason));
                }
            };

            request.onerror = function() {
                console.error(request);
                reject(new Error("ajax error"));
            }
            request.open("GET", apiURL, true);
            request.send();
        });
        return ajaxPromise;
    }

    /**
     * @inheritdoc
     */
    getRecords(chr1Name, bpX, bpXMax, chr2Name, bpY, bpYMax, normalization, regionLengthOverride, targetBinSize) {
        if (targetBinSize == 0) {
            throw new RangeError("Bin size cannot be 0");
        }
        let regionLength = regionLengthOverride || Math.max(bpXMax - bpX, bpYMax - bpY);
        let promise = this.metadataPromise
            .then((metadataObj) => {
                let binSize = targetBinSize || metadataObj.regionLengthToBinSize(regionLength);
                let chromosomeLength = metadataObj.chromosomeLength(chr1Name);
                if (chromosomeLength == -1) {
                    throw new Error(`Could not find chromosome ${chr1Name} in data set`);
                }
                return this._getBlocks2(chr1Name, bpX, bpXMax, binSize, chromosomeLength);
            })
            .catch((error) => { // Catch error here because we don't want the failure of one region to fail the rest
                print2console(error.toString(), 2);
                return [];
            })
            .then(jsonBlobs => this.formatter.formatBlocks(jsonBlobs, chr1Name));
        return promise;
    }

    /**
     * Named _getBlocks2() because _getBlocks() is already a static method of HicProvider.  Does a very similar
     * function, but uses different parameters.  We split the data into consistent blocks of data to take advantage of
     * HTTP caching.  The size of the blocks depends on CoolerProvider.BINS_PER_BLOCK.
     *
     * @borrows {@link HicProvider._getBlocks}
     * @param {string} chromosome - the name of the chromosome from which to get data
     * @param {number} startBase - start of base pair range from which to get data
     * @param {number} endBase - end of base pair range from which to get data
     * @param {number} binSize - requested resolution of data
     * @param {number} chromosomeLength - limit of endBase, to ensure genomic coordinates stay in bounds
     * @return {Promise.<Object[]>} - Promise for array of parsed JSON
     */
    _getBlocks2(chromosome, startBase, endBase, binSize, chromosomeLength) {
        let blockSize = CoolerProvider.BINS_PER_BLOCK * binSize;
        let blocks = this.requestSplitter.splitRegion2d(blockSize, startBase, endBase, chromosomeLength);
        let blockPromises = [];
        for (let block of blocks) {
            let params = {
                fileName: this.fileName,
                chromosomeX: chromosome,
                startBaseX: block.startBaseX,
                endBaseX: block.endBaseX,
                chromosomeY: chromosome,
                startBaseY: block.startBaseY,
                endBaseY: block.endBaseY,
                binSize: binSize
            }
            let apiURL = CoolerProvider.DATA_URL + $.param(params);
            blockPromises.push(CoolerProvider._requestJson(apiURL));
        }
        return Promise.all(blockPromises);
    }

    /**
     * @inheritdoc
     */
    _constructTrackData(hicTrack, recordsForEachRegion) {
        let trackData = super._constructTrackData(hicTrack, recordsForEachRegion);
        trackData.url = this.metadataUrl;
        trackData.norm = "NONE";
        return trackData;
    }
}

CoolerProvider.BINS_PER_BLOCK = 400;
CoolerProvider.METADATA_URL = "/cgi-bin/cooler/getMetadata.py?";
CoolerProvider.DATA_URL = "/cgi-bin/cooler/dump.py?";

/**
 * Wrapper object for the JSON blob that represents a .cool file's metadata.  Has some of the interface of hic.Dataset.
 */
class _CoolerMetadata {
    /**
     * Wraps the provided JSON blob, and makes it sort of look like a hic.Dataset.
     *
     * @param {Object} parsedJson - parsed JSON to wrap
     */
    constructor(parsedJson) {
        this.binSizes = parsedJson.binSizes.slice();
        this.binSizes.sort((a, b) => a < b);
        // We alias this.binSizes because we delegate some functions to hic.Dataset
        this.bpResolutions = this.binSizes;
        this.chromosomes = parsedJson.chromosomes.slice();
        for (let i = 0; i < this.chromosomes.length; i++) { // Again, because of delegation
            this.chromosomes[i].index = i;
        }
    }

    /**
     * @borrows {@link hic.Dataset.prototype.findChromosomeIndex}
     */
    chromosomeLength(name) {
        let index = hic.Dataset.prototype.findChromosomeIndex.call(this, name);
        return index == -1 ? -1 : this.chromosomes[index].numBasePairs;
    }

    /**
     * @borrows {@link hic.Dataset.prototype.regionLengthToZoomIndex}
     */
    regionLengthToBinSize(regionLength) {
        let index = hic.Dataset.prototype.regionLengthToZoomIndex.call(this, regionLength);
        return this.binSizes[index];
    }
}

/**
 * Formats JSON blobs of Cooler data.  This class would extend HicFormatter, but the API is just a little bit different.
 */
class CoolerFormatter extends BrowserHicFormatter {
    /**
     * Puts the data of one JSON blob into an array of CoordinateRecord.
     *
     * @override
     * @param {Object} parsedJson - the JSON blob to convert
     * @param {string} chromosome - chromosome name used for construction of all the CoordinateRecords
     * @return {CoordinateRecord[]} array of CoordinateRecord containing the data in the block
     */
    static _toCoordinateRecords(parsedJson, chromosome) {
        let binSize = parsedJson.binSize;
        let startBaseX = parsedJson.startBaseX;
        let startBaseY = parsedJson.startBaseY;
        let startBinNumX = Math.floor(startBaseX / binSize);
        let startBinNumY = Math.floor(startBaseY / binSize);

        var id = 0;
        let allData = [];
        let records = parsedJson.records;
        for (let i = 0; i < records.length; i++) {
            for (let j = 0; j < records[i].length; j++) {
                if (records[i][j] > 0) {
                    allData.push(
                        new CoordinateRecord(id, chromosome, startBinNumX + i, startBinNumY + j, binSize, records[i][j])
                    );
                    id++;
                }
            }
        }
        return allData;
    }
}
