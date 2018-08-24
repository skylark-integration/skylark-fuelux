/**
 * skylark-swt - The skylark standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.2.beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/skylark","skylark-utils/langx","skylark-utils/browser","skylark-utils/eventer","skylark-utils/noder","skylark-utils/geom","skylark-utils/query","skylark-utils/widgets"],function(e,t,i,s,E,r,n,l){var u=e.ui=e.ui||{},k=u.sbswt={},a={BACKSPACE_KEYCODE:8,COMMA_KEYCODE:188,DELETE_KEYCODE:46,DOWN_ARROW_KEYCODE:40,ENTER_KEYCODE:13,TAB_KEYCODE:9,UP_ARROW_KEYCODE:38},O=function(e){return e.shiftKey===!0},C=function(e){return function(t){return t.keyCode===e}},D=C(a.BACKSPACE_KEYCODE),K=C(a.DELETE_KEYCODE),_=C(a.TAB_KEYCODE),y=C(a.UP_ARROW_KEYCODE),o=C(a.DOWN_ARROW_KEYCODE),A=/&[^\s]*;/,Y=function(e){for(;A.test(e);)e=n("<i>").html(e).text();return n("<i>").text(e).html()};t.mixin(k,{CONST:a,cleanInput:Y,isBackspaceKey:D,isDeleteKey:K,isShiftHeld:O,isTabKey:_,isUpArrow:y,isDownArrow:o});var f=l.Widget.inherit({klassName:"WidgetBase"});return t.mixin(k,{WidgetBase:f}),k});
//# sourceMappingURL=sourcemaps/sbswt.js.map
