'use strict'

/**
 * base.js uses arrays to represent genomic regions.  This class extends such arrays to provide named access to region
 * info.  Otherwise, magic numbers or named consts would be needed.
 *
 * @author Silas Hsu
 */
class RegionWrapper {
    constructor(arrayLikeRegion) {
        for (let key in arrayLikeRegion) {
            this[key] = arrayLikeRegion[key];
        }
    }

    static wrapRegions(regions) {
        return regions.map(region => new RegionWrapper(region));
    }

    get chromosome() { return this[RegionWrapper.CHROMOSOME_INDEX]; }
    get startBasePair() { return this[RegionWrapper.START_BASE_PAIR_INDEX]; }
    get endBasePair() { return this[RegionWrapper.END_BASE_PAIR_INDEX]; }
    get lengthInBasePairs() { return this.endBasePair - this.startBasePair; }
}

RegionWrapper.CHROMOSOME_INDEX = 0;
RegionWrapper.START_BASE_PAIR_INDEX = 3;
RegionWrapper.END_BASE_PAIR_INDEX = 4;
