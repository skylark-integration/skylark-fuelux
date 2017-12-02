/**
 * skylark-bs-swt - The skylark bootstrap standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.0-beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/browser","skylark-utils/langx","skylark-utils/eventer","skylark-utils/query"],function(t,e,r,a){"use strict";function s(t){return this.each(function(){var e=a(this),r=e.data("bs.alert");r||e.data("bs.alert",r=new l(this)),"string"==typeof t&&r[t].call(e)})}var n='[data-dismiss="alert"]',l=function(t){a(t).on("click",n,this.close)};l.VERSION="3.3.7",l.TRANSITION_DURATION=150,l.prototype.close=function(e){function s(){o.detach().trigger("closed.bs.alert").remove()}var n=a(this),i=n.attr("data-target");i||(i=n.attr("href"),i=i&&i.replace(/.*(?=#[^\s]*$)/,""));var o=a("#"===i?[]:i);e&&e.preventDefault(),o.length||(o=n.closest(".alert")),o.trigger(e=r.create("close.bs.alert")),e.isDefaultPrevented()||(o.removeClass("in"),t.support.transition&&o.hasClass("fade")?o.one("bsTransitionEnd",s).emulateTransitionEnd(l.TRANSITION_DURATION):s())};var i=a.fn.alert;a.fn.alert=s,a.fn.alert.Constructor=l,a.fn.alert.noConflict=function(){return a.fn.alert=i,this}});
//# sourceMappingURL=sourcemaps/alert.js.map
