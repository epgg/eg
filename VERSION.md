## EpiGenome Gateway - WashU EpiGenome Browser

### version 39.3.5
* long url (url longer than 256 characters ) fix by Jin Lee and dli
* simple bed track with different color in different strand  by Jin Lee
* value of y-axis limited to 2 decimal points in case of floating number
* bug fix, sometimes generated svg link have no .svg prefix
* parse json hub file using C through network instead of `wget` to local (ref: http://alisdair.mcdiarmid.org/2012/08/14/jsmn-example.html)
* a `Makefile` was added for building the C binary program
* bug fix, `Error fetching SNP information` was fixed
* url with `+` is supported
* use `encodeURIComponent` instead of `escape` which is deprecated
* use `decodeURIComponent` instead of `unescape` which is deprecated
* Roadmap browser max-height (js and css) bug fix, details see: http://stackoverflow.com/questions/2244773/set-max-height-using-javascript
* add `curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);` for following location support
* SNP search switched to exact match
* add PDF output when using screenshot app
* moving help link to wiki

### version 39.3.4
* the last final version as Xin left, thanks to Xin for building the nice work. 
