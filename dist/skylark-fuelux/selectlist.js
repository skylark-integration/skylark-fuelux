/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins-base","skylark-domx-plugins-popups/select-list","./fuelux"],function(e,l,s,t){var i=e.fn.selectlist,n=t.Selectlist=s.inherit({klassName:"Selectlist",pluginName:"fuelux.selectlist"});return l.register(n,"selectlist"),e.fn.selectlist.Constructor=n,e.fn.selectlist.noConflict=function(){return e.fn.selectlist=i,this},e.fn.selectlist});
//# sourceMappingURL=sourcemaps/selectlist.js.map
