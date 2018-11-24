/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylarkui/skylark-fuelux/
 * @license MIT
 */
define(["skylark-langx/skylark","skylark-langx/langx","skylark-utils-dom/browser","skylark-utils-dom/eventer","skylark-utils-dom/noder","skylark-utils-dom/geom","skylark-utils-dom/query"],function(E,e,t,r,i,n,s){var l=E.ui=E.ui||{},u=l.fuelux={},O={BACKSPACE_KEYCODE:8,COMMA_KEYCODE:188,DELETE_KEYCODE:46,DOWN_ARROW_KEYCODE:40,ENTER_KEYCODE:13,TAB_KEYCODE:9,UP_ARROW_KEYCODE:38},C=function(E){return E.shiftKey===!0},k=function(E){return function(e){return e.keyCode===E}},o=k(O.BACKSPACE_KEYCODE),D=k(O.DELETE_KEYCODE),K=k(O.TAB_KEYCODE),a=k(O.UP_ARROW_KEYCODE),_=k(O.DOWN_ARROW_KEYCODE),y=/&[^\s]*;/,A=function(E){for(;y.test(E);)E=s("<i>").html(E).text();return s("<i>").text(E).html()};return e.mixin(u,{CONST:O,cleanInput:A,isBackspaceKey:o,isDeleteKey:D,isShiftHeld:C,isTabKey:K,isUpArrow:a,isDownArrow:_}),e.mixin(u,{WidgetBase:e.Evented}),u});
//# sourceMappingURL=sourcemaps/fuelux.js.map
