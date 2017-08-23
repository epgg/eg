function toggle11()
{
apps.circlet.shortcut.style.display='inline-block';
if(apps.circlet.main.style.display=='none') {
	panelFadein(apps.circlet.main, 100+document.body.scrollLeft, 50+document.body.scrollTop);
	//cloakPage();
} else {
	panelFadeout(apps.circlet.main);
	//pagecloak.style.display='none';
}
}
function menu_circletview()
{
gflag.menu.bbj.hengeview_lrtk(gflag.menu.tklst[0].name);
menu_hide();
}

function hengeview_config(event)
{
// called by clicking wrench
menu_shutup();
menu.c15.style.display=menu.c17.style.display='block';
menu_show_beneathdom(15,event.target);
gflag.menu.viewkey=event.target.viewkey;
}

function hengeview_region_exists(rlst,obj)
{
// if an overlapping region is found will also expand it
for(var j=0; j<rlst.length; j++) {
	var _r=rlst[j];
	if(_r.chrom==obj.chrom && Math.max(_r.dstart,obj.dstart)<Math.min(_r.dstop,obj.dstop)) {
		// same chr, region overlap, not allowed
		//_r.dstart=Math.min(_r.dstart,obj.dstart);
		//_r.dstop=Math.max(_r.dstop,obj.dstop);
		return j;
	}
}
return -1;
}

function hengeview_init_mayaddregion(hvobj,obj)
{
/* obj: half-made region object
*/
var i=hengeview_region_exists(hvobj.regions,obj);
if(i!=-1) return i;
// new region
var blob=dom_create('div',hvobj.canvas.parentNode);
blob.innerHTML='&nbsp;'+obj.name+'&nbsp;';
blob.className='header_b2';
blob.style.position='absolute';
blob.oncontextmenu=menu_hengeview_blob;
blob.addEventListener('mousedown',hengeview_blob_md,false);
blob.viewkey=hvobj.key;
blob.ridx=hvobj.regions.length;
obj.blob=blob;
obj.arcnum=0;
hvobj.regions.push(obj);
return blob.ridx;
}

Browser.prototype.hengeview_lrtk=function(callingtkname)
{
/* make henge view for a longrange track
using the data under view
make a new panel (object) add to circlet.hash

.regions is a fixed list, each is {}
.regionorder contains .regions array idx to point to which ones are shown and in what order

items are identified by *regions*
each region has name and coordinate
in case of plain chrhenge, name is chr name and coordinate is 0 to length
else in case of gsv, region corresponds to genes
*/
var callingtkobj=this.findTrack(callingtkname);
if(!callingtkobj) {return;}
if(callingtkobj.ft!=FT_lr_c && callingtkobj.ft!=FT_lr_n && callingtkobj.ft!=FT_hi_c) {
	print2console('making circlet plot: wrong track ft',2);
	return;
}
if(apps.circlet.main.style.display=='none') toggle11();

var viewkey=Math.random().toString();
var q=callingtkobj.qtc;
var viewobj = {
	key:viewkey,
	bbj:this,
	callingtk:{
		name:callingtkname,
		pcolor:q.pr+','+q.pg+','+q.pb,
		ncolor:q.nr+','+q.ng+','+q.nb,
		pscore:q.pcolorscore,
		nscore:q.ncolorscore,
		qtc:q,
		//matrix:q.matrix,
		//norm:q.norm,
		//unit_res:q.unit_res,
	        //bin_size:q.bin_size,
                ft:callingtkobj.ft,
                label:callingtkobj.label,
                url:callingtkobj.url,
                mode:callingtkobj.mode
	},
	ideogramwidth:14,
	showcytoband:true,
	showscalebar:true,
	radius:250,
	spacing:0.015, // radian spancing between adjacent regions in the henge
	wreath:[],
};

// before inserting new view, hide all previous views
var logocoloridx=1;
for(var k in apps.circlet.hash) {
	var o= apps.circlet.hash[k];
	o.main.style.display='none';
	o.handle.style.display='inline-block';
	if(logocoloridx==o.logocoloridx)
		logocoloridx++;
}
apps.circlet.hash[viewkey]=viewobj;
viewobj.logocoloridx=logocoloridx;

// make view panel
var d=dom_create('div',apps.circlet.holder);
d.style.display='inline-block';
d.style.backgroundColor=colorCentral.background;
d.style.margin='0px 20px 20px 0px';
viewobj.main=d;

// handle
d=make_skewbox_butt(apps.circlet.handleholder);
d.style.marginLeft=10;
d.style.display='none';
d.firstChild.style.borderTop='solid 3px '+colorCentral.longlst[logocoloridx];
d.firstChild.style.backgroundColor=colorCentral.background;
d.childNodes[1].innerHTML='&nbsp;';
d.addEventListener('click', hengeview_show,false);
d.viewkey=viewkey;
viewobj.handle=d;

// banner
var table=dom_create('table',viewobj.main);
table.cellSpacing=0;
//table.style.backgroundColor=lightencolor(colorstr2int(colorCentral.longlst[logocoloridx]),.8);
table.style.borderTop='solid 3px '+colorCentral.longlst[logocoloridx];
table.style.width='100%';
var tr=table.insertRow(0);
var td=tr.insertCell(0);
td.vAlign='middle';
td.style.fontSize='12px';
viewobj.says_arcnum=dom_addtext(td);
dom_addtext(td,'&nbsp;arcs from&nbsp;');
//no meta for custom long range track, caused empty div
//var d9=dom_addtkentry(2,td,false,callingtkobj,callingtkobj.label,hengeview_lrtkdetail,20);
var d9=dom_addtkentry(2,td,false,callingtkobj,callingtkobj.label,null,20);
d9.viewkey=viewkey;
d9.style.display='inline';
td=tr.insertCell(1);
td.align='right';
dom_addrowbutt(td,[
	{text:'Configure',pad:true,call:hengeview_config,attr:{viewkey:viewkey}},
	{text:'Add track',pad:true,call:hengeview_invoketkselect,attr:{viewkey:viewkey}},
	{text:'Hide',pad:true,call:hengeview_hide,attr:{viewkey:viewkey}},
	{text:'Delete',pad:true,call:hengeview_delete,attr:{viewkey:viewkey}},
	],'margin:3px;');
viewobj.buttonholder=td;

/* main drawing canvas */
d9=dom_create('div',viewobj.main); // canvas holder, contains floating chr name
d9.style.position='relative';
var canvas=dom_create('canvas',d9);
canvas.viewkey=viewkey;
canvas.addEventListener('click', hengeview_canvas_click,false);
canvas.addEventListener('mousemove',hengeview_tp_mmove,false);
canvas.addEventListener('mouseout',pica_hide,false);
canvas.addEventListener('mousedown',hengeview_canvas_md,false);
canvas.oncontextmenu=menu_hengeview;
viewobj.canvas = canvas;
canvas.width=600;
canvas.height=300;
loading_cloak(viewobj.main);

/* issue ajax to query complete longrange track data
as the data in track object is dsp-filtered and incomplete
do not allow regions to overlap, as the arcs won't know where to go
*/
var bbj=this;
let paramsObj = {
	lrtk_nodspfilter: "on",
	dbName: this.genome.name
};
paramsObj = Object.assign(paramsObj, this.displayedRegionParam_narrow());
paramsObj = Object.assign(paramsObj, trackParam([callingtkobj]));
this.ajax(paramsObj,function(data){bbj.hengeview_lrtk_cb(data,viewobj);});
}

Browser.prototype.hengeview_lrtk_cb=function(data,viewobj)
{
loading_done();
if(!data) {
	print2console('Failed to get data',2);
	return;
}
/* sort out the data
if running gsv, only use gsv item as region
else, use whole chr
*/
viewobj.regions=[]; // {.name,.chrom,.bstart,.bstop,.dstart,.dstop,.onshow,.arcnum}
var arcdata = []; // [region1id,start1,stop1, region2id,start2,stop2, score]
var rawdata=data.tkdatalst[0].data;
var is_gsv=this.is_gsv();
var tmpc=this.getDspStat();
for(var i=this.dspBoundary.vstartr;i<=this.dspBoundary.vstopr;i++) {
	var start = i==this.dspBoundary.vstartr ? tmpc[1] : this.regionLst[i][3];
	var stop = i==this.dspBoundary.vstopr ? tmpc[3] : this.regionLst[i][4];
	var data2=rawdata[i-this.dspBoundary.vstartr];
	var thischr=this.regionLst[i][0];
	var thisstart=is_gsv?this.regionLst[i][3]:0;
	var cL=this.genome.scaffold.len[thischr];
	var thisstop=is_gsv?this.regionLst[i][4]:cL;
        if(viewobj.callingtk.qtc.matrix !== undefined){ //hic track circlet region default the view region
	    thisstart=this.regionLst[i][3];
	    thisstop=this.regionLst[i][4];
        }
	var r1id=hengeview_init_mayaddregion(viewobj,
		{chrom:thischr,
		name:is_gsv?this.regionLst[i][6]:thischr,
		dstart:thisstart,dstop:thisstop,
		bstart:0,bstop:cL});
	for(j=0; j<data2.length; j++) {
		var item=data2[j];
		if(item.start>=stop || item.stop<=start) continue;
		var lst = item.name.split(',');
		var c=this.genome.parseCoordinate(lst[0],2);
		if(c==null) continue;
		/** blasted alien chromosome: chr20 in GSE35519/mm9 on 2013/2/16
		but won't check if c[0] is in .scaffold.len to minimize load
		*/
		var s=this.genome.scaffold.len[c[0]];
		var r2id;
		var thisregion={chrom:c[0],name:c[0],bstart:0,dstart:0,bstop:s,dstop:s};
		if(is_gsv) {
			r2id=hengeview_region_exists(viewobj.regions,thisregion);
			if(r2id==-1) continue;
		} else {
			r2id=hengeview_init_mayaddregion(viewobj,thisregion);
		}
		arcdata.push([r1id,item.start,item.stop, r2id,c[1],c[3], parseFloat(lst[1])]);
		// increment arc number
		viewobj.regions[r1id].arcnum++;
		if(r1id!=r2id) viewobj.regions[r2id].arcnum++;
	}
}
var order=[];
for(i=0; i<viewobj.regions.length; i++) order.push(i);

viewobj.data=arcdata;
viewobj.regionorder=order;
hengeview_computeRegionRadian(viewobj.key);
hengeview_draw(viewobj.key);
}


function hengeview_canvasxy2stuff(hvobj,x,y)
{
/* x/y are event.clientX/Y
to find the stuff under cursor
return an array: [identifier,   ]
identifiers:
	-1 exception
	0 outer space
	1 chr bar: region idx, data array idx
	2 wreath: region idx, dataarray idx, wreath track idx
	3 arc: arc_data idx
	4 inside henge but not on arc
*/
var pos = absolutePosition(hvobj.canvas);
var x=x+document.body.scrollLeft-pos[0];
var y=y+document.body.scrollTop-pos[1];
var wreathheight=0;
for(var i=0;i<hvobj.wreath.length;i++)
	wreathheight+=hvobj.wreath[i].qtc.height;
// distance to center
var dc=Math.sqrt(Math.pow(hvobj.centerx-x,2)+Math.pow(hvobj.centery-y,2));
// outer space
if(dc>=hvobj.radius+3+hvobj.ideogramwidth/2+wreathheight) return [0];

if(dc>=hvobj.radius-hvobj.ideogramwidth/2) {
	/* over chromosome ideogram
	show region idx, data array idx, track name
	*/
	var xp=x-hvobj.centerx;
	var yp=y-hvobj.centery;
	var ra=Math.atan(Math.abs(yp)/Math.abs(xp));
	if(yp>0) {
		if(xp<0) ra=Math.PI-ra;
	} else {
		ra= xp>0 ? Math.PI*2-ra : Math.PI+ra;
	}
	// check which point
	var ridx=-1; // region idx
	var rradian=0; // radian within the region
	var order=hvobj.regionorder;
	var radianoffset=hvobj.regionradianoffset;
	for(i=0; i<order.length; i++) {
		ridx=order[i];
		if(ra>=radianoffset[ridx] && ra<=radianoffset[ridx]+hvobj.regionradianspan[ridx]) {
			rradian=ra-radianoffset[ridx];
			break;
		}
	}
	if(ridx==-1) return [-1];
	var didx=parseInt(hvobj.radius*rradian); // data array idx of that region
	if(dc>=hvobj.radius+3+hvobj.ideogramwidth/2) {
		// beyond chr bar
		if(hvobj.wreath.length>0) {
			// over wreath, see which track
			var h=0;
			dc-=hvobj.radius+3+hvobj.ideogramwidth/2;
			for(var j=0; j<hvobj.wreath.length; j++) {
				if(dc>=h && dc<=h+hvobj.wreath[j].qtc.height) {
					return [2, ridx, didx, j];
				}
				h+= hvobj.wreath[j].qtc.height;
			}
			return [-1];
		} else {
			// no wreath track
			return [0];
		}
	} else {
		// over chr bar
		return [1, ridx, didx];
	}
}
/* arc */
var arcdata = hvobj.arcdata;
for(var i=0; i<arcdata.length; i++) {
	var d = Math.sqrt(Math.pow(arcdata[i][0]-x,2)+Math.pow(arcdata[i][1]-y,2));
	if(d<=arcdata[i][2]+1 && d>=arcdata[i][2]-1) {
		return [3, i];
	}
}
return [4];
}

function menu_hengeview(event)
{
// right click on canvas
menu_shutup();
var hvobj = apps.circlet.hash[event.target.viewkey];
var stuff=hengeview_canvasxy2stuff(hvobj,event.clientX,event.clientY);
if(stuff[0]==-1) return;
/* if on chr, show config func for chrs
if on wreath, show config func for that track
else, show graph config
*/
gflag.menu.viewkey=event.target.viewkey;
if(stuff[0]==1) {
	// chr bar
	menu_show(0,event.clientX-10,event.clientY-10);
	menu_hengeview_configregions();
} else if(stuff[0]==2) {
	// one wreath track
	// wreath track array idx is stuff[3]
	var tkobj=hvobj.wreath[stuff[3]];
	var ft=tkobj.ft;
	if(ft==FT_cat_c||ft==FT_cat_n) {
		cateCfg_show(tkobj);
	} else if(ft==FT_bed_n||ft==FT_bed_c||ft==FT_anno_n||ft==FT_anno_c) {
		var q=tkobj.qtc;
		qtcpanel_setdisplay({qtc:q,
			color1:'rgb('+q.pr+','+q.pg+','+q.pb+')',
			no_log:true,
			no_smooth:true,
			no_scale:true});
		menu.c1.style.display='block';
		menu.c1.innerHTML='min: '+tkobj.min+' max: '+tkobj.max;
	} else {
		var q=tkobj.qtc;
		qtcpanel_setdisplay({qtc:q,
			color1:'rgb('+q.pr+','+q.pg+','+q.pb+')',
			color1text:'positive',
			color2:'rgb('+q.nr+','+q.ng+','+q.nb+')',
			color2text:'negative',
			no_log:true,
			no_smooth:true,
			no_scale:true});
		menu.c1.style.display='block';
		menu.c1.innerHTML='min: '+tkobj.min+' max: '+tkobj.max;
	}
	menu.c14.style.display='block';
	menu.c14.unify.style.display='none';
	menu.c4.style.display='block';
	menu_show(19,event.clientX-10,event.clientY-10);
	gflag.menu.wreathIdx=stuff[3];
} else {
	// graph
	menu_show(15,event.clientX-10,event.clientY-10);
	menu_hengeview_configrender();
}
return false;
}

function hengeview_canvas_click(event)
{
/* clicking on the canvas
do not show bubble on wreath track for the moment
*/
var hvobj = apps.circlet.hash[event.target.viewkey];
var regions = hvobj.regions;
var stuff=hengeview_canvasxy2stuff(hvobj,event.clientX,event.clientY);
if(stuff[0]==-1 || stuff[0]==0 || stuff[0]==2 || stuff[0]==4) return;

if(stuff[0]==1) return;

var ridx=stuff[1];
bubbleShow(event.clientX+document.body.scrollLeft+2, event.clientY+document.body.scrollTop-3);
if(stuff[0]==1) {
	var a=regions[ridx].dstart+stuff[2]*hvobj.bpperpx;
	var coord= regions[ridx].chrom+':'+a+'-'+(a+hvobj.bpperpx);
	bubble.says.innerHTML='<div style="margin:10px;color:white;position:relative;">'+coord+'</div>';
	return;
}
// arcs
var data = hvobj.data;
var arcdata = hvobj.arcdata;
var item=data[arcdata[ridx][3]];
var c1=regions[item[0]].chrom+':'+item[1]+'-'+item[2];
var c2=regions[item[3]].chrom+':'+item[4]+'-'+item[5];
bubble.says.innerHTML='<div style="margin:10px;color:white;position:relative;">'+
	'Long range interaction occurs between the locations:<br>'+c1+'<br>'+c2+'<br>score:'+item[6]+'</div>';
}
function hengeview_tp_mmove(event)
{
// pica over canvas
var hvobj = apps.circlet.hash[event.target.viewkey];
var stuff=hengeview_canvasxy2stuff(hvobj,event.clientX,event.clientY);
if(stuff[0]==-1||stuff[0]==0||stuff[0]==4) {
	pica.style.display='none';
	return;
}
var r=hvobj.regions[stuff[1]];
if(stuff[0]==1) {
	var a=r.dstart+parseInt(stuff[2]*hvobj.bpperpx);
	var chr=r.chrom;
	var clen=hvobj.bbj.genome.scaffold.len[chr];
	if(a>clen) return;
	pica_go(event.clientX,event.clientY);
	picasays.innerHTML=r.chrom+':'+a+'-'+Math.min(a+hvobj.bpperpx,clen);
	return;
}
if(stuff[0]==2) {
	var a=r.dstart+parseInt(stuff[2]*hvobj.bpperpx); // coord
	var chr=r.chrom;
	var clen=hvobj.bbj.genome.scaffold.len[chr];
	if(a>clen) return;
	var regioncoord=r.chrom+':'+a+'-'+Math.min(a+hvobj.bpperpx,clen); // coord string
	pica_go(event.clientX,event.clientY);
	var tk=hvobj.wreath[stuff[3]];
	var text='<div style="padding:5px;font-size:16px;color:white;">';
	if(tk.ft==FT_cat_c||tk.ft==FT_cat_n) {
		var v=tk.cateInfo[tk.data[r.name][stuff[2]]];
		text+='<div class=squarecell style="display:inline-block;background-color:'+v[1]+';"></div> '+v[0];
	} else {
		text+=tk.data[r.name][stuff[2]];
	}
	picasays.innerHTML=text+'<div style="padding-top:5px;font-size:12px;color:#c5d5d5;">'+tk.label+'<br>'+regioncoord+'</div>';
	return;
}
if(stuff[0]==3) {
	var data = hvobj.data;
	var arcdata = hvobj.arcdata;
	var item=data[arcdata[stuff[1]][3]];
	var c1=hvobj.regions[item[0]].chrom;
	var c2=hvobj.regions[item[3]].chrom;
	var text=(c1==c2)?'Interaction within '+c1:'Interaction between '+c1+' and '+c2;
	pica_go(event.clientX,event.clientY);
	picasays.innerHTML='<div style="padding:5px;font-size:14px;color:white;">'+text+'<br>score: '+item[6]+'</div>';
}
/*over*/
}


function hengeview_computeRegionRadian(vkey)
{
/* call this before making the first plot or regions are added/removed
changing radius won't affect the radian
this must be called prior to running ajax to fetch data for wreath track
*/
var hvobj=apps.circlet.hash[vkey];
if(hvobj==undefined) return;
var regions=hvobj.regions;
var regionorder=hvobj.regionorder;
/* these two arrays are addressed by .regions array index */
var showtotallen=0;
var shownum=0;
for(var i=0; i<regions.length; i++) {
	if(regionorder.indexOf(i)!=-1) {
		showtotallen+=regions[i].dstop-regions[i].dstart;
		shownum++;
	}
}
if(showtotallen==0) return;
hvobj.sf = (Math.PI*2-hvobj.spacing*shownum)/showtotallen; // radian per bp

hvobj.regionradianspan=[]; // radian spanned by each region
for(i=0; i<regions.length; i++) {
	/* FIXME about dummy value 0
	to keep .regionradianspan in same length as .region
	despite some regions might be hidden
	*/
	hvobj.regionradianspan[i] = (regionorder.indexOf(i)!=-1) ? hvobj.sf*(regions[i].dstop-regions[i].dstart) : 0;
}
hvobj.bpperpx=parseInt(showtotallen/((Math.PI*2-hvobj.spacing*shownum)*hvobj.radius));
}



function hengeview_draw(vkey)
{
var hvobj = apps.circlet.hash[vkey];
if(hvobj==undefined) return;
var regions = hvobj.regions;
var regionorder=hvobj.regionorder;
var pcolor = hvobj.callingtk.pcolor;
var ncolor = hvobj.callingtk.ncolor;
var pscore = hvobj.callingtk.pscore;
var nscore = hvobj.callingtk.nscore;
//var matrix = hvobj.callingtk.qtc.matrix;
//var norm = hvobj.callingtk.qtc.norm;
//var unit_res = hvobj.callingtk.qtc.unit_res;
//var bin_size = hvobj.callingtk.qtc.bin_size;
// draw main canvas
var canvas = hvobj.canvas;
ctx = canvas.getContext('2d');
var radius=hvobj.radius;
var ideogramWidth=hvobj.ideogramwidth;

// make a face if none of the regions are in use
var makeface=true;
if(hvobj.regionradianspan.length>0) {
	for(var i=0; i<regions.length; i++) {
		if(regionorder.indexOf(i)!=-1)
			makeface=false;
	}
}
if(makeface) {
	var c='#FFFFB3';
	canvas.width=30+radius*2;
	canvas.height=30+radius*2;
	var centerx = parseInt(canvas.width/2);
	var centery = centerx; 
	hvobj.centerx=centerx;
	hvobj.centery=centery;
	ctx.strokeStyle=c;
	ctx.lineWidth=radius/9;
	radius*=.7;
	ctx.beginPath(); ctx.arc(centerx,centery,radius,0,Math.PI*2,false); ctx.stroke();

	ctx.beginPath();
	var x=centerx+radius*Math.cos(Math.PI*1.07),y=centery+radius*Math.sin(Math.PI*1.07);ctx.moveTo(x,y);
	x=centerx+radius*Math.cos(Math.PI*1.93),y=centery+radius*Math.sin(Math.PI*1.93);
	ctx.lineTo(x+radius/2,y);ctx.stroke();

	radius*=.8;
	ctx.fillStyle=c;
	ctx.beginPath(); ctx.arc(centerx,centery,radius,Math.PI/9,Math.PI*8/9,false); ctx.fill();
	ctx.fillStyle='#FFFDEB';
	ctx.beginPath(); ctx.arc(centerx,centery,radius*.8,Math.PI/5,Math.PI*4/5,false); ctx.fill();

	ctx.lineWidth=10;
	var oldr=hvobj.radius;
	ctx.beginPath();ctx.arc(centerx-oldr*.3,centery+oldr/8,oldr/8,Math.PI*1.2,Math.PI*1.8,false);ctx.stroke();
	ctx.beginPath();ctx.arc(centerx+oldr*.3,centery+oldr/8,oldr/8,Math.PI*1.2,Math.PI*1.8,false);ctx.stroke();
	/*
	ctx.beginPath(); ctx.arc(centerx,centery,radius,0,Math.PI*2,false); ctx.stroke();
	ctx.beginPath(); ctx.arc(centerx,centery-radius,radius*1.5,Math.PI/2-0.4,Math.PI/2+0.4,false); ctx.stroke();
	ctx.fillStyle='white';
	ctx.fillRect(centerx-radius/2,centery-radius/3,25,25);
	ctx.fillRect(centerx+radius/2,centery-radius/3,25,25);
	*/
	hvobj.arcdata=[];
	return;
}

var sf=hvobj.sf;
var circlespacing=3; // spacing between circles
var labelheight=50; // radius increment by the labels
var wreathlst=hvobj.wreath;
var wreathheight=0; // sum of wreath track height
for(i=0; i<wreathlst.length; i++)
	wreathheight+=wreathlst[i].qtc.height;
if(wreathheight>0)
	wreathheight+=circlespacing;
canvas.width=(wreathheight+radius+labelheight+circlespacing)*2+ideogramWidth;
canvas.height=canvas.width+10;
var centerx=parseInt(canvas.width/2);
var centery=parseInt(canvas.height/2);
hvobj.centerx=centerx;
hvobj.centery=centery;

ctx.font = "10pt Sans-serif";

// draw curved ruler, will draw 3 segments
if(hvobj.showscalebar) {
	i=10; // bp
	while(i*sf < 0.5) i*=10;
	i/=10;
	var unitw=null;
	if(i==10) unitw='30 bp';
	else if(i==100) unitw='300 bp';
	else if(i==1000) unitw='3 kb';
	else if(i==10000) unitw='30 kb';
	else if(i==100000) unitw='300 kb';
	else if(i==1000000) unitw='3 mb';
	else if(i==10000000) unitw='30 mb';
	else if(i==100000000) unitw='300 mb';
	else if(i==1000000000) unitw='3 gb';
	if(unitw != null) {
		var r2=ideogramWidth/2+wreathheight+circlespacing+30; // radius increment
		ctx.strokeStyle=colorCentral.foreground;
		var j=i*sf;
		ctx.beginPath();
		ctx.arc(centerx,centery,radius+r2,Math.PI*1.5-j*1.5,Math.PI*1.5+j*1.5,false);
		// tick 1
		var x0=centerx+(radius+r2+4)*Math.cos(Math.PI*1.5-j*1.5);
		var y0=centery+(radius+r2+4)*Math.sin(Math.PI*1.5-j*1.5);
		ctx.moveTo(x0,y0);
		ctx.lineTo(centerx+(radius+r2)*Math.cos(Math.PI*1.5-j*1.5),centery+(radius+r2)*Math.sin(Math.PI*1.5-j*1.5));
		// tick 2
		ctx.moveTo(centerx+(radius+r2+4)*Math.cos(Math.PI*1.5-j*.5),centery+(radius+r2+4)*Math.sin(Math.PI*1.5-j*.5));
		ctx.lineTo(centerx+(radius+r2)*Math.cos(Math.PI*1.5-j*.5),centery+(radius+r2)*Math.sin(Math.PI*1.5-j*.5));
		// tick 3
		ctx.moveTo(centerx+(radius+r2+4)*Math.cos(Math.PI*1.5+j*.5),centery+(radius+r2+4)*Math.sin(Math.PI*1.5+j*.5));
		ctx.lineTo(centerx+(radius+r2)*Math.cos(Math.PI*1.5+j*.5),centery+(radius+r2)*Math.sin(Math.PI*1.5+j*.5));
		// tick 4
		var x1=centerx+(radius+r2+4)*Math.cos(Math.PI*1.5+j*1.5);
		var y1=centery+(radius+r2+4)*Math.sin(Math.PI*1.5+j*1.5);
		ctx.moveTo(x1,y1);
		ctx.lineTo(centerx+(radius+r2)*Math.cos(Math.PI*1.5+j*1.5),centery+(radius+r2)*Math.sin(Math.PI*1.5+j*1.5));
		ctx.stroke();
		ctx.fillText('0',x0-10,y0);
		ctx.fillText(unitw, x1+5,y1);
	}
}

// most inner circle: chr bar, cytoband
for(i=0; i<regions.length; i++) regions[i].blob.style.display='none'; // hide all the blobs
var r=0; // cumulative radian offset
hvobj.regionradianoffset=[]; // radian offset of each region
for(i=0; i<regionorder.length; i++) {
	var ridx=regionorder[i];
	hvobj.regionradianoffset[ridx] = r;

	var rr=hvobj.regionradianspan[ridx]; // radian spanned by this region

	var rstartc=regions[ridx].dstart;
	var rstopc=regions[ridx].dstop;

	ctx.lineWidth=1;
	ctx.strokeStyle='#9E9E9E';
	ctx.beginPath();
	ctx.moveTo(centerx+(radius+ideogramWidth/2)*Math.cos(r),centery+(radius+ideogramWidth/2)*Math.sin(r));
	var x=centerx+(radius+ideogramWidth/2+circlespacing+wreathheight+10)*Math.cos(r);
	var y=centery+(radius+ideogramWidth/2+circlespacing+wreathheight+10)*Math.sin(r);
	ctx.lineTo(x,y);
	ctx.stroke();

	var blob=regions[ridx].blob;
	blob.style.display='block';
	var w=blob.clientWidth;
	if(r<=Math.PI/2) {
		blob.style.right=blob.style.bottom='';
		blob.style.left=x-1;
		blob.style.top=y-1;
	} else if(r<=Math.PI) {
		blob.style.left=blob.style.bottom='';
		blob.style.right=canvas.width-x-1;
		blob.style.top=y-1;
	} else if(r<=Math.PI*1.5) {
		blob.style.left=blob.style.top='';
		blob.style.right=canvas.width-x-1;
		blob.style.bottom=canvas.height-y-1;
	} else {
		blob.style.right=blob.style.top='';
		blob.style.left=x-1;
		blob.style.bottom=canvas.height-y-1;
	}
	if(hvobj.showcytoband) {
		// cytoband
		ctx.lineWidth = ideogramWidth;
		var c=hvobj.bbj.genome.cytoband;
		if(regions[ridx].chrom in c) {
			var bandlst=c[regions[ridx].chrom];
			for(var j=0; j<bandlst.length; j++) {
				var band = bandlst[j];
				if(band[0]>=rstopc) break;
				if(band[1]<=rstartc) continue;
				ctx.strokeStyle = band[2]<0 ? centromereColor : 'rgb('+cytoBandColor[band[2]]+','+cytoBandColor[band[2]]+','+cytoBandColor[band[2]]+')';
				ctx.beginPath(); 
				ctx.arc(centerx,centery,radius,r+(Math.max(band[0],rstartc)-rstartc)*sf,r+(Math.min(band[1],rstopc)-rstartc)*sf,false);
				ctx.stroke();
			}
		}
		// region bar span encloser
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.beginPath();ctx.arc(centerx,centery,radius+ideogramWidth/2,r,r+rr,false);ctx.stroke();
		ctx.beginPath();ctx.arc(centerx,centery,radius-ideogramWidth/2,r,r+rr,false);ctx.stroke();
		// region bar ends encloser
		ctx.beginPath();
		ctx.moveTo(centerx+(radius+ideogramWidth/2)*Math.cos(r),centery+(radius+ideogramWidth/2)*Math.sin(r));
		ctx.lineTo(centerx+(radius-ideogramWidth/2)*Math.cos(r),centery+(radius-ideogramWidth/2)*Math.sin(r));
		ctx.moveTo(centerx+(radius+ideogramWidth/2)*Math.cos(r+rr),centery+(radius+ideogramWidth/2)*Math.sin(r+rr));
		ctx.lineTo(centerx+(radius-ideogramWidth/2)*Math.cos(r+rr),centery+(radius-ideogramWidth/2)*Math.sin(r+rr));
		ctx.stroke();
	} else {
		// no cytoband
		ctx.lineWidth = ideogramWidth;
		ctx.strokeStyle='rgba(0,102,102,0.5)';
		ctx.beginPath();
		ctx.arc(centerx,centery,radius,r,r+rr,false);
		ctx.stroke();
	}
	r+=rr+hvobj.spacing;
}


/* draw arcs */
ctx.lineWidth=1;
var arcdata = [];
for(i=0; i<hvobj.data.length; i++) {
	// r1id, start1,stop1, r2id, start2,stop2, score
	var item=hvobj.data[i];
	var r1id=item[0];
	var r2id=item[3];
	if(regionorder.indexOf(r1id)==-1 || regionorder.indexOf(r2id)==-1) continue;
	if(Math.max(item[1],regions[r1id].dstart)>=Math.min(item[2],regions[r1id].dstop) ||
	Math.max(item[4],regions[r2id].dstart)>=Math.min(item[5],regions[r2id].dstop)) continue;
	ctx.strokeStyle = item[6]>0 ? 'rgba('+pcolor+','+((item[6]>=pscore)?1:(item[6]/pscore).toFixed(3))+')' : 
			'rgba('+ncolor+','+((item[6]<=nscore)?1:(item[6]/nscore).toFixed(3))+')';
	// arc start point
	var r1 = hvobj.regionradianoffset[r1id]+(Math.max(item[1],regions[r1id].dstart)-regions[r1id].dstart)*sf;
	var x1=centerx+(radius-ideogramWidth/2)*Math.cos(r1);
	var y1=centery+(radius-ideogramWidth/2)*Math.sin(r1);
	// arc stop point
	var r2 = hvobj.regionradianoffset[r2id]+(Math.max(item[4],regions[r2id].dstart)-regions[r2id].dstart)*sf;
	var x2=centerx+(radius-ideogramWidth/2)*Math.cos(r2);
	var y2=centery+(radius-ideogramWidth/2)*Math.sin(r2);
	var dist = Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
	// compute arc center
	var rdiff = Math.abs(r2-r1);
	if(rdiff == Math.PI) {
		ctx.beginPath();ctx.lineTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
	} else {
		// arc
		// radian of the center line between r1 and r2
		var r3 = rdiff/2+Math.min(r1,r2);
		// relative radian spanned between r1 and r2
		var rtrue=rdiff;
		if(rtrue>Math.PI) {
			rtrue=Math.PI*2-rdiff;
			r3+=Math.PI;
			if(r3>Math.PI*2) r3-=Math.PI*2;
		}
		// radian spanned by the arc
		var arc_radian = (Math.PI-rtrue)/2;
		var dist2 = (dist/2)/Math.tan(arc_radian/2); // incremental distance from circle radius
		// incremented circle radius
		var radius2 = dist2+Math.sqrt(Math.pow(radius-ideogramWidth/2,2)-Math.pow(dist/2,2));
		// arc center point
		var xc=centerx+radius2*Math.cos(r3);
		var yc=centery+radius2*Math.sin(r3);
		// radian of arc's center line
		var r5 = r3>Math.PI ? r3-Math.PI : r3+Math.PI;
		ctx.beginPath();
		var arcradius=Math.sqrt(dist*dist/4+dist2*dist2);
		ctx.arc(xc,yc,arcradius,r5-arc_radian/2,r5+arc_radian/2,false);
		ctx.stroke();

		// store arc data
		arcdata.push([xc,yc,arcradius,i]);
	}
}
hvobj.arcdata = arcdata;
hvobj.says_arcnum.innerHTML=arcdata.length;

/* wreath
all tracks have same amount of data points, so radian of each point is same
*/
if(wreathlst.length>0) {
	var pointnum=0;
	for(var n in wreathlst[0].data) {
		pointnum+=wreathlst[0].data[n].length;
	}
	var pointradian=(Math.PI*2-hvobj.regionorder.length*hvobj.spacing)/pointnum;
	var radiusbase=radius+ideogramWidth/2+circlespacing;
	// for each wreath track
	for(i=0; i<wreathlst.length; i++) {
		var wtk=wreathlst[i];
		var tkh=wtk.qtc.height;
		if(wtk.ft==FT_cat_c||wtk.ft==FT_cat_n) {
			var r=0; // radian offset
			for(var j=0; j<regionorder.length; j++) {
				var ridx=regionorder[j];
				var wdata=wtk.data[regions[ridx].name];
				for(var k=0; k<wdata.length; k++) {
					ctx.strokeStyle=wtk.cateInfo[wdata[k]][1];
					ctx.lineWidth=tkh;
					ctx.beginPath();
					ctx.arc(centerx,centery,
						radiusbase+tkh/2,
						r+k*pointradian, r+(k+1)*pointradian,false);
					ctx.stroke();
				}
				r+=hvobj.spacing+hvobj.regionradianspan[ridx];
			}
		} else {
			// must be numerical
			// figure out max/min of this track
			var max=0,min=0;
			for(var n in wtk.data) {
				var wdata=wtk.data[n];
				for(var k=0; k<wdata.length; k++) {
					if(wdata[k]>max) max=wdata[k];
					else if(wdata[k]<min) min=wdata[k];
				}
			}
			wtk.min=min;
			wtk.max=max;
			var baseline=(max>0 && min<0);
			var baselineh = baseline ? tkh*(0-min)/(max-min) : 0;
			var pcolor='rgb('+wtk.qtc.pr+','+wtk.qtc.pg+','+wtk.qtc.pb+')';
			var ncolor='rgb('+wtk.qtc.nr+','+wtk.qtc.ng+','+wtk.qtc.nb+')';
			// plot track
			var r=0; // radian offset
			for(var j=0; j<regionorder.length; j++) {
				// the json data is in same order as .regionorder, so must use j
				var ridx=regionorder[j];
				var wdata=wtk.data[regions[ridx].name];
				for(var k=0; k<wdata.length; k++) {
					if(baseline) {
						// use baseline
						if(wdata[k]>0) {
							var linewidth=Math.min(wdata[k],max)*(tkh-baselineh)/max;
							ctx.strokeStyle=pcolor;
							ctx.lineWidth=linewidth;
							ctx.beginPath();
							ctx.arc(centerx,centery,
							radiusbase+baselineh+linewidth/2,
							r+k*pointradian, r+(k+1)*pointradian,false);
							ctx.stroke();
						} else if(wdata[k]<0) {
							var linewidth=Math.max(wdata[k],min)*baselineh/min;
							ctx.strokeStyle=ncolor;
							ctx.lineWidth=linewidth;
							ctx.beginPath();
							ctx.arc(centerx,centery,
							radiusbase+(baselineh-linewidth/2),
							r+k*pointradian, r+(k+1)*pointradian,false);
							ctx.stroke();
						}
					} else {
						// no baseline
						if(min==0) {
							if(wdata[k]>0) {
								var linewidth=Math.min(wdata[k],max)*tkh/max;
								ctx.strokeStyle=pcolor;
								ctx.lineWidth=linewidth;
								ctx.beginPath();
								ctx.arc(centerx,centery,
									radiusbase+linewidth/2,
									r+k*pointradian, r+(k+1)*pointradian,false);
								ctx.stroke();
							}
						} else {
							if(wdata[k]<0) {
								var linewidth=Math.max(wdata[k],min)*tkh/min;
								ctx.strokeStyle=ncolor;
								ctx.lineWidth=linewidth;
								ctx.beginPath();
								ctx.arc(centerx,centery,
									radiusbase+tkh-linewidth/2,
									r+k*pointradian, r+(k+1)*pointradian,false);
								ctx.stroke();
							}
						}
					}
				}
				r+=hvobj.spacing+hvobj.regionradianspan[ridx];
			}
		}
		radiusbase += tkh;
	}
}
}

function hengeview_coordjump(vkey, coord)
{
apps.circlet.hash[vkey].bbj.cgiJump2coord(coord);
}


function hengeview_ajaxupdatepanel(vkey)
{
/* update entire panel, called by:
- adding/removing region
- changing henge graph radius
no matter it has wreath tracks or not
*/
var hvobj=apps.circlet.hash[vkey];
hvobj.wreathajaxidx=-1; // -1 means all the wreath tracks
hengeview_ajaxwreath(hvobj, hvobj.wreath);
}

function hengeview_ajaxwreath(hvobj, _tklst)
{
/* called by updating entire panel
or adding wreath tracks
*/
// region spnum = region radian x henge radius
if(_tklst.length==0) {
	hengeview_draw(hvobj.key);
	return;
}
var regions=hvobj.regions;
var regionorder=hvobj.regionorder;
var regionparam=[];
var a,b;
for(var i=0; i<regionorder.length; i++) {
	var ridx=regionorder[i];
	var r=regions[ridx];
	regionparam.push(r.chrom+','+r.dstart+','+r.dstop+','+parseInt(hvobj.regionradianspan[ridx]*hvobj.radius));
	if(i==0) {
		a=r.dstart;
	}
	if(i==regionorder.length-1) {
		b=r.dstop;
	}
}
if(regionparam.length==0) {
	hengeview_draw(hvobj.vkey);
	return;
}
loading_cloak(hvobj.main);
var bbj=hvobj.bbj;
let paramsObj = {
	addtracks: "on",
	dbName: bbj.genome.name,
	runmode: RM_genome,
	regionLst: regionparam.join(','),
	startCoord: a,
	stopCoord: b
};
paramsObj = Object.assign(paramsObj, trackParam(_tklst));
bbj.ajax(paramsObj,function(data){bbj.hengeview_ajaxwreath_cb(data,hvobj);});
}
Browser.prototype.hengeview_ajaxwreath_cb=function(data,hvobj)
{
loading_done();
if(!data) {
	print2console('Crashed when fetching data',2);
	return;
}
var lst=data.tkdatalst;

var _l=hvobj.regionorder.length;
var wreath=hvobj.wreath;
if(hvobj.wreathajaxidx==-1) {
	// fetched data for all tracks
	if(wreath.length!=lst.length) fatalError('hengeview_ajaxwreath: wreath and data not same length');
	for(var i=0; i<wreath.length; i++) {
		for(var j=0; j<lst.length; j++) {
			if(wreath[i].name==lst[j].name) {
				wreath[i].data={};
				var _d=lst[j].data;
				if(_l!=_d.length) fatalError('hengeview_ajaxwreath: _l!=_d.length');
				for(var k=0; k<_l; k++) {
					wreath[i].data[hvobj.regions[hvobj.regionorder[k]].name]=_d[k];
				}
				break;
			}
		}
	}
} else {
	// fetched data for one track
	var _d=lst[0].data;
	if(_d.length!=_l) fatalError('hengeview_ajaxwreath: _d.length != _l');
	for(var i=0; i<_l; i++) {
		wreath[wreath.length-1].data[hvobj.regions[hvobj.regionorder[i]].name]=_d[i];
	}
}
hengeview_draw(hvobj.key);
}


function hengeview_changeradius(event)
{
// set plot graph size, called by clicking button
var vkey=gflag.menu.viewkey;
apps.circlet.hash[vkey].radius=Math.max(150,apps.circlet.hash[vkey].radius+parseInt(event.target.getAttribute('change')));
hengeview_computeRegionRadian(vkey);
hengeview_ajaxupdatepanel(vkey);
}
function hengeview_changechrbarsize(event)
{
if(event.target.selectedIndex==0) return;
var vkey=gflag.menu.viewkey;
apps.circlet.hash[vkey].ideogramwidth=Math.max(3,apps.circlet.hash[vkey].ideogramwidth+parseInt(event.target.getAttribute('change')));
hengeview_draw(vkey);
}
function hengeview_showhidescale(event)
{
var vkey=gflag.menu.viewkey;
apps.circlet.hash[vkey].showscalebar=event.target.checked;
hengeview_draw(vkey);
}
function hengeview_togglecytoband(event)
{
var vkey=gflag.menu.viewkey;
apps.circlet.hash[vkey].showcytoband=event.target.checked;
hengeview_draw(vkey);
}

function hengeview_updateregionorderfromMenu(vkey)
{
/* update .regionorder according to menu items
when a region is added/removed or the order was changed
*/
var neworder=[];
var lst=apps.circlet.hash[vkey].regions;
var lst2=document.getElementById('hengeview_chrholder').firstChild.childNodes;
for(i=0; i<lst2.length; i++) {
	if(lst2[i].firstChild.firstChild.checked) {
		for(var j=0; j<lst.length; j++) {
			if(lst[j].name==lst2[i].region) {
				neworder.push(j);
				break;
			}
		}
	}
}
apps.circlet.hash[vkey].regionorder=neworder;
}

function hengeview_addremoveregion(event)
{
// called by toggling checkbox of a chromosome
var vkey=gflag.menu.viewkey;
hengeview_updateregionorderfromMenu(vkey);
hengeview_computeRegionRadian(vkey);
hengeview_ajaxupdatepanel(vkey);
}

function hengeview_regiontoggleall(event)
{
var vkey=gflag.menu.viewkey;
var allon=event.target.getAttribute('turnon')=='1';
var lst = document.getElementById('hengeview_chrholder').firstChild.childNodes;
for(var i=0; i<lst.length; i++)
	lst[i].firstChild.firstChild.checked=allon;
hengeview_updateregionorderfromMenu(vkey);
hengeview_computeRegionRadian(vkey);
if(allon) {
	hengeview_ajaxupdatepanel(vkey);
} else {
	hengeview_draw(vkey);
}
}

function menu_hengeview_configrender(event)
{
var hvobj=apps.circlet.hash[gflag.menu.viewkey];
menu_shutup();
menu.lr.style.display='block';
menu.lr.pcscore.parentNode.style.display=menu.lr.ncscore.parentNode.style.display='inline';
menu.lr.pcscoresays.style.display=menu.lr.ncscoresays.style.display='none';
menu.lr.pfscore.parentNode.style.display=menu.lr.nfscore.parentNode.style.display='none';
menu.lr.autoscale.parentNode.style.display='none';
menu.lr.pcscore.value=hvobj.callingtk.pscore;
menu.lr.ncscore.value=hvobj.callingtk.nscore;
changeSelectByValue(menu.lr.matrix,hvobj.callingtk.qtc.matrix);
changeSelectByValue(menu.lr.norm,hvobj.callingtk.qtc.norm);
changeSelectByValue(menu.lr.unit,hvobj.callingtk.qtc.unit_res);
changeSelectByValue(menu.lr.binsize,hvobj.callingtk.qtc.bin_size);
longrange_showplotcolor('rgb('+hvobj.callingtk.pcolor+')', 'rgb('+hvobj.callingtk.ncolor+')');
menu.c26.style.display=menu.c27.style.display='block';
if(hvobj.callingtk.qtc.matrix == undefined){
    menu.lr.hicControl.style.display='none';
}else{
    menu.lr.hicControl.style.display='block';
}
//console.log(hvobj.callingtk);
document.getElementById('hengeview_z_1').checked=hvobj.showscalebar;
document.getElementById('hengeview_z_2').checked=hvobj.showcytoband;
}

function menu_hengeview_configregions(event)
{
/* config .regions
will insert all regions on the fly for display and management
*/
var hvobj=apps.circlet.hash[gflag.menu.viewkey];
menu_shutup();
menu.c27.style.display=menu.c28.style.display='block';
var table=document.getElementById('hengeview_chrholder');
stripChild(table.firstChild,0);
var regions = hvobj.regions;
var regionorder = hvobj.regionorder;
for(var i=0; i<regionorder.length; i++) {
	var r=regions[regionorder[i]];
	var tr=table.insertRow(-1);
	tr.region=r.name;
	tr.insertCell(0).innerHTML='<input type=checkbox onchange=hengeview_addremoveregion(event) checked>';
	//tr.insertCell(-1).innerHTML='<span class=header_b onmousedown=hengeview_itemreorder_Md(event)>'+r.name+'</span>';
	tr.insertCell(-1).innerHTML=r.name;
	var td=tr.insertCell(-1);
	td.style.color='#858585';
	td.innerHTML=r.arcnum+' arcs';
}
// insert those that are not shown
for(i=0; i<regions.length; i++) {
	if(regionorder.indexOf(i)==-1) {
		var tr=table.insertRow(-1);
		tr.region=regions[i].name;
		tr.insertCell(0).innerHTML='<input type=checkbox onchange=hengeview_addremoveregion(event)>';
		//tr.insertCell(-1).innerHTML='<span class=header_b onmousedown=hengeview_itemreorder_Md(event)>'+regions[i].name+'</span>';
		tr.insertCell(-1).innerHTML=regions[i].name;
		var td=tr.insertCell(-1);
		td.style.color='#858585';
		td.innerHTML=regions[i].arcnum+' arcs';
	}
}
}

function hengeview_invoketkselect(event)
{
/* called by clicking button in menu
a change of menu role occurs here
*/
gflag.menu.viewkey=event.target.viewkey;
menu_shutup();
menu_show_beneathdom(14,event.target);
var vobj=apps.circlet.hash[event.target.viewkey];
vobj.bbj.showcurrenttrack4select(tkentryclick_hengeview,ftfilter_ordinary);
}

function tkentryclick_hengeview(event)
{
if(event.target.className=='tkentry_inactive') {return;}
var tk=event.target.tkobj;
if(tk.ft==FT_lr_n||tk.ft==FT_lr_c||tk.ft==FT_hi_c||tk.ft==FT_sam_n||tk.ft==FT_sam_c||tk.ft==FT_bam_c||tk.ft==FT_bam_n) {
	print2console('Unsupported track type',2);
	return;
}
event.target.className='tkentry_inactive';
var vobj=apps.circlet.hash[gflag.menu.viewkey];
for(var i=0; i<vobj.wreath.length; i++) {
	if(vobj.wreath[i].name==tk.name) {
		print2console('This track has already been added.',2);
		return;
	}
}
var obj2=duplicateTkobj(tk);
if(isNumerical(obj2)) {
	if(!obj2.qtc || obj2.qtc.pr==undefined) {
		tk_applydefaultstyle(obj2);
	}
}
/* beware that native track registry objects do not carry their name
*/
obj2.name=tk.name;
switch(tk.ft) {
case FT_cat_n:
case FT_cat_c:
case FT_bigwighmtk_n:
case FT_bigwighmtk_c:
case FT_bedgraph_n:
case FT_bedgraph_c:
case FT_qdecor_n:
	obj2.mode=M_show;
	break;
default:
	obj2.mode=M_den;
}
obj2.data={}; // data is hash, not array!
obj2.qtc.height=(tk.ft==FT_cat_n||tk.ft==FT_cat_c)?10:20;
vobj.wreath.push(obj2);
hengeview_wreath_addone(gflag.menu.viewkey);
}


function hengeview_wreath_addone(vkey)
{
/* adding one single wreath track of any type
the track is always the last object in hvobj.wreath
issue ajax
*/
var hvobj=apps.circlet.hash[gflag.menu.viewkey];
if(hvobj.wreath.length==0) return;
var tkobj=hvobj.wreath[hvobj.wreath.length-1];
hvobj.wreathajaxidx=hvobj.wreath.length-1; // remember the track object index
hengeview_ajaxwreath(hvobj,[tkobj]);
}


function hengeview_splinter(vkey, coord)
{
apps.circlet.hash[vkey].bbj.splinter(coord);
bubble.style.display='none';
}

function hengeview_hide(event)
{
var o=apps.circlet.hash[event.target.viewkey];
o.handle.style.display='inline-block';
indicator4fly(o.main,o.handle,false);
o.main.style.display='none';
}

function hengeview_delete(event)
{
var k=event.target.viewkey;
var o=apps.circlet.hash[k];
if(o.handle.parentNode!=undefined) {
	apps.circlet.handleholder.removeChild(o.handle);
}
apps.circlet.holder.removeChild(o.main);
delete apps.circlet.hash[k];
}

function hengeview_show(event)
{
// clicking on a handle, show a cached view
var t=event.target;
while(!t.viewkey) t=t.parentNode;
var o=apps.circlet.hash[t.viewkey];
o.main.style.display='inline-block';
indicator4fly(o.handle,o.main,false);
o.handle.style.display='none';
}

function menu_hengeview_zoomout()
{
var b=menu.circlet_blob;
var vobj=apps.circlet.hash[b.viewkey];
var r=vobj.regions[b.ridx];
var l=parseInt((r.dstop-r.dstart)/2);
r.dstart=Math.max(0,r.dstart-l);
r.dstop=Math.min(r.dstop+l, vobj.bbj.genome.scaffold.len[r.chrom]);
menu_hide();
hengeview_computeRegionRadian(b.viewkey);
hengeview_ajaxupdatepanel(b.viewkey);
}

function menu_hengeview_blob(event)
{
menu_shutup();
menu.c1.style.display=
menu.c21.style.display=
menu.c4.style.display=
menu.c18.style.display='block';
var vobj=apps.circlet.hash[event.target.viewkey];
var r=vobj.regions[event.target.ridx];
menu.c1.innerHTML=r.chrom+':'+r.dstart+'-'+r.dstop;
var c=menu.c18_canvas;
vobj.bbj.genome.drawSinglechr_markInterval(c,r.chrom,r.dstart,r.dstop,13,2)
c.hengeviewblob=event.target;
c.chrom=r.chrom;
c.chromlen=vobj.bbj.genome.scaffold.len[r.chrom];
c.bpperpx=c.chromlen/c.width;
c.context=2;
menu.circlet_blob=event.target;
menu_show(21,event.clientX-150,event.clientY);
return false;
}

function get_point_radian(centerx,centery,x,y)
{
/* 0 is horizontal to right, clockwise for increasing radian, gives radian 0-2pi
args:
centerx/y:
x/y:
*/
var r=Math.atan((y-centery)/(x-centerx));
if(x<centerx) {
	r+=Math.PI;
} else if(y<centery) {
	r+=2*Math.PI;
}
return r;
}

function hengeview_paint_glasspane(hvobj,startradian,spanradian)
{
var x=hvobj.centerx, y=hvobj.centery;
var ctx=glasspane.ctx;
ctx.clearRect(0,0,glasspane.width,glasspane.height);
ctx.strokeStyle='rgba(255,102,51,.3)';
ctx.beginPath();
ctx.lineWidth=hvobj.ideogramwidth;
ctx.arc(x,y,hvobj.radius,startradian,startradian+spanradian,false);
ctx.stroke();
ctx.strokeStyle='rgb(245,61,0)';
ctx.lineWidth=1;
ctx.beginPath();
var r=hvobj.radius-hvobj.ideogramwidth/2-3;
ctx.moveTo(x+r*Math.cos(startradian),y+r*Math.sin(startradian));
r=hvobj.radius+hvobj.ideogramwidth/2+3;
ctx.lineTo(x+r*Math.cos(startradian),y+r*Math.sin(startradian));
ctx.arc(x,y,r,startradian,startradian+spanradian,false);
r=hvobj.radius-hvobj.ideogramwidth/2-3;
ctx.lineTo(x+r*Math.cos(startradian+spanradian),y+r*Math.sin(startradian+spanradian));
ctx.arc(x,y,r,startradian+spanradian,startradian,true);
ctx.stroke();
}

function get_directionspan_circularmove(oldr,newr)
{
/* args:
oldr: previous radian
newr: new radian
input are always positive, from get_point_radian()
figure out move direction (true for clockwise) and moved radian (always positive)
allowed move radian within +-PI of old radian
*/
var esc=0.1;
if(oldr<=Math.PI/2) {
	// 1st
	var a=newr-Math.PI-oldr;
	if(a>=-esc && a<=esc) return [null,null];
	if(newr<oldr) return [false,oldr-newr];
	if(newr<oldr+Math.PI) return [true,newr-oldr];
	// switching to 3rd or 4th
	return [false, Math.PI*2-newr+oldr];
}
if(oldr<=Math.PI) {
	// 2nd
	var a=newr-Math.PI-oldr;
	if(a>=-esc && a<=esc) return [null,null];
	if(newr<oldr) return [false, oldr-newr];
	if(newr<oldr+Math.PI) return [true,newr-oldr];
	// jump from 1st to 4th
	return [false,Math.PI*2-newr+oldr];
}
if(oldr<=Math.PI*.15) {
	// 3rd
	var a=oldr-Math.PI-newr;
	if(a>=-esc && a<=esc) return [null,null];
	if(newr>oldr) return [true,newr-oldr];
	if(newr<oldr-Math.PI) {
		// jump from 4th to 1st
		return [true,Math.PI*2-oldr+newr];
	}
	return [false,oldr-newr];
}
// 4th
var a=oldr-Math.PI-newr;
if(a>=-esc && a<=esc) return [null,null];
if(newr>oldr) return [true,newr-oldr];
if(newr<Math.PI-(Math.PI*2-oldr)) {
	// jump from 4th to 1st or 2nd
	return [true,Math.PI*2-oldr+newr];
}
return [false,oldr-newr];
}


function hengeview_blob_md(event)
{
/* md on a blob prepare to move
record circle center pos on page
clumsy method to tell (anti)clockwise direction
*/
if(event.button!=0) return;
event.preventDefault();
var vobj=apps.circlet.hash[event.target.viewkey];
var pos=absolutePosition(vobj.canvas);
var cx=pos[0]+vobj.centerx;
var cy=pos[1]+vobj.centery;
var mx=event.clientX+document.body.scrollLeft;
var my=event.clientY+document.body.scrollTop;
gflag.hvblobmove={
key:event.target.viewkey,
vobj:vobj,
roidx:vobj.regionorder.indexOf(event.target.ridx),
cx:cx,
cy:cy,
mx:mx,
my:my,
old_radian:get_point_radian(cx,cy,mx,my),
};
document.body.addEventListener('mousemove',hengeview_blob_mm,false);
document.body.addEventListener('mouseup',hengeview_blob_mu,false);
glasspane.style.display='block';
glasspane.style.left=pos[0];
glasspane.style.top=pos[1];
glasspane.width=vobj.canvas.width;
glasspane.height=vobj.canvas.height;
hengeview_paint_glasspane(vobj,
	vobj.regionradianoffset[event.target.ridx],
	vobj.regionradianspan[event.target.ridx]);
}
function hengeview_blob_mm(event)
{
// clumsy method to determine sweep radian, move direction
var bm=gflag.hvblobmove;
var regionorder=bm.vobj.regionorder;
var x=event.clientX+document.body.scrollLeft,
y=event.clientY+document.body.scrollTop;
var curr_radian=get_point_radian(bm.cx,bm.cy,x,y);
var ridx=regionorder[bm.roidx];
hengeview_paint_glasspane(bm.vobj,
	bm.vobj.regionradianoffset[ridx]+curr_radian-bm.old_radian,
	bm.vobj.regionradianspan[ridx]);
// only allow cursor moving +-pi of old radian
var tmp=get_directionspan_circularmove(bm.old_radian,curr_radian);
if(tmp[0]==null) {hengeview_blob_mu();return;}
var clockwise=tmp[0];
var move_radian=tmp[1];

var r1id=bm.roidx; // these are order array idx
var r2id=clockwise?((r1id==regionorder.length-1)?0:(r1id+1)):((r1id==0)?(regionorder.length-1):(r1id-1));
if(move_radian>=bm.vobj.regionradianspan[regionorder[r2id]]) {
	// swap two regions in the order array
	if(r1id>r2id) {
		var a=regionorder.splice(r1id,1);
		var b=regionorder.splice(r2id,1,a[0]);
		regionorder.splice(r1id,0,b[0]);
	} else {
		var a=regionorder.splice(r2id,1);
		var b=regionorder.splice(r1id,1,a[0]);
		regionorder.splice(r2id,0,b[0]);
	}
	hengeview_draw(bm.key);
	bm.mx=x;
	bm.my=y;
	bm.old_radian=curr_radian;
	bm.roidx=r2id;
}
}

function hengeview_blob_mu()
{
document.body.removeEventListener('mousemove',hengeview_blob_mm,false);
document.body.removeEventListener('mouseup',hengeview_blob_mu,false);
glasspane.style.display='none';
}

function hengeview_canvas_md(event)
{
/* mouse down on canvas, might serve for multiple functions
wreath track reordering is abandoned, in old.js
*/
if(event.button!=0) return;
event.preventDefault();
var hvobj=apps.circlet.hash[event.target.viewkey];
var stuff=hengeview_canvasxy2stuff(hvobj,event.clientX,event.clientY);
if(stuff[0]!=1 && stuff[0]!=2) return;
document.body.addEventListener('mousemove', hengeview_zoom_mm, false);
document.body.addEventListener('mouseup', hengeview_zoom_mu, false);
var pos=absolutePosition(hvobj.canvas);
var cx=pos[0]+hvobj.centerx;
var cy=pos[1]+hvobj.centery;
var mx=event.clientX+document.body.scrollLeft;
var my=event.clientY+document.body.scrollTop;
gflag.hvblobmove={
key:event.target.viewkey,
vobj:hvobj,
ridx:stuff[1],
cx:cx,
cy:cy,
mx:mx,
my:my,
old_radian:get_point_radian(cx,cy,mx,my),
clockwise:null,
move_radian:null,
};
glasspane.style.display='block';
glasspane.style.left=pos[0];
glasspane.style.top=pos[1];
glasspane.width=hvobj.canvas.width;
glasspane.height=hvobj.canvas.height;
}

function hengeview_zoom_mm(event)
{
// repetitive with hengeview_blob_mm
var bm=gflag.hvblobmove;
var x=event.clientX+document.body.scrollLeft,
y=event.clientY+document.body.scrollTop;
var curr_radian=get_point_radian(bm.cx,bm.cy,x,y);
// only allow cursor moving +-pi/2 of old radian
var tmp=get_directionspan_circularmove(bm.old_radian,curr_radian);
if(tmp[0]==null) {hengeview_zoom_mu();return;}
bm.clockwise=tmp[0];
bm.move_radian=tmp[1];
var r_start=bm.vobj.regionradianoffset[bm.ridx];
var r_span=bm.vobj.regionradianspan[bm.ridx];
if(bm.clockwise) {
	if(bm.old_radian+bm.move_radian>r_start+r_span) {
		bm.move_radian=r_start+r_span-bm.old_radian;
	} else {
		hengeview_paint_glasspane(bm.vobj,bm.old_radian,bm.move_radian);
	}
} else {
	if(bm.old_radian-bm.move_radian<r_start) {
		bm.move_radian=bm.old_radian-r_start;
	} else {
		hengeview_paint_glasspane(bm.vobj,bm.old_radian-bm.move_radian,bm.move_radian);
	}
}
}

function hengeview_zoom_mu()
{
glasspane.style.display='none';
document.body.removeEventListener('mousemove', hengeview_zoom_mm, false);
document.body.removeEventListener('mouseup', hengeview_zoom_mu, false);
var bm=gflag.hvblobmove;
if(bm.clockwise==null) return;
var r=bm.vobj.regions[bm.ridx];
var sf=(r.dstop-r.dstart)/bm.vobj.regionradianspan[bm.ridx];
var rr_start=bm.vobj.regionradianoffset[bm.ridx];
if(bm.clockwise) {
	r.dstart+=parseInt(sf*(bm.old_radian-rr_start));
} else {
	r.dstart+=parseInt(sf*(bm.old_radian-rr_start-bm.move_radian));
}
r.dstop=r.dstart+parseInt(sf*bm.move_radian);
hengeview_computeRegionRadian(bm.key);
hengeview_ajaxupdatepanel(bm.key);
}

