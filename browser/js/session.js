Browser.prototype.show_sessionid=function()
{
apps.session.show_id.innerHTML=this.sessionId;
}
function makepanel_session(param)
{
var d=make_controlpanel(param);
apps.session={
	main:d,
	busy:false};
var hd=d.__contentdiv;
var _t=dom_create('table',hd);
_t.cellSpacing=10;
// 1_st row
var tr=_t.insertRow(0);
var td=tr.insertCell(0);

td.colSpan=4;

tr=_t.insertRow(-1);
td=tr.insertCell(0);
td.align='center';
td.vAlign='middle';
dom_create('div',td,'color:white').innerHTML='Current session ID';
apps.session.show_id=dom_create('div',td,'font-weight:bold;color:white;margin-top:10px;padding:3px 7px;background-color:#858585;');
td=tr.insertCell(-1); // 1-2
var d2=dom_create('div',td);
d2.className='largebutt';
d2.style.display='block';
d2.addEventListener('click',session_save,false);
d2.innerHTML=d2.oldtext='<span style="color:#ff6633;text-decoration:underline;">&#9660;</span> Save';
d2.style.marginBottom=20;
apps.session.save_butt=d2;
td=tr.insertCell(-1); // 1-3
d2=dom_create('div',td);
d2.className='largebutt';
d2.style.display='block';
d2.addEventListener('click',session_retrieve,false);
d2.innerHTML=d2.oldtext='<span style="color:#33ccff;text-decoration:underline;">&#9650;</span> Retrieve';
d2.style.marginBottom=20;
apps.session.retrieve_butt=d2;
td=tr.insertCell(-1); // 1-4
if(window.File && window.FileReader && window.FileList && window.Blob) {
	var butt=dom_create('input',td,'display:none');
	butt.type='file';
	butt.addEventListener('change',jsonhub_choosefile,false);
	d2=dom_create('div',td);
	d2.className='largebutt';
	d2.addEventListener('click',session_upload,false);
	d2.innerHTML='&#11014; Upload';
} else {
	td.innerHTML='Your web browser is too out-dated to support session file upload!!!<br>Get a morden web browser such as <a href=www.google.com/chrome target=_blank>Google Chrome</a>.';
}
tr=_t.insertRow(-1);
tr.insertCell(0); // 2-1
td=tr.insertCell(-1); // 2-2
td.align='center';
apps.session.ta1=dom_inputtext(td,{size:12,ph:'make a note',call:session_save_ku});
td=tr.insertCell(-1); // 2-3
td.align='center';
apps.session.ta2=dom_inputtext(td,{size:12,ph:'enter session ID',call:session_retrieve_ku});
td=tr.insertCell(-1); // 2-4
/*
td.align='center';
td.innerHTML='<a href=http://washugb.blogspot.com/2012/12/url-parameter-specification-effective.html target=_blank style="color:white">About URL parameters</a>';
*/
// 2nd row
d=dom_create('div',hd);
apps.session.url_holder=d;
d.className='container';
d.style.display='none';
d.style.margin=d.style.padding=10;
d.style.width=700;
d.style.wordWrap='break-word';
// 3rd row
apps.session.holder=dom_create('div',hd,'margin:10px;padding:10px 20px;background-color:'+colorCentral.background_faint_3);
}


function session_upload(event)
{
gflag.fileupload_bbj=apps.session.bbj;
simulateEvent(event.target.previousSibling,'click');
}


function toggle12()
{
if(apps.session.main.style.display=='none') {
	cloakPage();
	panelFadein(apps.session.main, 100+document.body.scrollLeft, 100+document.body.scrollTop);
	menu_hide();
	var b=gflag.browser;
	apps.session.bbj=b.trunk?b.trunk:b;
} else {
	pagecloak.style.display='none';
	panelFadeout(apps.session.main);
}
}


Browser.prototype.validatesession=function(session,statusId,callback)
{
var bbj=this;
let paramsObj = {
	validatesession: "on",
	oldsession: session,
	dbName: this.genome.name,
}
if (statusId != undefined) {
	paramsObj.oldstatus = statusId;
}
this.ajax(paramsObj,function(data){bbj.validatesession_cb(data,callback);});
}
Browser.prototype.validatesession_cb=function(data,callback)
{
if(!data) {
	print2console('Server error! Please refresh page',2);
	return;
}
if(data.error) {
	oneshotDialog(1,'Session or status not found');
	return;
}
callback(data);
}
Browser.prototype.initbrowser_session=function(data)
{
if(!data.session) {
	fatalError('No valid session');
}
this.sessionId=data.session;
if(data.statusLst) {
	var holder=dom_create('table',apps.oneshot.belly);
	for(var i=0; i<data.statusLst.length; i++) {
		var t=data.statusLst[i];
		var tr=holder.insertRow(-1);
		var td=tr.insertCell(0);
		var s=dom_addtext(td,t.note,null,'header_g');
		s.addEventListener('click',session_restore_status,false);
		s.session=t.session;
		s.status=t.status;
		s.bbj=this;
		tr.insertCell(1).innerHTML=t.tkcount+' tracks';
	}
	oneshotDialog(2, null);
} else if(data.status!=undefined){
	this.statusId=data.status;
	this.restoreSession();
} else {
	fatalError('session: dont know what to do');
}
}

Browser.prototype.saveSession=function()
{
var jlst=[]; // list of json objects to be saved

var tkcount=0;
/* displayed tracks
*/
var natives=[]; // native tk go as a pack
var jux=this.is_gsv()?false:((this.juxtaposition.type==RM_jux_c||this.juxtaposition.type==RM_jux_n)?true:false);
for(var i=0; i<this.tklst.length; i++) {
	var t=this.tklst[i];
	if(t.mastertk) continue;
	if(this.targetBypassQuerytk(t)) continue;
	var _o=this.genome.replicatetk(t);
	if(t.ft==FT_weaver_c) {
		var clst=[], nlst=[];
		var bbj=this.weaver.q[t.cotton];
		for(var j=0; j<bbj.tklst.length; j++) {
			var t2=bbj.tklst[j];
			if(isCustom(t2.ft)) {
			    var t4=this.genome.replicatetk(t2);
                            clst.push(t4);
                        }
			else { 
			    var t3=this.genome.replicatetk(t2);
                            nlst.push(t3);
                        }
	                tkcount++;
		}
		if(clst.length+nlst.length>0) {
			_o.tracks=clst;
			if(nlst.length>0) {
				_o.tracks.push({type:'native_track',list:nlst});
			}
		}
	}
	if(isCustom(t.ft)) {
		if(jux && t.url==this.juxtaposition.what) {
			_o.juxtapose=true;
		}
		jlst.push(_o);
		// other attributes only carried by registry object
		var _or=this.genome.hmtk[t.name];
		if(_or) {
			if(_or.details) {
				_o.details=_or.details;
			}
			if(_or.geolst) {
				_o.geolst=_or.geolst;
			}
		}
	} else {
		if(jux && t.name==this.juxtaposition.what) {
			_o.juxtapose=true;
		}
		natives.push(_o);
	}
	tkcount++;
}
if(natives.length>0) {
	jlst.push({type:'native_track',list:natives});
}
/* unseen custom tracks
*/
for(var n in this.genome.hmtk) {
	var t=this.genome.hmtk[n];
	if(!isCustom(t.ft) || t.mastertk || t.public) continue;
	if(this.findTrack(n)) continue;
	var o=this.genome.replicatetk(t);
	o.mode='hide';
	jlst.push(o);
	tkcount++;
}

// metadata
if(gflag.mdlst.length>0) {
	var key2md={};
	for(var i=0; i<gflag.mdlst.length; i++) {
		var v=gflag.mdlst[i];
		if(v.tag==literal_imd) continue;
		var k='md'+i;
		if(v.sourceurl) {
			// shared md
			key2md[k]=v.sourceurl;
		} else if(v.source) {
			// private md
			key2md[k]=v.original;
		}
		// do not save others
	}
	var obj={type:'metadata',vocabulary_set:key2md};
	if(this.mcm) {
		var show={};
		var has=false;
		for(var i=0; i<this.mcm.lst.length; i++) {
			var a=this.mcm.lst[i];
			if(gflag.mdlst[a[1]].tag==literal_imd) continue;
			has=true;
			var k='md'+a[1];
			if(k in show) {
				show[k].push(a[0]);
			} else {
				show[k]=[a[0]];
			}
		}
		if(has) obj.show_terms=show;
	}
	jlst.push(obj);
}


// splinters
var spt=[];
for(var tag in this.splinters) {
	var _b=this.splinters[tag];
	spt.push(_b.regionLst[0][0]+':'+_b.dspBoundary.vstartc+'-'+_b.dspBoundary.vstopc);
}
if(spt.length>0) {
	jlst.push({type:'splinters',list:spt});
}


if(this.is_gsv()) {
	this.gsv_savelst();
	jlst.push({
		type:'run_genesetview',
		list:this.genesetview.savelst,
		viewrange:this.getDspStat(),
	});
} else {
	jlst.push({type:'coordinate_override',coord:this.getDspStat().join(',')});
}

if(this.genome.geneset && this.genome.geneset.lst.length>0) {
	var lst=[];
	for(var i=0; i<this.genome.geneset.lst.length; i++) {
		var t=this.genome.geneset.lst[i];
		if (t != undefined) {
			lst.push({name:t.name,lst:t.lst,gss_down:t.gss_down,gss_opt:t.gss_opt,gss_origin:t.gss_origin,gss_up:t.gss_up});
		}
	}
	jlst.push({type:'geneset_ripe',list:lst});
}

// coordnote
if(this.notes.length>0) {
	var s=[];
	for(var i=0; i<this.notes.length; i++) {
		var n=this.notes[i];
		s.push({chrom:n.chrom,coord:n.coord,text:n.text});
	}
	jlst.push({type:'coordinate_notes',list:s});
}


// customized color
var lst=[];
for(var i=0; i<colorCentral.longlst.length; i++) {
	var c=colorCentral.longlst[i];
	var c2=colorCentral.longlst_bk[i];
	if(c!=c2) {
		lst.push([i,c]);
	}
}
if(lst.length>0) {
	jlst.push({type:'customized_color',list:lst});
}

// group yscale
if(this.tkgroup.length>0) {
	var hash={};
	var has=false;
	for(var i=0; i<this.tkgroup.length; i++) {
		var g=this.tkgroup[i];
		if(g && g.scale==scale_fix) {
			hash[i]=g;
			has=true;
		}
	}
	if(has) {
		jlst.push({type:'group_yscale_fixed',groups:hash});
	}
}

print2console('Saving session...', 0);
if(apps.session) {
	apps.session.busy=true;
	apps.session.save_butt.innerHTML='Saving...';
}
var bbj=this;
ajaxPost('json\n'+JSON.stringify(jlst),function(key){bbj.saveSession_posted(key,tkcount);});
}

Browser.prototype.saveSession_posted=function(key,tkcount)
{
if(apps.session) {
	apps.session.busy=false;
	apps.session.save_butt.innerHTML=apps.session.save_butt.oldtext;
}
if(!key) {
	print2console('Sorry please try again',2);
	return;
}
var note='';
if(apps.session) {
	note=apps.session.ta1.value;
	apps.session.ta1.value='';
	note=note.replace('"','');
}
var bbj=this;
let paramsObj = {
	saveSession: "on",
	key: key,
	tkcount: tkcount,
	dbName: this.genome.name,
}
if (note.length > 0) {
	paramsObj.note = note;
}
this.ajax(paramsObj,function(data){bbj.cgiSavesession(data);});
}

Browser.prototype.cgiSavesession=function(data)
{
/* cgi will allocate a new statusid for the saved entry
bbj will update with this statusid
*/
if(!data) {
	print2console('Error saving session, please try again',2);
	return;
}
if(data.abort) {
	print2console('Error: '+data.abort,2);
	return;
}
this.statusId = data.ticket.status;
done();
// done saving session
if(this.onsavedsession) {
	this.onsavedsession(this.sessionId,this.statusId);
}
this.showSession([data.ticket]);
}

Browser.prototype.retrieveSession=function(querysession)
{
/* current session ID will be replaced by the previous session
so need to update runtime tables...
handles urlparam and normal case
*/
apps.session.busy=true;
apps.session.retrieve_butt.innerHTML='Retrieving...';
var bbj=this;
let paramsObj = {
	pastSession: querysession,
	dbName: this.genome.name
}
this.ajax(paramsObj, function(data) {bbj.retrieveSession_cb(data);});
}
Browser.prototype.retrieveSession_cb=function(data)
{
apps.session.busy=false;
apps.session.retrieve_butt.innerHTML=apps.session.retrieve_butt.oldtext;
if(!data) {
	return;
}
apps.session.ta2.value='';
if(data.error || !data.statusLst || data.statusLst.length==0) {
	print2console('Session not found',2);
	return;
}
this.showSession(data.statusLst);
done();
}


Browser.prototype.restoreSession=function()
{
/* browser.sessionId must be updated
*/
this.cleanuphtmlholder();
this.shieldOn();
print2console('Restoring session...', 0);
var bbj=this;
let paramsObj = {
	restoreSession: "on",
	session: this.sessionId,
	statusId: this.statusId,
	dbName: this.genome.name,
}
this.ajaxText(paramsObj, function(text) {bbj.restoreSession_cb(text);});
}
Browser.prototype.restoreSession_cb=function(text)
{
floatingtoolbox.style.display='block';
if(!text) {
	this.shieldOff();
} else {
	pagecloak.style.display='none';
	if(apps.session) {
		apps.session.main.style.display='none';
	}
	if(apps.oneshot) {
		apps.oneshot.main.style.display='none';
	}
	var j=parse_jsontext(text);
	if(!j) {
		print2console('Invalid JSON content in session '+this.sessionId+' ('+this.statusId+')',2);
		this.shieldOff();
	} else {
		this.loaddatahub_json(j);
		this.show_sessionid();
		this.retrieveSession(this.sessionId);
		return;
	}
}
this.ajax_loadbbjdata(this.init_bbj_param);
}

Browser.prototype.showSession=function(slst)
{
/* a list of status, all for the same session
add a row, expandable for additional info
*/
if(!apps.session) return;
var ss=slst[0].session;
var holder=apps.session.holder;
var sessiontable=null;
for(var i=0; i<holder.childNodes.length; i++) {
	var t=holder.childNodes[i];
	if(t.session==ss) {
		sessiontable=t;
		break;
	}
}
if(!sessiontable) {
	var d=dom_create('div',holder,'margin:20px 0px;');
	d.session=ss;
	dom_create('div',d,'margin-left:20px;padding:2px 7px;background-color:#858585;display:inline-block;color:white;font-weight:bold;').innerHTML=ss;
	dom_create('div',d,'display:inline-block;margin-left:10px;').innerHTML='<a href='+window.location.origin+window.location.pathname+'?genome='+this.genome.name+'&session='+ss+' target=_blank>Link</a>';
	d.content=dom_create('table',d,'background-color:rgba(255,255,255,.7)');
	d.content.cellPadding=5;
	sessiontable=d;
}
for(var i=0; i<slst.length; i++) {
	var found=false;
	var d=sessiontable.content.firstChild;
	if(d) {
		for(var j=0; j<d.childNodes.length; j++) {
			var t=d.childNodes[j];
			if(t.status==slst[i].status) {
				found=true;
				break;
			}
		}
	}
	if(found) continue;
	var tr=sessiontable.content.insertRow(-1);
	tr.session=ss;
	var st=slst[i].status;
	tr.status=st;
	var td = tr.insertCell(0);
	td.align = 'right';
	var s=dom_addtext(td,slst[i].note,null,'header_g');
	s.addEventListener('click',session_restore_status,false);
	s.bbj=this;
	s.session=ss;
	s.status=st;
	td=tr.insertCell(-1);
	td.innerHTML = slst[i].tkcount==0 ? 'no track' : slst[i].tkcount+' track'+(slst[i].tkcount==1?'':'s');
	td=tr.insertCell(-1);
	dom_addrowbutt(td,[{text:'Link',pad:true,call:session_link_status,attr:{session:ss,status:st}},
		{text:'Download',pad:true,call:session_download_status,attr:{session:ss,status:st}},
		//{text:'Delete',pad:true,call:session_delete_status,attr:{session:ss,status:st}}
		]);
}
}

function session_save_ku(event) {if(event.keyCode==13) session_save();}
function session_save()
{
if(apps.session.busy) return;
apps.session.bbj.saveSession();
}
function session_retrieve_ku(event) {if(event.keyCode==13) session_retrieve();}

function session_retrieve()
{
if(apps.session.busy) return;
var v=apps.session.ta2.value;
if(v.length==0) {
	print2console("Please enter session ID", 2);
	return;
}
apps.session.bbj.retrieveSession(v);
}

function session_restore_status(event)
{
var d=event.target;
var bbj=d.bbj;
bbj.sessionId=d.session;
bbj.statusId=d.status;
bbj.restoreSession();
}
function session_link_status(event)
{
var d=event.target;
menu_shutup();
menu.c32.style.display='block';
var u=window.location.origin+window.location.pathname+'?genome='+apps.session.bbj.genome.name+'&session='+d.session+'&statusId='+d.status;
menu.c32.innerHTML='<div style="padding:15px">Bookmark or share this link:<br><br><a href='+u+' target=_blank>'+u+'</a></div>';
menu_show_beneathdom(0,d);
}

function session_delete_status(event)
{
var d=event.target;
var s=d.session;
var id=d.status;
for(var i=0; i<apps.session.holder.childNodes.length; i++) {
	var t=apps.session.holder.childNodes[i];
	if(t.session==s) {
		var tb=t.content;
		for(var j=0; j<tb.firstChild.childNodes.length; j++) {
			var t2=tb.firstChild.childNodes[j];
			if(t2.status==id) {
				tb.firstChild.removeChild(t2);
				break;
			}
		}
		if(tb.firstChild.childNodes.length==0) {
			apps.session.holder.removeChild(t);
		}
		break;
	}
}
var bbj=apps.session.bbj;
let paramsObj = {
	deleteSession: "on",
	thissession: s,
	thisstatus: id,
	dbName: bbj.genome.name,
}
bbj.ajax(paramsObj, function(data){});
}
function session_download_status(event)
{
var d=event.target;
var s=d.session;
var id=d.status;
var bbj=apps.session.bbj;
bbj.validatesession(s,id,function(data){bbj.session_download_status_cb(data,s,id);});
}
Browser.prototype.session_download_status_cb=function(data,s,id)
{
if(!data) {
	print2console('Server error',2);
	return;
}
if(data.error) {
	print2console('Session not found',2);
	return;
}
window.location='/cgi-bin/subtleKnife?downloadSession=on&thissession='+s+'&thisstatus='+id+'&dbName='+this.genome.name;
}
