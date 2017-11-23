/**
 * skylark-bs-swt - The skylark bootstrap standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.0-beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/langx","skylark-utils/browser","skylark-utils/eventer","skylark-utils/noder","skylark-utils/geom","skylark-utils/query"],function(E,t,e,i,r,s){var n={BACKSPACE_KEYCODE:8,COMMA_KEYCODE:188,DELETE_KEYCODE:46,DOWN_ARROW_KEYCODE:40,ENTER_KEYCODE:13,TAB_KEYCODE:9,UP_ARROW_KEYCODE:38},O=function(E){return E.shiftKey===!0},l=function(E){return function(t){return t.keyCode===E}},C=l(n.BACKSPACE_KEYCODE),u=l(n.DELETE_KEYCODE),D=l(n.TAB_KEYCODE),K=l(n.UP_ARROW_KEYCODE),_=l(n.DOWN_ARROW_KEYCODE),k=/&[^\s]*;/,o=function(E){for(;k.test(E);)E=s("<i>").html(E).text();return s("<i>").text(E).html()};s.fn.utilities={CONST:n,cleanInput:o,isBackspaceKey:C,isDeleteKey:u,isShiftHeld:O,isTabKey:D,isUpArrow:K,isDownArrow:_}});
//# sourceMappingURL=sourcemaps/utilities.js.map
