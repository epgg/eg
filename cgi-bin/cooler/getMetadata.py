#!/usr/bin/env python
"""
API endpoint for getting metadata of Cooler files.  Currently responds with resolutions and chromosome data.

:author: Silas Hsu
:since: version 43.4, August 2017
"""
import sys
import cgi
import cooler
import json

import coolUtils

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
    if file_name is None:
        coolUtils.respond_with_text(400, "Missing required parameter(s)")
        return

    try:
        subfiles = coolUtils.get_subfiles(coolUtils.COOL_DIR + file_name)
    except IOError as e:
        print >> sys.stderr, "getMetadata.py:", e
        coolUtils.respond_with_text(404, "No such .cool file stored on this server")
        return

    jsonText = get_json_response(subfiles)
    coolUtils.respond_with_json(jsonText)

def get_json_response(subfile_list):
    """
    Gets the body of the HTTP response.

    :param subfile_list: (cooler.Cooler[]) list of cooler files
    :returns: string of JSON-compliant data
    """
    obj = {
        "binSizes": [subfile.binsize for subfile in subfile_list],
        "chromosomes": [
            {"name": name, "numBasePairs": int(length)}
                for (name, length) in zip(subfile_list[0].chromnames, subfile_list[0].chromsizes)
        ]
    }
    return json.dumps(obj)

if __name__ == "__main__":
    main()
