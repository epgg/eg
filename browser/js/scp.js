function makepanel_scatter(param)
{
var d=make_controlpanel(param);
d.__hbutt2.style.display='none';
d.__contentdiv.style.position='relative';
apps.scp={main:d,
	// callback will be replaced in alethiometer
	callback_click:scatterplot_dotclick, // click dot
	callback_mover:scatterplot_dot_mouseover, // mouseover dot
	callback_submit:scatterplot_submit,
	callback_menudotoption:menu_scatterplot_jump,
	};
var sp=apps.scp;
sp.hash={};
sp.tk1=null;
sp.tk2=null;
sp.width=400;
sp.height=400;
sp.axis_height=20;
sp.dot_size=5;
sp.dot_shape=4;
sp.dotcolor_r=0;
sp.dotcolor_g=77;
sp.dotcolor_b=153;
sp.dot_opacity=0.5;

var ht=make_headertable(d.__contentdiv);
ht.style.width=520;
ht.style.position='absolute';
ht.style.top=ht.style.left=0;
sp.ui_submit=ht;
var table=dom_create('table',ht._c);
table.cellSpacing=table.cellPadding=10;

var tr=table.insertRow(-1);
sp.input_tr=tr;
sp.inputregion_tr=tr;
var td=tr.insertCell(0);
td.colSpan=3;
td.style.padding=20;
dom_addbutt(td,'Choose a gene set',scp_showgeneset).style.marginRight=20;
sp.ui_geneset_says=dom_addtext(td,'No gene set selected');

tr=table.insertRow(-1);
sp.input2_tr=tr;
td=tr.insertCell(0);
td.vAlign='top';
dom_addbutt(td,'choose track &#187;',scatterplot_tk1_invoketkselect).style.marginBottom=10;
sp.tk1_span=dom_create('div',td);
sp.tk1_span.innerHTML='for X axis';
td=tr.insertCell(-1);
td.vAlign='top';
td.style.border='solid 1px '+colorCentral.foreground_faint_1;
td.style.borderWidth='0px 1px';
dom_addbutt(td,'choose track &#187;',scatterplot_tk2_invoketkselect).style.marginBottom=10;
sp.tk2_span=dom_create('div',td);
sp.tk2_span.innerHTML='for Y axis';
td=tr.insertCell(-1);
sp.submit_butt=dom_addbutt(td,'SUBMIT',scatterplot_submit_pushbutt);
dom_create('br',td);
dom_addbutt(td,'Reset',scatterplot_reset);

ht=make_headertable(d.__contentdiv);
ht.style.display='none';
ht.style.position='absolute';
ht.style.top=ht.style.left=0;
sp.ui_figure=ht;
sp.figure_div=dom_create('div',ht._c);
var d5=dom_create('div',ht._c);
d5.style.padding=15;
dom_addtext(d5,'graph width ');
dom_addbutt(d5,'&#10010;',scatterplot_graphwidth).change=50;
dom_addtext(d5,' ');
dom_addbutt(d5,'&#9473;',scatterplot_graphwidth).change=-50;
dom_addtext(d5,' height ');
dom_addbutt(d5,'&#10010;',scatterplot_graphheight).change=50;
dom_addtext(d5,' ');
dom_addbutt(d5,'&#9473;',scatterplot_graphheight).change=-50;
dom_create('br',d5);
dom_addtext(d5,'dot size ');
dom_addbutt(d5,'&#10010;',scatterplot_dotsize).change=1;
dom_addtext(d5,' ');
dom_addbutt(d5,'&#9473;',scatterplot_dotsize).change=-1;
var s=dom_create('select',d5);
s.addEventListener('change',scatterplot_dotshape,false);
var o=dom_create('option',s); o.value=1; o.text='box';
o=dom_create('option',s); o.value=2; o.text='square';
o=dom_create('option',s); o.value=3; o.text='circle';
o=dom_create('option',s); o.value=4; o.text='disc'; o.selected=true;
s.style.marginRight=s.style.marginLeft=15;
dom_addtext(d5,'opacity ');
dom_addbutt(d5,'&#10010;',scatterplot_opacity).change=0.1;
dom_addtext(d5,' ');
dom_addbutt(d5,'&#9473;',scatterplot_opacity).change=-0.1;
dom_addtext(d5,'&nbsp;&nbsp;&nbsp;');
s=dom_addtext(d5,'&nbsp;color&nbsp;','white','coloroval');
s.style.backgroundColor='rgb('+sp.dotcolor_r+','+sp.dotcolor_g+','+sp.dotcolor_b+')';

let colorPicker = dom_create('input', d5, 'display: inline-block');
$(colorPicker).attr('size', 8);
$(colorPicker).addClass(jscolor.lookupClass);
jscolor.installByClassName(jscolor.lookupClass);
colorPicker.jscolor.fromRGB(sp.dotcolor_r, sp.dotcolor_g, sp.dotcolor_b);
colorPicker.addEventListener('focus', scatterplot_dotcolor_initiator);
colorPicker.addEventListener('change', hexColorPicked);
s.onclick = () => colorPicker.jscolor.show();
sp.dotcolor_span=s;
}

function scatterplot_submit_pushbutt() {apps.scp.callback_submit();}
function scatterplot_clickmenuoption(event) {
// called by clicking menu option over a dot
apps.scp.callback_menudotoption(event);
}
function scatterplot_dot_mouseover(event)
{
pica_go(event.clientX,event.clientY);
var t=apps.scp.data[event.target.idx];
picasays.innerHTML='<div style="color:inherit;margin:10px;">'+
'X: '+t.x+'<br>Y: '+t.y+'<br>'+t.name+
(t.coord?
'<br><span style="color:'+colorCentral.background_faint_5+';">'+t.coord+'</span>':'')+
'</div>';
}

function scatterplot_dotclick(event)
{
// show menu option to jump to coord of that dot
var t=apps.scp.data[event.target.idx];
menu_shutup();
var m=menu.c32;
m.style.display='block';
stripChild(m,0);
menu_addoption(null,'Relocate to '+(t.name!=t.coord?t.name+' ('+t.coord+')':t.coord),scatterplot_clickmenuoption,m);
m.coord=t.coord;
menu_show(0,event.clientX,event.clientY);
gflag.menu.bbj=apps.scp.bbj;
}

function menu_scatterplot_jump()
{
toggle19();
gflag.menu.bbj.cgiJump2coord(menu.c32.coord);
}

function toggle19(event)
{
var bait=apps.scp.main;
if(bait.style.display=='none') {
	cloakPage();
	panelFadein(bait,100+document.body.scrollLeft,50+document.body.scrollTop);
	// if scp was invoked on a different genome, need to reset choices
	var s=apps.scp;
	if(s.bbj && s.bbj.genome.name!=gflag.menu.bbj.genome.name) {
		s.geneset=null;
		s.ui_geneset_says.innerHTML='No gene set selected';
		s.tk1=null;
		s.tk1_span.innerHTML='for X axis';
		s.tk2=null;
		s.tk2_span.innerHTML='for Y axis';
		scatterplot_goback();
	}
	apps.scp.bbj=gflag.menu.bbj;
} else {
	pagecloak.style.display='none';
	panelFadeout(bait);
}
menu_hide();
}

function scatterplot_dotcolor_initiator(event)
{
paletteshow(event.clientX, event.clientY, 13);
palettegrove_paint(event.target.style.backgroundColor);
}
function scatterplot_dotcolor()
{
var s=apps.scp;
s.dotcolor_span.style.backgroundColor=palette.output;
var lst=colorstr2int(palette.output);
s.dotcolor_r=lst[0];
s.dotcolor_g=lst[1];
s.dotcolor_b=lst[2];
scatterplot_makeplot(apps.scp);
}

function scatterplot_opacity(event)
{
apps.scp.dot_opacity=Math.min(1,Math.max(0.1,apps.scp.dot_opacity+event.target.change));
scatterplot_makeplot(apps.scp);
}
function scatterplot_dotshape(event)
{
apps.scp.dot_shape=parseInt(event.target.options[event.target.selectedIndex].value);
scatterplot_makeplot(apps.scp);
}
function scatterplot_dotsize(event)
{
apps.scp.dot_size=Math.max(2,apps.scp.dot_size+event.target.change);
scatterplot_makeplot(apps.scp);
}
function scatterplot_graphwidth(event)
{
apps.scp.width=Math.max(200,apps.scp.width+event.target.change);
scatterplot_makeplot(apps.scp);
}
function scatterplot_graphheight(event)
{
apps.scp.height=Math.max(200,apps.scp.height+event.target.change);
scatterplot_makeplot(apps.scp);
}


function scatterplot_reset()
{
var sp=apps.scp;
sp.geneset=null;
sp.ui_geneset_says.innerHTML='No gene set selected';
sp.tk1=sp.tk2=null;
sp.tk1_span.innerHTML='for X axis';
sp.tk2_span.innerHTML='for Y axis';
}
function scatterplot_tk1_invoketkselect(event)
{
menu_shutup();
menu_show_beneathdom(0,event.target);
apps.scp.bbj.showcurrenttrack4select(tkentryclick_tk1_scatterplot,ftfilter_numerical);
}
function tkentryclick_tk1_scatterplot(event)
{
var tk=event.target.tkobj;
if(isNumerical(tk)) {
	apps.scp.tk1=duplicateTkobj(tk);
	stripChild(apps.scp.tk1_span,0);
	dom_addtkentry(2,apps.scp.tk1_span,false,tk,tk.label,generic_tkdetail,20).style.display='inline';
} else {
	print2console('Only numerical track can be used.',2);
}
menu_hide();
}
function scatterplot_tk2_invoketkselect(event)
{
menu_shutup();
menu_show_beneathdom(0,event.target);
apps.scp.bbj.showcurrenttrack4select(tkentryclick_tk2_scatterplot,ftfilter_numerical);
}
function tkentryclick_tk2_scatterplot(event)
{
var tk=event.target.tkobj;
if(isNumerical(tk)) {
	apps.scp.tk2=duplicateTkobj(tk);
	stripChild(apps.scp.tk2_span,0);
	dom_addtkentry(2,apps.scp.tk2_span,false,tk,tk.label,generic_tkdetail,20).style.display='inline';
} else {
	print2console('Only numerical track can be used.',2);
}
menu_hide();
}
function scatterplot_goback()
{
var sp=apps.scp;
sp.main.__hbutt2.style.display='none';
flip_panel(sp.ui_submit,sp.ui_figure,false);
}
function scatterplot_submit()
{
/* polymorphism in alethiometer
*/
var sp=apps.scp;
if(sp.geneset==null) {
	print2console('Geneset unspecified',2);
	return;
}
if(sp.tk1==null) {
	print2console('Track X unspecified',2);
	return;
}
if(sp.tk2==null) {
	print2console('Track Y unspecified',2);
	return;
}
if(sp.tk1.name==sp.tk2.name) {
	print2console('Track X and Y must not be the same',2);
	return;
}
// regions
// TODO spnum for each region
var lst=[];
var _start,_stop;
for(var i=0; i<sp.geneset.lst.length; i++) {
	var e=sp.geneset.lst[i];
	lst.push(e.c+','+e.a+','+e.b+',1');
	if(i==0) {
		_start=e.a;
	}
	_stop=e.b;
}
print2console("Running scatter plot...", 0);
var b=sp.submit_butt;
b.disabled=true;
b.innerHTML='Running...';
var bbj=sp.bbj;
let paramsObj = {
	addtracks: "on",
	dbName: bbj.genome.name,
	runmode: RM_genome,
	regionLst: lst.join(','),
	startCoord: _start,
	stopCoord: _stop
}
paramsObj = Object.assign(paramsObj, trackParam([sp.tk1,sp.tk2]));
bbj.ajax(paramsObj,function(data){bbj.scatterplot_submit_cb(data);});
}
Browser.prototype.scatterplot_submit_cb=function(data)
{
var sp=apps.scp;
var sbutt=sp.submit_butt;
sbutt.disabled=false;
sbutt.innerHTML='SUBMIT';
if(!data) {
	print2console('Server error',2);
	return;
}
if(data.abort) {
	print2console('Error: '+data.abort,2);
	return;
}
// data from tracks
var lst=data.tkdatalst;
if(lst.length!=2) {
	print2console('Error: Got returned data on '+lst.length+' tracks instead of 2',2);
	return;
}
var tk1,tk2;
if(lst[0].name==sp.tk1.name) {
	tk1=lst[0].data;
	tk2=lst[1].data;
} else {
	tk2=lst[0].data;
	tk1=lst[1].data;
}
var total=sp.geneset.lst.length;
if(tk1.length!=total) {
	print2console('Error: Track '+tk1.label+' got returned data for '+tk1.length+' items instead of '+total,2);
	return;
}
if(tk2.length!=total) {
	print2console('Error: Track '+tk2.label+' got returned data for '+tk2.length+' items instead of '+total,2);
	return;
}
sp.data=[];
for(var i=0; i<total; i++) {
	var item=sp.geneset.lst[i];
	sp.data.push({name:item.name,coord:item.c+':'+item.a+'-'+item.b,x:tk1[i][0],y:tk2[i][0]});
}
sp.main.__hbutt2.style.display='block';
flip_panel(sp.ui_submit,sp.ui_figure,true);
scatterplot_makeplot(sp);
done();
}


function scatterplot_makeplot(obj)
{
/** also used by super!
argument is apps.scp, or apps.super
contains everything
*/
var data=obj.data;
// determin scale for axis
var x_min=x_max=data[0].x;
var y_min=y_max=data[0].y;
for(var i=1; i<data.length; i++) {
	var v=data[i].x;
	if(v<x_min) x_min=v;
	else if(v>x_max) x_max=v;
	v=data[i].y;
	if(v<y_min) y_min=v;
	else if(v>y_max) y_max=v;
}

var x_sf=obj.width/(x_max-x_min);
var y_sf=obj.height/(y_max-y_min);

stripChild(obj.figure_div,0);
var table=dom_create('table',obj.figure_div);
var tr=table.insertRow(0);
var td=tr.insertCell(0); // 1-1, y label
td.vAlign='middle';
td.style.padding='20px 2px';
td.appendChild(makecanvaslabel({str:obj.tk2.label+' (Y)',bottom:true}));
td=tr.insertCell(-1); // 1-2, y scale
td.style.padding='20px 2px';
var c=dom_create('canvas',td);
c.height=obj.height;
{
var ctx=c.getContext('2d');
ctx.fillStyle=colorCentral.foreground;
var s_min=neatstr(y_min);
var s_max=neatstr(y_max);
var w_min=ctx.measureText(s_min).width;
var w_max=ctx.measureText(s_max).width;
c.width=10+Math.max(w_min,w_max);
plot_ruler({ctx:ctx,horizontal:false,min:y_min,max:y_max,start:obj.height-1,stop:0,color:colorCentral.foreground,xoffset:c.width-1});
}
td=tr.insertCell(-1); // 1-3, plot
td.style.padding='20px';
var d=dom_create('div',td);
d.style.position='relative';
if(obj.scp_canvas_bg) {
	// add a canvas at background
	c=dom_create('canvas',d,'position:absolute;left:0px;top:0px;');
	c.width=obj.width;
	c.height=obj.height;
	c.x_sf=x_sf;
	//c.x_min=x_min;
	c.y_sf=y_sf;
	c.y_max=y_max;
	obj.scp_canvas_bg=c;
}
d.style.width=obj.width;
d.style.height=obj.height;
d.style.backgroundColor=colorCentral.background;
d.style.border='solid 1px '+colorCentral.foreground_faint_1;
var color='rgba('+obj.dotcolor_r+','+obj.dotcolor_g+','+obj.dotcolor_b+','+obj.dot_opacity+')';
for(i=0; i<data.length; i++) {
	var e=dom_create('div',d); // dot
	e.style.position='absolute';
	e.style.width=e.style.height=obj.dot_size;
	switch(obj.dot_shape) {
	case 1: // box
		e.style.border='solid 1px '+color;break;
	case 2: // square
		e.style.backgroundColor=color;break;
	case 3: // circle
		e.style.borderRadius=e.style.mozBorderRadius=Math.ceil(obj.dot_size/2) + 'px';
		e.style.border='solid 1px '+color;break;
	case 4: // disc
		e.style.borderRadius=e.style.mozBorderRadius=Math.ceil(obj.dot_size/2) + 'px';
		e.style.backgroundColor=color;break;
	}
	e.idx=i;
	e.style.left=(data[i].x-x_min)*x_sf-Math.ceil(obj.dot_size/2);
	e.style.top=(y_max-data[i].y)*y_sf-Math.ceil(obj.dot_size/2);
	e.addEventListener('click',obj.callback_click,false);
	e.addEventListener('mouseover',obj.callback_mover,false);
	e.addEventListener('mouseout',pica_hide,false);
}
tr=table.insertRow(-1);
td=tr.insertCell(0); // 2-1
td=tr.insertCell(-1); // 2-2
td=tr.insertCell(-1); // 2-3, x axis
td.style.padding='2px 20px';
c=dom_create('canvas',td);
c.width=obj.width;
c.height=obj.axis_height;
plot_ruler({ctx:c.getContext('2d'),horizontal:true,min:x_min,max:x_max,start:0,stop:obj.width-1,color:colorCentral.foreground,yoffset:0});
tr=table.insertRow(-1);
td=tr.insertCell(0); // 3-1
td=tr.insertCell(-1); // 3-2
td=tr.insertCell(-1); // 3-3, x label
td.align='center';
td.innerHTML=obj.tk1.label+' (X)';
/*end*/
}

function scp_showgeneset(event)
{
// clicking button
menu_showgeneset(apps.scp.bbj,event.target,scp_choosegeneset);
}

function scp_choosegeneset(event)
{
scp_gs_chosen(event.target.idx);
menu_hide();
}

function scp_gs_chosen(idx)
{
var e=apps.scp.bbj.genome.geneset.lst[idx];
apps.scp.geneset=e;
stripChild(apps.scp.ui_geneset_says,0);
dom_addtkentry(3,apps.scp.ui_geneset_says,false,null,e.name);
}
