/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins-base","skylark-domx-plugins-toggles/checkbox","./fuelux"],function(e,c,n,o){var k=e.fn.checkbox,x=o.Checkbox=n.inherit({klassName:"Checkbox",pluginName:"fuelux.checkbox"});return c.register(x,"checkbox"),e.fn.checkbox.noConflict=function(){return e.fn.checkbox=k,this},e.fn.checkbox});
//# sourceMappingURL=sourcemaps/checkbox.js.map
