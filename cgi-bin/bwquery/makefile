include ../../inc/common.mk

L += ${SOCKETLIB} -lm -lz
MYLIBDIR = ../../lib/${MACHTYPE}
MYLIBS = ${MYLIBDIR}/jkweb.a

A = bwquery
O = bwquery.o

bwquery: $O ${MYLIBS}
	${CC} ${COPT} -o ${A} $O ${MYLIBS} $L

compile:: ${O} ${MYLIBS}
	${CC} ${COPT} ${CFLAGS} -o ${A}${EXE} $O ${MYLIBS} ${L}

clean:
	rm -f $O ${A}${EXE}
