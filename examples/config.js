requirejs.config({
    paths: {
        "skylarkjs" : "http://registry.skylarkjs.org/packages/skylark-utils/v0.9.3-beta/uncompressed/skylark-utils-all",
        "bootstrap": "../dist/js/uncompressed/skylark-bootstrap",
        "holder": "../assets/js/vendor/holder"
    },
    packages : [
    ],
    // shim�I�v�V�����̐ݒ�B���W���[���Ԃ̈ˑ��֌W���`���܂��B
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