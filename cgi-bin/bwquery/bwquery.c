#include "common.h"
#include "localmem.h"
#include "udc.h"
#include "bigWig.h"

int main(int argc, char *argv[])
{
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
	fputs("bwquery: wrong arg\n", stderr);
	return 1;
	}

char *tail=NULL;
unsigned int start=strtol(argv[3],&tail,10);
if(tail[0]!='\0' || start<0)
	{
	fprintf(stderr, "bwquery: wrong start (%s)\n", argv[3]);
	return 1;
	}
unsigned int stop=strtol(argv[4],&tail,10);
if(tail[0]!='\0' || stop<=start)
	{
	fprintf(stderr, "bwquery: wrong stop (%s)\n", argv[4]);
	return 1;
	}
unsigned int spnum=strtol(argv[5],&tail,10);
if(tail[0]!='\0' || spnum<=0)
	{
	fprintf(stderr, "bwquery: wrong spnum (%s)\n", argv[5]);
	return 1;
	}
unsigned int summeth=strtol(argv[7],&tail,10);
if(tail[0]!='\0' || summeth<1)
	{
	fprintf(stderr, "bwquery: wrong summeth (%s)\n", argv[7]);
	return 1;
	}

double *data=malloc(sizeof(double)*spnum);
if(data==NULL)
	{
	fputs("bwquery: out of mem\n", stderr);
	return 1;
	}

int i;
for(i=0; i<spnum; i++) data[i]=0;

struct bbiFile *bwf = bigWigFileOpen(argv[1]);
if(bwf==NULL)
	{
	fprintf(stderr, "bwquery: no access to %s\n", argv[1]);
	return 1;
	}
bbiSummaryArray(bwf, argv[2], start, stop, (BbiFetchIntervals)bigWigIntervalQuery, 
	summeth==1?bbiSumMean:
	summeth==2?bbiSumMax:bbiSumMin,
	spnum, &data[0]);
bbiFileClose(&bwf);

FILE *fout=fopen(argv[6],"w");
if(fout==NULL)
	{
	fputs("bwquery: failed to open output file\n", stderr);
	return 1;
	}
for(i=0; i<spnum; i++)
	fprintf(fout, "%f\n", data[i]);
fclose(fout);


return 0;
}
