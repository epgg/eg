function menu_track_mcm(event)
{
var tkarr=gflag.browser.getHmtkIdxlst_mcmCell(parseInt((event.clientX-absolutePosition(event.target)[0])/tkAttrColumnWidth), event.target.tkname, event.target.cotton);
if(tkarr==null) {
	menu_hide();
	return;
}
menu_shutup();
gflag.menu.tklst=[];
var lst=[];
for(var i=0; i<tkarr.length; i++) {
	gflag.menu.tklst.push(gflag.browser.tklst[tkarr[i]]);
	lst.push(gflag.browser.tklst[tkarr[i]]);
}
gflag.browser.highlighttrack(lst);
menu.c5.style.display=
menu.c4.style.display='block';
// count numerical tracks
var qtknum=0,mtnum=0
for(i=0; i<lst.length; i++) {
	if(isNumerical(lst[i]) && isCustom(lst[i].ft)) {
		qtknum++;
	}
	if(lst[i].ft==FT_matplot) {
		mtnum++;
	}
}
if(qtknum>1) {
	if(menu.c30) {
		menu.c30.style.display='block';
	}
	menu.c64.style.display='block';
}
if(mtnum) {
	menu.c65.style.display='block';
}
menu_show(2, event.clientX, event.clientY);
return false;
}

function trackheader_Mover(event)
{
/* mouse over a track header canvas, show pica
show color bar for:
- numerical track in heatmap style
- lr with score
TODO bed with score
*/
if(gflag.headerMove.inuse) return;

var bbj=gflag.browser;
var tk=bbj.findTrack(event.target.tkname,event.target.cotton);
if(!tk) return;
if(!tk.menuselected) {
	tk.header.style.backgroundColor=colorCentral.tkentryfill;
}
var s='';
if(tk.ft==FT_cat_n||tk.ft==FT_cat_c) {
	// dunno
} else if(tk.ft==FT_matplot) {
	// dunno
} else if(tk.ft==FT_cm_c) {
	// dd
} else if(isNumerical(tk)) {
	var min=bbj.track_normalize(tk,tk.minv); // may be normalized
	var max=bbj.track_normalize(tk,tk.maxv);
	if(tk.group!=undefined) {
		var t=bbj.tkgroup[tk.group];
		/* FIXME when track is normalized by a factor and is grouped
		there could be discrepancy in 'group' and 'this tk' range value
		*/
		//s='<table style="color:white"><tr><td align=right>group</td><td>min: '+neatstr(t.min_show)+'</td><td>max: '+neatstr(t.max_show)+'</td></tr>'+ '<tr><td align=right>this track</td><td>min: '+neatstr(min)+'</td><td>max: '+neatstr(max)+'</td></tr></table>';
		s='';
	} else {
		if(tk.qtc.height >= 20) {
			// wiggle
			//s='<br>min: '+neatstr(min)+' max: '+neatstr(max);
			s='';
		} else {
			// heatmap, show color scale bar, separate bar for positive/negative
			var q=tk.qtc;
			s='<br>'+htmltext_colorscale(
				tk.minv,tk.maxv,
				bbj.hmdiv.style.backgroundColor,
				q.nr,q.ng,q.nb,q.pr,q.pg,q.pb,q.nth,q.pth);
		}
	}
} else {
	var tt=0;
	for(var i=0; i<tk.data.length; i++)
		tt+=tk.data[i].length;
	if(tt==0) {
		s='<br>No data';
	} else if(tk.ft==FT_sam_c || tk.ft==FT_sam_n||tk.ft==FT_bam_n||tk.ft==FT_bam_c) {
		s='<br>'+tt+' reads loaded';
	} else if(tk.ft==FT_lr_n || tk.ft==FT_lr_c) {
		var t2=0;
		for(i=0; i<tk.data_chiapet.length; i++) t2+=tk.data_chiapet[i].length;
		s='<br>'+tt+' items loaded<br>'+
		(tk.skipped>0?tk.skipped+' out-of-range items skipped<br>':'')+
		'<table style="color:inherit"><tr><td align=right>positive score:</td>'+
		'<td align=right>0</td>'+
		'<td style="width:50px;background:-webkit-gradient(linear,left top,right top,from('+colorCentral.pagebg+'),to(rgb('+tk.qtc.pr+','+tk.qtc.pg+','+tk.qtc.pb+')));'+
		'background:-moz-linear-gradient(left,'+colorCentral.pagebg+',rgb('+tk.qtc.pr+','+tk.qtc.pg+','+tk.qtc.pb+'));"> </td>'+
		'<td>'+tk.qtc.pcolorscore+'</td></tr>'+
		'<tr><td align=right>negative score:</td><td align=right>0</td>'+
		'<td style="width:50px;background:-webkit-gradient(linear,left top,right top,from('+colorCentral.pagebg+'),to(rgb('+tk.qtc.nr+','+tk.qtc.ng+','+tk.qtc.nb+')));'+
		'background:-moz-linear-gradient(left,'+colorCentral.pagebg+',rgb('+tk.qtc.nr+','+tk.qtc.ng+','+tk.qtc.nb+'));"> </td>'+
		'<td>'+tk.qtc.ncolorscore+'</td></tr></table>';
	} else {
		s='<br>'+tt+' items loaded';
		if((tk.mode==M_full || tk.mode==M_thin) && tk.showscoreidx!=undefined && tk.showscoreidx>=0) {
			// when the scale won't be shown
			s+='<br>max: '+tk.maxv+'<br>min: '+tk.minv;
		}
	}
}
picasays.innerHTML=tk.label+s;
var pos=absolutePosition(event.target);
pica_go(pos[0]+event.target.clientWidth-document.body.scrollLeft-10,pos[1]-document.body.scrollTop-10);
}

function trackheader_Mout(event)
{
var t=gflag.browser.findTrack(event.target.tkname,event.target.cotton);
if(!t.menuselected) {
	t.header.style.backgroundColor='transparent';
}
pica_hide();
}
function trackheader_MD(event)
{
/* press mouse on .header to move this single track
a track can be moved into and out of ghm
*/
if(event.button!=0) return;
var bbj=gflag.browser;
if(event.shiftKey) {
	// suppose this can only be trunk, splinter tk has no header
	bbj.track_click_multiselect(event.target.tkname,event.target.cotton);
	return;
}
event.preventDefault();
/* total show count: not all guys in .tklst is visible
also need to put shown tk in the front of the list
*/
var show=[],hidden=[];
for(var i=0; i<bbj.tklst.length; i++) {
	var t=bbj.tklst[i];
	if(tkishidden(t)) {
		hidden.push(t);
	} else {
		show.push(t);
	}
}
if(show.length==0) return;
bbj.tklst=show.concat(hidden);
for(var i=0; i<bbj.tklst.length; i++) {
	var t=bbj.tklst[i];
	if(t.name==event.target.tkname) {
		if(event.target.cotton) {
			if(t.cotton==event.target.cotton) break;
		} else {
			if(!t.cotton) break;
		}
	}
}
var y=absolutePosition(bbj.hmdiv)[1];
gflag.headerMove={
	bbj:bbj,
	inuse:true,
	y1:y,
	y2:y+bbj.hmdiv.clientHeight+bbj.ideogram.canvas.height,
	oldy:event.clientY+document.body.scrollTop,
	tkidx:i,
	totalshowcount:show.length,
}
document.body.addEventListener('mousemove',trackheader_MM,false);
document.body.addEventListener('mouseup',trackheader_MU,false);
bbj.highlighttrack([bbj.tklst[i]]);
pica_hide();
}
function trackheader_MM(event)
{
var cy=event.clientY+document.body.scrollTop;
var m=gflag.headerMove;
var bbj=m.bbj;
if(cy>m.oldy) {
	/* moving down */
	var nexttk=null;
	if(m.tkidx<m.totalshowcount-1) {
		var i=m.tkidx+1;
		while(tkishidden(bbj.tklst[i])) {i++;}
		if(i>=bbj.tklst.length) {
			print2console('wrong tklst index',2);
			return;
		}
		nexttk=bbj.tklst[i];
	}
	if(bbj.tklst[m.tkidx].where==1) {
		// tk is in ghm, see about next track and 
		if(m.tkidx<m.totalshowcount-1 && nexttk.where==1) {
			// inside ghm, safe
			if(cy-m.oldy>=tk_height(nexttk)) {
				bbj.movetk_hmtk([m.tkidx],false);
				m.tkidx++;
				bbj.highlighttrack([bbj.tklst[m.tkidx]]);
				m.oldy=cy;
				return;
			}
		} else {
			// crossing threshold
			if(cy-m.oldy>=bbj.ideogram.canvas.height) {
				// moving this track out of ghm to decor
				var tk=bbj.tklst[m.tkidx];
				tk.where=2;
				// try increase the height of this track if it is a very thin qual track
				if(isHmtk(tk.ft) && tk.ft!=FT_cat_n && tk.ft!=FT_cat_c && tk.qtc.height<20) {
					tk.qtc.height=30;
					bbj.drawTrack_browser(tk);
					bbj.drawMcm_onetrack(tk);
				}
				bbj.trackdom2holder();
				bbj.highlighttrack([bbj.tklst[m.tkidx]]);
				m.oldy=cy;
				// must update m.y2
				m.y2=m.y1+bbj.hmdiv.clientHeight+bbj.ideogram.canvas.height;
				bbj.splinterSynctkorder();
				bbj.mcmPlaceheader();
				return;
			}
		}
		indicator3.style.top=m.y1+bbj.tklst[m.tkidx].canvas.offsetTop+cy-m.oldy;
	} else {
		// tk is outside ghm, safe
		if(m.tkidx<m.totalshowcount-1) {
			if(cy-m.oldy>=tk_height(nexttk)) {
				var s=bbj.tklst.splice(m.tkidx,1)[0];
				m.tkidx++;
				bbj.tklst.splice(m.tkidx,0,s);
				bbj.trackdom2holder();
				bbj.highlighttrack([bbj.tklst[m.tkidx]]);
				m.oldy=cy;
				bbj.splinterSynctkorder();
				return;
			}
		}
		indicator3.style.top=m.y2+bbj.tklst[m.tkidx].canvas.offsetTop+cy-m.oldy;
	}
	if(m.tkidx==m.totalshowcount-1) return;
} else if(cy<m.oldy) {
	/* moving up */
	var nexttk=null;
	if(m.tkidx>0) {
		var i=m.tkidx-1;
		while(tkishidden(bbj.tklst[i])){i--;}
		if(i<0) {
			print2console('tklst index error',2);
			return;
		}
		nexttk=bbj.tklst[i];
	}
	if(bbj.tklst[m.tkidx].where==2) {
		// tk is outside ghm, see about previous track
		if(m.tkidx>0 && nexttk.where==2) {
			// still outside ghm
			if(m.oldy-cy>=tk_height(nexttk)) {
				var s=bbj.tklst.splice(m.tkidx,1)[0];
				m.tkidx--;
				bbj.tklst.splice(m.tkidx,0,s);
				bbj.trackdom2holder();
				bbj.highlighttrack([bbj.tklst[m.tkidx]]);
				m.oldy=cy;
				bbj.splinterSynctkorder();
				return;
			}
		} else {
			// crossing threshold
			if(m.oldy-cy>=bbj.ideogram.canvas.height) {
				// moving this track into ghm
				var tk=bbj.tklst[m.tkidx];
				tk.where=1;
				bbj.trackdom2holder();
				bbj.highlighttrack([bbj.tklst[m.tkidx]]);
				m.oldy=cy;
				// must update m.y2
				m.y2=m.y1+bbj.hmdiv.clientHeight+bbj.ideogram.canvas.height;
				bbj.splinterSynctkorder();
				bbj.mcmPlaceheader();
				return;
			}
		}
		indicator3.style.top=m.y2+bbj.tklst[m.tkidx].canvas.offsetTop+cy-m.oldy;
	} else {
		// tk is inside ghm, safe
		if(m.tkidx>0) {
			if(m.oldy-cy>=tk_height(nexttk)) {
				bbj.movetk_hmtk([m.tkidx],true);
				m.tkidx--;
				bbj.highlighttrack([bbj.tklst[m.tkidx]]);
				m.oldy=cy;
				return;
			}
		}
		indicator3.style.top=m.y1+bbj.tklst[m.tkidx].canvas.offsetTop+cy-m.oldy;
	}
} else {
	return;
}
}
function trackheader_MU(event)
{
indicator3.style.display='none';
document.body.removeEventListener('mousemove',trackheader_MM,false);
document.body.removeEventListener('mouseup',trackheader_MU,false);
gflag.headerMove.inuse=false;
simulateEvent(gflag.headerMove.bbj.tklst[gflag.headerMove.tkidx].header,'mouseover');
}






Browser.prototype.__mcm_termchange=function() {return;}

function __request_tk_registryobj() {return;}


Browser.prototype.__tkfind_applicationspecific=function(lst)
{
var lst2=[];
for(var i=0; i<lst.length; i++) {
	if(lst[i] in this.genome.hmtk) {
		lst2.push(lst[i]);
	}
}
return lst2;
}
