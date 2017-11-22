requirejs.config({
    paths: {
        "skylarkjs" : "http://registry.skylarkjs.org/packages/skylark-utils/v0.9.3-beta/uncompressed/skylark-utils-all",
        "bootstrap": "../dist/js/uncompressed/skylark-bootstrap",
        "holder": "../assets/js/vendor/holder"
    },
    packages : [
    ],
    // shimオプションの設定。モジュール間の依存関係を定義します。
    shim: {
        "bootstrap": {
            deps: ["skylarkjs"]
        }
    }
});
 
// require(["module/name", ...], function(params){ ... });
require(["bootstrap"], function ($) {
    if (window.initPage) {
        window.initPage($);
    }
});