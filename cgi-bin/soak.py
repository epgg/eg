#!/usr/bin/python

import cgi
from SOAPpy import WSDL
import sys

# use SOAP to talk to KEGG



wsdl = 'http://soap.genome.jp/KEGG.wsdl'
serv = WSDL.Proxy(wsdl)

print "Content-Type: application/json"
print

#print "{\"jsonkey\":\"value\"}"

form = cgi.FieldStorage()


##### trigger
# search pathway using keyword
if "pathwaykeyword" in form:
	orgCode = form["speciesCode"].value
	raw = serv.bfind("path {0} {1}".format(form["pathwaykeyword"].value, orgCode))
	good = [] # real results
	lst = raw.split("\n")
	if len(lst) > 0:
		for p in lst:
			# pathway id must have organism code
			lst2 = p.split()
			if len(lst2) > 0:
				if lst2[0].startswith("path:"+orgCode):
					good.append(p)
	if len(good) == 0:
		# nothing found
		print "{\"abort\":1}"
		sys.exit()
	print "[" + (",".join(["\""+v+"\"" for v in good])) + "]"
	sys.exit();


####### trigger
# given a pathway identifier
if "pathwayid" in form:
	# try verify if pathway id is valid
	pathid = form["pathwayid"].value
	raw = serv.bget(pathid)
	if raw == "":
		print "{\"abort\":1}"
		sys.exit()
	raw = serv.get_genes_by_pathway(pathid)
	if len(raw) == 0:
		print "{\"abort\":1}"
		sys.exit()
	# convert kegg gene into refseq
	refseq = set()
	raw2 = serv.bconv(' '.join(raw)) # convert kegg genes all at once
	lst = raw2.split('\n')
	if len(lst) == 0:
		print "{\"abort\":1}"
		sys.exit()
	for yy in lst: # for each associated external gene
		lst2 = yy.split('\t')
		if len(lst2) != 3:
			continue
		if lst2[1].startswith("rs"):
			refseq.add(lst2[1].split(':')[1])
	if len(refseq) == 0:
		print "{\"abort\":1}"
		sys.exit()
	print "["+ (",".join(["\""+v+"\"" for v in refseq])) + "]"
	#sys.stderr.write("soak.py: "+','.join(refseq))
	sys.exit()
