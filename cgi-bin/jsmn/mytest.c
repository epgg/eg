#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "jsmn.c"

struct gene
{
char *name;
char strand;
int utr5start;
int utr5width;
int utr3start;
int utr3width;
int exoncount;
int **exons;
};

int strMayPositiveInt(char *str)
{
return strtol(str,NULL,0);
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

int main()
{

int SQUAWK=1;
char *jsontext="\
name:\"PAX5\",okay:\"dokey\",category:3,\
details:{aa:\"aaaa\",bb:\"bbbb\",\"cc dd\":\"http://abc.org/q.h\"},id:191533,strand:\"-\",\
scorelst:[11,22,33],\
struct:{thin:[[36840168,36840525],],thick:[[36840525,36840633],[36846839,36846926],[36966545,36966721],[37002644,37002773],[37006469,37006534],[37014993,37015191],[37020632,37020798],[37033982,37034028],],},\
";

//struct:{thin:[[36840168,36840525],[37034028,37034038],],thick:[[36840525,36840633],[36846839,36846926],[36966545,36966721],[37002644,37002773],[37006469,37006534],[37014993,37015191],[37020632,37020798],[37033982,37034028],],},\

int count=0;
int i,j;

printf("JSON text: %s\n", jsontext);

struct gene *gene=NULL;
char *tmp;
gene=malloc(sizeof(struct gene));
gene->name=NULL;
gene->strand='.';
gene->exoncount=-1;
gene->utr5start=gene->utr3start=-1;
gene->utr5width=gene->utr3width=0;
i=0;


	int tokencount=0;
	int isthick=0, isthin=0, isstrand=0, isname=0, b;
	int *a;
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
		int x=gene->utr3start,y=gene->utr3width;
		gene->utr3start=gene->utr5start;
		gene->utr3width=gene->utr5width;
		gene->utr5start=x;
		gene->utr5width=y;
		}


printf("gene \"%s\":\n",gene->name);
printf("strand: %c\n",gene->strand);
printf("%d exons\n",gene->exoncount);
for(i=0; i<gene->exoncount; i++) {
	printf("\texon %d: %d-%d\n", i,(gene->exons)[i][0],(gene->exons)[i][1]);
}
printf("5' utr: %d-%d\n",gene->utr5start,gene->utr5start+gene->utr5width);
printf("3' utr: %d-%d\n",gene->utr3start,gene->utr3start+gene->utr3width);
return 1;
}
