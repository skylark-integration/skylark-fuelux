/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins","skylark-domx-popups/Combobox","./fuelux"],function(o,b,n,m){var x=o.fn.combobox,r=m.Combobox=n.inherit({klassName:"Combobox",pluginName:"fuelux.combobox"});return b.register(r,"combobox"),o.fn.combobox.Constructor=r,o.fn.combobox.noConflict=function(){return o.fn.combobox=x,this},o.fn.combobox});
//# sourceMappingURL=sourcemaps/combobox.js.map
