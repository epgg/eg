var errmsg='<div style="font-weight:bold;margin:10px;"><span style="color:red">Error!</span> ';
var host='http://epgg-test.wustl.edu/browser/';


function plugin_washugb(param)
{
if(!param.container) {
	alert('Making browser plugin: missing container');
	return;
}
if(!param.host) {
	param.container.innerHTML=errmsg+'No host given.</div>';
	return;
}
if(!param.genome) {
	param.container.innerHTML=errmsg+'No genome specified.</div>'
	return;
}
/* check if base.js has been loaded
{
	var h=document.getElementsByTagName('head')[0];
	var notloaded=true;
	for(var i=0; i<h.childNodes.length; i++) {
		var t=h.childNodes[i];
		if(t.type=='text/javascript' && t.src==host+'base.js') {
			notloaded=false;
			break;
		}
	}
	if(notloaded) {
		param.container.innerHTML='Loading external javascript...';
		var s=document.createElement('link');
		s.setAttribute('type','text/javascript');
		s.setAttribute('src',host+'base.js');
		h.appendChild(s);
		s=document.createElement('link');
		s.setAttribute('type','text/javascript');
		s.setAttribute('src',host+'personality.js');
		h.appendChild(s);
	}
}
*/


// TODO need to check genome name

gflag.cors_host=param.host;
gflag.is_cors=true;

page_makeDoms({
	app_bbjconfig:true,
	cp_custtk:{htext:'not shown'},
});
var bbj=new Browser();
bbj.leftColumnWidth=param.leftSpaceWidth?Math.max(50,param.leftSpaceWidth):80;
bbj.hmSpan=param.panelWidth?Math.max(500,param.panelWidth):800;
bbj.browser_makeDoms({
centralholder:param.container,
tkheader:param.hideTrackName?false:true,
navigator:param.hideChromNavigator?false:true,
ghm_ruler:param.hideTopRuler?false:true,
mcm:param.hideMetadataColormap?false:true,
header:{
	padding:2,
	zoomout:[[1,1],[5,5]],
	dspstat:{allowupdate:true},
	resolution:true,
	utils:{
		bbjconfig:true,
		'delete':delete_bbjpanel,
		},
	},
});
bbj.applyHmspan2holders();

var browser_param={};
if(!('noDefaultTrack' in param)) {
	browser_param.defaultcontent=true;
}
if('bed' in param) {
	browser_param.tklst=[];
	for(var i=0; i<param.bed.length; i++) {
		var t=param.bed[i];
		if(t.label && t.url && t.mode) {
			var m=decormodestr2num(t.mode);
			if(m!=undefined) {
				t.mode=m;
				t.ft=FT_bed_c;
				browser_param.tklst.push(t);
			}
		}
	}
}
if('bigwig' in param) {
	if(!browser_param.tklst) browser_param.tklst=[];
	for(var i=0; i<param.bigwig.length; i++) {
		var t=param.bigwig[i];
		if(t.label && t.url) {
			t.mode=M_show;
			t.ft=FT_bigwighmtk_c;
			browser_param.tklst.push(t);
		}
	}
}
if('bedgraph' in param) {
	if(!browser_param.tklst) browser_param.tklst=[];
	for(var i=0; i<param.bedgraph.length; i++) {
		var t=param.bedgraph[i];
		if(t.label && t.url) {
			t.mode=M_show;
			t.ft=FT_bedgraph_c;
			browser_param.tklst.push(t);
		}
	}
}
if('bam' in param) {
	if(!browser_param.tklst) browser_param.tklst=[];
	for(var i=0; i<param.bam.length; i++) {
		var t=param.bam[i];
		if(t.label && t.url && t.mode) {
			var m=decormodestr2num(t.mode);
			if(m!=undefined) {
				t.mode=m;
				t.ft=FT_bam_c;
				browser_param.tklst.push(t);
			}
		}
	}
}
if('longrange' in param) {
	if(!browser_param.tklst) browser_param.tklst=[];
	for(var i=0; i<param.longrange.length; i++) {
		var t=param.longrange[i];
		if(t.label && t.url && t.mode) {
			var m=decormodestr2num(t.mode);
			if(m!=undefined) {
				t.mode=m;
				t.ft=FT_lr_c;
				t.qtc={pfilterscore:0,nfilterscore:0};
				browser_param.tklst.push(t);
			}
		}
	}
}

bbj.loadgenome_initbrowser({
	dbname:param.genome,
	browserparam:browser_param,
	genomeparam:{custom_track:true},
	});
/*over*/
}

function __jsonPageinit(){return;}
function delete_bbjpanel()
{
var b=gflag.browser;
if(b.mcm) document.body.removeChild(b.mcm.holder);
b.main.parentNode.removeChild(b.main);
delete horcrux[b.horcrux];
}
