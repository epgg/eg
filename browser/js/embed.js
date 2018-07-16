var errmsg='<div style="font-weight:bold;margin:10px;"><span style="color:red">Error!</span> ';
var help='<div style="padding:10px;"><a href=http://egg.wustl.edu/+/embed target=_blank>Please refer to our instructions on embedding.</a></div></div>';



Browser.prototype.__jsonPageinit=function(){return;}

function delete_bbjpanel()
{
var b=gflag.browser;
if(b.mcm) {
	b.mcm.holder.parentNode.removeChild(b.mcm.holder);
}
b.main.parentNode.removeChild(b.main);
delete horcrux[b.horcrux];
}

function embed_washugb(param)
{
embed_wubrowse(param);
}

function embed_wubrowse(param)
{
if(!param.container) {
	alert('Error: missing container');
	return;
}
param.container.style.position='relative';
param.container.style.fontFamily='Arial';
if(!param.host) {
	param.container.innerHTML=errmsg+'No host given.'+help;
	return;
}
if(!param.genome) {
	param.container.innerHTML=errmsg+'No genome specified.'+help;
	return;
}

// TODO need to validate genome name

gflag.cors_host=param.host;
gflag.is_cors=true;

if(param.foregroundColor) {
	var s=colorstr2int(param.foregroundColor);
	if(isNaN(s[0])) {
		alert('Invalid foregroundColor');
	} else {
		colorCentral.foreground=param.foregroundColor;
	}
}
if(param.backgroundColor) {
	var s=colorstr2int(param.backgroundColor);
	if(isNaN(s[0])) {
		alert('Invalid backgroundColor');
	} else {
		colorCentral.background=param.backgroundColor;
	}
}
page_makeDoms({
	app_bbjconfig:{changetknw:{call:menu_changeleftwidth}},
	//cp_custtk:{htext:'not shown'},
});
menu.style.fontFamily='Arial';

/* some user parameters need to be handled here */
var bbj=new Browser();
bbj.leftColumnWidth=param.leftSpaceWidth?Math.max(50,param.leftSpaceWidth):80;
bbj.hmSpan=param.panelWidth?Math.max(500,param.panelWidth):800;
var utils={};
if(!param.noPanelwidthConfig) {
	utils.bbjconfig=true;
}
if(!param.noDeleteButton) {
	utils.delete=delete_bbjpanel;
}
bbj.browser_makeDoms({
	centralholder:param.container,
	tkheader:param.hideTrackName?false:true,
	navigator:param.hideChromNavigator?false:true,
	ghm_ruler:param.hideTopRuler?false:true,
	mcm:param.hideMetadataColormap?false:true,
	header:{
		padding:2,
		zoomout:[[1,1],[5,5]],
		dspstat:{allowupdate:true},
		resolution:true,
		utils:utils,
		},
	});
bbj.applyHmspan2holders();

var ibp={};

/* process user parameters */
if(param.maxTrackHeight) {
	max_initial_qtkheight=param.maxTrackHeight;
}
if(!('noDefaultTrack' in param)) {
	ibp.defaultcontent=true;
}
if(param.datahub) {
	ibp.datahub_json=param.datahub;
}
if(param.publichubs) {
	ibp.publichubloadlst=param.publichubs;
}

if(param.showContent) {
	if(!Array.isArray(param.showContent)) {
		param.container.innerHTML=errmsg+'Value of "showcontent" should be an array.'+help;
	} else {
		// can only be validated when genome is loaded
		ibp.hubjsoncontent=param.showContent;
	}
}
if('coordinate' in param) {
	if(ibp.defaultcontent) {
		// need override
		if(!ibp.hubjsoncontent) {
			ibp.hubjsoncontent=[];
		}
		ibp.hubjsoncontent.push({type:'coordinate_override',coord:param.coordinate});
	} else {
		ibp.coord_rawstring=param.coordinate;
	}
}
if('showLinkagemap' in param) {
	ibp.show_linkagemap=true;
	// menu covers embed div
	ibp.show_linkagemap_div=param.container;
}

//bbj.ajax({load_dblst: 'on'},function(data){bbj.sukn_init(data);});
bbj.loadgenome_initbrowser({
	dbname:param.genome,
	browserparam:ibp,
	genomeparam:{custom_track:true},
	}
);
}
