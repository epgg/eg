#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define WWWT "/var/www/html/browser/t"

int main()
{

srand(time(0));
int randnum=rand();


printf("Content-Type:application/text\n\n");


char *line=malloc(1);
size_t s=1;

getline(&line,&s,stdin);
char *extension=strdup(line);
extension[strlen(extension)-1]='\0'; // escape linebreak

char *file;
asprintf(&file, "%s/%d.%s", WWWT, randnum,extension);
FILE *fout=fopen(file,"w");
if(fout==NULL)
    {
    printf("ERROR");
    return 1;
    }

while(getline(&line,&s,stdin)!=-1)
    fputs(line, fout);

fclose(fout);

printf("%d.%s", randnum,extension);

return 1;
}
