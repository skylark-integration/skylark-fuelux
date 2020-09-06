requirejs.config({
    paths: {
        "skylark-domx" :  '../node_modules/skylark-domx/dist/uncompressed/skylark-domx-all',
  //      "skylark-fuelux": "../dist/js/uncompressed/skylark-fuelux"
    },
      packages: [
         {
            name: 'skylark-fuelux',
//            location: '../dist/js/uncompressed/skylark-fuelux',
            location: '../src',
            main: 'main'
          }
      ],      
          // shimオプションの設定。モジュール間の依存関係を定義します。
    shim: {
        "skylark-fuelux": {
            deps: ["skylark-domx"]
        }
    }
});
 
// require(["module/name", ...], function(params){ ... });
require(["skylark-domx"], function (domx) {
    require(["skylark-fuelux"], function ($) {
        if (window.initPage) {
            window.initPage($,domx);
        }
    });
});