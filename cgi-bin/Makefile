CC=gcc
COPT= -O -g
CFLAGS= -Wall -Wformat -Wimplicit -Wreturn-type -Wuninitialized -std=c99
DFLAGS= -D_FILE_OFFSET_BITS=64 -D_LARGEFILE_SOURCE -D_GNU_SOURCE
SAM=samtools
TABIX=tabix
INCLUDES= `mysql_config --include` -I$(SAM) -I$(TABIX)
MYSQLLIB=`mysql_config --libs`
SAMLIB=$(SAM)/libbam.a
TABIXLIB=$(TABIX)/libtabix.a
L = -pthread -lm -lz -ldl `curl-config --libs`

MYF = subtleKnife postdeposit
OBJS=jsmn-example/buf.o jsmn-example/log.o jsmn-example/json.o jsmn/jsmn.o

%.o: %.c
	$(CC) $(COPT) $(CFLAGS) $(DFLAGS) $(INCLUDES) -o $@ -c $<

all: $(MYF)

subtleKnife:subtleKnife.o $(SAMLIB) $(TABIXLIB)
	$(CC) $(COPT) -o $@ subtleKnife.o $(OBJS) $(MYSQLLIB) $(SAMLIB) $(TABIXLIB) $L


postdeposit:postdeposit.c
	$(CC) $(COPT) -o $@ postdeposit.c

.PHONY:all $(SAMLIB) $(TABIXLIB) clean


$(SAMLIB):
	cd $(SAM) && make lib

$(TABIXLIB):
	cd $(TABIX) && make lib

clean:
	wdir=`pwd`; \
	cd $$wdir/$(SAM) && make cleanlocal; \
	cd $$wdir/$(TABIX) && make cleanlocal; \
        cd $$wdir && rm -f subtleKnife subtleKnife.o postdeposit postdeposit.o

cleanlocal:
	rm -f subtleKnife subtleKnife.o postdeposit postdeposit.o
