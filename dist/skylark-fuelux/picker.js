/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-langx/langx","skylark-domx/browser","skylark-domx/eventer","skylark-domx/noder","skylark-domx/geom","skylark-domx/query","./fuelux"],function(e,t,i,n,r,s,c){var o=s.fn.picker,p=c.Picker=c.WidgetBase.inherit({klassName:"Picker",init:function(t,i){var n=this;this.$element=s(t),this.options=e.mixin({},s.fn.picker.defaults,i),this.$accept=this.$element.find(".picker-accept"),this.$cancel=this.$element.find(".picker-cancel"),this.$trigger=this.$element.find(".picker-trigger"),this.$footer=this.$element.find(".picker-footer"),this.$header=this.$element.find(".picker-header"),this.$popup=this.$element.find(".picker-popup"),this.$body=this.$element.find(".picker-body"),this.clickStamp="_",this.isInput=this.$trigger.is("input"),this.$trigger.on("keydown.fu.picker",e.proxy(this.keyComplete,this)),this.$trigger.on("focus.fu.picker",e.proxy(function(t){(void 0===t||s(t.target).is("input[type=text]"))&&e.proxy(this.show(),this)},this)),this.$trigger.on("click.fu.picker",e.proxy(function(t){s(t.target).is("input[type=text]")?e.proxy(this.show(),this):e.proxy(this.toggle(),this)},this)),this.$accept.on("click.fu.picker",e.proxy(this.complete,this,"accepted")),this.$cancel.on("click.fu.picker",function(e){e.preventDefault(),n.complete("cancelled")})},complete:function(e){var t=this.options[{accepted:"onAccept",cancelled:"onCancel",exited:"onExit"}[e]],i={contents:this.$body};t?(t(i),this.$element.trigger(e+".fu.picker",i)):(this.$element.trigger(e+".fu.picker",i),this.hide())},keyComplete:function(e){this.isInput&&13===e.keyCode?(this.complete("accepted"),this.$trigger.blur()):27===e.keyCode&&(this.complete("exited"),this.$trigger.blur())},destroy:function(){return this.$element.remove(),s(document).off("click.fu.picker.externalClick."+this.clickStamp),this.$element[0].outerHTML},disable:function(){this.$element.addClass("disabled"),this.$trigger.attr("disabled","disabled")},enable:function(){this.$element.removeClass("disabled"),this.$trigger.removeAttr("disabled")},toggle:function(){this.$element.hasClass("showing")?this.hide():this.show()},hide:function(){this.$element.hasClass("showing")&&(this.$element.removeClass("showing"),s(document).off("click.fu.picker.externalClick."+this.clickStamp),this.$element.trigger("hidden.fu.picker"))},externalClickListener:function(e,t){(!0===t||this.isExternalClick(e))&&this.complete("exited")},isExternalClick:function(e){var t,i,n=this.$element.get(0),r=this.options.externalClickExceptions||[],c=s(e.target);if(e.target===n||c.parents(".picker").get(0)===n)return!1;for(t=0,i=r.length;t<i;t++)if(c.is(r[t])||c.parents(r[t]).length>0)return!1;return!0},show:function(){var t;if((t=s(document).find(".picker.showing")).length>0){if(t.data("fu.picker")&&t.data("fu.picker").options.explicit)return;t.picker("externalClickListener",{},!0)}this.$element.addClass("showing"),h(this),this.$element.trigger("shown.fu.picker"),this.clickStamp=(new Date).getTime()+(Math.floor(100*Math.random())+1),this.options.explicit||s(document).on("click.fu.picker.externalClick."+this.clickStamp,e.proxy(this.externalClickListener,this))}}),l=function(e){var t=Math.max(document.documentElement.clientHeight,window.innerHeight||0),i=s(document).scrollTop(),n=e.$popup.offset();return n.top+e.$popup.outerHeight(!0)>t+i||n.top<i},h=function(e){e.$popup.css("visibility","hidden"),u(e),l(e)&&(a(e),l(e)&&u(e)),e.$popup.css("visibility","visible")},a=function(e){e.$popup.css("top",-e.$popup.outerHeight(!0)+"px")},u=function(e){e.$popup.css("top",e.$trigger.outerHeight(!0)+"px")};return s.fn.picker=function(e){var t,i=Array.prototype.slice.call(arguments,1),n=this.each(function(){var n=s(this),r=n.data("fu.picker"),c="object"==typeof e&&e;r||n.data("fu.picker",r=new p(this,c)),"string"==typeof e&&(t=r[e].apply(r,i))});return void 0===t?n:t},s.fn.picker.defaults={onAccept:void 0,onCancel:void 0,onExit:void 0,externalClickExceptions:[],explicit:!1},s.fn.picker.Constructor=p,s.fn.picker.noConflict=function(){return s.fn.picker=o,this},s.fn.picker});
//# sourceMappingURL=sourcemaps/picker.js.map
