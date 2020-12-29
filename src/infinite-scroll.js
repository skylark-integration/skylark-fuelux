define([
  "skylark-domx-query",
  "skylark-domx-plugins",
  "skylark-domx-scrolls/InfiniteScroll",
   "./fuelux"
],function($,plugins,_InfiniteScroll,fuelux){

	/*
	 * Fuel UX InfiniteScroll
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.infinitescroll;

	var InfiniteScroll = fuelux.InfiniteScroll = _InfiniteScroll.inherit({
	    klassName: "Checkbox",

	    pluginName : "fuelux.infinitescroll"
	});


    plugins.register(InfiniteScroll,"infinitescroll");
    

	$.fn.infinitescroll.noConflict = function () {
		$.fn.infinitescroll = old;
		return this;
	};


	return $.fn.infinitescroll ;

});
