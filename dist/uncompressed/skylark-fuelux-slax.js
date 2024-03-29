/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylark-integration/skylark-fuelux/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-bootstrap3/bs3',[
  "skylark-langx/skylark",
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query"
],function(skylark,langx,browser,eventer,noder,geom,$){
	var ui = skylark.ui = skylark.ui || {}, 
		bs3 = ui.bs3 = {};

/*---------------------------------------------------------------------------------*/
	/*
	 * Fuel UX utilities.js
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */
	var CONST = {
		BACKSPACE_KEYCODE: 8,
		COMMA_KEYCODE: 188, // `,` & `<`
		DELETE_KEYCODE: 46,
		DOWN_ARROW_KEYCODE: 40,
		ENTER_KEYCODE: 13,
		TAB_KEYCODE: 9,
		UP_ARROW_KEYCODE: 38
	};

	var isShiftHeld = function isShiftHeld (e) { return e.shiftKey === true; };

	var isKey = function isKey (keyCode) {
		return function compareKeycodes (e) {
			return e.keyCode === keyCode;
		};
	};

	var isBackspaceKey = isKey(CONST.BACKSPACE_KEYCODE);
	var isDeleteKey = isKey(CONST.DELETE_KEYCODE);
	var isTabKey = isKey(CONST.TAB_KEYCODE);
	var isUpArrow = isKey(CONST.UP_ARROW_KEYCODE);
	var isDownArrow = isKey(CONST.DOWN_ARROW_KEYCODE);

	var ENCODED_REGEX = /&[^\s]*;/;
	/*
	 * to prevent double encoding decodes content in loop until content is encoding free
	 */
	var cleanInput = function cleanInput (questionableMarkup) {
		// check for encoding and decode
		while (ENCODED_REGEX.test(questionableMarkup)) {
			questionableMarkup = $('<i>').html(questionableMarkup).text();
		}

		// string completely decoded now encode it
		return $('<i>').text(questionableMarkup).html();
	};




	langx.mixin(bs3, {
		CONST: CONST,
		cleanInput: cleanInput,
		isBackspaceKey: isBackspaceKey,
		isDeleteKey: isDeleteKey,
		isShiftHeld: isShiftHeld,
		isTabKey: isTabKey,
		isUpArrow: isUpArrow,
		isDownArrow: isDownArrow
	});

	return bs3;
});

define('skylark-bootstrap3/affix',[
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-scrolls/affix",
  "./bs3"
],function(plugins,_Affix,bs3){


/* ========================================================================
 * Bootstrap: affix.js v3.3.7
 * http://getbootstrap.com/javascript/#affix
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = bs3.Affix = _Affix.inherit({
        klassName: "Affix",

        pluginName : "bs3.affix"
  });


  Affix.VERSION  = '3.3.7'

  /*
  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.affix

  $.fn.affix             = Plugin;
  $.fn.affix.Constructor = Affix;


  // AFFIX NO CONFLICT
  // =================

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


  return $.fn.affix;
  */

  plugins.register(Affix,"affix");

  return Affix;
});

define('skylark-bootstrap3/alert',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./bs3"
],function(langx,browser,eventer,noder,geom,$,plugins,bs3){

/* ========================================================================
 * Bootstrap: alert.js v3.3.7
 * http://getbootstrap.com/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]';

  var Alert = bs3.Alert = plugins.Plugin.inherit({
    klassName: "Alert",

    pluginName : "bs3.alert",

    _construct : function(el,options) {
      $(el).on('click', dismiss, this.close)
    },

    close : function (e) {
      var $this    = $(this);
      var selector = $this.attr('data-target');

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
      }

      var $parent = $(selector === '#' ? [] : selector);

      if (e) e.preventDefault()

      if (!$parent.length) {
        $parent = $this.closest('.alert');
      }

      $parent.trigger(e = eventer.create('close.bs.alert'));

      if (e.isDefaultPrevented()) {
        return
      }
        
      $parent.removeClass('in');

      function removeElement() {
        // detach from parent, fire event then clean up data
        $parent.detach().trigger('closed.bs.alert').remove()
      }

      if (browser.support.transition) {
        if ($parent.hasClass('fade') ) {
          $parent.one('transitionEnd', removeElement)
          .emulateTransitionEnd(Alert.TRANSITION_DURATION);
        } else {
          removeElement();
        }

      } 
    }
  });


  Alert.VERSION = '3.3.7';

  Alert.TRANSITION_DURATION = 150;


  /*
  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var wgt  = $this.data('bs.alert')

      if (!wgt) {
        $this.data('bs.alert', (wgt = new Alert(this)));
      }
      if (typeof option == 'string') {
        wgt[option].call($this);
      }
    })
  }

  var old = $.fn.alert;

  $.fn.alert             = Plugin;
  $.fn.alert.Constructor = Alert;


  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old;
    return this;
  }

  return $.fn.alert;
  */

  plugins.register(Alert,"alert");

  return Alert;

});

define('skylark-bootstrap3/button',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./bs3"
],function(langx,browser,eventer,noder,geom,$,plugins,bs3){

/* ========================================================================
 * Bootstrap: button.js v3.3.7
 * http://getbootstrap.com/javascript/#buttons
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = bs3.Button = plugins.Plugin.inherit({
    klassName: "Button",

    pluginName : "bs3.button",

    _construct : function(element,options) {
      var $el = this.$element  = $(element)
      this.options   = langx.mixin({}, Button.DEFAULTS, options)
      this.isLoading = false

      if ($el.closest('[data-toggle^="button"]')) {
        $el.on("click.bs.button.data-api",langx.proxy(function(e){
          this.toggle()

          if (!($(e.target).is('input[type="radio"], input[type="checkbox"]'))) {
            // Prevent double click on radios, and the double selections (so cancellation) on checkboxes
            e.preventDefault()
            // The target component still receive the focus
            var $btn = this.$element; 
            if ($btn.is('input,button')) {
              $btn.trigger('focus');
            } else {
              $btn.find('input:visible,button:visible').first().trigger('focus');
            }
          }
        },this));
      }
    },

    setState : function (state) {
      var d    = 'disabled'
      var $el  = this.$element
      var val  = $el.is('input') ? 'val' : 'html'
      var data = $el.data()

      state += 'Text'

      if (data.resetText == null) $el.data('resetText', $el[val]())

      // push to event loop to allow forms to submit
      setTimeout(langx.proxy(function () {
        $el[val](data[state] == null ? this.options[state] : data[state])

        if (state == 'loadingText') {
          this.isLoading = true
          $el.addClass(d).attr(d, d).prop(d, true)
        } else if (this.isLoading) {
          this.isLoading = false
          $el.removeClass(d).removeAttr(d).prop(d, false)
        }
      }, this), 0)
    },

    toggle : function () {
      var changed = true
      var $parent = this.$element.closest('[data-toggle="buttons"]')

      if ($parent.length) {
        var $input = this.$element.find('input')
        if ($input.prop('type') == 'radio') {
          if ($input.prop('checked')) changed = false
          $parent.find('.active').removeClass('active')
          this.$element.addClass('active')
        } else if ($input.prop('type') == 'checkbox') {
          if (($input.prop('checked')) !== this.$element.hasClass('active')) changed = false
          this.$element.toggleClass('active')
        }
        $input.prop('checked', this.$element.hasClass('active'))
        if (changed) $input.trigger('change')
      } else {
        this.$element.attr('aria-pressed', !this.$element.hasClass('active'))
        this.$element.toggleClass('active')
      }
    }

  });  

  Button.VERSION  = '3.3.7'

  Button.DEFAULTS = {
    loadingText: 'loading...'
  }



  // BUTTON PLUGIN DEFINITION
  // ========================
  /*

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var wgt    = $this.data('bs.button')
      var options = typeof option == 'object' && option

      if (!wgt) {
        $this.data('bs.button', (wgt = new Button(this, options)));
      }

      if (option == 'toggle') {
        wgt.toggle();
      } else if (option) {
        wgt.setState(option);
      }
    });
  }

  var old = $.fn.button;

  $.fn.button             = Plugin;
  $.fn.button.Constructor = Button;


  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old;
    return this;
  }


  return $.fn.button;
  */

  plugins.register(Button,"button",function(options){
      //this -> plugin instance
      if (options == 'toggle') {
        this.toggle();
      } else if (options) {
        this.setState(options);
      }    
  });

  return Button;
});

define('skylark-bootstrap3/transition',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "./bs3"
],function(langx,browser,eventer,noder,geom,$,bs3){

/* ========================================================================
 * Bootstrap: transition.js v3.3.7
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  eventer.special.bsTransitionEnd = eventer.special.transitionEnd;
});

define('skylark-bootstrap3/carousel',[
    "skylark-langx/langx",
    "skylark-domx-browser",
    "skylark-domx-eventer",
    "skylark-domx-noder",
    "skylark-domx-geom",
    "skylark-domx-query",
    "skylark-domx-plugins-base",
    "./bs3",
    "./transition"
], function(langx, browser, eventer, noder, geom, $, plugins, bs3) {

    /* ========================================================================
     * Bootstrap: carousel.js v3.3.7
     * http://getbootstrap.com/javascript/#carousel
     * ========================================================================
     * Copyright 2011-2016 Twitter, Inc.
     * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
     * ======================================================================== */

    'use strict';

    // CAROUSEL CLASS DEFINITION
    // =========================

    var Carousel = bs3.Carousel = plugins.Plugin.inherit({
        klassName: "Carousel",

        pluginName: "bs3.carousel",

        options : {
            interval: 5000,
            pause: 'hover',
            wrap: true,
            keyboard: true,

            selectors :{
                controls : {
                 // The class for the "toggle" control:
                  toggle: '.toggle',
                  // The class for the "prev" control:
                  prev: '.prev',
                  // The class for the "next" control:
                  next: '.next',
                  // The class for the "close" control:
                  close: '.close',
                  // The class for the "play-pause" toggle control:
                  playPause: '.play-pause'
                },
                indicators : {
                    container : ".carousel-indicators"  
                },
                slides : {
                    container : "",
                    item : ".item" 
                }
            }


        },

        _construct: function(element, options) {
            options = langx.mixin({}, $(element).data(), options);
            //this.options = options
            this.overrided(element,options);

            this.$element = $(element)
            this.$indicators = this.$element.find(this.options.selectors.indicators.container); //'.carousel-indicators'
            this.paused = null
            this.sliding = null
            this.interval = null
            this.$active = null
            this.$items = null

            var self = this;
            if (!this.options.embeded) {
                this.options.keyboard && this.$element.on('keydown.bs.carousel', langx.proxy(this.keydown, this))

                this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
                    .on('mouseenter.bs3.carousel', langx.proxy(this.pause, this))
                    .on('mouseleave.bs3.carousel', langx.proxy(this.cycle, this));

                this.$element.on("click.bs3.carousel.data-api", "[data-slide],[data-slide-to]", function(e) {
                    var $this = $(this),
                        slide = $this.attr('data-slide'),
                        slideIndex = $this.attr('data-slide-to');

                    if (slide == "prev") {
                        self.prev();
                    } else if (slide == "next") {
                        self.next();
                    } else  if (slideIndex) {
                        self.to(slideIndex);
                    }
                    e.preventDefault();
                });
            }
        },

        keydown : function(e) {
            if (/input|textarea/i.test(e.target.tagName)) return
            switch (e.which) {
                case 37:
                    this.prev();
                    break
                case 39:
                    this.next();
                    break
                default:
                    return
            }

            e.preventDefault()
        },

        cycle : function(e) {
            e || (this.paused = false)

            this.interval && clearInterval(this.interval)

            this.options.interval &&
                !this.paused &&
                (this.interval = setInterval(langx.proxy(this.next, this), this.options.interval))

            return this
        },

        getItemIndex : function(item) {
            this.$items = item.parent().children(this.options.selectors.slides.item);//'.item' 
            return this.$items.index(item || this.$active)
        },

        getItemForDirection : function(direction, active) {
            var activeIndex = this.getItemIndex(active)
            var willWrap = (direction == 'prev' && activeIndex === 0) ||
                (direction == 'next' && activeIndex == (this.$items.length - 1))
            if (willWrap && !this.options.wrap) return active
            var delta = direction == 'prev' ? -1 : 1
            var itemIndex = (activeIndex + delta) % this.$items.length
            return this.$items.eq(itemIndex)
        },

        to : function(pos) {
            var that = this
            var activeIndex = this.getItemIndex(this.$active = this.$element.find(this.options.selectors.slides.item+".active"));//'.item.active'

            if (pos > (this.$items.length - 1) || pos < 0) return

            if (this.sliding) return this.$element.one('slid.bs.carousel', function() { that.to(pos) }) // yes, "slid"
            if (activeIndex == pos) return this.pause().cycle()

            return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos))
        },

        pause : function(e) {
            e || (this.paused = true)

            if (this.$element.find(this.options.selectors.controls.next + ","+ this.options.selectors.controls.prev).length && browser.support.transition) { //.next,.prev
                this.$element.trigger(browser.support.transition.end)
                this.cycle(true)
            }

            this.interval = clearInterval(this.interval)

            return this
        },

        next : function() {
            if (this.sliding) return
            return this.slide('next')
        },

        prev : function() {
            if (this.sliding) return
            return this.slide('prev')
        },

        slide : function(type, next) {
            var $active = this.$element.find(this.options.selectors.slides.item+".active");//'.item.active'
            var $next = next || this.getItemForDirection(type, $active)
            var isCycling = this.interval
            var direction = type == 'next' ? 'left' : 'right'
            var that = this

            if ($next.hasClass('active')) return (this.sliding = false)

            var relatedTarget = $next[0]
            var slideEvent = eventer.create('slide.bs.carousel', {
                relatedTarget: relatedTarget,
                direction: direction
            })
            this.$element.trigger(slideEvent)
            if (slideEvent.isDefaultPrevented()) return

            this.sliding = true

            isCycling && this.pause()

            if (this.$indicators.length) {
                this.$indicators.find('.active').removeClass('active')
                var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)])
                $nextIndicator && $nextIndicator.addClass('active')
            }

            var slidEvent = eventer.create('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }) // yes, "slid"
            if (browser.support.transition && this.$element.hasClass('slide')) {
                $next.addClass(type)
                $next[0].offsetWidth // force reflow
                $active.addClass(direction)
                $next.addClass(direction)
                $active
                    .one('transitionEnd', function() {
                        $next.removeClass([type, direction].join(' ')).addClass('active')
                        $active.removeClass(['active', direction].join(' '))
                        that.sliding = false
                        setTimeout(function() {
                            that.$element.trigger(slidEvent)
                        }, 0)
                    })
                    .emulateTransitionEnd()
            } else {
                $active.removeClass('active')
                $next.addClass('active')
                this.sliding = false
                this.$element.trigger(slidEvent)
            }

            isCycling && this.cycle()

            return this
        },

    });

    // var Carousel = function (element, options) {
    // }

    Carousel.VERSION = '3.3.7'

    Carousel.TRANSITION_DURATION = 600




    // CAROUSEL PLUGIN DEFINITION
    // ==========================
    /*
    function Plugin(option) {
        return this.each(function() {
            var $this = $(this)
            var wgt = $this.data('bs.carousel')
            var options = langx.mixin({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
            var action = typeof option == 'string' ? option : options.slide

            if (!wgt) {
                $this.data('bs.carousel', (wgt = new Carousel(this, options)));
            }
            if (typeof option == 'number') {
                wgt.to(option);
            } else if (action) {
                wgt[action]()
            } else if (options.interval) {
                wgt.pause().cycle();
            }
        })
    }
    */
    plugins.register(Carousel,"carousel",function(options){
        //this -> plugin instance
        var action = typeof options == 'string' ? options : options.slide
        if (typeof options == 'number') {
            this.to(options);
        } else if (action) {
            this[action]()
        } else if (options.interval) {
            this.pause().cycle();
        }        
    });

    return Carousel;

});
define('skylark-bootstrap3/collapse',[
    "skylark-langx/langx",
    "skylark-domx-browser",
    "skylark-domx-eventer",
    "skylark-domx-noder",
    "skylark-domx-geom",
    "skylark-domx-query",
    "skylark-domx-plugins-base",
    "skylark-domx-plugins-toggles/collapse",
   "./bs3",
    "./transition"
], function(langx, browser, eventer, noder, geom, $, plugins,_Collapse, bs3) {


/* ========================================================================
 * Bootstrap: collapse.js v3.3.7
 * http://getbootstrap.com/javascript/#collapse
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

/* jshint latedef: false */

  'use strict';

  // COLLAPSE PUBLIC CLASS DEFINITION
  // ================================

  var Collapse = bs3.Collapse = _Collapse.inherit({
    klassName: "Collapse",

    pluginName : "bs3.collapse",

    _construct : function(element,options) {
      options = langx.mixin({}, $(element).data(), options)
      this.$trigger      = $('[data-toggle="collapse"][href="#' + element.id + '"],' +
                             '[data-toggle="collapse"][data-target="#' + element.id + '"]')
      //this.transitioning = null

      if (options.parent) {
        this.$parent = this.getParent(options)
      } else {
        this.addAriaAndCollapsedClass($(element), this.$trigger)
      }

      this.overrided(element,options);
      //this.$element      = $(element)

      //if (this.options.toggle) {
      //  this.toggle();
      //}
    },


    show : function () {
      //if (this.transitioning || this.$element.hasClass('in')) return

      var activesData
      var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing')

      if (actives && actives.length) {
        activesData = actives.data('bs.collapse')
        if (activesData && activesData.transitioning) return
      }

      //var startEvent = eventer.create('show.bs.collapse')
      //this.$element.trigger(startEvent)
      //if (startEvent.isDefaultPrevented()) return

      if (actives && actives.length) {
        //Plugin.call(actives, 'hide')
        actives.collapse("hide");
        activesData || actives.data('bs.collapse', null)
      }

      //var dimension = this.dimension()

      //this.$element
      //  .removeClass('collapse')
      //  .addClass('collapsing')[dimension](0)
      //  .attr('aria-expanded', true)

      this.overrided(); //add

      this.$trigger
        .removeClass('collapsed')
        .attr('aria-expanded', true)

      //this.transitioning = 1

      //var complete = function () {
      //  this.$element
      //    .removeClass('collapsing')
      //    .addClass('collapse in')[dimension]('')
      //  this.transitioning = 0
      //  this.$element
      //    .trigger('shown.bs.collapse')
      //}

      //if (!browser.support.transition) return complete.call(this)

      //var scrollSize = langx.camelCase(['scroll', dimension].join('-'))

      //this.$element
      //  .one('transitionEnd', langx.proxy(complete, this))
      //  .emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize])
    },

    hide : function () {
      //if (this.transitioning || !this.$element.hasClass('in')) return

      //var startEvent = eventer.create('hide.bs.collapse')
      //this.$element.trigger(startEvent)
      //if (startEvent.isDefaultPrevented()) return

      //var dimension = this.dimension()

      //this.$element[dimension](this.$element[dimension]())[0].offsetHeight

      //this.$element
      //  .addClass('collapsing')
      //  .removeClass('collapse in')
      //  .attr('aria-expanded', false)

      this.overrided();
      this.$trigger
        .addClass('collapsed')
        .attr('aria-expanded', false)

      //this.transitioning = 1

      //var complete = function () {
      //  this.transitioning = 0
      //  this.$element
      //    .removeClass('collapsing')
      //    .addClass('collapse')
      //    .trigger('hidden.bs.collapse')
      //}

      //if (!browser.support.transition) return complete.call(this)

      //this.$element
      //  [dimension](0)
      //  .one('transitionEnd', langx.proxy(complete, this))
      //  .emulateTransitionEnd(Collapse.TRANSITION_DURATION)
    },


    getParent : function (options) {
      options = options || this.options;
      return $(options.parent)
        .find('[data-toggle="collapse"][data-parent="' + options.parent + '"]')
        .each(langx.proxy(function (i, element) {
          var $element = $(element)
          this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element)
        }, this))
        .end()
    },

    addAriaAndCollapsedClass : function ($element, $trigger) {
      var isOpen = $element.hasClass('in')

      $element.attr('aria-expanded', isOpen)
      $trigger
        .toggleClass('collapsed', !isOpen)
        .attr('aria-expanded', isOpen)
    }

  });

  Collapse.VERSION  = '3.3.7'


  function getTargetFromTrigger($trigger) {
    var href
    var target = $trigger.attr('data-target')
      || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7

    return $(target)
  }


  // COLLAPSE PLUGIN DEFINITION
  // ==========================

  /*
  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.collapse')
      var options = langx.mixin({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data && options.toggle && /show|hide/.test(option)) options.toggle = false
      if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.collapse

  $.fn.collapse             = Plugin;
  $.fn.collapse.Constructor = Collapse;

  // COLLAPSE NO CONFLICT
  // ====================

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }
  */

  plugins.register(Collapse,"collapse");

  return Collapse;

});

define('skylark-bootstrap3/dropdown',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-popups/dropdown",
  "./bs3"
],function(langx,browser,eventer,noder,geom,$,plugins,_Dropdown,bs3){

/* ========================================================================
 * Bootstrap: dropdown.js v3.3.7
 * http://getbootstrap.com/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop';
  var toggle   = '[data-toggle="dropdown"]';

  var Dropdown = bs3.Dropdown = _Dropdown.inherit({
    klassName: "Dropdown",

    pluginName : "bs3.dropdown",


  });

  Dropdown.VERSION = '3.3.7'


  /*
  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin;
  $.fn.dropdown.Constructor = Dropdown;


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }



  return $.fn.dropdown;
  */

  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================
  /*
  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() });
  */
  plugins.register(Dropdown,"dropdown");

  return Dropdown;

});

define('skylark-bootstrap3/modal',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./bs3"
],function(langx,browser,eventer,noder,geom,$,plugins,bs3){

/* ========================================================================
 * Bootstrap: modal.js v3.3.7
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = bs3.Modal = plugins.Plugin.inherit({
    klassName: "Modal",

    pluginName : "bs3.modal",

    _construct : function(element,options) {
      options = langx.mixin({}, Modal.DEFAULTS, $(element).data(), options)
      this.overrided(element,options);
      this.$container               = $(options.container || document.body)
      this.$element            = $(element)
      this.$dialog             = this.$element.find('.modal-dialog')
      if (!this.$container.is("body")) {
        this.$element.css("position","absolute");
      }
      //this.$container.append(this.$element);
      this.$backdrop           = null
      this.isShown             = null
      this.originalBodyPad     = null
      this.scrollbarWidth      = 0
      this.ignoreBackdropClick = false

      if (this.options.remote) {
        this.$element
          .find('.modal-content')
          .load(this.options.remote, langx.proxy(function () {
            this.$element.trigger('loaded.bs.modal')
          }, this))
      }

      if (this.options.show) {
        this.show();
      }
    },

    toggle : function (_relatedTarget) {
      return this.isShown ? this.hide() : this.show(_relatedTarget)
    },

    show : function (_relatedTarget) {
      var that = this
      var e    = eventer.create('show.bs.modal', { relatedTarget: _relatedTarget })

      this.$element.trigger(e)

      if (this.isShown || e.isDefaultPrevented()) return

      this.isShown = true

      this.checkScrollbar()
      this.setScrollbar()
      this.$container.addClass('modal-open')

      this.escape()
      this.resize()

      this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', langx.proxy(this.hide, this))

      this.$dialog.on('mousedown.dismiss.bs.modal', function () {
        that.$element.one('mouseup.dismiss.bs.modal', function (e) {
          if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true
        })
      })

      this.backdrop(function () {
        var transition = browser.support.transition && that.$element.hasClass('fade')

        if (!noder.isChildOf(that.$element[0],that.$container[0])) {
          that.$element.appendTo(that.$container) // don't move modals dom position
        }

        that.$element
          .show()
          .scrollTop(0)

        that.adjustDialog()

        if (transition) {
          that.$element[0].offsetWidth // force reflow
        }

        that.$element.addClass('in')

        that.enforceFocus()

        var e = eventer.create('shown.bs.modal', { relatedTarget: _relatedTarget })

        transition ?
          that.$dialog // wait for modal to slide in
            .one('transitionEnd', function () {
              that.$element.trigger('focus').trigger(e)
            })
            .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
          that.$element.trigger('focus').trigger(e)
      })
    },

    hide : function (e) {
      if (e) e.preventDefault()

      e = eventer.create('hide.bs.modal')

      this.$element.trigger(e)

      if (!this.isShown || e.isDefaultPrevented()) return

      this.isShown = false

      this.escape()
      this.resize()

      $(document).off('focusin.bs.modal')

      this.$element
        .removeClass('in')
        .off('click.dismiss.bs.modal')
        .off('mouseup.dismiss.bs.modal')

      this.$dialog.off('mousedown.dismiss.bs.modal')

      browser.support.transition && this.$element.hasClass('fade') ?
        this.$element
          .one('transitionEnd', langx.proxy(this.hideModal, this))
          .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
        this.hideModal()
    },

    enforceFocus : function () {
      $(document)
        .off('focusin.bs.modal') // guard against infinite focus loop
        .on('focusin.bs.modal', langx.proxy(function (e) {
          if (document !== e.target &&
              this.$element[0] !== e.target &&
              !this.$element.has(e.target).length) {
            this.$element.trigger('focus')
          }
        }, this))
    },

    escape : function () {
      if (this.isShown && this.options.keyboard) {
        this.$element.on('keydown.dismiss.bs.modal', langx.proxy(function (e) {
          e.which == 27 && this.hide()
        }, this))
      } else if (!this.isShown) {
        this.$element.off('keydown.dismiss.bs.modal')
      }
    },

    resize : function () {
      if (this.isShown) {
        $(window).on('resize.bs.modal', langx.proxy(this.handleUpdate, this))
      } else {
        $(window).off('resize.bs.modal')
      }
    },

    hideModal : function () {
      var that = this
      this.$element.hide()
      this.backdrop(function () {
        that.$container.removeClass('modal-open')
        that.resetAdjustments()
        that.resetScrollbar()
        that.$element.trigger('hidden.bs.modal')
      })
    },

    removeBackdrop : function () {
      this.$backdrop && this.$backdrop.remove()
      this.$backdrop = null
    },

    backdrop : function (callback) {
      var that = this
      var animate = this.$element.hasClass('fade') ? 'fade' : ''

      if (this.isShown && this.options.backdrop) {
        var doAnimate = browser.support.transition && animate

        this.$backdrop = $(document.createElement('div'))
          .addClass('modal-backdrop ' + animate)
          .appendTo(this.$container)

        if (!this.$container.is("body")) {
          this.$backdrop.css("position","absolute");
        }


        this.$element.on('click.dismiss.bs.modal', langx.proxy(function (e) {
          if (this.ignoreBackdropClick) {
            this.ignoreBackdropClick = false
            return
          }
          if (e.target !== e.currentTarget) return
          this.options.backdrop == 'static'
            ? this.$element[0].focus()
            : this.hide()
        }, this))

        if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

        this.$backdrop.addClass('in')

        if (!callback) return

        doAnimate ?
          this.$backdrop
            .one('transitionEnd', callback)
            .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
          callback()

      } else if (!this.isShown && this.$backdrop) {
        this.$backdrop.removeClass('in')

        var callbackRemove = function () {
          that.removeBackdrop()
          callback && callback()
        }
        browser.support.transition && this.$element.hasClass('fade') ?
          this.$backdrop
            .one('transitionEnd', callbackRemove)
            .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
          callbackRemove()

      } else if (callback) {
        callback()
      }
    },

    // these following methods are used to handle overflowing modals

    handleUpdate : function () {
      this.adjustDialog()
    },

    adjustDialog : function () {
      var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight

      this.$element.css({
        paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
        paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
      })
    },

    resetAdjustments : function () {
      this.$element.css({
        paddingLeft: '',
        paddingRight: ''
      })
    },

    checkScrollbar : function () {
      var fullWindowWidth = window.innerWidth
      if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
        var documentElementRect = document.documentElement.getBoundingClientRect()
        fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
      }
      this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
      this.scrollbarWidth = this.measureScrollbar()
    },

    setScrollbar : function () {
      var bodyPad = parseInt((this.$container.css('padding-right') || 0), 10)
      this.originalBodyPad = document.body.style.paddingRight || ''
      if (this.bodyIsOverflowing) this.$container.css('padding-right', bodyPad + this.scrollbarWidth)
    },

    resetScrollbar : function () {
      this.$container.css('padding-right', this.originalBodyPad)
    },

    measureScrollbar : function () { // thx walsh
      var scrollDiv = document.createElement('div')
      scrollDiv.className = 'modal-scrollbar-measure'
      this.$container.append(scrollDiv)
      var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
      this.$container[0].removeChild(scrollDiv)
      return scrollbarWidth
    }

  });  


  Modal.VERSION  = '3.3.7'

  Modal.TRANSITION_DURATION = 300
  Modal.BACKDROP_TRANSITION_DURATION = 150

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  /*

  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modal')
      var options = langx.mixin({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  var old = $.fn.modal

  $.fn.modal             = Plugin;
  $.fn.modal.Constructor = Modal;


  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


  return $.fn.modal;
  */

  plugins.register(Modal,"modal",function(options,_relatedTarget){
      //this -> plugin instance
      if (typeof options == 'string') {
        this[options](_relatedTarget);
      } else if (this.options.show) {
        this.show(_relatedTarget);
      } 
  });

  return Modal;

});

define('skylark-bootstrap3/tooltip',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./bs3"
],function(langx,browser,eventer,noder,geom,$,plugins,bs3){

/* ========================================================================
 * Bootstrap: tooltip.js v3.3.7
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = bs3.Tooltip = plugins.Plugin.inherit({
    klassName: "Tooltip",

    pluginName : "bs3.tooltip",

    _construct : function(element,options) {
      this.type       = null
      this.options    = null
      this.enabled    = null
      this.timeout    = null
      this.hoverState = null
      this.$element   = null
      this.inState    = null

      this.enabled   = true;
      this.type      = 'tooltip';
      this.$element  = $(element)
      this.options   = this.getOptions(options)
      this.$viewport = this.options.viewport && $(langx.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : (this.options.viewport.selector || this.options.viewport))
      this.inState   = { click: false, hover: false, focus: false }

      if (this.$element[0] instanceof document.constructor && !this.options.selector) {
        throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!')
      }

      var triggers = this.options.trigger.split(' ')

      for (var i = triggers.length; i--;) {
        var trigger = triggers[i]

        if (trigger == 'click') {
          this.$element.on('click.' + this.type, this.options.selector, langx.proxy(this.toggle, this))
        } else if (trigger != 'manual') {
          var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
          var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

          this.$element.on(eventIn  + '.' + this.type, this.options.selector, langx.proxy(this.enter, this))
          this.$element.on(eventOut + '.' + this.type, this.options.selector, langx.proxy(this.leave, this))
        }
      }

      this.options.selector ?
        (this._options = langx.mixin({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    },

    getDefaults : function () {
      return Tooltip.DEFAULTS
    },

    getOptions : function (options) {
      options = langx.mixin({}, this.getDefaults(), this.$element.data(), options)

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay,
          hide: options.delay
        }
      }

      return options
    },

    getDelegateOptions : function () {
      var options  = {}
      var defaults = this.getDefaults()

      this._options && langx.each(this._options, function (key, value) {
        if (defaults[key] != value) options[key] = value
      })

      return options
    },

    enter : function (obj) {
      var self = obj instanceof this.constructor ?
        obj : $(obj.currentTarget).plugin(this.pluginName)

      if (!self) {
        //self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
        self = $(obj.currentTarget).plugin(this.pluginName, this.getDelegateOptions())
      }

      if (obj instanceof eventer.create) {
        self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true
      }

      if (self.tip().hasClass('in') || self.hoverState == 'in') {
        self.hoverState = 'in'
        return
      }

      clearTimeout(self.timeout)

      self.hoverState = 'in'

      if (!self.options.delay || !self.options.delay.show) return self.show()

      self.timeout = setTimeout(function () {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    },

    isInStateTrue : function () {
      for (var key in this.inState) {
        if (this.inState[key]) return true
      }

      return false
    },

    leave : function (obj) {
      var self = obj instanceof this.constructor ?
        obj : $(obj.currentTarget).plugin(this.pluginName)

      if (!self) {
        //self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
        self = $(obj.currentTarget).plugin(this.pluginName, this.getDelegateOptions())
      }

      if (obj instanceof eventer.create) {
        self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false
      }

      if (self.isInStateTrue()) return

      clearTimeout(self.timeout)

      self.hoverState = 'out'

      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.timeout = setTimeout(function () {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    },

    show : function () {
      var e = eventer.create('show.bs.' + this.type)

      if (this.hasContent() && this.enabled) {
        this.$element.trigger(e)

        var inDom = noder.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])
        if (e.isDefaultPrevented() || !inDom) return
        var that = this

        var $tip = this.tip()

        var tipId = this.getUID(this.type)

        this.setContent()
        $tip.attr('id', tipId)
        this.$element.attr('aria-describedby', tipId)

        if (this.options.animation) $tip.addClass('fade')

        var placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        var autoToken = /\s?auto?\s?/i
        var autoPlace = autoToken.test(placement)
        if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

        $tip
          .detach()
          .css({ top: 0, left: 0, display: 'block' })
          .addClass(placement)
          .data('bs3.' + this.type, this)

        this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)
        this.$element.trigger('inserted.bs3.' + this.type)

        var pos          = this.getPosition()
        var actualWidth  = $tip[0].offsetWidth
        var actualHeight = $tip[0].offsetHeight

        if (autoPlace) {
          var orgPlacement = placement
          var viewportDim = this.getPosition(this.$viewport)

          placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top'    :
                      placement == 'top'    && pos.top    - actualHeight < viewportDim.top    ? 'bottom' :
                      placement == 'right'  && pos.right  + actualWidth  > viewportDim.width  ? 'left'   :
                      placement == 'left'   && pos.left   - actualWidth  < viewportDim.left   ? 'right'  :
                      placement

          $tip
            .removeClass(orgPlacement)
            .addClass(placement)
        }

        var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

        this.applyPlacement(calculatedOffset, placement)

        var complete = function () {
          var prevHoverState = that.hoverState
          that.$element.trigger('shown.bs3.' + that.type)
          that.hoverState = null

          if (prevHoverState == 'out') that.leave(that)
        }

        browser.support.transition && this.$tip.hasClass('fade') ?
          $tip
            .one('transitionEnd', complete)
            .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
          complete()
      }
    },

    applyPlacement : function (offset, placement) {
      var $tip   = this.tip()
      var width  = $tip[0].offsetWidth
      var height = $tip[0].offsetHeight

      // manually read margins because getBoundingClientRect includes difference
      var marginTop = parseInt($tip.css('margin-top'), 10)
      var marginLeft = parseInt($tip.css('margin-left'), 10)

      // we must check for NaN for ie 8/9
      if (isNaN(marginTop))  marginTop  = 0
      if (isNaN(marginLeft)) marginLeft = 0

      offset.top  += marginTop
      offset.left += marginLeft

      // $.fn.offset doesn't round pixel values
      // so we use setOffset directly with our own function B-0
      //$.offset.setOffset($tip[0], langx.mixin({
       // using: function (props) {
       //   $tip.css({
       //     top: Math.round(props.top),
       //     left: Math.round(props.left)
       //   })
       /// }
      //}, offset), 0);

      geom.pagePosition($tip[0],offset);
      

      $tip.addClass('in')

      // check to see if placing tip in new offset caused the tip to resize itself
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (placement == 'top' && actualHeight != height) {
        offset.top = offset.top + height - actualHeight
      }

      var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

      if (delta.left) offset.left += delta.left
      else offset.top += delta.top

      var isVertical          = /top|bottom/.test(placement)
      var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
      var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'

      $tip.offset(offset)
      this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
    },

    replaceArrow : function (delta, dimension, isVertical) {
      this.arrow()
        .css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
        .css(isVertical ? 'top' : 'left', '')
    },

    setContent : function () {
      var $tip  = this.tip()
      var title = this.getTitle()

      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    },

    hide : function (callback) {
      var that = this
      var $tip = $(this.$tip)
      var e    = eventer.create('hide.bs3.' + this.type)

      function complete() {
        if (that.hoverState != 'in') $tip.detach()
        if (that.$element) { // TODO: Check whether guarding this code with this `if` is really necessary.
          that.$element
            .removeAttr('aria-describedby')
            .trigger('hidden.bs3.' + that.type)
        }
        callback && callback()
      }

      this.$element.trigger(e)

      if (e.isDefaultPrevented()) return

      $tip.removeClass('in')

      browser.support.transition && $tip.hasClass('fade') ?
        $tip
          .one('transitionEnd', complete)
          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
        complete()

      this.hoverState = null

      return this
    },

    fixTitle : function () {
      var $e = this.$element
      if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
      }
    },

    hasContent : function () {
      return this.getTitle()
    },

    getPosition : function ($element) {
      $element   = $element || this.$element

      var el     = $element[0]
      var isBody = el.tagName == 'BODY'

      var elRect    = el.getBoundingClientRect()
      if (elRect.width == null) {
        // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
        elRect = langx.mixin({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
      }
      var isSvg = window.SVGElement && el instanceof window.SVGElement
      // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
      // See https://github.com/twbs/bootstrap/issues/20280
      var elOffset  = isBody ? { top: 0, left: 0 } : (isSvg ? null : $element.offset())
      var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }
      var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null

      return langx.mixin({}, elRect, scroll, outerDims, elOffset)
    },

    getCalculatedOffset : function (placement, pos, actualWidth, actualHeight) {
      return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2 } :
             placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :
             placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
          /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }

    },

    getViewportAdjustedDelta : function (placement, pos, actualWidth, actualHeight) {
      var delta = { top: 0, left: 0 }
      if (!this.$viewport) return delta

      var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
      var viewportDimensions = this.getPosition(this.$viewport)

      if (/right|left/.test(placement)) {
        var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
        var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
        if (topEdgeOffset < viewportDimensions.top) { // top overflow
          delta.top = viewportDimensions.top - topEdgeOffset
        } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
          delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
        }
      } else {
        var leftEdgeOffset  = pos.left - viewportPadding
        var rightEdgeOffset = pos.left + viewportPadding + actualWidth
        if (leftEdgeOffset < viewportDimensions.left) { // left overflow
          delta.left = viewportDimensions.left - leftEdgeOffset
        } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow
          delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
        }
      }

      return delta
    },

    getTitle : function () {
      var title
      var $e = this.$element
      var o  = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    },

    getUID : function (prefix) {
      do prefix += ~~(Math.random() * 1000000)
      while (document.getElementById(prefix))
      return prefix
    },

    tip : function () {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
        if (this.$tip.length != 1) {
          throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!')
        }
      }
      return this.$tip
    },

    arrow : function () {
      return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
    },

    enable : function () {
      this.enabled = true
    },

    disable : function () {
      this.enabled = false
    },

    toggleEnabled : function () {
      this.enabled = !this.enabled
    },

    toggle : function (e) {
      var self = this
      if (e) {
        self = $(e.currentTarget).plugin(this.pluginName)
        if (!self) {
          //self = new this.constructor(e.currentTarget, this.getDelegateOptions())
          self = $(e.currentTarget).plugin(this.pluginName, this.getDelegateOptions());
        }
      }

      if (e) {
        self.inState.click = !self.inState.click
        if (self.isInStateTrue()) self.enter(self)
        else self.leave(self)
      } else {
        self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
      }
    },

    destroy : function () {
      var that = this
      clearTimeout(this.timeout)
      this.hide(function () {
        that.$element.off('.' + that.type).removeData('bs3.' + that.type)
        if (that.$tip) {
          that.$tip.detach()
        }
        that.$tip = null
        that.$arrow = null
        that.$viewport = null
        that.$element = null
      })
    }

  }); 



  Tooltip.VERSION  = '3.3.7'

  Tooltip.TRANSITION_DURATION = 150

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }


  /*
  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin;
  $.fn.tooltip.Constructor = Tooltip;


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old;
    return this;
  }

  return $.fn.tooltip;
  */

  plugins.register(Tooltip,"tooltip");

  return Tooltip;
});

define('skylark-bootstrap3/popover',[
  "skylark-domx-browser",
  "skylark-langx/langx",
  "skylark-domx-eventer",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./bs3",
  "./tooltip" 
],function(browser,langx,eventer,$,plugins,bs3,Tooltip){
/* ========================================================================
 * Bootstrap: popover.js v3.3.7
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = bs3.Popover = Tooltip.inherit({
    klassName: "Popover",

    pluginName : "bs3.popover",

    _construct : function(element,options) {
      this.overrided(element,options);
      this.type = "popover";
    },
    getDefaults : function () {
      return Popover.DEFAULTS
    },

    setContent : function () {
      var $tip    = this.tip()
      var title   = this.getTitle()
      var content = this.getContent()

      $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
      $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events
        this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
      ](content)

      $tip.removeClass('fade top bottom left right in')

      // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
      // this manually by checking the contents.
      if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
    },

    hasContent : function () {
      return this.getTitle() || this.getContent()
    },

    getContent : function () {
      var $e = this.$element
      var o  = this.options

      return $e.attr('data-content')
        || (typeof o.content == 'function' ?
              o.content.call($e[0]) :
              o.content)
    },

    arrow : function () {
      return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
    }

  });  

  Popover.VERSION  = '3.3.7'

  Popover.DEFAULTS = langx.mixin({}, Tooltip.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  /*

  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.popover')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover;

  $.fn.popover             = Plugin;
  $.fn.popover.Constructor = Popover;


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  };

  return $.fn.popover;
  */

  plugins.register(Popover,"popover");

  return Popover;

});

define('skylark-bootstrap3/scrollspy',[
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-scrolls/scroll-spy",
  "./bs3"
],function(plugins,_ScrollSpy,bs3){


/* ========================================================================
 * Bootstrap: scrollspy.js v3.3.7
 * http://getbootstrap.com/javascript/#scrollspy
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  // SCROLLSPY CLASS DEFINITION
  // ==========================

  var ScrollSpy = bs3.ScrollSpy = _ScrollSpy.inherit({
    klassName: "ScrollSpy",

    pluginName : "bs3.scrollspy"


  });

  ScrollSpy.VERSION  = '3.3.7'

  /*

  // SCROLLSPY PLUGIN DEFINITION
  // ===========================
  var old = $.fn.scrollspy;

  $.fn.scrollspy = function scrollspy(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.scrollspy')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }


  $.fn.scrollspy.Constructor = ScrollSpy;


  // SCROLLSPY NO CONFLICT
  // =====================

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old;
    return this;
  }


  return $.fn.scrollspy;
  */

  plugins.register(ScrollSpy,"scrollspy");

  return ScrollSpy;

});

define('skylark-bootstrap3/tab',[
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-toggles/tab",
  "./bs3"
],function(plugins,_Tab,bs3){

/* ========================================================================
 * Bootstrap: tab.js v3.3.7
 * http://getbootstrap.com/javascript/#tabs
 * ========================================================================
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */

  'use strict';

  // TAB CLASS DEFINITION
  // ====================


  var Tab = bs3.Tab = _Tab.inherit({
    klassName: "Tab",

    pluginName : "bs3.tab"
  });


  Tab.VERSION = '3.3.7'

  /*
  // TAB PLUGIN DEFINITION
  // =====================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.tab')

      if (!data) $this.data('bs.tab', (data = new Tab(this,option)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tab

  $.fn.tab             = Plugin
  $.fn.tab.Constructor = Tab


  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }

  return $.fn.tab;
  */

  plugins.register(Tab,"tab");

  return Tab;
});

define('skylark-bootstrap3/taginput',[
  "skylark-langx/langx",
  "skylark-domx-browser",
  "skylark-domx-eventer",
  "skylark-domx-noder",
  "skylark-domx-geom",
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "./bs3"
],function(langx,browser,eventer,noder,geom,$,plugins,bs3){

  "use strict";

  var defaultOptions = {
    tagClass: function(item) {
      return 'label label-info';
    },
    focusClass: 'focus',
    itemValue: function(item) {
      return item ? item.toString() : item;
    },
    itemText: function(item) {
      return this.itemValue(item);
    },
    itemTitle: function(item) {
      return null;
    },
    freeInput: true,
    addOnBlur: true,
    maxTags: undefined,
    maxChars: undefined,
    confirmKeys: [13, 44],
    delimiter: ',',
    delimiterRegex: null,
    cancelConfirmKeysOnEmpty: false,
    onTagExists: function(item, $tag) {
      $tag.hide().fadeIn();
    },
    trimValue: false,
    allowDuplicates: false,
    triggerChange: true
  };


  var TagsInput = bs3.TagsInput = plugins.Plugin.inherit({
    klassName: "TagsInput",

    pluginName : "bs3.TagsInput",

  /**
   * Constructor function
   */
    _construct : function(element, options) {
      this.objectItems = options && options.itemValue;
      options = langx.mixin({}, defaultOptions, $(element).data(), options)
      this.overrided(element,options);

      this.isInit = true;
      this.itemsArray = [];


      this.$element = $(element);
      this.$element.hide();

      this.isSelect = (element.tagName === 'SELECT');
      this.multiple = (this.isSelect && element.hasAttribute('multiple'));
      this.placeholderText = element.hasAttribute('placeholder') ? this.$element.attr('placeholder') : '';
      this.inputSize = Math.max(1, this.placeholderText.length);

      this.$container = $('<div class="bootstrap-tagsinput"></div>');
      this.$input = $('<input type="text" placeholder="' + this.placeholderText + '"/>').appendTo(this.$container);

      this.$element.before(this.$container);

      this.build();
      this.isInit = false;
    },


    /**
     * Adds the given item as a new tag. Pass true to dontPushVal to prevent
     * updating the elements val()
     */
    add: function(item, dontPushVal, options) {
      var self = this;

      if (self.options.maxTags && self.itemsArray.length >= self.options.maxTags)
        return;

      // Ignore falsey values, except false
      if (item !== false && !item)
        return;

      // Trim value
      if (typeof item === "string" && self.options.trimValue) {
        item = langx.trim(item);
      }

      // Throw an error when trying to add an object while the itemValue option was not set
      if (typeof item === "object" && !self.objectItems)
        throw("Can't add objects when itemValue option is not set");

      // Ignore strings only containg whitespace
      if (item.toString().match(/^\s*$/))
        return;

      // If SELECT but not multiple, remove current tag
      if (self.isSelect && !self.multiple && self.itemsArray.length > 0)
        self.remove(self.itemsArray[0]);

      if (typeof item === "string" && this.$element[0].tagName === 'INPUT') {
        var delimiter = (self.options.delimiterRegex) ? self.options.delimiterRegex : self.options.delimiter;
        var items = item.split(delimiter);
        if (items.length > 1) {
          for (var i = 0; i < items.length; i++) {
            this.add(items[i], true);
          }

          if (!dontPushVal)
            self.pushVal(self.options.triggerChange);
          return;
        }
      }

      var itemValue = self.options.itemValue(item),
          itemText = self.options.itemText(item),
          tagClass = self.options.tagClass(item),
          itemTitle = self.options.itemTitle(item);

      // Ignore items allready added
      var existing = langx.grep(self.itemsArray, function(item) { return self.options.itemValue(item) === itemValue; } )[0];
      if (existing && !self.options.allowDuplicates) {
        // Invoke onTagExists
        if (self.options.onTagExists) {
          var $existingTag = $(".tag", self.$container).filter(function() { return $(this).data("item") === existing; });
          self.options.onTagExists(item, $existingTag);
        }
        return;
      }

      // if length greater than limit
      if (self.items().toString().length + item.length + 1 > self.options.maxInputLength)
        return;

      // raise beforeItemAdd arg
      var beforeItemAddEvent = eventer.create('beforeItemAdd', { item: item, cancel: false, options: options});
      self.$element.trigger(beforeItemAddEvent);
      if (beforeItemAddEvent.cancel)
        return;

      // register item in internal array and map
      self.itemsArray.push(item);

      // add a tag element

      var $tag = $('<span class="tag ' + htmlEncode(tagClass) + (itemTitle !== null ? ('" title="' + itemTitle) : '') + '">' + htmlEncode(itemText) + '<span data-role="remove"></span></span>');
      $tag.data('item', item);
      self.findInputWrapper().before($tag);
      $tag.after(' ');

      // Check to see if the tag exists in its raw or uri-encoded form
      var optionExists = (
        $('option[value="' + encodeURIComponent(itemValue) + '"]', self.$element).length ||
        $('option[value="' + htmlEncode(itemValue) + '"]', self.$element).length
      );

      // add <option /> if item represents a value not present in one of the <select />'s options
      if (self.isSelect && !optionExists) {
        var $option = $('<option selected>' + htmlEncode(itemText) + '</option>');
        $option.data('item', item);
        $option.attr('value', itemValue);
        self.$element.append($option);
      }

      if (!dontPushVal)
        self.pushVal(self.options.triggerChange);

      // Add class when reached maxTags
      if (self.options.maxTags === self.itemsArray.length || self.items().toString().length === self.options.maxInputLength)
        self.$container.addClass('bootstrap-tagsinput-max');

      // If using typeahead, once the tag has been added, clear the typeahead value so it does not stick around in the input.
      if ($('.typeahead, .twitter-typeahead', self.$container).length) {
        self.$input.typeahead('val', '');
      }

      if (this.isInit) {
        self.$element.trigger(eventer.create('itemAddedOnInit', { item: item, options: options }));
      } else {
        self.$element.trigger(eventer.create('itemAdded', { item: item, options: options }));
      }
    },

    /**
     * Removes the given item. Pass true to dontPushVal to prevent updating the
     * elements val()
     */
    remove: function(item, dontPushVal, options) {
      var self = this;

      if (self.objectItems) {
        if (typeof item === "object")
          item = langx.grep(self.itemsArray, function(other) { return self.options.itemValue(other) ==  self.options.itemValue(item); } );
        else
          item = langx.grep(self.itemsArray, function(other) { return self.options.itemValue(other) ==  item; } );

        item = item[item.length-1];
      }

      if (item) {
        var beforeItemRemoveEvent = eventer.create('beforeItemRemove', { item: item, cancel: false, options: options });
        self.$element.trigger(beforeItemRemoveEvent);
        if (beforeItemRemoveEvent.cancel)
          return;

        $('.tag', self.$container).filter(function() { return $(this).data('item') === item; }).remove();
        $('option', self.$element).filter(function() { return $(this).data('item') === item; }).remove();
        if(langx.inArray(item, self.itemsArray) !== -1)
          self.itemsArray.splice(langx.inArray(item, self.itemsArray), 1);
      }

      if (!dontPushVal)
        self.pushVal(self.options.triggerChange);

      // Remove class when reached maxTags
      if (self.options.maxTags > self.itemsArray.length)
        self.$container.removeClass('bootstrap-tagsinput-max');

      self.$element.trigger(eventer.create('itemRemoved',  { item: item, options: options }));
    },

    /**
     * Removes all items
     */
    removeAll: function() {
      var self = this;

      $('.tag', self.$container).remove();
      $('option', self.$element).remove();

      while(self.itemsArray.length > 0)
        self.itemsArray.pop();

      self.pushVal(self.options.triggerChange);
    },

    /**
     * Refreshes the tags so they match the text/value of their corresponding
     * item.
     */
    refresh: function() {
      var self = this;
      $('.tag', self.$container).each(function() {
        var $tag = $(this),
            item = $tag.data('item'),
            itemValue = self.options.itemValue(item),
            itemText = self.options.itemText(item),
            tagClass = self.options.tagClass(item);

          // Update tag's class and inner text
          $tag.attr('class', null);
          $tag.addClass('tag ' + htmlEncode(tagClass));
          $tag.contents().filter(function() {
            return this.nodeType == 3;
          })[0].nodeValue = htmlEncode(itemText);

          if (self.isSelect) {
            var option = $('option', self.$element).filter(function() { return $(this).data('item') === item; });
            option.attr('value', itemValue);
          }
      });
    },

    /**
     * Returns the items added as tags
     */
    items: function() {
      return this.itemsArray;
    },

    /**
     * Assembly value by retrieving the value of each item, and set it on the
     * element.
     */
    pushVal: function() {
      var self = this,
          val = langx.map(self.items(), function(item) {
            return self.options.itemValue(item).toString();
          });

      self.$element.val(val, true);

      if (self.options.triggerChange)
        self.$element.trigger('change');
    },

    /**
     * Initializes the tags input behaviour on the element
     */
    build: function(options) {
      var self = this;

      //self.options = $.extend({}, defaultOptions, options);

      // When itemValue is set, freeInput should always be false
      if (self.objectItems)
        self.options.freeInput = false;

      makeOptionItemFunction(self.options, 'itemValue');
      makeOptionItemFunction(self.options, 'itemText');
      makeOptionFunction(self.options, 'tagClass');

      // Typeahead Bootstrap version 2.3.2
      if (self.options.typeahead) {
        var typeahead = self.options.typeahead || {};

        makeOptionFunction(typeahead, 'source');

        self.$input.typeahead(langx.extend({}, typeahead, {
          source: function (query, process) {
            function processItems(items) {
              var texts = [];

              for (var i = 0; i < items.length; i++) {
                var text = self.options.itemText(items[i]);
                map[text] = items[i];
                texts.push(text);
              }
              process(texts);
            }

            this.map = {};
            var map = this.map,
                data = typeahead.source(query);

            if (langx.isFunction(data.success)) {
              // support for Angular callbacks
              data.success(processItems);
            } else if (langx.isFunction(data.then)) {
              // support for Angular promises
              data.then(processItems);
            } else {
              // support for functions and jquery promises
              langx.Deferred.when(data)
               .then(processItems);
            }
          },
          updater: function (text) {
            self.add(this.map[text]);
            return this.map[text];
          },
          matcher: function (text) {
            return (text.toLowerCase().indexOf(this.query.trim().toLowerCase()) !== -1);
          },
          sorter: function (texts) {
            return texts.sort();
          },
          highlighter: function (text) {
            var regex = new RegExp( '(' + this.query + ')', 'gi' );
            return text.replace( regex, "<strong>$1</strong>" );
          }
        }));
      }

      // typeahead.js
      if (self.options.typeaheadjs) {
        // Determine if main configurations were passed or simply a dataset
        var typeaheadjs = self.options.typeaheadjs;
        if (!langx.isArray(typeaheadjs)) {
            typeaheadjs = [null, typeaheadjs];
        }

        $.fn.typeahead.apply(self.$input, typeaheadjs).on('typeahead:selected', langx.proxy(function (obj, datum, name) {
          var index = 0;
          typeaheadjs.some(function(dataset, _index) {
            if (dataset.name === name) {
              index = _index;
              return true;
            }
            return false;
          });

          // @TODO Dep: https://github.com/corejavascript/typeahead.js/issues/89
          if (typeaheadjs[index].valueKey) {
            self.add(datum[typeaheadjs[index].valueKey]);
          } else {
            self.add(datum);
          }

          self.$input.typeahead('val', '');
        }, self));
      }

      self.$container.on('click', langx.proxy(function(event) {
        if (! self.$element.attr('disabled')) {
          self.$input.removeAttr('disabled');
        }
        self.$input.focus();
      }, self));

        if (self.options.addOnBlur && self.options.freeInput) {
          self.$input.on('focusout', langx.proxy(function(event) {
              // HACK: only process on focusout when no typeahead opened, to
              //       avoid adding the typeahead text as tag
              if ($('.typeahead, .twitter-typeahead', self.$container).length === 0) {
                self.add(self.$input.val());
                self.$input.val('');
              }
          }, self));
        }

      // Toggle the 'focus' css class on the container when it has focus
      self.$container.on({
        focusin: function() {
          self.$container.addClass(self.options.focusClass);
        },
        focusout: function() {
          self.$container.removeClass(self.options.focusClass);
        },
      });

      self.$container.on('keydown', 'input', langx.proxy(function(event) {
        var $input = $(event.target),
            $inputWrapper = self.findInputWrapper();

        if (self.$element.attr('disabled')) {
          self.$input.attr('disabled', 'disabled');
          return;
        }

        switch (event.which) {
          // BACKSPACE
          case 8:
            if (doGetCaretPosition($input[0]) === 0) {
              var prev = $inputWrapper.prev();
              if (prev.length) {
                self.remove(prev.data('item'));
              }
            }
            break;

          // DELETE
          case 46:
            if (doGetCaretPosition($input[0]) === 0) {
              var next = $inputWrapper.next();
              if (next.length) {
                self.remove(next.data('item'));
              }
            }
            break;

          // LEFT ARROW
          case 37:
            // Try to move the input before the previous tag
            var $prevTag = $inputWrapper.prev();
            if ($input.val().length === 0 && $prevTag[0]) {
              $prevTag.before($inputWrapper);
              $input.focus();
            }
            break;
          // RIGHT ARROW
          case 39:
            // Try to move the input after the next tag
            var $nextTag = $inputWrapper.next();
            if ($input.val().length === 0 && $nextTag[0]) {
              $nextTag.after($inputWrapper);
              $input.focus();
            }
            break;
         default:
             // ignore
         }

        // Reset internal input's size
        var textLength = $input.val().length,
            wordSpace = Math.ceil(textLength / 5),
            size = textLength + wordSpace + 1;
        $input.attr('size', Math.max(this.inputSize, $input.val().length));
      }, self));

      self.$container.on('keypress', 'input', langx.proxy(function(event) {
         var $input = $(event.target);

         if (self.$element.attr('disabled')) {
            self.$input.attr('disabled', 'disabled');
            return;
         }

         var text = $input.val(),
         maxLengthReached = self.options.maxChars && text.length >= self.options.maxChars;
         if (self.options.freeInput && (keyCombinationInList(event, self.options.confirmKeys) || maxLengthReached)) {
            // Only attempt to add a tag if there is data in the field
            if (text.length !== 0) {
               self.add(maxLengthReached ? text.substr(0, self.options.maxChars) : text);
               $input.val('');
            }

            // If the field is empty, let the event triggered fire as usual
            if (self.options.cancelConfirmKeysOnEmpty === false) {
                event.preventDefault();
            }
         }

         // Reset internal input's size
         var textLength = $input.val().length,
            wordSpace = Math.ceil(textLength / 5),
            size = textLength + wordSpace + 1;
         $input.attr('size', Math.max(this.inputSize, $input.val().length));
      }, self));

      // Remove icon clicked
      self.$container.on('click', '[data-role=remove]', langx.proxy(function(event) {
        if (self.$element.attr('disabled')) {
          return;
        }
        self.remove($(event.target).closest('.tag').data('item'));
      }, self));

      // Only add existing value as tags when using strings as tags
      if (self.options.itemValue === defaultOptions.itemValue) {
        if (self.$element[0].tagName === 'INPUT') {
            self.add(self.$element.val());
        } else {
          $('option', self.$element).each(function() {
            self.add($(this).attr('value'), true);
          });
        }
      }
    },

    /**
     * Removes all tagsinput behaviour and unregsiter all event handlers
     */
    destroy: function() {
      var self = this;

      // Unbind events
      self.$container.off('keypress', 'input');
      self.$container.off('click', '[role=remove]');

      self.$container.remove();
      self.$element.removeData('tagsinput');
      self.$element.show();
    },

    /**
     * Sets focus on the tagsinput
     */
    focus: function() {
      this.$input.focus();
    },

    /**
     * Returns the internal input element
     */
    input: function() {
      return this.$input;
    },

    /**
     * Returns the element which is wrapped around the internal input. This
     * is normally the $container, but typeahead.js moves the $input element.
     */
    findInputWrapper: function() {
      var elt = this.$input[0],
          container = this.$container[0];
      while(elt && elt.parentNode !== container)
        elt = elt.parentNode;

      return $(elt);
    }
  });

  /**
   * Register JQuery plugin
   */
  $.fn.tagsinput = function(arg1, arg2, arg3) {
    var results = [];

    this.each(function() {
      var tagsinput = $(this).data('tagsinput');
      // Initialize a new tags input
      if (!tagsinput) {
          tagsinput = new TagsInput(this, arg1);
          $(this).data('tagsinput', tagsinput);
          results.push(tagsinput);

          if (this.tagName === 'SELECT') {
              $('option', $(this)).attr('selected', 'selected');
          }

          // Init tags from $(this).val()
          $(this).val($(this).val());
      } else if (!arg1 && !arg2) {
          // tagsinput already exists
          // no function, trying to init
          results.push(tagsinput);
      } else if(tagsinput[arg1] !== undefined) {
          // Invoke function on existing tags input
            if(tagsinput[arg1].length === 3 && arg3 !== undefined){
               var retVal = tagsinput[arg1](arg2, null, arg3);
            }else{
               var retVal = tagsinput[arg1](arg2);
            }
          if (retVal !== undefined)
              results.push(retVal);
      }
    });

    if ( typeof arg1 == 'string') {
      // Return the results from the invoked function calls
      return results.length > 1 ? results : results[0];
    } else {
      return results;
    }
  };

  $.fn.tagsinput.Constructor = TagsInput;

  /**
   * Most options support both a string or number as well as a function as
   * option value. This function makes sure that the option with the given
   * key in the given options is wrapped in a function
   */
  function makeOptionItemFunction(options, key) {
    if (typeof options[key] !== 'function') {
      var propertyName = options[key];
      options[key] = function(item) { return item[propertyName]; };
    }
  }
  function makeOptionFunction(options, key) {
    if (typeof options[key] !== 'function') {
      var value = options[key];
      options[key] = function() { return value; };
    }
  }
  /**
   * HtmlEncodes the given value
   */
  var htmlEncodeContainer = $('<div />');
  function htmlEncode(value) {
    if (value) {
      return htmlEncodeContainer.text(value).html();
    } else {
      return '';
    }
  }

  /**
   * Returns the position of the caret in the given input field
   * http://flightschool.acylt.com/devnotes/caret-position-woes/
   */
  function doGetCaretPosition(oField) {
    var iCaretPos = 0;
    if (document.selection) {
      oField.focus ();
      var oSel = document.selection.createRange();
      oSel.moveStart ('character', -oField.value.length);
      iCaretPos = oSel.text.length;
    } else if (oField.selectionStart || oField.selectionStart == '0') {
      iCaretPos = oField.selectionStart;
    }
    return (iCaretPos);
  }

  /**
    * Returns boolean indicates whether user has pressed an expected key combination.
    * @param object keyPressEvent: JavaScript event object, refer
    *     http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    * @param object lookupList: expected key combinations, as in:
    *     [13, {which: 188, shiftKey: true}]
    */
  function keyCombinationInList(keyPressEvent, lookupList) {
      var found = false;
      langx.each(lookupList, function (index, keyCombination) {
          if (typeof (keyCombination) === 'number' && keyPressEvent.which === keyCombination) {
              found = true;
              return false;
          }

          if (keyPressEvent.which === keyCombination.which) {
              var alt = !keyCombination.hasOwnProperty('altKey') || keyPressEvent.altKey === keyCombination.altKey,
                  shift = !keyCombination.hasOwnProperty('shiftKey') || keyPressEvent.shiftKey === keyCombination.shiftKey,
                  ctrl = !keyCombination.hasOwnProperty('ctrlKey') || keyPressEvent.ctrlKey === keyCombination.ctrlKey;
              if (alt && shift && ctrl) {
                  found = true;
                  return false;
              }
          }
      });

      return found;
  }

  return TagsInput;

});
define('skylark-bootstrap3/loadedInit',[
 	"skylark-langx/langx",
 	"skylark-domx-query",
	"./affix",
	"./alert",
	"./button",
	"./carousel",
	"./collapse",
	"./dropdown",
	"./modal",
	"./popover",
	"./scrollspy",
	"./tab",
	"./taginput",
	"./tooltip",
	"./transition"
],function(langx,$,Affix,Alert,Button,Carousel,Collapse,Dropdown,Modal,Popover,ScrollSpy,Tab,Tooltip){
	function getTargetFromTrigger($trigger) {
		var href
		var target = $trigger.attr('data-target')
		  || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') // strip for ie7

		return $(target);
	}

	var init = function() {
    
		$(function () {
		    // AFFIX DATA-API
		    // =================
			$('[data-spy="affix"]').each(function () {
				var $spy = $(this)
				var data = $spy.data()

				data.offset = data.offset || {};

				if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom
				if (data.offsetTop    != null) data.offset.top    = data.offsetTop

				$spy.affix(data);
			});


		  	// ALERT DATA-API
		    // =================
  			//$(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close)

  			// BUTTON DATA-API
		    // =================
			$(document).on('click.bs3.button.data-api', '[data-toggle^="button"]', function (e) {
				var $btn = $(e.target).closest('.btn')
				///$btn.button('toggle');
				$btn.plugin("bs3.button").toggle();
				if (!($(e.target).is('input[type="radio"], input[type="checkbox"]'))) {
					// Prevent double click on radios, and the double selections (so cancellation) on checkboxes
					e.preventDefault()
					// The target component still receive the focus
					if ($btn.is('input,button')) {
						$btn.trigger('focus');
					}else {
						$btn.find('input:visible,button:visible').first().trigger('focus');
					}
				}
			});
			///.on('focus.bs3.button.data-api blur.bs3.button.data-api', '[data-toggle^="button"]', function (e) {
			///	$(e.target).closest('.btn').toggleClass('focus', /^focus(in)?$/.test(e.type));
			///});

		    // CAROUSEL DATA-API
		    // =================
			$('[data-ride="carousel"]').each(function () {
				$this = $(this);
				$this.carousel($this.data());
			});

            $(document).on("click.bs3.carousel.data-api", "[data-target][data-slide],[data-target][data-slide-to],[href][data-slide],[href][data-slide-to]", function(e) {
	            var href
	            var $this = $(this)
	            var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) // strip for ie7
	            if (!$target.hasClass('carousel')) return
	            var options = langx.mixin({}, $target.data(), $this.data());
	            var slideIndex = $this.attr('data-slide-to')
	            if (slideIndex) options.interval = false

	            $target.carousel(options);

	            if (slideIndex) {
	                $target.plugin('bs3.carousel').to(slideIndex);
	            }

	            e.preventDefault();

	        });
 
			// COLLAPSE DATA-API
			// =================
 		    $(document).on('click.bs3.collapse.data-api', '[data-target][data-toggle="collapse"]', function (e) {
			    var $this   = $(this)

			    if (!$this.attr('data-target')) e.preventDefault()

			    var $target = getTargetFromTrigger($this)
			    var data    = $target.plugin('bs3.collapse')
			    var option  = data ? 'toggle' : $this.data()

			    $target.collapse(option);
		    });

			    // Dropdown DATA-API
			    // =================
	       	$(document)
	        .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
	        .on('click.bs.dropdown.data-api', '[data-toggle="dropdown"]', Dropdown.prototype.toggle)
	        .on('keydown.bs.dropdown.data-api', '[data-toggle="dropdown"]', Dropdown.prototype.keydown)
	        .on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown);


			// MODAL DATA-API
			// ==============
			$(document).on('click.bs3.modal.data-api', '[data-toggle="modal"]', function (e) {
				var $this   = $(this)
				var href    = $this.attr('href')
				var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
				var option  = $target.data('bs3.modal') ? 'toggle' : langx.mixin({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

				if ($this.is('a')) e.preventDefault()

				$target.one('show.bs3.modal', function (showEvent) {
			  		if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
			  		$target.one('hidden.bs3.modal', function () {
			    		$this.is(':visible') && $this.trigger('focus')
			  		})
				})
				$target.modal(option, this);
			});

				// SCROLLSPY DATA-API
				// ==================
			$('[data-spy="scroll"]').each(function () {
				var $spy = $(this)
				$spy.scrollspy($spy.data());
			});

			// TAB DATA-API
			// ============

			var clickHandler = function (e) {
			    e.preventDefault()
			    $(this).tab('show');
			};

			$(document)
			.on('click.bs3.tab.data-api', '[data-toggle="tab"]', clickHandler)
			.on('click.bs3.tab.data-api', '[data-toggle="pill"]', clickHandler);

		  	/**
		   	* Initialize tagsinput behaviour on inputs and selects which have
		   	* data-role=tagsinput
		   	*/

		    $("input[data-role=tagsinput], select[multiple][data-role=tagsinput]").tagsinput();

  		});
	};

	return init;
});

define('skylark-bootstrap3/main',[
    "skylark-domx-query",
    "./affix",
    "./alert",
    "./button",
    "./carousel",
    "./collapse",
    "./dropdown",
    "./modal",
    "./popover",
    "./scrollspy",
    "./tab",
    "./taginput",
    "./tooltip",
    "./transition",
    "./loadedInit"
], function($) {
    return $;
});
define('skylark-bootstrap3', ['skylark-bootstrap3/main'], function (main) { return main; });

define('skylark-fuelux/fuelux',[
  "skylark-langx/skylark",
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query"
],function(skylark,langx,browser,eventer,noder,geom,$){
	var ui = skylark.ui = skylark.ui || {}, 
		fuelux = ui.fuelux = {};

/*---------------------------------------------------------------------------------*/
	/*
	 * Fuel UX utilities.js
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */
	var CONST = {
		BACKSPACE_KEYCODE: 8,
		COMMA_KEYCODE: 188, // `,` & `<`
		DELETE_KEYCODE: 46,
		DOWN_ARROW_KEYCODE: 40,
		ENTER_KEYCODE: 13,
		TAB_KEYCODE: 9,
		UP_ARROW_KEYCODE: 38
	};

	var isShiftHeld = function isShiftHeld (e) { return e.shiftKey === true; };

	var isKey = function isKey (keyCode) {
		return function compareKeycodes (e) {
			return e.keyCode === keyCode;
		};
	};

	var isBackspaceKey = isKey(CONST.BACKSPACE_KEYCODE);
	var isDeleteKey = isKey(CONST.DELETE_KEYCODE);
	var isTabKey = isKey(CONST.TAB_KEYCODE);
	var isUpArrow = isKey(CONST.UP_ARROW_KEYCODE);
	var isDownArrow = isKey(CONST.DOWN_ARROW_KEYCODE);

	var ENCODED_REGEX = /&[^\s]*;/;
	/*
	 * to prevent double encoding decodes content in loop until content is encoding free
	 */
	var cleanInput = function cleanInput (questionableMarkup) {
		// check for encoding and decode
		while (ENCODED_REGEX.test(questionableMarkup)) {
			questionableMarkup = $('<i>').html(questionableMarkup).text();
		}

		// string completely decoded now encode it
		return $('<i>').text(questionableMarkup).html();
	};




	langx.mixin(fuelux, {
		CONST: CONST,
		cleanInput: cleanInput,
		isBackspaceKey: isBackspaceKey,
		isDeleteKey: isDeleteKey,
		isShiftHeld: isShiftHeld,
		isTabKey: isTabKey,
		isUpArrow: isUpArrow,
		isDownArrow: isDownArrow
	});

/*---------------------------------------------------------------------------------*/

	langx.mixin(fuelux, {
		WidgetBase : langx.Evented
	});

	return fuelux;
});

define('skylark-fuelux/checkbox',[
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-toggles/checkbox",
   "./fuelux"
],function($,plugins,_Checkbox,fuelux){


	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.checkbox;


	var Checkbox = fuelux.Checkbox = _Checkbox.inherit({
	    klassName: "Checkbox",

	    pluginName : "fuelux.checkbox"
	});


    plugins.register(Checkbox,"checkbox");

	$.fn.checkbox.noConflict = function noConflict () {
		$.fn.checkbox = old;
		return this;
	};

	// DATA-API

	/*
	$(document).on('mouseover.fu.checkbox.data-api', '[data-initialize=checkbox]', function initializeCheckboxes (e) {
		var $control = $(e.target);
		if (!$control.data('fu.checkbox')) {
			$control.checkbox($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function onReadyInitializeCheckboxes () {
		$('[data-initialize=checkbox]').each(function initializeCheckbox () {
			var $this = $(this);
			if (!$this.data('fu.checkbox')) {
				$this.checkbox($this.data());
			}
		});
	});
	*/

	return $.fn.checkbox;
});

define('skylark-fuelux/combobox',[
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-popups/combobox",
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


define('skylark-fuelux/datepicker',[
    "skylark-langx/langx",
    "skylark-domx/browser",
    "skylark-domx/eventer",
    "skylark-domx/noder",
    "skylark-domx/geom",
    "skylark-domx/query",
    "./fuelux",
    "skylark-bootstrap3/dropdown"  
], function(langx, browser, eventer, noder, geom, $, fuelux) {


    /*
     * Fuel UX Datepicker
     * https://github.com/ExactTarget/fuelux
     *
     * Copyright (c) 2014 ExactTarget
     * Licensed under the BSD New license.
     */

    var INVALID_DATE = 'Invalid Date';
    var MOMENT_NOT_AVAILABLE = 'moment.js is not available so you cannot use this function';

    var datepickerStack = [];
    var moment = false;
    var old = $.fn.datepicker;
    var requestedMoment = false;

    var runStack = function() {
        var i, l;
        requestedMoment = true;
        for (i = 0, l = datepickerStack.length; i < l; i++) {
            datepickerStack[i].init.call(datepickerStack[i].scope);
        }
        datepickerStack = [];
    };

    /*
    	//only load moment if it's there. otherwise we'll look for it in window.moment
    	if (typeof define === 'function' && define.amd) {//check if AMD is available
    		require(['moment'], function (amdMoment) {
    			moment = amdMoment;
    			runStack();
    		}, function (err) {
    				var failedId = err.requireModules && err.requireModules[0];
    				if (failedId === 'moment') {
    					runStack();
    				}
    			});
    	} else {
    		runStack();
    	}
    */
    // DATEPICKER CONSTRUCTOR AND PROTOTYPE

    var Datepicker = fuelux.Datepicker = fuelux.WidgetBase.inherit({
        klassName: "Datepicker",

        init: function(element, options) {
            this.$element = $(element);
            this.options = langx.mixin({}, $.fn.datepicker.defaults, options);

            this.$calendar = this.$element.find('.datepicker-calendar');
            this.$days = this.$calendar.find('.datepicker-calendar-days');
            this.$header = this.$calendar.find('.datepicker-calendar-header');
            this.$headerTitle = this.$header.find('.title');
            this.$input = this.$element.find('input');
            this.$inputGroupBtn = this.$element.find('.input-group-btn');
            this.$wheels = this.$element.find('.datepicker-wheels');
            this.$wheelsMonth = this.$element.find('.datepicker-wheels-month');
            this.$wheelsYear = this.$element.find('.datepicker-wheels-year');
            this.$dropdown = this.$element.find('[data-toggle="dropdown"]');
            this.$dropdown.dropdown();

            this.artificialScrolling = false;
            this.formatDate = this.options.formatDate || this.formatDate;
            this.inputValue = null;
            this.moment = false;
            this.momentFormat = null;
            this.parseDate = this.options.parseDate || this.parseDate;
            this.preventBlurHide = false;
            this.restricted = this.options.restricted || [];
            this.restrictedParsed = [];
            this.restrictedText = this.options.restrictedText;
            this.sameYearOnly = this.options.sameYearOnly;
            this.selectedDate = null;
            this.yearRestriction = null;

            this.$calendar.find('.datepicker-today').on('click.fu.datepicker', langx.proxy(this.todayClicked, this));
            this.$days.on('click.fu.datepicker', 'tr td button', langx.proxy(this.dateClicked, this));
            this.$header.find('.next').on('click.fu.datepicker', langx.proxy(this.next, this));
            this.$header.find('.prev').on('click.fu.datepicker', langx.proxy(this.prev, this));
            this.$headerTitle.on('click.fu.datepicker', langx.proxy(this.titleClicked, this));
            this.$input.on('change.fu.datepicker', langx.proxy(this.inputChanged, this));
            this.$input.on('mousedown.fu.datepicker', langx.proxy(this.showDropdown, this));
            this.$inputGroupBtn.on('hidden.bs.dropdown', langx.proxy(this.hide, this));
            this.$inputGroupBtn.on('shown.bs.dropdown', langx.proxy(this.show, this));
            this.$wheels.find('.datepicker-wheels-back').on('click.fu.datepicker', langx.proxy(this.backClicked, this));
            this.$wheels.find('.datepicker-wheels-select').on('click.fu.datepicker', langx.proxy(this.selectClicked, this));
            this.$wheelsMonth.on('click.fu.datepicker', 'ul button', langx.proxy(this.monthClicked, this));
            this.$wheelsYear.on('click.fu.datepicker', 'ul button', langx.proxy(this.yearClicked, this));
            this.$wheelsYear.find('ul').on('scroll.fu.datepicker', langx.proxy(this.onYearScroll, this));

            this.$element.on('click.fu.datepicker.data-api', '.datepicker input', function(e) {
                e.stopPropagation();
            });

            this.$element.on('click.fu.datepicker.data-api', '.datepicker .dropdown-menu', function(e) {
                var $target = $(e.target);
                if (!$target.is('.datepicker-date') || $target.closest('.restricted').length) {
                    e.stopPropagation();
                }
            });

            var init = function() {
                if (this.checkForMomentJS()) {
                    moment = moment || window.moment; // need to pull in the global moment if they didn't do it via require
                    this.moment = true;
                    this.momentFormat = this.options.momentConfig.format;
                    this.setCulture(this.options.momentConfig.culture);

                    // support moment with lang (< v2.8) or locale
                    moment.locale = moment.locale || moment.lang;
                }

                this.setRestrictedDates(this.restricted);
                if (!this.setDate(this.options.date)) {
                    this.$input.val('');
                    this.inputValue = this.$input.val();
                }

                if (this.sameYearOnly) {
                    this.yearRestriction = (this.selectedDate) ? this.selectedDate.getFullYear() : new Date().getFullYear();
                }
            };

            if (requestedMoment) {
                init.call(this);
            } else {
                datepickerStack.push({
                    init: init,
                    scope: this
                });
            }
        },

        backClicked: function() {
            this.changeView('calendar');
        },

        changeView: function(view, date) {
            if (view === 'wheels') {
                this.$calendar.hide().attr('aria-hidden', 'true');
                this.$wheels.show().removeAttr('aria-hidden', '');
                if (date) {
                    this.renderWheel(date);
                }

            } else {
                this.$wheels.hide().attr('aria-hidden', 'true');
                this.$calendar.show().removeAttr('aria-hidden', '');
                if (date) {
                    this.renderMonth(date);
                }

            }
        },

        checkForMomentJS: function() {
            if (
                ($.isFunction(window.moment) || (typeof moment !== 'undefined' && $.isFunction(moment))) &&
                $.isPlainObject(this.options.momentConfig) &&
                (typeof this.options.momentConfig.culture === 'string' && typeof this.options.momentConfig.format === 'string')
            ) {
                return true;
            } else {
                return false;
            }
        },

        dateClicked: function(e) {
            var $td = $(e.currentTarget).parents('td').first();
            var date;

            if ($td.hasClass('restricted')) {
                return;
            }

            this.$days.find('td.selected').removeClass('selected');
            $td.addClass('selected');

            date = new Date($td.attr('data-year'), $td.attr('data-month'), $td.attr('data-date'));
            this.selectedDate = date;
            this.$input.val(this.formatDate(date));
            this.inputValue = this.$input.val();
            this.hide();
            this.$input.focus();
            this.$element.trigger('dateClicked.fu.datepicker', date);
        },

        destroy: function() {
            this.$element.remove();
            // any external bindings
            // [none]

            // empty elements to return to original markup
            this.$days.find('tbody').empty();
            this.$wheelsYear.find('ul').empty();

            return this.$element[0].outerHTML;
        },

        disable: function() {
            this.$element.addClass('disabled');
            this.$element.find('input, button').attr('disabled', 'disabled');
            this.$inputGroupBtn.removeClass('open');
        },

        enable: function() {
            this.$element.removeClass('disabled');
            this.$element.find('input, button').removeAttr('disabled');
        },

        formatDate: function(date) {
            var padTwo = function(value) {
                var s = '0' + value;
                return s.substr(s.length - 2);
            };

            if (this.moment) {
                return moment(date).format(this.momentFormat);
            } else {
                return padTwo(date.getMonth() + 1) + '/' + padTwo(date.getDate()) + '/' + date.getFullYear();
            }
        },

        getCulture: function() {
            if (this.moment) {
                return moment.locale();
            } else {
                throw MOMENT_NOT_AVAILABLE;
            }
        },

        getDate: function() {
            return (!this.selectedDate) ? new Date(NaN) : this.selectedDate;
        },

        getFormat: function() {
            if (this.moment) {
                return this.momentFormat;
            } else {
                throw MOMENT_NOT_AVAILABLE;
            }
        },

        getFormattedDate: function() {
            return (!this.selectedDate) ? INVALID_DATE : this.formatDate(this.selectedDate);
        },

        getRestrictedDates: function() {
            return this.restricted;
        },

        inputChanged: function() {
            var inputVal = this.$input.val();
            var date;
            if (inputVal !== this.inputValue) {
                date = this.setDate(inputVal);
                if (date === null) {
                    this.$element.trigger('inputParsingFailed.fu.datepicker', inputVal);
                } else if (date === false) {
                    this.$element.trigger('inputRestrictedDate.fu.datepicker', date);
                } else {
                    this.$element.trigger('changed.fu.datepicker', date);
                }

            }
        },

        show: function() {
            var date = (this.selectedDate) ? this.selectedDate : new Date();
            this.changeView('calendar', date);
            this.$inputGroupBtn.addClass('open');
            this.$element.trigger('shown.fu.datepicker');
        },

        showDropdown: function(e) { //input mousedown handler, name retained for legacy support of showDropdown
            if (!this.$input.is(':focus') && !this.$inputGroupBtn.hasClass('open')) {
                this.show();
            }
        },

        hide: function() {
            this.$inputGroupBtn.removeClass('open');
            this.$element.trigger('hidden.fu.datepicker');
        },

        hideDropdown: function() { //for legacy support of hideDropdown
            this.hide();
        },

        isInvalidDate: function(date) {
            var dateString = date.toString();
            if (dateString === INVALID_DATE || dateString === 'NaN') {
                return true;
            }

            return false;
        },

        isRestricted: function(date, month, year) {
            var restricted = this.restrictedParsed;
            var i, from, l, to;

            if (this.sameYearOnly && this.yearRestriction !== null && year !== this.yearRestriction) {
                return true;
            }

            for (i = 0, l = restricted.length; i < l; i++) {
                from = restricted[i].from;
                to = restricted[i].to;
                if (
                    (year > from.year || (year === from.year && month > from.month) || (year === from.year && month === from.month && date >= from.date)) &&
                    (year < to.year || (year === to.year && month < to.month) || (year === to.year && month === to.month && date <= to.date))
                ) {
                    return true;
                }

            }

            return false;
        },

        monthClicked: function(e) {
            this.$wheelsMonth.find('.selected').removeClass('selected');
            $(e.currentTarget).parent().addClass('selected');
        },

        next: function() {
            var month = this.$headerTitle.attr('data-month');
            var year = this.$headerTitle.attr('data-year');
            month++;
            if (month > 11) {
                if (this.sameYearOnly) {
                    return;
                }

                month = 0;
                year++;
            }

            this.renderMonth(new Date(year, month, 1));
        },

        onYearScroll: function(e) {
            if (this.artificialScrolling) {
                return;
            }

            var $yearUl = $(e.currentTarget);
            var height = ($yearUl.css('box-sizing') === 'border-box') ? $yearUl.outerHeight() : $yearUl.height();
            var scrollHeight = $yearUl.get(0).scrollHeight;
            var scrollTop = $yearUl.scrollTop();
            var bottomPercentage = (height / (scrollHeight - scrollTop)) * 100;
            var topPercentage = (scrollTop / scrollHeight) * 100;
            var i, start;

            if (topPercentage < 5) {
                start = parseInt($yearUl.find('li:first').attr('data-year'), 10);
                for (i = (start - 1); i > (start - 11); i--) {
                    $yearUl.prepend('<li data-year="' + i + '"><button type="button">' + i + '</button></li>');
                }
                this.artificialScrolling = true;
                $yearUl.scrollTop(($yearUl.get(0).scrollHeight - scrollHeight) + scrollTop);
                this.artificialScrolling = false;
            } else if (bottomPercentage > 90) {
                start = parseInt($yearUl.find('li:last').attr('data-year'), 10);
                for (i = (start + 1); i < (start + 11); i++) {
                    $yearUl.append('<li data-year="' + i + '"><button type="button">' + i + '</button></li>');
                }
            }
        },

        //some code ripped from http://stackoverflow.com/questions/2182246/javascript-dates-in-ie-nan-firefox-chrome-ok
        parseDate: function(date) {
            var self = this;
            var BAD_DATE = new Date(NaN);
            var dt, isoExp, momentParse, momentParseWithFormat, tryMomentParseAll, month, parts, use;

            if (date) {
                if (this.moment) { //if we have moment, use that to parse the dates
                    momentParseWithFormat = function(d) {
                        var md = moment(d, self.momentFormat);
                        return (true === md.isValid()) ? md.toDate() : BAD_DATE;
                    };
                    momentParse = function(d) {
                        var md = moment(new Date(d));
                        return (true === md.isValid()) ? md.toDate() : BAD_DATE;
                    };

                    tryMomentParseAll = function(rawDateString, parseFunc1, parseFunc2) {
                        var pd = parseFunc1(rawDateString);
                        if (!self.isInvalidDate(pd)) {
                            return pd;
                        }

                        pd = parseFunc2(rawDateString);
                        if (!self.isInvalidDate(pd)) {
                            return pd;
                        }

                        return BAD_DATE;
                    };

                    if ('string' === typeof(date)) {
                        // Attempts to parse date strings using this.momentFormat, falling back on newing a date
                        return tryMomentParseAll(date, momentParseWithFormat, momentParse);
                    } else {
                        // Attempts to parse date by newing a date object directly, falling back on parsing using this.momentFormat
                        return tryMomentParseAll(date, momentParse, momentParseWithFormat);
                    }

                } else { //if moment isn't present, use previous date parsing strategy
                    if (typeof(date) === 'string') {
                        dt = new Date(Date.parse(date));
                        if (!this.isInvalidDate(dt)) {
                            return dt;
                        } else {
                            date = date.split('T')[0];
                            isoExp = /^\s*(\d{4})-(\d\d)-(\d\d)\s*$/;
                            parts = isoExp.exec(date);
                            if (parts) {
                                month = parseInt(parts[2], 10);
                                dt = new Date(parts[1], month - 1, parts[3]);
                                if (month === (dt.getMonth() + 1)) {
                                    return dt;
                                }

                            }

                        }

                    } else {
                        dt = new Date(date);
                        if (!this.isInvalidDate(dt)) {
                            return dt;
                        }

                    }

                }

            }

            return new Date(NaN);
        },

        prev: function() {
            var month = this.$headerTitle.attr('data-month');
            var year = this.$headerTitle.attr('data-year');
            month--;
            if (month < 0) {
                if (this.sameYearOnly) {
                    return;
                }

                month = 11;
                year--;
            }

            this.renderMonth(new Date(year, month, 1));
        },

        renderMonth: function(date) {
            date = date || new Date();

            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
            var lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            var lastMonthDate = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
            var $month = this.$headerTitle.find('.month');
            var month = date.getMonth();
            var now = new Date();
            var nowDate = now.getDate();
            var nowMonth = now.getMonth();
            var nowYear = now.getFullYear();
            var selected = this.selectedDate;
            var $tbody = this.$days.find('tbody');
            var year = date.getFullYear();
            var curDate, curMonth, curYear, i, j, rows, stage, previousStage, lastStage, $td, $tr;

            if (selected) {
                selected = {
                    date: selected.getDate(),
                    month: selected.getMonth(),
                    year: selected.getFullYear()
                };
            }

            $month.find('.current').removeClass('current');
            $month.find('span[data-month="' + month + '"]').addClass('current');
            this.$headerTitle.find('.year').text(year);
            this.$headerTitle.attr({
                'data-month': month,
                'data-year': year
            });


            $tbody.empty();
            if (firstDay !== 0) {
                curDate = lastMonthDate - firstDay + 1;
                stage = -1;
            } else {
                curDate = 1;
                stage = 0;
            }

            rows = (lastDate <= (35 - firstDay)) ? 5 : 6;
            for (i = 0; i < rows; i++) {
                $tr = $('<tr></tr>');
                for (j = 0; j < 7; j++) {
                    $td = $('<td></td>');
                    if (stage === -1) {
                        $td.addClass('last-month');
                        if (previousStage !== stage) {
                            $td.addClass('first');
                        }
                    } else if (stage === 1) {
                        $td.addClass('next-month');
                        if (previousStage !== stage) {
                            $td.addClass('first');
                        }
                    }

                    curMonth = month + stage;
                    curYear = year;
                    if (curMonth < 0) {
                        curMonth = 11;
                        curYear--;
                    } else if (curMonth > 11) {
                        curMonth = 0;
                        curYear++;
                    }

                    $td.attr({
                        'data-date': curDate,
                        'data-month': curMonth,
                        'data-year': curYear
                    });
                    if (curYear === nowYear && curMonth === nowMonth && curDate === nowDate) {
                        $td.addClass('current-day');
                    } else if (curYear < nowYear || (curYear === nowYear && curMonth < nowMonth) ||
                        (curYear === nowYear && curMonth === nowMonth && curDate < nowDate)) {
                        $td.addClass('past');
                        if (!this.options.allowPastDates) {
                            $td.addClass('restricted').attr('title', this.restrictedText);
                        }

                    }

                    if (this.isRestricted(curDate, curMonth, curYear)) {
                        $td.addClass('restricted').attr('title', this.restrictedText);
                    }

                    if (selected && curYear === selected.year && curMonth === selected.month && curDate === selected.date) {
                        $td.addClass('selected');
                    }

                    if ($td.hasClass('restricted')) {
                        $td.html('<span><b class="datepicker-date">' + curDate + '</b></span>');
                    } else {
                        $td.html('<span><button type="button" class="datepicker-date">' + curDate + '</button></span>');
                    }

                    curDate++;
                    lastStage = previousStage;
                    previousStage = stage;
                    if (stage === -1 && curDate > lastMonthDate) {
                        curDate = 1;
                        stage = 0;
                        if (lastStage !== stage) {
                            $td.addClass('last');
                        }
                    } else if (stage === 0 && curDate > lastDate) {
                        curDate = 1;
                        stage = 1;
                        if (lastStage !== stage) {
                            $td.addClass('last');
                        }
                    }
                    if (i === (rows - 1) && j === 6) {
                        $td.addClass('last');
                    }

                    $tr.append($td);
                }
                $tbody.append($tr);
            }
        },

        renderWheel: function(date) {
            var month = date.getMonth();
            var $monthUl = this.$wheelsMonth.find('ul');
            var year = date.getFullYear();
            var $yearUl = this.$wheelsYear.find('ul');
            var i, $monthSelected, $yearSelected;

            if (this.sameYearOnly) {
                this.$wheelsMonth.addClass('full');
                this.$wheelsYear.addClass('hidden');
            } else {
                this.$wheelsMonth.removeClass('full');
                this.$wheelsYear.removeClass('hide hidden'); // .hide is deprecated
            }

            $monthUl.find('.selected').removeClass('selected');
            $monthSelected = $monthUl.find('li[data-month="' + month + '"]');
            $monthSelected.addClass('selected');
            $monthUl.scrollTop($monthUl.scrollTop() + ($monthSelected.position().top - $monthUl.outerHeight() / 2 - $monthSelected.outerHeight(true) / 2));

            $yearUl.empty();
            for (i = (year - 10); i < (year + 11); i++) {
                $yearUl.append('<li data-year="' + i + '"><button type="button">' + i + '</button></li>');
            }
            $yearSelected = $yearUl.find('li[data-year="' + year + '"]');
            $yearSelected.addClass('selected');
            this.artificialScrolling = true;
            $yearUl.scrollTop($yearUl.scrollTop() + ($yearSelected.position().top - $yearUl.outerHeight() / 2 - $yearSelected.outerHeight(true) / 2));
            this.artificialScrolling = false;
            $monthSelected.find('button').focus();
        },

        selectClicked: function() {
            var month = this.$wheelsMonth.find('.selected').attr('data-month');
            var year = this.$wheelsYear.find('.selected').attr('data-year');
            this.changeView('calendar', new Date(year, month, 1));
        },

        setCulture: function(cultureCode) {
            if (!cultureCode) {
                return false;
            }

            if (this.moment) {
                moment.locale(cultureCode);
            } else {
                throw MOMENT_NOT_AVAILABLE;
            }
        },

        setDate: function(date) {
            var parsed = this.parseDate(date);
            if (!this.isInvalidDate(parsed)) {
                if (!this.isRestricted(parsed.getDate(), parsed.getMonth(), parsed.getFullYear())) {
                    this.selectedDate = parsed;
                    this.renderMonth(parsed);
                    this.$input.val(this.formatDate(parsed));
                } else {
                    this.selectedDate = false;
                    this.renderMonth();
                }

            } else {
                this.selectedDate = null;
                this.renderMonth();
            }

            this.inputValue = this.$input.val();
            return this.selectedDate;
        },

        setFormat: function(format) {
            if (!format) {
                return false;
            }

            if (this.moment) {
                this.momentFormat = format;
            } else {
                throw MOMENT_NOT_AVAILABLE;
            }
        },

        setRestrictedDates: function(restricted) {
            var parsed = [];
            var self = this;
            var i, l;

            var parseItem = function(val) {
                if (val === -Infinity) {
                    return {
                        date: -Infinity,
                        month: -Infinity,
                        year: -Infinity
                    };
                } else if (val === Infinity) {
                    return {
                        date: Infinity,
                        month: Infinity,
                        year: Infinity
                    };
                } else {
                    val = self.parseDate(val);
                    return {
                        date: val.getDate(),
                        month: val.getMonth(),
                        year: val.getFullYear()
                    };
                }
            };

            this.restricted = restricted;
            for (i = 0, l = restricted.length; i < l; i++) {
                parsed.push({
                    from: parseItem(restricted[i].from),
                    to: parseItem(restricted[i].to)
                });
            }
            this.restrictedParsed = parsed;
        },

        titleClicked: function(e) {
            this.changeView('wheels', new Date(this.$headerTitle.attr('data-year'), this.$headerTitle.attr('data-month'), 1));
        },

        todayClicked: function(e) {
            var date = new Date();

            if ((date.getMonth() + '') !== this.$headerTitle.attr('data-month') || (date.getFullYear() + '') !== this.$headerTitle.attr('data-year')) {
                this.renderMonth(date);
            }
        },

        yearClicked: function(e) {
            this.$wheelsYear.find('.selected').removeClass('selected');
            $(e.currentTarget).parent().addClass('selected');
        }

    });

    //for control library consistency
    Datepicker.prototype.getValue = Datepicker.prototype.getDate;

    // DATEPICKER PLUGIN DEFINITION

    $.fn.datepicker = function(option) {
        var args = Array.prototype.slice.call(arguments, 1);
        var methodReturn;

        var $set = this.each(function() {
            var $this = $(this);
            var data = $this.data('fu.datepicker');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('fu.datepicker', (data = new Datepicker(this, options)));
            }

            if (typeof option === 'string') {
                methodReturn = data[option].apply(data, args);
            }
        });

        return (methodReturn === undefined) ? $set : methodReturn;
    };

    $.fn.datepicker.defaults = {
        allowPastDates: false,
        date: new Date(),
        formatDate: null,
        momentConfig: {
            culture: 'en',
            format: 'L' // more formats can be found here http://momentjs.com/docs/#/customization/long-date-formats/.
        },
        parseDate: null,
        restricted: [], //accepts an array of objects formatted as so: { from: {{date}}, to: {{date}} }  (ex: [ { from: new Date('12/11/2014'), to: new Date('03/31/2015') } ])
        restrictedText: 'Restricted',
        sameYearOnly: false
    };

    $.fn.datepicker.Constructor = Datepicker;

    $.fn.datepicker.noConflict = function() {
        $.fn.datepicker = old;
        return this;
    };

    // DATA-API

    /*
    $(document).on('mousedown.fu.datepicker.data-api', '[data-initialize=datepicker]', function (e) {
    	var $control = $(e.target).closest('.datepicker');
    	if (!$control.data('datepicker')) {
    		$control.datepicker($control.data());
    	}
    });

    //used to prevent the dropdown from closing when clicking within it's bounds
    $(document).on('click.fu.datepicker.data-api', '.datepicker .dropdown-menu', function (e) {
    	var $target = $(e.target);
    	if (!$target.is('.datepicker-date') || $target.closest('.restricted').length) {
    		e.stopPropagation();
    	}
    });

    //used to prevent the dropdown from closing when clicking on the input
    $(document).on('click.fu.datepicker.data-api', '.datepicker input', function (e) {
    	e.stopPropagation();
    });

    $(function () {
    	$('[data-initialize=datepicker]').each(function () {
    		var $this = $(this);
    		if ($this.data('datepicker')) {
    			return;
    		}

    		$this.datepicker($this.data());
    	});
    });
    */

    return $.fn.datepicker;
});
define('skylark-fuelux/dropdown-autoflip',[
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux",
  "skylark-bootstrap3/dropdown"    
],function(langx,browser,eventer,noder,geom,$){

	/*
	 * Fuel UX dropdownautoflip
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

define('skylark-fuelux/infinite-scroll',[
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-scrolls/infinite-scroll",
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

define('skylark-fuelux/loader',[
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

define('skylark-fuelux/picker',[
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Picker
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */
	var old = $.fn.picker;

	// PLACARD CONSTRUCTOR AND PROTOTYPE


	var Picker = fuelux.Picker = fuelux.WidgetBase.inherit({
		klassName: "Picker",

		init : function(element,options) {
			var self = this;
			this.$element = $(element);
			this.options = langx.mixin({}, $.fn.picker.defaults, options);

			this.$accept = this.$element.find('.picker-accept');
			this.$cancel = this.$element.find('.picker-cancel');
			this.$trigger = this.$element.find('.picker-trigger');
			this.$footer = this.$element.find('.picker-footer');
			this.$header = this.$element.find('.picker-header');
			this.$popup = this.$element.find('.picker-popup');
			this.$body = this.$element.find('.picker-body');

			this.clickStamp = '_';

			this.isInput = this.$trigger.is('input');

			this.$trigger.on('keydown.fu.picker', langx.proxy(this.keyComplete, this));
			this.$trigger.on('focus.fu.picker', langx.proxy(function inputFocus(e){
				if(typeof e === "undefined" || $(e.target).is('input[type=text]')){
					langx.proxy(this.show(), this);
				}
			}, this));
			this.$trigger.on('click.fu.picker', langx.proxy(function triggerClick(e){
				if(!$(e.target).is('input[type=text]')){
					langx.proxy(this.toggle(), this);
				}else{
					langx.proxy(this.show(), this);
				}
			}, this));
			this.$accept.on('click.fu.picker', langx.proxy(this.complete, this, 'accepted'));
			this.$cancel.on('click.fu.picker', function (e) {
				e.preventDefault(); self.complete('cancelled');
			});
		},

		complete: function complete(action) {
			var EVENT_CALLBACK_MAP = {
				'accepted': 'onAccept',
				'cancelled': 'onCancel',
				'exited': 'onExit'
			};
			var func = this.options[ EVENT_CALLBACK_MAP[action] ];

			var obj = {
				contents: this.$body
			};

			if (func) {
				func(obj);
				this.$element.trigger(action + '.fu.picker', obj);
			} else {
				this.$element.trigger(action + '.fu.picker', obj);
				this.hide();
			}
		},

		keyComplete: function keyComplete(e) {
			if (this.isInput && e.keyCode === 13) {
				this.complete('accepted');
				this.$trigger.blur();
			} else if (e.keyCode === 27) {
				this.complete('exited');
				this.$trigger.blur();
			}
		},

		destroy: function destroy() {
			this.$element.remove();
			// remove any external bindings
			$(document).off('click.fu.picker.externalClick.' + this.clickStamp);
			// empty elements to return to original markup
			// [none]
			// return string of markup
			return this.$element[0].outerHTML;
		},

		disable: function disable() {
			this.$element.addClass('disabled');
			this.$trigger.attr('disabled', 'disabled');
		},

		enable: function enable() {
			this.$element.removeClass('disabled');
			this.$trigger.removeAttr('disabled');
		},

		toggle: function toggle() {
			if (this.$element.hasClass('showing')) {
				this.hide();
			}else{
				this.show();
			}
		},

		hide: function hide() {
			if (!this.$element.hasClass('showing')) {
				return;
			}

			this.$element.removeClass('showing');
			$(document).off('click.fu.picker.externalClick.' + this.clickStamp);
			this.$element.trigger('hidden.fu.picker');
		},

		externalClickListener: function externalClickListener(e, force) {
			if (force === true || this.isExternalClick(e)) {
				this.complete('exited');
			}
		},

		isExternalClick: function isExternalClick(e) {
			var el = this.$element.get(0);
			var exceptions = this.options.externalClickExceptions || [];
			var $originEl = $(e.target);
			var i, l;

			if (e.target === el || $originEl.parents('.picker').get(0) === el) {
				return false;
			} else {
				for (i = 0, l = exceptions.length; i < l; i++) {
					if ($originEl.is(exceptions[i]) || $originEl.parents(exceptions[i]).length > 0) {
						return false;
					}

				}
			}

			return true;
		},

		show: function show() {
			var other;

			other = $(document).find('.picker.showing');
			if (other.length > 0) {
				if (other.data('fu.picker') && other.data('fu.picker').options.explicit) {
					return;
				}

				other.picker('externalClickListener', {}, true);
			}

			this.$element.addClass('showing');

			_display(this);

			this.$element.trigger('shown.fu.picker');

			this.clickStamp = new Date().getTime() + (Math.floor(Math.random() * 100) + 1);
			if (!this.options.explicit) {
				$(document).on('click.fu.picker.externalClick.' + this.clickStamp, langx.proxy(this.externalClickListener, this));
			}
		}
	});

	var _isOffscreen = function _isOffscreen(picker) {
		var windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		var scrollTop = $(document).scrollTop();
		var popupTop = picker.$popup.offset();
		var popupBottom = popupTop.top + picker.$popup.outerHeight(true);

		//if the bottom of the popup goes off the page, but the top does not, dropup.
		if (popupBottom > windowHeight + scrollTop || popupTop.top < scrollTop){
			return true;
		}else{//otherwise, prefer showing the top of the popup only vs the bottom
			return false;
		}
	};

	var _display = function _display(picker) {
		picker.$popup.css('visibility', 'hidden');

		_showBelow(picker);

		//if part of the popup is offscreen try to show it above
		if(_isOffscreen(picker)){
			_showAbove(picker);

			//if part of the popup is still offscreen, prefer cutting off the bottom
			if(_isOffscreen(picker)){
				_showBelow(picker);
			}
		}

		picker.$popup.css('visibility', 'visible');
	};

	var _showAbove = function _showAbove(picker) {
		picker.$popup.css('top', - picker.$popup.outerHeight(true) + 'px');
	};

	var _showBelow = function _showBelow(picker) {
		picker.$popup.css('top', picker.$trigger.outerHeight(true) + 'px');
	};


	// PLACARD PLUGIN DEFINITION

	$.fn.picker = function picker(option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.picker');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.picker', (data = new Picker(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.picker.defaults = {
		onAccept: undefined,
		onCancel: undefined,
		onExit: undefined,
		externalClickExceptions: [],
		explicit: false
	};

	$.fn.picker.Constructor = Picker;

	$.fn.picker.noConflict = function noConflict() {
		$.fn.picker = old;
		return this;
	};

	// DATA-API

	/*
	$(document).on('focus.fu.picker.data-api', '[data-initialize=picker]', function (e) {
		var $control = $(e.target).closest('.picker');
		if (!$control.data('fu.picker')) {
			$control.picker($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=picker]').each(function () {
			var $this = $(this);
			if ($this.data('fu.picker')) return;
			$this.picker($this.data());
		});
	});
	*/

	return $.fn.picker;
});

define('skylark-fuelux/pillbox',[
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux",
  "./dropdown-autoflip"
],function(langx,browser,eventer,noder,geom,$,fuelux){

	/*
	 * Fuel UX Pillbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	// -- END UMD WRAPPER PREFACE --

	// -- BEGIN MODULE CODE HERE --

	var old = $.fn.pillbox;

	var CONST = fuelux.CONST;
	var COMMA_KEYCODE = CONST.COMMA_KEYCODE;
	var ENTER_KEYCODE = CONST.ENTER_KEYCODE;
	var isBackspaceKey = fuelux.isBackspaceKey;
	var isDeleteKey = fuelux.isDeleteKey;
	var isTabKey = fuelux.isTabKey;
	var isUpArrow = fuelux.isUpArrow;
	var isDownArrow = fuelux.isDownArrow;
	var cleanInput = fuelux.cleanInput;
	var isShiftHeld = fuelux.isShiftHeld;

	// PILLBOX CONSTRUCTOR AND PROTOTYPE

	var Pillbox = fuelux.Pillbox = fuelux.WidgetBase.inherit({
		klassName: "Pillbox",

		init : function(element,options) {
			this.$element = $(element);
			this.$moreCount = this.$element.find('.pillbox-more-count');
			this.$pillGroup = this.$element.find('.pill-group');
			this.$addItem = this.$element.find('.pillbox-add-item');
			this.$addItemWrap = this.$addItem.parent();
			this.$suggest = this.$element.find('.suggest');
			this.$pillHTML = '<li class="btn btn-default pill">' +
			'	<span></span>' +
			'	<span class="glyphicon glyphicon-close">' +
			'		<span class="sr-only">Remove</span>' +
			'	</span>' +
			'</li>';

			this.options = langx.mixin({}, $.fn.pillbox.defaults, options);

			if (this.options.readonly === -1) {
				if (this.$element.attr('data-readonly') !== undefined) {
					this.readonly(true);
				}
			} else if (this.options.readonly) {
				this.readonly(true);
			}

			// EVENTS
			this.acceptKeyCodes = this._generateObject(this.options.acceptKeyCodes);
			// Create an object out of the key code array, so we don't have to loop through it on every key stroke

			this.$element.on('click.fu.pillbox', '.pill-group > .pill', langx.proxy(this.itemClicked, this));
			this.$element.on('click.fu.pillbox', langx.proxy(this.inputFocus, this));
			this.$element.on('keydown.fu.pillbox', '.pillbox-add-item', langx.proxy(this.inputEvent, this));
			if (this.options.onKeyDown) {
				this.$element.on('mousedown.fu.pillbox', '.suggest > li', langx.proxy(this.suggestionClick, this));
			}

			if (this.options.edit) {
				this.$element.addClass('pills-editable');
				this.$element.on('blur.fu.pillbox', '.pillbox-add-item', langx.proxy(this.cancelEdit, this));
			}
			this.$element.on('blur.fu.pillbox', '.pillbox-add-item', langx.proxy(this.inputEvent, this));
		},

		destroy: function destroy () {
			this.$element.remove();
			// any external bindings
			// [none]
			// empty elements to return to original markup
			// [none]
			// returns string of markup
			return this.$element[0].outerHTML;
		},

		items: function items () {
			var self = this;

			return this.$pillGroup.children('.pill').map(function getItemsData () {
				return self.getItemData($(this));
			}).get();
		},

		itemClicked: function itemClicked (e) {
			var $target = $(e.target);
			var $item;

			e.preventDefault();
			e.stopPropagation();
			this._closeSuggestions();

			if (!$target.hasClass('pill')) {
				$item = $target.parent();
				if (this.$element.attr('data-readonly') === undefined) {
					if ($target.hasClass('glyphicon-close')) {
						if (this.options.onRemove) {
							this.options.onRemove(this.getItemData($item, {
								el: $item
							}), langx.proxy(this._removeElement, this));
						} else {
							this._removeElement(this.getItemData($item, {
								el: $item
							}));
						}

						return false;
					} else if (this.options.edit) {
						if ($item.find('.pillbox-list-edit').length) {
							return false;
						}

						this.openEdit($item);
					}
				}
			} else {
				$item = $target;
			}

			this.$element.trigger('clicked.fu.pillbox', this.getItemData($item));

			return true;
		},

		readonly: function readonly (enable) {
			if (enable) {
				this.$element.attr('data-readonly', 'readonly');
			} else {
				this.$element.removeAttr('data-readonly');
			}

			if (this.options.truncate) {
				this.truncate(enable);
			}
		},

		suggestionClick: function suggestionClick (e) {
			var $item = $(e.currentTarget);
			var item = {
				text: $item.html(),
				value: $item.data('value')
			};

			e.preventDefault();
			this.$addItem.val('');

			if ($item.data('attr')) {
				item.attr = JSON.parse($item.data('attr'));
			}

			item.data = $item.data('data');

			this.addItems(item, true);

			// needs to be after addItems for IE
			this._closeSuggestions();
		},

		itemCount: function itemCount () {
			return this.$pillGroup.children('.pill').length;
		},

		// First parameter is 1 based index (optional, if index is not passed all new items will be appended)
		// Second parameter can be array of objects [{ ... }, { ... }] or you can pass n additional objects as args
		// object structure is as follows (attr and value are optional): { text: '', value: '', attr: {}, data: {} }
		addItems: function addItems () {
			var self = this;
			var items;
			var index;
			var isInternal;

			if (isFinite(String(arguments[0])) && !(arguments[0] instanceof Array)) {
				items = [].slice.call(arguments).slice(1);
				index = arguments[0];
			} else {
				items = [].slice.call(arguments).slice(0);
				isInternal = items[1] && !items[1].text;
			}

			// If first argument is an array, use that, otherwise they probably passed each thing through as a separate arg, so use items as-is
			if (items[0] instanceof Array) {
				items = items[0];
			}

			if (items.length) {
				langx.each(items, function normalizeItemsObject (i, value) {
					var data = {
						text: value.text,
						value: (value.value ? value.value : value.text),
						el: self.$pillHTML
					};

					if (value.attr) {
						data.attr = value.attr;
					}

					if (value.data) {
						data.data = value.data;
					}

					items[i] = data;
				});

				if (this.options.edit && this.currentEdit) {
					items[0].el = this.currentEdit.wrap('<div></div>').parent().html();
				}

				if (isInternal) {
					items.pop(1);
				}

				if (self.options.onAdd && isInternal) {
					if (this.options.edit && this.currentEdit) {
						self.options.onAdd(items[0], langx.proxy(self.saveEdit, this));
					} else {
						self.options.onAdd(items[0], langx.proxy(self.placeItems, this));
					}
				} else if (this.options.edit && this.currentEdit) {
					self.saveEdit(items);
				} else if (index) {
					self.placeItems(index, items);
				} else {
					self.placeItems(items, isInternal);
				}
			}
		},

		// First parameter is the index (1 based) to start removing items
		// Second parameter is the number of items to be removed
		removeItems: function removeItems (index, howMany) {
			var self = this;

			if (!index) {
				this.$pillGroup.find('.pill').remove();
				this._removePillTrigger({
					method: 'removeAll'
				});
			} else {
				var itemsToRemove = howMany ? howMany : 1;

				for (var item = 0; item < itemsToRemove; item++) {
					var $currentItem = self.$pillGroup.find('> .pill:nth-child(' + index + ')');

					if ($currentItem) {
						$currentItem.remove();
					} else {
						break;
					}
				}
			}
		},

		// First parameter is index (optional)
		// Second parameter is new arguments
		placeItems: function placeItems () {
			var items;
			var index;
			var $neighbor;
			var isInternal;

			if (isFinite(String(arguments[0])) && !(arguments[0] instanceof Array)) {
				items = [].slice.call(arguments).slice(1);
				index = arguments[0];
			} else {
				items = [].slice.call(arguments).slice(0);
				isInternal = items[1] && !items[1].text;
			}

			if (items[0] instanceof Array) {
				items = items[0];
			}

			if (items.length) {
				var newItems = [];
				langx.each(items, function prepareItemForAdd (i, item) {
					var $item = $(item.el);

					$item.attr('data-value', item.value);
					$item.find('span:first').html(item.text);

					// DOM attributes
					if (item.attr) {
						langx.each(item.attr, function handleDOMAttributes (key, value) {
							if (key === 'cssClass' || key === 'class') {
								$item.addClass(value);
							} else {
								$item.attr(key, value);
							}
						});
					}

					if (item.data) {
						$item.data('data', item.data);
					}

					newItems.push($item);
				});

				if (this.$pillGroup.children('.pill').length > 0) {
					if (index) {
						$neighbor = this.$pillGroup.find('.pill').eq(index);

						if ($neighbor.length) {
							$neighbor.before(newItems);
						} else {
							this.$pillGroup.children('.pill').last().after(newItems);
						}
					} else {
						this.$pillGroup.children('.pill').last().after(newItems);
					}
				} else {
					this.$pillGroup.prepend(newItems);
				}

				if (isInternal) {
					this.$element.trigger('added.fu.pillbox', {
						text: items[0].text,
						value: items[0].value
					});
				}
			}
		},

		inputEvent: function inputEvent (e) {
			var self = this;
			var text = self.options.cleanInput(this.$addItem.val());
			var isFocusOutEvent = e.type === 'focusout';
			var blurredAfterInput = (isFocusOutEvent && text.length > 0);
			// If we test for keycode only, it will match for `<` & `,` instead of just `,`
			// This way users can type `<3` and `1 < 3`, etc...
			var acceptKeyPressed = (this.acceptKeyCodes[e.keyCode] && !isShiftHeld(e));

			if (acceptKeyPressed || blurredAfterInput) {
				var attr;
				var value;

				if (this.options.onKeyDown && this._isSuggestionsOpen()) {
					var $selection = this.$suggest.find('.pillbox-suggest-sel');

					if ($selection.length) {
						text = self.options.cleanInput($selection.html());
						value = self.options.cleanInput($selection.data('value'));
						attr = $selection.data('attr');
					}
				}

				// ignore comma and make sure text that has been entered (protects against " ,". https://github.com/ExactTarget/fuelux/issues/593), unless allowEmptyPills is true.
				if (text.replace(/[ ]*\,[ ]*/, '').match(/\S/) || (this.options.allowEmptyPills && text.length)) {
					this._closeSuggestions();
					this.$addItem.val('').hide();

					if (attr) {
						this.addItems({
							text: text,
							value: value,
							attr: JSON.parse(attr)
						}, true);
					} else {
						this.addItems({
							text: text,
							value: value
						}, true);
					}

					setTimeout(function clearAddItemInput () {
						self.$addItem.show().attr({
							size: 10
						}).focus();
					}, 0);
				}

				e.preventDefault();
				return true;
			} else if (isBackspaceKey(e) || isDeleteKey(e)) {
				if (!text.length) {
					e.preventDefault();

					if (this.options.edit && this.currentEdit) {
						this.cancelEdit();
						return true;
					}

					this._closeSuggestions();
					var $lastItem = this.$pillGroup.children('.pill:last');

					if ($lastItem.hasClass('pillbox-highlight')) {
						this._removeElement(this.getItemData($lastItem, {
							el: $lastItem
						}));
					} else {
						$lastItem.addClass('pillbox-highlight');
					}

					return true;
				}
			} else if (text.length > 10) {
				if (this.$addItem.width() < (this.$pillGroup.width() - 6)) {
					this.$addItem.attr({
						size: text.length + 3
					});
				}
			}

			this.$pillGroup.find('.pill').removeClass('pillbox-highlight');

			if (this.options.onKeyDown && !isFocusOutEvent) {
				if (
					isTabKey(e) ||
					isUpArrow(e) ||
					isDownArrow(e)
				) {
					if (this._isSuggestionsOpen()) {
						this._keySuggestions(e);
					}

					return true;
				}

				// only allowing most recent event callback to register
				this.callbackId = e.timeStamp;
				this.options.onKeyDown({
					event: e,
					value: text
				}, function callOpenSuggestions (data) {
					self._openSuggestions(e, data);
				});
			}

			return true;
		},

		openEdit: function openEdit (el) {
			var targetChildIndex = el.index() + 1;
			var $addItemWrap = this.$addItemWrap.detach().hide();

			this.$pillGroup.find('.pill:nth-child(' + targetChildIndex + ')').before($addItemWrap);
			this.currentEdit = el.detach();

			$addItemWrap.addClass('editing');
			this.$addItem.val(el.find('span:first').html());
			$addItemWrap.show();
			this.$addItem.focus().select();
		},

		cancelEdit: function cancelEdit (e) {
			var $addItemWrap;
			if (!this.currentEdit) {
				return false;
			}

			this._closeSuggestions();
			if (e) {
				this.$addItemWrap.before(this.currentEdit);
			}

			this.currentEdit = false;

			$addItemWrap = this.$addItemWrap.detach();
			$addItemWrap.removeClass('editing');
			this.$addItem.val('');
			this.$pillGroup.append($addItemWrap);

			return true;
		},

		// Must match syntax of placeItem so addItem callback is called when an item is edited
		// expecting to receive an array back from the callback containing edited items
		saveEdit: function saveEdit () {
			var item = arguments[0][0] ? arguments[0][0] : arguments[0];

			this.currentEdit = $(item.el);
			this.currentEdit.data('value', item.value);
			this.currentEdit.find('span:first').html(item.text);

			this.$addItemWrap.hide();
			this.$addItemWrap.before(this.currentEdit);
			this.currentEdit = false;

			this.$addItem.val('');
			this.$addItemWrap.removeClass('editing');
			this.$pillGroup.append(this.$addItemWrap.detach().show());
			this.$element.trigger('edited.fu.pillbox', {
				value: item.value,
				text: item.text
			});
		},

		removeBySelector: function removeBySelector () {
			var selectors = [].slice.call(arguments).slice(0);
			var self = this;

			langx.each(selectors, function doRemove (i, sel) {
				self.$pillGroup.find(sel).remove();
			});

			this._removePillTrigger({
				method: 'removeBySelector',
				removedSelectors: selectors
			});
		},

		removeByValue: function removeByValue () {
			var values = [].slice.call(arguments).slice(0);
			var self = this;

			langx.each(values, function doRemove (i, val) {
				self.$pillGroup.find('> .pill[data-value="' + val + '"]').remove();
			});

			this._removePillTrigger({
				method: 'removeByValue',
				removedValues: values
			});
		},

		removeByText: function removeByText () {
			var text = [].slice.call(arguments).slice(0);
			var self = this;

			langx.each(text, function doRemove (i, matchingText) {
				self.$pillGroup.find('> .pill:contains("' + matchingText + '")').remove();
			});

			this._removePillTrigger({
				method: 'removeByText',
				removedText: text
			});
		},

		truncate: function truncate (enable) {
			var self = this;

			this.$element.removeClass('truncate');
			this.$addItemWrap.removeClass('truncated');
			this.$pillGroup.find('.pill').removeClass('truncated');

			if (enable) {
				this.$element.addClass('truncate');

				var availableWidth = this.$element.width();
				var containerFull = false;
				var processedPills = 0;
				var totalPills = this.$pillGroup.find('.pill').length;
				var widthUsed = 0;

				this.$pillGroup.find('.pill').each(function processPills () {
					var pill = $(this);
					if (!containerFull) {
						processedPills++;
						self.$moreCount.text(totalPills - processedPills);
						if ((widthUsed + pill.outerWidth(true) + self.$addItemWrap.outerWidth(true)) <= availableWidth) {
							widthUsed += pill.outerWidth(true);
						} else {
							self.$moreCount.text((totalPills - processedPills) + 1);
							pill.addClass('truncated');
							containerFull = true;
						}
					} else {
						pill.addClass('truncated');
					}
				});
				if (processedPills === totalPills) {
					this.$addItemWrap.addClass('truncated');
				}
			}
		},

		inputFocus: function inputFocus () {
			this.$element.find('.pillbox-add-item').focus();
		},

		getItemData: function getItemData (el, data) {
			return langx.mixin({
				text: el.find('span:first').html()
			}, el.data(), data);
		},

		_removeElement: function _removeElement (data) {
			data.el.remove();
			delete data.el;
			this.$element.trigger('removed.fu.pillbox', data);
		},

		_removePillTrigger: function _removePillTrigger (removedBy) {
			this.$element.trigger('removed.fu.pillbox', removedBy);
		},

		_generateObject: function _generateObject (data) {
			var obj = {};

			langx.each(data, function setObjectValue (index, value) {
				obj[value] = true;
			});

			return obj;
		},

		_openSuggestions: function _openSuggestions (e, data) {
			var $suggestionList = $('<ul>');

			if (this.callbackId !== e.timeStamp) {
				return false;
			}

			if (data.data && data.data.length) {
				langx.each(data.data, function appendSuggestions (index, value) {
					var val = value.value ? value.value : value.text;

					// markup concatentation is 10x faster, but does not allow data store
					var $suggestion = $('<li data-value="' + val + '">' + value.text + '</li>');

					if (value.attr) {
						$suggestion.data('attr', JSON.stringify(value.attr));
					}

					if (value.data) {
						$suggestion.data('data', value.data);
					}

					$suggestionList.append($suggestion);
				});

				// suggestion dropdown
				this.$suggest.html('').append($suggestionList.children());
				$(document).trigger('suggested.fu.pillbox', this.$suggest);
			}

			return true;
		},

		_closeSuggestions: function _closeSuggestions () {
			this.$suggest.html('').parent().removeClass('open');
		},

		_isSuggestionsOpen: function _isSuggestionsOpen () {
			return this.$suggest.parent().hasClass('open');
		},

		_keySuggestions: function _keySuggestions (e) {
			var $first = this.$suggest.find('li.pillbox-suggest-sel');
			var dir = isUpArrow(e);

			e.preventDefault();

			if (!$first.length) {
				$first = this.$suggest.find('li:first');
				$first.addClass('pillbox-suggest-sel');
			} else {
				var $next = dir ? $first.prev() : $first.next();

				if (!$next.length) {
					$next = dir ? this.$suggest.find('li:last') : this.$suggest.find('li:first');
				}

				if ($next) {
					$next.addClass('pillbox-suggest-sel');
					$first.removeClass('pillbox-suggest-sel');
				}
			}
		}
	});


	Pillbox.prototype.getValue = Pillbox.prototype.items;

	// PILLBOX PLUGIN DEFINITION

	$.fn.pillbox = function pillbox (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function set () {
			var $this = $(this);
			var data = $this.data('fu.pillbox');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.pillbox', (data = new Pillbox(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.pillbox.defaults = {
		edit: false,
		readonly: -1, // can be true or false. -1 means it will check for data-readonly="readonly"
		truncate: false,
		acceptKeyCodes: [
			ENTER_KEYCODE,
			COMMA_KEYCODE
		],
		allowEmptyPills: false,
		cleanInput: cleanInput

		// example on remove
		/* onRemove: function(data,callback){
			console.log('onRemove');
			callback(data);
		} */

		// example on key down
		/* onKeyDown: function(event, data, callback ){
			callback({data:[
				{text: Math.random(),value:'sdfsdfsdf'},
				{text: Math.random(),value:'sdfsdfsdf'}
			]});
		}
		*/
		// example onAdd
		/* onAdd: function( data, callback ){
			console.log(data, callback);
			callback(data);
		} */
	};

	$.fn.pillbox.Constructor = Pillbox;

	$.fn.pillbox.noConflict = function noConflict () {
		$.fn.pillbox = old;
		return this;
	};


	// DATA-API

	/*
	$(document).on('mousedown.fu.pillbox.data-api', '[data-initialize=pillbox]', function dataAPI (e) {
		var $control = $(e.target).closest('.pillbox');
		if (!$control.data('fu.pillbox')) {
			$control.pillbox($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function DOMReady () {
		$('[data-initialize=pillbox]').each(function init () {
			var $this = $(this);
			if ($this.data('fu.pillbox')) return;
			$this.pillbox($this.data());
		});
	});
	*/

	return $.fn.pillbox;
});

define('skylark-fuelux/placard',[
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Placard
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.placard;
	var EVENT_CALLBACK_MAP = { 'accepted': 'onAccept', 'cancelled': 'onCancel' };


	// PLACARD CONSTRUCTOR AND PROTOTYPE

	var Placard = fuelux.Placard = fuelux.WidgetBase.inherit({
		klassName: "Placard",

		init : function(element,options) {
			var self = this;
			this.$element = $(element);
			this.options = langx.mixin({}, $.fn.placard.defaults, options);

			if(this.$element.attr('data-ellipsis') === 'true'){
				this.options.applyEllipsis = true;
			}

			this.$accept = this.$element.find('.placard-accept');
			this.$cancel = this.$element.find('.placard-cancel');
			this.$field = this.$element.find('.placard-field');
			this.$footer = this.$element.find('.placard-footer');
			this.$header = this.$element.find('.placard-header');
			this.$popup = this.$element.find('.placard-popup');

			this.actualValue = null;
			this.clickStamp = '_';
			this.previousValue = '';
			if (this.options.revertOnCancel === -1) {
				this.options.revertOnCancel = (this.$accept.length > 0);
			}

			// Placard supports inputs, textareas, or contenteditable divs. These checks determine which is being used
			this.isContentEditableDiv = this.$field.is('div');
			this.isInput = this.$field.is('input');
			this.divInTextareaMode = (this.isContentEditableDiv && this.$field.attr('data-textarea') === 'true');

			this.$field.on('focus.fu.placard', langx.proxy(this.show, this));
			this.$field.on('keydown.fu.placard', langx.proxy(this.keyComplete, this));
			this.$element.on('close.fu.placard', langx.proxy(this.hide, this));
			this.$accept.on('click.fu.placard', langx.proxy(this.complete, this, 'accepted'));
			this.$cancel.on('click.fu.placard', function (e) {
				e.preventDefault(); self.complete('cancelled');
			});

			this.applyEllipsis();
		},

		complete: function complete(action) {
			var func = this.options[ EVENT_CALLBACK_MAP[action] ];

			var obj = {
				previousValue: this.previousValue,
				value: this.getValue()
			};

			if (func) {
				func(obj);
				this.$element.trigger(action + '.fu.placard', obj);
			} else {
				if (action === 'cancelled' && this.options.revertOnCancel) {
					this.setValue(this.previousValue, true);
				}

				this.$element.trigger(action + '.fu.placard', obj);
				this.hide();
			}
		},

		keyComplete: function keyComplete(e) {
			if (((this.isContentEditableDiv && !this.divInTextareaMode) || this.isInput) && e.keyCode === 13) {
				this.complete('accepted');
				this.$field.blur();
			} else if (e.keyCode === 27) {
				this.complete('cancelled');
				this.$field.blur();
			}
		},

		destroy: function destroy() {
			this.$element.remove();
			// remove any external bindings
			$(document).off('click.fu.placard.externalClick.' + this.clickStamp);
			// set input value attribute
			this.$element.find('input').each(function () {
				$(this).attr('value', $(this).val());
			});
			// empty elements to return to original markup
			// [none]
			// return string of markup
			return this.$element[0].outerHTML;
		},

		disable: function disable() {
			this.$element.addClass('disabled');
			this.$field.attr('disabled', 'disabled');
			if (this.isContentEditableDiv) {
				this.$field.removeAttr('contenteditable');
			}
			this.hide();
		},

		applyEllipsis: function applyEllipsis() {
			var field, i, str;
			if (this.options.applyEllipsis) {
				field = this.$field.get(0);
				if ((this.isContentEditableDiv && !this.divInTextareaMode) || this.isInput) {
					field.scrollLeft = 0;
				} else {
					field.scrollTop = 0;
					if (field.clientHeight < field.scrollHeight) {
						this.actualValue = this.getValue();
						this.setValue('', true);
						str = '';
						i = 0;
						while (field.clientHeight >= field.scrollHeight) {
							str += this.actualValue[i];
							this.setValue(str + '...', true);
							i++;
						}
						str = (str.length > 0) ? str.substring(0, str.length - 1) : '';
						this.setValue(str + '...', true);
					}
				}

			}
		},

		enable: function enable() {
			this.$element.removeClass('disabled');
			this.$field.removeAttr('disabled');
			if (this.isContentEditableDiv) {
				this.$field.attr('contenteditable', 'true');
			}
		},

		externalClickListener: function externalClickListener(e, force) {
			if (force === true || this.isExternalClick(e)) {
				this.complete(this.options.externalClickAction);
			}
		},

		getValue: function getValue() {
			if (this.actualValue !== null) {
				return this.actualValue;
			} else if (this.isContentEditableDiv) {
				return this.$field.html();
			} else {
				return this.$field.val();
			}
		},

		hide: function hide() {
			if (!this.$element.hasClass('showing')) {
				return;
			}

			this.$element.removeClass('showing');
			this.applyEllipsis();
			$(document).off('click.fu.placard.externalClick.' + this.clickStamp);
			this.$element.trigger('hidden.fu.placard');
		},

		isExternalClick: function isExternalClick(e) {
			var el = this.$element.get(0);
			var exceptions = this.options.externalClickExceptions || [];
			var $originEl = $(e.target);
			var i, l;

			if (noder.contains(el,e.target)) {
				return false;
			} else {
				for (i = 0, l = exceptions.length; i < l; i++) {
					if ($originEl.is(exceptions[i]) || $originEl.parents(exceptions[i]).length > 0) {
						return false;
					}

				}
			}

			return true;
		},

		/**
		 * setValue() sets the Placard triggering DOM element's display value
		 *
		 * @param {String} the value to be displayed
		 * @param {Boolean} If you want to explicitly suppress the application
		 *					of ellipsis, pass `true`. This would typically only be
		 *					done from internal functions (like `applyEllipsis`)
		 *					that want to avoid circular logic. Otherwise, the
		 *					value of the option applyEllipsis will be used.
		 * @return {Object} jQuery object representing the DOM element whose
		 *					value was set
		 */
		setValue: function setValue(val, suppressEllipsis) {
			//if suppressEllipsis is undefined, check placards init settings
			if (typeof suppressEllipsis === 'undefined') {
				suppressEllipsis = !this.options.applyEllipsis;
			}

			if (this.isContentEditableDiv) {
				this.$field.empty().append(val);
			} else {
				this.$field.val(val);
			}

			if (!suppressEllipsis && !_isShown(this)) {
				this.applyEllipsis();
			}

			return this.$field;
		},

		show: function show() {
			if (_isShown(this)) { return; }
			if (!_closeOtherPlacards()) { return; }

			this.previousValue = (this.isContentEditableDiv) ? this.$field.html() : this.$field.val();

			if (this.actualValue !== null) {
				this.setValue(this.actualValue, true);
				this.actualValue = null;
			}

			this.showPlacard();
		},

		showPlacard: function showPlacard() {
			this.$element.addClass('showing');

			if (this.$header.length > 0) {
				this.$popup.css('top', '-' + this.$header.outerHeight(true) + 'px');
			}

			if (this.$footer.length > 0) {
				this.$popup.css('bottom', '-' + this.$footer.outerHeight(true) + 'px');
			}

			this.$element.trigger('shown.fu.placard');
			this.clickStamp = new Date().getTime() + (Math.floor(Math.random() * 100) + 1);
			if (!this.options.explicit) {
				$(document).on('click.fu.placard.externalClick.' + this.clickStamp, langx.proxy(this.externalClickListener, this));
			}
		}
		
	});

	var _isShown = function _isShown(placard) {
		return placard.$element.hasClass('showing');
	};

	var _closeOtherPlacards = function _closeOtherPlacards() {
		var otherPlacards;

		otherPlacards = $(document).find('.placard.showing');
		if (otherPlacards.length > 0) {
			if (otherPlacards.data('fu.placard') && otherPlacards.data('fu.placard').options.explicit) {
				return false;//failed
			}

			otherPlacards.placard('externalClickListener', {}, true);
		}

		return true;//succeeded
	};


	// PLACARD PLUGIN DEFINITION

	$.fn.placard = function (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.placard');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.placard', (data = new Placard(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.placard.defaults = {
		onAccept: undefined,
		onCancel: undefined,
		externalClickAction: 'cancelled',
		externalClickExceptions: [],
		explicit: false,
		revertOnCancel: -1,//negative 1 will check for an '.placard-accept' button. Also can be set to true or false
		applyEllipsis: false
	};

	$.fn.placard.Constructor = Placard;

	$.fn.placard.noConflict = function () {
		$.fn.placard = old;
		return this;
	};

	/*
	// DATA-API
	$(document).on('focus.fu.placard.data-api', '[data-initialize=placard]', function (e) {
		var $control = $(e.target).closest('.placard');
		if (!$control.data('fu.placard')) {
			$control.placard($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=placard]').each(function () {
			var $this = $(this);
			if ($this.data('fu.placard')) return;
			$this.placard($this.data());
		});
	});
	*/
	
	return $.fn.placard;

});

define('skylark-fuelux/radio',[
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-toggles/radio",
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

define('skylark-fuelux/selectlist',[
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-popups/select-list",
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

define('skylark-fuelux/spinbox',[
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Spinbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.spinbox;

	// SPINBOX CONSTRUCTOR AND PROTOTYPE

	var Spinbox = fuelux.Spinbox = fuelux.WidgetBase.inherit({
		klassName: "Spinbox",

		init : function(element,options) {
			this.$element = $(element);
			this.$element.find('.btn').on('click', function (e) {
				//keep spinbox from submitting if they forgot to say type="button" on their spinner buttons
				e.preventDefault();
			});
			this.options = langx.mixin({}, $.fn.spinbox.defaults, options);
			this.options.step = this.$element.data('step') || this.options.step;

			if (this.options.value < this.options.min) {
				this.options.value = this.options.min;
			} else if (this.options.max < this.options.value) {
				this.options.value = this.options.max;
			}

			this.$input = this.$element.find('.spinbox-input');
			this.$input.on('focusout.fu.spinbox', this.$input, langx.proxy(this.change, this));
			this.$element.on('keydown.fu.spinbox', this.$input, langx.proxy(this.keydown, this));
			this.$element.on('keyup.fu.spinbox', this.$input, langx.proxy(this.keyup, this));

			if (this.options.hold) {
				this.$element.on('mousedown.fu.spinbox', '.spinbox-up', langx.proxy(function () {
					this.startSpin(true);
				}, this));
				this.$element.on('mouseup.fu.spinbox', '.spinbox-up, .spinbox-down', langx.proxy(this.stopSpin, this));
				this.$element.on('mouseout.fu.spinbox', '.spinbox-up, .spinbox-down', langx.proxy(this.stopSpin, this));
				this.$element.on('mousedown.fu.spinbox', '.spinbox-down', langx.proxy(function () {
					this.startSpin(false);
				}, this));
			} else {
				this.$element.on('click.fu.spinbox', '.spinbox-up', langx.proxy(function () {
					this.step(true);
				}, this));
				this.$element.on('click.fu.spinbox', '.spinbox-down', langx.proxy(function () {
					this.step(false);
				}, this));
			}

			this.switches = {
				count: 1,
				enabled: true
			};

			if (this.options.speed === 'medium') {
				this.switches.speed = 300;
			} else if (this.options.speed === 'fast') {
				this.switches.speed = 100;
			} else {
				this.switches.speed = 500;
			}

			this.options.defaultUnit = _isUnitLegal(this.options.defaultUnit, this.options.units) ? this.options.defaultUnit : '';
			this.unit = this.options.defaultUnit;

			this.lastValue = this.options.value;

			this.render();

			if (this.options.disabled) {
				this.disable();
			}
		},

		destroy: function destroy() {
			this.$element.remove();
			// any external bindings
			// [none]
			// set input value attrbute
			this.$element.find('input').each(function () {
				$(this).attr('value', $(this).val());
			});
			// empty elements to return to original markup
			// [none]
			// returns string of markup
			return this.$element[0].outerHTML;
		},

		render: function render() {
			this._setValue(this.getDisplayValue());
		},

		change: function change() {
			this._setValue(this.getDisplayValue());

			this.triggerChangedEvent();
		},

		stopSpin: function stopSpin() {
			if (this.switches.timeout !== undefined) {
				clearTimeout(this.switches.timeout);
				this.switches.count = 1;
				this.triggerChangedEvent();
			}
		},

		triggerChangedEvent: function triggerChangedEvent() {
			var currentValue = this.getValue();
			if (currentValue === this.lastValue) return;
			this.lastValue = currentValue;

			// Primary changed event
			this.$element.trigger('changed.fu.spinbox', currentValue);
		},

		startSpin: function startSpin(type) {
			if (!this.options.disabled) {
				var divisor = this.switches.count;

				if (divisor === 1) {
					this.step(type);
					divisor = 1;
				} else if (divisor < 3) {
					divisor = 1.5;
				} else if (divisor < 8) {
					divisor = 2.5;
				} else {
					divisor = 4;
				}

				this.switches.timeout = setTimeout(langx.proxy(function () {
					this.iterate(type);
				}, this), this.switches.speed / divisor);
				this.switches.count++;
			}
		},

		iterate: function iterate(type) {
			this.step(type);
			this.startSpin(type);
		},

		step: function step(isIncrease) {
			//refresh value from display before trying to increment in case they have just been typing before clicking the nubbins
			this._setValue(this.getDisplayValue());
			var newVal;

			if (isIncrease) {
				newVal = this.options.value + this.options.step;
			} else {
				newVal = this.options.value - this.options.step;
			}

			newVal = newVal.toFixed(5);

			this._setValue(newVal + this.unit);
		},

		getDisplayValue: function getDisplayValue() {
			var inputValue = this.parseInput(this.$input.val());
			var value = (!!inputValue) ? inputValue : this.options.value;
			return value;
		},

		setDisplayValue: function setDisplayValue(value) {
			this.$input.val(value);
		},

		getValue: function getValue() {
			var val = this.options.value;
			if (this.options.decimalMark !== '.'){
				val = (val + '').split('.').join(this.options.decimalMark);
			}
			return val + this.unit;
		},

		setValue: function setValue(val) {
			return this._setValue(val, true);
		},

		_setValue: function _setValue(val, shouldSetLastValue) {
			//remove any i18n on the number
			if (this.options.decimalMark !== '.') {
				val = this.parseInput(val);
			}

			//are we dealing with united numbers?
			if(typeof val !== "number"){
				var potentialUnit = val.replace(/[0-9.-]/g, '');
				//make sure unit is valid, or else drop it in favor of current unit, or default unit (potentially nothing)
				this.unit = _isUnitLegal(potentialUnit, this.options.units) ? potentialUnit : this.options.defaultUnit;
			}

			var intVal = this.getIntValue(val);

			//make sure we are dealing with a number
			if (isNaN(intVal) && !isFinite(intVal)) {
				return this._setValue(this.options.value, shouldSetLastValue);
			}

			//conform
			intVal = _applyLimits.call(this, intVal);

			//cache the pure int value
			this.options.value = intVal;

			//prepare number for display
			val = intVal + this.unit;

			if (this.options.decimalMark !== '.'){
				val = (val + '').split('.').join(this.options.decimalMark);
			}

			//display number
			this.setDisplayValue(val);

			if (shouldSetLastValue) {
				this.lastValue = val;
			}

			return this;
		},

		value: function value(val) {
			if (val || val === 0) {
				return this.setValue(val);
			} else {
				return this.getValue();
			}
		},

		parseInput: function parseInput(value) {
			value = (value + '').split(this.options.decimalMark).join('.');

			return value;
		},

		getIntValue: function getIntValue(value) {
			//if they didn't pass in a number, try and get the number
			value = (typeof value === "undefined") ? this.getValue() : value;
			// if there still isn't a number, abort
			if(typeof value === "undefined"){return;}

			if (typeof value === 'string'){
				value = this.parseInput(value);
			}

			value = parseFloat(value, 10);

			return value;
		},

		disable: function disable() {
			this.options.disabled = true;
			this.$element.addClass('disabled');
			this.$input.attr('disabled', '');
			this.$element.find('button').addClass('disabled');
		},

		enable: function enable() {
			this.options.disabled = false;
			this.$element.removeClass('disabled');
			this.$input.removeAttr('disabled');
			this.$element.find('button').removeClass('disabled');
		},

		keydown: function keydown(event) {
			var keyCode = event.keyCode;
			if (keyCode === 38) {
				this.step(true);
			} else if (keyCode === 40) {
				this.step(false);
			} else if (keyCode === 13) {
				this.change();
			}
		},

		keyup: function keyup(event) {
			var keyCode = event.keyCode;

			if (keyCode === 38 || keyCode === 40) {
				this.triggerChangedEvent();
			}
		}

	});	

	// Truly private methods
	var _limitToStep = function _limitToStep(number, step) {
		return Math.round(number / step) * step;
	};

	var _isUnitLegal = function _isUnitLegal(unit, validUnits) {
		var legalUnit = false;
		var suspectUnit = unit.toLowerCase();

		langx.each(validUnits, function (i, validUnit) {
			validUnit = validUnit.toLowerCase();
			if (suspectUnit === validUnit) {
				legalUnit = true;
				return false;//break out of the loop
			}
		});

		return legalUnit;
	};

	var _applyLimits = function _applyLimits(value) {
		// if unreadable
		if (isNaN(parseFloat(value))) {
			return value;
		}

		// if not within range return the limit
		if (value > this.options.max) {
			if (this.options.cycle) {
				value = this.options.min;
			} else {
				value = this.options.max;
			}
		} else if (value < this.options.min) {
			if (this.options.cycle) {
				value = this.options.max;
			} else {
				value = this.options.min;
			}
		}

		if (this.options.limitToStep && this.options.step) {
			value = _limitToStep(value, this.options.step);

			//force round direction so that it stays within bounds
			if(value > this.options.max){
				value = value - this.options.step;
			} else if(value < this.options.min) {
				value = value + this.options.step;
			}
		}

		return value;
	};

	// SPINBOX PLUGIN DEFINITION

	$.fn.spinbox = function spinbox(option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.spinbox');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.spinbox', (data = new Spinbox(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	// value needs to be 0 for this.render();
	$.fn.spinbox.defaults = {
		value: 0,
		min: 0,
		max: 999,
		step: 1,
		hold: true,
		speed: 'medium',
		disabled: false,
		cycle: false,
		units: [],
		decimalMark: '.',
		defaultUnit: '',
		limitToStep: false
	};

	$.fn.spinbox.Constructor = Spinbox;

	$.fn.spinbox.noConflict = function noConflict() {
		$.fn.spinbox = old;
		return this;
	};


	// DATA-API

	/*
	$(document).on('mousedown.fu.spinbox.data-api', '[data-initialize=spinbox]', function (e) {
		var $control = $(e.target).closest('.spinbox');
		if (!$control.data('fu.spinbox')) {
			$control.spinbox($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=spinbox]').each(function () {
			var $this = $(this);
			if (!$this.data('fu.spinbox')) {
				$this.spinbox($this.data());
			}
		});
	});
	*/

	return $.fn.spinbox;
});

define('skylark-fuelux/scheduler',[
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux",
  "./combobox",
  "./datepicker",
  "./radio",
  "./selectlist",
  "./spinbox"
],function(langx,browser,eventer,noder,geom,$,fuelux){

	/*
	 * Fuel UX Scheduler
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	// -- END UMD WRAPPER PREFACE --

	// -- BEGIN MODULE CODE HERE --

	var old = $.fn.scheduler;

	// SCHEDULER CONSTRUCTOR AND PROTOTYPE

	var Scheduler = fuelux.Scheduler = fuelux.WidgetBase.inherit({
		klassName: "Scheduler",

		init : function(element,options) {
			var self = this;

			this.$element = $(element);
			this.options = langx.mixin({}, $.fn.scheduler.defaults, options);

			// cache elements
			this.$startDate = this.$element.find('.start-datetime .start-date');
			this.$startTime = this.$element.find('.start-datetime .start-time');

			this.$timeZone = this.$element.find('.timezone-container .timezone');

			this.$repeatIntervalPanel = this.$element.find('.repeat-every-panel');
			this.$repeatIntervalSelect = this.$element.find('.repeat-options');

			this.$repeatIntervalSpinbox = this.$element.find('.repeat-every');
			this.$repeatIntervalTxt = this.$element.find('.repeat-every-text');

			this.$end = this.$element.find('.repeat-end');
			this.$endSelect = this.$end.find('.end-options');
			this.$endAfter = this.$end.find('.end-after');
			this.$endDate = this.$end.find('.end-on-date');

			// panels
			this.$recurrencePanels = this.$element.find('.repeat-panel');


			this.$repeatIntervalSelect.selectlist();

			//initialize sub-controls
			this.$element.find('.selectlist').selectlist();
			this.$startDate.datepicker(this.options.startDateOptions);

			var startDateResponse = (typeof this.options.startDateChanged === "function") ? this.options.startDateChanged : this._guessEndDate;
			this.$startDate.on('change changed.fu.datepicker dateClicked.fu.datepicker', langx.proxy(startDateResponse, this));

			this.$startTime.combobox();
			// init start time
			if (this.$startTime.find('input').val() === '') {
				this.$startTime.combobox('selectByIndex', 0);
			}

			// every 0 days/hours doesn't make sense, change if not set
			if (this.$repeatIntervalSpinbox.find('input').val() === '0') {
				this.$repeatIntervalSpinbox.spinbox({
					'value': 1,
					'min': 1,
					'limitToStep': true
				});
			} else {
				this.$repeatIntervalSpinbox.spinbox({
					'min': 1,
					'limitToStep': true
				});
			}

			this.$endAfter.spinbox({
				'value': 1,
				'min': 1,
				'limitToStep': true
			});
			this.$endDate.datepicker(this.options.endDateOptions);
			this.$element.find('.radio-custom').radio();

			// bind events: 'change' is a Bootstrap JS fired event
			this.$repeatIntervalSelect.on('changed.fu.selectlist', langx.proxy(this.repeatIntervalSelectChanged, this));
			this.$endSelect.on('changed.fu.selectlist', langx.proxy(this.endSelectChanged, this));
			this.$element.find('.repeat-days-of-the-week .btn-group .btn').on('change.fu.scheduler', function (e, data) {
				self.changed(e, data, true);
			});
			this.$element.find('.combobox').on('changed.fu.combobox', langx.proxy(this.changed, this));
			this.$element.find('.datepicker').on('changed.fu.datepicker', langx.proxy(this.changed, this));
			this.$element.find('.datepicker').on('dateClicked.fu.datepicker', langx.proxy(this.changed, this));
			this.$element.find('.selectlist').on('changed.fu.selectlist', langx.proxy(this.changed, this));
			this.$element.find('.spinbox').on('changed.fu.spinbox', langx.proxy(this.changed, this));
			this.$element.find('.repeat-monthly .radio-custom, .repeat-yearly .radio-custom').on('change.fu.scheduler', langx.proxy(this.changed, this));
		},

		destroy: function destroy() {
			var markup;
			// set input value attribute
			this.$element.find('input').each(function () {
				$(this).attr('value', $(this).val());
			});

			// empty elements to return to original markup and store
			this.$element.find('.datepicker .calendar').empty();

			markup = this.$element[0].outerHTML;

			// destroy components
			this.$element.find('.combobox').combobox('destroy');
			this.$element.find('.datepicker').datepicker('destroy');
			this.$element.find('.selectlist').selectlist('destroy');
			this.$element.find('.spinbox').spinbox('destroy');
			this.$element.find('.radio-custom').radio('destroy');
			this.$element.remove();

			// any external bindings
			// [none]

			return markup;
		},

		changed: function changed(e, data, propagate) {
			if (!propagate) {
				e.stopPropagation();
			}

			this.$element.trigger('changed.fu.scheduler', {
				data: (data !== undefined) ? data : $(e.currentTarget).data(),
				originalEvent: e,
				value: this.getValue()
			});
		},

		disable: function disable() {
			this.toggleState('disable');
		},

		enable: function enable() {
			this.toggleState('enable');
		},

		setUtcTime: function setUtcTime(day, time, offset) {
			var dateSplit = day.split('-');
			var timeSplit = time.split(':');
			function z(n) {
				return (n < 10 ? '0' : '') + n;
			}

			var utcDate = new Date(Date.UTC(dateSplit[0], (dateSplit[1] - 1), dateSplit[2], timeSplit[0], timeSplit[1], (timeSplit[2] ? timeSplit[2] : 0)));

			if (offset === 'Z') {
				utcDate.setUTCHours(utcDate.getUTCHours() + 0);
			} else {
				var expression = [];
				expression[0] = '(.)'; // Any Single Character 1
				expression[1] = '.*?'; // Non-greedy match on filler
				expression[2] = '\\d'; // Uninteresting and ignored: d
				expression[3] = '.*?'; // Non-greedy match on filler
				expression[4] = '(\\d)'; // Any Single Digit 1

				var p = new RegExp(expression.join(''), ["i"]);
				var offsetMatch = p.exec(offset);
				if (offsetMatch !== null) {
					var offsetDirection = offsetMatch[1];
					var offsetInteger = offsetMatch[2];
					var modifier = (offsetDirection === '+') ? 1 : -1;

					utcDate.setUTCHours(utcDate.getUTCHours() + (modifier * parseInt(offsetInteger, 10)));
				}

			}

			var localDifference = utcDate.getTimezoneOffset();
			utcDate.setMinutes(localDifference);
			return utcDate;
		},

		// called when the end range changes
		// (Never, After, On date)
		endSelectChanged: function endSelectChanged(e, data) {
			var selectedItem, val;

			if (!data) {
				selectedItem = this.$endSelect.selectlist('selectedItem');
				val = selectedItem.value;
			} else {
				val = data.value;
			}

			// hide all panels
			this.$endAfter.parent().addClass('hidden');
			this.$endAfter.parent().attr('aria-hidden', 'true');

			this.$endDate.parent().addClass('hidden');
			this.$endDate.parent().attr('aria-hidden', 'true');

			if (val === 'after') {
				this.$endAfter.parent().removeClass('hide hidden'); // jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
				this.$endAfter.parent().attr('aria-hidden', 'false');
			} else if (val === 'date') {
				this.$endDate.parent().removeClass('hide hidden');	// jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
				this.$endDate.parent().attr('aria-hidden', 'false');
			}
		},

		_guessEndDate: function _guessEndDate() {
			var interval = this.$repeatIntervalSelect.selectlist('selectedItem').value;
			var end = new Date(this.$endDate.datepicker('getDate'));
			var start = new Date(this.$startDate.datepicker('getDate'));
			var increment = this.$repeatIntervalSpinbox.find('input').val();

			if(interval !== "none" && end <= start){
				// if increment spinbox is hidden, user has no idea what it is set to and it is probably not set to
				// something they intended. Safest option is to set date forward by an increment of 1.
				// this will keep monthly & yearly from auto-incrementing by more than a single interval
				if(!this.$repeatIntervalSpinbox.is(':visible')){
					increment = 1;
				}

				// treat weekdays as weekly. This treats all "weekdays" as a single set, of which a single increment
				// is one week.
				if(interval === "weekdays"){
					increment = 1;
					interval = "weekly";
				}

				end = _incrementDate(start, end, interval, increment);

				this.$endDate.datepicker('setDate', end);
			}
		},

		getValue: function getValue() {
			// FREQ = frequency (secondly, minutely, hourly, daily, weekdays, weekly, monthly, yearly)
			// BYDAY = when picking days (MO,TU,WE,etc)
			// BYMONTH = when picking months (Jan,Feb,March) - note the values should be 1,2,3...
			// BYMONTHDAY = when picking days of the month (1,2,3...)
			// BYSETPOS = when picking First,Second,Third,Fourth,Last (1,2,3,4,-1)

			var interval = this.$repeatIntervalSpinbox.spinbox('value');
			var pattern = '';
			var repeat = this.$repeatIntervalSelect.selectlist('selectedItem').value;
			var startTime;

			if (this.$startTime.combobox('selectedItem').value) {
				startTime = this.$startTime.combobox('selectedItem').value;
				startTime = startTime.toLowerCase();

			} else {
				startTime = this.$startTime.combobox('selectedItem').text.toLowerCase();
			}

			var timeZone = this.$timeZone.selectlist('selectedItem');
			var day, days, hasAm, hasPm, month, pos, startDateTime, type;

			startDateTime = '' + _getFormattedDate(this.$startDate.datepicker('getDate'), '-');

			startDateTime += 'T';
			hasAm = (startTime.search('am') >= 0);
			hasPm = (startTime.search('pm') >= 0);
			startTime = langx.trim(startTime.replace(/am/g, '').replace(/pm/g, '')).split(':');
			startTime[0] = parseInt(startTime[0], 10);
			startTime[1] = parseInt(startTime[1], 10);
			if (hasAm && startTime[0] > 11) {
				startTime[0] = 0;
			} else if (hasPm && startTime[0] < 12) {
				startTime[0] += 12;
			}

			startDateTime += (startTime[0] < 10) ? '0' + startTime[0] : startTime[0];
			startDateTime += ':';
			startDateTime += (startTime[1] < 10) ? '0' + startTime[1] : startTime[1];

			startDateTime += (timeZone.offset === '+00:00') ? 'Z' : timeZone.offset;

			if (repeat === 'none') {
				pattern = 'FREQ=DAILY;INTERVAL=1;COUNT=1;';
			} else if (repeat === 'secondly') {
				pattern = 'FREQ=SECONDLY;';
				pattern += 'INTERVAL=' + interval + ';';
			} else if (repeat === 'minutely') {
				pattern = 'FREQ=MINUTELY;';
				pattern += 'INTERVAL=' + interval + ';';
			} else if (repeat === 'hourly') {
				pattern = 'FREQ=HOURLY;';
				pattern += 'INTERVAL=' + interval + ';';
			} else if (repeat === 'daily') {
				pattern += 'FREQ=DAILY;';
				pattern += 'INTERVAL=' + interval + ';';
			} else if (repeat === 'weekdays') {
				pattern += 'FREQ=WEEKLY;';
				pattern += 'BYDAY=MO,TU,WE,TH,FR;';
				pattern += 'INTERVAL=1;';
			} else if (repeat === 'weekly') {
				days = [];
				this.$element.find('.repeat-days-of-the-week .btn-group input:checked').each(function () {
					days.push($(this).data().value);
				});

				pattern += 'FREQ=WEEKLY;';
				pattern += 'BYDAY=' + days.join(',') + ';';
				pattern += 'INTERVAL=' + interval + ';';
			} else if (repeat === 'monthly') {
				pattern += 'FREQ=MONTHLY;';
				pattern += 'INTERVAL=' + interval + ';';
				type = this.$element.find('input[name=repeat-monthly]:checked').val();

				if (type === 'bymonthday') {
					day = parseInt(this.$element.find('.repeat-monthly-date .selectlist').selectlist('selectedItem').text, 10);
					pattern += 'BYMONTHDAY=' + day + ';';
				} else if (type === 'bysetpos') {
					days = this.$element.find('.repeat-monthly-day .month-days').selectlist('selectedItem').value;
					pos = this.$element.find('.repeat-monthly-day .month-day-pos').selectlist('selectedItem').value;
					pattern += 'BYDAY=' + days + ';';
					pattern += 'BYSETPOS=' + pos + ';';
				}

			} else if (repeat === 'yearly') {
				pattern += 'FREQ=YEARLY;';
				type = this.$element.find('input[name=repeat-yearly]:checked').val();

				if (type === 'bymonthday') {
					// there are multiple .year-month classed elements in scheduler markup
					month = this.$element.find('.repeat-yearly-date .year-month').selectlist('selectedItem').value;
					day = this.$element.find('.repeat-yearly-date .year-month-day').selectlist('selectedItem').text;
					pattern += 'BYMONTH=' + month + ';';
					pattern += 'BYMONTHDAY=' + day + ';';
				} else if (type === 'bysetpos') {
					days = this.$element.find('.repeat-yearly-day .year-month-days').selectlist('selectedItem').value;
					pos = this.$element.find('.repeat-yearly-day .year-month-day-pos').selectlist('selectedItem').value;
					// there are multiple .year-month classed elements in scheduler markup
					month = this.$element.find('.repeat-yearly-day .year-month').selectlist('selectedItem').value;

					pattern += 'BYDAY=' + days + ';';
					pattern += 'BYSETPOS=' + pos + ';';
					pattern += 'BYMONTH=' + month + ';';
				}

			}

			var end = this.$endSelect.selectlist('selectedItem').value;
			var duration = '';

			// if both UNTIL and COUNT are not specified, the recurrence will repeat forever
			// http://tools.ietf.org/html/rfc2445#section-4.3.10
			if (repeat !== 'none') {
				if (end === 'after') {
					duration = 'COUNT=' + this.$endAfter.spinbox('value') + ';';
				} else if (end === 'date') {
					duration = 'UNTIL=' + _getFormattedDate(this.$endDate.datepicker('getDate'), '') + ';';
				}

			}

			pattern += duration;
			// remove trailing semicolon
			pattern = pattern.substring(pattern.length - 1) === ';' ? pattern.substring(0, pattern.length - 1) : pattern;

			var data = {
				startDateTime: startDateTime,
				timeZone: timeZone,
				recurrencePattern: pattern
			};

			return data;
		},

		// called when the repeat interval changes
		// (None, Hourly, Daily, Weekdays, Weekly, Monthly, Yearly
		repeatIntervalSelectChanged: function repeatIntervalSelectChanged(e, data) {
			var selectedItem, val, txt;

			if (!data) {
				selectedItem = this.$repeatIntervalSelect.selectlist('selectedItem');
				val = selectedItem.value || "";
				txt = selectedItem.text || "";
			} else {
				val = data.value;
				txt = data.text;
			}

			// set the text
			this.$repeatIntervalTxt.text(txt);

			switch (val.toLowerCase()) {
				case 'hourly':
				case 'daily':
				case 'weekly':
				case 'monthly':
					this.$repeatIntervalPanel.removeClass('hide hidden'); // jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
					this.$repeatIntervalPanel.attr('aria-hidden', 'false');
					break;
				default:
					this.$repeatIntervalPanel.addClass('hidden'); // jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
					this.$repeatIntervalPanel.attr('aria-hidden', 'true');
					break;
			}

			// hide all panels
			this.$recurrencePanels.addClass('hidden');
			this.$recurrencePanels.attr('aria-hidden', 'true');

			// show panel for current selection
			this.$element.find('.repeat-' + val).removeClass('hide hidden'); // jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
			this.$element.find('.repeat-' + val).attr('aria-hidden', 'false');

			// the end selection should only be shown when
			// the repeat interval is not "None (run once)"
			if (val === 'none') {
				this.$end.addClass('hidden');
				this.$end.attr('aria-hidden', 'true');
			} else {
				this.$end.removeClass('hide hidden'); // jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
				this.$end.attr('aria-hidden', 'false');
			}

			this._guessEndDate();
		},

		_parseAndSetRecurrencePattern: function(recurrencePattern, startTime) {
			var recur = {};
			var i = 0;
			var item = '';
			var commaPatternSplit;

			var $repeatMonthlyDate, $repeatYearlyDate, $repeatYearlyDay;

			var semiColonPatternSplit = recurrencePattern.toUpperCase().split(';');
			for (i = 0; i < semiColonPatternSplit.length; i++) {
				if (semiColonPatternSplit[i] !== '') {
					item = semiColonPatternSplit[i].split('=');
					recur[item[0]] = item[1];
				}
			}

			if (recur.FREQ === 'DAILY') {
				if (recur.BYDAY === 'MO,TU,WE,TH,FR') {
					item = 'weekdays';
				} else {
					if (recur.INTERVAL === '1' && recur.COUNT === '1') {
						item = 'none';
					} else {
						item = 'daily';
					}
				}
			} else if (recur.FREQ === 'SECONDLY') {
				item = 'secondly';
			} else if (recur.FREQ === 'MINUTELY') {
				item = 'minutely';
			} else if (recur.FREQ === 'HOURLY') {
				item = 'hourly';
			} else if (recur.FREQ === 'WEEKLY') {
				item = 'weekly';

				if (recur.BYDAY) {
					if (recur.BYDAY === 'MO,TU,WE,TH,FR') {
						item = 'weekdays';
					} else {
						var el = this.$element.find('.repeat-days-of-the-week .btn-group');
						el.find('label').removeClass('active');
						commaPatternSplit = recur.BYDAY.split(',');
						for (i = 0; i < commaPatternSplit.length; i++) {
							el.find('input[data-value="' + commaPatternSplit[i] + '"]').prop('checked',true).parent().addClass('active');
						}
					}
				}
			} else if (recur.FREQ === 'MONTHLY') {
				this.$element.find('.repeat-monthly input').removeAttr('checked').removeClass('checked');
				this.$element.find('.repeat-monthly label.radio-custom').removeClass('checked');
				if (recur.BYMONTHDAY) {
					$repeatMonthlyDate = this.$element.find('.repeat-monthly-date');
					$repeatMonthlyDate.find('input').addClass('checked').prop('checked', true);
					$repeatMonthlyDate.find('label.radio-custom').addClass('checked');
					$repeatMonthlyDate.find('.selectlist').selectlist('selectByValue', recur.BYMONTHDAY);
				} else if (recur.BYDAY) {
					var $repeatMonthlyDay = this.$element.find('.repeat-monthly-day');
					$repeatMonthlyDay.find('input').addClass('checked').prop('checked', true);
					$repeatMonthlyDay.find('label.radio-custom').addClass('checked');
					if (recur.BYSETPOS) {
						$repeatMonthlyDay.find('.month-day-pos').selectlist('selectByValue', recur.BYSETPOS);
					}

					$repeatMonthlyDay.find('.month-days').selectlist('selectByValue', recur.BYDAY);
				}

				item = 'monthly';
			} else if (recur.FREQ === 'YEARLY') {
				this.$element.find('.repeat-yearly input').removeAttr('checked').removeClass('checked');
				this.$element.find('.repeat-yearly label.radio-custom').removeClass('checked');
				if (recur.BYMONTHDAY) {
					$repeatYearlyDate = this.$element.find('.repeat-yearly-date');
					$repeatYearlyDate.find('input').addClass('checked').prop('checked', true);
					$repeatYearlyDate.find('label.radio-custom').addClass('checked');
					if (recur.BYMONTH) {
						$repeatYearlyDate.find('.year-month').selectlist('selectByValue', recur.BYMONTH);
					}

					$repeatYearlyDate.find('.year-month-day').selectlist('selectByValue', recur.BYMONTHDAY);
				} else if (recur.BYSETPOS) {
					$repeatYearlyDay = this.$element.find('.repeat-yearly-day');
					$repeatYearlyDay.find('input').addClass('checked').prop('checked', true);
					$repeatYearlyDay.find('label.radio-custom').addClass('checked');
					$repeatYearlyDay.find('.year-month-day-pos').selectlist('selectByValue', recur.BYSETPOS);

					if (recur.BYDAY) {
						$repeatYearlyDay.find('.year-month-days').selectlist('selectByValue', recur.BYDAY);
					}

					if (recur.BYMONTH) {
						$repeatYearlyDay.find('.year-month').selectlist('selectByValue', recur.BYMONTH);
					}
				}

				item = 'yearly';
			} else {
				item = 'none';
			}

			if (recur.COUNT) {
				this.$endAfter.spinbox('value', parseInt(recur.COUNT, 10));
				this.$endSelect.selectlist('selectByValue', 'after');
			} else if (recur.UNTIL) {
				var untilSplit, untilDate;

				if (recur.UNTIL.length === 8) {
					untilSplit = recur.UNTIL.split('');
					untilSplit.splice(4, 0, '-');
					untilSplit.splice(7, 0, '-');
					untilDate = untilSplit.join('');
				}

				var timeZone = this.$timeZone.selectlist('selectedItem');
				var timezoneOffset = (timeZone.offset === '+00:00') ? 'Z' : timeZone.offset;

				var utcEndHours = this.setUtcTime(untilDate, startTime.time24HourFormat, timezoneOffset);
				this.$endDate.datepicker('setDate', utcEndHours);

				this.$endSelect.selectlist('selectByValue', 'date');
			} else {
				this.$endSelect.selectlist('selectByValue', 'never');
			}

			this.endSelectChanged();

			if (recur.INTERVAL) {
				this.$repeatIntervalSpinbox.spinbox('value', parseInt(recur.INTERVAL, 10));
			}

			this.$repeatIntervalSelect.selectlist('selectByValue', item);
			this.repeatIntervalSelectChanged();
		},

		_parseStartDateTime: function(startTimeISO8601) {
			var startTime = {};
			var startDate, startDateTimeISO8601FormatSplit, hours, minutes, period;

			startTime.time24HourFormat = startTimeISO8601.split('+')[0].split('-')[0];

			if (startTimeISO8601.search(/\+/) > -1) {
				startTime.timeZoneOffset = '+' + langx.trim(startTimeISO8601.split('+')[1]);
			} else if (startTimeISO8601.search(/\-/) > -1) {
				startTime.timeZoneOffset = '-' + langx.trim(startTimeISO8601.split('-')[1]);
			} else {
				startTime.timeZoneOffset = '+00:00';
			}

			startTime.time24HourFormatSplit = startTime.time24HourFormat.split(':');
			hours = parseInt(startTime.time24HourFormatSplit[0], 10);
			minutes = (startTime.time24HourFormatSplit[1]) ? parseInt(startTime.time24HourFormatSplit[1].split('+')[0].split('-')[0].split('Z')[0], 10) : 0;
			period = (hours < 12) ? 'AM' : 'PM';

			if (hours === 0) {
				hours = 12;
			} else if (hours > 12) {
				hours -= 12;
			}

			minutes = (minutes < 10) ? '0' + minutes : minutes;
			startTime.time12HourFormat = hours + ':' + minutes;
			startTime.time12HourFormatWithPeriod = hours + ':' + minutes + ' ' + period;

			return startTime;
		},

		_parseTimeZone: function(options, startTime) {
			startTime.timeZoneQuerySelector = '';
			if (options.timeZone) {
				if (typeof (options.timeZone) === 'string') {
					startTime.timeZoneQuerySelector += 'li[data-name="' + options.timeZone + '"]';
				} else {
					langx.each(options.timeZone, function(key, value) {
						startTime.timeZoneQuerySelector += 'li[data-' + key + '="' + value + '"]';
					});
				}
				startTime.timeZoneOffset = options.timeZone.offset;
			} else if (options.startDateTime) {
				// Time zone has not been specified via options object, therefore use the timeZoneOffset from _parseAndSetStartDateTime
				startTime.timeZoneOffset = (startTime.timeZoneOffset === '+00:00') ? 'Z' : startTime.timeZoneOffset;
				startTime.timeZoneQuerySelector += 'li[data-offset="' + startTime.timeZoneOffset + '"]';
			} else {
				startTime.timeZoneOffset = 'Z';
			}

			return startTime.timeZoneOffset;
		},

		_setTimeUI: function(time12HourFormatWithPeriod) {
			this.$startTime.find('input').val(time12HourFormatWithPeriod);
			this.$startTime.combobox('selectByText', time12HourFormatWithPeriod);
		},

		_setTimeZoneUI: function(querySelector) {
			this.$timeZone.selectlist('selectBySelector', querySelector);
		},

		setValue: function setValue(options) {
			var startTime = {};
			var startDateTime, startDate, startTimeISO8601, timeOffset, utcStartHours;

			// TIME
			if (options.startDateTime) {
				startDateTime = options.startDateTime.split('T');
				startDate = startDateTime[0];
				startTimeISO8601 = startDateTime[1];

				if(startTimeISO8601) {
					startTime = this._parseStartDateTime(startTimeISO8601);
					this._setTimeUI(startTime.time12HourFormatWithPeriod);
				}
				else {
					startTime.time12HourFormat = '00:00';
					startTime.time24HourFormat = '00:00';
				}
			} else {
				startTime.time12HourFormat = '00:00';
				startTime.time24HourFormat = '00:00';
				var currentDate = this.$startDate.datepicker('getDate');
				startDate = currentDate.getFullYear() + '-' + currentDate.getMonth() + '-' + currentDate.getDate();
			}

			// TIMEZONE
			this._parseTimeZone(options, startTime);
			if (startTime.timeZoneQuerySelector) {
				this._setTimeZoneUI(startTime.timeZoneQuerySelector);
			}

			// RECURRENCE PATTERN
			if(options.recurrencePattern) {
				this._parseAndSetRecurrencePattern(options.recurrencePattern, startTime);
			}

			utcStartHours = this.setUtcTime(startDate, startTime.time24HourFormat, startTime.timeZoneOffset);
			this.$startDate.datepicker('setDate', utcStartHours);
		},

		toggleState: function toggleState(action) {
			this.$element.find('.combobox').combobox(action);
			this.$element.find('.datepicker').datepicker(action);
			this.$element.find('.selectlist').selectlist(action);
			this.$element.find('.spinbox').spinbox(action);
			this.$element.find('.radio-custom').radio(action);

			if (action === 'disable') {
				action = 'addClass';
			} else {
				action = 'removeClass';
			}

			this.$element.find('.repeat-days-of-the-week .btn-group')[action]('disabled');
		},

		value: function value(options) {
			if (options) {
				return this.setValue(options);
			} else {
				return this.getValue();
			}
		}

	});

	var _getFormattedDate = function _getFormattedDate(dateObj, dash) {
		var fdate = '';
		var item;

		fdate += dateObj.getFullYear();
		fdate += dash;
		item = dateObj.getMonth() + 1;//because 0 indexing makes sense when dealing with months /sarcasm
		fdate += (item < 10) ? '0' + item : item;
		fdate += dash;
		item = dateObj.getDate();
		fdate += (item < 10) ? '0' + item : item;

		return fdate;
	};

	var ONE_SECOND = 1000;
	var ONE_MINUTE = ONE_SECOND * 60;
	var ONE_HOUR = ONE_MINUTE * 60;
	var ONE_DAY = ONE_HOUR * 24;
	var ONE_WEEK = ONE_DAY * 7;
	var ONE_MONTH = ONE_WEEK * 5;// No good way to increment by one month using vanilla JS. Since this is an end date, we only need to ensure that this date occurs after at least one or more repeat increments, but there is no reason for it to be exact.
	var ONE_YEAR = ONE_WEEK * 52;
	var INTERVALS = {
		secondly: ONE_SECOND,
		minutely: ONE_MINUTE,
		hourly: ONE_HOUR,
		daily: ONE_DAY,
		weekly: ONE_WEEK,
		monthly: ONE_MONTH,
		yearly: ONE_YEAR
	};

	var _incrementDate = function _incrementDate(start, end, interval, increment) {
		return new Date(start.getTime() + (INTERVALS[interval] * increment));
	};


	// SCHEDULER PLUGIN DEFINITION

	$.fn.scheduler = function scheduler(option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.scheduler');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.scheduler', (data = new Scheduler(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.scheduler.defaults = {};

	$.fn.scheduler.Constructor = Scheduler;

	$.fn.scheduler.noConflict = function noConflict() {
		$.fn.scheduler = old;
		return this;
	};


	// DATA-API
	/*

	$(document).on('mousedown.fu.scheduler.data-api', '[data-initialize=scheduler]', function (e) {
		var $control = $(e.target).closest('.scheduler');
		if (!$control.data('fu.scheduler')) {
			$control.scheduler($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=scheduler]').each(function () {
			var $this = $(this);
			if ($this.data('scheduler')) return;
			$this.scheduler($this.data());
		});
	});
	*/

	return $.fn.scheduler;
});

define('skylark-fuelux/search',[
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux",
  "skylark-bootstrap3/dropdown"  
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Search
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.search;

	// SEARCH CONSTRUCTOR AND PROTOTYPE

	var Search = fuelux.Search = fuelux.WidgetBase.inherit({
		klassName: "Search",

		init : function(element,options) {
			this.$element = $(element);
			this.$repeater = $(element).closest('.repeater');
			this.options = langx.mixin({}, $.fn.search.defaults, options);

			if (this.$element.attr('data-searchOnKeyPress') === 'true'){
				this.options.searchOnKeyPress = true;
			}

			this.$button = this.$element.find('button');
			this.$input = this.$element.find('input');
			this.$icon = this.$element.find('.glyphicon, .fuelux-icon');

			this.$button.on('click.fu.search', langx.proxy(this.buttonclicked, this));
			this.$input.on('keyup.fu.search', langx.proxy(this.keypress, this));

			if (this.$repeater.length > 0) {
				this.$repeater.on('rendered.fu.repeater', langx.proxy(this.clearPending, this));
			}

			this.activeSearch = '';
		},
		destroy: function () {
			this.$element.remove();
			// any external bindings
			// [none]
			// set input value attrbute
			this.$element.find('input').each(function () {
				$(this).attr('value', $(this).val());
			});
			// empty elements to return to original markup
			// [none]
			// returns string of markup
			return this.$element[0].outerHTML;
		},

		search: function (searchText) {
			if (this.$icon.hasClass('glyphicon')) {
				this.$icon.removeClass('glyphicon-search').addClass('glyphicon-remove');
			}
			if (this.$icon.hasClass('fuelux-icon')) {
				this.$icon.removeClass('fuelux-icon-search').addClass('fuelux-icon-remove');
			}

			this.activeSearch = searchText;
			this.$element.addClass('searched pending');
			this.$element.trigger('searched.fu.search', searchText);
		},

		clear: function () {
			if (this.$icon.hasClass('glyphicon')) {
				this.$icon.removeClass('glyphicon-remove').addClass('glyphicon-search');
			}
			if (this.$icon.hasClass('fuelux-icon')) {
				this.$icon.removeClass('fuelux-icon-remove').addClass('fuelux-icon-search');
			}

			if (this.$element.hasClass('pending')) {
				this.$element.trigger('canceled.fu.search');
			}

			this.activeSearch = '';
			this.$input.val('');
			this.$element.trigger('cleared.fu.search');
			this.$element.removeClass('searched pending');
		},

		clearPending: function () {
			this.$element.removeClass('pending');
		},

		action: function () {
			var val = this.$input.val();

			if (val && val.length > 0) {
				this.search(val);
			} else {
				this.clear();
			}
		},

		buttonclicked: function (e) {
			e.preventDefault();
			if ($(e.currentTarget).is('.disabled, :disabled')) return;

			if (this.$element.hasClass('pending') || this.$element.hasClass('searched')) {
				this.clear();
			} else {
				this.action();
			}
		},

		keypress: function (e) {
			var ENTER_KEY_CODE = 13;
			var TAB_KEY_CODE = 9;
			var ESC_KEY_CODE = 27;

			if (e.which === ENTER_KEY_CODE) {
				e.preventDefault();
				this.action();
			} else if (e.which === TAB_KEY_CODE) {
				e.preventDefault();
			} else if (e.which === ESC_KEY_CODE) {
				e.preventDefault();
				this.clear();
			} else if (this.options.searchOnKeyPress) {
				// search on other keypress
				this.action();
			}
		},

		disable: function () {
			this.$element.addClass('disabled');
			this.$input.attr('disabled', 'disabled');

			if (!this.options.allowCancel) {
				this.$button.addClass('disabled');
			}
		},

		enable: function () {
			this.$element.removeClass('disabled');
			this.$input.removeAttr('disabled');
			this.$button.removeClass('disabled');
		}
	});

	// SEARCH PLUGIN DEFINITION

	$.fn.search = function (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.search');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.search', (data = new Search(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.search.defaults = {
		clearOnEmpty: false,
		searchOnKeyPress: false,
		allowCancel: false
	};

	$.fn.search.Constructor = Search;

	$.fn.search.noConflict = function () {
		$.fn.search = old;
		return this;
	};


	// DATA-API
	/*
	$(document).on('mousedown.fu.search.data-api', '[data-initialize=search]', function (e) {
		var $control = $(e.target).closest('.search');
		if (!$control.data('fu.search')) {
			$control.search($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=search]').each(function () {
			var $this = $(this);
			if ($this.data('fu.search')) return;
			$this.search($this.data());
		});
	});
	*/

	return 	$.fn.search;
});

define('skylark-fuelux/tree',[
  "skylark-langx/langx",
  "skylark-domx/browser",
  "skylark-domx/eventer",
  "skylark-domx/noder",
  "skylark-domx/geom",
  "skylark-domx/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Tree
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.tree;

	// TREE CONSTRUCTOR AND PROTOTYPE

	var Tree = fuelux.Tree = fuelux.WidgetBase.inherit({
		klassName: "Tree",

		init : function(element,options) {
			this.$element = $(element);
			this.options = langx.mixin({}, $.fn.tree.defaults, options);

			this.$element.attr('tabindex', '0');

			if (this.options.itemSelect) {
				this.$element.on('click.fu.tree', '.tree-item', langx.proxy(function callSelect (ev) {
					this.selectItem(ev.currentTarget);
				}, this));
			}

			this.$element.on('click.fu.tree', '.tree-branch-name', langx.proxy(function callToggle (ev) {
				this.toggleFolder(ev.currentTarget);
			}, this));

			this.$element.on('click.fu.tree', '.tree-overflow', langx.proxy(function callPopulate (ev) {
				this.populate($(ev.currentTarget));
			}, this));

			// folderSelect default is true
			if (this.options.folderSelect) {
				this.$element.addClass('tree-folder-select');
				this.$element.off('click.fu.tree', '.tree-branch-name');
				this.$element.on('click.fu.tree', '.icon-caret', langx.proxy(function callToggle (ev) {
					this.toggleFolder($(ev.currentTarget).parent());
				}, this));
				this.$element.on('click.fu.tree', '.tree-branch-name', langx.proxy(function callSelect (ev) {
					this.selectFolder($(ev.currentTarget));
				}, this));
			}

			this.$element.on('focus', function setFocusOnTab () {
				var $tree = $(this);
				focusIn($tree, $tree);
			});

			this.$element.on('keydown', function processKeypress (e) {
				return navigateTree($(this), e);
			});

			this.render();
		},
		deselectAll: function deselectAll(n) {
			// clear all child tree nodes and style as deselected
			var nodes = n || this.$element;
			var $selectedElements = $(nodes).find('.tree-selected');
			$selectedElements.each(function callStyleNodeDeselected (index, element) {
				var $element = $(element);
				ariaDeselect($element);
				styleNodeDeselected( $element, $element.find( '.glyphicon' ) );
			});
			return $selectedElements;
		},

		destroy: function destroy() {
			// any external bindings [none]
			// empty elements to return to original markup
			this.$element.find('li:not([data-template])').remove();

			this.$element.remove();
			// returns string of markup
			return this.$element[0].outerHTML;
		},

		render: function render() {
			this.populate(this.$element);
		},

		populate: function populate($el, ibp) {
			var self = this;

			// populate was initiated based on clicking overflow link
			var isOverflow = $el.hasClass('tree-overflow');

			var $parent = ($el.hasClass('tree')) ? $el : $el.parent();
			var atRoot = $parent.hasClass('tree');

			if (isOverflow && !atRoot) {
				$parent = $parent.parent();
			}

			var treeData = $parent.data();
			// expose overflow data to datasource so it can be responded to appropriately.
			if (isOverflow) {
				treeData.overflow = $el.data();
			}

			var isBackgroundProcess = ibp || false;	// no user affordance needed (ex.- "loading")

			if (isOverflow) {
				if (atRoot) {
					// the loader at the root level needs to continually replace the overflow trigger
					// otherwise, when loader is shown below, it will be the loader for the last folder
					// in the tree, instead of the loader at the root level.
					$el.replaceWith($parent.find('> .tree-loader').remove());
				} else {
					$el.remove();
				}
			}

			var $loader = $parent.find('.tree-loader:last');

			if (isBackgroundProcess === false) {
				$loader.removeClass('hide hidden'); // jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
			}

			this.options.dataSource(treeData ? treeData : {}, function populateNodes (items) {
				langx.each(items.data, function buildNode (i, treeNode) {
					var nodeType = treeNode.type;

					// 'item' and 'overflow' remain consistent, but 'folder' maps to 'branch'
					if (treeNode.type === 'folder') {
						nodeType = 'branch';
					}

					var $entity = self.$element
						.find('[data-template=tree' + nodeType + ']:eq(0)')
						.clone()
						.removeClass('hide hidden')// jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
						.removeData('template')
						.removeAttr('data-template');
					$entity.find('.tree-' + nodeType + '-name > .tree-label').html(treeNode.text || treeNode.name);
					$entity.data(treeNode);


					// Decorate $entity with data or other attributes making the
					// element easily accessible with libraries like jQuery.
					//
					// Values are contained within the object returned
					// for folders and items as attr:
					//
					// {
					//     text: "An Item",
					//     type: 'item',
					//     attr = {
					//         'classes': 'required-item red-text',
					//         'data-parent': parentId,
					//         'guid': guid,
					//         'id': guid
					//     }
					// };
					//
					// the "name" attribute is also supported but is deprecated for "text".

					// add attributes to tree-branch or tree-item
					var attrs = treeNode.attr || treeNode.dataAttributes || [];
					langx.each(attrs, function setAttribute (attr, setTo) {
						switch (attr) {
						case 'cssClass':
						case 'class':
						case 'className':
							$entity.addClass(setTo);
							break;

						// allow custom icons
						case 'data-icon':
							$entity.find('.icon-item').removeClass().addClass('icon-item ' + setTo);
							$entity.attr(attr, setTo);
							break;

						// ARIA support
						case 'id':
							$entity.attr(attr, setTo);
							$entity.attr('aria-labelledby', setTo + '-label');
							$entity.find('.tree-branch-name > .tree-label').attr('id', setTo + '-label');
							break;

						// style, data-*
						default:
							$entity.attr(attr, setTo);
							break;
						}
					});

					// add child node
					if (atRoot) {
						// For accessibility reasons, the root element is the only tab-able element (see https://github.com/ExactTarget/fuelux/issues/1964)
						$parent.append($entity);
					} else {
						$parent.find('.tree-branch-children:eq(0)').append($entity);
					}
				});

				$parent.find('.tree-loader').addClass('hidden');
				// return newly populated folder
				self.$element.trigger('loaded.fu.tree', $parent);
			});
		},

		selectTreeNode: function selectItem(clickedElement, nodeType) {
			var clicked = {};	// object for clicked element
			clicked.$element = $(clickedElement);

			var selected = {}; // object for selected elements
			selected.$elements = this.$element.find('.tree-selected');
			selected.dataForEvent = [];

			// determine clicked element and it's icon
			if (nodeType === 'folder') {
				// make the clicked.$element the container branch
				clicked.$element = clicked.$element.closest('.tree-branch');
				clicked.$icon = clicked.$element.find('.icon-folder');
			} else {
				clicked.$icon = clicked.$element.find('.icon-item');
			}
			clicked.elementData = clicked.$element.data();

			ariaSelect(clicked.$element);

			// the below functions pass objects by copy/reference and use modified object in this function
			if ( this.options.multiSelect ) {
				selected = multiSelectSyncNodes(this, clicked, selected);
			} else {
				selected = singleSelectSyncNodes(this, clicked, selected);
			}

			setFocus(this.$element, clicked.$element);

			// all done with the DOM, now fire events
			this.$element.trigger(selected.eventType + '.fu.tree', {
				target: clicked.elementData,
				selected: selected.dataForEvent
			});

			clicked.$element.trigger('updated.fu.tree', {
				selected: selected.dataForEvent,
				item: clicked.$element,
				eventType: selected.eventType
			});
		},

		discloseFolder: function discloseFolder(folder) {
			var $folder = $(folder);

			var $branch = $folder.closest('.tree-branch');
			var $treeFolderContent = $branch.find('.tree-branch-children');
			var $treeFolderContentFirstChild = $treeFolderContent.eq(0);

			// take care of the styles
			$branch.addClass('tree-open');
			$branch.attr('aria-expanded', 'true');
			$treeFolderContentFirstChild.removeClass('hide hidden'); // jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
			$branch.find('> .tree-branch-header .icon-folder').eq(0)
				.removeClass('glyphicon-folder-close')
				.addClass('glyphicon-folder-open');

			var $tree = this.$element;
			var disclosedCompleted = function disclosedCompleted () {
				$tree.trigger('disclosedFolder.fu.tree', $branch.data());
			};

			// add the children to the folder
			if (!$treeFolderContent.children().length) {
				$tree.one('loaded.fu.tree', disclosedCompleted);
				this.populate($treeFolderContent);
			} else {
				disclosedCompleted();
			}
		},

		closeFolder: function closeFolder(el) {
			var $el = $(el);
			var $branch = $el.closest('.tree-branch');
			var $treeFolderContent = $branch.find('.tree-branch-children');
			var $treeFolderContentFirstChild = $treeFolderContent.eq(0);

			// take care of the styles
			$branch.removeClass('tree-open');
			$branch.attr('aria-expanded', 'false');
			$treeFolderContentFirstChild.addClass('hidden');
			$branch.find('> .tree-branch-header .icon-folder').eq(0)
				.removeClass('glyphicon-folder-open')
				.addClass('glyphicon-folder-close');

			// remove chidren if no cache
			if (!this.options.cacheItems) {
				$treeFolderContentFirstChild.empty();
			}

			this.$element.trigger('closed.fu.tree', $branch.data());
		},

		toggleFolder: function toggleFolder(el) {
			var $el = $(el);

			if ($el.find('.glyphicon-folder-close').length) {
				this.discloseFolder(el);
			} else if ($el.find('.glyphicon-folder-open').length) {
				this.closeFolder(el);
			}
		},

		selectFolder: function selectFolder(el) {
			if (this.options.folderSelect) {
				this.selectTreeNode(el, 'folder');
			}
		},

		selectItem: function selectItem(el) {
			if (this.options.itemSelect) {
				this.selectTreeNode(el, 'item');
			}
		},

		selectedItems: function selectedItems() {
			var $sel = this.$element.find('.tree-selected');
			var selected = [];

			langx.each($sel, function buildSelectedArray (i, value) {
				selected.push($(value).data());
			});
			return selected;
		},

		// collapses open folders
		collapse: function collapse() {
			var self = this;
			var reportedClosed = [];

			var closedReported = function closedReported(event, closed) {
				reportedClosed.push(closed);

				// jQuery deprecated hide in 3.0. Use hidden instead. Leaving hide here to support previous markup
				if (self.$element.find(".tree-branch.tree-open:not('.hidden, .hide')").length === 0) {
					self.$element.trigger('closedAll.fu.tree', {
						tree: self.$element,
						reportedClosed: reportedClosed
					});
					self.$element.off('loaded.fu.tree', self.$element, closedReported);
				}
			};

			// trigger callback when all folders have reported closed
			self.$element.on('closed.fu.tree', closedReported);

			self.$element.find(".tree-branch.tree-open:not('.hidden, .hide')").each(function closeFolder () {
				self.closeFolder(this);
			});
		},

		// disclose visible will only disclose visible tree folders
		discloseVisible: function discloseVisible() {
			var self = this;

			var $openableFolders = self.$element.find(".tree-branch:not('.tree-open, .hidden, .hide')");
			var reportedOpened = [];

			var openReported = function openReported(event, opened) {
				reportedOpened.push(opened);

				if (reportedOpened.length === $openableFolders.length) {
					self.$element.trigger('disclosedVisible.fu.tree', {
						tree: self.$element,
						reportedOpened: reportedOpened
					});
					/*
					* Unbind the `openReported` event. `discloseAll` may be running and we want to reset this
					* method for the next iteration.
					*/
					self.$element.off('loaded.fu.tree', self.$element, openReported);
				}
			};

			// trigger callback when all folders have reported opened
			self.$element.on('loaded.fu.tree', openReported);

			// open all visible folders
			self.$element.find(".tree-branch:not('.tree-open, .hidden, .hide')").each(function triggerOpen() {
				self.discloseFolder($(this).find('.tree-branch-header'));
			});
		},

		/*
		* Disclose all will keep listening for `loaded.fu.tree` and if `$(tree-el).data('ignore-disclosures-limit')`
		* is `true` (defaults to `true`) it will attempt to disclose any new closed folders than were
		* loaded in during the last disclosure.
		*/
		discloseAll: function discloseAll() {
			var self = this;

			// first time
			if (typeof self.$element.data('disclosures') === 'undefined') {
				self.$element.data('disclosures', 0);
			}

			var isExceededLimit = (self.options.disclosuresUpperLimit >= 1 && self.$element.data('disclosures') >= self.options.disclosuresUpperLimit);
			var isAllDisclosed = self.$element.find(".tree-branch:not('.tree-open, .hidden, .hide')").length === 0;


			if (!isAllDisclosed) {
				if (isExceededLimit) {
					self.$element.trigger('exceededDisclosuresLimit.fu.tree', {
						tree: self.$element,
						disclosures: self.$element.data('disclosures')
					});

					/*
					* If you've exceeded the limit, the loop will be killed unless you
					* explicitly ignore the limit and start the loop again:
					*
					*    $tree.one('exceededDisclosuresLimit.fu.tree', function () {
					*        $tree.data('ignore-disclosures-limit', true);
					*        $tree.tree('discloseAll');
					*    });
					*/
					if (!self.$element.data('ignore-disclosures-limit')) {
						return;
					}
				}

				self.$element.data('disclosures', self.$element.data('disclosures') + 1);

				/*
				* A new branch that is closed might be loaded in, make sure those get handled too.
				* This attachment needs to occur before calling `discloseVisible` to make sure that
				* if the execution of `discloseVisible` happens _super fast_ (as it does in our QUnit tests
				* this will still be called. However, make sure this only gets called _once_, because
				* otherwise, every single time we go through this loop, _another_ event will be bound
				* and then when the trigger happens, this will fire N times, where N equals the number
				* of recursive `discloseAll` executions (instead of just one)
				*/
				self.$element.one('disclosedVisible.fu.tree', function callDiscloseAll () {
					self.discloseAll();
				});

				/*
				* If the page is very fast, calling this first will cause `disclosedVisible.fu.tree` to not
				* be bound in time to be called, so, we need to call this last so that the things bound
				* and triggered above can have time to take place before the next execution of the
				* `discloseAll` method.
				*/
				self.discloseVisible();
			} else {
				self.$element.trigger('disclosedAll.fu.tree', {
					tree: self.$element,
					disclosures: self.$element.data('disclosures')
				});

				// if `cacheItems` is false, and they call closeAll, the data is trashed and therefore
				// disclosures needs to accurately reflect that
				if (!self.options.cacheItems) {
					self.$element.one('closeAll.fu.tree', function updateDisclosuresData () {
						self.$element.data('disclosures', 0);
					});
				}
			}
		},

		// This refreshes the children of a folder. Please destroy and re-initilize for "root level" refresh.
		// The data of the refreshed folder is not updated. This control's architecture only allows updating of children.
		// Folder renames should probably be handled directly on the node.
		refreshFolder: function refreshFolder($el) {
			var $treeFolder = $el.closest('.tree-branch');
			var $treeFolderChildren = $treeFolder.find('.tree-branch-children');
			$treeFolderChildren.eq(0).empty();

			if ($treeFolder.hasClass('tree-open')) {
				this.populate($treeFolderChildren, false);
			} else {
				this.populate($treeFolderChildren, true);
			}

			this.$element.trigger('refreshedFolder.fu.tree', $treeFolder.data());
		}
	});

	// ALIASES

	// alias for collapse for consistency. "Collapse" is an ambiguous term (collapse what? All? One specific branch?)
	Tree.prototype.closeAll = Tree.prototype.collapse;
	// alias for backwards compatibility because there's no reason not to.
	Tree.prototype.openFolder = Tree.prototype.discloseFolder;
	// For library consistency
	Tree.prototype.getValue = Tree.prototype.selectedItems;

	// PRIVATE FUNCTIONS

	var fixFocusability = function fixFocusability ($tree, $branch) {
		/*
		When tree initializes on page, the `<ul>` element should have tabindex=0 and all sub-elements should have
		tabindex=-1. When focus leaves the tree, whatever the last focused on element was will keep the tabindex=0. The
		tree itself will have a tabindex=-1. The reason for this is that if you are inside of the tree and press
		shift+tab, it will try and focus on the tree you are already in, which will cause focus to shift immediately
		back to the element you are already focused on. That will make it seem like the event is getting "Swallowed up"
		by an aggressive event listener trap.

		For this reason, only one element in the entire tree, including the tree itself, should ever have tabindex=0.
		If somewhere down the line problems are being caused by this, the only further potential improvement I can
		envision at this time is listening for the tree to lose focus and reseting the tabindexes of all children to -1
		and setting the tabindex of the tree itself back to 0. This seems overly complicated with no benefit that I can
		imagine at this time, so instead I am leaving the last focused element with the tabindex of 0, even upon blur of
		the tree.

		One benefit to leaving the last focused element in a tree with a tabindex=0 is that if you accidentally tab out
		of the tree and then want to tab back in, you will be placed exactly where you left off instead of at the
		beginning of the tree.
		*/
		$tree.attr('tabindex', -1);
		$tree.find('li').attr('tabindex', -1);
		if ($branch && $branch.length > 0) {
			$branch.attr('tabindex', 0); // if tabindex is not set to 0 (or greater), node is not able to receive focus
		}
	};

	// focuses into (onto one of the children of) the provided branch
	var focusIn = function focusIn ($tree, $branch) {
		var $focusCandidate = $branch.find('.tree-selected:first');

		// if no node is selected, set focus to first visible node
		if ($focusCandidate.length <= 0) {
			$focusCandidate = $branch.find('li:not(".hidden"):first');
		}

		setFocus($tree, $focusCandidate);
	};

	// focuses on provided branch
	var setFocus = function setFocus ($tree, $branch) {
		fixFocusability($tree, $branch);

		$tree.attr('aria-activedescendant', $branch.attr('id'));

		$branch.focus();

		$tree.trigger('setFocus.fu.tree', $branch);
	};

	var navigateTree = function navigateTree ($tree, e) {
		if (e.isDefaultPrevented() || e.isPropagationStopped()) {
			return false;
		}

		var targetNode = e.originalEvent.target;
		var $targetNode = $(targetNode);
		var isOpen = $targetNode.hasClass('tree-open');
		var handled = false;
		// because es5 lacks promises and fuelux has no polyfil (and I'm not adding one just for this change)
		// I am faking up promises here through callbacks and listeners. Done will be fired immediately at the end of
		// the navigateTree method if there is no (fake) promise, but will be fired by an event listener that will
		// be triggered by another function if necessary. This way when done runs, and fires keyboardNavigated.fu.tree
		// anything listening for that event can be sure that everything tied to that event is actually completed.
		var fireDoneImmediately = true;
		var done = function done () {
			$tree.trigger('keyboardNavigated.fu.tree', e, $targetNode);
		};

		switch (e.which) {
		case 13: // enter
		case 32: // space
			// activates a node, i.e., performs its default action.
			// For parent nodes, one possible default action is to open or close the node.
			// In single-select trees where selection does not follow focus, the default action is typically to select the focused node.
			var foldersSelectable = $tree.hasClass('tree-folder-select');
			var isFolder = $targetNode.hasClass('tree-branch');
			var isItem = $targetNode.hasClass('tree-item');
			// var isOverflow = $targetNode.hasClass('tree-overflow');

			fireDoneImmediately = false;
			if (isFolder) {
				if (foldersSelectable) {
					$tree.one('selected.fu.tree deselected.fu.tree', done);
					$tree.tree('selectFolder', $targetNode.find('.tree-branch-header')[0]);
				} else {
					$tree.one('loaded.fu.tree closed.fu.tree', done);
					$tree.tree('toggleFolder', $targetNode.find('.tree-branch-header')[0]);
				}
			} else if (isItem) {
				$tree.one('selected.fu.tree', done);
				$tree.tree('selectItem', $targetNode);
			} else {
				// should be isOverflow... Try and click on it either way.
				$prev = $($targetNode.prevAll().not('.hidden')[0]);
				$targetNode.click();

				$tree.one('loaded.fu.tree', function selectFirstNewlyLoadedNode () {
					$next = $($prev.nextAll().not('.hidden')[0]);

					setFocus($tree, $next);
					done();
				});
			}

			handled = true;
			break;
		case 35: // end
			// Set focus to the last node in the tree that is focusable without opening a node.
			setFocus($tree, $tree.find('li:not(".hidden"):last'));

			handled = true;
			break;
		case 36: // home
			// set focus to the first node in the tree without opening or closing a node.
			setFocus($tree, $tree.find('li:not(".hidden"):first'));

			handled = true;
			break;
		case 37: // left
			if (isOpen) {
				fireDoneImmediately = false;
				$tree.one('closed.fu.tree', done);
				$tree.tree('closeFolder', targetNode);
			} else {
				setFocus($tree, $($targetNode.parents('li')[0]));
			}

			handled = true;
			break;

		case 38: // up
			// move focus to previous sibling
			var $prev = [];
			// move to previous li not hidden
			$prev = $($targetNode.prevAll().not('.hidden')[0]);

			// if the previous li is open, and has children, move selection to its last child so selection
			// appears to move to the next "thing" up
			if ($prev.hasClass('tree-open')) {
				var $prevChildren = $prev.find('li:not(".hidden"):last');
				if ($prevChildren.length > 0) {
					$prev = $($prevChildren[0]);
				}
			}

			// if nothing has been selected, we are presumably at the top of an open li, select the immediate parent
			if ($prev.length < 1) {
				$prev = $($targetNode.parents('li')[0]);
			}
			setFocus($tree, $prev);

			handled = true;
			break;

		case 39: // right
			if (isOpen) {
				focusIn($tree, $targetNode);
			} else {
				fireDoneImmediately = false;
				$tree.one('disclosed.fu.tree', done);
				$tree.tree('discloseFolder', targetNode);
			}

			handled = true;
			break;

		case 40: // down
			// move focus to next selectable tree node
			var $next = $($targetNode.find('li:not(".hidden"):first')[0]);
			if (!isOpen || $next.length <= 0) {
				$next = $($targetNode.nextAll().not('.hidden')[0]);
			}

			if ($next.length < 1) {
				$next = $($($targetNode.parents('li')[0]).nextAll().not('.hidden')[0]);
			}
			setFocus($tree, $next);

			handled = true;
			break;

		default:
			// console.log(e.which);
			return true; // exit this handler for other keys
		}

		// if we didn't handle the event, allow propagation to continue so something else might.
		if (handled) {
			e.preventDefault();
			e.stopPropagation();
			if (fireDoneImmediately) {
				done();
			}
		}

		return true;
	};

	var ariaSelect = function ariaSelect ($element) {
		$element.attr('aria-selected', true);
	};

	var ariaDeselect = function ariaDeselect ($element) {
		$element.attr('aria-selected', false);
	};

	function styleNodeSelected ($element, $icon) {
		$element.addClass('tree-selected');
		if ( $element.data('type') === 'item' && $icon.hasClass('fueluxicon-bullet') ) {
			$icon.removeClass('fueluxicon-bullet').addClass('glyphicon-ok'); // make checkmark
		}
	}

	function styleNodeDeselected ($element, $icon) {
		$element.removeClass('tree-selected');
		if ( $element.data('type') === 'item' && $icon.hasClass('glyphicon-ok') ) {
			$icon.removeClass('glyphicon-ok').addClass('fueluxicon-bullet'); // make bullet
		}
	}

	function multiSelectSyncNodes (self, clicked, selected) {
		// search for currently selected and add to selected data list if needed
		langx.each(selected.$elements, function findCurrentlySelected (index, element) {
			var $element = $(element);

			if ($element[0] !== clicked.$element[0]) {
				selected.dataForEvent.push( $($element).data() );
			}
		});

		if (clicked.$element.hasClass('tree-selected')) {
			styleNodeDeselected(clicked.$element, clicked.$icon);
			// set event data
			selected.eventType = 'deselected';
		} else {
			styleNodeSelected(clicked.$element, clicked.$icon);
			// set event data
			selected.eventType = 'selected';
			selected.dataForEvent.push(clicked.elementData);
		}

		return selected;
	}

	function singleSelectSyncNodes(self, clicked, selected) {
		// element is not currently selected
		if (selected.$elements[0] !== clicked.$element[0]) {
			self.deselectAll(self.$element);
			styleNodeSelected(clicked.$element, clicked.$icon);
			// set event data
			selected.eventType = 'selected';
			selected.dataForEvent = [clicked.elementData];
		} else {
			styleNodeDeselected(clicked.$element, clicked.$icon);
			// set event data
			selected.eventType = 'deselected';
			selected.dataForEvent = [];
		}

		return selected;
	}

	// TREE PLUGIN DEFINITION

	$.fn.tree = function fntree (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function eachThis () {
			var $this = $(this);
			var data = $this.data('fu.tree');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.tree', (data = new Tree(this, options)));
				$this.trigger('initialized.fu.tree');
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	/*
	 * Private method used only by the default dataSource for the tree, which is used to consume static
	 * tree data.
	 *
	 * Find children of supplied parent in rootData. You can pass in an entire deeply nested tree
	 * and this will look through it recursively until it finds the child data you are looking for.
	 *
	 * For extremely large trees, this could cause the browser to crash, as there is no protection
	 * or limit on the amount of branches that will be searched through.
	 */
	var findChildData = function findChildData (targetParent, rootData) {
		var isRootOfTree = $.isEmptyObject(targetParent);
		if (isRootOfTree) {
			return rootData;
		}

		if (rootData === undefined) {
			return false;
		}

		for (var i = 0; i < rootData.length; i++) {
			var potentialMatch = rootData[i];

			if (potentialMatch.attr && targetParent.attr && potentialMatch.attr.id === targetParent.attr.id) {
				return potentialMatch.children;
			} else if (potentialMatch.children) {
				var foundChild = findChildData(targetParent, potentialMatch.children);
				if (foundChild) {
					return foundChild;
				}
			}
		}

		return false;
	};

	$.fn.tree.defaults = {
		/*
		 * A static data representation of your full tree data. If you do not override the tree's
		 * default dataSource method, this will just make the tree work out of the box without
		 * you having to bring your own dataSource.
		 *
		 * Array of Objects representing tree branches (folder) and leaves (item):
			[
				{
					name: '',
					type: 'folder',
					attr: {
						id: ''
					},
					children: [
						{
							name: '',
							type: 'item',
							attr: {
								id: '',
								'data-icon': 'glyphicon glyphicon-file'
							}
						}
					]
				},
				{
					name: '',
					type: 'item',
					attr: {
						id: '',
						'data-icon': 'glyphicon glyphicon-file'
					}
				}
			];
		 */
		staticData: [],
		/*
		 * If you set the full tree data on options.staticData, you can use this default dataSource
		 * to consume that data. This allows you to just pass in a JSON array representation
		 * of your full tree data and the tree will just work out of the box.
		 */
		dataSource: function staticDataSourceConsumer (openedParentData, callback) {
			if (this.staticData.length > 0) {
				var childData = findChildData(openedParentData, this.staticData);

				callback({
					data: childData
				});
			}
		},
		multiSelect: false,
		cacheItems: true,
		folderSelect: true,
		itemSelect: true,
		/*
		* How many times `discloseAll` should be called before a stopping and firing
		* an `exceededDisclosuresLimit` event. You can force it to continue by
		* listening for this event, setting `ignore-disclosures-limit` to `true` and
		* starting `discloseAll` back up again. This lets you make more decisions
		* about if/when/how/why/how many times `discloseAll` will be started back
		* up after it exceeds the limit.
		*
		*    $tree.one('exceededDisclosuresLimit.fu.tree', function () {
		*        $tree.data('ignore-disclosures-limit', true);
		*        $tree.tree('discloseAll');
		*    });
		*
		* `disclusuresUpperLimit` defaults to `0`, so by default this trigger
		* will never fire. The true hard the upper limit is the browser's
		* ability to load new items (i.e. it will keep loading until the browser
		* falls over and dies). On the Fuel UX `index.html` page, the point at
		* which the page became super slow (enough to seem almost unresponsive)
		* was `4`, meaning 256 folders had been opened, and 1024 were attempting to open.
		*/
		disclosuresUpperLimit: 0
	};

	$.fn.tree.Constructor = Tree;

	$.fn.tree.noConflict = function noConflict () {
		$.fn.tree = old;
		return this;
	};

	return $.fn.tree;
});
define('skylark-fuelux/wizard',[
  "skylark-domx-query",
  "skylark-domx-plugins-base",
  "skylark-domx-plugins-panels/wizard",
   "./fuelux"
],function($,plugins,_Wizard,fuelux){

	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.wizard;


	var Wizard = fuelux.Wizard = _Wizard.inherit({
	    klassName: "Checkbox",

	    pluginName : "fuelux.wizard"
	});


    plugins.register(Wizard,"wizard");
    

	$.fn.wizard.noConflict = function () {
		$.fn.wizard = old;
		return this;
	};


	// DATA-API

	/*
	$(document).on('mouseover.fu.wizard.data-api', '[data-initialize=wizard]', function (e) {
		var $control = $(e.target).closest('.wizard');
		if (!$control.data('fu.wizard')) {
			$control.wizard($control.data());
		}
	});

	// Must be domReady for AMD compatibility
	$(function () {
		$('[data-initialize=wizard]').each(function () {
			var $this = $(this);
			if ($this.data('fu.wizard')) return;
			$this.wizard($this.data());
		});
	});
	*/

	return $.fn.wizard ;

});

define('skylark-fuelux/repeater',[
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

define('skylark-fuelux/main',[
    "skylark-domx/query",
    "skylark-bootstrap3",
    "./checkbox",
    "./combobox",
    "./datepicker",
    "./dropdown-autoflip",
    "./infinite-scroll",
    "./loader",
    "./picker",
    "./pillbox",
    "./placard",
    "./radio",
    "./scheduler",
    "./search",
    "./selectlist",
    "./spinbox",
    "./tree",
    "./wizard",

    "./repeater"

], function($) {
    return $;
});
define('skylark-fuelux', ['skylark-fuelux/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-fuelux-slax.js.map
