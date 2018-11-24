/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylarkui/skylark-fuelux/
 * @license MIT
 */
define(["skylark-langx/langx","skylark-utils-dom/browser","skylark-utils-dom/eventer","skylark-utils-dom/noder","skylark-utils-dom/geom","skylark-utils-dom/query"],function(o,t,e,n,r,i){function f(o){i(o).css({visibility:"hidden"}),a(o)?o.parent().addClass("dropup"):o.parent().removeClass("dropup"),i(o).css({visibility:"visible"})}function a(o){var t=d(o),e={};return e.parentHeight=o.parent().outerHeight(),e.parentOffsetTop=o.parent().offset().top,e.dropdownHeight=o.outerHeight(),e.containerHeight=t.overflowElement.outerHeight(),e.containerOffsetTop=t.isWindow?t.overflowElement.scrollTop():t.overflowElement.offset().top,e.fromTop=e.parentOffsetTop-e.containerOffsetTop,e.fromBottom=e.containerHeight-e.parentHeight-(e.parentOffsetTop-e.containerOffsetTop),!(e.dropdownHeight<e.fromBottom)&&(e.dropdownHeight<e.fromTop||(e.dropdownHeight>=e.fromTop&&e.dropdownHeight>=e.fromBottom?e.fromTop>=e.fromBottom:void 0))}function d(t){var e,n=t.attr("data-target"),r=!0;return n?"window"!==n&&(e=i(n),r=!1):o.each(t.parents(),function(o,t){if("visible"!==i(t).css("overflow"))return e=t,r=!1,!1}),r&&(e=window),{overflowElement:i(e),isWindow:r}}i(document).on("click.fu.dropdown-autoflip","[data-toggle=dropdown][data-flip]",function(o){"auto"===i(this).data().flip&&f(i(this).next(".dropdown-menu"))}),i(document).on("suggested.fu.pillbox",function(o,t){f(i(t)),i(t).parent().addClass("open")}),i.fn.dropdownautoflip=function(){}});
//# sourceMappingURL=sourcemaps/dropdown-autoflip.js.map
