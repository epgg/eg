import cooler

COOL_DIR = "???"

def get_subfiles(cool_file_path):
    return [cooler.Cooler(cool_file_path + "::" + subfile_name) for subfile_name in cooler.io.ls(cool_file_path)]

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

def respond_with_json(jsonText):
    print "Content-Type: application/json"
    print "Content-Length:", len(jsonText)
    print ""
    print jsonText
