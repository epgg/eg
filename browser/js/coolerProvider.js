"use strict"

class CoolerProvider extends HicProvider {
    constructor(fileName) {
        super({loadDataset: () => null}, null);
        this.fileName = fileName;
        let apiUrlForBinSizes = "/cgi-bin/cooler/getResolutions.py?" + $.param({fileName: fileName});
        this.binSizesPromise = this._makeJsonRequest(apiUrlForBinSizes).then(json => json.binSizes);
    }

    /**
     * @override
     */
    getRecords(chr1Name, bpX, bpXMax, chr2Name, bpY, bpYMax, normalization, regionLengthOverride, targetBinSize) {
        let getBinSize = targetBinSize == null ?
            this._regionLengthToBinSize(regionLengthOverride) : Promise.resolve(targetBinSize)

        let promise = getBinSize
            .then((binSize) => {
                let params = {
                    fileName: this.fileName,
                    chromosome: chr1Name,
                    startBase: bpX,
                    endBase: bpXMax,
                    binSize: binSize
                }
                let apiURL = "/cgi-bin/cooler/dump.py?" + $.param(params);
                return this._makeJsonRequest(apiURL);
            })
            .then(parsedJSON => CoolerProvider._toCoordinateRecords(parsedJSON, chr1Name));

        return promise;
    }

    _makeJsonRequest(apiURL) {
        let ajaxPromise = new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();

            request.onload = function() {
                if (request.status == 200) {
                    resolve(JSON.parse(request.responseText));
                } else if (Math.floor(request.status/100) == 4 || Math.floor(request.status/100) == 5) { // 400 or 500 level
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

    _regionLengthToBinSize(regionLength) {
        let promise = this.binSizesPromise.then((binSizes) => {
            binSizes.sort().reverse();
            for (let i = 0; i < binSizes.length; i++) { // Iterate through bin sizes, largest to smallest
                if (regionLength > CoolerProvider.MIN_BINS_PER_REGION * binSizes[i]) {
                    return binSizes[i];
                }
            }
            return binSizes[binSizes.length - 1];
        });
        return promise;
    }

    _constructTrackData(hicTrack, recordsForEachRegion) {
        let trackData = super._constructTrackData(hicTrack, recordsForEachRegion);
        trackData.label = this.fileName;
        return trackData;
    }

    static _toCoordinateRecords(parsedJSON, chromosome) {
        let binSize = parsedJSON.binSize;
        var id = 0;
        let allData = [];
        for (let record of parsedJSON.records) {
            allData.push(new CoordinateRecord(id, chromosome, record.bin1, record.bin2, binSize, record.counts));
            id++;
        }
        return allData;
    }
}

CoolerProvider.MIN_BINS_PER_REGION = 50;
