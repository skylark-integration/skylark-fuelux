define([
  "skylark-domx-query",
  "skylark-domx-plugins",
  "skylark-domx-toggles/Radio",
   "./fuelux"
],function($,plugins,_Radio,fuelux){


	/*
	 * Fuel UX Radio
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.radio;

	var Radio = fuelux.Radio = _Radio.inherit({
	    klassName: "Radio",

	    pluginName : "fuelux.radio"
	});


    plugins.register(Radio,"radio");
    
	$.fn.radio.noConflict = function noConflict () {
		$.fn.radio = old;
		return this;
	};


	// DATA-API
	/*
	$(document).on('mouseover.fu.radio.data-api', '[data-initialize=radio]', function initializeRadios (e) {
		var $control = $(e.target);
		if (!$control.data('fu.radio')) {
			$control.radio($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function onReadyInitializeRadios () {
		$('[data-initialize=radio]').each(function initializeRadio () {
			var $this = $(this);
			if (!$this.data('fu.radio')) {
				$this.radio($this.data());
			}
		});
	});
	*/

	return $.fn.radio;
});
