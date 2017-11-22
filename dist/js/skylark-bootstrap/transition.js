/**
 * skylark-bootstrap - The most popular front-end framework for developing responsive, mobile first projects on the web.
 * @author Twitter, Inc.
 * @version v3.3.7
 * @link http://getbootstrap.com
 * @license MIT
 */
define(["skylark-utils/browser","skylark-utils/langx","skylark-utils/eventer","skylark-utils/query"],function(n,t,i,r){"use strict";function s(){var n=document.createElement("bootstrap"),t={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var i in t)if(void 0!==n.style[i])return{end:t[i]};return!1}r.fn.emulateTransitionEnd=function(t){var i=!1,s=this;r(this).one("bsTransitionEnd",function(){i=!0});var e=function(){i||r(s).trigger(n.support.transition.end)};return setTimeout(e,t),this},r(function(){n.support.transition=s(),n.support.transition&&(i.special.bsTransitionEnd={bindType:n.support.transition.end,delegateType:n.support.transition.end,handle:function(n){if(r(n.target).is(this))return n.handleObj.handler.apply(this,arguments)}})})});
//# sourceMappingURL=sourcemaps/transition.js.map
