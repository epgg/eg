"""
Common functions for the Cooler-related CGI scripts.

:author: Silas Hsu
:since: version 43.4, August 2017
"""

import cooler
import os

COOL_DIR = "???"

def get_subfiles(cool_file_path):
    """
    Opens all valid cool files under a file's data hierarchy and returns them in a list.  The file must be located in
    COOL_DIR; otherwise, IOError will be thrown.

    :param cool_file_path: (string) the full file path
    :returns: (cooler.Cooler[]) list of Cooler files
    :raises IOError: if the input file path is not located in COOL_DIR
    """
    if os.path.commonprefix([os.path.realpath(cool_file_path), COOL_DIR]) != COOL_DIR:
        raise IOError("Directory traversal detected")
    return [cooler.Cooler(cool_file_path + "::" + subfile_name) for subfile_name in cooler.io.ls(cool_file_path)]

def respond_with_text(code, text):
    """
    Prints out a HTTP response with plaintext body.  Response code is also customizable.

    :param code: (number) the HTTP status code to print in the header
    :param text: (anything) the content of the body
    """
    more_description = ""
    if code == 400:
        more_description = "Bad Request"
    if code == 404:
        more_description = "Not Found"
    print "Status:", code, more_description
    print "Content-Type: text/plain"
    print ""
    print text

def respond_with_json(jsonText):
    """
    Prints out a HTTP response with JSON body.  Also includes a header directing client cache behavior.

    :param jsonText: (string) the content of the body
    """
    print "Content-Type: application/json"
    print "Content-Length:", len(jsonText)
    print "Cache-Control: max-age=%d" % (60 * 30) # One half hour
    print ""
    print jsonText
