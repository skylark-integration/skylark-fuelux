/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins","skylark-domx-toggles/Radio","./fuelux"],function(i,r,o,a){var n=i.fn.radio,d=a.Radio=o.inherit({klassName:"Radio",pluginName:"fuelux.radio"});return r.register(d,"radio"),i.fn.radio.noConflict=function(){return i.fn.radio=n,this},i.fn.radio});
//# sourceMappingURL=sourcemaps/radio.js.map
