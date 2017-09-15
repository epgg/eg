/**
 * Utility class for splitting requests for regions into consistent chunks, to take advantage of HTTP caching.
 * 
 * @author Silas Hsu
 */
class RequestSplitter {
    /**
     * Splits a request for a region into chunks, assuming the request is for a linear region
     * 
     * @param {number} blockSize - desired size of chunks, in bases
     * @param {number} startBase - start base number of the region
     * @param {number} endBase - end base number of the region
     * @param {number} chromosomeLength - maximum base number in any of the returned regions
     * @returns {object[]} a list of regions that cover the input region
     */
    splitRegion1d(blockSize, startBase, endBase, chromosomeLength) {
        let blocks = [];
        let startBlockBase = Math.floor(startBase / blockSize) * blockSize;
        endBase = Math.min(endBase, chromosomeLength);
        for (let currentBase = startBlockBase; currentBase <= endBase; currentBase += blockSize) {
            blocks.push({
                startBase: currentBase,
                endBase: Math.min(currentBase + blockSize - 1, chromosomeLength)
            });
        }
        return blocks;
    }

    /**
     * Splits a request for a region into square chunks, assuming the request is for a square matrix encompassing that
     * region.
     * 
     * @param {number} blockSize - desired length or width of the square chunks, in bases
     * @param {number} startBase - start base number of the region
     * @param {number} endBase - end base number of the region
     * @param {number} chromosomeLength - maximum base number in any of the returned regions
     * @returns {object[]} a list of square regions that cover the input region
     */
    splitRegion2d(blockSize, startBase, endBase, chromosomeLength) {
        let blocks = [];
        let startBlockBase = Math.floor(startBase / blockSize) * blockSize;
        endBase = Math.min(endBase, chromosomeLength);
        for (let currentBaseX = startBlockBase; currentBaseX <= endBase; currentBaseX += blockSize) {
            for (let currentBaseY = startBlockBase; currentBaseY <= endBase; currentBaseY += blockSize) {
                blocks.push({
                    startBaseX: currentBaseX,
                    endBaseX: Math.min(currentBaseX + blockSize - 1, chromosomeLength),
                    startBaseY: currentBaseY,
                    endBaseY: Math.min(currentBaseY + blockSize - 1, chromosomeLength),
                });
            }
        }
        return blocks;
    }
}
