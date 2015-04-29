function correlation_byft(v1,v2,ft)
{
if(!Array.isArray(v1)) {
	print2console('arg 1 is not array',2);
	return null;
}
if(!Array.isArray(v2)) {
	print2console('arg 2 is not array',2);
	return null;
}
// flatten regional data
var d1=[];
for(var i=0; i<v1.length; i++) {
	if(Array.isArray(v1[i])) {
		d1=d1.concat(v1[i]);
	} else {
		d1.push(v1[i]);
	}
}
var d2=[];
for(var i=0; i<v2.length; i++) {
	if(Array.isArray(v2[i])) {
		d2=d2.concat(v2[i]);
	} else {
		d2.push(v2[i]);
	}
}
if(d1.length!=d2.length) {
	print2console('Unequal array lengths',2);
	return null;
}
if(ft==FT_cat_n||ft==FT_cat_c) {
	/* categorical
	*/
	var compsum=0;
	for(var i=0; i<d1.length; i++) {
		if(d1[i]==d2[i]) compsum+=1;
		else compsum+=-1;
	}
	return compsum/d1.length;
} else {
	/* numerical */
	return pearson_corr(d1,d2);
}
}

function pearson_corr(v1,v2)
{
var t=0;
for(var i=0; i<v1.length; i++) {
	t+=v1[i];
}
var m=t/v1.length;
var d1=[];
for(var i=0; i<v1.length; i++) {
	d1[i]=v1[i]-m;
}
var t=0;
for(var i=0; i<v2.length; i++) {
	t+=v2[i];
}
var m=t/v2.length;
var d2=[];
for(var i=0; i<v2.length; i++) {
	d2[i]=v2[i]-m;
}
var a=0;
for(var i=0; i<v1.length; i++) {
	a+=d1[i]*d2[i];
}
var b=0;
for(var i=0; i<v1.length; i++) {
	b+=d1[i]*d1[i];
}
var c=0;
for(var i=0; i<v2.length; i++) {
	c+=d2[i]*d2[i];
}
if(b==0 || c==0) return 0;
return a/(Math.sqrt(b)*Math.sqrt(c));
}
