/**
 * skylark-bs-swt - The skylark bootstrap standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.0-beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/langx","skylark-utils/browser","skylark-utils/eventer","skylark-utils/noder","skylark-utils/geom","skylark-utils/query"],function(t,n,e,o,r,i){var s=i.fn.loader,l=function(n,e){this.$element=i(n),this.options=t.mixin({},i.fn.loader.defaults,e)};l.prototype={constructor:l,destroy:function(){return this.$element.remove(),this.$element[0].outerHTML},ieRepaint:function(){},msieVersion:function(){},next:function(){},pause:function(){},play:function(){},previous:function(){},reset:function(){}},i.fn.loader=function(t){var n,e=Array.prototype.slice.call(arguments,1),o=this.each(function(){var o=i(this),r=o.data("fu.loader"),s="object"==typeof t&&t;r||o.data("fu.loader",r=new l(this,s)),"string"==typeof t&&(n=r[t].apply(r,e))});return void 0===n?o:n},i.fn.loader.defaults={},i.fn.loader.Constructor=l,i.fn.loader.noConflict=function(){return i.fn.loader=s,this}});
//# sourceMappingURL=sourcemaps/loader.js.map
