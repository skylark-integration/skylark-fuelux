requirejs.config({
    paths: {
        "skylark-utils" : "http://registry.skylarkjs.org/packages/skylark-utils/v0.9.5-beta/uncompressed/skylark-utils-all"
  //      "skylark-bs-swt": "../dist/js/uncompressed/skylark-bs-swt"
    },
      packages: [
         {
            name: 'skylark-bs-swt',
//            location: '../dist/js/uncompressed/skylark-bs-swt',
            location: '../src/js',
            main: 'main'
          }
      ],      
          // shim�I�v�V�����̐ݒ�B���W���[���Ԃ̈ˑ��֌W���`���܂��B
    shim: {
        "skylark-bs-swt": {
            deps: ["skylark-utils"]
        }
    }
});
 
// require(["module/name", ...], function(params){ ... });
require(["skylark-utils"], function (sutils) {
    require(["skylark-bs-swt"], function ($) {
        if (window.initPage) {
            window.initPage($,sutils);
        }
    });
});