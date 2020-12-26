/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-langx/langx","skylark-domx/browser","skylark-domx/eventer","skylark-domx/noder","skylark-domx/geom","skylark-domx/query","./fuelux","skylark-bootstrap3/dropdown"],function(o,t,e,n,r,i){function f(t){i(t).css({visibility:"hidden"}),!function(t){var e=function(t){var e,n=t.attr("data-target"),r=!0;n?"window"!==n&&(e=i(n),r=!1):o.each(t.parents(),function(o,t){if("visible"!==i(t).css("overflow"))return e=t,r=!1,!1});r&&(e=window);return{overflowElement:i(e),isWindow:r}}(t),n={};if(n.parentHeight=t.parent().outerHeight(),n.parentOffsetTop=t.parent().offset().top,n.dropdownHeight=t.outerHeight(),n.containerHeight=e.overflowElement.outerHeight(),n.containerOffsetTop=e.isWindow?e.overflowElement.scrollTop():e.overflowElement.offset().top,n.fromTop=n.parentOffsetTop-n.containerOffsetTop,n.fromBottom=n.containerHeight-n.parentHeight-(n.parentOffsetTop-n.containerOffsetTop),n.dropdownHeight<n.fromBottom)return!1;if(n.dropdownHeight<n.fromTop)return!0;if(n.dropdownHeight>=n.fromTop&&n.dropdownHeight>=n.fromBottom)return n.fromTop>=n.fromBottom}(t)?t.parent().removeClass("dropup"):t.parent().addClass("dropup"),i(t).css({visibility:"visible"})}i(document).on("click.fu.dropdown-autoflip","[data-toggle=dropdown][data-flip]",function(o){"auto"===i(this).data().flip&&f(i(this).next(".dropdown-menu"))}),i(document).on("suggested.fu.pillbox",function(o,t){f(i(t)),i(t).parent().addClass("open")}),i.fn.dropdownautoflip=function(){}});
//# sourceMappingURL=sourcemaps/dropdown-autoflip.js.map
