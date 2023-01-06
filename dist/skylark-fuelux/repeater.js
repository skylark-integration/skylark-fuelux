/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins-base","skylark-domx-plugins-repeaters/repeater","skylark-domx-plugins-repeaters/views/table-view","skylark-domx-plugins-repeaters/views/tile-view","skylark-domx-plugins-repeaters/view-type-registry","./fuelux"],function(e,r,a,i,t,s,l){var n=e.fn.repeater,p=l.Repeater=a.inherit({klassName:"Repeater",pluginName:"fuelux.repeater",options:{addons:{views:["list","thumbnail"]}}});r.register(p,"repeater"),e.fn.repeater.Constructor=p,e.fn.repeater.noConflict=function(){return e.fn.repeater=n,this};var u=l.ListView=i.inherit({klassName:"ListView",pluginName:"fuelux.listview",options:{viewClass:"repeater-list",tableWrapperClass:"repeater-list-wrapper",checkClass:"repeater-list-check",headingClass:"repeater-list-heading",actionsPlaceHolderClass:"repeater-list-actions-placeholder"}}),o=l.ThumbnailView=t.inherit({klassName:"ThumbnailView",pluginName:"fuelux.thumbnailview",options:{viewClass:"repeater-thumbnail-cont"}});return s.thumbnail={name:"thumbnail",ctor:o},s.list={name:"list",ctor:u},e.fn.repeater});
//# sourceMappingURL=sourcemaps/repeater.js.map
