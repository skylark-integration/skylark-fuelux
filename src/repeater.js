define([
  "skylark-domx-query",
  "skylark-domx-plugins",
  "skylark-widgets-repeater/Repeater",
  "skylark-widgets-repeater/views/TableView",
  "skylark-widgets-repeater/views/TileView",
   "./fuelux"
],function($,plugins,_Repeater,_TableView,_TileView,fuelux){

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
	        template : '<div class="clearfix repeater-thumbnail-cont" data-container="true" data-infinite="true" data-preserve="shallow"></div>'	
	    }
	});

	Repeater.addons = {
		"views" : {
	 		"thumbnail" : {
	 			"name" : "thumbnail",
	 			"ctor" : ThumbnailView
	 		},
	 		"list" : {
	 			"name" : "list",
	 			"ctor": ListView
	 		}
		}
	};
	return $.fn.repeater;

});
