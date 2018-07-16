/**
 * In the Browser, print2console prints to a little window, but we won't have that during our tests.  Instead, print to
 * the browser console.
 */
print2console = function(message, level) {
    console.log(`(print2console level ${level}): ${message}`);
}

function makeRegion(chromosome, startBasePair, endBasePair, wrap=true) {
    let region = [];
    region[RegionWrapper.CHROMOSOME_INDEX] = chromosome;
    region[RegionWrapper.START_BASE_PAIR_INDEX] = startBasePair;
    region[RegionWrapper.END_BASE_PAIR_INDEX] = endBasePair;
    return wrap ? new RegionWrapper(region) : region;
}
