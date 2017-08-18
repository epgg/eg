/**************************
	This file is copyrighted, but license is hereby granted for personal,
	academic, and non-profit use.
	Commercial users should contact Xin Zhou xzhou82@gmail.com for permission.
 **************************/

var page_config={
stickynote:true,
app_splinter:true,
app_bbjconfig:{changetknw:{call:menu_changeleftwidth},},
addnewgenome:true,
highlight_color:'rgba(255,255,50,.5)',
cp_oneshot:{htext:washUtag,
	hpadding:'2px 10px',
	hbutt1:{text:'<span style="font-family:Roboto Bold;font-size:120%;font-weight:bold;">g+</span>',
		call:go2googleplus,
		fg:'white',
		bg:'#DD4B39',
		}
	},
cp_session:{htext:'Sessions',
	hbutt1:{text:'&#10005;',call:toggle12},
	hbutt2:{text:'?', call:blog_session,},
	},
cp_bev:{htext:'Genome snapshot',
	hbutt1:{text:'&#10005;',call:toggle18}
	},
cp_findortholog:{htext:'Find orthologs',
	hbutt1:{text:'&#10005;',call:toggle31_1}
	},
cp_hmtk:{htext:'Experimental assay tracks',
	hbutt1:{text:'&#10005;',call:toggle1_2},
	hbutt2:{text:'?', call:blog_facet,},
	},
cp_publichub:{htext:'Public track hubs',
	hbutt1:{text:'&#10005;',call:toggle8_2},
	hbutt2:{text:'?', call:blog_publichub,},
	},
cp_custtk:{htext:'Add new custom tracks',
	hbutt1:{text:'&#10005;',call:toggle7_2},
	hbutt2:{text:'Go back',
		call:custtkpanel_back2control,
		fg:'white',
		bg:'#545454'},
	},
cp_svg:{htext:'Screenshot',
	hbutt1:{text:'&#10005;',call:svgpanelhide}
	},
cp_gsm:{htext:'Gene & region set',
	hbutt1:{text:'&#10005;',call:toggle10},
	hbutt2:{text:'?', call:blog_geneset,},
	},
cp_fileupload:{htext:'File upload',
	hbutt1:{text:'&#10005;',call:toggle27},
	hbutt2:{text:'?', call:blog_fud,},
	},
cp_scatter:{htext:'Scatter plot',
	hbutt1:{text:'&#10005;',call:toggle19},
	hbutt2:{text:'Go back',
		call:scatterplot_goback,
		fg:'white',
		bg:'#545454'},
	},
cp_circlet:{htext:'Circlet plot',
	bg:'rgba(150,180,130,.8)',
	hbutt1:{text:'&#10005;',call:toggle11},
	hbutt2:{},
	hbutt3:{text:'?',call:blog_circlet},
	},
cp_geneplot:{htext:'Gene plot',
	hbutt1:{text:'&#10005;',call:toggle4},
	hbutt2:{text:'Go back',
		call:gp_back2control,
		fg:'white',
		bg:'#545454'},
	},
cp_validhub:{htext:'Validate datahub',
	hbutt1:{text:'&#10005;',call:toggle29},
	},
cp_navregion:{htext:'Navigate regions',
	hpadding:'2px 10px',
	headerzoom:0.8,
	bg:'rgba(150,180,130,.8)',
	hbutt1:{text:'&#10005;',call:toggle30},
	hbutt2:{text:'PREV',call:navregion_prev},
	hbutt3:{text:'NEXT',call:navregion_next},
}
};

function go2googleplus() {window.open('http://epigenomegateway.wustl.edu/+');}

var genome_config={gsm:true,custom_track:true};


var browser=null; // the "main panel" browser object, as a global variable

var floatingtoolbox;

var appbutt;


/* key: gf name
val: {}
  label: 'print name'
  parent: might be undefined, use 'parent' in decorInfo to check
  grp: group id (-1 for custom track)
  ft:
  hasStruct: 0/1
  queryUrl: directly append gene name after it
  mode: M_mode
  tksentry: used as a hook to this track's <td> element in track selection panel

serves as registry for all decor tracks (bigbed and bigwig)
when a custom bigbed is uploaded, it will be in there
even if the track is closed, it shall not be removed
only if it is explicitly removed by user, shall its record be removed from here
 */


var stickynote = {'number':0};


/***  flags   ***/
var helpmsgshowing = false;
var sortTrackIdx = 0;
var currentPathway; // kegg pathway ID currently been displayed
var mdnotooltip = false; // don't pop up tooltip when dragging metadata color block

var urlparamhelp='<a href=http://wiki.wubrowse.org/URL_parameter target=_blank>help&#8599;</a>';




/* age-old, generic operations on DOM elements */
function checkChildRadio(event) { // not used?
    event.target.childNodes[0].checked = true;
}
function copylst_childnodes(domobj) {
    var lst = [];
    for(var i=0; i<domobj.childNodes.length; i++)
        lst.push(domobj.childNodes[i]);
    return lst;
}
function getClass_by_radioName(what) {
    var lst = document.getElementsByName(what);
    for(var i=0; i<lst.length; i++) {
	if(lst[i].checked) return lst[i].className;
    }
    fatalError("None of the options were checked for radio button "+what);
}


/***************************
  small targeted functions 
 ***************************/

function toggleNextSibling(event) {
    var bait=event.target.nextSibling;
    bait.style.display= bait.style.display=='none' ? 'block' : 'none';
}
function toggleNextSibling2(event) {
    var bait=event.target.nextSibling.firstChild;
    bait.style.display= bait.style.display=='none' ? 'block' : 'none';
}
function toggle3(event)
{
// genome menu
menu_shutup();
menu.c33.style.display=menu.c34.style.display='block';
menu.c33.firstChild.innerHTML='About '+event.target.title;
menu.c33.genome=event.target.genome;
menu.c34.style.width=event.target.clientWidth-20;
menu_show_beneathdom(0,event.target);
}
function toggle23(event) {
    var d = document.getElementById("zerosdgeneholder");
    if(d.style.display == 'none') {
        event.target.innerHTML = "hide";
	d.style.display = "block";
    } else {
        event.target.innerHTML = "show";
	d.style.display = "none";
    }
}
function toggle24(event) {
    var s1 = document.getElementById("geneplot_s4_h_span");
    var s2 = document.getElementById("geneplot_s4_k_span");
    if(event.target.selectedIndex == 0) {
        s1.style.display = 'inline'
	s2.style.display = 'none'
    } else {
        s1.style.display = 'none'
	s2.style.display = 'inline'
    }
}

/* open manual functions and wrappers */
function openManual(what) {
    // called by clicking question mark sign
    window.open(window.location.href.split('?')[0]+"manual/#"+what);
}
function openManual_customtrack(event) {
    /* jumps to a chapter about one custom track file type
       event.target is ? button, .what is which chapter (cust track type) to go to
     */
    var what = event.target.what;
    if(what == undefined)
        what = "a"; // default is first one whatsoever
    window.open(window.location.href.split('?')[0]+"manual/#b-c-"+what);
}
function openManual_config(event) {
    /* jumps to a chapter, either config or misc functions
       event.target is ? button, .what is which chapter (cust track type) to go to
     */
    var what = event.target.what;
    if(what == undefined)
        what = "a"; // default is first one whatsoever
    window.open(window.location.href.split('?')[0]+"manual/#g-"+what);
}







/*** sukn specific functions ***/


function showgenomelogo(name,force)
{
var d=document.getElementById('genomelogoartholder');
if(!d) return;
if(!force) {
	if(d.childNodes.length>0) return;
}
var obj=gflag.tol_hash[name];
if(obj) {
	d.innerHTML=d.title=obj.commonname+' '+obj.assembly;
	d.style.color=obj.logofontcolor;
	d.genome=obj.assembly;
	d.style.backgroundImage = "url('images/"+obj.commonname+".png')";
}
}

Browser.prototype.__jsonPageinit=function(data)
{
/* private stuff to do after json data is returned
only do during page initiation
*/
showgenomelogo(this.genome.name,false);

//document.getElementById("greetingmsg").innerHTML = data.greeting;
if('serverload' in data) {
	var lst = data.serverload.split(' ');
	print2console('Your host: '+data.hostname,1);
	print2console('Server load: '+lst[lst.length-3]+' '+lst[lst.length-2]+' '+lst[lst.length-1],1);
}


/*** highlight any new changes
bubble.says.innerHTML='<div style="padding:10px;padding-bottom:0px;color:white;font-size:18px;">Click here for Apps</div>';
bubble.sayajax.innerHTML='';
bubble.style.display='block';
var pos=absolutePosition(appbutt);
bubble.style.left=pos[0];
bubble.style.top=pos[1]+appbutt.clientHeight+5;
setTimeout("bubbleHide()",1300);
simulateEvent(appbutt,'mouseover');
setTimeout("simulateEvent(appbutt,'mouseout')", 300);
setTimeout("simulateEvent(appbutt,'mouseover')", 600);
setTimeout("simulateEvent(appbutt,'mouseout')", 900);
***/
}


/*** _private_ ends ***/




function fatalError(brick) { print2console(brick, 3); throw(brick); }




function oneshot(event)
{
/* called by clicking a logo to select a genome from oneshot panel
genome dbname is given by .title
*/
var d=event.target;
while(!d.dbname) d=d.parentNode;
apps.oneshot.main.style.display='none';
var bpm={defaultcontent:true, };
if(!event.target.fastload) {
	bpm.askabouttrack=true;
} else {
	pagecloak.style.display = 'none';
}
if(d.which==1) {
	// start a new browser with this genome
	gflag.browser.loadgenome_initbrowser({
		serverload:true,
		dbname:d.dbname,
		browserparam:bpm,
		genomeparam:genome_config,
		onunknowngenome:on_unknown_genome,
		});
} else if(d.which==3) {
	var s=gflag.browser.hmSpan;
	for(var k in gflag.browser.splinters) {
		s+=gflag.browser.splinters[k].hmSpan;
	}
	add_new_browser({
		genome:d.dbname,
		leftColumnWidth:gflag.browser.leftColumnWidth,
		hmSpan:s,
		stickynote:page_config.stickynote,
		browserparam:bpm,
	});
}
setTimeout("floatingtoolbox.style.display='block'",100);
}


function sukn_bbj_delete()
{
var hh=document.getElementById('additional_genomes_div');
var b=gflag.browser;
hh.removeChild(b.main.parentNode.previousSibling);
hh.removeChild(b.main.parentNode);
b.mcm.holder.parentNode.removeChild(b.mcm.holder);
delete horcrux[b.horcrux];
gflag.browser=undefined;
}

function oneshot_mover(event)
{
var d=event.target;
while(d.className!='oneshot') d=d.parentNode;
d.childNodes[2].style.display='block';
}
function oneshot_mout(event)
{
var d=event.target;
while(d.className!='oneshot') d=d.parentNode;
d.childNodes[2].style.display='none';
}

function tol_makehash(key,val)
{
if(Array.isArray(val)) {
	for(var i=0; i<val.length; i++) {
		var o=val[i];
		gflag.tol_hash[o.assembly]=o;
	}
	return;
}
for(var k in val) {
	tol_makehash(k,val[k]);
}
}
function tol_drawtree(val,holder,context)
{
// if val is object, it should be a list holder, else if an array, should be a list of genome objects
if(Array.isArray(val)) {
	var organism2td={}; // key: major assembly, val: hole for minor assemblies
	for(var i=0; i<val.length; i++) {
		// the .title is used to provide dbname when clicked
		var v=val[i];
		if(!v.ismajor) continue;
		var tr=holder.insertRow(-1);
		var td=tr.insertCell(0);
		var d = dom_create('div',td);
		d.dbname=v.assembly;
		d.className = 'oneshot';
		d.addEventListener('click', oneshot, false);
		d.addEventListener('mouseover',oneshot_mover,false);
		d.addEventListener('mouseout',oneshot_mout,false);
		d.which=context;
		var img=dom_create('img',d);
		img.src='images/'+v.commonname+'.png';
		var d3 = dom_create('div',d,'color:'+v.logofontcolor);
		d3.innerHTML=v.commonname+' <i>'+v.assembly+'</i>';
		var d4=dom_create('div',d);
		d4.innerHTML='Quick';
		d4.title='Do not load default experimental assay tracks';
		d4.fastload=true; // for event
		organism2td[v.assembly]=tr.insertCell(1);
	}
	// put minor genomes into holes following their major guys
	for(i=0; i<val.length; i++) {
		var v=val[i];
		if(v.ismajor) continue;
		var d=dom_create('div', organism2td[v.major],'display:inline-block;margin-right:3px;',{c:'header_gr',t:v.assembly,clc:oneshot});
		d.dbname=v.assembly;
		d.which=context;
	}
	return;
}
// new level
var lst=[];
for(var k in val) {
	lst.push(k);
}
var h=make_tablist({lst:lst,tabpadding:10});
h.style.marginTop=0;
holder.appendChild(h);
holder.parentNode.style.paddingTop=0;
for(var i=0; i<lst.length; i++) {
	tol_drawtree(val[lst[i]],h.holders[i],context);
}
}


function oneshotDialog(which,msg)
{
/* this is one shot, 
fires up the oneshot dialog when the browser needs user to make some choice to start properly
args: which
  1: show dblst to start browser
  2: show saved status under a session
  3. show dblst for adding new bbj
msg: an additional message to be printed on oneshot panel, warning or further instruction
*/
cloakPage();
panelFadein(apps.oneshot.main,100,70);
var d2=apps.oneshot.message;
if(msg == null) {
	d2.style.display = 'none';
} else {
	d2.style.display = 'block';
	d2.innerHTML = msg;
}
floatingtoolbox.style.display='none';
var header=apps.oneshot.header;
switch(which) {
case 2: // list status under a session
	header.innerHTML = 'Click <span class=header_g>name</span> to restore session';
	var d=apps.oneshot;
	d.main.style.left = (document.body.clientWidth-d.clientWidth)/2;
	d.main.style.top = (document.body.clientHeight-d.clientHeight)/2;
	return;
case 1:
case 3:
	header.innerHTML='Select a genome';
	stripChild(apps.oneshot.belly, 0);
	var treeh=dom_create('div',apps.oneshot.belly); // tree holder
	tol_drawtree(gflag.dblst,treeh,which);
	treeh.style.paddingTop=10;
	return;
default: fatalError('oneshotDialog: unknown which');
}
/*over*/
}


function __tklst() {
	var lst=[];
	for(var i=0; i<browser.tklst.length; i++) lst.push(browser.tklst[i].name);
	return lst.join(',');
}


function on_unknown_genome(_w)
{
var what=_w;
let paramsObj = {
	load_dblst: "on"
}
browser.ajax(paramsObj,function(data){
	if(!data) fatalError('Server crashed while trying to load dblst.');
	gflag.dblst=data.dblst;
	oneshotDialog(1, 'Unknown genome name: '+what);
});
}

function sukn_resource(event)
{
menu_shutup();
stripChild(menu.c31,0);
dom_create('div',menu.c31,'margin:15px;',{t:'<a href=http://wiki.wubrowse.org target=_blank>Wiki</a>'});
dom_create('div',menu.c31,'margin:15px;',{t:'Community: <span class=header_r onclick="window.open(\'https://plus.google.com/u/0/communities/104985851965529755092\')">google+</span> <span class=header_b onclick="window.open(\'https://www.facebook.com/WashUEpiGenomeBrowser\')">facebook</span>'});
dom_create('div',menu.c31,'margin:15px;',{t:'<a href=http://epigenomegateway.wustl.edu/browser/roadmap/ target=_blank>Roadmap EpiGenome Browser</a>'});
menu.c31.style.display='block';
menu_show_beneathdom(0,event.target);
}


Browser.prototype.sukn_init=function(data, uph, re)
{
if(!data) {
	alert('Sorry! Please try again.');
	return;
}
if(data.abort) {
	alert(data.abort);
	return;
}
if(!data.dblst) {
	alert('dblst missing');
	return;
}
gflag.dblst=data.dblst;
gflag.tol_hash={};
for(var k in gflag.dblst) {
	tol_makehash(k,gflag.dblst[k]);
}
if(re==0) {
	// no parameter
	oneshotDialog(1);
	return;
}
var garbled=re==-1;
if(garbled) {
	oneshotDialog(1, 'Garbled URL parameter '+urlparamhelp);
	return;
}
if(!uph.genome) {
	oneshotDialog(1, 'Missing genome name '+urlparamhelp);
	return;
}

print2console('Parsing URL parameters...',0);
var browser_param={};

/** fill urlparam into above hash **/
if('defaultcontent' in uph) {
	browser_param.defaultcontent=true;
}

if('session' in uph) {
	browser_param.session=uph.session;
	if('statusid' in uph) {
		var i=parseInt(uph.statusid);
		if(!isNaN(i) && i>0) {
			browser_param.statusId=i;
		}
	}
}
if('metadata' in uph) {
	print2console('The URL parameter "metadata" is not supported at the moment',2);
}
if('geneset' in uph) {
	browser_param.geneset_rawstring=uph.geneset;
} else {
	// gene set not in use, see other ways to determine dsp
	if('coordinate' in uph) {
		// coordinate will be validated after genome obj is ready
		browser_param.coord_rawstring=uph.coordinate;
	}
	if('juxtapose' in uph) {
		browser_param.juxtapose_rawstring=uph.juxtapose;
		if('juxtaposecustom' in uph) {
			browser_param.juxtaposecustom=true;
		}
	}
}
if('datahub' in uph) {
	browser_param.datahub_json=uph.datahub;
}
if('datahub_jsonfile' in uph) {
	browser_param.datahub_json=uph.datahub_jsonfile;
}
if('datahub_json' in uph) {
	browser_param.datahub_json=uph.datahub_json;
}
if('datahub_ucsc' in uph) {
	browser_param.datahub_ucsc=uph.datahub_ucsc;
}
if('publichub' in uph) {
	browser_param.publichubloadlst=uph.publichub.split(',');
}
if('forceshowall' in uph) {
	browser_param.forceshowallhubtk=true;
}
if('tknamewidth' in uph) {
	var a=parseInt(uph.tknamewidth);
	if(isNaN(a) || a<=0) {
		print2console('Invalid value for tknamewidth, must be positive integer',2);
	} else {
		this.leftColumnWidth=a;
	}
}
if('gftk' in uph) {
	/* native bed/qdecor/longrange: name, mode
	notice: longrange has been deemed as assay track and registered in genome.hmtk
	but native longrange are still supplied from "gftk"
	TODO native sam?
	*/
	var lst=uph.gftk.split(',');
	if(!browser_param.native_track) browser_param.native_track=[];
	var wrg=false;
	for(var i=0; i<lst.length; i+=2) {
		if(lst[i] && lst[i+1]) {
			var m=decormodestr2num(lst[i+1]);
			if(m!=undefined) {
				if(m==M_hide) {
					print2console('Please do not use "hide" for display mode',2);
				} else {
					browser_param.native_track.push({name:lst[i],mode:m});
				}
			} else {wrg=true;}
		} else {wrg=true;}
	}
	if(wrg) print2console('Something wrong with value of URL parameter "gftk" '+urlparamhelp,2);
}
var str;
if(uph.bedgraph) str=uph.bedgraph;
if(uph.custombedgraph) str=uph.custombedgraph;
if(str) {
	// label, url
	var lst = str.split(',');
	var _t=[];
	var wrg=false;
	for(var i=0; i<lst.length; i+=2) {
		if(lst[i] && lst[i+1]) {
			_t.push({label:decodeURIComponent(lst[i]),url:lst[i+1],ft:FT_bedgraph_c,mode:M_show});
		} else {wrg=true;}
	}
	browser_param.tklst=_t;
	if(wrg) print2console('Something wrong with value of URL parameter "bedgraph" '+urlparamhelp,2);
}
str=null;
if(uph.bigwig) str=uph.bigwig;
if(uph.custombigwig) str=uph.custombigwig;
if(str) {
	// label, url
	var lst = str.split(',');
	if(!browser_param.tklst) browser_param.tklst=[];
	var wrg=false;
	for(var i=0; i<lst.length; i+=2) {
		if(lst[i] && lst[i+1]) {
			browser_param.tklst.push({label:decodeURIComponent(lst[i]),url:lst[i+1],ft:FT_bigwighmtk_c,mode:M_show});
		} else {wrg=true;}
	}
	if(wrg) print2console('Something wrong with value of URL parameter "bigwig" '+urlparamhelp,2);
}
if('customcategorical' in uph) {
	/* multiple tk separated by semicolon
	label, url, id1, name1, color1, id2, name2, color2, ...
	*/
	var lst=uph.customcategorical.split(';');
	if(!browser_param.tklst) browser_param.tklst=[];
	var wrg=false;
	for(var i=0; i<lst.length; i++) {
		var lst2=lst[i].split(',');
		if(lst2[0] && lst2[1]) {
			var cateinfo={};
			for(var j=2; j<lst2.length; j+=3) {
				cateinfo[lst2[j]]=[lst2[j+1],lst2[j+2]];
			}
			browser_param.tklst.push({label:decodeURIComponent(lst2[0]),url:lst2[1],ft:FT_cat_c,mode:M_show,cateInfo:cateinfo});
			gflag.customtkpending[lst2[1]]={cateInfo:cateinfo};
		} else {wrg=true;}
	}
	if(wrg) print2console('Something wrong with value of URL parameter "customcategorical" '+urlparamhelp,2);
}
str=null;
if(uph.bed) str=uph.bed;
if(uph.custombed) str=uph.custombed;
if(str) {
	// label, url, mode, not including longrange
	var lst = str.split(',');
	if(!browser_param.tklst) browser_param.tklst=[];
	var wrg=false;
	for(var i=0; i<lst.length; i+=3) {
		if(lst[i] && lst[i+1] && lst[i+2]) {
			var m=decormodestr2num(lst[i+2]);
			if(m!=undefined) {
				if(m==M_hide) {
					print2console('Please do not use "hide" for display mode',2);
				} else {
					browser_param.tklst.push({label:decodeURIComponent(lst[i]),url:lst[i+1],ft:FT_bed_c,mode:m});
				}
			} else {wrg=true;}
		} else {wrg=true;}
	}
	if(wrg) print2console('Something wrong with value of URL parameter "bed" '+urlparamhelp,2);
}
str=null;
if(uph.longrange) str=uph.longrange;
if(uph.customlongrange) str=uph.customlongrange;
if(str) {
	// label, url, mode
	var lst = str.split(',');
	if(!browser_param.tklst) browser_param.tklst=[];
	var wrg=false;
	for(var i=0; i<lst.length; i+=3) {
		if(lst[i] && lst[i+1] && lst[i+2]) {
			var m=decormodestr2num(lst[i+2]);
			if(m==undefined) {
				wrg=true;
			} else {
				if(m==M_hide) {
					print2console('Please do not use "hide" for display mode',2);
				} else {
					browser_param.tklst.push({label:decodeURIComponent(lst[i]),url:lst[i+1],ft:FT_lr_c,mode:m,qtc:{pfilterscore:2,nfilterscore:-2}});
				}
			}
		} else {wrg=true;}
	}
	if(wrg) print2console('Something wrong with value of URL parameter "longrange" '+urlparamhelp,2);
}
str=null;
if(uph.bam) str=uph.bam;
if(uph.custombam) str=uph.custombam;
if(str) {
	// label, url, mode
	var lst = str.split(',');
	if(!browser_param.tklst) browser_param.tklst=[];
	var wrg=false;
	for(var i=0; i<lst.length; i+=3) {
		if(lst[i] && lst[i+1] && lst[i+2]) {
			var m=decormodestr2num(lst[i+2]);
			if(m==undefined) {wrg=true;}
			else {
				if(m==M_hide) {
					print2console('Please do not use "hide" for display mode',2);
				} else {
					browser_param.tklst.push({label:decodeURIComponent(lst[i]),url:lst[i+1],ft:FT_bam_c,mode:m});
				}
			}
		} else { wrg=true; }
	}
	if(wrg) print2console('Something wrong with value of URL parameter "bam" '+urlparamhelp,2);
}
if('hammock' in uph) {
	// label, url, mode
	var lst = uph.hammock.split(',');
	if(!browser_param.tklst) browser_param.tklst=[];
	var wrg=false;
	for(var i=0; i<lst.length; i+=3) {
		if(lst[i] && lst[i+1] && lst[i+2]) {
			var m=decormodestr2num(lst[i+2]);
			if(m==undefined) {wrg=true;}
			else {
				if(m==M_hide) {
					print2console('Please do not use "hide" for display mode',2);
				} else {
					browser_param.tklst.push({label:decodeURIComponent(lst[i]),url:lst[i+1],ft:FT_anno_c,mode:m});
				}
			}
		} else { wrg=true; }
	}
	if(wrg) print2console('Something wrong with value of URL parameter "hammock" '+urlparamhelp,2);
}
if('genomealign' in uph) {
	// genome, url
	var lst=uph.genomealign.split(',');
	browser_param.weaver_raw=[];
	for(var i=0; i<lst.length; i+=2) {
		if(lst[i] && lst[i+1]) {
			browser_param.weaver_raw.push({query:lst[i],url:lst[i+1]});
		}
	}
}
if('splinters' in uph) {
	var lst=uph.splinters.split(',');
	var lst2=[];
	for(var i=0; i<lst.length; i++) {
		if(lst[i].length>0) {
			lst2.push(lst[i]);
		}
	}
	if(lst2.length==0) {
		print2console('Wrong value of URL parameter "splinters"',2);
	} else {
		browser_param.splinters=lst2;
	}
}

// load genome and browser
var param={
	loaddblst:true,
	dbname:uph.genome,
	browserparam:browser_param,
	genomeparam:genome_config,
	onunknowngenome:on_unknown_genome,
	serverload:true,
	};
this.loadgenome_initbrowser(param);
}


// READY
function readygo()
{
/* no argument, will be called only once upon loading browser for first time

handles url parameter
if there's no proper url parameter, will pop up oneshot dialog for choosing genome
*/
var d=document.getElementById('washucuddle');
d.innerHTML=washUtag;
dom_create('div',d,'position:absolute;top:0px;right:5px;font-weight:normal;font-size:10px;font-style:italic;').innerHTML='v'+washUver;

document.body.addEventListener('keyup',page_keyup,false);

page_makeDoms(page_config);
// add genome menu
menu.c32=dom_create('div',menu);
//menu_addoption();


browser=new Browser();
gflag.browser=browser;

var mholder=document.getElementById('sukn_main');
//mholder.parentNode.style.backgroundColor=colorCentral.pagebg;

/* decide hmSpan
the  is a guess of default width of mdcholder.holder,
will be determined by # terms shown on default
 */
browser.leftColumnWidth=110;
/* parse url parameter
*/
var uph={};
var re=parseUrlparam(uph);
var tkWidth=0;
if('tkwidth' in uph) {
	var a=parseInt(uph.tkwidth);
	if(isNaN(a) || a<=0 || a <800) {
		print2console('Invalid value for tkwidth, must be positive integer >= 800',2);
	} else {
		tkWidth=a;
	}
}
if (tkWidth==0){
    browser.init_hmSpan();
} else {
    browser.hmSpan=tkWidth;
}
browser.browser_makeDoms({
	centralholder:mholder,
	mintkheight:10,
	header:{
		padding:'0px 0px 10px 0px',
		fontsize:'normal',
		zoomout:[['&#8531;',0.3],[1,1],[5,5]],
		dspstat:{allowupdate:true},
		resolution:true,
		utils:{track:{},
			apps:true,bbjconfig:true},
		},
	navigator:true,
	navigator_ruler:true,
	hmdivbg:'white',
	ghm_scale:true,
	ghm_ruler:true,
	tkheader:true,
	mcm:true,
	gsv:true,
	gsselect:true,
	facet:true,
	tab_facet:true,
	});

if(page_config.stickynote)
	browser.ideogram.canvas.oncontextmenu=menu_coordnote;

browser.mcm.holder.attop = true; // tells if holder be placed on top or bottom of mcm

browser.applyHmspan2holders();

/* following are stuff belonging to "page", shared by all browser instances */

scalebarbeam=document.getElementById('scalebarbeam');
scalebarMout();

//drawCorrscalecanvas();

floatingtoolbox = document.getElementById("floatingtoolbox");
msgconsole = document.getElementById("msgconsole");

simulateEvent(document.getElementById('geneplotrender'),'change');

var bbj=browser;
let paramsObj = {
	load_dblst: "on"
}
browser.ajax(paramsObj,function(data){bbj.sukn_init(data, uph, re);});
}
