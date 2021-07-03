/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins-base","skylark-domx-plugins-scrolls/infinite-scroll","./fuelux"],function(i,n,l,e){var r=i.fn.infinitescroll,s=e.InfiniteScroll=l.inherit({klassName:"Checkbox",pluginName:"fuelux.infinitescroll"});return n.register(s,"infinitescroll"),i.fn.infinitescroll.noConflict=function(){return i.fn.infinitescroll=r,this},i.fn.infinitescroll});
//# sourceMappingURL=sourcemaps/infinite-scroll.js.map
