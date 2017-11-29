/**
 * skylark-bs-swt - The skylark bootstrap standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.0-beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/langx","skylark-utils/browser","skylark-utils/eventer","skylark-utils/noder","skylark-utils/geom","skylark-utils/query","./sbswt"],function(e,t,i,o,s,n,l){var a="bsw",r=function(t){t=t||{};var i={selectors:{handle:".window-header",title:".window-title",body:".window-body",footer:".window-footer"},elements:{handle:null,title:null,body:null,footer:null},references:{body:n("body"),window:n(window)},effect:"fade",parseHandleForTitle:!0,maximized:!1,maximizable:!1,title:"No Title",bodyContent:"",footerContent:""};return this.options=e.mixin({},i,t,!0),this.initialize(this.options),this};r.prototype.initialize=function(e){var t=this;if(e.fromElement)e.fromElement instanceof jQuery?this.$el=e.clone?e.fromElement.clone():e.fromElement:e.fromElement instanceof Element?this.$el=e.clone?n(e.fromElement).clone():n(e.fromElement):this.$el=e.clone?n(e.fromElement).clone():n(e.fromElement);else{if(!e.template)throw new Error("No template specified for window.");this.$el=n(e.template)}this.$el.hasClass("window")||this.$el.addClass("window"),this.$el.data("window",this),this.$el.find(e.selectors.handle).length<=0&&this.$el.prepend('<div class="window-header"><h4 class="window-title"></h4></div>'),e.elements.handle=this.$el.find(e.selectors.handle),e.elements.title=this.$el.find(e.selectors.title),e.elements.body=this.$el.find(e.selectors.body),e.elements.footer=this.$el.find(e.selectors.footer),e.elements.title.html(e.title),e.maximizable&&(e.elements.buttons={},e.elements.buttons.maximize=n('<button data-maximize="window"><i class="glyphicon glyphicon-chevron-up"></i></button>'),e.elements.handle.prepend(e.elements.buttons.maximize),e.elements.buttons.restore=n('<button data-restore="window"><i class="glyphicon glyphicon-modal-window"></i></button>'),e.elements.handle.prepend(e.elements.buttons.restore)),t.$el.find("[data-dismiss=window]").length<=0&&e.elements.handle.prepend('<button type="button" class="close" data-dismiss="window" aria-hidden="true"><i class="glyphicon glyphicon-remove"></i></button>'),e.elements.body.html(e.bodyContent),e.elements.footer.html(e.footerContent),this.undock(),this.setSticky(e.sticky)},r.prototype.undock=function(){var e=this;this.$el.css("visibility","hidden"),this.$el.appendTo("body"),this.centerWindow(),/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)&&this.options.references.window.bind("orientationchange resize",function(t){e.centerWindow()}),this.$el.on("touchmove",function(e){e.stopPropagation()}),this.initHandlers(),this.$el.hide(),this.options.id?this.id=this.options.id:this.id="",this.show()},r.prototype.maximize=function(){this.$el.removeClass("minimized"),this.$el.addClass("maximized"),this.state="maximized";var e=0;this.options.window_manager&&(e=this.options.window_manager.getContainer().height()),this.$el.css({top:parseInt(n("body").css("padding-top"),10),left:0,right:0,bottom:e,maxWidth:"none",width:"auto",height:"auto"}),this.$el.trigger(a+".maximize")},r.prototype.restore=function(){this.$el.removeClass("minimized"),this.$el.removeClass("maximized"),this.$el.removeAttr("style"),this.state=void 0,this.$el.css({top:this.window_info.top,left:this.window_info.left,width:this.window_info.width,height:this.window_info.height}),this.$el.removeProp("style"),this.$el.trigger(a+".restore")},r.prototype.show=function(e){var t=this;this.$el.css("visibility","visible");var i=function(){t.$el.trigger(a+".show"),e&&e.call(t,arguments)};"fade"===this.options.effect?this.$el.fadeIn(void 0,void 0,i):i.call(this.$el)},r.prototype.setEffect=function(e){this.options.effect=e},r.prototype.getEffect=function(){return this.options.effect},r.prototype.centerWindow=function(){var e,t,i,o=parseInt(this.options.references.body.position().top,10)+parseInt(this.options.references.body.css("paddingTop"),10);this.options.sticky?(t=this.options.references.window.width()/2-this.$el.width()/2,e=this.options.references.window.height()/2-this.$el.height()/2):(t=this.options.references.window.width()/2-this.$el.width()/2,e=this.options.references.window.height()/2-this.$el.height()/2),e<o&&(e=o),i=this.options.references.window.height()-o-(parseInt(this.options.elements.handle.css("height"),10)+parseInt(this.options.elements.footer.css("height"),10))-45,this.options.elements.body.css("maxHeight",i),this.$el.css("left",t),this.$el.css("top",e),this.$el&&this.$el.length>0&&(this.window_info={top:this.$el.position().top,left:this.$el.position().left,width:this.$el.outerWidth(),height:this.$el.outerHeight()}),this.$el.trigger(a+".centerWindow")},r.prototype.close=function(e){var t=this;this.options.parent?(this.options.parent.clearBlocker(),this.options.window_manager&&this.options.window_manager.setFocused(this.options.parent)):this.options.window_manager&&this.options.window_manager.windows.length>0&&this.options.window_manager.setNextFocused();var i=function(){t.$el.trigger(a+".close"),t.$el.remove(),e&&e.call(t)};"fade"===this.options.effect?this.$el.fadeOut(i):i.call(t.$el),this.$windowTab&&("fade"===this.options.effect?this.$windowTab.fadeOut(400,function(){t.$windowTab.remove()}):(this.$windowTab.hide(),this.$windowTab.remove()))},r.prototype.on=function(){this.$el.on.apply(this.$el,arguments)},r.prototype.sendToBack=function(){var e=!1;return this.options.window_manager&&(e=this.options.window_manager.sendToBack(this)),e},r.prototype.setActive=function(e){e?(this.$el.addClass("active"),this.$windowTab&&this.$windowTab.addClass("label-primary"),this.$el.trigger("active")):(this.$el.removeClass("active"),this.$windowTab&&(this.$windowTab.removeClass("label-primary"),this.$windowTab.addClass("label-default")),this.$el.trigger("inactive"))},r.prototype.setIndex=function(e){this.$el.css("zIndex",e)},r.prototype.setWindowTab=function(e){this.$windowTab=e},r.prototype.getWindowTab=function(){return this.$windowTab},r.prototype.getTitle=function(){return this.options.title},r.prototype.getElement=function(){return this.$el},r.prototype.setSticky=function(e){this.options.sticky=e,e===!1?this.$el.css({position:"absolute"}):this.$el.css({position:"fixed"})},r.prototype.getSticky=function(){return this.options.sticky},r.prototype.setManager=function(e){this.options.window_manager=e},r.prototype.initHandlers=function(){var e=this;this.$el.find("[data-dismiss=window]").on("click",function(t){t.stopPropagation(),t.preventDefault(),e.options.blocker||e.close()}),this.$el.find("[data-maximize=window]").on("click",function(t){t.stopPropagation(),t.preventDefault(),e.options.blocker||e.maximize()}),this.$el.find("[data-restore=window]").on("click",function(t){e.options.blocker||e.restore()}),this.$el.off("mousedown"),this.$el.on("mousedown",function(){return e.options.blocker?(e.options.blocker.getElement().trigger("focused"),void e.options.blocker.blink()):(e.$el.trigger("focused"),void((e.$el.hasClass("ns-resize")||e.$el.hasClass("ew-resize"))&&(n("body > *").addClass("disable-select"),e.resizing=!0,e.offset={},e.offset.x=event.pageX,e.offset.y=event.pageY,e.window_info={top:e.$el.position().top,left:e.$el.position().left,width:e.$el.outerWidth(),height:e.$el.outerHeight()},event.offsetY<5&&e.$el.addClass("north"),event.offsetY>e.$el.height()-5&&e.$el.addClass("south"),event.offsetX<5&&e.$el.addClass("west"),event.offsetX>e.$el.width()-5&&e.$el.addClass("east"))))}),e.options.references.body.on("mouseup",function(){e.resizing=!1,n("body > *").removeClass("disable-select"),e.$el.removeClass("west"),e.$el.removeClass("east"),e.$el.removeClass("north"),e.$el.removeClass("south")}),e.options.elements.handle.off("mousedown"),e.options.elements.handle.on("mousedown",function(t){e.options.blocker||(e.moving=!0,e.offset={},e.offset.x=t.pageX-e.$el.position().left,e.offset.y=t.pageY-e.$el.position().top,n("body > *").addClass("disable-select"))}),e.options.elements.handle.on("mouseup",function(t){e.moving=!1,n("body > *").removeClass("disable-select")}),e.options.references.body.on("mousemove",e.$el,function(t){if(e.moving&&"maximized"!==e.state&&(n(t.toElement).hasClass(e.options.selectors.handle.replace(".",""))||n(t.toElement).hasClass(e.options.selectors.title.replace(".","")))){e.options.elements.handle.position().top,e.options.elements.handle.position().left;e.$el.css("top",t.pageY-e.offset.y),e.window_info.top=t.pageY-e.offset.y,e.$el.css("left",t.pageX-e.offset.x),e.window_info.left=t.pageX-e.offset.x,e.window_info.width=e.$el.outerWidth(),e.window_info.height=e.$el.outerHeight()}e.options.resizable&&e.resizing&&(e.$el.hasClass("east")&&e.$el.css("width",t.pageX-e.window_info.left),e.$el.hasClass("west")&&(e.$el.css("left",t.pageX),e.$el.css("width",e.window_info.width+(e.window_info.left-t.pageX))),e.$el.hasClass("south")&&e.$el.css("height",t.pageY-e.window_info.top),e.$el.hasClass("north")&&(e.$el.css("top",t.pageY),e.$el.css("height",e.window_info.height+(e.window_info.top-t.pageY))))}),this.$el.on("mousemove",function(t){e.options.blocker||e.options.resizable&&(t.offsetY>e.$el.height()-5||t.offsetY<5?e.$el.addClass("ns-resize"):e.$el.removeClass("ns-resize"),t.offsetX>e.$el.width()-5||t.offsetX<5?e.$el.addClass("ew-resize"):e.$el.removeClass("ew-resize"))})},r.prototype.resize=function(e){e=e||{},e.top&&this.$el.css("top",e.top),e.left&&this.$el.css("left",e.left),e.height&&this.$el.css("height",e.height),e.width&&this.$el.css("width",e.width),this.$el.trigger(a+".resize")},r.prototype.setBlocker=function(e){this.options.blocker=e,this.$el.find(".disable-shade").remove();var t='<div class="disable-shade"></div>';this.options.elements.body.append(t),this.options.elements.body.addClass("disable-scroll"),this.options.elements.footer.append(t),"fade"===this.options.effect?this.$el.find(".disable-shade").fadeIn():this.$el.find(".disable-shade").show(),this.options.blocker.getParent()||this.options.blocker.setParent(this)},r.prototype.getBlocker=function(){return this.options.blocker},r.prototype.clearBlocker=function(){this.options.elements.body.removeClass("disable-scroll"),"fade"===this.options.effect?this.$el.find(".disable-shade").fadeOut(function(){this.remove()}):(this.$el.find(".disable-shade").hide(),this.remove()),delete this.options.blocker},r.prototype.setParent=function(e){this.options.parent=e,this.options.parent.getBlocker()||this.options.parent.setBlocker(this)},r.prototype.getParent=function(){return this.options.parent},r.prototype.blink=function(){var e=this,t=this.$el.hasClass("active"),i=this.getWindowTab(),o=i?i.hasClass("label-primary"):void 0,s=setInterval(function(){e.$el.toggleClass("active"),i&&i.toggleClass("label-primary")},250);setTimeout(function(){clearInterval(s),t&&e.$el.addClass("active"),i&&o&&i.addClass("label-primary")},1e3)},n.fn.window=function(t){t=t||{};var i,o=e.mixin({fromElement:this,selectors:{}},t||{});if("object"==typeof t)o.selectors.handle&&this.find(o.selectors.handle).css("cursor","move"),i=new r(e.mixin({},o,o));else if("string"==typeof t)switch(t){case"close":this.data("window").close();break;case"show":this.data("window").show();break;case"maximize":this.data("window").maximize()}return this},n("[data-window-target]").off("click"),n("[data-window-target]").on("click",function(){var e=n(this),t={selectors:{}};e.data("windowTitle")&&(t.title=e.data("windowTitle")),e.data("titleHandle")&&(t.selectors.title=e.data("titleHandle")),e.data("windowHandle")&&(t.selectors.handle=e.data("windowHandle")),e.data("clone")&&(t.clone=e.data("windowHandle")),n(e.data("windowTarget")).window(t)});var d=r.WindowManger=function(e){return this.windows=[],e=e||{},this.initialize(e),this};return d.prototype.findWindowByID=function(t){var i=null;return e.each(this.windows,function(e,o){console.log(arguments),o.id===t&&(i=o)}),i},d.prototype.destroyWindow=function(t){var i=this,o=!1;return e.each(this.windows,function(e,s){s===t&&(t.close(),i.windows.splice(e,1),i.resortWindows(),o=!0)}),o},d.prototype.closeWindow=d.prototype.destroyWindow,d.prototype.resortWindows=function(){var t=900;e.each(this.windows,function(e,i){i.setIndex(t+e)})},d.prototype.setFocused=function(t){for(var i;t.getBlocker();)t=t.getBlocker();e.each(this.windows,function(e,o){o.setActive(!1),o===t&&(i=e)}),this.windows.push(this.windows.splice(i,1)[0]),t.setActive(!0),this.resortWindows()},d.prototype.sendToBack=function(e){var t=this.windows.splice(this.windows.indexOf(e),1)[0];return this.windows.unshift(t),this.resortWindows(),!0},d.prototype.initialize=function(e){this.options=e,this.elements={},this.options.container&&(this.elements.container=n(this.options.container),this.elements.container.addClass("window-pane"))},d.prototype.getContainer=function(){var e;return this.elements&&this.elements.container&&(e=this.elements.container),e},d.prototype.setNextFocused=function(){this.setFocused(this.windows[this.windows.length-1])},d.prototype.addWindow=function(e){var t=this;return e.getElement().on("focused",function(i){t.setFocused(e)}),e.getElement().on("close",function(){t.destroyWindow(e),e.getWindowTab()&&e.getWindowTab().remove()}),e.on("bsw.restore",function(){t.resortWindows()}),this.options.container&&(e.setWindowTab(n('<span class="label label-default">'+e.getTitle()+'<button class="close">x</button></span>')),e.getWindowTab().find(".close").on("click",function(t){var i=e.getBlocker();i?i.blink():e.close()}),e.getWindowTab().on("click",function(i){var o=e.getBlocker();o?o.blink():(t.setFocused(e),e.getSticky()&&window.scrollTo(0,e.getElement().position().top))}),n(this.options.container).append(e.getWindowTab())),this.windows.push(e),e.setManager(this),this.setFocused(e),e},d.prototype.createWindow=function(t){var i=e.mixin({},t);this.options.windowTemplate&&!i.template&&(i.template=this.options.windowTemplate);var o=new r(i);return this.addWindow(o)},e.mixin(l,{Window:r,WindowManager:d}),r});
//# sourceMappingURL=sourcemaps/window.js.map
