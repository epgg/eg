CC ?= gcc
CFLAGS ?= -g -Wall -O3 -Wsign-compare
LIBS = -lcurl -lm -lz
LDFLAGS =
LDLIBS =
INCLUDES = ./libBigWig

.PHONY: all clean

all: querybw querybb

querybw:
	$(CC) -o $@ -I. $(CFLAGS) -I$(INCLUDES) querybw.c libBigWig/libBigWig.a $(LIBS)

querybb:
	$(CC) -o $@ -I. $(CFLAGS) -I$(INCLUDES) querybb.c libBigWig/libBigWig.a $(LIBS)

clean:
	rm -f querybb querybw
