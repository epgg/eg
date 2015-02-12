import sys
import string
import urllib

if len(sys.argv)!=2:
	print 'Usage: <input ucsc file URL>, writes json to stdout, error to stderr'
	sys.exit()


''' example input:
hub file: http://bioinformatics.sdstate.edu/datasets/2012-NAT/hub.txt
trackDb: http://bioinformatics.sdstate.edu/datasets/2012-NAT/hg19/trackDB2.txt
'''

huburl=sys.argv[1]
lst=huburl.split('/')
if len(lst)<4:
	sys.stderr.write('abort:"wrong URL of UCSC hub file",')
	sys.exit()

baseurl='/'.join(lst[:-1])+'/'

try:
	f=urllib.urlopen(huburl)
except:
	sys.stderr.write('abort:"Failed to read UCSC hub file by given URL",')
	sys.exit()

# test to see if given file is hub or trackDb
line=''
while len(line)==0:
	line=f.readline().rstrip()

tag=line.split()[0]
if tag=='hub':
	# is a hub file
	gf=None
	for line in f:
		lst=line.rstrip().split()
		if lst[0]=='genomesFile':
			gf=lst[1]
			break
	f.close()
	if gf is None:
		sys.stderr.write('abort:"cannot read genomesFile from this hub",')
		sys.exit()
	gf=baseurl+gf
	hublst=[]
	try:
		f2=urllib.urlopen(gf)
	except:
		sys.stderr.write('abort:"genome file missing: '+gf+'",');
		sys.exit()
	for line in f2:
		line=line.strip()
		if len(line)==0: continue
		lst=line.split()
		if lst[0]=='genome':
			hublst.append([lst[1]])
		else:
			hublst[-1].append(baseurl+lst[1])
	sys.stderr.write('lst:[')
	for x in hublst:
		sys.stderr.write('["{0}","{1}"],'.format(x[0],x[1]))
	sys.stderr.write('],');
	sys.exit()
elif tag!='track':
	sys.stderr.write('abort:"weird input file: neither hub nor trackDb, what is it??",')
	sys.exit()

# parse it as a trackDb file
#f.seek(0)

tk2visible={} # key: tkname, val: visibility string

hasmd=False
vocabulary={}
termname={}
height=0

tkname=None
label=None
color=None
tktype=None
tkurl=None
mdanno=[]
parent=None

skipcount=0
acceptcount=0

print '['

def output():
	if tkurl is None: return
	if tktype is None: return
	t=tktype.lower()
	if t!='bigwig' and t!='bam': return
	print '{{type:"{0}",url:"{1}",'.format(t,tkurl)
	if label is not None:
		print 'name:"{0}",'.format(label.replace(',',''))
	if t=='bigwig':
		if color is not None:
			print 'colorpositive:"{0}",'.format(color)
	if height!=0:
		print 'height:'+str(height)+','
	vstr=None
	if tkname in tk2visible:
		vstr=tk2visible[tkname]
	else:
		if (parent is not None) and (parent in tk2visible):
			vstr=tk2visible[parent]
	if vstr is None:
		print 'mode:"hide",'
	else:
		print 'mode:"'+vstr+'",'
	if len(mdanno)>0:
		print 'custom_annotation:[{0}],'.format(','.join(['"'+x+'"' for x in mdanno]))
	print '},'
	global acceptcount
	acceptcount+=1


pendingline=None
for line in f:
	line=line.strip()

	if len(line)==0:
		output()
		# reset
		tkname=None
		label=None
		color=None
		tktype=None
		tkurl=None
		parent=None
		mdanno=[]
	else:
		if line[-1]=='\\':
			if pendingline is None:
				pendingline=line[:-1]
			else:
				pendingline+=line[:-1]
			continue
		else:
			if pendingline is not None:
				line=pendingline+line
				pendingline=None
		lst=line.split()
		if len(lst)>1:
			if lst[0]=='subGroup1' or lst[0]=='subGroup2' or lst[0]=='subGroup3' or lst[0]=='subGroup4':
				if len(lst)<4: continue
				if lst[1]!=lst[2]:
					termname[lst[1]]=lst[2]
				thislst=[]
				if lst[1] in vocabulary:
					thislst=vocabulary[lst[1]]
				else:
					vocabulary[lst[1]]=thislst
				for i in range(3,len(lst)):
					tmp=lst[i].split('=')
					if len(tmp)!=2: continue
					if tmp[0]!=tmp[1]:
						termname[tmp[0]]=tmp[1]
					thislst.append(tmp[0])
				hasmd=True
			elif lst[0]=='subGroups':
				for i in range(1,len(lst)):
					tmp=lst[i].split('=')
					if len(tmp)!=2: continue
					mdanno.append(tmp[1])
			elif lst[0]=='bigDataUrl':
				l2=lst[1].split('/')
				if l2[0]=='http:':
					tkurl=lst[1]
				elif l2[0]=='https:':
					skipcount+=1
				else:
					tkurl=baseurl+lst[1]
			elif lst[0]=='shortLabel':
				label=' '.join(lst[1:])
			elif lst[0]=='longLabel':
				label=' '.join(lst[1:])
			elif lst[0]=='color':
				color='rgb('+lst[1]+')'
			elif lst[0]=='track':
				tkname=lst[1]
			elif lst[0]=='visibility':
				tk2visible[tkname]=lst[1]
			elif lst[0]=='type':
				tktype=lst[1]
			elif lst[0]=='parent':
				parent=lst[1]
			elif lst[0]=='maxHeightPixels':
				tmp=lst[1].split(':')
				if len(tmp)==3:
					height=int(tmp[1])

output()

if hasmd:
	print '{type:"metadata",vocabulary:{'
	for x in vocabulary:
		print '{0}:[{1}],'.format(x,','.join(['"'+y+'"' for y in vocabulary[x]]))
	print '},termname:{'
	for x in termname:
		print '"{0}":"{1}",'.format(x,termname[x])
	print '}}'

print ']'
sys.stderr.write('trackdbparsed:true,acceptnum:{0},rejectnum:{1},'.format(acceptcount,skipcount))
