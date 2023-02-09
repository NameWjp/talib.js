"use strict";
var __INIT__ = (() => {
  var _scriptDir =
    typeof document !== "undefined" && document.currentScript
      ? document.currentScript.src
      : undefined;
  if (typeof __filename !== "undefined") _scriptDir = _scriptDir || __filename;
  return function (__INIT__) {
    __INIT__ = __INIT__ || {};

    var Module = typeof __INIT__ != "undefined" ? __INIT__ : {};
    var readyPromiseResolve, readyPromiseReject;
    Module["ready"] = new Promise(function (resolve, reject) {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
    var moduleOverrides = Object.assign({}, Module);
    var arguments_ = [];
    var thisProgram = "./this.program";
    var quit_ = (status, toThrow) => {
      throw toThrow;
    };
    var ENVIRONMENT_IS_WEB = typeof window == "object";
    var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
    var ENVIRONMENT_IS_NODE =
      typeof process == "object" &&
      typeof process.versions == "object" &&
      typeof process.versions.node == "string";
    var scriptDirectory = "";
    function locateFile(path) {
      if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory);
      }
      return scriptDirectory + path;
    }
    var read_, readAsync, readBinary, setWindowTitle;
    function logExceptionOnExit(e) {
      if (e instanceof ExitStatus) return;
      let toLog = e;
      err("exiting due to exception: " + toLog);
    }
    if (ENVIRONMENT_IS_NODE) {
      var fs = require("fs");
      var nodePath = require("path");
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
      } else {
        scriptDirectory = __dirname + "/";
      }
      read_ = (filename, binary) => {
        filename = isFileURI(filename)
          ? new URL(filename)
          : nodePath.normalize(filename);
        return fs.readFileSync(filename, binary ? undefined : "utf8");
      };
      readBinary = (filename) => {
        var ret = read_(filename, true);
        if (!ret.buffer) {
          ret = new Uint8Array(ret);
        }
        return ret;
      };
      readAsync = (filename, onload, onerror) => {
        filename = isFileURI(filename)
          ? new URL(filename)
          : nodePath.normalize(filename);
        fs.readFile(filename, function (err, data) {
          if (err) onerror(err);
          else onload(data.buffer);
        });
      };
      if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/");
      }
      arguments_ = process["argv"].slice(2);
      process["on"]("uncaughtException", function (ex) {
        if (!(ex instanceof ExitStatus)) {
          throw ex;
        }
      });
      process["on"]("unhandledRejection", function (reason) {
        throw reason;
      });
      quit_ = (status, toThrow) => {
        if (keepRuntimeAlive()) {
          process["exitCode"] = status;
          throw toThrow;
        }
        logExceptionOnExit(toThrow);
        process["exit"](status);
      };
      Module["inspect"] = function () {
        return "[Emscripten Module object]";
      };
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
      } else if (typeof document != "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src;
      }
      if (_scriptDir) {
        scriptDirectory = _scriptDir;
      }
      if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(
          0,
          scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1
        );
      } else {
        scriptDirectory = "";
      }
      {
        read_ = (url) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.send(null);
          return xhr.responseText;
        };
        if (ENVIRONMENT_IS_WORKER) {
          readBinary = (url) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
        }
        readAsync = (url, onload, onerror) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = () => {
            if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
              onload(xhr.response);
              return;
            }
            onerror();
          };
          xhr.onerror = onerror;
          xhr.send(null);
        };
      }
      setWindowTitle = (title) => (document.title = title);
    } else {
    }
    var out = Module["print"] || console.log.bind(console);
    var err = Module["printErr"] || console.warn.bind(console);
    Object.assign(Module, moduleOverrides);
    moduleOverrides = null;
    if (Module["arguments"]) arguments_ = Module["arguments"];
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
    if (Module["quit"]) quit_ = Module["quit"];
    var wasmBinary;
    if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
    var noExitRuntime = Module["noExitRuntime"] || true;
    if (typeof WebAssembly != "object") {
      abort("no native wasm support detected");
    }
    var wasmMemory;
    var ABORT = false;
    var EXITSTATUS;
    var UTF8Decoder =
      typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
    function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = "";
      while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 128)) {
          str += String.fromCharCode(u0);
          continue;
        }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 224) == 192) {
          str += String.fromCharCode(((u0 & 31) << 6) | u1);
          continue;
        }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 240) == 224) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          u0 =
            ((u0 & 7) << 18) |
            (u1 << 12) |
            (u2 << 6) |
            (heapOrArray[idx++] & 63);
        }
        if (u0 < 65536) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 65536;
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
        }
      }
      return str;
    }
    function UTF8ToString(ptr, maxBytesToRead) {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
    }
    function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
      if (!(maxBytesToWrite > 0)) return 0;
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1;
      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
          var u1 = str.charCodeAt(++i);
          u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
        }
        if (u <= 127) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 2047) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 192 | (u >> 6);
          heap[outIdx++] = 128 | (u & 63);
        } else if (u <= 65535) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 224 | (u >> 12);
          heap[outIdx++] = 128 | ((u >> 6) & 63);
          heap[outIdx++] = 128 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          heap[outIdx++] = 240 | (u >> 18);
          heap[outIdx++] = 128 | ((u >> 12) & 63);
          heap[outIdx++] = 128 | ((u >> 6) & 63);
          heap[outIdx++] = 128 | (u & 63);
        }
      }
      heap[outIdx] = 0;
      return outIdx - startIdx;
    }
    function stringToUTF8(str, outPtr, maxBytesToWrite) {
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    }
    var buffer,
      HEAP8,
      HEAPU8,
      HEAP16,
      HEAPU16,
      HEAP32,
      HEAPU32,
      HEAPF32,
      HEAPF64;
    function updateGlobalBufferAndViews(buf) {
      buffer = buf;
      Module["HEAP8"] = HEAP8 = new Int8Array(buf);
      Module["HEAP16"] = HEAP16 = new Int16Array(buf);
      Module["HEAP32"] = HEAP32 = new Int32Array(buf);
      Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
      Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
      Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
      Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
      Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
    }
    var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
    var wasmTable;
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    function keepRuntimeAlive() {
      return noExitRuntime;
    }
    function preRun() {
      if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function")
          Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
          addOnPreRun(Module["preRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
      runtimeInitialized = true;
      callRuntimeCallbacks(__ATINIT__);
    }
    function postRun() {
      if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function")
          Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
          addOnPostRun(Module["postRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }
    function addOnInit(cb) {
      __ATINIT__.unshift(cb);
    }
    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;
    function addRunDependency(id) {
      runDependencies++;
      if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
      }
    }
    function removeRunDependency(id) {
      runDependencies--;
      if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
      }
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }
    function abort(what) {
      if (Module["onAbort"]) {
        Module["onAbort"](what);
      }
      what = "Aborted(" + what + ")";
      err(what);
      ABORT = true;
      EXITSTATUS = 1;
      what += ". Build with -sASSERTIONS for more info.";
      var e = new WebAssembly.RuntimeError(what);
      readyPromiseReject(e);
      throw e;
    }
    var dataURIPrefix = "data:application/octet-stream;base64,";
    function isDataURI(filename) {
      return filename.startsWith(dataURIPrefix);
    }
    function isFileURI(filename) {
      return filename.startsWith("file://");
    }
    var wasmBinaryFile;
    wasmBinaryFile = "talib.wasm";
    if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
    }
    function getBinary(file) {
      try {
        if (file == wasmBinaryFile && wasmBinary) {
          return new Uint8Array(wasmBinary);
        }
        if (readBinary) {
          return readBinary(file);
        }
        throw "both async and sync fetching of the wasm failed";
      } catch (err) {
        abort(err);
      }
    }
    function getBinaryPromise() {
      if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch == "function" && !isFileURI(wasmBinaryFile)) {
          return fetch(wasmBinaryFile, { credentials: "same-origin" })
            .then(function (response) {
              if (!response["ok"]) {
                throw (
                  "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                );
              }
              return response["arrayBuffer"]();
            })
            .catch(function () {
              return getBinary(wasmBinaryFile);
            });
        } else {
          if (readAsync) {
            return new Promise(function (resolve, reject) {
              readAsync(
                wasmBinaryFile,
                function (response) {
                  resolve(new Uint8Array(response));
                },
                reject
              );
            });
          }
        }
      }
      return Promise.resolve().then(function () {
        return getBinary(wasmBinaryFile);
      });
    }
    function createWasm() {
      var info = { a: asmLibraryArg };
      function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        wasmMemory = Module["asm"]["b"];
        updateGlobalBufferAndViews(wasmMemory.buffer);
        wasmTable = Module["asm"]["ec"];
        addOnInit(Module["asm"]["c"]);
        removeRunDependency("wasm-instantiate");
      }
      addRunDependency("wasm-instantiate");
      function receiveInstantiationResult(result) {
        receiveInstance(result["instance"]);
      }
      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise()
          .then(function (binary) {
            return WebAssembly.instantiate(binary, info);
          })
          .then(function (instance) {
            return instance;
          })
          .then(receiver, function (reason) {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason);
          });
      }
      function instantiateAsync() {
        if (
          !wasmBinary &&
          typeof WebAssembly.instantiateStreaming == "function" &&
          !isDataURI(wasmBinaryFile) &&
          !isFileURI(wasmBinaryFile) &&
          !ENVIRONMENT_IS_NODE &&
          typeof fetch == "function"
        ) {
          return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(
            function (response) {
              var result = WebAssembly.instantiateStreaming(response, info);
              return result.then(receiveInstantiationResult, function (reason) {
                err("wasm streaming compile failed: " + reason);
                err("falling back to ArrayBuffer instantiation");
                return instantiateArrayBuffer(receiveInstantiationResult);
              });
            }
          );
        } else {
          return instantiateArrayBuffer(receiveInstantiationResult);
        }
      }
      if (Module["instantiateWasm"]) {
        try {
          var exports = Module["instantiateWasm"](info, receiveInstance);
          return exports;
        } catch (e) {
          err("Module.instantiateWasm callback failed with error: " + e);
          readyPromiseReject(e);
        }
      }
      instantiateAsync().catch(readyPromiseReject);
      return {};
    }
    var tempDouble;
    var tempI64;
    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + status + ")";
      this.status = status;
    }
    function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        callbacks.shift()(Module);
      }
    }
    function getValue(ptr, type = "i8") {
      if (type.endsWith("*")) type = "*";
      switch (type) {
        case "i1":
          return HEAP8[ptr >> 0];
        case "i8":
          return HEAP8[ptr >> 0];
        case "i16":
          return HEAP16[ptr >> 1];
        case "i32":
          return HEAP32[ptr >> 2];
        case "i64":
          return HEAP32[ptr >> 2];
        case "float":
          return HEAPF32[ptr >> 2];
        case "double":
          return HEAPF64[ptr >> 3];
        case "*":
          return HEAPU32[ptr >> 2];
        default:
          abort("invalid type for getValue: " + type);
      }
      return null;
    }
    function setValue(ptr, value, type = "i8") {
      if (type.endsWith("*")) type = "*";
      switch (type) {
        case "i1":
          HEAP8[ptr >> 0] = value;
          break;
        case "i8":
          HEAP8[ptr >> 0] = value;
          break;
        case "i16":
          HEAP16[ptr >> 1] = value;
          break;
        case "i32":
          HEAP32[ptr >> 2] = value;
          break;
        case "i64":
          (tempI64 = [
            value >>> 0,
            ((tempDouble = value),
            +Math.abs(tempDouble) >= 1
              ? tempDouble > 0
                ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) |
                    0) >>>
                  0
                : ~~+Math.ceil(
                    (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                  ) >>> 0
              : 0),
          ]),
            (HEAP32[ptr >> 2] = tempI64[0]),
            (HEAP32[(ptr + 4) >> 2] = tempI64[1]);
          break;
        case "float":
          HEAPF32[ptr >> 2] = value;
          break;
        case "double":
          HEAPF64[ptr >> 3] = value;
          break;
        case "*":
          HEAPU32[ptr >> 2] = value;
          break;
        default:
          abort("invalid type for setValue: " + type);
      }
    }
    function abortOnCannotGrowMemory(requestedSize) {
      abort("OOM");
    }
    function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }
    function getCFunc(ident) {
      var func = Module["_" + ident];
      return func;
    }
    function writeArrayToMemory(array, buffer) {
      HEAP8.set(array, buffer);
    }
    function ccall(ident, returnType, argTypes, args, opts) {
      var toC = {
        string: (str) => {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) {
            var len = (str.length << 2) + 1;
            ret = stackAlloc(len);
            stringToUTF8(str, ret, len);
          }
          return ret;
        },
        array: (arr) => {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        },
      };
      function convertReturnValue(ret) {
        if (returnType === "string") {
          return UTF8ToString(ret);
        }
        if (returnType === "boolean") return Boolean(ret);
        return ret;
      }
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var ret = func.apply(null, cArgs);
      function onDone(ret) {
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
      }
      ret = onDone(ret);
      return ret;
    }
    var asmLibraryArg = { a: _emscripten_resize_heap };
    var asm = createWasm();
    var ___wasm_call_ctors = (Module["___wasm_call_ctors"] = function () {
      return (___wasm_call_ctors = Module["___wasm_call_ctors"] =
        Module["asm"]["c"]).apply(null, arguments);
    });
    var _TA_ACCBANDS = (Module["_TA_ACCBANDS"] = function () {
      return (_TA_ACCBANDS = Module["_TA_ACCBANDS"] = Module["asm"]["d"]).apply(
        null,
        arguments
      );
    });
    var _malloc = (Module["_malloc"] = function () {
      return (_malloc = Module["_malloc"] = Module["asm"]["e"]).apply(
        null,
        arguments
      );
    });
    var _free = (Module["_free"] = function () {
      return (_free = Module["_free"] = Module["asm"]["f"]).apply(
        null,
        arguments
      );
    });
    var _TA_SMA = (Module["_TA_SMA"] = function () {
      return (_TA_SMA = Module["_TA_SMA"] = Module["asm"]["g"]).apply(
        null,
        arguments
      );
    });
    var _TA_ACOS = (Module["_TA_ACOS"] = function () {
      return (_TA_ACOS = Module["_TA_ACOS"] = Module["asm"]["h"]).apply(
        null,
        arguments
      );
    });
    var _TA_AD = (Module["_TA_AD"] = function () {
      return (_TA_AD = Module["_TA_AD"] = Module["asm"]["i"]).apply(
        null,
        arguments
      );
    });
    var _TA_ADD = (Module["_TA_ADD"] = function () {
      return (_TA_ADD = Module["_TA_ADD"] = Module["asm"]["j"]).apply(
        null,
        arguments
      );
    });
    var _TA_ADOSC = (Module["_TA_ADOSC"] = function () {
      return (_TA_ADOSC = Module["_TA_ADOSC"] = Module["asm"]["k"]).apply(
        null,
        arguments
      );
    });
    var _TA_ADX = (Module["_TA_ADX"] = function () {
      return (_TA_ADX = Module["_TA_ADX"] = Module["asm"]["l"]).apply(
        null,
        arguments
      );
    });
    var _TA_ADXR = (Module["_TA_ADXR"] = function () {
      return (_TA_ADXR = Module["_TA_ADXR"] = Module["asm"]["m"]).apply(
        null,
        arguments
      );
    });
    var _TA_APO = (Module["_TA_APO"] = function () {
      return (_TA_APO = Module["_TA_APO"] = Module["asm"]["n"]).apply(
        null,
        arguments
      );
    });
    var _TA_MA = (Module["_TA_MA"] = function () {
      return (_TA_MA = Module["_TA_MA"] = Module["asm"]["o"]).apply(
        null,
        arguments
      );
    });
    var _TA_AROON = (Module["_TA_AROON"] = function () {
      return (_TA_AROON = Module["_TA_AROON"] = Module["asm"]["p"]).apply(
        null,
        arguments
      );
    });
    var _TA_AROONOSC = (Module["_TA_AROONOSC"] = function () {
      return (_TA_AROONOSC = Module["_TA_AROONOSC"] = Module["asm"]["q"]).apply(
        null,
        arguments
      );
    });
    var _TA_ASIN = (Module["_TA_ASIN"] = function () {
      return (_TA_ASIN = Module["_TA_ASIN"] = Module["asm"]["r"]).apply(
        null,
        arguments
      );
    });
    var _TA_ATAN = (Module["_TA_ATAN"] = function () {
      return (_TA_ATAN = Module["_TA_ATAN"] = Module["asm"]["s"]).apply(
        null,
        arguments
      );
    });
    var _TA_ATR = (Module["_TA_ATR"] = function () {
      return (_TA_ATR = Module["_TA_ATR"] = Module["asm"]["t"]).apply(
        null,
        arguments
      );
    });
    var _TA_TRANGE = (Module["_TA_TRANGE"] = function () {
      return (_TA_TRANGE = Module["_TA_TRANGE"] = Module["asm"]["u"]).apply(
        null,
        arguments
      );
    });
    var _TA_AVGDEV = (Module["_TA_AVGDEV"] = function () {
      return (_TA_AVGDEV = Module["_TA_AVGDEV"] = Module["asm"]["v"]).apply(
        null,
        arguments
      );
    });
    var _TA_AVGPRICE = (Module["_TA_AVGPRICE"] = function () {
      return (_TA_AVGPRICE = Module["_TA_AVGPRICE"] = Module["asm"]["w"]).apply(
        null,
        arguments
      );
    });
    var _TA_BBANDS = (Module["_TA_BBANDS"] = function () {
      return (_TA_BBANDS = Module["_TA_BBANDS"] = Module["asm"]["x"]).apply(
        null,
        arguments
      );
    });
    var _TA_STDDEV = (Module["_TA_STDDEV"] = function () {
      return (_TA_STDDEV = Module["_TA_STDDEV"] = Module["asm"]["y"]).apply(
        null,
        arguments
      );
    });
    var _TA_BETA = (Module["_TA_BETA"] = function () {
      return (_TA_BETA = Module["_TA_BETA"] = Module["asm"]["z"]).apply(
        null,
        arguments
      );
    });
    var _TA_BOP = (Module["_TA_BOP"] = function () {
      return (_TA_BOP = Module["_TA_BOP"] = Module["asm"]["A"]).apply(
        null,
        arguments
      );
    });
    var _TA_CCI = (Module["_TA_CCI"] = function () {
      return (_TA_CCI = Module["_TA_CCI"] = Module["asm"]["B"]).apply(
        null,
        arguments
      );
    });
    var _TA_CDL2CROWS = (Module["_TA_CDL2CROWS"] = function () {
      return (_TA_CDL2CROWS = Module["_TA_CDL2CROWS"] =
        Module["asm"]["C"]).apply(null, arguments);
    });
    var _TA_CDL3BLACKCROWS = (Module["_TA_CDL3BLACKCROWS"] = function () {
      return (_TA_CDL3BLACKCROWS = Module["_TA_CDL3BLACKCROWS"] =
        Module["asm"]["D"]).apply(null, arguments);
    });
    var _TA_CDL3INSIDE = (Module["_TA_CDL3INSIDE"] = function () {
      return (_TA_CDL3INSIDE = Module["_TA_CDL3INSIDE"] =
        Module["asm"]["E"]).apply(null, arguments);
    });
    var _TA_CDL3LINESTRIKE = (Module["_TA_CDL3LINESTRIKE"] = function () {
      return (_TA_CDL3LINESTRIKE = Module["_TA_CDL3LINESTRIKE"] =
        Module["asm"]["F"]).apply(null, arguments);
    });
    var _TA_CDL3OUTSIDE = (Module["_TA_CDL3OUTSIDE"] = function () {
      return (_TA_CDL3OUTSIDE = Module["_TA_CDL3OUTSIDE"] =
        Module["asm"]["G"]).apply(null, arguments);
    });
    var _TA_CDL3STARSINSOUTH = (Module["_TA_CDL3STARSINSOUTH"] = function () {
      return (_TA_CDL3STARSINSOUTH = Module["_TA_CDL3STARSINSOUTH"] =
        Module["asm"]["H"]).apply(null, arguments);
    });
    var _TA_CDL3WHITESOLDIERS = (Module["_TA_CDL3WHITESOLDIERS"] = function () {
      return (_TA_CDL3WHITESOLDIERS = Module["_TA_CDL3WHITESOLDIERS"] =
        Module["asm"]["I"]).apply(null, arguments);
    });
    var _TA_CDLABANDONEDBABY = (Module["_TA_CDLABANDONEDBABY"] = function () {
      return (_TA_CDLABANDONEDBABY = Module["_TA_CDLABANDONEDBABY"] =
        Module["asm"]["J"]).apply(null, arguments);
    });
    var _TA_CDLADVANCEBLOCK = (Module["_TA_CDLADVANCEBLOCK"] = function () {
      return (_TA_CDLADVANCEBLOCK = Module["_TA_CDLADVANCEBLOCK"] =
        Module["asm"]["K"]).apply(null, arguments);
    });
    var _TA_CDLBELTHOLD = (Module["_TA_CDLBELTHOLD"] = function () {
      return (_TA_CDLBELTHOLD = Module["_TA_CDLBELTHOLD"] =
        Module["asm"]["L"]).apply(null, arguments);
    });
    var _TA_CDLBREAKAWAY = (Module["_TA_CDLBREAKAWAY"] = function () {
      return (_TA_CDLBREAKAWAY = Module["_TA_CDLBREAKAWAY"] =
        Module["asm"]["M"]).apply(null, arguments);
    });
    var _TA_CDLCLOSINGMARUBOZU = (Module["_TA_CDLCLOSINGMARUBOZU"] =
      function () {
        return (_TA_CDLCLOSINGMARUBOZU = Module["_TA_CDLCLOSINGMARUBOZU"] =
          Module["asm"]["N"]).apply(null, arguments);
      });
    var _TA_CDLCONCEALBABYSWALL = (Module["_TA_CDLCONCEALBABYSWALL"] =
      function () {
        return (_TA_CDLCONCEALBABYSWALL = Module["_TA_CDLCONCEALBABYSWALL"] =
          Module["asm"]["O"]).apply(null, arguments);
      });
    var _TA_CDLCOUNTERATTACK = (Module["_TA_CDLCOUNTERATTACK"] = function () {
      return (_TA_CDLCOUNTERATTACK = Module["_TA_CDLCOUNTERATTACK"] =
        Module["asm"]["P"]).apply(null, arguments);
    });
    var _TA_CDLDARKCLOUDCOVER = (Module["_TA_CDLDARKCLOUDCOVER"] = function () {
      return (_TA_CDLDARKCLOUDCOVER = Module["_TA_CDLDARKCLOUDCOVER"] =
        Module["asm"]["Q"]).apply(null, arguments);
    });
    var _TA_CDLDOJI = (Module["_TA_CDLDOJI"] = function () {
      return (_TA_CDLDOJI = Module["_TA_CDLDOJI"] = Module["asm"]["R"]).apply(
        null,
        arguments
      );
    });
    var _TA_CDLDOJISTAR = (Module["_TA_CDLDOJISTAR"] = function () {
      return (_TA_CDLDOJISTAR = Module["_TA_CDLDOJISTAR"] =
        Module["asm"]["S"]).apply(null, arguments);
    });
    var _TA_CDLDRAGONFLYDOJI = (Module["_TA_CDLDRAGONFLYDOJI"] = function () {
      return (_TA_CDLDRAGONFLYDOJI = Module["_TA_CDLDRAGONFLYDOJI"] =
        Module["asm"]["T"]).apply(null, arguments);
    });
    var _TA_CDLENGULFING = (Module["_TA_CDLENGULFING"] = function () {
      return (_TA_CDLENGULFING = Module["_TA_CDLENGULFING"] =
        Module["asm"]["U"]).apply(null, arguments);
    });
    var _TA_CDLEVENINGDOJISTAR = (Module["_TA_CDLEVENINGDOJISTAR"] =
      function () {
        return (_TA_CDLEVENINGDOJISTAR = Module["_TA_CDLEVENINGDOJISTAR"] =
          Module["asm"]["V"]).apply(null, arguments);
      });
    var _TA_CDLEVENINGSTAR = (Module["_TA_CDLEVENINGSTAR"] = function () {
      return (_TA_CDLEVENINGSTAR = Module["_TA_CDLEVENINGSTAR"] =
        Module["asm"]["W"]).apply(null, arguments);
    });
    var _TA_CDLGAPSIDESIDEWHITE = (Module["_TA_CDLGAPSIDESIDEWHITE"] =
      function () {
        return (_TA_CDLGAPSIDESIDEWHITE = Module["_TA_CDLGAPSIDESIDEWHITE"] =
          Module["asm"]["X"]).apply(null, arguments);
      });
    var _TA_CDLGRAVESTONEDOJI = (Module["_TA_CDLGRAVESTONEDOJI"] = function () {
      return (_TA_CDLGRAVESTONEDOJI = Module["_TA_CDLGRAVESTONEDOJI"] =
        Module["asm"]["Y"]).apply(null, arguments);
    });
    var _TA_CDLHAMMER = (Module["_TA_CDLHAMMER"] = function () {
      return (_TA_CDLHAMMER = Module["_TA_CDLHAMMER"] =
        Module["asm"]["Z"]).apply(null, arguments);
    });
    var _TA_CDLHANGINGMAN = (Module["_TA_CDLHANGINGMAN"] = function () {
      return (_TA_CDLHANGINGMAN = Module["_TA_CDLHANGINGMAN"] =
        Module["asm"]["_"]).apply(null, arguments);
    });
    var _TA_CDLHARAMI = (Module["_TA_CDLHARAMI"] = function () {
      return (_TA_CDLHARAMI = Module["_TA_CDLHARAMI"] =
        Module["asm"]["$"]).apply(null, arguments);
    });
    var _TA_CDLHARAMICROSS = (Module["_TA_CDLHARAMICROSS"] = function () {
      return (_TA_CDLHARAMICROSS = Module["_TA_CDLHARAMICROSS"] =
        Module["asm"]["aa"]).apply(null, arguments);
    });
    var _TA_CDLHIGHWAVE = (Module["_TA_CDLHIGHWAVE"] = function () {
      return (_TA_CDLHIGHWAVE = Module["_TA_CDLHIGHWAVE"] =
        Module["asm"]["ba"]).apply(null, arguments);
    });
    var _TA_CDLHIKKAKE = (Module["_TA_CDLHIKKAKE"] = function () {
      return (_TA_CDLHIKKAKE = Module["_TA_CDLHIKKAKE"] =
        Module["asm"]["ca"]).apply(null, arguments);
    });
    var _TA_CDLHIKKAKEMOD = (Module["_TA_CDLHIKKAKEMOD"] = function () {
      return (_TA_CDLHIKKAKEMOD = Module["_TA_CDLHIKKAKEMOD"] =
        Module["asm"]["da"]).apply(null, arguments);
    });
    var _TA_CDLHOMINGPIGEON = (Module["_TA_CDLHOMINGPIGEON"] = function () {
      return (_TA_CDLHOMINGPIGEON = Module["_TA_CDLHOMINGPIGEON"] =
        Module["asm"]["ea"]).apply(null, arguments);
    });
    var _TA_CDLIDENTICAL3CROWS = (Module["_TA_CDLIDENTICAL3CROWS"] =
      function () {
        return (_TA_CDLIDENTICAL3CROWS = Module["_TA_CDLIDENTICAL3CROWS"] =
          Module["asm"]["fa"]).apply(null, arguments);
      });
    var _TA_CDLINNECK = (Module["_TA_CDLINNECK"] = function () {
      return (_TA_CDLINNECK = Module["_TA_CDLINNECK"] =
        Module["asm"]["ga"]).apply(null, arguments);
    });
    var _TA_CDLINVERTEDHAMMER = (Module["_TA_CDLINVERTEDHAMMER"] = function () {
      return (_TA_CDLINVERTEDHAMMER = Module["_TA_CDLINVERTEDHAMMER"] =
        Module["asm"]["ha"]).apply(null, arguments);
    });
    var _TA_CDLKICKING = (Module["_TA_CDLKICKING"] = function () {
      return (_TA_CDLKICKING = Module["_TA_CDLKICKING"] =
        Module["asm"]["ia"]).apply(null, arguments);
    });
    var _TA_CDLKICKINGBYLENGTH = (Module["_TA_CDLKICKINGBYLENGTH"] =
      function () {
        return (_TA_CDLKICKINGBYLENGTH = Module["_TA_CDLKICKINGBYLENGTH"] =
          Module["asm"]["ja"]).apply(null, arguments);
      });
    var _TA_CDLLADDERBOTTOM = (Module["_TA_CDLLADDERBOTTOM"] = function () {
      return (_TA_CDLLADDERBOTTOM = Module["_TA_CDLLADDERBOTTOM"] =
        Module["asm"]["ka"]).apply(null, arguments);
    });
    var _TA_CDLLONGLEGGEDDOJI = (Module["_TA_CDLLONGLEGGEDDOJI"] = function () {
      return (_TA_CDLLONGLEGGEDDOJI = Module["_TA_CDLLONGLEGGEDDOJI"] =
        Module["asm"]["la"]).apply(null, arguments);
    });
    var _TA_CDLLONGLINE = (Module["_TA_CDLLONGLINE"] = function () {
      return (_TA_CDLLONGLINE = Module["_TA_CDLLONGLINE"] =
        Module["asm"]["ma"]).apply(null, arguments);
    });
    var _TA_CDLMARUBOZU = (Module["_TA_CDLMARUBOZU"] = function () {
      return (_TA_CDLMARUBOZU = Module["_TA_CDLMARUBOZU"] =
        Module["asm"]["na"]).apply(null, arguments);
    });
    var _TA_CDLMATCHINGLOW = (Module["_TA_CDLMATCHINGLOW"] = function () {
      return (_TA_CDLMATCHINGLOW = Module["_TA_CDLMATCHINGLOW"] =
        Module["asm"]["oa"]).apply(null, arguments);
    });
    var _TA_CDLMATHOLD = (Module["_TA_CDLMATHOLD"] = function () {
      return (_TA_CDLMATHOLD = Module["_TA_CDLMATHOLD"] =
        Module["asm"]["pa"]).apply(null, arguments);
    });
    var _TA_CDLMORNINGDOJISTAR = (Module["_TA_CDLMORNINGDOJISTAR"] =
      function () {
        return (_TA_CDLMORNINGDOJISTAR = Module["_TA_CDLMORNINGDOJISTAR"] =
          Module["asm"]["qa"]).apply(null, arguments);
      });
    var _TA_CDLMORNINGSTAR = (Module["_TA_CDLMORNINGSTAR"] = function () {
      return (_TA_CDLMORNINGSTAR = Module["_TA_CDLMORNINGSTAR"] =
        Module["asm"]["ra"]).apply(null, arguments);
    });
    var _TA_CDLONNECK = (Module["_TA_CDLONNECK"] = function () {
      return (_TA_CDLONNECK = Module["_TA_CDLONNECK"] =
        Module["asm"]["sa"]).apply(null, arguments);
    });
    var _TA_CDLPIERCING = (Module["_TA_CDLPIERCING"] = function () {
      return (_TA_CDLPIERCING = Module["_TA_CDLPIERCING"] =
        Module["asm"]["ta"]).apply(null, arguments);
    });
    var _TA_CDLRICKSHAWMAN = (Module["_TA_CDLRICKSHAWMAN"] = function () {
      return (_TA_CDLRICKSHAWMAN = Module["_TA_CDLRICKSHAWMAN"] =
        Module["asm"]["ua"]).apply(null, arguments);
    });
    var _TA_CDLRISEFALL3METHODS = (Module["_TA_CDLRISEFALL3METHODS"] =
      function () {
        return (_TA_CDLRISEFALL3METHODS = Module["_TA_CDLRISEFALL3METHODS"] =
          Module["asm"]["va"]).apply(null, arguments);
      });
    var _TA_CDLSEPARATINGLINES = (Module["_TA_CDLSEPARATINGLINES"] =
      function () {
        return (_TA_CDLSEPARATINGLINES = Module["_TA_CDLSEPARATINGLINES"] =
          Module["asm"]["wa"]).apply(null, arguments);
      });
    var _TA_CDLSHOOTINGSTAR = (Module["_TA_CDLSHOOTINGSTAR"] = function () {
      return (_TA_CDLSHOOTINGSTAR = Module["_TA_CDLSHOOTINGSTAR"] =
        Module["asm"]["xa"]).apply(null, arguments);
    });
    var _TA_CDLSHORTLINE = (Module["_TA_CDLSHORTLINE"] = function () {
      return (_TA_CDLSHORTLINE = Module["_TA_CDLSHORTLINE"] =
        Module["asm"]["ya"]).apply(null, arguments);
    });
    var _TA_CDLSPINNINGTOP = (Module["_TA_CDLSPINNINGTOP"] = function () {
      return (_TA_CDLSPINNINGTOP = Module["_TA_CDLSPINNINGTOP"] =
        Module["asm"]["za"]).apply(null, arguments);
    });
    var _TA_CDLSTALLEDPATTERN = (Module["_TA_CDLSTALLEDPATTERN"] = function () {
      return (_TA_CDLSTALLEDPATTERN = Module["_TA_CDLSTALLEDPATTERN"] =
        Module["asm"]["Aa"]).apply(null, arguments);
    });
    var _TA_CDLSTICKSANDWICH = (Module["_TA_CDLSTICKSANDWICH"] = function () {
      return (_TA_CDLSTICKSANDWICH = Module["_TA_CDLSTICKSANDWICH"] =
        Module["asm"]["Ba"]).apply(null, arguments);
    });
    var _TA_CDLTAKURI = (Module["_TA_CDLTAKURI"] = function () {
      return (_TA_CDLTAKURI = Module["_TA_CDLTAKURI"] =
        Module["asm"]["Ca"]).apply(null, arguments);
    });
    var _TA_CDLTASUKIGAP = (Module["_TA_CDLTASUKIGAP"] = function () {
      return (_TA_CDLTASUKIGAP = Module["_TA_CDLTASUKIGAP"] =
        Module["asm"]["Da"]).apply(null, arguments);
    });
    var _TA_CDLTHRUSTING = (Module["_TA_CDLTHRUSTING"] = function () {
      return (_TA_CDLTHRUSTING = Module["_TA_CDLTHRUSTING"] =
        Module["asm"]["Ea"]).apply(null, arguments);
    });
    var _TA_CDLTRISTAR = (Module["_TA_CDLTRISTAR"] = function () {
      return (_TA_CDLTRISTAR = Module["_TA_CDLTRISTAR"] =
        Module["asm"]["Fa"]).apply(null, arguments);
    });
    var _TA_CDLUNIQUE3RIVER = (Module["_TA_CDLUNIQUE3RIVER"] = function () {
      return (_TA_CDLUNIQUE3RIVER = Module["_TA_CDLUNIQUE3RIVER"] =
        Module["asm"]["Ga"]).apply(null, arguments);
    });
    var _TA_CDLUPSIDEGAP2CROWS = (Module["_TA_CDLUPSIDEGAP2CROWS"] =
      function () {
        return (_TA_CDLUPSIDEGAP2CROWS = Module["_TA_CDLUPSIDEGAP2CROWS"] =
          Module["asm"]["Ha"]).apply(null, arguments);
      });
    var _TA_CDLXSIDEGAP3METHODS = (Module["_TA_CDLXSIDEGAP3METHODS"] =
      function () {
        return (_TA_CDLXSIDEGAP3METHODS = Module["_TA_CDLXSIDEGAP3METHODS"] =
          Module["asm"]["Ia"]).apply(null, arguments);
      });
    var _TA_CEIL = (Module["_TA_CEIL"] = function () {
      return (_TA_CEIL = Module["_TA_CEIL"] = Module["asm"]["Ja"]).apply(
        null,
        arguments
      );
    });
    var _TA_CMO = (Module["_TA_CMO"] = function () {
      return (_TA_CMO = Module["_TA_CMO"] = Module["asm"]["Ka"]).apply(
        null,
        arguments
      );
    });
    var _TA_CORREL = (Module["_TA_CORREL"] = function () {
      return (_TA_CORREL = Module["_TA_CORREL"] = Module["asm"]["La"]).apply(
        null,
        arguments
      );
    });
    var _TA_COS = (Module["_TA_COS"] = function () {
      return (_TA_COS = Module["_TA_COS"] = Module["asm"]["Ma"]).apply(
        null,
        arguments
      );
    });
    var _TA_COSH = (Module["_TA_COSH"] = function () {
      return (_TA_COSH = Module["_TA_COSH"] = Module["asm"]["Na"]).apply(
        null,
        arguments
      );
    });
    var _TA_DEMA = (Module["_TA_DEMA"] = function () {
      return (_TA_DEMA = Module["_TA_DEMA"] = Module["asm"]["Oa"]).apply(
        null,
        arguments
      );
    });
    var _TA_DIV = (Module["_TA_DIV"] = function () {
      return (_TA_DIV = Module["_TA_DIV"] = Module["asm"]["Pa"]).apply(
        null,
        arguments
      );
    });
    var _TA_DX = (Module["_TA_DX"] = function () {
      return (_TA_DX = Module["_TA_DX"] = Module["asm"]["Qa"]).apply(
        null,
        arguments
      );
    });
    var _TA_EMA = (Module["_TA_EMA"] = function () {
      return (_TA_EMA = Module["_TA_EMA"] = Module["asm"]["Ra"]).apply(
        null,
        arguments
      );
    });
    var _TA_EXP = (Module["_TA_EXP"] = function () {
      return (_TA_EXP = Module["_TA_EXP"] = Module["asm"]["Sa"]).apply(
        null,
        arguments
      );
    });
    var _TA_FLOOR = (Module["_TA_FLOOR"] = function () {
      return (_TA_FLOOR = Module["_TA_FLOOR"] = Module["asm"]["Ta"]).apply(
        null,
        arguments
      );
    });
    var _TA_HT_DCPERIOD = (Module["_TA_HT_DCPERIOD"] = function () {
      return (_TA_HT_DCPERIOD = Module["_TA_HT_DCPERIOD"] =
        Module["asm"]["Ua"]).apply(null, arguments);
    });
    var _TA_HT_DCPHASE = (Module["_TA_HT_DCPHASE"] = function () {
      return (_TA_HT_DCPHASE = Module["_TA_HT_DCPHASE"] =
        Module["asm"]["Va"]).apply(null, arguments);
    });
    var _TA_HT_PHASOR = (Module["_TA_HT_PHASOR"] = function () {
      return (_TA_HT_PHASOR = Module["_TA_HT_PHASOR"] =
        Module["asm"]["Wa"]).apply(null, arguments);
    });
    var _TA_HT_SINE = (Module["_TA_HT_SINE"] = function () {
      return (_TA_HT_SINE = Module["_TA_HT_SINE"] = Module["asm"]["Xa"]).apply(
        null,
        arguments
      );
    });
    var _TA_HT_TRENDLINE = (Module["_TA_HT_TRENDLINE"] = function () {
      return (_TA_HT_TRENDLINE = Module["_TA_HT_TRENDLINE"] =
        Module["asm"]["Ya"]).apply(null, arguments);
    });
    var _TA_HT_TRENDMODE = (Module["_TA_HT_TRENDMODE"] = function () {
      return (_TA_HT_TRENDMODE = Module["_TA_HT_TRENDMODE"] =
        Module["asm"]["Za"]).apply(null, arguments);
    });
    var _TA_IMI = (Module["_TA_IMI"] = function () {
      return (_TA_IMI = Module["_TA_IMI"] = Module["asm"]["_a"]).apply(
        null,
        arguments
      );
    });
    var _TA_KAMA = (Module["_TA_KAMA"] = function () {
      return (_TA_KAMA = Module["_TA_KAMA"] = Module["asm"]["$a"]).apply(
        null,
        arguments
      );
    });
    var _TA_LINEARREG = (Module["_TA_LINEARREG"] = function () {
      return (_TA_LINEARREG = Module["_TA_LINEARREG"] =
        Module["asm"]["ab"]).apply(null, arguments);
    });
    var _TA_LINEARREG_ANGLE = (Module["_TA_LINEARREG_ANGLE"] = function () {
      return (_TA_LINEARREG_ANGLE = Module["_TA_LINEARREG_ANGLE"] =
        Module["asm"]["bb"]).apply(null, arguments);
    });
    var _TA_LINEARREG_INTERCEPT = (Module["_TA_LINEARREG_INTERCEPT"] =
      function () {
        return (_TA_LINEARREG_INTERCEPT = Module["_TA_LINEARREG_INTERCEPT"] =
          Module["asm"]["cb"]).apply(null, arguments);
      });
    var _TA_LINEARREG_SLOPE = (Module["_TA_LINEARREG_SLOPE"] = function () {
      return (_TA_LINEARREG_SLOPE = Module["_TA_LINEARREG_SLOPE"] =
        Module["asm"]["db"]).apply(null, arguments);
    });
    var _TA_LN = (Module["_TA_LN"] = function () {
      return (_TA_LN = Module["_TA_LN"] = Module["asm"]["eb"]).apply(
        null,
        arguments
      );
    });
    var _TA_LOG10 = (Module["_TA_LOG10"] = function () {
      return (_TA_LOG10 = Module["_TA_LOG10"] = Module["asm"]["fb"]).apply(
        null,
        arguments
      );
    });
    var _TA_WMA = (Module["_TA_WMA"] = function () {
      return (_TA_WMA = Module["_TA_WMA"] = Module["asm"]["gb"]).apply(
        null,
        arguments
      );
    });
    var _TA_TEMA = (Module["_TA_TEMA"] = function () {
      return (_TA_TEMA = Module["_TA_TEMA"] = Module["asm"]["hb"]).apply(
        null,
        arguments
      );
    });
    var _TA_TRIMA = (Module["_TA_TRIMA"] = function () {
      return (_TA_TRIMA = Module["_TA_TRIMA"] = Module["asm"]["ib"]).apply(
        null,
        arguments
      );
    });
    var _TA_MAMA = (Module["_TA_MAMA"] = function () {
      return (_TA_MAMA = Module["_TA_MAMA"] = Module["asm"]["jb"]).apply(
        null,
        arguments
      );
    });
    var _TA_T3 = (Module["_TA_T3"] = function () {
      return (_TA_T3 = Module["_TA_T3"] = Module["asm"]["kb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MACD = (Module["_TA_MACD"] = function () {
      return (_TA_MACD = Module["_TA_MACD"] = Module["asm"]["lb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MACDEXT = (Module["_TA_MACDEXT"] = function () {
      return (_TA_MACDEXT = Module["_TA_MACDEXT"] = Module["asm"]["mb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MACDFIX = (Module["_TA_MACDFIX"] = function () {
      return (_TA_MACDFIX = Module["_TA_MACDFIX"] = Module["asm"]["nb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MAVP = (Module["_TA_MAVP"] = function () {
      return (_TA_MAVP = Module["_TA_MAVP"] = Module["asm"]["ob"]).apply(
        null,
        arguments
      );
    });
    var _TA_MAX = (Module["_TA_MAX"] = function () {
      return (_TA_MAX = Module["_TA_MAX"] = Module["asm"]["pb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MAXINDEX = (Module["_TA_MAXINDEX"] = function () {
      return (_TA_MAXINDEX = Module["_TA_MAXINDEX"] =
        Module["asm"]["qb"]).apply(null, arguments);
    });
    var _TA_MEDPRICE = (Module["_TA_MEDPRICE"] = function () {
      return (_TA_MEDPRICE = Module["_TA_MEDPRICE"] =
        Module["asm"]["rb"]).apply(null, arguments);
    });
    var _TA_MFI = (Module["_TA_MFI"] = function () {
      return (_TA_MFI = Module["_TA_MFI"] = Module["asm"]["sb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MIDPOINT = (Module["_TA_MIDPOINT"] = function () {
      return (_TA_MIDPOINT = Module["_TA_MIDPOINT"] =
        Module["asm"]["tb"]).apply(null, arguments);
    });
    var _TA_MIDPRICE = (Module["_TA_MIDPRICE"] = function () {
      return (_TA_MIDPRICE = Module["_TA_MIDPRICE"] =
        Module["asm"]["ub"]).apply(null, arguments);
    });
    var _TA_MIN = (Module["_TA_MIN"] = function () {
      return (_TA_MIN = Module["_TA_MIN"] = Module["asm"]["vb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MININDEX = (Module["_TA_MININDEX"] = function () {
      return (_TA_MININDEX = Module["_TA_MININDEX"] =
        Module["asm"]["wb"]).apply(null, arguments);
    });
    var _TA_MINMAX = (Module["_TA_MINMAX"] = function () {
      return (_TA_MINMAX = Module["_TA_MINMAX"] = Module["asm"]["xb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MINMAXINDEX = (Module["_TA_MINMAXINDEX"] = function () {
      return (_TA_MINMAXINDEX = Module["_TA_MINMAXINDEX"] =
        Module["asm"]["yb"]).apply(null, arguments);
    });
    var _TA_MINUS_DI = (Module["_TA_MINUS_DI"] = function () {
      return (_TA_MINUS_DI = Module["_TA_MINUS_DI"] =
        Module["asm"]["zb"]).apply(null, arguments);
    });
    var _TA_MINUS_DM = (Module["_TA_MINUS_DM"] = function () {
      return (_TA_MINUS_DM = Module["_TA_MINUS_DM"] =
        Module["asm"]["Ab"]).apply(null, arguments);
    });
    var _TA_MOM = (Module["_TA_MOM"] = function () {
      return (_TA_MOM = Module["_TA_MOM"] = Module["asm"]["Bb"]).apply(
        null,
        arguments
      );
    });
    var _TA_MULT = (Module["_TA_MULT"] = function () {
      return (_TA_MULT = Module["_TA_MULT"] = Module["asm"]["Cb"]).apply(
        null,
        arguments
      );
    });
    var _TA_NATR = (Module["_TA_NATR"] = function () {
      return (_TA_NATR = Module["_TA_NATR"] = Module["asm"]["Db"]).apply(
        null,
        arguments
      );
    });
    var _TA_OBV = (Module["_TA_OBV"] = function () {
      return (_TA_OBV = Module["_TA_OBV"] = Module["asm"]["Eb"]).apply(
        null,
        arguments
      );
    });
    var _TA_PLUS_DI = (Module["_TA_PLUS_DI"] = function () {
      return (_TA_PLUS_DI = Module["_TA_PLUS_DI"] = Module["asm"]["Fb"]).apply(
        null,
        arguments
      );
    });
    var _TA_PLUS_DM = (Module["_TA_PLUS_DM"] = function () {
      return (_TA_PLUS_DM = Module["_TA_PLUS_DM"] = Module["asm"]["Gb"]).apply(
        null,
        arguments
      );
    });
    var _TA_PPO = (Module["_TA_PPO"] = function () {
      return (_TA_PPO = Module["_TA_PPO"] = Module["asm"]["Hb"]).apply(
        null,
        arguments
      );
    });
    var _TA_ROC = (Module["_TA_ROC"] = function () {
      return (_TA_ROC = Module["_TA_ROC"] = Module["asm"]["Ib"]).apply(
        null,
        arguments
      );
    });
    var _TA_ROCP = (Module["_TA_ROCP"] = function () {
      return (_TA_ROCP = Module["_TA_ROCP"] = Module["asm"]["Jb"]).apply(
        null,
        arguments
      );
    });
    var _TA_ROCR = (Module["_TA_ROCR"] = function () {
      return (_TA_ROCR = Module["_TA_ROCR"] = Module["asm"]["Kb"]).apply(
        null,
        arguments
      );
    });
    var _TA_ROCR100 = (Module["_TA_ROCR100"] = function () {
      return (_TA_ROCR100 = Module["_TA_ROCR100"] = Module["asm"]["Lb"]).apply(
        null,
        arguments
      );
    });
    var _TA_RSI = (Module["_TA_RSI"] = function () {
      return (_TA_RSI = Module["_TA_RSI"] = Module["asm"]["Mb"]).apply(
        null,
        arguments
      );
    });
    var _TA_SAR = (Module["_TA_SAR"] = function () {
      return (_TA_SAR = Module["_TA_SAR"] = Module["asm"]["Nb"]).apply(
        null,
        arguments
      );
    });
    var _TA_SAREXT = (Module["_TA_SAREXT"] = function () {
      return (_TA_SAREXT = Module["_TA_SAREXT"] = Module["asm"]["Ob"]).apply(
        null,
        arguments
      );
    });
    var _TA_SIN = (Module["_TA_SIN"] = function () {
      return (_TA_SIN = Module["_TA_SIN"] = Module["asm"]["Pb"]).apply(
        null,
        arguments
      );
    });
    var _TA_SINH = (Module["_TA_SINH"] = function () {
      return (_TA_SINH = Module["_TA_SINH"] = Module["asm"]["Qb"]).apply(
        null,
        arguments
      );
    });
    var _TA_SQRT = (Module["_TA_SQRT"] = function () {
      return (_TA_SQRT = Module["_TA_SQRT"] = Module["asm"]["Rb"]).apply(
        null,
        arguments
      );
    });
    var _TA_STOCH = (Module["_TA_STOCH"] = function () {
      return (_TA_STOCH = Module["_TA_STOCH"] = Module["asm"]["Sb"]).apply(
        null,
        arguments
      );
    });
    var _TA_STOCHF = (Module["_TA_STOCHF"] = function () {
      return (_TA_STOCHF = Module["_TA_STOCHF"] = Module["asm"]["Tb"]).apply(
        null,
        arguments
      );
    });
    var _TA_STOCHRSI = (Module["_TA_STOCHRSI"] = function () {
      return (_TA_STOCHRSI = Module["_TA_STOCHRSI"] =
        Module["asm"]["Ub"]).apply(null, arguments);
    });
    var _TA_SUB = (Module["_TA_SUB"] = function () {
      return (_TA_SUB = Module["_TA_SUB"] = Module["asm"]["Vb"]).apply(
        null,
        arguments
      );
    });
    var _TA_SUM = (Module["_TA_SUM"] = function () {
      return (_TA_SUM = Module["_TA_SUM"] = Module["asm"]["Wb"]).apply(
        null,
        arguments
      );
    });
    var _TA_TAN = (Module["_TA_TAN"] = function () {
      return (_TA_TAN = Module["_TA_TAN"] = Module["asm"]["Xb"]).apply(
        null,
        arguments
      );
    });
    var _TA_TANH = (Module["_TA_TANH"] = function () {
      return (_TA_TANH = Module["_TA_TANH"] = Module["asm"]["Yb"]).apply(
        null,
        arguments
      );
    });
    var _TA_TRIX = (Module["_TA_TRIX"] = function () {
      return (_TA_TRIX = Module["_TA_TRIX"] = Module["asm"]["Zb"]).apply(
        null,
        arguments
      );
    });
    var _TA_TSF = (Module["_TA_TSF"] = function () {
      return (_TA_TSF = Module["_TA_TSF"] = Module["asm"]["_b"]).apply(
        null,
        arguments
      );
    });
    var _TA_TYPPRICE = (Module["_TA_TYPPRICE"] = function () {
      return (_TA_TYPPRICE = Module["_TA_TYPPRICE"] =
        Module["asm"]["$b"]).apply(null, arguments);
    });
    var _TA_ULTOSC = (Module["_TA_ULTOSC"] = function () {
      return (_TA_ULTOSC = Module["_TA_ULTOSC"] = Module["asm"]["ac"]).apply(
        null,
        arguments
      );
    });
    var _TA_VAR = (Module["_TA_VAR"] = function () {
      return (_TA_VAR = Module["_TA_VAR"] = Module["asm"]["bc"]).apply(
        null,
        arguments
      );
    });
    var _TA_WCLPRICE = (Module["_TA_WCLPRICE"] = function () {
      return (_TA_WCLPRICE = Module["_TA_WCLPRICE"] =
        Module["asm"]["cc"]).apply(null, arguments);
    });
    var _TA_WILLR = (Module["_TA_WILLR"] = function () {
      return (_TA_WILLR = Module["_TA_WILLR"] = Module["asm"]["dc"]).apply(
        null,
        arguments
      );
    });
    var stackSave = (Module["stackSave"] = function () {
      return (stackSave = Module["stackSave"] = Module["asm"]["fc"]).apply(
        null,
        arguments
      );
    });
    var stackRestore = (Module["stackRestore"] = function () {
      return (stackRestore = Module["stackRestore"] =
        Module["asm"]["gc"]).apply(null, arguments);
    });
    var stackAlloc = (Module["stackAlloc"] = function () {
      return (stackAlloc = Module["stackAlloc"] = Module["asm"]["hc"]).apply(
        null,
        arguments
      );
    });
    Module["ccall"] = ccall;
    Module["setValue"] = setValue;
    Module["getValue"] = getValue;
    var calledRun;
    dependenciesFulfilled = function runCaller() {
      if (!calledRun) run();
      if (!calledRun) dependenciesFulfilled = runCaller;
    };
    function run(args) {
      args = args || arguments_;
      if (runDependencies > 0) {
        return;
      }
      preRun();
      if (runDependencies > 0) {
        return;
      }
      function doRun() {
        if (calledRun) return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT) return;
        initRuntime();
        readyPromiseResolve(Module);
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        postRun();
      }
      if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function () {
          setTimeout(function () {
            Module["setStatus"]("");
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
      while (Module["preInit"].length > 0) {
        Module["preInit"].pop()();
      }
    }
    run();

    return __INIT__.ready;
  };
})();
if (typeof exports === "object" && typeof module === "object")
  module.exports = __INIT__;
else if (typeof define === "function" && define["amd"])
  define([], function () {
    return __INIT__;
  });
else if (typeof exports === "object") exports["__INIT__"] = __INIT__;
const API = { "ACCBANDS": { "name": "ACCBANDS", "camelCaseName": "accBands", "group": "Overlap Studies", "description": "Acceleration Bands", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 20, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "upperBand", "type": "Double[]", "plotHint": "limit_upper" }, { "name": "middleBand", "type": "Double[]", "plotHint": "line" }, { "name": "lowerBand", "type": "Double[]", "plotHint": "limit_lower" }] }, "ACOS": { "name": "ACOS", "camelCaseName": "acos", "group": "Math Transform", "description": "Vector Trigonometric ACos", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "AD": { "name": "AD", "camelCaseName": "ad", "group": "Volume Indicators", "description": "Chaikin A/D Line", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }, { "name": "volume", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ADD": { "name": "ADD", "camelCaseName": "add", "group": "Math Operators", "description": "Vector Arithmetic Add", "inputs": [{ "name": "inReal0", "type": "Double[]" }, { "name": "inReal1", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ADOSC": { "name": "ADOSC", "camelCaseName": "adOsc", "group": "Volume Indicators", "description": "Chaikin A/D Oscillator", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }, { "name": "volume", "type": "Double[]" }], "options": [{ "name": "fastPeriod", "displayName": "Fast Period", "defaultValue": 3, "hint": "Number of period for the fast MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "slowPeriod", "displayName": "Slow Period", "defaultValue": 10, "hint": "Number of period for the slow MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ADX": { "name": "ADX", "camelCaseName": "adx", "group": "Momentum Indicators", "description": "Average Directional Movement Index", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ADXR": { "name": "ADXR", "camelCaseName": "adxr", "group": "Momentum Indicators", "description": "Average Directional Movement Index Rating", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "APO": { "name": "APO", "camelCaseName": "apo", "group": "Momentum Indicators", "description": "Absolute Price Oscillator", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "fastPeriod", "displayName": "Fast Period", "defaultValue": 12, "hint": "Number of period for the fast MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "slowPeriod", "displayName": "Slow Period", "defaultValue": 26, "hint": "Number of period for the slow MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "MAType", "displayName": "MA Type", "defaultValue": 0, "hint": "Type of Moving Average", "type": "MAType" }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "AROON": { "name": "AROON", "camelCaseName": "aroon", "group": "Momentum Indicators", "description": "Aroon", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "aroonDown", "type": "Double[]", "plotHint": "line_dash" }, { "name": "aroonUp", "type": "Double[]", "plotHint": "line" }] }, "AROONOSC": { "name": "AROONOSC", "camelCaseName": "aroonOsc", "group": "Momentum Indicators", "description": "Aroon Oscillator", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ASIN": { "name": "ASIN", "camelCaseName": "asin", "group": "Math Transform", "description": "Vector Trigonometric ASin", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ATAN": { "name": "ATAN", "camelCaseName": "atan", "group": "Math Transform", "description": "Vector Trigonometric ATan", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ATR": { "name": "ATR", "camelCaseName": "atr", "group": "Volatility Indicators", "description": "Average True Range", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "AVGDEV": { "name": "AVGDEV", "camelCaseName": "avgDev", "group": "Price Transform", "description": "Average Deviation", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "AVGPRICE": { "name": "AVGPRICE", "camelCaseName": "avgPrice", "group": "Price Transform", "description": "Average Price", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "BBANDS": { "name": "BBANDS", "camelCaseName": "bbands", "group": "Overlap Studies", "description": "Bollinger Bands", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 5, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "nbDevUp", "displayName": "Deviations up", "defaultValue": 2, "hint": "Deviation multiplier for upper band", "type": "Double", "range": { "min": -3e+37, "max": 3e+37 } }, { "name": "nbDevDn", "displayName": "Deviations down", "defaultValue": 2, "hint": "Deviation multiplier for lower band", "type": "Double", "range": { "min": -3e+37, "max": 3e+37 } }, { "name": "MAType", "displayName": "MA Type", "defaultValue": 0, "hint": "Type of Moving Average", "type": "MAType" }], "outputs": [{ "name": "upperBand", "type": "Double[]", "plotHint": "limit_upper" }, { "name": "middleBand", "type": "Double[]", "plotHint": "line" }, { "name": "lowerBand", "type": "Double[]", "plotHint": "limit_lower" }] }, "BETA": { "name": "BETA", "camelCaseName": "beta", "group": "Statistic Functions", "description": "Beta", "inputs": [{ "name": "inReal0", "type": "Double[]" }, { "name": "inReal1", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 5, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "BOP": { "name": "BOP", "camelCaseName": "bop", "group": "Momentum Indicators", "description": "Balance Of Power", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "CCI": { "name": "CCI", "camelCaseName": "cci", "group": "Momentum Indicators", "description": "Commodity Channel Index", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "CDL2CROWS": { "name": "CDL2CROWS", "camelCaseName": "cdl2Crows", "group": "Pattern Recognition", "description": "Two Crows", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDL3BLACKCROWS": { "name": "CDL3BLACKCROWS", "camelCaseName": "cdl3BlackCrows", "group": "Pattern Recognition", "description": "Three Black Crows", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDL3INSIDE": { "name": "CDL3INSIDE", "camelCaseName": "cdl3Inside", "group": "Pattern Recognition", "description": "Three Inside Up/Down", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDL3LINESTRIKE": { "name": "CDL3LINESTRIKE", "camelCaseName": "cdl3LineStrike", "group": "Pattern Recognition", "description": "Three-Line Strike ", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDL3OUTSIDE": { "name": "CDL3OUTSIDE", "camelCaseName": "cdl3Outside", "group": "Pattern Recognition", "description": "Three Outside Up/Down", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDL3STARSINSOUTH": { "name": "CDL3STARSINSOUTH", "camelCaseName": "cdl3StarsInSouth", "group": "Pattern Recognition", "description": "Three Stars In The South", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDL3WHITESOLDIERS": { "name": "CDL3WHITESOLDIERS", "camelCaseName": "cdl3WhiteSoldiers", "group": "Pattern Recognition", "description": "Three Advancing White Soldiers", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLABANDONEDBABY": { "name": "CDLABANDONEDBABY", "camelCaseName": "cdlAbandonedBaby", "group": "Pattern Recognition", "description": "Abandoned Baby", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "penetration", "displayName": "Penetration", "defaultValue": 0.3, "hint": "Percentage of penetration of a candle within another candle", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLADVANCEBLOCK": { "name": "CDLADVANCEBLOCK", "camelCaseName": "cdlAdvanceBlock", "group": "Pattern Recognition", "description": "Advance Block", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLBELTHOLD": { "name": "CDLBELTHOLD", "camelCaseName": "cdlBeltHold", "group": "Pattern Recognition", "description": "Belt-hold", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLBREAKAWAY": { "name": "CDLBREAKAWAY", "camelCaseName": "cdlBreakaway", "group": "Pattern Recognition", "description": "Breakaway", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLCLOSINGMARUBOZU": { "name": "CDLCLOSINGMARUBOZU", "camelCaseName": "cdlClosingMarubozu", "group": "Pattern Recognition", "description": "Closing Marubozu", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLCONCEALBABYSWALL": { "name": "CDLCONCEALBABYSWALL", "camelCaseName": "cdlConcealBabysWall", "group": "Pattern Recognition", "description": "Concealing Baby Swallow", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLCOUNTERATTACK": { "name": "CDLCOUNTERATTACK", "camelCaseName": "cdlCounterAttack", "group": "Pattern Recognition", "description": "Counterattack", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLDARKCLOUDCOVER": { "name": "CDLDARKCLOUDCOVER", "camelCaseName": "cdlDarkCloudCover", "group": "Pattern Recognition", "description": "Dark Cloud Cover", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "penetration", "displayName": "Penetration", "defaultValue": 0.5, "hint": "Percentage of penetration of a candle within another candle", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLDOJI": { "name": "CDLDOJI", "camelCaseName": "cdlDoji", "group": "Pattern Recognition", "description": "Doji", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLDOJISTAR": { "name": "CDLDOJISTAR", "camelCaseName": "cdlDojiStar", "group": "Pattern Recognition", "description": "Doji Star", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLDRAGONFLYDOJI": { "name": "CDLDRAGONFLYDOJI", "camelCaseName": "cdlDragonflyDoji", "group": "Pattern Recognition", "description": "Dragonfly Doji", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLENGULFING": { "name": "CDLENGULFING", "camelCaseName": "cdlEngulfing", "group": "Pattern Recognition", "description": "Engulfing Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLEVENINGDOJISTAR": { "name": "CDLEVENINGDOJISTAR", "camelCaseName": "cdlEveningDojiStar", "group": "Pattern Recognition", "description": "Evening Doji Star", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "penetration", "displayName": "Penetration", "defaultValue": 0.3, "hint": "Percentage of penetration of a candle within another candle", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLEVENINGSTAR": { "name": "CDLEVENINGSTAR", "camelCaseName": "cdlEveningStar", "group": "Pattern Recognition", "description": "Evening Star", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "penetration", "displayName": "Penetration", "defaultValue": 0.3, "hint": "Percentage of penetration of a candle within another candle", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLGAPSIDESIDEWHITE": { "name": "CDLGAPSIDESIDEWHITE", "camelCaseName": "cdlGapSideSideWhite", "group": "Pattern Recognition", "description": "Up/Down-gap side-by-side white lines", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLGRAVESTONEDOJI": { "name": "CDLGRAVESTONEDOJI", "camelCaseName": "cdlGravestoneDoji", "group": "Pattern Recognition", "description": "Gravestone Doji", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLHAMMER": { "name": "CDLHAMMER", "camelCaseName": "cdlHammer", "group": "Pattern Recognition", "description": "Hammer", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLHANGINGMAN": { "name": "CDLHANGINGMAN", "camelCaseName": "cdlHangingMan", "group": "Pattern Recognition", "description": "Hanging Man", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLHARAMI": { "name": "CDLHARAMI", "camelCaseName": "cdlHarami", "group": "Pattern Recognition", "description": "Harami Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLHARAMICROSS": { "name": "CDLHARAMICROSS", "camelCaseName": "cdlHaramiCross", "group": "Pattern Recognition", "description": "Harami Cross Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLHIGHWAVE": { "name": "CDLHIGHWAVE", "camelCaseName": "cdlHignWave", "group": "Pattern Recognition", "description": "High-Wave Candle", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLHIKKAKE": { "name": "CDLHIKKAKE", "camelCaseName": "cdlHikkake", "group": "Pattern Recognition", "description": "Hikkake Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLHIKKAKEMOD": { "name": "CDLHIKKAKEMOD", "camelCaseName": "cdlHikkakeMod", "group": "Pattern Recognition", "description": "Modified Hikkake Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLHOMINGPIGEON": { "name": "CDLHOMINGPIGEON", "camelCaseName": "cdlHomingPigeon", "group": "Pattern Recognition", "description": "Homing Pigeon", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLIDENTICAL3CROWS": { "name": "CDLIDENTICAL3CROWS", "camelCaseName": "cdlIdentical3Crows", "group": "Pattern Recognition", "description": "Identical Three Crows", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLINNECK": { "name": "CDLINNECK", "camelCaseName": "cdlInNeck", "group": "Pattern Recognition", "description": "In-Neck Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLINVERTEDHAMMER": { "name": "CDLINVERTEDHAMMER", "camelCaseName": "cdlInvertedHammer", "group": "Pattern Recognition", "description": "Inverted Hammer", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLKICKING": { "name": "CDLKICKING", "camelCaseName": "cdlKicking", "group": "Pattern Recognition", "description": "Kicking", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLKICKINGBYLENGTH": { "name": "CDLKICKINGBYLENGTH", "camelCaseName": "cdlKickingByLength", "group": "Pattern Recognition", "description": "Kicking - bull/bear determined by the longer marubozu", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLLADDERBOTTOM": { "name": "CDLLADDERBOTTOM", "camelCaseName": "cdlLadderBottom", "group": "Pattern Recognition", "description": "Ladder Bottom", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLLONGLEGGEDDOJI": { "name": "CDLLONGLEGGEDDOJI", "camelCaseName": "cdlLongLeggedDoji", "group": "Pattern Recognition", "description": "Long Legged Doji", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLLONGLINE": { "name": "CDLLONGLINE", "camelCaseName": "cdlLongLine", "group": "Pattern Recognition", "description": "Long Line Candle", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLMARUBOZU": { "name": "CDLMARUBOZU", "camelCaseName": "cdlMarubozu", "group": "Pattern Recognition", "description": "Marubozu", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLMATCHINGLOW": { "name": "CDLMATCHINGLOW", "camelCaseName": "cdlMatchingLow", "group": "Pattern Recognition", "description": "Matching Low", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLMATHOLD": { "name": "CDLMATHOLD", "camelCaseName": "cdlMatHold", "group": "Pattern Recognition", "description": "Mat Hold", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "penetration", "displayName": "Penetration", "defaultValue": 0.5, "hint": "Percentage of penetration of a candle within another candle", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLMORNINGDOJISTAR": { "name": "CDLMORNINGDOJISTAR", "camelCaseName": "cdlMorningDojiStar", "group": "Pattern Recognition", "description": "Morning Doji Star", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "penetration", "displayName": "Penetration", "defaultValue": 0.3, "hint": "Percentage of penetration of a candle within another candle", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLMORNINGSTAR": { "name": "CDLMORNINGSTAR", "camelCaseName": "cdlMorningStar", "group": "Pattern Recognition", "description": "Morning Star", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "penetration", "displayName": "Penetration", "defaultValue": 0.3, "hint": "Percentage of penetration of a candle within another candle", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLONNECK": { "name": "CDLONNECK", "camelCaseName": "cdlOnNeck", "group": "Pattern Recognition", "description": "On-Neck Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLPIERCING": { "name": "CDLPIERCING", "camelCaseName": "cdlPiercing", "group": "Pattern Recognition", "description": "Piercing Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLRICKSHAWMAN": { "name": "CDLRICKSHAWMAN", "camelCaseName": "cdlRickshawMan", "group": "Pattern Recognition", "description": "Rickshaw Man", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLRISEFALL3METHODS": { "name": "CDLRISEFALL3METHODS", "camelCaseName": "cdlRiseFall3Methods", "group": "Pattern Recognition", "description": "Rising/Falling Three Methods", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLSEPARATINGLINES": { "name": "CDLSEPARATINGLINES", "camelCaseName": "cdlSeperatingLines", "group": "Pattern Recognition", "description": "Separating Lines", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLSHOOTINGSTAR": { "name": "CDLSHOOTINGSTAR", "camelCaseName": "cdlShootingStar", "group": "Pattern Recognition", "description": "Shooting Star", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLSHORTLINE": { "name": "CDLSHORTLINE", "camelCaseName": "cdlShortLine", "group": "Pattern Recognition", "description": "Short Line Candle", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLSPINNINGTOP": { "name": "CDLSPINNINGTOP", "camelCaseName": "cdlSpinningTop", "group": "Pattern Recognition", "description": "Spinning Top", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLSTALLEDPATTERN": { "name": "CDLSTALLEDPATTERN", "camelCaseName": "cdlStalledPattern", "group": "Pattern Recognition", "description": "Stalled Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLSTICKSANDWICH": { "name": "CDLSTICKSANDWICH", "camelCaseName": "cdlStickSandwhich", "group": "Pattern Recognition", "description": "Stick Sandwich", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLTAKURI": { "name": "CDLTAKURI", "camelCaseName": "cdlTakuri", "group": "Pattern Recognition", "description": "Takuri (Dragonfly Doji with very long lower shadow)", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLTASUKIGAP": { "name": "CDLTASUKIGAP", "camelCaseName": "cdlTasukiGap", "group": "Pattern Recognition", "description": "Tasuki Gap", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLTHRUSTING": { "name": "CDLTHRUSTING", "camelCaseName": "cdlThrusting", "group": "Pattern Recognition", "description": "Thrusting Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLTRISTAR": { "name": "CDLTRISTAR", "camelCaseName": "cdlTristar", "group": "Pattern Recognition", "description": "Tristar Pattern", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLUNIQUE3RIVER": { "name": "CDLUNIQUE3RIVER", "camelCaseName": "cdlUnique3River", "group": "Pattern Recognition", "description": "Unique 3 River", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLUPSIDEGAP2CROWS": { "name": "CDLUPSIDEGAP2CROWS", "camelCaseName": "cdlUpsideGap2Crows", "group": "Pattern Recognition", "description": "Upside Gap Two Crows", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CDLXSIDEGAP3METHODS": { "name": "CDLXSIDEGAP3METHODS", "camelCaseName": "cdlXSideGap3Methods", "group": "Pattern Recognition", "description": "Upside/Downside Gap Three Methods", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "CEIL": { "name": "CEIL", "camelCaseName": "ceil", "group": "Math Transform", "description": "Vector Ceil", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "CMO": { "name": "CMO", "camelCaseName": "cmo", "group": "Momentum Indicators", "description": "Chande Momentum Oscillator", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "CORREL": { "name": "CORREL", "camelCaseName": "correl", "group": "Statistic Functions", "description": "Pearson's Correlation Coefficient (r)", "inputs": [{ "name": "inReal0", "type": "Double[]" }, { "name": "inReal1", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "COS": { "name": "COS", "camelCaseName": "cos", "group": "Math Transform", "description": "Vector Trigonometric Cos", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "COSH": { "name": "COSH", "camelCaseName": "cosh", "group": "Math Transform", "description": "Vector Trigonometric Cosh", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "DEMA": { "name": "DEMA", "camelCaseName": "dema", "group": "Overlap Studies", "description": "Double Exponential Moving Average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "DIV": { "name": "DIV", "camelCaseName": "div", "group": "Math Operators", "description": "Vector Arithmetic Div", "inputs": [{ "name": "inReal0", "type": "Double[]" }, { "name": "inReal1", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "DX": { "name": "DX", "camelCaseName": "dx", "group": "Momentum Indicators", "description": "Directional Movement Index", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "EMA": { "name": "EMA", "camelCaseName": "ema", "group": "Overlap Studies", "description": "Exponential Moving Average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "EXP": { "name": "EXP", "camelCaseName": "exp", "group": "Math Transform", "description": "Vector Arithmetic Exp", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "FLOOR": { "name": "FLOOR", "camelCaseName": "floor", "group": "Math Transform", "description": "Vector Floor", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "HT_DCPERIOD": { "name": "HT_DCPERIOD", "camelCaseName": "htDcPeriod", "group": "Cycle Indicators", "description": "Hilbert Transform - Dominant Cycle Period", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "HT_DCPHASE": { "name": "HT_DCPHASE", "camelCaseName": "htDcPhase", "group": "Cycle Indicators", "description": "Hilbert Transform - Dominant Cycle Phase", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "HT_PHASOR": { "name": "HT_PHASOR", "camelCaseName": "htPhasor", "group": "Cycle Indicators", "description": "Hilbert Transform - Phasor Components", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "inPhase", "type": "Double[]", "plotHint": "line" }, { "name": "quadrature", "type": "Double[]", "plotHint": "line_dash" }] }, "HT_SINE": { "name": "HT_SINE", "camelCaseName": "htSine", "group": "Cycle Indicators", "description": "Hilbert Transform - SineWave", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "sine", "type": "Double[]", "plotHint": "line" }, { "name": "leadSine", "type": "Double[]", "plotHint": "line_dash" }] }, "HT_TRENDLINE": { "name": "HT_TRENDLINE", "camelCaseName": "htTrendline", "group": "Overlap Studies", "description": "Hilbert Transform - Instantaneous Trendline", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "HT_TRENDMODE": { "name": "HT_TRENDMODE", "camelCaseName": "htTrendMode", "group": "Cycle Indicators", "description": "Hilbert Transform - Trend vs Cycle Mode", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "IMI": { "name": "IMI", "camelCaseName": "imi", "group": "Momentum Indicators", "description": "Intraday Momentum Index", "inputs": [{ "name": "open", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "KAMA": { "name": "KAMA", "camelCaseName": "kama", "group": "Overlap Studies", "description": "Kaufman Adaptive Moving Average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "LINEARREG": { "name": "LINEARREG", "camelCaseName": "linearReg", "group": "Statistic Functions", "description": "Linear Regression", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "LINEARREG_ANGLE": { "name": "LINEARREG_ANGLE", "camelCaseName": "linearRegAngle", "group": "Statistic Functions", "description": "Linear Regression Angle", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "LINEARREG_INTERCEPT": { "name": "LINEARREG_INTERCEPT", "camelCaseName": "linearRegIntercept", "group": "Statistic Functions", "description": "Linear Regression Intercept", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "LINEARREG_SLOPE": { "name": "LINEARREG_SLOPE", "camelCaseName": "linearRegSlope", "group": "Statistic Functions", "description": "Linear Regression Slope", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "LN": { "name": "LN", "camelCaseName": "ln", "group": "Math Transform", "description": "Vector Log Natural", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "LOG10": { "name": "LOG10", "camelCaseName": "log10", "group": "Math Transform", "description": "Vector Log10", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MA": { "name": "MA", "camelCaseName": "movingAverage", "group": "Overlap Studies", "description": "Moving average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "MAType", "displayName": "MA Type", "defaultValue": 0, "hint": "Type of Moving Average", "type": "MAType" }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MACD": { "name": "MACD", "camelCaseName": "macd", "group": "Momentum Indicators", "description": "Moving Average Convergence/Divergence", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "fastPeriod", "displayName": "Fast Period", "defaultValue": 12, "hint": "Number of period for the fast MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "slowPeriod", "displayName": "Slow Period", "defaultValue": 26, "hint": "Number of period for the slow MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "signalPeriod", "displayName": "Signal Period", "defaultValue": 9, "hint": "Smoothing for the signal line (nb of period)", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "MACD", "type": "Double[]", "plotHint": "line" }, { "name": "MACDSignal", "type": "Double[]", "plotHint": "line_dash" }, { "name": "MACDHist", "type": "Double[]", "plotHint": "histogram" }] }, "MACDEXT": { "name": "MACDEXT", "camelCaseName": "macdExt", "group": "Momentum Indicators", "description": "MACD with controllable MA type", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "fastPeriod", "displayName": "Fast Period", "defaultValue": 12, "hint": "Number of period for the fast MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "fastMAType", "displayName": "Fast MA", "defaultValue": 0, "hint": "Type of Moving Average for fast MA", "type": "MAType" }, { "name": "slowPeriod", "displayName": "Slow Period", "defaultValue": 26, "hint": "Number of period for the slow MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "slowMAType", "displayName": "Slow MA", "defaultValue": 0, "hint": "Type of Moving Average for slow MA", "type": "MAType" }, { "name": "signalPeriod", "displayName": "Signal Period", "defaultValue": 9, "hint": "Smoothing for the signal line (nb of period)", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "signalMAType", "displayName": "Signal MA", "defaultValue": 0, "hint": "Type of Moving Average for signal line", "type": "MAType" }], "outputs": [{ "name": "MACD", "type": "Double[]", "plotHint": "line" }, { "name": "MACDSignal", "type": "Double[]", "plotHint": "line_dash" }, { "name": "MACDHist", "type": "Double[]", "plotHint": "histogram" }] }, "MACDFIX": { "name": "MACDFIX", "camelCaseName": "macdFix", "group": "Momentum Indicators", "description": "Moving Average Convergence/Divergence Fix 12/26", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "signalPeriod", "displayName": "Signal Period", "defaultValue": 9, "hint": "Smoothing for the signal line (nb of period)", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "MACD", "type": "Double[]", "plotHint": "line" }, { "name": "MACDSignal", "type": "Double[]", "plotHint": "line_dash" }, { "name": "MACDHist", "type": "Double[]", "plotHint": "histogram" }] }, "MAMA": { "name": "MAMA", "camelCaseName": "mama", "group": "Overlap Studies", "description": "MESA Adaptive Moving Average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "fastLimit", "displayName": "Fast Limit", "defaultValue": 0.5, "hint": "Upper limit use in the adaptive algorithm", "type": "Double", "range": { "min": 0.01, "max": 0.99 } }, { "name": "slowLimit", "displayName": "Slow Limit", "defaultValue": 0.05, "hint": "Lower limit use in the adaptive algorithm", "type": "Double", "range": { "min": 0.01, "max": 0.99 } }], "outputs": [{ "name": "MAMA", "type": "Double[]", "plotHint": "line" }, { "name": "FAMA", "type": "Double[]", "plotHint": "line_dash" }] }, "MAVP": { "name": "MAVP", "camelCaseName": "movingAverageVariablePeriod", "group": "Overlap Studies", "description": "Moving average with variable period", "inputs": [{ "name": "inReal", "type": "Double[]" }, { "name": "inPeriods", "type": "Double[]" }], "options": [{ "name": "minPeriod", "displayName": "Minimum Period", "defaultValue": 2, "hint": "Value less than minimum will be changed to Minimum period", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "maxPeriod", "displayName": "Maximum Period", "defaultValue": 30, "hint": "Value higher than maximum will be changed to Maximum period", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "MAType", "displayName": "MA Type", "defaultValue": 0, "hint": "Type of Moving Average", "type": "MAType" }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MAX": { "name": "MAX", "camelCaseName": "max", "group": "Math Operators", "description": "Highest value over a specified period", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MAXINDEX": { "name": "MAXINDEX", "camelCaseName": "maxIndex", "group": "Math Operators", "description": "Index of highest value over a specified period", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "MEDPRICE": { "name": "MEDPRICE", "camelCaseName": "medPrice", "group": "Price Transform", "description": "Median Price", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MFI": { "name": "MFI", "camelCaseName": "mfi", "group": "Momentum Indicators", "description": "Money Flow Index", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }, { "name": "volume", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MIDPOINT": { "name": "MIDPOINT", "camelCaseName": "midPoint", "group": "Overlap Studies", "description": "MidPoint over period", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MIDPRICE": { "name": "MIDPRICE", "camelCaseName": "midPrice", "group": "Overlap Studies", "description": "Midpoint Price over period", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MIN": { "name": "MIN", "camelCaseName": "min", "group": "Math Operators", "description": "Lowest value over a specified period", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MININDEX": { "name": "MININDEX", "camelCaseName": "minIndex", "group": "Math Operators", "description": "Index of lowest value over a specified period", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Integer[]", "plotHint": "line" }] }, "MINMAX": { "name": "MINMAX", "camelCaseName": "minMax", "group": "Math Operators", "description": "Lowest and highest values over a specified period", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "min", "type": "Double[]", "plotHint": "line" }, { "name": "max", "type": "Double[]", "plotHint": "line" }] }, "MINMAXINDEX": { "name": "MINMAXINDEX", "camelCaseName": "minMaxIndex", "group": "Math Operators", "description": "Indexes of lowest and highest values over a specified period", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "minIdx", "type": "Integer[]", "plotHint": "line" }, { "name": "maxIdx", "type": "Integer[]", "plotHint": "line" }] }, "MINUS_DI": { "name": "MINUS_DI", "camelCaseName": "minusDI", "group": "Momentum Indicators", "description": "Minus Directional Indicator", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MINUS_DM": { "name": "MINUS_DM", "camelCaseName": "minusDM", "group": "Momentum Indicators", "description": "Minus Directional Movement", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MOM": { "name": "MOM", "camelCaseName": "mom", "group": "Momentum Indicators", "description": "Momentum", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 10, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "MULT": { "name": "MULT", "camelCaseName": "mult", "group": "Math Operators", "description": "Vector Arithmetic Mult", "inputs": [{ "name": "inReal0", "type": "Double[]" }, { "name": "inReal1", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "NATR": { "name": "NATR", "camelCaseName": "natr", "group": "Volatility Indicators", "description": "Normalized Average True Range", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "OBV": { "name": "OBV", "camelCaseName": "obv", "group": "Volume Indicators", "description": "On Balance Volume", "inputs": [{ "name": "inReal", "type": "Double[]" }, { "name": "volume", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "PLUS_DI": { "name": "PLUS_DI", "camelCaseName": "plusDI", "group": "Momentum Indicators", "description": "Plus Directional Indicator", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "PLUS_DM": { "name": "PLUS_DM", "camelCaseName": "plusDM", "group": "Momentum Indicators", "description": "Plus Directional Movement", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "PPO": { "name": "PPO", "camelCaseName": "ppo", "group": "Momentum Indicators", "description": "Percentage Price Oscillator", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "fastPeriod", "displayName": "Fast Period", "defaultValue": 12, "hint": "Number of period for the fast MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "slowPeriod", "displayName": "Slow Period", "defaultValue": 26, "hint": "Number of period for the slow MA", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "MAType", "displayName": "MA Type", "defaultValue": 0, "hint": "Type of Moving Average", "type": "MAType" }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ROC": { "name": "ROC", "camelCaseName": "roc", "group": "Momentum Indicators", "description": "Rate of change : ((price/prevPrice)-1)*100", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 10, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ROCP": { "name": "ROCP", "camelCaseName": "rocP", "group": "Momentum Indicators", "description": "Rate of change Percentage: (price-prevPrice)/prevPrice", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 10, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ROCR": { "name": "ROCR", "camelCaseName": "rocR", "group": "Momentum Indicators", "description": "Rate of change ratio: (price/prevPrice)", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 10, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ROCR100": { "name": "ROCR100", "camelCaseName": "rocR100", "group": "Momentum Indicators", "description": "Rate of change ratio 100 scale: (price/prevPrice)*100", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 10, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "RSI": { "name": "RSI", "camelCaseName": "rsi", "group": "Momentum Indicators", "description": "Relative Strength Index", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "SAR": { "name": "SAR", "camelCaseName": "sar", "group": "Overlap Studies", "description": "Parabolic SAR", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }], "options": [{ "name": "acceleration", "displayName": "Acceleration Factor", "defaultValue": 0.02, "hint": "Acceleration Factor used up to the Maximum value", "type": "Double", "range": { "min": 0, "max": 3e+37 } }, { "name": "maximum", "displayName": "AF Maximum", "defaultValue": 0.2, "hint": "Acceleration Factor Maximum value", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "SAREXT": { "name": "SAREXT", "camelCaseName": "sarExt", "group": "Overlap Studies", "description": "Parabolic SAR - Extended", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }], "options": [{ "name": "startValue", "displayName": "Start Value", "defaultValue": 0, "hint": "Start value and direction. 0 for Auto, >0 for Long, <0 for Short", "type": "Double", "range": { "min": -3e+37, "max": 3e+37 } }, { "name": "offsetOnReverse", "displayName": "Offset on Reverse", "defaultValue": 0, "hint": "Percent offset added/removed to initial stop on short/long reversal", "type": "Double", "range": { "min": 0, "max": 3e+37 } }, { "name": "accelerationInitLong", "displayName": "AF Init Long", "defaultValue": 0.02, "hint": "Acceleration Factor initial value for the Long direction", "type": "Double", "range": { "min": 0, "max": 3e+37 } }, { "name": "accelerationLong", "displayName": "AF Long", "defaultValue": 0.02, "hint": "Acceleration Factor for the Long direction", "type": "Double", "range": { "min": 0, "max": 3e+37 } }, { "name": "accelerationMaxLong", "displayName": "AF Max Long", "defaultValue": 0.2, "hint": "Acceleration Factor maximum value for the Long direction", "type": "Double", "range": { "min": 0, "max": 3e+37 } }, { "name": "accelerationInitShort", "displayName": "AF Init Short", "defaultValue": 0.02, "hint": "Acceleration Factor initial value for the Short direction", "type": "Double", "range": { "min": 0, "max": 3e+37 } }, { "name": "accelerationShort", "displayName": "AF Short", "defaultValue": 0.02, "hint": "Acceleration Factor for the Short direction", "type": "Double", "range": { "min": 0, "max": 3e+37 } }, { "name": "accelerationMaxShort", "displayName": "AF Max Short", "defaultValue": 0.2, "hint": "Acceleration Factor maximum value for the Short direction", "type": "Double", "range": { "min": 0, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "SIN": { "name": "SIN", "camelCaseName": "sin", "group": "Math Transform", "description": "Vector Trigonometric Sin", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "SINH": { "name": "SINH", "camelCaseName": "sinh", "group": "Math Transform", "description": "Vector Trigonometric Sinh", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "SMA": { "name": "SMA", "camelCaseName": "sma", "group": "Overlap Studies", "description": "Simple Moving Average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "SQRT": { "name": "SQRT", "camelCaseName": "sqrt", "group": "Math Transform", "description": "Vector Square Root", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "STDDEV": { "name": "STDDEV", "camelCaseName": "stdDev", "group": "Statistic Functions", "description": "Standard Deviation", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 5, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "nbDev", "displayName": "Deviations", "defaultValue": 1, "hint": "Nb of deviations", "type": "Double", "range": { "min": -3e+37, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "STOCH": { "name": "STOCH", "camelCaseName": "stoch", "group": "Momentum Indicators", "description": "Stochastic", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "fastK_Period", "displayName": "Fast-K Period", "defaultValue": 5, "hint": "Time period for building the Fast-K line", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "slowK_Period", "displayName": "Slow-K Period", "defaultValue": 3, "hint": "Smoothing for making the Slow-K line. Usually set to 3", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "slowK_MAType", "displayName": "Slow-K MA", "defaultValue": 0, "hint": "Type of Moving Average for Slow-K", "type": "MAType" }, { "name": "slowD_Period", "displayName": "Slow-D Period", "defaultValue": 3, "hint": "Smoothing for making the Slow-D line", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "slowD_MAType", "displayName": "Slow-D MA", "defaultValue": 0, "hint": "Type of Moving Average for Slow-D", "type": "MAType" }], "outputs": [{ "name": "slowK", "type": "Double[]", "plotHint": "line_dash" }, { "name": "slowD", "type": "Double[]", "plotHint": "line_dash" }] }, "STOCHF": { "name": "STOCHF", "camelCaseName": "stochF", "group": "Momentum Indicators", "description": "Stochastic Fast", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "fastK_Period", "displayName": "Fast-K Period", "defaultValue": 5, "hint": "Time period for building the Fast-K line", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "fastD_Period", "displayName": "Fast-D Period", "defaultValue": 3, "hint": "Smoothing for making the Fast-D line. Usually set to 3", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "fastD_MAType", "displayName": "Fast-D MA", "defaultValue": 0, "hint": "Type of Moving Average for Fast-D", "type": "MAType" }], "outputs": [{ "name": "fastK", "type": "Double[]", "plotHint": "line" }, { "name": "fastD", "type": "Double[]", "plotHint": "line" }] }, "STOCHRSI": { "name": "STOCHRSI", "camelCaseName": "stochRsi", "group": "Momentum Indicators", "description": "Stochastic Relative Strength Index", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "fastK_Period", "displayName": "Fast-K Period", "defaultValue": 5, "hint": "Time period for building the Fast-K line", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "fastD_Period", "displayName": "Fast-D Period", "defaultValue": 3, "hint": "Smoothing for making the Fast-D line. Usually set to 3", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "fastD_MAType", "displayName": "Fast-D MA", "defaultValue": 0, "hint": "Type of Moving Average for Fast-D", "type": "MAType" }], "outputs": [{ "name": "fastK", "type": "Double[]", "plotHint": "line" }, { "name": "fastD", "type": "Double[]", "plotHint": "line" }] }, "SUB": { "name": "SUB", "camelCaseName": "sub", "group": "Math Operators", "description": "Vector Arithmetic Substraction", "inputs": [{ "name": "inReal0", "type": "Double[]" }, { "name": "inReal1", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "SUM": { "name": "SUM", "camelCaseName": "sum", "group": "Math Operators", "description": "Summation", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "T3": { "name": "T3", "camelCaseName": "t3", "group": "Overlap Studies", "description": "Triple Exponential Moving Average (T3)", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 5, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }, { "name": "VFactor", "displayName": "Volume Factor", "defaultValue": 0.7, "hint": "Volume Factor", "type": "Double", "range": { "min": 0, "max": 1 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "TAN": { "name": "TAN", "camelCaseName": "tan", "group": "Math Transform", "description": "Vector Trigonometric Tan", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "TANH": { "name": "TANH", "camelCaseName": "tanh", "group": "Math Transform", "description": "Vector Trigonometric Tanh", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "TEMA": { "name": "TEMA", "camelCaseName": "tema", "group": "Overlap Studies", "description": "Triple Exponential Moving Average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "TRANGE": { "name": "TRANGE", "camelCaseName": "trueRange", "group": "Volatility Indicators", "description": "True Range", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "TRIMA": { "name": "TRIMA", "camelCaseName": "trima", "group": "Overlap Studies", "description": "Triangular Moving Average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "TRIX": { "name": "TRIX", "camelCaseName": "trix", "group": "Momentum Indicators", "description": "1-day Rate-Of-Change (ROC) of a Triple Smooth EMA", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "TSF": { "name": "TSF", "camelCaseName": "tsf", "group": "Statistic Functions", "description": "Time Series Forecast", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "TYPPRICE": { "name": "TYPPRICE", "camelCaseName": "typPrice", "group": "Price Transform", "description": "Typical Price", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "ULTOSC": { "name": "ULTOSC", "camelCaseName": "ultOsc", "group": "Momentum Indicators", "description": "Ultimate Oscillator", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod1", "displayName": "First Period", "defaultValue": 7, "hint": "Number of bars for 1st period.", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "timePeriod2", "displayName": "Second Period", "defaultValue": 14, "hint": "Number of bars fro 2nd period", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "timePeriod3", "displayName": "Third Period", "defaultValue": 28, "hint": "Number of bars for 3rd period", "type": "Integer", "range": { "min": 1, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "VAR": { "name": "VAR", "camelCaseName": "variance", "group": "Statistic Functions", "description": "Variance", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 5, "hint": "Number of period", "type": "Integer", "range": { "min": 1, "max": 100000 } }, { "name": "nbDev", "displayName": "Deviations", "defaultValue": 1, "hint": "Nb of deviations", "type": "Double", "range": { "min": -3e+37, "max": 3e+37 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "WCLPRICE": { "name": "WCLPRICE", "camelCaseName": "wclPrice", "group": "Price Transform", "description": "Weighted Close Price", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "WILLR": { "name": "WILLR", "camelCaseName": "willR", "group": "Momentum Indicators", "description": "Williams' %R", "inputs": [{ "name": "high", "type": "Double[]" }, { "name": "low", "type": "Double[]" }, { "name": "close", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 14, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] }, "WMA": { "name": "WMA", "camelCaseName": "wma", "group": "Overlap Studies", "description": "Weighted Moving Average", "inputs": [{ "name": "inReal", "type": "Double[]" }], "options": [{ "name": "timePeriod", "displayName": "Time Period", "defaultValue": 30, "hint": "Number of period", "type": "Integer", "range": { "min": 2, "max": 100000 } }], "outputs": [{ "name": "output", "type": "Double[]", "plotHint": "line" }] } };
let Module;
function double_array(size) {
    const BYTE_SIZE = 8;
    const offset = Module._malloc(size * BYTE_SIZE);
    const offsetF64 = offset / BYTE_SIZE;
    Module.HEAPF64.set(new Float64Array(size), offsetF64);
    return {
        data: Module.HEAPF64.subarray(offsetF64, offsetF64 + size),
        pointer: offset,
    };
}
function c_pointer(type, initValue) {
    const offset = Module._malloc(4);
    const ref = {
        get data() {
            return Module.getValue(offset, type);
        },
        set data(val) {
            Module.setValue(offset, val, type);
        },
        pointer: offset,
    };
    if (initValue !== undefined) {
        ref.data = initValue;
    }
    return ref;
}
const TA_RET_CODE = {
    0: 'TA_SUCCESS',
    1: 'TA_LIB_NOT_INITIALIZE',
    2: 'TA_BAD_PARAM',
    3: 'TA_ALLOC_ERR',
    4: 'TA_GROUP_NOT_FOUND',
    5: 'TA_FUNC_NOT_FOUND',
    6: 'TA_INVALID_HANDLE',
    7: 'TA_INVALID_PARAM_HOLDER',
    8: 'TA_INVALID_PARAM_HOLDER_TYPE',
    9: 'TA_INVALID_PARAM_FUNCTION',
    10: 'TA_INPUT_NOT_ALL_INITIALIZE',
    11: 'TA_OUTPUT_NOT_ALL_INITIALIZE',
    12: 'TA_OUT_OF_RANGE_START_INDEX',
    13: 'TA_OUT_OF_RANGE_END_INDEX',
    14: 'TA_INVALID_LIST_TYPE',
    15: 'TA_BAD_OBJECT',
    16: 'TA_NOT_SUPPORTED',
    5000: 'TA_INTERNAL_ERROR',
    [0xffff]: 'TA_UNKNOWN_ERR',
};
const TA_INTEGER_DEFAULT = -2147483648;
function callFunc(api, params) {
    const funcIdent = `TA_${api.name}`;
    if (!Module)
        throw Error(`${api.name}() called before initialization.`);
    const ccallArgsLen = 2 +
        api.inputs.length +
        api.options.length +
        2 +
        api.outputs.length;
    const argTypes = new Array(ccallArgsLen).fill('number');
    for (const { name } of api.inputs) {
        if (!Array.isArray(params[name])) {
            if (params[name] === undefined)
                throw Error(`Bad Param: "${name}" is required`);
            throw Error(`Bad Param: "${name}" should be array of number`);
        }
    }
    for (const { name, range } of api.options) {
        if (params[name] === undefined) {
            params[name] = TA_INTEGER_DEFAULT;
        }
        else if (range &&
            (params[name] < range.min || params[name] > range.max)) {
            throw Error(`Bad Param: "${name}" out of range (min: ${range.min}, max: ${range.max})`);
        }
    }
    let { startIdx, endIdx } = params;
    if (startIdx === undefined)
        startIdx = 0;
    const reqParamsLen = api.inputs.map(({ name }) => Math.max(params[name].length - 1, 0));
    if (endIdx === undefined) {
        endIdx = Math.min(...reqParamsLen);
    }
    const args = [startIdx, endIdx];
    const memToFree = [];
    api.inputs.forEach(({ name }) => {
        const argArray = double_array(endIdx - startIdx + 1);
        const paramArray = params[name];
        for (const i in paramArray)
            argArray.data[i] = paramArray[i];
        memToFree.push(argArray.pointer);
        args.push(argArray.pointer);
    });
    api.options.forEach(({ name }) => args.push(params[name]));
    const outBegIdxRef = c_pointer('i32', 0);
    const outNBElementRef = c_pointer('i32', 0);
    memToFree.push(outBegIdxRef.pointer);
    memToFree.push(outNBElementRef.pointer);
    args.push(outBegIdxRef.pointer);
    args.push(outNBElementRef.pointer);
    const outputs = api.outputs.map(({ name }) => {
        const argArray = double_array(endIdx - startIdx + 1);
        memToFree.push(argArray.pointer);
        args.push(argArray.pointer);
        return { name, array: argArray };
    });
    const retCode = Module.ccall(funcIdent, 'number', argTypes, args);
    const outBegIdx = outBegIdxRef.data;
    const outNBElement = outNBElementRef.data;
    const result = outputs.reduce((result, current) => {
        const data = new Array(outBegIdx).fill(0).concat(Array.from(current.array.data.slice(0, endIdx - outBegIdx + 1)));
        result[current.name] = data;
        return result;
    }, { outBegIdx, outNBElement });
    memToFree.forEach((offset) => Module._free(offset));
    if (retCode === 0) {
        return result;
    }
    else {
        throw Error('[C_ERROR] ' + TA_RET_CODE[retCode]);
    }
}
export var MAType;
(function (MAType) {
    MAType[MAType["SMA"] = 0] = "SMA";
    MAType[MAType["EMA"] = 1] = "EMA";
    MAType[MAType["WMA"] = 2] = "WMA";
    MAType[MAType["DEMA"] = 3] = "DEMA";
    MAType[MAType["TEMA"] = 4] = "TEMA";
    MAType[MAType["TRIMA"] = 5] = "TRIMA";
    MAType[MAType["KAMA"] = 6] = "KAMA";
    MAType[MAType["MAMA"] = 7] = "MAMA";
    MAType[MAType["T3"] = 8] = "T3";
})(MAType || (MAType = {}));
export function init(wasmBinaryFilePath) {
    if (Module)
        return Promise.resolve(Module);
    if (wasmBinaryFilePath && typeof wasmBinaryFilePath !== 'string') {
        return Promise.reject(new Error('Invalid argument, "init(wasmBinaryFilePath)" expects a string that specifies the location of wasm binary file'));
    }
    const locateFile = wasmBinaryFilePath ? () => wasmBinaryFilePath : undefined;
    return __INIT__({ locateFile })
        .then((m) => (Module = m))
        .catch((e) => {
        let message = 'TA-Lib WASM runtime init fail.';
        if (e && e.message) {
            message += '\nError: \n' + e.message;
        }
        else {
            message +=
                'Unknown reason. Perhaps you specify the wrong file path to wasm binary?';
        }
        throw new Error(message);
    });
}
let __ACCBANDS_API__ = API['ACCBANDS'];
export function ACCBANDS(params) {
    return callFunc(__ACCBANDS_API__, params);
}
export const accBands = ACCBANDS;
let __ACOS_API__ = API['ACOS'];
export function ACOS(params) {
    return callFunc(__ACOS_API__, params);
}
export const acos = ACOS;
let __AD_API__ = API['AD'];
export function AD(params) {
    return callFunc(__AD_API__, params);
}
export const ad = AD;
let __ADD_API__ = API['ADD'];
export function ADD(params) {
    return callFunc(__ADD_API__, params);
}
export const add = ADD;
let __ADOSC_API__ = API['ADOSC'];
export function ADOSC(params) {
    return callFunc(__ADOSC_API__, params);
}
export const adOsc = ADOSC;
let __ADX_API__ = API['ADX'];
export function ADX(params) {
    return callFunc(__ADX_API__, params);
}
export const adx = ADX;
let __ADXR_API__ = API['ADXR'];
export function ADXR(params) {
    return callFunc(__ADXR_API__, params);
}
export const adxr = ADXR;
let __APO_API__ = API['APO'];
export function APO(params) {
    return callFunc(__APO_API__, params);
}
export const apo = APO;
let __AROON_API__ = API['AROON'];
export function AROON(params) {
    return callFunc(__AROON_API__, params);
}
export const aroon = AROON;
let __AROONOSC_API__ = API['AROONOSC'];
export function AROONOSC(params) {
    return callFunc(__AROONOSC_API__, params);
}
export const aroonOsc = AROONOSC;
let __ASIN_API__ = API['ASIN'];
export function ASIN(params) {
    return callFunc(__ASIN_API__, params);
}
export const asin = ASIN;
let __ATAN_API__ = API['ATAN'];
export function ATAN(params) {
    return callFunc(__ATAN_API__, params);
}
export const atan = ATAN;
let __ATR_API__ = API['ATR'];
export function ATR(params) {
    return callFunc(__ATR_API__, params);
}
export const atr = ATR;
let __AVGDEV_API__ = API['AVGDEV'];
export function AVGDEV(params) {
    return callFunc(__AVGDEV_API__, params);
}
export const avgDev = AVGDEV;
let __AVGPRICE_API__ = API['AVGPRICE'];
export function AVGPRICE(params) {
    return callFunc(__AVGPRICE_API__, params);
}
export const avgPrice = AVGPRICE;
let __BBANDS_API__ = API['BBANDS'];
export function BBANDS(params) {
    return callFunc(__BBANDS_API__, params);
}
export const bbands = BBANDS;
let __BETA_API__ = API['BETA'];
export function BETA(params) {
    return callFunc(__BETA_API__, params);
}
export const beta = BETA;
let __BOP_API__ = API['BOP'];
export function BOP(params) {
    return callFunc(__BOP_API__, params);
}
export const bop = BOP;
let __CCI_API__ = API['CCI'];
export function CCI(params) {
    return callFunc(__CCI_API__, params);
}
export const cci = CCI;
let __CDL2CROWS_API__ = API['CDL2CROWS'];
export function CDL2CROWS(params) {
    return callFunc(__CDL2CROWS_API__, params);
}
export const cdl2Crows = CDL2CROWS;
let __CDL3BLACKCROWS_API__ = API['CDL3BLACKCROWS'];
export function CDL3BLACKCROWS(params) {
    return callFunc(__CDL3BLACKCROWS_API__, params);
}
export const cdl3BlackCrows = CDL3BLACKCROWS;
let __CDL3INSIDE_API__ = API['CDL3INSIDE'];
export function CDL3INSIDE(params) {
    return callFunc(__CDL3INSIDE_API__, params);
}
export const cdl3Inside = CDL3INSIDE;
let __CDL3LINESTRIKE_API__ = API['CDL3LINESTRIKE'];
export function CDL3LINESTRIKE(params) {
    return callFunc(__CDL3LINESTRIKE_API__, params);
}
export const cdl3LineStrike = CDL3LINESTRIKE;
let __CDL3OUTSIDE_API__ = API['CDL3OUTSIDE'];
export function CDL3OUTSIDE(params) {
    return callFunc(__CDL3OUTSIDE_API__, params);
}
export const cdl3Outside = CDL3OUTSIDE;
let __CDL3STARSINSOUTH_API__ = API['CDL3STARSINSOUTH'];
export function CDL3STARSINSOUTH(params) {
    return callFunc(__CDL3STARSINSOUTH_API__, params);
}
export const cdl3StarsInSouth = CDL3STARSINSOUTH;
let __CDL3WHITESOLDIERS_API__ = API['CDL3WHITESOLDIERS'];
export function CDL3WHITESOLDIERS(params) {
    return callFunc(__CDL3WHITESOLDIERS_API__, params);
}
export const cdl3WhiteSoldiers = CDL3WHITESOLDIERS;
let __CDLABANDONEDBABY_API__ = API['CDLABANDONEDBABY'];
export function CDLABANDONEDBABY(params) {
    return callFunc(__CDLABANDONEDBABY_API__, params);
}
export const cdlAbandonedBaby = CDLABANDONEDBABY;
let __CDLADVANCEBLOCK_API__ = API['CDLADVANCEBLOCK'];
export function CDLADVANCEBLOCK(params) {
    return callFunc(__CDLADVANCEBLOCK_API__, params);
}
export const cdlAdvanceBlock = CDLADVANCEBLOCK;
let __CDLBELTHOLD_API__ = API['CDLBELTHOLD'];
export function CDLBELTHOLD(params) {
    return callFunc(__CDLBELTHOLD_API__, params);
}
export const cdlBeltHold = CDLBELTHOLD;
let __CDLBREAKAWAY_API__ = API['CDLBREAKAWAY'];
export function CDLBREAKAWAY(params) {
    return callFunc(__CDLBREAKAWAY_API__, params);
}
export const cdlBreakaway = CDLBREAKAWAY;
let __CDLCLOSINGMARUBOZU_API__ = API['CDLCLOSINGMARUBOZU'];
export function CDLCLOSINGMARUBOZU(params) {
    return callFunc(__CDLCLOSINGMARUBOZU_API__, params);
}
export const cdlClosingMarubozu = CDLCLOSINGMARUBOZU;
let __CDLCONCEALBABYSWALL_API__ = API['CDLCONCEALBABYSWALL'];
export function CDLCONCEALBABYSWALL(params) {
    return callFunc(__CDLCONCEALBABYSWALL_API__, params);
}
export const cdlConcealBabysWall = CDLCONCEALBABYSWALL;
let __CDLCOUNTERATTACK_API__ = API['CDLCOUNTERATTACK'];
export function CDLCOUNTERATTACK(params) {
    return callFunc(__CDLCOUNTERATTACK_API__, params);
}
export const cdlCounterAttack = CDLCOUNTERATTACK;
let __CDLDARKCLOUDCOVER_API__ = API['CDLDARKCLOUDCOVER'];
export function CDLDARKCLOUDCOVER(params) {
    return callFunc(__CDLDARKCLOUDCOVER_API__, params);
}
export const cdlDarkCloudCover = CDLDARKCLOUDCOVER;
let __CDLDOJI_API__ = API['CDLDOJI'];
export function CDLDOJI(params) {
    return callFunc(__CDLDOJI_API__, params);
}
export const cdlDoji = CDLDOJI;
let __CDLDOJISTAR_API__ = API['CDLDOJISTAR'];
export function CDLDOJISTAR(params) {
    return callFunc(__CDLDOJISTAR_API__, params);
}
export const cdlDojiStar = CDLDOJISTAR;
let __CDLDRAGONFLYDOJI_API__ = API['CDLDRAGONFLYDOJI'];
export function CDLDRAGONFLYDOJI(params) {
    return callFunc(__CDLDRAGONFLYDOJI_API__, params);
}
export const cdlDragonflyDoji = CDLDRAGONFLYDOJI;
let __CDLENGULFING_API__ = API['CDLENGULFING'];
export function CDLENGULFING(params) {
    return callFunc(__CDLENGULFING_API__, params);
}
export const cdlEngulfing = CDLENGULFING;
let __CDLEVENINGDOJISTAR_API__ = API['CDLEVENINGDOJISTAR'];
export function CDLEVENINGDOJISTAR(params) {
    return callFunc(__CDLEVENINGDOJISTAR_API__, params);
}
export const cdlEveningDojiStar = CDLEVENINGDOJISTAR;
let __CDLEVENINGSTAR_API__ = API['CDLEVENINGSTAR'];
export function CDLEVENINGSTAR(params) {
    return callFunc(__CDLEVENINGSTAR_API__, params);
}
export const cdlEveningStar = CDLEVENINGSTAR;
let __CDLGAPSIDESIDEWHITE_API__ = API['CDLGAPSIDESIDEWHITE'];
export function CDLGAPSIDESIDEWHITE(params) {
    return callFunc(__CDLGAPSIDESIDEWHITE_API__, params);
}
export const cdlGapSideSideWhite = CDLGAPSIDESIDEWHITE;
let __CDLGRAVESTONEDOJI_API__ = API['CDLGRAVESTONEDOJI'];
export function CDLGRAVESTONEDOJI(params) {
    return callFunc(__CDLGRAVESTONEDOJI_API__, params);
}
export const cdlGravestoneDoji = CDLGRAVESTONEDOJI;
let __CDLHAMMER_API__ = API['CDLHAMMER'];
export function CDLHAMMER(params) {
    return callFunc(__CDLHAMMER_API__, params);
}
export const cdlHammer = CDLHAMMER;
let __CDLHANGINGMAN_API__ = API['CDLHANGINGMAN'];
export function CDLHANGINGMAN(params) {
    return callFunc(__CDLHANGINGMAN_API__, params);
}
export const cdlHangingMan = CDLHANGINGMAN;
let __CDLHARAMI_API__ = API['CDLHARAMI'];
export function CDLHARAMI(params) {
    return callFunc(__CDLHARAMI_API__, params);
}
export const cdlHarami = CDLHARAMI;
let __CDLHARAMICROSS_API__ = API['CDLHARAMICROSS'];
export function CDLHARAMICROSS(params) {
    return callFunc(__CDLHARAMICROSS_API__, params);
}
export const cdlHaramiCross = CDLHARAMICROSS;
let __CDLHIGHWAVE_API__ = API['CDLHIGHWAVE'];
export function CDLHIGHWAVE(params) {
    return callFunc(__CDLHIGHWAVE_API__, params);
}
export const cdlHignWave = CDLHIGHWAVE;
let __CDLHIKKAKE_API__ = API['CDLHIKKAKE'];
export function CDLHIKKAKE(params) {
    return callFunc(__CDLHIKKAKE_API__, params);
}
export const cdlHikkake = CDLHIKKAKE;
let __CDLHIKKAKEMOD_API__ = API['CDLHIKKAKEMOD'];
export function CDLHIKKAKEMOD(params) {
    return callFunc(__CDLHIKKAKEMOD_API__, params);
}
export const cdlHikkakeMod = CDLHIKKAKEMOD;
let __CDLHOMINGPIGEON_API__ = API['CDLHOMINGPIGEON'];
export function CDLHOMINGPIGEON(params) {
    return callFunc(__CDLHOMINGPIGEON_API__, params);
}
export const cdlHomingPigeon = CDLHOMINGPIGEON;
let __CDLIDENTICAL3CROWS_API__ = API['CDLIDENTICAL3CROWS'];
export function CDLIDENTICAL3CROWS(params) {
    return callFunc(__CDLIDENTICAL3CROWS_API__, params);
}
export const cdlIdentical3Crows = CDLIDENTICAL3CROWS;
let __CDLINNECK_API__ = API['CDLINNECK'];
export function CDLINNECK(params) {
    return callFunc(__CDLINNECK_API__, params);
}
export const cdlInNeck = CDLINNECK;
let __CDLINVERTEDHAMMER_API__ = API['CDLINVERTEDHAMMER'];
export function CDLINVERTEDHAMMER(params) {
    return callFunc(__CDLINVERTEDHAMMER_API__, params);
}
export const cdlInvertedHammer = CDLINVERTEDHAMMER;
let __CDLKICKING_API__ = API['CDLKICKING'];
export function CDLKICKING(params) {
    return callFunc(__CDLKICKING_API__, params);
}
export const cdlKicking = CDLKICKING;
let __CDLKICKINGBYLENGTH_API__ = API['CDLKICKINGBYLENGTH'];
export function CDLKICKINGBYLENGTH(params) {
    return callFunc(__CDLKICKINGBYLENGTH_API__, params);
}
export const cdlKickingByLength = CDLKICKINGBYLENGTH;
let __CDLLADDERBOTTOM_API__ = API['CDLLADDERBOTTOM'];
export function CDLLADDERBOTTOM(params) {
    return callFunc(__CDLLADDERBOTTOM_API__, params);
}
export const cdlLadderBottom = CDLLADDERBOTTOM;
let __CDLLONGLEGGEDDOJI_API__ = API['CDLLONGLEGGEDDOJI'];
export function CDLLONGLEGGEDDOJI(params) {
    return callFunc(__CDLLONGLEGGEDDOJI_API__, params);
}
export const cdlLongLeggedDoji = CDLLONGLEGGEDDOJI;
let __CDLLONGLINE_API__ = API['CDLLONGLINE'];
export function CDLLONGLINE(params) {
    return callFunc(__CDLLONGLINE_API__, params);
}
export const cdlLongLine = CDLLONGLINE;
let __CDLMARUBOZU_API__ = API['CDLMARUBOZU'];
export function CDLMARUBOZU(params) {
    return callFunc(__CDLMARUBOZU_API__, params);
}
export const cdlMarubozu = CDLMARUBOZU;
let __CDLMATCHINGLOW_API__ = API['CDLMATCHINGLOW'];
export function CDLMATCHINGLOW(params) {
    return callFunc(__CDLMATCHINGLOW_API__, params);
}
export const cdlMatchingLow = CDLMATCHINGLOW;
let __CDLMATHOLD_API__ = API['CDLMATHOLD'];
export function CDLMATHOLD(params) {
    return callFunc(__CDLMATHOLD_API__, params);
}
export const cdlMatHold = CDLMATHOLD;
let __CDLMORNINGDOJISTAR_API__ = API['CDLMORNINGDOJISTAR'];
export function CDLMORNINGDOJISTAR(params) {
    return callFunc(__CDLMORNINGDOJISTAR_API__, params);
}
export const cdlMorningDojiStar = CDLMORNINGDOJISTAR;
let __CDLMORNINGSTAR_API__ = API['CDLMORNINGSTAR'];
export function CDLMORNINGSTAR(params) {
    return callFunc(__CDLMORNINGSTAR_API__, params);
}
export const cdlMorningStar = CDLMORNINGSTAR;
let __CDLONNECK_API__ = API['CDLONNECK'];
export function CDLONNECK(params) {
    return callFunc(__CDLONNECK_API__, params);
}
export const cdlOnNeck = CDLONNECK;
let __CDLPIERCING_API__ = API['CDLPIERCING'];
export function CDLPIERCING(params) {
    return callFunc(__CDLPIERCING_API__, params);
}
export const cdlPiercing = CDLPIERCING;
let __CDLRICKSHAWMAN_API__ = API['CDLRICKSHAWMAN'];
export function CDLRICKSHAWMAN(params) {
    return callFunc(__CDLRICKSHAWMAN_API__, params);
}
export const cdlRickshawMan = CDLRICKSHAWMAN;
let __CDLRISEFALL3METHODS_API__ = API['CDLRISEFALL3METHODS'];
export function CDLRISEFALL3METHODS(params) {
    return callFunc(__CDLRISEFALL3METHODS_API__, params);
}
export const cdlRiseFall3Methods = CDLRISEFALL3METHODS;
let __CDLSEPARATINGLINES_API__ = API['CDLSEPARATINGLINES'];
export function CDLSEPARATINGLINES(params) {
    return callFunc(__CDLSEPARATINGLINES_API__, params);
}
export const cdlSeperatingLines = CDLSEPARATINGLINES;
let __CDLSHOOTINGSTAR_API__ = API['CDLSHOOTINGSTAR'];
export function CDLSHOOTINGSTAR(params) {
    return callFunc(__CDLSHOOTINGSTAR_API__, params);
}
export const cdlShootingStar = CDLSHOOTINGSTAR;
let __CDLSHORTLINE_API__ = API['CDLSHORTLINE'];
export function CDLSHORTLINE(params) {
    return callFunc(__CDLSHORTLINE_API__, params);
}
export const cdlShortLine = CDLSHORTLINE;
let __CDLSPINNINGTOP_API__ = API['CDLSPINNINGTOP'];
export function CDLSPINNINGTOP(params) {
    return callFunc(__CDLSPINNINGTOP_API__, params);
}
export const cdlSpinningTop = CDLSPINNINGTOP;
let __CDLSTALLEDPATTERN_API__ = API['CDLSTALLEDPATTERN'];
export function CDLSTALLEDPATTERN(params) {
    return callFunc(__CDLSTALLEDPATTERN_API__, params);
}
export const cdlStalledPattern = CDLSTALLEDPATTERN;
let __CDLSTICKSANDWICH_API__ = API['CDLSTICKSANDWICH'];
export function CDLSTICKSANDWICH(params) {
    return callFunc(__CDLSTICKSANDWICH_API__, params);
}
export const cdlStickSandwhich = CDLSTICKSANDWICH;
let __CDLTAKURI_API__ = API['CDLTAKURI'];
export function CDLTAKURI(params) {
    return callFunc(__CDLTAKURI_API__, params);
}
export const cdlTakuri = CDLTAKURI;
let __CDLTASUKIGAP_API__ = API['CDLTASUKIGAP'];
export function CDLTASUKIGAP(params) {
    return callFunc(__CDLTASUKIGAP_API__, params);
}
export const cdlTasukiGap = CDLTASUKIGAP;
let __CDLTHRUSTING_API__ = API['CDLTHRUSTING'];
export function CDLTHRUSTING(params) {
    return callFunc(__CDLTHRUSTING_API__, params);
}
export const cdlThrusting = CDLTHRUSTING;
let __CDLTRISTAR_API__ = API['CDLTRISTAR'];
export function CDLTRISTAR(params) {
    return callFunc(__CDLTRISTAR_API__, params);
}
export const cdlTristar = CDLTRISTAR;
let __CDLUNIQUE3RIVER_API__ = API['CDLUNIQUE3RIVER'];
export function CDLUNIQUE3RIVER(params) {
    return callFunc(__CDLUNIQUE3RIVER_API__, params);
}
export const cdlUnique3River = CDLUNIQUE3RIVER;
let __CDLUPSIDEGAP2CROWS_API__ = API['CDLUPSIDEGAP2CROWS'];
export function CDLUPSIDEGAP2CROWS(params) {
    return callFunc(__CDLUPSIDEGAP2CROWS_API__, params);
}
export const cdlUpsideGap2Crows = CDLUPSIDEGAP2CROWS;
let __CDLXSIDEGAP3METHODS_API__ = API['CDLXSIDEGAP3METHODS'];
export function CDLXSIDEGAP3METHODS(params) {
    return callFunc(__CDLXSIDEGAP3METHODS_API__, params);
}
export const cdlXSideGap3Methods = CDLXSIDEGAP3METHODS;
let __CEIL_API__ = API['CEIL'];
export function CEIL(params) {
    return callFunc(__CEIL_API__, params);
}
export const ceil = CEIL;
let __CMO_API__ = API['CMO'];
export function CMO(params) {
    return callFunc(__CMO_API__, params);
}
export const cmo = CMO;
let __CORREL_API__ = API['CORREL'];
export function CORREL(params) {
    return callFunc(__CORREL_API__, params);
}
export const correl = CORREL;
let __COS_API__ = API['COS'];
export function COS(params) {
    return callFunc(__COS_API__, params);
}
export const cos = COS;
let __COSH_API__ = API['COSH'];
export function COSH(params) {
    return callFunc(__COSH_API__, params);
}
export const cosh = COSH;
let __DEMA_API__ = API['DEMA'];
export function DEMA(params) {
    return callFunc(__DEMA_API__, params);
}
export const dema = DEMA;
let __DIV_API__ = API['DIV'];
export function DIV(params) {
    return callFunc(__DIV_API__, params);
}
export const div = DIV;
let __DX_API__ = API['DX'];
export function DX(params) {
    return callFunc(__DX_API__, params);
}
export const dx = DX;
let __EMA_API__ = API['EMA'];
export function EMA(params) {
    return callFunc(__EMA_API__, params);
}
export const ema = EMA;
let __EXP_API__ = API['EXP'];
export function EXP(params) {
    return callFunc(__EXP_API__, params);
}
export const exp = EXP;
let __FLOOR_API__ = API['FLOOR'];
export function FLOOR(params) {
    return callFunc(__FLOOR_API__, params);
}
export const floor = FLOOR;
let __HT_DCPERIOD_API__ = API['HT_DCPERIOD'];
export function HT_DCPERIOD(params) {
    return callFunc(__HT_DCPERIOD_API__, params);
}
export const htDcPeriod = HT_DCPERIOD;
let __HT_DCPHASE_API__ = API['HT_DCPHASE'];
export function HT_DCPHASE(params) {
    return callFunc(__HT_DCPHASE_API__, params);
}
export const htDcPhase = HT_DCPHASE;
let __HT_PHASOR_API__ = API['HT_PHASOR'];
export function HT_PHASOR(params) {
    return callFunc(__HT_PHASOR_API__, params);
}
export const htPhasor = HT_PHASOR;
let __HT_SINE_API__ = API['HT_SINE'];
export function HT_SINE(params) {
    return callFunc(__HT_SINE_API__, params);
}
export const htSine = HT_SINE;
let __HT_TRENDLINE_API__ = API['HT_TRENDLINE'];
export function HT_TRENDLINE(params) {
    return callFunc(__HT_TRENDLINE_API__, params);
}
export const htTrendline = HT_TRENDLINE;
let __HT_TRENDMODE_API__ = API['HT_TRENDMODE'];
export function HT_TRENDMODE(params) {
    return callFunc(__HT_TRENDMODE_API__, params);
}
export const htTrendMode = HT_TRENDMODE;
let __IMI_API__ = API['IMI'];
export function IMI(params) {
    return callFunc(__IMI_API__, params);
}
export const imi = IMI;
let __KAMA_API__ = API['KAMA'];
export function KAMA(params) {
    return callFunc(__KAMA_API__, params);
}
export const kama = KAMA;
let __LINEARREG_API__ = API['LINEARREG'];
export function LINEARREG(params) {
    return callFunc(__LINEARREG_API__, params);
}
export const linearReg = LINEARREG;
let __LINEARREG_ANGLE_API__ = API['LINEARREG_ANGLE'];
export function LINEARREG_ANGLE(params) {
    return callFunc(__LINEARREG_ANGLE_API__, params);
}
export const linearRegAngle = LINEARREG_ANGLE;
let __LINEARREG_INTERCEPT_API__ = API['LINEARREG_INTERCEPT'];
export function LINEARREG_INTERCEPT(params) {
    return callFunc(__LINEARREG_INTERCEPT_API__, params);
}
export const linearRegIntercept = LINEARREG_INTERCEPT;
let __LINEARREG_SLOPE_API__ = API['LINEARREG_SLOPE'];
export function LINEARREG_SLOPE(params) {
    return callFunc(__LINEARREG_SLOPE_API__, params);
}
export const linearRegSlope = LINEARREG_SLOPE;
let __LN_API__ = API['LN'];
export function LN(params) {
    return callFunc(__LN_API__, params);
}
export const ln = LN;
let __LOG10_API__ = API['LOG10'];
export function LOG10(params) {
    return callFunc(__LOG10_API__, params);
}
export const log10 = LOG10;
let __MA_API__ = API['MA'];
export function MA(params) {
    return callFunc(__MA_API__, params);
}
export const movingAverage = MA;
let __MACD_API__ = API['MACD'];
export function MACD(params) {
    return callFunc(__MACD_API__, params);
}
export const macd = MACD;
let __MACDEXT_API__ = API['MACDEXT'];
export function MACDEXT(params) {
    return callFunc(__MACDEXT_API__, params);
}
export const macdExt = MACDEXT;
let __MACDFIX_API__ = API['MACDFIX'];
export function MACDFIX(params) {
    return callFunc(__MACDFIX_API__, params);
}
export const macdFix = MACDFIX;
let __MAMA_API__ = API['MAMA'];
export function MAMA(params) {
    return callFunc(__MAMA_API__, params);
}
export const mama = MAMA;
let __MAVP_API__ = API['MAVP'];
export function MAVP(params) {
    return callFunc(__MAVP_API__, params);
}
export const movingAverageVariablePeriod = MAVP;
let __MAX_API__ = API['MAX'];
export function MAX(params) {
    return callFunc(__MAX_API__, params);
}
export const max = MAX;
let __MAXINDEX_API__ = API['MAXINDEX'];
export function MAXINDEX(params) {
    return callFunc(__MAXINDEX_API__, params);
}
export const maxIndex = MAXINDEX;
let __MEDPRICE_API__ = API['MEDPRICE'];
export function MEDPRICE(params) {
    return callFunc(__MEDPRICE_API__, params);
}
export const medPrice = MEDPRICE;
let __MFI_API__ = API['MFI'];
export function MFI(params) {
    return callFunc(__MFI_API__, params);
}
export const mfi = MFI;
let __MIDPOINT_API__ = API['MIDPOINT'];
export function MIDPOINT(params) {
    return callFunc(__MIDPOINT_API__, params);
}
export const midPoint = MIDPOINT;
let __MIDPRICE_API__ = API['MIDPRICE'];
export function MIDPRICE(params) {
    return callFunc(__MIDPRICE_API__, params);
}
export const midPrice = MIDPRICE;
let __MIN_API__ = API['MIN'];
export function MIN(params) {
    return callFunc(__MIN_API__, params);
}
export const min = MIN;
let __MININDEX_API__ = API['MININDEX'];
export function MININDEX(params) {
    return callFunc(__MININDEX_API__, params);
}
export const minIndex = MININDEX;
let __MINMAX_API__ = API['MINMAX'];
export function MINMAX(params) {
    return callFunc(__MINMAX_API__, params);
}
export const minMax = MINMAX;
let __MINMAXINDEX_API__ = API['MINMAXINDEX'];
export function MINMAXINDEX(params) {
    return callFunc(__MINMAXINDEX_API__, params);
}
export const minMaxIndex = MINMAXINDEX;
let __MINUS_DI_API__ = API['MINUS_DI'];
export function MINUS_DI(params) {
    return callFunc(__MINUS_DI_API__, params);
}
export const minusDI = MINUS_DI;
let __MINUS_DM_API__ = API['MINUS_DM'];
export function MINUS_DM(params) {
    return callFunc(__MINUS_DM_API__, params);
}
export const minusDM = MINUS_DM;
let __MOM_API__ = API['MOM'];
export function MOM(params) {
    return callFunc(__MOM_API__, params);
}
export const mom = MOM;
let __MULT_API__ = API['MULT'];
export function MULT(params) {
    return callFunc(__MULT_API__, params);
}
export const mult = MULT;
let __NATR_API__ = API['NATR'];
export function NATR(params) {
    return callFunc(__NATR_API__, params);
}
export const natr = NATR;
let __OBV_API__ = API['OBV'];
export function OBV(params) {
    return callFunc(__OBV_API__, params);
}
export const obv = OBV;
let __PLUS_DI_API__ = API['PLUS_DI'];
export function PLUS_DI(params) {
    return callFunc(__PLUS_DI_API__, params);
}
export const plusDI = PLUS_DI;
let __PLUS_DM_API__ = API['PLUS_DM'];
export function PLUS_DM(params) {
    return callFunc(__PLUS_DM_API__, params);
}
export const plusDM = PLUS_DM;
let __PPO_API__ = API['PPO'];
export function PPO(params) {
    return callFunc(__PPO_API__, params);
}
export const ppo = PPO;
let __ROC_API__ = API['ROC'];
export function ROC(params) {
    return callFunc(__ROC_API__, params);
}
export const roc = ROC;
let __ROCP_API__ = API['ROCP'];
export function ROCP(params) {
    return callFunc(__ROCP_API__, params);
}
export const rocP = ROCP;
let __ROCR_API__ = API['ROCR'];
export function ROCR(params) {
    return callFunc(__ROCR_API__, params);
}
export const rocR = ROCR;
let __ROCR100_API__ = API['ROCR100'];
export function ROCR100(params) {
    return callFunc(__ROCR100_API__, params);
}
export const rocR100 = ROCR100;
let __RSI_API__ = API['RSI'];
export function RSI(params) {
    return callFunc(__RSI_API__, params);
}
export const rsi = RSI;
let __SAR_API__ = API['SAR'];
export function SAR(params) {
    return callFunc(__SAR_API__, params);
}
export const sar = SAR;
let __SAREXT_API__ = API['SAREXT'];
export function SAREXT(params) {
    return callFunc(__SAREXT_API__, params);
}
export const sarExt = SAREXT;
let __SIN_API__ = API['SIN'];
export function SIN(params) {
    return callFunc(__SIN_API__, params);
}
export const sin = SIN;
let __SINH_API__ = API['SINH'];
export function SINH(params) {
    return callFunc(__SINH_API__, params);
}
export const sinh = SINH;
let __SMA_API__ = API['SMA'];
export function SMA(params) {
    return callFunc(__SMA_API__, params);
}
export const sma = SMA;
let __SQRT_API__ = API['SQRT'];
export function SQRT(params) {
    return callFunc(__SQRT_API__, params);
}
export const sqrt = SQRT;
let __STDDEV_API__ = API['STDDEV'];
export function STDDEV(params) {
    return callFunc(__STDDEV_API__, params);
}
export const stdDev = STDDEV;
let __STOCH_API__ = API['STOCH'];
export function STOCH(params) {
    return callFunc(__STOCH_API__, params);
}
export const stoch = STOCH;
let __STOCHF_API__ = API['STOCHF'];
export function STOCHF(params) {
    return callFunc(__STOCHF_API__, params);
}
export const stochF = STOCHF;
let __STOCHRSI_API__ = API['STOCHRSI'];
export function STOCHRSI(params) {
    return callFunc(__STOCHRSI_API__, params);
}
export const stochRsi = STOCHRSI;
let __SUB_API__ = API['SUB'];
export function SUB(params) {
    return callFunc(__SUB_API__, params);
}
export const sub = SUB;
let __SUM_API__ = API['SUM'];
export function SUM(params) {
    return callFunc(__SUM_API__, params);
}
export const sum = SUM;
let __T3_API__ = API['T3'];
export function T3(params) {
    return callFunc(__T3_API__, params);
}
export const t3 = T3;
let __TAN_API__ = API['TAN'];
export function TAN(params) {
    return callFunc(__TAN_API__, params);
}
export const tan = TAN;
let __TANH_API__ = API['TANH'];
export function TANH(params) {
    return callFunc(__TANH_API__, params);
}
export const tanh = TANH;
let __TEMA_API__ = API['TEMA'];
export function TEMA(params) {
    return callFunc(__TEMA_API__, params);
}
export const tema = TEMA;
let __TRANGE_API__ = API['TRANGE'];
export function TRANGE(params) {
    return callFunc(__TRANGE_API__, params);
}
export const trueRange = TRANGE;
let __TRIMA_API__ = API['TRIMA'];
export function TRIMA(params) {
    return callFunc(__TRIMA_API__, params);
}
export const trima = TRIMA;
let __TRIX_API__ = API['TRIX'];
export function TRIX(params) {
    return callFunc(__TRIX_API__, params);
}
export const trix = TRIX;
let __TSF_API__ = API['TSF'];
export function TSF(params) {
    return callFunc(__TSF_API__, params);
}
export const tsf = TSF;
let __TYPPRICE_API__ = API['TYPPRICE'];
export function TYPPRICE(params) {
    return callFunc(__TYPPRICE_API__, params);
}
export const typPrice = TYPPRICE;
let __ULTOSC_API__ = API['ULTOSC'];
export function ULTOSC(params) {
    return callFunc(__ULTOSC_API__, params);
}
export const ultOsc = ULTOSC;
let __VAR_API__ = API['VAR'];
export function VAR(params) {
    return callFunc(__VAR_API__, params);
}
export const variance = VAR;
let __WCLPRICE_API__ = API['WCLPRICE'];
export function WCLPRICE(params) {
    return callFunc(__WCLPRICE_API__, params);
}
export const wclPrice = WCLPRICE;
let __WILLR_API__ = API['WILLR'];
export function WILLR(params) {
    return callFunc(__WILLR_API__, params);
}
export const willR = WILLR;
let __WMA_API__ = API['WMA'];
export function WMA(params) {
    return callFunc(__WMA_API__, params);
}
export const wma = WMA;
