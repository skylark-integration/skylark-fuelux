/**
 * skylark-bs-swt - The skylark bootstrap standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.0-beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/langx","skylark-utils/browser","skylark-utils/eventer","skylark-utils/noder","skylark-utils/geom","skylark-utils/query","./sbswt"],function(n,t,i,r,s,e,o){"use strict";function a(){var n=document.createElement("bootstrap"),t={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var i in t)if(void 0!==n.style[i])return{end:t[i]};return!1}e.fn.emulateTransitionEnd=function(n){var i=!1,r=this;e(this).one("bsTransitionEnd",function(){i=!0});var s=function(){i||e(r).trigger(t.support.transition.end)};return setTimeout(s,n),this},e(function(){t.support.transition=a(),t.support.transition&&(i.special.bsTransitionEnd={bindType:t.support.transition.end,delegateType:t.support.transition.end,handle:function(n){if(e(n.target).is(this))return n.handleObj.handler.apply(this,arguments)}})})});
//# sourceMappingURL=sourcemaps/transition.js.map
