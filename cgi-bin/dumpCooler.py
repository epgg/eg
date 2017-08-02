#!/usr/bin/env python

import sys
import cooler
import json
import urlparse
import math
import cgi

"""
Quick Cooler API reference:
cooler.io.ls(FILE_NAME) -- lists subfiles
cool_file.binsize - int
cool_file.chromnames - list
cool_file.chromsizes - pandas.core.series
"""

COOL_DIR = "???"

def main():
    query_params = cgi.FieldStorage()
    file_name = query_params.getfirst("fileName")
    chromosome = query_params.getfirst("chromosome")
    start_base = query_params.getfirst("startBase")
    end_base = query_params.getfirst("endBase")
    desired_binsize = query_params.getfirst("binsize")
    if None in [file_name, chromosome, start_base, end_base, desired_binsize]:
        respond_with_text(400, "Missing required parameter(s)")
        return

    try:
        cool_file = select_cool_resolution(COOL_DIR + file_name, int(desired_binsize))
        jsonBody = get_JSON_response(cool_file, chromosome, int(start_base), int(end_base))
    except IOError:
        respond_with_text(404, "No such .cool file stored on this server")
        return
    except ValueError:
        respond_with_text(400, "Malformed or unknown genomic region specified")
        return

    print "Content-Type: application/json"
    print "Content-Length:", len(jsonBody)
    print ""
    print jsonBody

def respond_with_text(code, text):
    more_description = ""
    if code == 400:
        more_description = "Bad Request"
    if code == 404:
        more_description = "Not Found"
    print "Status:", code, more_description
    print "Content-Type: text/plain"
    print ""
    print text

def get_JSON_response(cool_file, chromosome, start_base, end_base):
    start_bin = start_base // cool_file.binsize

    # matrix() by default applies balance=True, normalizing the entries
    matrix = cool_file.matrix().fetch("%s:%d-%d" % (chromosome, start_base, end_base))
    (num_rows, num_cols) = matrix.shape

    records = []
    for row in range(num_rows):
        for col in range(num_cols):
            counts = matrix[row, col]
            record = {
                "bin1": start_bin + row,
                "bin2": start_bin + col,
                "counts": 0 if isBadFloat(counts) else counts
            }
            records.append(record)

    return json.dumps({"binSize": cool_file.binsize, "records": records})

def select_cool_resolution(cool_file_name, desired):
    subfiles = [cooler.Cooler(cool_file_name + "::" + subfile_name) for subfile_name in cooler.io.ls(cool_file_name)]
    subfiles.sort(reverse=True, key=lambda subfile: subfile.binsize) # Largest binsize to smallest
    found_index = -1
    for i in range(len(subfiles)):
        if subfiles[i].binsize < desired:
            found_index = i
            break

    return subfiles[found_index]

def isBadFloat(number):
    return math.isnan(number) or math.isinf(number)

if __name__ == "__main__":
    # Uncomment the lines below to have this script respond with tracebacks on uncaught exceptions
    #import cgitb
    #cgitb.enable()
    main()
