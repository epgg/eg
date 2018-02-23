
function toggle27()
{
// gene set management panel of the page
var bait=apps.fud.main;
if(bait.style.display=='none') {
	cloakPage();
	panelFadein(bait, 100+document.body.scrollLeft, 50+document.body.scrollTop);
	menu_hide();
	apps.fud.bbj=gflag.browser.trunk?gflag.browser.trunk:gflag.browser;
} else {
	pagecloak.style.display='none';
	panelFadeout(bait);
}
}

function makepanel_fileupload(param)
{
var d=make_controlpanel(param);
apps.fud={main:d};
var hasfile= (window.File && window.FileReader && window.FileList && window.Blob);
if(!hasfile) {
	d.__contentdiv.innerHTML='Your web browser does not support HTML5 File API. Use <a href=www.google.com/chrome target=_blank>Google Chrome</a> or <a href=http://www.mozilla.org/firefox target=_blank>Firefox</a> instead.';
	return;
}
apps.fud.loaded=dom_create('div',d.__contentdiv,'margin:20px;');
apps.fud.holder=dom_create('div',d.__contentdiv,'margin:30px 0px;');

var butt=dom_create('input',d.__contentdiv,'display:none;');
butt.type='file';
butt.multiple=true;
butt.addEventListener('change',fud_choosefile,false);
apps.fud.plusbutt=butt;
var d2=dom_create('div',d.__contentdiv,'display:inline-block;font-size:120%;margin:30px 10px;border:solid 1px white;');
d2.className='whitebar';
d2.innerHTML='&#10010; Choose file(s)';
d2.addEventListener('click',fud_plusbutt,'false');
dom_addtext(d.__contentdiv,'Only text files are supported at the moment.','white');

dom_create('p',d.__contentdiv,'color:white').innerHTML='<table style="color:white">\
	<tr><td valign=top style="font-size:medium;padding-right:20px;">Supported formats: </td><td>\
	<a href=http://genome.ucsc.edu/FAQ/FAQformat.html#format1 target=_blank>BED</a>, \
	<a href=http://genome.ucsc.edu/FAQ/FAQformat.html#format3 target=_blank>GFF</a>, \
	and custom format for positional annotation data.<br>\
	<a href=http://genome.ucsc.edu/FAQ/FAQformat.html#format1.8 target=_blank>bedGraph</a> and\
	<a href=http://genome.ucsc.edu/goldenPath/help/wiggle.html target=_blank>Wiggle</a>  for numerical data.<br>\
	<a href=http://wiki.wubrowse.org/Long-range target=_blank>Pairwise interaction format</a> for (but not limited to) 5C, Chia-Pet, Hi-C results.<br>\
	<a href=http://wiki.wubrowse.org/Hammock target=_blank>Hammock</a> for annotation data.<br>\
	<a href=http://www.google.com target=_blank>Calling card</a> (experimental).\
	</td></tr></table>';

/* TODO add controls for:
load local binary file
load text file from url
load binary file from url
*/
// edit ui
d2=dom_create('div',d.__contentdiv,'display:none');
var d3=dom_create('div',d.__contentdiv,'display:none;margin:10px;padding-top:10px;background-color:'+colorCentral.magenta1+';border-top:solid 2px '+colorCentral.magenta7);
apps.fud.editui=d3;
var d4=dom_create('div',d3,'margin:10px;');
d3.says=dom_create('div',d4);
// sample rows
var d5=dom_create('div',d4,'margin:10px;border:1px solid #c96;height:100px;overflow:auto;resize:both;background-color:rgba(200,255,255,.3);');
d3.samplerows=dom_create('table',d5,'margin:10px;opacity:.7;font-family:Courier New;border-color:#ccc;');
d3.samplerows.border=1;
d3.samplerows.cellPadding=3;
// format
var table=dom_create('table',d4,'margin:20px 0px;');
var tr=table.insertRow(0);
var td0=tr.insertCell(0);
td0.vAlign='top';
td0.innerHTML='Format: ';
td0=tr.insertCell(1);
d3.formatradio=[];
d3.formatradio.push(make_radiobutton(td0,{value:'bedgraph',label:'bedGraph <span style="font-size:70%;">NUMERICAL DATA | <a href=http://genome.ucsc.edu/FAQ/FAQformat.html#format1.8 target=_blank>format</a></span>',id:Math.random().toString(),call:fud_file_formatchange,linebreak:true}));
d3.formatradio.push(make_radiobutton(td0,{value:'wig',label:'Wiggle <span style="font-size:70%;">NUMERICAL DATA | <a href=http://genome.ucsc.edu/goldenPath/help/wiggle.html target=_blank>format</a></span>',id:Math.random().toString(),call:fud_file_formatchange,linebreak:true}));
d3.formatradio.push(make_radiobutton(td0,{value:'bed',label:'BED <span style="font-size:70%;">ANNOTATION DATA | <a href=http://genome.ucsc.edu/FAQ/FAQformat.html#format1 target=_blank>format</a></span>',id:Math.random().toString(),call:fud_file_formatchange,linebreak:true}));
d3.formatradio.push(make_radiobutton(td0,{value:'gff',label:'GFF <span style="font-size:70%;">ANNOTATION DATA | <a href=http://genome.ucsc.edu/FAQ/FAQformat.html#format3 target=_blank>format</a></span>',id:Math.random().toString(),call:fud_file_formatchange,linebreak:true}));
d3.formatradio.push(make_radiobutton(td0,{value:'lr',label:'Pairwise interaction <span style="font-size:70%;"><a href=http://wiki.wubrowse.org/Long-range target=_blank>format</a></span>',id:Math.random().toString(),call:fud_file_formatchange,linebreak:true}));
d3.formatradio.push(make_radiobutton(td0,{value:'custom',label:'Custom <span style="font-size:70%;">ANNOTATION DATA</span>',id:Math.random().toString(),call:fud_file_formatchange,linebreak:true}));
d3.formatradio.push(make_radiobutton(td0,{value:'callingcard',label:'Calling card (experimental) <span style="font-size:70%;">DISCRETE NUMERICAL DATA | <a href="http://www.google.com" target=_blank>format</a></span>',id:Math.random().toString(),call:fud_file_formatchange,linebreak:true}));
var t=dom_create('table',td0,'margin:10px 10px 10px 20px;border:1px solid white;display:none;');
d3.customformatter=t;
var tr=t.insertRow(0);
var td=tr.insertCell(0);
td.colSpan=2;
td.style.fontSize='60%';
td.innerHTML='Fields must be separated by whitespace characters';
tr=t.insertRow(-1);
td=tr.insertCell(0);
t.chrom=fud_addselect_columnidx(td,1,false);
td=tr.insertCell(1);
dom_addtext(td,'Chromosome');

tr=t.insertRow(-1);
td=tr.insertCell(0);
t.start=fud_addselect_columnidx(td,2,false);
td=tr.insertCell(1);
dom_addtext(td,'Start');

tr=t.insertRow(-1);
td=tr.insertCell(0);
t.stop=fud_addselect_columnidx(td,3,false);
td=tr.insertCell(1);
dom_addtext(td,'Stop');

tr=t.insertRow(-1);
td=tr.insertCell(0);
t.strand=fud_addselect_columnidx(td,0,true);
td=tr.insertCell(1);
dom_addtext(td,'Strand');

tr=t.insertRow(-1);
td=tr.insertCell(0);
t.itemname=fud_addselect_columnidx(td,0,true);
td=tr.insertCell(1);
dom_addtext(td,'Item name');

d3.formatradio.push(make_radiobutton(td0,{value:'hammock',label:'Hammock <span style="font-size:70%;"><a href=http://wiki.wubrowse.org/Hammock target=_blank>format</a></span>',id:Math.random().toString(),call:fud_file_formatchange,linebreak:true}));
t=dom_create('table',td0,'margin:10px 10px 10px 20px;border:1px solid white;display:none;');
d3.hammockformatter=t;
tr=t.insertRow(0);
td=tr.insertCell(0);
td.align='right';
td.innerHTML='JSON description for the hammock file<br><span style="font-size:70%">required when "category" or "scorelst"<br>attributes are used</span>';
td=tr.insertCell(1);
var ta=dom_create('textarea',td);
t.input=ta;


d4=dom_create('div',d3,'padding:10px 60px 10px 10px;position:relative;background-color:rgba(155,155,155,.2)');
dom_addbutt(d4,'add as <span style="font-size:130%">T</span>RACK',fud_file_load).destination='tk';
var d5=dom_create('div',d4,'display:inline-block;');
d3.submitbutt1=dom_addbutt(d5,'add as <span style="font-size:130%">S</span>ET',fud_file_load);
d3.submitbutt1.destination='gs';
d3.submitbutt1no=dom_addtext(d5,' <span style="font-size:70%;color:#858585;">too many rows for a set</span> ');
dom_addbutt(d4,'<span style="font-size:130%">D</span>ELETE',fud_file_remove,'position:absolute;right:10px;top:10px;');
}

function fud_plusbutt()
{
simulateEvent(apps.fud.plusbutt,'click');
}

function fud_choosefile(event)
{
var lst=event.target.files;
if(lst.length==0) {
	print2console('No files chosen',2);
	return;
}
var sh=apps.fud.holder;
for(var i=0; i<lst.length; i++) {
	var f=lst[i];
	var d=dom_create('div',sh,'margin:10px;padding:5px 130px 5px 5px;background-color:rgba(255,255,255,.7);position:relative;');
	d.file=f;
	d.innerHTML='<strong>'+f.name+'</strong> <span style="font-size:70%">'+(f.type?'('+f.type+')':'')+' - '+f.size+' bytes, last modified: '+
		(f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a')+'</span>'+
		' <button type=button style="position:absolute;right:0px;top:2px;" onclick=fud_file_setup(event)>Setup</button>';
	d.setupdiv=dom_create('div',d);
	panelFadein(d);
}
}

function fud_file_formatchange(event)
{
var v=event.target.value;
var e=apps.fud.editui;
var s=e.customformatter;
var h=e.hammockformatter;
var b=e.submitbutt1.parentNode;
switch(v) {
case 'custom':
	b.style.display='inline';
	s.style.display='block';
	h.style.display='none';
	return;
case 'bed':
	b.style.display='inline';
	s.style.display='none';
	h.style.display='none';
	return;
case 'gff':
	b.style.display='inline';
	s.style.display='none';
	h.style.display='none';
	return;
case 'bedgraph':
	b.style.display='none';
	s.style.display='none';
	h.style.display='none';
	return;
case 'wig':
	b.style.display='none';
	s.style.display='none';
	h.style.display='none';
	return;
case 'lr':
	b.style.display='none';
	s.style.display='none';
	h.style.display='none';
	return;
case 'hammock':
	b.style.display='none';
	s.style.display='none';
	h.style.display='block';
	return;
case 'callingcard':
	b.style.display='none';
	s.style.display='none';
	h.style.display='none';
	return;
default: fatalError('unknown format');
}
}

function fud_file_setup(event)
{
var f=event.target.parentNode.file;
var eui=apps.fud.editui;
eui.file=f;
event.target.nextSibling.appendChild(eui);
stripChild(eui.samplerows,0);
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
	var eui=apps.fud.editui;
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		eui.says.innerHTML='File has no content';
		return;
	}
	eui.says.innerHTML='Showing first 10 rows from the total of '+lines.length+' rows:';
	for(var i=0; i<10; i++) {
		var tl=lines[i];
		var tr=eui.samplerows.insertRow(-1);
		if(!tl || tl.length==0) { 
			var td=tr.insertCell(0);
			td.innerHTML='No content in this row';
		} else {
			var lst=tl.split(/\t/)
			for(var j=0; j<lst.length; j++) {
				var td=tr.insertCell(-1);
				td.innerHTML=lst[j];
			}
		}
	}
	if(lines.length>gs_size_limit) {
		eui.submitbutt1.style.display='none';
		eui.submitbutt1no.style.display='inline';
	} else {
		eui.submitbutt1.style.display='inline';
		eui.submitbutt1no.style.display='none';
	}
	panelFadein(eui);
};
reader.readAsText(f);
}


function fud_file_remove()
{
var edit=apps.fud.editui;
var fd=edit.parentNode.parentNode;
fd.parentNode.removeChild(fd);
}

function fud_file_load(event)
{
var b=event.target;
if(b.tagName!='BUTTON') b=b.parentNode;
var bbj=apps.fud.bbj;
var eui=apps.fud.editui;
eui.destination=b.destination;
var format=null;
for(var i=0; i<eui.formatradio.length; i++) {
	var r=eui.formatradio[i];
	if(r.checked) {
		format=r.value;
		break;
	}
}
if(!format) {
	print2console('Please choose file format',2);
	return;
}
switch(format) {
case 'bed':
	bbj.fud_load_bed(); return;
case 'bedgraph':
	bbj.fud_load_bedgraph(); return;
case 'wig':
	bbj.fud_load_wig(); return;
case 'gff':
	bbj.fud_load_gff(); return;
case 'custom':
	if(!gsm_fselect_validate(eui)) {
		return;
	}
	bbj.gsm_load_custom();
	return;
case 'lr':
	bbj.fud_load_lr();
	return;
case 'hammock':
	bbj.fud_load_hammock();
	return;
case 'callingcard':
	bbj.fud_load_callingcard();
	return;
}
}



function fud_loaded_says(name,astrack)
{
var d=dom_create('div',apps.fud.loaded,'color:white');
if(astrack) {
	dom_addtext(d,'&#10004; <strong>'+name+'</strong> was loaded as a track.');
} else {
	dom_addtext(d,'&#10004; <strong>'+name+'</strong> was loaded as a region set. '+
	'<span class=clb3 onclick="toggle27();toggle10();">See &#187;</span>');
}
}

Browser.prototype.gsm_load_custom=function()
{
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		print2console('File has no content',2);
		return;
	}
	var bbj=apps.fud.bbj;
	var eui=apps.fud.editui;
	var t=gsm_fselect_validate(eui);
	var s_c=t.c, s_a=t.a, s_b=t.b, s_s=t.s, s_n=t.n;
	var data=[];
	for(var i=0; i<lines.length; i++) {
		if(lines[i].length==0) continue;
		var lst=lines[i].split(/\s/);
		// escape disgusting stuff
		if(lst[0].length==0 || lst[0]=='track' || lst[0]=='browser') continue;

		if(lst.length<3) {
			print2console('Error at line '+(i+1)+': less than 3 fields',2);
			return;
		}
		if(!lst[s_c] || lst[s_c].length==0) {
			print2console('Error at line '+(i+1)+': no chromosome name',2);
			return;
		}
		if(!lst[s_a] || lst[s_a].length==0) {
			print2console('Error at line '+(i+1)+': no start position',2);
			return;
		}
		if(!lst[s_b] || lst[s_b].length==0) {
			print2console('Error at line '+(i+1)+': no stop position',2);
			return;
		}
		var t=bbj.genome.parseCoordinate([lst[s_c],parseInt(lst[s_a]),parseInt(lst[s_b])],1);
		if(!t) {
			print2console('Error at line '+(i+1)+': invalid coordinate',2);
			return;
		}
		var c={c:t[0],
			a:t[1],
			b:t[3],
			strand:'.',
			isgene:false};
		if(s_n!=-1 && lst[s_n]) {
			c.name=lst[s_n];
		}
		if(s_s!=-1 && lst[s_s]) {
			c.strand=lst[s_s];
		}
		data.push(c);
	}
	if(data.length==0) {
		print2console('Nothing loaded from file '+eui.file.name,2);
	} else {
		print2console('Read '+data.length+' lines',1);
		if(eui.destination=='gs') {
			bbj.genome.addnewgeneset({lst:data,name:eui.file.name});
			fud_loaded_says(eui.file.name,false);
		} else {
			var lst=[];
			var id=1;
			for(var i=0; i<data.length; i++) {
				var e=data[i];
				lst.push(e.c+'\t'+e.a+'\t'+e.b+'\t'+(e.name?e.name:'.')+'\t'+id+'\t'+(e.strand?e.strand:'.'));
				id++;
			}
			bbj.fud_post_maketrack(lst.join('\n'), {ft:FT_bed_c,label:eui.file.name,mode:M_full});
			fud_loaded_says(eui.file.name,true);
		}
	}
	var fd=eui.parentNode.parentNode;
	fd.parentNode.removeChild(fd);
};
reader.readAsText(apps.fud.editui.file);
}



Browser.prototype.fud_load_bed=function()
{
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		print2console('File has no content',2);
		return;
	}
	var bbj=apps.fud.bbj;
	var eui=apps.fud.editui;
	var data=[];
	for(var i=0; i<lines.length; i++) {
		if(lines[i].length==0) continue;
		var lst=lines[i].split(/\s/);
		// escape disgusting stuff
		if(lst[0].length==0 || lst[0]=='track' || lst[0]=='browser') continue;

		if(lst.length<3) {
			print2console('Error at line '+(i+1)+': less than 3 fields',2);
			return;
		}
		if(!lst[0] || lst[0].length==0) {
			print2console('Error at line '+(i+1)+': no chromosome name',2);
			return;
		}
		if(!lst[1] || lst[1].length==0) {
			print2console('Error at line '+(i+1)+': no start position',2);
			return;
		}
		if(!lst[2] || lst[2].length==0) {
			print2console('Error at line '+(i+1)+': no stop position',2);
			return;
		}
		var t=bbj.genome.parseCoordinate([lst[0],parseInt(lst[1]),parseInt(lst[2])],1);
		if(!t) {
			print2console('Error at line '+(i+1)+': wrong coordinate',2);
			return;
		}
		var c={c:t[0],
			a:t[1],
			b:t[3],
			isgene:false};
		if(lst[3]) {
			c.name=lst[3];
		}
		if(lst[5]) {
			c.strand=lst[5];
		}
		data.push(c);
	}
	if(data.length==0) {
		print2console('Nothing loaded from file '+eui.file.name,2);
	} else {
		print2console('Read '+data.length+' lines',1);
		if(eui.destination=='gs') {
			bbj.genome.addnewgeneset({lst:data,name:eui.file.name});
			fud_loaded_says(eui.file.name,false);
		} else {
			var lst=[];
			var id=1;
			for(var i=0; i<data.length; i++) {
				var e=data[i];
				lst.push(e.c+'\t'+e.a+'\t'+e.b+'\t'+(e.name?e.name:'.')+'\t'+id+'\t'+(e.strand?e.strand:'.'));
				id++;
			}
			bbj.fud_post_maketrack(lst.join('\n'), {ft:FT_bed_c,label:eui.file.name,mode:M_full});
			fud_loaded_says(eui.file.name,true);
		}
	}
	var fd=eui.parentNode.parentNode;
	fd.parentNode.removeChild(fd);
};
reader.readAsText(apps.fud.editui.file);
}



Browser.prototype.fud_load_lr=function()
{
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		print2console('File has no content',2);
		return;
	}
	var bbj=apps.fud.bbj;
	var eui=apps.fud.editui;
	var data=[];
	for(var i=0; i<lines.length; i++) {
		if(lines[i].length==0) continue;
		var lst=lines[i].split(/\s/);
		if(lst.length<2) {
			print2console('Error at line '+(i+1)+': less than 2 fields',2);
			return;
		}
		if(!lst[0] || lst[0].length==0) {
			print2console('Error at line '+(i+1)+': missing first coordinate',2);
			return;
		}
		var c1=bbj.genome.parseCoordinate(lst[0],2);
		if(!c1) {
			print2console('Error at line '+(i+1)+': wrong coordinate',2);
			return;
		}
		if(!lst[1] || lst[1].length==0) {
			print2console('Error at line '+(i+1)+': missing second coordinate',2);
			return;
		}
		var c2=bbj.genome.parseCoordinate(lst[1],2);
		if(!c2) {
			print2console('Error at line '+(i+1)+': wrong coordinate',2);
			return;
		}
		var score=1;
		if(lst[2] || lst[2].length>0) {
			score=parseFloat(lst[2]);
			if(isNaN(score)) {
				print2console('Error at line '+(i+1)+': score is not a number',2);
				return;
			}
		}
		data.push([c1,c2,score]);
	}
	if(data.length==0) {
		print2console('Nothing loaded from file '+eui.file.name,2);
	} else {
		print2console('Read '+data.length+' lines',1);
		var lst=[];
		var id=1;
		for(var i=0; i<data.length; i++) {
			var a=data[i][0],
				b=data[i][1];
			lst.push(a[0]+'\t'+a[1]+'\t'+a[3]+'\t'+b[0]+':'+b[1]+'-'+b[3]+','+data[i][2]+'\t'+id+'\t'+(
				a[0]==b[0]?(a[1]<b[1]?'+':'-'):'.'));
			id++;
			lst.push(b[0]+'\t'+b[1]+'\t'+b[3]+'\t'+a[0]+':'+a[1]+'-'+a[3]+','+data[i][2]+'\t'+id+'\t'+(
				a[0]==b[0]?(a[1]<b[1]?'-':'+'):'.'));
			id++;
		}
		bbj.fud_post_maketrack(lst.join('\n'), {ft:FT_lr_c,label:eui.file.name,mode:M_full,qtc:{pfilterscore:0,nfilterscore:0,pcolorscore:0,ncolorscore:0}});
		fud_loaded_says(eui.file.name,true);
	}
	var fd=eui.parentNode.parentNode;
	fd.parentNode.removeChild(fd);
};
reader.readAsText(apps.fud.editui.file);
}



Browser.prototype.fud_load_hammock=function()
{
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		print2console('File has no content',2);
		return;
	}
	var bbj=apps.fud.bbj;
	var eui=apps.fud.editui;
	var t=eui.hammockformatter.input.value;
	var hjson=null;
	if(t.length>0) {
		hjson=str2jsonobj(t);
		if(!hjson) {
			print2console('Syntax error with JSON description.',2);
			return;
		}
	}
	var data=[];
	for(var i=0; i<lines.length; i++) {
		if(lines[i].length==0) continue;
		var lst=lines[i].split(/\t/);
		if(lst.length!=4) {
			print2console('Error at line '+(i+1)+': hasn\'t got 4 fields',2);
			return;
		}
		if(!lst[0] || lst[0].length==0) {
			print2console('Error at line '+(i+1)+': no chromosome name',2);
			return;
		}
		if(!lst[1] || lst[1].length==0) {
			print2console('Error at line '+(i+1)+': no start position',2);
			return;
		}
		if(!lst[2] || lst[2].length==0) {
			print2console('Error at line '+(i+1)+': no stop position',2);
			return;
		}
		var t=bbj.genome.parseCoordinate([lst[0],parseInt(lst[1]),parseInt(lst[2])],1);
		if(!t) {
			print2console('Error at line '+(i+1)+': wrong coordinate',2);
			return;
		}
		var j=str2jsonobj(lst[3]);
		if(!j) {
			print2console('JSON syntax error at line '+(i+1),2);
			return;
		}
		t=JSON.stringify(j);
		data.push(lst[0]+'\t'+lst[1]+'\t'+lst[2]+'\t'+t.substr(1,t.length-2));
	}
	if(data.length==0) {
		print2console('Nothing loaded from file '+eui.file.name,2);
	} else {
		print2console('Read '+data.length+' lines',1);
		var tk= {ft:FT_anno_c,label:eui.file.name,mode:M_full};
		if(hjson) {
			hammockjsondesc2tk(hjson,tk);
		}
		bbj.fud_post_maketrack(data.join('\n'), tk);
		fud_loaded_says(eui.file.name,true);
	}
	var fd=eui.parentNode.parentNode;
	fd.parentNode.removeChild(fd);
};
reader.readAsText(apps.fud.editui.file);
}


Browser.prototype.fud_load_gff=function()
{
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		print2console('File has no content',2);
		return;
	}
	var bbj=apps.fud.bbj;
	var eui=apps.fud.editui;
	var data=[];
	for(var i=0; i<lines.length; i++) {
		if(lines[i].length==0) continue;
		if(lines[i][0]=='#') continue;
		var lst=lines[i].split(/\s/);
		// escape disgusting stuff
		if(lst[0].length==0 || lst[0]=='track' || lst[0]=='browser') continue;

		if(lst.length!=9) {
			print2console('Error at line '+(i+1)+': hasn\'t got 9 fields',2);
			return;
		}
		if(!lst[0] || lst[0].length==0) {
			print2console('Error at line '+(i+1)+': no chromosome name',2);
			return;
		}
		if(!lst[3] || lst[3].length==0) {
			print2console('Error at line '+(i+1)+': no start position',2);
			return;
		}
		if(!lst[4] || lst[4].length==0) {
			print2console('Error at line '+(i+1)+': no stop position',2);
			return;
		}
		var t=bbj.genome.parseCoordinate([lst[0],parseInt(lst[3]),parseInt(lst[4])],1);
		if(!t) {
			print2console('Error at line '+(i+1)+': wrong coordinate',2);
			return;
		}
		data.push({c:t[0],
			a:t[1],
			b:t[3],
			strand:lst[6],
			name:lst[2],
			isgene:false});
	}
	if(data.length==0) {
		print2console('Nothing loaded from file '+eui.file.name,2);
	} else {
		print2console('Read '+data.length+' lines',1);
		if(eui.destination=='gs') {
			bbj.genome.addnewgeneset({lst:data,name:eui.file.name});
		} else {
			var lst=[];
			var id=1;
			for(var i=0; i<data.length; i++) {
				var e=data[i];
				lst.push(e.c+'\t'+e.a+'\t'+e.b+'\t'+e.name+'\t'+id+'\t'+e.strand);
				id++;
			}
			bbj.fud_post_maketrack(lst.join('\n'), {ft:FT_bed_c,label:eui.file.name,mode:M_full});
		}
	}
	var fd=eui.parentNode.parentNode;
	fd.parentNode.removeChild(fd);
};
reader.readAsText(apps.fud.editui.file);
}



Browser.prototype.fud_load_bedgraph=function()
{
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		print2console('File has no content',2);
		return;
	}
	var bbj=apps.fud.bbj;
	var eui=apps.fud.editui;
	var data=[];
	for(var i=0; i<lines.length; i++) {
		if(lines[i].length==0) continue;
		var lst=lines[i].split(/\s/);
		// escape disgusting stuff
		if(lst[0].length==0 || lst[0]=='track' || lst[0]=='browser') continue;

		if(lst.length<4) {
			print2console('Error at line '+(i+1)+': less than 4 fields',2);
			return;
		}
		if(!lst[0] || lst[0].length==0) {
			print2console('Error at line '+(i+1)+': no chromosome name',2);
			return;
		}
		if(!lst[1] || lst[1].length==0) {
			print2console('Error at line '+(i+1)+': no start position',2);
			return;
		}
		if(!lst[2] || lst[2].length==0) {
			print2console('Error at line '+(i+1)+': no stop position',2);
			return;
		}
		if(!lst[3] || lst[3].length==0) {
			print2console('Error at line '+(i+1)+': no numerical value',2);
			return;
		}
		var t=bbj.genome.parseCoordinate([lst[0],parseInt(lst[1]),parseInt(lst[2])],1);
		if(!t) {
			print2console('Error at line '+(i+1)+': wrong coordinate',2);
			return;
		}
		var v=parseFloat(lst[3]);
		if(isNaN(v)) {
			print2console('Error at line '+(i+1)+': invalid numerical value',2);
			return;
		}
		data.push({c:t[0], a:t[1], b:t[3], v:v });
	}
	if(data.length==0) {
		print2console('Nothing loaded from file '+eui.file.name,2);
	} else {
		print2console('Read '+data.length+' lines',1);
		var lst=[];
		for(var i=0; i<data.length; i++) {
			var e=data[i];
			lst.push(e.c+'\t'+e.a+'\t'+e.b+'\t'+e.v);
		}
		bbj.fud_post_maketrack(lst.join('\n'), {ft:FT_bedgraph_c,label:eui.file.name,mode:M_show});
	}
	var fd=eui.parentNode.parentNode;
	fd.parentNode.removeChild(fd);
};
reader.readAsText(apps.fud.editui.file);
}

function parse_wiggle_header(lst)
{
var s={};
for(var i=1; i<lst.length; i++) {
	var t=lst[i].split('=');
	if(t[0]=='chrom') {
		s[t[0]]=t[1];
	} else {
		s[t[0]]=parseInt(t[1]);
	}
}
return s;
}

Browser.prototype.fud_load_wig=function()
{
var reader=new FileReader();
reader.onerror=function(){print2console('Error reading file',2);}
reader.onabort=function(){print2console('Error reading file',2);}
reader.onload=function(e) {
	var lines=e.target.result.split('\n');
	if(lines.length==0) {
		print2console('File has no content',2);
		return;
	}
	var bbj=apps.fud.bbj;
	var eui=apps.fud.editui;
	var data=[];
	var vs=true;
	var _s;
	for(var i=0; i<lines.length; i++) {
		if(lines[i].length==0) continue;
		var lst=lines[i].split(/\s/);
		// escape disgusting stuff
		if(lst[0].length==0 || lst[0]=='track' || lst[0]=='browser') continue;
		if(lst[0][0]=='v') {
			vs=true;
			_s=parse_wiggle_header(lst);
			if(!_s.span) _s.span=1;
		} else if(lst[0][0]=='f') {
			vs=false;
			_s=parse_wiggle_header(lst);
			if(!_s.span) _s.span=1;
		} else {
			// value
			if(vs) {
				if(lst.length!=2) {
					print2console('Error at line '+(i+1)+': variableStep but not 2 fields',2);
					return;
				}
				data.push({c:_s.chrom,a:lst[0],b:(parseInt(lst[0])+_s.span),v:lst[1]});
			} else {
				if(lst.length!=1) {
					print2console('Error at line '+(i+1)+': fixedStep but not 1 field',2);
					return;
				}
				data.push({c:_s.chrom,a:_s.start,b:(_s.start+_s.span),v:lst[0]});
				_s.start+=_s.step;
			}
		}
	}
	if(data.length==0) {
		print2console('Nothing loaded from file '+eui.file.name,2);
	} else {
		print2console('Read '+data.length+' lines',1);
		var lst=[];
		for(var i=0; i<data.length; i++) {
			var e=data[i];
			lst.push(e.c+'\t'+e.a+'\t'+e.b+'\t'+e.v);
		}
		bbj.fud_post_maketrack(lst.join('\n'), {ft:FT_bedgraph_c,label:eui.file.name,mode:M_show});
	}
	var fd=eui.parentNode.parentNode;
	fd.parentNode.removeChild(fd);
};
reader.readAsText(apps.fud.editui.file);
}

Browser.prototype.fud_load_callingcard=function() {
	var reader=new FileReader();
	reader.onerror=function(){print2console('Error reading file',2);}
	reader.onabort=function(){print2console('Error reading file',2);}
	reader.onload=function(e) {
		var lines=e.target.result.split('\n');
		if(lines.length==0) {
			print2console('File has no content',2);
			return;
		}
		var bbj=apps.fud.bbj;
		var eui=apps.fud.editui;
		var data=[];
		for(var i=0; i<lines.length; i++) {
			if(lines[i].length==0) continue;
			var lst=lines[i].split(/\s/);
			// // escape disgusting stuff
			// if(lst[0].length==0 || lst[0]=='track' || lst[0]=='browser') continue;
			// print2console(lst,2);
			if(lst.length<4) {
				print2console('Error at line '+(i+1)+': less than 4 fields',2);
				return;
			}
			if(!lst[0] || lst[0].length==0) {
				print2console('Error at line '+(i+1)+': no chromosome name',2);
				return;
			}
			if(!lst[1] || lst[1].length==0) {
				print2console('Error at line '+(i+1)+': no start coordinate',2);
				return;
			}
			if(!lst[2] || lst[2].length==0) {
				print2console('Error at line '+(i+1)+': no stop coordinate',2);
				return;
			}
			if(!lst[3] || lst[3].length==0) {
				print2console('Error at line '+(i+1)+': no read count',2);
				return;
			}
			var t=bbj.genome.parseCoordinate([lst[0],parseInt(lst[1]),parseInt(lst[2])],1);
		
			if(!t) {
				print2console('Error at line '+(i+1)+': wrong coordinate',2);
				return;
			}
			var c={
				chr:t[0],
				start:t[1],
				stop:t[3],
				count:parseInt(lst[3]),
				isgene:false
			};
			if(lst[4]) {
				c.strand=lst[4];
			}
			if(lst[5]) {
				c.barcode=lst[5];
			}
			data.push(c);
		}
	
		if(data.length==0) {
			print2console('Nothing loaded from file '+eui.file.name,2);
		} else {
			print2console('Read '+data.length+' lines',1);
			var lst=[];
            // var id=1;
			for(var i=0; i<data.length; i++) {
				var e=data[i];
				lst.push(e.chr+'\t'+e.start+'\t'+e.stop+'\t'+e.count+'\t'+(e.strand?e.strand:'.')+'\t'+(e.barcode?e.barcode:'.'));
                // id++;
			}
			bbj.fud_post_maketrack(lst.join('\n'), {ft:FT_callingcard_c,label:eui.file.name,mode:M_full});
			fud_loaded_says(eui.file.name,true);
		}
		var fd=eui.parentNode.parentNode;
		fd.parentNode.removeChild(fd);
	};
	reader.readAsText(apps.fud.editui.file);
}

Browser.prototype.fud_post_maketrack=function(textdata,tk) {
	this.cloak();
	print2console('Uploading data to server...',0);
	var bbj=this;
	ajaxPost('txt\n'+textdata,function(key){bbj.fud_maketrack(key,tk);});
}

Browser.prototype.fud_maketrack=function(key,tk) {
	if(!key) {
		print2console('Sorry, please try again',2);
		return;
	}
	print2console('Making track...',0);
	// print2console(key,2);
	// no need to tell cgi the ft, all will be processed in the same way
	var bbj=this;
	let paramsObj = {
		maketrack: "on",
		key: key
	}
	this.ajax(paramsObj,function(data){bbj.fud_maketrack_cb(data,key,tk)});
}

Browser.prototype.fud_maketrack_cb=function(data,key,tk)
{
loading_done();
if(!data) {
	print2console('Server crashed',2);
	return;
}
if(data.abort) {
	print2console('Error: '+data.abort,2);
	return;
}
tk.url=window.location.origin+window.location.pathname+'t/'+key+'.gz';
tk.name=this.genome.newcustomtrackname();
this.genome.pending_custtkhash[tk.name]=tk;
print2console('Displaying track "'+tk.label+'"...',0);
this.ajax_addtracks([tk]);
}





function gsm_fselect_validate(edit)
{
var s_c,s_a,s_b,s_s,s_n,s_v;
s_c=edit.customformatter.chrom.selectedIndex;
s_a=edit.customformatter.start.selectedIndex;
s_b=edit.customformatter.stop.selectedIndex;
s_s=edit.customformatter.strand.selectedIndex;
s_n=edit.customformatter.itemname.selectedIndex;
if(s_a==s_c) { print2console('wrong column index selection',2); return null; }
if(s_b==s_a || s_b==s_c) { print2console('wrong column index selection',2); return null; }
if(s_s==0) {
	s_s=-1;
} else {
	s_s--;
	if(s_s==s_c || s_s==s_a || s_s==s_b) {print2console('wrong column index selection',2);return null;}
}
if(s_n==0) {
	s_n=-1;
} else {
	s_n--;
	if(s_n==s_c || s_n==s_a || s_n==s_b || s_n==s_s) {print2console('wrong column index selection',2);return null;}
}
return {c:s_c,a:s_a,b:s_b,s:s_s,n:s_n,v:-1};
}


function fud_addselect_columnidx(dom, sidx, na_field)
{
var s=dom_create('select',dom);
if(na_field) {
	var o=dom_create('option',s); o.value=-1; o.text='not available'; o.selected=sidx==0;
}
var o=dom_create('option',s); o.value=1; o.text='1st column'; o.selected=sidx==1;
o=dom_create('option',s); o.value=2; o.text='2nd column'; o.selected=sidx==2;
o=dom_create('option',s); o.value=3; o.text='3rd column'; o.selected=sidx==3;
o=dom_create('option',s); o.value=4; o.text='4th column'; o.selected=sidx==4;
o=dom_create('option',s); o.value=5; o.text='5th column'; o.selected=sidx==5;
o=dom_create('option',s); o.value=6; o.text='6th column'; o.selected=sidx==6;
o=dom_create('option',s); o.value=7; o.text='7th column'; o.selected=sidx==7;
o=dom_create('option',s); o.value=8; o.text='8th column'; o.selected=sidx==8;
o=dom_create('option',s); o.value=9; o.text='9th column'; o.selected=sidx==9;
o=dom_create('option',s); o.value=10; o.text='10th column'; o.selected=sidx==10;
return s;
}




