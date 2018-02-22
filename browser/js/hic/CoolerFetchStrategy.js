'use strict';

/**
 * Class that retrieves Cooler data from the main server's Python CGI scripts.  Dependencies: jQuery.
 *
 * @extends FetchStrategy
 * @author Silas Hsu
 */
class CoolerFetchStrategy {
    /**
     * Makes a new instance, specialized to request data from a certain .cool file on the server.
     *
     * @param {string} fileName - the name of the .cool file stored on the server
     * @param {string} trackLabel - the label to add to the track data
     */
    constructor(fileName, trackLabel) {
        this.fileName = fileName;
        this.trackLabel = trackLabel;
        this.metadataUrl = CoolerFetchStrategy.METADATA_URL + $.param({fileName: fileName});
        this.metadataPromise = this._requestJson(this.metadataUrl)
            .then(jsonObj => new _CoolerMetadata(jsonObj));
        this.requestSplitter = new RequestSplitter();
    }

    /**
     * @inheritdoc
     */
    fetchRecords(region1, region2, normalization, regionLengthOverride, targetBinSize) {
        if (targetBinSize == 0) {
            throw new RangeError("Bin size cannot be 0");
        }
        const chr1Name = region1.chromosome;
        const regionLength = regionLengthOverride || Math.max(region1.getLength(), region2.getLength());
        let promise = this.metadataPromise
            .then((metadataObj) => {
                const binSize = targetBinSize || metadataObj.regionLengthToBinSize(regionLength);
                const chromosomeLength = metadataObj.chromosomeLength(chr1Name);
                if (chromosomeLength == -1) {
                    throw new Error(`${this.trackLabel}: could not find chromosome ${chr1Name} in data set`);
                }
                return this._getBlocks(region1, binSize, chromosomeLength);
            })
            .then(jsonBlobs => this._formatBlocks(jsonBlobs, chr1Name));
        return promise;
    }

    /**
     * @inheritdoc
     */
    constructTrackObject(track, template) {
        template.url = this.fileName;
        template.norm = "NONE";
        return template;
    }

    /**
     * We split the data into consistent blocks of data to take advantage of HTTP caching.  The size of the blocks
     * depends on CoolerFetchStrategy.BINS_PER_BLOCK.
     *
     * @borrows {@link HicProvider._getBlocks}
     * @param {RegionWrapper} region - region for which to get data
     * @param {number} binSize - requested resolution of data
     * @param {number} chromosomeLength - limit of endBase, to ensure genomic coordinates stay in bounds
     * @return {Promise.<Object[]>} - Promise for array of parsed JSON
     */
    _getBlocks(region, binSize, chromosomeLength) {
        const blockSize = CoolerFetchStrategy.BINS_PER_BLOCK * binSize;
        const blocks = this.requestSplitter.splitRegion2d(blockSize, region.start, region.end, chromosomeLength);
        let blockPromises = blocks.map(block => {
            const params = {
                fileName: this.fileName,
                chromosomeX: region.chromosome,
                startBaseX: block.startBaseX,
                endBaseX: block.endBaseX,
                chromosomeY: region.chromosome,
                startBaseY: block.startBaseY,
                endBaseY: block.endBaseY,
                binSize: binSize
            }
            let apiURL = CoolerFetchStrategy.DATA_URL + $.param(params);
            return this._requestJson(apiURL);
        });
        return Promise.all(blockPromises);
    }

    /**
     * Makes an AJAX call to the main server and parses the response as JSON.
     *
     * @param {string} apiURL - the URL which to send the request
     * @return {Promise.<Object>} A promise for the server response parsed as JSON
     */
    _requestJson(apiURL) {
        let ajaxPromise = new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();

            request.onload = function() {
                if (request.status == 200) {
                    resolve(JSON.parse(request.responseText));
                } else if (request.status >= 400) {
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
     * Merges an array of blocks into one array of CoordinateRecord.
     *
     * @param {Object[]} blocks - array of JSON blocks
     * @param {string} chrName - chromosome name used for construction of all the CoordinateRecords
     * @return {CoordinateRecord[]} array of CoordinateRecord containing the data in all the blocks
     */
    _formatBlocks(blocks, chrName) {
        if (!blocks) {
            return [];
        }

        const blocksAsCoorRecords = blocks.map(block => this._convertBlockToCoordinateRecords(block, chrName));
        let combinedCoorRecords = [].concat.apply([], blocksAsCoorRecords); // Concatenate all the data into one array
        for (let i = 0; i < combinedCoorRecords.length; i++) { // Make sure ids are unique
            combinedCoorRecords[i].id = i;
        }
        return combinedCoorRecords;
    }

    /**
     * Puts the data of one JSON blob into an array of CoordinateRecord.
     *
     * @param {Object} parsedJson - the JSON blob to convert
     * @param {string} chrName - chromosome name used for construction of all the CoordinateRecords
     * @return {CoordinateRecord[]} array of CoordinateRecord containing the data in the block
     */
    _convertBlockToCoordinateRecords(parsedJson, chrName) {
        const binSize = parsedJson.binSize;
        const startBaseX = parsedJson.startBaseX;
        const startBaseY = parsedJson.startBaseY;
        const startBinNumX = Math.floor(startBaseX / binSize);
        const startBinNumY = Math.floor(startBaseY / binSize);

        let id = 0;
        let allData = [];
        const records = parsedJson.records;
        for (let i = 0; i < records.length; i++) {
            for (let j = 0; j < records[i].length; j++) {
                if (records[i][j] > 0) {
                    allData.push(
                        new CoordinateRecord(id, chrName, startBinNumX + i, startBinNumY + j, binSize, records[i][j])
                    );
                    id++;
                }
            }
        }
        return allData;
    }

}

CoolerFetchStrategy.BINS_PER_BLOCK = 400;
CoolerFetchStrategy.METADATA_URL = "/cgi-bin/cooler/getMetadata.py?";
CoolerFetchStrategy.DATA_URL = "/cgi-bin/cooler/dump.py?";

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
        this.binSizes.sort((a, b) => b - a);
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
