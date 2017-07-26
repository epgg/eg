/**
  * Additions and bug fixes for juicebox.js.  Intended to patch <https://igv.org/web/jb/release/1.0/juicebox-1.0.js>.
  *
  * @author Silas Hsu
  * @since version 43.2, July 2017
  */
 'use strict'

///////////////
// Additions //
///////////////

hic.Dataset.MIN_BINS_PER_REGION = 50;
hic.Dataset.BLOCK_CACHE_SIZE = 20;

/**
* Searches the internal list of chromosomes for one with a name matching the input.  Returns -1 if not found.
*
* @param {string} name - the name of the chromosome to find
* @return {number} the index of the found chromosome, or -1 if not found
*/
hic.Dataset.prototype.findChromosomeIndex = function(name) {
    if (!name) {
        return -1;
    }

    let found = this.chromosomes.find(function (chromosome) {
        return chromosome.name == name;
    });
    if (found) {
        return found.index;
    }

    var modifiedName = name.replace("chrM", "MT");
    modifiedName = modifiedName.replace("chr", "");
    found = this.chromosomes.find(function (chromosome) {
        return chromosome.name == modifiedName;
    });
    if (found) {
        return found.index;
    }

    return -1;
}

/**
* Returns the index of the largest bin size such at least MIN_BINS_PER_REGION fit in a region of the provided
* length.  If no such bin size exists, because the input was too small or invalid, returns the smallest bin size.
*
* @param {number} regionLength - the length of the region
* @returns {number} the index of the recommended bin size for the region
*/
hic.Dataset.prototype.regionLengthToZoomIndex = function(regionLength) {
    for (let i = 0; i < this.bpResolutions.length; i++) { // Iterate through bin sizes, largest to smallest
        if (regionLength > hic.Dataset.MIN_BINS_PER_REGION * this.bpResolutions[i]) {
            return i;
        }
    }
    return this.bpResolutions.length - 1;
}

/**
* Returns the index of the smallest bin size that is larger than or equal to the input.  If no such bin size
* exists, then returns the largest bin size.
*
* @param {number} targetResolution - the bin size to find
* @returns {number} the index of a bin size that is "close" to the input
*/
hic.Dataset.prototype.binsizeToZoomIndex = function(targetResolution) { // Based off of findMatchingZoomIndex
    if (targetResolution == undefined) {
     return 0;
    }
    for (let z = this.bpResolutions.length - 1; z > 0; z--) { // Iterate through bin sizes, smallest to largest
        if (this.bpResolutions[z] >= targetResolution) {
            return z;
        }
    }
    return 0;
}

hic.HiCReader.fromUrl = function(url) {
    return new hic.HiCReader({
        url: url,
        config: {}
    });
}


///////////////
// Bug fixes //
///////////////

/**
 * Changes:
 * - Clears blocks out of the cache properly: `delete self.blockCache[self.blockCacheKeys[0]];` originally was
 * `self.blockCache[self.blockCacheKeys[0]] = undefined;`
 * - Uses hic.Dataset.BLOCK_CACHE_SIZE instead of a magic number
 */
hic.Dataset.prototype.getBlock = function (zd, blockNumber) {

    var self = this,
        key = "" + zd.chr1.name + "_" + zd.chr2.name + "_" + zd.zoom.binSize + "_" + zd.zoom.unit + "_" + blockNumber;


    if (this.blockCache.hasOwnProperty(key)) {
        return Promise.resolve(this.blockCache[key]);
    } else {
        return new Promise(function (fulfill, reject) {

            var reader = self.hicReader;

            reader.readBlock(blockNumber, zd)

                .then(function (block) {

                    // Cache at most BLOCK_CACHE_SIZE blocks
                    if(self.blockCacheKeys.length > hic.Dataset.BLOCK_CACHE_SIZE) {
                        delete self.blockCache[self.blockCacheKeys[0]];
                        self.blockCacheKeys.shift();
                    }

                    self.blockCacheKeys.push(key);
                    self.blockCache[key] = block;

                    fulfill(block);

                })
                .catch(function (error) {
                    reject(error);
                })
        })
    }
}

/*
 * Copy-pasting is messy and breaks easily.  Here, we put fixes in wrappers.
 */
hic = (function (hic) {
    let _readNormVectorIndex = hic.HiCReader.prototype.readNormVectorIndex;
    let _readMatrix = hic.HiCReader.prototype.readMatrix;
    let _getNormalizationVector = hic.Dataset.prototype.getNormalizationVector;

    /*
     * hic.Dataset.prototype.getNormalizedBlock() calls getNormalizationVector() and uses `=== undefined` to check the
     * result.  We wrap this function so falsy values get converted to undefined.
     */
    hic.Dataset.prototype.getNormalizationVector = function (type, chrIdx, unit, binSize) {
        return _getNormalizationVector.bind(this)(type, chrIdx, unit, binSize)
            .then(normVector => normVector || undefined);
    }

    /*
     * In the original function, the `Promise.resolve(...)` statements were missing `return`.
     */
    hic.HiCReader.prototype.readNormVectorIndex = function (dataset) {

        if (this.expectedValueVectorsPosition === undefined) {
            return Promise.resolve();
        }

        if (this.normVectorIndex) {
            return Promise.resolve(normVectorIndex);
        }

        return _readNormVectorIndex.bind(this)(dataset);
    }

    /*
     * In the original function, the `Promise.resolve(undefined)` statement was missing `return`.
     */
    hic.HiCReader.prototype.readMatrix = function (key) {
        if (this.masterIndex[key] == null) {
            return Promise.resolve(undefined);
        }

        return _readMatrix.bind(this)(key);
    }

    /*
     * In hic.HiCReader.prototype.readBlock(), there is a line that contains `new hic.hic.ContactRecord`, where the
     * extra `.hic` is a typo.  Instead of replacing that line, we will just give it what it wants.
     */
    if (!hic.hic) {
        hic.hic = {};
    }
    hic.hic.ContactRecord = hic.ContactRecord;

    return hic;
})
(hic)
