/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylarkui/skylark-fuelux/
 * @license MIT
 */
define(["skylark-langx/langx","skylark-utils-dom/browser","skylark-utils-dom/eventer","skylark-utils-dom/noder","skylark-utils-dom/geom","skylark-utils-dom/query","./fuelux"],function(e,n,t,o,r,i,a){var l=i.fn.loader,s=a.Loader=a.WidgetBase.inherit({klassName:"Loader",init:function(n,t){this.$element=i(n),this.options=e.mixin({},i.fn.loader.defaults,t)},destroy:function(){return this.$element.remove(),this.$element[0].outerHTML},ieRepaint:function(){},msieVersion:function(){},next:function(){},pause:function(){},play:function(){},previous:function(){},reset:function(){}});return i.fn.loader=function(e){var n,t=Array.prototype.slice.call(arguments,1),o=this.each(function(){var o=i(this),r=o.data("fu.loader"),a="object"==typeof e&&e;r||o.data("fu.loader",r=new s(this,a)),"string"==typeof e&&(n=r[e].apply(r,t))});return void 0===n?o:n},i.fn.loader.defaults={},i.fn.loader.Constructor=s,i.fn.loader.noConflict=function(){return i.fn.loader=l,this},i.fn.loader});
//# sourceMappingURL=sourcemaps/loader.js.map
