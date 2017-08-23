function makepanel_vh(param)
{
var d=make_controlpanel(param);
apps.vh={ main:d,};
var hd=d.__contentdiv;
var table=dom_create('table',hd,'color:white');
table.cellSpacing=5;
var tr=table.insertRow(0);
var td=tr.insertCell(0);
td.vAlign='top';
td.innerHTML='From URL';
td=tr.insertCell(1);
td.vAlign='top';
apps.vh.input_url=dom_inputtext(td,{size:40,ph:'Enter hub URL',call:vh_submiturl_md});
td=tr.insertCell(2);
apps.vh.submit=dom_addbutt(td,'Validate datahub',vh_submiturl);
dom_create('br',td);
apps.vh.refresh=dom_addbutt(td,'Refresh track cache',vh_refresh);

tr=table.insertRow(-1);
td=tr.insertCell(0);
td.innerHTML='From file';
td=tr.insertCell(1);
td.colSpan=2;
var b=dom_create('input',td);
b.type='file';
b.onchange=vh_choosefile;
apps.vh.file=b;
tr=table.insertRow(-1);
apps.vh.holder=dom_create('div',d,'margin-top:20px;padding:20px;background-color:rgba(255,255,255,.5);');
}

function vh_refresh()
{
var t=apps.vh.input_url.value;
if(t.length==0) {
	print2console('Please enter hub URL',2);
	return;
}
apps.vh.submit.disabled=true;
apps.vh.runtype=2; // refresh
var b=apps.vh.bbj;
b.ajaxText({loaddatahub: "on", url: t},function(text){b.vh_parsetext(text);});
}

function vh_submiturl_md(event) {if(event.keyCode==13) {vh_submiturl();}}

function vh_submiturl()
{
var t=apps.vh.input_url.value;
if(t.length==0) {
	print2console('Please enter hub URL',2);
	return;
}
apps.vh.submit.disabled=true;
apps.vh.runtype=1; // validate
var b=apps.vh.bbj;
b.ajaxText({loaddatahub: "on", url: t},function(text){b.vh_parsetext(text);});
}

Browser.prototype.vh_parsetext=function(text)
{
apps.vh.submit.disabled=false;
if(!text) {
	print2console('Failed load hub file',2);
	return;
}
var j=parse_jsontext(text);
if(!j) {
	print2console('Invalid JSON content from hub file',2);
	return;
}
var tklst=[];
for(var i=0; i<j.length; i++) {
	var obj=j[i];
	if(!obj.type) continue;
	obj.type=obj.type.toLowerCase();
	if(!hubtagistrack(obj.type)) continue;
	var tk=this.parse_custom_track(obj);
	if(tk) {
		tklst.push(tk);
		if(tk.ft==FT_cm_c) {
			for(var k in tk.cm.set) {
				tklst.push(tk.cm.set[k]);
			}
		}
	}
}
stripChild(apps.vh.holder,0);
if(tklst.length==0) {
	apps.vh.holder.innerHTML='<div style="margin:20px;">No tracks available from this hub.</div>';
	return;
}
apps.vh.tklst=tklst;
apps.vh.cells={};
dom_create('div',apps.vh.holder,'margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid white;').innerHTML=tklst.length+' tracks found in this hub';
var table=dom_create('table',apps.vh.holder);
var tr=table.insertRow(0);
var td=tr.insertCell(0);
td.innerHTML='Type';
td=tr.insertCell(1);
td.innerHTML='Name';
td=tr.insertCell(2);
td.innerHTML='URL';
td=tr.insertCell(3);
td.innerHTML='Status';
for(i=0; i<tklst.length; i++) {
	var tk=tklst[i];
	tr=table.insertRow(-1);
	tr.style.borderTop='solid 1px #ccc';
	td=tr.insertCell(0);
	td.innerHTML=FT2verbal[tk.ft];
	td=tr.insertCell(1);
	td.innerHTML=tk.label;
	td=tr.insertCell(2);
	if(tk.ft!=FT_cm_c) {
		td.innerHTML=tk.url;
	}
	td=tr.insertCell(3);
	if(tk.ft!=FT_cm_c) {
		td.innerHTML='pending';
		apps.vh.cells[tk.name]=td;
	}
}
vh_testTk(0);
}

function vh_testTk(idx)
{
if(idx>=apps.vh.tklst.length) return;
var tk=apps.vh.tklst[idx];
if(tk.ft==FT_cm_c) {
	vh_testTk(idx+1);
	return;
}
var b=apps.vh.bbj;
var chr=b.genome.scaffold.current[0];
if(apps.vh.runtype==1) {
	let paramsObj = {
		addtracks: "on",
		dbName: b.genome.name,
		runmode: RM_genome,
		regionLst: chr + ",0,10,1",
		startCoord: 0,
		stopCoord: 10,
	}
	paramsObj = Object.assign(paramsObj, trackParam([tk]))
	b.ajax(paramsObj,function(data){
		var cell=apps.vh.cells[apps.vh.tklst[idx].name];
		if(data && data.tkdatalst && data.tkdatalst.length>0) {
			cell.innerHTML='<span class=g>&#10004;</span>';
		} else {
			stripChild(cell,0);
			apps.vh.bbj.refreshcache_maketkhandle(cell,apps.vh.tklst[idx]);
		}
		vh_testTk(idx+1);
	});
} else {
	var j=idx+1;
	b.refreshcache_clickhandle(tk,apps.vh.cells[tk.name],function(){vh_testTk(j);});
}
}


function toggle29()
{
apps.vh.shortcut.style.display='inline-block';
if(apps.vh.main.style.display=='none') {
	cloakPage();
	panelFadein(apps.vh.main, 100+document.body.scrollLeft, 100+document.body.scrollTop);
	menu_hide();
	apps.vh.bbj=gflag.browser;
} else {
	pagecloak.style.display='none';
	panelFadeout(apps.vh.main);
}
}

function vh_choosefile()
{
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
/*
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		print2console('File has no content',2);
		return;
	}
	*/
	apps.vh.bbj.vh_parsetext(e.target.result);
};
reader.readAsText(apps.vh.file.files[0]);
}
