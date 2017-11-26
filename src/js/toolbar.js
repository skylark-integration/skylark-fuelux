define([
  "skylark-utils/langx",
  "skylark-utils/browser",
  "skylark-utils/eventer",
  "skylark-utils/noder",
  "skylark-utils/geom",
  "skylark-utils/query",
  "./sbswt"
],function(langx,browser,eventer,noder,geom,$,sbswt){

	function createButtons(list, buttons, element) {
		var group = $("<div></div>", { class: "btn-group", role: "group" });

		for (var i in list) {
			var name = list[i];
			var button = buttons[name];

			if (name === "space") {
				element.append(group);
				group = $("<div></div>", { class: "btn-group", role: "group" });
				continue;
			}

			var widget;
			switch (typeof button) {
				case "string": widget = "html"; break;
				case "object": widget = ("widget" in button ? button.widget : "button"); break;
			}

			switch (widget) {
				case "html":
					// Create an element with the HTML
					group.append(button);
					break;
				case "button":
					// Create button
					var obj = $('<button type="button" class="btn btn-default"></button>');

					// If has icon
					if ("icon" in button) {
						var icon = $("<span></span>", { class: button.icon });
						obj.append(icon);
						delete button.icon;
					}
					// If has text
					if ("text" in button) {
						obj.append(" " + button.text);
						delete button.text;
					}
					// Set attributes
					obj.attr(button);

					// Add button to the group
					group.append(obj);
					break;
				case "dropdown":
				case "dropup":
					// Create button
					var dropdown_group = $('<div class="btn-group" role="group"></div>');
					var dropdown_button = $('<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>');
					var dropdown_list = $('<ul class="dropdown-menu"></ul>');

					if(widget === "dropup")
						dropdown_group.addClass("dropup");

					// If has icon
					if ("icon" in button) {
						var icon = $("<span></span>", { class: button.icon });
						dropdown_button.append(icon);
						delete button.icon;
					}
					// If has text
					if ("text" in button) {
						dropdown_button.append(" " + button.text);
						delete button.text;
					}
					// Add caret
					dropdown_button.append(' <span class="caret"></span>');

					// Add list of options
					for(var i in button.list) {
						var dropdown_option = button.list[i];
						var dropdown_option_li = $('<li></li>');

						// If has icon
						if ("icon" in dropdown_option) {
							var icon = $("<span></span>", { class: dropdown_option.icon });
							dropdown_option_li.append(dropdown_option.icon);
							delete dropdown_option.icon;
						}

						// If has text
						if ("text" in dropdown_option) {
							dropdown_option_li.append(" " + dropdown_option.text);
							delete dropdown_option.text;
						}
						// Set attributes
						dropdown_option_li.attr(dropdown_option);

						// Add to dropdown list
						dropdown_list.append(dropdown_option_li);
					}
					
					// Set attributes
					dropdown_group.attr(button);

					dropdown_group.append(dropdown_button);
					dropdown_group.append(dropdown_list);
					group.append(dropdown_group);
					break;
				case "input":
					var input_group = $('<div class="input-group"></div>');
					var input_element = $('<input class="form-control">');
					
					// Add prefix addon
					if("prefix" in button) {
						var input_prefix = $('<span class="input-group-addon"></span>');
						input_prefix.html(button.prefix);
						input_group.append(input_prefix);
						delete button.prefix;
					}
					
					// Add input
					input_group.append(input_element);

					// Add sufix addon
					if("sufix" in button) {
						var input_sufix = $('<span class="input-group-addon"></span>');
						input_sufix.html(button.sufix);
						input_group.append(input_sufix);
						delete button.sufix;
					}

					// Set attributes
					input_element.attr(button);

					group.append(input_group);
					break;
				default:
					throw "Wrong widget button type";
			}
		}

		// Append the last group
		element.append(group);
	}

	var Toolbar = sbswt.Toolbar = sbswt.WidgetBase.inherit({
        klassName: "Toolbar",

        init : function(elm,options) {
			var self = this;
			this._options = langx.mixin({
					autoredraw: true,
					buttons: {},
					context: {},
					list: [],
					show: true,
			},options);


			this.$container = $('<nav class="navbar"/>');
			this.$el = $(elm).append(this.$container);

			this.render();
        },


		render : function () {
			function createToolbarItems(items,container) {
				langx.each(items,function(i,item)  {
					var type = item.type;
					if (!type) {
						type = "button";
					}
					switch (type) {
						case "buttongroup":
							// Create an element with the HTML
							createButtonGroup(item,container);
							break;
						case "button":
							createButton(item,container)
							break;
						case "dropdown":
						case "dropup":
							createDrop(item,container)
							break;
						case "input":
							createInput(item,container)
							break;
						default:
							throw "Wrong widget button type";
					}
				});

			}

			function createButtonGroup(item,container) {
				var  group = $("<div/>", { class: "btn-group", role: "group" });
				container.append(group);
				createToolbarItems(item.items,group);
				return group;
			}

			function createButton(item,container) {
				// Create button
				var button = $('<button type="button" class="btn btn-default"/>'),
					attrs = langx.mixin({},item);

				// If has icon
				if ("icon" in item) {
					button.append($("<span/>", { class: item.icon }));
					delete attrs.icon;
				}
				// If has text
				if ("text" in attrs) {
					button.append(" " + item.text);
					delete attrs.text;
				}

				button.attr(attrs);

				// Add button to the group
				container.append(button);

			}

			function createDrop(item,container) {
				// Create button
				var dropdown_group = $('<div class="btn-group" role="group"/>');
				var dropdown_button = $('<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"/>');
				var dropdown_list = $('<ul class="dropdown-menu"/>');

				var	attrs = langx.mixin({},item);

				if(item.type === "dropup") {
					dropdown_group.addClass("dropup");
				}

				// If has icon
				if ("icon" in item) {
					dropdown_button.append($("<span/>", { class: item.icon }));
					delete attrs.icon;
				}
				// If has text
				if ("text" in item) {
					dropdown_button.append(" " + item.text);
					delete attrs.text;
				}
				// Add caret
				dropdown_button.append(' <span class="caret"/>');

				// Add list of options
				for(var i in item.list) {
					var dropdown_option = item.list[i];
					var dropdown_option_li = $('<li/>');

					// If has icon
					if ("icon" in dropdown_option) {
						dropdown_option_li.append($("<span/>", { class: dropdown_option.icon }));
					}

					// If has text
					if ("text" in dropdown_option) {
						dropdown_option_li.append(" " + dropdown_option.text);
					}
					// Set attributes
					dropdown_option_li.attr(dropdown_option);

					// Add to dropdown list
					dropdown_list.append(dropdown_option_li);
				}
				
				// Set attributes
				dropdown_group.attr(attrs);

				dropdown_group.append(dropdown_button);
				dropdown_group.append(dropdown_list);
				container.append(dropdown_group);

			}

			function createInput(item,container) {
				var input_group = $('<div class="input-group"/>');
				var input_element = $('<input class="form-control"/>');
				
				var	attrs = langx.mixin({},item);

				// Add prefix addon
				if("prefix" in item) {
					var input_prefix = $('<span class="input-group-addon"/>');
					input_prefix.html(item.prefix);
					input_group.append(input_prefix);

					delete attrs.prefix;
				}
				
				// Add input
				input_group.append(input_element);

				// Add sufix addon
				if("sufix" in item) {
					var input_sufix = $('<span class="input-group-addon"/>');
					input_sufix.html(item.sufix);
					input_group.append(input_sufix);

					delete attrs.sufix;
				}

				attrs.type = attrs.inputType;

				delete attrs.inputType;

				// Set attributes
				input_element.attr(attrs);

				container.append(input_group);

			}

			var items = this._options.items;
			if (items) {
				createToolbarItems(items,this.$container);
			}
		}

	});


	$.fn.toolbar = function (options) {
		options = options || {};

		return this.each(function () {
			return new Toolbar(this, langx.mixin({}, options,true));
		});
	};

	return Toolbar;

});
