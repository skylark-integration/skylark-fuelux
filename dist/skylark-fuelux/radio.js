/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins-base","skylark-domx-plugins-toggles/radio","./fuelux"],function(i,r,a,n){var o=i.fn.radio,e=n.Radio=a.inherit({klassName:"Radio",pluginName:"fuelux.radio"});return r.register(e,"radio"),i.fn.radio.noConflict=function(){return i.fn.radio=o,this},i.fn.radio});
//# sourceMappingURL=sourcemaps/radio.js.map
