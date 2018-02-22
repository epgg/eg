/**
 * Object packaging customizations for LongRangeProvider.
 * 
 * @author Silas Hsu
 */
interface FetchStrategy {
    /**
     * Converts the input genomic range to the corresponding row and column range of a HiC contact matrix.  Returns a
     * promise for an array of CoordinateRecord containing the data in the contact matrix.  The records will at minimum
     * cover the requested genomic coordinates, but there may be more records than requested.
     *
     * Automatically selects a bin size based on the longest dimension (row or column), but the last two arguments can
     * manually adjust bin size as well.  For more info on bins, see the class documentation: {@link LongRangeProvider}.
     *
     * Additional details:
     * - As the arguments suggest, this method can request only the contact matrix between two chromosomes or the
     *     same chromosome.  If multiple chromosomes are needed, make multiple calls to this method.
     * - Since the matrix is symmetric, a triangular portion theoretically contains all the data we need.  However, this
     *     method returns the full matrix since base.js requires it.
     * 
     * @param {RegionWrapper} region1 - genomic interval for the row range of the matrix
     * @param {RegionWrapper} region2 - genomic interval for the column range of the matrix
     * @param {string} [normalization] - (optional) type of normalization to apply to the record data
     * @param {number} [regionLengthOverride] - (optional) forces the use of a certain region length when selecting
     *     bin size.  Ignored if targetBinSize is present.
     * @param {number} [targetBinSize] - (optional) forces the smallest bin size >= the value of this parameter
     * @return {Promise.<CoordinateRecord[]>} a promise for an array of CoordinateRecord containing the requested data
     */
    fetchRecords(region1: RegionWrapper, region2: RegionWrapper, normalization: string, regionLengthOverride: number,
        targetBinSize: number): Promise<CoordinateRecord[]>;

    /**
     * Constructs a track data object like the one that would be returned from the server.  LongRangeProvider provides a
     * template to start with.  This function may modify it and return it if it wishes.
     *
     * @param {Track} track - track off of which to base the return object
     * @param {Object} template - track data object to start from
     * @return {Object} track data object like the one that would be returned from the server
     */
    constructTrackObject(track, template): Object;
}
