function makepanel_geneplot(param)
{
const makeColorPickerAsString = function(defaultColor, contextSetterName) {
	return `<input class="${jscolor.lookupClass}" value="${defaultColor}" size="10" style="display: inline-block;"` + 
		`onfocus=${contextSetterName}(event) onchange=hexColorPicked(event)></input>`;
}

const setOnClickForColorOvals = function(parent) {
	let colorOvals = $(parent).find('.coloroval');
	let pickers = $(parent).find('.' + jscolor.lookupClass);
	if (colorOvals.length !== pickers.length) {
		console.warn("setOnClickForColorOvals: number of color ovals and color pickers not equal!  Skipping...");
		return;
	}
	for (let i = 0; i < colorOvals.length; i++) {
		let oval = colorOvals[i];
		let picker = pickers[i];

		oval.onclick = (event) => {
			picker.onfocus(event);
			picker.jscolor.show();
		}
	}
}

var d=make_controlpanel(param);
d.__hbutt2.style.display='none';
d.__contentdiv.style.position='relative';
apps.gplot={main:d,
	type:'',
	data:[],
	genenum:0,
	canvasX:0, canvasY:0, // absolute position of clustering heatmap
	dendroX:0, dendroY:0, // ... of clustering dendrogram
	ccrd:{}, // cluster coord hash {x:{y:id}}, for clicking on dendrogram
	'for':0, // determines where the panel should go to 0: gene set view, 1: custom bigbed
	graphtype:'s1', // for param
};
var G=apps.gplot;
// input ui
var d2=dom_create('div',d.__contentdiv,'position:absolute;top:0px;left:0px;width:800px;');
G.ui_submit=d2;
// 0 - geneset
if(!apps.gsm) {
	fatalError('Wrong configuration: geneplot requires geneset management function');
}

var d3=make_headertable(d2);
d3.style.marginBottom=20;
d3._h.innerHTML='0 - gene set';
d3._h.align='left';
dom_addbutt(d3._c,'Choose a gene set',gplot_showgeneset).style.marginRight=20;
G.ui_geneset_says=dom_addtext(d3._c,'No gene set selected');
// 1 - data track
d3=make_headertable(d2);
d3.style.marginBottom=20;
d3._h.innerHTML='1 - Data track';
d3._h.align='left';
dom_addtext(d3._c,'Select a <a href=http://wiki.wubrowse.org/BedGraph target=_blank>numerical track</a> to provide data for plotting');
dom_create('br',d3._c); dom_create('br',d3._c);
dom_addbutt(d3._c,'Select numerical track &#187;',geneplot_invoketkselect);
G.numtk_holder=dom_addtext(d3._c);
// 2 - graph type
d3=make_headertable(d2);
d3.style.marginBottom=20;
d3._h.align='left';
dom_addtext(d3._h,'2 - Graph type ');
var b=dom_addbutt(d3._h,'box plot',geneplotchoosestyle);
b.which=1;
b.disabled=true;
G.style1_butt=b;
b=dom_addbutt(d3._h,'&nbsp;lines&nbsp;',geneplotchoosestyle);
G.style2_butt=b;
b.which=2;
b=dom_addbutt(d3._h,'gene parts',geneplotchoosestyle);
b.which=3;
G.style3_butt=b;
b=dom_addbutt(d3._h,'clustering',geneplotchoosestyle);
b.which=4;
G.style4_butt=b;
// style 1
var d4=dom_create('div',d3._c);
G.style1_div=d4;
d4.innerHTML='<table><tr>\
<td valign=top align=center>\
<div id=geneplot_s1_biglogo><img src=images/geneplot_s1_g.png height=160 width=160></div>\
</td><td valign=top style="padding-left:10px;width:500px">\
<p>All genes and genomic intervals are tiled together, genes are always from 5\' to 3\' end, relative to their strands. Track data of each gene are summarized into fixed length vectors, and median value over each data point is plotted.</p>\
<div class=hlo>Number of data points <select id=geneplot_s1_spnum>\
<option value=50>50</option><option value=60>60</option><option value=70>70</option><option value=80>80</option><option value=90>90</option><option value=100>100</option><option value=110>110</option><option value=120>120</option><option value=140>140</option><option value=160>160</option><option value=180>180</option><option value=200>200</option>\
</select></div>\
<p style="font-size:12px;">Line width \
<select id=geneplot_s1_lw><option value=1>1</option><option value=2>2</option><option value=3>3</option><option value=4>4</option><option value=5 selected>5</option></select> \
<span class=coloroval id=geneplot_s1_lc style="background-color:#ff9400;width:90px;">median curve</span>' +
makeColorPickerAsString('FF9400', 'geneplot_s1_lc_initiator') +
'image width <select id=geneplot_s1_iw>\
<option value=300>300</option><option value=400>400</option><option value=500>500</option><option value=600>600</option><option value=700>700</option><option value=800 selected>800</option><option value=900>900</option><option value=1000>1000</option><option value=1100>1100</option><option value=1200>1200</option><option value=1300>1300</option><option value=1400>1400</option>\
<option value=1500>1500</option>\
</select>\
height <select id=geneplot_s1_ih><option value=300>300</option><option value=400 selected>400</option><option value=500>500</option><option value=600>600</option><option value=700>700</option><option value=800>800</option></select>\
<br>\
<span id=geneplot_s1_googlesays>other curves use lighter color</span>\
<span id=geneplot_s1_useR style="display:none;">\
whisker range <select id=geneplot_s1_wrange><option value=0>entire span (min to max)</option><option value=1.5 selected>1.5x of box span</option></select>\
outlier <select id=geneplot_s1_outlier><option value=F selected>hide</option><option value=T>show</option></select>\
<a href=http://stat.ethz.ch/R-manual/R-patched/library/graphics/html/boxplot.html target=_blank>about these options</a>\
</span>\
<br>\
<input type=checkbox id=geneplot_s1_average> <label for=geneplot_s1_average>plot average values</label>\
</p>\
</td></tr></table>';
setOnClickForColorOvals(d4);

// style 2
d4=dom_create('div',d3._c);
G.style2_div=d4;
d4.style.display='none';
d4.innerHTML='<table cellpadding=10><tr>\
<td valign=top align=center>\
<img src=images/geneplot_s2.png height=160 width=160>\
</td><td valign=top style="padding-left:10px;width:500px">\
<p>One line is plotted for each gene or item, genes are always from 5\' to 3\', relative to their strands. Track data of each gene and item are summarized into equal length vectors.</p>\
<div class=hlo>Number of data points <select id=geneplot_s2_spnum>\
<option value=50>50</option><option value=60>60</option><option value=70>70</option><option value=80>80</option><option value=90>90</option><option value=100>100</option><option value=110>110</option><option value=120>120</option><option value=140>140</option><option value=160>160</option><option value=180>180</option><option value=200>200</option>\
</select></div>\
<p style="font-size:12px;">Line width \
<select id=geneplot_s2_lw class=s2><option value=1 selected>1</option><option value=2>2</option><option value=3>3</option><option value=4>4</option><option value=5>5</option></select> \
<span class=coloroval id=geneplot_s2_lc style="background-color:#ff9400;width:80px;">line color</span>' +
makeColorPickerAsString('FF9400', 'geneplot_s2_lc_initiator') +
'image width <select id=geneplot_s2_iw><option value=300>300</option><option value=400>400</option><option value=500>500</option><option value=600>600</option><option value=700>700</option><option value=800 selected>800</option><option value=900>900</option><option value=1000>1000</option><option value=1100>1100</option><option value=1200>1200</option><option value=1300>1300</option><option value=1400>1400</option><option value=1500>1500</option></select> \
height <select id=geneplot_s2_ih class=s2><option value=300>300</option><option value=400 selected>400</option><option value=500>500</option><option value=600>600</option><option value=700>700</option><option value=800>800</option></select></p>\
</td></tr></table>';
setOnClickForColorOvals(d4);

// style 3
d4=dom_create('div',d3._c);
G.style3_div=d4;
d4.style.display='none';
d4.innerHTML='<table cellpadding=10><tr>\
<td valign=top align=center>\
<div id=geneplot_s3_biglogo><img src=images/geneplot_s3_g.png height=160 width=160></div>\
</td><td valign=top style="padding-left:10px;width:500px">\
<p>Profiles of gene parts (3 kb promoter, 5\' UTR, exons, introns, 3\' UTR) will be plotted as separate curves, in the same fashion as first plot type (only applies to genes, genomic coordinates will be skipped)</p>\
<div class=hlo>Number of data points for each segment type <select id=geneplot_s3_spnum>\
<option value=10>10</option><option value=20>20</option><option value=30>30</option><option value=40>40</option><option value=50>50</option><option value=60>60</option>\
</select></div>\
<div style="font-size:12px;margin-top:10px;">Line width \
<select id=geneplot_s3_lw><option value=1>1</option><option value=2>2</option><option value=3>3</option><option value=4>4</option><option value=5 selected>5</option></select> \
image width <select id=geneplot_s3_iw>\
<option value=300>300</option><option value=400>400</option><option value=500>500</option><option value=600>600</option><option value=700>700</option><option value=800 selected>800</option><option value=900>900</option><option value=1000>1000</option><option value=1100>1100</option><option value=1200>1200</option><option value=1300>1300</option><option value=1400>1400</option><option value=1500>1500</option>\
</select>\
height <select id=geneplot_s3_ih><option value=300>300</option><option value=400 selected>400</option><option value=500>500</option><option value=600>600</option><option value=700>700</option><option value=800>800</option></select>\
<br><br>\
<span class=coloroval title=cc0000 id=geneplot_s3_promoterc style="background-color:#cc0000;width:80px;">promoter</span> \
<span class=coloroval title=008000 id=geneplot_s3_utr5c style="background-color:#008000;width:80px;">5\' UTR</span> \
<span class=coloroval title=0000e6 id=geneplot_s3_exonsc style="background-color:#0000e6;width:80px;">exons</span> \
<span class=coloroval title=990099 id=geneplot_s3_intronsc style="background-color:#990099;width:80px;">introns</span> \
<span class=coloroval title=b85b19 id=geneplot_s3_utr3c style="background-color:#b85b19;width:80px;">3\' UTR</span>\
<br>' +
makeColorPickerAsString('CC0000', 'geneplot_s3_promoterc_initiator') + 
makeColorPickerAsString('008000', 'geneplot_s3_utr5c_initiator') + 
makeColorPickerAsString('0000E6', 'geneplot_s3_exonsc_initiator') + 
makeColorPickerAsString('990099', 'geneplot_s3_intronsc_initiator') + 
makeColorPickerAsString('B85B19', 'geneplot_s3_utr3c_initiator') + 
'<br><br>\
<span id=geneplot_s3_googlesays>Above colors are for median curves. Lighter color will be used for other curves.</span>\
<span id=geneplot_s3_useR style="display:none;">\
whisker range <select id=geneplot_s3_wrange><option value=0>entire span (min to max)</option> <option value=1.5 selected>1.5x of box span</option></select>\
outlier <select id=geneplot_s3_outlier><option value=F selected>hide</option><option value=T>show</option></select>\
<a href=http://stat.ethz.ch/R-manual/R-patched/library/graphics/html/boxplot.html target=_blank>about these options</a>\
</span>\
<br>\
<input type=checkbox id=geneplot_s3_average> <label for=geneplot_s3_average>plot average values</label>\
</div>\
</td></tr></table>';
setOnClickForColorOvals(d4);

// style 4
d4=dom_create('div',d3._c);
G.style4_div=d4;
d4.style.display='none';
d4.innerHTML='<table cellpadding=10><tr>\
<td valign=top align=center>\
<img src=images/geneplot_s4.png height=160 width=160>\
</td><td valign=top style="padding-left:10px;width:500px">\
<p>Run hierarchical or K-means clustering analysis on genes, and explore result through its interactive features.</p>\
<table><tr>\
<td>\
<div class=hlo>Number of data points <select id=geneplot_s4_spnum>\
<option value=50>50</option><option value=60>60</option><option value=70>70</option><option value=80>80</option><option value=90>90</option><option value=100 selected>100</option><option value=110>110</option><option value=120>120</option><option value=140>140</option><option value=160>160</option><option value=180>180</option><option value=200>200</option>\
</select></div>\
</td><td>\
Clustering method <select id=geneplot_s4_m onchange=toggle24(event)><option value=h>hierarchical</option><option value=k>K-means</option></select>\
</td>\
</tr></table>\
<p style="font-size:12px;">\
<span id=geneplot_s4_h_span>distance metric <select id=geneplot_s4_dist class=s2><option value=e>euclidean</option><option value=p>pearson</option><option value=s selected>spearman</option></select> \
agglomeration <select id=geneplot_s4_aglm class=s2><option value=single>single linkage</option><option value=complete>complete linkage</option><option value=average selected>average linkage</option></select></span>\
<span id=geneplot_s4_k_span style="display:none;">number of clusters <select id=geneplot_s4_cnum class=s2><option value=2>2</option><option value=3>3</option><option value=4>4</option><option value=5>5</option><option value=6>6</option><option value=7>7</option><option value=8>8</option><option value=9>9</option><option value=10>10</option></select></span>\
</p>\
<p style="font-size:12px;">\
Row height <select id=geneplot_s4_rh class=s2><option value=1>1</option><option value=2>2</option><option value=3>3</option><option value=4>4</option><option value=5>5</option><option value=6>6</option><option value=7>7</option><option value=8>8</option><option value=9>9</option><option value=10>10</option></select> \
plot width of data points <select id=geneplot_s4_dpw class=s2><option value=1 selected>1</option><option value=2>2</option><option value=3>3</option><option value=4>4</option><option value=5>5</option></select><br>\
<input type=checkbox id=geneplot_s4_global checked> <label for=geneplot_s4_global>use global min/max</label> \
<span class=coloroval id=geneplot_s4_pc style="background-color:#FF0000;width:120px;">positive value</span>' +
makeColorPickerAsString('FF0000', 'geneplot_s4_pc_initiator') +
'<span class=coloroval id=geneplot_s4_nc style="background-color:#0000FF;width:120px;">negative value</span>' +
makeColorPickerAsString('0000FF', 'geneplot_s4_nc_initiator') +
'(white for zero baseline)\
</p>\
</td></tr></table>';
setOnClickForColorOvals(d4);

// 3 - rendering method
d3=make_headertable(d2);
G.renderingmethod=d3;
d3.style.marginBottom=20;
d3._h.align='left';
d3._h.innerHTML='3 - Rendering method';
d3._c.innerHTML='<select id=geneplotrender onchange=geneplotrenderselectchange(event)>\
	<option value=gc id=googlechartopt disabled>Google Chart Tools</option>\
	<option value=r selected>R software on our server</option>\
	</select> \
	<button id=enablegooglecharbutt type=button onclick=enableGooglechart(event)>Click to enable Google Chart</button><br>\
	<ul>\
		<li>R software generates box plots in form of still PNG images</li>\
		<li>Google Chart generates interactive line plots</li>\
	</ul>';
// submit
b=dom_addbutt(d2,'Make gene plot',makeGeneplot);
b.className='big';
G.submit_butt=b;

// figure ui
d2=make_headertable(d.__contentdiv);
d2.style.position='absolute';
d2.style.display='none';
d2.style.top=0;
d2.style.left=0;
G.ui_figure=d2;
d2._h.style.padding='';
d2._c.innerHTML='<p id=geneplotgetdatabuttons style="text-align:center;">Get data <button type=button onclick=geneplot_getdata(0)>plain text</button> <button type=button onclick=geneplot_getdata(1) id=geneplot_googletablebutton style="display:none">interactive table by Google Chart</button></p>\
<div style="display:none;" id=geneplotcanvasdiv>\
<table style="border:solid 1px #ccc;"><tr>\
<td><canvas id=geneplotdendrogram style="display:none;" onclick=geneplotdendrogramclick(event)></canvas></td>\
<td><canvas class=geneplotcanvas id=geneplotheatmap onmouseover=tooltipshow() onmousemove=tooltipmove(event) onmouseout=tooltiphide()></canvas></td>\
<td id=geneplot_kmeansclusterbuttonholder></td>\
</tr></table>\
<div id=geneplot_selectedgenediv style="display:none;margin-top:10px;overflow-y:scroll;width:490px;height:150px;border:solid 1px #ccc;"><table style="width:100%;"><tbody></tbody></table></div>\
<div id=haszerosdgene style="display:none;"><span id=zerosdgenenum></span> genes with 0 standard deviation are excluded from clustering analysis <button type=button onclick=toggle23(event)>show</button><div id=zerosdgeneholder style="display:none;"></div></div>\
</div>\
<img id=geneplotimage style="display:none;" />\
<div id=googleimagechartdiv style="display:none;border:solid 1px #ccc;"></div>\
<div id=googlechartdiv style="display:none;border:solid 1px #ccc;"></div>\
<div id=googletablediv style="display:none;margin-top:10px;"></div>\
<div id=geneplot_dataplaintext style="display:none;margin-top:10px;width:800px;height:200px;overflow-y:scroll;"><table border=1><tbody></tbody></table></div>';
}



function gp_back2control()
{
var g=apps.gplot;
g.main.__hbutt2.style.display='none';
panelFadeout(g.ui_figure);
panelFadein(g.ui_submit);
}

function toggle4()
{
// for invoking geneplot panel in standalone mode
apps.gplot.shortcut.style.display='inline-block';
var bait=apps.gplot.main;
if(bait.style.display=='block') {
	pagecloak.style.display='none';
	panelFadeout(bait);
	return;
}
cloakPage();
panelFadein(bait, 100+document.body.scrollLeft, 50+document.body.scrollTop);
apps.gplot.bbj=gflag.browser;
menu_hide();
}

function enableGooglechart(event)
{
event.target.disabled=true;
event.target.innerHTML = 'Importing library, please wait....';
var h = document.getElementsByTagName('HEAD')[0];
var s = document.createElement('script');
s.type = 'text/javascript';
s.src = 'https://www.google.com/jsapi';
h.appendChild(s);
setTimeout(enableGooglechart2, 500);
}
function enableGooglechart2(event)
{
// for google chart tools
var b=document.getElementById('enablegooglecharbutt');
if(typeof(google) == "undefined") {
	b.innerHTML='Failed to enable Google Chart, click to try again';
	b.disabled=false;
} else {
	b.style.display='none';
	document.getElementById('googlechartopt').disabled = false;
	document.getElementById('geneplotrender').selectedIndex=0;
	simulateEvent(document.getElementById('geneplotrender'),'change');
	document.getElementById('geneplot_googletablebutton').style.display='inline';
	google.load('visualization', '1', {packages:['corechart', 'table'], callback:function(){}});
}
}
function geneplot_invoketkselect(event)
{
menu_shutup();
menu_show_beneathdom(0,event.target);
apps.gplot.bbj.showcurrenttrack4select(tkentryclick_geneplot,ftfilter_numerical);
}

function tkentryclick_geneplot(event)
{
// select numerical tk
var tk=event.target.tkobj;
if(!isNumerical(tk)) {
	print2console('Only numerical track can be used.',2);
} else {
	var d=apps.gplot.numtk_holder;
	stripChild(d,0);
	var t=dom_addtkentry(2,d,false,tk,tk.label,generic_tkdetail);
	t.style.display='inline';
	apps.gplot.datatk=duplicateTkobj(tk);
}
menu_hide();
}
function geneplot_removebedtrack()
{
stripChild(apps.gplot.bedtk_holder,0);
apps.gplot.bedtk=null;
}

function geneplotchoosestyle(event)
{
// called by clicking button
var w=event.target.which;
var g=apps.gplot;
g.graphtype=w==1?'s1':(w==2?'s2':(w==3?'s3':'s4'));
g.style1_butt.disabled=w==1;
g.style2_butt.disabled=w==2;
g.style3_butt.disabled=w==3;
g.style4_butt.disabled=w==4;
g.style1_div.style.display=w==1?'block':'none';
g.style2_div.style.display=w==2?'block':'none';
g.style3_div.style.display=w==3?'block':'none';
g.style4_div.style.display=w==4?'block':'none';
g.renderingmethod.style.display=w==4?'none':'block';
}

function geneplot_s1_lc_initiator(event)
{
paletteshow(event.clientX, event.clientY,22);
palettegrove_paint(document.getElementById("geneplot_s1_lc").style.backgroundColor);
}
function geneplot_s2_lc_initiator(event)
{
paletteshow(event.clientX, event.clientY,23);
palettegrove_paint(document.getElementById("geneplot_s2_lc").style.backgroundColor);
}
function geneplot_s3_promoterc_initiator(event)
{
paletteshow(event.clientX, event.clientY,24);
palettegrove_paint(document.getElementById("geneplot_s3_promoterc").style.backgroundColor);
}
function geneplot_s3_utr5c_initiator(event)
{
paletteshow(event.clientX, event.clientY,25);
palettegrove_paint(document.getElementById("geneplot_s3_utr5c").style.backgroundColor);
}
function geneplot_s3_utr3c_initiator(event)
{
paletteshow(event.clientX, event.clientY,26);
palettegrove_paint(document.getElementById("geneplot_s3_utr3c").style.backgroundColor);
}
function geneplot_s3_exonsc_initiator(event)
{
paletteshow(event.clientX, event.clientY,27);
palettegrove_paint(document.getElementById("geneplot_s3_exonsc").style.backgroundColor);
}
function geneplot_s3_intronsc_initiator(event)
{
paletteshow(event.clientX, event.clientY,28);
palettegrove_paint(document.getElementById("geneplot_s3_intronsc").style.backgroundColor);
}
function geneplot_s4_pc_initiator(event)
{
paletteshow(event.clientX, event.clientY,20);
palettegrove_paint(document.getElementById("geneplot_s4_pc").style.backgroundColor);
}
function geneplot_s4_nc_initiator(event)
{
paletteshow(event.clientX, event.clientY,21);
palettegrove_paint(document.getElementById("geneplot_s4_nc").style.backgroundColor);
}
function geneplotrenderselectchange(event)
{
// called by changing <select> to choose between google or R
var isgoogle = event.target.selectedIndex == 0;
document.getElementById('geneplot_s1_lc').innerHTML = isgoogle ? 'median curve' : 'box color';
document.getElementById('geneplot_s1_googlesays').style.display = isgoogle ? 'inline' : 'none';
document.getElementById('geneplot_s1_useR').style.display = isgoogle ? 'none' : 'inline';
document.getElementById('geneplot_s3_googlesays').style.display = isgoogle ? 'inline' : 'none';
document.getElementById('geneplot_s3_useR').style.display = isgoogle ? 'none' : 'inline';
var d1 = document.getElementById('geneplot_s1_biglogo');
var d3 = document.getElementById('geneplot_s3_biglogo');
if(isgoogle) {
	d1.innerHTML = '<img src=images/geneplot_s1_g.png height=160 width=160>';
	d3.innerHTML = '<img src=images/geneplot_s3_g.png height=160 width=160>';
} else {
	d1.innerHTML = '<img src=images/geneplot_s1_b.png height=160 width=160>';
	d3.innerHTML = '<img src=images/geneplot_s3_b.png height=160 width=160>';
}
}

function makeGeneplot()
{
/* 
TODO use trackParam()
*/
var G=apps.gplot;
var type=G.graphtype;
var rendering = getSelectValueById("geneplotrender");

// data track
if(G.datatk==undefined) {
	print2console('You haven\'t selected a track for GenePlot',2);
	return;
}
if(!G.geneset || !G.geneset.lst) {
	print2console('No gene set selected',2);
	return;
}
if(G.geneset.lst.length==0) {
	print2console('Gene set is empty!',2);
	return;
}
/* running Google Chart (s2) with many items will be problematic
need to exclude that
*/
if(type=='s2' && rendering=='gc') {
	var itemnumlimit = 500;
	if(G.geneset.lst.length > itemnumlimit) {
		print2console("Too many items to plot via Google service, use R instead", 2);
		return;
	}
}

// but first, let's hide everybody
document.getElementById("haszerosdgene").style.display = "none";
document.getElementById("geneplot_selectedgenediv").style.display = "none";
stripChild(document.getElementById("geneplot_kmeansclusterbuttonholder"), 0);
document.getElementById("geneplotdendrogram").style.display = "none";
document.getElementById("geneplotcanvasdiv").style.display = "none";
document.getElementById("googleimagechartdiv").style.display = "none";
document.getElementById("googlechartdiv").style.display = "none";
document.getElementById("geneplotimage").style.display = "none";
document.getElementById("googletablediv").style.display = "none";
document.getElementById("geneplot_dataplaintext").style.display = "none";
document.getElementById("geneplotgetdatabuttons").style.display = "none";

// plot-type specific params
var param = {};
if(type == "s4") {
	param = {
		clustmethod: getSelectValueById("geneplot_s4_m"),
		kmeanscnum: getSelectValueById("geneplot_s4_cnum"),
		clustdist: getSelectValueById("geneplot_s4_dist"),
		clustaglm: getSelectValueById("geneplot_s4_aglm")
	}
} else if(rendering=='r') {
	// R rendering params
	param = {
		usingR: "on",
		width: getSelectValueById("geneplot_"+type+"_iw"),
		height: getSelectValueById("geneplot_"+type+"_ih"),
		lw: getSelectValueById("geneplot_"+type+"_lw")
	}
	if(type == 's1') {
		// s1 specific R params
		var c = document.getElementById("geneplot_"+type+"_lc").style.backgroundColor;
		param.range = getSelectValueById('geneplot_s1_wrange');
		param.lc = c;
		param.averagelc = darkencolor(colorstr2int(c), 0.4);
		param.outlier = getSelectValueById('geneplot_s1_outlier');
		if (document.getElementById('geneplot_s1_average').checked) {
			param.average = "on";
		}
	} else if(type=='s2') {
		// s2 specific R params
		//param += "&lc="+document.getElementById("geneplot_s2_lc").style.backgroundColor;
	} else if(type=='s3') {
		// s3 specific R params
		var pc = document.getElementById("geneplot_"+type+"_promoterc").style.backgroundColor;
		var uc5 = document.getElementById("geneplot_"+type+"_utr5c").style.backgroundColor;
		var uc3 = document.getElementById("geneplot_"+type+"_utr3c").style.backgroundColor;
		var ec = document.getElementById("geneplot_"+type+"_exonsc").style.backgroundColor;
		var ic = document.getElementById("geneplot_"+type+"_intronsc").style.backgroundColor;
		param = Object.assign(param, {
			promoterc: pc,
			utr5c: uc5,
			utr3c: uc3,
			exonsc: ec,
			intronsc: ic,
			average_promoterc: darkencolor(colorstr2int(pc), 0.4),
			average_utr5c: darkencolor(colorstr2int(uc5), 0.4),
			average_utr3c: darkencolor(colorstr2int(uc3), 0.4),
			average_exonsc: darkencolor(colorstr2int(ec), 0.4),
			average_intronsc: darkencolor(colorstr2int(ic), 0.4),
			range: getSelectValueById('geneplot_s3_wrange'),
			outlier: getSelectValueById('geneplot_s3_outlier'),
		});
		if (document.getElementById('geneplot_s3_average').checked) {
			param.average = "on"
		}
	}
}

// geneset
var lst=[];
if(G.graphtype=='s3') {
	// graph type 'genepart', genes-only
	for(var i=0; i<apps.gplot.geneset.lst.length; i++) {
		var e=apps.gplot.geneset.lst[i];
		if(e.isgene) {
			lst.push(e.name+','+e.c+','+e.a1+','+e.b1+','+e.strand);
		}
	}
	if(lst.length==0) {
		print2console('No genes found in this "gene set". Only genes can be used to make the "gene parts" plot.',2);
		return;
	}
} else {
	for(var i=0; i<apps.gplot.geneset.lst.length; i++) {
		var e=apps.gplot.geneset.lst[i];
		lst.push(e.name+','+e.c+','+e.a1+','+e.b1+','+e.strand);
	}
}
param.lst = lst.join(',');

G.submit_butt.innerHTML = 'Running...';
G.submit_butt.removeEventListener('click', makeGeneplot, false);

// context parameter is removed
var bbj=G.bbj;
let paramsObj = {
	makegeneplot: "on",
	plottype: type,
	searchgenetknames: bbj.genome.searchgenetknames.join(','),
	spnum: getSelectValueById("geneplot_"+type+"_spnum"),
	datatk: G.datatk.url,
	datatkft: G.datatk.ft,
	dbName: bbj.genome.name
}
paramsObj = Object.assign(paramsObj, param);
bbj.ajax(paramsObj, function(data){bbj.makeGeneplot_cb(data);});
}
var NA=0;

Browser.prototype.makeGeneplot_cb=function(data)
{
var G=apps.gplot;
G.submit_butt.innerHTML = 'Make gene plot';
G.submit_butt.addEventListener('click', makeGeneplot, false);
if(!data) {
	print2console('Server error! Please try again.',2);
	return;
}
if(data.abort) {
	print2console('Error: '+data.abort,2);
	return;
}
if('gpabort' in data) return;
if('alert' in data) print2console(data.alert, 2);

document.getElementById("geneplotgetdatabuttons").style.display = "block";

var rendering = getSelectValueById("geneplotrender");
var type=G.graphtype;
G.data=data.data;
var spnum = parseInt(getSelectValueById("geneplot_"+type+"_spnum"));

var canvasdiv = document.getElementById("geneplotcanvasdiv"); // plot as canvas
var gcimagediv = document.getElementById("googleimagechartdiv"); // google image chart
var gcdiv = document.getElementById("googlechartdiv"); // google chart tool, fancier
var Rimage = document.getElementById("geneplotimage"); // R-generated image

var imageframe; // for image chart only

if(type == "s4") {
	canvasdiv.style.display = "table";
} else if(rendering == "r") {
	Rimage.style.display = "block";
} else if(rendering == "gc") {
	gcdiv.style.display = "block";
} else if(rendering == "gic") {
	gcimagediv.style.display = "block";
	stripChild(gcimagediv, 0);
	imageframe = document.createElement("iframe");
	imageframe.frameBorder = 0;
	gcimagediv.appendChild(imageframe);
}

G.main.__hbutt2.style.display='block';
panelFadeout(G.ui_submit);
panelFadein(G.ui_figure);

if(type == "s1") {
	if(rendering == "gc") {
		var showaverage = document.getElementById('geneplot_s1_average').checked;
		var Gdata = new google.visualization.DataTable();
		Gdata.addColumn('number', 'POS'); // X axis index
		Gdata.addColumn('number', 'minimum');
		Gdata.addColumn('number', 'lower quartile');
		Gdata.addColumn('number', 'median');
		if(showaverage)
			Gdata.addColumn('number', 'average');
		Gdata.addColumn('number', 'upper quartile');
		Gdata.addColumn('number', 'maximum');
		Gdata.addRows(spnum);

		var tmpi;
		for(var i=0; i<spnum; i++) {
			Gdata.setValue(i, 0, i); // X axis index value
			var v = data['data'][i];
			Gdata.setValue(i, 1, v[0]);
			Gdata.setValue(i, 2, v[1]);
			Gdata.setValue(i, 3, v[2]);
			tmpi = 4;
			if(showaverage)
				Gdata.setValue(i, tmpi++, v[3]);
			Gdata.setValue(i, tmpi++, v[4]);
			Gdata.setValue(i, tmpi++, v[5]);
		}

		// line color
		var lc = document.getElementById("geneplot_s1_lc").style.backgroundColor;
		var clst = colorstr2int(lc);
		var colorlst = [lightencolor(clst, .8), lightencolor(clst, .5), lc];
		if(showaverage)
			colorlst.push(darkencolor(clst, .4));
			colorlst.push(lightencolor(clst, .5));
			colorlst.push(lightencolor(clst, .8));

		new google.visualization.LineChart(gcdiv).draw(Gdata, 
			{width:parseInt(getSelectValueById("geneplot_s1_iw")),
			height:parseInt(getSelectValueById("geneplot_s1_ih")),
			lineWidth:parseInt(getSelectValueById("geneplot_s1_lw")),
			colors:colorlst,
			hAxis:{'title':"Genomic positions from 5' to 3'"},
			vAxis:{'title':"Data value distribution"},
			});
		done();
		return;
	}
	if(rendering == "r") {
		var ll = data.image.split('/');
		Rimage.src = 't/'+ll[ll.length-1];
		print2console("Gene Plot ready", 1);
		return;
	}
}
if(type == "s2") {
	if(rendering == "gc") {
		var Gdata = new google.visualization.DataTable();
		Gdata.addColumn('number', 'POS'); // x axis index
		for(var i=0; i<data['data'].length; i++) {
			Gdata.addColumn('number', data['data'][i][0]);
		}
		Gdata.addRows(spnum);
		// set x axis index
		for(i=0; i<spnum; i++) {
			Gdata.setValue(i, 0, i);
		}
		// set data value
		for(i=0; i<data['data'].length; i++) { // for each vector (or column in DataTable)
			var v = data['data'][i];
			for(var j=0; j<spnum; j++) {
				Gdata.setValue(j, i+1, v[j+1]);
			}
		}
		new google.visualization.LineChart(gcdiv).draw(Gdata, 
			{width:parseInt(getSelectValueById("geneplot_s2_iw")),
			 height:parseInt(getSelectValueById("geneplot_s2_ih")),
			 lineWidth:parseInt(getSelectValueById("geneplot_s2_lw")),
			 colors:[document.getElementById("geneplot_s2_lc").style.backgroundColor],
			 legend:"none",
			 hAxis:{'title':"Genomic positions from 5' to 3'"},
			 vAxis:{'title':"Data point values"},
			 }
		);
		done();
		return;
	}
	if(rendering == "r") {
		var ll = data["image"].split('/');
		Rimage.src = 't/'+ll[ll.length-1];
		done();
		return;
	}
}
if(type == "s3") {
	// hard-coded info about gene parts
	if(rendering == "gc") {
		var showaverage = document.getElementById('geneplot_s3_average').checked;
		var Gdata = new google.visualization.DataTable();
		Gdata.addColumn('string', 'POS'); // string index, "promoter 1"
		for(var k=0; k<5; k++) {
			Gdata.addColumn('number', "minimum");
			Gdata.addColumn('number', "lower quartile");
			Gdata.addColumn('number', "median");
			if(showaverage)
				Gdata.addColumn('number', 'average');
			Gdata.addColumn('number', "upper quartile");
			Gdata.addColumn('number', "maximum");
		}
		var totalNum = spnum*5;
		Gdata.addRows(totalNum);
		// set value for each gene part
		var lst = ['promoter','5\' UTR', 'exons', 'introns', '3\' UTR'];
		var tmpi;
		var m = showaverage ? 6 : 5; // |o|
		for(k=0; k<5; k++) {
			for(i=0; i<spnum; i++) {
				var j = i+spnum*k;
				Gdata.setValue(j, 0, lst[k]+' '+(i+1));
			var v = data['data'][j];
			Gdata.setValue(j, k*m+1, v[0]);
			Gdata.setValue(j, k*m+2, v[1]);
			Gdata.setValue(j, k*m+3, v[2]);
			tmpi = k*m+4;
			if(showaverage)
				Gdata.setValue(j, tmpi++, v[3]);
			Gdata.setValue(j, tmpi++, v[4]);
			Gdata.setValue(j, tmpi, v[5]);
			}
		}
		var collst = []; // list of color for all lines
		var col = document.getElementById("geneplot_s3_promoterc").style.backgroundColor;
		var lst = colorstr2int(col);
		collst.push(lightencolor(lst,.8));
		collst.push(lightencolor(lst,.5));
		collst.push(col);
		if(showaverage) collst.push(darkencolor(lst, .4));
		collst.push(lightencolor(lst,.5));
		collst.push(lightencolor(lst,.8));
		col = document.getElementById("geneplot_s3_utr5c").style.backgroundColor;
		lst = colorstr2int(col);
		collst.push(lightencolor(lst,.8));
		collst.push(lightencolor(lst,.5));
		collst.push(col);
		if(showaverage) collst.push(darkencolor(lst, .4));
		collst.push(lightencolor(lst,.5));
		collst.push(lightencolor(lst,.8));
		col = document.getElementById("geneplot_s3_exonsc").style.backgroundColor;
		lst = colorstr2int(col);
		collst.push(lightencolor(lst,.8));
		collst.push(lightencolor(lst,.5));
		collst.push(col);
		if(showaverage) collst.push(darkencolor(lst, .4));
		collst.push(lightencolor(lst,.5));
		collst.push(lightencolor(lst,.8));
		col = document.getElementById("geneplot_s3_intronsc").style.backgroundColor;
		lst = colorstr2int(col);
		collst.push(lightencolor(lst,.8));
		collst.push(lightencolor(lst,.5));
		collst.push(col);
		if(showaverage) collst.push(darkencolor(lst, .4));
		collst.push(lightencolor(lst,.5));
		collst.push(lightencolor(lst,.8));
		col = document.getElementById("geneplot_s3_utr3c").style.backgroundColor;
		lst = colorstr2int(col);
		collst.push(lightencolor(lst,.8));
		collst.push(lightencolor(lst,.5));
		collst.push(col);
		if(showaverage) collst.push(darkencolor(lst, .4));
		collst.push(lightencolor(lst,.5));
		collst.push(lightencolor(lst,.8));
		new google.visualization.LineChart(gcdiv).draw(Gdata, 
			{width:parseInt(getSelectValueById("geneplot_s3_iw")),
			 height:parseInt(getSelectValueById("geneplot_s3_ih")),
			 lineWidth:parseInt(getSelectValueById("geneplot_s3_lw")),
			 colors:collst,
			 legend:'none',
			 hAxis:{'title':"Genomic positions from 5' to 3'"},
			 vAxis:{'title':"Data value distribution"},
		});
		done();
		return;
	}
	if(rendering == "r") {
		var ll = data["image"].split('/');
		Rimage.src = 't/'+ll[ll.length-1];
		done();
		return;
	}
}
if(type == "s4") {
	var clustmethod = getSelectValueById("geneplot_s4_m");
	var is_hclust = clustmethod == 'h';
	var is_kmeans = clustmethod == 'k';
	var rheight = parseInt(getSelectValueById("geneplot_s4_rh")); // row height
	var pwidth = parseInt(getSelectValueById("geneplot_s4_dpw")); // data point width
	G.canvasrheight = rheight;
	G.canvaspwidth = pwidth;
	var canvas = document.getElementById("geneplotheatmap");
	canvas.width = spnum * pwidth;
	var genenum = 0;
	var safe2real = {}; // key: safe name, val: real name
	for(var gname in data.data) {
		genenum++;
		safe2real[gname] = data.data[gname][0];
	}
	G.safe2real = safe2real;
	if('zerosdgene' in data) {
		var lst = data['zerosdgene'];
		document.getElementById("zerosdgeneholder").innerHTML = lst.join('<br>');
		document.getElementById("zerosdgenenum").innerHTML = lst.length;
		document.getElementById("haszerosdgene").style.display = "block";
	}
	canvas.height = genenum * rheight;

	// use global min/max to render heatmap?
	var globalth = document.getElementById("geneplot_s4_global").checked;
	var pth=0; // max of positive
	var nth=0; // min of negative
	if(globalth) {
		max = 0;
		for(gname in data.data) {
			var v = data.data[gname].slice(1);
			for(i=0; i<spnum; i++) {
				if(v[i] > 0) {
					if(v[i] > pth) pth = v[i];
				} else {
					if(v[i] < nth) nth = v[i];
				}
			}
		}
	}

	/* list of integers (0-xx) representing genes
	   or safe names??
	   determines vertical order of appearance of genes in heatmap
	 */
	var genelst = [];
	// genenum is just length of genelst

	if(is_kmeans) {
		/* assign genes to kmeans clusters, reorder geneplot.genelst for tooltip */
		genelst = data.kmnames;
		G.kmeansclusters = []; // [0] is undefined, cluster id start from 1
		for(i=0; i<data.kmnamecluster.length; i++) {
			var cid = data.kmnamecluster[i];
			if(G.kmeansclusters[cid] == undefined)
				G.kmeansclusters[cid] = [];
			G.kmeansclusters[cid].push(genelst[i]);
		}
		// reorder genelst according to cluster order
		genelst = [];
		for(i=1; i<G.kmeansclusters.length; i++)
			genelst = genelst.concat(G.kmeansclusters[i]);
	} else {
		genelst = data.hclustgenelst;
	}
	G.genelst = genelst;

	// render heatmap!
	var pclst = colorstr2int(document.getElementById("geneplot_s4_pc").style.backgroundColor);
	var nclst = colorstr2int(document.getElementById("geneplot_s4_nc").style.backgroundColor);
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = 'white'; // paint canvas with white, the baseline color
	ctx.fillRect(0,0, canvas.width, canvas.height);
	var yoffset = 0;
	for(var row=0; row<genelst.length; row++) {
		var v = data.data[genelst[row]].slice(1);
		if(!globalth) {
			// figure out threshold value for each data vector
			pth = 0;
			nth = 0;
			for(i=0; i<v.length; i++) {
				if(v[i] > 0) {
					if(v[i] > pth) pth = v[i];
				} else {
					if(v[i] < nth) nth = v[i];
				}
			}
		}
		for(i=0; i<spnum; i++) {
			if(v[i] > 0) {
				ctx.fillStyle = lightencolor(pclst, 1-v[i]/pth);
				ctx.fillRect(i*pwidth, yoffset, pwidth, rheight);
			} else if(v[i] < 0) {
				ctx.fillStyle = lightencolor(nclst, 1-v[i]/nth);
				ctx.fillRect(i*pwidth, yoffset, pwidth, rheight);
			}
		}
		yoffset += rheight;
	}

	if(is_kmeans) {
		// make buttons for clusters
		var holder = document.getElementById("geneplot_kmeansclusterbuttonholder");
		stripChild(holder, 0);
		for(i=1; i<G.kmeansclusters.length; i++) {
			var d = dom_create('div',holder);
			var h = G.kmeansclusters[i].length*rheight;
			if(h > 10)
				d.innerHTML = "<div style='font-size:10px;margin-top:"+((h-10)/2)+";'>cluster "+i+"</div>";
			else
				d.innerHTML = "cluster "+i;
			d.style.height = h;
			d.className = "kmeansclusterbutton";
			d.cluster = i;
			d.addEventListener("click", geneplotkmeansclusterbuttonclick, false);
		}
		lst = absolutePosition(canvas);
		G.canvasX = lst[0];
		G.canvasY = lst[1];
		done();
		return;
		/*** done for kmeans ***/
	}
	/*** hierarchical dendrogram 
		 layed horizontally, hc$height will be X positions, y need to be determined
	 hc$labels contain R's stubborn list of safe names

	 in hc$merge:
		 - negative integers, negate of which are array index in stubburn list
		 - negative int need to be converted into array index of genelst
		   by the actual safe name
		   but it still need to be kept negative to be different with cluster id
		 - positive integers are cluster id
		 - the array index (start from 1) are cluster id in it
	 in hc$height:
		 array index (start from 1) are cluster id
		 value is height of that cluster
		 here it is horizontal distance of branching point to left border of heatmap

	 genelst array idx (start from 1) is cluster id
	 ***/
	var hclabels = data.hclustlabels; // stubborn list
	hclabels.unshift(undefined);
	var merge = data.hclustmerge;
	merge.unshift([]);
	/* convert stubborn array index into genelst array index for hc$merge */
	for(i=1; i<genenum; i++) {
		var v = merge[i][0];
		if(v <0) merge[i][0] = -(getArrIdx(hclabels[-v], genelst)+1);
		v = merge[i][1];
		if(v <0) merge[i][1] = -(getArrIdx(hclabels[-v], genelst)+1);
	}
	var clusterxraw = data.hclustheight;
	clusterxraw.unshift(0);
	var clusterx = []; // array index is cluster id, to hold real plotting x coord
	var maxX = 0;
	for(i=1; i<genenum; i++) {
		if(clusterxraw[i] > maxX) maxX = clusterxraw[i];
	}
	// clusterx values will be updated to x plotting coord on canvas
	var canvaswidth = 200;
	// scale the canvas width somewhat with genenumber
	if(genenum > 70)
		canvaswidth = canvaswidth + genenum-70;
	if(canvaswidth > 400) canvaswidth = 400;
	var sc = canvaswidth/maxX; // scaling factor, from hc$height to plotting width

	/* layout and determine y position of clusters */
	var clustery = []; // array index is cluster id, to hold raw y plotting coord of clusters
	for(i=1; i<genenum; i++) {
		// i is cluster id
		clusterx[i] = canvaswidth - clusterxraw[i]*sc;
		if(clusterx[i] >= canvaswidth) clusterx[i] = canvaswidth-1;
		var c1v = merge[i][0]; // value of child 1
		var c2v = merge[i][1]; // value of child 2
		if(c1v < 0) {
			// first child is gene
			if(c2v < 0) {
				// both children are gene
				clustery[i] = c1v<c2v ? -c2v : -c1v;
			} else {
				// second child is cluster
				clustery[i] = (clustery[c2v]-c1v)/2;
			}
		} else {
			// first child is cluster
			if(c2v < 0) {
				// second child is gene
				clustery[i] = (clustery[c1v]-c2v)/2;
			} else {
				// both children are clusters
				clustery[i] = (clustery[c1v]+clustery[c2v])/2;
			}
		}
	}
	// convert clustery from row index to actual plotting coord
	for(i=1; i<genenum; i++)
		clustery[i] *= rheight;

	G.merge = merge;
	G.clusterx = clusterx;
	G.clustery = clustery;
	G.genenum = genenum;
	G.highlightcluster = {};
	G.rheight = rheight;

	// render dendrogram
	canvas = document.getElementById("geneplotdendrogram");
	canvas.style.display = "block";
	canvas.width = canvaswidth;
	canvas.height = genenum * rheight;
	ctx = canvas.getContext("2d");
	ctx.fillStyle = "black";
	renderGeneplotDendrogram();

	lst = absolutePosition(canvas);
	G.dendroX = lst[0];
	G.dendroY = lst[1];

	// cache cluster plotting coordinate for clicking
	var ccrd = {}; // see geneplot.ccrd
	G.ccrd = ccrd;
	for(i=1; i<genenum; i++) {
		// use four-pixel square to denote cluster
		var x=[],y=[];
		if(Math.floor(clusterx[i]) != Math.ceil(clusterx[i])) {
			x[1] = Math.floor(clusterx[i]);
			x[0] = x[1]-1;
			x[2] = x[1]+1;
			x[3] = x[1]+2;
		} else {
			x[1] = clusterx[i];
			x[0] = x[1]-1;
			x[2] = x[1]+1;
		}
		if(Math.floor(clustery[i]) != Math.ceil(clustery[i])) {
			y[1] = Math.floor(clustery[i]);
			y[0] = y[1]-1;
			y[2] = y[1]+1;
			y[3] = y[1]+2;
		} else {
			y[1] = clustery[i];
			y[0] = y[1]-1;
			y[2] = y[1]+1;
		}
		//var x0 = parseInt(clusterx[i]), y0 = parseInt(clustery[i]);
		//x = [x0-1, x0, x0+1]; y = [y0-1, y0, y0+1];
		for(j=0; j<x.length; j++) {
			for(k=0; k<y.length; k++) {
				if(!(x[j] in ccrd)) ccrd[x[j]]={};
			ccrd[x[j]][y[k]] = i;
			}
		}
	}

	// only do this after dendrogram canvas is made (affects position of heatmap)
	lst = absolutePosition(document.getElementById("geneplotheatmap"));
	G.canvasX = lst[0];
	G.canvasY = lst[1];
	done();
	return;
}
}

function renderGeneplotDendrogram()
{
var canvas = document.getElementById("geneplotdendrogram");
var canvaswidth = canvas.width;
var ctx = canvas.getContext("2d");
ctx.clearRect(0,0,canvas.width, canvas.height);
var G=apps.gplot;
var rheight = G.rheight;
var clusterx = G.clusterx;
for(var i=1; i<G.genenum; i++) {
	ctx.fillStyle = (i in G.highlightcluster) ? "red" : "black";
	var y1,y2;
	// plot horizontal line of first child
	var c = G.merge[i][0];
	if(c < 0) {
		y1 = (-c-0.5) * rheight;
		ctx.fillRect(clusterx[i], y1, canvaswidth-clusterx[i], 1);
	} else {
		y1 = G.clustery[c];
		ctx.fillRect(clusterx[i], y1, clusterx[c]-clusterx[i], 1);
	}
	// plot horizontal line for second child
	c = G.merge[i][1];
	if(c < 0) {
		y2 = (-c-0.5) * rheight;
		ctx.fillRect(clusterx[i], y2, canvaswidth-clusterx[i], 1);
	} else {
		y2 = G.clustery[c];
		ctx.fillRect(clusterx[i], y2, clusterx[c]-clusterx[i], 1);
	}
	// vertical line between two children
	if(y1 < y2)
		ctx.fillRect(clusterx[i], y1, 1, y2-y1);
	else
		ctx.fillRect(clusterx[i], y2, 1, y1-y2);
}
}
function geneplotdendrogramclick(event)
{
// called by clicking on geneplot dendrogram, detect cluster
var G=apps.gplot;
var x = event.clientX+document.body.scrollLeft-G.dendroX;
var y = event.clientY+document.body.scrollTop-G.dendroY-1;
//print2console(x+' '+y,0);
if(x in G.ccrd) {
	if(y in G.ccrd[x]) {
		var targetcluster = G.ccrd[x][y];
		G.highlightcluster = {};
		G.highlightgenes = [];
		geneplot_getchild_recursive(targetcluster);
		renderGeneplotDendrogram();
		//geneplot_getselectedgenedef_gotoholder();
	}
}
}
function geneplotkmeansclusterbuttonclick(event)
{
var cluster = event.target.cluster;
if(cluster == undefined)
	cluster = event.target.parentNode.cluster;
// called by clicking on kmeans cluster button
apps.gplot.highlightgenes = apps.gplot.kmeansclusters[cluster];
//geneplot_getselectedgenedef_gotoholder();
}
function geneplot_getchild_recursive(i)
{
var G=apps.gplot;
G.highlightcluster[i] = 1;
var c =G.merge[i][0];
if(c > 0)
	geneplot_getchild_recursive(c);
else
	G.highlightgenes.push(G.genelst[-c-1]);
c = G.merge[i][1];
if(c > 0)
	geneplot_getchild_recursive(c);
else
	geneplot.highlightgenes.push(G.genelst[-c-1]);
}
function geneplot_getdata(tabletype)
{
// called by clicking button
var G=apps.gplot;
var plottype = G.graphtype;

if(tabletype == 1) {
	// use Google Chart to make interactive table
	var holder = document.getElementById("googletablediv");
	holder.style.display = "block";
	document.getElementById("geneplot_dataplaintext").style.display = "none";
	var data = new google.visualization.DataTable();
	if(plottype == "s1") {
		var nrow = G.data.length;
		data.addColumn("number", "data point #");
		data.addColumn("number", "minimum");
		data.addColumn("number", "lower quartile");
		data.addColumn("number", "median");
		data.addColumn("number", "average");
		data.addColumn("number", "upper quartile");
		data.addColumn("number", "maximum");
		data.addRows(nrow);
		for(var i=0; i<nrow; i++) {
			data.setCell(i, 0, i+1);
			var v = G.data[i];
			data.setCell(i, 1, v[0]);
			data.setCell(i, 2, v[1]);
			data.setCell(i, 3, v[2]);
			data.setCell(i, 4, v[3]);
			data.setCell(i, 5, v[4]);
			data.setCell(i, 6, v[5]);
		}
		new google.visualization.Table(holder).draw(data, {showRowNumber:false,});
	} else if(plottype == "s2") {
		var nrow = G.data.length;
		var ncol = G.data[0].length-1;
		data.addColumn("string", "gene name");
		for(var i=0; i<ncol; i++)
			data.addColumn("number", i+1);
		data.addRows(nrow);
		for(i=0; i<nrow; i++) {
			data.setCell(i, 0, G.data[i][0]);
			for(var j=0; j<ncol; j++)
				data.setCell(i, j+1, G.data[i][j+1]);
		}
		new google.visualization.Table(holder).draw(data);
	} else if(plottype == "s3") {
		data.addColumn("string", "data point");
		data.addColumn('number', 'minimum');
		data.addColumn('number', 'lower quartile');
		data.addColumn('number', 'median');
		data.addColumn('number', 'average');
		data.addColumn('number', 'upper quartile');
		data.addColumn('number', 'maximum');
		var total = G.data.length;
		data.addRows(total);
		var spnum = total/5;
		var lst = ['promoter', '5\' UTR', 'exons', 'introns', '3\' UTR'];
		for(var k=0; k<5; k++) {
			for(var i=0; i<spnum; i++) {
				var j = k*spnum + i;
				data.setCell(j, 0, lst[k]+' '+(i+1));
				var v = G.data[j];
				data.setCell(j, 1, v[0]);
				data.setCell(j, 2, v[1]);
				data.setCell(j, 3, v[2]);
				data.setCell(j, 4, v[3]);
				data.setCell(j, 5, v[4]);
				data.setCell(j, 6, v[5]);
			}
		}
		new google.visualization.Table(holder).draw(data);
	} else if(plottype == "s4") {
		var genes = [];
		for(var g in G.data)
			genes.push(g);
		var ncol = G.data[genes[0]].length-1;
		data.addColumn("string", "gene name");
		for(var i=0; i<ncol; i++)
			data.addColumn("number", i+1);
		data.addRows(genes.length);
		for(i=0; i<genes.length; i++) {
			data.setCell(i, 0, G.safe2real[genes[i]]);
			var v = G.data[genes[i]];
			for(var j=0; j<ncol; j++)
				data.setCell(i, j+1, v[j+1]);
		}
		new google.visualization.Table(holder).draw(data);
	}
	return;
}

// doing text output
var holder = document.getElementById("geneplot_dataplaintext");
holder.style.display = "block";
document.getElementById("googletablediv").style.display = "none";
var table = holder.firstChild;
stripChild(table.firstChild, 0);
var tr = table.insertRow(0);
var td = tr.insertCell(0);

if(plottype == 's1') {
	td.innerHTML = "data point #";
	tr.insertCell(-1).innerHTML = "minimum";
	tr.insertCell(-1).innerHTML = "lower quartile";
	tr.insertCell(-1).innerHTML = "median";
	tr.insertCell(-1).innerHTML = "average";
	tr.insertCell(-1).innerHTML = "upper quartile";
	tr.insertCell(-1).innerHTML = "maximum";
	for(var i=0; i<G.data.length; i++) {
		tr = table.insertRow(-1);
		tr.insertCell(0).innerHTML = i+1;
		var v = G.data[i];
		tr.insertCell(-1).innerHTML = v[0];
		tr.insertCell(-1).innerHTML = v[1];
		tr.insertCell(-1).innerHTML = v[2];
		tr.insertCell(-1).innerHTML = v[3];
		tr.insertCell(-1).innerHTML = v[4];
		tr.insertCell(-1).innerHTML = v[5];
	}
	return;
}
if(plottype == 's2') {
	td.innerHTML = "gene name";
	var num = G.data[0].length-1;
	for(i=0; i<num; i++)
		tr.insertCell(-1).innerHTML = i+1;
	for(i=0; i<G.data.length; i++) {
		tr = table.insertRow(-1);
		td = tr.insertCell(0); td.innerHTML = G.data[i][0];
		for(var j=0; j<num; j++)
			tr.insertCell(-1).innerHTML = G.data[i][j+1];
	}
	return;
}
if(plottype == "s3") {
	td.innerHTML = "data point";
	tr.insertCell(-1).innerHTML = "minimum";
	tr.insertCell(-1).innerHTML = "lower quartile";
	tr.insertCell(-1).innerHTML = "median";
	tr.insertCell(-1).innerHTML = "average";
	tr.insertCell(-1).innerHTML = "upper quartile";
	tr.insertCell(-1).innerHTML = "maximum";
	var total = G.data.length;
	var spnum = total/5;
	var lst = ['promoter', '5\' UTR', 'exons', 'introns', '3\' UTR'];
	for(var k=0; k<5; k++) {
		for(var i=0; i<spnum; i++) {
			tr = table.insertRow(-1);
			var j = k*spnum + i;
			tr.insertCell(0).innerHTML = lst[k]+' '+(i+1);
			var v = G.data[j];
			tr.insertCell(-1).innerHTML = v[0];
			tr.insertCell(-1).innerHTML = v[1];
			tr.insertCell(-1).innerHTML = v[2];
			tr.insertCell(-1).innerHTML = v[3];
			tr.insertCell(-1).innerHTML = v[4];
			tr.insertCell(-1).innerHTML = v[5];
		}
	}
	return;
}
if(plottype == "s4") {
	td.innerHTML = "gene name";
	var genes = [];
	for(var g in G.data)
		genes.push(g);
	var num = G.data[genes[0]].length-1;
	for(i=0; i<num; i++) {
		tr.insertCell(-1).innerHTML = i+1;
	}
	for(i=0; i<genes.length; i++) {
		tr = table.insertRow(-1);
		tr.insertCell(0).innerHTML = G.safe2real[genes[i]];
		var v = G.data[genes[i]];
		for(var j=0; j<num; j++) {
			tr.insertCell(-1).innerHTML = v[j+1];
		}
	}
	return;
}
/*over*/
}

function gplot_showgeneset(event)
{
// clicking button
var lst=apps.gplot.bbj.genome.geneset.lst;
if(lst.length==0) {
	print2console('No gene sets available. Go to "Gene Set" panel and add new gene set.',2);
	return;
}
menu_showgeneset(apps.gplot.bbj,event.target,gplot_choosegeneset);
}


function gplot_choosegeneset(event)
{
// click a geneset
menu_hide();
gplot_gs_chosen(event.target.idx);
}

function gplot_gs_chosen(idx)
{
// a gs is chosen for gplot
var e=apps.gplot.bbj.genome.geneset.lst[idx];
apps.gplot.geneset=e;
stripChild(apps.gplot.ui_geneset_says,0);
dom_addtkentry(3,apps.gplot.ui_geneset_says,false,null,e.name);
}
