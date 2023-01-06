define([
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-repeaters/repeater",
  "skylark-domx-plugins-repeaters/views/table-view",
  "skylark-domx-plugins-repeaters/views/tile-view",
  "skylark-domx-plugins-repeaters/view-type-registry",   
   "./fuelux"
],function($,plugins,_Repeater,_TableView,_TileView,viewTypeRegistry,fuelux){

	/*
	 * Repeater
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.repeater;

	// REPEATER CONSTRUCTOR AND PROTOTYPE



	var Repeater = fuelux.Repeater = _Repeater.inherit({
	    klassName: "Repeater",

	    pluginName : "fuelux.repeater",

	    options : {
			addons : {
				views : ["list","thumbnail"]
			}	    	
	    }
	});

    plugins.register(Repeater,"repeater");


	$.fn.repeater.Constructor = Repeater;

	$.fn.repeater.noConflict = function noConflict () {
		$.fn.repeater = old;
		return this;
	};

	var ListView = fuelux.ListView = _TableView.inherit({
	    klassName: "ListView",

	    pluginName : "fuelux.listview",

	    options: {
	        viewClass : "repeater-list",
	        tableWrapperClass : "repeater-list-wrapper",
	        checkClass : "repeater-list-check",
	        headingClass : "repeater-list-heading",
	        actionsPlaceHolderClass : "repeater-list-actions-placeholder"
	    }

	});

	var ThumbnailView = fuelux.ThumbnailView = _TileView.inherit({
	    klassName: "ThumbnailView",

	    pluginName : "fuelux.thumbnailview",

	    options: {
	        viewClass : "repeater-thumbnail-cont"
	    }
	});

    viewTypeRegistry["thumbnail"] = {
        name : "thumbnail",
        ctor : ThumbnailView
    };

    viewTypeRegistry["list"] = {
        name : "list",
        ctor : ListView
    };

	return $.fn.repeater;

});
