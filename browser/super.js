function toggle5(event)
{
if(apps.super.main.style.display=="none") {
	cloakPage();
	panelFadein(apps.super.main, 100+document.body.scrollLeft, 50+document.body.scrollTop);
	apps.super.bbj=gflag.browser;
	apps.super.says.innerHTML='';
	apps.super.retrieve_says.style.display='none';
} else {
	pagecloak.style.display="none";
	panelFadeout(apps.super.main);
}
menu_hide();
}

function makepanel_super(param)
{
var d=make_controlpanel(param);
d.__hbutt2.style.display='none';
apps.super={main:d,
tk1:{label:'enhancers'},
tk2:{label:'signal'},
axis_height:20,
dot_opacity:0.7,
dot_shape:4,
dot_size:10,
dotcolor_r:200,
dotcolor_g:0,
dotcolor_b:0,
height:500,
width:500,
callback_click:super_scpdot_click,
callback_mover:super_scpdot_tooltip,
scp_canvas_bg:true,
};
apps.super.ui_form=dom_create('div',d.__contentdiv,'position:absolute');
var d2=make_headertable(apps.super.ui_form);
d2.style.marginBottom=50;
d2._h.innerHTML='Submit new job';
d2=d2._c;
d2.style.padding='20px 30px';
dom_create('div',d2,'margin-bottom:20px;border:solid 1px rgba(0,0,0,0.2);background-color:rgba(0,0,0,0.1);padding:10px 20px;').innerHTML='The <a href=https://bitbucket.org/young_computation/rose target=_blank>ROSE</a> program is used to call super enhancers.<br>See <a href=http://www.cell.com/abstract/S0092-8674(13)00393-0 target=_blank>Loven, J. et. al. Cell 153, 320-334</a> and<br><a href=http://www.cell.com/abstract/S0092-8674(13)00392-9 target=_blank>Warren A. et. al. Cell 153, 307-319</a> for details.';
dom_addbutt(d2,'Choose a list of binding sites',super_showgeneset).style.marginRight=20;
apps.super.gsholder=dom_addtext(d2,'<span style="color:858585;">No list chosen</span>');
dom_create('br',d2);
dom_addtext(d2,'from one of your gene sets','#858585');
dom_create('div',d2,'height:20px;');

dom_addbutt(d2,'Choose a BAM track to rank enhancers',super_rank_invoketkselect).style.marginRight=20;
apps.super.ranktkholder=dom_addtext(d2,'<span style="color:858585;">No track chosen</span>');
dom_create('div',d2,'height:20px;');

dom_addbutt(d2,'Choose a second BAM track as control',super_ctrl_invoketkselect).style.marginRight=20;
apps.super.ctrltkholder=dom_addtext(d2,'<span style="color:858585;">No track chosen</span>');
dom_create('br',d2);
dom_addtext(d2,'the control BAM track is optional','#858585');
dom_create('div',d2,'height:20px;');

dom_addtext(d2,'Max linking distance for stitching ');
apps.super.linkingdist=dom_inputtext(d2,{size:5,text:'5000'});
dom_create('br',d2);
dom_addtext(d2,' default is 5000 bp','#858585');
dom_create('div',d2,'height:20px;');

dom_addtext(d2,'Distance from TSS to exclude ');
apps.super.tssdist=dom_inputtext(d2,{size:5,text:'0'});
dom_create('br',d2);
dom_addtext(d2,' 0 for no TSS exclusion','#858585');
dom_create('div',d2,'height:20px;');

apps.super.email=dom_inputtext(d2,{size:20,text:'enter your e-mail address'});
dom_create('div',d2,'height:20px;');

apps.super.submit_butt=dom_addbutt(d2,'Submit new job',super_submit);
dom_create('br',d2);
apps.super.says=dom_addtext(d2,'');

d2=make_headertable(apps.super.ui_form);
d2._h.innerHTML='Retrieve result';
d2=d2._c;
d2.style.padding='20px 30px';
apps.super.retrieve_input=dom_inputtext(d2,{size:20,text:'enter job key'});
apps.super.retrieve_butt=dom_addbutt(d2,'Retrieve',super_retrieve);
apps.super.retrieve_says=dom_create('div',d2,'margin-top:20px;padding:10px;border:solid 1px rgba(0,0,0,0.1);');

apps.super.ui_result=dom_create('div',d.__contentdiv,'display:none;position:absolute;');
d2=dom_create('div',apps.super.ui_result,'background-color:rgba(255,255,255,.8);');
apps.super.result_says=dom_create('div',d2,'padding:20px;');
apps.super.figure_div=dom_create('div',d2);;
}

function super_showgeneset(event)
{
menu_showgeneset(apps.super.bbj,event.target,super_choosegeneset);
}

function super_choosegeneset(event)
{
super_gs_chosen(event.target.idx);
menu_hide();
}

function super_gs_chosen(idx)
{
var e=apps.super.bbj.genome.geneset.lst[idx];
// make independent copy
apps.super.gsholder.innerHTML=e.name+' ('+e.lst.length+' items)';
apps.super.gs=[];
for(var i=0; i<e.lst.length; i++) {
	var t=e.lst[i];
	apps.super.gs.push({a1:t.a1,b1:t.b1,c:t.c,s:t.strand});
}
}


function menu_gs2super()
{
panelFadeout(apps.gsm.main);
toggle5();
apps.super.bbj=apps.gsm.bbj;
super_gs_chosen(menu.genesetIdx);
menu_hide();
}

function super_rank_invoketkselect(event)
{
menu_shutup();
menu_show_beneathdom(0,event.target);
apps.super.bbj.showcurrenttrack4select(tkentryclick_super_rank,[]);
}
function tkentryclick_super_rank(event)
{
var tk=apps.super.bbj.findTrack(event.target.tkname);
if(!tk) {
	print2console('But no tkobj was found for '+event.target.tkname,2);
	return;
}
if(tk.ft!=FT_bam_n && tk.ft!=FT_bam_c) {
	print2console('You can only choose BAM track',2);
	return;
}
apps.super.ranktk=tk;
stripChild(apps.super.ranktkholder,0);
dom_addtkentry(2,apps.super.ranktkholder,false,tk.name,tk.label,generic_tkdetail).style.display='inline';
menu_hide();
}
function super_ctrl_invoketkselect(event)
{
menu_shutup();
menu_show_beneathdom(0,event.target);
apps.super.bbj.showcurrenttrack4select(tkentryclick_super_ctrl,[]);
}

function tkentryclick_super_ctrl(event)
{
var tk=apps.super.bbj.findTrack(event.target.tkname);
if(!tk) {
	print2console('But no tkobj was found for '+event.target.tkname,2);
	return;
}
if(tk.ft!=FT_bam_n && tk.ft!=FT_bam_c) {
	print2console('You can only choose BAM track',2);
	return;
}
apps.super.ctrltk=tk;
stripChild(apps.super.ctrltkholder,0);
dom_addtkentry(2,apps.super.ctrltkholder,false,tk.name,tk.label,generic_tkdetail).style.display='inline';
menu_hide();
}


function super_back2control()
{
super_flippanel(false);
}
function super_flippanel(backward)
{
var d=apps.super;
d.main.__hbutt2.style.display=backward?'block':'none';
flip_panel(d.ui_form,d.ui_result,backward);
if(!backward) {
	apps.super.retrieve_says.style.display='none';
}
}



function super_submit(event)
{
if(!apps.super.gs) {
	print2console('Please submit list of binding sites',2);
	return;
}
if(!apps.super.ranktk) {
	print2console('No BAM track chosen for enhancer ranking',2);
	return;
}
if(apps.super.ranktk.ft!=FT_bam_c) {
	print2console('Wrong bam ft for ranking',2);
	return;
}
if(apps.super.ctrltk) {
	if(apps.super.ctrltk.ft!=FT_bam_c) {
		print2console('Wrong bam ft for control',2);
		return;
	}
}
var linkingdist=parseInt(apps.super.linkingdist.value);
if(isNaN(linkingdist) || linkingdist<=0) {
	print2console('Wrong input for linking distance',2);
	return;
}
var tssdist=parseInt(apps.super.tssdist.value);
if(isNaN(tssdist) || tssdist<0) {
	print2console('Wrong input for TSS exclusion distance',2);
	return;
}
var email=apps.super.email.value;
if(email.length==0 || email==apps.super.email.defaultvalue) {
	print2console('E-mail must be provided',2);
	return;
}
var lst=email.split('@');
if(lst.length!=2 || !lst[0] || !lst[1]) {
	print2console('That doesn\'t look like a valid e-mail address',2);
	return;
}
apps.super.param= 'super=on&submit=on&genome='+apps.super.bbj.genome.name.toUpperCase()+
	'&rankbam='+apps.super.ranktk.url+
	(apps.super.ctrltk?'&ctrlbam='+apps.super.ctrltk.url:'')+
	'&linkingdist='+linkingdist+'&tssdist='+tssdist+
	'&email='+email;
event.target.disabled=true;
// deposit regions
var lst=[];
for(var i=0; i<apps.super.gs.length; i++) {
	var e=apps.super.gs[i];
	lst.push(e.c+'\t'+e.a1+'\t'+e.b1+'\t'+(i+1)+'\t'+e.s);
}
apps.super.says.innerHTML='transferring data to server...';
ajaxPost('2\n'+lst.join('\n')+'\n',function(text) {
	if(!text || text=='ERROR') {
		print2console('server crashed',2);
		apps.super.submit_butt.disabled=false;
		return;
	}
	apps.super.says.innerHTML='submitting job...';
	var jobkey=text;
	// actually submit the job
	apps.super.bbj.ajax(apps.super.param+'&jobkey='+jobkey,function(data){
		apps.super.submit_butt.disabled=false;
		if(!data) {
			print2console('cannot launch job',2);
			return;
		}
		if(data.error) {
			print2console('Error: '+data.error,2);
			return;
		}
		apps.super.says.innerHTML='Your job is running.<br>We will send you an e-mail once it\'s done.';
	});
});
/*end*/
}


function super_retrieve(event)
{
var i=apps.super.retrieve_input;
if(i.value.length==0 || i.value==i.defaultvalue) {
	print2console('Please enter job key',2);
	return;
}
apps.super.retrieve_says.style.display='none';
event.target.disabled=true;
apps.super.bbj.ajax('super=on&validate=on&jobkey='+i.value,function(data) {
	apps.super.retrieve_butt.disabled=false;
	if(!data) {
		print2console('server crashed, please try again',2);
		return;
	}
	var d=apps.super.retrieve_says;
	d.style.display='block';
	if(data.error) {
		d.innerHTML='<span class=r>&#10008;</span> '+data.error;
		return;
	}
	stripChild(d,0);
	dom_addtext(d,'&#10004;',null,'g');
	dom_addtext(d,' Result is ready! ');
	apps.super.download=dom_create('span',d);
	dom_addbutt(apps.super.download,'Download',super_download).key=data.jobkey;
	dom_addbutt(d,'Visualize',super_view).key=data.jobkey;
});
}

function super_download(event)
{
event.target.disabled=true;
apps.super.bbj.ajax('super=on&download=on&jobkey='+event.target.key,function(data){
	apps.super.download.innerHTML='<a href=/browser/t/'+data.jobkey+'.tgz>Click to download</a>';
});
}

function super_view(event)
{
event.target.disabled=true;
apps.super.bbj.ajax('super=on&view=on&jobkey='+event.target.key,function(data){
	if(!data) {
		apps.super.retrieve_says.innerHTML='<span class=r>&#10008;</span> server crashed, please try again';
		return;
	}
	if(data.error) {
		apps.super.retrieve_says.innerHTML='<span class=r>&#10008;</span> '+data.error;
		return;
	}
	if(!data.rankgraph) {
		print2console('rankgraph missing',2);
		return;
	}
	if(!data.genes) {
		print2console('rankgraph missing',2);
		return;
	}
	/* tidy up data, assign x to each region
	in data.rankgraph: .x is original rank
	in apps.super.data: .x is converted to reverse rank (x axis position, for plotting)
	*/
	var cutoff=parseFloat(data.cutoff_statement.split(' ')[3]);
	var total=data.rankgraph.length;
	var cfcount=0;
	var x2ai={}; // xpos to array idx
	for(var i=0; i<total; i++) {
		var e=data.rankgraph[i];
		e.x=total-e.x; // x axis pos
		x2ai[e.x]=i;
		if(e.y>cutoff) {
			cfcount++;
		}
	}
	stripChild(apps.super.result_says,0);
	dom_create('div',apps.super.result_says).innerHTML='Using cutoff score of '+cutoff+' to identify super enhancers';
	dom_create('div',apps.super.result_says).innerHTML=cfcount+' super enhancers identified';
	apps.super.enhancer2bedtrack=dom_create('div',apps.super.result_says);
	dom_addbutt(apps.super.enhancer2bedtrack,'Show enhancer in genome browser',super_showtrack).key=data.jobkey;

	apps.super.data=data.rankgraph;
	scatterplot_makeplot(apps.super);

	// mark out cutoff
	var c=apps.super.scp_canvas_bg;
	var ctx=c.getContext('2d');
	ctx.fillStyle='#ccc';
	ctx.fillRect(parseInt((total-cfcount)*c.x_sf),0,1,c.height);
	ctx.fillRect(0,parseInt((c.y_max-cutoff)*c.y_sf),c.width,1);

	// genes
	for(i=0; i<data.genes.length; i++) {
		// line may contain consecutive \t, strtok no good
		// 6-8: genes, 9: rank
		var lst=data.genes[i].split('\t');
		// convert rank to apps.super.data array idx
		var arrid=x2ai[total-parseInt(lst[9])];
		if(lst[6]) {
			apps.super.data[arrid].g_overlap=lst[6];
		}
		if(lst[7]) {
			apps.super.data[arrid].g_proximal=lst[7];
		}
		if(lst[8]) {
			apps.super.data[arrid].g_closest=lst[8];
		}
	}
	super_flippanel(true);
});
}


function super_scpdot_click(event)
{
menu_shutup();
menu.c32.style.display='block';
stripChild(menu.c32,0);
var e=apps.super.data[event.target.idx];
menu_addoption(null,'Relocate to '+e.c+':'+e.a+'-'+e.b,super_jump,menu.c32);
menu.c32.coord=e.c+':'+e.a+'-'+e.b
menu_show(0,event.clientX,event.clientY);
gflag.menu.bbj=apps.super.bbj;
}

function super_jump()
{
toggle5();
gflag.menu.bbj.cgiJump2coord(menu.c32.coord);
}


function super_scpdot_tooltip(event)
{
var e=apps.super.data[event.target.idx];
picasays.innerHTML='<table style="color:white"><tr><td class=tph>rank</td><td>'+(1+event.target.idx)+'</td></tr>'+
'<tr><td class=tph>rank score</td><td>'+e.y+'</td></tr>'+
('ctrl' in e ? '<tr><td class=tph>control score</td><td>'+e.ctrl+'</td></tr>' : '')+
(e.g_overlap ? '<tr><td class=tph>overlap with</td><td>'+e.g_overlap+'</td></tr>' : '')+
(e.g_proximal ? '<tr><td class=tph>proximal to</td><td>'+e.g_proximal+'</td></tr>' : '')+
(e.g_closest ? '<tr><td class=tph>closest to</td><td>'+e.g_closest+'</td></tr>' : '')+
'<tr><td class=tph>length</td><td>'+(e.b-e.a)+'</td></tr>'+
'<tr><td class=tph colspan=2>'+e.c+':'+e.a+'-'+e.b+'</td></tr></table>';
pica_go(event.clientX,event.clientY);
}

function super_showtrack(event)
{
event.target.disabled=true;
apps.super.bbj.ajax('super=on&addtrack=on&jobkey='+event.target.key,function(data){
	apps.super.enhancer2bedtrack.firstChild.disabled=false;
	if(!data) {
		print2console('server crashed',2);
		return;
	}
	if(data.error) {
		print2console(data.error,2);
		return;
	}
	apps.super.enhancer2bedtrack.innerHTML='<span class=g>&#10004;</span> Enhancers are shown as two separate tracks on the browser';
	var tk1={name:apps.super.bbj.genome.newcustomtrackname(),label:'All enhancers',ft:FT_bed_c,mode:M_full,
		url:window.location.origin+'/browser/t/'+data.jobkey+'.allenhancers.gz'};
	var tk2={name:apps.super.bbj.genome.newcustomtrackname(),label:'Super enhancers',ft:FT_bed_c,mode:M_full,
		url:window.location.origin+'/browser/t/'+data.jobkey+'.superenhancers.gz'};
	apps.super.bbj.ajax_addtracks([tk1,tk2]);
});
}
