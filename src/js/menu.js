define([
  "skylark-utils/langx",
  "skylark-utils/browser",
  "skylark-utils/eventer",
  "skylark-utils/noder",
  "skylark-utils/geom",
  "skylark-utils/velm",
  "skylark-utils/query",
  "./sbswt"
],function(langx,browser,eventer,noder,geom,velm,$,sbswt){

	var right_to_left = false,
		vakata_context = {
			element		: false,
			reference	: false,
			position_x	: 0,
			position_y	: 0,
			items		: [],
			html		: "",
			is_visible	: false
		};

	var menu = {
		settings : {
			hide_onmouseleave	: 0,
			icons				: true
		},
		_trigger : function (event_name) {
			$(document).trigger("context_" + event_name + ".vakata", {
				"reference"	: vakata_context.reference,
				"element"	: vakata_context.element,
				"position"	: {
					"x" : vakata_context.position_x,
					"y" : vakata_context.position_y
				}
			});
		},
		_execute : function (i) {
			i = vakata_context.items[i];
			return i && (!i._disabled || ($.isFunction(i._disabled) && !i._disabled({ "item" : i, "reference" : vakata_context.reference, "element" : vakata_context.element }))) && i.action ? i.action.call(null, {
						"item"		: i,
						"reference"	: vakata_context.reference,
						"element"	: vakata_context.element,
						"position"	: {
							"x" : vakata_context.position_x,
							"y" : vakata_context.position_y
						}
					}) : false;
		},
		_parse : function (o, is_callback) {
			if(!o) { return false; }
			if(!is_callback) {
				vakata_context.html		= "";
				vakata_context.items	= [];
			}
			var str = "",
				sep = false,
				tmp;

			if(is_callback) { str += "<"+"ul>"; }
			$.each(o, function (i, val) {
				if(!val) { return true; }
				vakata_context.items.push(val);
				if(!sep && val.separator_before) {
					str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
				}
				sep = false;
				str += "<"+"li class='" + (val._class || "") + (val._disabled === true || ($.isFunction(val._disabled) && val._disabled({ "item" : val, "reference" : vakata_context.reference, "element" : vakata_context.element })) ? " vakata-contextmenu-disabled " : "") + "' "+(val.shortcut?" data-shortcut='"+val.shortcut+"' ":'')+">";
				str += "<"+"a href='#' rel='" + (vakata_context.items.length - 1) + "' " + (val.title ? "title='" + val.title + "'" : "") + ">";
				if($.vakata.context.settings.icons) {
					str += "<"+"i ";
					if(val.icon) {
						if(val.icon.indexOf("/") !== -1 || val.icon.indexOf(".") !== -1) { str += " style='background:url(\"" + val.icon + "\") center center no-repeat' "; }
						else { str += " class='" + val.icon + "' "; }
					}
					str += "><"+"/i><"+"span class='vakata-contextmenu-sep'>&#160;<"+"/span>";
				}
				str += ($.isFunction(val.label) ? val.label({ "item" : i, "reference" : vakata_context.reference, "element" : vakata_context.element }) : val.label) + (val.shortcut?' <span class="vakata-contextmenu-shortcut vakata-contextmenu-shortcut-'+val.shortcut+'">'+ (val.shortcut_label || '') +'</span>':'') + "<"+"/a>";
				if(val.submenu) {
					tmp = $.vakata.context._parse(val.submenu, true);
					if(tmp) { str += tmp; }
				}
				str += "<"+"/li>";
				if(val.separator_after) {
					str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
					sep = true;
				}
			});
			str  = str.replace(/<li class\='vakata-context-separator'\><\/li\>$/,"");
			if(is_callback) { str += "</ul>"; }
			/**
			 * triggered on the document when the contextmenu is parsed (HTML is built)
			 * @event
			 * @plugin contextmenu
			 * @name context_parse.vakata
			 * @param {jQuery} reference the element that was right clicked
			 * @param {jQuery} element the DOM element of the menu itself
			 * @param {Object} position the x & y coordinates of the menu
			 */
			if(!is_callback) { vakata_context.html = str; $.vakata.context._trigger("parse"); }
			return str.length > 10 ? str : false;
		},
		_show_submenu : function (o) {
			o = $(o);
			if(!o.length || !o.children("ul").length) { return; }
			var e = o.children("ul"),
				xl = o.offset().left,
				x = xl + o.outerWidth(),
				y = o.offset().top,
				w = e.width(),
				h = e.height(),
				dw = $(window).width() + $(window).scrollLeft(),
				dh = $(window).height() + $(window).scrollTop();
			// може да се спести е една проверка - дали няма някой от класовете вече нагоре
			if(right_to_left) {
				o[x - (w + 10 + o.outerWidth()) < 0 ? "addClass" : "removeClass"]("vakata-context-left");
			}
			else {
				o[x + w > dw  && xl > dw - x ? "addClass" : "removeClass"]("vakata-context-right");
			}
			if(y + h + 10 > dh) {
				e.css("bottom","-1px");
			}

			//if does not fit - stick it to the side
			if (o.hasClass('vakata-context-right')) {
				if (xl < w) {
					e.css("margin-right", xl - w);
				}
			} else {
				if (dw - x < w) {
					e.css("margin-left", dw - x - w);
				}
			}

			e.show();
		},
		show : function (reference, position, data) {
			var o, e, x, y, w, h, dw, dh, cond = true;
			if(vakata_context.element && vakata_context.element.length) {
				vakata_context.element.width('');
			}
			switch(cond) {
				case (!position && !reference):
					return false;
				case (!!position && !!reference):
					vakata_context.reference	= reference;
					vakata_context.position_x	= position.x;
					vakata_context.position_y	= position.y;
					break;
				case (!position && !!reference):
					vakata_context.reference	= reference;
					o = reference.offset();
					vakata_context.position_x	= o.left + reference.outerHeight();
					vakata_context.position_y	= o.top;
					break;
				case (!!position && !reference):
					vakata_context.position_x	= position.x;
					vakata_context.position_y	= position.y;
					break;
			}
			if(!!reference && !data && $(reference).data('vakata_contextmenu')) {
				data = $(reference).data('vakata_contextmenu');
			}
			if($.vakata.context._parse(data)) {
				vakata_context.element.html(vakata_context.html);
			}
			if(vakata_context.items.length) {
				vakata_context.element.appendTo(document.body);
				e = vakata_context.element;
				x = vakata_context.position_x;
				y = vakata_context.position_y;
				w = e.width();
				h = e.height();
				dw = $(window).width() + $(window).scrollLeft();
				dh = $(window).height() + $(window).scrollTop();
				if(right_to_left) {
					x -= (e.outerWidth() - $(reference).outerWidth());
					if(x < $(window).scrollLeft() + 20) {
						x = $(window).scrollLeft() + 20;
					}
				}
				if(x + w + 20 > dw) {
					x = dw - (w + 20);
				}
				if(y + h + 20 > dh) {
					y = dh - (h + 20);
				}

				vakata_context.element
					.css({ "left" : x, "top" : y })
					.show()
					.find('a').first().focus().parent().addClass("vakata-context-hover");
				vakata_context.is_visible = true;
				/**
				 * triggered on the document when the contextmenu is shown
				 * @event
				 * @plugin contextmenu
				 * @name context_show.vakata
				 * @param {jQuery} reference the element that was right clicked
				 * @param {jQuery} element the DOM element of the menu itself
				 * @param {Object} position the x & y coordinates of the menu
				 */
				this._trigger("show");
			}
		},
		hide : function () {
			if(vakata_context.is_visible) {
				vakata_context.element.hide().find("ul").hide().end().find(':focus').blur().end().detach();
				vakata_context.is_visible = false;
				/**
				 * triggered on the document when the contextmenu is hidden
				 * @event
				 * @plugin contextmenu
				 * @name context_hide.vakata
				 * @param {jQuery} reference the element that was right clicked
				 * @param {jQuery} element the DOM element of the menu itself
				 * @param {Object} position the x & y coordinates of the menu
				 */
				this._trigger("hide");
			}
		}
	};
	$(function () {
		right_to_left = $(document.body).css("direction") === "rtl";
		var to = false;

		vakata_context.element = $("<ul class='vakata-context'></ul>");
		vakata_context.element
			.on("mouseenter", "li", function (e) {
				e.stopImmediatePropagation();

				if(noder.contains(this, e.relatedTarget)) {
					// премахнато заради delegate mouseleave по-долу
					// $(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
					return;
				}

				if(to) { clearTimeout(to); }
				vakata_context.element.find(".vakata-context-hover").removeClass("vakata-context-hover").end();

				$(this)
					.siblings().find("ul").hide().end().end()
					.parentsUntil(".vakata-context", "li").addBack().addClass("vakata-context-hover");
				$.vakata.context._show_submenu(this);
			})
			// тестово - дали не натоварва?
			.on("mouseleave", "li", function (e) {
				if(noder.contains(this, e.relatedTarget)) { return; }
				$(this).find(".vakata-context-hover").addBack().removeClass("vakata-context-hover");
			})
			.on("mouseleave", function (e) {
				$(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
				if($.vakata.context.settings.hide_onmouseleave) {
					to = setTimeout(
						(function (t) {
							return function () { $.vakata.context.hide(); };
						}(this)), $.vakata.context.settings.hide_onmouseleave);
				}
			})
			.on("click", "a", function (e) {
				e.preventDefault();
			//})
			//.on("mouseup", "a", function (e) {
				if(!$(this).blur().parent().hasClass("vakata-context-disabled") && $.vakata.context._execute($(this).attr("rel")) !== false) {
					$.vakata.context.hide();
				}
			})
			.on('keydown', 'a', function (e) {
					var o = null;
					switch(e.which) {
						case 13:
						case 32:
							e.type = "click";
							e.preventDefault();
							$(e.currentTarget).trigger(e);
							break;
						case 37:
							if(vakata_context.is_visible) {
								vakata_context.element.find(".vakata-context-hover").last().closest("li").first().find("ul").hide().find(".vakata-context-hover").removeClass("vakata-context-hover").end().end().children('a').focus();
								e.stopImmediatePropagation();
								e.preventDefault();
							}
							break;
						case 38:
							if(vakata_context.is_visible) {
								o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").prevAll("li:not(.vakata-context-separator)").first();
								if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").last(); }
								o.addClass("vakata-context-hover").children('a').focus();
								e.stopImmediatePropagation();
								e.preventDefault();
							}
							break;
						case 39:
							if(vakata_context.is_visible) {
								vakata_context.element.find(".vakata-context-hover").last().children("ul").show().children("li:not(.vakata-context-separator)").removeClass("vakata-context-hover").first().addClass("vakata-context-hover").children('a').focus();
								e.stopImmediatePropagation();
								e.preventDefault();
							}
							break;
						case 40:
							if(vakata_context.is_visible) {
								o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").nextAll("li:not(.vakata-context-separator)").first();
								if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").first(); }
								o.addClass("vakata-context-hover").children('a').focus();
								e.stopImmediatePropagation();
								e.preventDefault();
							}
							break;
						case 27:
							$.vakata.context.hide();
							e.preventDefault();
							break;
						default:
							//console.log(e.which);
							break;
					}
				})
			.on('keydown', function (e) {
				e.preventDefault();
				var a = vakata_context.element.find('.vakata-contextmenu-shortcut-' + e.which).parent();
				if(a.parent().not('.vakata-context-disabled')) {
					a.click();
				}
			});

		$(document)
			.on("mousedown.vakata.jstree", function (e) {
				if(vakata_context.is_visible && vakata_context.element[0] !== e.target  && !noder.contains(vakata_context.element[0], e.target)) {
					$.vakata.context.hide();
				}
			})
			.on("context_show.vakata.jstree", function (e, data) {
				vakata_context.element.find("li:has(ul)").children("a").addClass("vakata-context-parent");
				if(right_to_left) {
					vakata_context.element.addClass("vakata-context-rtl").css("direction", "rtl");
				}
				// also apply a RTL class?
				vakata_context.element.find("ul").hide().end();
			});
	});

	return menu;

});
