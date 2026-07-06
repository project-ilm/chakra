# CHAKRA C library — GPL-3.0-or-later · © 1993-2026 Abhishek Choudhary
CC      ?= cc
CFLAGS  ?= -O2 -std=c99 -Wall -Wextra
LDLIBS   = -lm

all: libchakra.a chakra

chakra.o: chakra.c chakra.h
	$(CC) $(CFLAGS) -c chakra.c

libchakra.a: chakra.o
	ar rcs $@ $^

chakra: chakra_cli.c chakra.o
	$(CC) $(CFLAGS) -o $@ chakra_cli.c chakra.o $(LDLIBS)

vectors.h: gen_vectors.js ../src/chakra-core.js
	node gen_vectors.js > vectors.h

test: vectors.h test_chakra.c chakra.o
	$(CC) $(CFLAGS) -o test_chakra test_chakra.c chakra.o $(LDLIBS)
	./test_chakra

clean:
	rm -f *.o libchakra.a chakra test_chakra vectors.h

vectors: vectors.h

.PHONY: all test clean vectors
