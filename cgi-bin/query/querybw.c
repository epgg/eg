#include "bigWig.h"
#include <stdio.h>
#include <inttypes.h>
#include <stdlib.h>
#include <assert.h>


//This is an example call back function
CURLcode callBack(CURL *curl) {
    CURLcode rv;

    rv = curl_easy_setopt(curl, CURLOPT_USERNAME, "anonymous");
    if(rv != CURLE_OK) return rv;

    rv = curl_easy_setopt(curl, CURLOPT_PASSWORD, "libBigWig@github.com");
    /* example.com is redirected, so we tell libcurl to follow redirection */
    //rv = curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    //rv = curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);
    rv = curl_easy_setopt(curl, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
    return rv;
}

int main(int argc, char *argv[]) {
    bigWigFile_t *fp = NULL;
    double *stats = NULL;

/*
1. urlpath bigwig
2. chrom
3. start
4. stop
5. spnum
6. outfile
7. summeth
*/
if(argc!=8)
	{
        fprintf(stderr, "Usage: %s {file.bb|URL://path/file.bb} chrom start stop spnum outfile summeth\n", argv[0]);
	return 1;
	}

char *tail=NULL;
unsigned int start=strtol(argv[3],&tail,10);
if(tail[0]!='\0' || start<0)
	{
	fprintf(stderr, "querybw: wrong start (%s)\n", argv[3]);
	return 1;
	}
unsigned int stop=strtol(argv[4],&tail,10);
if(tail[0]!='\0' || stop<=start)
	{
	fprintf(stderr, "querybw: wrong stop (%s)\n", argv[4]);
	return 1;
	}
unsigned int spnum=strtol(argv[5],&tail,10);
if(tail[0]!='\0' || spnum<=0)
	{
	fprintf(stderr, "querybw: wrong spnum (%s)\n", argv[5]);
	return 1;
	}
unsigned int summeth=strtol(argv[7],&tail,10);
if(tail[0]!='\0' || summeth<1)
	{
	fprintf(stderr, "querybw: wrong summeth (%s)\n", argv[7]);
	return 1;
	}

    if(bwInit(1<<17) != 0) {
        fprintf(stderr, "Received an error in bwInit\n");
        return 1;
    }

    fp = bwOpen(argv[1], callBack, "r");
    if(!fp) {
        fprintf(stderr, "An error occured while opening %s\n", argv[1]);
        return 1;
    }
unsigned int i;
stats = bwStats(fp, argv[2], start, stop, spnum, summeth==1?mean:summeth==2?max:min);
    if(stats) {
        FILE *fout=fopen(argv[6],"w");
        if(fout==NULL)
        {
	    fputs("querybw: failed to open output file\n", stderr);
            return 1;
	}
        for(i=0; i<spnum; i++)
	    fprintf(fout, "%f\n", stats[i]);
        fclose(fout);
        free(stats);
    }else{
        fprintf(stderr,"no data\n");
        return 1;
    }


    bwClose(fp);
    bwCleanup();
    return 0;
}
