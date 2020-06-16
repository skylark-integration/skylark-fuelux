/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylarkui/skylark-fuelux/
 * @license MIT
 */
define(["skylark-langx/skylark","skylark-langx/langx","skylark-domx/browser","skylark-domx/eventer","skylark-domx/noder","skylark-domx/geom","skylark-domx/query"],function(E,e,r,n,t,i,s){var O=(E.ui=E.ui||{}).fuelux={},C={BACKSPACE_KEYCODE:8,COMMA_KEYCODE:188,DELETE_KEYCODE:46,DOWN_ARROW_KEYCODE:40,ENTER_KEYCODE:13,TAB_KEYCODE:9,UP_ARROW_KEYCODE:38},k=function(E){return function(e){return e.keyCode===E}},o=k(C.BACKSPACE_KEYCODE),D=k(C.DELETE_KEYCODE),K=k(C.TAB_KEYCODE),a=k(C.UP_ARROW_KEYCODE),l=k(C.DOWN_ARROW_KEYCODE),u=/&[^\s]*;/;return e.mixin(O,{CONST:C,cleanInput:function(E){for(;u.test(E);)E=s("<i>").html(E).text();return s("<i>").text(E).html()},isBackspaceKey:o,isDeleteKey:D,isShiftHeld:function(E){return!0===E.shiftKey},isTabKey:K,isUpArrow:a,isDownArrow:l}),e.mixin(O,{WidgetBase:e.Evented}),O});
//# sourceMappingURL=sourcemaps/fuelux.js.map
