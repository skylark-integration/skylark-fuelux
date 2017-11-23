requirejs.config({
    paths: {
        "skylarkjs" : "http://registry.skylarkjs.org/packages/skylark-utils/v0.9.3-beta/uncompressed/skylark-utils-all",
        "skylark-bs-swt": "../dist/js/uncompressed/skylark-bs-swt"
    },
    packages : [
    ],
    // shimオプションの設定。モジュール間の依存関係を定義します。
    shim: {
        "skylark-bs-swt": {
            deps: ["skylarkjs"]
        }
    }
});
 
// require(["module/name", ...], function(params){ ... });
require(["skylark-bs-swt"], function ($) {
    if (window.initPage) {
        window.initPage($);
    }
});