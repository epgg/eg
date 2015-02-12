


var count=0;
function readygo() {
	document.getElementById('board').style.bottom=count-200;
	count+=4;
	if(count<200) setTimeout("readygo()", 3);
}

var oldx=0;
var oldy=0;
function md(event) {
	event.preventDefault();
	oldx=event.clientX;
	oldy=event.clientY;
	document.body.addEventListener('mousemove',mm,false);
	document.body.addEventListener('mouseup',mu,false);
}
function mm(event) {
	var x=parseInt(document.body.style.backgroundPositionX);
	var y=parseInt(document.body.style.backgroundPositionY);
	document.body.style.backgroundPositionX=x+(event.clientX-oldx);
	document.body.style.backgroundPositionY=y+(event.clientY-oldy);
	oldx=event.clientX;
	oldy=event.clientY;
}
function mu(event) {
	document.body.removeEventListener('mousemove',mm,false);
	document.body.removeEventListener('mouseup',mu,false);
}
