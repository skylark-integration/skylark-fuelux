/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylarkui/skylark-fuelux/
 * @license MIT
 */
define(["skylark-domx-query","skylark-domx-plugins","skylark-domx-panels/Wizard","./fuelux"],function(r,i,n,a){var e=r.fn.wizard,d=a.Wizard=n.inherit({klassName:"Checkbox",pluginName:"fuelux.wizard"});return i.register(d,"wizard"),r.fn.wizard.noConflict=function(){return r.fn.wizard=e,this},r.fn.wizard});
//# sourceMappingURL=sourcemaps/wizard.js.map
