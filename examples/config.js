requirejs.config({
    paths: {
        "skylark-utils" : "http://registry.skylarkjs.org/dev/utils/skylark-utils/uncompressed/skylark-utils-all"
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
            deps: ["skylark-utils"]
        }
    }
});
 
// require(["module/name", ...], function(params){ ... });
require(["skylark-utils"], function (sutils) {
    require(["skylark-fuelux"], function ($) {
        if (window.initPage) {
            window.initPage($,sutils);
        }
    });
});