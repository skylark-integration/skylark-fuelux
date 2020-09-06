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
          // shim�I�v�V�����̐ݒ�B���W���[���Ԃ̈ˑ��֌W���`���܂��B
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