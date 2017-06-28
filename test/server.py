import SimpleHTTPServer
import SocketServer
import os

PORT = 8000

os.chdir("..")

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()

