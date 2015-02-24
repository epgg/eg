function jsontext_removecomment(t)
{
var lines=t.split('\n');
if(lines.length==0) return null;
var nlst=[];
for(var i=0; i<lines.length; i++) {
	var l=lines[i].trim();
	if(l[0]=='#') continue;
	nlst.push(l);
}
return nlst.join('');
}

onmessage = function(e) {
    //console.log('Message received from main script');
    //console.log(e.data);
    var j = null;
    try {
        j = JSON.parse(e.data);
    }catch(e){
        try {
            var t2=jsontext_removecomment(e.data);
            if(!t2) j = null;
            try {
                var j=eval('('+t2+')');
            } catch(err) {
                    j = null;
            }
        }catch(e){
            j =  null;
        }
    }
    //console.log('Posting message back to main script');
    postMessage(j);
}
