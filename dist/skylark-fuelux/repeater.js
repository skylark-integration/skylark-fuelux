/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins","skylark-domx-repeater/Repeater","skylark-domx-repeater/views/TableView","skylark-domx-repeater/views/TileView","./fuelux"],function(e,a,r,i,t,s){var l=e.fn.repeater,n=s.Repeater=r.inherit({klassName:"Repeater",pluginName:"fuelux.repeater",options:{addons:{views:["list","thumbnail"]}}});a.register(n,"repeater"),e.fn.repeater.Constructor=n,e.fn.repeater.noConflict=function(){return e.fn.repeater=l,this};var p=s.ListView=i.inherit({klassName:"ListView",pluginName:"fuelux.listview",options:{viewClass:"repeater-list",tableWrapperClass:"repeater-list-wrapper",checkClass:"repeater-list-check",headingClass:"repeater-list-heading",actionsPlaceHolderClass:"repeater-list-actions-placeholder"}}),o=s.ThumbnailView=t.inherit({klassName:"ThumbnailView",pluginName:"fuelux.thumbnailview",options:{viewClass:"repeater-thumbnail-cont"}});return n.addons={views:{thumbnail:{name:"thumbnail",ctor:o},list:{name:"list",ctor:p}}},e.fn.repeater});
//# sourceMappingURL=sourcemaps/repeater.js.map
