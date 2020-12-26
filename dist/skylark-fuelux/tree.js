/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-langx/langx","skylark-domx/browser","skylark-domx/eventer","skylark-domx/noder","skylark-domx/geom","skylark-domx/query","./fuelux"],function(e,t,n,r,l,i,a){var s=i.fn.tree,o=a.Tree=a.WidgetBase.inherit({klassName:"Tree",init:function(t,n){this.$element=i(t),this.options=e.mixin({},i.fn.tree.defaults,n),this.$element.attr("tabindex","0"),this.options.itemSelect&&this.$element.on("click.fu.tree",".tree-item",e.proxy(function(e){this.selectItem(e.currentTarget)},this)),this.$element.on("click.fu.tree",".tree-branch-name",e.proxy(function(e){this.toggleFolder(e.currentTarget)},this)),this.$element.on("click.fu.tree",".tree-overflow",e.proxy(function(e){this.populate(i(e.currentTarget))},this)),this.options.folderSelect&&(this.$element.addClass("tree-folder-select"),this.$element.off("click.fu.tree",".tree-branch-name"),this.$element.on("click.fu.tree",".icon-caret",e.proxy(function(e){this.toggleFolder(i(e.currentTarget).parent())},this)),this.$element.on("click.fu.tree",".tree-branch-name",e.proxy(function(e){this.selectFolder(i(e.currentTarget))},this))),this.$element.on("focus",function(){var e=i(this);d(e,e)}),this.$element.on("keydown",function(e){return f(i(this),e)}),this.render()},deselectAll:function(e){var t=e||this.$element,n=i(t).find(".tree-selected");return n.each(function(e,t){var n=i(t);u(n),p(n,n.find(".glyphicon"))}),n},destroy:function(){return this.$element.find("li:not([data-template])").remove(),this.$element.remove(),this.$element[0].outerHTML},render:function(){this.populate(this.$element)},populate:function(t,n){var r=this,l=t.hasClass("tree-overflow"),i=t.hasClass("tree")?t:t.parent(),a=i.hasClass("tree");l&&!a&&(i=i.parent());var s=i.data();l&&(s.overflow=t.data());var o=n||!1;l&&(a?t.replaceWith(i.find("> .tree-loader").remove()):t.remove());var d=i.find(".tree-loader:last");!1===o&&d.removeClass("hide hidden"),this.options.dataSource(s||{},function(t){e.each(t.data,function(t,n){var l=n.type;"folder"===n.type&&(l="branch");var s=r.$element.find("[data-template=tree"+l+"]:eq(0)").clone().removeClass("hide hidden").removeData("template").removeAttr("data-template");s.find(".tree-"+l+"-name > .tree-label").html(n.text||n.name),s.data(n);var o=n.attr||n.dataAttributes||[];e.each(o,function(e,t){switch(e){case"cssClass":case"class":case"className":s.addClass(t);break;case"data-icon":s.find(".icon-item").removeClass().addClass("icon-item "+t),s.attr(e,t);break;case"id":s.attr(e,t),s.attr("aria-labelledby",t+"-label"),s.find(".tree-branch-name > .tree-label").attr("id",t+"-label");break;default:s.attr(e,t)}}),a?i.append(s):i.find(".tree-branch-children:eq(0)").append(s)}),i.find(".tree-loader").addClass("hidden"),r.$element.trigger("loaded.fu.tree",i)})},selectTreeNode:function(t,n){var r={};r.$element=i(t);var l={};l.$elements=this.$element.find(".tree-selected"),l.dataForEvent=[],"folder"===n?(r.$element=r.$element.closest(".tree-branch"),r.$icon=r.$element.find(".icon-folder")):r.$icon=r.$element.find(".icon-item"),r.elementData=r.$element.data(),h(r.$element),l=this.options.multiSelect?function(t,n,r){e.each(r.$elements,function(e,t){var l=i(t);l[0]!==n.$element[0]&&r.dataForEvent.push(i(l).data())}),n.$element.hasClass("tree-selected")?(p(n.$element,n.$icon),r.eventType="deselected"):(m(n.$element,n.$icon),r.eventType="selected",r.dataForEvent.push(n.elementData));return r}(0,r,l):function(e,t,n){n.$elements[0]!==t.$element[0]?(e.deselectAll(e.$element),m(t.$element,t.$icon),n.eventType="selected",n.dataForEvent=[t.elementData]):(p(t.$element,t.$icon),n.eventType="deselected",n.dataForEvent=[]);return n}(this,r,l),c(this.$element,r.$element),this.$element.trigger(l.eventType+".fu.tree",{target:r.elementData,selected:l.dataForEvent}),r.$element.trigger("updated.fu.tree",{selected:l.dataForEvent,item:r.$element,eventType:l.eventType})},discloseFolder:function(e){var t=i(e).closest(".tree-branch"),n=t.find(".tree-branch-children"),r=n.eq(0);t.addClass("tree-open"),t.attr("aria-expanded","true"),r.removeClass("hide hidden"),t.find("> .tree-branch-header .icon-folder").eq(0).removeClass("glyphicon-folder-close").addClass("glyphicon-folder-open");var l=this.$element,a=function(){l.trigger("disclosedFolder.fu.tree",t.data())};n.children().length?a():(l.one("loaded.fu.tree",a),this.populate(n))},closeFolder:function(e){var t=i(e).closest(".tree-branch"),n=t.find(".tree-branch-children").eq(0);t.removeClass("tree-open"),t.attr("aria-expanded","false"),n.addClass("hidden"),t.find("> .tree-branch-header .icon-folder").eq(0).removeClass("glyphicon-folder-open").addClass("glyphicon-folder-close"),this.options.cacheItems||n.empty(),this.$element.trigger("closed.fu.tree",t.data())},toggleFolder:function(e){var t=i(e);t.find(".glyphicon-folder-close").length?this.discloseFolder(e):t.find(".glyphicon-folder-open").length&&this.closeFolder(e)},selectFolder:function(e){this.options.folderSelect&&this.selectTreeNode(e,"folder")},selectItem:function(e){this.options.itemSelect&&this.selectTreeNode(e,"item")},selectedItems:function(){var t=this.$element.find(".tree-selected"),n=[];return e.each(t,function(e,t){n.push(i(t).data())}),n},collapse:function(){var e=this,t=[];e.$element.on("closed.fu.tree",function n(r,l){t.push(l),0===e.$element.find(".tree-branch.tree-open:not('.hidden, .hide')").length&&(e.$element.trigger("closedAll.fu.tree",{tree:e.$element,reportedClosed:t}),e.$element.off("loaded.fu.tree",e.$element,n))}),e.$element.find(".tree-branch.tree-open:not('.hidden, .hide')").each(function(){e.closeFolder(this)})},discloseVisible:function(){var e=this,t=e.$element.find(".tree-branch:not('.tree-open, .hidden, .hide')"),n=[];e.$element.on("loaded.fu.tree",function r(l,i){n.push(i),n.length===t.length&&(e.$element.trigger("disclosedVisible.fu.tree",{tree:e.$element,reportedOpened:n}),e.$element.off("loaded.fu.tree",e.$element,r))}),e.$element.find(".tree-branch:not('.tree-open, .hidden, .hide')").each(function(){e.discloseFolder(i(this).find(".tree-branch-header"))})},discloseAll:function(){var e=this;void 0===e.$element.data("disclosures")&&e.$element.data("disclosures",0);var t=e.options.disclosuresUpperLimit>=1&&e.$element.data("disclosures")>=e.options.disclosuresUpperLimit;if(0===e.$element.find(".tree-branch:not('.tree-open, .hidden, .hide')").length)e.$element.trigger("disclosedAll.fu.tree",{tree:e.$element,disclosures:e.$element.data("disclosures")}),e.options.cacheItems||e.$element.one("closeAll.fu.tree",function(){e.$element.data("disclosures",0)});else{if(t&&(e.$element.trigger("exceededDisclosuresLimit.fu.tree",{tree:e.$element,disclosures:e.$element.data("disclosures")}),!e.$element.data("ignore-disclosures-limit")))return;e.$element.data("disclosures",e.$element.data("disclosures")+1),e.$element.one("disclosedVisible.fu.tree",function(){e.discloseAll()}),e.discloseVisible()}},refreshFolder:function(e){var t=e.closest(".tree-branch"),n=t.find(".tree-branch-children");n.eq(0).empty(),t.hasClass("tree-open")?this.populate(n,!1):this.populate(n,!0),this.$element.trigger("refreshedFolder.fu.tree",t.data())}});o.prototype.closeAll=o.prototype.collapse,o.prototype.openFolder=o.prototype.discloseFolder,o.prototype.getValue=o.prototype.selectedItems;var d=function(e,t){var n=t.find(".tree-selected:first");n.length<=0&&(n=t.find('li:not(".hidden"):first')),c(e,n)},c=function(e,t){!function(e,t){e.attr("tabindex",-1),e.find("li").attr("tabindex",-1),t&&t.length>0&&t.attr("tabindex",0)}(e,t),e.attr("aria-activedescendant",t.attr("id")),t.focus(),e.trigger("setFocus.fu.tree",t)},f=function(e,t){if(t.isDefaultPrevented()||t.isPropagationStopped())return!1;var n=t.originalEvent.target,r=i(n),l=r.hasClass("tree-open"),a=!1,s=!0,o=function(){e.trigger("keyboardNavigated.fu.tree",t,r)};switch(t.which){case 13:case 32:var f=e.hasClass("tree-folder-select"),h=r.hasClass("tree-branch"),u=r.hasClass("tree-item");s=!1,h?f?(e.one("selected.fu.tree deselected.fu.tree",o),e.tree("selectFolder",r.find(".tree-branch-header")[0])):(e.one("loaded.fu.tree closed.fu.tree",o),e.tree("toggleFolder",r.find(".tree-branch-header")[0])):u?(e.one("selected.fu.tree",o),e.tree("selectItem",r)):(m=i(r.prevAll().not(".hidden")[0]),r.click(),e.one("loaded.fu.tree",function(){$=i(m.nextAll().not(".hidden")[0]),c(e,$),o()})),a=!0;break;case 35:c(e,e.find('li:not(".hidden"):last')),a=!0;break;case 36:c(e,e.find('li:not(".hidden"):first')),a=!0;break;case 37:l?(s=!1,e.one("closed.fu.tree",o),e.tree("closeFolder",n)):c(e,i(r.parents("li")[0])),a=!0;break;case 38:var m=[];if((m=i(r.prevAll().not(".hidden")[0])).hasClass("tree-open")){var p=m.find('li:not(".hidden"):last');p.length>0&&(m=i(p[0]))}m.length<1&&(m=i(r.parents("li")[0])),c(e,m),a=!0;break;case 39:l?d(e,r):(s=!1,e.one("disclosed.fu.tree",o),e.tree("discloseFolder",n)),a=!0;break;case 40:var $=i(r.find('li:not(".hidden"):first')[0]);(!l||$.length<=0)&&($=i(r.nextAll().not(".hidden")[0])),$.length<1&&($=i(i(r.parents("li")[0]).nextAll().not(".hidden")[0])),c(e,$),a=!0;break;default:return!0}return a&&(t.preventDefault(),t.stopPropagation(),s&&o()),!0},h=function(e){e.attr("aria-selected",!0)},u=function(e){e.attr("aria-selected",!1)};function m(e,t){e.addClass("tree-selected"),"item"===e.data("type")&&t.hasClass("fueluxicon-bullet")&&t.removeClass("fueluxicon-bullet").addClass("glyphicon-ok")}function p(e,t){e.removeClass("tree-selected"),"item"===e.data("type")&&t.hasClass("glyphicon-ok")&&t.removeClass("glyphicon-ok").addClass("fueluxicon-bullet")}i.fn.tree=function(e){var t,n=Array.prototype.slice.call(arguments,1),r=this.each(function(){var r=i(this),l=r.data("fu.tree"),a="object"==typeof e&&e;l||(r.data("fu.tree",l=new o(this,a)),r.trigger("initialized.fu.tree")),"string"==typeof e&&(t=l[e].apply(l,n))});return void 0===t?r:t};return i.fn.tree.defaults={staticData:[],dataSource:function(e,t){this.staticData.length>0&&t({data:function e(t,n){if(i.isEmptyObject(t))return n;if(void 0===n)return!1;for(var r=0;r<n.length;r++){var l=n[r];if(l.attr&&t.attr&&l.attr.id===t.attr.id)return l.children;if(l.children){var a=e(t,l.children);if(a)return a}}return!1}(e,this.staticData)})},multiSelect:!1,cacheItems:!0,folderSelect:!0,itemSelect:!0,disclosuresUpperLimit:0},i.fn.tree.Constructor=o,i.fn.tree.noConflict=function(){return i.fn.tree=s,this},i.fn.tree});
//# sourceMappingURL=sourcemaps/tree.js.map
