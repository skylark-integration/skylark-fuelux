/**
 * skylark-bs-swt - The skylark bootstrap standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.0-beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define(["skylark-utils/langx","skylark-utils/browser","skylark-utils/eventer","skylark-utils/noder","skylark-utils/geom","skylark-utils/velm","skylark-utils/query","../../tree","../../sbswt"],function(e,s,t,r,l,n,i,c,a){"use strict";if(!i.jstree.plugins.changed)return i.jstree.plugins.changed=function(e,s){var t=[];this.trigger=function(e,r){var l,n;if(r||(r={}),"changed"===e.replace(".jstree","")){r.changed={selected:[],deselected:[]};var i={};for(l=0,n=t.length;l<n;l++)i[t[l]]=1;for(l=0,n=r.selected.length;l<n;l++)i[r.selected[l]]?i[r.selected[l]]=2:r.changed.selected.push(r.selected[l]);for(l=0,n=t.length;l<n;l++)1===i[t[l]]&&r.changed.deselected.push(t[l]);t=r.selected.slice()}s.trigger.call(this,e,r)},this.refresh=function(e,r){return t=[],s.refresh.apply(this,arguments)}},i});
//# sourceMappingURL=../../sourcemaps/plugin/tree/changed.js.map
