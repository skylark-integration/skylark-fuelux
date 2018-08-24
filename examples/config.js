requirejs.config({
    paths: {
        "skylark-utils" : "http://registry.skylarkjs.org/dev/utils/skylark-utils/uncompressed/skylark-utils-all"
  //      "skylark-swt": "../dist/js/uncompressed/skylark-swt"
    },
      packages: [
         {
            name: 'skylark-swt',
//            location: '../dist/js/uncompressed/skylark-swt',
            location: '../src/js',
            main: 'main'
          }
      ],      
          // shim�I�v�V�����̐ݒ�B���W���[���Ԃ̈ˑ��֌W���`���܂��B
    shim: {
        "skylark-swt": {
            deps: ["skylark-utils"]
        }
    }
});
 
// require(["module/name", ...], function(params){ ... });
require(["skylark-utils"], function (sutils) {
    require(["skylark-swt"], function ($) {
        if (window.initPage) {
            window.initPage($,sutils);
        }
    });
});