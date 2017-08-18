function toggle10()
{
// gene set management panel of the page
var bait=apps.gsm.main;
if(bait.style.display=='none') {
	cloakPage();
	stripChild(bait.__contentdiv,0);
	bait.__contentdiv.appendChild(gflag.browser.genome.geneset.main);
	panelFadein(bait, 100+document.body.scrollLeft, 50+document.body.scrollTop);
	menu_hide();
	apps.gsm.bbj=gflag.browser;
} else {
	pagecloak.style.display='none';
	panelFadeout(bait);
}
}

function makepanel_gsm(param)
{
var d=make_controlpanel(param);
apps.gsm={main:d};
// edit ui belongs to page
var d2=document.createElement('div');
d2.style.position='relative';
d2.style.padding='20px 20px 1px 20px';
d2.style.backgroundColor=colorCentral.foreground_faint_1;
d2.style.color=colorCentral.background;
dom_addtext(d2,'Drag <span class=header_b>item</span> to change order, click <span class=clb2>&#10005;</span> to mark for deletion <button type=button onclick=gsm_deleteitem()>delete</button>','white');
apps.gsm.edit_ui=d2;
var d3=dom_create('div',d2,'padding:5px;resize:both;height:150px;overflow:scroll;background-color:#e0e0e0;');
apps.gsm.edit_showtable=dom_create('table',d3);
var p=dom_create('p',d2,'color:inherit');
dom_addtext(p,'Showing ');
apps.gsm.edit_gss_says=dom_addtext(p,'');
dom_create('br',p);
dom_addbutt(p,'change &#187;',gsm_invokegss);
p=dom_create('p',d2);
apps.gsm.edit_newname=dom_inputtext(p,{ph:'enter new name',size:15,call:gsm_setname_kw});
dom_addbutt(p,'rename this set',gsm_setname);
var t=dom_create('table',d2,'color:inherit');
var tr=t.insertRow(0);
var td=tr.insertCell(0);
var ta=dom_create('textarea',td);
ta.rows=4;
ta.cols=16;
apps.gsm.edit_add_textarea=ta;
td=tr.insertCell(1);
td.style.paddingLeft=20;
td.vAlign='top';
dom_addtext(td,'Add new items to this list, requirement as before');
dom_create('br',td);
apps.gsm.edit_add_butt=dom_addbutt(td,'Submit',gsm_edit_add);
p=dom_create('p',d2,'text-align:right');
dom_create('div',d2,'position:absolute;top:2px;right:2px;border:solid 1px white;padding:3px 6px;cursor:default;',{t:'&#10005;',c:'opaque7',clc:gsm_doneedit});

// gss TODO tidy it up
var d=dom_create('div');
d.id='gsspanel'; // for moving
gsselect.main=d;
d.className='spanel';
d.style.display='none';
d.style.zIndex=104;
d.addEventListener('mouseover',gssp_mover,false);
d.addEventListener('mouseout',gssp_mout,false);
d.innerHTML= '<div>\
    <div class=spanelheader active=1 holderid=gsspanel onmousedown="cpmoveMD(event)">Select one type</div>\
    <table cellpadding=4>\
      <tr>\
        <td colspan=2><input type=radio name=gss_opt id=genestruct3 value=genebodypromoter alt="3 kb promoter and gene body*" onchange="gsr_change()"> <label for=genestruct3>3 kb promoter and gene body</label></td>\
      </tr><tr>\
        <td><input type=radio name=gss_opt id=genestruct1 value=promoter alt="3 kb promoter*" onchange="gsr_change()"> <label for=genestruct1>3 kb promoter</label></td>\
        <td><input type=radio name=gss_opt id=genestruct2 value=genebody alt="gene body or entire interval" onchange="gsr_change()"> <label for=genestruct2>gene body</label></td>\
      </tr>\
	  <!--<tr>\
        <td><input type=radio name=gss_opt id=genestruct4 value=utr5 alt="5\' UTR*" onchange="gsr_change()"> <label for=genestruct4>5\' UTR</label></td>\
        <td><input type=radio name=gss_opt id=genestruct5 value=utr3 alt="3\' UTR*" onchange="gsr_change()"> <label for=genestruct5>3\' UTR</label></td>\
      </tr>-->\
	  <tr>\
        <td colspan=2>\
		  <div class=titlebox><div style="margin:5px;padding:8px;">\
		  	<table id=gss_sliderpanel cellpadding=0 cellspacing=0 style="display:none;">\
			  <tr>\
			<td width=150 align=right><div style="margin-top:7px;position:relative;">\
			  <hr style="position:absolute;top:8px;right:0px;width:129px;height:3px;background-color:#B3FFB3;">\
			  <canvas id=gss_upslider width=20 height=40 style="position:absolute;left:65px;" onmousedown="gss_us_MD(event)"></canvas>\
			  <div id=gss_upslider_trail style="height:40px;border-bottom:solid 3px green;width:65px;"></div>\
			</div></td>\
			<td width=150 align=left><div style="margin-top:7px;position:relative;">\
			  <hr style="position:absolute;top:8px;left:0px;width:129px;height:3px;background-color:#FFB3B3;">\
			  <canvas id=gss_downslider width=20 height=40 style="position:absolute;left:0px;" onmousedown="gss_ds_MD(event)"></canvas>\
			  <div id=gss_downslider_trail style="height:40px;border-bottom:solid 3px #bd0000;width:0px;"></div>\
			</div></td>\
			  </tr><tr>\
			<td colspan=2 align=center>\
			  <canvas id=coordgliderruler width=300 height=30></canvas>\
			</td>\
			  </tr><tr>\
			<td align=center style="font-weight:bold;font-size:12px;color:green;">upstream: <span id=leftgliderlength>2500</span> bp</td>\
			<td align=center style="font-weight:bold;font-size:12px;color:#bd0000;">downstream: <span id=rightgliderlength>0</span> bp</td>\
			  </tr><tr>\
			<td colspan=2 align=left style="padding:5px;padding-left:40px;">\
			Surrounds:<br>\
			<input type=radio name=gss_origin id=cgotr_txstart value=txstart alt="transcription start site*" onchange="gsr_change()"> <label for=cgotr_txstart>transcription start site*</label><br>\
			<input type=radio name=gss_origin id=cgotr_txstop value=txstop alt="transcription stop site*" onchange="gsr_change()"> <label for=cgotr_txstop>transcription stop site*</label><br>\
			<input type=radio name=gss_origin id=cgotr_gb value=genebody alt="gene body or entire interval" onchange="gsr_change()"> <label for=cgotr_gb>entire gene or interval</label>\
			</td>\
			  </tr>\
			</table>\
		  </div><div style="background-color:white;color:black;left:25px;"><input type=radio name=gss_opt id=genestruct6 value=custom alt=noshow onchange="gsr_change()"> <label for=genestruct6>5\' and 3\' flanking</label>\
		  </div>\
		</div>\
		</td>\
      </tr>\
    </table>\
  </div>';
gsselect.sliderpanel = document.getElementById('gss_sliderpanel');
gsselect.upslider = document.getElementById('gss_upslider');
gsselect.uptrail = document.getElementById('gss_upslider_trail');
gsselect.downslider = document.getElementById('gss_downslider');
gsselect.downtrail = document.getElementById('gss_downslider_trail');

// coordinate selector (upstream slider)
var c=gsselect.upslider;
var ctx = gsselect.upslider.getContext("2d");
var lg = ctx.createLinearGradient(0,0,0,c.height);
lg.addColorStop(0, "#7DFA00");
lg.addColorStop(1, "#306100");
ctx.fillStyle = lg;
var w = 20; // glider width
ctx.moveTo(0,0);ctx.lineTo(w,0);ctx.lineTo(w,w*2);ctx.lineTo(0,w+5);ctx.lineTo(0,0);ctx.fill();
// coordinate selector (downstream slider)
c=gsselect.downslider;
ctx = gsselect.downslider.getContext("2d");
lg = ctx.createLinearGradient(0,0,0,c.height);
lg.addColorStop(0, "#FF8A8A");
lg.addColorStop(1, "#9E0000");
ctx.fillStyle = lg;
ctx.moveTo(0,0);ctx.lineTo(w,0);ctx.lineTo(w,w+5);ctx.lineTo(0,w*2);ctx.lineTo(0,0);ctx.fill();
// coordinate selector ruler
c = document.getElementById("coordgliderruler");
ctx = c.getContext("2d");
ctx.fillStyle = "black";
ctx.font = "10pt Sans-serif";
ctx.fillRect(w, 0, c.width-w*2-1, 1);
ctx.fillRect(w, 0, 1, 8); ctx.fillText("5 KB", 8, 20);
var u = (c.width-w*2)/10; // unit length for each kb
ctx.fillRect(w+u,0,1,5);ctx.fillRect(w+u*2,0,1,5);ctx.fillRect(w+u*3,0,1,5);ctx.fillRect(w+u*4,0,1,5); // upstream ticks
ctx.fillRect(c.width/2, 0, 1, 8);
ctx.fillText("Center", c.width/2-20, 20);
ctx.fillRect(c.width/2+u-1,0,1,5);ctx.fillRect(c.width/2+u*2-1,0,1,5);ctx.fillRect(c.width/2+u*3-1,0,1,5);ctx.fillRect(c.width/2+u*4-1,0,1,5); // downstream ticks
ctx.fillRect(c.width-w-1, 0, 1, 8); ctx.fillText("5 KB", c.width-32, 20);
}


Genome.prototype.make_gsm_ui=function()
{
/* make gsm ui for the genome
input ui should belong to genome but not a common one for page
because default geneset of a genome will be write down there
*/
var d=document.createElement('div');
var _s={main:d,lst:[],__pendinggs:[]};
this.geneset=_s;
_s.says=dom_create('div',d,'margin:10px;color:white;');
_s.says.innerHTML='You don\'t have any gene sets yet.';
_s.lstdiv=dom_create('div',d,'margin:10px 10px 20px 0px;');
var d2=dom_create('div',d,'display:inline-block;font-size:120%;margin:30px 10px;border:solid 1px white;');
d2.className='whitebar';
d2.innerHTML='&#10010; Add new set';
d2.addEventListener('click',addnewgeneset_showui,'false');
_s.butt_showui=d2;
var lst=['Copy & paste'];
var haskegg= this.keggSpeciesCode;
if(haskegg) {
	lst.push('KEGG pathway');
}
d2=make_tablist({lst:lst,tabtop:true});
d2.style.margin='30px 10px';
d2.style.display='none';
d.appendChild(d2);
_s.submit_ui=d2;
d2.tab_holder.style.backgroundColor=d2.page_td.style.backgroundColor=colorCentral.background_faint_7;
// copy paste
var table=dom_create('table',d2.holders[0]);
table.cellPadding=10;
var tr=table.insertRow(0);
var td=tr.insertCell(0);
td.rowSpan=2;
var ta=dom_create('textarea',td);
ta.rows=10;
ta.cols=20;
_s.textarea_submitnew=ta;
td=tr.insertCell(1);
dom_addtext(td,'Enter a list of gene names or coordinates to make a gene set<br>one item per line<br>gene names and coordinates can be mixed for input');
dom_create('br',td);
dom_addtext(td,'Coordinate string must be in the form of "chr1:345-678"<br>fields can be joined by space/tab/comma/colon/hyphen',colorCentral.foreground_faint_3);
dom_create('br',td);
_s.input_submitnew=dom_inputtext(td,{size:12,ph:'name this set',call:addnewgeneset_ku});

tr=table.insertRow(1);
td=tr.insertCell(0);
td.vAlign='bottom';
_s.butt_submitnew=dom_addbutt(td,'Submit',addnewgeneset_pushbutt);
dom_addbutt(td,'Clear',addnewgeneset_reset);

// kegg ui
if(haskegg) {
	var keggdiv=d2.holders[1];
	keggdiv.style.padding=15;
	_s.keggkwinput=dom_inputtext(keggdiv,{size:15,ph:'enter keywords',call:search_kegg_ku});
	_s.keggkwsearchbutt=dom_addbutt(keggdiv,'Search KEGG',search_kegg);
	dom_create('br',keggdiv);
	var d3=dom_create('div',keggdiv,'margin:10px 10px 30px 10px');
	d3.className='container';
	d3.style.display='none';
	_s.wrapper_pathwaytable=d3;
	var table=dom_create('table',d3);
	table.style.width='100%';
	table.cellSpacing=2;
	table.cellPadding=0;
	_s.pathwaytable=table;
	dom_addtext(keggdiv,'<br>Service depends on availability of <a href=http://www.kegg.jp target=_blank>KEGG database</a>');
}
if('toggle27' in window) {
	dom_addtext(d, '<span onclick="toggle10();toggle27();">Try the file uploader</span>', null,'clb3');
}
}






function addnewgeneset_showui()
{
apps.gsm.bbj.genome.geneset.submit_ui.style.display='block';
apps.gsm.bbj.genome.geneset.butt_showui.style.display='none';
}

function addnewgeneset_ku(event) {if(event.keyCode==13) addnewgeneset_pushbutt();}

function addnewgeneset_pushbutt()
{
/* called by push butt from text input
*/
var bbj=apps.gsm.bbj;
var ip=bbj.genome.geneset.input_submitnew;
bbj.genome.geneset.__pendinggs=[{
	rawinput:bbj.genome.geneset.textarea_submitnew.value,
	name:ip.value.length>0?ip.value:null,
}];
bbj.genome.addgeneset_recursive();
}

Genome.prototype.addgeneset_recursive=function(callback)
{
if(this.geneset.__pendinggs.length==0) {
	if(callback) {
		callback();
	}
	loading_done();
	return;
}
var thisset=this.geneset.__pendinggs.splice(0,1)[0];
if(thisset.lst) {
	// careful! this is a ripe set
	this.addnewgeneset(thisset);
	this.addgeneset_recursive(callback);
	return;
}
var lst=null;
if(thisset.rawinput) {
	lst=thisset.rawinput.split('\n');
} else if(thisset.list) {
	lst=thisset.list;
} else {
	print2console('Cannot add gene set, neither rawinput nor list given',2);
	this.addgeneset_recursive(callback);
	return;
}
var coordlst=[]; // validated coords
var names={}; // pending gene names
for(var i=0; i<lst.length; i++) {
	if(lst[i].length==0) continue;
	var c=this.parseCoordinate(lst[i],2);
	if(c) {
		// TODO region strand
		// must assign new name
		coordlst.push({c:c[0],a:c[1],b:c[3],strand:'+',name:c[0]+':'+c[1]+'-'+c[3],isgene:false});
	} else {
		names[lst[i]]=1;
	}
}
var nl=[];
for(var n in names) { 
	nl.push(n);
}
if(nl.length==0) {
	if(coordlst.length==0) {
		print2console('Skipped an empty set',0);
	} else {
		this.addnewgeneset({lst:coordlst, name:thisset.name?thisset.name:'A set of '+coordlst.length+' regions'});
	}
	this.addgeneset_recursive(callback);
	return;
}
this.geneset.pending={lst:coordlst,name:thisset.name};
this.geneset.butt_submitnew.disabled=true;
var bbj=null;
for(var k in horcrux) {
	if(horcrux[k].genome.name==this.name) {
		bbj=horcrux[k];
		break;
	}
}
if(!bbj) fatalError('no bbj available to issue ajax and query genes');
bbj.getcoord4genenames(nl,function(lst){bbj.genome.addgs_receivegenelst(lst,callback);});
}

Genome.prototype.addgs_receivegenelst=function(genelst,callback)
{
if(!genelst) { genelst=[]; }
var _s=this.geneset;
_s.butt_submitnew.disabled=false;
var l2=this.filter_geneset(genelst);
var lst=_s.pending.lst.concat(l2);
if(lst.length==0) {
	print2console('No recognizable items',2);
	this.addgeneset_recursive(callback);
	return;
}
var newgs={lst:lst,name:_s.pending.name};
if(!newgs.name) {
	var gc=0,rc=0;
	for(var i=0; i<lst.length; i++) {
		if(lst[i].isgene) gc++;
		else rc++;
	}
	if(gc>0) {
		if(rc==0) {
			newgs.name='A set of '+gc+' genes';
		} else {
			newgs.name='A set of '+gc+' genes and '+rc+' regions';
		}
	} else {
		newgs.name='A set of '+rc+' regions';
	}
}
this.addnewgeneset(newgs);
this.addgeneset_recursive(callback);
}

Genome.prototype.filter_geneset=function(genelst)
{
// hardcoded, avoid xenorefgene if there're other genes
var hash={};
for(var i=0; i<genelst.length; i++) {
	var notxeno=[];
	for(var j=0; j<genelst[i].lst.length; j++) {
		var e=genelst[i].lst[j];
		if(e.type && e.type.toLowerCase()!='xenorefgene') {
			notxeno.push(e);
		}
	}
	if(notxeno.length>0) {
		genelst[i].lst=notxeno;
	}
	for(var j=0; j<genelst[i].lst.length; j++) {
		var e=genelst[i].lst[j];
		if(e.name2) {
			e.name=e.name2;
			delete e.name2;
		}
		var n=e.name.toUpperCase();
		if(n in hash) {
			var e0=hash[n]; // already have this
			if(this.scaffold.current.indexOf(e0.c)==-1) {
				// old one is on contig
				hash[n]=e;
			} else {
				if(e0.c==e.c && (e.b-e.a > e0.b-e0.a)) {
					// new one is larger
					hash[n]=e;
				}
			}
		} else {
			hash[n]=e;
		}
	}
}
var l2=[];
for(var n in hash) {l2.push(hash[n]);}
return l2;
}

Genome.prototype.addnewgeneset=function(obj)
{
if(!obj.lst || obj.lst.length==0) {
	print2console('Skipping one invalid gene set',2);
	return;
}
/* finish up items
name is unique identifier of items
.label might be used
*/
var hash={}; // key: unique name, val: count
for(var i=0; i<obj.lst.length; i++) {
	var e=obj.lst[i];
	if(e.a1==undefined) e.a1=e.a;
	if(e.b1==undefined) e.b1=e.b;
	if(!e.name) {
		e.name=e.c+':'+e.a+'-'+e.b;
	}
	if(e.name in hash) {
		hash[e.name]++;
		e.label=e.name;
		e.name=e.name+'_'+hash[e.name];
	} else {
		hash[e.name]=1;
	}
}
if (obj.gss_opt !== "custom") {
	obj.gss_down=2500;
	obj.gss_up=2500;
	obj.gss_origin='txstart';
	obj.gss_opt='genebody';
} else {
	// dpuru : Oct 18 - As part of fix for - https://github.com/epgg/eg/issues/32
	var style_slider = 130 - (parseInt(obj.gss_up) * (130/5000));
	var style_trail = parseInt(obj.gss_up) * (130/5000);
	var styleValue = style_slider.toString().concat('px');
	var styleValue_trail = style_trail.toString().concat('px');

	// we have to calculate and set - 
	gsselect.upslider.style.left = styleValue;
	gsselect.uptrail.style.width = styleValue_trail;
	document.getElementById("leftgliderlength").innerHTML = parseInt(obj.gss_up);

	//gsselect.downslider.style.left = 

	var down_style_slider = parseInt(obj.gss_down) * (130/5000);
	var down_style_trail = parseInt(obj.gss_down) * (130/5000);
	var down_styleValue = down_style_slider.toString().concat('px');
	var down_styleValue_trail = down_style_trail.toString().concat('px');

	// we have to calculate and set -
	gsselect.downslider.style.left = down_styleValue;
	gsselect.downtrail.style.width = down_styleValue_trail;
	document.getElementById("rightgliderlength").innerHTML = parseInt(obj.gss_down);





/*	function gss_slider_uplength() {
	// upstream coordinate slider select length in base pair
		var len = 130 - parseInt(gsselect.upslider.style.left);
		if(len == 0) return 0;
		return parseInt((5000/130)*len);
	}
	function gss_slider_downlength() {
	// downstream coordinate slider select length in base pair
		var len = parseInt(gsselect.downslider.style.left);
		if(len == 0) return 0;
		return parseInt((5000/130)*len);
	}*/
}
/*obj.gss_down=2500;
obj.gss_up=2500;
obj.gss_origin='txstart';
obj.gss_opt='genebody';*/
var _s=this.geneset;
_s.lst.push(obj);
var idx=_s.lst.length-1;
_s.says.innerHTML='Click a gene set for options.';
var d=dom_create('div',_s.lstdiv,'display:table;margin:10px;border:solid 1px rgba(255,255,255,0.7)');
obj.handle=d;
var d2=dom_create('div',d);
d2.className='whitebar';
d2.idx=idx;
d2.addEventListener('click',geneset_showmenu,false);
obj.namespan=dom_addtext(d2,obj.name);
obj.namespan.style.fontSize='130%';
obj.namespan.style.marginRight=20;
obj.countspan=dom_addtext(d2,obj.lst.length+' items');
if(apps.gsm && apps.gsm.main.style.display!='none') {
	panelFadeout(_s.submit_ui);
	//.style.display='none';
	_s.butt_showui.style.display='inline-block';
	panelFadein(d2);
}
if(gflag.gs_load2gsv) {
	// [sukn] add a geneset then run gsv on it
	delete gflag.gs_load2gsv;
	loading_cloak(apps.gsm.bbj.main);
	apps.gsm.bbj.run_gsv(obj.lst);
}
}


Genome.prototype.gsm_setcoord_gss=function(obj)
{
/* arg: ele in bbj.genome.geneset.lst
call after gss option is set, from .a/.b of each item, compute .a1 .b1 (modified start/stop)
*/
// error check
if(obj.gss_opt=='custom') {
	if(obj.gss_up+obj.gss_down<=0) {
		print2console('Flanking region must not be 0 length',2);
		// refuse to update according to gss
		for(var i=0; i<obj.lst.length; i++) {
			var e=obj.lst[i];
			e.a1=e.a;
			e.b1=e.b;
			e.f5a=e.f5b=e.f3a=e.f3b=-1;
		}
		return;
	}
}
for(var i=0; i<obj.lst.length; i++) {
	var e=obj.lst[i];
	// preset: genebody or entire region, no flanking
	e.a1=e.a;
	e.b1=e.b;
	e.f5a=e.f5b=e.f3a=e.f3b=-1;
	var forward=e.strand=='+'||e.strand=='>';
	if(e.isgene) {
		if(obj.gss_opt=='genebody') {
			continue;
		}
		if(obj.gss_opt=='genebodypromoter') {
			if(forward) {
				e.a1=Math.max(0,e.a-3000);
				e.b1=e.b;
				e.f5a=e.a1;
				e.f5b=e.a;
			} else {
				e.a1=e.a;
				e.b1=Math.min(this.scaffold.len[e.c],e.b+3000);
				e.f5a=e.b;
				e.f5b=e.b1;
			}
		} else if(obj.gss_opt=='promoter') {
			if(forward) {
				e.a1=Math.max(0,e.a-3000);
				e.b1=e.a;
			} else {
				e.a1=e.b;
				e.b1=Math.min(this.scaffold.len[e.c],e.b+3000);
			}
		} else if(obj.gss_opt=='custom') {
			if(obj.gss_origin=='txstart') {
				if(forward) {
					e.a1=Math.max(0,e.a-obj.gss_up);
					e.b1=Math.min(this.scaffold.len[e.c],e.a+obj.gss_down);
					e.f5a=e.a1;
					e.f5b=e.f3a=e.a;
					e.f3b=e.b1;
				} else {
					e.a1=Math.max(0,e.b-obj.gss_down);
					e.b1=Math.min(this.scaffold.len[e.c],e.b+obj.gss_up);
					e.f5a=e.f3b=e.b;
					e.f3a=e.a1;
					e.f5b=e.b1;
				}
			} else if(obj.gss_origin=='txstop') {
				if(forward) {
					e.a1=Math.max(0,e.b-obj.gss_up);
					e.b1=Math.min(this.scaffold.len[e.c],e.b+obj.gss_down);
					e.f5a=e.a1;
					e.f5b=e.f3a=e.b;
					e.f3b=e.b1;
				} else {
					e.a1=Math.max(0,e.a-obj.gss_down);
					e.b1=Math.min(this.scaffold.len[e.c],e.a+obj.gss_up);
					e.f5a=e.f3b=e.a;
					e.f3a=e.a1;
					e.f5b=e.b1;
				}
			} else if(obj.gss_origin=='genebody') {
				if(forward) {
					e.a1=Math.max(0,e.a-obj.gss_up);
					e.b1=Math.min(this.scaffold.len[e.c],e.b+obj.gss_down);
					e.f5a=e.a1;
					e.f5b=e.a;
					e.f3a=e.b;
					e.f3b=e.b1;
				} else {
					e.a1=Math.max(0,e.a-obj.gss_down);
					e.b1=Math.min(this.scaffold.len[e.c],e.b+obj.gss_up);
					e.f5a=e.b;
					e.f5b=e.b1;
					e.f3a=e.a1;
					e.f3b=e.a;
				}
			} else {
				fatalError('unknown gss_origin: '+obj.gss_origin);
			}
		} else {
			fatalError('unknown gss_opt: '+obj.gss_opt);
		}
	} else {
		// coord
		if(obj.gss_opt=='custom') {
			// gss_origin is not relevant
			if(forward) {
				e.a1=Math.max(0,e.a-obj.gss_up);
				e.b1=Math.min(this.scaffold.len[e.c],e.b+obj.gss_down);
				e.f5a=e.a1;
				e.f5b=e.a;
				e.f3a=e.b;
				e.f3b=e.b1;
			} else {
				e.a1=Math.max(0,e.a-obj.gss_down);
				e.b1=Math.min(this.scaffold.len[e.c],e.b+obj.gss_up);
				e.f5a=e.b;
				e.f5b=e.b1;
				e.f3a=e.a1;
				e.f3b=e.a;
			}
		}
	}
}
}

function geneset_showmenu(event)
{
// clicking geneset bar
var t=event.target;
while(t.className!='whitebar') t=t.parentNode;
menu.genesetIdx=t.idx;
menu_shutup();
menu.c4.style.display=
menu.c36.style.display='block';
menu.c36a.style.display=apps.gsm.bbj.weaver?'inline-block':'none';
var pos=absolutePosition(t);
menu_show_beneathdom(3,t);
}

Genome.prototype.geneset_delete=function(idx)
{
this.geneset.lstdiv.removeChild(this.geneset.lst[idx].handle);
delete this.geneset.lst[idx];
}

function menu_showgeneset_edit()
{
// from menu option, show selected geneset for view/edit
var gbj=apps.gsm.bbj.genome;
if(menu.genesetIdx>=gbj.geneset.lst.length) {
	fatalError('geneset missing');
}
var gset=gbj.geneset.lst[menu.genesetIdx];
apps.gsm.edit_ui.idx=menu.genesetIdx;
apps.gsm.edit_gss_says.innerHTML=gss_says(gset);
gsm_set2table(gset);
gset.handle.appendChild(apps.gsm.edit_ui);
menu_hide();
}

function gsm_set2table(obj)
{
/* fill apps.gsm.edit_showtable with a gene set, arg is .lst of a geneset
call it when showing a set, or after update
*/
var lst=obj.lst;
var table=apps.gsm.edit_showtable;
stripChild(table,0);
var maxbp=0;
var maxpx=0; // fit to longest name string
for(var i=0; i<lst.length; i++) {
	maxbp=Math.max(maxbp,lst[i].b1-lst[i].a1);
	maxpx=Math.max(maxpx, lst[i].name.length);
}
maxpx=maxpx*9+20;
var sf=maxpx/maxbp;
for(var i=0; i<lst.length; i++) {
	// content in a row: button, symbol, refseq name, desc, link
	var item=lst[i];
	var tr = table.insertRow(-1);
	tr.itemname=item.name;
	tr.style.backgroundColor='transparent';
	var td = tr.insertCell(0);
	td.className='numbull';
	td.innerHTML=i+1;
	td=tr.insertCell(-1);
	td.style.width=maxpx;
	td.innerHTML='<div style="position:relative;border-radius:3px;-moz-border-radius:3px;overflow:hidden;">'+
	'<div style="z-index:0;position:absolute;top:0px;left:0px;height:100%;background-color:#3C78B4;width:'+(sf*(item.b1-item.a1))+'px;"></div>'+
	'<div class=header_b2 onmousedown=gsm_item_md(event)>'+item.name+'</div>'+
	'</div>';
	// if is gene, show button for switching model
	td = tr.insertCell(-1);
	if(item.isgene) {
		td.className='header_g';
		td.innerHTML='&#8644;';
		td.gene=item;
		td.onclick=gsm_showgenemodellst;
	}
	if(item.isgene) {
		td=tr.insertCell(-1); td.style.fontSize='10px';
		td.innerHTML=item.type;
		td=tr.insertCell(-1); td.style.fontSize='10px';
		td.innerHTML=item.c+':'+item.a1+'-'+item.b1+', '+((item.strand=='+'||item.strand=='>')?'forward':'reverse');
		td=tr.insertCell(-1); td.style.fontSize='10px'; td.style.whiteSpace='nowrap';
		if(item.desc) {
			if(item.desc.length>120) {
				td.innerHTML=item.desc.substr(0,100)+'...';
				td.title=item.desc;
			} else {
				td.innerHTML=item.desc;
			}
		}
	} else {
		// coord
		td=tr.insertCell(-1); td.style.fontSize='10px';
		td.colSpan=3;
		td.innerHTML=item.c+':'+item.a1+'-'+item.b1+', '+(item.strand=='+'?'forward strand':'reverse strand');
	}
	td = tr.insertCell(-1);
	td.className='clb2';
	td.innerHTML='&#10005;';
	td.addEventListener('click', gsm_click_mark4del, false);
}
/*
var pn=table.parentNode;
if(lst.length<=20) {
	pn.style.height= pn.style.overflowY='';
} else {
	pn.style.height='300px';
	pn.style.overflowY='scroll';
}
*/
obj.countspan.innerHTML=lst.length+' items';
}

function menu_gs2gsv()
{
/* called from menu option
a gene set is selected by menu, send it to gsv
*/
var bbj=apps.gsm.bbj;
panelFadeout(apps.gsm.main);
pagecloak.style.display='none';
menu_hide();
loading_cloak(bbj.main);
bbj.run_gsv(bbj.genome.geneset.lst[menu.genesetIdx].lst);
}

Browser.prototype.run_gsv=function(lst,viewrange)
{
/* send a geneset to cgi and run gsv
will set .juxtaposition
*/
if(lst.length==0) {
	print2console('Empty gene set',2);
	return;
}
var total=0;
for(var i=0; i<lst.length; i++) {
	total+=lst[i].b1-lst[i].a1;
}
this.weavertoggle(total);
if(lst.length==1) {
	var e=lst[0];
	alertbox_addmsg({color:'white',text:'Only 1 '+(e.isgene?'gene':'region')+' available. Browser jumps to this location instead of running Gene Set View.',bgcolor:'green'});
	if(this.is_gsv()) {
		this.turnoffJuxtapose(false);
		if(synclst) {
			for(var i=0; i<synclst.length; i++) {
				synclst[i].turnoffJuxtapose(false);
			}
		}
	}
	var c=e.c+':'+e.a1+'-'+e.b1;
	this.cgiJump2coord(c);
	if(synclst) {
		for(var i=0; i<synclst.length; i++) {
			synclst[i].cgiJump2coord(c);
		}
	}
	return;
}
if(viewrange) {
	if(viewrange.length!=4) {
		print2console('run_gsv: viewrange nullified, should be 4-array',2);
		viewrange=undefined;
	}
}
var j=this.juxtaposition;
j.type=RM_gsv_c;
j.what=j.note='gene set';
var maxnum=lst.length;
if(maxnum>rungsv_size_limit) {
	print2console('Only first '+rungsv_size_limit+' items are used for gene set view',2);
	maxnum=rungsv_size_limit;
}
var lst2=[];
// copy flanking here
var flk={};
for(var i=0; i<maxnum; i++) {
	var e=lst[i];
	lst2.push(e.c+','+e.a1+','+e.b1+','+e.name);
	flk[e.name]={a5:e.f5a,b5:e.f5b,a3:e.f3a,b3:e.f3b};
}
this.genesetview.flanking=flk;
print2console("Running Gene Set View...", 0);
var gstring=lst2.join(',');
this.ajax_rungsv(gstring,viewrange);
var synclst=null;
if(gflag.syncviewrange) {
	synclst=gflag.syncviewrange.lst;
	for(var i=0; i<synclst.length; i++) {
		synclst[i].juxtaposition={type:j.type,what:j.what,note:j.note};
		synclst[i].genesetview.flanking=flk;
		synclst[i].ajax_rungsv(gstring,viewrange);
	}
}
}


Browser.prototype.ajax_rungsv=function(gstring,viewrange)
{
// viewrange: optional, from getDspStat
gflag.bbj_x_updating[this.horcrux]=1;
var bbj=this;
this.shieldOn();
this.cloak();
let paramObj = {
	new: "on",
	itemlist: gstring,
}
if (viewrange) {
	paramObj.startChr = viewrange[0];
	paramObj.startCoord = viewrange[1];
	paramObj.stopChr = viewrange[2];
	paramObj.stopCoord = viewrange[3];
}
paramObj = Object.assign(paramObj, this.houseParam());
this.ajax(paramObj, function(data){bbj.ajax_rungsv_cb(data);});
}
Browser.prototype.ajax_rungsv_cb=function(data)
{
this.shieldOff();
this.unveil();
delete gflag.bbj_x_updating[this.horcrux];
if(!data) {
	print2console('Server crashed, please restart, sorry!',2);
	return;
}
if(data.abort) {
	print2console(data.abort, 2);
	bbj.runmode_set2default();
	return;
}

// copy entire lst before making dsp (which is .regionLst)
if(!data.entirelst) fatalError('entirelst missing');
this.genesetview.lst=data.entirelst;
this.genesetview.totallen=0;
for(var i=0; i<data.entirelst.length; i++) {
	var e=data.entirelst[i];
	this.genesetview.totallen+=e.stop-e.start;
}
if('newscaffold' in data) {
	this.ajax_scfdruntimesync();
}
this.jsonDsp(data);
this.jsonTrackdata(data);
this.render_browser();
done();

if(this.onupdatex) { this.onupdatex(this); }
this.ajax_loadbbjdata(this.init_bbj_param);
}


Browser.prototype.gsv_savelst=function()
{
var lst=[];
for(var i=0; i<this.genesetview.lst.length; i++) {
	var e=this.genesetview.lst[i];
	var f=this.genesetview.flanking[e.name];
	lst.push({c:e.chrom,a:e.start,a1:e.start,b:e.stop,b1:e.stop,
		isgene:e.isgene,name:e.name,strand:e.strand,
		f3a:f.a3,f3b:f.b3,f5a:f.a5,f5b:f.b5});
}
this.genesetview.savelst=lst;
}


function menu_gs2gplot()
{
panelFadeout(apps.gsm.main);
menu_hide();
toggle4();
apps.gplot.bbj=apps.gsm.bbj;
gplot_gs_chosen(menu.genesetIdx);
}

function menu_gs2scp()
{
panelFadeout(apps.gsm.main);
menu_hide();
toggle19();
if(apps.scp.main.__hbutt2.style.display=='block') {
	simulateEvent(apps.scp.main.__hbutt2,'click');
}
apps.scp.bbj=apps.gsm.bbj;
scp_gs_chosen(menu.genesetIdx);
}

function menu_gs2navregion()
{
pagecloak.style.display='none';
panelFadeout(apps.gsm.main);
menu_hide();
toggle30();
stripChild(apps.navregion.holder,0);
apps.navregion.idx=0;
var lst=apps.gsm.bbj.genome.geneset.lst[menu.genesetIdx].lst;
for(var i=0; i<lst.length; i++) {
	var e=lst[i];
	var c=e.c+':'+e.a1+'-'+e.b1;
	var d=dom_create('div',apps.navregion.holder,'margin:3px;display:inline-block;white-space:nowrap;',{c:'header_b',t:e.name,clc:navregion_go});
	d.start=e.a1;
	d.stop=e.b1;
	d.coord=c;
}
}


function addnewgeneset_reset()
{
apps.gsm.bbj.genome.geneset.textarea_submitnew.value='';
apps.gsm.bbj.genome.geneset.textarea_submitnew.focus();
}

function search_kegg_ku(event) {if(event.keyCode==13) search_kegg();}

function search_kegg()
{
// called by push butt
var bbj=apps.gsm.bbj;
var w = bbj.genome.geneset.keggkwinput.value;
if(w.length==0 || w=="enter keywords") {
	print2console("no keyword given", 2);
	return;
}
bbj.genome.geneset.keggkwsearchbutt.disabled=true;
// get entire list of pathways
var b2=bbj;
let paramObj = {
	listkeggpathway: "on",
	speciescode: bbj.genome.keggSpeciesCode
}
bbj.ajax(paramObj,function(data){b2.search_kegg_cb(data);});
}
Browser.prototype.search_kegg_cb=function(data)
{
this.genome.geneset.keggkwsearchbutt.disabled=false;
if(!data) {
	print2console('server crashed, please restart',2);
	return;
}
if(data.error) {
	print2console('Error querying kegg database',2);
	return;
}
var lowerkeyword=this.genome.geneset.keggkwinput.value.toLowerCase();
// find matching
var matching=[];
for(var i=0; i<data.lst.length-1; i++) {
	var lower=data.lst[i][0].toLowerCase();
	if(lower==lowerkeyword) {
		matching.push(i);
	} else if(lower.split(':')[1]==lowerkeyword) {
		matching.push(i);
		break;
	} else {
		lower=data.lst[i][1].toLowerCase();
		if(lower.indexOf(lowerkeyword)!=-1)
			matching.push(i);
	}
}
if(matching.length==0) {
	print2console('No match found',2);
	return;
}
var wrapper=this.genome.geneset.wrapper_pathwaytable;
wrapper.style.display='block';
var table = this.genome.geneset.pathwaytable;
stripChild(table, 0);
if(matching.length <= 10) {
	wrapper.style.height = wrapper.style.overflowY='';
} else {
	wrapper.style.height = "200px";
	wrapper.style.overflowY = "scroll";
}
for(var i=0; i<matching.length; i++) {
	var v=data.lst[matching[i]];
	var tr=table.insertRow(-1);
	var td=tr.insertCell(0);
	td.className='header_g';
	var pname=v[0].split(':')[1];
	td.wayname=pname;
	td.desc=v[1];
	td.innerHTML=pname;
	td.addEventListener('click',addnewgeneset_querykegg,false);
	td=tr.insertCell(1);
	td.innerHTML=v[1];
}
print2console(matching.length+' matches found',1);
}

function addnewgeneset_querykegg(event)
{
/* called by clicking on button of a pathway
query kegg to retrieve genes of a pathway and add it as a gene set
*/
print2console("Querying KEGG for pathway genes...", 0);
var bbj=apps.gsm.bbj;
loading_cloak(apps.gsm.main.__contentdiv);
bbj.genome.geneset.pathwaydesc=event.target.desc;
bbj.cloak();
bbj.shieldOn();
var b2=bbj;
var name=event.target.wayname;
var desc=event.target.desc;
let paramObj = {
	getgenesbykeggpathway: "on",
	dbName: bbj.genome.name,
	speciescode: bbj.genome.keggSpeciesCode,
	pathway: name
}
bbj.ajax(paramObj,function(data){b2.addnewgeneset_querykegg_cb(data,name,desc);});
}
Browser.prototype.addnewgeneset_querykegg_cb=function(data,pathwayname,pathwaydesc)
{
if(!data) {
	print2console('Server crashed, please start over',2);
	this.unveil();
	this.shielfOff();
	return;
}
if(data.abort) {
	print2console('Failed: '+data.abort,2);
	this.unveil();
	this.shielfOff();
	return;
}
if(data.lststring.length==0) {
	print2console('No genes retrieved for pathway '+pathwayname,2);
	this.unveil();
	this.shielfOff();
	return;
}
this.genome.geneset.__pendinggs=[{
	rawinput:data.lststring,
	name:pathwaydesc,
}];
this.genome.addgeneset_recursive();
}

function gsm_doneedit() {apps.gsm.edit_ui.parentNode.removeChild(apps.gsm.edit_ui);}

function gsm_setname_kw(event){if(event.keyCode==13) gsm_setname();}
function gsm_setname()
{
var t=apps.gsm.edit_newname;
if(t.value.length==0) {
	print2console('Please enter new name',2);
	return;
}
var e=apps.gsm.bbj.genome.geneset.lst[apps.gsm.edit_ui.idx];
e.name=e.namespan.innerHTML=t.value;
}


function gsm_showgenemodellst(event)
{
// from gene set editing
var bbj=apps.gsm.bbj;
apps.gsm.edit_ui.clickeditem=event.target.gene;
bbj.getcoord4genenames([event.target.gene.name],
	function(lst){bbj.gsm_showgenemodellst_cb(lst,event.clientX,event.clientY);});
}
Browser.prototype.gsm_showgenemodellst_cb=function(lst,x,y)
{
if(!lst || lst.length==0) {
	print2console('No genes found!?',2);
	return;
}
menu_shutup();
var table=menu.genemodellstholder;
table.style.display='block';
genelist2selectiontable(lst, table, gsm_switchgenemodel_closure);
menu_show(0,x,y);
}

function gsm_switchgenemodel_closure(gene)
{
return function(){gsm_switchgenemodel(gene);};
}
function gsm_switchgenemodel(newgene)
{
// switch gene model for gene set
// clicked item name
if(geneisinvalid(newgene)) {
	print2console('Invalid gene data, cannot switch gene mode',2);
	return;
}
var cname=apps.gsm.edit_ui.clickeditem.name;
// find original lst ele of this item
var obj=apps.gsm.bbj.genome.geneset.lst[apps.gsm.edit_ui.idx];
for(var i=0; i<obj.lst.length; i++) {
	if(obj.lst[i].name==cname) {
		obj.lst[i]={c:newgene.c,a:newgene.a,b:newgene.b,strand:newgene.strand,
			type:newgene.type,name:(newgene.name2?newgene.name2:newgene.name),desc:newgene.desc,isgene:true};
		apps.gsm.bbj.genome.gsm_setcoord_gss(obj);
		gsm_set2table(obj);
		menu_hide();
		return;
	}
}
}



function gsm_click_mark4del(event)
{
var tr = event.target.parentNode;
tr.style.backgroundColor= tr.style.backgroundColor=='transparent' ? colorCentral.foreground_faint_3 : 'transparent';
}
function gsm_item_md(event)
{
// to reorder items in gsv
event.preventDefault();
var td=event.target;
while(td.tagName!='TD') td=td.parentNode;
var item=td.parentNode.itemname;
var lst=apps.gsm.edit_showtable.firstChild.childNodes;
for(var i=0; i<lst.length; i++) {
	if(lst[i].itemname==item) break;
}
gflag.gsm.reorder={
	target:td,
	idx:i,
	total:lst.length,
	y:event.clientY};
document.body.addEventListener('mousemove', gsm_item_mm, false);
document.body.addEventListener('mouseup', gsm_item_mu, false);
}
function gsm_item_mm(event)
{
var m=gflag.gsm.reorder;
var tbody=apps.gsm.edit_showtable.firstChild;
if(event.clientY<m.y) {
	if(m.idx==0) return;
	if(m.y-event.clientY>=20) {
		tbody.appendChild(tbody.childNodes[m.idx]);
		var lst=[];
		for(var i=m.idx-1; i<m.total-1; i++) lst.push(tbody.childNodes[i]);
		for(var i=0; i<lst.length; i++) tbody.appendChild(lst[i]);
		m.idx--;
		m.y=event.clientY;
	}
} else if(event.clientY>m.y) {
	if(m.idx==m.total-1) return;
	if(event.clientY-m.y>=20) {
		tbody.appendChild(tbody.childNodes[m.idx+1]);
		var lst=[];
		for(var i=m.idx; i<m.total-1; i++) lst.push(tbody.childNodes[i]);
		for(var i=0; i<lst.length; i++) tbody.appendChild(lst[i]);
		m.idx++;
		m.y=event.clientY;
	}
}
/*end*/
}
function gsm_item_mu(event)
{
document.body.removeEventListener('mousemove',gsm_item_mm, false);
document.body.removeEventListener('mouseup',gsm_item_mu, false);
// now reorder .geneset.lst according to <tr> order
var newlst=[];
var lst=apps.gsm.bbj.genome.geneset.lst[apps.gsm.edit_ui.idx].lst;
var trl=apps.gsm.edit_showtable.firstChild.childNodes;
for(var i=0; i<trl.length; i++) {
	for(var j=0; j<lst.length; j++) {
		if(lst[j].name==trl[i].itemname) {
			newlst.push(lst[j]);
			break;
		}
	}
}
apps.gsm.bbj.genome.geneset.lst[apps.gsm.edit_ui.idx].lst=newlst;
}

function gsm_invokegss(event)
{
// for editing
var g=apps.gsm.bbj.genome.geneset.lst[apps.gsm.edit_ui.idx];
checkInputByvalue('gss_opt', g.gss_opt);
checkInputByvalue('gss_origin', g.gss_origin);
var pos=absolutePosition(event.target);
invokegssp(1,pos[0],pos[1]+event.target.clientHeight+5);
}

function gsm_deleteitem()
{
/* called by pushing butt, delete marked items
*/
var nlst=[];
var lst=apps.gsm.edit_showtable.firstChild.childNodes;
for(var i=0; i<lst.length; i++) {
	if(lst[i].style.backgroundColor!='transparent') {
		nlst.push(lst[i].itemname);
	}
}
if(nlst.length==0) {
	print2console('No items selected',2);
	return;
}
var obj=apps.gsm.bbj.genome.geneset.lst[apps.gsm.edit_ui.idx];
lst=obj.lst;
if(nlst.length==lst.length) {
	apps.gsm.bbj.genome.geneset_delete(apps.gsm.edit_ui.idx);
	return;
}
for(var i=0; i<nlst.length; i++) {
	for(var j=0; j<lst.length; j++) {
		if(lst[j].name==nlst[i]) {
			lst.splice(j,1);
		}
	}
}
gsm_set2table(obj);
/*over*/
}


function gsm_edit_add()
{
/* add items to a list
called by pushing butt
duplicative with addnewgeneset_pushbutt but just cumbersome
*/
var bbj=apps.gsm.bbj;
var lst=apps.gsm.edit_add_textarea.value.split('\n');
var coordlst=[];
var names={};
for(var i=0; i<lst.length; i++) {
	if(lst[i].length==0) continue;
	var c=bbj.genome.parseCoordinate(lst[i],2);
	if(c==null) {
		names[lst[i]]=1;
	} else {
		// TODO region strand
		coordlst.push({c:c[0],a:c[1],b:c[3],strand:'+',name:lst[i],isgene:false});
	}
}
var nl=[];
for(var n in names) { nl.push(n);}
if(nl.length==0) {
	if(coordlst.length==0) {
		print2console('No input in textarea',2);
		return;
	}
	var obj=bbj.genome.geneset.lst[apps.gsm.edit_ui.idx];
	obj.lst=obj.lst.concat(coordlst);
	bbj.genome.gsm_setcoord_gss(obj);
	gsm_set2table(obj);
	return;
}
/* TODO remove redundant items */
bbj.genome.geneset.pending=coordlst;
apps.gsm.edit_add_butt.disabled=true;
bbj.getcoord4genenames(nl,function(lst){bbj.gsedit_receivegenelst(lst);});
}

Browser.prototype.gsedit_receivegenelst=function(genelst)
{
if(!genelst) {
	genelst=[];
}
apps.gsm.edit_add_butt.disabled=false;
var _s=this.genome.geneset;
var lst=_s.pending.concat(this.genome.filter_geneset(genelst));
if(lst.length==0) {
	print2console('No recognizable items',2);
	return;
}
var obj=this.genome.geneset.lst[apps.gsm.edit_ui.idx];
obj.lst=obj.lst.concat(lst);
this.genome.gsm_setcoord_gss(obj);
gsm_set2table(obj);
print2console(lst.length+' new genes added.',1);
}






function menu_showgeneset(bbj,butt,call)
{
// show list of geneset in menu for selection
menu_shutup();
var lst=bbj.genome.geneset.lst;
var none=true;
for(var i=0; i<lst.length; i++) {
	if(lst[i]) none=false;
}
if(none) {
	menu.c1.style.display='block';
	menu.c1.innerHTML='No gene sets available.<br>Go to "Gene set" panel and add new sets.';
	menu_show_beneathdom(0,butt);
	return;
}
menu.c32.style.display='block';
stripChild(menu.c32,0);
var d=dom_create('div',menu.c32,'margin:10px');
for(var i=0; i<lst.length; i++) {
	var e=lst[i];
	// if null, it is deleted
	if(e) {
		dom_addtkentry(2,d,false,null,e.name,call).idx=i;
	}
}
menu_show_beneathdom(0,butt);
gflag.menu.bbj=bbj;
}



/* __gss__ gene structure select
TODO make it into menu
FIXME replace dom id "gss_opt" with global gss object
*/

function gssp_mover() {document.body.removeEventListener('mousedown', gssp_close, false);}
function gssp_mout() {document.body.addEventListener('mousedown', gssp_close, false);}
function gssp_close()
{
gsselect.main.style.display = 'none';
document.body.removeEventListener('mousedown', gssp_close, false);
}
function invokegssp(which,x,y)
{
// actually invoke gene struct selection panel
gsselect.sliderpanel.style.display=(getValue_by_radioName('gss_opt')=='custom')?'block':'none';
gsselect.which = which;
gsselect.main.style.display = 'block';
placePanel(gsselect.main, x, y);
document.body.addEventListener('mousedown', gssp_close, false);
}


function gss_says(obj)
{
if(obj.gss_opt=='custom') {
	return obj.gss_up+' bp upstream and '+obj.gss_down+' bp downstream surrounding '+
	(obj.gss_origin=='txstart'?'transcription start site':
		(obj.gss_origin=='txstop'?'transcription stop site':'gene body'))+' or entire region';
}
if(obj.gss_opt=='genebody') { return 'gene body (or entire region)';}
if(obj.gss_opt=='promoter') { return '3 kb promoter (or entire region)';}
if(obj.gss_opt=='genebodypromoter') {return '3 kb promoter and gene body (or entire region)';}
return 'wrong gss_opt';
}

function gsr_change()
{
// called by selecting genestruct radio button or sliding the slider
var v = getValue_by_radioName("gss_opt");
var uplen = gss_slider_uplength();
var downlen = gss_slider_downlength();
if(v == 'custom') {
	gsselect.sliderpanel.style.display = 'block';
} else {
	gsselect.sliderpanel.style.display = 'none';
}
var w=gsselect.which;
if(w==1) {
	var g=apps.gsm.bbj.genome.geneset.lst[apps.gsm.edit_ui.idx];
	g.gss_opt=v;
	g.gss_origin=getValue_by_radioName('gss_origin');
	g.gss_up=uplen;
	g.gss_down=downlen;
	apps.gsm.edit_gss_says.innerHTML=gss_says(g);
	apps.gsm.bbj.genome.gsm_setcoord_gss(g);
	gsm_set2table(g);
} else {
	fatalError('gsr_change: unknown which');
}
/*end*/
}
function gss_slider_uplength() {
// upstream coordinate slider select length in base pair
	var len = 130 - parseInt(gsselect.upslider.style.left);
	if(len == 0) return 0;
	return parseInt((5000/130)*len);
}
function gss_slider_downlength() {
// downstream coordinate slider select length in base pair
	var len = parseInt(gsselect.downslider.style.left);
	if(len == 0) return 0;
	return parseInt((5000/130)*len);
}
function gss_us_MD(event) {
// gss upstream slider
	event.preventDefault();
	gsselect.upslider.x = event.clientX;
	document.body.addEventListener("mousemove", gss_us_M, false);
	document.body.addEventListener("mouseup", gss_us_MU, false);
}
function gss_us_M(event) {
	var x = event.clientX;
	var oldx = gsselect.upslider.x;
	var l = parseInt(gsselect.upslider.style.left);
	if((x>oldx && l>=130) || (x<oldx && l<=0)) return;
	gsselect.upslider.style.left = l + x-oldx;
	gsselect.uptrail.style.width = parseInt(gsselect.uptrail.style.width) - x+oldx;
	l = parseInt(gsselect.upslider.style.left);
	if(l > 130) {
		gsselect.upslider.style.left = 130;
		gsselect.uptrail.style.width = 0;
	} else if(l<0) {
		gsselect.upslider.style.left = 0;
		gsselect.uptrail.style.width = 130;
	}
	// set coord display
	l = parseInt(gsselect.upslider.style.left);
	document.getElementById("leftgliderlength").innerHTML = parseInt(5000/130 * (130-l));
	gsselect.upslider.x = event.clientX;
}
function gss_us_MU() {
	document.body.removeEventListener("mousemove", gss_us_M, false);
	document.body.removeEventListener("mouseup", gss_us_MU, false);
	gsr_change();
}
function gss_ds_MD(event) {
// ds: downstream slider
	event.preventDefault();
	gsselect.downslider.x = event.clientX;
	document.body.addEventListener("mousemove", gss_ds_M, false);
	document.body.addEventListener("mouseup", gss_ds_MU, false);
}
function gss_ds_M(event) {
	var x = event.clientX;
	var oldx = gsselect.downslider.x;
	var l = parseInt(gsselect.downslider.style.left);
	if((x>oldx && l>=130) || (x<oldx && l<=0)) return;
	gsselect.downslider.style.left = l + x-oldx;
	gsselect.downtrail.style.width = parseInt(gsselect.downtrail.style.width) + x-oldx;
	l = parseInt(gsselect.downslider.style.left);
	if(l > 130) {
		gsselect.downslider.style.left = 130;
		gsselect.downtrail.style.width = 130;
	} else if(l<0) {
		gsselect.downslider.style.left = 0;
		gsselect.downtrail.style.width = 0;
	}
	// set coord display
	l = parseInt(gsselect.downslider.style.left);
	document.getElementById("rightgliderlength").innerHTML = parseInt(5000/130 * l);
	gsselect.downslider.x = event.clientX;
}
function gss_ds_MU() {
	document.body.removeEventListener("mousemove", gss_ds_M, false);
	document.body.removeEventListener("mouseup", gss_ds_MU, false);
	gsr_change();
}

/* __gss__ ends */

function exonSort(a,b)
{
return a[0]-b[0];
}
