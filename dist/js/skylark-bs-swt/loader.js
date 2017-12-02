/**
 * skylark-bs-swt - The skylark bootstrap standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.0-beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/langx","skylark-utils/browser","skylark-utils/eventer","skylark-utils/noder","skylark-utils/geom","skylark-utils/query","./sbswt"],function(e,t,n,r,i,o,a){var s=o.fn.loader,l=a.Loader=a.WidgetBase.inherit({klassName:"Loader",init:function(t,n){this.$element=o(t),this.options=e.mixin({},o.fn.loader.defaults,n)},destroy:function(){return this.$element.remove(),this.$element[0].outerHTML},ieRepaint:function(){},msieVersion:function(){},next:function(){},pause:function(){},play:function(){},previous:function(){},reset:function(){}});return o.fn.loader=function(e){var t,n=Array.prototype.slice.call(arguments,1),r=this.each(function(){var r=o(this),i=r.data("fu.loader"),a="object"==typeof e&&e;i||r.data("fu.loader",i=new l(this,a)),"string"==typeof e&&(t=i[e].apply(i,n))});return void 0===t?r:t},o.fn.loader.defaults={},o.fn.loader.Constructor=l,o.fn.loader.noConflict=function(){return o.fn.loader=s,this},o.fn.loader});
//# sourceMappingURL=sourcemaps/loader.js.map
