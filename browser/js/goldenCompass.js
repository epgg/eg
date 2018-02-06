/********************************************
        goldenCompass, shares some fantastic attributes with subtleKnife
  modify content here to port it for other applications
 *********************************************/
var genomeName='hg19';
var defaultSpnum=600;
var showContent=[
['Cell Lines',[
	{sample:11102}, // hES-I3 #E34
	{sample:11103}, // ES WA-7 #E35
	{sample:11101}, // H1 #E10
	{sample:11311}, // H1_BMP4_Derived_Mesendoderm_Cultured_Cells #E50
	{sample:11312}, // H1_BMP4_Derived_Trophoblast_Cultured_Cells #E07
	{sample:11104}, // H9 #E11
	{sample:11310}, // IMR90 #E12
	{sample:11207}, // iPS-18a #E39
	{sample:11208}, // iPS-18b
	{sample:11209}, // iPS-18c
	{sample:11205}, // iPS-20b #E40
	{sample:11216}, // iPS DF 6.9 #E14
	{sample:11213}, // iPS DF 19.11 #E13
	{sample:11313}, // H1_Derived_Mesenchymal_Stem_Cells #E08
	{sample:11309}, // H1_Derived_Neuronal_Progenitor_Cultured_Cells #E09
	{sample:11317}, // hESC_Derived_CD184+_Endoderm_Cultured_Cells #E38
	{sample:11107}, // HUES64
	{sample:11323}, // hESC_Derived_CD56+_Mesoderm_Cultured_Cells
	],
],
['Primary Cells',[
	{sample:13005, // breast myoepithelial
		donors:[40014,40013]},
	{sample:13007}, // RM035 vHEMC
	{sample:13022, // CD3
		donors:[40153,40141,40143,40055,40056,40018,40019]},
	{sample:13028, // CD19
		donors:[40194,40106,40054,40016,40017,40064,40053]},
	{sample:13019, // CD34
		donors:[40107,40059,40062,40060,40027,40026]},
	{sample:13020, // CD4
		donors:[40048,40174,40160,40028,40120,40121,40122,40114]},
	{sample:13021, // CD8 naive
		donors:[40174,40160,40120,40121,40122,40039,40114]},
	{sample:13023, // mobilized CD34
		donors:[40022,40021,40024,40023,40077]},
	{sample:13033}, // neurosphere cultured cells, cortex derived #E51
	{sample:13031}, // neurosphere cultured cells, ganglionic eminence derived #41
	{sample:13144, //Penis Foreskin Fibroblast Primary Cells
		donors:[40051,40124]},
	{sample:13035, //Penis Foreskin Keratinocyte Primary Cells
		donors:[40124,40226]},
	{sample:13145, //Penis Foreskin Melanocyte Primary Cells
		donors:[40051,40124,40226]},
	]
],
['Primary Tissue',[
    {sample:13010}, //adult liver
	{sample:13155}, // Brain Germinal Matrix HuFGM02 #E24
	{sample:13042}, // Brain_Hippocampus_Middle 150 #E25
	{sample:13042}, // Brain_Hippocampus_Middle 149 #E25
	{sample:13014}, // Colonic_Mucosa 32 #E32
	{sample:12003, // fetal brain
		donors:[40012,40115,40116]},
	{sample:12006, // fetal heart
		donors:[40031,40080]},
	{sample:12067}, // small intestine, fetal day108 M H-23769
	{sample:13015, // rectal mucosa
		donors:[40041,40042]},
	{sample:13003, // Skeletal_Muscle
		donors:[40045,40046]},
	{sample:13002}, // stomach smooth muscle 28 #E49
	{sample:13212}, // Adrenal_Gland STL003
	{sample:13217}, // Aorta STL003
	{sample:13216}, // Esophagus STL003
	{sample:13215}, // Gastric STL003
	{sample:13210, // Left_Ventricle
		donors:[40272,40216]},
	{sample:13208}, // Pancreas STL003
	{sample:13211}, // Right_Atrium STL003
	{sample:13213}, // Sigmoid_Colon STL003
	{sample:13207, // Small_Intestine STL001
		donors:[40272,40216]},
	{sample:13205}, // Spleen STL003
	{sample:13171, // Pancreatic Islets
		donors:[40038,40050]},
]],
];
var defaultDecors=['refGene','rmsk_ensemble'];
var defaultRegion=['chr7', 27025064,27448390];
var defaultMd=['DNA Methylation','Histone Mark',23001,27004];
var defaultHmtkgridRows='Sample';
var defaultHmtkgridColumns='Assay'; // set to undefined for list display
// TODO which dataset to load

var pillar;
/* provides the genome object which is shared by all panels
*/
var Panels=[];
/* each ele is {}
grpidx:
sampleidx:
bbj: Browser object
pidx: panel array idx
*/



function pane_mouseover(event)
{
// mouse over a pane, update gflag.browser
var m=event.target;
while(m.className!='panelMain') m=m.parentNode;
gflag.paneidx=m.paneidx;
gflag.browser=Panels[m.paneidx].bbj;
}



function make_new_panel(grpidx,sampleidx,donoridx)
{
/*
grpidx: array idx of showContent
sampleidx: array idx of showContent[x][1]
donoridx: array idx of showContent[x][1][y].donor, optional
*/
var pane={grpidx:grpidx,sampleidx:sampleidx,pidx:Panels.length};
if(donoridx!=undefined) {
	pane.donoridx=donoridx;
}
Panels.push(pane);

var termidlst=[showContent[grpidx][1][sampleidx].sample];
if(donoridx!=undefined) {
	termidlst.push(showContent[grpidx][1][sampleidx].donors[donoridx]);
}

var termstrlst=[];
var voc=pillar.getMdvoc(0);
for(var i=0; i<termidlst.length; i++) {
	var t=termidlst[i];
	termstrlst.push(t in voc.idx2attr ? voc.idx2attr[t] : t);
}

//var tableid=grpidx+'__'+sampleidx+(donoridx!=undefined?'__'+donoridx:''); // for moving
pane.main=make_controlpanel({
	//bg:colorCentral.pagebg,
	htext:termstrlst.join(' | '),
	htextcolor:colorCentral.header,
	hbutt1:{text:'fold',call:pane_foldshow,bg:'rgba(0,102,102,0.3)',fg:'white'},
});
pane.main.__contentdiv.style.marginTop=5;
pane.main.style.zIndex=Panels.length;
pane.main.addEventListener('mousedown',pane_mousedown,false);
pane.main.ispanemain=true;

pane.bbj=new Browser();
pane.bbj.paneidx=pane.pidx;
pane.main.__hbutt1.paneidx=pane.pidx;
pane.bbj.hmSpan=defaultSpnum;
pane.bbj.leftColumnWidth=100;
pane.bbj.browser_makeDoms({
	centralholder:pane.main.__contentdiv,
	mintkheight:5,
	header:{
		padding:'5px 0px',
		fontsize:'100%',
		zoomout:[[2,2]],
		dspstat:{allowupdate:true},
		resolution:true,
		utils:{
			facetshortcut:{mdidx:0,
				holder:pane.main.__contentdiv,
				},
			bbjconfig:true},
	},
	facet:true,
	navigator:true,
	ghm_ruler:true,
	tkheader:true,
	hmdivbg:'white',
	gsv:true,
	mcm:true,
	mcmfixposition:true});
pane.bbj.main.style.backgroundColor=colorCentral.bbjbg;
pane.bbj.main.style.border='solid 1px white';
pane.bbj.mcm.holder.attop=false;
pane.bbj.applyHmspan2holders();
pane.bbj.genome=pillar.genome;
pane.bbj.runmode_set2default();
pane.bbj.migratedatafromgenome();
// get tk names first
var tkset={};
for(i=0; i<termidlst.length; i++) {
	var s={};
	pillar.mdgettrack(termidlst[i],0,s);
	for(var n in s) {
		if(n in tkset) tkset[n]++;
		else tkset[n]=1;
	}
}
// don't add all those hi-c tracks at once
var lrtklst=[];
for(var n in tkset) {
	if(pillar.genome.hmtk[n].ft==FT_lr_n) {
		lrtklst.push(n);
		delete tkset[n];
	}
}
var tklst=[];
if(lrtklst.length>0) {
	var o=duplicateTkobj(pillar.genome.hmtk[lrtklst[0]]);
	o.name=lrtklst[0];
	tklst.push(o);
}
for(var n in tkset) {
	if(tkset[n]==termidlst.length) {
		var o=duplicateTkobj(pillar.genome.hmtk[n]);
		o.name=n;
		tklst.push(o);
	}
}
for(i=0; i<defaultDecors.length; i++) {
	var o=pillar.genome.decorInfo[defaultDecors[i]];
	tklst.push({name:defaultDecors[i],ft:o.ft,mode:tkdefaultMode(o)});
}
let paramsObj = {
	addtracks: "on",
	dbName: genomeName,
	runmode: RM_genome,
	jump: "on",
	jumppos: defaultRegion[0]+':'+defaultRegion[1]+'-'+defaultRegion[2]
}
paramsObj=Object.assign(paramsObj, trackParam(tklst))
pane.bbj.ajax(paramsObj,function(data){
	var bbj=horcrux[data.horcrux];
	bbj.tklst=[]; // so that makeTrackDisplayobj will be called
	bbj.jsonDsp(data);
	bbj.jsonTrackdata(data);
	bbj.generateTrackselectionLayout(0);
	var p=Panels[bbj.paneidx];
	var mdlst=showContent[p.grpidx][1][p.sampleidx].mdlst;
	bbj.mdcFromNativeTerms(mdlst==null?defaultMd:mdlst);
	bbj.initiateMdcOnshowCanvas();
	bbj.prepareMcm();
	bbj.render_browser(false);
	bbj.mcm_sort();
});
show_panel(pane.pidx);
gflag.browser=pane.bbj;
if(donoridx==undefined) {
	document.getElementById('butt_'+grpidx+'_'+sampleidx).className='butt2';
} else {
	document.getElementById('butt_'+grpidx+'_'+sampleidx+'_'+donoridx).className='butt2';
}
menu_hide();
}


function show_panel(idx)
{
var pane=Panels[idx];
pane.main.style.display='block';
pane.main.style.left=53;
pane.main.style.top=86;
}

function showNavgbar() {
panelFadein(apps.navgbar.main,100,50);
cloakPage();
}
function navgbarhide() {
apps.navgbar.main.style.display='none';
pagecloak.style.display='none';
}

function termClick2(event)
{
var t=event.target;
if(t.k==undefined) {
	termClick(t.i,t.j);
} else {
	termClick(t.i,t.j,t.k);
}
}

function termClick(grpidx,sampleidx,donoridx)
{
for(var i=0; i<Panels.length; i++) {
	var p=Panels[i];
	if(p.grpidx==grpidx && p.sampleidx==sampleidx && p.donoridx==donoridx) {
		simulateEvent(p.main,'mouseover');
		if(p.bbj.main.style.display=='none') {
			simulateEvent(p.ctrltag.childNodes[2],'click');
		} else {
			simulateEvent(p.main,'mousedown');
		}
		return;
	}
}
make_new_panel(grpidx,sampleidx,donoridx);
}
function pane_mousedown(event)
{
var p=event.target;
while(!p.ispanemain) p=p.parentNode;
var thiszindex=parseInt(p.style.zIndex);
for(var i=0; i<Panels.length; i++) {
	var j=parseInt(Panels[i].main.style.zIndex);
	if(j>=thiszindex) Panels[i].main.style.zIndex=j-1;
}
p.style.zIndex=Panels.length;
}




function pane_foldshow(event)
{
var hb=event.target;
while(hb.className!='skewbox_butt') hb=hb.parentNode;
var f=hb.childNodes[1].innerHTML=='fold';
hb.childNodes[1].innerHTML=f?'show':'fold';
Panels[hb.paneidx].main.__contentdiv.firstChild.style.display=f?'none':'block';
menu_hide();
}



function showlinks(event) {
menu_shutup();
menu.linkholder.style.display='block';
menu_show_beneathdom(0,event.target);
}

function _search_focus(event) {
if(event.target.value=='enter keyword') event.target.value='';
}
function _search_blur(event) {
if(event.target.value=='') event.target.value='enter keyword';
}
function _search_keyup(event) {
if(event.keyCode==13) _search_do();
}
function _search_do() {
var t=apps.navgbar.input;
var s=t.value;
var pos=absolutePosition(t);
pos[0]+=10; pos[1]+=10;
menu_shutup();
menu.c1.style.display='block';
if(s.length<2) {
	menu.c1.innerHTML='Unacceptable keyword';
	menu_show(0,pos[0],pos[1]);
	return;
}
var relst=[];
var ss=s.toLowerCase();
var voc=pillar.getMdvoc(0);
for(var i=0; i<showContent.length; i++) {
	for(var j=0; j<showContent[i][1].length; j++) {
		var sample=showContent[i][1][j];
		var samplename=sample.sample in voc.idx2attr? voc.idx2attr[sample.sample] : sample.sample;
		if(samplename.toLowerCase().indexOf(ss)!=-1) {
			relst.push('<div onclick=termClick('+i+','+j+') class=butt>'+samplename+'</div>');
		}
		// donors
		if(sample.donors) {
			for(var k=0; k<sample.donors.length; k++) {
				var donorname=voc.idx2attr[sample.donors[k]];
				if(donorname.toLowerCase().indexOf(ss)!=-1) {
					relst.push('<div onclick=termClick('+i+','+j+','+k+') class=butt>'+samplename+' | '+donorname+'</div>');
				}
			}
		}
	}
}
menu.c1.innerHTML= relst.length==0 ? 'No hits found' :
'found '+relst.length+' sample'+(relst.length==1?'':'s')+'<div style="font-weight:normal;text-align:left;margin:10px;">'+relst.join('')+'</div>';
menu_show(0,pos[0],pos[1]);
}

function towashugb()
{
// show all active panels in bbj, as multi-bbj display
var hub=['[\n'];
// first panel
var bbj=Panels[0].bbj;
var r=bbj.getDspStat();
hub.push('{type:"coordinate_override",coord:"'+r[0]+':'+r[1]+'-'+r[3]+'"},\n');
// tk
hub.push('{type:"native_track",list:[');
for(var i=0; i<bbj.tklst.length; i++) {
	var t=bbj.tklst[i];
	hub.push('{name:"'+t.name+'",mode:"'+mode2str[t.mode]+'",},');
}
hub.push(']},\n');
// mcm
if(bbj.mcm.lst.length>0) {
	hub.push('{type:"native_metadata_terms",list:[');
	for(var j=0; j<bbj.mcm.lst.length; j++) {
		var t=bbj.mcm.lst[j];
		hub.push('"'+t[0]+'",');
	}
	hub.push(']},\n');
}
// rest of panels
if(Panels.length>1) {
	hub.push('{type:"newbrowser",list:[');
	for(i=1; i<Panels.length; i++) {
		bbj=Panels[i].bbj;
		var r=bbj.getDspStat();
		hub.push('{genome:"'+genomeName+'",'+
			'leftColumnWidth:100,hmSpan:1000,'+
			'browserparam:{');
		hub.push('coord_rawstring:"'+r[0]+':'+r[1]+'-'+r[3]+'",');
		// tracks
		hub.push('native_tracks:[');
		for(var j=0; j<bbj.tklst.length; j++) {
			var t=bbj.tklst[j];
			hub.push('{name:"'+t.name+'",mode:'+t.mode+'},');
		}
		hub.push('],');
		// mcm
		if(bbj.mcm.lst.length>0) {
			hub.push('native_metadata_rawstring:"');
			for(var j=0; j<bbj.mcm.lst.length; j++) {
				var t=bbj.mcm.lst[j];
				hub.push(t[0]+',');
			}
			hub.push('",');
		}
		hub.push('}},');
	}
	hub.push(']},\n');
}
hub.push(']');
ajaxPost('x\n'+hub.join(''),function(text){
	var h=window.location.origin;
	window.open(h+'/browser/?genome='+genomeName+'&datahub_jsonfile='+h+'/browser/t/'+text);
});
}



function readygo()
{
colorCentral.pagebg='#e0e0e0';
colorCentral.bbjbg='#ededed';
colorCentral.header='rgba(0,102,102,0.4)';
document.body.style.backgroundColor=colorCentral.pagebg;
document.body.addEventListener('keyup',page_keyup,false);

var d=dom_create('div',document.body,'background-color:rgba(255,255,255,0.7);border-bottom:solid 1px rgba(0,0,0,0.3);');
var t0=dom_create('table',d,'width:100%');
t0.cellPadding=20;
var tr0=t0.insertRow(0);
var td0=tr0.insertCell(0);
var t=dom_create('table',td0);
t.className='butt_holder';
var tr=t.insertRow(0);
var td=tr.insertCell(0);
td.style.padding='5px 20px';
td.className='button';
td.innerHTML='Human Complete Epigenomes';
td.addEventListener('click',showNavgbar,false);
td=tr.insertCell(1);
td.style.padding='5px 20px';
td.className='button';
td.innerHTML='About';
td.addEventListener('click',showlinks,false);
td0=tr0.insertCell(1);
td0.align='right';
t=dom_create('table',td0);
t.className='butt_holder';
td=t.insertRow(0).insertCell(0);
td.className='button';
td.innerHTML='View in '+washUtag;
td.addEventListener('click',towashugb,false);


page_makeDoms({
	app_splinter:true,
	app_bbjconfig:true,
	cp_hmtk:{htext:'Experimental assay tracks',
		hbutt1:{text:'&#10005;',call:toggle1},
	},
	menuopt_bbjSyncCoord:true,
	gsselect:true,
});

// remove some menu options
delete menu.c3;
menu.removeChild(menu.c23);
delete menu.c23;

menu.linkholder=dom_create('div',menu);
menu.linkholder.style.padding=8;
menu.linkholder.style.lineHeight=1.5;
menu.linkholder.innerHTML='<a href=http://www.roadmapepigenomics.org/ target=_blank>Roadmap Epigenomics Project</a> generated these data sets<br>'+
'<a href=http://www.drugabuse.gov/ target=_blank>NIDA</a>, <a href=http://www.nih.gov/ target=_blank>NIH</a> provide funding support<br>'+
'<a href=http://epigenomegateway.wustl.edu target=_blank style="text-decoration:none;background-color:#545454;border-radius:4px;-moz-border-radius:4px;padding:2px 5px;">'+washUtag+'</a> powers this service.';


var d=make_controlpanel({
	htext:'Select samples',
	hbutt1:{text:'&#10005;',call:navgbarhide},
});
apps.navgbar={main:d};




pagecloak.style.zIndex=100;

// load genome
pillar=new Browser();
pillar.juxtaposition=null;
let paramsObj = {
	loadgenome: "on",
	dbName: genomeName
};
pillar.ajax(paramsObj,function(data){
	pillar.genome=new Genome({});
	pillar.genome.jsonGenome(data);

	var d=apps.navgbar.main.__contentdiv;
	dom_addtext(d,'A <a href=http://www.roadmapepigenomics.org/complete_epigenomes/ target=_blank>complete epigenome</a> is available for every listed sample.&nbsp;&nbsp;','white');
	var inp=dom_create('input',d);
	inp.type='text';
	inp.size=10;
	inp.value='enter keyword';
	inp.addEventListener('focus',_search_focus,false);
	inp.addEventListener('blur',_search_blur,false);
	inp.addEventListener('keyup',_search_keyup,false);
	apps.navgbar.input=inp;
	dom_addbutt(d,'Find',_search_do);
	dom_create('br',d);
	dom_create('br',d);
	var voc=pillar.getMdvoc(0);
	var lst=[];
	for(var i=0; i<showContent.length; i++) {
		lst.push(showContent[i][0]);
	}
	var stl=make_tablist({lst:lst,tabpadding:'5px 10px',usediv:true});
	stl.style.backgroundColor='rgba(255,255,255,0.4)';
	d.appendChild(stl);
	for(var i=0; i<showContent.length; i++) {
		var label=showContent[i][0];
		var samplelst=showContent[i][1];
		var hd=stl.holders[i];
		var dd=dom_create('div',hd);
		hd.style.height=370;
		hd.style.overflowY='scroll';
		for(var j=0; j<samplelst.length; j++) {
			var d3=dom_create('div',dd,'display:table;');
			d3.i=i;
			d3.j=j;
			d3.setAttribute('id','butt_'+i+'_'+j);
			d3.className='butt';
			d3.addEventListener('click',termClick2,false);
			d3.innerHTML=samplelst[j].sample in voc.idx2attr ? voc.idx2attr[samplelst[j].sample] : samplelst[j].sample;
			if(samplelst[j].donors) {
				var d4=dom_create('table',dd,'margin:10px 10px 10px 20px;border-style:solid;border-color:rgba(0,0,0,0.3);border-width:0px 0px 1px 1px;');
				var tr=d4.insertRow(0);
				var td=tr.insertCell(0);
				td.vAlign='top';
				td.innerHTML='donors:';
				td=tr.insertCell(1);
				td.style.width=400;
				td.style.opacity=0.7;
				for(var k=0; k<samplelst[j].donors.length; k++) {
					var s=dom_create('div',td);
					s.innerHTML=voc.idx2attr[samplelst[j].donors[k]];
					s.className='butt';
					//var s=dom_addtext(td,voc.idx2attr[samplelst[j].donors[k]],null,'butt');
					s.setAttribute('id','butt_'+i+'_'+j+'_'+k);
					s.i=i; s.j=j; s.k=k;
					s.addEventListener('click',termClick2,false);
					//s.style.margin='0px 10px 0px 5px';
				}
			}
		}
	}
	make_new_panel(0,0);
});
}
