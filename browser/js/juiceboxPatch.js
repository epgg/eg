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


hic = (function (hic) {
    let _getNormalizationVector = hic.Dataset.prototype.getNormalizationVector;

    /*
     * hic.Dataset.prototype.getNormalizedBlock() calls getNormalizationVector() and uses `=== undefined` to check the
     * result.  We wrap this function so falsy values get converted to undefined.
     */
    hic.Dataset.prototype.getNormalizationVector = function (type, chrIdx, unit, binSize) {
        return _getNormalizationVector.bind(this)(type, chrIdx, unit, binSize)
            .then(normVector => normVector || undefined);
    }

    return hic;
})
(hic)
