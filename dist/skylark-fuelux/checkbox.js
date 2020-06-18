/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylarkui/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins","skylark-domx-toggles/Checkbox","./fuelux"],function(e,c,o,k){var n=e.fn.checkbox,x=k.Checkbox=o.inherit({klassName:"Checkbox",pluginName:"fuelux.checkbox"});return c.register(x,"checkbox"),e.fn.checkbox.noConflict=function(){return e.fn.checkbox=n,this},e.fn.checkbox});
//# sourceMappingURL=sourcemaps/checkbox.js.map
