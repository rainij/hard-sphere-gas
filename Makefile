CXX_COMPILER ?= clang++
CXX_LINKER ?= wasm-ld
WASM_OPT ?= wasm-opt

OPTIMIZATION ?= -O3
# FIXME max-memory currently has no effect, probably we have to "grow memory" within malloc???
MEMORY ?= --initial-memory=$$((128*64*1024)) --max-memory=$$((256*64*1024))

CXX := $(CXX_COMPILER)
LD := $(CXX_LINKER)

# FIXME --allow-undefined ist nicht so toll
# TODO better place for -flto --lto-03
WASM_CXXFLAGS := --target=wasm32 $(OPTIMIZATION) -nostdlib -flto -fvisibility=hidden
WASM_LDFLAGS := --no-entry --allow-undefined --export-dynamic $(OPTIMIZATION) --lto-O3 $(MEMORY)
#WASM_LDFLAGS := --no-entry --allow-undefined --export-all

TARGETS := dist/index.html dist/index.wasm
.PHONY: all clean wat

# For inspection we keep intermediate files:
#.PRECIOUS: build/%.o build/%.wasm

default: $(TARGETS)

wat:  dist/index.wat build/animate.wat build/memory.wat build/collider.wat
llvm-ir: build/memory.s build/animate.s

all: default wat llvm-ir

dist/index.html: src/index.html
	cp $^ $@

build/index.wasm: build/animate.o build/memory.o build/collider.o build/util.o
	$(LD) $(WASM_LDFLAGS) -o $@ $^

build/%.o: src/%.cpp
	$(CXX) -c $(WASM_CXXFLAGS) -o $@ $<

# For inspecting llvm IR
build/%.s: src/%.cpp
	$(CXX) -S $(WASM_CXXFLAGS) -o $@ $<

dist/%.wasm: build/%.wasm
	$(WASM_OPT) $(OPTIMIZATION) $< -o $@

%.wat: %.wasm
	wasm2wat $< -o $@

build/%.wasm: build/%.o
	$(LD) $(WASM_LDFLAGS) -o $@ $<

# Dependencies (must be kept up to date manually - sorry)
build/animate.o: src/animate.h src/defs.h src/collider.h src/util.h
build/memory.o: src/memory.h src/defs.h

clean:
	rm -f dist/* build/*
