function toggle18()
{
// bev panel
var bait=apps.bev.main;
if(bait.style.display=="none") {
	var d=bait.__contentdiv;
	stripChild(d,0);
	d.appendChild(gflag.browser.genome.bev.main);
	cloakPage();
	panelFadein(bait, 50+document.body.scrollLeft, 50+document.body.scrollTop);
	menu_hide();
	apps.bev.bbj=gflag.browser;
} else {
	pagecloak.style.display="none";
	panelFadeout(bait);
}
}

Genome.prototype.bev_prepare=function()
{
/* compute chr drawing width, set canvas width
if canvas is missing, create
called by:
- initializing bev panel
- changing width
*/
var maxbplen = 0;
for(var i=0; i<this.bev.chrlst.length; i++) {
	maxbplen=Math.max(this.scaffold.len[this.bev.chrlst[i][0]], maxbplen);
}
var maxlength = this.bev.config.maxpxwidth;
var sf = maxlength / maxbplen;
this.bev.sf=sf;
for(var i=0; i<this.bev.chrlst.length; i++) {
	var c=this.bev.chrlst[i];
	c[1]=Math.ceil(sf*this.scaffold.len[c[0]]);
	if(c[2]==null) {
		/* initialize this chr */
		var tr=this.bev.viewtable.insertRow(-1);
		var td=tr.insertCell(0);
		td.rowSpan=2;
		td.vAlign='bottom';
		td.align='right';
		td.style.paddingLeft=20;
		td.innerHTML=c[0]; // chr name
		td=tr.insertCell(1);
		c[3]=td; // tk canvas holder
		tr=this.bev.viewtable.insertRow(-1);
		td=tr.insertCell(0); // chr bar holder
		c[2]=dom_create('canvas',td);
		c[2].style.opacity=.5;
		c[2].chrom=c[0];
		c[2].addEventListener('mousedown', bev_zoomin_Md,false);
	}
	c[2].width=c[1]+1;
	// height is set in bev_draw_chrs
}
}

Genome.prototype.bev_draw=function()
{
/* draw chrs and tracks, all
*/
this.bev_draw_chrs();
for(var i=0; i<this.bev.tklst.length; i++) {
	this.bev_draw_track(this.bev.tklst[i]);
	this.bev_trackcanvas2holder(this.bev.tklst[i]);
}
}

Genome.prototype.bev_trackcanvas2holder=function(tkobj)
{
var lst=this.bev.chrlst;
for(var i=0; i<lst.length; i++) {
	lst[i][3].appendChild(tkobj.chrcanvas[lst[i][0]]);
}
}

Genome.prototype.bev_draw_chrs=function()
{
// draw chromosomes
for(var i=0; i<this.bev.chrlst.length; i++) {
	var c=this.bev.chrlst[i];
	var canvas=c[2];
	canvas.height=this.bev.config.chrbarheight;
	if(canvas.height<=this.bev.config.chrbarminheight) {
		canvas.style.display='none';
		canvas.parentNode.style.borderTop='solid 1px '+colorCentral.foreground_faint_1;
	} else {
		canvas.style.display='block';
		canvas.parentNode.style.borderTop='';
		drawIdeogramSegment_simple(
			this.getcytoband4region2plot(c[0], 0, this.scaffold.len[c[0]], c[1]),
			canvas.getContext('2d'),
			0, 0, c[1], this.bev.config.chrbarheight-1, false);
	}
}
}

Genome.prototype.bev_draw_track=function(tkobj)
{
/* draw one track, data must be ready
track is different with browser track object
it has one canvas for each chr
in .chrcanvas, a hash
*/
if(!tkobj.chrcanvas) {
	tkobj.chrcanvas={};
	for(var i=0; i<this.bev.chrlst.length; i++) {
		var c=document.createElement('canvas');
		c.style.display='block';
		c.addEventListener('mousemove',bev_tkcanvas_mmove,false);
		c.addEventListener('mouseout',pica_hide,false);
		c.addEventListener('mousedown',bev_zoomin_Md,false);
		c.oncontextmenu=menu_bevTrack;
		c.chrom=this.bev.chrlst[i][0];
		c.tkname=tkobj.name;
		tkobj.chrcanvas[c.chrom]=c;
	}
}
if(tkobj.ft==FT_cat_n||tkobj.ft==FT_cat_c) {
	for(var i=0; i<this.bev.chrlst.length; i++) {
		var citem=this.bev.chrlst[i];
		var canvas=tkobj.chrcanvas[citem[0]];
		canvas.width=citem[1];
		canvas.height=tkobj.qtc.height;
		catetk_plot_base(tkobj.data[citem[0]], tkobj.cateInfo, 0, citem[1]-1, canvas.getContext('2d'), tkobj.qtc,
			0,0,1,canvas.height,false)
	}
	return;
}
if(tkobj.ft==FT_gs) {
	// .x .w is ready for every item
	for(var i=0; i<this.bev.chrlst.length; i++) {
		var citem=this.bev.chrlst[i];
		var canvas=tkobj.chrcanvas[citem[0]];
		if(!(citem[0] in tkobj.data)) {
			// no items on this chr
			canvas.style.display='none';
			continue;
		}
		canvas.width=citem[1];
		canvas.height=tkobj.qtc.height;
		var lst=tkobj.data[citem[0]];
		var ctx=canvas.getContext('2d');
		ctx.fillStyle='rgb('+tkobj.qtc.pr+','+tkobj.qtc.pg+','+tkobj.qtc.pb+')';
		for(var j=0; j<lst.length;j++) {
			ctx.fillRect(lst[j].x,0,lst[j].w,tkobj.qtc.height);
		}
	}
	return;
}
// quantitiative data
// data is chr:[], gather into a nested array
var data=[];
for(var i=0; i<this.bev.chrlst.length; i++) {
	data.push(tkobj.data[this.bev.chrlst[i][0]]);
}
// min max
var exvalue=qtrack_getthreshold(data, tkobj.qtc, 0, data.length-1, 0, data[data.length-1].length-1);
tkobj.max=exvalue[0];
tkobj.min=exvalue[1];

for(var i=0; i<this.bev.chrlst.length; i++) {
	var citem=this.bev.chrlst[i];
	var canvas=tkobj.chrcanvas[citem[0]];
	canvas.width=citem[1];
	canvas.height=tkobj.qtc.height;
	apps.bev.bbj.barplot_base({
		data:data[i], 
		ctx:canvas.getContext('2d'), 
		colors:{p:'rgb('+tkobj.qtc.pr+','+tkobj.qtc.pg+','+tkobj.qtc.pb+')',
			 n:'rgb('+tkobj.qtc.nr+','+tkobj.qtc.ng+','+tkobj.qtc.nb+')',
			 pth:tkobj.qtc.pth,
			 nth:tkobj.qtc.nth},
		tk:{maxv:exvalue[0], minv:exvalue[1]},
		x:0,
		y:0,
		w:1,
		h:tkobj.qtc.height,
		pointup:true,
		tosvg:false});
}
}

Browser.prototype.bev_ajax=function(_tklst)
{
/* arg is optional, if missing, will update all tracks
only do ajax when there's track
*/
if(!_tklst) {
	if(this.genome.bev.tklst.length==0) {
		this.genome.bev_draw();
		return;
	}
	_tklst=this.genome.bev.tklst;
}
// skip ajax for geneset track 
var newlst=[];
for(var i=0; i<_tklst.length; i++) {
	if(_tklst[i].ft==FT_gs) {
		this.genome.bev_preparegeneset(_tklst[i]);
		this.genome.bev_draw_track(_tklst[i]);
	} else {
		newlst.push(_tklst[i]);
	}
}
if(newlst.length==0) {
	// in the case of resizing width, chr bar must be redrawn
	this.genome.bev_draw_chrs();
	for(var i=0; i<this.genome.bev.tklst.length; i++) {
		this.genome.bev_trackcanvas2holder(this.genome.bev.tklst[i]);
	}
	// no tk for ajax, done
	return;
}
_tklst=newlst;
var param=[];
var lastchrbp=0;
for(var i=0; i<this.genome.bev.chrlst.length; i++) {
	var t= this.genome.bev.chrlst[i];
	lastchrbp=this.genome.scaffold.len[t[0]];
	param.push(t[0]+',0,'+lastchrbp+','+t[1]);
}
loading_cloak(apps.bev.main);
var bbj=this;
let paramsObj = {
	addtracks: "on",
	runmode: RM_genome,
	regionLst: param.join(','),
	startCoord: 0,
	stopCoord: lastchrbp,
	dbName: this.genome.name,
}
paramsObj = Object.assign(paramsObj, trackParam(_tklst));
this.ajax(paramsObj,function(data){bbj.bev_ajax_cb(data);});
}

Browser.prototype.bev_ajax_cb=function(data,tklst)
{
loading_done();
if(!data) {
	print2console('Cannot add tracks',2);
	return;
}
var lst=data.tkdatalst;
if(lst.length==0) {
	print2console('No tracks',2);
	return;
}
var _tklst=this.genome.bev.tklst;
for(var j=0; j<lst.length; j++) {
	for(var i=0; i<_tklst.length; i++) {
		if(_tklst[i].name==lst[j].name) {
			_tklst[i].data={};
			for(var k=0; k<this.genome.bev.chrlst.length; k++) {
				_tklst[i].data[this.genome.bev.chrlst[k][0]]=lst[j].data[k];
			}
			break;
		}
	}
}
// in the case of resizing width, chr bar must be redrawn, so draw whole graph
this.genome.bev_draw();
}

function bev_addtrack_invoketkselect(event)
{
menu_shutup();
menu_show_beneathdom(0,event.target);
var bbj=apps.bev.bbj;
bbj.showcurrenttrack4select(tkentryclick_bev,ftfilter_ordinary);
}

function tkentryclick_bev(event)
{
if(event.target.className=='tkentry_inactive') return;
var tk=event.target.tkobj;
var bbj=apps.bev.bbj;
if(tk.ft==FT_lr_n||tk.ft==FT_lr_c||tk.ft==FT_cm_c) {
	print2console('Sorry but this track cannot be used here',2);
	return;
}
if(tk.ft==FT_sam_n||tk.ft==FT_sam_c||tk.ft==FT_bam_n||tk.ft==FT_bam_c) {
	print2console('Sorry but BAM track cannot be used here yet',2);
	return;
}
event.target.className='tkentry_inactive';
bbj.bev_mayaddtrack(tk);
}

function bev_tkcanvas_mmove(event)
{
var bev=apps.bev.bbj.genome.bev;
for(var i=0; i<bev.tklst.length; i++) {
	var tk=bev.tklst[i];
	if(tk.name!=event.target.tkname) continue;
	var x=event.clientX+document.body.scrollLeft-absolutePosition(event.target)[0];

	var text='<div style="padding:5px;font-size:16px;color:white;">';
	if(tk.ft==FT_cat_n||tk.ft==FT_cat_c) {
		var v=tk.cateInfo[tk.data[event.target.chrom][x]];
		text+='<div class=squarecell style="display:inline-block;background-color:'+v[1]+';"></div> '+v[0];
	} else if(tk.ft==FT_gs) {
		var lst=tk.data[event.target.chrom];
		var lst2=[];
		for(var j=0; j<lst.length; j++) {
			var x2=lst[j].x;
			if(x>=x2-1 && x<=x2+1) {
				lst2.push(lst[j].name);
				continue;
			}
			var x3=lst[j].w;
			if(x>=x2 && x<=x2+x3) {
				lst2.push(lst[j].name);
				continue;
			}
			x2+=x3;
			if(x>=x2-1 && x<=x2+1) {
				lst2.push(lst[j].name);
				continue;
			}
		}
		if(lst2.length>0) {
			text+=lst2.join('<br>');
		}
	} else {
		// numerical
		var v=tk.data[event.target.chrom][x];
		text+=isNaN(v)?'No data':v;
	}
	picasays.innerHTML=text+'<div style="padding-top:5px;font-size:12px;color:#c5d5d5;">'+tk.label+'<br>'+
		event.target.chrom+' '+parseInt(x/bev.sf)+'</div>';
	pica_go(event.clientX, event.clientY);
	return;
}
}

function menuBirdeyeview()
{
if(gflag.menu.context==3) {
	// gs 2 bev
	panelFadeout(apps.gsm.main);
	toggle18();
	gflag.menu.bbj.genome.bev_addgeneset(menu.genesetIdx);
} else {
	// over a browser track
	gflag.menu.bbj.bev_mayaddtrack(gflag.menu.tklst[0]);
}
menu_hide();
}

function bev_zoomin_Md(event) {
/* pressing on canvas of chr bar, or any of the tracks
canvas must have .chrom for identification
*/
	if(event.button != 0) return;
	event.preventDefault();
	// whole holder of tracks belonging to this chr
	var bev=apps.bev.bbj.genome.bev;
	var holder=null;
	for(var i=0; i<bev.chrlst.length; i++) {
		if(bev.chrlst[i][0]==event.target.chrom) {
			holder=bev.chrlst[i][3];
			break;
		}
	}
	if(holder==null) fatalError('bev_zoomin_Md: unknown chr name');
	var pos = absolutePosition(holder);
	indicator.style.display="block";
	indicator.style.left = event.clientX + document.body.scrollLeft;
	indicator.style.top = pos[1]-bev.viewtable.parentNode.scrollTop;
	indicator.style.width = 0;
	indicator.style.height = holder.clientHeight+bev.config.chrbarheight+4;
	gflag.zoomin={
		x:event.clientX+document.body.scrollLeft,
		xcurb:pos[0],
		chr:event.target.chrom,
		canvas:event.target,
		};
	document.body.addEventListener("mousemove", bev_zoomin_Mm, false);
	document.body.addEventListener("mouseup", bev_zoomin_Mu, false);
}

function bev_zoomin_Mm(event)
{
var currx = event.clientX + document.body.scrollLeft;
var n=gflag.zoomin;
if(currx > n.x) {
	if(currx < n.xcurb+n.canvas.width) {
		indicator.style.width = currx - n.x;
	}
} else {
	if(currx >= n.xcurb) {
		indicator.style.width = n.x - currx;
		indicator.style.left = currx;
	}
}
}

function bev_zoomin_Mu(event)
{
document.body.removeEventListener("mousemove", bev_zoomin_Mm, false);
document.body.removeEventListener("mouseup", bev_zoomin_Mu, false);
indicator.style.display = "none";
var bbj=apps.bev.bbj;
if(bbj.is_gsv()){
	print2console('Cannot relocate when running Gene Set View',2);
	return;
}
var n=gflag.zoomin;
var x = parseInt(indicator.style.left)-n.xcurb; // relative to minichr canvas div
var w = parseInt(indicator.style.width);
if(w==0) return;
var coord1=x/bbj.genome.bev.sf;
var coord2=coord1+w/bbj.genome.bev.sf;
if(coord1>bbj.genome.scaffold.len[n.chr]) return;
coord2=Math.max(coord2, coord1+bbj.hmSpan/MAXbpwidth_bold);
if(coord2>bbj.genome.scaffold.len[n.chr]) return;
toggle18();
bbj.cloak();
let paramsObj = {
	imgAreaSelect: "on",
	startChr: n.chr,
	startCoord: coord1,
	stopChr: n.chr,
	stopCoord: coord2
}
paramsObj = Object.assign(paramsObj, bbj.runmode_param())
bbj.ajaxX(paramsObj);
}
 
Browser.prototype.bev_mayaddtrack=function(tk)
{
var lst=this.genome.bev.tklst;
for(var i=0; i<lst.length; i++) {
	if(lst[i].name==tk.name) {
		// already there
		if(apps.bev.main.style.display!='block') {
			toggle18();
		}
		return;
	}
}
var obj2=duplicateTkobj(tk);
obj2.name=tk.name;
if(!obj2.qtc) {
	obj2.qtc={thtype:scale_auto};
}
if(obj2.qtc.thtype==undefined) {
	obj2.qtc.thtype=scale_auto;
}
obj2.qtc.height=(obj2.ft==FT_cat_n||obj2.ft==FT_cat_c)?15:30;
this.genome.bev.tklst.push(obj2);
if(apps.bev.main.style.display=='block') {
	// add now
	this.bev_ajax([obj2]);
} else {
	toggle18();
	apps.bev.bbj=this;
	setTimeout(bev_delayedTkadd,500);
}
}

function bev_delayedTkadd() {
/* delayed tk add for bev
apps.bev.bbj must be set
add last track in .tklst
*/
var lst=apps.bev.bbj.genome.bev.tklst;
if(lst.length==0) return;
apps.bev.bbj.bev_ajax([lst[lst.length-1]]);
}

function menu_bevTrack(event)
{
// right click on a track in bev
var tkname=event.target.tkname;
var lst=gflag.menu.bbj.genome.bev.tklst;
for(var i=0; i<lst.length; i++) {
	if(lst[i].name!=tkname) continue;
	menu_shutup();
	var ft=lst[i].ft;
	if(ft==FT_cat_c||ft==FT_cat_n) {
		cateCfg_show(lst[i]);
		menu.c16.style.display='block';
	} else if(ft==FT_gs) {
		var q=lst[i].qtc;
		qtcpanel_setdisplay({qtc:q,
			color1:'rgb('+q.pr+','+q.pg+','+q.pb+')',
			no_log:true,
			no_smooth:true,
			no_scale:true,
			});
		menu.c1.style.display='block';
		menu.c51.sharescale.style.display='none';
	} else if(ft==FT_bed_n||ft==FT_bed_c||ft==FT_anno_n||ft==FT_anno_c) {
		var q=lst[i].qtc;
		qtcpanel_setdisplay({qtc:q,
			color1:'rgb('+q.pr+','+q.pg+','+q.pb+')',
			no_log:true,
			no_smooth:true,
			ft:ft,
			});
		menu.c16.style.display=
		menu.c1.style.display='block';
		menu.c1.innerHTML='min: '+lst[i].min+' max: '+lst[i].max;
		menu.c51.sharescale.style.display='none';
	} else {
		// should be numerical tracks!
		var q=lst[i].qtc;
		qtcpanel_setdisplay({qtc:q,
			color1:'rgb('+q.pr+','+q.pg+','+q.pb+')',
			color1text:'positive',
			color2:'rgb('+q.nr+','+q.ng+','+q.nb+')',
			color2text:'negative',
			no_log:true,
			no_smooth:true,
			ft:ft,
			});
		menu.c16.style.display=
		menu.c1.style.display='block';
		menu.c1.innerHTML='min: '+lst[i].min+' max: '+lst[i].max;
		menu.c51.sharescale.style.display='none';
	}
	menu.c14.style.display='block';
	menu.c14.unify.style.display='none';
	menu.c4.style.display='block';
	menu_show(20,event.clientX-10,event.clientY-10);
	gflag.menu.bevtkidx=i;
}
return false;
}


Genome.prototype.bev_addgeneset=function(idx)
{
/* add a gene set to bev and draw it
*/
var gsobj=this.geneset.lst[idx];
var obj={
	name:Math.random(),
	label:gsobj.name,
	ft:FT_gs,
	data:{},
	qtc:{}};
qtc_paramCopy(defaultQtcStyle.ft8,obj.qtc);
obj.qtc.height=15;
for(var i=0; i<gsobj.lst.length; i++) {
	var e=gsobj.lst[i];
	if(e.c in obj.data) {
		obj.data[e.c].push(e);
	} else {
		obj.data[e.c]=[e];
	}
}
this.bev_preparegeneset(obj);
this.bev.tklst.push(obj);
this.bev_draw_track(obj);
this.bev_trackcanvas2holder(obj);
}

Genome.prototype.bev_preparegeneset=function(obj)
{
/* convert .a1/.b1 coord to .x .w
call when gs is first added, or width changed
*/
for(var i=0; i<this.bev.chrlst.length; i++) {
	var _c=this.bev.chrlst[i];
	if(_c[0] in obj.data) {
		var lst=obj.data[_c[0]];
		var sf=_c[1]/this.scaffold.len[_c[0]];
		for(var j=0; j<lst.length; j++) {
			lst[j].x=Math.ceil(sf*lst[j].a1);
			lst[j].w=Math.ceil(sf*(lst[j].b1-lst[j].a1));
		}
	}
}
}

function bev_config(event)
{
menu_shutup();
menu.c40.style.display='block';
menu_show_beneathdom(0,event.target);
}

function bev_changechrheight(event)
{
var c=apps.bev.bbj.genome.bev.config;
if(event.target.increase) {
	c.chrbarheight+=1;
} else {
	c.chrbarheight=Math.max(c.chrbarminheight,c.chrbarheight-1);
}
apps.bev.bbj.genome.bev_draw_chrs();
}

function bev_changepanelheight(event)
{
var t=apps.bev.bbj.genome.bev.viewtable.parentNode;
if(event.target.increase) {
	t.style.height=parseInt(t.style.height)+100;
} else {
	t.style.height=Math.max(600,parseInt(t.style.height)-100);
}
}
function bev_setchrmaxwidth(event)
{
var bbj=apps.bev.bbj;
bbj.genome.bev.config.maxpxwidth=
menu.c40.says.innerHTML= parseInt(event.target.options[event.target.selectedIndex].value);
bbj.genome.bev_prepare();
bbj.bev_ajax(bbj.genome.bev.tklst);
event.target.selectedIndex=0;
}

function bev_showgeneset(event)
{
menu_showgeneset(apps.bev.bbj,event.target,bev_addgeneset_click);
}

function bev_addgeneset_click(event)
{
// clicking a geneset entry from menu
apps.bev.bbj.genome.bev_addgeneset(event.target.idx);
menu_hide();
}

function bev_svgbutt_md()
{
apps.bev.bbj.genome.bev.main.svgsays.innerHTML='';
}

function bev_svg(event)
{
event.target.disabled=true;
var bbj=apps.bev.bbj;
var _bev=bbj.genome.bev;
_bev.main.svgsays.innerHTML='making screenshot...';
var tkpadding=2,
	chrpadding=4;
// graph dimension
var chrlabelwidth=0; // max chr text width
for(var i=0; i<_bev.chrlst.length; i++) {
	chrlabelwidth=Math.max(chrlabelwidth,10*_bev.chrlst[i][0].length);
}
var showchrbar=_bev.config.chrbarheight>_bev.config.chrbarminheight;
var gheight=0;
if(showchrbar) {
	gheight+=_bev.chrlst.length*(_bev.config.chrbarheight+chrpadding);
}
for(var i=0; i<_bev.tklst.length; i++) {
	gheight+=_bev.chrlst.length*(_bev.tklst[i].qtc.height+tkpadding);
}
bbj.svg={content:
	['<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'+(chrlabelwidth+_bev.config.maxpxwidth)+'" height="'+gheight+'">']};
bbj.svg.gy=0;
for(var i=0; i<_bev.chrlst.length; i++) {
	var chr=_bev.chrlst[i][0];
	var pxwidth=_bev.chrlst[i][1];
	var alltkh=0;
	for(var j=0; j<_bev.tklst.length; j++) {
		var tk=_bev.tklst[j];
		if(!(chr in tk.data)) continue;
		// plot tk with offset on svg graph
		var canvas=tk.chrcanvas[chr];
		bbj.svg.gx=chrlabelwidth;
		var d=[];
		if(tk.ft==FT_gs) {
			var lst=tk.data[chr];
			var color='rgb('+tk.qtc.pr+','+tk.qtc.pg+','+tk.qtc.pb+')';
			for(var k=0; k<lst.length; k++) {
				d.push({type:svgt_rect,x:lst[k].x,y:0,w:lst[k].w,h:canvas.height,fill:color});
			}
		} else {
			var ctx=canvas.getContext('2d');
			ctx.clearRect(0,0,canvas.width,canvas.height);
			if(tk.ft==FT_cat_n||tk.ft==FT_cat_c) {
				d=catetk_plot_base(tk.data[chr], tk.cateInfo, 0, pxwidth, ctx, tk.qtc,
					0,0,1,canvas.height,true)
			} else {
				d=bbj.barplot_base({
					data:tk.data[chr],
					ctx:ctx, 
					colors:{p:'rgb('+tk.qtc.pr+','+tk.qtc.pg+','+tk.qtc.pb+')',
						n:'rgb('+tk.qtc.nr+','+tk.qtc.ng+','+tk.qtc.nb+')',
						pth:tk.qtc.pth,
						nth:tk.qtc.nth},
					tk:{maxv:tk.max, minv:tk.min},
					x:0,y:0, w:1, h:tk.qtc.height,
					pointup:true, tosvg:true});
			}
		}
		for(var k=0; k<d.length; k++) {
			var item=d[k];
			if(item.type==svgt_no) {
				continue;
			} else if(item.type==svgt_line) {
				item.type=svgt_line_notscrollable;
			} else if(item.type==svgt_rect) {
				item.type=svgt_rect_notscrollable;
			} else if(item.type==svgt_text) {
				item.type=svgt_text_notscrollable;
			} else {
				fatalError('unknown svgt in tk');
			}
			bbj.svgadd(item);
		}
		bbj.svg.gy+=canvas.height+tkpadding;
		alltkh+=canvas.height+tkpadding;
	}
	if(showchrbar) {
		bbj.svg.gx=chrlabelwidth;
		var canvas=_bev.chrlst[i][2];
		var ctx=canvas.getContext('2d');
		ctx.clearRect(0,0,canvas.width,canvas.height);
		var d=drawIdeogramSegment_simple(
			bbj.genome.getcytoband4region2plot(chr, 0, bbj.genome.scaffold.len[chr], pxwidth),
			ctx, 0, 0, pxwidth, _bev.config.chrbarheight-1, true);
		for(var k=0; k<d.length; k++) {
			var item=d[k];
			if(item.type==svgt_line) {
				item.type=svgt_line_notscrollable;
			} else if(item.type==svgt_rect) {
				item.type=svgt_rect_notscrollable;
			} else if(item.type==svgt_text) {
				item.type=svgt_text_notscrollable;
			} else {
				fatalError('unknown svgt in chr ideogram');
			}
			bbj.svgadd(item);
		}
		bbj.svg.gy+=_bev.config.chrbarheight+chrpadding;
	}
	// print chr name
	bbj.svg.gx=1;
	bbj.svgadd({type:svgt_text_notscrollable,x:0,
		y:(showchrbar?-3:5-(alltkh/2))-chrpadding,
		text:chr});
}
bbj.svg.content.push('</svg>');
var content=bbj.svg.content;
delete bbj.svg;
var b2=bbj;
ajaxPost('svg\n'+content.join(''),function(text){b2.svgshowlink_bev(text);});
}

Browser.prototype.svgshowlink_bev=function(key)
{
var m=apps.bev.bbj.genome.bev.main;
m.svgbutt.disabled=false;
if(!key) {
	print2console('Sorry! Please try again.',2);
	m.svgsays.innerHTML='';
	return;
}
m.svgsays.innerHTML='<a href=t/'+key+' target=_blank>Link to the svg file</a>';
}
