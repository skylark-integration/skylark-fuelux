define([
  "skylark-domx-query",
  "skylark-domx-plugins",
  "skylark-domx-popups/Combobox",
   "./fuelux"
],function($,plugins,_Combobox,fuelux){
	/*
	 * Fuel UX Combobox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.combobox;
	
	var Combobox = fuelux.Combobox = _Combobox.inherit({
	    klassName: "Combobox",

	    pluginName : "fuelux.combobox"
	});


    plugins.register(Combobox,"combobox");


	$.fn.combobox.Constructor = Combobox;

	$.fn.combobox.noConflict = function () {
		$.fn.combobox = old;
		return this;
	};

	// DATA-API

	/*

	$(document).on('mousedown.fu.combobox.data-api', '[data-initialize=combobox]', function (e) {
		var $control = $(e.target).closest('.combobox');
		if (!$control.data('fu.combobox')) {
			$control.combobox($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=combobox]').each(function () {
			var $this = $(this);
			if (!$this.data('fu.combobox')) {
				$this.combobox($this.data());
			}
		});
	});
	*/

	return $.fn.combobox;
});

