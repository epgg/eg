#include "bigWig.h"
#include <stdio.h>
#include <inttypes.h>
#include <stdlib.h>
#include <assert.h>

int main(int argc, char *argv[]) {
    bigWigFile_t *fp = NULL;
    bbOverlappingEntries_t *o;
    uint32_t i;
    char *tail=NULL;
    if(argc != 6) {
        fprintf(stderr, "Usage: %s {file.bb|URL://path/file.bb} chrom start stop outfile\n", argv[0]);
        return 1;
    }
unsigned int start=strtol(argv[3],&tail,10);
if(tail[0]!='\0' || start<0)
	{
	fprintf(stderr, "querybb: wrong start (%s)\n", argv[3]);
	return 1;
	}
unsigned int stop=strtol(argv[4],&tail,10);
if(tail[0]!='\0' || stop<=start)
	{
	fprintf(stderr, "querybb: wrong stop (%s)\n", argv[4]);
	return 1;
	}

    if(bwInit(1<<17) != 0) {
        fprintf(stderr, "Received an error in bwInit\n");
        return 1;
    }

    assert(bwIsBigWig(argv[1], NULL) == 0);
    assert(bbIsBigBed(argv[1], NULL) == 1);

    fp = bbOpen(argv[1], NULL);
    if(!fp) {
        fprintf(stderr, "An error occured while opening %s\n", argv[1]);
        return 1;
    }

    //Presumably this is the sort of interface that's needed...
    //o = bbGetOverlappingEntries(fp, "chr1", 4450000, 4500000, 1);
    o = bbGetOverlappingEntries(fp, argv[2], start, stop, 1);
    //printf("%"PRIu32" entries overlap\n", o->l);
    FILE *fout=fopen(argv[5],"w");
    if(fout==NULL)
        {
	    fputs("querybb: failed to open output file\n", stderr);
            return 1;
	}
    for(i=0; i<o->l; i++) {
        fprintf(fout,"%s\t%"PRIu32"\t%"PRIu32"\t%s\n", argv[2],o->start[i], o->end[i], o->str[i]);
    }
    fclose(fout);
    if(o) bbDestroyOverlappingEntries(o);

    bwClose(fp);
    bwCleanup();
    return 0;
}
