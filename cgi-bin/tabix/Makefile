CC=			gcc
CFLAGS=		-g -Wall -O2 -fPIC #-m64 #-arch ppc
DFLAGS=		-D_FILE_OFFSET_BITS=64 -D_USE_KURL -DBGZF_CACHE
LOBJS=		bgzf.o kstring.o kurl.o index.o bedidx.o
AOBJS=		main.o
PROG=		tabix bgzip
INCLUDES=
SUBDIRS=	.
LIBPATH=
LIBCURSES=	

.SUFFIXES:.c .o

.c.o:
		$(CC) -c $(CFLAGS) $(DFLAGS) $(INCLUDES) $< -o $@

all-recur lib-recur clean-recur cleanlocal-recur install-recur:
		@target=`echo $@ | sed s/-recur//`; \
		wdir=`pwd`; \
		list='$(SUBDIRS)'; for subdir in $$list; do \
			cd $$subdir; \
			$(MAKE) CC="$(CC)" DFLAGS="$(DFLAGS)" CFLAGS="$(CFLAGS)" \
				INCLUDES="$(INCLUDES)" LIBPATH="$(LIBPATH)" $$target || exit 1; \
			cd $$wdir; \
		done;

all:$(PROG)

lib:libtabix.a

libtabix.so.1:$(LOBJS)
		$(CC) -shared -Wl,-soname,libtabix.so -o $@ $(LOBJS) -lc -lz

libtabix.1.dylib:$(LOBJS)
		libtool -dynamic $(LOBJS) -o $@ -lc -lz

libtabix.a:$(LOBJS)
		$(AR) -csru $@ $(LOBJS)

tabix:lib $(AOBJS)
		$(CC) $(CFLAGS) -o $@ $(AOBJS) -L. -ltabix -lm $(LIBPATH) -lz -L/usr/local/lib -lcurl

bgzip:bgzip.o bgzf.o kurl.o
		$(CC) $(CFLAGS) -o $@ bgzip.o bgzf.o kurl.o -lz -L/usr/local/lib -lcurl

TabixReader.class:TabixReader.java
		javac -cp .:sam.jar TabixReader.java

kstring.o:kstring.h
kurl.o:kurl.h
bgzf.o:bgzf.h kurl.h
index.o:bgzf.h tabix.h khash.h ksort.h kstring.h
main.o:tabix.h kstring.h bgzf.h
bgzip.o:bgzf.h
bedidx.o:kseq.h khash.h

tabix.pdf:tabix.tex
		pdflatex tabix.tex

cleanlocal:
		rm -fr gmon.out *.o a.out *.dSYM $(PROG) *~ *.a tabix.aux tabix.log tabix.pdf *.class libtabix.*.dylib libtabix.so*

clean:cleanlocal-recur
