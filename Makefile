TA_SRC_DIR = src/ta-lib
RELEASE_DIR = .temp/lib
GET_EXPORTED_FUNCTIONS_SCRIPT = "console.log(['\'_malloc\'','\'_free\''].concat(require('./src/api.json').map(a=>'\'_TA_'+a.name+'\'')).join(','))"
EXPORTED_FUNCTIONS = [$$(node -e $(GET_EXPORTED_FUNCTIONS_SCRIPT))]
NODE_BIN = ./node_modules/.bin

emcc-template = $(TA_SRC_DIR)/src/ta_func/*.c $(TA_SRC_DIR)/src/ta_common/ta_global.c \
		-I $(TA_SRC_DIR)/include/ -I $(TA_SRC_DIR)/src/ta_common/ \
		$(1) -s 'EXPORT_NAME="__INIT__"' -s "EXPORTED_RUNTIME_METHODS=ccall,setValue,getValue" \
		-s "EXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS)" -Oz -o $(RELEASE_DIR)/$(2)

all: build

# The trick is to emit ES6 module, then remove last line
# Also insert a "use strict" directive to the first line
.temp/lib/talib.js:
	@echo "emcc: compiling $@"
	@d=$$(date +%s); \
	mkdir -p $(RELEASE_DIR); \
	emcc $(call emcc-template,-s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=0 -s USE_ES6_IMPORT_META=0,talib.js); \
	echo "emcc: compile $@ took $$(($$(date +%s)-d)) seconds"
	@mv $(RELEASE_DIR)/talib.js $(RELEASE_DIR)/talib.bak.js
	@sed -e '1s/^/"use strict";/' $(RELEASE_DIR)/talib.bak.js | $(NODE_BIN)/prettier --no-config --parser babel > $(RELEASE_DIR)/talib.js
	@rm $(RELEASE_DIR)/talib.bak.js

src/index.ts:
	@echo 're-running "scripts/gencode.js" to generate "src/index.ts"'
	@node scripts/gencode.js

.temp/esm/index.js: src/index.ts
	@mkdir -p .temp/esm/
	@tsc src/index.ts --module es2015 --removeComments --target ES6 --outDir .temp/esm

# final outputs

mkdir-lib:
	@mkdir -p lib/

lib/index.esm.js: mkdir-lib .temp/lib/talib.js .temp/esm/index.js
	@cat .temp/lib/talib.js .temp/esm/index.js > lib/index.esm.js

lib/index.d.ts: mkdir-lib src/index.ts
	@tsc src/index.ts --module es2015 --target ES6 --declaration --emitDeclarationOnly --outDir lib

lib/talib.wasm: mkdir-lib .temp/lib/talib.js
	@cp .temp/lib/talib.wasm lib/talib.wasm

build: lib/index.esm.js lib/talib.wasm lib/index.d.ts

docs:
	$(NODE_BIN)/typedoc
	touch docs/.nojekyll

clean:
	rm -rf .temp
	rm -rf lib
	rm -rf docs
	rm src/index.ts

.PHONY: all mkdir-lib build docs clean