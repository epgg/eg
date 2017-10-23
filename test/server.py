import SimpleHTTPServer
import SocketServer
import os

PORT = 8000

os.chdir("..")

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "Browse to tests at http://localhost:%d/test/testRunner.html" % PORT
httpd.serve_forever()
