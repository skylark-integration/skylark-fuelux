/**
 * skylark-swt - The skylark standard widget tookit
 * @author Hudaokeji, Inc.
 * @version v0.9.2.beta
 * @link https://github.com/skylarkui/skylark-bs-swt/
 * @license MIT
 */
define([
  "skylark-utils/langx",
  "skylark-utils/browser",
  "skylark-utils/eventer",
  "skylark-utils/noder",
  "skylark-utils/geom",
  "skylark-utils/query"
],function(langx,browser,eventer,noder,geom,$){

	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	$(document).on('click.fu.dropdown-autoflip', '[data-toggle=dropdown][data-flip]', function (event) {
		if ($(this).data().flip === "auto") {
			// have the drop down decide where to place itself
			_autoFlip($(this).next('.dropdown-menu'));
		}
	});

	// For pillbox suggestions dropdown
	$(document).on('suggested.fu.pillbox', function (event, element) {
		_autoFlip($(element));
		$(element).parent().addClass('open');
	});

	function _autoFlip(menu) {
		// hide while the browser thinks
		$(menu).css({
			visibility: "hidden"
		});

		// decide where to put menu
		if (dropUpCheck(menu)) {
			menu.parent().addClass("dropup");
		} else {
			menu.parent().removeClass("dropup");
		}

		// show again
		$(menu).css({
			visibility: "visible"
		});
	}

	function dropUpCheck(element) {
		// caching container
		var $container = _getContainer(element);

		// building object with measurementsances for later use
		var measurements = {};
		measurements.parentHeight = element.parent().outerHeight();
		measurements.parentOffsetTop = element.parent().offset().top;
		measurements.dropdownHeight = element.outerHeight();
		measurements.containerHeight = $container.overflowElement.outerHeight();

		// this needs to be different if the window is the container or another element is
		measurements.containerOffsetTop = (!!$container.isWindow) ? $container.overflowElement.scrollTop() : $container.overflowElement.offset().top;

		// doing the calculations
		measurements.fromTop = measurements.parentOffsetTop - measurements.containerOffsetTop;
		measurements.fromBottom = measurements.containerHeight - measurements.parentHeight - (measurements.parentOffsetTop - measurements.containerOffsetTop);

		// actual determination of where to put menu
		// false = drop down
		// true = drop up
		if (measurements.dropdownHeight < measurements.fromBottom) {
			return false;
		} else if (measurements.dropdownHeight < measurements.fromTop) {
			return true;
		} else if (measurements.dropdownHeight >= measurements.fromTop && measurements.dropdownHeight >= measurements.fromBottom) {
			// decide which one is bigger and put it there
			if (measurements.fromTop >= measurements.fromBottom) {
				return true;
			} else {
				return false;
			}

		}

	}

	function _getContainer(element) {
		var targetSelector = element.attr('data-target');
		var isWindow = true;
		var containerElement;

		if(!targetSelector) {
			// no selection so find the relevant ancestor
			langx.each(element.parents(), function (index, parentElement) {
				if ($(parentElement).css('overflow') !== 'visible') {
					containerElement = parentElement;
					isWindow = false;
					return false;
				}
			});
		}
		else if (targetSelector !== 'window') {
			containerElement = $(targetSelector);
			isWindow = false;
		}

		// fallback to window
		if (isWindow) {
			containerElement = window;
		}

		return {
				overflowElement: $(containerElement),
				isWindow: isWindow
		};
	}

	// register empty plugin
	$.fn.dropdownautoflip = function () {
		/* empty */
	};

});
