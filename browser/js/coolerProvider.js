"use strict"

class CoolerProvider extends HicProvider {
    constructor(coolerURL) {
        super({loadDataset: () => null}, null);
        this.coolerURL = coolerURL;
    }

    /**
     * @override
     */
    getRecords(chr1Name, bpX, bpXMax, chr2Name, bpY, bpYMax, normalization, regionLengthOverride, targetBinSize) {
        let binsize = targetBinSize || CoolerProvider._regionLengthToBinSize(regionLengthOverride);
        let params = {
            chromosome: chr1Name,
            startBase: bpX,
            endBase: bpXMax,
            binsize: binsize
        }
        let apiURL = "/cgi-bin/dumpCooler.py?" + $.param(params);
        let promise = this._makeAjaxRequest(apiURL)
            .then(parsedJSON => CoolerProvider._toCoordinateRecords(parsedJSON, chr1Name));
        return promise;
    }

    _makeAjaxRequest(apiURL) {
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

    static _regionLengthToBinSize(regionLength) {
        return 100000;
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
