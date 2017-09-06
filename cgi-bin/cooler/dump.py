#!/usr/bin/env python
"""
API endpoint for dumping Cooler contact matricies from a specific file and genomic region.

:author: Silas Hsu
:since: version 43.4, August 2017
"""

import cgi
import cooler
import json
import math
import numpy
import sys

import coolUtils

"""
Quick Cooler API reference:
cooler.io.ls(FILE_NAME) -- list of string; lists subfiles
cool_file.binsize - int
cool_file.chromnames - list of string
cool_file.chromsizes - pandas.core.series
"""

DEBUG = False # Enabling makes main() reply with text/html containing a stack trace if there is an uncaught exception

def main():
    """
    Entry point for CGI script.  Expects a HTTP GET, parses query parameters, and prints the response to stdout.
    """
    if DEBUG:
        import cgitb
        cgitb.enable()

    query_params = cgi.FieldStorage()
    file_name = query_params.getfirst("fileName")
    chromosome = query_params.getfirst("chromosome")
    start_base = query_params.getfirst("startBase")
    end_base = query_params.getfirst("endBase")
    desired_binsize = query_params.getfirst("binSize")
    if None in [file_name, chromosome, start_base, end_base, desired_binsize]:
        coolUtils.respond_with_text(400, "Missing required parameter(s)")
        return

    try:
        subfiles = coolUtils.get_subfiles(coolUtils.COOL_DIR + file_name)
        cool_file = get_file_matching_binsize(subfiles, int(desired_binsize))
        jsonText = get_json_response(cool_file, chromosome, int(start_base), int(end_base))
    except IOError:
        coolUtils.respond_with_text(404, "No such .cool file stored on this server")
        return
    except ValueError:
        coolUtils.respond_with_text(400, "Malformed or unknown genomic region specified")
        return

    coolUtils.respond_with_json(jsonText)

def get_json_response(cool_file, chromosome, start_base, end_base):
    """
    Gets the body of the HTTP response.

    :param cool_file: (cooler.Cooler) open cooler file interface
    :param chromosome: (string) chromosome name for which to get data
    :param start_base: (int) start of base pair range from which to get data
    :param end_base: (int) end of base pair range from which to get data
    :returns: string of JSON-compliant data
    :throws ValueError: if the input genomic region was invalid
    """
    start_bin = start_base // cool_file.binsize

    # matrix() by default applies balance=True, normalizing the entries
    matrix = cool_file.matrix(balance=False).fetch("%s:%d-%d" % (chromosome, start_base, end_base))
    numpy.nan_to_num(matrix, copy=False)
    records = matrix.tolist()

    return json.dumps({
        "binSize": cool_file.binsize,
        "startBase": start_base,
        "records": records
    })

def get_file_matching_binsize(cool_file_list, desired_binsize):
    """
    Selects a Cooler file with a resolution "close" to a desired bin size, defined as the largest bin size smaller than
    the input.

    :param cool_file_list: (cooler.Cooler[]) list of cooler files from which to select one file
    :param desired_binsize: (int) desired resolution of selected file
    :returns: a Cooler file with a resolution "close" to desired_binsize
    """
    # Sort largest binsize to smallest
    sorted_files = sorted(cool_file_list, reverse=True, key=lambda cool_file: cool_file.binsize)
    found_index = -1
    for i in range(len(sorted_files)):
        if sorted_files[i].binsize <= desired_binsize:
            found_index = i
            break

    return sorted_files[found_index]

if __name__ == "__main__":
    main()
