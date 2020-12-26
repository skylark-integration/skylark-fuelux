define([
  "skylark-domx-query",
  "skylark-domx-plugins",
  "skylark-domx-popups/Selectlist",
   "./fuelux"
],function($,plugins,_Selectlist,fuelux){



	/*
	 * Fuel UX Selectlist
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.selectlist;
	
	var Selectlist = fuelux.Selectlist = _Selectlist.inherit({
	    klassName: "Selectlist",

	    pluginName : "fuelux.selectlist"
	});


    plugins.register(Selectlist,"selectlist");


	$.fn.selectlist.Constructor = Selectlist;

	$.fn.selectlist.noConflict = function () {
		$.fn.selectlist = old;
		return this;
	};


	// DATA-API

	/*
	$(document).on('mousedown.fu.selectlist.data-api', '[data-initialize=selectlist]', function (e) {
		var $control = $(e.target).closest('.selectlist');
		if (!$control.data('fu.selectlist')) {
			$control.selectlist($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=selectlist]').each(function () {
			var $this = $(this);
			if (!$this.data('fu.selectlist')) {
				$this.selectlist($this.data());
			}
		});
	});

	*/

	return $.fn.selectlist;
});
