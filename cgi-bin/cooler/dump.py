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
    chromosome_x = query_params.getfirst("chromosomeX")
    start_base_x = query_params.getfirst("startBaseX")
    end_base_x = query_params.getfirst("endBaseX")
    chromosome_y = query_params.getfirst("chromosomeY")
    start_base_y = query_params.getfirst("startBaseY")
    end_base_y = query_params.getfirst("endBaseY")
    desired_binsize = query_params.getfirst("binSize")
    if None in [file_name, chromosome_x, start_base_x, end_base_x, chromosome_y, start_base_y, end_base_y,
            desired_binsize]:
        coolUtils.respond_with_text(400, "Missing required parameter(s)")
        return

    try:
        subfiles = coolUtils.get_subfiles(coolUtils.COOL_DIR + file_name)
        cool_file = get_file_matching_binsize(subfiles, int(desired_binsize))
        json_text = get_json_response(cool_file, chromosome_x, int(start_base_x), int(end_base_x), chromosome_y,
            int(start_base_y), int(end_base_y))
    except IOError:
        coolUtils.respond_with_text(404, "No such .cool file stored on this server")
        return
    except ValueError:
        coolUtils.respond_with_text(400, "Malformed or unknown genomic region specified")
        return

    coolUtils.respond_with_json(json_text)

def get_json_response(cool_file, chromosome_x, start_base_x, end_base_x, chromosome_y, start_base_y, end_base_y):
    """
    Gets the body of the HTTP response.

    :param cool_file: (cooler.Cooler) open cooler file interface
    :param chromosome: (string) chromosome name for which to get data
    :param start_base: (int) start of base pair range from which to get data
    :param end_base: (int) end of base pair range from which to get data
    :returns: string of JSON-compliant data
    :throws ValueError: if the input genomic region was invalid
    """

    # matrix() by default applies balance=True, normalizing the entries
    matrix = cool_file.matrix(balance=False).fetch(
        (chromosome_x, start_base_x, end_base_x), (chromosome_y, start_base_y, end_base_y)
    )
    numpy.nan_to_num(matrix, copy=False)
    records = matrix.tolist()

    return json.dumps({
        "binSize": cool_file.binsize,
        "startBaseX": start_base_x,
        "startBaseY": start_base_y,
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
