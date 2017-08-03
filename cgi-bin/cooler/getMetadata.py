#!/usr/bin/env python

import cgi
import cooler
import json

import coolUtils

DEBUG = False # Enabling makes main() reply with text/html containing a stack trace if there is an uncaught exception

def main():
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
    except IOError:
        coolUtils.respond_with_text(404, "No such .cool file stored on this server")
        return

    jsonText = get_json_response(subfiles)
    coolUtils.respond_with_json(jsonText)

def get_json_response(subfiles):
    obj = {
        "binSizes": [subfile.binsize for subfile in subfiles],
        "chromosomes": [
            {"name": name, "numBasePairs": int(length)}
                for (name, length) in zip(subfiles[0].chromnames, subfiles[0].chromsizes)
        ]
    }
    return json.dumps(obj)

if __name__ == "__main__":
    main()
