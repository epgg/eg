/**************************
     This file is copyrighted, but license is hereby granted for personal,
     academic, and non-profit use.
	 Please contact authors for commercial use.
 **************************/
#include <stdio.h>
#include <stdlib.h>
#include <search.h>
#include <string.h>
#include <sys/wait.h>
#include <sys/stat.h>
#include <limits.h>
#include <mysql.h>
#include <assert.h>
#include <math.h>
#include <time.h>
#include <glob.h>
#include "sam.h"
#include "tabix.h"
#include "jsmn/jsmn.c"

#define MAXbpwidth 10
#define StartChrom_cgi "startChr"
#define StartCoord_cgi "startCoord"
#define StopChrom_cgi "stopChr"
#define StopCoord_cgi "stopCoord"
#define customscaffoldlen "scaffoldlen"
#define MaxStack 100
#define MaxProcessNum 20
#define min(a,b) ( (a) < (b) ? (a) : (b) )
#define max(a,b) ( (a) > (b) ? (a) : (b) )

#define GENOME "genome"
#define M_hide 0
#define M_hide_s "0"
#define M_show 1
#define M_show_s "1"
#define M_thin 2
#define M_thin_s "2"
#define M_full 3
#define M_full_s "3"
#define M_arc 4
#define M_arc_s "4"
#define M_trihm 5
#define M_trihm_s "5"
#define M_den 6
#define M_den_s "6"
#define M_bar 7
#define M_bar_s "7"
#define M_error -1

#define summeth_mean 1
#define summeth_max 2
#define summeth_min 3
#define summeth_sum 4

// all of following are tabix
#define FT_nottk -1
#define FT_bed_n 0
#define FT_bed_c 1
#define FT_bedgraph_n 2
#define FT_bedgraph_c 3
#define FT_sam_n 4
#define FT_sam_c 5
#define FT_bam_n 17
#define FT_bam_c 18
#define FT_qdecor_n 8
#define FT_lr_n 9
#define FT_lr_c 10
#define FT_cat_n 12
#define FT_cat_c 13
#define FT_pwc 6
#define FT_htest 7
#define FT_tkgrp 11
#define FT_weaver_c 21
#define FT_catmat 20
#define FT_qcats 27
#define FT_bigwighmtk_n 14
#define FT_bigwighmtk_c 15
#define FT_ld_c 23
#define FT_ld_n 26
#define FT_anno_n 24
#define FT_anno_c 25

#define RM_genome 0
#define RM_jux_n 1
#define RM_jux_c 2
#define RM_gsv_c 3
#define RM_gsv_kegg 4
#define RM_rpbr_beam 5
#define RM_yearmonthday 6

#define ymdayfile "yearmonthday" // a bed file
#define Rose_input_fn "input_bed_file"
#define trashDir "/usr/lib/trash"
#define WWWT "/var/www/html/browser/t"
#define BINdir "."
#define Mysqlserver "localhost" // 10.200.0.11
#define Mysqluser "root"
#define Mysqlpswd "xzhou"

/* miscellaneous */
#define SQUAWK 1 // set to 1 for squawking
#define CHECKCPUTIME 0 // 1 for benchmarking cpu time
#define Squawk stderr // where to squawk at, stdout or stderr
#define boolean short
#define TRUE 1
#define FALSE 0

/* FIXME badly need to unify all the bed/item/node structs with region
*/

struct slNode
    { 
    /* covers tnode, and track */
    struct slNode *next;
    char *name;
	char **arr;
    };
struct tnode
    { 
    /*
	for cgiparamsl:
	t1: key
	t2: value

	for hmtk json dump:
	t1: label
	t2: md anno
	t4: filetype
	*/
    struct tnode *next;
    char *t1;
    char *t2;
    char *t3;
    int t4;
    int num;
    float fnum;
    float fnum2;
    };
struct nsortItem
	{
	/* numerical sort */
	double value;
	void *ptr; // points to original item
	};
struct genericItem
	{
	/* to include beditem and readitem 
	when only coordinate is concerned
	and when bed/sam format cannot be sured
	*/
	struct genericItem *next;
	unsigned int start;
	unsigned int stop;
	};
struct beditem
	{
	/* such and the read has no field for chrs, because they are always attached to
	some structures that identifies chr
	*/
	struct beditem *next;
	unsigned int start;
	unsigned int stop;
	char *rest;
	};
struct beditem2
	{
	// only for repeatbrowser perhaps
	struct beditem2 *next;
	char *chrom;
	unsigned int start;
	unsigned int stop;
	char strand;
	char *rest; // may be used as ID
	double score;
	};
struct tabixHandle
	{
	struct tabixHandle *next;
	tabix_t *fin;
	char *name;
	};
struct readitem
	{
	struct readitem *next;
	unsigned int start;
	/* read stop is start + strlen(seq)
	this *stop* will only be used for computing density
	will not be reported to js for bed plotting
	the actual stop need to be determined by cigar
	*/
	unsigned int stop;
	char *id;
	uint32_t flag; // flag from bam
	char *flag_str; // flag str from sam
	char *seq; // read sequence
	uint32_t *cigar; // cigar from bam
	uint32_t n_cigar;
	char *cigar_str; // cigar str from sam
	char *mismatch;
	};
struct userData
	{
	struct readitem *sl;
	};


struct nnode
    { 
    // for genestruct
    struct nnode *next;
    int chrIdx;
    int start;
    int stop;
    int flank5start; // upstream flank start, only used in genesetview
    int flank5stop;
    int flank3start; // downstream flank start, only used in genesetview
    int flank3stop;
    char strand;
    char *name;
    double *data;
	int id;
    };

struct urlpiece
    { 
    // a piece of loooong url
    int offset;
    char *text;
    };
struct track
    { 
    /* both for track and density track */
    struct track *next;
    char *name;
	char *label;
    char *urlpath; // either URL or file path
    int ft;
	int mode;
	int summeth;
	int weave;
	float pscore; // positive cutoff score
	float nscore; // negative cutoff score
    double *data; // array length: dsp.usedSummaryNumber
    int gid; // for grouping tracks in htest, passed from client
    boolean flag;
    pid_t pid; // for forking on a track
    char *tmpfile; // session+track name, will hold data made by child process and later, need to be made before forking so that both parent/child can see it
    };
struct geneParam
	{
	char *query_table; // [genetype]symbol table, if null, iterate over all tables
	char *query_str;
	boolean use_chromid;
	boolean use_exactmatch;
	boolean parse_json;
	boolean have_name;
	char *whichgenepart; // null for "genebody"
	char *origintype; // null for not adding flanking
	int flank5;
	int flank3;
	};
struct gene
	{
	struct gene *next;
	char *chrom;
	int chromIdx;
	/* initially start/stop will be set to txstart/txstop
	in case of applying flanking they will be changed
	*/
	unsigned int txstart; // transcription start/stop
	unsigned int txstop;
	unsigned int report_start;
	unsigned int report_stop;
	/* when param->whichgenepart is set to other than genebodym
	report_start/stop will be used, else they are same as txstart/stop
	*/
	char strand;
	int utr5start;
	int utr5width;
	int utr3start;
	int utr3width;
	int exoncount;
	int **exons;
    int flank5start; // upstream flank start, -1 for not in use
    int flank5stop;
    int flank3start;
    int flank3stop;
	char *name;
	int id; // in the bed file and []struct table
	char *type; // could be gene table name
	char *text; // could be desc
	boolean on_normalchr;
	char *jsontext; // for new gene track, save data as unparsed json string
	};
struct region
    {
    struct region *prev;
    struct region *next;
    int chromIdx;
    int bstart; // *b*oundary of this region in genome
    int bstop;
    int dstart; // *d*isplayed portion of this region
    int dstop;
	char strand; // +/-
    int flank5start; // upstream flank start, only used in genesetview
    int flank5stop;
    int flank3start; // downstream flank start, only used in genesetview
    int flank3stop;
    int summarySize;
    char *coordString; // ?
    char *name; // only for gsv
	char *name2;
	boolean flag; // in case of gsv, true/false for whether is gene
    // will only be used when zoom level changed, to indicate if this region is start of view region
    boolean isViewStart;
    int viewStartCoord;
    double fvalue; // a value for sorting items
    };
struct point
    {
    int chromIdx;
    int coord;
    boolean hitBorder;
    };
/* |--left wing--|========DSP========|--right wing--|
            dsp start            dsp stop
   start/stop index of dsp, need to be exactly hmSpan in length
*/
struct chritemsl
	{
	struct chritemsl *next;
	int chromIdx;
	struct beditem *itemsl;
	};
struct displayedRegion
    {
    // start/stop will be used in determining head/tail
    // but will not be used for iteration purpose
    struct point *start;
    struct point *stop;
	struct chritemsl *chritemsl;
    struct region *head; // 5' end
    struct region *tail; // 3' end
    long entireLength;
    int usedSummaryNumber; // corresponds to number of pixels horizontally in heatmap
    boolean atbplevel; // if showing basepair, in this case, summary size will equal seq length
    int runmode;
    char *juxtkurlpath;
	int juxtkft; // file type of the track used in juxtaposition
	tabix_t *tabix; // tabix file handle for region computing during juxtaposition
	/* for restricting reading lots of items
	when showing longrange tracks for browser
	*/
	struct nnode *dspFilter;
    };
struct heatmap
    {
    struct displayedRegion *dsp;
    struct track *trackSl;
    struct slNode *genetrack_sl;
    // decor tracks grouped by file type (indicated by file type number)
    struct track *decor0;
    struct track *decor1;
    struct track *decor8;
    struct track *decor4;
    struct track *decor5;
    struct track *decor9;
    struct track *decor10;
	struct track *decor17;
	struct track *decor18;
	struct track *tk20;
	struct track *tk21;
	struct track *tk23;
	struct track *tk24;
	struct track *tk25;
	struct track *tk26;
	struct track *tk27;
    };



/**********************************
       global variables
 *********************************/
const char *treeoflife="/srv/epgg/data/data/subtleKnife/treeoflife";
unsigned int hmSpan = 0;
MYSQL *conn=NULL;
struct chrInfoNode /* to be used in array */
    {
    char *name;
    unsigned int length;
    };
struct chrInfoNode **chrInfo; // an array
int lastChrIdx=-1;
struct point leftBorder, rightBorder;
char *bbiDir;
char *seqPath;
char *session = NULL;
int statusId = -1;
struct slNode *genetrack_sl = NULL;
struct slNode *normalchr_sl=NULL;
struct tnode *cgiparamsl=NULL;

/* centralized sl to record broken tracks
*/
struct track *brokenbeads=NULL;

/**********************************
          tiny functions 
 *********************************/
void done()
{
if(SQUAWK) fputs("done\n", stderr);
}
void errabort(char *msg)
{
fprintf(stderr, "Aborted: %s\n", msg);
exit(0);
}

boolean isCustom(int ft)
{
switch(ft) {
case FT_bedgraph_c:
case FT_cat_c:
case FT_bigwighmtk_c:
case FT_bed_c:
case FT_lr_c:
case FT_sam_c:
case FT_ld_c:
case FT_anno_c:
case FT_weaver_c:
case FT_catmat:
case FT_qcats:
	return TRUE;
default:
	return FALSE;
}
}


long strMayPositiveInt(char *what)
{
// return -1 to indicate error
char *tail;
long value = strtol(what, &tail, 0);
if(tail[0] == '\0')
    return value;
return -1;
}


char *getSeq(tabix_t *fin, char *chrom, unsigned int start, unsigned int stop)
{
/* free after use
*/
int chridx, begin, end, len, i, j=0;
char *tmp;
assert(asprintf(&tmp,"%s:%d-%d",chrom,start,stop)>0);
if(ti_parse_region(fin->idx, tmp, &chridx, &begin, &end)<0)
	{
	return NULL;
	}
free(tmp);
ti_iter_t iter=ti_queryi(fin, chridx, begin, end);
char *seq=malloc(sizeof(char)*(1+stop-start));
char delim[]="\t\n";
char *tok;
const char *row;
while((row=ti_read(fin, iter, &len)) != 0)
	{
	tmp=strdup(row);
	strtok(tmp, delim);
	assert((tok=strtok(NULL,delim))!=NULL);
	assert((begin=strMayPositiveInt(tok))!=-1);
	assert((tok=strtok(NULL,delim))!=NULL);
	assert((end=strMayPositiveInt(tok))!=-1);
	if((tok=strtok(NULL,delim))==NULL) continue;
	for(i=max(start,begin);i<min(stop,end);i++)
		seq[j++]=tok[i-begin];
	}
seq[j]='\0';
//fprintf(stderr, "%d-%d (%d), %d\n", start, stop, (stop-start), j);
return seq;
}

void slReverse(void *sl)
{
struct slNode **ppt = (struct slNode **)sl;
struct slNode *newList = NULL;
struct slNode *el, *next;

next = *ppt;
while (next != NULL)
{    
	el = next;
	next = el->next;
	el->next = newList;
	newList = el;
}    
*ppt = newList;
}

int slCount2(void *in)
{
// works for things similar as slNode
struct slNode *sl=(struct slNode *)in;
int a=0;
for(; sl!=NULL; sl=sl->next)
	a++;
return a;
}
void slFree(void *in)
{
// works for things similar as slNode
struct slNode *sl=(struct slNode *)in;
struct slNode *n;
while(sl!=NULL)
	{
	n=sl->next;
	free(sl);
	sl=n;
	}
}

int nsort_compAsc(const void *a, const void *b)
{
// numerical sort, ascending
const struct nsortItem *aa=a;
const struct nsortItem *bb=b;
return (aa->value > bb->value) - (aa->value < bb->value);
}
int nsort_compDsc(const void *a, const void *b)
{
// numerical sort, descending
const struct nsortItem *aa=a;
const struct nsortItem *bb=b;
return (bb->value > aa->value) - (bb->value < aa->value);
}

struct genericItem *beditemsort_startAsc(struct genericItem *sl)
{
/* apply numerical sort to start of generic items
yield new list in ascending order
original list is *altered*
*/
if(sl==NULL) return NULL;
int count=0;
struct genericItem *t;
for(t=sl; t!=NULL; t=t->next) count++;
struct nsortItem *array=malloc(sizeof(struct nsortItem)*count);
if(array==NULL)
	{
	fprintf(stderr, "%s: out of mem\n", __FUNCTION__);
	exit(0);
	}
int i=0;
for(t=sl; t!=NULL; t=t->next)
	{
	array[i].value=t->start;
	array[i++].ptr=(void *)t;
	}
qsort(array, count, sizeof(struct nsortItem), nsort_compDsc);
struct genericItem *newsl=NULL;
for(i=0; i<count; i++)
	{
	t=(struct genericItem *)array[i].ptr;
	t->next=newsl;
	newsl=t;
	}
free(array);
return newsl;
}

struct genericItem *beditemsort_stopDsc(struct genericItem *sl)
{
/* apply numerical sort to stop of bed items
yield new list in descending order
original list is *altered*
*/
if(sl==NULL) return NULL;
int count=0;
struct genericItem *t;
for(t=sl; t!=NULL; t=t->next) count++;
struct nsortItem *array=malloc(sizeof(struct nsortItem)*count);
if(array==NULL)
	{
	fprintf(stderr, "%s: out of mem\n", __FUNCTION__);
	exit(0);
	}
int i=0;
for(t=sl; t!=NULL; t=t->next)
	{
	array[i].value=t->stop;
	array[i++].ptr=(void *)t;
	}
qsort(array, count, sizeof(struct nsortItem), nsort_compAsc);
struct genericItem *newsl=NULL;
for(i=0; i<count; i++)
	{
	t=(struct genericItem *)array[i].ptr;
	t->next=newsl;
	newsl=t;
	}
free(array);
return newsl;
}

char *makefilepath(char *trackname, int ft)
{
char *p;
switch(ft)
	{
	case FT_bed_c:
	case FT_bedgraph_c:
	case FT_lr_c:
	case FT_sam_c:
	case FT_bam_c:
	case FT_cat_c:
	case FT_bigwighmtk_c:
	case FT_anno_c:
		return trackname;
	case FT_bed_n:
		assert(asprintf(&p, "%s%s.gz", bbiDir, trackname)>0);
		return p;
	case FT_anno_n:
		assert(asprintf(&p, "%s%s.gz", bbiDir, trackname)>0);
		return p;
	case FT_ld_n:
		assert(asprintf(&p, "%s%s.gz", bbiDir, trackname)>0);
		return p;
	case FT_bedgraph_n:
		assert(asprintf(&p, "%s%s.gz", bbiDir, trackname)>0);
		return p;
	case FT_qdecor_n:
		assert(asprintf(&p, "%s%s.gz", bbiDir, trackname)>0);
		return p;
	case FT_lr_n:
		assert(asprintf(&p, "%s%s.gz", bbiDir, trackname)>0);
		return p;
	case FT_cat_n:
		assert(asprintf(&p, "%s%s.gz", bbiDir, trackname)>0);
		return p;
	case FT_sam_n:
		assert(asprintf(&p, "%s%s.gz", bbiDir, trackname)>0);
		return p;
	case FT_bam_n:
		assert(asprintf(&p, "%s%s.bam", bbiDir, trackname)>0);
		return p;
	case FT_bigwighmtk_n:
		assert(asprintf(&p, "%s%s.bigWig", bbiDir, trackname)>0);
		return p;
	default:
		fprintf(stderr, "%s: %s %d\n", __FUNCTION__, trackname, ft);
		exit(0);
	}
return NULL;
}



float standardDeviation(double *data, int len)
{
if(len <= 1) return 0;
double ave = 0;
int i;
for(i=0; i<len; i++) ave += data[i];
ave /= len;
double std = 0;
for(i=0; i<len; i++)
    std += (data[i]-ave) * (data[i]-ave);
return sqrt(std/len);
}
int urlpiece_cmp(const void *a, const void *b)
{
const struct urlpiece *u1 = (const struct urlpiece *)a;
const struct urlpiece *u2 = (const struct urlpiece *)b;
return (u1->offset > u2->offset) - (u1->offset < u2->offset);
}
int getRegionNumber(struct displayedRegion *dsp)
{
int i=0;
struct region *r;
for(r=dsp->head; r!=NULL; r=r->next) i++;
return i;
}
void dspAddRegionHead(struct displayedRegion *dsp, struct region *r)
{
r->next = dsp->head;
r->prev = NULL;
dsp->head = r;
if(dsp->tail == NULL)
    dsp->tail = r;
else
    r->next->prev = r;
}
void dspAddRegionTail(struct displayedRegion *dsp, struct region *r)
{
r->prev = dsp->tail;
r->next = NULL;
dsp->tail = r;
if(dsp->head == NULL)
    dsp->head = r;
else
    r->prev->next = r;
}

/*
int intMin(int a, int b)
{
if(a > b) return b;
return a;
}
int intMax(int a, int b)
{
if(a > b) return a;
return b;
}
*/

int *str2intArr(char *string, int howmany)
{
/* "1,2,3" to [1,2,3], for string such as "exonStarts"
   return pointer to an array
   free after use

   fields must be delimited by comma
 */
int *number = malloc(sizeof(int)*howmany);
char delim[] = ",";
char *tok = strtok(string, delim); assert(tok!=NULL);
assert((number[0]=strMayPositiveInt(tok))!=-1);
int i=1;
for(; i<howmany; i++)
    {
    tok = strtok(NULL, delim); assert(tok!=NULL);
    assert((number[i]=strMayPositiveInt(tok))!=-1);
    }
return number;
}

/*** cgi ***/
boolean cgiVarExists(char *what)
{
struct tnode *t;
for(t=cgiparamsl; t!=NULL; t=t->next)
	{
	if(strcasecmp(what, t->t1)==0) return TRUE;
	}
return FALSE;
}

char *cgiString(char *what)
{
/* return a copy of hash data
free after use
*/
struct tnode *t;
for(t=cgiparamsl; t!=NULL; t=t->next)
	{
	if(strcasecmp(what, t->t1)==0) return strdup(t->t2);
	}
return NULL;
}

int cgiInt(char *what)
{
struct tnode *t;
for(t=cgiparamsl; t!=NULL; t=t->next)
	{
	if(strcasecmp(what, t->t1)==0) return strtol(t->t2,NULL,0);
	}
fprintf(stderr, "integer-value param missing (%s)\n", what);
exit(0);
}

double cgiDouble(char *what)
{
struct tnode *t;
for(t=cgiparamsl; t!=NULL; t=t->next)
	{
	if(strcasecmp(what, t->t1)==0) return strtod(t->t2,NULL);
	}
fprintf(stderr, "float-value param missing (%s)\n", what);
exit(0);
}

void cgiVarSet(char *key, char *data)
{
struct tnode *t=malloc(sizeof(struct tnode));
t->t1=strdup(key);
t->t2=strdup(data);
t->next=cgiparamsl;
cgiparamsl=t;
}

void strDecode(char *in, char *out, int inLength)
{
char c;
int i;
for (i=0; i<inLength;++i)
	{    
	c = *in++;
	if (c == '+') 
		{
		*out++ = ' '; 
		}
	else if (c == '%') 
		{
		int code;
		if (sscanf(in, "%2x", &code) != 1)
			code = '?'; 
		in += 2;
		i += 2;
		*out++ = code;
		}    
	else 
		{
		*out++ = c; 
		}
	}
*out++ = 0; 
}

char *strEscape(char *oldstr)
{
int oldlen=strlen(oldstr);
int newlen=0, i;
char c;
char *input=oldstr;
for(i=0; i<oldlen; i++)
	{
	c=input[i];
	if (c == '\''
		|| c == '\"'
		|| c == '&'
		|| c == '\\'
		|| c == '\n'
		|| c == '\r'
		|| c == '\t'
		|| c == '\b'
		|| c == '\f') newlen++;
	}
newlen+=oldlen;
char *newstr=malloc(sizeof(char)*(newlen+1));
int j=0;
for(i=0; i<oldlen; i++)
	{
	c=input[i];
	if (c == '\''
		|| c == '\"'
		|| c == '&'
		|| c == '\\'
		|| c == '\n'
		|| c == '\r'
		|| c == '\t'
		|| c == '\b'
		|| c == '\f')
		{
		newstr[j++]='\\';
		}
	newstr[j++]=c;
	}
newstr[newlen]='\0';
return newstr;
}


/*** mysql ***/
boolean mysqlConnect(const char *dbname)
{
conn=mysql_init(NULL);
if(mysql_real_connect(conn, Mysqlserver, Mysqluser, Mysqlpswd, dbname, 0, NULL, 0))
	return TRUE;
fprintf(stderr, "cannot connect to db (%s)\n", dbname);
return FALSE;
}

void mysqlUpdate(char *query)
{
/* replace sqlUpdate()
*/
if(mysql_query(conn, query))
	{
	fprintf(stderr, "%s\n", mysql_error(conn));
	exit(0);
	}
}

MYSQL_RES *mysqlGetResult(char *query)
{
/* replaces sqlGetResult() in kent source
upon failure, return NULL
*/
if(mysql_query(conn, query))
	{
	fprintf(stderr, "%s\n", mysql_error(conn));
	return NULL;
	}
MYSQL_RES *re=mysql_use_result(conn);
if(re==NULL)
	{
	fprintf(stderr, "mysql_use_result: %s (%s)\n", mysql_error(conn), query);
	return NULL;
	}
return re;
}

char *mysqlGetOnestring(char *query)
{
/* upon any failure, return NULL 
free after use
*/
MYSQL_RES *sr = mysqlGetResult(query);
if(sr == NULL)
    return NULL;
char **row=mysql_fetch_row(sr);
if(row==NULL || row[0]==NULL)
	{
	mysql_free_result(sr);
	return NULL;
	}
char *re = strdup(row[0]);
mysql_free_result(sr);
return re;
}

int mysqlGetPositiveInteger(char *query)
{
/* upon any failure, return -1 */
MYSQL_RES *sr = mysqlGetResult(query);
if(sr==NULL)
	return -1;
char **row;
if((row=mysql_fetch_row(sr)) == NULL)
    {
    mysql_free_result(sr);
    return -1;
    }
if(row[0] == NULL)
    {
	fprintf(stderr, "%s: row[0]==null\n", __FUNCTION__);
    mysql_free_result(sr);
    return -1;
    }
int value = strMayPositiveInt(row[0]);
mysql_free_result(sr);
return value;
}
int mysqlGetGenesGroupId()
{
// there should be a decor track group "Genes", fetch its ID
return mysqlGetPositiveInteger("select id from gfGrouping where name=\"Genes\"");
}

boolean mysqlResultAffirmative(char *query)
{
MYSQL_RES *sr = mysqlGetResult(query);
if(sr==NULL)
	return FALSE;
boolean re = (mysql_fetch_row(sr) != NULL);
mysql_free_result(sr);
return re;
}

boolean sessionExists(char *session)
{
char *query;
if(asprintf(&query, "select session from session where session=\"%s\"", session)<0) errabort("bae");
boolean re=mysqlResultAffirmative(query);
free(query);
return re;
}

boolean sessionStatusExists(char *session, int status)
{
if(!sessionExists(session)) return FALSE;
char *query;
if(asprintf(&query, "select statusId from session where session=\"%s\" and statusId=%d", session, status)<0) errabort("bae");
boolean re=mysqlResultAffirmative(query);
free(query);
return re;
}

char *getItemlistfromdb(char *session, int statusId)
{
char *query;
assert(asprintf(&query, "select itemlist from genesetRuntime where session=\"%s\" and statusId=%d", session, statusId)>0);
char *re = mysqlGetOnestring(query);
free(query);
return re;
}



void showRegionSl(struct displayedRegion *dsp)
{
fprintf(stderr, "showRegionSl:\nusedSummaryNumber: %d\nentireLength: %ld\n", dsp->usedSummaryNumber, dsp->entireLength);
struct region *r;
int i = 0;
for(r=dsp->head; r!=NULL; r=r->next)
    fprintf(stderr, "(%d) %s [%d,%d >> %d,%d]\tlen: %d\tsp:%d\n", i++, chrInfo[r->chromIdx]->name, r->bstart,r->dstart, r->dstop,r->bstop, r->dstop-r->dstart, r->summarySize);

fputs("showRegionSl: okay\n",stderr);
}
void showTrackSl(struct track *sl)
{
int i=0;
for(; sl!=NULL; sl=sl->next)
    fprintf(stderr, "track\t%d\t%s\n", ++i, sl->name);
}



/**********************************
         small functions 
 *********************************/

struct beditem *slSort_beditem(struct beditem *sl, int(*compare)(const void *el1, const void *el2))
{
/* the returned list is generated in reverse order
so besure to sort in *reverse* order so as to get *forward* order from returned list
*/
if(sl==NULL) return NULL;
int count=0;
struct beditem *t;
for(t=sl; t!=NULL; t=t->next) count++;
struct beditem **itemArr=malloc(sizeof(struct beditem *)*count);
if(itemArr==NULL)
	{
	fprintf(stderr, "%s: out of mem\n", __FUNCTION__);
	exit(0);
	}
int i=0;
for(t=sl; t!=NULL; t=t->next)
	itemArr[i++]=t;
qsort(itemArr, count, sizeof(struct beditem *), compare);
struct beditem *newsl=NULL;
for(i=0; i<count; i++)
	{
	itemArr[i]->next=newsl;
	newsl=itemArr[i];
	}
free(itemArr);
return newsl;
}

int strMayChrID(char *what)
{
int i = 0;
for(; i<=lastChrIdx; i++)
    {
    if(strcasecmp(chrInfo[i]->name, what) == 0)
        return i;
    }
return -1;
}

int *dissectCoordString(char *item)
{
/* input a string, supposedly "chr:start-stop strand"
return 3-element int array: [chr idx, start, stop]
the value will be -1 to indicate any error in input

strand is optional, convert to:
1: forward
0: reverse
2: n/a, treat as 1 during use

string will be broken
chrom list must be ready before calling
*/
size_t s = strlen(item);
char strand = item[s-1];
char *chr, *start, *stop;
char delim[] = " \t-:";
if((chr=strtok(item, delim)) == NULL)
    return NULL;
if((start=strtok(NULL, delim)) == NULL)
    return NULL;
if((stop=strtok(NULL, delim)) == NULL)
    return NULL;
int *arr = malloc(sizeof(int)*4);
arr[0] = strMayChrID(chr);
if(arr[0]==-1)
	{
	// must not proceed
	arr[1]=arr[2]=-1;
	return arr;
	}
arr[1] = strMayPositiveInt(start);
if(arr[1]==-1 || arr[1]>chrInfo[arr[0]]->length) return NULL;
arr[2] = strMayPositiveInt(stop);
if(arr[2]==-1 || arr[2]>chrInfo[arr[0]]->length || arr[2]<=arr[1]) return NULL;
if(strand=='+' || strand=='-')
    arr[3] = strand=='+' ? 1 : 0;
else
    arr[3] = 2;
return arr;
}



boolean slLookup(void *sl, char *what, boolean caseSensitive)
{
/* caseSensitive: if true will use strcmp, else use strcasecmp
 */
struct slNode *this = (struct slNode *)sl;
for(; this!=NULL; this=this->next)
    {
    if(caseSensitive)
        {
        if(strcmp(this->name, what) == 0)
            return TRUE;
	}
    else
        {
	if(strcasecmp(this->name, what) == 0)
	    return TRUE;
	}
    }
return FALSE;
}

struct slNode *slSearch(void *sl, char *what)
{
struct slNode *this = (struct slNode *)sl;
for(; this!=NULL; this=this->next)
    {
    if(strcmp(this->name, what) == 0)
        return this;
    }
return NULL;
}


char *getDepositePath4url(char *url)
{
char *urlcopy=strdup(url);
char delim[]="/";
char *tok=strtok(urlcopy,delim);
char *deposit_dir=trashDir;
struct stat sbuf;
while(1)
	{
	assert(asprintf(&deposit_dir,"%s/%s",deposit_dir,tok)>0);
	if(stat(deposit_dir,&sbuf)==-1)
		{
		// create new dir
		if(mkdir(deposit_dir,S_IRWXU)!=0)
			{
			fprintf(stderr,"failed to create caching directory\n");
			return NULL;
			}
		}
	tok=strtok(NULL,delim);
	if(tok==NULL)
		break;
	}
return deposit_dir;
}


tabix_t *tabixOpen(char *urlpath, boolean isremote)
{
/* open tabix file and load index!
to be used repeatedly, free after use
*/
tabix_t *fin=ti_open(urlpath,0);
if(fin==0)
	return NULL;
if(!isremote)
	{
	if(ti_lazy_index_load(fin)<0)
		return NULL;
	return fin;
	}
// ready to change dir
char *deposit_dir=getDepositePath4url(urlpath);
char *olddir=getcwd(NULL,0);
if(chdir(deposit_dir)!=0)
	{
	fprintf(stderr, "failed to change to tabix caching dir: %s\n", deposit_dir);
	return NULL;
	}
if(ti_lazy_index_load(fin)<0)
	return NULL;
if(chdir(olddir)!=0)
	{
	fputs("failed to change back dir afterwards\n",stderr);
	return NULL;
	}
return fin;
}

struct readitem *tabixQuery_sam(tabix_t *fin, char *querycoord)
{
/* tabix the sam file
XXX the sam/tabix format is abandoned, use bam instead
*/
int chridx, begin, end;
if(ti_parse_region(fin->idx, querycoord, &chridx, &begin, &end)<0)
	{
	return NULL;
	}
struct readitem *sl=NULL, *read;
ti_iter_t iter=ti_queryi(fin, chridx, begin, end);
const char *row;
char delim[]="\t";
char *tmpstr, *tok;
int len;
while((row=ti_read(fin, iter, &len)) != 0)
	{
	tmpstr=strdup(row);
	/** FIXME memory leak here **/
	if(tmpstr==NULL)
		{
		fprintf(stderr, "%s: mem\n", __FUNCTION__);
		exit(0);
		}
	read=malloc(sizeof(struct readitem));
	// read id
	if((tok=strtok(tmpstr, delim))==NULL) continue;
	read->id=tok;
	// flag
	if((tok=strtok(NULL, delim))==NULL) continue;
	read->flag_str=tok;
	// flag int value is left unassigned
	// chr name
	strtok(NULL,delim);
	// start
	if((tok=strtok(NULL, delim))==NULL) continue;
	if((read->start=strMayPositiveInt(tok))==-1) continue;
	read->start--;
	// mapq
	if((tok=strtok(NULL, delim))==NULL) continue;
	// cigar
	if((tok=strtok(NULL, delim))==NULL) continue;
	read->cigar=NULL; // bam
	read->cigar_str=tok;
	strtok(NULL,delim);
	strtok(NULL,delim);
	strtok(NULL,delim);
	// seq
	if((tok=strtok(NULL, delim))==NULL) continue;
	read->seq=tok;
	read->stop=read->start+strlen(tok);
	// qual
	strtok(NULL,delim);
	// optional alignment, only chop one field
	read->mismatch=NULL;
	while((tok=strtok(NULL,delim))!=NULL)
		{
		if(tok[0]=='M' && tok[1]=='D')
			{
			read->mismatch=tok;
			break;
			}
		}
	read->next=sl;
	sl=read;
	}
ti_iter_destroy(iter);

return sl;
}


static int bam_fetch_func(const bam1_t *b,void *data)
{
if (b->core.tid < 0) return 0;
const bam1_core_t *c = &b->core;

struct readitem *r=malloc(sizeof(struct readitem));
r->cigar_str=NULL; // sam
r->n_cigar=c->n_cigar;
r->cigar=malloc(sizeof(uint32_t)*c->n_cigar);
uint32_t *cigar = bam1_cigar(b);
int i;
for (i=0; i < c->n_cigar; ++i)
	(r->cigar)[i]=cigar[i]; // copy cigar

uint8_t *seq=bam1_seq(b);
r->seq=malloc(sizeof(char)*(c->l_qseq+1));
for(i=0; i<c->l_qseq; i++)
	(r->seq)[i]=bam_nt16_rev_table[bam1_seqi(seq,i)];
(r->seq)[i]='\0';

r->id=strdup(bam1_qname(b));
r->start=c->pos;
r->stop=c->pos+c->l_qseq;
r->flag=c->flag;
r->flag_str=NULL;
uint8_t *m=bam_aux_get(b,"MD");
if(m)
	r->mismatch=strdup((char *)m);
else
	r->mismatch=NULL;
struct userData *udata=(struct userData *)data;
r->next=udata->sl;
udata->sl=r;
return 0;
}

struct readitem *bamQuery_region(samfile_t *fp, bam_index_t *idx, char *coord)
{
// will not fill chromidx
int ref,beg,end;
bam_parse_region(fp->header,coord,&ref,&beg,&end);
if(ref<0)
	return NULL;
struct userData *d=malloc(sizeof(struct userData));
d->sl=NULL;
bam_fetch(fp->x.bam,idx,ref,beg,end,d,bam_fetch_func);
return d->sl;
}

bam_index_t *bam_parseIndex(char *urlpath, int ft)
{
//if(ft==FT_bam_n) return bam_index_load(urlpath);
char *deposit_dir=getDepositePath4url(urlpath);
char *olddir=getcwd(NULL,0);
if(chdir(deposit_dir)!=0)
	{
	fprintf(stderr, "failed to change to bam caching dir: %s\n", deposit_dir);
	return NULL;
	}
bam_index_t *i=bam_index_load(urlpath);
if(chdir(olddir)!=0)
	{
	fputs("failed to change back dir afterwards\n",stderr);
	return NULL;
	}
return i;
}

struct beditem *tabixQuery_bed(tabix_t *fin, char *querycoord, boolean getrestdata)
{
/* only query bed file
generic interval-based query over tabix file
query coord must be in the format of chr1:234-567

the returned list is not sorted, it will be sorted on demand
as different sorting methods will be used,
e.g. sort by start, or stop
*/
int chridx, begin, end;
if(ti_parse_region(fin->idx, querycoord, &chridx, &begin, &end)<0)
	{
	return NULL;
	}
struct beditem *sl=NULL, *bi;
ti_iter_t iter=ti_queryi(fin, chridx, begin, end);
const char *row;
char delim[]="\t";
char *tmpstr, *tok, *rest;
int len;
boolean haveInvalid=FALSE;
while((row=ti_read(fin, iter, &len)) != 0)
	{
	tmpstr=strdup(row);
	if(tmpstr==NULL)
		{
		fprintf(stderr, "%s: mem\n", __FUNCTION__);
		exit(0);
		}
	bi=malloc(sizeof(struct beditem));
	// chr, discard
	if((rest=strchr(tmpstr, '\t'))==NULL)
		{ haveInvalid=TRUE; continue; }
	strtok(tmpstr, delim);
	tmpstr=++rest;
	// start
	if((rest=strchr(tmpstr, '\t'))==NULL)
		{ haveInvalid=TRUE; continue; }
	tok=strtok(tmpstr, delim);
	if((bi->start=strMayPositiveInt(tok))==-1)
		{ haveInvalid=TRUE; continue; }
	tmpstr=++rest;
	// stop
	if((rest=strchr(tmpstr, '\t'))==NULL)
		{ haveInvalid=TRUE; continue; }
	tok=strtok(tmpstr, delim);
	if((bi->stop=strMayPositiveInt(tok))==-1)
		{ haveInvalid=TRUE; continue; }
	// rest
	if(getrestdata)
		{
		bi->rest=++rest;
		}

	bi->next=sl;
	sl=bi;
	}
ti_iter_destroy(iter);

if(haveInvalid)
	fprintf(stderr, "%s: failed to parse certain lines in %s\n", __FUNCTION__, fin->fn);


return sl;
}

double tabixQuery_bedgraph_singlepoint(tabix_t *fin, char *chrom, unsigned int start, unsigned int stop)
{
/* only get one data point, extremely simplified
return data directly
return 0 for any failure
*/
char *tmp;
assert(asprintf(&tmp, "%s:%d-%d", chrom, start, stop)>0);
int chridx, begin, end;
if(ti_parse_region(fin->idx, tmp, &chridx, &begin, &end)<0)
	return 0;
ti_iter_t iter=ti_queryi(fin, chridx, begin, end);
if(iter==0) return 0;
char delim[]="\t";
const char *row;
char *tok;
double sumarea=0, value;
int sumbp=0;
int istart, istop, jstart, jstop, len;
/* in fact, spnum should alway <= bp length, it should never be greater than bp length
*/
while((row=ti_read(fin, iter, &len)) != 0)
	{
	// chr, discard
	tmp=strdup(row);
	strtok(tmp, delim);
	if((tok=strtok(NULL,delim))==NULL) continue;
	if((istart=strMayPositiveInt(tok))==-1) continue;
	if((tok=strtok(NULL,delim))==NULL) continue;
	if((istop=strMayPositiveInt(tok))==-1) continue;
	if((tok=strtok(NULL,delim))==NULL) continue;
	//fprintf(stderr, ">%d %d\n", istart, istop);
	value=strtod(tok, NULL);
	jstart=max(start,istart);
	jstop=min(stop,istop);

	sumarea+=(jstop-jstart)*value;
	sumbp+=(jstop-jstart);
	}
ti_iter_destroy(iter);
if(sumbp==0) return 0;
return sumarea/((double)sumbp);
}

void tabixQuery_bedgraph(tabix_t *fin, char *chrom, unsigned int start, unsigned int stop, int spnum, double *data, int summeth)
{
/* only query bedgraph file
data must be already initialized to NAN
no judging summeth at bplevel
*/
char *tmp;
assert(asprintf(&tmp, "%s:%d-%d", chrom, start, stop)>0);

int chridx, begin, end;
if(ti_parse_region(fin->idx, tmp, &chridx, &begin, &end)<0)
	{
	return;
	}
float step=((float)(stop-start))/spnum;
ti_iter_t iter=ti_queryi(fin, chridx, begin, end);
char delim[]="\t";
const char *row;
char *tok;
int len;
unsigned int i,istart,istop,jstart,jstop;
boolean atbplevel=spnum>=(stop-start);
double value;
double *sumvalue=NULL, *sumbp=NULL;
if(!atbplevel && (summeth==summeth_mean || summeth==summeth_sum))
	{
	if((sumvalue=malloc(sizeof(double)*spnum))==NULL)
		{
		fprintf(stderr, "%s: sumvalue out of mem\n", __FUNCTION__);
		exit(0);
		}
	if((sumbp=malloc(sizeof(double)*spnum))==NULL)
		{
		fprintf(stderr, "%s: sumbp out of mem\n", __FUNCTION__);
		exit(0);
		}
	for(i=0; i<spnum; i++)
		{
		sumvalue[i]=0;
		sumbp[i]=0;
		}
	}
/* in fact, spnum should alway <= bp length, it should never be greater than bp length
*/
double ostart, ostop;
while((row=ti_read(fin, iter, &len)) != 0)
	{
	// chr, discard
	tmp=strdup(row);
	strtok(tmp, delim);
	if((tok=strtok(NULL,delim))==NULL) continue;
	if((istart=strMayPositiveInt(tok))==-1) continue;
	if((tok=strtok(NULL,delim))==NULL) continue;
	if((istop=strMayPositiveInt(tok))==-1) continue;
	if((tok=strtok(NULL,delim))==NULL) continue;
	value=strtod(tok, NULL);
	jstart=max(start,istart);
	jstop=min(stop,istop);

	if(atbplevel)
		{
		for(i=jstart; i<jstop; i++)
			data[i-start]=value;
		}
	else
		{
		// i is summary point idx
		for(i=floor((jstart-start)/step); i<=floor((jstop-start)/step); i++)
			{
			if(i>=spnum) break;

			switch(summeth) {
			case summeth_mean:
			case summeth_sum:
				/* overlap of the bedgraph item with the bin
				*** type cast must be enforced ***/
				ostart=max((double)start+(double)i*step, (double)jstart);
				ostop=min((double)start+(double)(i+1)*step, (double)jstop);
				//if(ostart>=ostop) fprintf(stderr, "%f %f\n", ostart, ostop);
				sumvalue[i]+=value*(ostop-ostart);
				sumbp[i]+=ostop-ostart;
				break;
			case summeth_min:
				if(isnan(data[i]) || data[i]>value)
					data[i]=value;
				break;
			case summeth_max:
				if(isnan(data[i]) || data[i]<value)
					data[i]=value;
				break;
			}
			}
		}
	}
ti_iter_destroy(iter);
if(!atbplevel)
	{
	if(summeth==summeth_mean || summeth==summeth_sum)
		{
		for(i=0; i<spnum; i++)
			{
			if(sumbp[i]>0)
				{
				if(summeth==summeth_mean)
					{
					data[i]=sumvalue[i]/sumbp[i];
					}
				else
					{
					data[i]=sumvalue[i];
					}
				}
			}
		free(sumvalue);
		free(sumbp);
		}
	}
}

void *tabixQuery_regioncoord(tabix_t *fin, int ft, char *chr, unsigned int start, unsigned int stop, boolean getrestdata)
{
char *query;
assert(asprintf(&query, "%s:%d-%d", chr, start, stop)>0);
if(ft==FT_sam_n||ft==FT_sam_c)
	{
	return (void *)tabixQuery_sam(fin, query);
	}
if(ft==FT_bed_n||ft==FT_bed_c||ft==FT_lr_n||ft==FT_lr_c||ft==FT_ld_c||ft==FT_ld_n||ft==FT_anno_n||ft==FT_anno_c||ft==FT_weaver_c||ft==FT_catmat||ft==FT_qcats)
	{
	return (void *)tabixQuery_bed(fin, query, getrestdata);
	}
fprintf(stderr, "%s: ft not supported (%d)\n", __FUNCTION__, ft);
exit(0);
}

void *tabixQuery_region(tabix_t *fin, int ft, struct region *r, boolean getrestdata)
{
return tabixQuery_regioncoord(fin, ft, chrInfo[r->chromIdx]->name, r->dstart, r->dstop, getrestdata);
}

void *tabixQuery_dsp(struct displayedRegion *dsp, struct track *t)
{
/* for positional data
only open file once, handle is used to perform queries over each region in dsp
but in case of bam, use samtools
return an array, length of region #
not sorted
free after use
*/
struct region *r;
int regioncount=0, dataidx=0;
for(r=dsp->head; r!=NULL; r=r->next)
	regioncount++;
void **data;

int ft=t->ft;
if(ft==FT_sam_n||ft==FT_sam_c||ft==FT_bam_n||ft==FT_bam_c)
	{
	data=malloc(sizeof(struct readitem *)*regioncount);
	}
else if(ft==FT_bed_n||ft==FT_bed_c||ft==FT_lr_n||ft==FT_lr_c||ft==FT_ld_c||ft==FT_ld_n||ft==FT_anno_n||ft==FT_anno_c||ft==FT_weaver_c||ft==FT_catmat||ft==FT_qcats)
	{
	data=malloc(sizeof(struct beditem *)*regioncount);
	}
else
	{
	fprintf(stderr, "%s: ft not supported (%d)\n", __FUNCTION__, ft);
	exit(0);
	}
assert(data!=NULL);

tabix_t *fin=NULL;
samfile_t *fp=NULL;
bam_index_t *bamidx=NULL;

if(ft==FT_bam_n || ft==FT_bam_c)
	{
	if((fp=samopen(t->urlpath,"rb",0))==0)
		{
		fprintf(stderr, "bam file error: %s\n", t->urlpath);
		return NULL;
		}
	if((bamidx=bam_parseIndex(t->urlpath,ft))==NULL)
		{
		fprintf(stderr, "bam index file error: %s\n", t->urlpath);
		return NULL;
		}
	}
else
	{
	fin=tabixOpen(t->urlpath, TRUE);
	if(fin==NULL)
		{
		fprintf(stderr, "tabix file error: %s\n", t->urlpath);
		return NULL;
		}
	}

for(r=dsp->head; r!=NULL; r=r->next)
	{
	if(fin!=NULL)
		{
		data[dataidx]=tabixQuery_region(fin, ft, r, TRUE);
		/*
		if(ft==FT_weaver_c)
			{
			data[dataidx]=tabixQuery_region(fin, ft, r, t->weave==2?FALSE:TRUE);
			}
		else
			{
			}
			*/
		}
	else
		{
		char *tmp;
		assert(asprintf(&tmp,"%s:%d-%d",chrInfo[r->chromIdx]->name,r->dstart,r->dstop)>0);
		data[dataidx]=bamQuery_region(fp,bamidx,tmp);
		free(tmp);
		}
	dataidx++;
	}

if(fin!=NULL)
	{
	ti_close(fin);
	}
else
	{
	bam_index_destroy(bamidx);
	samclose(fp);
	}

return data;
}

void tabixFreeResult(struct beditem *sl)
{
// TODO
struct beditem *bi,*prev=NULL;
for(bi=sl; bi!=NULL; bi=bi->next)
	{
	if(prev!=NULL) free(prev);
	prev=bi;
	}
if(prev!=NULL) free(prev);
}


boolean bigwigQuery(char *urlpath, char *chrom, unsigned int start, unsigned int stop, unsigned int spnum, double *data, int summeth)
{
// space alien
// dummy path name conversion
int i;
char *dummyname=strdup(urlpath);
for(i=0; i<strlen(urlpath); i++)
	{
	if(urlpath[i]=='/')
		dummyname[i]='_';
	}
srand(time(0));
int rr=rand();
char *outfile;
assert(asprintf(&outfile, "%s/%s.%d", trashDir, dummyname, rr)>0);
free(dummyname);

char *command;
assert(asprintf(&command, "%s/bwquery %s %s %d %d %d %s %d", BINdir, urlpath, chrom, start, stop, spnum, outfile, summeth)>0);
if(system(command)==-1)
	{
	fprintf(stderr, "cannot run command (%s)\n", command);
	return FALSE;
	}
free(command);

FILE *fin=fopen(outfile,"r");
if(fin==NULL)
	{
	return FALSE;
	}
char *line=malloc(1);
size_t s=0;
char delim[]="\n";
char *tok;
i=0;
while(getline(&line, &s, fin)!=-1)
	{
	assert((tok=strtok(line, delim))!=NULL);
	float v=strtod(tok,NULL);
	data[i++]=v;
	}
fclose(fin);
unlink(outfile);
free(outfile);
return TRUE;
}


double *tabixQuery_bedgraph_dsp(struct displayedRegion *dsp, struct track *tk)
{
/* fetch average data at summary points from bedgraph file, return pointer of array,
   free after use
   accepts bigWig files
   argument is url or path
   won't validate the file, must be done before calling this routine
 */

double *data = malloc(sizeof(double) * dsp->usedSummaryNumber);
int i;
for(i=0; i<dsp->usedSummaryNumber; i++) 
    data[i] = NAN;

if(tk->ft==FT_bigwighmtk_n || tk->ft==FT_bigwighmtk_c)
	{
	/* bigwig */
	struct region *r;
	i=0;
	for(r=dsp->head; r!=NULL; r=r->next)
		{
		if(r->summarySize==0)
			{
			if(SQUAWK)
				fprintf(stderr,"%s: skipped a 0-length region...\n", __FUNCTION__);
			continue;
			}
		if(!bigwigQuery(tk->urlpath, chrInfo[r->chromIdx]->name, r->dstart, r->dstop, r->summarySize, &data[i], tk->summeth))
			{
			return NULL;
			}
		i += r->summarySize;
		}
	return data;
	}

tabix_t *fin=tabixOpen(tk->urlpath, TRUE);
if(fin==NULL)
	{
	return NULL;
	}
i = 0;
struct region *r;
for(r=dsp->head; r!=NULL; r=r->next)
    {
    if(r->summarySize > 0)
        {
		tabixQuery_bedgraph(fin, chrInfo[r->chromIdx]->name, r->dstart, r->dstop, r->summarySize, &data[i], tk->summeth);
		}
    else
        {
		if(SQUAWK)
			fprintf(stderr,"%s: skipped a 0-length region...\n", __FUNCTION__);
		}
    i += r->summarySize;
    }
ti_close(fin);
return data;
}


void tabixQuery_categorical(tabix_t *fin, char *chrom, unsigned int start, unsigned int stop, int spnum, int *data)
{
/* similar as tabixQuery_bedgraph
data must be initialized to be -1 to indicate "no information"
*/
char *tmp;
assert(asprintf(&tmp, "%s:%d-%d", chrom, start, stop)>0);

int chridx, begin, end;
if(ti_parse_region(fin->idx, tmp, &chridx, &begin, &end)<0)
	{
	return;
	}
float step=((float)(stop-start))/spnum;
ti_iter_t iter=ti_queryi(fin, chridx, begin, end);
char delim[]="\t";
const char *row;
char *tok;
int len;
unsigned int i,istart,istop,jstart,jstop;
boolean atbplevel=spnum>=(stop-start);

int value;
/* to properly display categorical data at low resolution
one summary point will need to only show category of max length
use the water-level method to do that...
*/
double plenArr[spnum]; // piece length
for(i=0; i<spnum; i++)
	plenArr[i]=0;

/* in fact, spnum should alway <= bp length, it should never be greater than bp length */
while((row=ti_read(fin, iter, &len)) != 0)
	{
	tmp=strdup(row);
	strtok(tmp, delim); // chr, discard
	if((tok=strtok(NULL,delim))==NULL) continue;
	if((istart=strMayPositiveInt(tok))==-1) continue;
	if((tok=strtok(NULL,delim))==NULL) continue;
	if((istop=strMayPositiveInt(tok))==-1) continue;
	if((tok=strtok(NULL,delim))==NULL) continue;
	if((value=strMayPositiveInt(tok))==-1) continue;
	jstart=max(start,istart);
	jstop=min(stop,istop);

	if(atbplevel)
		{
		for(i=jstart; i<jstop; i++)
			data[i-start]=value;
		}
	else
		{
		// i is summary point idx
		for(i=floor((jstart-start)/step); i<=floor((jstop-start)/step); i++)
			{
			if(i>=spnum) break;
			// compute the actual bp len of this item inside this summary point
			double bpl=min((double)start+(double)(i+1)*step, (double)jstop)-max((double)start+(double)i*step, (double)jstart);
			if(bpl>plenArr[i])
				{
				data[i]=value;
				plenArr[i]=bpl;
				}
			}
		}
	}
ti_iter_destroy(iter);
}

int *tabixQuery_categorical_dsp(struct displayedRegion *dsp, char *urlpath, int ft)
{
/* similar as tabixQuery_bedgraph_dsp
FIXME missing data?
 */
tabix_t *fin=tabixOpen(urlpath, TRUE);
if(fin==NULL)
	{
	fprintf(stderr, "%s(%s) failed\n", __FUNCTION__, urlpath);
	return NULL;
	}
int *data = malloc(sizeof(int) * dsp->usedSummaryNumber);
int i;
for(i=0; i<dsp->usedSummaryNumber; i++) 
    data[i] = -1;
i = 0;
struct region *r;
for(r=dsp->head; r!=NULL; r=r->next)
    {
    if(r->summarySize > 0)
        {
		tabixQuery_categorical(fin, chrInfo[r->chromIdx]->name, r->dstart, r->dstop, r->summarySize, &data[i]);
		}
    else
        {
		if(SQUAWK)
			fprintf(stderr,"%s: skipped a 0-length region...\n", __FUNCTION__);
		}
    i += r->summarySize;
    }
ti_close(fin);
//if(SQUAWK) fprintf(stderr, "%s (%s)\n", __FUNCTION__, urlpath);
return data;
}





/**************************************
            making of dsp
 **************************************/
boolean atbplevel(struct displayedRegion *dsp)
{
return dsp->usedSummaryNumber == dsp->entireLength;
}

struct chritemsl *chritemsl_searchidx(struct displayedRegion *dsp, int chrIdx)
{
struct chritemsl *ci;
for(ci=dsp->chritemsl; ci!=NULL; ci=ci->next)
	{
	if(ci->chromIdx==chrIdx)
		return ci;
	}
return NULL;
}

void chritemslAppend(struct displayedRegion *dsp, int chrIdx, struct beditem *data)
{
// add new node to head of dsp->chritemsl
struct chritemsl *ci = malloc(sizeof(struct chritemsl));
ci->chromIdx = chrIdx;
ci->itemsl = data;
ci->next = dsp->chritemsl;
dsp->chritemsl = ci;
}

void makeBorder(struct displayedRegion *dsp)
{
/* only works for genome or juxtaposition
   not gene set view
   update global variables leftBorder/rightBorder

very inefficient for the case of juxtaposition
need improvement
 */
if(dsp->runmode == RM_genome)
	{
	leftBorder.chromIdx = 0;
	leftBorder.coord = 0;
	rightBorder.chromIdx = lastChrIdx;
	rightBorder.coord = chrInfo[lastChrIdx]->length;
	return;
	}

if(dsp->runmode!=RM_jux_n && dsp->runmode!=RM_jux_c)
	{
	fprintf(stderr, "%s: wrong dsp runmode", __FUNCTION__);
	exit(0);
	}

/* juxtaposition
border are determined by first/last bed items from the list of chromosomes
to find that, all the items from a chr will be fetched to find either one of that
the data shall be cached in dsp->chritemsl in case
the chr will be used again in makeRegionSl_gf()

can we guarantee the sorting of the list generated by tabixQuery? no
the left most item is used for left border
the right most item is used for right border
must explicitly test this by coordinate comparison

always keep itemsl sorted with ascending start

TODO this should be improved by sorted bed list
 */
boolean notfound = TRUE;
struct beditem *itemsl, *slsorted, *it;
for(leftBorder.chromIdx=0; leftBorder.chromIdx<=lastChrIdx; leftBorder.chromIdx++)
	{
	itemsl=tabixQuery_regioncoord(dsp->tabix, dsp->juxtkft, chrInfo[leftBorder.chromIdx]->name, 0, chrInfo[leftBorder.chromIdx]->length,TRUE);
	if(itemsl != NULL)
		{
		slsorted=(struct beditem *)beditemsort_startAsc((struct genericItem *)itemsl);
		/* use the first item in data as left border
		explicitly iterate to find the left most coord
		*/
		leftBorder.coord = slsorted->start;
		notfound = FALSE;
		// store for later use
		chritemslAppend(dsp, leftBorder.chromIdx, slsorted);
		if(SQUAWK)
			fprintf(stderr, "%s: juxtaposition left border - %s %d\n", __FUNCTION__, chrInfo[leftBorder.chromIdx]->name, leftBorder.coord);
		break;
		}
	}
if(notfound==TRUE)
	{
	fprintf(stderr, "%s: left border not found, the tabix file is empty?? %s\n", __FUNCTION__, dsp->tabix->fn);
	exit(0);
	}

// right border
//notfound = TRUE;
struct chritemsl *ci;
for(rightBorder.chromIdx=lastChrIdx; rightBorder.chromIdx>=0; rightBorder.chromIdx--)
	{
	/* dude! beware of such rare case
	when left/right borders are on same chr
	*/
	if((ci=chritemsl_searchidx(dsp, rightBorder.chromIdx))!=NULL)
		{
		slsorted=ci->itemsl;
		assert(slsorted!=NULL);
		}
	else
		{
		itemsl=tabixQuery_regioncoord(dsp->tabix, dsp->juxtkft, chrInfo[rightBorder.chromIdx]->name, 0, chrInfo[rightBorder.chromIdx]->length,TRUE);
		slsorted=(struct beditem *)beditemsort_startAsc((struct genericItem *)itemsl);
		}
	if(slsorted != NULL)
		{
		// explicitly iterate to find right most stop coord
		unsigned int maxstop=0;
		for(it=slsorted; it!=NULL; it=it->next)
			{
			if(maxstop<it->stop)
				maxstop=it->stop;
			}
		rightBorder.coord = maxstop;
		if(SQUAWK)
			fprintf(stderr, "%s: juxtaposition right border - %s %d\n", __FUNCTION__, chrInfo[rightBorder.chromIdx]->name, rightBorder.coord);
		//notfound = FALSE;
		// store for later use
		if(ci==NULL)
			chritemslAppend(dsp, rightBorder.chromIdx, slsorted);
		return;
		}
	}
}

void setDspBoundary(struct displayedRegion *dsp, int startChr, int startCoord, int stopChr, int stopCoord)
{
dsp->start = malloc(sizeof(struct point));
dsp->stop = malloc(sizeof(struct point));
dsp->start->chromIdx = startChr;
dsp->start->coord = startCoord;
dsp->stop->chromIdx = stopChr;
dsp->stop->coord = stopCoord;
if(SQUAWK) fprintf(Squawk, "%s: %s %d %s %d\n", __FUNCTION__, chrInfo[startChr]->name, startCoord, chrInfo[stopChr]->name, stopCoord);
}



void computeEntireLength(struct displayedRegion *dsp)
{
/* region list defined by dsp->head and dsp->tail must be made prior to this
 */
dsp->entireLength = 0;
struct region *r;
for(r=dsp->head; r!=NULL; r=r->next)
    dsp->entireLength += r->dstop - r->dstart;
if(SQUAWK) fprintf(Squawk, "\tentire length computed: %ld...\n", dsp->entireLength);
}

void computeEntireLength_itemlist(struct displayedRegion *dsp)
{
// curbed by dsp->head and dsp->tail, tell tail by item name
dsp->entireLength = 0;
struct region *r;
for(r=dsp->head; ; r=r->next) 
    {
    dsp->entireLength += r->dstop - r->dstart;
    if(strcmp(r->name, dsp->tail->name) == 0) 
        break;
    }
if(SQUAWK) fprintf(Squawk, "entire length computed: %ld...\n", dsp->entireLength);
}
void computeSummarySize_bplevel(struct displayedRegion *dsp)
{
struct region *r;
dsp->usedSummaryNumber = dsp->entireLength;
for(r=dsp->head; r!=NULL; r=r->next)
    r->summarySize = r->dstop - r->dstart;
dsp->atbplevel = TRUE; // just in case
}

boolean trycomputeSummarySize_bplevel(struct displayedRegion *dsp, int spnum)
{
/* spnum: expected ceiling of summary points, usually hmSpan or 3*hmSpan?

   computeEntireLength must have been called before this
   if at bp level: 
      summary size will equal to seq length
      return true
   else:
      return false
 */
dsp->atbplevel = FALSE; // just in case
if(dsp->entireLength <= spnum)
    {
    dsp->atbplevel = TRUE;
    computeSummarySize_bplevel(dsp);
    }
return dsp->atbplevel;
}
boolean trycomputeSummarySize_bplevel_itemlist(struct displayedRegion *dsp, int spnum)
{
/* special case for trycomputeSummarySize_bplevel, need to use dsp->tail->name to terminate loop
 */
if(dsp->entireLength <= spnum)
    {
    dsp->atbplevel = TRUE;
    dsp->usedSummaryNumber = dsp->entireLength;
    struct region *r;
    for(r=dsp->head; ; r=r->next)
        {
        r->summarySize = r->dstop - r->dstart;
	if(strcmp(r->name, dsp->tail->name) == 0)
            return TRUE;
	}
    }
dsp->atbplevel = FALSE;
return FALSE;
}
void computeSummarySize(struct displayedRegion *dsp, int totalSP)
{
/* run after computeEntireLength()
   roll over regions starting from dsp->head, compute its summary size
   keep track of how many summary points have been used
   which is curbed by totalSP
   when that's going to be exhausted, truncate displayed region

   region's summary size is proportional to its length of entire length
 */
if(SQUAWK) fprintf(stderr, "\tcomputing summary size (might truncate dsp) expected %d...\n", totalSP);

if(trycomputeSummarySize_bplevel(dsp, totalSP))
    return;

dsp->usedSummaryNumber = 0;
struct region *r;
double sf=(double)totalSP/((double)dsp->entireLength); // sp per bp
for(r=dsp->head; r!=NULL; r=r->next)
	{
	int remainingSize = totalSP - dsp->usedSummaryNumber;
	int thisRegionSize = ceil((double)(r->dstop - r->dstart)*sf);
	if(thisRegionSize < remainingSize) // no equals...
		{
		r->summarySize = thisRegionSize;
		dsp->usedSummaryNumber += thisRegionSize;
		}
	else
		{
		if(SQUAWK)
			fprintf(stderr, "\ttotal # of summarySize exhausted (expecting %d, %d left)...\n", thisRegionSize, remainingSize);
		r->summarySize = remainingSize;
		int newbpwidth=ceil(remainingSize/sf);
		r->dstop=min(r->dstart+newbpwidth,r->dstop);
		dsp->usedSummaryNumber += remainingSize;
		/* must reset r->dstop !!!
		*/
		break;
		}
	}
// check if there's still regions in the list
if(r->next != NULL)
	{
	// truncate, reset stop point, recalculate entire length
	r->next = NULL;
	dsp->tail = r;
	if(SQUAWK)
		fprintf(stderr, "\tdisplayed region truncated to (%s:%d)...\n", chrInfo[r->chromIdx]->name, r->dstop);
	computeEntireLength(dsp);
	}
if(SQUAWK) fprintf(Squawk, "\tsummary size computed, %d used in total...\n", dsp->usedSummaryNumber);
}

void computeSummarySize_itemlist(struct displayedRegion *dsp)
{
/* ** special treatment for itemlist **

   must run computeEntireLength_itemlist() before this

   only do for items between head/tail

   hmSpan will be expected amount of total SP
   but be intelligent, if this is too little, increase to an reasonable amount
 */

if(trycomputeSummarySize_bplevel_itemlist(dsp, hmSpan))
    return;

// find smallest region
struct region *r;
int minRegionLen = dsp->head->dstop - dsp->head->dstart;
for(r=dsp->head->next; ; r=r->next)
    {
    if(r == NULL) break;
    if(strcmp(r->name, dsp->tail->name) == 0)
        break;
    int this = r->dstop - r->dstart;
    if(this < minRegionLen)
        minRegionLen = this;
    }

//fprintf(stderr, "min length: %d\n", minRegionLen);

// count number of items, there will be 1px spacing between two items
int itemcount=0;
for(r=dsp->head; r!=NULL; r=r->next) itemcount++;

// divide entireLength by such smallest region length, decide totalSP in this way
int totalSP;
float spfloat = (float)dsp->entireLength / minRegionLen;
if(spfloat < hmSpan)
    totalSP = hmSpan;
else
    totalSP = ceil(spfloat);
/*
else if(spfloat > hmSpan*3)
    totalSP = hmSpan * 3;
	*/

totalSP-=itemcount+1;

if(SQUAWK) fprintf(Squawk, "\tcomputing summary size (no truncation addup) expected %d...\n", totalSP);

dsp->usedSummaryNumber = 0;

for(r=dsp->head; ; r=r->next)
    {
    int thisRegionSize = max(1,floor(((float)(r->dstop-r->dstart)/dsp->entireLength)*totalSP));
    r->summarySize = thisRegionSize;
    dsp->usedSummaryNumber += thisRegionSize;
    if(strcmp(r->name, dsp->tail->name) == 0)
        break;
    }
if(SQUAWK) fprintf(Squawk, "\tsummary size computed, %d used in total...\n", dsp->usedSummaryNumber);
}





void makeRegionSl_genome(struct displayedRegion *dsp)
{
/* setDspBoundary() must be run prior to this
   make list of regions between dsp->head and dsp->tail, 
   one region for each chromosome
 */
struct point *start = dsp->start, *stop = dsp->stop;
assert(start->chromIdx <= stop->chromIdx);
int i;
for(i=start->chromIdx; i<=stop->chromIdx; i++)
	{
	struct region *r = malloc(sizeof(struct region));
	r->bstart = 0;
	r->bstop = chrInfo[i]->length;
	r->dstart = (i==start->chromIdx) ? start->coord : r->bstart;
	r->dstop = (i==stop->chromIdx) ? stop->coord : r->bstop;
	r->isViewStart = FALSE;
	if(r->dstart == r->dstop)
		{ // omit zero-length region
		free(r);
		continue;
		}
	r->chromIdx = i;
	dspAddRegionTail(dsp, r);
	}
if(SQUAWK) fprintf(Squawk, "chromSl made...\n");
}


int requestRegionAddTail(struct displayedRegion *dsp, struct beditem *itemsl, int chrIdx, unsigned int lookstopcoord, int regionNumLimit)
{
/* only called by makeRegionSl_gf()
itemsl must have already been sorted by ascending start coord

lookstopcoord: 0 means no curb

request new regions from raw item data from chromosome query, as prepared by makeChritemsl()
region means a continuous segment connected by bed items
# of regions will be capped by given number
return # of regions added
new region will be added to tail of dsp region list

works on one chr for each call
 */

assert(itemsl!=NULL);
if(regionNumLimit<=0) return 0;

// first bed item
int rstart = itemsl->start;
int rstop = itemsl->stop;
if(lookstopcoord>0 && rstart>=lookstopcoord) return 0;
int count = 0;
struct region *r;
struct beditem *t;
for(t=itemsl->next; t!=NULL; t=t->next)
    {
    // merge bed items when they overlap or are head-tail connected
	if(lookstopcoord>0)
		{
		if(t->start >= lookstopcoord)
			break;
		}
    if(rstop >= t->start)
		{
        rstop = (t->stop > rstop) ? t->stop : rstop;
		}
    else
		{
		/* current item is outside of existing range
		yield new region with existing range */
        r = malloc(sizeof(struct region));
		r->bstart = r->dstart = rstart;
		r->bstop = r->dstop = rstop;
		r->chromIdx = chrIdx;
		r->isViewStart = FALSE;
		dspAddRegionTail(dsp, r);
		count++;
		if(count == regionNumLimit) return count;
		// range initiated with current item
		rstart = t->start;
		rstop = t->stop;
		}
    }
// itemsl exhausted, make one last region
r = malloc(sizeof(struct region));
r->bstart = r->dstart = rstart;
r->bstop = r->dstop = rstop;
r->chromIdx = chrIdx;
r->isViewStart = FALSE;
dspAddRegionTail(dsp, r);
count++;
return count;
}

void makeChritemsl(struct displayedRegion *dsp)
{
/* separated from makeRegionSl_gf() to reduce indent level

find bed items covered by given boundary
if there's anything within boundaries, fill them in dsp->chritemsl
won't change dsp->start, dsp->stop

keep itemsl sorted by ascending start
*/

// try to make chritemsl object for all chromosomes between dsp->start/stop
int i = dsp->start->chromIdx;
boolean foundsth=FALSE;
struct beditem *itemsl, *slsorted;
for(; i<=dsp->stop->chromIdx; i++)
    {
	if(chritemsl_searchidx(dsp, i)!=NULL)
		{
		foundsth=TRUE;
		continue;
		}
	itemsl=tabixQuery_regioncoord(dsp->tabix, dsp->juxtkft, chrInfo[i]->name, 0, chrInfo[i]->length,TRUE);
	if(itemsl!=NULL)
		{
		slsorted=(struct beditem *)beditemsort_startAsc((struct genericItem *)itemsl);
		chritemslAppend(dsp, i, slsorted);
		foundsth=TRUE;
		}
	else
		{
		// got nothing from this query
		if(i==dsp->start->chromIdx && i==dsp->stop->chromIdx)
			{
			/* start/stop points are both within this chr
			not good, need to search remaining of this chr
			*/
			itemsl=tabixQuery_regioncoord(dsp->tabix, dsp->juxtkft, chrInfo[i]->name, dsp->stop->coord, chrInfo[i]->length,TRUE);
			if(itemsl!=NULL)
				{
				slsorted=(struct beditem *)beditemsort_startAsc((struct genericItem *)itemsl);
				chritemslAppend(dsp, i, slsorted);
				foundsth=TRUE;
				}
			}
		}
	}

if(foundsth) return;

/*  haven't found anything with above queries
need to seek to chrs behind stop point and issue additional queries
but won't go to chrs before start point, as makeBorder() has already filled things there...
quit upon finding anything...
*/
for(i=dsp->stop->chromIdx+1; i<=lastChrIdx; i++)
	{
	if(chritemsl_searchidx(dsp, i)!=NULL) return;
	itemsl=tabixQuery_regioncoord(dsp->tabix, dsp->juxtkft, chrInfo[i]->name, 0, chrInfo[i]->length,TRUE);
	if(itemsl!=NULL)
		{
		slsorted=(struct beditem *)beditemsort_startAsc((struct genericItem *)itemsl);
		chritemslAppend(dsp, i, slsorted);
		return;
		}
	}
/* it probably doesn't matter if execution would go here
as something must already been made in makeBorder()
*/
}

void makeRegionSl_gf(struct displayedRegion *dsp)
{
/* setDspBoundary() must be called prior to this
   first make dsp->chritemsl
   then determine dsp region by dsp->chritemsl
   curb region # by hmSpan
 */
if(SQUAWK)
    fputs("makeRegionSl_gf:\n", Squawk);

makeChritemsl(dsp);

struct chritemsl *ci;

if(SQUAWK)
    {
	// turn it off after debugging
	fputs("\tshow dsp->chritemsl ...\n", stderr);
	for(ci=dsp->chritemsl; ci!=NULL; ci=ci->next)
		fprintf(Squawk, "\t\t%s %d bed items\n", chrInfo[ci->chromIdx]->name, slCount2(ci->itemsl));
	fputs("\tdsp->chritemsl over\n", stderr);
    }

/*  will generate dsp regions based on chr raw data
try to exhaust bed data between dsp start/stop chromosomes
*/
int chrIdx;
int totalRegionAdded=0;
struct beditem *item;
for(chrIdx=dsp->start->chromIdx; chrIdx<=dsp->stop->chromIdx; chrIdx++)
	{
	if((ci=chritemsl_searchidx(dsp, chrIdx))!=NULL)
		{
		/* if the chr is dsp start/stop chr,
		need to curb the looking item by start/stop coord!!
		*/
		item=ci->itemsl;
		if(chrIdx==dsp->start->chromIdx)
			{
			for(; item!=NULL; item=item->next)
				{
				if(item->stop>dsp->start->coord)
					break;
				}
			}
		if(item==NULL) continue;
		unsigned int lookstopcoord= chrIdx==dsp->stop->chromIdx ? dsp->stop->coord : 0;

		totalRegionAdded += requestRegionAddTail(dsp, item, chrIdx, lookstopcoord, hmSpan-totalRegionAdded);
		if(totalRegionAdded >= hmSpan) break;
		}
	}
if(totalRegionAdded>0)
	{
	if(SQUAWK)
		fprintf(stderr, "\t%d regions generated between dsp start/stop\n", totalRegionAdded);
	}
else
	{
	/* no regions generated between dsp start/stop points
	look to the chrs on the right of dsp->stop
	*/
	for(chrIdx=dsp->stop->chromIdx+1; chrIdx<=lastChrIdx; chrIdx++)
		{
		if((ci=chritemsl_searchidx(dsp, chrIdx))!=NULL)
			{
			totalRegionAdded += requestRegionAddTail(dsp, ci->itemsl, chrIdx, 0, hmSpan-totalRegionAdded);
			if(totalRegionAdded >= hmSpan) break;
			}
		}
	if(totalRegionAdded==0)
		{
		/* still no regions added, start from the very first chr */
		for(chrIdx=0; chrIdx<=lastChrIdx; chrIdx++)
			{
			if((ci=chritemsl_searchidx(dsp, chrIdx))!=NULL)
				{
				totalRegionAdded += requestRegionAddTail(dsp, ci->itemsl, chrIdx, 0, hmSpan-totalRegionAdded);
				if(totalRegionAdded >= hmSpan) break;
				}
			}
		}
	}

 
/****** FIXME ******
   requestRegionAddTail() will set dstart/dstop same as bstart/bstop
   but for cases like drawing decor in juxtaposition mode
   dsp head/tail might have different dstart/dstop according to CGI param,

   if dsp->start is within dsp->head, reset head->dstart using start->coord,
   if dsp->stop is within dsp->tail, reset tail->dstop using stop->coord
   
   is this reliable??
 *******************/
if((dsp->start->chromIdx == dsp->head->chromIdx) &&
   (dsp->start->coord >= dsp->head->bstart) &&
   (dsp->start->coord <= dsp->head->bstop))
    {
    if(SQUAWK) fputs("\treset dsp->head->dstart using dsp->start->coord\n", Squawk);
    dsp->head->dstart = dsp->start->coord;
    }
if((dsp->stop->chromIdx == dsp->tail->chromIdx) &&
   (dsp->stop->coord >= dsp->tail->bstart) &&
   (dsp->stop->coord <= dsp->tail->bstop))
    {
    if(SQUAWK) fputs("\treset dsp->tail->dstop using dsp->stop->coord\n", Squawk);
    dsp->tail->dstop = dsp->stop->coord;
    }
if(SQUAWK) 
    {
    int i=0;
    struct region *r;
    for(r=dsp->head; r!=NULL; r=r->next) i++;
    fprintf(Squawk, "\tregionLst made, %d in total...\n", i);
    }
}



void extendRegionDstart(struct region *r, double spsize, int *spnum, boolean atbplevel)
{
/* extend region's dstart to left by trying fit in a number of summary points
   region's attributes must be initialized:
   - summarySize
   - bstart
   - dstart
 */
if(r->dstart <= r->bstart) return;
if(*spnum == 0) return;

int dist = (int)(spsize * *spnum); // dist to move in bp
if(atbplevel)
	{
	int this = r->dstart - r->bstart; // available bp
	if(this >= dist)
		{
		r->summarySize += *spnum;
		r->dstart -= dist;
		*spnum = 0;
		}
	else
		{
		r->dstart = r->bstart;
		r->summarySize += (int)(this/spsize);
		*spnum -= (int)(this/spsize);
		}
	return;
	}
double this = (r->dstart - r->bstart) / spsize;
if(this >= *spnum)
	{
	r->summarySize += *spnum;
	r->dstart -= dist;
	*spnum = 0;
	}
else
	{
	r->dstart = r->bstart;
	r->summarySize += ceil(this);
	*spnum -= ceil(this);
	}
}

void extendRegionDstop(struct region *r, double spsize, int *spnum, boolean atbplevel)
{
/* extend region's dstop to right by trying to region's attributes must be initialized:
   - summarySize
   - bstop
   - dstop
 */
if(r->dstop >= r->bstop) return;
if(*spnum == 0) return;

int dist = (int)(spsize * *spnum); // dist to move in bp
if(atbplevel)
	{
	int this = r->bstop - r->dstop;
	if(this >= dist)
		{
		r->summarySize += *spnum;
		r->dstop += dist;
		*spnum = 0;
		}
	else
		{
		r->dstop = r->bstop;
		r->summarySize += (int)(this/spsize);
		*spnum -= (int)(this/spsize);
		}
	return;
	}
double this = (r->bstop - r->dstop) / spsize;
if(this >= *spnum)
	{
	r->summarySize += *spnum;
	r->dstop += dist;
	*spnum = 0;
	}
else
	{
	r->dstop = r->bstop;
	r->summarySize += ceil(this);
	*spnum -= ceil(this);
	}
}



long moveBoundary_genome(struct displayedRegion *dsp, char side, long distance, int *spnum, double spsize)
{
if(SQUAWK)
    fprintf(stderr, "moveBoundary_genome distance: %ld spnum: %d spsize: %f\n", distance, *spnum, spsize);
/* move a point along genome, out side of existing list, 
   always need to extend/add new regions to list

   args:
       side: 'l' for moving dsp->head to left
             'r' for moving dsp->tail to right
       distance: distance in bp to be moved
       spnum: expected number of summary points to allocate
       spsize: # bp each summary point spans

   return 0 when all distance moved successfully
   else if hit border, return remaining distance not moved
 */
int oldpos;
while(distance > 0)
	{
	if(side == 'l')
		{
		struct region *head = dsp->head;
		oldpos = head->dstart;
		extendRegionDstart(head, spsize, spnum, dsp->atbplevel);
		distance -= oldpos - head->dstart;
		if(distance <= 0) // is this possible??
			return 0;
		if(*spnum == 0)
			return distance;
		if(head->chromIdx == leftBorder.chromIdx) // hit left border
			return distance;
		// not hitting left border, step into one chromosome on left...
		struct region *r = malloc(sizeof(struct region));
		r->chromIdx = head->chromIdx-1;
		r->bstart = 0;
		r->bstop = chrInfo[r->chromIdx]->length;
		r->dstart = r->dstop = r->bstop;
		r->summarySize = 0;
		r->isViewStart = FALSE;
		dspAddRegionHead(dsp, r);
		}
	else
		{
		struct region *tail = dsp->tail;
		oldpos = tail->dstop;
		extendRegionDstop(tail, spsize, spnum, dsp->atbplevel);
		distance -= tail->dstop - oldpos;
		if(distance <= 0)
			return 0;
		if(*spnum == 0)
			return distance;
		if(tail->chromIdx == rightBorder.chromIdx) // hit right border
			return distance;
		// not hitting right border, step into one chromosome on right...
		struct region *r = malloc(sizeof(struct region));
		r->chromIdx = tail->chromIdx +1;
		r->bstart=r->dstart=r->dstop= 0;
		r->bstop = chrInfo[r->chromIdx]->length;
		r->summarySize = 0;
		r->isViewStart = FALSE;
		dspAddRegionTail(dsp, r);
		}
	}
return 0;
}




struct region *newRegionFromBeditem(int chrIdx, struct beditem *item)
{
// dstart/dstop will be unspecified!!
struct region *r = malloc(sizeof(struct region));
r->chromIdx = chrIdx;
r->bstop = item->stop;
r->bstart = item->start;
r->summarySize = 0;
r->isViewStart = FALSE;
return r;
}





void moveBoundary_gf_left(struct displayedRegion *dsp, long distance, int spnum)
{
/* juxtaposition
dsp region list must already have summary size computed
allowed moving distance and summary point number given

cached chr itemsl will be used, but will be sorted by stop coord!
 */
struct region *hRegion = dsp->head;
if(SQUAWK) fprintf(Squawk, "\tmoveBoundary_gf_left: from %s:%d to left by (%ld, %d)...\n", chrInfo[hRegion->chromIdx]->name, hRegion->dstart, distance, spnum);

double spsize = (double)distance / spnum;

// remaining distance in head region
extendRegionDstart(hRegion, spsize, &spnum, dsp->atbplevel);
if(spnum <= 0) return;

// fetch new bed items on left in *same chr* as head region
fprintf(stderr, "looking for %d...\n", hRegion->chromIdx);
struct chritemsl *ci=chritemsl_searchidx(dsp, hRegion->chromIdx);
assert(ci!=NULL); // believe it can never be null
// sort by descending stop coord
struct beditem *itemsl=(struct beditem *)beditemsort_stopDsc((struct genericItem *)ci->itemsl);
// replace existing record
ci->itemsl=itemsl;
struct beditem *item;

/* try extending current head with overlaping bed items */
for(item=itemsl; item!=NULL; item=item->next)
	{
	if(item->stop >= hRegion->bstart)
		{
		if(item->start < hRegion->bstart)
			{
			// head bstart extendable with new item
			hRegion->bstart = item->start;
			}
		}
	else
		{
		// new item beyond head, stop
		break;
		}
	}
extendRegionDstart(hRegion, spsize, &spnum, dsp->atbplevel);
if(spnum <= 0) return;

if(item != NULL)
	{
	/* form new regions using remaining bed items in this chromosome 
	will append to head
	*/
	struct region *r = newRegionFromBeditem(hRegion->chromIdx, item);
	r->dstart = r->dstop = r->bstop; // set displayed portion as zero length
	// extend this region
	for(item=item->next; item!=NULL; item=item->next)
		{
		if(item->stop >= r->bstart)
			{
			if(item->start < r->bstart) // extend current region
				r->bstart = item->start;
			}
		else
			{
			// current region stops
			extendRegionDstart(r, spsize, &spnum, dsp->atbplevel);
			dspAddRegionHead(dsp, r);
			if(spnum <= 0) return;

			// if the program continues, create another region, initiate using current bed item
			r = newRegionFromBeditem(hRegion->chromIdx, item);
			r->dstart = r->dstop = r->bstop;
			}
		}
	extendRegionDstart(r, spsize, &spnum, dsp->atbplevel);
	dspAddRegionHead(dsp, r);
	if(spnum <= 0) return;
	}

/* looping through remaining chromosomes on left of h->chromIdx
   form new regions,
   add to head
 */
int chrIdx = hRegion->chromIdx -1;
//fputs("entering while loop...\n", stderr);
while(chrIdx >= 0)
    {
	itemsl=NULL;
	if((ci=chritemsl_searchidx(dsp, chrIdx))!=NULL)
		{
		itemsl=(struct beditem *)beditemsort_stopDsc((struct genericItem *)ci->itemsl);
		ci->itemsl=itemsl;
		}
	else
		{
		struct beditem *sl2=tabixQuery_regioncoord(dsp->tabix, dsp->juxtkft, chrInfo[chrIdx]->name, 0, chrInfo[chrIdx]->length,TRUE);
		if(sl2!=NULL)
			{
			itemsl=(struct beditem *)beditemsort_stopDsc((struct genericItem *)sl2);
			chritemslAppend(dsp, chrIdx, itemsl);
			}
		}
    if(itemsl == NULL)
        {
        chrIdx--;
        continue;
		}

    // received data for this chr, repeat above practice
	item=itemsl;
    struct region *r = newRegionFromBeditem(chrIdx, item);
    r->dstart = r->dstop = r->bstop;
    for(item=item->next; item!=NULL; item=item->next)
        {
		if(item->stop >= r->bstart)
			{
			if(item->start < r->bstart)
				r->bstart = item->start;
			}
		else
			{
			extendRegionDstart(r, spsize, &spnum, dsp->atbplevel);
			dspAddRegionHead(dsp, r);
			if(spnum <= 0) return;
			r = newRegionFromBeditem(chrIdx, item);
			r->dstart = r->dstop = r->bstop;
			}
		}
    extendRegionDstart(r, spsize, &spnum, dsp->atbplevel);
    dspAddRegionHead(dsp, r);
    if(spnum <= 0) return;
    chrIdx--;
    }
}



void moveBoundary_gf_right(struct displayedRegion *dsp, long distance, int spnum) 
{
/* growing on right
must re-sort all itemsl as it might have been modified in moveBoundary_gf_left()
*/
struct region *tRegion = dsp->tail;
if(SQUAWK) fprintf(Squawk, "\tmoveBoundary_gf_right: from %s:%d to right by (%ld, %d)...\n", chrInfo[tRegion->chromIdx]->name, tRegion->dstop, distance, spnum);

double spsize = (double)distance / spnum;

extendRegionDstop(tRegion, spsize, &spnum, dsp->atbplevel);
if(spnum <= 0) return;

// look for new bed items on right in tail chromosome
struct chritemsl *ci=chritemsl_searchidx(dsp, tRegion->chromIdx);
assert(ci!=NULL);
struct beditem *itemsl=(struct beditem *)beditemsort_startAsc((struct genericItem *)ci->itemsl);
struct beditem *item;
ci->itemsl=itemsl;
/* try extending tail with overlaping bed items */
for(item=itemsl; item!=NULL; item=item->next)
	{
	if(item->start <= tRegion->bstop)
		{
		if(item->stop > tRegion->bstop)
			{
			// tail extendable by this item
			tRegion->bstop = item->stop;
			}
		}
	else
		{
		// item beyond tail, stop
		break;
		}
	}
extendRegionDstop(tRegion, spsize, &spnum, dsp->atbplevel);
if(spnum <= 0) return;

if(item != NULL)
	{
	/* form new regions using remaining bed items in this chromosome */
	struct region *r = newRegionFromBeditem(tRegion->chromIdx, item);
	r->dstart = r->dstop = r->bstart;
	for(item=item->next; item!=NULL; item=item->next)
		{
		if(item->start <= r->bstop)
			{
			if(item->stop > r->bstop)
				r->bstop = item->stop;
			}
		else
			{
			// current region stops
			extendRegionDstop(r, spsize, &spnum, dsp->atbplevel);
			dspAddRegionTail(dsp, r);
			if(spnum <= 0) return;
			
			// if program continues, make new region
			r = newRegionFromBeditem(tRegion->chromIdx, item);
				r->dstart = r->dstop = r->bstart;
			}
		}
		extendRegionDstop(r, spsize, &spnum, dsp->atbplevel);
		dspAddRegionTail(dsp, r);
		if(spnum <= 0) return;
	}

/* looping through remaining chromosomes on right of tRegion->chromIdx
   form new regions,
   add to tail
 */
int chrIdx = tRegion->chromIdx +1;
while(chrIdx <= lastChrIdx)
    {
	itemsl=NULL;
	if((ci=chritemsl_searchidx(dsp, chrIdx))!=NULL)
		{
		itemsl=(struct beditem *)beditemsort_startAsc((struct genericItem *)ci->itemsl);
		ci->itemsl=itemsl;
		}
	else
		{
		struct beditem *sl2=tabixQuery_regioncoord(dsp->tabix, dsp->juxtkft, chrInfo[chrIdx]->name, 0, chrInfo[chrIdx]->length,TRUE);
		if(sl2!=NULL)
			{
			itemsl=(struct beditem *)beditemsort_startAsc((struct genericItem *)sl2);
			chritemslAppend(dsp, chrIdx, sl2);
			}
		}
    if(itemsl == NULL)
        {
		chrIdx++;
		continue;
		}
	item=itemsl;
    struct region *r = newRegionFromBeditem(chrIdx, item);
    r->dstart = r->dstop = r->bstart;
    for(item=item->next; item!=NULL; item=item->next)
        {
		if(item->start <= r->bstop)
			{
			if(item->stop > r->bstop)
				r->bstop = item->stop;
			}
		else
			{
			extendRegionDstop(r, spsize, &spnum, dsp->atbplevel);
			dspAddRegionTail(dsp, r);
			if(spnum <= 0) return;
			r = newRegionFromBeditem(chrIdx, item);
				r->dstart = r->dstop = r->bstart;
			}
        }
    extendRegionDstop(r, spsize, &spnum, dsp->atbplevel);
    dspAddRegionTail(dsp, r);
    if(spnum <= 0) return;
    chrIdx++;
    }
}


void computeUsedSummaryNumber(struct displayedRegion *dsp)
{
struct region *r;
dsp->usedSummaryNumber = 0;
for(r=dsp->head; r!=NULL; r=r->next)
    dsp->usedSummaryNumber += r->summarySize;
}

void finalizeDsp_gf(struct displayedRegion *dsp)
{
/* call this after running setDspBoundary()
   trigger_move will not come to this step, only others will

          |--left wing--|========DSP========|--right wing--|

   DSP will have hmSpan number of summary points,
   # of summary points for left/right wing will be given by their
   length proportional to dsp.entireLength

   make expansion to wing regions:
   - make regions (head/tail) if it's not there yet
   - compute entire length for DSP
   - seek left boundary to left by entireLength
   - compute left wing # of summary points (leftSPnum)
   - set dspStart
   - seek right boundary to right by entireLength
   - compute right wing # of summary points (rightSPnum)
   - recompute entire length for expanded DSP
   - recompute summary size for expanded DSP using (leftSPnum+hmSpan+rightSPnum)
 */
if(SQUAWK) fputs("finalizeDsp_gf()...\n", Squawk);
if(dsp->head == NULL)
    {
    if(dsp->tail == NULL)
        makeRegionSl_gf(dsp);
    else
        errabort("dsp->head is null but dsp->tail is NOT NULL");
    }
// set all rest regions as NOT being VIEW START
struct region *r;
for(r=dsp->head->next; r!=NULL; r=r->next)
    r->isViewStart = FALSE;
// and all the *wing* regions will be set as similar

// dsp->head is view start
dsp->head->isViewStart = TRUE;
dsp->head->viewStartCoord = dsp->head->dstart;

/* in order to get resolution size, first compute summary size of existing region list
   then use this resolution size to compute spnum for left/right wings
 */
computeEntireLength(dsp);
computeSummarySize(dsp, hmSpan);


// to remember if it should be at bp level, do special things after making wings...

moveBoundary_gf_left(dsp, dsp->entireLength, dsp->usedSummaryNumber);
moveBoundary_gf_right(dsp, dsp->entireLength, dsp->usedSummaryNumber);

computeEntireLength(dsp);

if(dsp->atbplevel)
    {
    // reassign summary size for each region using region seq length
    computeSummarySize_bplevel(dsp);
    }
else
    {
    computeUsedSummaryNumber(dsp);
    }
}




void finalizeDsp_genome(struct displayedRegion *dsp)
{
if(SQUAWK) fputs("finalizeDsp_genome()...\n", Squawk);
if(dsp->head == NULL)
    {
    if(dsp->tail == NULL)
        makeRegionSl_genome(dsp);
    else
        errabort("dsp->head is null but dsp->tail is NOT NULL");
    }
// set all rest regions as NOT being VIEW START
struct region *r;
for(r=dsp->head; r!=NULL; r=r->next)
    r->isViewStart = FALSE;
// and all the *wing* regions will be set as similar

// dsp->head is view start
dsp->head->isViewStart = TRUE;
dsp->head->viewStartCoord = dsp->head->dstart;

computeEntireLength(dsp);

if(trycomputeSummarySize_bplevel(dsp, hmSpan))
    {
    computeUsedSummaryNumber(dsp);
    if(SQUAWK) fputs("\tnow at bp level\n", stderr);
    int a = dsp->usedSummaryNumber;
    moveBoundary_genome(dsp, 'l', dsp->entireLength, &a, 1);
    a = dsp->usedSummaryNumber;
    moveBoundary_genome(dsp, 'r', dsp->entireLength, &a, 1);
    computeUsedSummaryNumber(dsp);
    return;
    }

// assign hmSpan points to current dsp
computeSummarySize(dsp, hmSpan);


double sf = ((double)dsp->entireLength / dsp->usedSummaryNumber);

int spn = hmSpan;
moveBoundary_genome(dsp, 'l', dsp->entireLength, &spn, sf);
spn = hmSpan;
moveBoundary_genome(dsp, 'r', dsp->entireLength, &spn, sf);
computeEntireLength(dsp);
computeUsedSummaryNumber(dsp);
}




/**********************************
         move/zoom
 **********************************/

boolean dspAtLeftBorder(struct displayedRegion *dsp)
{
/* if at left border, return TRUE
   if downstream of left border, return FALSE
   else, squawk and die
 */
if(dsp->head->chromIdx > leftBorder.chromIdx)
    return FALSE;
if(dsp->head->chromIdx == leftBorder.chromIdx)
    {
    if(dsp->head->dstart == leftBorder.coord)
        return TRUE;
    if(dsp->head->dstart > leftBorder.coord)
        return FALSE;
    errabort("dsp left boundary beyond left border");
    }
errabort("dsp left boundary beyond left border");
return FALSE; // merely not to let compiler complain
}


boolean dspAtRightBorder(struct displayedRegion *dsp)
{
if(dsp->tail->chromIdx < rightBorder.chromIdx)
    return FALSE;
if(dsp->tail->chromIdx == rightBorder.chromIdx)
    {
    if(dsp->tail->dstop == rightBorder.coord)
        return TRUE;
    if(dsp->tail->dstop < rightBorder.coord)
        return FALSE;
    errabort("dsp right boundary beyond right border");
    }
errabort("dsp right boundary beyond right border");
return FALSE; // merely...
}


long moveBoundary_list_which(struct displayedRegion *dsp, char which, char side, long distance)
{
/* same code for genome/gf 

   args:
      which: h/t telling if it's head or tail that moves
      side: l/r to which side

   ** sort out the logic carefully ***
   move boundary within list of regions defined by dsp->head and dsp->tail
   and look at dstart/dstop of each region
   direction: 'l' for moving point to left, 'r' to right

   return current point
 */
if(which!='h' && which!='t') errabort("moveBoundary_list_which: which must be h/t");
if(side!='l' && side!='r') errabort("moveBoundary_list_which: side must be l/r");
if(SQUAWK) fprintf(stderr, "\tmoveBoundary_list_which: which (%c) side (%c) dist (%ld)\n", which, side, distance);
struct region *glider;
if(which == 'h')
    {
    // moving head, only modify dstart
    glider = dsp->head;
    if(side == 'r')
        { // shrink
        while(distance > 0)
            {
	    int movableDist = glider->bstop - glider->dstart;
	    if(distance < movableDist)
	        {
	        glider->dstart += distance;
	        distance = 0;
	        break;
	        }
	    distance -= movableDist;
	    glider->dstart = glider->bstop;
	    if(glider->next == NULL) break;
	    glider = glider->next;
	    glider->dstart = glider->bstart;
            }
	}
    else
        { // expand
	while(distance > 0)
	    {
	    int movableDist = glider->dstart - glider->bstart;
	    if(distance < movableDist)
	        {
	        glider->dstart -= distance;
	        distance = 0;
	        break;
	        }
	    distance -= movableDist;
	    glider->dstart = glider->bstart;
	    if(glider->prev == NULL) break;
	    glider = glider->prev;
	    glider->dstart = glider->dstop = glider->bstop; // enforced
            }
        }
    dsp->head = glider;
    }
else
    {
    // moving tail, only modify dstop
    glider = dsp->tail;
    if(side == 'r')
        { // expand
        while(distance > 0)
            {
	    int movableDist = glider->bstop - glider->dstop;
	    if(distance < movableDist)
	        {
	        glider->dstop += distance;
	        distance = 0;
	        break;
	        }
	    distance -= movableDist;
	    glider->dstop = glider->bstop;
	    if(glider->next == NULL) break;
	    glider = glider->next;
	    glider->dstop = glider->dstart = glider->bstart; // enforced
            }
	}
    else
        { // shrink
        while(distance > 0)
	    {
	    int movableDist = glider->dstop - glider->bstart;
	    if(distance < movableDist)
	        {
	        glider->dstop -= distance;
	        distance = 0;
	        break;
	        }
	    distance -= movableDist;
	    glider->dstop = glider->bstart;
	    if(glider->prev == NULL) break;
	    glider = glider->prev;
	    glider->dstop = glider->bstop; // enforced
            }
        }
    dsp->tail = glider;
    }
return distance;
}

void moveBoundary_list(struct displayedRegion *dsp, char side, long distance)
{
// wrapper of moveBoundary_list_which
if(side!='l' && side!='r') errabort("moveBoundary_list: side must be l/r");
if(side == 'l') // move head to right
    moveBoundary_list_which(dsp, 'h', 'r', distance);
else // move tail to left
    moveBoundary_list_which(dsp, 't', 'l', distance);
}





/***********************
   ITEMlist-specific functions
 **********************/
void genesetRuntime_insert(char *session, int statusId, char *itemlist)
{
char *query;
if(asprintf(&query, "delete from genesetRuntime where session='%s' and statusId=%d", session, statusId)<0) errabort("bae");
mysqlUpdate(query);
free(query);
if(asprintf(&query, "insert into genesetRuntime values('%s', %d, '%s')", session, statusId, itemlist)<0) errabort("bae");
mysqlUpdate(query);
free(query);
}
int itemlistsort_lenAsc(const void *a, const void *b)
{
// item length, ascending
const struct region *aa = (const struct region *)a;
const struct region *bb = (const struct region *)b;
int alen = aa->bstop - aa->bstart;
int blen = bb->bstop - bb->bstart;
return (alen > blen) - (alen < blen);
}
int itemlistsort_lenDesc(const void *a, const void *b)
{
// item length, descending
const struct region *aa = (const struct region *)a;
const struct region *bb = (const struct region *)b;
int alen = aa->bstop - aa->bstart;
int blen = bb->bstop - bb->bstart;
return (alen < blen) - (alen > blen);
}
int itemlistsort_tkmeanAsc(const void *a, const void *b)
{
// average track score, ascending
const struct region *aa = (const struct region *)a;
const struct region *bb = (const struct region *)b;
if(isnan(aa->fvalue))
	{
	if(isnan(bb->fvalue))
		return 0;
	return -1;
	}
if(isnan(bb->fvalue)) return 1;
return (aa->fvalue > bb->fvalue) - (aa->fvalue < bb->fvalue);
}
int itemlistsort_tkmeanDesc(const void *a, const void *b)
{
// average track score, descending
const struct region *aa = (const struct region *)a;
const struct region *bb = (const struct region *)b;
if(isnan(aa->fvalue))
	{
	if(isnan(bb->fvalue))
		return 0;
	return 1;
	}
if(isnan(bb->fvalue)) return -1;
return (aa->fvalue < bb->fvalue) - (aa->fvalue > bb->fvalue);
}
int itemlistsort_coord(const void *a, const void *b)
{
// item length, coordinate
const struct region *aa = (const struct region *)a;
const struct region *bb = (const struct region *)b;
if(aa->chromIdx != bb->chromIdx)
    return (aa->chromIdx > bb->chromIdx) - (aa->chromIdx < bb->chromIdx);
if(aa->bstart != bb->bstart)
    return (aa->bstart > bb->bstart) - (aa->bstart < bb->bstart);
return (aa->bstop > bb->bstop) - (aa->bstop < bb->bstop);
}
int getChromIdxByItemname(struct displayedRegion *dsp, char *itemname)
{
// regionSL must have been made
struct region *r;
for(r=dsp->head; r!=NULL; r=r->next)
    {
    if(strcmp(r->name, itemname) == 0)
        return r->chromIdx;
    }
errabort("getChromIdxByItemname: item name not found in regionSL");
return -1;
}
void trimRegionSl_itemlist(struct displayedRegion *dsp, char *startItem, int startCoord, char *stopItem, int stopCoord)
{
/* regionSl between dsp->head/tail must be made
   and will seek for boundary inside this list
 */
struct region *r;
boolean headmissing=TRUE, tailmissing=TRUE;
for(r=dsp->head; r!=NULL; r=r->next)
    {
    if(strcmp(r->name, startItem) == 0)
        {
		r->dstart = startCoord;
		dsp->head = r;
		headmissing = FALSE;
		}
    if(strcmp(r->name, stopItem) == 0)
        {
		r->dstop = stopCoord;
		dsp->tail = r;
		tailmissing = FALSE;
		break;
		}
    }
if(headmissing)
	{
	fprintf(stderr, "trimRegionSl_itemlist: head (%s) not found\n", startItem);
	exit(0);
	}
if(tailmissing)
	{
	fprintf(stderr, "trimRegionSl_itemlist: tail (%s) not found\n", stopItem);
	exit(0);
	}
if(SQUAWK) fprintf(Squawk, "trimRegionSl_itemlist: head (%s) tail (%s)...\n", dsp->head->name, dsp->tail->name);
}

boolean dspRestoreByCleanItemlist(struct displayedRegion *dsp, char *session, int statusId)
{
/* itemlist is what's stored in collateitemlist.itemlist, must be clean and safe,
use it to restore dsp, will make regionSl for all items, and might be modified later on
upon error, return FALSE

name,chridx,start,stop,5fstart,5fstop,3fstart,3fstop,strand,isgene

this is complete item list
*/
char *savedString = getItemlistfromdb(session, statusId);
if(savedString == NULL)
    return FALSE;
char delim[] = ",";
struct region *r;
char *tok = strtok(savedString, delim);
assert(tok!=NULL);
while(tok != NULL)
    {
    r = malloc(sizeof(struct region));
	r->name=strdup(tok);
    assert((tok=strtok(NULL, delim))!=NULL);
    assert((r->chromIdx=strMayPositiveInt(tok))!=-1);
    assert((tok=strtok(NULL, delim))!=NULL);
    assert((r->bstart=r->dstart=strMayPositiveInt(tok))!=-1);
    assert((tok=strtok(NULL, delim))!=NULL);
    assert((r->bstop=r->dstop=strMayPositiveInt(tok))!=-1);
	// following values could be -1 for no flanking
    assert((tok=strtok(NULL, delim))!=NULL);
    r->flank5start=strMayPositiveInt(tok);
    assert((tok=strtok(NULL, delim))!=NULL);
    r->flank5stop=strMayPositiveInt(tok);
    assert((tok=strtok(NULL, delim))!=NULL);
    r->flank3start=strMayPositiveInt(tok);
    assert((tok=strtok(NULL, delim))!=NULL);
    r->flank3stop=strMayPositiveInt(tok);
    r->isViewStart = FALSE;
    assert((tok=strtok(NULL, delim))!=NULL);
	r->strand=tok[0];
    assert((tok=strtok(NULL, delim))!=NULL);
	r->flag=tok[0]=='1';
    dspAddRegionTail(dsp, r);
    tok = strtok(NULL, delim);
    }
return TRUE;
}

void makeDspWing_itemlist(struct displayedRegion *dsp)
{
/* do this after dsp->head/tail are made
   first flip head->isViewStart

   make wings by summary size
 */
if(SQUAWK) fputs("makeDspWing_itemlist()...\n", stderr);
dsp->head->isViewStart = TRUE;
dsp->head->viewStartCoord = dsp->head->dstart;
computeEntireLength_itemlist(dsp);

if(trycomputeSummarySize_bplevel_itemlist(dsp, hmSpan))
    {
    moveBoundary_list_which(dsp, 'h', 'l', dsp->entireLength);
    moveBoundary_list_which(dsp, 't', 'r', dsp->entireLength);
    dsp->head->prev = NULL;
    dsp->tail->next = NULL;
    computeEntireLength(dsp);
    computeSummarySize_bplevel(dsp);
    return;
    }
    
computeSummarySize_itemlist(dsp);

float spsize = (float)dsp->entireLength / dsp->usedSummaryNumber;
int spnum = hmSpan;
struct region *r;

// seek to left to make left wing
r = dsp->head;
extendRegionDstart(r, spsize, &spnum, dsp->atbplevel);
if(spnum > 0)
    {
    r = r->prev;
    while(r != NULL)
        {
	r->summarySize = 0;
	r->dstart = r->dstop = r->bstop;
	extendRegionDstart(r, spsize, &spnum, dsp->atbplevel);
	dsp->head = r;
	if(spnum <= 0)
	    break;
	r = r->prev;
	}
    }
dsp->head->prev = NULL;

// seek to right to make right wing
r = dsp->tail;
spnum = hmSpan;
extendRegionDstop(r, spsize, &spnum, dsp->atbplevel);
if(spnum > 0)
    {
    r = r->next;
    while(r != NULL)
        {
	r->summarySize = 0;
	r->dstart = r->dstop = r->bstart;
	extendRegionDstop(r, spsize, &spnum, dsp->atbplevel);
	dsp->tail = r;
	if(spnum <= 0)
	    break;
	r = r->next;
	}
    }
dsp->tail->next = NULL;

computeEntireLength(dsp);

dsp->usedSummaryNumber = 0;
for(r=dsp->head; r!=NULL; r=r->next)
    dsp->usedSummaryNumber += r->summarySize;
}





/********************************
      draw decor tracks
      apply to both genome/gf mode
 *******************************/

void parseTrackParam(char *param, int ft, struct track **sl)
{
char delim[] = ",";
struct track *tt;
char *tok = strtok(param, delim);
while(tok != NULL)
    {
	tt=malloc(sizeof(struct track));
	tt->ft=ft;
	tt->data=NULL;
	tt->label=NULL;
	switch(ft)
		{
		case FT_bed_n:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		case FT_bed_c:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		case FT_bedgraph_n:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->summeth=strMayPositiveInt(tok))!=-1);
			break;
		case FT_bedgraph_c:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->summeth=strMayPositiveInt(tok))!=-1);
			break;
		case FT_bam_n:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim))!=NULL);
			assert((tt->mode = strMayPositiveInt(tok))!=-1);
			break;
		case FT_bam_c:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		case FT_weaver_c:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=tok;
			tt->mode=M_full;
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->weave=strMayPositiveInt(tok))!=-1);
			break;
		case FT_lr_n:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=tok;
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->pscore = strtod(tok, NULL);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->nscore = strtod(tok, NULL);
			break;
		case FT_lr_c:
			tt->name = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode = strMayPositiveInt(tok))!=-1);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->pscore = strtod(tok, NULL);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->nscore = strtod(tok, NULL);
			break;
		case FT_cat_n:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=tok;
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		case FT_cat_c:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		case FT_bigwighmtk_n:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=tok;
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->summeth=strMayPositiveInt(tok))!=-1);
			break;
		case FT_bigwighmtk_c:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->summeth=strMayPositiveInt(tok))!=-1);
			break;
		case FT_ld_c:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			tt->mode=M_trihm;
			break;
		case FT_ld_n:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=tok;
			tt->mode=M_trihm;
			break;
		case FT_catmat:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		case FT_qcats:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		case FT_anno_c:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->label = strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		case FT_anno_n:
			tt->name=strdup(tok);
			assert((tok=strtok(NULL,delim)) != NULL);
			tt->urlpath=tok;
			assert((tok=strtok(NULL,delim)) != NULL);
			assert((tt->mode=strMayPositiveInt(tok))!=-1);
			break;
		default:
			fprintf(stderr, "%s: unknown ft %d\n", __FUNCTION__, ft);
			exit(0);
		}
    tt->next = *sl;
    *sl = tt;
    tok = strtok(NULL, delim);
    }
}

void parseParamHtest(struct track *tracksl)
{
int grpnum = cgiInt("htestgrpnum");
char *tok; char delim[] = ",";
char *param;
struct track *track;
int i;
for(i=1; i<=grpnum; i++)
    {
    if(asprintf(&param, "htestgrp%d", i)<0) errabort("bae");
    tok = strtok(cgiString(param), delim); assert(tok!=NULL);
    while(tok != NULL)
	{
	for(track=tracksl; track!=NULL; track=track->next)
	    {
	    if(strcmp(track->name, tok)==0)
		{
		track->gid = i;
		break;
		}
	    }
	tok = strtok(NULL, delim);
	}
    }
}






void genestruct2json(struct gene *g)
{
// TODO make obsolete
if(g==NULL) return;
printf("struct:{");
if(g->utr5width+g->utr3width>0)
	{
	printf("thin:[");
	if(g->utr5width>0)
		{
		printf("[%d,%d],",g->utr5start,g->utr5start+g->utr5width);
		}
	if(g->utr3width>0)
		{
		printf("[%d,%d],",g->utr3start,g->utr3start+g->utr3width);
		}
	printf("],");
	}
printf("thick:[");
int i=0;
for(; i<g->exoncount; i++)
	{
	printf("[%d,%d],", (g->exons)[i][0],(g->exons)[i][1]);
	}
printf("]},");
}


long getScaffoldLength(char *name)
{
/* TODO use bsearch
to overcome speed issue when there's 80000 scaffolds
*/
char *query;
assert(asprintf(&query, "select childLength from scaffoldInfo where child='%s'", name)>0);
long len = mysqlGetPositiveInteger(query);
free(query);
return len;
}


void scaffoldAddnew(char *name)
{
/* runtime adding new scaffold into chrInfo and runtime table,
   not reviving!
   lucky we are dealing with a bunch of global variables...
 */
// make new and extended chrInfo array
if(SQUAWK)
    fprintf(stderr, "scaffoldAddnew() adding %s...\n", name);
lastChrIdx++;
struct chrInfoNode **new = malloc(sizeof(struct chrInfoNode *) * (lastChrIdx+1));
int i = 0;
for(; i<lastChrIdx; i++)
    {
    new[i] = malloc(sizeof(struct chrInfoNode));
    new[i]->name = strdup(chrInfo[i]->name);
    new[i]->length = chrInfo[i]->length;
    }
new[lastChrIdx] = malloc(sizeof(struct chrInfoNode));
new[lastChrIdx]->name = strdup(name);
new[lastChrIdx]->length = getScaffoldLength(name);
assert(new[lastChrIdx]->length != -1);
free(chrInfo);
chrInfo = new;
if(SQUAWK)
    fputs("chrInfo extended\n", stderr);
// update runtime table
char *query;
if(asprintf(&query, "select names from scaffoldRuntime where session='%s' and statusId=%d", session, statusId)<0) errabort("bae");
char *tmp = mysqlGetOnestring(query);
free(query);
if(asprintf(&query, "update scaffoldRuntime set count=%d,names='%s%s,%u,' where session='%s' and statusId=%d", lastChrIdx+1, tmp, chrInfo[lastChrIdx]->name, chrInfo[lastChrIdx]->length, session, statusId)<0) errabort("bae");
mysqlUpdate(query);
free(query);
}





char *jsmn_chunk(char *str,jsmntok_t tok)
{
char *ss=malloc(sizeof(char)*(tok.end-tok.start+1));
int i;
for(i=tok.start; i<tok.end; i++) {
	ss[i-tok.start]=str[i];
}
ss[i-tok.start]='\0';
return ss;
}


struct gene *makeGene(char *chrom,int txstart,int txstop,char *name,char *jsontext, struct geneParam *gparam)
{
/* drawback
cannot print newscaffold here
*/
struct gene *gene=malloc(sizeof(struct gene));
gene->chrom=strdup(chrom);
gene->chromIdx=-1;
gene->txstart=gene->report_start=txstart;
gene->txstop=gene->report_stop=txstop;
gene->on_normalchr=slLookup(normalchr_sl,chrom,FALSE);
gene->flank5start=gene->flank5stop=gene->flank3start=gene->flank3stop=-1;
gene->utr5start=gene->utr3start=-1;
gene->utr5width=gene->utr3width=0;
gene->exoncount=0;
gene->exons=NULL;
gene->strand='+';
if(gparam->have_name)
	{
	gene->name=strdup(name);
	}
if(gparam->use_chromid)
	{
	gene->chromIdx=strMayChrID(chrom);
	if(gene->chromIdx==-1)
		{
		scaffoldAddnew(chrom);
		gene->chromIdx=lastChrIdx;
		}
	}
if(gparam->parse_json)
	{
	gene->jsontext=NULL;
	int tokencount=0;
	int i,j, isthick=0, isthin=0, isstrand=0, isname=0, b;
	int *a;
	char *tmp;
	jsmn_parser parser;
	while(1)
		{
		tokencount+=50;
		jsmntok_t tokens[tokencount];
		for(i=0; i<tokencount; i++) {
			tokens[i].type=-1;
		}
		jsmn_init(&parser);
		if(jsmn_parse(&parser,jsontext,tokens,tokencount)==JSMN_ERROR_NOMEM) continue;
		// done parsing
		i=0;
		while(i<tokencount) {
			jsmntok_t t2=tokens[i];
			switch(t2.type)
			{
			case -1:
				i=tokencount;
				break;
			case JSMN_OBJECT:
				i++;
				break;
			case JSMN_ARRAY:
				if(isthick)
					{
					if(t2.size<=0)
						{
						if(SQUAWK) fprintf(stderr,"(thick array size is 0) %s\n", jsontext);
						isthick=0;
						break;
						}
					gene->exoncount=t2.size;
					gene->exons=malloc(sizeof(int *)*t2.size);
					for(j=0; j<t2.size; j++)
						{
						i++;
						jsmntok_t t3=tokens[i];
						if(t3.type!=JSMN_ARRAY || t3.size!=2)
							{
							if(SQUAWK) fprintf(stderr,"(thick element error): %s\n", jsontext);
							gene->exoncount--;
							continue;
							}
						a=malloc(sizeof(int)*2);
						a[0]=strMayPositiveInt(jsmn_chunk(jsontext,tokens[++i]));
						a[1]=strMayPositiveInt(jsmn_chunk(jsontext,tokens[++i]));
						if(a[0]<0||a[1]<0)
							{
							if(SQUAWK) fprintf(stderr,"(thick wrong coord) %s\n",jsontext);
							gene->exoncount--;
							free(a);
							continue;
							}
						(gene->exons)[j]=a;
						}
					isthick=0;
					} 
				else if(isthin)
					{
					if(t2.size<=0)
						{
						if(SQUAWK) fprintf(stderr,"(thin array size is 0) %s\n", jsontext);
						isthin=0;
						break;
						}
					jsmntok_t t3=tokens[++i];
					if(t3.type!=JSMN_ARRAY||t3.size!=2)
						{
						if(SQUAWK) fprintf(stderr,"(1st thin ele error) %s\n", jsontext);
						}
					else
						{
						assert((gene->utr5start=strMayPositiveInt(jsmn_chunk(jsontext,tokens[++i])))>0);
						assert((b=strMayPositiveInt(jsmn_chunk(jsontext,tokens[++i])))>0);
						gene->utr5width=b-gene->utr5start;
						}
					if(t2.size==2)
						{
						t3=tokens[++i];
						if(t3.type!=JSMN_ARRAY||t3.size!=2)
							{
							if(SQUAWK) fprintf(stderr,"(2nd thin ele error) %s\n", jsontext);
							}
						else
							{
							assert((gene->utr3start=strMayPositiveInt(jsmn_chunk(jsontext,tokens[++i])))>0);
							assert((b=strMayPositiveInt(jsmn_chunk(jsontext,tokens[++i])))>0);
							gene->utr3width=b-gene->utr3start;
							}
						}
					isthin=0;
					}
				else
					{
					i+=t2.size;
					}
				break;
			case JSMN_STRING:
				if(isstrand) {
					gene->strand=jsontext[t2.start];
					isstrand=0;
				} else if(isname) {
					gene->name=jsmn_chunk(jsontext,t2);
					isname=0;
				}
				i++;
				break;
			case JSMN_PRIMITIVE:
				// unquoted key
				tmp=jsmn_chunk(jsontext,t2);
				if(strcmp(tmp,"strand")==0) {
					isstrand=1;
				} else if(strcmp(tmp,"thick")==0) {
					isthick=1;
				} else if(strcmp(tmp,"thin")==0) {
					isthin=1;
				} else if(strcmp(tmp,"name")==0) {
					isname=1;
				}
				i++;
				break;
			}
		}
		break;
		}
	if(gene->strand=='-')
		{
		int x=gene->txstop;
		gene->txstop=gene->txstart;
		gene->txstart=x;
		}
	// need to validate utr coords, 5utr always got filled
	if(gene->strand=='+')
		{
		if(gene->utr5width>0 && gene->utr5start>gene->txstart)
			{
			int x=gene->utr3start,y=gene->utr3width;
			gene->utr3start=gene->utr5start;
			gene->utr3width=gene->utr5width;
			gene->utr5start=x;
			gene->utr5width=y;
			}
		}
	else
		{
		if(gene->utr5width>0 && gene->utr5start+gene->utr5width<gene->txstart)
			{
			int x=gene->utr3start,y=gene->utr3width;
			gene->utr3start=gene->utr5start;
			gene->utr3width=gene->utr5width;
			gene->utr5start=x;
			gene->utr5width=y;
			}
		}
	//fprintf(stderr,"jsmn %s\n",gene->name);
	}
else
	{
	gene->jsontext=jsontext;
	}
gene->next=NULL;
return gene;
}




void tabixQuery_regiondensity(tabix_t *fin, samfile_t *fp, bam_index_t *bamidx, int ft, struct region *r, double *data)
{
/* fetch bed items for a region and compute density
only deal with coord, so use generic item
*/
double startArr[r->summarySize], stopArr[r->summarySize];
int i;
double pieceLength = (double)(r->dstop-r->dstart) / (double)(r->summarySize);
for(i=0; i<r->summarySize; i++)
	{
	startArr[i] = r->dstart + pieceLength*i;
	stopArr[i] = r->dstart + pieceLength*(i+1);
	}

struct genericItem *itemsl, *item;
if(fin!=NULL)
	itemsl=(struct genericItem *)tabixQuery_region(fin, ft, r, FALSE);
else
	{
	char *tmp;
	assert(asprintf(&tmp,"%s:%d-%d",chrInfo[r->chromIdx]->name,r->dstart,r->dstop)>0);
	itemsl=(struct genericItem *)bamQuery_region(fp,bamidx,tmp);
	free(tmp);
	}

for(item=itemsl; item!=NULL; item=item->next)
	{
	// collapse this bed item onto the density counter
	for(i=0; i<r->summarySize; i++)
		{
		if(item->start > stopArr[i]) continue;
		if(item->stop < startArr[i]) break;
		if(max(item->start,startArr[i]) < min(item->stop,stopArr[i])) data[i]++;
		}
	}
// TODO free
}





void brokenbeads_add(char *name, char *url, int ft)
{
struct track *t=malloc(sizeof(struct track));
t->name=name?strdup(name):NULL;
t->urlpath=url?strdup(url):NULL;
t->ft=ft;
t->next=brokenbeads;
brokenbeads=t;
}


void brokenbeads_print()
{
if(brokenbeads==NULL) return;
printf("brokenbeads:[");
struct track *t;
for(t=brokenbeads; t!=NULL; t=t->next)
	{
	printf("{");
	if(t->name)
		{
		printf("name:\"%s\",", t->name);
		}
	if(t->urlpath)
		{
		printf("url:\"%s\",", t->urlpath);
		}
	if(t->ft!=FT_nottk)
		{
		printf("ft:%d,",t->ft);
		}
	printf("},");
	}
printf("],");
}





void printJsonDecor(struct displayedRegion *dsp, struct track *tt)
{
/* crappy wrapper for decor processing routines
   takes one decor track, handles it according to its mode and file type
   expandable to support other file types and modes
 */
if(tt->mode==M_den)
    {
	struct region *r;
	int i;

	tabix_t *fin=NULL;
	samfile_t *fp=NULL;
	bam_index_t *bamidx=NULL;

	if(tt->ft==FT_bam_n||tt->ft==FT_bam_c)
		{
		if((fp=samopen(tt->urlpath,"rb",0))==0)
			{
			brokenbeads_add(tt->name, tt->urlpath, tt->ft);
			return;
			}
		if((bamidx=bam_parseIndex(tt->urlpath,tt->ft))==NULL)
			{
			brokenbeads_add(tt->name, tt->urlpath, tt->ft);
			return;
			}
		}
	else
		{
		fin=tabixOpen(tt->urlpath,TRUE);
		if(fin==NULL)
			{
			brokenbeads_add(tt->name, tt->urlpath, tt->ft);
			return;
			}
		}

	printf("{name:\"%s\", ft:%d, mode:%d,", tt->name, tt->ft, tt->mode);
	if(tt->ft==FT_lr_c||tt->ft==FT_bed_c||tt->ft==FT_anno_c||tt->ft==FT_ld_c||tt->ft==FT_bam_c)
		{
		printf("label:\"%s\", url:\"%s\",",tt->label,tt->urlpath);
		}
	printf("data:[");
	for(r=dsp->head; r!=NULL; r=r->next)
		{
		double *data = malloc(sizeof(double)*r->summarySize);
		for(i=0; i<r->summarySize; i++) 
			{
			data[i] = 0;
			}
		tabixQuery_regiondensity(fin, fp, bamidx, tt->ft, r, data);
		printf("[");
		for(i=0; i<r->summarySize; i++)
			{
			printf("%d,", (int)data[i]);
			}
		printf("],");
		free(data);
		}
	printf("]},");
	if(fin!=NULL)
		{
		ti_close(fin);
		}
	else
		{
		bam_index_destroy(bamidx);
		samclose(fp);
		}
    return;
    }

if(tt->ft==FT_lr_n||tt->ft==FT_lr_c)
	{
	// TODO need to integrate to hammock
	/* will apply region filtering when dsp->dspFilter is not null
	will only fetch items whose mate is within the region list
	to restrict the amount of retrieved data with hi-c tracks

	difference with 
	- always apply score cutoff
	- no stacking, for arc or trihm mode
	- may apply within region filtering
	set a global variable to tell how many items are skipped
	*/
	struct beditem **data=(struct beditem **)tabixQuery_dsp(dsp, tt);
	if(data==NULL)
		{
		brokenbeads_add(tt->name, tt->urlpath, tt->ft);
		return;
		}
	char delim[] = "\t";
	char delim2[] = ",";
	struct beditem *item;
	int dataidx=0; // array idx of data corresponding to region

	printf("{name:\"%s\", ft:%d, mode:%d,", tt->name, tt->ft, tt->mode);
	if(tt->ft==FT_lr_c)
		{
		printf("label:\"%s\", url:\"%s\",",tt->label,tt->urlpath);
		printf("pfilterscore:%f, nfilterscore:%f,", tt->pscore, tt->nscore);
		}
	printf("data:[");

	struct region *r;
	struct nnode *fi;
	boolean outsidedspfilter;

	boolean applyDspFilter=dsp->dspFilter!=NULL;

	char *name, *id, *strand; // to be used at each bed item
	for(r=dsp->head; r!=NULL; r=r->next)
		{
		printf("[");
		for(item=data[dataidx]; item!=NULL; item=item->next)
			{
			if((name=strtok(item->rest,delim))==NULL) continue;
			if(strcmp(name, ".")==0) continue;
			if((id=strtok(NULL,delim))==NULL) continue;
			strand=strtok(NULL,delim);

			// apply score cutoff
			char *namec = strdup(name);
			char *matecoordstr = strtok(namec, delim2);
			if(matecoordstr==NULL) continue;
			char *tmp = strtok(NULL, delim2);
			if(tmp==NULL) continue; // supposed to be the score
			float thisscore = strtod(tmp, NULL);

			if(thisscore >= 0)
				{
				if(thisscore<tt->pscore) continue;
				}
			else
				{
				if(thisscore>tt->nscore) continue;
				}

			if(applyDspFilter)
				{
				int *matecoord = dissectCoordString(matecoordstr);
				/* 2013/2/16 forgot to check if this function returns NULL ended up errors, blast it...
				TODO should use chrom name, not idx
				*/
				if(matecoord==NULL || matecoord[0]==-1 || matecoord[1]==-1 || matecoord[2]==-1) continue;
				outsidedspfilter=TRUE;
				for(fi=dsp->dspFilter; fi!=NULL; fi=fi->next)
					{
					if(matecoord[0]==fi->chrIdx && (max(matecoord[1],fi->start)<=min(matecoord[2],fi->stop)))
						{
						outsidedspfilter=FALSE;
						break;
						}
					}
				free(matecoord);
				if(outsidedspfilter)
					{
					//__skipped_num++;
					continue;
					}
				}

			printf("{id:%s,", id);
			if(name != NULL)
				{
				printf("name:'%s',", name);
				}
			if(strand != NULL)
				{
				printf("strand:'%c',", strand[0]=='+'?'>':(strand[0]=='-'?'<':strand[0]));
				}
			printf("start:%d,stop:%d},",item->start,item->stop);
			}
		dataidx++;
		printf("],");
		}
	printf("]},");
	free(data);
   	return;
	}

if(tt->ft==FT_bed_n||tt->ft==FT_bed_c||tt->ft==FT_bam_n||tt->ft==FT_bam_c||tt->ft==FT_anno_n||tt->ft==FT_anno_c||tt->ft==FT_ld_n||tt->ft==FT_ld_c||tt->ft==FT_weaver_c||tt->ft==FT_catmat||tt->ft==FT_qcats)
	{
	/* bed, bam, hammock, weaver, ld, catmat
	TODO bed goes obsolete
	*/
	struct genericItem **data=(struct genericItem **)tabixQuery_dsp(dsp, tt);
	if(data==NULL)
		{
		brokenbeads_add(tt->name, tt->urlpath, tt->ft);
		return;
		}
	struct genericItem *item;
	/* no max stack limit for LD, or simply give it a large number
	*/
	int stackNumber= MaxStack * ((tt->ft==FT_ld_n||tt->ft==FT_ld_c)?100:1);
		
	int stackIdx;
	int stack[stackNumber];
	char delim[] = "\t";
	int skipCount=0;

	printf("{name:\"%s\", ft:%d, mode:%d,", tt->name, tt->ft, tt->mode);
	if(tt->ft==FT_bed_c||tt->ft==FT_bam_c||tt->ft==FT_anno_c||tt->ft==FT_ld_c||tt->ft==FT_weaver_c||tt->ft==FT_catmat||tt->ft==FT_qcats)
		{
		printf("label:\"%s\", url:\"%s\",",tt->label,tt->urlpath);
		}
	printf("data:[");

	boolean is_bam=(tt->ft==FT_bam_n||tt->ft==FT_bam_c);
	boolean is_bed=(tt->ft==FT_bed_n||tt->ft==FT_bed_c);

	int dataidx=0;

	char *name=NULL, *id=NULL, *strand=NULL; // fields from old bed
	struct region *r;
	for(r=dsp->head; r!=NULL; r=r->next)
		{
		// stacking using item coordinate, so do separately for each region
		for(stackIdx=0; stackIdx<stackNumber; stackIdx++)
			{
			stack[stackIdx] = 0; // will be item coordinate
			}
		printf("[");
		struct genericItem *itemsl=beditemsort_startAsc(data[dataidx]);
		for(item=itemsl; item!=NULL; item=item->next)
			{
			if(is_bed)
				{
				/** is bed item, 
				TODO old bed format, make it obsolete
				**/
				// chop up item->rest
				struct beditem *item2=(struct beditem *)item;
				if((name=strtok(item2->rest,delim))==NULL) continue;
				if((id=strtok(NULL,delim))==NULL) continue;
				strand=strtok(NULL,delim);
				// done chopping
				if(strcmp(name, ".") == 0) name = NULL;
				}

			// stacking
			boolean notStacked = TRUE;
			for(stackIdx=0; stackIdx<stackNumber; stackIdx++)
				{
				if(stack[stackIdx] <= item->start)
					{
					// slot found
					stack[stackIdx] = item->stop;
					notStacked = FALSE;
					break;
					}
				}
			if(notStacked) 
				{
				skipCount++;
				continue;
				}

			// output
			if(is_bam)
				{
				/** bam read output **/
				struct readitem *read=(struct readitem *)item;
				/*** do not output read stop */
				printf("{id:'%s',start:%d,bam:{cigar:[", read->id, read->start);
				// must cigar
				{
				int i,op,cl;
				for(i=0; i<read->n_cigar;i++)
					{
					op=(read->cigar)[i] & BAM_CIGAR_MASK;
					cl=(read->cigar)[i] >> BAM_CIGAR_SHIFT;
					printf("['");
					switch(op)
						{
						case BAM_CMATCH: printf("M");break;
						case BAM_CINS: printf("I");break;
						case BAM_CDEL: printf("D");break;
						case BAM_CREF_SKIP: printf("N"); break;
						case BAM_CSOFT_CLIP: printf("S");break;
						case BAM_CHARD_CLIP: printf("R");break;
						case BAM_CPAD: printf("P");break;
						default:printf("?");break;
						}
					printf("',%d],",cl);
					}
				}
				// must flag
				printf("],flag:%d,",read->flag);
				// must seq
				printf("seq:\"%s\",",read->seq);
				// optional mismatch
				if(read->mismatch!=NULL)
					{
					printf("mismatch:'%s',",read->mismatch);
					}
				printf("},"); // end of .bam {}
				printf("},"); // end of this read
				continue;
				}
			if(is_bed)
				{
				printf("{id:%s,", id); // integer id
				if(name != NULL)
					{
					printf("name:'%s',", name);
					}
				if(strand != NULL)
					{
					printf("strand:'%c',", strand[0]=='+'?'>':(strand[0]=='-'?'<':strand[0]));
					}
				printf("start:%d,stop:%d,",item->start,item->stop);
				printf("},");
				continue;
				}
			// hammock
			struct beditem *item2=(struct beditem *)item;
			printf("{start:%d,stop:%d,",item2->start,item2->stop);

			if(tt->ft==FT_weaver_c && tt->weave==2)
				{
				// do not output alignment sequence
				int tokencount=0, i,j;
				int discard=0, iskey=1;
				char *tmp;
				jsmn_parser parser;
				while(1)
					{
					tokencount+=50;
					jsmntok_t tokens[tokencount];
					for(i=0; i<tokencount; i++) {
						tokens[i].type=-1;
					}
					jsmn_init(&parser);
					if(jsmn_parse(&parser,item2->rest,tokens,tokencount)==JSMN_ERROR_NOMEM) continue;
					// done parsing
					i=0;
					while(i<tokencount) {
						jsmntok_t t2=tokens[i];
						switch(t2.type)
						{
						case -1:
							i=tokencount;
							break;
						case JSMN_OBJECT:
							iskey=1;
							printf("{");
							for(j=0; j<t2.size; j++) {
								i++;
								jsmntok_t t3=tokens[i];
								switch(t3.type) {
								case JSMN_STRING:
									if(discard) {
										discard=0;
										iskey=1;
									} else {
										printf("\"%s\"",jsmn_chunk(item2->rest,t3));
										if(iskey) printf(":");
										else printf(",");
										iskey=iskey==1?0:1;
									}
									break;
								case JSMN_PRIMITIVE:
									// unquoted key
									tmp=jsmn_chunk(item2->rest,t3);
									if(strcmp(tmp,"targetseq")==0  || strcmp(tmp,"queryseq")==0) {
										discard=1;
										iskey=0;
									} else {
										printf("%s",tmp);
										if(iskey) printf(":");
										else printf(",");
										iskey=iskey==1?0:1;
									}
									break;
								default:
									break;
								}
							}
							printf("},");
							i++;
							break;
						case JSMN_ARRAY:
							i+=t2.size;
							iskey=1;
							break;
						case JSMN_STRING:
							if(discard) {
								discard=0;
								iskey=1;
							} else {
								printf("\"%s\"",jsmn_chunk(item2->rest,t2));
								if(iskey) printf(":");
								else printf(",");
								iskey=iskey==1?0:1;
							}
							i++;
							break;
						case JSMN_PRIMITIVE:
							// unquoted key
							tmp=jsmn_chunk(item2->rest,t2);
							printf("%s",tmp);
							if(iskey) printf(":");
							else printf(",");
							iskey=iskey==1?0:1;
							i++;
							break;
						}
					}
					break;
					}
				}
			else
				{
				printf("%s",item2->rest);
				}
			printf("},");
			}
		dataidx++; // never forget this...
		printf("],");
		}
	printf("]");
	if(skipCount>0) printf(",skipped:%d",skipCount);
	printf("},");
	free(data);
	return;
	}
// alert?
}







void reviveScaffold()
{
/* session and status obtained from global variable
   given session and status, revive scaffold from table scaffoldRuntime
 */
char delim[]=",";
int i=0;
if(conn)
	{
	char *query;
	if(asprintf(&query, "select count,names from scaffoldRuntime where session='%s' and statusId=%d", session, statusId)<0) errabort("bae");
	MYSQL_RES *sr = mysqlGetResult(query);
	assert(sr!=NULL);
	free(query);
	char **row = mysql_fetch_row(sr);
	assert(row[0] != NULL);
	assert(row[1] != NULL);
	assert((lastChrIdx=strMayPositiveInt(row[0]))!=-1);
	chrInfo = malloc(sizeof(struct chrInfoNode *) * lastChrIdx);
	lastChrIdx--;
	char *tok = strtok(row[1], delim);
	while(tok != NULL)
		{
		chrInfo[i] = (struct chrInfoNode *)malloc(sizeof(struct chrInfoNode));
		chrInfo[i]->name=strdup(tok);
		tok = strtok(NULL, delim);
		assert(tok != NULL);
		assert((chrInfo[i]->length=strMayPositiveInt(tok))!=-1);
		i++;
		tok = strtok(NULL, delim);
		}
	assert(i == lastChrIdx+1);
	mysql_free_result(sr);
	}
else
	{
	char *re=strdup(cgiString(customscaffoldlen));
	char *tok=strtok(re,delim);
	lastChrIdx=0;
	while(tok!=NULL)
		{
		lastChrIdx++;
		tok = strtok(NULL, delim);
		tok = strtok(NULL, delim);
		}
	chrInfo = malloc(sizeof(struct chrInfoNode *) * lastChrIdx);
	re=strdup(cgiString(customscaffoldlen));
	tok=strtok(re,delim);
	while(tok!=NULL)
		{
		chrInfo[i] = (struct chrInfoNode *)malloc(sizeof(struct chrInfoNode));
		chrInfo[i]->name=strdup(tok);
		tok = strtok(NULL, delim);
		assert(tok != NULL);
		assert((chrInfo[i]->length=strMayPositiveInt(tok))!=-1);
		i++;
		tok = strtok(NULL, delim);
		}
	lastChrIdx=i-1;
	}

if(SQUAWK) fputs("reviveScaffold() done\n", stderr);
if(0)
    {
    for(i=0; i<=lastChrIdx; i++)
        fprintf(stderr, "%s %u\n", chrInfo[i]->name, chrInfo[i]->length);
    }
}


struct gene *queryGene(struct geneParam *param)
{
/* query gene with an input string
will yield a list
normalchr_sl must be ready
genetrack_sl is needed if no specific table is appointed
limits 10 hits
FIXME old query table: [tk]symbol [tk]struct
	  new query table: [tk], tk file
*/
struct slNode *_genetrack;
if(param->query_table==NULL)
	_genetrack=genetrack_sl;
else
	{
	_genetrack=malloc(sizeof(struct slNode));
	_genetrack->name=param->query_table;
	_genetrack->next=NULL;
	}
struct gene *result=NULL, *g;
struct slNode *table;
char *query, **row;
MYSQL_RES *sr;
for(table=_genetrack; table!=NULL; table=table->next)
	{
	if(param->use_exactmatch)
		{
		assert(asprintf(&query,"select * from %s where name=\"%s\" limit 10",table->name,param->query_str)>0);
		}
	else
		{
		assert(asprintf(&query,"select * from %s where name like \"%%%s%%\" limit 10",table->name,param->query_str)>0);
		}
	sr=mysqlGetResult(query);
	free(query);
	row=mysql_fetch_row(sr);
	if(row!=NULL)
		{
		// retrieve gene data from tk file
		char *path=makefilepath(table->name,FT_anno_n);
		tabix_t *fin=tabixOpen(path,FALSE);
		assert(fin!=NULL); // TODO
		// remove repetitions from the coord
		struct tnode *coordsl=NULL,*coordnode;
		while(row!=NULL)
			{
			int start=strMayPositiveInt(row[1]);
			if(start==-1) continue;
			int stop=strMayPositiveInt(row[2]);
			if(stop==-1) continue;
			boolean notfound=TRUE;
			for(coordnode=coordsl; coordnode!=NULL; coordnode=coordnode->next)
				{
				if(start==coordnode->t4 && stop==coordnode->num)
					{
					notfound=FALSE;
					break;
					}
				}
			if(notfound)
				{
				coordnode=malloc(sizeof(struct tnode));
				coordnode->t4=start; // start
				coordnode->num=stop; // stop
				assert(asprintf(&(coordnode->t1),"%s:%s-%s",row[0],row[1],row[2])>0);
				coordnode->t2=strdup(row[3]); // name
				coordnode->t3=strdup(row[0]); // chrom
				coordnode->next=coordsl;
				coordsl=coordnode;
				}
			row=mysql_fetch_row(sr);
			}
		struct beditem *item, *sl;
		for(coordnode=coordsl; coordnode!=NULL; coordnode=coordnode->next)
			{
			sl=tabixQuery_bed(fin,coordnode->t1,TRUE);
			free(coordnode->t1);
			for(item=sl; item!=NULL; item=item->next)
				{
				if(item->start!=coordnode->t4 || item->stop!=coordnode->num) continue;
				g=makeGene(coordnode->t3,coordnode->t4,coordnode->num,coordnode->t2,item->rest,param);
				if(g==NULL) continue;
				g->type=table->name;
				g->next=result;
				result=g;
				}
			}
		ti_close(fin);
		}
	mysql_free_result(sr);
	}

if(!param->parse_json)
	{
	// no parsing json, cannot do further coord adjustment
	return result;
	}

for(g=result; g!=NULL; g=g->next)
	{
	if(!param->use_chromid)
		{
		// not doing any further coord adjustment
		continue;
		}
	long thischrlen = chrInfo[g->chromIdx]->length;
	/* below sets report_start/stop and flanking according to which genepart to report
	do not process "exons/introns" as gene already reports all exons
	*/
	if(strcmp(param->whichgenepart, "genebodypromoter") == 0)
		{
		if(g->strand == '+')
			{
			g->report_stop=g->txstop;
			g->flank5stop=g->txstart;
			g->flank5start = g->report_start = max(0,g->txstart-3000);
			}
		else
			{
			g->report_start=g->txstart;
			g->flank5start = g->txstop;
			g->flank5stop= g->report_stop = min(thischrlen, g->txstop+3000);
			}
		}
	else if(strcmp(param->whichgenepart,"promoter")==0)
		{
		if(g->strand=='+')
			{
			g->report_start=max(0,g->txstart-3000);
			g->report_stop=g->txstart;
			}
		else
			{
			g->report_start=g->txstop;
			g->report_stop=min(thischrlen,g->txstop+3000);
			}
		}
	else if(strcmp(param->whichgenepart,"utr5")==0)
		{
		g->report_start=g->utr5start;
		g->report_stop=g->utr5start+g->utr5width;
		}
	else if(strcmp(param->whichgenepart,"utr3")==0)
		{
		g->report_start=g->utr3start;
		g->report_stop=g->utr3start+g->utr3width;
		}
	else if(strcmp(param->whichgenepart, "custom") == 0)
		{
		if(strcmp(param->origintype, "txstart") == 0)
			{
			if(g->strand == '+')
				{
				g->flank5stop=g->flank3start=g->txstart;
				g->report_stop=g->flank3stop=min(thischrlen,g->txstart+param->flank3);
				g->report_start=g->flank5start=max(0,g->txstart-param->flank5);
				}
			else
				{
				g->flank3stop=g->flank5start=g->txstop;
				g->report_start=g->flank3start=max(0,g->txstop-param->flank3);
				g->report_stop=g->flank5stop=min(thischrlen,g->txstop+param->flank5);
				}
			}
		else if(strcmp(param->origintype, "txstop") == 0)
			{
			if(g->strand == '+')
				{
				g->flank5stop=g->flank3start=g->txstop;
				g->report_start=g->flank5start=max(0,g->txstop-param->flank5);
				g->report_stop=g->flank3stop=min(thischrlen,g->txstop+param->flank3);
				}
			else
				{
				g->flank5start=g->flank3stop=g->txstart;
				g->report_stop=g->flank5stop=min(thischrlen,g->txstart+param->flank5);
				g->report_start=g->flank3start=max(0,g->txstart-param->flank3);
				}
			}
		else if(strcmp(param->origintype, "genebody") == 0)
			{
			if(g->strand == '+')
				{
				g->flank5stop=g->txstart;
				g->report_start=g->flank5start=max(0,g->txstart-param->flank5);
				g->flank3start=g->txstop;
				g->report_stop=g->flank3stop=min(thischrlen,g->txstop+param->flank3);
				}
			else
				{
				g->flank3stop=g->txstart;
				g->flank5start=g->txstop;
				g->report_start=g->flank3start=max(0,g->txstart-param->flank3);
				g->report_stop=g->flank5stop=min(thischrlen,g->txstop+param->flank5);
				}
			}
		}
	else
		{
		g->report_start=g->txstart;
		g->report_stop=g->txstop;
		}
	g->next=result;
	result=g;
	}
return result;
}


void __showgene(struct gene *gene)
{
fprintf(stderr,"gene \"%s\":\n",gene->name);
fprintf(stderr,"strand: %c\n",gene->strand);
fprintf(stderr,"%d exons\n",gene->exoncount);
int i;
for(i=0; i<gene->exoncount; i++) {
	fprintf(stderr,"\texon %d: %d-%d\n", i,(gene->exons)[i][0],(gene->exons)[i][1]);
}
fprintf(stderr,"5' utr: %d-%d\n",gene->utr5start,gene->utr5start+gene->utr5width);
fprintf(stderr,"3' utr: %d-%d\n",gene->utr3start,gene->utr3start+gene->utr3width);
}




void makeDspBoundaryFromCgi(struct displayedRegion *dsp)
{
char *s=cgiString(StartChrom_cgi);
assert(s!=NULL);
int startChr = strMayChrID(s);
assert(startChr!=-1);
int startCoord = cgiInt(StartCoord_cgi);
s=cgiString(StopChrom_cgi);
assert(s!=NULL);
int stopChr = strMayChrID(s);
assert(stopChr!=-1);
int stopCoord = cgiInt(StopCoord_cgi);
setDspBoundary(dsp, startChr, startCoord, stopChr, stopCoord);
}




void recoverDsp_cgiParam(struct displayedRegion *dsp)
{
dsp->usedSummaryNumber = 0;
char *param = cgiString("regionLst");
assert(param!=NULL);
struct region *r = NULL;
char delim[] = ",";
char *tok = strtok(param, delim);
assert(tok!=NULL);
while(tok != NULL)
	{
	r = malloc(sizeof(struct region));
	r->chromIdx = strMayChrID(tok);
	if(r->chromIdx == -1)
		{
		scaffoldAddnew(tok);
		r->chromIdx = lastChrIdx;
		printf("newscaffold:['%s',%u],", tok, chrInfo[lastChrIdx]->length);
		}
	assert((tok=strtok(NULL, delim))!=NULL);
	assert((r->bstart=r->dstart=strMayPositiveInt(tok))!=-1);
	assert((tok=strtok(NULL, delim))!=NULL);
	assert((r->bstop=r->dstop=strMayPositiveInt(tok))!=-1);
	assert((tok=strtok(NULL, delim))!=NULL);
	assert((r->summarySize=strMayPositiveInt(tok))!=-1);
	if(dsp->runmode==RM_gsv_c || dsp->runmode==RM_gsv_kegg)
		{
		assert((tok=strtok(NULL, delim))!=NULL);
		r->name=strdup(tok);
		}

	dsp->usedSummaryNumber += r->summarySize;
	r->isViewStart = FALSE;
	dspAddRegionTail(dsp, r);
	tok = strtok(NULL, delim);
	}
dsp->head->dstart = cgiInt("startCoord");
dsp->tail->dstop = cgiInt("stopCoord");
}


void defaultScaffold()
{
if(!conn)
	{
	return;
	}
char *tmp = mysqlGetOnestring("select defaultScaffold from config");
// need to count number of scaffold, and make new string (mix of name and length)
char *old="", *new;
boolean atfirst=TRUE;
int i = 0; // # of names
char delim[]=",";
char *tok = strtok(tmp, delim);
while(tok!=NULL)
	{
	i++;
	int len = getScaffoldLength(tok);
	assert(len != -1);
	assert(asprintf(&new, "%s%s,%d,", old, tok, len)>0);
	if(atfirst) atfirst=FALSE;
	else free(old);
	old = new;
	tok = strtok(NULL, delim);
	}
char *query;
assert(asprintf(&query, "insert into scaffoldRuntime values('%s',%d,%d,'%s')", session, statusId, i, old)>0);
mysqlUpdate(query);
free(query);
free(old);
reviveScaffold();
}


char *dspStat2readable(char *dspstat, char *juxtype)
{
// to human readable, free after use
char delim[]=",";
char *startChr;
if((startChr=strtok(dspstat, delim)) == NULL)
	errabort("expecting start chr from dspStat string but got null...");
char *startCoord;
if((startCoord=strtok(NULL, delim)) == NULL)
	errabort("expecting start coord from dspStat string but got null...");
char *stopChr;
if((stopChr=strtok(NULL, delim)) == NULL)
	errabort("expecting stop chr from dspStat string but got null...");
char *stopCoord;
if((stopCoord=strtok(NULL, delim)) == NULL)
	errabort("expecting stop coord from dspStat string but got null...");
char *re;
if(juxtype[0]=='3' || juxtype[0]=='4')
	{
	// gsv
	if(strcmp(startChr,stopChr) == 0)
		assert(asprintf(&re, "at %s", startChr)>0);
	else
		assert(asprintf(&re, "from %s to %s", startChr, stopChr)>0);
	}
else
	{
	if(strcmp(startChr,stopChr) == 0)
		assert(asprintf(&re,"%s from %s to %s", startChr, startCoord, stopCoord)>0);
	else
		assert(asprintf(&re,"from %s(%s) to %s(%s)", startChr, startCoord, stopChr, stopCoord)>0);
	}
return re;
}



void sessionstatus2json(char *path)
{
printf("statusLst:[");
glob_t globbuf;
char *path2;
assert(asprintf(&path2,"%s/*",path)>0);
glob(path2,GLOB_ERR,NULL,&globbuf);
int i=0;
for(; i<globbuf.gl_pathc; i++)
	{
	char *path3;
	assert(asprintf(&path3,"%s/note",globbuf.gl_pathv[i])>0);
	FILE *fin=fopen(path3,"r");
	if(fin!=NULL)
		{
		char *line=malloc(1);
		size_t s=1;
		if(getline(&line,&s,fin)!=-1)
			printf("%s,",line);
		fclose(fin);
		}
	}
printf("],");
}

void repeatbrowser_parseExpTrack(char *tknamelst, int ft, struct track **sl)
{
struct track *t;
char delim[]=",";
char *tok=strtok(tknamelst,delim);
while(tok!=NULL)
	{
	t=malloc(sizeof(struct track));
	t->name=t->label=strdup(tok);
	assert(asprintf(&(t->urlpath),"/srv/epgg/data/data/repeatbrowser/hg19_repeatmasker/genome_bedgraph/%s.gz",tok)>0);
	t->ft=ft;
	assert((tok=strtok(NULL,delim))!=NULL);
	assert((t->mode=strMayPositiveInt(tok))!=-1);
	assert((tok=strtok(NULL,delim))!=NULL);
	assert((t->summeth=strMayPositiveInt(tok))!=-1);
	t->next=*sl;
	*sl=t;
	tok=strtok(NULL,delim);
	}
}

struct tabixHandle *repeatbrowser_parseTrack(char *tknamelst, int type)
{
/* type:
	1 - read density on genome
	2 - read density on consensus, iteres all
	3 - read density on consensus, iteres unique
	4 - repeat genome copy density on a consensus
all of them are bedgraph
*/

struct tabixHandle *sl=NULL, *t;
char *path;
if(type==4)
	{
	path="/srv/epgg/data/data/repeatbrowser/hg19_repeatmasker/repeat_genome_density.gz";
	t=malloc(sizeof(struct tabixHandle));
	if((t->fin=tabixOpen(path,FALSE))==NULL)
		{
		fprintf(stderr, "error with file %s\n", path);
		exit(0);
		}
	t->next=NULL;
	return t;
	}
	
char delim[]=",";
char *tok=strtok(tknamelst,delim);
while(tok!=NULL)
	{
	if(type==1)
		assert(asprintf(&path,"/srv/epgg/data/data/repeatbrowser/hg19_repeatmasker/genome_bedgraph/%s.gz",tok)>0);
	else if(type==2)
		assert(asprintf(&path,"/srv/epgg/data/data/repeatbrowser/hg19_repeatmasker/iteres_all/%s.gz",tok)>0);
	else
		assert(asprintf(&path,"/srv/epgg/data/data/repeatbrowser/hg19_repeatmasker/iteres_uniq/%s.gz",tok)>0);
	t=malloc(sizeof(struct tabixHandle));
	if((t->fin=tabixOpen(path,FALSE))==NULL)
		{
		fprintf(stderr, "error with file '%s'\n", path);
		exit(0);
		}
	t->name=strdup(tok);
	t->next=sl;
	sl=t;
	free(path);
	tok=strtok(NULL,delim);
	}
if(sl==NULL)
	{
	fprintf(stderr, "%s wrong with type %d\n", __FUNCTION__, type);
	exit(0);
	}
return sl;
}


struct beditem2 *getRepeats4subfam()
{
/* args:
chrlst: chr1,len1,chr2,len2,...

!!! bbiDir must be ready!!!
which is from the sukn database that the rpbr depends on
*/
struct tnode *chrsl=NULL, *tt;
char delim[]=",\t";
char *tok=strtok(cgiString("chrlst"), delim);
while(tok!=NULL)
	{
	tt=malloc(sizeof(struct tnode));
	tt->t1=tok;
	assert((tok=strtok(NULL,delim))!=NULL);
	assert(asprintf(&(tt->t2), "%s:0-%s", tt->t1, tok)>0);
	tt->next=chrsl;
	chrsl=tt;
	tok=strtok(NULL,delim);
	}
char *file;
assert(asprintf(&file, "/srv/epgg/data/data/subtleKnife/hg19/%s%s%s.gz", cgiString("rpbr_class"), cgiString("rpbr_family"), cgiString("rpbr_subfam"))>0);
tabix_t *fin=tabixOpen(file,FALSE);
assert(fin!=NULL);
struct beditem2 *sl=NULL, *t;
struct beditem *sl2, *it;
for(tt=chrsl; tt!=NULL; tt=tt->next)
	{
	sl2=tabixQuery_bed(fin, tt->t2, TRUE);
	for(it=sl2; it!=NULL; it=it->next)
		{
		t=malloc(sizeof(struct beditem2));
		t->chrom=strdup(tt->t1);
		t->start=it->start;
		t->stop=it->stop;
		strtok(it->rest, delim); // throw name
		assert((tok=strtok(NULL,delim))!=NULL);
		t->rest=strdup(tok); // id
		assert((tok=strtok(NULL,delim))!=NULL);
		t->strand=tok[0];
		t->next=sl;
		sl=t;
		}
	slFree(sl2);
	}
slFree(chrsl);
ti_close(fin);
return sl;
}


char *gsv_dsp_makestring(struct displayedRegion *dsp)
{
char *old = "", *new;
boolean atfirst=TRUE;
struct region *r;
for(r=dsp->head; r!=NULL; r=r->next)
	{
	assert(asprintf(&new, "%s%s,%d,%d,%d,%d,%d,%d,%d,%c,%d,", 
		old,
		r->name,
		r->chromIdx,
		r->bstart, r->bstop,
		r->flank5start, r->flank5stop,
		r->flank3start, r->flank3stop,
		r->strand,
		r->flag?1:0)>0);
	if(atfirst) atfirst=FALSE;
	else free(old);
	old = new;
	}
return old;
}

struct region *gsv_duplicateregion(struct region *r1)
{
struct region *r3=malloc(sizeof(struct region));
r3->chromIdx=r1->chromIdx;
r3->name=r1->name;
r3->strand=r1->strand;
r3->flag=r1->flag;
r3->bstart=r3->dstart=r1->bstart;
r3->bstop=r3->dstop=r1->bstop;
r3->flank5start=r1->flank5start;
r3->flank3start=r1->flank3start;
r3->flank5stop=r1->flank5stop;
r3->flank3stop=r1->flank3stop;
return r3;
}

struct geneParam *initGeneParam()
{
struct geneParam *p=malloc(sizeof(struct geneParam));
p->query_table=NULL;
p->query_str=NULL;
p->use_chromid=
p->use_exactmatch=
p->have_name=
p->parse_json=FALSE;
p->whichgenepart="genebody";
p->origintype=NULL;
p->flank5=0;
p->flank3=0;
return p;
}


void try_restoreScfd()
{
if(cgiVarExists(customscaffoldlen))
	{
	reviveScaffold();
	return;
	}
if(session==NULL || statusId==-1) return;
/* but some cases there's no corresponding entry in runtime table
gene set view, restore status about gene set view...
*/
char *query;
assert(asprintf(&query, "select count from scaffoldRuntime where session='%s' and statusId=%d", session, statusId)>0);
char *re = mysqlGetOnestring(query);
free(query);
if(re != NULL)
	{
	reviveScaffold();
	}
else
	{
	defaultScaffold();
	}
}

void printEntirefile(FILE *fin)
{
char *line=malloc(1);
size_t s=1;
while(getline(&line,&s,fin)!=-1)
	printf("%s",line);
}




char *session_exists(char *s)
{
char *path;
assert(asprintf(&path,"%s/session/%s",bbiDir,s)>0);
struct stat sbuf;
if(stat(path,&sbuf)==-1)
	return NULL;
return path;
}
char *sessionstatus_exists(char *s, char *ss)
{
char *path=session_exists(s);
if(path==NULL) return NULL;
char *path2;
assert(asprintf(&path2,"%s/%s",path,ss)>0);
struct stat sbuf;
if(stat(path2,&sbuf)==-1) return NULL;
return path2;
}


// INIT

int main()
{


clock_t cpuTimeStart, cpuTimeTemp;
if(CHECKCPUTIME) cpuTimeStart = clock();

if(SQUAWK) fputs(">>>>>\n", Squawk);


{
	/* initiate cgi hash 
	this program only deals with "get", not "post"
	all parameters passed via cgi must be escaped and be decoded here
	** no empty value allowed, e.g. k1=v1&k2=&k3=v3&...
	as =& will be used to chop up things...
	TODO use singly linked list instead of gnu hash to get rid of entry limit
	*/
	char *tmp=getenv("QUERY_STRING");
	if(tmp==NULL)
		{
		if(SQUAWK) fputs("cgi got no param\n", stderr);
		return 1;
		}
	if(strstr(tmp, "NODECODE")!=tmp)
		{
		int len=strlen(tmp);
		// decode
		char *tmp2 = malloc(sizeof(char) * (len+1));
		strDecode(tmp, tmp2, len);
		tmp=tmp2;
		}
	char delim[]="=&";
	struct tnode *t;
	char *tok=strtok(tmp,delim);
	assert(tok!=NULL);
	while(tok!=NULL)
		{
		t=malloc(sizeof(struct tnode));
		t->t1=strdup(tok); // name
		tok=strtok(NULL,delim); // value
		if(tok==NULL)
			{
			fprintf(stderr,"!! param '%s' has no value\n", t->t1);
			return 1;
			}
		t->t2=strdup(tok); // value
		tok=strtok(NULL,delim);
		t->next=cgiparamsl;
		cgiparamsl=t;
		}
	if(SQUAWK) fputs("cgi param parsed\n", stderr);
	if(0)
		{
		for(t=cgiparamsl; t!=NULL; t=t->next)
			fprintf(stderr, "%s => %s\n", t->t1, t->t2);
		}
}

/* things that do not require db connection
*/



if(cgiVarExists("runpca"))
	{
	printf("Content-Type:text/plain\n\n");
	srand(time(0));
	int r=rand();
	char *tmppath;
	assert(asprintf(&tmppath,"%s/pca%d",trashDir,r)>0);
	if(mkdir(tmppath,S_IRWXU)==-1)
		{
		printf("ERROR:cannot create directory %s (%m)",tmppath);
		return 1;
		}
	char *k=cgiString("key");
	char *command;
	assert(asprintf(&command,"mv %s/%s %s/input",WWWT,k,tmppath)>0);
	if(system(command)==-1)
		{
		printf("ERROR:cannot move file");
		return 1;
		}
	free(command);
	if(chdir(tmppath)!=0)
		{
		printf("ERROR:cannot chdir to %s (%m)",tmppath);
		return 1;
		}
	if(system("R CMD BATCH --no-save input")==-1)
		{
		printf("ERROR:cannot run R");
		return 1;
		}
	char *out="rrrr";
	FILE *fin=fopen(out,"r");
	if(fin==NULL)
		{
		printf("ERROR:cannot read file %s/%s (%m)", tmppath,out);
		return 1;
		}
	char *line=malloc(1);
	size_t s=1;
	while(getline(&line,&s,fin)!=-1)
		{
		printf("%s",line);
		}
	fclose(fin);
	done();
	unlink("input");
	unlink("input.Rout");
	unlink("rrrr");
	if(chdir("..")==0)
		{
		rmdir(tmppath);
		}
	return 1;
	}


if(cgiVarExists("graphviz"))
	{
	printf("Content-Type:text/plain\n\n");
	char *key=cgiString("key");
	char *infile,*outfile;
	assert(asprintf(&infile,"%s/%s",WWWT,key)>0);
	assert(asprintf(&outfile,"%s/%s",trashDir,key)>0);
	char *command;
	assert(asprintf(&command,"fdp %s -Tsvg -o%s",infile,outfile)>0);
	if(system(command)==-1)
		{
		printf("ERROR:Cannot run neato");
		return 1;
		}
	FILE *fin=fopen(outfile,"r");
	if(fin==NULL)
		{
		printf("ERROR:cannot read file %s (%m)", outfile);
		return 1;
		}
	char *line=malloc(1);
	size_t s=1;
	while(getline(&line,&s,fin)!=-1)
		{
		printf("%s",line);
		}
	fclose(fin);
	unlink(infile);
	unlink(outfile);
	done();
	return 1;
	}




if(cgiVarExists("loaddatahub"))
	{
	/* simply read a datahub file
	*/
	printf("Content-Type:text/plain\n\n");
	srand(time(0));
	int r = rand();
	char *descriptorfile;
	assert(asprintf(&descriptorfile, "%s/%d.hub", trashDir, r)>0);
	char *command;
	assert(asprintf(&command, "wget %s -O %s -q", cgiString("url"), descriptorfile)>0);
	if(system(command) == -1)
		{
		printf("ERROR:Cannot run wget");
		return 1;
		}
	// tell if the file is empty
	FILE *fin = fopen(descriptorfile, "rb");
	if(fin == NULL)
		{
		printf("ERROR:Cannot open temp file");
		return 1;
		}
	fseek(fin, 0, SEEK_END);
	if(ftell(fin) == 0)
		{
		printf("ERROR:Invalid hub file URL");
		return 1;
		}
	rewind(fin);
	char *line=malloc(1); size_t s=1;
	while(getline(&line, &s, fin) != -1)
		{
		// skip comments
		if(line[0]=='#' || line[0]=='\n') continue;
		printf("%s",line);
		}
	fclose(fin);
	unlink(descriptorfile);
	done();
	return 1;
	}


/*
if(cgiVarExists("loaddatahub"))
	{
	printf("Content-Type:text/plain\n\n");
	char *url=cgiString("url");
	char *deposit_dir=getDepositePath4url(url);
	char *filepath;
	assert(asprintf(&filepath,"%s/file",deposit_dir)>0);
	FILE *fin=fopen(filepath,"r");
	if(fin==NULL)
		{
		char *command;
		assert(asprintf(&command, "wget --no-check-certificate %s -O %s -q", url, filepath)>0);
		if(system(command) == -1)
			{
			printf("ERROR:Cannot run wget");
			return 1;
			}
		// tell if the file is empty
		fin = fopen(filepath, "rb");
		if(fin == NULL)
			{
			printf("ERROR:Cannot open temp file");
			return 1;
			}
		fseek(fin, 0, SEEK_END);
		if(ftell(fin) == 0)
			{
			printf("ERROR:Invalid hub file URL");
			return 1;
			}
		rewind(fin);
		}
	char *line=malloc(1); size_t s=1;
	while(getline(&line, &s, fin) != -1)
		{
		// skip comments
		if(line[0]=='#' || line[0]=='\n') continue;
		printf("%s",line);
		}
	fclose(fin);
	done();
	return 1;
	}
	*/

if(cgiVarExists("restoreSession"))
	{
	printf("Content-Type:text/plain\n\n");
	if(!mysqlConnect(cgiString("dbName")))
		{
		printf("ERROR:Cannot connect db");
		return 1;
		}

	assert((bbiDir=mysqlGetOnestring("select bbiPath from config"))!=NULL);
	char *session=cgiString("session");
	char *status=cgiString("statusId");
	char *path=sessionstatus_exists(session,status);
	if(path==NULL)
		{
		printf("ERROR:Session not found");
		return 1;
		}
	char *path2;
	assert(asprintf(&path2,"%s/json",path)>0);
	FILE *fin=fopen(path2,"r");
	if(fin==NULL)
		{
		printf("ERROR:Failed to load session (%m)");
		return 1;
		}
	char *line=malloc(1);
	size_t s=1;
	while(getline(&line,&s,fin)!=-1)
		printf("%s",line);
	fclose(fin);
	done();
    return 1;
	}

if(cgiVarExists("downloadSession"))
	{
	if(!mysqlConnect(cgiString("dbName")))
		{
		printf("ERROR:Cannot connect db");
		return 1;
		}

	assert((bbiDir=mysqlGetOnestring("select bbiPath from config"))!=NULL);
	char *session=cgiString("thissession");
	char *status=cgiString("thisstatus");
	char *path=sessionstatus_exists(session,status);
	if(path==NULL)
		{
		printf("Content-Type:text/plain\n\nERROR:Session not found");
		return 1;
		}
	char *path2;
	assert(asprintf(&path2,"%s/json",path)>0);
	FILE *fin=fopen(path2,"r");
	if(fin==NULL)
		{
		printf("Content-Type:text/plain\n\nERROR:Failed to load session (%m)");
		return 1;
		}
	printf("Content-disposition: attachment; filename=\"session\"\n\n");
	char *line=malloc(1);
	size_t s=1;
	while(getline(&line,&s,fin)!=-1)
		printf("%s",line);
	fclose(fin);
	return 1;
	}




printf("Content-Type:application/json\n\n{");


if(cgiVarExists("runhclust"))
	{
	// the key should be unique, do not rand(), since golden may call hclust twice at same time
	char *k=cgiString("key");
	char *tmppath;
	assert(asprintf(&tmppath,"%s/%s",trashDir,k)>0);
	if(mkdir(tmppath,S_IRWXU)==-1)
		{
		printf("error:'cannot create directory %s (%m)'}",tmppath);
		return 1;
		}
	char *command;
	assert(asprintf(&command,"mv %s/%s %s/input",WWWT,k,tmppath)>0);
	if(system(command)==-1)
		{
		printf("error:'cannot move file'}");
		return 1;
		}
	free(command);
	if(chdir(tmppath)!=0)
		{
		printf("error:'cannot chdir to %s (%m)'}",tmppath);
		return 1;
		}
	if(system("R CMD BATCH --no-save input")==-1)
		{
		printf("error:'cannot run R'}");
		return 1;
		}
	char *out="order";
	FILE *fin=fopen(out,"r");
	if(fin==NULL)
		{
		printf("error:'cannot read file %s/%s (%m)'}", tmppath,out);
		return 1;
		}
	char *line=malloc(1);
	size_t s=1;
	printf("order:[");
	int i;
	while(getline(&line,&s,fin)!=-1)
		{
		for(i=0; i<strlen(line)-1; i++)
			printf("%c",line[i]);
		printf(",");
		}
	fclose(fin);
	printf("],");
	out="merge";
	fin=fopen(out,"r");
	if(fin==NULL)
		{
		printf("error:'cannot read file %s/%s (%m)'}", tmppath,out);
		return 1;
		}
	printf("merge:[");
	while(getline(&line,&s,fin)!=-1)
		{
		printf("'");
		for(i=0; i<strlen(line)-1; i++)
			printf("%c",line[i]);
		printf("',");
		}
	printf("],");
	fclose(fin);
	out="label";
	fin=fopen(out,"r");
	if(fin==NULL)
		{
		printf("error:'cannot read file %s/%s (%m)'}", tmppath,out);
		return 1;
		}
	printf("label:[");
	while(getline(&line,&s,fin)!=-1)
		{
		for(i=0; i<strlen(line)-1; i++)
			printf("%c",line[i]);
		printf(",");
		}
	fclose(fin);
	printf("],");
	out="height";
	fin=fopen(out,"r");
	if(fin==NULL)
		{
		printf("error:'cannot read file %s/%s (%m)'}", tmppath,out);
		return 1;
		}
	printf("height:[");
	while(getline(&line,&s,fin)!=-1)
		{
		for(i=0; i<strlen(line)-1; i++)
			printf("%c",line[i]);
		printf(",");
		}
	fclose(fin);
	printf("]}");
	unlink("height");
	unlink("input");
	unlink("input.Rout");
	unlink("label");
	unlink("merge");
	unlink("order");
	if(chdir("..")==0)
		{
		rmdir(tmppath);
		}
	done();
	return 1;
	}





if(cgiVarExists("refreshcusttkcache"))
	{
	// just one track
	char delim[]=",";
	char *tok;
	if(cgiVarExists("filelst"))
		{
		tok=strtok(cgiString("filelst"),delim);
		while(tok!=NULL)
			{
			if(unlink(tok)==-1)
				{
				fprintf(stderr, "cannot unlink %s\n", tok);
				}
			tok=strtok(NULL,delim);
			}
		}
	if(cgiVarExists("dirlst"))
		{
		tok=strtok(cgiString("dirlst"),delim);
		while(tok!=NULL)
			{
			if(rmdir(tok)==-1)
				{
				fprintf(stderr,"cannot rmdir %s\n", tok);
				}
			tok=strtok(NULL,delim);
			}
		}

	char *url=cgiString("url");
	if(url==NULL)
		{
		printf("'error':'missing url'}");
		return 1;
		}
	int ft=cgiInt("ft");
	char *chrom=cgiString("chrom");
	int start=cgiInt("start");
	double *x=malloc(sizeof(double));
	if(ft==FT_bigwighmtk_c)
		{
		bigwigQuery(url,chrom,start,start+1,1,x, summeth_mean);
		// TODO how to detect invalid bigwig file?
		}
	else if(ft==FT_bam_c)
		{
		samfile_t *fp=samopen(url,"rb",0);
		if(fp==0)
			{
			printf("'error':'failed to read bam file',");
			}
		else 
			{
			if(bam_parseIndex(url,ft)==NULL)
				{
				printf("'error':'failed to refresh cache',");
				}
			samclose(fp);
			}
		}
	else if(ft==FT_bedgraph_c)
		{
		tabix_t *fin=tabixOpen(url,TRUE);
		if(fin==NULL)
			{
			printf("'error':'failed to refresh cache',");
			}
		else
			{
			ti_close(fin);
			}
		}
	else 
		{
		tabix_t *fin=tabixOpen(url,TRUE);
		if(fin==NULL) printf("'error':'failed to refresh cache',");
		else ti_close(fin);
		}
	printf("}");
	done();
	return 1;
	}


// call super enhancer using Rose by Charles Lin
if(cgiVarExists("super"))
	{
	char *key=cgiString("jobkey");
	char *resultdir;
	assert(asprintf(&resultdir,"%s/%s",trashDir,key)>0);

	if(cgiVarExists("submit"))
		{
		if(mkdir(resultdir,S_IRWXU)!=0)
			{
			printf("'error':'mkdir error'}");
			return 1;
			}
		chmod(resultdir,S_IRWXU|S_IRWXG|S_IRWXO);

		/* the binding site bed file has already been deposited
		move it over
		*/
		char *bedfile;
		assert(asprintf(&bedfile, "%s/%s.bed", resultdir, Rose_input_fn)>0);

		char *command;
		assert(asprintf(&command,"mv %s/%s %s", WWWT, key, bedfile)>0);
		if(system(command)==-1)
			{
			printf("'error':'cannot drag input bed file around'}");
			return 1;
			}
		free(command);

		char *sendmail;
		assert(asprintf(&sendmail,"%s/sendmail.txt",resultdir)>0);
		FILE *fout=fopen(sendmail,"w");
		fprintf(fout,"From: noreply@epigenomegateway.wustl.edu\nTo: %s\n"
		"Subject: Super Enhancer analysis result\nMime-Version: 1.0\nContent-Type: text/html\n\n"
		"<html><body>Hello, your Call Super Enhancer job has been finished. "
		"You can retrieve your result with this key: %s<br><br>"
		"To retrieve results, go to Apps > Call super enhancer. You will be able to explore results on the browser, or download all files.</body></html>",
			cgiString("email"),
			key);
		fclose(fout);

		// must change to rose dir run rose!!!
		if(chdir("/srv/epgg/data/rose/")!=0)
			{
			printf("'error':'chrdir error'}");
			return 1;
			}
		char *commandfile;
		assert(asprintf(&commandfile,"%s/command",resultdir)>0);
		fout=fopen(commandfile,"w");
		assert(fout!=NULL);
		fprintf(fout,"python ROSE_main_turbo.py -g %s -i %s -r %s -s %s -t %s -o %s 2>%s/log",
			cgiString("genome"),
			bedfile,
			cgiString("rankbam"),
			cgiString("linkingdist"),
			cgiString("tssdist"),
			resultdir,
			resultdir
			);
		if(cgiVarExists("ctrlbam"))
			{
			fprintf(fout," -c %s", cgiString("ctrlbam"));
			}
		fclose(fout);

		if(cgiVarExists("ctrlbam"))
			{
			// create an empty file to mark out the use of control
			char *tmp;
			assert(asprintf(&tmp,"%s/hascontrol",resultdir)>0);
			fout=fopen(tmp,"w");
			assert(fout!=NULL);
			fclose(fout);
			}

		assert(asprintf(&command,"batch < %s", commandfile)>0);
		//fprintf(stderr, "ROSE command: %s\n\n", command);

		// run rose
		if(system(command)==-1)
			{
			printf("'error':'Failed to run batch!'}");
			return 1;
			}

		printf("}");
		done();
		return 1;
		}
	if(cgiVarExists("validate"))
		{
		struct stat sbuf;
		if(stat(resultdir,&sbuf)==-1)
			{
			printf("'error':'Result does not exist'}");
			return 1;
			}
		/* some other file have variable name
		skip them
		*/
		int filecount=10;
		char *f[filecount];
		f[0]=Rose_input_fn"_AllEnhancers.table.txt";
		f[1]=Rose_input_fn"_Enhancers_withSuper.bed";
		f[2]=Rose_input_fn"_Gateway_Enhancers.bed";
		f[3]=Rose_input_fn"_Gateway_SuperEnhancers.bed";
		f[4]=Rose_input_fn"_Plot_points.png";
		f[5]=Rose_input_fn"_SuperEnhancers_ENHANCER_TO_GENE.txt";
		f[6]=Rose_input_fn"_SuperEnhancers_GENE_TO_ENHANCER.txt";
		f[7]=Rose_input_fn"_SuperEnhancers.table.txt";
		f[8]="gff/";
		f[9]="mappedGFF/";
		int i;
		for(i=0; i<filecount; i++)
			{
			char *tmp;
			assert(asprintf(&tmp,"%s/%s", resultdir, f[i])>0);
			if(stat(tmp,&sbuf)==-1)
				{
				printf("error:'File \"%s\" is missing. You need to submit the job again.'}",f[i]);
				if(SQUAWK) fprintf(stderr,"rose missing file: %s\n", tmp);
				return 1;
				}
			free(tmp);
			}
		// all okay
		printf("'jobkey':'%s'}", key);
		done();
		return 1;
		}
	if(cgiVarExists("download"))
		{
		struct stat sbuf;

		char *tarfile;
		assert(asprintf(&tarfile,"%s/%s.tgz",WWWT,key)>0);
		if(stat(tarfile,&sbuf)==-1)
			{
			// tar ball is not there, make it
			if(chdir(resultdir)!=0)
				{
				printf("'error':'chdir error, cannot make tarball'}");
				return 1;
				}
			char *command;
			assert(asprintf(&command,"tar zcf %s *", tarfile)>0);
			if(system(command)==-1)
				{
				printf("'error':'Cannot make tarball'}");
				return 1;
				}
			}
		printf("'jobkey':'%s'}", key);
		done();
		return 1;
		}
	if(cgiVarExists("view"))
		{
		// see if there's input
		struct stat sbuf;
		char *ctrlfile;
		assert(asprintf(&ctrlfile,"%s/hascontrol",resultdir)>0);
		boolean hasCtrl=stat(ctrlfile,&sbuf)!=-1;

		// plot: input_bed_file_AllEnhancers.table.txt
		char *file;
		assert(asprintf(&file,"%s/%s_AllEnhancers.table.txt",resultdir,Rose_input_fn)>0);
		FILE *fin=fopen(file,"r");
		if(fin==NULL)
			{
			printf("error:'Error reading file %s'}",file);
			return 1;
			}
		char delim[]="\t\n";
		char *line=malloc(1);
		size_t s=1;
		if(getline(&line,&s,fin)==-1) { printf("error:'corrupted result file'}"); return 1; }
		if(getline(&line,&s,fin)==-1) { printf("error:'corrupted result file'}"); return 1; }
		if(getline(&line,&s,fin)==-1) { printf("error:'corrupted result file'}"); return 1; }
		if(getline(&line,&s,fin)==-1) { printf("error:'corrupted result file'}"); return 1; }
		printf("cutoff_statement:'%s',",strtok(line,delim)); // chop off newline
		if(getline(&line,&s,fin)==-1) { printf("error:'corrupted result file'}"); return 1; }
		if(getline(&line,&s,fin)==-1) { printf("error:'corrupted result file'}"); return 1; }
		printf("rankgraph:[");
		char *chr, *start, *stop, *num_loci, *ranksignal, *ctrlsignal, *rankorder;
		while(getline(&line,&s,fin)!=-1)
			{
			strtok(line,delim);
			chr=strtok(NULL,delim);
			start=strtok(NULL,delim);
			stop=strtok(NULL,delim);
			num_loci=strtok(NULL,delim);
			strtok(NULL,delim); // constituent size 
			ranksignal=strtok(NULL,delim);
			if(hasCtrl)
				{
				ctrlsignal=strtok(NULL,delim);
				if(ctrlsignal==NULL)
					{
					printf("],error:'corrupted result file'}");
					return 1;
					}
				}
			rankorder=strtok(NULL,delim);
			if(chr==NULL || start==NULL || stop==NULL || num_loci==NULL || ranksignal==NULL || rankorder==NULL)
				{
				printf("],error:'corrupted result file'}");
				return 1;
				}
			printf("{c:'%s',a:%s,b:%s,num_loci:%s,x:%s,y:%s",chr,start,stop,num_loci,rankorder,ranksignal);
			if(hasCtrl)
				{
				printf(",ctrl:%s",ctrlsignal);
				}
			printf("},");
			}
		printf("],");

		// genes
		assert(asprintf(&file,"%s/%s_SuperEnhancers_ENHANCER_TO_GENE.txt",resultdir,Rose_input_fn)>0);
		fin=fopen(file,"r");
		if(fin==NULL)
			{
			printf("error:'Error reading file %s'}",file);
			return 1;
			}
		if(getline(&line,&s,fin)==-1) { printf("error:'corrupted result file'}"); return 1; }
		printf("genes:[");
		char delim2[]="\n";
		while(getline(&line,&s,fin)!=-1)
			{
			printf("'%s',",strtok(line,delim2));
			}
		printf("],");

		printf("jobkey:'%s'}",key);
		done();
		return 1;
		}
	if(cgiVarExists("addtrack"))
		{
		char *tabixfile;
		assert(asprintf(&tabixfile,"%s/%s.allenhancers.gz",WWWT,key)>0);
		struct stat sbuf;
		if(stat(tabixfile,&sbuf)==-1)
			{
			// tabix file not there, make it
			if(chdir(resultdir)!=0)
				{
				printf("error:'chdir error'}");
				return 1;
				}
			char *command;
			assert(asprintf(&command,"sort -k1,1 -k2,2n %s/%s_Gateway_Enhancers.bed > %s/sorted",resultdir,Rose_input_fn,resultdir)>0);
			if(system(command)==-1) { printf("error:'cannot sort bed file'}");return 1;}
			assert(asprintf(&command,"bgzip -c %s/sorted > %s",resultdir,tabixfile)>0);
			if(system(command)==-1) { printf("error:'cannot run bgzip'}"); return 1; }
			assert(asprintf(&command,"tabix -p bed %s", tabixfile)>0);
			if(system(command)==-1) { printf("error:'cannot run tabix'}"); return 1; }

			assert(asprintf(&tabixfile,"%s/%s.superenhancers.gz",WWWT,key)>0);
			assert(asprintf(&command,"sort -k1,1 -k2,2n %s/%s_Gateway_SuperEnhancers.bed > %s/sorted",resultdir,Rose_input_fn,resultdir)>0);
			if(system(command)==-1) { printf("error:'cannot sort bed file'}");return 1;}
			assert(asprintf(&command,"bgzip -c %s/sorted > %s",resultdir,tabixfile)>0);
			if(system(command)==-1) { printf("error:'cannot run bgzip'}"); return 1; }
			assert(asprintf(&command,"tabix -p bed %s", tabixfile)>0);
			if(system(command)==-1) { printf("error:'cannot run tabix'}"); return 1; }
			}
		printf("jobkey:'%s'}",key);
		return 1;
		}
	/* super over */
	}



if(cgiVarExists("maketrack"))
	{
	char *key=cgiString("key");
	char *command;
	assert(asprintf(&command,"sort -k1,1 -k2,2n %s/%s > %s/%s.sorted",WWWT,key,WWWT,key)>0);
	if(system(command)==-1)
		{
		printf("abort:'cannot run sort'}");
		return 1;
		}
	free(command);
	assert(asprintf(&command,"mv %s/%s.sorted %s/%s",WWWT,key,WWWT,key)>0);
	if(system(command)==-1)
		{
		printf("abort:'cannot rename file'}");
		return 1;
		}
	assert(asprintf(&command,"bgzip %s/%s",WWWT,key)>0);
	if(system(command)==-1)
		{
		printf("abort:'cannot run bgzip'}");
		return 1;
		}
	free(command);
	assert(asprintf(&command,"tabix -p bed %s/%s.gz",WWWT,key)>0);
	if(system(command)==-1)
		{
		printf("abort:'cannot run tabix'}");
		return 1;
		}
	free(command);
	printf("}");
	return 1;
	}


if(cgiVarExists("loaducschub"))
	{
	srand(time(0));
	int dig = rand();
	char *jsonfile;
	assert(asprintf(&jsonfile,"%s/%d.json",trashDir,dig)>0);
	char *msgfile;
	assert(asprintf(&msgfile,"%s/%d.msg",trashDir,dig)>0);
	char *command;
	assert(asprintf(&command,"python ucsc2jsonhub.py %s >%s 2>%s",cgiString("url"),jsonfile,msgfile)>0);
	if(system(command)==-1)
		{
		printf("abort:'server error, please try again'}");
		return 1;
		}
	free(command);
	assert(asprintf(&command,"mv %s %s/%d.json",jsonfile,WWWT,dig)>0);
	if(system(command)==-1)
		{
		printf("abort:'cannot move file'}");
		return 1;
		}
	printf("jsonfile:'%d.json',",dig);
	FILE *fin=fopen(msgfile,"r");
	if(fin==NULL)
		{
		printf("abort:'failed to open output file'}");
		return 1;
		}
	char *line=malloc(1);
	size_t s=1;
	while(getline(&line,&s,fin)!=-1)
		{
		printf("%s",line);
		}
	fclose(fin);
	printf("}");
	done();
	return 1;
	}





if(cgiVarExists("load_dblst"))
    {
	// sukn only
	FILE *fin=fopen(treeoflife,"r");
	if(fin==NULL)
		{
		printf("abort:'File not found: %s'}",treeoflife);
		return 1;
		}
	printf("dblst:");
	char *line=malloc(1);
	size_t s=1;
	while(getline(&line,&s,fin)!=-1)
		printf("%s", line);
	fclose(fin);
	printf("}");
	done();
	return 1;
    }




/********* following things all require db connection, quite untidy **/


if(cgiVarExists("repeatbrowser"))
	{
	/**** __rb__ repeatbrowser
	exit when done
	***/
	if(cgiVarExists("rpbrDbname"))
		{
		if(!mysqlConnect(cgiString("rpbrDbname")))
			{
			printf("'mysqldberror':1}");
			return 0;
			}
		}
	if(cgiVarExists("viewkey"))
		printf("'key':'%s',", cgiString("viewkey"));

	if(cgiVarExists("getfileinfo"))
		{
		char *query;
		char *file=cgiString("getfileinfo");
		assert(asprintf(&query, "select info from tk2info where name='%s'", file)>0);
		printf("'text':'%s','file':'%s'}", mysqlGetOnestring(query),file);
		free(query);
		done();
		return 1;
		}
	if(cgiVarExists("geoaccidlst"))
		{
		/* to fetch ratio data for a group of geo/tks to display in the bigmap
		*/
		char *query, **row;
		char delim[]=",";
		char *tok=strtok(cgiString("geoaccidlst"),delim);
		while(tok!=NULL)
			{
			assert(asprintf(&query, "select subfam_id,ratio_1,ratio_2 from ratiomatrix where geo_id=%s", tok)>0);
			MYSQL_RES *sr=mysqlGetResult(query);
			free(query);
			printf("%s:{", tok);
			while((row=mysql_fetch_row(sr))!=NULL)
				printf("%s:[%s,%s],", row[0],row[1],row[2]);
			printf("},");
			mysql_free_result(sr);
			tok=strtok(NULL,delim);
			}
		printf("}");
		done();
		return 1;
		}
	if(cgiVarExists("getsubfamcopiesonly"))
		{
		/* to fetch genome copies of a subfam for display
		*/
		struct beditem2 *sl=getRepeats4subfam();
		printf("'genomecopies':[");
		struct beditem2 *t;
		for(t=sl; t!=NULL; t=t->next)
			{
			printf("['%s',%d,%d,'%c'],", t->chrom, t->start, t->stop, t->strand);
			}
		printf("]}");
		slFree(sl);
		done();
		return 1;
		}
	if(cgiVarExists("getsubfamcopieswithtk"))
		{
		struct beditem2 *rsl=getRepeats4subfam();
		int itemtotalcount=0;
		struct beditem2 *t;
		for(t=rsl; t!=NULL; t=t->next) itemtotalcount++;

		/* see which tracks to query
			tabix handles are opened in child but **not parent**
			see below
		struct tabixHandle *treatSl=NULL, *inputSl=NULL, *tt;
		assert(asprintf(&query,"select treatment,control from geo2xx where geo='%s'",geoAcc)>0);
		sr=mysqlGetResult(query);
		row=mysql_fetch_row(sr);
		if(row!=NULL)
			{
			if(row[0]==NULL)
				{
				fprintf(stderr, "geo %s gets no treatment track!\n", geoAcc);
				exit(0);
				}
			treatSl=repeatbrowser_parseTrack(row[0],1);
			if(row[1]!=NULL)
				inputSl=repeatbrowser_parseTrack(row[1],1);
			}
		mysql_free_result(sr);
		*/

		char *geoAcc=cgiString("geo");

		char *query, **row;

		struct tabixHandle *tt;
		assert(asprintf(&query,"select treatment,control from geo2info where geo='%s'",geoAcc)>0);
		MYSQL_RES *sr=mysqlGetResult(query);
		row=mysql_fetch_row(sr);
		char *treatTkstr=strdup(row[0]);
		char *inputTkstr=NULL;
		if(row[1]!=NULL) inputTkstr=strdup(row[1]);
		mysql_free_result(sr);

		/** filters will be added here
		to preserve those repeats that passes filter
		**/

		printf("'genomecopies':[");

		/* now tracks are ready, fetch data and print json
		single-process
		not_in_use
		for(t=itemsl; t!=NULL; t=t->next)
			{
			printf("['%s',%d,%d,'%c',%s,[", t->chrom, t->start, t->stop, t->strand, t->rest);
			// compute score for each treat track, return as a nested array
			for(tt=treatSl; tt!=NULL; tt=tt->next)
				printf("%f,",tabixQuery_bedgraph_singlepoint(tt->fin, t->chrom, t->start, t->stop));
			printf("]");
			if(inputSl!=NULL)
				{
				printf(",[");
				for(tt=inputSl; tt!=NULL; tt=tt->next)
					printf("%f,", tabixQuery_bedgraph_singlepoint(tt->fin, t->chrom, t->start, t->stop));
				printf("]");
				}
			printf("],");
			}
		*/

		/** _fork_ **/
		double itemperprocess=500;
		int processcount=(int)ceil(itemtotalcount/itemperprocess);
		char *depositfiles[processcount];
		int pidarr[processcount];
		struct beditem2 *itemPlist[processcount];
		struct beditem2 *ttt;

		// initialize stuff for forking
		int i,j;
		srand(time(0));
		int basenum=rand();
		t=rsl;
		for(i=0; i<processcount; i++)
			{
			assert(asprintf(&(depositfiles[i]), "%s/%d.%d", trashDir, basenum, i)>0);
			pidarr[i]=-1;
			itemPlist[i]=NULL;
			for(j=0; j<itemperprocess; j++)
				{
				if(t==NULL) break;
				ttt=malloc(sizeof(struct beditem2));
				ttt->chrom=t->chrom;
				ttt->start=t->start;
				ttt->stop=t->stop;
				ttt->strand=t->strand;
				ttt->rest=t->rest;
				ttt->next=itemPlist[i];
				itemPlist[i]=ttt;
				t=t->next;
				}
			}

		boolean notfinished = TRUE;
		int processRunningNum = 0;
		while(notfinished)
			{
			notfinished = FALSE;
			for(i=0; i<processcount; i++)
				{
				if(pidarr[i] == -1)
					{
					// this set is not processed yet
					if(processRunningNum == MaxProcessNum)
						{
						notfinished = TRUE;
						continue;
						}
					// fork for this set
					pid_t p = fork();
					if(p == 0)
						{
						// inside child process
						FILE *fout=fopen(depositfiles[i],"w");
						assert(fout!=NULL);

						/* oh no...
						tabix handles are opened in child, but not parent
						looks like when opened in parent, it will crash in the case of many processes
						maybe each handle will write to the same temp text file?
						*/
						struct tabixHandle *treatSl=repeatbrowser_parseTrack(treatTkstr,1);
						struct tabixHandle *inputSl=NULL;
						if(inputTkstr!=NULL)
							inputSl=repeatbrowser_parseTrack(inputTkstr,1);
						for(t=itemPlist[i]; t!=NULL; t=t->next)
							{
							fprintf(fout, "%s %d %d %c %s ", t->chrom, t->start, t->stop, t->strand, t->rest);
							// compute score for each treat track, return as a nested array
							for(tt=treatSl; tt!=NULL; tt=tt->next)
								fprintf(fout,"%f,",tabixQuery_bedgraph_singlepoint(tt->fin, t->chrom, t->start, t->stop));
							if(inputSl!=NULL)
								{
								fputs(" ", fout);
								for(tt=inputSl; tt!=NULL; tt=tt->next)
									fprintf(fout,"%f,", tabixQuery_bedgraph_singlepoint(tt->fin, t->chrom, t->start, t->stop));
								}
							fputs("\n", fout);
							}
						fclose(fout);
						_exit(0); // exit without flushing buffer
						}
					else if(p < 0)
						{
						fprintf(stderr, "error spawning child process at processidx %d\n", i);
						exit(0);
						}
					else
						{
						pidarr[i] = p;
						processRunningNum++;
						}
					notfinished = TRUE;
					}
				else if(pidarr[i] > 0)
					{
					// child has been forked
					int status;
					waitpid(pidarr[i], &status, 0);
					if(status == 0)
						{
						// child process has finished successfully
						pidarr[i] = 0;
						FILE *fin=fopen(depositfiles[i],"r");
						assert(fin!=NULL);
						char *line=malloc(1);
						size_t s=1;
						char delim[]="\n";
						while(getline(&line, &s, fin)!=-1)
							{
							printf("'%s',", strtok(line, delim));
							}
						fclose(fin);
						unlink(depositfiles[i]);
						//free(tk->tmpfile);
						}
					else
						{
						fprintf(stderr, "unknown status for child processidx %d %s\n", i, depositfiles[i]);
						exit(0);
						}
					processRunningNum--;
					}
				}
			}
		/** _fork_ ends ***/
		printf("]}");
		done();
		return 1;
		}
	if(cgiVarExists("getconsensuswig"))
		{
		if(cgiVarExists("viewkey")) printf("'key':'%s',", cgiString("viewkey"));
		char *subfam=cgiString("subfam");
		char *query, **row;

		assert(asprintf(&query,"select consensuslength from subfam2id where subfam='%s'",subfam)>0);
		int slen=mysqlGetPositiveInteger(query);
		if(slen==-1)
			{
			fprintf(stderr, "wrong %s\n", query);
			exit(0);
			}
		free(query);
		assert(asprintf(&query,"select treatment,control from geo2info where geo='%s'",cgiString("geo"))>0);
		MYSQL_RES *sr=mysqlGetResult(query);
		free(query);
		row=mysql_fetch_row(sr);
		struct tabixHandle *sl, *t;
		if(row==NULL && row[0]==NULL)
			{
			fprintf(stderr, "geo got no track %s\n", cgiString("geo"));
			exit(0);
			}
		sl=repeatbrowser_parseTrack(strdup(row[0]),2);
		printf("'treatment_all':[");
		double data[slen];
		int i=0;
		for(t=sl; t!=NULL; t=t->next)
			{
			printf("['%s',[", t->name);
			//fprintf(stderr, "treat %s\n", t->name);
			for(i=0; i<slen; i++) data[i]=0;
			tabixQuery_bedgraph(t->fin, subfam, 0, slen, slen, &data[0], summeth_mean);
			ti_close(t->fin);
			for(i=0; i<slen; i++) printf("%f,",data[i]);
			printf("]],");
			}
		slFree(sl);
		sl=repeatbrowser_parseTrack(row[0],3);
		printf("],'treatment_unique':[");
		for(t=sl; t!=NULL; t=t->next)
			{
			printf("['%s',[", t->name);
			for(i=0; i<slen; i++) data[i]=0;
			tabixQuery_bedgraph(t->fin, subfam, 0, slen, slen, &data[0], summeth_mean);
			ti_close(t->fin);
			for(i=0; i<slen; i++) printf("%f,",data[i]);
			printf("]],");
			}
		slFree(sl);

		printf("],");
		if(row[1]!=NULL)
			{
			sl=repeatbrowser_parseTrack(strdup(row[1]),2);
			printf("'input_all':[");
			for(t=sl; t!=NULL; t=t->next)
				{
				printf("['%s',[", t->name);
				//fprintf(stderr, "input %s\n", t->name);
				for(i=0; i<slen; i++) data[i]=0;
				tabixQuery_bedgraph(t->fin, subfam, 0, slen, slen, &data[0], summeth_mean);
				ti_close(t->fin);
				for(i=0; i<slen; i++) printf("%f,",data[i]);
				printf("]],");
				}
			slFree(sl);
			sl=repeatbrowser_parseTrack(row[1],3);
			printf("],'input_unique':[");
			for(t=sl; t!=NULL; t=t->next)
				{
				printf("['%s',[", t->name);
				for(i=0; i<slen; i++) data[i]=0;
				tabixQuery_bedgraph(t->fin, subfam, 0, slen, slen, &data[0], summeth_mean);
				ti_close(t->fin);
				for(i=0; i<slen; i++) printf("%f,",data[i]);
				printf("]],");
				}
			printf("],");
			slFree(sl);
			}
		mysql_free_result(sr);

		// the genome copy density
		sl=repeatbrowser_parseTrack(NULL, 4);
		printf("'density':[");
		for(i=0; i<slen; i++) data[i]=0;
		tabixQuery_bedgraph(sl->fin, subfam, 0, slen, slen, &data[0], summeth_mean);
		ti_close(sl->fin);
		for(i=0; i<slen; i++) printf("%f,", data[i]);
		printf("],");

		// consensus seq if available
		assert(asprintf(&query, "select seq from subfam2seq where name='%s'", subfam)>0);
		char *seq=mysqlGetOnestring(query);
		free(query);
		if(seq!=NULL)
			printf("'consensusseq':'%s',", seq);

		printf("}");
		done();
		return 1;
		}
	}






/* kegg rest api */
if(cgiVarExists("listkeggpathway"))
	{
	srand(time(0));
	int randnum=rand();
	char *outfile;
	assert(asprintf(&outfile,"%s/%d",trashDir,randnum)>0);
	char *command;
	assert(asprintf(&command,"wget http://rest.kegg.jp/list/pathway/%s -O %s",cgiString("speciescode"),outfile)>0);
	if(system(command)==-1)
		{
		printf("'error':1}");
		return 1;
		}
	char delim[]="\t\n";
	char *tok1,*tok2;
	FILE *fin=fopen(outfile,"r");
	if(fin==NULL)
		{
		printf("'error':1}");
		return 1;
		}
	char *line=malloc(1);
	size_t s=1;
	printf("'lst':[");
	while(getline(&line,&s,fin)!=-1)
		{
		tok1=strtok(line,delim);
		if(tok1==NULL) continue;
		tok2=strtok(NULL,delim);
		if(tok2==NULL) continue;
		printf("['%s',\"%s\"],",tok1,tok2);
		}
	printf("]}");
	fclose(fin);
	unlink(outfile);
	return 1;
	}	




char *dbName=cgiString("dbName");
if(dbName==NULL)
	{
	if(SQUAWK) fputs("No dbName, not connecting db\n",stderr);
	}
else
	{
	if(SQUAWK) fprintf(stderr, "Hooked to %s\n",dbName);
	if(!cgiVarExists("iscustomgenome"))
		{
		if(!mysqlConnect(dbName))
			{
			printf("unknowngenomedb:\"%s\"}",dbName);
			return 0;
			}
		}
	}


if(cgiVarExists("searchtable"))
	{
	char *query;
	char *table=cgiString("searchtable");
	assert(asprintf(&query,"show tables like \"%s\"",table)>0);
	if(mysqlResultAffirmative(query))
		{
		free(query);
		assert(asprintf(&query,"select * from %s where name like \"%%%s%%\" limit 10",table,cgiString("text"))>0);
		MYSQL_RES *sr=mysqlGetResult(query);
		char **row;
		printf("lst:[");
		while((row=mysql_fetch_row(sr))!=NULL)
			{
			printf("{chrom:'%s',start:%s,stop:%s,name:'%s'},",row[0],row[1],row[2],row[3]);
			}
		printf("]}");
		}
	else
		{
		printf("error:'table does not exist'}");
		}
	done();
	return 1;
	}




if(cgiVarExists("session"))
    session = cgiString("session");
if(cgiVarExists("statusId"))
    statusId = cgiInt("statusId");




if(cgiVarExists("scfdruntimesync"))
	{
	char *query;
	assert(asprintf(&query, "select names from scaffoldRuntime where session='%s' and statusId=%s", cgiString("session"), cgiString("status"))>0);
	char *re=mysqlGetOnestring(query);
	if(re==NULL)
		{
		printf("'error':1}");
		}
	else
		{
		char delim[]=",";
		char *tok=strtok(re,delim);
		printf("'lst':[");
		while(tok!=NULL)
			{
			printf("'%s',", tok);
			strtok(NULL,delim);
			tok=strtok(NULL,delim);
			}
		printf("]}");
		}
	done();
	return 1;
	}


if(cgiVarExists("getgenesbykeggpathway"))
	{
	/* need db connection
	use species code (hsa) and pathway id (hsa00010) to query list of kegg genes
	then for each gene convert to refgene name and return
	*/
	char *pathway=cgiString("pathway");
	printf("'pathway':'%s',",pathway);
	srand(time(0));
	char *filename;
	assert(asprintf(&filename, "%s/%d", trashDir, rand())>0);
	char *comm;
	assert(asprintf(&comm, "wget http://rest.kegg.jp/link/%s/%s -O %s", cgiString("speciescode"),pathway,filename)>0);
	if(system(comm)==-1)
		{
		printf("abort:'cannot run command %s'}",comm);
		return 1;
		}
	char *query;
	char delim[]=":\n";
	char *line=malloc(1);
	size_t s=1;
	FILE *fin=fopen(filename,"r");
	if(fin==NULL)
		{
		printf("abort:'cannot open file'}");
		return 1;
		}
	printf("'lststring':'");
	while(getline(&line,&s,fin)!=-1)
		{
		strtok(line,delim);
		strtok(NULL,delim);
		char *tok=strtok(NULL,delim);
		if(tok==NULL) continue;
		assert(asprintf(&query, "select refgene from kegg2refgene where kegg='%s'", tok)>0);
		char *re=mysqlGetOnestring(query);
		free(query);
		if(re!=NULL) printf("%s\\n", re);
		}
	printf("'}");
	fclose(fin);
	unlink(filename);
	done();
	return 1;
	}



if(conn)
	{
	assert((bbiDir=mysqlGetOnestring("select bbiPath from config"))!=NULL);
	seqPath=mysqlGetOnestring("select seqPath from config");
	}




/****************************
  SESS sessions
  FIXME special case for rpbr beaming, told by RM_rpbr_beam
****************************/
if(cgiVarExists("saveSession"))
	{
	if(SQUAWK) fprintf(stderr, "saving status for %s %d...\n", session, statusId);
	char *command;
	char *path;
	assert(asprintf(&path,"%s/session/%s",bbiDir,session)>0);
	struct stat sbuf;
	if(stat(path,&sbuf)==-1)
		{
		assert(asprintf(&command,"mkdir %s",path)>0);
		if(system(command)==-1)
			{
			printf("abort:'Failed to create session directory'}");
			return 1;
			}
		free(command);
		}
	srand(time(0));
	int newstatusid=rand();
	assert(asprintf(&path,"%s/%d",path,newstatusid)>0);
	if(stat(path,&sbuf)==-1)
		{
		assert(asprintf(&command,"mkdir %s",path)>0);
		if(system(command)==-1)
			{
			printf("abort:'Failed to create status directory'}");
			return 1;
			}
		free(command);
		}

	char *key=cgiString("key");
	assert(asprintf(&command,"mv %s/%s %s/json",WWWT,key,path)>0);
	if(system(command)==-1)
		{
		printf("abort:\"%m: %s\"}",command);
		return 1;
		}
	free(command);

	assert(asprintf(&path,"%s/note",path)>0);
	FILE *fout=fopen(path,"w");
	if(fout==NULL)
		{
		printf("abort:\"%m: %s\"}",path);
		return 1;
		}
	char *note;
    if(cgiVarExists("note"))
		{
        note = cgiString("note");
		}
    else
        {
        char *cast[] = {"Shaun the sheep", "Wallace the British folk", "Gromit the clay-dog", "Bunny the were-rabbit", "Tachikoma the taranchula", "Bato the veteran", "Popeye the sailor", "Ginger the chicken", "Rocky the rooster", "Tweedy the rancher", "Emily the bride", "Remy the chef", "Roddy the pet", "Rita the stealth", "Shrek the ogre", "Lyra's Golden Compass", "Will's Subtle Knife", "A computerless wire"};
		note = cast[(int)(18*((float)rand()/RAND_MAX))];
		}
	char *tmp;
	assert(asprintf(&tmp, "{session:\"%s\",status:%d,note:\"%s\",tkcount:%s}",session,newstatusid,note,cgiString("tkcount"))>0);
	fprintf(fout,"%s",tmp);
	fclose(fout);
    printf("ticket:%s}",tmp);
	done();
    return 1;
    }

if(cgiVarExists("pastSession"))
    {
    /* retrieve saved status for a past session, 
       display on client side for user to choose which one to restore
     */
    char *session2use = cgiString("pastSession"); // session on which info will be retrieved
	char *path=session_exists(session2use);
	if(path==NULL)
		{
		printf("error:1}");
		}
	else
		{
		sessionstatus2json(path);
		printf("}");
		}
	done();
    return 1;
    }

if(cgiVarExists("deleteSession"))
    {
    char *session = cgiString("thissession");
    char *status = cgiString("thisstatus");
	char *path=sessionstatus_exists(session,status);
	if(path==NULL)
		{
		printf("error:1}");
		return 1;
		}
	char *command;
	assert(asprintf(&command,"/bin/rm -r %s",path)>0);
	if(system(command)==-1)
		{
		printf("error:2");
		}
	path=session_exists(session);
	if(path!=NULL)
		{
		char *path2;
		assert(asprintf(&path2,"%s/*",path)>0);
		glob_t globbuf;
		glob(path2,GLOB_ERR,NULL,&globbuf);
		if(globbuf.gl_pathc==0)
			{
			assert(asprintf(&command,"/bin/rm -r %s",path)>0);
			if(system(command)==-1)
				{
				printf("error:2");
				}
			}
		}
    printf("}");
	done();
    return 1;
    }

if(cgiVarExists("validatesession"))
    {
	char *oldsession=cgiString("oldsession");
	char *path=session_exists(oldsession);
	if(path==NULL)
		{
		printf("error:1");
		}
	else
		{
		printf("session:'%s',",oldsession);
		if(cgiVarExists("oldstatus"))
			{
			char *oldstatus=cgiString("oldstatus");
			char *path=sessionstatus_exists(oldsession,oldstatus);
			if(path==NULL)
				{
				printf("error:1");
				}
			else
				{
				printf("status:%s",oldstatus);
				}
			}
		else
			{
			sessionstatus2json(path);
			}
		}
	printf("}");
	done();
    return 1;
    }





/** load and return info on a genome, so that js will build the object
TODO none-genome related info need to be separated out
exit when done
**/
if(cgiVarExists("loadgenome"))
	{
	if(SQUAWK) fputs("fetching genome info...\n", stderr);
	printf("'dbname':'%s',", dbName);
	if(seqPath==NULL)
		printf("'noblastdb':true,");

    char **row, *re;
	FILE *fin;
	char *fpath;
	MYSQL_RES *sr=NULL;

	/* timecourse */
	if(mysqlResultAffirmative("show tables like \"yearlyMonthlyLength\""))
		{
		printf("'yearlyMonthlyLength':[");
		sr=mysqlGetResult("select * from yearlyMonthlyLength");
		while((row=mysql_fetch_row(sr))!=NULL)
			printf("[%s,%s,%s],",row[0],row[1],row[2]);
		printf("],");
		mysql_free_result(sr);
		}

	printf("defaultPosition:\"%s\",",mysqlGetOnestring("select defaultPosition from config"));
	printf("hasGene:%s,",mysqlGetOnestring("select hasGene from config"));
	printf("allowJuxtaposition:%s,",mysqlGetOnestring("select allowJuxtaposition from config"));
	printf("defaultGenelist:\"%s\",",mysqlGetOnestring("select defaultGenelist from config"));
	printf("defaultScaffold:\"%s\",",mysqlGetOnestring("select defaultScaffold from config"));
	printf("defaultCustomtracks:%s,",mysqlGetOnestring("select defaultCustomtracks from config"));
	re=mysqlGetOnestring("select defaultDecor from config");
	if(re!=NULL)
		printf("defaultDecor:\"%s\",",re);
	printf("runmode:%s,",mysqlGetOnestring("select runmode from config"));
	printf("initmatplot:%s,",mysqlGetOnestring("select initmatplot from config"));

	re=mysqlGetOnestring("select keggSpeciesCode from config");
	if(re!=NULL)
		printf("keggSpeciesCode:'%s',",re);


	// publichub
	assert(asprintf(&fpath,"%s/config/publichub.json",bbiDir)>0);
	fin=fopen(fpath,"r");
	free(fpath);
	if(fin!=NULL)
		{
		printf("publichub:");
		printEntirefile(fin);
		printf(",");
		fclose(fin);
		}


	// decors
	assert(asprintf(&fpath,"%s/config/tracks.json",bbiDir)>0);
	fin=fopen(fpath,"r");
	free(fpath);
	if(fin!=NULL)
		{
		printf("decorJson:");
		printEntirefile(fin);
		printf(",");
		fclose(fin);
		}




    // cytoband
	if(mysqlResultAffirmative("show tables like \"cytoband\""))
		{
		sr = mysqlGetResult("select chrom,start,stop,colorIdx,name from cytoband");
		printf("'cytoband':[");
		while((row=mysql_fetch_row(sr)) != NULL)
			printf("['%s',%s,%s,%s,'%s'],", row[0], row[1], row[2], row[3], row[4]);
		printf("],");
		mysql_free_result(sr);
		}



    /* scaffold info, retrieve and return ALL of them
	FIXME what about 80,000 contigs???
	*/
    sr = mysqlGetResult("select parent,child,childLength from scaffoldInfo");
	assert(sr!=NULL);
    printf("'scaffoldInfo':[");
    while((row=mysql_fetch_row(sr)) != NULL)
		{
        printf("['%s','%s',%s],",row[0],row[1],row[2]);
		}
    printf("],");
    mysql_free_result(sr);


	// linkage group
	if(mysqlResultAffirmative("show tables like \"linkageGroup\""))
		{
		sr=mysqlGetResult("select * from linkageGroup");
		assert(sr!=NULL);
		printf("linkagegroup:[");
		while((row=mysql_fetch_row(sr))!=NULL)
			{
			printf("['%s','%s',%s,%s,'%s'],",row[0],row[1],row[2],row[3],row[4]);
			}
		printf("],");
		mysql_free_result(sr);
		}

	if(cgiVarExists("serverload"))
		{
		printf("'trashDir':'%s',",trashDir);

		// get server load
		char *trashfile;
		assert(asprintf(&trashfile, "%s/sysload", trashDir)>0);
		char *comm;
		assert(asprintf(&comm, "uptime > %s", trashfile)>0);
		if(system(comm) == -1)
			errabort("cannot do system call");
		free(comm);
		FILE *fin = fopen(trashfile, "r");
		if(fin != NULL)
			{
			char *line = malloc(1);
			size_t s = 1;
			if(getline(&line, &s, fin))
				{
				// good idea to parse the string on client side
				char delim[] = "\n";
				printf("'serverload':'%s',",strtok(line, delim));
				}
			fclose(fin);
			}
		free(trashfile);

		// host name
		assert(asprintf(&trashfile, "%s/sysload", trashDir)>0);
		assert(asprintf(&comm, "hostname > %s", trashfile)>0);
		if(system(comm) == -1)
			errabort("cannot do system call");
		free(comm);
		fin = fopen(trashfile, "r");
		if(fin != NULL)
			{
			char *line = malloc(1);
			size_t s = 1;
			if(getline(&line, &s, fin))
				{
				// good idea to parse the string on client side
				char delim[] = "\n";
				printf("'hostname':'%s',",strtok(line, delim));
				}
			fclose(fin);
			}
		free(trashfile);
		}

	/* if loading data for repeat browser, don't quit here
	repeatbrowser requests will be dealt with after tempurl assembling
	*/
	if(cgiVarExists("rpbr_init"))
		{
		// retrieve hmtk2geo info
		if(SQUAWK) fputs("rpbr_init...\n",stderr);
		sr=mysqlGetResult("select * from track2GEO");
		printf("'geo2track':{");
		while((row=mysql_fetch_row(sr))!=NULL)
			printf("'%s':'%s',",row[1],row[0]);
		printf("},");
		mysql_free_result(sr);
		mysql_close(conn);
		char *ss= cgiString("rpbrDbname");
		assert(ss!=NULL);
		if(!mysqlConnect(ss))
			{
			fprintf(stderr, "repeatbrowser: cannot connect mysql %s\n", ss);
			return 0;
			}
		sr=mysqlGetResult("select * from subfam2id");
		// info on subfamilies
		printf("'subfam':[");
		while((row=mysql_fetch_row(sr))!=NULL)
			printf("['%s',%s,%s,'%s','%s',%s,%s],", row[0],row[1],row[2],row[3],row[4],row[5],row[6]);
		printf("],");
		mysql_free_result(sr);
		sr=mysqlGetResult("select * from geo2info");
		// info on geo
		printf("'geo':[");
		// TODO input tracks can be null
		while((row=mysql_fetch_row(sr))!=NULL)
			printf("['%s',%s,'%s','%s','%s'],", row[0],row[1],row[2],row[3],row[4]==NULL?"":row[4]);
		printf("],");
		mysql_free_result(sr);
		printf("}");
		done();
		return 1;
		}
	else
		{
		printf("}");
		done();
		return 1;
		}
	}






/*** fetch information on a genome
     exit when done
 ***/
if(cgiVarExists("getgenomeinfo"))
    {
    printf("'info':\"%s\"}", mysqlGetOnestring("select information from config"));
	done();
    return 1;
    }





/*** save pieces of long URL
     exit when done
 ***/
if(cgiVarExists("saveURLpiece"))
    {
	if(0) fputs("saving URL piece...\n", stderr);
    char *query;
    if(asprintf(&query, "insert into tempURL values('%s', %s, '%s')", session, cgiString("offset"), cgiString("saveURLpiece"))<0) errabort("bae");
    mysqlUpdate(query);
	printf("}");
    if(0) fputs("url piece saved\n", stderr);
	done();
    return 1;
    }




if(cgiVarExists("searchgenetknames"))
	{
	// gene track list, global variable
	genetrack_sl=NULL;
	char delim[]=",";
	char *tok=strtok(cgiString("searchgenetknames"),delim);
	while(tok!=NULL)
		{
		struct slNode *t=malloc(sizeof(struct slNode));
		t->name=strdup(tok);
		t->next=genetrack_sl;
		genetrack_sl=t;
		tok=strtok(NULL,delim);
		}
	}

normalchr_sl=NULL;
if(conn)
	{
	// normal chr list, global variable
	char *re=mysqlGetOnestring("select defaultScaffold from config");
	if(re!=NULL)
		{
		char delim[]=",";
		struct slNode *t;
		char *tok=strtok(re,delim);
		while(tok!=NULL)
			{
			t=malloc(sizeof(struct slNode));
			t->name=tok;
			t->next=normalchr_sl;
			normalchr_sl=t;
			tok=strtok(NULL,delim);
			}
		}
	}
else if(cgiVarExists(customscaffoldlen))
	{
	// chr len of custom genome, passed from js
	char delim[]=",";
	struct slNode *t;
	char *re=strdup(cgiString(customscaffoldlen));
	char *tok=strtok(re,delim);
	while(tok!=NULL)
		{
		t=malloc(sizeof(struct slNode));
		t->name=tok;
		t->next=normalchr_sl;
		normalchr_sl=t;
		strtok(NULL,delim);
		tok=strtok(NULL,delim);
		}
	}



if(cgiVarExists("getcoord4genenames"))
	{
	/* validating a group of gene names for adding gene set
	get coord, struct, desc
	*/
	try_restoreScfd();

	struct geneParam *geneparam=initGeneParam();
	geneparam->use_exactmatch=TRUE;
	geneparam->use_chromid=TRUE;
	char delim[] = ",";
	char *tok = strtok(cgiString("lst"), delim);
	// must make a list first
	struct slNode *sl2=NULL, *t2;
	while(tok!=NULL)
		{
		t2=malloc(sizeof(struct slNode));
		t2->name=strdup(tok);
		t2->next=sl2;
		sl2=t2;
		tok=strtok(NULL,delim);
		}
	printf("result:[");
	struct gene *sl, *t;
	int oldlastchridx=lastChrIdx;
	for(t2=sl2; t2!=NULL; t2=t2->next)
		{
		// test to see if it is gene
		geneparam->query_str=t2->name;
		sl = queryGene(geneparam);
		if(sl != NULL)
			{
			printf("{query:\"%s\",lst:[",t2->name);
			for(t=sl; t!=NULL; t=t->next)
				{
				printf("{c:'%s',a:%d,b:%d,isgene:true,type:'%s',%s},",
					chrInfo[t->chromIdx]->name,
					t->report_start,
					t->report_stop,
					t->type,
					t->jsontext
					);
				}
			printf("]},");
			}
		}
	printf("],");
	if(lastChrIdx!=oldlastchridx)
		{
		printf("newscaffold:1");
		}
	printf("}");
	done();
	return 1;
	}






/* find genes by partial name
*/
if(cgiVarExists("findgenebypartialname"))
	{
	char *query=cgiString("query");
	struct geneParam *param=initGeneParam();
	param->query_str=query;
	param->have_name=TRUE;
	struct gene *re=queryGene(param);
	printf("lst:[");
	struct gene *g;
	int count=0;
	for(g=re; g!=NULL; g=g->next)
		{
		if(count++==100) break;
		printf("'%s',", g->name);
		}
	printf("]}");
	done();
	return 1;
	}




/*** fetch detail for one track
     this never gonna make long url
     exit when done
 ***/
if(cgiVarExists("gettrackdetails"))
    {
    if(!cgiVarExists("tkname"))
        {
		printf("'abort':'no track name given'}");
		return 1;
		}
    char *query;
    char *result;
    char *tkname = cgiString("tkname");

    // general
    assert(asprintf(&query, "select detail from track2Detail where name=\"%s\"", tkname)>0);
    result = mysqlGetOnestring(query);
    free(query);
    if(result!=NULL) printf("general:\"%s\",",result);

    printf("}");
	done();
    return 1;
    }

/* in case of having session and statusId, retrieve scaffolds in use,
   and initiate lastChrIdx, chrInfo
   the code will have to be ahead of any other code that uses lastChrIdx and chrInfo
   TODO make sure following "exit when done" branches need it
   if they don't need it, move them upward
 */
try_restoreScfd();





/*** revive URL after it has been completely saved in pieces
 ***/
if(cgiVarExists("reviveURL"))
	{
	// read everything from mysql, write into temp file, revive cgi param enviroment from file, clean up...
	char *query, **row;

	// count how many pieces are in db, to allocate memory for array...
	if(asprintf(&query, "select count(session) from tempURL where session=\"%s\"", session)<0) errabort("bae");
	int number = mysqlGetPositiveInteger(query);
	if(number == -1)
		{
		printf("\"abort\":\"cannot run query (supposedly cached URL missing)\"}");
		return 1;
		}

	struct urlpiece urp[number];
	int i=0;

	// having array, store url and offset into it
	if(asprintf(&query, "select offset,urlpiece from tempURL where session=\"%s\"", session)<0) errabort("bae");
	MYSQL_RES *sr = mysqlGetResult(query);
	while((row=mysql_fetch_row(sr)) != NULL)
		{
		assert((urp[i].offset=strMayPositiveInt(row[0]))!=-1);
		urp[i].text=strdup(row[1]);
		i++;
		}
	free(query);
	mysql_free_result(sr);

	// arrange pieces in correct order
	qsort(&urp, (size_t)number, sizeof(struct urlpiece), urlpiece_cmp);

	char *urlstring = NULL; // concatenate all of them into one string
	for(i=0; i<number; i++)
		{
		if(urlstring == NULL)
			{
			urlstring=strdup(urp[i].text);
			}
		else
			{
			char *tmp;
			if(asprintf(&tmp, "%s%s", urlstring, urp[i].text)<0) errabort("bae");
			free(urlstring);
			urlstring = tmp;
			}
		}
	if(0) fprintf(stderr,"assembled urlstring:\n%s\n\n", urlstring);

	//if(cgiVarExists("decodeURL"))
		{
		/* always decode URL */
		int len=strlen(urlstring);
		char *out = malloc(sizeof(char) * len);
		strDecode(urlstring, out, len);
		free(urlstring);
		urlstring = out;
		if(0) fprintf(stderr, "decoded urlstring:\n%s\n\n", urlstring);
		}


	/* dissect original url, use cgiVarSet on each param...
	must not free tsl->name
	as its values will be used in cgi enviroment
	*/
	struct slNode *tsl = NULL, *t;
	char delim[] = "&";
	// first param
	char *tok = strtok(urlstring, delim); assert(tok!=NULL);
	while(tok != NULL)
		{
		t = malloc(sizeof(struct slNode));
		t->name = tok;
		t->next = tsl;
		tsl = t;
		tok = strtok(NULL, delim);
		}
	char delim2[] = "=";
	char *tok1, *tok2;
	for(t=tsl; t!=NULL; t=t->next)
		{
		tok1 = strtok(t->name, delim2);
		tok2 = strtok(NULL, delim2);
		cgiVarSet(tok1, tok2);
		}


	// pieces in db must be cleaned up, or they will mess up new queries under same session
	if(asprintf(&query, "delete from tempURL where session=\"%s\"", session)<0) errabort("bae");
	mysqlUpdate(query);
	free(query);

	if(SQUAWK) fputs("url revived...\n", Squawk);
	}














/*** fetch chromosomal sequence
     exit when done
 ***/
if(cgiVarExists("getChromseq"))
    {
    // return one seq fragment for each region
	if(SQUAWK) fputs("getChromseq...\n", stderr);

    char *string = cgiString("regionlst");
    char delim[] = ",";
    char *tok = strtok(string, delim);
	struct beditem2 *sl=NULL, *tt;
    while(tok != NULL)
        {
		tt=malloc(sizeof(struct beditem2));
		tt->chrom= tok;
		assert((tok=strtok(NULL, delim))!=NULL);
		assert((tt->start=strMayPositiveInt(tok))!=-1);
		assert((tok=strtok(NULL, delim))!=NULL);
		assert((tt->stop=strMayPositiveInt(tok))!=-1);
		tt->next=sl;
		sl=tt;
		tok = strtok(NULL, delim);
		}
	slReverse(&sl);

	tabix_t *fin;
	if(cgiVarExists("url"))
		{
		fin=tabixOpen(cgiString("url"),TRUE);
		}
	else
		{
		fin=tabixOpen(seqPath,FALSE);
		}
	if(fin==NULL)
		{
		printf("abort:'Cannot open sequence file'}");
		return 1;
		}
    printf("lst:[");
	char *s;
	for(tt=sl; tt!=NULL; tt=tt->next)
		{
		s=getSeq(fin,tt->chrom, tt->start, tt->stop);
		if(s==NULL)
			{
			printf("'ERROR',");
			}
		else
			{
			printf("'%s',", s);
			free(s);
			}
		}
    printf("]}");
	done();
	ti_close(fin);
    return 1;
    }





/* GP fetch data for gene plot
   exit when done
 */
if(cgiVarExists("makegeneplot"))
    {
	fputs(">> gplot\n",stderr);
	// 0: gsv, 2: standalone

    /***************************
       Step 1, parse items 
     ***************************/
    struct nnode *itemsl = NULL, *item;

	// positional data: itemname, chr, start, stop, joined by comma
	char delim[] = ",";
	char *tok = strtok(cgiString("lst"), delim);
	while(tok != NULL)
		{
		item = malloc(sizeof(struct nnode));
		item->name = tok;
		assert((tok=strtok(NULL, delim))!=NULL);
		if((item->chrIdx=strMayChrID(tok))==-1)
			{
			scaffoldAddnew(tok);
			item->chrIdx=lastChrIdx;
			}
		assert((tok=strtok(NULL, delim))!=NULL);
		assert((item->start=strMayPositiveInt(tok))!=-1);
		assert((tok=strtok(NULL, delim))!=NULL);
		assert((item->stop=strMayPositiveInt(tok))!=-1);
		item->strand = strtok(NULL,delim)[0];
		if(item->strand == '.') item->strand = '+';
		item->next = itemsl;
		itemsl = item;
		tok = strtok(NULL, delim);
		}

    if(itemsl == NULL)
        {
		printf("'abort':'Gene Plot got no valid items'}");
		return 1;
		}

    if(0)
        {
        fputs("testing>>>\n", stderr);
        for(item=itemsl; item!=NULL; item=item->next)
            fprintf(stderr, "\t%s %d %d %d %c\n", item->name, item->chrIdx, item->start, item->stop, item->strand);
        fputs("done<<<\n", stderr);
		}


    /******************************
       Step 2
       retrieve data and store in memory
     ******************************/
	char *tmp=cgiString("datatkft");
	int ft=strMayPositiveInt(tmp);
	if(ft==-1)
		{
		printf("'alert':'wrong data track filetype','gpabort':1}");
		return 1;
		}
    char *urlpath=cgiString("datatk");
	tabix_t *fin=NULL;
	// different querying methods for bedgraph/tabix, categorical/tabix, and bigwig
	boolean isTabix=(ft==FT_bedgraph_c||ft==FT_bedgraph_n||ft==FT_qdecor_n);
	if(isTabix) {
		fin=tabixOpen(urlpath,TRUE);
		}
    int spnum = cgiInt("spnum");
    int i;
    char *plottype = cgiString("plottype");
    boolean is_s1 = strcmp(plottype,"s1")==0;
    boolean is_s2 = strcmp(plottype,"s2")==0;
    boolean is_s3 = strcmp(plottype,"s3")==0;
    boolean is_s4 = strcmp(plottype,"s4")==0;
    if(is_s1 || is_s2 || is_s4)
        {
		/* these types will take the coordinates as provided, everything, no matter gene or coord
		   make single vector for each item
		 */
		for(item=itemsl; item!=NULL; item=item->next)
			{
			double *data = malloc(sizeof(double) * spnum);
			for(i=0; i<spnum; i++) data[i] = 0;
			if(isTabix)
				tabixQuery_bedgraph(fin, chrInfo[item->chrIdx]->name, item->start, item->stop, spnum, data, summeth_mean);
			else
				bigwigQuery(urlpath,chrInfo[item->chrIdx]->name, item->start, item->stop, spnum, data, summeth_mean);
			item->data = data;
			}
		}
    else if(is_s3)
        {
		/* 5 vectors for the 5 segment types, only process genes
		   5 vectors concatenated into one, follow the order:
			  promoter, utr5, exons, introns, utr3

		   for genes missing certain parts, the data value corresponding to that part
		   is indicated by LONG_MAX, and later during R code output,
		   this value will be detected and replaced by NA
		   so the summary value won't be affected
		   I just assume using LONG_MAX should be secure....

		   revise this part of code as gene querying is called twice
		 */
		double tmpdata[spnum], // store single vector
			   sumdata[spnum]; // store sum for exons/introns
		int validgenenum = 0;
		struct geneParam *geneparam=initGeneParam();
		geneparam->parse_json=TRUE;
		geneparam->use_exactmatch=TRUE;
		for(item=itemsl; item!=NULL; item=item->next)
			{
			geneparam->query_str=item->name;
			struct gene *_sl = queryGene(geneparam);
			if(_sl== NULL)
				{
				item->data = NULL;
				continue;
				}
			struct gene *thisgene;
			for(thisgene=_sl; thisgene!=NULL; thisgene=thisgene->next)
				{
				if(thisgene->on_normalchr) break;
				}
			if(thisgene==NULL) thisgene=_sl;

			//__showgene(thisgene);

			validgenenum++;
			double *data = malloc(sizeof(double) * spnum * 5); // entire data vector containing sub vectors
			unsigned int regionstart, regionstop;
			int dataIdx=0;

			/*** promoter ***/
			for(i=0; i<spnum; i++)
				tmpdata[i] = 0;
			if(isTabix)
				tabixQuery_bedgraph(fin, chrInfo[item->chrIdx]->name, thisgene->report_start, thisgene->report_stop, spnum, &tmpdata[0], summeth_mean);
			else
				bigwigQuery(urlpath,chrInfo[item->chrIdx]->name, thisgene->report_start, thisgene->report_stop, spnum, &tmpdata[0], summeth_mean);
			if(item->strand == '-')
				{
				for(i=0; i<spnum; i++)
					data[dataIdx+i] = tmpdata[spnum-1-i];
				}
			else
				{
				for(i=0; i<spnum; i++)
					data[dataIdx+i] = tmpdata[i];
				}
			dataIdx += spnum;

			/*** 5' utr ***/
			if(thisgene->utr5width<=0)
				{
				// no 5' utr, use special value to indicate
				for(i=0; i<spnum; i++)
					data[dataIdx+i] = LONG_MAX;
				}
			else
				{
				regionstart=thisgene->utr5start;
				regionstop=thisgene->utr5start+thisgene->utr5width;
				for(i=0; i<spnum; i++)
					tmpdata[i] = 0;
				if(isTabix)
					tabixQuery_bedgraph(fin, chrInfo[item->chrIdx]->name, regionstart, regionstop, spnum, &tmpdata[0], summeth_mean);
				else
					bigwigQuery(urlpath, chrInfo[item->chrIdx]->name, regionstart, regionstop, spnum, &tmpdata[0], summeth_mean);
				if(item->strand == '-')
					{
					for(i=0; i<spnum; i++)
						data[dataIdx+i] = tmpdata[spnum-1-i];
					}
				else
					{
					for(i=0; i<spnum; i++)
						data[dataIdx+i] = tmpdata[i];
					}
				}
			dataIdx += spnum;

			/*** exons (average vector is computed for each gene) ***/
			if(thisgene->exoncount<=0)
				{
				// no exon
				for(i=0; i<spnum; i++)
					data[dataIdx+i] = LONG_MAX;
				}
			else
				{
				for(i=0; i<spnum; i++) 
					sumdata[i]=0;
				int exon_use_count= 0;
				int exonidx=0;
				for(; exonidx<thisgene->exoncount; exonidx++) {
					regionstart=(thisgene->exons)[exonidx][0];
					regionstop=(thisgene->exons)[exonidx][1];
					if(regionstart>=regionstop)
						continue;
					for(i=0; i<spnum; i++) 
						tmpdata[i]=0;
					if(isTabix)
						tabixQuery_bedgraph(fin, chrInfo[item->chrIdx]->name, regionstart, regionstop, spnum, &tmpdata[0], summeth_mean);
					else
						bigwigQuery(urlpath, chrInfo[item->chrIdx]->name, regionstart, regionstop, spnum, &tmpdata[0], summeth_mean);
					for(i=0; i<spnum; i++)
						sumdata[i] += tmpdata[i];
					exon_use_count++;
					}
				if(item->strand == '-')
					{
					for(i=0; i<spnum; i++)
						data[dataIdx+i] = sumdata[spnum-1-i] / exon_use_count;
					}
				else
					{
					for(i=0; i<spnum; i++)
						data[dataIdx+i] = sumdata[i] / exon_use_count;
					}
				}
			dataIdx += spnum;
			/*** introns (average vector is computed) ***/
			if(thisgene->exoncount<=0)
				{
				// no intron
				for(i=0; i<spnum; i++)
					data[dataIdx+i] = LONG_MAX;
				}
			else
				{
				for(i=0; i<spnum; i++) 
					sumdata[i]=0;
				int intronidx=0;
				int intron_use_count=0;
				for(; intronidx<thisgene->exoncount; intronidx++)
					{
					regionstart=(thisgene->exons)[intronidx][1];
					if(intronidx <thisgene->exoncount-1) {
						regionstop=(thisgene->exons)[intronidx+1][0];
					} else {
						if(thisgene->utr3width) {
							regionstop=thisgene->utr3start;
						} else {
							regionstop=thisgene->txstop;
						}
					}
					if(regionstart>=regionstop)
						continue;
					for(i=0; i<spnum; i++) 
						tmpdata[i] = 0;
					if(isTabix)
						{
						tabixQuery_bedgraph(fin, chrInfo[item->chrIdx]->name, regionstart, regionstop, spnum, &tmpdata[0], summeth_mean);
						}
					else
						{
						bigwigQuery(urlpath, chrInfo[item->chrIdx]->name, regionstart, regionstop, spnum, &tmpdata[0], summeth_mean);
						}
					for(i=0; i<spnum; i++)
						sumdata[i] += tmpdata[i];
					intron_use_count++;
					}
				if(item->strand == '-')
					{
					for(i=0; i<spnum; i++)
						data[dataIdx+i] = sumdata[spnum-1-i] / intron_use_count;
					}
				else
					{
					for(i=0; i<spnum; i++)
						data[dataIdx+i] = sumdata[i] / intron_use_count;
					}
				}
			dataIdx += spnum;
			/*** 3' utr ***/
			if(thisgene->utr3width<=0)
				{
				// no 3' utr
				for(i=0; i<spnum; i++)
					data[dataIdx+i] = LONG_MAX;
				}
			else
				{
				for(i=0; i<spnum; i++) 
					tmpdata[i] = 0;
				regionstart=thisgene->utr3start;
				regionstop=thisgene->utr3start+thisgene->utr3width;
				if(isTabix)
					tabixQuery_bedgraph(fin, chrInfo[item->chrIdx]->name, regionstart,regionstop, spnum, &tmpdata[0], summeth_mean);
				else
					bigwigQuery(urlpath, chrInfo[item->chrIdx]->name, regionstart,regionstop, spnum, &tmpdata[0], summeth_mean);
				if(item->strand == '-')
					{
					for(i=0; i<spnum; i++)
						data[dataIdx+i] = tmpdata[spnum-1-i];
					}
				else
					{
					for(i=0; i<spnum; i++)
						data[dataIdx+i] = tmpdata[i];
					}
				}
			item->data = data;
			}
		if(validgenenum == 0)
			{
			// no valid gene to make s3 plot, need to abort
			if(fin!=NULL) ti_close(fin);
			printf("'alert':'no valid gene, please check your input','gpabort':1}");
			exit(0);
			}
		}
	if(fin!=NULL) ti_close(fin);

    /* Step 2.1
       make safe name for clustering
       this will be used in returning json data
     */
    struct slNode *clustersafenamesl = NULL, *namenode;
    if(is_s4)
        {
		i = 0;
		for(item=itemsl; item!=NULL; item=item->next)
			{
			namenode = malloc(sizeof(struct slNode));
			assert(asprintf(&(namenode->name), "g%d", i++)>0);
			namenode->next = clustersafenamesl;
			clustersafenamesl = namenode;
			}
		slReverse(&clustersafenamesl);
		}

    /* Step 2.2
       prepare to write data to temperary files
       - R rendering
       - clustering
     */
    boolean usingR = cgiVarExists("usingR"); // now this only means using R for rendering
    if(is_s4)
        usingR = FALSE;
    char *rfile; // a single file to hold R command
    char *pngfile;
    char *routfile; // dummy out file when calling R in batch mode
    char *rtmpfile; // temp file to store some R output (e.g. summary values)
    FILE *fout = NULL;
    if(is_s1 || is_s3 || is_s4 || usingR)
        {
		if(asprintf(&rfile, "%s/%s.geneplot", trashDir, session)<0) errabort("bae");
		fout = fopen(rfile, "w");
		if(fout == NULL)
			errabort("cannot open file for writing geneplot code");
		}
    if(asprintf(&routfile, "%s/%s.rout", trashDir, session)<0) errabort("bae");
    if(is_s1 || is_s3 || usingR)
        {
		// R code will be writen when using R for rendering or computing summary for s1/s3
		srand(time(0));
		if(asprintf(&pngfile, "%s/%d.png", WWWT, rand())<0) errabort("bae");
		if(asprintf(&rtmpfile, "%s/%s.rtmp", trashDir, session)<0) errabort("bae");
		if(usingR)
			fprintf(fout, "png(\"%s\", %s, %s)\n", pngfile, cgiString("width"), cgiString("height"));
		}


    /*********************************
       Step 3
       s2 json output of unprocessed data
       when doing R rendering, write to R source file
       finishes s2
     *********************************/
    double value;
    if(is_s2)
        {
		/* spaghetti plot, a list of vectors
		   [name string, v1, v2, v3, ...]
		 */
		printf("\"data\":[");
		if(usingR)
			fputs("mat = matrix(c(", fout);
		for(item=itemsl; item!=NULL; item=item->next)
			{
			printf("[\"%s\",", item->name);
			if(item->strand == '-')
				{ // reverse
				for(i=0; i<spnum; i++)
					{
					value = (item->data)[spnum-1-i];
					printf("%.2f,", value);
					if(usingR)
						fprintf(fout, "%.2f,", value);
					}
				}
			else
				{ // forward
				for(i=0; i<spnum; i++)
					{
					value = (item->data)[i];
					printf("%.2f,", value);
					if(usingR)
						fprintf(fout, "%.2f,", value);
					}
				}
			printf("],");
			}
		printf("],");
		if(usingR)
			{
			fseek(fout, -1, SEEK_CUR);
			fprintf(fout, "), nrow=%d)\n", spnum);
			fprintf(fout, "matplot(mat, type='l', lwd=%s, xlab=\"Genomic positions from 5' to 3'\", ylab='Data point values', xaxt='n')\ndev.off()\n", cgiString("lw"));
			fclose(fout);
			char *command;
			if(asprintf(&command, "R CMD BATCH --no-save %s %s", rfile, routfile)<0) errabort("bae");
			if(system(command) == -1)
			errabort("cannot spawn process to do clustering");
			printf("\"image\":\"%s\"", pngfile);
			}
		/*** s2 finishes ***/
		}

    /*********************************
       Step 4
       data processing/summarization for s1 and s3
       the summarization (calling summary function) has to be done in R
       summary numbers are writen to a text file
       parse it and return as json
       R rendering will be run in mean time if applicable
       this finishes up s1 and s3
     *********************************/
    if(is_s1)
        {
		// use R to summarize data
		fputs("mat = t(matrix(c(", fout);
		for(item=itemsl; item!=NULL; item=item->next)
			{
			if(item->strand == '-')
				{
				for(i=0; i<spnum; i++)
					fprintf(fout, "%.2f,", (item->data)[spnum-1-i]);
				}
			else
				{
				for(i=0; i<spnum; i++)
					fprintf(fout, "%.2f,", (item->data)[i]);
				}
			}
		fseek(fout, -1, SEEK_CUR);
		fprintf(fout, "), nrow=%d))\n", spnum);
		// no matter whether to use R to render or not, compute summary, save result in a file
		for(i=1; i<=spnum; i++)
			fprintf(fout, "write(summary(mat[,%d]), \"%s\", ncolumns=6, append=T, sep=\",\")\n", i, rtmpfile);
		if(usingR)
			{
			fprintf(fout, "boxplot(mat,outline=%s,range=%s,col=%s", cgiString("outlier"), cgiString("range"), cgiString("lc"));
			fseek(fout, -1, SEEK_CUR);
			fputs(",max=255),xlab=\"Genomic positions from 5' to 3'\",ylab=\"Data value distribution\")\n", fout);
			if(cgiVarExists("average"))
				{
				// draw average line
				fputs("lines(c(", fout);
				for(i=1; i<=spnum; i++)
					fprintf(fout, "%d,", i);
				fseek(fout, -1, SEEK_CUR);
				fputs("),c(", fout);
				for(i=1; i<=spnum; i++)
					fprintf(fout, "mean(mat[,%d],na.rm=T),", i);
				fseek(fout, -1, SEEK_CUR);
				fprintf(fout, "), lw=%s, col=%s", cgiString("lw"), cgiString("averagelc"));
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255))\n", fout);
				}
			fputs("dev.off()\n", fout);
			}
		fclose(fout);
		}
    else if(is_s3)
        {
		// won't reverse vector for genes on minus strand, this has already been done dude!
		fputs("mat = t(matrix(c(", fout);
		int all = spnum*5;
		for(item=itemsl; item!=NULL; item=item->next)
			{
			if(item->data == NULL)
				continue;
			for(i=0; i<all; i++)
				{
				float x = (item->data)[i];
				// FIXME why some values are printed out as "-nan" in maize??
				if(x==LONG_MAX || isnan(x))
					fputs("NA,", fout);
				else
					fprintf(fout, "%.2f,", (item->data)[i]);
				}
			}
		fseek(fout, -1, SEEK_CUR);
		fprintf(fout, "), nrow=%d))\n", all);
		// no matter whether to use R to render or not, compute summary, save result in a file
		for(i=1; i<=all; i++)
			fprintf(fout, "write(summary(mat[,%d])[1:6], \"%s\", ncolumns=6, append=T, sep=\",\")\n", i, rtmpfile);
		if(usingR)
			{
			fprintf(fout, "boxplot(mat,outline=%s,range=%s,xaxt='n',xlab=\"Genomic positions from 5' to 3'\",ylab=\"Data value distribution\",col=c(", cgiString("outlier"), cgiString("range"));
			char *col = cgiString("promoterc");
			for(i=0; i<spnum; i++)
				{
				fprintf(fout, "%s", col);
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255),", fout);
				}
			col = cgiString("utr5c");
			for(i=0; i<spnum; i++)
				{
				fprintf(fout, "%s", col);
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255),", fout);
				}
			col = cgiString("exonsc");
			for(i=0; i<spnum; i++)
				{
				fprintf(fout, "%s", col);
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255),", fout);
				}
			col = cgiString("intronsc");
			for(i=0; i<spnum; i++)
				{
				fprintf(fout, "%s", col);
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255),", fout);
				}
			col = cgiString("utr3c");
			for(i=0; i<spnum; i++)
				{
				fprintf(fout, "%s", col);
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255),", fout);
				}
			fseek(fout, -1, SEEK_CUR);
			fputs("))\n", fout);
			if(cgiVarExists("average"))
				{
				// draw average curve
				int j = 0;
				// promoter
				fputs("lines(c(", fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "%d,", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fputs("),c(",fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "mean(mat[,%d],na.rm=T),", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fprintf(fout, "),lw=%s,col=%s", cgiString("lw"), cgiString("average_promoterc"));
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255))\n", fout);
				j += spnum;
				// 5' utr
				fputs("lines(c(", fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "%d,", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fputs("),c(",fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "mean(mat[,%d],na.rm=T),", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fprintf(fout, "),lw=%s,col=%s", cgiString("lw"), cgiString("average_utr5c"));
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255))\n", fout);
				j += spnum;
				// exons
				fputs("lines(c(", fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "%d,", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fputs("),c(",fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "mean(mat[,%d],na.rm=T),", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fprintf(fout, "),lw=%s,col=%s", cgiString("lw"), cgiString("average_exonsc"));
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255))\n", fout);
				j += spnum;
				// introns
				fputs("lines(c(", fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "%d,", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fputs("),c(",fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "mean(mat[,%d],na.rm=T),", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fprintf(fout, "),lw=%s,col=%s", cgiString("lw"), cgiString("average_intronsc"));
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255))\n", fout);
				j += spnum;
				// 3' utr
				fputs("lines(c(", fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "%d,", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fputs("),c(",fout);
				for(i=0; i<spnum; i++)
					fprintf(fout, "mean(mat[,%d],na.rm=T),", j+i+1);
				fseek(fout, -1, SEEK_CUR);
				fprintf(fout, "),lw=%s,col=%s", cgiString("lw"), cgiString("average_utr3c"));
				fseek(fout, -1, SEEK_CUR);
				fputs(",max=255))\n", fout);
				}
			fprintf(fout, "axis(side=1, at=c(%d,%d,%d,%d,%d), labels=c(\"promoter\",\"5' UTR\",\"exons\",\"introns\",\"3' UTR\"))\n",spnum/2,spnum+spnum/2,spnum*2+spnum/2,spnum*3+spnum/2,spnum*4+spnum/2);
			fputs("dev.off()\n", fout);
			}
		fclose(fout);
		}
    // common step to run R code for s1 and s3, do json return
    if(is_s1 || is_s3)
        {
		/* the summarized data will be writen to rtmpfile
		   R "write" function is appending stuff to it
		   so have to remove this file if it exists (previous geneplot in same session)
		 */
		unlink(rtmpfile);
		char *command;
		if(asprintf(&command, "R CMD BATCH --no-save %s %s", rfile, routfile)<0) errabort("bae");
		if(system(command) == -1)
			errabort("cannot spawn process to do clustering");
		/* parse rtmpfile to read summary values and return as json

		   json: list of vectors, by number of spnum
		   each vector: [min, 1 qu, median, mean, 3 qu, max]
		   there's no item name!!
		 */
		char *line = malloc(1);
		size_t s = 1;
		char delim[] = "\n";
		FILE *fin = fopen(rtmpfile, "r");
		if(fin == NULL) errabort("s1/s3 rtmpfile not found");
		printf("\"data\":[");
		while(getline(&line, &s, fin) != -1)
			{
			printf("[%s],", strtok(line, delim));
			}
		printf("],");
		fclose(fin);
		if(usingR)
			printf("\"image\":\"%s\"", pngfile);
		/*** s1 and s3 finishes ***/
		}
    

    /*********************************
       Step 5
       clustering
       in certain clustering methods:
         - vectors with zero std need to be discarded in correlation-based distance metric
	 - should not transpose matrix in correlation-based distance metric
     *********************************/
    if(is_s4)
        {
		// make a logical vector in same length as itemsl
		int totalNum=0;
		for(item=itemsl; item!=NULL; item=item->next)
			totalNum++;
		int std0flag[totalNum]; // set to 1 for zero sd
		for(i=0; i<totalNum; i++)
			std0flag[i] = 0;
		int std0num = 0; // number of vectors with 0 std
		boolean transpose = TRUE; // whether to transpose matrix at creation
		if(cgiString("clustmethod")[0] == 'h')
			{
			if(cgiString("clustdist")[0] != 'e')
				{
				/* hierarchical, not using euclidean distance but using correlation based
				   need to escape 0-std vectors
				   need not to transpose matrix
				 */
				transpose = FALSE;
				i = 0;
				for(item=itemsl; item!=NULL; item=item->next)
					{
					if(standardDeviation(item->data, spnum) == 0)
					{
					std0num++;
					std0flag[i] = 1;
					}
					i++;
					}
				}
			}
		if(std0num > 0)
			{
			printf("\"zerosdgene\":[");
			i = 0;
			for(item=itemsl; item!=NULL; item=item->next)
				{
				if(std0flag[i++])
					{
					printf("\"%s\",", item->name);
					}
				}
			printf("],");
			}

		/* return data as json hash, key: safe name, value: [real name, v1, v2, ...]
		   also write data portion of R code
		   omit 0-std ones
		 */
		printf("\"data\":{");
		fprintf(fout, "mat = %smatrix(c(", transpose?"t(":"");
		namenode=clustersafenamesl;
		int k = 0;
		for(item=itemsl; item!=NULL; item=item->next)
			{
			if(!std0flag[k])
				{
				printf("\"%s\":[\"%s\",", namenode->name, item->name);
				if(item->strand == '-')
					{
					for(i=0; i<spnum; i++)
						{
						value = (item->data)[spnum-1-i];
						printf("%.2f,", value);
						fprintf(fout, "%f,", value);
						}
					}
				else
					{
					for(i=0; i<spnum; i++)
						{
						value = (item->data)[i];
						printf("%.2f,", value);
						fprintf(fout, "%f,", value);
						}
					}
				printf("],");
				}
			k++;
			namenode = namenode->next;
			}
		printf("},");
		fseek(fout, -1, SEEK_CUR);
		fprintf(fout, "), nrow=%d)", spnum);
		if(transpose)
			fputs(")\nrownames(mat)=c(", fout);
		else
			fputs("\ncolnames(mat)=c(", fout);
		i = 0;
		for(namenode=clustersafenamesl; namenode!=NULL; namenode=namenode->next)
			{
			if(!std0flag[i++])
				fprintf(fout, "\"%s\",", namenode->name);
			}
		fseek(fout, -1, SEEK_CUR);
		fputs(")\n", fout);

		/* clustering method specific processing */
		if(cgiString("clustmethod")[0] == 'k')
			{
			/* kmeans clustering */
			char *kmnamefile;
			char *kmclusterfile;
			if(asprintf(&kmnamefile, "%s/%s.kmname", trashDir, session)<0) errabort("bae");
			if(asprintf(&kmclusterfile, "%s/%s.kmcluster", trashDir, session)<0) errabort("bae");
			fprintf(fout, "k=kmeans(mat, %s, nstart=10)\n", cgiString("kmeanscnum"));
			fprintf(fout, "write(names(k$cluster), ncol=1, '%s')\n", kmnamefile);
			fprintf(fout, "write(k$cluster, ncol=1, '%s')\n", kmclusterfile);
			fclose(fout);
			char *command;
			if(asprintf(&command, "R CMD BATCH --no-save %s %s", rfile, routfile)<0) errabort("bae");
			if(system(command) == -1)
				errabort("cannot spawn process to do clustering");
			// return clustering result
			char *line = malloc(1); size_t s = 1;
			char delim[] = "\n";

			FILE *fin = fopen(kmnamefile, "r");
			if(fin == NULL) errabort("kmnamefile not found");
				printf("\"kmnames\":[");
			while(getline(&line, &s, fin) != -1)
				printf("\"%s\",", strtok(line, delim));
			printf("],");
			fclose(fin);
			fin = fopen(kmclusterfile, "r");
			if(fin == NULL) errabort("kmclusterfile not found");
				printf("\"kmnamecluster\":[");
			while(getline(&line, &s, fin) != -1)
				printf("%s,", strtok(line, delim));
			printf("]");
			fclose(fin);
			/*** kmeans done ***/
			}
		else
			{
			/* hclust: hierarchical clustering */
			char *hclustmergefile; // store hc$merge
			char *hclustlabelsfile; // store hc$labels
			char *hclustoutfile; // store hc$label[hc$order]
			char *hclustheightfile; // store hc$height
			if(asprintf(&hclustmergefile, "%s/%s.hclustmerge", trashDir, session)<0) errabort("bae");
			if(asprintf(&hclustoutfile, "%s/%s.hclustout", trashDir, session)<0) errabort("bae");
			if(asprintf(&hclustlabelsfile, "%s/%s.hclustlabels", trashDir, session)<0) errabort("bae");
			if(asprintf(&hclustheightfile, "%s/%s.hclustheight", trashDir, session)<0) errabort("bae");
			char dist = cgiString("clustdist")[0];
			char *agglomeration = cgiString("clustaglm");
			if(dist == 'e')
				{
				/* using euclidean distance, no filtering on vectors */
				fprintf(fout, "hc = hclust(dist(mat, method='e'), '%s')\n", agglomeration);
				}
			else
				{
				/* using spearman or pearson as distance metric, excluding 0-std vectors */
				fprintf(fout, "hc = hclust(as.dist(1-abs(cor(mat, method='%c'))), '%s')\n", dist, agglomeration);
				}
			fprintf(fout, "write(hc$labels[hc$order], '%s')\n", hclustoutfile);
			// write out hclust$merge, two children for each cluster, which number is validnum-1
			fprintf(fout, "write(hc$merge[1,], ncolumns=2, sep=',', '%s')\n", hclustmergefile);
			for(i=2; i<totalNum-std0num; i++)
				fprintf(fout, "write(hc$merge[%d,],ncolumns=2, append=T, sep=',', '%s')\n", i, hclustmergefile);
			fprintf(fout, "write(hc$labels, ncolumns=1, '%s')\n", hclustlabelsfile);
			fprintf(fout, "write(hc$height, ncolumns=1, '%s')\n", hclustheightfile);
			fclose(fout);

			char *command;
			if(asprintf(&command, "R CMD BATCH --no-save %s %s", rfile, routfile)<0) errabort("bae");
			if(system(command) == -1)
				errabort("cannot spawn process to do clustering");

			char *line = malloc(1); size_t s = 1;
			char delim[] = "\n";

			// return hc$labels, R's stubborn list of items
			FILE *fin = fopen(hclustlabelsfile, "r");
			if(fin == NULL) errabort("hclustlabelsfile not found");
			printf("\"hclustlabels\":[");
			while(getline(&line, &s, fin) != -1)
				printf("\"%s\",", strtok(line, delim));
			printf("],");
			fclose(fin);
			// return hc$labels[hc$order] the order of appearance of gene safe names
			fin = fopen(hclustoutfile, "r");
			if(fin == NULL) errabort("hclustoutfile not found");
				printf("\"hclustgenelst\":[");
			while(getline(&line, &s, fin) != -1)
				printf("\"%s\",", strtok(line, delim));
			printf("],");
			fclose(fin);
			// return hc$merge
			fin = fopen(hclustmergefile, "r");
			if(fin == NULL) errabort("hclustmergefile not found");
			printf("\"hclustmerge\":[");
			while(getline(&line, &s, fin) != -1)
				printf("[%s],", strtok(line, delim));
			printf("],");
			fclose(fin);

			// return hc$height
			fin = fopen(hclustheightfile, "r");
			if(fin == NULL) errabort("hclustheightfile not found");
			printf("\"hclustheight\":[");
			while(getline(&line, &s, fin) != -1)
				printf("%s,", strtok(line, delim));
			printf("],");
			fclose(fin);
			/*** hierarchical clustering done ***/
			}
		}

    printf("}");
	done();
    return 1;
    }


// triggers, aged
boolean trigger_changeGF = cgiVarExists("changeGF");
boolean trigger_zoom = cgiVarExists("zoom");
boolean trigger_move = cgiVarExists("move");
boolean trigger_imgAreaSelect = cgiVarExists("imgAreaSelect"); // defunc, relic...
boolean trigger_jump = cgiVarExists("jump");
boolean trigger_genesetview = cgiVarExists("itemlist"); // running in gene set view mode
boolean trigger_newitemlist = FALSE;
boolean trigger_scaffoldUpdate = cgiVarExists("scaffoldUpdate");
/* adding arbitrary types of custom tracks
so that it will fetch hmtk data */



struct displayedRegion dsp;
dsp.head = NULL;
dsp.tail = NULL;
dsp.chritemsl=NULL;
dsp.atbplevel = FALSE;
dsp.usedSummaryNumber = 0;
dsp.runmode = RM_genome;
dsp.juxtkft=-1;
dsp.juxtkurlpath=NULL;
dsp.tabix=NULL;

struct heatmap hm;
hm.dsp = &dsp;
hm.trackSl = NULL;
hm.decor0 = NULL;
hm.decor1 = NULL;
hm.decor8 = NULL;
hm.decor4 = NULL;
hm.decor5 = NULL;
hm.decor9 = NULL;
hm.decor10 = NULL;
hm.decor17=NULL;
hm.decor18=NULL;
hm.tk20=NULL;
hm.tk21=NULL;
hm.tk23=NULL;
hm.tk24=NULL;
hm.tk25=NULL;
hm.tk26=NULL;
hm.tk27=NULL;
hm.genetrack_sl = genetrack_sl;

hmSpan = cgiInt("hmspan");


/***************************************
dsp can be determined in a number of ways, exclusive of each other:
1. gene set view
2. juxtaposition
3. restore status
4. jump
5. normal (boundaries given via CGI)

based on "normal", dsp might be altered by following triggers:
1. image area select (defunc)
2. zoom out
3. move

Operations that will change zoom level will only be provided with dsp view boundaries,
no number of summary point will be given, 
an extension from one hmSpan to 3*hmSpan will be attempted.
Such includes: 
  - zoom in/out
  - change GF
  - jump
All the other operations will be provided the entire boundary,
and total number of summary points.

TODO better arrange code for:
new submission
adding new items
sorting
changing part
lstholder updating
***********************************/

if(trigger_genesetview)
	{
	if(SQUAWK) fputs("gene set view mode...\n", stderr);
	/*********************
	GSV gene set view

	case 1: raw user input
	case 2: update existing, in case of add/remove, change part, rearrange, sort
	case 3: revive from db and read-only, either session restore, or move/zoom/...
	but not rpbr beaming

	chrInfo array has to be made!
	but genes might appear in new scaffold and they will be added to chrInfo array
	**********************/
	/*char *session = cgiString("session");
	int statusId = cgiInt("statusId"); // won't change status id
	*/

	// custom geneset and kegg pathway are not discerned, treated the same...
	dsp.runmode = RM_gsv_c;

	trigger_newitemlist = cgiVarExists("new");

	if(trigger_newitemlist)
		{
		/* new-submit and update shares code in deciding exact coord of each item
		   - store in genesetRuntime as new entry
		   - generate and return new statusId
		   - store "session,statusId,itemlistId" in session (insert or update, depends on if session exists)
		   - return new border
		 */
		char *rawinput = cgiString("itemlist");
		char delim[] = ",";
		char *tok = strtok(rawinput, delim);
		boolean hasnewchr=FALSE;
		while(tok!=NULL)
			{
			// from str: chrom, start, stop, name
			struct region *r = malloc(sizeof(struct region));
			r->chromIdx = strMayChrID(tok);
			if(r->chromIdx==-1)
				{
				scaffoldAddnew(tok);
				r->chromIdx=lastChrIdx;
				hasnewchr=TRUE;
				}
			tok=strtok(NULL,delim);
			r->bstart = r->dstart = strMayPositiveInt(tok);
			assert(r->bstart!=-1);
			tok=strtok(NULL,delim);
			r->bstop = r->dstop = strMayPositiveInt(tok);
			assert(r->bstop!=-1);
			r->flank5start=r->flank5stop=r->flank3start=r->flank3stop=-1;
			r->strand='+';
			tok=strtok(NULL,delim);
			r->name = strdup(tok);
			r->isViewStart = FALSE;
			r->flag=TRUE;
			dspAddRegionTail(hm.dsp, r);
			tok=strtok(NULL,delim);
			}
		if(hasnewchr)
			{
			printf("newscaffold:1,");
			}


		/* border */
		printf("'border':['%s',%d,'%s',%d],", dsp.head->name,dsp.head->bstart,dsp.tail->name,dsp.tail->bstop);
		printf("'ajaxXtrigger_gsvupdate':1,");
		struct region *r;
		printf("'entirelst':[");
		for(r=dsp.head; r!=NULL; r=r->next)
			printf("{'chrom':'%s','name':'%s','start':%d,'stop':%d,'isgene':%s,'strand':'%c'},", chrInfo[r->chromIdx]->name,r->name,r->bstart,r->bstop,r->flag?"true":"false",r->strand);
		printf("],");

		// make long string for itemlist to be stored in genesetRuntime table, very inefficient
		char *longstr=gsv_dsp_makestring(hm.dsp);
		genesetRuntime_insert(session, statusId, longstr);
		free(longstr);
		if(SQUAWK) fputs("itemlist stored into db\n", Squawk);

		if(cgiVarExists(StartChrom_cgi))
			{
			char *startItem = cgiString(StartChrom_cgi);
			int startCoord = cgiInt(StartCoord_cgi);
			char *stopItem = cgiString(StopChrom_cgi);
			int stopCoord = cgiInt(StopCoord_cgi);
			trimRegionSl_itemlist(hm.dsp, startItem, startCoord, stopItem, stopCoord);
			makeDspWing_itemlist(hm.dsp);
			}
		else
			{
			computeEntireLength_itemlist(hm.dsp);
			computeSummarySize_itemlist(hm.dsp);
			/* determine view start
			   all the rest regions has been set to FALSE
			 */
			dsp.head->isViewStart = TRUE;
			dsp.head->viewStartCoord = dsp.head->dstart;
			}

		}
	else
		{
		/*************************
		   fetch neat item list string from db using session
		   load all items as a big regionSl by order
		   fix dsp.head/tail on two ends of the SL
		   then try to determine real displayed region by sliding on this SL

		   instead of chromsome name, item names are passed as dsp args,
		   (because item names are not redundant)

		   in case of using displayedRegionParamPrecise, summary size will be given for each item
		   special args:
			- allrss
		 *************************/
		if(!dspRestoreByCleanItemlist(hm.dsp, session, statusId))
			{
			printf("\"abort\":\"sorry, gene set information could not be retrieved from database\"}");
			return 1;
			}

		if(SQUAWK) fputs("itemlist fetched from db, regionSl made...\n", Squawk);

		// so all items have been loaded, find previous displayed boundary from CGI param
		char *startItem = cgiString(StartChrom_cgi);
		int startCoord = cgiInt(StartCoord_cgi);
		char *stopItem = cgiString(StopChrom_cgi);
		int stopCoord = cgiInt(StopCoord_cgi);
		if(SQUAWK) fprintf(Squawk, "itemlist=on coord param: %s %d %s %d\n", startItem, startCoord, stopItem, stopCoord);
		trimRegionSl_itemlist(hm.dsp, startItem, startCoord, stopItem, stopCoord);

		// dsp adjustments
		if(cgiVarExists("allrss"))
			{
			if(SQUAWK) fputs("using precomputed summary size for all regions...\n", Squawk);
			/* forgot to compute dsp.usedSummaryNumber
			   2011/5/12 CSHL
			 */
			dsp.usedSummaryNumber = 0;
			dsp.tail->next = NULL;
			// assign given summary size to each item
			char delim[] = ",";
			char *allrss = cgiString("allrss");
			char *tok;
			tok = strtok(allrss, delim); assert(tok != NULL);
			// first item
			struct region *r = dsp.head;
			assert((r->summarySize=strMayPositiveInt(tok))!=-1);
			dsp.usedSummaryNumber += r->summarySize;
			for(r=r->next; r!=NULL; r=r->next) // rest of items
				{
				tok = strtok(NULL, delim); assert(tok != NULL);
				assert((r->summarySize=strMayPositiveInt(tok))!=-1);
				dsp.usedSummaryNumber += r->summarySize;
				}
			}
		else if(trigger_move)
			{
			// TODO don't need to tell from param if in basepair level??
			char direction = cgiString("move")[0];
			int mDistance = cgiInt("distance");
			int mSummarySize = cgiInt("summarySize");
			if(SQUAWK) fprintf(Squawk, "for moving (direction: %c mDist: %d mSumm: %d)...\n", direction, mDistance, mSummarySize);
			long remainingDist = 0;
			if(direction == 'l')
				{
				// newly exposed on left
				dsp.head->dstop = dsp.head->dstart;
				dsp.tail = dsp.head;
						remainingDist = moveBoundary_list_which(hm.dsp, 'h', 'l', mDistance);
				if(remainingDist != 0)
					{
					mSummarySize = (int)(mSummarySize * (1-(float)remainingDist/mDistance));
					}
				}
			else if(direction == 'r')
				{
				// newly exposed on right
				dsp.tail->dstart = dsp.tail->dstop;
				dsp.head = dsp.tail;
				remainingDist = moveBoundary_list_which(hm.dsp, 't', 'r', mDistance);
				if(remainingDist != 0)
					{
					mSummarySize = (int)(mSummarySize * (1-(float)remainingDist/mDistance));
					}
				}
			else
				{
				errabort("unknown moving direction");
				}
			dsp.head->prev = NULL;
			dsp.tail->next = NULL;

			computeEntireLength(hm.dsp);
			// not calling computeEntireLength_itemlist as need to do for entire list
			computeSummarySize(hm.dsp, mSummarySize);

			}
		else
			{
			computeEntireLength_itemlist(hm.dsp);
			if(trigger_imgAreaSelect)
				{
				// isViewStart is set in makeDspWing_itemlist()...
				makeDspWing_itemlist(hm.dsp);
				}
			else if(trigger_zoom)
				{
				if(SQUAWK) fputs("zoom out:\n", Squawk);
			double f = cgiDouble("zoom");
					moveBoundary_list_which(hm.dsp, 'h', 'l', (long)(dsp.entireLength*f));
					moveBoundary_list_which(hm.dsp, 't', 'r', (long)(dsp.entireLength*f));
				makeDspWing_itemlist(hm.dsp);
				}
			else
				{
				computeSummarySize(hm.dsp, cgiInt("sptotalnum"));
				}
			}
		if(0) 
			{
			fprintf(stderr, "usedSummaryNumber: %d\n", dsp.usedSummaryNumber);
			showRegionSl(hm.dsp);
			}
		}
	}
else
    {
    /*****************************************

                NORmal dsp setup

     *****************************************/
    if(SQUAWK) fputs("normal dsp...\n", stderr);
	dsp.runmode=cgiInt("runmode");
	/* FIXME a bug to be fixed
	in case of bad juxtapose tk info browser backs to default runmode from "config" table
	but not RM_genome
	*/
	if(dsp.runmode==RM_genome)
		{
		// nothing
		}
	else if(dsp.runmode==RM_jux_n)
		{
		char *tk=cgiString("juxtaposeTk");
		if(tk==NULL)
			{
			dsp.runmode=RM_genome;
			}
		else
			{
			dsp.juxtkft=FT_bed_n;
			dsp.juxtkurlpath=makefilepath(tk,dsp.juxtkft);
			dsp.tabix=tabixOpen(dsp.juxtkurlpath, FALSE);
			if(dsp.tabix==NULL)
				{
				dsp.runmode=RM_genome;
				}
			}
		}
	else if(dsp.runmode==RM_jux_c)
		{
		dsp.juxtkft=FT_bed_c;
		dsp.juxtkurlpath=cgiString("juxtaposeTk"); // url
		dsp.tabix=tabixOpen(dsp.juxtkurlpath, TRUE);
		if(dsp.tabix==NULL)
			{
			dsp.runmode=RM_genome;
			}
		}
	else if(dsp.runmode==RM_yearmonthday)
		{
		dsp.runmode=RM_jux_n;
		dsp.juxtkft=FT_bed_n;
		dsp.juxtkurlpath=makefilepath(ymdayfile,dsp.juxtkft);
		dsp.tabix=tabixOpen(dsp.juxtkurlpath, FALSE);
		assert(dsp.tabix!=NULL);
		}
	else
		{
		fputs("Unknown runmode parameter\n", stderr);
		return 1;
		}

	if(SQUAWK) fprintf(stderr, "runmode: %d, jux tk: %s\n", dsp.runmode, dsp.juxtkurlpath==NULL?"not available":dsp.juxtkurlpath);

	if(lastChrIdx==-1)
		{
		/* scenarios
		- sukn creating browser object with default content
		*/
		defaultScaffold();
		}

	makeBorder(hm.dsp);
	/* in case of juxtaposition,
	itemsl data for entire chromosomes are fetched and cached in dsp.chritemsl for the border chrs
	*/

    /* ordinary procedure to determine DSP
       first check whether to jump
       if not, get parameter from CGI
       if not, set boundary to default location
     */

    boolean notJumped = TRUE;
    int startChr=-1, stopChr=-1, startCoord=0, stopCoord=0;
    if(trigger_jump)
		{
		// JUMP
		if(cgiVarExists("jumppos"))
			{
			/* input can be "chr:start-stop [strand]"
			*/
			char *raw=cgiString("jumppos");
			if(SQUAWK) fprintf(stderr, "relocate to %s\n", raw);
			// no strand info
			while(TRUE)
				{
				char *raw1=strdup(raw);
				// oh dear
				int *arr = dissectCoordString(raw1);
				if(arr == NULL)
					{
					printf("\"abort\":\"invalid genomic coordinate\"}");
					return 0;
					}
				if(arr[0] == -1)
					{
					// see if it is new chr
					char *raw2=strdup(raw);
					char delim[] = " \t-:";
					char *tok=strtok(raw2,delim);
					int len=getScaffoldLength(tok);
					if(len==-1)
						{
						printf("\"abort\":\"wrong chromosome name\"}");
						return 0;
						}
					// add new chrom!!
					scaffoldAddnew(tok);
					printf("newscaffold:['%s',%u],", tok, len);
					continue;
					}
				if(arr[1] == -1)
					{
					printf("\"abort\":\"invalid start coordinate\"}");
					return 0;
					}
				if(arr[2] == -1)
					{
					printf("\"abort\":\"invalid stop coordinate\"}");
					return 0;
					}
				if(arr[1] >= arr[2])
					{
					printf("\"abort\":\"start coordinate must precede stop coordinate\"}");
					return 0;
					}
				startChr = arr[0];
				startCoord = arr[1];
				stopCoord = arr[2];
				break;
				}
			/* at finest zoomin level, each basepair spans MAXbpwidth basepairs,
			so hmSpan will take hmSpan/MAXbpwidth basepairs */
			int L = stopCoord-startCoord;
			int maxbpnum=hmSpan/MAXbpwidth;
			if(L < maxbpnum)
				{
				if(startCoord+maxbpnum < chrInfo[startChr]->length)
					{
					stopCoord = startCoord+maxbpnum-1;
					}
				else
					{
					stopCoord = chrInfo[startChr]->length-1;
					startCoord = stopCoord-maxbpnum+1;
					}
				}
			}
		else if(cgiVarExists("jumppos2"))
			{
			// now it is in form of chr1,start1,chr2,start2
			if(SQUAWK) fprintf(stderr, "relocate to %s\n", cgiString("jumppos2"));
			char delim[] = ",";
			char *tok;
			assert((tok=strtok(cgiString("jumppos2"), delim)) != NULL);
			assert(tok != NULL);
			startChr = strMayChrID(tok);
			if(startChr == -1)
				{
				/* new scaffold sequence, insert into chrInfo */
				scaffoldAddnew(tok);
				startChr = lastChrIdx;
				}
			assert((tok=strtok(NULL, delim)) != NULL);
			assert((startCoord=strMayPositiveInt(tok))!=-1);
			assert((tok=strtok(NULL, delim)) != NULL);
			stopChr = strMayChrID(tok);
			if(stopChr == -1)
				{
				scaffoldAddnew(tok);
				stopChr = lastChrIdx;
				}
			assert((tok=strtok(NULL, delim)) != NULL);
			assert((stopCoord=strMayPositiveInt(tok))!=-1);
			}
		else
			{
			fputs("Unknown jump option",stderr);
			printf("abort:'Unknown jump option'}");
			return 0;
			}

		notJumped = FALSE;
		setDspBoundary(hm.dsp, startChr, startCoord, stopChr==-1 ? startChr : stopChr, stopCoord);
		printf("relocateposition:['%s',%d,'%s',%d],",chrInfo[startChr]->name,startCoord,
			stopChr==-1?chrInfo[startChr]->name:chrInfo[stopChr]->name,stopCoord);
		if(dsp.runmode == RM_genome)
			finalizeDsp_genome(hm.dsp);
		else
			finalizeDsp_gf(hm.dsp);
		}
	if(notJumped)
		{
		if(SQUAWK) fputs("not jumping...\n", Squawk);

		if(trigger_move)
			{
			if(SQUAWK) fputs("Moving...\n", Squawk);

			makeDspBoundaryFromCgi(hm.dsp);

			/******************************
			   MOVE
			   only fetch data for newly exposed region
			   make a region to start with
			   the region will covers the point where new region will be made on one of its side

			   |<<<<<<left new<<<<<<|======old======|>>>>>>right new>>>>>>|

			   if atbplevel, only use mDistance, mSummarySize is of no use then
			 ******************************/
			dsp.atbplevel = cgiVarExists("atbplevel");
			char direction = cgiString("move")[0];
			int mDistance = cgiInt("distance");
			int mSummarySize = cgiInt("summarySize");
			if(SQUAWK) fprintf(Squawk, "need to move %d (%d)\n", mDistance, mSummarySize);

			struct region *r = malloc(sizeof(struct region)); // dsp.head and dsp.tail will be set to this region
			if(dsp.runmode == RM_genome)
				{
				if(direction == 'l')
					{
					if(dsp.start->coord == 0)
						{
						if(dsp.start->chromIdx==0)
							{
							fputs("dsp.start cannot decrement chromIdx\n",stderr);
							return 0;
							}
						r->chromIdx = dsp.start->chromIdx-1;
						r->dstart = r->dstop = chrInfo[r->chromIdx]->length;
						}
					else
						{
						r->chromIdx = dsp.start->chromIdx;
						r->dstart = r->dstop = dsp.start->coord;
						}
					}
				else
					{
					if(dsp.stop->coord >= chrInfo[dsp.stop->chromIdx]->length)
						{
						if(dsp.stop->chromIdx==lastChrIdx)
							{
							fputs("dsp.stop cannot increment chromIdx\n",stderr);
							return 0;
							}
						r->chromIdx = dsp.stop->chromIdx+1;
						r->dstart = r->dstop = 0;
						}
					else
						{
						r->chromIdx = dsp.stop->chromIdx;
						r->dstart = r->dstop = dsp.stop->coord;
						}
					}
				r->bstart = 0;
				r->bstop = chrInfo[r->chromIdx]->length;
				}
			else
				{
				/* juxtaposition
				form a region from left/right of initial point
				chromosome might not contain genomic feature of this kind, so use loop

				the operations dealing with left/right moving is symmetrical
				but it seems impossible to be integrated
				 */
				struct beditem *itemsl=NULL;
				struct chritemsl *ci;
				if(direction == 'l')
					{
					/* look to left, for each chr, fetch bed items from an interval,
					   interval start is always 0, stop is variable
					 */
					int lookChrIdx = dsp.start->chromIdx;
					while(itemsl == NULL)
						{
						if((ci=chritemsl_searchidx(hm.dsp, lookChrIdx))==NULL)
							{
							struct beditem *sl2=tabixQuery_regioncoord(dsp.tabix, dsp.juxtkft, chrInfo[lookChrIdx]->name, 0, chrInfo[lookChrIdx]->length,TRUE);
							if(sl2!=NULL)
								{
								itemsl=(struct beditem *)beditemsort_stopDsc((struct genericItem *)sl2);
								chritemslAppend(hm.dsp, lookChrIdx, itemsl);
								}
							}
						else
							{
							assert(ci->itemsl!=NULL);
							itemsl=(struct beditem *)beditemsort_stopDsc((struct genericItem *)ci->itemsl);
							ci->itemsl=itemsl;
							}
						if(itemsl == NULL)
							{
							if(lookChrIdx==0) break;
							lookChrIdx--;
							}
						else
							{
							/* in case the itemsl is from same chr as dsp.start,
							need to check if there's any item exists on the upstream of dsp.start
							those will be used to create the region
							*/
							if(lookChrIdx==dsp.start->chromIdx)
								{
								for(; itemsl!=NULL; itemsl=itemsl->next)
									{
									if(itemsl->start < dsp.start->coord)
										break;
									}
								if(itemsl==NULL)
									{
									if(lookChrIdx==0) break;
									lookChrIdx--;
									}
								}
							}
						}
					if(itemsl==NULL)
						{
						/* cannot find anything on the upstream of dsp.start
						including all chrs on dsp.start chr's "upstream"
						must reset dsp.start at right-most item from left border chr
						and generate a region
						*/
						if(SQUAWK)
							fprintf(stderr, "! juxtaposition trying to set first region for moving to left, no items could be found from chrs before %s (dsp.start), resetting dsp.start to left border...\n", chrInfo[dsp.start->chromIdx]->name);
						ci=chritemsl_searchidx(hm.dsp, leftBorder.chromIdx);
						assert(ci!=NULL);
						assert(ci->itemsl!=NULL);
						itemsl=(struct beditem *)beditemsort_stopDsc((struct genericItem *)ci->itemsl);
						ci->itemsl=itemsl;
						dsp.start->chromIdx=dsp.stop->chromIdx=leftBorder.chromIdx;
						dsp.start->coord=dsp.stop->coord=itemsl->stop;
						lookChrIdx=leftBorder.chromIdx;
						}
					// use the first item in itemsl to form the region
					r->chromIdx = lookChrIdx;
					r->bstart = itemsl->start;
					r->bstop = itemsl->stop;
					r->dstart = r->dstop = (itemsl->stop < dsp.start->coord) ? itemsl->stop : dsp.start->coord;
					// extend this region using overlapping bed items in itemsl
					for(itemsl=itemsl->next; itemsl!=NULL; itemsl=itemsl->next)
						{
						if(itemsl->stop >= r->bstart && itemsl->start < r->bstart)
							r->bstart = itemsl->start;
						else
							break;
						}
					}
				else
					{
					/* look to right, for each chr, fetch bed items from an interval,
					   interval stop is always chromosome end, start is variable
					 */
					int lookChrIdx = dsp.stop->chromIdx;
					while(itemsl == NULL)
						{
						if((ci=chritemsl_searchidx(hm.dsp, lookChrIdx))==NULL)
							{
							struct beditem *sl2=tabixQuery_regioncoord(dsp.tabix, dsp.juxtkft, chrInfo[lookChrIdx]->name, 0, chrInfo[lookChrIdx]->length,TRUE);
							if(sl2!=NULL)
								{
								itemsl=(struct beditem *)beditemsort_startAsc((struct genericItem *)sl2);
								chritemslAppend(hm.dsp, lookChrIdx, itemsl);
								}
							}
						else
							{
							assert(ci->itemsl!=NULL);
							itemsl=(struct beditem *)beditemsort_startAsc((struct genericItem *)ci->itemsl);
							ci->itemsl=itemsl;
							}
						if(itemsl==NULL)
							{
							if(lookChrIdx == lastChrIdx) 
								break;
							lookChrIdx++;
							}
						else
							{
							/* in case the itemsl is from same chr as dsp.stop,
							need to check if there's any item exists on the downstream of dsp.stop
							those will be used to create the region
							*/
							if(lookChrIdx==dsp.stop->chromIdx)
								{
								for(; itemsl!=NULL; itemsl=itemsl->next)
									{
									if(itemsl->stop > dsp.stop->coord)
										break;
									}
								if(itemsl==NULL)
									{
									if(lookChrIdx==lastChrIdx)
										break;
									lookChrIdx++;
									}
								}
							}
						}
					if(itemsl == NULL)
						{
						/* cannot find anything on the downstream of dsp.stop
						including all chrs on dsp.stop chr's "downstream"
						must reset dsp.stop at left-most item from right border chr
						and generate a region
						*/
						if(SQUAWK)
							fprintf(stderr, "! juxtaposition trying to set first region for moving to right, no items could be found from chrs after %s (dsp.stop), resetting dsp.stop to right border...\n", chrInfo[dsp.stop->chromIdx]->name);
						ci=chritemsl_searchidx(hm.dsp, rightBorder.chromIdx);
						assert(ci!=NULL);
						assert(ci->itemsl!=NULL);
						itemsl=(struct beditem *)beditemsort_startAsc((struct genericItem *)ci->itemsl);
						ci->itemsl=itemsl;
						dsp.start->chromIdx=dsp.stop->chromIdx=rightBorder.chromIdx;
						dsp.start->coord=dsp.stop->coord=itemsl->start;
						lookChrIdx=rightBorder.chromIdx;
						}
					r->chromIdx = lookChrIdx;
					r->bstart = itemsl->start;
					r->bstop = itemsl->stop;
					r->dstart = r->dstop = (itemsl->start > dsp.stop->coord) ? itemsl->start : dsp.stop->coord;
					for(itemsl=itemsl->next; itemsl!=NULL; itemsl=itemsl->next)
						{
						if(itemsl->start <= r->bstop && itemsl->stop > r->bstop)
							r->bstop = itemsl->stop;
						else 
							break;
						}
					}
				}
			if(SQUAWK) fprintf(Squawk, "start region determined for move: %s bstart %d bstop %d\n", chrInfo[r->chromIdx]->name, r->bstart, r->bstop);
			r->summarySize = 0;
			dspAddRegionHead(hm.dsp, r);

			double sf = (double)mDistance / mSummarySize;
			if(dsp.runmode == RM_genome)
				{
				moveBoundary_genome(hm.dsp, direction, mDistance, &mSummarySize, sf);
				}
			else
				{
				if(direction == 'l')
					moveBoundary_gf_left(hm.dsp, mDistance, mSummarySize);
				else
					moveBoundary_gf_right(hm.dsp, mDistance, mSummarySize);
				}
			if(SQUAWK) fprintf(Squawk, "dsp.head: %s:%d-%d   dsp.tail: %s:%d-%d\n\n", 
				chrInfo[dsp.head->chromIdx]->name, dsp.head->dstart, dsp.head->dstop, 
				chrInfo[dsp.tail->chromIdx]->name, dsp.tail->dstart, dsp.tail->dstop);

			computeEntireLength(hm.dsp);


			if(dsp.atbplevel)
				{
				computeSummarySize_bplevel(hm.dsp);
				}
			computeUsedSummaryNumber(hm.dsp);
			}
		else 
			{
			if(SQUAWK) fputs("not moving...\n", Squawk);
			/****************************
				not moving, possibilities:
				* zoom in (used to be image area select)
				* zoom out
				* change mode (genome <=> juxtaposition)
				* not changing dsp at all, just rebuild from CGI parameters
				* update scaffold
			 ****************************/
			if(trigger_scaffoldUpdate)
				{
				char *query;
				if(asprintf(&query, "update scaffoldRuntime set count=%s, names='%s' where session='%s' and statusId=%d", cgiString("scaffoldCount"), cgiString("scaffoldNames"), session, statusId)<0) errabort("bae");
				mysqlUpdate(query);
				free(query);
				reviveScaffold();
				trigger_imgAreaSelect = TRUE; // patch?
				}
			if(trigger_zoom || trigger_imgAreaSelect || trigger_changeGF)
				{
				makeDspBoundaryFromCgi(hm.dsp);
				if(dsp.runmode == RM_genome)
					makeRegionSl_genome(hm.dsp);
				else
					makeRegionSl_gf(hm.dsp);
				computeEntireLength(hm.dsp);
				if(trigger_zoom) 
					{
					double zoomoutPerc = cgiDouble("zoom"); // >0
					if(SQUAWK) fprintf(Squawk, "zoom out by %.2f...\n", zoomoutPerc);
					// distance to expand to each side
					long dist = (long)((dsp.entireLength * zoomoutPerc /2));
					// region after zoom out should take hmSpan summary points
					double sf = dsp.entireLength * (1+zoomoutPerc) / hmSpan;
					computeSummarySize(hm.dsp, ceil(hmSpan / (1+zoomoutPerc)));
					int spnum = hmSpan*zoomoutPerc / (1+zoomoutPerc);
					if(dsp.runmode == RM_genome)
						{
						moveBoundary_genome(hm.dsp, 'l', dist, &spnum, sf);
						spnum = hmSpan*zoomoutPerc / (1+zoomoutPerc);
						moveBoundary_genome(hm.dsp, 'r', dist, &spnum, sf);
						}
					else
						{
						moveBoundary_gf_left(hm.dsp, dist, spnum);
						moveBoundary_gf_right(hm.dsp, dist, spnum);
						}
					}
				if(dsp.runmode == RM_genome)
					finalizeDsp_genome(hm.dsp);
				else
					finalizeDsp_gf(hm.dsp);
				}
			else
				{
				/* recover dsp using params:
				   - regionLst: chr,bstart,bstop,summarysize all joined by comma
				   - startCoord: dstart of head
				   - stopCoord: dstop of tail

				   NEVER forget to compute entire length and usedSummaryNumber
				 */
				recoverDsp_cgiParam(hm.dsp);

				computeEntireLength(hm.dsp);
				if(dsp.usedSummaryNumber == dsp.entireLength)
					dsp.atbplevel = TRUE;
				}
			if(trigger_scaffoldUpdate)
				makeBorder(hm.dsp);
			}
		}
    }




/* CGI tells JS that they are at basepair level */
if(dsp.atbplevel) printf("'atbplevel':1,");

/****************
   border
   JS figures out default border (from list of scaffolds)
 ****************/
if(trigger_changeGF || trigger_scaffoldUpdate)
	{
    printf("'border':['%s',%d,'%s',%d],", chrInfo[leftBorder.chromIdx]->name, leftBorder.coord, chrInfo[rightBorder.chromIdx]->name, rightBorder.coord);
	}



if(SQUAWK) showRegionSl(hm.dsp);

/* where does the view start?
   this piece of info is only needed when dsp got changed ON SERVER SIDE
   such as zoom, image area select, jump, ...
   in those cases, view start region should have been flagged out

   operations that change dsp on client side (e.g. move) will keep an updated dsp view start
 */
struct region *r;
int i = 0;
for(r=dsp.head; r!=NULL; r=r->next)
    {
    if(r->isViewStart)
        {
		printf("viewStart:[%d,%d],", i, r->viewStartCoord);
		if(SQUAWK) fprintf(stderr, "viewStart: %s %d\n", chrInfo[r->chromIdx]->name, r->viewStartCoord);
		break;
		}
    i++;
    }


if(trigger_changeGF || trigger_zoom || trigger_move || trigger_imgAreaSelect || trigger_jump || trigger_newitemlist)
	{
	// return regionlst when there's dsp change
	printf("'regionLst':[");
	struct region *r;
	for(r=dsp.head; r!=NULL; r=r->next)
		{
		// skip region with 0 summarySize
		if(r->summarySize == 0)
			continue;
		printf("['%s',%d,%d,%d,%d,%d,'%s'],", 
			chrInfo[r->chromIdx]->name, 
			r->bstart, r->bstop, 
			r->dstart, r->dstop, 
			r->summarySize, 
			(cgiVarExists("itemlist")||trigger_newitemlist)?r->name:""
			);
		}
	printf("],");
	/* beware
	   if atbplevel, the r->summarySize should not be used in JS,
	   as regionLst[x][5] is supposed to be plot width (# of pixels) atbplevel
	 */
	}

/***************************************
   displayed region is now determined
 ***************************************/



if(cgiVarExists("decor0")) parseTrackParam(cgiString("decor0"), FT_bed_n, &(hm.decor0));
if(cgiVarExists("decor1")) parseTrackParam(cgiString("decor1"), FT_bed_c, &(hm.decor1));
if(cgiVarExists("decor8")) parseTrackParam(cgiString("decor8"), FT_qdecor_n, &(hm.decor8));
if(cgiVarExists("decor4")) parseTrackParam(cgiString("decor4"), FT_sam_n, &(hm.decor4));
if(cgiVarExists("decor5")) parseTrackParam(cgiString("decor5"), FT_sam_c, &(hm.decor5));
if(cgiVarExists("decor9")) parseTrackParam(cgiString("decor9"), FT_lr_n, &(hm.decor9));
if(cgiVarExists("decor10")) parseTrackParam(cgiString("decor10"),FT_lr_c, &(hm.decor10));
if(cgiVarExists("decor17")) parseTrackParam(cgiString("decor17"),FT_bam_n, &(hm.decor17));
if(cgiVarExists("decor18")) parseTrackParam(cgiString("decor18"),FT_bam_c, &(hm.decor18));
if(cgiVarExists("track20")) parseTrackParam(cgiString("track20"),FT_catmat, &(hm.tk20));
if(cgiVarExists("track27")) parseTrackParam(cgiString("track27"),FT_qcats, &(hm.tk27));
if(cgiVarExists("track21")) parseTrackParam(cgiString("track21"),FT_weaver_c, &(hm.tk21));
if(cgiVarExists("track23")) parseTrackParam(cgiString("track23"),FT_ld_c, &(hm.tk23));
if(cgiVarExists("track24")) parseTrackParam(cgiString("track24"),FT_anno_n, &(hm.tk24));
if(cgiVarExists("track25")) parseTrackParam(cgiString("track25"),FT_anno_c, &(hm.tk25));
if(cgiVarExists("track26")) parseTrackParam(cgiString("track26"),FT_ld_n, &(hm.tk26));

/**
might apply dsp filter for longrange track
only for browser display, but not for hengeview
**/
struct track *tt;
dsp.dspFilter=NULL;
if((hm.decor9!=NULL || hm.decor10!=NULL) && (!cgiVarExists("lrtk_nodspfilter")))
	{
	boolean fullitemquery=FALSE;
	for(tt=hm.decor9;tt!=NULL;tt=tt->next)
		{
		if(tt->mode==M_arc||tt->mode==M_trihm) fullitemquery=TRUE;
		}
	for(tt=hm.decor10;tt!=NULL;tt=tt->next)
		{
		if(tt->mode==M_arc||tt->mode==M_trihm) fullitemquery=TRUE;
		}
	if(fullitemquery)
		{
		// first use all current regions as filters
		struct region *r;
		struct nnode *b;
		for(r=dsp.head; r!=NULL; r=r->next)
			{
			b=malloc(sizeof(struct nnode));
			b->chrIdx=r->chromIdx;
			b->start=r->dstart;
			b->stop=r->dstop;
			b->next=dsp.dspFilter;
			dsp.dspFilter=b;
			}
		if(cgiVarExists("existingDsp"))
			{
			// this came from existing regions when panning, shall be added to filter
			char delim[]=",";
			char *tok=strtok(cgiString("existingDsp"),delim);
			while(tok!=NULL)
				{
				b=malloc(sizeof(struct nnode));
				assert((b->chrIdx=strMayChrID(tok))!=-1);
				assert((tok=strtok(NULL,delim))!=NULL);
				assert((b->start=strMayPositiveInt(tok))!=-1);
				assert((tok=strtok(NULL,delim))!=NULL);
				assert((b->stop=strMayPositiveInt(tok))!=-1);
				tok=strtok(NULL,delim);
				b->next=dsp.dspFilter;
				dsp.dspFilter=b;
				}
			}
		}
		/*
		struct nnode *fi;
		for(fi=dsp.dspFilter; fi!=NULL; fi=fi->next)
			{
			printf("dsp filter: %s %d %d\n", chrInfo[fi->chrIdx]->name, fi->start, fi->stop);
			}
			*/
	}
	

printf("tkdatalst:[");


for(tt=hm.decor0; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp, tt);
	}
for(tt=hm.decor1; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp, tt);
	}
for(tt=hm.decor9; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp, tt);
	}
for(tt=hm.decor10; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp, tt);
	}
for(tt=hm.decor8; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp, tt);
	}
for(tt=hm.decor17; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp, tt);
	}
for(tt=hm.decor18; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp, tt);
	}
for(tt=hm.tk20; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp,tt);
	}
for(tt=hm.tk21; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp,tt);
	}
for(tt=hm.tk23; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp,tt);
	}
for(tt=hm.tk26; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp,tt);
	}
for(tt=hm.tk24; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp,tt);
	}
for(tt=hm.tk25; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp,tt);
	}
for(tt=hm.tk27; tt!=NULL; tt=tt->next)
	{
	printJsonDecor(hm.dsp,tt);
	}





/*** make list of hmtk ***/
struct track *trackSl = NULL;

if(cgiVarExists("hmtk2"))
	{
	if(cgiVarExists("rpbr_splinter"))
		{
		/******
		special case for repeatbrowser splinters
		retrieves some quantitative experimental assay tracks
		use a "hard-coded" file path
		*/
		repeatbrowser_parseExpTrack(cgiString("hmtk2"), FT_bedgraph_n, &trackSl);
		}
	else
		{
		parseTrackParam(cgiString("hmtk2"), FT_bedgraph_n, &trackSl);
		}
	}
if(cgiVarExists("hmtk3"))
	parseTrackParam(cgiString("hmtk3"), FT_bedgraph_c, &trackSl);
if(cgiVarExists("hmtk14"))
	parseTrackParam(cgiString("hmtk14"), FT_bigwighmtk_n, &trackSl);
if(cgiVarExists("hmtk15"))
	parseTrackParam(cgiString("hmtk15"), FT_bigwighmtk_c, &trackSl);
if(cgiVarExists("hmtk12"))
	parseTrackParam(cgiString("hmtk12"), FT_cat_n, &trackSl);
if(cgiVarExists("hmtk13"))
	parseTrackParam(cgiString("hmtk13"), FT_cat_c, &trackSl);


hm.trackSl = trackSl;

//for(tk=hm.trackSl; tk!=NULL; tk=tk->next) tk->gid = 0;

//if(SQUAWK) showTrackSl(hm.trackSl);
if(SQUAWK) fputs("track sl made\n", stderr);




if(CHECKCPUTIME)
    {
    clock_t this = clock();
    fprintf(Squawk, "Elapsed time before fetching track data: %f\n", ((double)(this-cpuTimeStart))/CLOCKS_PER_SEC);
    cpuTimeTemp = clock();
    }




/*** fetch hmtk data ***/
if(hm.trackSl!=NULL)
	{
	/* _fork_ parallelization
	   for each track, fork to fetch data and write into a file at trash dir,
	   file name: session+track name, one value at each line,
	   the parent process will wait till all children processes finish,
	   and read in that folder data of each track,
	   then remove that folder
	   tk->pid as state flag, see "data structure.dia"
	 */
	char *line = malloc(1);
	size_t s = 1;
	/* preparation */
	struct track *tk;
	for(tk=hm.trackSl; tk!=NULL; tk=tk->next)
		{
		tk->pid = -1;
		assert(asprintf(&tk->tmpfile, "%s/%s.%s", trashDir, session, tk->name)>0);
		}

	/* fetch data */
	int i;
	boolean notfinished = TRUE;
	int processRunningNum = 0;
	while(notfinished)
		{
		notfinished = FALSE;
		for(tk=hm.trackSl; tk!=NULL; tk=tk->next)
			{
			if(tk->pid == -1)
				{
				/* this track not processed */
				if(processRunningNum == MaxProcessNum)
					{
					notfinished = TRUE;
					if(0) fputs("reaches max, wait for empty slots...\n", Squawk);
					continue;
					}
				/* fork for this track */
				pid_t p = fork();
				if(p == 0)
					{
					/*** in a child process ***/
					if(tk->ft==FT_bedgraph_c || tk->ft==FT_bedgraph_n || tk->ft==FT_bigwighmtk_n || tk->ft==FT_bigwighmtk_c)
						{
						double *data= tabixQuery_bedgraph_dsp(hm.dsp, tk);
						if(data==NULL)
							{
							if(SQUAWK) fprintf(stderr, "numerical tk error (%s)\n", tk->urlpath);
							_exit(0);
							}
						FILE *fout = fopen(tk->tmpfile, "w");
						if(fout == NULL)
							{
							if(SQUAWK) fprintf(stderr, "numerical tk error 2 (%s)\n", tk->urlpath);
							_exit(0);
							}
						for(i=0; i<dsp.usedSummaryNumber; i++)
							{
							fprintf(fout, "%f\n", data[i]);
							}
						fclose(fout);
						}
					else if(tk->ft==FT_cat_c || tk->ft==FT_cat_n)
						{
						int *data=tabixQuery_categorical_dsp(hm.dsp, tk->urlpath, tk->ft);
						if(data==NULL)
							{
							if(SQUAWK) fprintf(stderr,"categorical tk error (%s)\n",tk->urlpath);
							_exit(0);
							}
						FILE *fout = fopen(tk->tmpfile, "w");
						if(fout == NULL)
							{
							if(SQUAWK) fprintf(stderr, "categorical tk error 2 (%s)\n", tk->urlpath);
							_exit(0);
							}
						for(i=0; i<dsp.usedSummaryNumber; i++)
							{
							fprintf(fout, "%d\n", data[i]);
							}
						fclose(fout);
						}
					else 
						{
						fputs("fetching hmtk data: unknown filetype\n",stderr);
						}
					// exit without flushing buffer
					_exit(0);
					}
				else if(p < 0)
					{
					fprintf(stderr, "error spawning child process at track %s\n", tk->urlpath);
					}
				else
					{
					tk->pid = p;
					processRunningNum++;
					}
				notfinished = TRUE;
				}
			else if(tk->pid > 0)
				{
				/* child has been forked */
				int status;
				waitpid(tk->pid, &status, 0);
				if(status == 0)
					{
					/* child process has finished successfully */
					tk->pid = 0;
					/* ft-specific treatment */
					double *data = malloc(sizeof(double)*dsp.usedSummaryNumber);
					FILE *fin = fopen(tk->tmpfile, "r");
					if(fin == NULL) 
						{
						/* error! file missing!
						*/
						brokenbeads_add(tk->name,tk->urlpath,tk->ft);
						for(i=0; i<dsp.usedSummaryNumber; i++)
							{
							data[i]=NAN;
							}
						}
					else
						{
						if(tk->ft==FT_bedgraph_c||tk->ft==FT_bedgraph_n||tk->ft==FT_bigwighmtk_n||tk->ft==FT_bigwighmtk_c)
							{
							for(i=0; i<dsp.usedSummaryNumber; i++)
								{
								if(getline(&line, &s, fin) == -1)
									{
									fprintf(stderr, "truncated tmpfile: %s\n", tk->tmpfile);
									for(; i<dsp.usedSummaryNumber; i++)
										{
										data[i]=NAN;
										}
									break;
									}
								if(line[0]=='n')
									{
									// is nan
									data[i]=NAN;
									}
								else
									{
									data[i] = strtod(line, NULL);
									}
								}
							// print out json for tkLst array element
							printf("{'name':'%s','ft':%d,",tk->name, tk->ft);
							if(tk->ft==FT_bedgraph_c||tk->ft==FT_bigwighmtk_c)
								printf("'label':'%s','url':'%s',", tk->label,tk->urlpath);
							printf("'data':[");
							// track data of different regions are in separate arrays
							int i=0;
							struct region *r;
							for(r=dsp.head; r!=NULL; r=r->next)
								{
								int j;
								printf("[");
								for(j=0; j<r->summarySize; j++)
									{
									if(isnan(data[i+j]))
										printf("NaN,");
									else
										printf("%.6g,", data[i+j]);
									}
								printf("],");
								i += j;
								}
							printf("]},");
							}
						else if(tk->ft==FT_cat_n||tk->ft==FT_cat_c)
							{
							for(i=0; i<dsp.usedSummaryNumber; i++)
								{
								// might die here?
								if(getline(&line, &s, fin)==-1)
									{
									data[i]=NAN;
									}
								else
									{
									data[i] = strtol(line, NULL, 0);
									}
								}
							// print out json for tkLst array element
							printf("{'name':'%s','ft':%d,",tk->name, tk->ft);
							if(isCustom(tk->ft))
								printf("label:'%s','url':'%s',", tk->label,tk->urlpath);
							printf("'data':[");
							// track data of different regions are in separate arrays
							int i=0;
							struct region *r;
							for(r=dsp.head; r!=NULL; r=r->next)
								{
								int j;
								printf("[");
								for(j=0; j<r->summarySize; j++)
									printf("%d,", (int)data[i+j]);
								printf("],");
								i += j;
								}
							printf("]},");
							}
						else
							{
							fputs("collecting tk data: unknown ft\n", stderr);
							}
						}
					tk->data = data;
					unlink(tk->tmpfile);
					free(tk->tmpfile);
					}
				else
					{
					fprintf(stderr, "%s(%d) unknown status for child process\n", tk->name, tk->ft);
					brokenbeads_add(tk->name,tk->urlpath,tk->ft);
					}
				processRunningNum--;
				}
			}
		}
	if(SQUAWK) fputs("track data fetched\n", stderr);
	}


printf("],"); // close tkdatalst

brokenbeads_print();

puts("}"); // json outmost brace

if(CHECKCPUTIME)
    {
    clock_t this = clock();
    fprintf(stderr, "Elapsed time spent on fetching track data: %f\n", ((double)(this-cpuTimeTemp))/CLOCKS_PER_SEC);
    cpuTimeTemp = clock();
    }




if(CHECKCPUTIME)
    {
    clock_t this = clock();
    fprintf(Squawk, "Elapsed time after fetching track data: %f\n", ((double)(this-cpuTimeTemp))/CLOCKS_PER_SEC);
    fprintf(Squawk, "(Parallel) Entire CPU time: %f\n", ((double)(this-cpuTimeStart))/CLOCKS_PER_SEC);
    }

done();
return 1;
}
