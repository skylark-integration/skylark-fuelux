requirejs.config({
    paths: {
        "skylark-utils" : "http://registry.skylarkjs.org/dev/utils/skylark-utils/uncompressed/skylark-utils-all"
  //      "skylark-ui-swt": "../dist/js/uncompressed/skylark-ui-swt"
    },
      packages: [
         {
            name: 'skylark-ui-swt',
//            location: '../dist/js/uncompressed/skylark-ui-swt',
            location: '../src/js',
            main: 'main'
          }
      ],      
          // shimオプションの設定。モジュール間の依存関係を定義します。
    shim: {
        "skylark-ui-swt": {
            deps: ["skylark-utils"]
        }
    }
});
 
// require(["module/name", ...], function(params){ ... });
require(["skylark-utils"], function (sutils) {
    require(["skylark-ui-swt"], function ($) {
        if (window.initPage) {
            window.initPage($,sutils);
        }
    });
});