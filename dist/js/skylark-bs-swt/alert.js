/**
 * skylark-bs-swt - The skylark bootstrap standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.0-beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/langx","skylark-utils/browser","skylark-utils/eventer","skylark-utils/noder","skylark-utils/geom","skylark-utils/query","./sbswt"],function(t,e,r,a,s,n,l){"use strict";function i(t){return this.each(function(){var e=n(this),r=e.data("bs.alert");r||e.data("bs.alert",r=new u(this)),"string"==typeof t&&r[t].call(e)})}var o='[data-dismiss="alert"]',u=l.Alert=l.WidgetBase.inherit({klassName:"Alert",init:function(t,e){n(t).on("click",o,this.close)},close:function(t){function a(){i.detach().trigger("closed.bs.alert").remove()}var s=n(this),l=s.attr("data-target");l||(l=s.attr("href"),l=l&&l.replace(/.*(?=#[^\s]*$)/,""));var i=n("#"===l?[]:l);t&&t.preventDefault(),i.length||(i=s.closest(".alert")),i.trigger(t=r.create("close.bs.alert")),t.isDefaultPrevented()||(i.removeClass("in"),e.support.transition&&(i.hasClass("fade")?i.one("bsTransitionEnd",a).emulateTransitionEnd(u.TRANSITION_DURATION):a()))}});u.VERSION="3.3.7",u.TRANSITION_DURATION=150;var c=n.fn.alert;return n.fn.alert=i,n.fn.alert.Constructor=u,n.fn.alert.noConflict=function(){return n.fn.alert=c,this},n.fn.alert});
//# sourceMappingURL=sourcemaps/alert.js.map
