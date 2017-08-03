"use strict"

class CoolerProvider extends HicProvider {
    constructor(fileName, formatter) {
        super({loadDataset: () => null}, null);

        this.fileName = fileName;
        this.formatter = formatter;
        let apiUrlForMetadata = "/cgi-bin/cooler/getMetadata.py?" + $.param({fileName: fileName});
        this.metadataPromise = this._requestJson(apiUrlForMetadata).then(jsonObj => new _CoolerMetadata(jsonObj));
    }

    /**
     * @inheritdoc
     */
    getRecords(chr1Name, bpX, bpXMax, chr2Name, bpY, bpYMax, normalization, regionLengthOverride, targetBinSize) {
        let promise = this.metadataPromise
            .then((metadataObj) => {
                let binSize = targetBinSize || metadataObj.regionLengthToBinSize(regionLengthOverride);
                let chromosomeLength = metadataObj.chromosomeLength(chr1Name);
                if (chromosomeLength == -1) {
                    throw new Error(`Could not find chromosome ${chr1Name} in data set`);
                }
                return Promise.all(this._getBlocks2(chr1Name, bpX, bpXMax, binSize, chromosomeLength));
            })
            .catch((error) => { // Catch error here because we don't want the failure of one region to fail the rest
                print2console(error.toString(), 2);
                return [];
            })
            .then(jsonBlobs => this.formatter.formatBlocks(jsonBlobs, chr1Name, bpX));
        return promise;
    }

    _requestJson(apiURL) {
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
     * Named _getBlocks2() because _getBlocks() is already a method of HicProvider.  We split the data into blocks to
     * take advantage of HTTP caching.
     */
    _getBlocks2(chromosome, startBase, endBase, binSize, chromosomeLength) {
        let startBin = Math.floor(startBase / binSize);
        let startBlock = Math.floor(startBin / CoolerProvider.BINS_PER_BLOCK);
        let endBin = Math.floor(endBase / binSize);
        let endBlock = Math.floor(endBin / CoolerProvider.BINS_PER_BLOCK);

        let blockPromises = [];
        for (let blockNum = startBlock; blockNum <= endBlock; blockNum++) {
            let params = {
                fileName: this.fileName,
                chromosome: chromosome,
                startBase: blockNum * CoolerProvider.BINS_PER_BLOCK * binSize,
                endBase: Math.min((blockNum + 1) * CoolerProvider.BINS_PER_BLOCK * binSize - 1, chromosomeLength),
                binSize: binSize
            }
            let apiURL = "/cgi-bin/cooler/dump.py?" + $.param(params);
            blockPromises.push(this._requestJson(apiURL));
        }
        return blockPromises;
    }

    /**
     * @inheritdoc
     */
    _constructTrackData(hicTrack, recordsForEachRegion) {
        let trackData = super._constructTrackData(hicTrack, recordsForEachRegion);
        trackData.label = this.fileName;
        return trackData;
    }
}

CoolerProvider.BINS_PER_BLOCK = 150;

class _CoolerMetadata {
    constructor(parsedJson) {
        this.binSizes = parsedJson.binSizes.slice();
        this.binSizes.sort().reverse();
        // We alias this.binSizes because we delegate some functions to hic.Dataset
        this.bpResolutions = this.binSizes;
        this.chromosomes = parsedJson.chromosomes.slice();
        for (let i = 0; i < this.chromosomes.length; i++) { // Again, because of delegation
            this.chromosomes[i].index = i;
        }
    }

    regionLengthToBinSize(regionLength) {
        let index = hic.Dataset.prototype.regionLengthToZoomIndex.call(this, regionLength);
        return this.binSizes[index];
    }

    chromosomeLength(name) {
        let index = hic.Dataset.prototype.findChromosomeIndex.call(this, name);
        return index == -1 ? -1 : this.chromosomes[index].numBasePairs;
    }
}

class CoolerFormatter extends HicFormatter {
    static formatBlocks(blocks, chromosome, startBase) {
        if (!blocks) {
            return [];
        }

        let blocksAsCoorData = blocks.map(block => CoolerFormatter._toCoordinateRecords(block, chromosome, startBase));

        let combinedCoorData = [].concat.apply([], blocksAsCoorData); // Concatenate all the data into one array
        for (let i = 0; i < combinedCoorData.length; i++) { // Make sure ids are unique
            combinedCoorData[i].id = i;
        }
        return combinedCoorData;
    }

    static _toCoordinateRecords(parsedJSON, chromosome, startBase) {
        let binSize = parsedJSON.binSize;
        let startBinNum = Math.floor(startBase / binSize);

        var id = 0;
        let allData = [];
        let records = parsedJSON.records;
        for (let i = 0; i < records.length; i++) {
            for (let j = 0; j < records[i].length; j++) {
                allData.push(
                    new CoordinateRecord(id, chromosome, startBinNum + i, startBinNum + j, binSize, records[i][j])
                );
                id++;
            }
        }
        return allData;
    }
}
