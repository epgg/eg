#!/usr/bin/env python

import cgi
import cooler
import json
import math
import numpy
import sys

import coolUtils

"""
Quick Cooler API reference:
cooler.io.ls(FILE_NAME) -- lists subfiles
cool_file.binsize - int
cool_file.chromnames - list
cool_file.chromsizes - pandas.core.series
"""

DEBUG = False # Enabling makes main() reply with text/html containing a stack trace if there is an uncaught exception

def main():
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
        cool_file = get_subfile_matching_binsize(coolUtils.COOL_DIR + file_name, int(desired_binsize))
        jsonText = get_json_response(cool_file, chromosome, int(start_base), int(end_base))
    except IOError:
        coolUtils.respond_with_text(404, "No such .cool file stored on this server")
        return
    except ValueError:
        coolUtils.respond_with_text(400, "Malformed or unknown genomic region specified")
        return

    coolUtils.respond_with_json(jsonText)

def get_json_response(cool_file, chromosome, start_base, end_base):
    start_bin = start_base // cool_file.binsize

    # matrix() by default applies balance=True, normalizing the entries
    matrix = cool_file.matrix().fetch("%s:%d-%d" % (chromosome, start_base, end_base))
    numpy.nan_to_num(matrix, copy=False)
    records = matrix.tolist()

    return json.dumps({
        "binSize": cool_file.binsize,
        "records": records
    })

def get_subfile_matching_binsize(cool_file_path, desired):
    subfiles = coolUtils.get_subfiles(cool_file_path)
    subfiles.sort(reverse=True, key=lambda subfile: subfile.binsize) # Largest binsize to smallest
    found_index = -1
    for i in range(len(subfiles)):
        if subfiles[i].binsize <= desired:
            found_index = i
            break

    return subfiles[found_index]

if __name__ == "__main__":
    main()
