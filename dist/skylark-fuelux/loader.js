/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylarkui/skylark-fuelux/
 * @license MIT
 */
define(["skylark-langx/langx","skylark-domx/browser","skylark-domx/eventer","skylark-domx/noder","skylark-domx/geom","skylark-domx/query","./fuelux"],function(e,n,t,o,r,a,i){var l=a.fn.loader,f=i.Loader=i.WidgetBase.inherit({klassName:"Loader",init:function(n,t){this.$element=a(n),this.options=e.mixin({},a.fn.loader.defaults,t)},destroy:function(){return this.$element.remove(),this.$element[0].outerHTML},ieRepaint:function(){},msieVersion:function(){},next:function(){},pause:function(){},play:function(){},previous:function(){},reset:function(){}});return a.fn.loader=function(e){var n,t=Array.prototype.slice.call(arguments,1),o=this.each(function(){var o=a(this),r=o.data("fu.loader"),i="object"==typeof e&&e;r||o.data("fu.loader",r=new f(this,i)),"string"==typeof e&&(n=r[e].apply(r,t))});return void 0===n?o:n},a.fn.loader.defaults={},a.fn.loader.Constructor=f,a.fn.loader.noConflict=function(){return a.fn.loader=l,this},a.fn.loader});
//# sourceMappingURL=sourcemaps/loader.js.map
