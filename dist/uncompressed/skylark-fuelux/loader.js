define([
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Loader
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */


	var old = $.fn.loader;

	// LOADER CONSTRUCTOR AND PROTOTYPE

	var Loader = fuelux.Loader = fuelux.WidgetBase.inherit({
		klassName: "Loader",

		init : function(element,options) {
			this.$element = $(element);
			this.options = langx.mixin({}, $.fn.loader.defaults, options);
		},
		destroy: function () {
			this.$element.remove();
			// any external bindings
			// [none]
			// empty elements to return to original markup
			// [none]
			// returns string of markup
			return this.$element[0].outerHTML;
		},

		ieRepaint: function () {},

		msieVersion: function () {},

		next: function () {},

		pause: function () {},

		play: function () {},

		previous: function () {},

		reset: function () {}
	});

	// LOADER PLUGIN DEFINITION

	$.fn.loader = function (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.loader');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.loader', (data = new Loader(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.loader.defaults = {};

	$.fn.loader.Constructor = Loader;

	$.fn.loader.noConflict = function () {
		$.fn.loader = old;
		return this;
	};

	// INIT LOADER ON DOMCONTENTLOADED
	/*
	$(function () {
		$('[data-initialize=loader]').each(function () {
			var $this = $(this);
			if (!$this.data('fu.loader')) {
				$this.loader($this.data());
			}
		});
	});
	*/

	return $.fn.loader;
});
