/**
 * skylark-fuelux - A version of fuelux that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.2
 * @link https://github.com/skylarkui/skylark-fuelux/
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
                exports: null
            };
            require(id);
        } else {
            map[id] = factory;
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.exports) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args);
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx/skylark");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-langx/skylark',[], function() {
    var skylark = {

    };
    return skylark;
});

define('skylark-utils-dom/skylark',["skylark-langx/skylark"], function(skylark) {
    return skylark;
});

define('skylark-utils-dom/dom',["./skylark"], function(skylark) {
	return skylark.dom = {};
});

define('skylark-langx/types',[
],function(){
    var type = (function() {
        var class2type = {};

        // Populate the class2type map
        "Boolean Number String Function Array Date RegExp Object Error".split(" ").forEach(function(name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });

        return function type(obj) {
            return obj == null ? String(obj) :
                class2type[toString.call(obj)] || "object";
        };
    })();

    function isArray(object) {
        return object && object.constructor === Array;
    }

    function isArrayLike(obj) {
        return !isString(obj) && !isHtmlNode(obj) && typeof obj.length == 'number' && !isFunction(obj);
    }

    function isBoolean(obj) {
        return typeof(obj) === "boolean";
    }

    function isDefined(obj) {
        return typeof obj !== 'undefined';
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    }

    function isEmptyObject(obj) {
        var name;
        for (name in obj) {
            if (obj[name] !== null) {
                return false;
            }
        }
        return true;
    }

    function isFunction(value) {
        return type(value) == "function";
    }

    function isHtmlNode(obj) {
        return obj && (obj instanceof Node);
    }

    function isInstanceOf( /*Object*/ value, /*Type*/ type) {
        //Tests whether the value is an instance of a type.
        if (value === undefined) {
            return false;
        } else if (value === null || type == Object) {
            return true;
        } else if (typeof value === "number") {
            return type === Number;
        } else if (typeof value === "string") {
            return type === String;
        } else if (typeof value === "boolean") {
            return type === Boolean;
        } else if (typeof value === "string") {
            return type === String;
        } else {
            return (value instanceof type) || (value && value.isInstanceOf ? value.isInstanceOf(type) : false);
        }
    }

    function isNumber(obj) {
        return typeof obj == 'number';
    }

    function isObject(obj) {
        return type(obj) == "object";
    }

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    }

    function isString(obj) {
        return typeof obj === 'string';
    }

    function isWindow(obj) {
        return obj && obj == obj.window;
    }

    function isSameOrigin(href) {
        if (href) {
            var origin = location.protocol + '//' + location.hostname;
            if (location.port) {
                origin += ':' + location.port;
            }
            return href.startsWith(origin);
        }
    }

    return {

        isArray: isArray,

        isArrayLike: isArrayLike,

        isBoolean: isBoolean,

        isDefined: isDefined,

        isDocument: isDocument,

        isEmptyObject: isEmptyObject,

        isFunction: isFunction,

        isHtmlNode: isHtmlNode,

        isNumber: isNumber,

        isObject: isObject,

        isPlainObject: isPlainObject,

        isString: isString,

        isSameOrigin: isSameOrigin,

        isWindow: isWindow,

        type: type
    };

});
define('skylark-langx/objects',[
	"./types"
],function(types){
	var hasOwnProperty = Object.prototype.hasOwnProperty,
        slice = Array.prototype.slice,
        isBoolean = types.isBoolean,
        isFunction = types.isFunction,
		isObject = types.isObject,
		isPlainObject = types.isPlainObject,
		isArray = types.isArray;

     // An internal function for creating assigner functions.
    function createAssigner(keysFunc, defaults) {
        return function(obj) {
          var length = arguments.length;
          if (defaults) obj = Object(obj);  
          if (length < 2 || obj == null) return obj;
          for (var index = 1; index < length; index++) {
            var source = arguments[index],
                keys = keysFunc(source),
                l = keys.length;
            for (var i = 0; i < l; i++) {
              var key = keys[i];
              if (!defaults || obj[key] === void 0) obj[key] = source[key];
            }
          }
          return obj;
       };
    }

    // Internal recursive comparison function for `isEqual`.
    var eq, deepEq;
    var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

    eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // `null` or `undefined` only equal to itself (strict comparison).
        if (a == null || b == null) return false;
        // `NaN`s are equivalent, but non-reflexive.
        if (a !== a) return b !== b;
        // Exhaust primitive checks
        var type = typeof a;
        if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
        return deepEq(a, b, aStack, bStack);
    };

    // Internal recursive comparison function for `isEqual`.
    deepEq = function(a, b, aStack, bStack) {
        // Unwrap any wrapped objects.
        //if (a instanceof _) a = a._wrapped;
        //if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN.
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
            case '[object Symbol]':
                return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;
            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor &&
                               isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // Deep compare objects.
            var keys = Object.keys(a), key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (Object.keys(b).length !== length) return false;
            while (length--) {
                // Deep compare each member
                key = keys[length];
                if (!(b[key]!==undefined && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return true;
    };

    // Retrieve all the property names of an object.
    function allKeys(obj) {
        if (!isObject(obj)) return [];
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
    }

    function each(obj, callback) {
        var length, key, i, undef, value;

        if (obj) {
            length = obj.length;

            if (length === undef) {
                // Loop object items
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        value = obj[key];
                        if (callback.call(value, key, value) === false) {
                            break;
                        }
                    }
                }
            } else {
                // Loop array items
                for (i = 0; i < length; i++) {
                    value = obj[i];
                    if (callback.call(value, i, value) === false) {
                        break;
                    }
                }
            }
        }

        return this;
    }

    function extend(target) {
        var deep, args = slice.call(arguments, 1);
        if (typeof target == 'boolean') {
            deep = target
            target = args.shift()
        }
        if (args.length == 0) {
            args = [target];
            target = this;
        }
        args.forEach(function(arg) {
            mixin(target, arg, deep);
        });
        return target;
    }

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`.
    function keys(obj) {
        if (isObject(obj)) return [];
        var keys = [];
        for (var key in obj) if (has(obj, key)) keys.push(key);
        return keys;
    }

    function has(obj, path) {
        if (!isArray(path)) {
            return obj != null && hasOwnProperty.call(obj, path);
        }
        var length = path.length;
        for (var i = 0; i < length; i++) {
            var key = path[i];
            if (obj == null || !hasOwnProperty.call(obj, key)) {
                return false;
            }
            obj = obj[key];
        }
        return !!length;
    }

   // Perform a deep comparison to check if two objects are equal.
    function isEqual(a, b) {
        return eq(a, b);
    }

    // Returns whether an object has a given set of `key:value` pairs.
    function isMatch(object, attrs) {
        var keys = keys(attrs), length = keys.length;
        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
          var key = keys[i];
          if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    }    

    function _mixin(target, source, deep, safe) {
        for (var key in source) {
            //if (!source.hasOwnProperty(key)) {
            //    continue;
            //}
            if (safe && target[key] !== undefined) {
                continue;
            }
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
                    target[key] = {};
                }
                if (isArray(source[key]) && !isArray(target[key])) {
                    target[key] = [];
                }
                _mixin(target[key], source[key], deep, safe);
            } else if (source[key] !== undefined) {
                target[key] = source[key]
            }
        }
        return target;
    }

    function _parseMixinArgs(args) {
        var params = slice.call(arguments, 0),
            target = params.shift(),
            deep = false;
        if (isBoolean(params[params.length - 1])) {
            deep = params.pop();
        }

        return {
            target: target,
            sources: params,
            deep: deep
        };
    }

    function mixin() {
        var args = _parseMixinArgs.apply(this, arguments);

        args.sources.forEach(function(source) {
            _mixin(args.target, source, args.deep, false);
        });
        return args.target;
    }

    function removeItem(items, item) {
        if (isArray(items)) {
            var idx = items.indexOf(item);
            if (idx != -1) {
                items.splice(idx, 1);
            }
        } else if (isPlainObject(items)) {
            for (var key in items) {
                if (items[key] == item) {
                    delete items[key];
                    break;
                }
            }
        }

        return this;
    }

    function result(obj, path, fallback) {
        if (!isArray(path)) {
            path = [path]
        };
        var length = path.length;
        if (!length) {
          return isFunction(fallback) ? fallback.call(obj) : fallback;
        }
        for (var i = 0; i < length; i++) {
          var prop = obj == null ? void 0 : obj[path[i]];
          if (prop === void 0) {
            prop = fallback;
            i = length; // Ensure we don't continue iterating.
          }
          obj = isFunction(prop) ? prop.call(obj) : prop;
        }

        return obj;
    }

    function safeMixin() {
        var args = _parseMixinArgs.apply(this, arguments);

        args.sources.forEach(function(source) {
            _mixin(args.target, source, args.deep, true);
        });
        return args.target;
    }

    // Retrieve the values of an object's properties.
    function values(obj) {
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    }


    
    function clone( /*anything*/ src,checkCloneMethod) {
        var copy;
        if (src === undefined || src === null) {
            copy = src;
        } else if (checkCloneMethod && src.clone) {
            copy = src.clone();
        } else if (isArray(src)) {
            copy = [];
            for (var i = 0; i < src.length; i++) {
                copy.push(clone(src[i]));
            }
        } else if (isPlainObject(src)) {
            copy = {};
            for (var key in src) {
                copy[key] = clone(src[key]);
            }
        } else {
            copy = src;
        }

        return copy;

    }

    return {
        allKeys: allKeys,

        clone: clone,

        defaults : createAssigner(allKeys, true),

        each : each,

        extend : extend,

        has: has,

        isEqual: isEqual,

        isMatch: isMatch,

        keys: keys,

        mixin: mixin,

        removeItem: removeItem,

        result : result,
        
        safeMixin: safeMixin,

        values: values
    };

});
define('skylark-langx/arrays',[
	"./types",
    "./objects"
],function(types,objects){
	var filter = Array.prototype.filter,
		isArrayLike = types.isArrayLike;

    function compact(array) {
        return filter.call(array, function(item) {
            return item != null;
        });
    }

    function flatten(array) {
        if (isArrayLike(array)) {
            var result = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (isArrayLike(item)) {
                    for (var j = 0; j < item.length; j++) {
                        result.push(item[j]);
                    }
                } else {
                    result.push(item);
                }
            }
            return result;
        } else {
            return array;
        }
        //return array.length > 0 ? concat.apply([], array) : array;
    }

    function grep(array, callback) {
        var out = [];

        each(array, function(i, item) {
            if (callback(item, i)) {
                out.push(item);
            }
        });

        return out;
    }

    function inArray(item, array) {
        if (!array) {
            return -1;
        }
        var i;

        if (array.indexOf) {
            return array.indexOf(item);
        }

        i = array.length;
        while (i--) {
            if (array[i] === item) {
                return i;
            }
        }

        return -1;
    }

    function makeArray(obj, offset, startWith) {
       if (isArrayLike(obj) ) {
        return (startWith || []).concat(Array.prototype.slice.call(obj, offset || 0));
      }

      // array of single index
      return [ obj ];             
    }

    function map(elements, callback) {
        var value, values = [],
            i, key
        if (isArrayLike(elements))
            for (i = 0; i < elements.length; i++) {
                value = callback.call(elements[i], elements[i], i);
                if (value != null) values.push(value)
            }
        else
            for (key in elements) {
                value = callback.call(elements[key], elements[key], key);
                if (value != null) values.push(value)
            }
        return flatten(values)
    }

    function uniq(array) {
        return filter.call(array, function(item, idx) {
            return array.indexOf(item) == idx;
        })
    }

    return {
        compact: compact,

        first : function(items,n) {
            if (n) {
                return items.slice(0,n);
            } else {
                return items[0];
            }
        },

	    each: objects.each,

        flatten: flatten,

        inArray: inArray,

        makeArray: makeArray,

        map : map,
        
        uniq : uniq

    }
});
define('skylark-langx/klass',[
    "./arrays",
    "./objects",
    "./types"
],function(arrays,objects,types){
    var uniq = arrays.uniq,
        has = objects.has,
        mixin = objects.mixin,
        isArray = types.isArray,
        isDefined = types.isDefined;
    
    function inherit(ctor, base) {
        var f = function() {};
        f.prototype = base.prototype;

        ctor.prototype = new f();
    }

    var f1 = function() {
        function extendClass(ctor, props, options) {
            // Copy the properties to the prototype of the class.
            var proto = ctor.prototype,
                _super = ctor.superclass.prototype,
                noOverrided = options && options.noOverrided;

            for (var name in props) {
                if (name === "constructor") {
                    continue;
                }

                // Check if we're overwriting an existing function
                var prop = props[name];
                if (typeof props[name] == "function") {
                    proto[name] =  !prop._constructor && !noOverrided && typeof _super[name] == "function" ?
                          (function(name, fn, superFn) {
                            return function() {
                                var tmp = this.overrided;

                                // Add a new ._super() method that is the same method
                                // but on the super-class
                                this.overrided = superFn;

                                // The method only need to be bound temporarily, so we
                                // remove it when we're done executing
                                var ret = fn.apply(this, arguments);

                                this.overrided = tmp;

                                return ret;
                            };
                        })(name, prop, _super[name]) :
                        prop;
                } else if (typeof prop == "object" && prop!==null && (prop.get)) {
                    Object.defineProperty(proto,name,prop);
                } else {
                    proto[name] = prop;
                }
            }
            return ctor;
        }

        function serialMixins(ctor,mixins) {
            var result = [];

            mixins.forEach(function(mixin){
                if (has(mixin,"__mixins__")) {
                     throw new Error("nested mixins");
                }
                var clss = [];
                while (mixin) {
                    clss.unshift(mixin);
                    mixin = mixin.superclass;
                }
                result = result.concat(clss);
            });

            result = uniq(result);

            result = result.filter(function(mixin){
                var cls = ctor;
                while (cls) {
                    if (mixin === cls) {
                        return false;
                    }
                    if (has(cls,"__mixins__")) {
                        var clsMixines = cls["__mixins__"];
                        for (var i=0; i<clsMixines.length;i++) {
                            if (clsMixines[i]===mixin) {
                                return false;
                            }
                        }
                    }
                    cls = cls.superclass;
                }
                return true;
            });

            if (result.length>0) {
                return result;
            } else {
                return false;
            }
        }

        function mergeMixins(ctor,mixins) {
            var newCtor =ctor;
            for (var i=0;i<mixins.length;i++) {
                var xtor = new Function();
                xtor.prototype = Object.create(newCtor.prototype);
                xtor.__proto__ = newCtor;
                xtor.superclass = null;
                mixin(xtor.prototype,mixins[i].prototype);
                xtor.prototype.__mixin__ = mixins[i];
                newCtor = xtor;
            }

            return newCtor;
        }

        function _constructor ()  {
            if (this._construct) {
                return this._construct.apply(this, arguments);
            } else  if (this.init) {
                return this.init.apply(this, arguments);
            }
        }

        return function createClass(props, parent, mixins,options) {
            if (isArray(parent)) {
                options = mixins;
                mixins = parent;
                parent = null;
            }
            parent = parent || Object;

            if (isDefined(mixins) && !isArray(mixins)) {
                options = mixins;
                mixins = false;
            }

            var innerParent = parent;

            if (mixins) {
                mixins = serialMixins(innerParent,mixins);
            }

            if (mixins) {
                innerParent = mergeMixins(innerParent,mixins);
            }

            var klassName = props.klassName || "",
                ctor = new Function(
                    "return function " + klassName + "() {" +
                    "var inst = this," +
                    " ctor = arguments.callee;" +
                    "if (!(inst instanceof ctor)) {" +
                    "inst = Object.create(ctor.prototype);" +
                    "}" +
                    "return ctor._constructor.apply(inst, arguments) || inst;" + 
                    "}"
                )();


            // Populate our constructed prototype object
            ctor.prototype = Object.create(innerParent.prototype);

            // Enforce the constructor to be what we expect
            ctor.prototype.constructor = ctor;
            ctor.superclass = parent;

            // And make this class extendable
            ctor.__proto__ = innerParent;


            if (!ctor._constructor) {
                ctor._constructor = _constructor;
            } 

            if (mixins) {
                ctor.__mixins__ = mixins;
            }

            if (!ctor.partial) {
                ctor.partial = function(props, options) {
                    return extendClass(this, props, options);
                };
            }
            if (!ctor.inherit) {
                ctor.inherit = function(props, mixins,options) {
                    return createClass(props, this, mixins,options);
                };
            }

            ctor.partial(props, options);

            return ctor;
        };
    }

    var createClass = f1();

    return createClass;
});
define('skylark-langx/ArrayStore',[
    "./klass"
],function(klass){
    var SimpleQueryEngine = function(query, options){
        // summary:
        //      Simple query engine that matches using filter functions, named filter
        //      functions or objects by name-value on a query object hash
        //
        // description:
        //      The SimpleQueryEngine provides a way of getting a QueryResults through
        //      the use of a simple object hash as a filter.  The hash will be used to
        //      match properties on data objects with the corresponding value given. In
        //      other words, only exact matches will be returned.
        //
        //      This function can be used as a template for more complex query engines;
        //      for example, an engine can be created that accepts an object hash that
        //      contains filtering functions, or a string that gets evaluated, etc.
        //
        //      When creating a new dojo.store, simply set the store's queryEngine
        //      field as a reference to this function.
        //
        // query: Object
        //      An object hash with fields that may match fields of items in the store.
        //      Values in the hash will be compared by normal == operator, but regular expressions
        //      or any object that provides a test() method are also supported and can be
        //      used to match strings by more complex expressions
        //      (and then the regex's or object's test() method will be used to match values).
        //
        // options: dojo/store/api/Store.QueryOptions?
        //      An object that contains optional information such as sort, start, and count.
        //
        // returns: Function
        //      A function that caches the passed query under the field "matches".  See any
        //      of the "query" methods on dojo.stores.
        //
        // example:
        //      Define a store with a reference to this engine, and set up a query method.
        //
        //  |   var myStore = function(options){
        //  |       //  ...more properties here
        //  |       this.queryEngine = SimpleQueryEngine;
        //  |       //  define our query method
        //  |       this.query = function(query, options){
        //  |           return QueryResults(this.queryEngine(query, options)(this.data));
        //  |       };
        //  |   };

        // create our matching query function
        switch(typeof query){
            default:
                throw new Error("Can not query with a " + typeof query);
            case "object": case "undefined":
                var queryObject = query;
                query = function(object){
                    for(var key in queryObject){
                        var required = queryObject[key];
                        if(required && required.test){
                            // an object can provide a test method, which makes it work with regex
                            if(!required.test(object[key], object)){
                                return false;
                            }
                        }else if(required != object[key]){
                            return false;
                        }
                    }
                    return true;
                };
                break;
            case "string":
                // named query
                if(!this[query]){
                    throw new Error("No filter function " + query + " was found in store");
                }
                query = this[query];
                // fall through
            case "function":
                // fall through
        }
        
        function filter(arr, callback, thisObject){
            // summary:
            //      Returns a new Array with those items from arr that match the
            //      condition implemented by callback.
            // arr: Array
            //      the array to iterate over.
            // callback: Function|String
            //      a function that is invoked with three arguments (item,
            //      index, array). The return of this function is expected to
            //      be a boolean which determines whether the passed-in item
            //      will be included in the returned array.
            // thisObject: Object?
            //      may be used to scope the call to callback
            // returns: Array
            // description:
            //      This function corresponds to the JavaScript 1.6 Array.filter() method, with one difference: when
            //      run over sparse arrays, this implementation passes the "holes" in the sparse array to
            //      the callback function with a value of undefined. JavaScript 1.6's filter skips the holes in the sparse array.
            //      For more details, see:
            //      https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
            // example:
            //  | // returns [2, 3, 4]
            //  | array.filter([1, 2, 3, 4], function(item){ return item>1; });

            // TODO: do we need "Ctr" here like in map()?
            var i = 0, l = arr && arr.length || 0, out = [], value;
            if(l && typeof arr == "string") arr = arr.split("");
            if(typeof callback == "string") callback = cache[callback] || buildFn(callback);
            if(thisObject){
                for(; i < l; ++i){
                    value = arr[i];
                    if(callback.call(thisObject, value, i, arr)){
                        out.push(value);
                    }
                }
            }else{
                for(; i < l; ++i){
                    value = arr[i];
                    if(callback(value, i, arr)){
                        out.push(value);
                    }
                }
            }
            return out; // Array
        }

        function execute(array){
            // execute the whole query, first we filter
            var results = filter(array, query);
            // next we sort
            var sortSet = options && options.sort;
            if(sortSet){
                results.sort(typeof sortSet == "function" ? sortSet : function(a, b){
                    for(var sort, i=0; sort = sortSet[i]; i++){
                        var aValue = a[sort.attribute];
                        var bValue = b[sort.attribute];
                        // valueOf enables proper comparison of dates
                        aValue = aValue != null ? aValue.valueOf() : aValue;
                        bValue = bValue != null ? bValue.valueOf() : bValue;
                        if (aValue != bValue){
                            // modified by lwf 2016/07/09
                            //return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
                            return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
                        }
                    }
                    return 0;
                });
            }
            // now we paginate
            if(options && (options.start || options.count)){
                var total = results.length;
                results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
                results.total = total;
            }
            return results;
        }
        execute.matches = query;
        return execute;
    };

    var QueryResults = function(results){
        // summary:
        //      A function that wraps the results of a store query with additional
        //      methods.
        // description:
        //      QueryResults is a basic wrapper that allows for array-like iteration
        //      over any kind of returned data from a query.  While the simplest store
        //      will return a plain array of data, other stores may return deferreds or
        //      promises; this wrapper makes sure that *all* results can be treated
        //      the same.
        //
        //      Additional methods include `forEach`, `filter` and `map`.
        // results: Array|dojo/promise/Promise
        //      The result set as an array, or a promise for an array.
        // returns:
        //      An array-like object that can be used for iterating over.
        // example:
        //      Query a store and iterate over the results.
        //
        //  |   store.query({ prime: true }).forEach(function(item){
        //  |       //  do something
        //  |   });

        if(!results){
            return results;
        }

        var isPromise = !!results.then;
        // if it is a promise it may be frozen
        if(isPromise){
            results = Object.delegate(results);
        }
        function addIterativeMethod(method){
            // Always add the iterative methods so a QueryResults is
            // returned whether the environment is ES3 or ES5
            results[method] = function(){
                var args = arguments;
                var result = Deferred.when(results, function(results){
                    //Array.prototype.unshift.call(args, results);
                    return QueryResults(Array.prototype[method].apply(results, args));
                });
                // forEach should only return the result of when()
                // when we're wrapping a promise
                if(method !== "forEach" || isPromise){
                    return result;
                }
            };
        }

        addIterativeMethod("forEach");
        addIterativeMethod("filter");
        addIterativeMethod("map");
        if(results.total == null){
            results.total = Deferred.when(results, function(results){
                return results.length;
            });
        }
        return results; // Object
    };

    var ArrayStore = klass({
        "klassName": "ArrayStore",

        "queryEngine": SimpleQueryEngine,
        
        "idProperty": "id",


        get: function(id){
            // summary:
            //      Retrieves an object by its identity
            // id: Number
            //      The identity to use to lookup the object
            // returns: Object
            //      The object in the store that matches the given id.
            return this.data[this.index[id]];
        },

        getIdentity: function(object){
            return object[this.idProperty];
        },

        put: function(object, options){
            var data = this.data,
                index = this.index,
                idProperty = this.idProperty;
            var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
            if(id in index){
                // object exists
                if(options && options.overwrite === false){
                    throw new Error("Object already exists");
                }
                // replace the entry in data
                data[index[id]] = object;
            }else{
                // add the new object
                index[id] = data.push(object) - 1;
            }
            return id;
        },

        add: function(object, options){
            (options = options || {}).overwrite = false;
            // call put with overwrite being false
            return this.put(object, options);
        },

        remove: function(id){
            // summary:
            //      Deletes an object by its identity
            // id: Number
            //      The identity to use to delete the object
            // returns: Boolean
            //      Returns true if an object was removed, falsy (undefined) if no object matched the id
            var index = this.index;
            var data = this.data;
            if(id in index){
                data.splice(index[id], 1);
                // now we have to reindex
                this.setData(data);
                return true;
            }
        },
        query: function(query, options){
            // summary:
            //      Queries the store for objects.
            // query: Object
            //      The query to use for retrieving objects from the store.
            // options: dojo/store/api/Store.QueryOptions?
            //      The optional arguments to apply to the resultset.
            // returns: dojo/store/api/Store.QueryResults
            //      The results of the query, extended with iterative methods.
            //
            // example:
            //      Given the following store:
            //
            //  |   var store = new Memory({
            //  |       data: [
            //  |           {id: 1, name: "one", prime: false },
            //  |           {id: 2, name: "two", even: true, prime: true},
            //  |           {id: 3, name: "three", prime: true},
            //  |           {id: 4, name: "four", even: true, prime: false},
            //  |           {id: 5, name: "five", prime: true}
            //  |       ]
            //  |   });
            //
            //  ...find all items where "prime" is true:
            //
            //  |   var results = store.query({ prime: true });
            //
            //  ...or find all items where "even" is true:
            //
            //  |   var results = store.query({ even: true });
            return QueryResults(this.queryEngine(query, options)(this.data));
        },

        setData: function(data){
            // summary:
            //      Sets the given data as the source for this store, and indexes it
            // data: Object[]
            //      An array of objects to use as the source of data.
            if(data.items){
                // just for convenience with the data format IFRS expects
                this.idProperty = data.identifier || this.idProperty;
                data = this.data = data.items;
            }else{
                this.data = data;
            }
            this.index = {};
            for(var i = 0, l = data.length; i < l; i++){
                this.index[data[i][this.idProperty]] = i;
            }
        },

        init: function(options) {
            for(var i in options){
                this[i] = options[i];
            }
            this.setData(this.data || []);
        }

    });

	return ArrayStore;
});
define('skylark-langx/aspect',[
],function(){

  var undefined, nextId = 0;
    function advise(dispatcher, type, advice, receiveArguments){
        var previous = dispatcher[type];
        var around = type == "around";
        var signal;
        if(around){
            var advised = advice(function(){
                return previous.advice(this, arguments);
            });
            signal = {
                remove: function(){
                    if(advised){
                        advised = dispatcher = advice = null;
                    }
                },
                advice: function(target, args){
                    return advised ?
                        advised.apply(target, args) :  // called the advised function
                        previous.advice(target, args); // cancelled, skip to next one
                }
            };
        }else{
            // create the remove handler
            signal = {
                remove: function(){
                    if(signal.advice){
                        var previous = signal.previous;
                        var next = signal.next;
                        if(!next && !previous){
                            delete dispatcher[type];
                        }else{
                            if(previous){
                                previous.next = next;
                            }else{
                                dispatcher[type] = next;
                            }
                            if(next){
                                next.previous = previous;
                            }
                        }

                        // remove the advice to signal that this signal has been removed
                        dispatcher = advice = signal.advice = null;
                    }
                },
                id: nextId++,
                advice: advice,
                receiveArguments: receiveArguments
            };
        }
        if(previous && !around){
            if(type == "after"){
                // add the listener to the end of the list
                // note that we had to change this loop a little bit to workaround a bizarre IE10 JIT bug
                while(previous.next && (previous = previous.next)){}
                previous.next = signal;
                signal.previous = previous;
            }else if(type == "before"){
                // add to beginning
                dispatcher[type] = signal;
                signal.next = previous;
                previous.previous = signal;
            }
        }else{
            // around or first one just replaces
            dispatcher[type] = signal;
        }
        return signal;
    }
    function aspect(type){
        return function(target, methodName, advice, receiveArguments){
            var existing = target[methodName], dispatcher;
            if(!existing || existing.target != target){
                // no dispatcher in place
                target[methodName] = dispatcher = function(){
                    var executionId = nextId;
                    // before advice
                    var args = arguments;
                    var before = dispatcher.before;
                    while(before){
                        args = before.advice.apply(this, args) || args;
                        before = before.next;
                    }
                    // around advice
                    if(dispatcher.around){
                        var results = dispatcher.around.advice(this, args);
                    }
                    // after advice
                    var after = dispatcher.after;
                    while(after && after.id < executionId){
                        if(after.receiveArguments){
                            var newResults = after.advice.apply(this, args);
                            // change the return value only if a new value was returned
                            results = newResults === undefined ? results : newResults;
                        }else{
                            results = after.advice.call(this, results, args);
                        }
                        after = after.next;
                    }
                    return results;
                };
                if(existing){
                    dispatcher.around = {advice: function(target, args){
                        return existing.apply(target, args);
                    }};
                }
                dispatcher.target = target;
            }
            var results = advise((dispatcher || existing), type, advice, receiveArguments);
            advice = null;
            return results;
        };
    }

    return {
        after: aspect("after"),
 
        around: aspect("around"),
        
        before: aspect("before")
    };
});
define('skylark-langx/funcs',[
    "./objects",
	"./types"
],function(objects,types){
	var mixin = objects.mixin,
        slice = Array.prototype.slice,
        isFunction = types.isFunction,
        isString = types.isString;

    function defer(fn) {
        if (requestAnimationFrame) {
            requestAnimationFrame(fn);
        } else {
            setTimeoutout(fn);
        }
        return this;
    }

    function noop() {
    }

    function proxy(fn, context) {
        var args = (2 in arguments) && slice.call(arguments, 2)
        if (isFunction(fn)) {
            var proxyFn = function() {
                return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
            }
            return proxyFn;
        } else if (isString(context)) {
            if (args) {
                args.unshift(fn[context], fn)
                return proxy.apply(null, args)
            } else {
                return proxy(fn[context], fn);
            }
        } else {
            throw new TypeError("expected function");
        }
    }

    function debounce(fn, wait) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                fn.apply(context, args);
            };
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
   
    var delegate = (function() {
        // boodman/crockford delegation w/ cornford optimization
        function TMP() {}
        return function(obj, props) {
            TMP.prototype = obj;
            var tmp = new TMP();
            TMP.prototype = null;
            if (props) {
                mixin(tmp, props);
            }
            return tmp; // Object
        };
    })();


    return {
        debounce: debounce,

        delegate: delegate,

        defer: defer,

        noop : noop,

        proxy: proxy,

        returnTrue: function() {
            return true;
        },

        returnFalse: function() {
            return false;
        }
    };
});
define('skylark-langx/Deferred',[
    "./arrays",
	"./funcs",
    "./objects"
],function(arrays,funcs,objects){
    "use strict";
    
    var  PGLISTENERS = Symbol ? Symbol() : '__pglisteners';

    var slice = Array.prototype.slice,
        proxy = funcs.proxy,
        makeArray = arrays.makeArray,
        result = objects.result,
        mixin = objects.mixin;

    mixin(Promise.prototype,{
        always: function(handler) {
            //this.done(handler);
            //this.fail(handler);
            this.then(handler,handler);
            return this;
        },
        done : function(handler) {
            this.then(handler);
            return this;
        },
        fail : function(handler) { 
            //return mixin(Promise.prototype.catch.call(this,handler),added);
            //return this.then(null,handler);
            this.catch(handler);
            return this;
        }
    });


    var Deferred = function() {
        var self = this,
            p = this.promise = new Promise(function(resolve, reject) {
                self._resolve = resolve;
                self._reject = reject;
            });

        wrapPromise(p,self);

        this[PGLISTENERS] = [];

        //this.resolve = Deferred.prototype.resolve.bind(this);
        //this.reject = Deferred.prototype.reject.bind(this);
        //this.progress = Deferred.prototype.progress.bind(this);

    };

    function wrapPromise(p,d) {
        var   added = {
                state : function() {
                    if (d.isResolved()) {
                        return 'resolved';
                    }
                    if (d.isRejected()) {
                        return 'rejected';
                    }
                    return 'pending';
                },
                then : function(onResolved,onRejected,onProgress) {
                    if (onProgress) {
                        this.progress(onProgress);
                    }
                    return mixin(Promise.prototype.then.call(this,
                            onResolved && function(args) {
                                if (args && args.__ctx__ !== undefined) {
                                    return onResolved.apply(args.__ctx__,args);
                                } else {
                                    return onResolved(args);
                                }
                            },
                            onRejected && function(args){
                                if (args && args.__ctx__ !== undefined) {
                                    return onRejected.apply(args.__ctx__,args);
                                } else {
                                    return onRejected(args);
                                }
                            }),added);
                },
                progress : function(handler) {
                    d[PGLISTENERS].push(handler);
                    return this;
                }

            };

        added.pipe = added.then;
        return mixin(p,added);

    }

    Deferred.prototype.resolve = function(value) {
        var args = slice.call(arguments);
        return this.resolveWith(null,args);
    };

    Deferred.prototype.resolveWith = function(context,args) {
        args = args ? makeArray(args) : []; 
        args.__ctx__ = context;
        this._resolve(args);
        this._resolved = true;
        return this;
    };

    Deferred.prototype.progress = function(value) {
        try {
          return this[PGLISTENERS].forEach(function (listener) {
            return listener(value);
          });
        } catch (error) {
          this.reject(error);
        }
        return this;
    };

    Deferred.prototype.reject = function(reason) {
        var args = slice.call(arguments);
        return this.rejectWith(null,args);
    };

    Deferred.prototype.rejectWith = function(context,args) {
        args = args ? makeArray(args) : []; 
        args.__ctx__ = context;
        this._reject(args);
        this._rejected = true;
        return this;
    };

    Deferred.prototype.isResolved = function() {
        return !!this._resolved;
    };

    Deferred.prototype.isRejected = function() {
        return !!this._rejected;
    };

    Deferred.prototype.then = function(callback, errback, progback) {
        var p = result(this,"promise");
        return p.then(callback, errback, progback);
    };

    Deferred.prototype.done  = Deferred.prototype.then;

    Deferred.all = function(array) {
        return wrapPromise(Promise.all(array));
    };

    Deferred.first = function(array) {
        return wrapPromise(Promise.race(array));
    };


    Deferred.when = function(valueOrPromise, callback, errback, progback) {
        var receivedPromise = valueOrPromise && typeof valueOrPromise.then === "function";
        var nativePromise = receivedPromise && valueOrPromise instanceof Promise;

        if (!receivedPromise) {
            if (arguments.length > 1) {
                return callback ? callback(valueOrPromise) : valueOrPromise;
            } else {
                return new Deferred().resolve(valueOrPromise);
            }
        } else if (!nativePromise) {
            var deferred = new Deferred(valueOrPromise.cancel);
            valueOrPromise.then(proxy(deferred.resolve,deferred), proxy(deferred.reject,deferred), deferred.progress);
            valueOrPromise = deferred.promise;
        }

        if (callback || errback || progback) {
            return valueOrPromise.then(callback, errback, progback);
        }
        return valueOrPromise;
    };

    Deferred.reject = function(err) {
        var d = new Deferred();
        d.reject(err);
        return d.promise;
    };

    Deferred.resolve = function(data) {
        var d = new Deferred();
        d.resolve.apply(d,arguments);
        return d.promise;
    };

    Deferred.immediate = Deferred.resolve;

    return Deferred;
});
define('skylark-langx/async',[
    "./Deferred",
    "./arrays"
],function(Deferred,arrays){
    var each = arrays.each;
    
    var async = {
        parallel : function(arr,args,ctx) {
            var rets = [];
            ctx = ctx || null;
            args = args || [];

            each(arr,function(i,func){
                rets.push(func.apply(ctx,args));
            });

            return Deferred.all(rets);
        },

        series : function(arr,args,ctx) {
            var rets = [],
                d = new Deferred(),
                p = d.promise;

            ctx = ctx || null;
            args = args || [];

            d.resolve();
            each(arr,function(i,func){
                p = p.then(function(){
                    return func.apply(ctx,args);
                });
                rets.push(p);
            });

            return Deferred.all(rets);
        },

        waterful : function(arr,args,ctx) {
            var d = new Deferred(),
                p = d.promise;

            ctx = ctx || null;
            args = args || [];

            d.resolveWith(ctx,args);

            each(arr,function(i,func){
                p = p.then(func);
            });
            return p;
        }
    };

	return async;	
});
define('skylark-langx/Evented',[
    "./klass",
    "./objects",
	"./types"
],function(klass,objects,types){
	var slice = Array.prototype.slice,
        isDefined = types.isDefined,
        isPlainObject = types.isPlainObject,
		isFunction = types.isFunction,
		isString = types.isString,
		isEmptyObject = types.isEmptyObject,
		mixin = objects.mixin;

    var Evented = klass({
        on: function(events, selector, data, callback, ctx, /*used internally*/ one) {
            var self = this,
                _hub = this._hub || (this._hub = {});

            if (isPlainObject(events)) {
                ctx = callback;
                each(events, function(type, fn) {
                    self.on(type, selector, data, fn, ctx, one);
                });
                return this;
            }

            if (!isString(selector) && !isFunction(callback)) {
                ctx = callback;
                callback = data;
                data = selector;
                selector = undefined;
            }

            if (isFunction(data)) {
                ctx = callback;
                callback = data;
                data = null;
            }

            if (isString(events)) {
                events = events.split(/\s/)
            }

            events.forEach(function(name) {
                (_hub[name] || (_hub[name] = [])).push({
                    fn: callback,
                    selector: selector,
                    data: data,
                    ctx: ctx,
                    one: one
                });
            });

            return this;
        },

        one: function(events, selector, data, callback, ctx) {
            return this.on(events, selector, data, callback, ctx, 1);
        },

        trigger: function(e /*,argument list*/ ) {
            if (!this._hub) {
                return this;
            }

            var self = this;

            if (isString(e)) {
                e = new CustomEvent(e);
            }

            Object.defineProperty(e,"target",{
                value : this
            });

            var args = slice.call(arguments, 1);
            if (isDefined(args)) {
                args = [e].concat(args);
            } else {
                args = [e];
            }
            [e.type || e.name, "all"].forEach(function(eventName) {
                var listeners = self._hub[eventName];
                if (!listeners) {
                    return;
                }

                var len = listeners.length,
                    reCompact = false;

                for (var i = 0; i < len; i++) {
                    var listener = listeners[i];
                    if (e.data) {
                        if (listener.data) {
                            e.data = mixin({}, listener.data, e.data);
                        }
                    } else {
                        e.data = listener.data || null;
                    }
                    listener.fn.apply(listener.ctx, args);
                    if (listener.one) {
                        listeners[i] = null;
                        reCompact = true;
                    }
                }

                if (reCompact) {
                    self._hub[eventName] = compact(listeners);
                }

            });
            return this;
        },

        listened: function(event) {
            var evtArr = ((this._hub || (this._events = {}))[event] || []);
            return evtArr.length > 0;
        },

        listenTo: function(obj, event, callback, /*used internally*/ one) {
            if (!obj) {
                return this;
            }

            // Bind callbacks on obj,
            if (isString(callback)) {
                callback = this[callback];
            }

            if (one) {
                obj.one(event, callback, this);
            } else {
                obj.on(event, callback, this);
            }

            //keep track of them on listening.
            var listeningTo = this._listeningTo || (this._listeningTo = []),
                listening;

            for (var i = 0; i < listeningTo.length; i++) {
                if (listeningTo[i].obj == obj) {
                    listening = listeningTo[i];
                    break;
                }
            }
            if (!listening) {
                listeningTo.push(
                    listening = {
                        obj: obj,
                        events: {}
                    }
                );
            }
            var listeningEvents = listening.events,
                listeningEvent = listeningEvents[event] = listeningEvents[event] || [];
            if (listeningEvent.indexOf(callback) == -1) {
                listeningEvent.push(callback);
            }

            return this;
        },

        listenToOnce: function(obj, event, callback) {
            return this.listenTo(obj, event, callback, 1);
        },

        off: function(events, callback) {
            var _hub = this._hub || (this._hub = {});
            if (isString(events)) {
                events = events.split(/\s/)
            }

            events.forEach(function(name) {
                var evts = _hub[name];
                var liveEvents = [];

                if (evts && callback) {
                    for (var i = 0, len = evts.length; i < len; i++) {
                        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
                            liveEvents.push(evts[i]);
                    }
                }

                if (liveEvents.length) {
                    _hub[name] = liveEvents;
                } else {
                    delete _hub[name];
                }
            });

            return this;
        },
        unlistenTo: function(obj, event, callback) {
            var listeningTo = this._listeningTo;
            if (!listeningTo) {
                return this;
            }
            for (var i = 0; i < listeningTo.length; i++) {
                var listening = listeningTo[i];

                if (obj && obj != listening.obj) {
                    continue;
                }

                var listeningEvents = listening.events;
                for (var eventName in listeningEvents) {
                    if (event && event != eventName) {
                        continue;
                    }

                    var listeningEvent = listeningEvents[eventName];

                    for (var j = 0; j < listeningEvent.length; j++) {
                        if (!callback || callback == listeningEvent[i]) {
                            listening.obj.off(eventName, listeningEvent[i], this);
                            listeningEvent[i] = null;
                        }
                    }

                    listeningEvent = listeningEvents[eventName] = compact(listeningEvent);

                    if (isEmptyObject(listeningEvent)) {
                        listeningEvents[eventName] = null;
                    }

                }

                if (isEmptyObject(listeningEvents)) {
                    listeningTo[i] = null;
                }
            }

            listeningTo = this._listeningTo = compact(listeningTo);
            if (isEmptyObject(listeningTo)) {
                this._listeningTo = null;
            }

            return this;
        }
    });

	return Evented;

});
define('skylark-langx/strings',[
],function(){

     /*
     * Converts camel case into dashes.
     * @param {String} str
     * @return {String}
     * @exapmle marginTop -> margin-top
     */
    function dasherize(str) {
        return str.replace(/::/g, '/')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .replace(/_/g, '-')
            .toLowerCase();
    }

    function deserializeValue(value) {
        try {
            return value ?
                value == "true" ||
                (value == "false" ? false :
                    value == "null" ? null :
                    +value + "" == value ? +value :
                    /^[\[\{]/.test(value) ? JSON.parse(value) :
                    value) : value;
        } catch (e) {
            return value;
        }
    }

    function trim(str) {
        return str == null ? "" : String.prototype.trim.call(str);
    }
    function substitute( /*String*/ template,
        /*Object|Array*/
        map,
        /*Function?*/
        transform,
        /*Object?*/
        thisObject) {
        // summary:
        //    Performs parameterized substitutions on a string. Throws an
        //    exception if any parameter is unmatched.
        // template:
        //    a string with expressions in the form `${key}` to be replaced or
        //    `${key:format}` which specifies a format function. keys are case-sensitive.
        // map:
        //    hash to search for substitutions
        // transform:
        //    a function to process all parameters before substitution takes


        thisObject = thisObject || window;
        transform = transform ?
            proxy(thisObject, transform) : function(v) {
                return v;
            };

        function getObject(key, map) {
            if (key.match(/\./)) {
                var retVal,
                    getValue = function(keys, obj) {
                        var _k = keys.pop();
                        if (_k) {
                            if (!obj[_k]) return null;
                            return getValue(keys, retVal = obj[_k]);
                        } else {
                            return retVal;
                        }
                    };
                return getValue(key.split(".").reverse(), map);
            } else {
                return map[key];
            }
        }

        return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g,
            function(match, key, format) {
                var value = getObject(key, map);
                if (format) {
                    value = getObject(format, thisObject).call(thisObject, value, key);
                }
                return transform(value, key).toString();
            }); // String
    }

	return {
        camelCase: function(str) {
            return str.replace(/-([\da-z])/g, function(a) {
                return a.toUpperCase().replace('-', '');
            });
        },


        dasherize: dasherize,

        deserializeValue: deserializeValue,

        lowerFirst: function(str) {
            return str.charAt(0).toLowerCase() + str.slice(1);
        },

        serializeValue: function(value) {
            return JSON.stringify(value)
        },


        substitute: substitute,

        trim: trim,

        upperFirst: function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
	} ; 

});
define('skylark-langx/Xhr',[
    "./arrays",
    "./Deferred",
    "./Evented",
    "./objects",
    "./funcs",
    "./types"
],function(arrays,Deferred,Evented,objects,funcs,types){
    var each = arrays.each,
        mixin = objects.mixin,
        noop = funcs.noop,
        isArray = types.isArray,
        isFunction = types.isFunction,
        isPlainObject = types.isPlainObject,
        type = types.type;
 
     var getAbsoluteUrl = (function() {
        var a;

        return function(url) {
            if (!a) a = document.createElement('a');
            a.href = url;

            return a.href;
        };
    })();
   
    var Xhr = (function(){
        var jsonpID = 0,
            key,
            name,
            rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            scriptTypeRE = /^(?:text|application)\/javascript/i,
            xmlTypeRE = /^(?:text|application)\/xml/i,
            jsonType = 'application/json',
            htmlType = 'text/html',
            blankRE = /^\s*$/;

        var XhrDefaultOptions = {
            async: true,

            // Default type of request
            type: 'GET',
            // Callback that is executed before request
            beforeSend: noop,
            // Callback that is executed if the request succeeds
            success: noop,
            // Callback that is executed the the server drops error
            error: noop,
            // Callback that is executed on request complete (both: error and success)
            complete: noop,
            // The context for the callbacks
            context: null,
            // Whether to trigger "global" Ajax events
            global: true,

            // MIME types mapping
            // IIS returns Javascript as "application/x-javascript"
            accepts: {
                script: 'text/javascript, application/javascript, application/x-javascript',
                json: 'application/json',
                xml: 'application/xml, text/xml',
                html: 'text/html',
                text: 'text/plain'
            },
            // Whether the request is to another domain
            crossDomain: false,
            // Default timeout
            timeout: 0,
            // Whether data should be serialized to string
            processData: true,
            // Whether the browser should be allowed to cache GET responses
            cache: true,

            xhrFields : {
                withCredentials : true
            }
        };

        function mimeToDataType(mime) {
            if (mime) {
                mime = mime.split(';', 2)[0];
            }
            if (mime) {
                if (mime == htmlType) {
                    return "html";
                } else if (mime == jsonType) {
                    return "json";
                } else if (scriptTypeRE.test(mime)) {
                    return "script";
                } else if (xmlTypeRE.test(mime)) {
                    return "xml";
                }
            }
            return "text";
        }

        function appendQuery(url, query) {
            if (query == '') return url
            return (url + '&' + query).replace(/[&?]{1,2}/, '?')
        }

        // serialize payload and append it to the URL for GET requests
        function serializeData(options) {
            options.data = options.data || options.query;
            if (options.processData && options.data && type(options.data) != "string") {
                options.data = param(options.data, options.traditional);
            }
            if (options.data && (!options.type || options.type.toUpperCase() == 'GET')) {
                options.url = appendQuery(options.url, options.data);
                options.data = undefined;
            }
        }

        function serialize(params, obj, traditional, scope) {
            var t, array = isArray(obj),
                hash = isPlainObject(obj)
            each(obj, function(key, value) {
                t =type(value);
                if (scope) key = traditional ? scope :
                    scope + '[' + (hash || t == 'object' || t == 'array' ? key : '') + ']'
                // handle data in serializeArray() format
                if (!scope && array) params.add(value.name, value.value)
                // recurse into nested objects
                else if (t == "array" || (!traditional && t == "object"))
                    serialize(params, value, traditional, key)
                else params.add(key, value)
            })
        }

        var param = function(obj, traditional) {
            var params = []
            params.add = function(key, value) {
                if (isFunction(value)) value = value()
                if (value == null) value = ""
                this.push(escape(key) + '=' + escape(value))
            }
            serialize(params, obj, traditional)
            return params.join('&').replace(/%20/g, '+')
        };

        var Xhr = Evented.inherit({
            klassName : "Xhr",

            _request  : function(args) {
                var _ = this._,
                    self = this,
                    options = mixin({},XhrDefaultOptions,_.options,args),
                    xhr = _.xhr = new XMLHttpRequest();

                serializeData(options)

                var dataType = options.dataType || options.handleAs,
                    mime = options.mimeType || options.accepts[dataType],
                    headers = options.headers,
                    xhrFields = options.xhrFields,
                    isFormData = options.data && options.data instanceof FormData,
                    basicAuthorizationToken = options.basicAuthorizationToken,
                    type = options.type,
                    url = options.url,
                    async = options.async,
                    user = options.user , 
                    password = options.password,
                    deferred = new Deferred(),
                    contentType = isFormData ? false : 'application/x-www-form-urlencoded';

                if (xhrFields) {
                    for (name in xhrFields) {
                        xhr[name] = xhrFields[name];
                    }
                }

                if (mime && mime.indexOf(',') > -1) {
                    mime = mime.split(',', 2)[0];
                }
                if (mime && xhr.overrideMimeType) {
                    xhr.overrideMimeType(mime);
                }

                //if (dataType) {
                //    xhr.responseType = dataType;
                //}

                var finish = function() {
                    xhr.onloadend = noop;
                    xhr.onabort = noop;
                    xhr.onprogress = noop;
                    xhr.ontimeout = noop;
                    xhr = null;
                }
                var onloadend = function() {
                    var result, error = false
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && getAbsoluteUrl(url).startsWith('file:'))) {
                        dataType = dataType || mimeToDataType(options.mimeType || xhr.getResponseHeader('content-type'));

                        result = xhr.responseText;
                        try {
                            if (dataType == 'script') {
                                eval(result);
                            } else if (dataType == 'xml') {
                                result = xhr.responseXML;
                            } else if (dataType == 'json') {
                                result = blankRE.test(result) ? null : JSON.parse(result);
                            } else if (dataType == "blob") {
                                result = Blob([xhrObj.response]);
                            } else if (dataType == "arraybuffer") {
                                result = xhr.reponse;
                            }
                        } catch (e) { 
                            error = e;
                        }

                        if (error) {
                            deferred.reject(error,xhr.status,xhr);
                        } else {
                            deferred.resolve(result,xhr.status,xhr);
                        }
                    } else {
                        deferred.reject(new Error(xhr.statusText),xhr.status,xhr);
                    }
                    finish();
                };

                var onabort = function() {
                    if (deferred) {
                        deferred.reject(new Error("abort"),xhr.status,xhr);
                    }
                    finish();                 
                }
 
                var ontimeout = function() {
                    if (deferred) {
                        deferred.reject(new Error("timeout"),xhr.status,xhr);
                    }
                    finish();                 
                }

                var onprogress = function(evt) {
                    if (deferred) {
                        deferred.progress(evt,xhr.status,xhr);
                    }
                }

                xhr.onloadend = onloadend;
                xhr.onabort = onabort;
                xhr.ontimeout = ontimeout;
                xhr.onprogress = onprogress;

                xhr.open(type, url, async, user, password);
               
                if (headers) {
                    for ( var key in headers) {
                        var value = headers[key];
 
                        if(key.toLowerCase() === 'content-type'){
                            contentType = headers[hdr];
                        } else {
                           xhr.setRequestHeader(key, value);
                        }
                    }
                }   

                if  (contentType && contentType !== false){
                    xhr.setRequestHeader('Content-Type', contentType);
                }

                if(!headers || !('X-Requested-With' in headers)){
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                }


                //If basicAuthorizationToken is defined set its value into "Authorization" header
                if (basicAuthorizationToken) {
                    xhr.setRequestHeader("Authorization", basicAuthorizationToken);
                }

                xhr.send(options.data ? options.data : null);

                return deferred.promise;

            },

            "abort": function() {
                var _ = this._,
                    xhr = _.xhr;

                if (xhr) {
                    xhr.abort();
                }    
            },


            "request": function(args) {
                return this._request(args);
            },

            get : function(args) {
                args = args || {};
                args.type = "GET";
                return this._request(args);
            },

            post : function(args) {
                args = args || {};
                args.type = "POST";
                return this._request(args);
            },

            patch : function(args) {
                args = args || {};
                args.type = "PATCH";
                return this._request(args);
            },

            put : function(args) {
                args = args || {};
                args.type = "PUT";
                return this._request(args);
            },

            del : function(args) {
                args = args || {};
                args.type = "DELETE";
                return this._request(args);
            },

            "init": function(options) {
                this._ = {
                    options : options || {}
                };
            }
        });

        ["request","get","post","put","del","patch"].forEach(function(name){
            Xhr[name] = function(url,args) {
                var xhr = new Xhr({"url" : url});
                return xhr[name](args);
            };
        });

        Xhr.defaultOptions = XhrDefaultOptions;
        Xhr.param = param;

        return Xhr;
    })();

	return Xhr;	
});
define('skylark-langx/Restful',[
    "./Evented",
    "./objects",
    "./strings",
    "./Xhr"
],function(Evented,objects,strings,Xhr){
    var mixin = objects.mixin,
        substitute = strings.substitute;

    var Restful = Evented.inherit({
        "klassName" : "Restful",

        "idAttribute": "id",
        
        getBaseUrl : function(args) {
            //$$baseEndpoint : "/files/${fileId}/comments",
            var baseEndpoint = substitute(this.baseEndpoint,args),
                baseUrl = this.server + this.basePath + baseEndpoint;
            if (args[this.idAttribute]!==undefined) {
                baseUrl = baseUrl + "/" + args[this.idAttribute]; 
            }
            return baseUrl;
        },
        _head : function(args) {
            //get resource metadata .
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
        },
        _get : function(args) {
            //get resource ,one or list .
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, null if list
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
            return Xhr.get(this.getBaseUrl(args),args);
        },
        _post  : function(args,verb) {
            //create or move resource .
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "data" : body // the own data,required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
            //verb : the verb ,ex: copy,touch,trash,untrash,watch
            var url = this.getBaseUrl(args);
            if (verb) {
                url = url + "/" + verb;
            }
            return Xhr.post(url, args);
        },

        _put  : function(args,verb) {
            //update resource .
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "data" : body // the own data,required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
            //verb : the verb ,ex: copy,touch,trash,untrash,watch
            var url = this.getBaseUrl(args);
            if (verb) {
                url = url + "/" + verb;
            }
            return Xhr.put(url, args);
        },

        _delete : function(args) {
            //delete resource . 
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}         

            // HTTP request : DELETE http://center.utilhub.com/registry/v1/apps/{appid}
            var url = this.getBaseUrl(args);
            return Xhr.del(url);
        },

        _patch : function(args){
            //update resource metadata. 
            //args : id and other info for the resource ,ex
            //{
            //  "id" : 234,  // the own id, required
            //  "data" : body // the own data,required
            //  "fileId"   : 2 // the parent resource id, option by resource
            //}
            var url = this.getBaseUrl(args);
            return Xhr.patch(url, args);
        },
        query: function(params) {
            
            return this._post(params);
        },

        retrieve: function(params) {
            return this._get(params);
        },

        create: function(params) {
            return this._post(params);
        },

        update: function(params) {
            return this._put(params);
        },

        delete: function(params) {
            // HTTP request : DELETE http://center.utilhub.com/registry/v1/apps/{appid}
            return this._delete(params);
        },

        patch: function(params) {
           // HTTP request : PATCH http://center.utilhub.com/registry/v1/apps/{appid}
            return this._patch(params);
        },
        init: function(params) {
            mixin(this,params);
 //           this._xhr = XHRx();
       }
    });

    return Restful;
});
define('skylark-langx/Stateful',[
	"./Evented"
],function(Evented){
    var Stateful = Evented.inherit({
        init : function(attributes, options) {
            var attrs = attributes || {};
            options || (options = {});
            this.cid = uniqueId(this.cidPrefix);
            this.attributes = {};
            if (options.collection) this.collection = options.collection;
            if (options.parse) attrs = this.parse(attrs, options) || {};
            var defaults = result(this, 'defaults');
            attrs = mixin({}, defaults, attrs);
            this.set(attrs, options);
            this.changed = {};
        },

        // A hash of attributes whose current and previous value differ.
        changed: null,

        // The value returned during the last failed validation.
        validationError: null,

        // The default name for the JSON `id` attribute is `"id"`. MongoDB and
        // CouchDB users may want to set this to `"_id"`.
        idAttribute: 'id',

        // The prefix is used to create the client id which is used to identify models locally.
        // You may want to override this if you're experiencing name clashes with model ids.
        cidPrefix: 'c',


        // Return a copy of the model's `attributes` object.
        toJSON: function(options) {
          return clone(this.attributes);
        },


        // Get the value of an attribute.
        get: function(attr) {
          return this.attributes[attr];
        },

        // Returns `true` if the attribute contains a value that is not null
        // or undefined.
        has: function(attr) {
          return this.get(attr) != null;
        },

        // Set a hash of model attributes on the object, firing `"change"`. This is
        // the core primitive operation of a model, updating the data and notifying
        // anyone who needs to know about the change in state. The heart of the beast.
        set: function(key, val, options) {
          if (key == null) return this;

          // Handle both `"key", value` and `{key: value}` -style arguments.
          var attrs;
          if (typeof key === 'object') {
            attrs = key;
            options = val;
          } else {
            (attrs = {})[key] = val;
          }

          options || (options = {});

          // Run validation.
          if (!this._validate(attrs, options)) return false;

          // Extract attributes and options.
          var unset      = options.unset;
          var silent     = options.silent;
          var changes    = [];
          var changing   = this._changing;
          this._changing = true;

          if (!changing) {
            this._previousAttributes = clone(this.attributes);
            this.changed = {};
          }

          var current = this.attributes;
          var changed = this.changed;
          var prev    = this._previousAttributes;

          // For each `set` attribute, update or delete the current value.
          for (var attr in attrs) {
            val = attrs[attr];
            if (!isEqual(current[attr], val)) changes.push(attr);
            if (!isEqual(prev[attr], val)) {
              changed[attr] = val;
            } else {
              delete changed[attr];
            }
            unset ? delete current[attr] : current[attr] = val;
          }

          // Update the `id`.
          if (this.idAttribute in attrs) this.id = this.get(this.idAttribute);

          // Trigger all relevant attribute changes.
          if (!silent) {
            if (changes.length) this._pending = options;
            for (var i = 0; i < changes.length; i++) {
              this.trigger('change:' + changes[i], this, current[changes[i]], options);
            }
          }

          // You might be wondering why there's a `while` loop here. Changes can
          // be recursively nested within `"change"` events.
          if (changing) return this;
          if (!silent) {
            while (this._pending) {
              options = this._pending;
              this._pending = false;
              this.trigger('change', this, options);
            }
          }
          this._pending = false;
          this._changing = false;
          return this;
        },

        // Remove an attribute from the model, firing `"change"`. `unset` is a noop
        // if the attribute doesn't exist.
        unset: function(attr, options) {
          return this.set(attr, void 0, mixin({}, options, {unset: true}));
        },

        // Clear all attributes on the model, firing `"change"`.
        clear: function(options) {
          var attrs = {};
          for (var key in this.attributes) attrs[key] = void 0;
          return this.set(attrs, mixin({}, options, {unset: true}));
        },

        // Determine if the model has changed since the last `"change"` event.
        // If you specify an attribute name, determine if that attribute has changed.
        hasChanged: function(attr) {
          if (attr == null) return !isEmptyObject(this.changed);
          return this.changed[attr] !== undefined;
        },

        // Return an object containing all the attributes that have changed, or
        // false if there are no changed attributes. Useful for determining what
        // parts of a view need to be updated and/or what attributes need to be
        // persisted to the server. Unset attributes will be set to undefined.
        // You can also pass an attributes object to diff against the model,
        // determining if there *would be* a change.
        changedAttributes: function(diff) {
          if (!diff) return this.hasChanged() ? clone(this.changed) : false;
          var old = this._changing ? this._previousAttributes : this.attributes;
          var changed = {};
          for (var attr in diff) {
            var val = diff[attr];
            if (isEqual(old[attr], val)) continue;
            changed[attr] = val;
          }
          return !isEmptyObject(changed) ? changed : false;
        },

        // Get the previous value of an attribute, recorded at the time the last
        // `"change"` event was fired.
        previous: function(attr) {
          if (attr == null || !this._previousAttributes) return null;
          return this._previousAttributes[attr];
        },

        // Get all of the attributes of the model at the time of the previous
        // `"change"` event.
        previousAttributes: function() {
          return clone(this._previousAttributes);
        },

        // Create a new model with identical attributes to this one.
        clone: function() {
          return new this.constructor(this.attributes);
        },

        // A model is new if it has never been saved to the server, and lacks an id.
        isNew: function() {
          return !this.has(this.idAttribute);
        },

        // Check if the model is currently in a valid state.
        isValid: function(options) {
          return this._validate({}, mixin({}, options, {validate: true}));
        },

        // Run validation against the next complete set of model attributes,
        // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
        _validate: function(attrs, options) {
          if (!options.validate || !this.validate) return true;
          attrs = mixin({}, this.attributes, attrs);
          var error = this.validationError = this.validate(attrs, options) || null;
          if (!error) return true;
          this.trigger('invalid', this, error, mixin(options, {validationError: error}));
          return false;
        }
    });

	return Stateful;
});
define('skylark-langx/langx',[
    "./skylark",
    "./arrays",
    "./ArrayStore",
    "./aspect",
    "./async",
    "./Deferred",
    "./Evented",
    "./funcs",
    "./klass",
    "./objects",
    "./Restful",
    "./Stateful",
    "./strings",
    "./types",
    "./Xhr"
], function(skylark,arrays,ArrayStore,aspect,async,Deferred,Evented,funcs,klass,objects,Restful,Stateful,strings,types,Xhr) {
    "use strict";
    var toString = {}.toString,
        concat = Array.prototype.concat,
        indexOf = Array.prototype.indexOf,
        slice = Array.prototype.slice,
        filter = Array.prototype.filter,
        mixin = objects.mixin,
        safeMixin = objects.safeMixin,
        isFunction = types.isFunction;


    function createEvent(type, props) {
        var e = new CustomEvent(type, props);

        return safeMixin(e, props);
    }
    

    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg;
    }

    function getQueryParams(url) {
        var url = url || window.location.href,
            segs = url.split("?"),
            params = {};

        if (segs.length > 1) {
            segs[1].split("&").forEach(function(queryParam) {
                var nv = queryParam.split('=');
                params[nv[0]] = nv[1];
            });
        }
        return params;
    }


    function toPixel(value) {
        // style values can be floats, client code may want
        // to round for integer pixels.
        return parseFloat(value) || 0;
    }


    var _uid = 1;

    function uid(obj) {
        return obj._uid || (obj._uid = _uid++);
    }

    var idCounter = 0;
    function uniqueId (prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    }


    function langx() {
        return langx;
    }

    mixin(langx, {
        createEvent : createEvent,

        funcArg: funcArg,

        getQueryParams: getQueryParams,

        toPixel: toPixel,

        uid: uid,

        uniqueId: uniqueId,

        URL: typeof window !== "undefined" ? window.URL || window.webkitURL : null

    });


    mixin(langx, arrays,aspect,funcs,objects,strings,types,{
        ArrayStore : ArrayStore,

        async : async,
        
        Deferred: Deferred,

        Evented: Evented,

        klass : klass,

        Restful: Restful,
        
        Stateful: Stateful,

        Xhr: Xhr

    });

    return skylark.langx = langx;
});
define('skylark-utils-dom/langx',[
    "skylark-langx/langx"
], function(langx) {
    return langx;
});

define('skylark-utils-dom/browser',[
    "./dom",
    "./langx"
], function(dom,langx) {
    "use strict";
 
    var checkedCssProperties = {
            "transitionproperty": "TransitionProperty",
        },
        transEndEventNames = {
          WebkitTransition : 'webkitTransitionEnd',
          MozTransition    : 'transitionend',
          OTransition      : 'oTransitionEnd otransitionend',
          transition       : 'transitionend'
        },
        transEndEventName = null;


    var css3PropPrefix = "",
        css3StylePrefix = "",
        css3EventPrefix = "",

        cssStyles = {},
        cssProps = {},

        vendorPrefix,
        vendorPrefixRE,
        vendorPrefixesRE = /^(Webkit|webkit|O|Moz|moz|ms)(.*)$/,

        document = window.document,
        testEl = document.createElement("div"),

        matchesSelector = testEl.webkitMatchesSelector ||
                          testEl.mozMatchesSelector ||
                          testEl.oMatchesSelector ||
                          testEl.matchesSelector,

        requestFullScreen = testEl.requestFullscreen || 
                            testEl.webkitRequestFullscreen || 
                            testEl.mozRequestFullScreen || 
                            testEl.msRequestFullscreen,

        exitFullScreen =  document.exitFullscreen ||
                          document.webkitCancelFullScreen ||
                          document.mozCancelFullScreen ||
                          document.msExitFullscreen,

        testStyle = testEl.style;

    for (var name in testStyle) {
        var matched = name.match(vendorPrefixRE || vendorPrefixesRE);
        if (matched) {
            if (!vendorPrefixRE) {
                vendorPrefix = matched[1];
                vendorPrefixRE = new RegExp("^(" + vendorPrefix + ")(.*)$");

                css3StylePrefix = vendorPrefix;
                css3PropPrefix = '-' + vendorPrefix.toLowerCase() + '-';
                css3EventPrefix = vendorPrefix.toLowerCase();
            }

            cssStyles[langx.lowerFirst(matched[2])] = name;
            var cssPropName = langx.dasherize(matched[2]);
            cssProps[cssPropName] = css3PropPrefix + cssPropName;

            if (transEndEventNames[name]) {
              transEndEventName = transEndEventNames[name];
            }
        }
    }

    if (!transEndEventName) {
        if (testStyle["transition"] !== undefined) {
            transEndEventName = transEndEventNames["transition"];
        }
    }

    function normalizeCssEvent(name) {
        return css3EventPrefix ? css3EventPrefix + name : name.toLowerCase();
    }

    function normalizeCssProperty(name) {
        return cssProps[name] || name;
    }

    function normalizeStyleProperty(name) {
        return cssStyles[name] || name;
    }

    function browser() {
        return browser;
    }

    langx.mixin(browser, {
        css3PropPrefix: css3PropPrefix,

        isIE : !!/msie/i.exec( window.navigator.userAgent ),

        normalizeStyleProperty: normalizeStyleProperty,

        normalizeCssProperty: normalizeCssProperty,

        normalizeCssEvent: normalizeCssEvent,

        matchesSelector: matchesSelector,

        requestFullScreen : requestFullScreen,

        exitFullscreen : requestFullScreen,

        location: function() {
            return window.location;
        },

        support : {

        }

    });

    if  (transEndEventName) {
        browser.support.transition = {
            end : transEndEventName
        };
    }

    testEl = null;

    return dom.browser = browser;
});

define('skylark-utils-dom/styler',[
    "./dom",
    "./langx"
], function(dom, langx) {
    var every = Array.prototype.every,
        forEach = Array.prototype.forEach,
        camelCase = langx.camelCase,
        dasherize = langx.dasherize;

    function maybeAddPx(name, value) {
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }

    var cssNumber = {
            'column-count': 1,
            'columns': 1,
            'font-weight': 1,
            'line-height': 1,
            'opacity': 1,
            'z-index': 1,
            'zoom': 1
        },
        classReCache = {

        };

    function classRE(name) {
        return name in classReCache ?
            classReCache[name] : (classReCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
    }

    // access className property while respecting SVGAnimatedString
    /*
     * Adds the specified class(es) to each element in the set of matched elements.
     * @param {HTMLElement} node
     * @param {String} value
     */
    function className(node, value) {
        var klass = node.className || '',
            svg = klass && klass.baseVal !== undefined

        if (value === undefined) return svg ? klass.baseVal : klass
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    function disabled(elm, value ) {
        if (arguments.length < 2) {
            return !!this.dom.disabled;
        }

        elm.disabled = value;

        return this;
    }

    var elementDisplay = {};

    function defaultDisplay(nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) {
            element = document.createElement(nodeName)
            document.body.appendChild(element)
            display = getComputedStyle(element, '').getPropertyValue("display")
            element.parentNode.removeChild(element)
            display == "none" && (display = "block")
            elementDisplay[nodeName] = display
        }
        return elementDisplay[nodeName]
    }
    /*
     * Display the matched elements.
     * @param {HTMLElement} elm
     */
    function show(elm) {
        styler.css(elm, "display", "");
        if (styler.css(elm, "display") == "none") {
            styler.css(elm, "display", defaultDisplay(elm.nodeName));
        }
        return this;
    }

    function isInvisible(elm) {
        return styler.css(elm, "display") == "none" || styler.css(elm, "opacity") == 0;
    }

    /*
     * Hide the matched elements.
     * @param {HTMLElement} elm
     */
    function hide(elm) {
        styler.css(elm, "display", "none");
        return this;
    }

    /*
     * Adds the specified class(es) to each element in the set of matched elements.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function addClass(elm, name) {
        if (!name) return this
        var cls = className(elm),
            names;
        if (langx.isString(name)) {
            names = name.split(/\s+/g);
        } else {
            names = name;
        }
        names.forEach(function(klass) {
            var re = classRE(klass);
            if (!cls.match(re)) {
                cls += (cls ? " " : "") + klass;
            }
        });

        className(elm, cls);

        return this;
    }
    /*
     * Get the value of a computed style property for the first element in the set of matched elements or set one or more CSS properties for every matched element.
     * @param {HTMLElement} elm
     * @param {String} property
     * @param {Any} value
     */
    function css(elm, property, value) {
        if (arguments.length < 3) {
            var computedStyle,
                computedStyle = getComputedStyle(elm, '')
            if (langx.isString(property)) {
                return elm.style[camelCase(property)] || computedStyle.getPropertyValue(dasherize(property))
            } else if (langx.isArrayLike(property)) {
                var props = {}
                forEach.call(property, function(prop) {
                    props[prop] = (elm.style[camelCase(prop)] || computedStyle.getPropertyValue(dasherize(prop)))
                })
                return props
            }
        }

        var css = '';
        if (typeof(property) == 'string') {
            if (!value && value !== 0) {
                elm.style.removeProperty(dasherize(property));
            } else {
                css = dasherize(property) + ":" + maybeAddPx(property, value)
            }
        } else {
            for (key in property) {
                if (property[key] === undefined) {
                    continue;
                }
                if (!property[key] && property[key] !== 0) {
                    elm.style.removeProperty(dasherize(key));
                } else {
                    css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
                }
            }
        }

        elm.style.cssText += ';' + css;
        return this;
    }

    /*
     * Determine whether any of the matched elements are assigned the given class.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function hasClass(elm, name) {
        var re = classRE(name);
        return elm.className && elm.className.match(re);
    }

    /*
     * Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
     * @param {HTMLElement} elm
     * @param {String} name
     */
    function removeClass(elm, name) {
        if (name) {
            var cls = className(elm),
                names;

            if (langx.isString(name)) {
                names = name.split(/\s+/g);
            } else {
                names = name;
            }

            names.forEach(function(klass) {
                var re = classRE(klass);
                if (cls.match(re)) {
                    cls = cls.replace(re, " ");
                }
            });

            className(elm, cls.trim());
        } else {
            className(elm, "");
        }

        return this;
    }

    /*
     * Add or remove one or more classes from the specified element.
     * @param {HTMLElement} elm
     * @param {String} name
     * @param {} when
     */
    function toggleClass(elm, name, when) {
        var self = this;
        name.split(/\s+/g).forEach(function(klass) {
            if (when === undefined) {
                when = !self.hasClass(elm, klass);
            }
            if (when) {
                self.addClass(elm, klass);
            } else {
                self.removeClass(elm, klass)
            }
        });

        return self;
    }

    var styler = function() {
        return styler;
    };

    langx.mixin(styler, {
        autocssfix: false,
        cssHooks: {

        },

        addClass: addClass,
        className: className,
        css: css,
        disabled : disabled,        
        hasClass: hasClass,
        hide: hide,
        isInvisible: isInvisible,
        removeClass: removeClass,
        show: show,
        toggleClass: toggleClass
    });

    return dom.styler = styler;
});
define('skylark-utils-dom/noder',[
    "./dom",
    "./langx",
    "./browser",
    "./styler"
], function(dom, langx, browser, styler) {
    var isIE = !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g),
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
        div = document.createElement("div"),
        table = document.createElement('table'),
        tableBody = document.createElement('tbody'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': tableBody,
            'tbody': table,
            'thead': table,
            'tfoot': table,
            'td': tableRow,
            'th': tableRow,
            '*': div
        },
        rootNodeRE = /^(?:body|html)$/i,
        map = Array.prototype.map,
        slice = Array.prototype.slice;

    function ensureNodes(nodes, copyByClone) {
        if (!langx.isArrayLike(nodes)) {
            nodes = [nodes];
        }
        if (copyByClone) {
            nodes = map.call(nodes, function(node) {
                return node.cloneNode(true);
            });
        }
        return langx.flatten(nodes);
    }

    function nodeName(elm, chkName) {
        var name = elm.nodeName && elm.nodeName.toLowerCase();
        if (chkName !== undefined) {
            return name === chkName.toLowerCase();
        }
        return name;
    };


    function activeElement(doc) {
        doc = doc || document;
        var el;

        // Support: IE 9 only
        // IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
        try {
            el = doc.activeElement;
        } catch ( error ) {
            el = doc.body;
        }

        // Support: IE 9 - 11 only
        // IE may return null instead of an element
        // Interestingly, this only seems to occur when NOT in an iframe
        if ( !el ) {
            el = doc.body;
        }

        // Support: IE 11 only
        // IE11 returns a seemingly empty object in some cases when accessing
        // document.activeElement from an <iframe>
        if ( !el.nodeName ) {
            el = doc.body;
        }

        return el;
    };

    function after(node, placing, copyByClone) {
        var refNode = node,
            parent = refNode.parentNode;
        if (parent) {
            var nodes = ensureNodes(placing, copyByClone),
                refNode = refNode.nextSibling;

            for (var i = 0; i < nodes.length; i++) {
                if (refNode) {
                    parent.insertBefore(nodes[i], refNode);
                } else {
                    parent.appendChild(nodes[i]);
                }
            }
        }
        return this;
    }

    function append(node, placing, copyByClone) {
        var parentNode = node,
            nodes = ensureNodes(placing, copyByClone);
        for (var i = 0; i < nodes.length; i++) {
            parentNode.appendChild(nodes[i]);
        }
        return this;
    }

    function before(node, placing, copyByClone) {
        var refNode = node,
            parent = refNode.parentNode;
        if (parent) {
            var nodes = ensureNodes(placing, copyByClone);
            for (var i = 0; i < nodes.length; i++) {
                parent.insertBefore(nodes[i], refNode);
            }
        }
        return this;
    }
    /*   
     * Get the children of the specified node, including text and comment nodes.
     * @param {HTMLElement} elm
     */
    function contents(elm) {
        if (nodeName(elm, "iframe")) {
            return elm.contentDocument;
        }
        return elm.childNodes;
    }

    /*   
     * Create a element and set attributes on it.
     * @param {HTMLElement} tag
     * @param {props} props
     * @param } parent
     */
    function createElement(tag, props, parent) {
        var node = document.createElement(tag);
        if (props) {
            for (var name in props) {
                node.setAttribute(name, props[name]);
            }
        }
        if (parent) {
            append(parent, node);
        }
        return node;
    }

    /*   
     * Create a DocumentFragment from the HTML fragment.
     * @param {String} html
     */
    function createFragment(html) {
        // A special case optimization for a single tag
        html = langx.trim(html);
        if (singleTagRE.test(html)) {
            return [createElement(RegExp.$1)];
        }

        var name = fragmentRE.test(html) && RegExp.$1
        if (!(name in containers)) {
            name = "*"
        }
        var container = containers[name];
        container.innerHTML = "" + html;
        dom = slice.call(container.childNodes);

        dom.forEach(function(node) {
            container.removeChild(node);
        })

        return dom;
    }

    /*   
     * Create a deep copy of the set of matched elements.
     * @param {HTMLElement} node
     * @param {Boolean} deep
     */
    function clone(node, deep) {
        var self = this,
            clone;

        // TODO: Add feature detection here in the future
        if (!isIE || node.nodeType !== 1 || deep) {
            return node.cloneNode(deep);
        }

        // Make a HTML5 safe shallow copy
        if (!deep) {
            clone = document.createElement(node.nodeName);

            // Copy attribs
            each(self.getAttribs(node), function(attr) {
                self.setAttrib(clone, attr.nodeName, self.getAttrib(node, attr.nodeName));
            });

            return clone;
        }
    }

    /*   
     * Check to see if a dom node is a descendant of another dom node .
     * @param {String} node
     * @param {Node} child
     */
    function contains(node, child) {
        return isChildOf(child, node);
    }

    /*   
     * Create a new Text node.
     * @param {String} text
     * @param {Node} child
     */
    function createTextNode(text) {
        return document.createTextNode(text);
    }

    /*   
     * Get the current document object.
     */
    function doc() {
        return document;
    }

    /*   
     * Remove all child nodes of the set of matched elements from the DOM.
     * @param {Object} node
     */
    function empty(node) {
        while (node.hasChildNodes()) {
            var child = node.firstChild;
            node.removeChild(child);
        }
        return this;
    }

    var fulledEl = null;

    function fullScreen(el) {
        if (el === false) {
            browser.exitFullScreen.apply(document);
        } else if (el) {
            browser.requestFullScreen.apply(el);
            fulledEl = el;
        } else {
            return (
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            )
        }
    }


    // Selectors
    function focusable( element, hasTabindex ) {
        var map, mapName, img, focusableIfVisible, fieldset,
            nodeName = element.nodeName.toLowerCase();

        if ( "area" === nodeName ) {
            map = element.parentNode;
            mapName = map.name;
            if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
                return false;
            }
            img = $( "img[usemap='#" + mapName + "']" );
            return img.length > 0 && img.is( ":visible" );
        }

        if ( /^(input|select|textarea|button|object)$/.test( nodeName ) ) {
            focusableIfVisible = !element.disabled;

            if ( focusableIfVisible ) {

                // Form controls within a disabled fieldset are disabled.
                // However, controls within the fieldset's legend do not get disabled.
                // Since controls generally aren't placed inside legends, we skip
                // this portion of the check.
                fieldset = $( element ).closest( "fieldset" )[ 0 ];
                if ( fieldset ) {
                    focusableIfVisible = !fieldset.disabled;
                }
            }
        } else if ( "a" === nodeName ) {
            focusableIfVisible = element.href || hasTabindex;
        } else {
            focusableIfVisible = hasTabindex;
        }

        return focusableIfVisible && $( element ).is( ":visible" ) && visible( $( element ) );
    };


   var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi;
 
    /*   
     * Get the HTML contents of the first element in the set of matched elements.
     * @param {HTMLElement} node
     * @param {String} html
     */
    function html(node, html) {
        if (html === undefined) {
            return node.innerHTML;
        } else {
            this.empty(node);
            html = html || "";
            if (langx.isString(html)) {
                html = html.replace( rxhtmlTag, "<$1></$2>" );
            }
            if (langx.isString(html) || langx.isNumber(html)) {               
                node.innerHTML = html;
            } else if (langx.isArrayLike(html)) {
                for (var i = 0; i < html.length; i++) {
                    node.appendChild(html[i]);
                }
            } else {
                node.appendChild(html);
            }
        }
    }


    /*   
     * Check to see if a dom node is a descendant of another dom node.
     * @param {Node} node
     * @param {Node} parent
     * @param {Node} directly
     */
    function isChildOf(node, parent, directly) {
        if (directly) {
            return node.parentNode === parent;
        }
        if (document.documentElement.contains) {
            return parent.contains(node);
        }
        while (node) {
            if (parent === node) {
                return true;
            }

            node = node.parentNode;
        }

        return false;
    }

    /*   
     * Check to see if a dom node is a descendant of another dom node.
     * @param {Node} node
     * @param {Node} parent
     * @param {Node} directly
     */
    function isDoc(node) {
        return node != null && node.nodeType == node.DOCUMENT_NODE
    }

    /*   
     * Get the owner document object for the specified element.
     * @param {Node} elm
     */
    function ownerDoc(elm) {
        if (!elm) {
            return document;
        }

        if (elm.nodeType == 9) {
            return elm;
        }

        return elm.ownerDocument;
    }

    /*   
     *
     * @param {Node} elm
     */
    function ownerWindow(elm) {
        var doc = ownerDoc(elm);
        return doc.defaultView || doc.parentWindow;
    }

    /*   
     * insert one or more nodes as the first children of the specified node.
     * @param {Node} node
     * @param {Node or ArrayLike} placing
     * @param {Boolean Optional} copyByClone
     */
    function prepend(node, placing, copyByClone) {
        var parentNode = node,
            refNode = parentNode.firstChild,
            nodes = ensureNodes(placing, copyByClone);
        for (var i = 0; i < nodes.length; i++) {
            if (refNode) {
                parentNode.insertBefore(nodes[i], refNode);
            } else {
                parentNode.appendChild(nodes[i]);
            }
        }
        return this;
    }

    /*   
     *
     * @param {Node} elm
     */
    function offsetParent(elm) {
        var parent = elm.offsetParent || document.body;
        while (parent && !rootNodeRE.test(parent.nodeName) && styler.css(parent, "position") == "static") {
            parent = parent.offsetParent;
        }
        return parent;
    }

    /*   
     *
     * @param {Node} elm
     * @param {Node} params
     */
    function overlay(elm, params) {
        var overlayDiv = createElement("div", params);
        styler.css(overlayDiv, {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0x7FFFFFFF,
            opacity: 0.7
        });
        elm.appendChild(overlayDiv);
        return overlayDiv;

    }

    /*   
     * Remove the set of matched elements from the DOM.
     * @param {Node} node
     */
    function remove(node) {
        if (node && node.parentNode) {
            try {
                node.parentNode.removeChild(node);
            } catch (e) {
                console.warn("The node is already removed", e);
            }
        }
        return this;
    }

    function removeChild(node,children) {
        if (!langx.isArrayLike(children)) {
            children = [children];
        }
        for (var i=0;i<children.length;i++) {
            node.removeChild(children[i]);
        }

        return this;
    }

    function scrollParent( elm, includeHidden ) {
        var position = styler.css(elm,"position" ),
            excludeStaticParent = position === "absolute",
            overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
            scrollParent = this.parents().filter( function() {
                var parent = $( this );
                if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
                    return false;
                }
                return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
                    parent.css( "overflow-x" ) );
            } ).eq( 0 );

        return position === "fixed" || !scrollParent.length ?
            $( this[ 0 ].ownerDocument || document ) :
            scrollParent;
    };

        /*   
     * Replace an old node with the specified node.
     * @param {Node} node
     * @param {Node} oldNode
     */
    function replace(node, oldNode) {
        oldNode.parentNode.replaceChild(node, oldNode);
        return this;
    }

    /*   
     * Replace an old node with the specified node.
     * @param {HTMLElement} elm
     * @param {Node} params
     */
    function throb(elm, params) {
        params = params || {};
        var self = this,
            text = params.text,
            style = params.style,
            time = params.time,
            callback = params.callback,
            timer,
            throbber = this.createElement("div", {
                className: params.className || "throbber",
                style: style
            }),
            _overlay = overlay(throbber, {
                className: 'overlay fade'
            }),
            throb = this.createElement("div", {
                className: "throb"
            }),
            textNode = this.createTextNode(text || ""),
            remove = function() {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                if (throbber) {
                    self.remove(throbber);
                    throbber = null;
                }
            },
            update = function(params) {
                if (params && params.text && throbber) {
                    textNode.nodeValue = params.text;
                }
            };
        throb.appendChild(textNode);
        throbber.appendChild(throb);
        elm.appendChild(throbber);
        var end = function() {
            remove();
            if (callback) callback();
        };
        if (time) {
            timer = setTimeout(end, time);
        }

        return {
            remove: remove,
            update: update
        };
    }


    /*   
     * traverse the specified node and its descendants, perform the callback function on each
     * @param {Node} node
     * @param {Function} fn
     */
    function traverse(node, fn) {
        fn(node)
        for (var i = 0, len = node.childNodes.length; i < len; i++) {
            traverse(node.childNodes[i], fn);
        }
        return this;
    }

    /*   
     *
     * @param {Node} node
     */
    function reverse(node) {
        var firstChild = node.firstChild;
        for (var i = node.children.length - 1; i > 0; i--) {
            if (i > 0) {
                var child = node.children[i];
                node.insertBefore(child, firstChild);
            }
        }
    }

    /*   
     * Wrap an HTML structure around each element in the set of matched elements.
     * @param {Node} node
     * @param {Node} wrapperNode
     */
    function wrapper(node, wrapperNode) {
        if (langx.isString(wrapperNode)) {
            wrapperNode = this.createFragment(wrapperNode).firstChild;
        }
        node.parentNode.insertBefore(wrapperNode, node);
        wrapperNode.appendChild(node);
    }

    /*   
     * Wrap an HTML structure around the content of each element in the set of matched
     * @param {Node} node
     * @param {Node} wrapperNode
     */
    function wrapperInner(node, wrapperNode) {
        var childNodes = slice.call(node.childNodes);
        node.appendChild(wrapperNode);
        for (var i = 0; i < childNodes.length; i++) {
            wrapperNode.appendChild(childNodes[i]);
        }
        return this;
    }

    /*   
     * Remove the parents of the set of matched elements from the DOM, leaving the matched
     * @param {Node} node
     */
    function unwrap(node) {
        var child, parent = node.parentNode;
        if (parent) {
            if (this.isDoc(parent.parentNode)) return;
            parent.parentNode.insertBefore(node, parent);
        }
    }

    function noder() {
        return noder;
    }

    langx.mixin(noder, {
        active  : activeElement,

        blur : function(el) {
            el.blur();
        },

        body: function() {
            return document.body;
        },

        clone: clone,
        contents: contents,

        createElement: createElement,

        createFragment: createFragment,

        contains: contains,

        createTextNode: createTextNode,

        doc: doc,

        empty: empty,

        fullScreen: fullScreen,

        focusable: focusable,

        html: html,

        isChildOf: isChildOf,

        isDoc: isDoc,

        isWindow: langx.isWindow,

        offsetParent: offsetParent,

        ownerDoc: ownerDoc,

        ownerWindow: ownerWindow,

        after: after,

        before: before,

        prepend: prepend,

        append: append,

        remove: remove,

        removeChild : removeChild,

        replace: replace,

        throb: throb,

        traverse: traverse,

        reverse: reverse,

        wrapper: wrapper,

        wrapperInner: wrapperInner,

        unwrap: unwrap
    });

    return dom.noder = noder;
});
define('skylark-utils-dom/finder',[
    "./dom",
    "./langx",
    "./browser",
    "./noder"
], function(dom, langx, browser, noder, velm) {
    var local = {},
        filter = Array.prototype.filter,
        slice = Array.prototype.slice,
        nativeMatchesSelector = browser.matchesSelector;

    /*
    ---
    name: Slick.Parser
    description: Standalone CSS3 Selector parser
    provides: Slick.Parser
    ...
    */
    ;
    (function() {

        var parsed,
            separatorIndex,
            combinatorIndex,
            reversed,
            cache = {},
            reverseCache = {},
            reUnescape = /\\/g;

        var parse = function(expression, isReversed) {
            if (expression == null) return null;
            if (expression.Slick === true) return expression;
            expression = ('' + expression).replace(/^\s+|\s+$/g, '');
            reversed = !!isReversed;
            var currentCache = (reversed) ? reverseCache : cache;
            if (currentCache[expression]) return currentCache[expression];
            parsed = {
                Slick: true,
                expressions: [],
                raw: expression,
                reverse: function() {
                    return parse(this.raw, true);
                }
            };
            separatorIndex = -1;
            while (expression != (expression = expression.replace(regexp, parser)));
            parsed.length = parsed.expressions.length;
            return currentCache[parsed.raw] = (reversed) ? reverse(parsed) : parsed;
        };

        var reverseCombinator = function(combinator) {
            if (combinator === '!') return ' ';
            else if (combinator === ' ') return '!';
            else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
            else return '!' + combinator;
        };

        var reverse = function(expression) {
            var expressions = expression.expressions;
            for (var i = 0; i < expressions.length; i++) {
                var exp = expressions[i];
                var last = {
                    parts: [],
                    tag: '*',
                    combinator: reverseCombinator(exp[0].combinator)
                };

                for (var j = 0; j < exp.length; j++) {
                    var cexp = exp[j];
                    if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
                    cexp.combinator = cexp.reverseCombinator;
                    delete cexp.reverseCombinator;
                }

                exp.reverse().push(last);
            }
            return expression;
        };

        var escapeRegExp = (function() {
            // Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
            var from = /(?=[\-\[\]{}()*+?.\\\^$|,#\s])/g,
                to = '\\';
            return function(string) {
                return string.replace(from, to)
            }
        }())

        var regexp = new RegExp(
            "^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|(:+)(<unicode>+)(?:\\((?:(?:([\"'])([^\\13]*)\\13)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
            .replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
            .replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
            .replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
        );

        function parser(
            rawMatch,

            separator,
            combinator,
            combinatorChildren,

            tagName,
            id,
            className,

            attributeKey,
            attributeOperator,
            attributeQuote,
            attributeValue,

            pseudoMarker,
            pseudoClass,
            pseudoQuote,
            pseudoClassQuotedValue,
            pseudoClassValue
        ) {
            if (separator || separatorIndex === -1) {
                parsed.expressions[++separatorIndex] = [];
                combinatorIndex = -1;
                if (separator) return '';
            }

            if (combinator || combinatorChildren || combinatorIndex === -1) {
                combinator = combinator || ' ';
                var currentSeparator = parsed.expressions[separatorIndex];
                if (reversed && currentSeparator[combinatorIndex])
                    currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
                currentSeparator[++combinatorIndex] = {
                    combinator: combinator,
                    tag: '*'
                };
            }

            var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

            if (tagName) {
                currentParsed.tag = tagName.replace(reUnescape, '');

            } else if (id) {
                currentParsed.id = id.replace(reUnescape, '');

            } else if (className) {
                className = className.replace(reUnescape, '');

                if (!currentParsed.classList) currentParsed.classList = [];
                if (!currentParsed.classes) currentParsed.classes = [];
                currentParsed.classList.push(className);
                currentParsed.classes.push({
                    value: className,
                    regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
                });

            } else if (pseudoClass) {
                pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
                pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

                if (!currentParsed.pseudos) currentParsed.pseudos = [];
                currentParsed.pseudos.push({
                    key: pseudoClass.replace(reUnescape, ''),
                    value: pseudoClassValue,
                    type: pseudoMarker.length == 1 ? 'class' : 'element'
                });

            } else if (attributeKey) {
                attributeKey = attributeKey.replace(reUnescape, '');
                attributeValue = (attributeValue || '').replace(reUnescape, '');

                var test, regexp;

                switch (attributeOperator) {
                    case '^=':
                        regexp = new RegExp('^' + escapeRegExp(attributeValue));
                        break;
                    case '$=':
                        regexp = new RegExp(escapeRegExp(attributeValue) + '$');
                        break;
                    case '~=':
                        regexp = new RegExp('(^|\\s)' + escapeRegExp(attributeValue) + '(\\s|$)');
                        break;
                    case '|=':
                        regexp = new RegExp('^' + escapeRegExp(attributeValue) + '(-|$)');
                        break;
                    case '=':
                        test = function(value) {
                            return attributeValue == value;
                        };
                        break;
                    case '*=':
                        test = function(value) {
                            return value && value.indexOf(attributeValue) > -1;
                        };
                        break;
                    case '!=':
                        test = function(value) {
                            return attributeValue != value;
                        };
                        break;
                    default:
                        test = function(value) {
                            return !!value;
                        };
                }

                if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function() {
                    return false;
                };

                if (!test) test = function(value) {
                    return value && regexp.test(value);
                };

                if (!currentParsed.attributes) currentParsed.attributes = [];
                currentParsed.attributes.push({
                    key: attributeKey,
                    operator: attributeOperator,
                    value: attributeValue,
                    test: test
                });

            }

            return '';
        };

        // Slick NS

        var Slick = (this.Slick || {});

        Slick.parse = function(expression) {
            return parse(expression);
        };

        Slick.escapeRegExp = escapeRegExp;

        if (!this.Slick) this.Slick = Slick;

    }).apply(local);


    var simpleClassSelectorRE = /^\.([\w-]*)$/,
        simpleIdSelectorRE = /^#([\w-]*)$/,
        rinputs = /^(?:input|select|textarea|button)$/i,
        rheader = /^h\d$/i,
        slice = Array.prototype.slice;


    local.parseSelector = local.Slick.parse;


    var pseudos = local.pseudos = {
        // custom pseudos
        "button": function(elem) {
            var name = elem.nodeName.toLowerCase();
            return name === "input" && elem.type === "button" || name === "button";
        },

        'checked': function(elm) {
            return !!elm.checked;
        },

        'contains': function(elm, idx, nodes, text) {
            if ($(this).text().indexOf(text) > -1) return this
        },

        'disabled': function(elm) {
            return !!elm.disabled;
        },

        'enabled': function(elm) {
            return !elm.disabled;
        },

        'eq': function(elm, idx, nodes, value) {
            return (idx == value);
        },

        'even': function(elm, idx, nodes, value) {
            return (idx % 2) === 0;
        },

        'focus': function(elm) {
            return document.activeElement === elm && (elm.href || elm.type || elm.tabindex);
        },

        'focusable': function( elm ) {
            return noder.focusable(elm, elm.tabindex != null );
        },

        'first': function(elm, idx) {
            return (idx === 0);
        },

        'gt': function(elm, idx, nodes, value) {
            return (idx > value);
        },

        'has': function(elm, idx, nodes, sel) {
            return find(elm, sel);
        },

        // Element/input types
        "header": function(elem) {
            return rheader.test(elem.nodeName);
        },

        'hidden': function(elm) {
            return !local.pseudos["visible"](elm);
        },

        "input": function(elem) {
            return rinputs.test(elem.nodeName);
        },

        'last': function(elm, idx, nodes) {
            return (idx === nodes.length - 1);
        },

        'lt': function(elm, idx, nodes, value) {
            return (idx < value);
        },

        'not': function(elm, idx, nodes, sel) {
            return !matches(elm, sel);
        },

        'odd': function(elm, idx, nodes, value) {
            return (idx % 2) === 1;
        },

        /*   
         * Get the parent of each element in the current set of matched elements.
         * @param {Object} elm
         */
        'parent': function(elm) {
            return !!elm.parentNode;
        },

        'selected': function(elm) {
            return !!elm.selected;
        },

        'tabbable': function(elm) {
            var tabIndex = elm.tabindex,
                hasTabindex = tabIndex != null;
            return ( !hasTabindex || tabIndex >= 0 ) && noder.focusable( element, hasTabindex );
        },

        'text': function(elm) {
            return elm.type === "text";
        },

        'visible': function(elm) {
            return elm.offsetWidth && elm.offsetWidth
        }
    };

    ["first", "eq", "last"].forEach(function(item) {
        pseudos[item].isArrayFilter = true;
    });



    pseudos["nth"] = pseudos["eq"];

    function createInputPseudo(type) {
        return function(elem) {
            var name = elem.nodeName.toLowerCase();
            return name === "input" && elem.type === type;
        };
    }

    function createButtonPseudo(type) {
        return function(elem) {
            var name = elem.nodeName.toLowerCase();
            return (name === "input" || name === "button") && elem.type === type;
        };
    }

    // Add button/input type pseudos
    for (i in {
        radio: true,
        checkbox: true,
        file: true,
        password: true,
        image: true
    }) {
        pseudos[i] = createInputPseudo(i);
    }
    for (i in {
        submit: true,
        reset: true
    }) {
        pseudos[i] = createButtonPseudo(i);
    }


    local.divide = function(cond) {
        var nativeSelector = "",
            customPseudos = [],
            tag,
            id,
            classes,
            attributes,
            pseudos;


        if (id = cond.id) {
            nativeSelector += ("#" + id);
        }
        if (classes = cond.classes) {
            for (var i = classes.length; i--;) {
                nativeSelector += ("." + classes[i].value);
            }
        }
        if (attributes = cond.attributes) {
            for (var i = 0; i < attributes.length; i++) {
                if (attributes[i].operator) {
                    nativeSelector += ("[" + attributes[i].key + attributes[i].operator + JSON.stringify(attributes[i].value) + "]");
                } else {
                    nativeSelector += ("[" + attributes[i].key + "]");
                }
            }
        }
        if (pseudos = cond.pseudos) {
            for (i = pseudos.length; i--;) {
                part = pseudos[i];
                if (this.pseudos[part.key]) {
                    customPseudos.push(part);
                } else {
                    if (part.value !== undefined) {
                        nativeSelector += (":" + part.key + "(" + JSON.stringify(part))
                    }
                }
            }
        }

        if (tag = cond.tag) {
            if (tag !== "*") {
                nativeSelector = tag.toUpperCase() + nativeSelector;
            }
        }

        if (!nativeSelector) {
            nativeSelector = "*";
        }

        return {
            nativeSelector: nativeSelector,
            customPseudos: customPseudos
        }

    };

    local.check = function(node, cond, idx, nodes, arrayFilte) {
        var tag,
            id,
            classes,
            attributes,
            pseudos,

            i, part, cls, pseudo;

        if (!arrayFilte) {
            if (tag = cond.tag) {
                var nodeName = node.nodeName.toUpperCase();
                if (tag == '*') {
                    if (nodeName < '@') return false; // Fix for comment nodes and closed nodes
                } else {
                    if (nodeName != (tag || "").toUpperCase()) return false;
                }
            }

            if (id = cond.id) {
                if (node.getAttribute('id') != id) {
                    return false;
                }
            }


            if (classes = cond.classes) {
                for (i = classes.length; i--;) {
                    cls = node.getAttribute('class');
                    if (!(cls && classes[i].regexp.test(cls))) return false;
                }
            }

            if (attributes = cond.attributes) {
                for (i = attributes.length; i--;) {
                    part = attributes[i];
                    if (part.operator ? !part.test(node.getAttribute(part.key)) : !node.hasAttribute(part.key)) return false;
                }
            }

        }
        if (pseudos = cond.pseudos) {
            for (i = pseudos.length; i--;) {
                part = pseudos[i];
                if (pseudo = this.pseudos[part.key]) {
                    if ((arrayFilte && pseudo.isArrayFilter) || (!arrayFilte && !pseudo.isArrayFilter)) {
                        if (!pseudo(node, idx, nodes, part.value)) {
                            return false;
                        }
                    }
                } else {
                    if (!arrayFilte && !nativeMatchesSelector.call(node, part.key)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    local.match = function(node, selector) {

        var parsed;

        if (langx.isString(selector)) {
            parsed = local.Slick.parse(selector);
        } else {
            parsed = selector;
        }

        if (!parsed) {
            return true;
        }

        // simple (single) selectors
        var expressions = parsed.expressions,
            simpleExpCounter = 0,
            i,
            currentExpression;
        for (i = 0;
            (currentExpression = expressions[i]); i++) {
            if (currentExpression.length == 1) {
                var exp = currentExpression[0];
                if (this.check(node, exp)) {
                    return true;
                }
                simpleExpCounter++;
            }
        }

        if (simpleExpCounter == parsed.length) {
            return false;
        }

        var nodes = this.query(document, parsed),
            item;
        for (i = 0; item = nodes[i++];) {
            if (item === node) {
                return true;
            }
        }
        return false;
    };


    local.filterSingle = function(nodes, exp) {
        var matchs = filter.call(nodes, function(node, idx) {
            return local.check(node, exp, idx, nodes, false);
        });

        matchs = filter.call(matchs, function(node, idx) {
            return local.check(node, exp, idx, matchs, true);
        });
        return matchs;
    };

    local.filter = function(nodes, selector) {
        var parsed;

        if (langx.isString(selector)) {
            parsed = local.Slick.parse(selector);
        } else {
            return local.filterSingle(nodes, selector);
        }

        // simple (single) selectors
        var expressions = parsed.expressions,
            i,
            currentExpression,
            ret = [];
        for (i = 0;
            (currentExpression = expressions[i]); i++) {
            if (currentExpression.length == 1) {
                var exp = currentExpression[0];

                var matchs = local.filterSingle(nodes, exp);

                ret = langx.uniq(ret.concat(matchs));
            } else {
                throw new Error("not supported selector:" + selector);
            }
        }

        return ret;

    };

    local.combine = function(elm, bit) {
        var op = bit.combinator,
            cond = bit,
            node1,
            nodes = [];

        switch (op) {
            case '>': // direct children
                nodes = children(elm, cond);
                break;
            case '+': // next sibling
                node1 = nextSibling(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '^': // first child
                node1 = firstChild(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '~': // next siblings
                nodes = nextSiblings(elm, cond);
                break;
            case '++': // next sibling and previous sibling
                var prev = previousSibling(elm, cond, true),
                    next = nextSibling(elm, cond, true);
                if (prev) {
                    nodes.push(prev);
                }
                if (next) {
                    nodes.push(next);
                }
                break;
            case '~~': // next siblings and previous siblings
                nodes = siblings(elm, cond);
                break;
            case '!': // all parent nodes up to document
                nodes = ancestors(elm, cond);
                break;
            case '!>': // direct parent (one level)
                node1 = parent(elm, cond);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '!+': // previous sibling
                nodes = previousSibling(elm, cond, true);
                break;
            case '!^': // last child
                node1 = lastChild(elm, cond, true);
                if (node1) {
                    nodes.push(node1);
                }
                break;
            case '!~': // previous siblings
                nodes = previousSiblings(elm, cond);
                break;
            default:
                var divided = this.divide(bit);
                nodes = slice.call(elm.querySelectorAll(divided.nativeSelector));
                if (divided.customPseudos) {
                    for (var i = divided.customPseudos.length - 1; i >= 0; i--) {
                        nodes = filter.call(nodes, function(item, idx) {
                            return local.check(item, {
                                pseudos: [divided.customPseudos[i]]
                            }, idx, nodes, false)
                        });

                        nodes = filter.call(nodes, function(item, idx) {
                            return local.check(item, {
                                pseudos: [divided.customPseudos[i]]
                            }, idx, nodes, true)
                        });
                    }
                }
                break;

        }
        return nodes;
    }

    local.query = function(node, selector, single) {


        var parsed = this.Slick.parse(selector);

        var
            founds = [],
            currentExpression, currentBit,
            expressions = parsed.expressions;

        for (var i = 0;
            (currentExpression = expressions[i]); i++) {
            var currentItems = [node],
                found;
            for (var j = 0;
                (currentBit = currentExpression[j]); j++) {
                found = langx.map(currentItems, function(item, i) {
                    return local.combine(item, currentBit)
                });
                if (found) {
                    currentItems = found;
                }
            }
            if (found) {
                founds = founds.concat(found);
            }
        }

        return founds;
    }

    /*
     * Get the nearest ancestor of the specified element,optional matched by a selector.
     * @param {HTMLElement} node
     * @param {String Optional } selector
     * @param {Object} root
     */
    function ancestor(node, selector, root) {
        var rootIsSelector = root && langx.isString(root);
        while (node = node.parentNode) {
            if (matches(node, selector)) {
                return node;
            }
            if (root) {
                if (rootIsSelector) {
                    if (matches(node, root)) {
                        break;
                    }
                } else if (node == root) {
                    break;
                }
            }
        }
        return null;
    }

    /*
     * Get the ancestors of the specitied element , optionally filtered by a selector.
     * @param {HTMLElement} node
     * @param {String Optional } selector
     * @param {Object} root
     */
    function ancestors(node, selector, root) {
        var ret = [],
            rootIsSelector = root && langx.isString(root);
        while ((node = node.parentNode) && (node.nodeType !== 9)) {
            ret.push(node);
            if (root) {
                if (rootIsSelector) {
                    if (matches(node, root)) {
                        break;
                    }
                } else if (node == root) {
                    break;
                }
            }

        }

        if (selector) {
            ret = local.filter(ret, selector);
        }
        return ret;
    }

    /*
     * Returns a element by its ID.
     * @param {string} id
     */
    function byId(id, doc) {
        doc = doc || noder.doc();
        return doc.getElementById(id);
    }

    /*
     * Get the children of the specified element , optionally filtered by a selector.
     * @param {string} node
     * @param {String optionlly} selector
     */
    function children(node, selector) {
        var childNodes = node.childNodes,
            ret = [];
        for (var i = 0; i < childNodes.length; i++) {
            var node = childNodes[i];
            if (node.nodeType == 1) {
                ret.push(node);
            }
        }
        if (selector) {
            ret = local.filter(ret, selector);
        }
        return ret;
    }

    function closest(node, selector) {
        while (node && !(matches(node, selector))) {
            node = node.parentNode;
        }

        return node;
    }

    /*
     * Get the decendant of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function descendants(elm, selector) {
        // Selector
        try {
            return slice.call(elm.querySelectorAll(selector));
        } catch (matchError) {
            //console.log(matchError);
        }
        return local.query(elm, selector);
    }

    /*
     * Get the nearest decendent of the specified element,optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function descendant(elm, selector) {
        // Selector
        try {
            return elm.querySelector(selector);
        } catch (matchError) {
            //console.log(matchError);
        }
        var nodes = local.query(elm, selector);
        if (nodes.length > 0) {
            return nodes[0];
        } else {
            return null;
        }
    }

    /*
     * Get the descendants of each element in the current set of matched elements, filtered by a selector, jQuery object, or element.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function find(elm, selector) {
        if (!selector) {
            selector = elm;
            elm = document.body;
        }
        if (matches(elm, selector)) {
            return elm;
        } else {
            return descendant(elm, selector);
        }
    }

    /*
     * Get the findAll of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function findAll(elm, selector) {
        if (!selector) {
            selector = elm;
            elm = document.body;
        }
        return descendants(elm, selector);
    }

    /*
     * Get the first child of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {String} first
     */
    function firstChild(elm, selector, first) {
        var childNodes = elm.childNodes,
            node = childNodes[0];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (first) {
                    break;
                }
            }
            node = node.nextSibling;
        }

        return null;
    }

    /*
     * Get the last child of the specified element , optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {String } last
     */
    function lastChild(elm, selector, last) {
        var childNodes = elm.childNodes,
            node = childNodes[childNodes.length - 1];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (last) {
                    break;
                }
            }
            node = node.previousSibling;
        }

        return null;
    }

    /*
     * Check the specified element against a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function matches(elm, selector) {
        if (!selector || !elm || elm.nodeType !== 1) {
            return false
        }

        if (langx.isString(selector)) {
            try {
                return nativeMatchesSelector.call(elm, selector.replace(/\[([^=]+)=\s*([^'"\]]+?)\s*\]/g, '[$1="$2"]'));
            } catch (matchError) {
                //console.log(matchError);
            }
            return local.match(elm, selector);
        } else if (langx.isArrayLike(selector)) {
            return langx.inArray(elm, selector) > -1;
        } else if (langx.isPlainObject(selector)) {
            return local.check(elm, selector);
        } else {
            return elm === selector;
        }

    }

    /*
     * Get the nearest next sibing of the specitied element , optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {Boolean Optional} adjacent
     */
    function nextSibling(elm, selector, adjacent) {
        var node = elm.nextSibling;
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (adjacent) {
                    break;
                }
            }
            node = node.nextSibling;
        }
        return null;
    }

    /*
     * Get the next siblings of the specified element , optional filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function nextSiblings(elm, selector) {
        var node = elm.nextSibling,
            ret = [];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.nextSibling;
        }
        return ret;
    }

    /*
     * Get the parent element of the specified element. if a selector is provided, it retrieves the parent element only if it matches that selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function parent(elm, selector) {
        var node = elm.parentNode;
        if (node && (!selector || matches(node, selector))) {
            return node;
        }

        return null;
    }

    /*
     * Get hte nearest previous sibling of the specified element ,optional matched by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     * @param {Boolean Optional } adjacent
     */
    function previousSibling(elm, selector, adjacent) {
        var node = elm.previousSibling;
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    return node;
                }
                if (adjacent) {
                    break;
                }
            }
            node = node.previousSibling;
        }
        return null;
    }

    /*
     * Get all preceding siblings of each element in the set of matched elements, optionally filtered by a selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function previousSiblings(elm, selector) {
        var node = elm.previousSibling,
            ret = [];
        while (node) {
            if (node.nodeType == 1) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.previousSibling;
        }
        return ret;
    }

    /*
     * Selects all sibling elements that follow after the “prev” element, have the same parent, and match the filtering “siblings” selector.
     * @param {HTMLElement} elm
     * @param {String optionlly} selector
     */
    function siblings(elm, selector) {
        var node = elm.parentNode.firstChild,
            ret = [];
        while (node) {
            if (node.nodeType == 1 && node !== elm) {
                if (!selector || matches(node, selector)) {
                    ret.push(node);
                }
            }
            node = node.nextSibling;
        }
        return ret;
    }

    var finder = function() {
        return finder;
    };

    langx.mixin(finder, {

        ancestor: ancestor,

        ancestors: ancestors,

        byId: byId,

        children: children,

        closest: closest,

        descendant: descendant,

        descendants: descendants,

        find: find,

        findAll: findAll,

        firstChild: firstChild,

        lastChild: lastChild,

        matches: matches,

        nextSibling: nextSibling,

        nextSiblings: nextSiblings,

        parent: parent,

        previousSibling: previousSibling,

        previousSiblings: previousSiblings,

        pseudos: local.pseudos,

        siblings: siblings
    });

    return dom.finder = finder;
});
define('skylark-utils-dom/datax',[
    "./dom",
    "./langx",
    "./finder"
], function(dom, langx, finder) {
    var map = Array.prototype.map,
        filter = Array.prototype.filter,
        camelCase = langx.camelCase,
        deserializeValue = langx.deserializeValue,

        capitalRE = /([A-Z])/g,
        propMap = {
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'for': 'htmlFor',
            'class': 'className',
            'maxlength': 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'usemap': 'useMap',
            'frameborder': 'frameBorder',
            'contenteditable': 'contentEditable'
        };
    /*
     * Set property values
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */

    function setAttribute(elm, name, value) {
        if (value == null) {
            elm.removeAttribute(name);
        } else {
            elm.setAttribute(name, value);
        }
    }

    function aria(elm, name, value) {
        return this.attr(elm, "aria-" + name, value);
    }

    /*
     * Set property values
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */

    function attr(elm, name, value) {
        if (value === undefined) {
            if (typeof name === "object") {
                for (var attrName in name) {
                    attr(elm, attrName, name[attrName]);
                }
                return this;
            } else {
                if (elm.hasAttribute && elm.hasAttribute(name)) {
                    return elm.getAttribute(name);
                }
            }
        } else {
            elm.setAttribute(name, value);
            return this;
        }
    }


    /*
     *  Read all "data-*" attributes from a node
     * @param {Object} elm  
     */

    function _attributeData(elm) {
        var store = {}
        langx.each(elm.attributes || [], function(i, attr) {
            if (attr.name.indexOf('data-') == 0) {
                store[camelCase(attr.name.replace('data-', ''))] = deserializeValue(attr.value);
            }
        })
        return store;
    }

    function _store(elm, confirm) {
        var store = elm["_$_store"];
        if (!store && confirm) {
            store = elm["_$_store"] = _attributeData(elm);
        }
        return store;
    }

    function _getData(elm, name) {
        if (name === undefined) {
            return _store(elm, true);
        } else {
            var store = _store(elm);
            if (store) {
                if (name in store) {
                    return store[name];
                }
                var camelName = camelCase(name);
                if (camelName in store) {
                    return store[camelName];
                }
            }
            var attrName = 'data-' + name.replace(capitalRE, "-$1").toLowerCase()
            return attr(elm, attrName);
        }

    }

    function _setData(elm, name, value) {
        var store = _store(elm, true);
        store[camelCase(name)] = value;
    }


    /*
     * xxx
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */
    function data(elm, name, value) {

        if (value === undefined) {
            if (typeof name === "object") {
                for (var dataAttrName in name) {
                    _setData(elm, dataAttrName, name[dataAttrName]);
                }
                return this;
            } else {
                return _getData(elm, name);
            }
        } else {
            _setData(elm, name, value);
            return this;
        }
    } 
    /*
     * Remove from the element all items that have not yet been run. 
     * @param {Object} elm  
     */

    function cleanData(elm) {
        if (elm["_$_store"]) {
            delete elm["_$_store"];
        }
    }

    /*
     * Remove a previously-stored piece of data. 
     * @param {Object} elm  
     * @param {Array} names
     */
    function removeData(elm, names) {
        if (langx.isString(names)) {
            names = names.split(/\s+/);
        }
        var store = _store(elm, true);
        names.forEach(function(name) {
            delete store[name];
        });
        return this;
    }

    /*
     * xxx 
     * @param {Object} elm  
     * @param {Array} names
     */
    function pluck(nodes, property) {
        return map.call(nodes, function(elm) {
            return elm[property];
        });
    }

    /*
     * Get or set the value of an property for the specified element.
     * @param {Object} elm  
     * @param {String} name
     * @param {String} value
     */
    function prop(elm, name, value) {
        name = propMap[name] || name;
        if (value === undefined) {
            return elm[name];
        } else {
            elm[name] = value;
            return this;
        }
    }

    /*
     * remove Attributes  
     * @param {Object} elm  
     * @param {String} name
     */
    function removeAttr(elm, name) {
        name.split(' ').forEach(function(attr) {
            setAttribute(elm, attr);
        });
        return this;
    }


    /*
     * Remove the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.
     * @param {Object} elm  
     * @param {String} name
     */
    function removeProp(elm, name) {
        name.split(' ').forEach(function(prop) {
            delete elm[prop];
        });
        return this;
    }

    /*   
     * Get the combined text contents of each element in the set of matched elements, including their descendants, or set the text contents of the matched elements.  
     * @param {Object} elm  
     * @param {String} txt
     */
    function text(elm, txt) {
        if (txt === undefined) {
            return elm.textContent;
        } else {
            elm.textContent = txt == null ? '' : '' + txt;
            return this;
        }
    }

    /*   
     * Get the current value of the first element in the set of matched elements or set the value of every matched element.
     * @param {Object} elm  
     * @param {String} value
     */
    function val(elm, value) {
        if (value === undefined) {
            if (elm.multiple) {
                // select multiple values
                var selectedOptions = filter.call(finder.find(elm, "option"), (function(option) {
                    return option.selected;
                }));
                return pluck(selectedOptions, "value");
            } else {
                return elm.value;
            }
        } else {
            elm.value = value;
            return this;
        }
    }


    finder.pseudos.data = function( elem, i, match,dataName ) {
        return !!data( elem, dataName || match[3]);
    };
   

    function datax() {
        return datax;
    }

    langx.mixin(datax, {
        aria: aria,

        attr: attr,

        cleanData: cleanData,

        data: data,

        pluck: pluck,

        prop: prop,

        removeAttr: removeAttr,

        removeData: removeData,

        removeProp: removeProp,

        text: text,

        val: val
    });

    return dom.datax = datax;
});
define('skylark-utils-dom/eventer',[
    "./dom",
    "./langx",
    "./browser",
    "./finder",
    "./noder",
    "./datax"
], function(dom, langx, browser, finder, noder, datax) {
    var mixin = langx.mixin,
        each = langx.each,
        slice = Array.prototype.slice,
        uid = langx.uid,
        ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
        eventMethods = {
            preventDefault: "isDefaultPrevented",
            stopImmediatePropagation: "isImmediatePropagationStopped",
            stopPropagation: "isPropagationStopped"
        },
        readyRE = /complete|loaded|interactive/;

    function compatible(event, source) {
        if (source || !event.isDefaultPrevented) {
            if (!source) {
                source = event;
            }

            langx.each(eventMethods, function(name, predicate) {
                var sourceMethod = source[name];
                event[name] = function() {
                    this[predicate] = langx.returnTrue;
                    return sourceMethod && sourceMethod.apply(source, arguments);
                }
                event[predicate] = langx.returnFalse;
            });
        }
        return event;
    }

    function parse(event) {
        var segs = ("" + event).split(".");
        return {
            type: segs[0],
            ns: segs.slice(1).sort().join(" ")
        };
    }

    //create a custom dom event
    var createEvent = (function() {
        var EventCtors = [
                window["CustomEvent"], // 0 default
                window["CompositionEvent"], // 1
                window["DragEvent"], // 2
                window["Event"], // 3
                window["FocusEvent"], // 4
                window["KeyboardEvent"], // 5
                window["MessageEvent"], // 6
                window["MouseEvent"], // 7
                window["MouseScrollEvent"], // 8
                window["MouseWheelEvent"], // 9
                window["MutationEvent"], // 10
                window["ProgressEvent"], // 11
                window["TextEvent"], // 12
                window["TouchEvent"], // 13
                window["UIEvent"], // 14
                window["WheelEvent"], // 15
                window["ClipboardEvent"] // 16
            ],
            NativeEvents = {
                "compositionstart": 1, // CompositionEvent
                "compositionend": 1, // CompositionEvent
                "compositionupdate": 1, // CompositionEvent

                "beforecopy": 16, // ClipboardEvent
                "beforecut": 16, // ClipboardEvent
                "beforepaste": 16, // ClipboardEvent
                "copy": 16, // ClipboardEvent
                "cut": 16, // ClipboardEvent
                "paste": 16, // ClipboardEvent

                "drag": 2, // DragEvent
                "dragend": 2, // DragEvent
                "dragenter": 2, // DragEvent
                "dragexit": 2, // DragEvent
                "dragleave": 2, // DragEvent
                "dragover": 2, // DragEvent
                "dragstart": 2, // DragEvent
                "drop": 2, // DragEvent

                "abort": 3, // Event
                "change": 3, // Event
                "error": 3, // Event
                "selectionchange": 3, // Event
                "submit": 3, // Event
                "reset": 3, // Event

                "focus": 4, // FocusEvent
                "blur": 4, // FocusEvent
                "focusin": 4, // FocusEvent
                "focusout": 4, // FocusEvent

                "keydown": 5, // KeyboardEvent
                "keypress": 5, // KeyboardEvent
                "keyup": 5, // KeyboardEvent

                "message": 6, // MessageEvent

                "click": 7, // MouseEvent
                "contextmenu": 7, // MouseEvent
                "dblclick": 7, // MouseEvent
                "mousedown": 7, // MouseEvent
                "mouseup": 7, // MouseEvent
                "mousemove": 7, // MouseEvent
                "mouseover": 7, // MouseEvent
                "mouseout": 7, // MouseEvent
                "mouseenter": 7, // MouseEvent
                "mouseleave": 7, // MouseEvent


                "textInput": 12, // TextEvent

                "touchstart": 13, // TouchEvent
                "touchmove": 13, // TouchEvent
                "touchend": 13, // TouchEvent

                "load": 14, // UIEvent
                "resize": 14, // UIEvent
                "select": 14, // UIEvent
                "scroll": 14, // UIEvent
                "unload": 14, // UIEvent,

                "wheel": 15 // WheelEvent
            };

        function getEventCtor(type) {
            var idx = NativeEvents[type];
            if (!idx) {
                idx = 0;
            }
            return EventCtors[idx];
        }

        return function(type, props) {
            //create a custom dom event

            if (langx.isString(type)) {
                props = props || {};
            } else {
                props = type || {};
                type = props.type || "";
            }
            var parsed = parse(type);
            type = parsed.type;

            props = langx.mixin({
                bubbles: true,
                cancelable: true
            }, props);

            if (parsed.ns) {
                props.namespace = parsed.ns;
            }

            var ctor = getEventCtor(type),
                e = new ctor(type, props);

            langx.safeMixin(e, props);

            return compatible(e);
        };
    })();

    function createProxy(src, props) {
        var key,
            proxy = {
                originalEvent: src
            };
        for (key in src) {
            if (key !== "keyIdentifier" && !ignoreProperties.test(key) && src[key] !== undefined) {
                proxy[key] = src[key];
            }
        }
        if (props) {
            langx.mixin(proxy, props);
        }
        return compatible(proxy, src);
    }

    var
        specialEvents = {},
        focusinSupported = "onfocusin" in window,
        focus = { focus: "focusin", blur: "focusout" },
        hover = { mouseenter: "mouseover", mouseleave: "mouseout" },
        realEvent = function(type) {
            return hover[type] || (focusinSupported && focus[type]) || type;
        },
        handlers = {},
        EventBindings = langx.klass({
            init: function(target, event) {
                this._target = target;
                this._event = event;
                this._bindings = [];
            },

            add: function(fn, options) {
                var bindings = this._bindings,
                    binding = {
                        fn: fn,
                        options: langx.mixin({}, options)
                    };

                bindings.push(binding);

                var self = this;
                if (!self._listener) {
                    self._listener = function(domEvt) {
                        var elm = this,
                            e = createProxy(domEvt),
                            args = domEvt._args,
                            bindings = self._bindings,
                            ns = e.namespace;

                        if (langx.isDefined(args)) {
                            args = [e].concat(args);
                        } else {
                            args = [e];
                        }

                        langx.each(bindings, function(idx, binding) {
                            var match = elm;
                            if (e.isImmediatePropagationStopped && e.isImmediatePropagationStopped()) {
                                return false;
                            }
                            var fn = binding.fn,
                                options = binding.options || {},
                                selector = options.selector,
                                one = options.one,
                                data = options.data;

                            if (ns && ns != options.ns && options.ns.indexOf(ns) === -1) {
                                return;
                            }
                            if (selector) {
                                match = finder.closest(e.target, selector);
                                if (match && match !== elm) {
                                    langx.mixin(e, {
                                        currentTarget: match,
                                        liveFired: elm
                                    });
                                } else {
                                    return;
                                }
                            }

                            var originalEvent = self._event;
                            if (originalEvent in hover) {
                                var related = e.relatedTarget;
                                if (related && (related === match || noder.contains(match, related))) {
                                    return;
                                }
                            }

                            if (langx.isDefined(data)) {
                                e.data = data;
                            }

                            if (one) {
                                self.remove(fn, options);
                            }

                            var result = fn.apply(match, args);

                            if (result === false) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        });;
                    };

                    var event = self._event;
                    /*
                                        if (event in hover) {
                                            var l = self._listener;
                                            self._listener = function(e) {
                                                var related = e.relatedTarget;
                                                if (!related || (related !== this && !noder.contains(this, related))) {
                                                    return l.apply(this, arguments);
                                                }
                                            }
                                        }
                    */

                    if (self._target.addEventListener) {
                        self._target.addEventListener(realEvent(event), self._listener, false);
                    } else {
                        console.warn("invalid eventer object", self._target);
                    }
                }

            },
            remove: function(fn, options) {
                options = langx.mixin({}, options);

                function matcherFor(ns) {
                    return new RegExp("(?:^| )" + ns.replace(" ", " .* ?") + "(?: |$)");
                }
                var matcher;
                if (options.ns) {
                    matcher = matcherFor(options.ns);
                }

                this._bindings = this._bindings.filter(function(binding) {
                    var removing = (!fn || fn === binding.fn) &&
                        (!matcher || matcher.test(binding.options.ns)) &&
                        (!options.selector || options.selector == binding.options.selector);

                    return !removing;
                });
                if (this._bindings.length == 0) {
                    if (this._target.removeEventListener) {
                        this._target.removeEventListener(realEvent(this._event), this._listener, false);
                    }
                    this._listener = null;
                }
            }
        }),
        EventsHandler = langx.klass({
            init: function(elm) {
                this._target = elm;
                this._handler = {};
            },

            // add a event listener
            // selector Optional
            register: function(event, callback, options) {
                // Seperate the event from the namespace
                var parsed = parse(event),
                    event = parsed.type,
                    specialEvent = specialEvents[event],
                    bindingEvent = specialEvent && (specialEvent.bindType || specialEvent.bindEventName);

                var events = this._handler;

                // Check if there is already a handler for this event
                if (events[event] === undefined) {
                    events[event] = new EventBindings(this._target, bindingEvent || event);
                }

                // Register the new callback function
                events[event].add(callback, langx.mixin({
                    ns: parsed.ns
                }, options)); // options:{selector:xxx}
            },

            // remove a event listener
            unregister: function(event, fn, options) {
                // Check for parameter validtiy
                var events = this._handler,
                    parsed = parse(event);
                event = parsed.type;

                if (event) {
                    var listener = events[event];

                    if (listener) {
                        listener.remove(fn, langx.mixin({
                            ns: parsed.ns
                        }, options));
                    }
                } else {
                    //remove all events
                    for (event in events) {
                        var listener = events[event];
                        listener.remove(fn, langx.mixin({
                            ns: parsed.ns
                        }, options));
                    }
                }
            }
        }),

        findHandler = function(elm) {
            var id = uid(elm),
                handler = handlers[id];
            if (!handler) {
                handler = handlers[id] = new EventsHandler(elm);
            }
            return handler;
        };

    /*   
     * Remove an event handler for one or more events from the specified element.
     * @param {HTMLElement} elm  
     * @param {String} events
     * @param {String　Optional } selector
     * @param {Function} callback
     */
    function off(elm, events, selector, callback) {
        var $this = this
        if (langx.isPlainObject(events)) {
            langx.each(events, function(type, fn) {
                off(elm, type, selector, fn);
            })
            return $this;
        }

        if (!langx.isString(selector) && !langx.isFunction(callback) && callback !== false) {
            callback = selector;
            selector = undefined;
        }

        if (callback === false) {
            callback = langx.returnFalse;
        }

        if (typeof events == "string") {
            if (events.indexOf(",") > -1) {
                events = events.split(",");
            } else {
                events = events.split(/\s/);
            }
        }

        var handler = findHandler(elm);

        if (events) events.forEach(function(event) {

            handler.unregister(event, callback, {
                selector: selector,
            });
        });
        return this;
    }

    /*   
     * Attach an event handler function for one or more events to the selected elements.
     * @param {HTMLElement} elm  
     * @param {String} events
     * @param {String　Optional} selector
     * @param {Anything Optional} data
     * @param {Function} callback
     * @param {Boolean　Optional} one
     */
    function on(elm, events, selector, data, callback, one) {

        var autoRemove, delegator;
        if (langx.isPlainObject(events)) {
            langx.each(events, function(type, fn) {
                on(elm, type, selector, data, fn, one);
            });
            return this;
        }

        if (!langx.isString(selector) && !langx.isFunction(callback)) {
            callback = data;
            data = selector;
            selector = undefined;
        }

        if (langx.isFunction(data)) {
            callback = data;
            data = undefined;
        }

        if (callback === false) {
            callback = langx.returnFalse;
        }

        if (typeof events == "string") {
            if (events.indexOf(",") > -1) {
                events = events.split(",");
            } else {
                events = events.split(/\s/);
            }
        }

        var handler = findHandler(elm);

        events.forEach(function(event) {
            if (event == "ready") {
                return ready(callback);
            }
            handler.register(event, callback, {
                data: data,
                selector: selector,
                one: !!one
            });
        });
        return this;
    }

    /*   
     * Attach a handler to an event for the elements. The handler is executed at most once per 
     * @param {HTMLElement} elm  
     * @param {String} event
     * @param {String　Optional} selector
     * @param {Anything Optional} data
     * @param {Function} callback
     */
    function one(elm, events, selector, data, callback) {
        on(elm, events, selector, data, callback, 1);

        return this;
    }

    /*   
     * Prevents propagation and clobbers the default action of the passed event. The same as calling event.preventDefault() and event.stopPropagation(). 
     * @param {String} event
     */
    function stop(event) {
        if (window.document.all) {
            event.keyCode = 0;
        }
        if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
        }
        return this;
    }
    /*   
     * Execute all handlers and behaviors attached to the matched elements for the given event  
     * @param {String} evented
     * @param {String} type
     * @param {Array or PlainObject } args
     */
    function trigger(evented, type, args) {
        var e;
        if (type instanceof Event) {
            e = type;
        } else {
            e = createEvent(type, args);
        }
        e._args = args;

        var fn = (evented.dispatchEvent || evented.trigger);
        if (fn) {
            fn.call(evented, e);
        } else {
            console.warn("The evented parameter is not a eventable object");
        }

        return this;
    }
    /*   
     * Specify a function to execute when the DOM is fully loaded.  
     * @param {Function} callback
     */
    function ready(callback) {
        // need to check if document.body exists for IE as that browser reports
        // document ready when it hasn't yet created the body elm
        if (readyRE.test(document.readyState) && document.body) {
            langx.defer(callback);
        } else {
            document.addEventListener('DOMContentLoaded', callback, false);
        }

        return this;
    }

    var keyCodeLookup = {
        "backspace": 8,
        "comma": 188,
        "delete": 46,
        "down": 40,
        "end": 35,
        "enter": 13,
        "escape": 27,
        "home": 36,
        "left": 37,
        "page_down": 34,
        "page_up": 33,
        "period": 190,
        "right": 39,
        "space": 32,
        "tab": 9,
        "up": 38
    };
    //example:
    //shortcuts(elm).add("CTRL+ALT+SHIFT+X",function(){console.log("test!")});
    function shortcuts(elm) {

        var registry = datax.data(elm, "shortcuts");
        if (!registry) {
            registry = {};
            datax.data(elm, "shortcuts", registry);
            var run = function(shortcut, event) {
                var n = event.metaKey || event.ctrlKey;
                if (shortcut.ctrl == n && shortcut.alt == event.altKey && shortcut.shift == event.shiftKey) {
                    if (event.keyCode == shortcut.keyCode || event.charCode && event.charCode == shortcut.charCode) {
                        event.preventDefault();
                        if ("keydown" == event.type) {
                            shortcut.fn(event);
                        }
                        return true;
                    }
                }
            };
            on(elm, "keyup keypress keydown", function(event) {
                if (!(/INPUT|TEXTAREA/.test(event.target.nodeName))) {
                    for (var key in registry) {
                        run(registry[key], event);
                    }
                }
            });

        }

        return {
            add: function(pattern, fn) {
                var shortcutKeys;
                if (pattern.indexOf(",") > -1) {
                    shortcutKeys = pattern.toLowerCase().split(",");
                } else {
                    shortcutKeys = pattern.toLowerCase().split(" ");
                }
                shortcutKeys.forEach(function(shortcutKey) {
                    var setting = {
                        fn: fn,
                        alt: false,
                        ctrl: false,
                        shift: false
                    };
                    shortcutKey.split("+").forEach(function(key) {
                        switch (key) {
                            case "alt":
                            case "ctrl":
                            case "shift":
                                setting[key] = true;
                                break;
                            default:
                                setting.charCode = key.charCodeAt(0);
                                setting.keyCode = keyCodeLookup[key] || key.toUpperCase().charCodeAt(0);
                        }
                    });
                    var regKey = (setting.ctrl ? "ctrl" : "") + "," + (setting.alt ? "alt" : "") + "," + (setting.shift ? "shift" : "") + "," + setting.keyCode;
                    registry[regKey] = setting;
                })
            }

        };

    }

    if (browser.support.transition) {
        specialEvents.transitionEnd = {
//          handle: function (e) {
//            if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
//          },
          bindType: browser.support.transition.end,
          delegateType: browser.support.transition.end
        }        
    }

    function eventer() {
        return eventer;
    }

    langx.mixin(eventer, {
        create: createEvent,

        keys: keyCodeLookup,

        off: off,

        on: on,

        one: one,

        proxy: createProxy,

        ready: ready,

        shortcuts: shortcuts,

        special: specialEvents,

        stop: stop,

        trigger: trigger

    });

    return dom.eventer = eventer;
});
define('skylark-utils-dom/geom',[
    "./dom",
    "./langx",
    "./noder",
    "./styler"
], function(dom, langx, noder, styler) {
    var rootNodeRE = /^(?:body|html)$/i,
        px = langx.toPixel,
        offsetParent = noder.offsetParent,
        cachedScrollbarWidth;

    function scrollbarWidth() {
        if (cachedScrollbarWidth !== undefined) {
            return cachedScrollbarWidth;
        }
        var w1, w2,
            div = noder.createFragment("<div style=" +
                "'display:block;position:absolute;width:200px;height:200px;overflow:hidden;'>" +
                "<div style='height:300px;width:auto;'></div></div>")[0],
            innerDiv = div.childNodes[0];

        noder.append(document.body, div);

        w1 = innerDiv.offsetWidth;

        styler.css(div, "overflow", "scroll");

        w2 = innerDiv.offsetWidth;

        if (w1 === w2) {
            w2 = div[0].clientWidth;
        }

        noder.remove(div);

        return (cachedScrollbarWidth = w1 - w2);
    }
    /*
     * Get the widths of each border of the specified element.
     * @param {HTMLElement} elm
     */
    function borderExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }        var s = getComputedStyle(elm);
        return {
            left: px(s.borderLeftWidth, elm),
            top: px(s.borderTopWidth, elm),
            right: px(s.borderRightWidth, elm),
            bottom: px(s.borderBottomWidth, elm)
        }
    }

    //viewport coordinate
    /*
     * Get or set the viewport position of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function boundingPosition(elm, coords) {
        if (coords === undefined) {
            return rootNodeRE.test(elm.nodeName) ? { top: 0, left: 0 } : elm.getBoundingClientRect();
        } else {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            relativePosition(elm, {
                top: coords.top - parentOffset.top - mex.top - pbex.top,
                left: coords.left - parentOffset.left - mex.left - pbex.left
            });
            return this;
        }
    }

    /*
     * Get or set the viewport rect of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function boundingRect(elm, coords) {
        if (coords === undefined) {
            return elm.getBoundingClientRect()
        } else {
            boundingPosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }

    /*
     * Get or set the height of the specified element client box.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function clientHeight(elm, value) {
        if (value == undefined) {
            return clientSize(elm).height;
        } else {
            return clientSize(elm, {
                height: value
            });
        }
    }

    /*
     * Get or set the size of the specified element client box.
     * @param {HTMLElement} elm
     * @param {PlainObject} dimension
     */
    function clientSize(elm, dimension) {
        if (dimension == undefined) {
            return {
                width: elm.clientWidth,
                height: elm.clientHeight
            }
        } else {
            var isBorderBox = (styler.css(elm, "box-sizing") === "border-box"),
                props = {
                    width: dimension.width,
                    height: dimension.height
                };
            if (!isBorderBox) {
                var pex = paddingExtents(elm);

                if (props.width !== undefined) {
                    props.width = props.width - pex.left - pex.right;
                }

                if (props.height !== undefined) {
                    props.height = props.height - pex.top - pex.bottom;
                }
            } else {
                var bex = borderExtents(elm);

                if (props.width !== undefined) {
                    props.width = props.width + bex.left + bex.right;
                }

                if (props.height !== undefined) {
                    props.height = props.height + bex.top + bex.bottom;
                }

            }
            styler.css(elm, props);
            return this;
        }
        return {
            width: elm.clientWidth,
            height: elm.clientHeight
        };
    }

    /*
     * Get or set the width of the specified element client box.
     * @param {HTMLElement} elm
     * @param {PlainObject} dimension
     */
    function clientWidth(elm, value) {
        if (value == undefined) {
            return clientSize(elm).width;
        } else {
            clientSize(elm, {
                width: value
            });
            return this;
        }
    }

    /*
     * Get the rect of the specified element content box.
     * @param {HTMLElement} elm
     */
    function contentRect(elm) {
        var cs = clientSize(elm),
            pex = paddingExtents(elm);


        //// On Opera, offsetLeft includes the parent's border
        //if(has("opera")){
        //    pe.l += be.l;
        //    pe.t += be.t;
        //}
        return {
            left: pex.left,
            top: pex.top,
            width: cs.width - pex.left - pex.right,
            height: cs.height - pex.top - pex.bottom
        };
    }

    /*
     * Get the document size.
     * @param {HTMLDocument} doc
     */
    function getDocumentSize(doc) {
        var documentElement = doc.documentElement,
            body = doc.body,
            max = Math.max,
            scrollWidth = max(documentElement.scrollWidth, body.scrollWidth),
            clientWidth = max(documentElement.clientWidth, body.clientWidth),
            offsetWidth = max(documentElement.offsetWidth, body.offsetWidth),
            scrollHeight = max(documentElement.scrollHeight, body.scrollHeight),
            clientHeight = max(documentElement.clientHeight, body.clientHeight),
            offsetHeight = max(documentElement.offsetHeight, body.offsetHeight);

        return {
            width: scrollWidth < offsetWidth ? clientWidth : scrollWidth,
            height: scrollHeight < offsetHeight ? clientHeight : scrollHeight
        };
    }

    /*
     * Get the document size.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function height(elm, value) {
        if (value == undefined) {
            return size(elm).height;
        } else {
            size(elm, {
                height: value
            });
            return this;
        }
    }

    /*
     * Get the widths of each margin of the specified element.
     * @param {HTMLElement} elm
     */
    function marginExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }
        var s = getComputedStyle(elm);
        return {
            left: px(s.marginLeft),
            top: px(s.marginTop),
            right: px(s.marginRight),
            bottom: px(s.marginBottom),
        }
    }


    function marginRect(elm) {
        var obj = relativeRect(elm),
            me = marginExtents(elm);

        return {
            left: obj.left,
            top: obj.top,
            width: obj.width + me.left + me.right,
            height: obj.height + me.top + me.bottom
        };
    }


    function marginSize(elm) {
        var obj = size(elm),
            me = marginExtents(elm);

        return {
            width: obj.width + me.left + me.right,
            height: obj.height + me.top + me.bottom
        };
    }

    /*
     * Get the widths of each padding of the specified element.
     * @param {HTMLElement} elm
     */
    function paddingExtents(elm) {
        if (noder.isWindow(elm)) {
            return {
                left : 0,
                top : 0,
                right : 0,
                bottom : 0
            }
        }
        var s = getComputedStyle(elm);
        return {
            left: px(s.paddingLeft),
            top: px(s.paddingTop),
            right: px(s.paddingRight),
            bottom: px(s.paddingBottom),
        }
    }

    /*
     * Get or set the document position of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    //coordinate to the document
    function pagePosition(elm, coords) {
        if (coords === undefined) {
            var obj = elm.getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset
            }
        } else {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                parentOffset = pagePosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            relativePosition(elm, {
                top: coords.top - parentOffset.top - mex.top - pbex.top,
                left: coords.left - parentOffset.left - mex.left - pbex.left
            });
            return this;
        }
    }

    /*
     * Get or set the document rect of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function pageRect(elm, coords) {
        if (coords === undefined) {
            var obj = elm.getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        } else {
            pagePosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }

    /*
     * Get or set the position of the specified element border box , relative to parent element.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    // coordinate relative to it's parent
    function relativePosition(elm, coords) {
        if (coords == undefined) {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                offset = boundingPosition(elm),
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            // Subtract parent offsets and element margins
            return {
                top: offset.top - parentOffset.top - pbex.top, // - mex.top,
                left: offset.left - parentOffset.left - pbex.left, // - mex.left
            }
        } else {
            var props = {
                top: coords.top,
                left: coords.left
            }

            if (styler.css(elm, "position") == "static") {
                props['position'] = "relative";
            }
            styler.css(elm, props);
            return this;
        }
    }

    /*
     * Get or set the rect of the specified element border box , relatived to parent element.
     * @param {HTMLElement} elm
     * @param {PlainObject} coords
     */
    function relativeRect(elm, coords) {
        if (coords === undefined) {
            var // Get *real* offsetParent
                parent = offsetParent(elm),
                // Get correct offsets
                offset = boundingRect(elm),
                parentOffset = boundingPosition(parent),
                mex = marginExtents(elm),
                pbex = borderExtents(parent);

            // Subtract parent offsets and element margins
            return {
                top: offset.top - parentOffset.top - pbex.top, // - mex.top,
                left: offset.left - parentOffset.left - pbex.left, // - mex.left,
                width: offset.width,
                height: offset.height
            }
        } else {
            relativePosition(elm, coords);
            size(elm, coords);
            return this;
        }
    }
    /*
     * Scroll the specified element into view.
     * @param {HTMLElement} elm
     * @param {} align
     */
    function scrollIntoView(elm, align) {
        function getOffset(elm, rootElm) {
            var x, y, parent = elm;

            x = y = 0;
            while (parent && parent != rootElm && parent.nodeType) {
                x += parent.offsetLeft || 0;
                y += parent.offsetTop || 0;
                parent = parent.offsetParent;
            }

            return { x: x, y: y };
        }

        var parentElm = elm.parentNode;
        var x, y, width, height, parentWidth, parentHeight;
        var pos = getOffset(elm, parentElm);

        x = pos.x;
        y = pos.y;
        width = elm.offsetWidth;
        height = elm.offsetHeight;
        parentWidth = parentElm.clientWidth;
        parentHeight = parentElm.clientHeight;

        if (align == "end") {
            x -= parentWidth - width;
            y -= parentHeight - height;
        } else if (align == "center") {
            x -= (parentWidth / 2) - (width / 2);
            y -= (parentHeight / 2) - (height / 2);
        }

        parentElm.scrollLeft = x;
        parentElm.scrollTop = y;

        return this;
    }
    /*
     * Get or set the current horizontal position of the scroll bar for the specified element.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function scrollLeft(elm, value) {
        var hasScrollLeft = "scrollLeft" in elm;
        if (value === undefined) {
            return hasScrollLeft ? elm.scrollLeft : elm.pageXOffset
        } else {
            if (hasScrollLeft) {
                elm.scrollLeft = value;
            } else {
                elm.scrollTo(value, elm.scrollY);
            }
            return this;
        }
    }
    /*
     * Get or the current vertical position of the scroll bar for the specified element.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function scrollTop(elm, value) {
        var hasScrollTop = "scrollTop" in elm;

        if (value === undefined) {
            return hasScrollTop ? elm.scrollTop : elm.pageYOffset
        } else {
            if (hasScrollTop) {
                elm.scrollTop = value;
            } else {
                elm.scrollTo(elm.scrollX, value);
            }
            return this;
        }
    }
    /*
     * Get or set the size of the specified element border box.
     * @param {HTMLElement} elm
     * @param {PlainObject}dimension
     */
    function size(elm, dimension) {
        if (dimension == undefined) {
            if (langx.isWindow(elm)) {
                return {
                    width: elm.innerWidth,
                    height: elm.innerHeight
                }

            } else if (langx.isDocument(elm)) {
                return getDocumentSize(document);
            } else {
                return {
                    width: elm.offsetWidth,
                    height: elm.offsetHeight
                }
            }
        } else {
            var isBorderBox = (styler.css(elm, "box-sizing") === "border-box"),
                props = {
                    width: dimension.width,
                    height: dimension.height
                };
            if (!isBorderBox) {
                var pex = paddingExtents(elm),
                    bex = borderExtents(elm);

                if (props.width !== undefined && props.width !== "" && props.width !== null) {
                    props.width = props.width - pex.left - pex.right - bex.left - bex.right;
                }

                if (props.height !== undefined && props.height !== "" && props.height !== null) {
                    props.height = props.height - pex.top - pex.bottom - bex.top - bex.bottom;
                }
            }
            styler.css(elm, props);
            return this;
        }
    }
    /*
     * Get or set the size of the specified element border box.
     * @param {HTMLElement} elm
     * @param {Number} value
     */
    function width(elm, value) {
        if (value == undefined) {
            return size(elm).width;
        } else {
            size(elm, {
                width: value
            });
            return this;
        }
    }

    function geom() {
        return geom;
    }

    langx.mixin(geom, {
        borderExtents: borderExtents,
        //viewport coordinate
        boundingPosition: boundingPosition,

        boundingRect: boundingRect,

        clientHeight: clientHeight,

        clientSize: clientSize,

        clientWidth: clientWidth,

        contentRect: contentRect,

        getDocumentSize: getDocumentSize,

        height: height,

        marginExtents: marginExtents,

        marginRect: marginRect,

        marginSize: marginSize,

        offsetParent: offsetParent,

        paddingExtents: paddingExtents,

        //coordinate to the document
        pagePosition: pagePosition,

        pageRect: pageRect,

        // coordinate relative to it's parent
        relativePosition: relativePosition,

        relativeRect: relativeRect,

        scrollbarWidth: scrollbarWidth,

        scrollIntoView: scrollIntoView,

        scrollLeft: scrollLeft,

        scrollTop: scrollTop,

        size: size,

        width: width
    });

    ( function() {
        var max = Math.max,
            abs = Math.abs,
            rhorizontal = /left|center|right/,
            rvertical = /top|center|bottom/,
            roffset = /[\+\-]\d+(\.[\d]+)?%?/,
            rposition = /^\w+/,
            rpercent = /%$/;

        function getOffsets( offsets, width, height ) {
            return [
                parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
                parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
            ];
        }

        function parseCss( element, property ) {
            return parseInt( styler.css( element, property ), 10 ) || 0;
        }

        function getDimensions( raw ) {
            if ( raw.nodeType === 9 ) {
                return {
                    size: size(raw),
                    offset: { top: 0, left: 0 }
                };
            }
            if ( noder.isWindow( raw ) ) {
                return {
                    size: size(raw),
                    offset: { 
                        top: scrollTop(raw), 
                        left: scrollLeft(raw) 
                    }
                };
            }
            if ( raw.preventDefault ) {
                return {
                    size : {
                        width: 0,
                        height: 0
                    },
                    offset: { 
                        top: raw.pageY, 
                        left: raw.pageX 
                    }
                };
            }
            return {
                size: size(raw),
                offset: pagePosition(raw)
            };
        }

        function getScrollInfo( within ) {
            var overflowX = within.isWindow || within.isDocument ? "" :
                    styler.css(within.element,"overflow-x" ),
                overflowY = within.isWindow || within.isDocument ? "" :
                    styler.css(within.element,"overflow-y" ),
                hasOverflowX = overflowX === "scroll" ||
                    ( overflowX === "auto" && within.width < scrollWidth(within.element) ),
                hasOverflowY = overflowY === "scroll" ||
                    ( overflowY === "auto" && within.height < scrollHeight(within.element));
            return {
                width: hasOverflowY ? scrollbarWidth() : 0,
                height: hasOverflowX ? scrollbarWidth() : 0
            };
        }

        function getWithinInfo( element ) {
            var withinElement = element || window,
                isWindow = noder.isWindow( withinElement),
                isDocument = !!withinElement && withinElement.nodeType === 9,
                hasOffset = !isWindow && !isDocument,
                msize = marginSize(withinElement);
            return {
                element: withinElement,
                isWindow: isWindow,
                isDocument: isDocument,
                offset: hasOffset ? pagePosition(element) : { left: 0, top: 0 },
                scrollLeft: scrollLeft(withinElement),
                scrollTop: scrollTop(withinElement),
                width: msize.width,
                height: msize.height
            };
        }

        function posit(elm,options ) {
            // Make a copy, we don't want to modify arguments
            options = langx.extend( {}, options );

            var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
                target = options.of,
                within = getWithinInfo( options.within ),
                scrollInfo = getScrollInfo( within ),
                collision = ( options.collision || "flip" ).split( " " ),
                offsets = {};

            dimensions = getDimensions( target );
            if ( target.preventDefault ) {

                // Force left top to allow flipping
                options.at = "left top";
            }
            targetWidth = dimensions.size.width;
            targetHeight = dimensions.size.height;
            targetOffset = dimensions.offset;

            // Clone to reuse original targetOffset later
            basePosition = langx.extend( {}, targetOffset );

            // Force my and at to have valid horizontal and vertical positions
            // if a value is missing or invalid, it will be converted to center
            langx.each( [ "my", "at" ], function() {
                var pos = ( options[ this ] || "" ).split( " " ),
                    horizontalOffset,
                    verticalOffset;

                if ( pos.length === 1 ) {
                    pos = rhorizontal.test( pos[ 0 ] ) ?
                        pos.concat( [ "center" ] ) :
                        rvertical.test( pos[ 0 ] ) ?
                            [ "center" ].concat( pos ) :
                            [ "center", "center" ];
                }
                pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
                pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

                // Calculate offsets
                horizontalOffset = roffset.exec( pos[ 0 ] );
                verticalOffset = roffset.exec( pos[ 1 ] );
                offsets[ this ] = [
                    horizontalOffset ? horizontalOffset[ 0 ] : 0,
                    verticalOffset ? verticalOffset[ 0 ] : 0
                ];

                // Reduce to just the positions without the offsets
                options[ this ] = [
                    rposition.exec( pos[ 0 ] )[ 0 ],
                    rposition.exec( pos[ 1 ] )[ 0 ]
                ];
            } );

            // Normalize collision option
            if ( collision.length === 1 ) {
                collision[ 1 ] = collision[ 0 ];
            }

            if ( options.at[ 0 ] === "right" ) {
                basePosition.left += targetWidth;
            } else if ( options.at[ 0 ] === "center" ) {
                basePosition.left += targetWidth / 2;
            }

            if ( options.at[ 1 ] === "bottom" ) {
                basePosition.top += targetHeight;
            } else if ( options.at[ 1 ] === "center" ) {
                basePosition.top += targetHeight / 2;
            }

            atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
            basePosition.left += atOffset[ 0 ];
            basePosition.top += atOffset[ 1 ];

            return ( function(elem) {
                var collisionPosition, using,
                    msize = marginSize(elem),
                    elemWidth = msize.width,
                    elemHeight = msize.height,
                    marginLeft = parseCss( elem, "marginLeft" ),
                    marginTop = parseCss( elem, "marginTop" ),
                    collisionWidth = elemWidth + marginLeft + parseCss( elem, "marginRight" ) +
                        scrollInfo.width,
                    collisionHeight = elemHeight + marginTop + parseCss( elem, "marginBottom" ) +
                        scrollInfo.height,
                    position = langx.extend( {}, basePosition ),
                    myOffset = getOffsets( offsets.my, msize.width, msize.height);

                if ( options.my[ 0 ] === "right" ) {
                    position.left -= elemWidth;
                } else if ( options.my[ 0 ] === "center" ) {
                    position.left -= elemWidth / 2;
                }

                if ( options.my[ 1 ] === "bottom" ) {
                    position.top -= elemHeight;
                } else if ( options.my[ 1 ] === "center" ) {
                    position.top -= elemHeight / 2;
                }

                position.left += myOffset[ 0 ];
                position.top += myOffset[ 1 ];

                collisionPosition = {
                    marginLeft: marginLeft,
                    marginTop: marginTop
                };

                langx.each( [ "left", "top" ], function( i, dir ) {
                    if ( positions[ collision[ i ] ] ) {
                        positions[ collision[ i ] ][ dir ]( position, {
                            targetWidth: targetWidth,
                            targetHeight: targetHeight,
                            elemWidth: elemWidth,
                            elemHeight: elemHeight,
                            collisionPosition: collisionPosition,
                            collisionWidth: collisionWidth,
                            collisionHeight: collisionHeight,
                            offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
                            my: options.my,
                            at: options.at,
                            within: within,
                            elem: elem
                        } );
                    }
                } );

                if ( options.using ) {

                    // Adds feedback as second argument to using callback, if present
                    using = function( props ) {
                        var left = targetOffset.left - position.left,
                            right = left + targetWidth - elemWidth,
                            top = targetOffset.top - position.top,
                            bottom = top + targetHeight - elemHeight,
                            feedback = {
                                target: {
                                    element: target,
                                    left: targetOffset.left,
                                    top: targetOffset.top,
                                    width: targetWidth,
                                    height: targetHeight
                                },
                                element: {
                                    element: elem,
                                    left: position.left,
                                    top: position.top,
                                    width: elemWidth,
                                    height: elemHeight
                                },
                                horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
                                vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
                            };
                        if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
                            feedback.horizontal = "center";
                        }
                        if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
                            feedback.vertical = "middle";
                        }
                        if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
                            feedback.important = "horizontal";
                        } else {
                            feedback.important = "vertical";
                        }
                        options.using.call( this, props, feedback );
                    };
                }

                pagePosition(elem, langx.extend( position, { using: using } ));
            })(elm);
        }

        var positions = {
            fit: {
                left: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
                        outerWidth = within.width,
                        collisionPosLeft = position.left - data.collisionPosition.marginLeft,
                        overLeft = withinOffset - collisionPosLeft,
                        overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
                        newOverRight;

                    // Element is wider than within
                    if ( data.collisionWidth > outerWidth ) {

                        // Element is initially over the left side of within
                        if ( overLeft > 0 && overRight <= 0 ) {
                            newOverRight = position.left + overLeft + data.collisionWidth - outerWidth -
                                withinOffset;
                            position.left += overLeft - newOverRight;

                        // Element is initially over right side of within
                        } else if ( overRight > 0 && overLeft <= 0 ) {
                            position.left = withinOffset;

                        // Element is initially over both left and right sides of within
                        } else {
                            if ( overLeft > overRight ) {
                                position.left = withinOffset + outerWidth - data.collisionWidth;
                            } else {
                                position.left = withinOffset;
                            }
                        }

                    // Too far left -> align with left edge
                    } else if ( overLeft > 0 ) {
                        position.left += overLeft;

                    // Too far right -> align with right edge
                    } else if ( overRight > 0 ) {
                        position.left -= overRight;

                    // Adjust based on position and margin
                    } else {
                        position.left = max( position.left - collisionPosLeft, position.left );
                    }
                },
                top: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
                        outerHeight = data.within.height,
                        collisionPosTop = position.top - data.collisionPosition.marginTop,
                        overTop = withinOffset - collisionPosTop,
                        overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
                        newOverBottom;

                    // Element is taller than within
                    if ( data.collisionHeight > outerHeight ) {

                        // Element is initially over the top of within
                        if ( overTop > 0 && overBottom <= 0 ) {
                            newOverBottom = position.top + overTop + data.collisionHeight - outerHeight -
                                withinOffset;
                            position.top += overTop - newOverBottom;

                        // Element is initially over bottom of within
                        } else if ( overBottom > 0 && overTop <= 0 ) {
                            position.top = withinOffset;

                        // Element is initially over both top and bottom of within
                        } else {
                            if ( overTop > overBottom ) {
                                position.top = withinOffset + outerHeight - data.collisionHeight;
                            } else {
                                position.top = withinOffset;
                            }
                        }

                    // Too far up -> align with top
                    } else if ( overTop > 0 ) {
                        position.top += overTop;

                    // Too far down -> align with bottom edge
                    } else if ( overBottom > 0 ) {
                        position.top -= overBottom;

                    // Adjust based on position and margin
                    } else {
                        position.top = max( position.top - collisionPosTop, position.top );
                    }
                }
            },
            flip: {
                left: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.offset.left + within.scrollLeft,
                        outerWidth = within.width,
                        offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
                        collisionPosLeft = position.left - data.collisionPosition.marginLeft,
                        overLeft = collisionPosLeft - offsetLeft,
                        overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
                        myOffset = data.my[ 0 ] === "left" ?
                            -data.elemWidth :
                            data.my[ 0 ] === "right" ?
                                data.elemWidth :
                                0,
                        atOffset = data.at[ 0 ] === "left" ?
                            data.targetWidth :
                            data.at[ 0 ] === "right" ?
                                -data.targetWidth :
                                0,
                        offset = -2 * data.offset[ 0 ],
                        newOverRight,
                        newOverLeft;

                    if ( overLeft < 0 ) {
                        newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth -
                            outerWidth - withinOffset;
                        if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
                            position.left += myOffset + atOffset + offset;
                        }
                    } else if ( overRight > 0 ) {
                        newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset +
                            atOffset + offset - offsetLeft;
                        if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
                            position.left += myOffset + atOffset + offset;
                        }
                    }
                },
                top: function( position, data ) {
                    var within = data.within,
                        withinOffset = within.offset.top + within.scrollTop,
                        outerHeight = within.height,
                        offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
                        collisionPosTop = position.top - data.collisionPosition.marginTop,
                        overTop = collisionPosTop - offsetTop,
                        overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
                        top = data.my[ 1 ] === "top",
                        myOffset = top ?
                            -data.elemHeight :
                            data.my[ 1 ] === "bottom" ?
                                data.elemHeight :
                                0,
                        atOffset = data.at[ 1 ] === "top" ?
                            data.targetHeight :
                            data.at[ 1 ] === "bottom" ?
                                -data.targetHeight :
                                0,
                        offset = -2 * data.offset[ 1 ],
                        newOverTop,
                        newOverBottom;
                    if ( overTop < 0 ) {
                        newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight -
                            outerHeight - withinOffset;
                        if ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) {
                            position.top += myOffset + atOffset + offset;
                        }
                    } else if ( overBottom > 0 ) {
                        newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset +
                            offset - offsetTop;
                        if ( newOverTop > 0 || abs( newOverTop ) < overBottom ) {
                            position.top += myOffset + atOffset + offset;
                        }
                    }
                }
            },
            flipfit: {
                left: function() {
                    positions.flip.left.apply( this, arguments );
                    positions.fit.left.apply( this, arguments );
                },
                top: function() {
                    positions.flip.top.apply( this, arguments );
                    positions.fit.top.apply( this, arguments );
                }
            }
        };

        geom.posit = posit;
    })();

    return dom.geom = geom;
});
define('skylark-utils-dom/fx',[
    "./dom",
    "./langx",
    "./browser",
    "./geom",
    "./styler",
    "./eventer"
], function(dom, langx, browser, geom, styler, eventer) {
    var animationName,
        animationDuration,
        animationTiming,
        animationDelay,
        transitionProperty,
        transitionDuration,
        transitionTiming,
        transitionDelay,

        animationEnd = browser.normalizeCssEvent('AnimationEnd'),
        transitionEnd = browser.normalizeCssEvent('TransitionEnd'),

        supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
        transform = browser.css3PropPrefix + "transform",
        cssReset = {};


    cssReset[animationName = browser.normalizeCssProperty("animation-name")] =
        cssReset[animationDuration = browser.normalizeCssProperty("animation-duration")] =
        cssReset[animationDelay = browser.normalizeCssProperty("animation-delay")] =
        cssReset[animationTiming = browser.normalizeCssProperty("animation-timing-function")] = "";

    cssReset[transitionProperty = browser.normalizeCssProperty("transition-property")] =
        cssReset[transitionDuration = browser.normalizeCssProperty("transition-duration")] =
        cssReset[transitionDelay = browser.normalizeCssProperty("transition-delay")] =
        cssReset[transitionTiming = browser.normalizeCssProperty("transition-timing-function")] = "";



    /*   
     * Perform a custom animation of a set of CSS properties.
     * @param {Object} elm  
     * @param {Number or String} properties
     * @param {String} ease
     * @param {Number or String} duration
     * @param {Function} callback
     * @param {Number or String} delay
     */
    function animate(elm, properties, duration, ease, callback, delay) {
        var key,
            cssValues = {},
            cssProperties = [],
            transforms = "",
            that = this,
            endEvent,
            wrappedCallback,
            fired = false,
            hasScrollTop = false,
            resetClipAuto = false;

        if (langx.isPlainObject(duration)) {
            ease = duration.easing;
            callback = duration.complete;
            delay = duration.delay;
            duration = duration.duration;
        }

        if (langx.isString(duration)) {
            duration = fx.speeds[duration];
        }
        if (duration === undefined) {
            duration = fx.speeds.normal;
        }
        duration = duration / 1000;
        if (fx.off) {
            duration = 0;
        }

        if (langx.isFunction(ease)) {
            callback = ease;
            eace = "swing";
        } else {
            ease = ease || "swing";
        }

        if (delay) {
            delay = delay / 1000;
        } else {
            delay = 0;
        }

        if (langx.isString(properties)) {
            // keyframe animation
            cssValues[animationName] = properties;
            cssValues[animationDuration] = duration + "s";
            cssValues[animationTiming] = ease;
            endEvent = animationEnd;
        } else {
            // CSS transitions
            for (key in properties) {
                var v = properties[key];
                if (supportedTransforms.test(key)) {
                    transforms += key + "(" + v + ") ";
                } else {
                    if (key === "scrollTop") {
                        hasScrollTop = true;
                    }
                    if (key == "clip" && langx.isPlainObject(v)) {
                        cssValues[key] = "rect(" + v.top+"px,"+ v.right +"px,"+ v.bottom +"px,"+ v.left+"px)";
                        if (styler.css(elm,"clip") == "auto") {
                            var size = geom.size(elm);
                            styler.css(elm,"clip","rect("+"0px,"+ size.width +"px,"+ size.height +"px,"+"0px)");  
                            resetClipAuto = true;
                        }

                    } else {
                        cssValues[key] = v;
                    }
                    cssProperties.push(langx.dasherize(key));
                }
            }
            endEvent = transitionEnd;
        }

        if (transforms) {
            cssValues[transform] = transforms;
            cssProperties.push(transform);
        }

        if (duration > 0 && langx.isPlainObject(properties)) {
            cssValues[transitionProperty] = cssProperties.join(", ");
            cssValues[transitionDuration] = duration + "s";
            cssValues[transitionDelay] = delay + "s";
            cssValues[transitionTiming] = ease;
        }

        wrappedCallback = function(event) {
            fired = true;
            if (event) {
                if (event.target !== event.currentTarget) {
                    return // makes sure the event didn't bubble from "below"
                }
                eventer.off(event.target, endEvent, wrappedCallback)
            } else {
                eventer.off(elm, animationEnd, wrappedCallback) // triggered by setTimeout
            }
            styler.css(elm, cssReset);
            if (resetClipAuto) {
 //               styler.css(elm,"clip","auto");
            }
            callback && callback.call(this);
        };

        if (duration > 0) {
            eventer.on(elm, endEvent, wrappedCallback);
            // transitionEnd is not always firing on older Android phones
            // so make sure it gets fired
            langx.debounce(function() {
                if (fired) {
                    return;
                }
                wrappedCallback.call(that);
            }, ((duration + delay) * 1000) + 25)();
        }

        // trigger page reflow so new elements can animate
        elm.clientLeft;

        styler.css(elm, cssValues);

        if (duration <= 0) {
            langx.debounce(function() {
                if (fired) {
                    return;
                }
                wrappedCallback.call(that);
            }, 0)();
        }

        if (hasScrollTop) {
            scrollToTop(elm, properties["scrollTop"], duration, callback);
        }

        return this;
    }

    /*   
     * Display an element.
     * @param {Object} elm  
     * @param {String} speed
     * @param {Function} callback
     */
    function show(elm, speed, callback) {
        styler.show(elm);
        if (speed) {
            if (!callback && langx.isFunction(speed)) {
                callback = speed;
                speed = "normal";
            }
            styler.css(elm, "opacity", 0)
            animate(elm, { opacity: 1, scale: "1,1" }, speed, callback);
        }
        return this;
    }


    /*   
     * Hide an element.
     * @param {Object} elm  
     * @param {String} speed
     * @param {Function} callback
     */
    function hide(elm, speed, callback) {
        if (speed) {
            if (!callback && langx.isFunction(speed)) {
                callback = speed;
                speed = "normal";
            }
            animate(elm, { opacity: 0, scale: "0,0" }, speed, function() {
                styler.hide(elm);
                if (callback) {
                    callback.call(elm);
                }
            });
        } else {
            styler.hide(elm);
        }
        return this;
    }

    /*   
     * Set the vertical position of the scroll bar for an element.
     * @param {Object} elm  
     * @param {Number or String} pos
     * @param {Number or String} speed
     * @param {Function} callback
     */
    function scrollToTop(elm, pos, speed, callback) {
        var scrollFrom = parseInt(elm.scrollTop),
            i = 0,
            runEvery = 5, // run every 5ms
            freq = speed * 1000 / runEvery,
            scrollTo = parseInt(pos);

        var interval = setInterval(function() {
            i++;

            if (i <= freq) elm.scrollTop = (scrollTo - scrollFrom) / freq * i + scrollFrom;

            if (i >= freq + 1) {
                clearInterval(interval);
                if (callback) langx.debounce(callback, 1000)();
            }
        }, runEvery);
    }

    /*   
     * Display or hide an element.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {Function} callback
     */
    function toggle(elm, speed, callback) {
        if (styler.isInvisible(elm)) {
            show(elm, speed, callback);
        } else {
            hide(elm, speed, callback);
        }
        return this;
    }

    /*   
     * Adjust the opacity of an element.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {Number or String} opacity
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeTo(elm, speed, opacity, easing, callback) {
        animate(elm, { opacity: opacity }, speed, easing, callback);
        return this;
    }


    /*   
     * Display an element by fading them to opaque.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeIn(elm, speed, easing, callback) {
        var target = styler.css(elm, "opacity");
        if (target > 0) {
            styler.css(elm, "opacity", 0);
        } else {
            target = 1;
        }
        styler.show(elm);

        fadeTo(elm, speed, target, easing, callback);

        return this;
    }

    /*   
     * Hide an element by fading them to transparent.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} easing
     * @param {Function} callback
     */
    function fadeOut(elm, speed, easing, callback) {
        var _elm = elm,
            complete,
            opacity = styler.css(elm,"opacity"),
            options = {};

        if (langx.isPlainObject(speed)) {
            options.easing = speed.easing;
            options.duration = speed.duration;
            complete = speed.complete;
        } else {
            options.duration = speed;
            if (callback) {
                complete = callback;
                options.easing = easing;
            } else {
                complete = easing;
            }
        }
        options.complete = function() {
            styler.css(elm,"opacity",opacity);
            styler.hide(elm);
            if (complete) {
                complete.call(elm);
            }
        }

        fadeTo(elm, options, 0);

        return this;
    }

    /*   
     * Display or hide an element by animating its opacity.
     * @param {Object} elm  
     * @param {Number or String} speed
     * @param {String} ceasing
     * @param {Function} callback
     */
    function fadeToggle(elm, speed, ceasing, allback) {
        if (styler.isInvisible(elm)) {
            fadeIn(elm, speed, easing, callback);
        } else {
            fadeOut(elm, speed, easing, callback);
        }
        return this;
    }

    /*   
     * Display an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideDown(elm, duration, callback) {

        // get the element position to restore it then
        var position = styler.css(elm, 'position');

        // show element if it is hidden
        show(elm);

        // place it so it displays as usually but hidden
        styler.css(elm, {
            position: 'absolute',
            visibility: 'hidden'
        });

        // get naturally height, margin, padding
        var marginTop = styler.css(elm, 'margin-top');
        var marginBottom = styler.css(elm, 'margin-bottom');
        var paddingTop = styler.css(elm, 'padding-top');
        var paddingBottom = styler.css(elm, 'padding-bottom');
        var height = styler.css(elm, 'height');

        // set initial css for animation
        styler.css(elm, {
            position: position,
            visibility: 'visible',
            overflow: 'hidden',
            height: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0
        });

        // animate to gotten height, margin and padding
        animate(elm, {
            height: height,
            marginTop: marginTop,
            marginBottom: marginBottom,
            paddingTop: paddingTop,
            paddingBottom: paddingBottom
        }, {
            duration: duration,
            complete: function() {
                if (callback) {
                    callback.apply(elm);
                }
            }
        });

        return this;
    };

    /*   
     * Hide an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideUp(elm, duration, callback) {
        // active the function only if the element is visible
        if (geom.height(elm) > 0) {

            // get the element position to restore it then
            var position = styler.css(elm, 'position');

            // get the element height, margin and padding to restore them then
            var height = styler.css(elm, 'height');
            var marginTop = styler.css(elm, 'margin-top');
            var marginBottom = styler.css(elm, 'margin-bottom');
            var paddingTop = styler.css(elm, 'padding-top');
            var paddingBottom = styler.css(elm, 'padding-bottom');

            // set initial css for animation
            styler.css(elm, {
                visibility: 'visible',
                overflow: 'hidden',
                height: height,
                marginTop: marginTop,
                marginBottom: marginBottom,
                paddingTop: paddingTop,
                paddingBottom: paddingBottom
            });

            // animate element height, margin and padding to zero
            animate(elm, {
                height: 0,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: 0,
                paddingBottom: 0
            }, {
                // callback : restore the element position, height, margin and padding to original values
                duration: duration,
                queue: false,
                complete: function() {
                    hide(elm);
                    styler.css(elm, {
                        visibility: 'visible',
                        overflow: 'hidden',
                        height: height,
                        marginTop: marginTop,
                        marginBottom: marginBottom,
                        paddingTop: paddingTop,
                        paddingBottom: paddingBottom
                    });
                    if (callback) {
                        callback.apply(elm);
                    }
                }
            });
        }
        return this;
    };


    /*   
     * Display or hide an element with a sliding motion.
     * @param {Object} elm  
     * @param {Number or String} duration
     * @param {Function} callback
     */
    function slideToggle(elm, duration, callback) {

        // if the element is hidden, slideDown !
        if (geom.height(elm) == 0) {
            slideDown(elm, duration, callback);
        }
        // if the element is visible, slideUp !
        else {
            slideUp(elm, duration, callback);
        }
        return this;
    };


    function fx() {
        return fx;
    }

    langx.mixin(fx, {
        off: false,

        speeds: {
            normal: 400,
            fast: 200,
            slow: 600
        },

        animate: animate,
        fadeIn: fadeIn,
        fadeOut: fadeOut,
        fadeTo: fadeTo,
        fadeToggle: fadeToggle,
        hide: hide,
        scrollToTop: scrollToTop,

        slideDown: slideDown,
        slideToggle: slideToggle,
        slideUp: slideUp,
        show: show,
        toggle: toggle
    });

    return dom.fx = fx;
});
define('skylark-utils-dom/query',[
    "./dom",
    "./langx",
    "./noder",
    "./datax",
    "./eventer",
    "./finder",
    "./geom",
    "./styler",
    "./fx"
], function(dom, langx, noder, datax, eventer, finder, geom, styler, fx) {
    var some = Array.prototype.some,
        push = Array.prototype.push,
        every = Array.prototype.every,
        concat = Array.prototype.concat,
        slice = Array.prototype.slice,
        map = Array.prototype.map,
        filter = Array.prototype.filter,
        forEach = Array.prototype.forEach,
        indexOf = Array.prototype.indexOf,
        sort = Array.prototype.sort,
        isQ;

    var rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/;

    var funcArg = langx.funcArg,
        isArrayLike = langx.isArrayLike,
        isString = langx.isString,
        uniq = langx.uniq,
        isFunction = langx.isFunction;

    var type = langx.type,
        isArray = langx.isArray,

        isWindow = langx.isWindow,

        isDocument = langx.isDocument,

        isObject = langx.isObject,

        isPlainObject = langx.isPlainObject,

        compact = langx.compact,

        flatten = langx.flatten,

        camelCase = langx.camelCase,

        dasherize = langx.dasherize,
        children = finder.children;

    function wrapper_map(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            var result = langx.map(self, function(elem, idx) {
                return func.apply(context, [elem].concat(params));
            });
            return query(uniq(result));
        }
    }

    function wrapper_selector(func, context, last) {
        return function(selector) {
            var self = this,
                params = slice.call(arguments);
            var result = this.map(function(idx, elem) {
                // if (elem.nodeType == 1) {
                if (elem.querySelector) {
                    return func.apply(context, last ? [elem] : [elem, selector]);
                }
            });
            if (last && selector) {
                return result.filter(selector);
            } else {
                return result;
            }
        }
    }

    function wrapper_selector_until(func, context, last) {
        return function(util, selector) {
            var self = this,
                params = slice.call(arguments);
            if (selector === undefined) {
                selector = util;
                util = undefined;
            }
            var result = this.map(function(idx, elem) {
                // if (elem.nodeType == 1) {
                if (elem.querySelector) {
                    return func.apply(context, last ? [elem, util] : [elem, selector, util]);
                }
            });
            if (last && selector) {
                return result.filter(selector);
            } else {
                return result;
            }
        }
    }


    function wrapper_every_act(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            this.each(function(idx) {
                func.apply(context, [this].concat(params));
            });
            return self;
        }
    }

    function wrapper_every_act_firstArgFunc(func, context, oldValueFunc) {
        return function(arg1) {
            var self = this,
                params = slice.call(arguments);
            forEach.call(self, function(elem, idx) {
                var newArg1 = funcArg(elem, arg1, idx, oldValueFunc(elem));
                func.apply(context, [elem, arg1].concat(params.slice(1)));
            });
            return self;
        }
    }

    function wrapper_some_chk(func, context) {
        return function() {
            var self = this,
                params = slice.call(arguments);
            return some.call(self, function(elem) {
                return func.apply(context, [elem].concat(params));
            });
        }
    }

    function wrapper_name_value(func, context, oldValueFunc) {
        return function(name, value) {
            var self = this,
                params = slice.call(arguments);

            if (langx.isPlainObject(name) || langx.isDefined(value)) {
                forEach.call(self, function(elem, idx) {
                    var newValue;
                    if (oldValueFunc) {
                        newValue = funcArg(elem, value, idx, oldValueFunc(elem, name));
                    } else {
                        newValue = value
                    }
                    func.apply(context, [elem].concat(params));
                });
                return self;
            } else {
                if (self[0]) {
                    return func.apply(context, [self[0], name]);
                }
            }

        }
    }

    function wrapper_value(func, context, oldValueFunc) {
        return function(value) {
            var self = this;

            if (langx.isDefined(value)) {
                forEach.call(self, function(elem, idx) {
                    var newValue;
                    if (oldValueFunc) {
                        newValue = funcArg(elem, value, idx, oldValueFunc(elem));
                    } else {
                        newValue = value
                    }
                    func.apply(context, [elem, newValue]);
                });
                return self;
            } else {
                if (self[0]) {
                    return func.apply(context, [self[0]]);
                }
            }

        }
    }

    var NodeList = langx.klass({
        klassName: "SkNodeList",
        init: function(selector, context) {
            var self = this,
                match, nodes, node, props;

            if (selector) {
                self.context = context = context || noder.doc();

                if (isString(selector)) {
                    // a html string or a css selector is expected
                    self.selector = selector;

                    if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
                        match = [null, selector, null];
                    } else {
                        match = rquickExpr.exec(selector);
                    }

                    if (match) {
                        if (match[1]) {
                            // if selector is html
                            nodes = noder.createFragment(selector);

                            if (langx.isPlainObject(context)) {
                                props = context;
                            }

                        } else {
                            node = finder.byId(match[2], noder.ownerDoc(context));

                            if (node) {
                                // if selector is id
                                nodes = [node];
                            }

                        }
                    } else {
                        // if selector is css selector
                        if (langx.isString(context)) {
                            context = finder.find(context);
                        }

                        nodes = finder.descendants(context, selector);
                    }
                } else {
                    if (isArray(selector)) {
                        // a dom node array is expected
                        nodes = selector;
                    } else {
                        // a dom node is expected
                        nodes = [selector];
                    }
                    //self.add(selector, false);
                }
            }


            if (nodes) {

                push.apply(self, nodes);

                if (props) {
                    for ( var name  in props ) {
                        // Properties of context are called as methods if possible
                        if ( langx.isFunction( this[ name ] ) ) {
                            this[ name ]( props[ name ] );
                        } else {
                            this.attr( name, props[ name ] );
                        }
                    }
                }
            }

            return self;
        }
    });

    var query = (function() {
        isQ = function(object) {
            return object instanceof NodeList;
        }
        init = function(selector, context) {
            return new NodeList(selector, context);
        }

        var $ = function(selector, context) {
            if (isFunction(selector)) {
                eventer.ready(function() {
                    selector($);
                });
            } else if (isQ(selector)) {
                return selector;
            } else {
                if (context && isQ(context) && isString(selector)) {
                    return context.find(selector);
                }
                return init(selector, context);
            }
        };

        $.fn = NodeList.prototype;
        langx.mixin($.fn, {
            // `map` and `slice` in the jQuery API work differently
            // from their array counterparts
            length : 0,

            map: function(fn) {
                return $(uniq(langx.map(this, function(el, i) {
                    return fn.call(el, i, el)
                })));
            },

            slice: function() {
                return $(slice.apply(this, arguments))
            },

            forEach: function() {
                return forEach.apply(this,arguments);
            },

            get: function(idx) {
                return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
            },

            indexOf: function() {
                return indexOf.apply(this,arguments);
            },

            sort : function() {
                return sort.apply(this,arguments);
            },

            toArray: function() {
                return slice.call(this);
            },

            size: function() {
                return this.length
            },

            remove: wrapper_every_act(noder.remove, noder),

            each: function(callback) {
                langx.each(this, callback);
                return this;
            },

            filter: function(selector) {
                if (isFunction(selector)) return this.not(this.not(selector))
                return $(filter.call(this, function(element) {
                    return finder.matches(element, selector)
                }))
            },

            add: function(selector, context) {
                return $(uniq(this.toArray().concat($(selector, context).toArray())));
            },

            is: function(selector) {
                if (this.length > 0) {
                    var self = this;
                    if (langx.isString(selector)) {
                        return some.call(self,function(elem) {
                            return finder.matches(elem, selector);
                        });
                    } else if (langx.isArrayLike(selector)) {
                       return some.call(self,function(elem) {
                            return langx.inArray(elem, selector) > -1;
                        });
                    } else if (langx.isHtmlNode(selector)) {
                       return some.call(self,function(elem) {
                            return elem ==  selector;
                        });
                    }
                }
                return false;
            },
            
            not: function(selector) {
                var nodes = []
                if (isFunction(selector) && selector.call !== undefined)
                    this.each(function(idx) {
                        if (!selector.call(this, idx)) nodes.push(this)
                    })
                else {
                    var excludes = typeof selector == 'string' ? this.filter(selector) :
                        (isArrayLike(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                    this.forEach(function(el) {
                        if (excludes.indexOf(el) < 0) nodes.push(el)
                    })
                }
                return $(nodes)
            },

            has: function(selector) {
                return this.filter(function() {
                    return isObject(selector) ?
                        noder.contains(this, selector) :
                        $(this).find(selector).size()
                })
            },

            eq: function(idx) {
                return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
            },

            first: function() {
                return this.eq(0);
            },

            last: function() {
                return this.eq(-1);
            },

            find: wrapper_selector(finder.descendants, finder),

            closest: wrapper_selector(finder.closest, finder),
            /*
                        closest: function(selector, context) {
                            var node = this[0],
                                collection = false
                            if (typeof selector == 'object') collection = $(selector)
                            while (node && !(collection ? collection.indexOf(node) >= 0 : finder.matches(node, selector)))
                                node = node !== context && !isDocument(node) && node.parentNode
                            return $(node)
                        },
            */


            parents: wrapper_selector(finder.ancestors, finder),

            parentsUntil: wrapper_selector_until(finder.ancestors, finder),


            parent: wrapper_selector(finder.parent, finder),

            children: wrapper_selector(finder.children, finder),

            contents: wrapper_map(noder.contents, noder),

            empty: wrapper_every_act(noder.empty, noder),

            // `pluck` is borrowed from Prototype.js
            pluck: function(property) {
                return langx.map(this, function(el) {
                    return el[property]
                })
            },

            pushStack : function(elms) {
                var ret = $(elms);
                ret.prevObject = this;
                return ret;
            },
            
            show: wrapper_every_act(fx.show, fx),

            replaceWith: function(newContent) {
                return this.before(newContent).remove();
            },

            wrap: function(structure) {
                var func = isFunction(structure)
                if (this[0] && !func)
                    var dom = $(structure).get(0),
                        clone = dom.parentNode || this.length > 1

                return this.each(function(index) {
                    $(this).wrapAll(
                        func ? structure.call(this, index) :
                        clone ? dom.cloneNode(true) : dom
                    )
                })
            },

            wrapAll: function(wrappingElement) {
                if (this[0]) {
                    $(this[0]).before(wrappingElement = $(wrappingElement));
                    var children;
                    // drill down to the inmost element
                    while ((children = wrappingElement.children()).length) {
                        wrappingElement = children.first();
                    }
                    $(wrappingElement).append(this);
                }
                return this
            },

            wrapInner: function(wrappingElement) {
                var func = isFunction(wrappingElement)
                return this.each(function(index) {
                    var self = $(this),
                        contents = self.contents(),
                        dom = func ? wrappingElement.call(this, index) : wrappingElement
                    contents.length ? contents.wrapAll(dom) : self.append(dom)
                })
            },

            unwrap: function(selector) {
                if (this.parent().children().length === 0) {
                    // remove dom without text
                    this.parent(selector).not("body").each(function() {
                        $(this).replaceWith(document.createTextNode(this.childNodes[0].textContent));
                    });
                } else {
                    this.parent().each(function() {
                        $(this).replaceWith($(this).children())
                    });
                }
                return this
            },

            clone: function() {
                return this.map(function() {
                    return this.cloneNode(true)
                })
            },

            hide: wrapper_every_act(fx.hide, fx),

            toggle: function(setting) {
                return this.each(function() {
                    var el = $(this);
                    (setting === undefined ? el.css("display") == "none" : setting) ? el.show(): el.hide()
                })
            },

            prev: function(selector) {
                return $(this.pluck('previousElementSibling')).filter(selector || '*')
            },

            prevAll: wrapper_selector(finder.previousSibling, finder),

            next: function(selector) {
                return $(this.pluck('nextElementSibling')).filter(selector || '*')
            },

            nextAll: wrapper_selector(finder.nextSiblings, finder),

            siblings: wrapper_selector(finder.siblings, finder),

            html: wrapper_value(noder.html, noder, noder.html),

            text: wrapper_value(datax.text, datax, datax.text),

            attr: wrapper_name_value(datax.attr, datax, datax.attr),

            removeAttr: wrapper_every_act(datax.removeAttr, datax),

            prop: wrapper_name_value(datax.prop, datax, datax.prop),

            removeProp: wrapper_every_act(datax.removeProp, datax),

            data: wrapper_name_value(datax.data, datax, datax.data),

            removeData: wrapper_every_act(datax.removeData, datax),

            val: wrapper_value(datax.val, datax, datax.val),

            offset: wrapper_value(geom.pagePosition, geom, geom.pagePosition),

            style: wrapper_name_value(styler.css, styler),

            css: wrapper_name_value(styler.css, styler),

            index: function(elem) {
                if (elem) {
                    return this.indexOf($(elem)[0]);
                } else {
                    return this.parent().children().indexOf(this[0]);
                }
            },

            //hasClass(name)
            hasClass: wrapper_some_chk(styler.hasClass, styler),

            //addClass(name)
            addClass: wrapper_every_act_firstArgFunc(styler.addClass, styler, styler.className),

            //removeClass(name)
            removeClass: wrapper_every_act_firstArgFunc(styler.removeClass, styler, styler.className),

            //toogleClass(name,when)
            toggleClass: wrapper_every_act_firstArgFunc(styler.toggleClass, styler, styler.className),

            scrollTop: wrapper_value(geom.scrollTop, geom),

            scrollLeft: wrapper_value(geom.scrollLeft, geom),

            position: function(options) {
                if (!this.length) return

                if (options) {
                    if (options.of && options.of.length) {
                        options = langx.clone(options);
                        options.of = options.of[0];
                    }
                    return this.each( function() {
                        geom.posit(this,options);
                    });
                } else {
                    var elem = this[0];

                    return geom.relativePosition(elem);

                }             
            },

            offsetParent: wrapper_map(geom.offsetParent, geom)
        });

        // for now
        $.fn.detach = $.fn.remove;

        $.fn.hover = function(fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
        };

        $.fn.size = wrapper_value(geom.size, geom);

        $.fn.width = wrapper_value(geom.width, geom, geom.width);

        $.fn.height = wrapper_value(geom.height, geom, geom.height);

        $.fn.clientSize = wrapper_value(geom.clientSize, geom.clientSize);

        ['width', 'height'].forEach(function(dimension) {
            var offset, Dimension = dimension.replace(/./, function(m) {
                return m[0].toUpperCase()
            });

            $.fn['outer' + Dimension] = function(margin, value) {
                if (arguments.length) {
                    if (typeof margin !== 'boolean') {
                        value = margin;
                        margin = false;
                    }
                } else {
                    margin = false;
                    value = undefined;
                }

                if (value === undefined) {
                    var el = this[0];
                    if (!el) {
                        return undefined;
                    }
                    var cb = geom.size(el);
                    if (margin) {
                        var me = geom.marginExtents(el);
                        cb.width = cb.width + me.left + me.right;
                        cb.height = cb.height + me.top + me.bottom;
                    }
                    return dimension === "width" ? cb.width : cb.height;
                } else {
                    return this.each(function(idx, el) {
                        var mb = {};
                        var me = geom.marginExtents(el);
                        if (dimension === "width") {
                            mb.width = value;
                            if (margin) {
                                mb.width = mb.width - me.left - me.right
                            }
                        } else {
                            mb.height = value;
                            if (margin) {
                                mb.height = mb.height - me.top - me.bottom;
                            }
                        }
                        geom.size(el, mb);
                    })

                }
            };
        })

        $.fn.innerWidth = wrapper_value(geom.clientWidth, geom, geom.clientWidth);

        $.fn.innerHeight = wrapper_value(geom.clientHeight, geom, geom.clientHeight);

        var traverseNode = noder.traverse;

        function wrapper_node_operation(func, context, oldValueFunc) {
            return function(html) {
                var argType, nodes = langx.map(arguments, function(arg) {
                    argType = type(arg)
                    return argType == "object" || argType == "array" || arg == null ?
                        arg : noder.createFragment(arg)
                });
                if (nodes.length < 1) {
                    return this
                }
                this.each(function(idx) {
                    func.apply(context, [this, nodes, idx > 0]);
                });
                return this;
            }
        }


        $.fn.after = wrapper_node_operation(noder.after, noder);

        $.fn.prepend = wrapper_node_operation(noder.prepend, noder);

        $.fn.before = wrapper_node_operation(noder.before, noder);

        $.fn.append = wrapper_node_operation(noder.append, noder);


        langx.each( {
            appendTo: "append",
            prependTo: "prepend",
            insertBefore: "before",
            insertAfter: "after",
            replaceAll: "replaceWith"
        }, function( name, original ) {
            $.fn[ name ] = function( selector ) {
                var elems,
                    ret = [],
                    insert = $( selector ),
                    last = insert.length - 1,
                    i = 0;

                for ( ; i <= last; i++ ) {
                    elems = i === last ? this : this.clone( true );
                    $( insert[ i ] )[ original ]( elems );

                    // Support: Android <=4.0 only, PhantomJS 1 only
                    // .get() because push.apply(_, arraylike) throws on ancient WebKit
                    push.apply( ret, elems.get() );
                }

                return this.pushStack( ret );
            };
        } );

/*
        $.fn.insertAfter = function(html) {
            $(html).after(this);
            return this;
        };

        $.fn.insertBefore = function(html) {
            $(html).before(this);
            return this;
        };

        $.fn.appendTo = function(html) {
            $(html).append(this);
            return this;
        };

        $.fn.prependTo = function(html) {
            $(html).prepend(this);
            return this;
        };

        $.fn.replaceAll = function(selector) {
            $(selector).replaceWith(this);
            return this;
        };
*/
        return $;
    })();

    (function($) {
        $.fn.on = wrapper_every_act(eventer.on, eventer);

        $.fn.off = wrapper_every_act(eventer.off, eventer);

        $.fn.trigger = wrapper_every_act(eventer.trigger, eventer);

        ('focusin focusout focus blur load resize scroll unload click dblclick ' +
            'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
            'change select keydown keypress keyup error transitionEnd').split(' ').forEach(function(event) {
            $.fn[event] = function(data, callback) {
                return (0 in arguments) ?
                    this.on(event, data, callback) :
                    this.trigger(event)
            }
        });

        $.fn.one = function(event, selector, data, callback) {
            if (!langx.isString(selector) && !langx.isFunction(callback)) {
                callback = data;
                data = selector;
                selector = null;
            }

            if (langx.isFunction(data)) {
                callback = data;
                data = null;
            }

            return this.on(event, selector, data, callback, 1)
        };

        $.fn.animate = wrapper_every_act(fx.animate, fx);

        $.fn.show = wrapper_every_act(fx.show, fx);
        $.fn.hide = wrapper_every_act(fx.hide, fx);
        $.fn.toogle = wrapper_every_act(fx.toogle, fx);
        $.fn.fadeTo = wrapper_every_act(fx.fadeTo, fx);
        $.fn.fadeIn = wrapper_every_act(fx.fadeIn, fx);
        $.fn.fadeOut = wrapper_every_act(fx.fadeOut, fx);
        $.fn.fadeToggle = wrapper_every_act(fx.fadeToggle, fx);

        $.fn.slideDown = wrapper_every_act(fx.slideDown, fx);
        $.fn.slideToggle = wrapper_every_act(fx.slideToggle, fx);
        $.fn.slideUp = wrapper_every_act(fx.slideUp, fx);

        $.fn.scrollParent = function( includeHidden ) {
            var position = this.css( "position" ),
                excludeStaticParent = position === "absolute",
                overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
                scrollParent = this.parents().filter( function() {
                    var parent = $( this );
                    if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
                        return false;
                    }
                    return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
                        parent.css( "overflow-x" ) );
                } ).eq( 0 );

            return position === "fixed" || !scrollParent.length ?
                $( this[ 0 ].ownerDocument || document ) :
                scrollParent;
        };
    })(query);


    (function($) {
        $.fn.end = function() {
            return this.prevObject || $()
        }

        $.fn.andSelf = function() {
            return this.add(this.prevObject || $())
        }

        $.fn.addBack = function(selector) {
            if (this.prevObject) {
                if (selector) {
                    return this.add(this.prevObject.filter(selector));
                } else {
                    return this.add(this.prevObject);
                }
            } else {
                return this;
            }
        }

        'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function(property) {
            var fn = $.fn[property]
            $.fn[property] = function() {
                var ret = fn.apply(this, arguments)
                ret.prevObject = this
                return ret
            }
        })
    })(query);


    (function($) {
        $.fn.query = $.fn.find;

        $.fn.place = function(refNode, position) {
            // summary:
            //      places elements of this node list relative to the first element matched
            //      by queryOrNode. Returns the original NodeList. See: `dojo/dom-construct.place`
            // queryOrNode:
            //      may be a string representing any valid CSS3 selector or a DOM node.
            //      In the selector case, only the first matching element will be used
            //      for relative positioning.
            // position:
            //      can be one of:
            //
            //      -   "last" (default)
            //      -   "first"
            //      -   "before"
            //      -   "after"
            //      -   "only"
            //      -   "replace"
            //
            //      or an offset in the childNodes
            if (langx.isString(refNode)) {
                refNode = finder.descendant(refNode);
            } else if (isQ(refNode)) {
                refNode = refNode[0];
            }
            return this.each(function(i, node) {
                switch (position) {
                    case "before":
                        noder.before(refNode, node);
                        break;
                    case "after":
                        noder.after(refNode, node);
                        break;
                    case "replace":
                        noder.replace(refNode, node);
                        break;
                    case "only":
                        noder.empty(refNode);
                        noder.append(refNode, node);
                        break;
                    case "first":
                        noder.prepend(refNode, node);
                        break;
                        // else fallthrough...
                    default: // aka: last
                        noder.append(refNode, node);
                }
            });
        };

        $.fn.addContent = function(content, position) {
            if (content.template) {
                content = langx.substitute(content.template, content);
            }
            return this.append(content);
        };

        $.fn.replaceClass = function(newClass, oldClass) {
            this.removeClass(oldClass);
            this.addClass(newClass);
            return this;
        };

        $.fn.replaceClass = function(newClass, oldClass) {
            this.removeClass(oldClass);
            this.addClass(newClass);
            return this;
        };

        $.fn.disableSelection = ( function() {
            var eventType = "onselectstart" in document.createElement( "div" ) ?
                "selectstart" :
                "mousedown";

            return function() {
                return this.on( eventType + ".ui-disableSelection", function( event ) {
                    event.preventDefault();
                } );
            };
        } )();

        $.fn.enableSelection = function() {
            return this.off( ".ui-disableSelection" );
        };
       

    })(query);

    query.fn.plugin = function(name,options) {
        var args = slice.call( arguments, 1 ),
            self = this,
            returnValue = this;

        this.each(function(){
            returnValue = plugins.instantiate.apply(self,[this,name].concat(args));
        });
        return returnValue;
    };

    return dom.query = query;

});
define('skylark-fuelux/fuelux',[
  "skylark-langx/skylark",
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query"
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
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.checkbox;

	// CHECKBOX CONSTRUCTOR AND PROTOTYPE

	var logError = function logError (error) {
		if (window && window.console && window.console.error) {
			window.console.error(error);
		}
	};


	var Checkbox = fuelux.Checkbox = fuelux.WidgetBase.inherit({
		klassName: "Checkbox",

		init : function(element,options) {
			this.options = langx.mixin({}, $.fn.checkbox.defaults, options);
			var $element = $(element);

			if (element.tagName.toLowerCase() !== 'label') {
				logError('Checkbox must be initialized on the `label` that wraps the `input` element. See https://github.com/ExactTarget/fuelux/blob/master/reference/markup/checkbox.html for example of proper markup. Call `.checkbox()` on the `<label>` not the `<input>`');
				return;
			}

			// cache elements
			this.$label = $element;
			this.$chk = this.$label.find('input[type="checkbox"]');
			this.$container = $element.parent('.checkbox'); // the container div

			if (!this.options.ignoreVisibilityCheck && this.$chk.css('visibility').match(/hidden|collapse/)) {
				logError('For accessibility reasons, in order for tab and space to function on checkbox, checkbox `<input />`\'s `visibility` must not be set to `hidden` or `collapse`. See https://github.com/ExactTarget/fuelux/pull/1996 for more details.');
			}

			// determine if a toggle container is specified
			var containerSelector = this.$chk.attr('data-toggle');
			this.$toggleContainer = $(containerSelector);

			// handle internal events
			this.$chk.on('change', langx.proxy(this.itemchecked, this));

			// set default state
			this.setInitialState();
		},

		setInitialState: function setInitialState () {
			var $chk = this.$chk;

			// get current state of input
			var checked = $chk.prop('checked');
			var disabled = $chk.prop('disabled');

			// sync label class with input state
			this.setCheckedState($chk, checked);
			this.setDisabledState($chk, disabled);
		},

		setCheckedState: function setCheckedState (element, checked) {
			var $chk = element;
			var $lbl = this.$label;
			var $containerToggle = this.$toggleContainer;

			if (checked) {
				$chk.prop('checked', true);
				$lbl.addClass('checked');
				$containerToggle.removeClass('hide hidden');
				$lbl.trigger('checked.fu.checkbox');
			} else {
				$chk.prop('checked', false);
				$lbl.removeClass('checked');
				$containerToggle.addClass('hidden');
				$lbl.trigger('unchecked.fu.checkbox');
			}

			$lbl.trigger('changed.fu.checkbox', checked);
		},

		setDisabledState: function setDisabledState (element, disabled) {
			var $chk = $(element);
			var $lbl = this.$label;

			if (disabled) {
				$chk.prop('disabled', true);
				$lbl.addClass('disabled');
				$lbl.trigger('disabled.fu.checkbox');
			} else {
				$chk.prop('disabled', false);
				$lbl.removeClass('disabled');
				$lbl.trigger('enabled.fu.checkbox');
			}

			return $chk;
		},

		itemchecked: function itemchecked (evt) {
			var $chk = $(evt.target);
			var checked = $chk.prop('checked');

			this.setCheckedState($chk, checked);
		},

		toggle: function toggle () {
			var checked = this.isChecked();

			if (checked) {
				this.uncheck();
			} else {
				this.check();
			}
		},

		check: function check () {
			this.setCheckedState(this.$chk, true);
		},

		uncheck: function uncheck () {
			this.setCheckedState(this.$chk, false);
		},

		isChecked: function isChecked () {
			var checked = this.$chk.prop('checked');
			return checked;
		},

		enable: function enable () {
			this.setDisabledState(this.$chk, false);
		},

		disable: function disable () {
			this.setDisabledState(this.$chk, true);
		},

		destroy: function destroy () {
			this.$label.remove();
			return this.$label[0].outerHTML;
		}
	});



	Checkbox.prototype.getValue = Checkbox.prototype.isChecked;

	// CHECKBOX PLUGIN DEFINITION

	$.fn.checkbox = function checkbox (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function applyData () {
			var $this = $(this);
			var data = $this.data('fu.checkbox');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.checkbox', (data = new Checkbox(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.checkbox.defaults = {
		ignoreVisibilityCheck: false
	};

	$.fn.checkbox.Constructor = Checkbox;

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
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.combobox;


	// COMBOBOX CONSTRUCTOR AND PROTOTYPE

	var Combobox = fuelux.Combobox = fuelux.WidgetBase.inherit({
		klassName: "Combobox",

		init : function(element,options) {
			this.$element = $(element);
			this.options = langx.mixin({}, $.fn.combobox.defaults, options);

			this.$dropMenu = this.$element.find('.dropdown-menu');
			this.$input = this.$element.find('input');
			this.$button = this.$element.find('.btn');
			this.$button.dropdown();
			this.$inputGroupBtn = this.$element.find('.input-group-btn');

			this.$element.on('click.fu.combobox', 'a', langx.proxy(this.itemclicked, this));
			this.$element.on('change.fu.combobox', 'input', langx.proxy(this.inputchanged, this));
			this.$element.on('shown.bs.dropdown', langx.proxy(this.menuShown, this));
			this.$input.on('keyup.fu.combobox', langx.proxy(this.keypress, this));

			// set default selection
			this.setDefaultSelection();

			// if dropdown is empty, disable it
			var items = this.$dropMenu.children('li');
			if( items.length === 0) {
				this.$button.addClass('disabled');
			}

			// filter on load in case the first thing they do is press navigational key to pop open the menu
			if (this.options.filterOnKeypress) {
				this.options.filter(this.$dropMenu.find('li'), this.$input.val(), this);
			}
		},

		destroy: function () {
			this.$element.remove();
			// remove any external bindings
			// [none]

			// set input value attrbute in markup
			this.$element.find('input').each(function () {
				$(this).attr('value', $(this).val());
			});

			// empty elements to return to original markup
			// [none]

			return this.$element[0].outerHTML;
		},

		doSelect: function ($item) {

			if (typeof $item[0] !== 'undefined') {
				// remove selection from old item, may result in remove and
				// re-addition of class if item is the same
				this.$element.find('li.selected:first').removeClass('selected');

				// add selection to new item
				this.$selectedItem = $item;
				this.$selectedItem.addClass('selected');

				// update input
				this.$input.val(this.$selectedItem.text().trim());
			} else {
				// this is a custom input, not in the menu
				this.$selectedItem = null;
				this.$element.find('li.selected:first').removeClass('selected');
			}
		},

		clearSelection: function () {
			this.$selectedItem = null;
			this.$input.val('');
			this.$dropMenu.find('li').removeClass('selected');
		},

		menuShown: function () {
			if (this.options.autoResizeMenu) {
				this.resizeMenu();
			}
		},

		resizeMenu: function () {
			var width = this.$element.outerWidth();
			this.$dropMenu.outerWidth(width);
		},

		selectedItem: function () {
			var item = this.$selectedItem;
			var data = {};

			if (item) {
				var txt = this.$selectedItem.text().trim();
				data = langx.mixin({
					text: txt
				}, this.$selectedItem.data());
			} else {
				data = {
					text: this.$input.val().trim(),
					notFound: true
				};
			}

			return data;
		},

		selectByText: function (text) {
			var $item = $([]);
			this.$element.find('li').each(function () {
				if ((this.textContent || this.innerText || $(this).text() || '').trim().toLowerCase() === (text || '').trim().toLowerCase()) {
					$item = $(this);
					return false;
				}
			});

			this.doSelect($item);
		},

		selectByValue: function (value) {
			var selector = 'li[data-value="' + value + '"]';
			this.selectBySelector(selector);
		},

		selectByIndex: function (index) {
			// zero-based index
			var selector = 'li:eq(' + index + ')';
			this.selectBySelector(selector);
		},

		selectBySelector: function (selector) {
			var $item = this.$element.find(selector);
			this.doSelect($item);
		},

		setDefaultSelection: function () {
			var selector = 'li[data-selected=true]:first';
			var item = this.$element.find(selector);

			if (item.length > 0) {
				// select by data-attribute
				this.selectBySelector(selector);
				item.removeData('selected');
				item.removeAttr('data-selected');
			}
		},

		enable: function () {
			this.$element.removeClass('disabled');
			this.$input.removeAttr('disabled');
			this.$button.removeClass('disabled');
		},

		disable: function () {
			this.$element.addClass('disabled');
			this.$input.attr('disabled', true);
			this.$button.addClass('disabled');
		},

		itemclicked: function (e) {
			this.$selectedItem = $(e.target).parent();

			// set input text and trigger input change event marked as synthetic
			this.$input.val(this.$selectedItem.text().trim()).trigger('change', {
				synthetic: true
			});

			// pass object including text and any data-attributes
			// to onchange event
			var data = this.selectedItem();

			// trigger changed event
			this.$element.trigger('changed.fu.combobox', data);

			e.preventDefault();

			// return focus to control after selecting an option
			this.$element.find('.dropdown-toggle').focus();
		},

		keypress: function (e) {
			var ENTER = 13;
			//var TAB = 9;
			var ESC = 27;
			var LEFT = 37;
			var UP = 38;
			var RIGHT = 39;
			var DOWN = 40;

			var IS_NAVIGATIONAL = (
				e.which === UP ||
				e.which === DOWN ||
				e.which === LEFT ||
				e.which === RIGHT
			);

			if(this.options.showOptionsOnKeypress && !this.$inputGroupBtn.hasClass('open')){
				this.$button.dropdown('toggle');
				this.$input.focus();
			}

			if (e.which === ENTER) {
				e.preventDefault();

				var selected = this.$dropMenu.find('li.selected').text().trim();
				if(selected.length > 0){
					this.selectByText(selected);
				}else{
					this.selectByText(this.$input.val());
				}

				this.$inputGroupBtn.removeClass('open');
			} else if (e.which === ESC) {
				e.preventDefault();
				this.clearSelection();
				this.$inputGroupBtn.removeClass('open');
			} else if (this.options.showOptionsOnKeypress) {
				if (e.which === DOWN || e.which === UP) {
					e.preventDefault();
					var $selected = this.$dropMenu.find('li.selected');
					if ($selected.length > 0) {
						if (e.which === DOWN) {
							$selected = $selected.next(':not(.hidden)');
						} else {
							$selected = $selected.prev(':not(.hidden)');
						}
					}

					if ($selected.length === 0){
						if (e.which === DOWN) {
							$selected = this.$dropMenu.find('li:not(.hidden):first');
						} else {
							$selected = this.$dropMenu.find('li:not(.hidden):last');
						}
					}
					this.doSelect($selected);
				}
			}

			// Avoid filtering on navigation key presses
			if (this.options.filterOnKeypress && !IS_NAVIGATIONAL) {
				this.options.filter(this.$dropMenu.find('li'), this.$input.val(), this);
			}

			this.previousKeyPress = e.which;
		},

		inputchanged: function (e, extra) {
			var val = $(e.target).val();
			// skip processing for internally-generated synthetic event
			// to avoid double processing
			if (extra && extra.synthetic) {
				this.selectByText(val);
				return;
			}
			this.selectByText(val);

			// find match based on input
			// if no match, pass the input value
			var data = this.selectedItem();
			if (data.text.length === 0) {
				data = {
					text: val
				};
			}

			// trigger changed event
			this.$element.trigger('changed.fu.combobox', data);
		}

	});



	Combobox.prototype.getValue = Combobox.prototype.selectedItem;

	// COMBOBOX PLUGIN DEFINITION

	$.fn.combobox = function (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.combobox');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.combobox', (data = new Combobox(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.combobox.defaults = {

		autoResizeMenu: true,
		filterOnKeypress: false,
		showOptionsOnKeypress: false,
		filter: function filter (list, predicate, self) {
			var visible = 0;
			self.$dropMenu.find('.empty-indicator').remove();

			list.each(function (i) {
				var $li = $(this);
				var text = $(this).text().trim();

				$li.removeClass();

				if (text === predicate) {
					$li.addClass('text-success');
					visible++;
				} else if (text.substr(0, predicate.length) === predicate) {
					$li.addClass('text-info');
					visible++;
				} else {
					$li.addClass('hidden');
				}
			});

			if (visible === 0) {
				self.$dropMenu.append('<li class="empty-indicator text-muted"><em>No Matches</em></li>');
			}
		}
	};

	$.fn.combobox.Constructor =  Combobox;

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
    "skylark-utils-dom/browser",
    "skylark-utils-dom/eventer",
    "skylark-utils-dom/noder",
    "skylark-utils-dom/geom",
    "skylark-utils-dom/query",
    "./fuelux"
], function(langx, browser, eventer, noder, geom, $, fuelux) {


    /*
     * Fuel UX Checkbox
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
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query"
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

define('skylark-fuelux/infinite-scroll',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query"
],function(langx,browser,eventer,noder,geom,$){

	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.infinitescroll;

	// INFINITE SCROLL CONSTRUCTOR AND PROTOTYPE

	var InfiniteScroll = function (element, options) {
		this.$element = $(element);
		this.$element.addClass('infinitescroll');
		this.options = langx.mixin({}, $.fn.infinitescroll.defaults, options);

		this.curScrollTop = this.$element.scrollTop();
		this.curPercentage = this.getPercentage();
		this.fetchingData = false;

		this.$element.on('scroll.fu.infinitescroll', langx.proxy(this.onScroll, this));
		this.onScroll();
	};

	InfiniteScroll.prototype = {

		constructor: InfiniteScroll,

		destroy: function () {
			this.$element.remove();
			// any external bindings
			// [none]

			// empty elements to return to original markup
			this.$element.empty();

			return this.$element[0].outerHTML;
		},

		disable: function () {
			this.$element.off('scroll.fu.infinitescroll');
		},

		enable: function () {
			this.$element.on('scroll.fu.infinitescroll', langx.proxy(this.onScroll, this));
		},

		end: function (content) {
			var end = $('<div class="infinitescroll-end"></div>');
			if (content) {
				end.append(content);
			} else {
				end.append('---------');
			}

			this.$element.append(end);
			this.disable();
		},

		getPercentage: function () {
			var height = (this.$element.css('box-sizing') === 'border-box') ? this.$element.outerHeight() : this.$element.height();
			var scrollHeight = this.$element.get(0).scrollHeight;
			return (scrollHeight > height) ? ((height / (scrollHeight - this.curScrollTop)) * 100) : 0;
		},

		fetchData: function (force) {
			var load = $('<div class="infinitescroll-load"></div>');
			var self = this;
			var moreBtn;

			var fetch = function () {
				var helpers = {
					percentage: self.curPercentage,
					scrollTop: self.curScrollTop
				};
				var $loader = $('<div class="loader"></div>');
				load.append($loader);
				$loader.loader();
				if (self.options.dataSource) {
					self.options.dataSource(helpers, function (resp) {
						var end;
						load.remove();
						if (resp.content) {
							self.$element.append(resp.content);
						}

						if (resp.end) {
							end = (resp.end !== true) ? resp.end : undefined;
							self.end(end);
						}

						self.fetchingData = false;
					});
				}
			};

			this.fetchingData = true;
			this.$element.append(load);
			if (this.options.hybrid && force !== true) {
				moreBtn = $('<button type="button" class="btn btn-primary"></button>');
				if (typeof this.options.hybrid === 'object') {
					moreBtn.append(this.options.hybrid.label);
				} else {
					moreBtn.append('<span class="glyphicon glyphicon-repeat"></span>');
				}

				moreBtn.on('click.fu.infinitescroll', function () {
					moreBtn.remove();
					fetch();
				});
				load.append(moreBtn);
			} else {
				fetch();
			}
		},

		onScroll: function (e) {
			this.curScrollTop = this.$element.scrollTop();
			this.curPercentage = this.getPercentage();
			if (!this.fetchingData && this.curPercentage >= this.options.percentage) {
				this.fetchData();
			}
		}
	};

	// INFINITE SCROLL PLUGIN DEFINITION

	$.fn.infinitescroll = function (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.infinitescroll');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.infinitescroll', (data = new InfiniteScroll(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.infinitescroll.defaults = {
		dataSource: null,
		hybrid: false,//can be true or an object with structure: { 'label': (markup or jQuery obj) }
		percentage: 95//percentage scrolled to the bottom before more is loaded
	};

	$.fn.infinitescroll.Constructor = InfiniteScroll;

	$.fn.infinitescroll.noConflict = function () {
		$.fn.infinitescroll = old;
		return this;
	};

});

define('skylark-fuelux/loader',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
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

define('skylark-fuelux/menu',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){

	var popup = null;
	var right_to_left ;

	var Menu = fuelux.Menu = fuelux.WidgetBase.inherit({
        klassName: "Menu",

        init : function(elm,options) {
        	if (!options) {
        		options = elm;
        		elm = null;
        	}
			var self = this,$el;

			this._options = langx.mixin({
					hide_onmouseleave	: 0,
					icons				: true

			},options);

			if (!elm) {
				$el = this.$el = $("<ul class='vakata-context'></ul>");
			} else {
				$el = this.$el = $(elm);
			}

			var to = false;
			$el.on("mouseenter", "li", function (e) {
					e.stopImmediatePropagation();

					if(noder.contains(this, e.relatedTarget)) {
						// премахнато заради delegate mouseleave по-долу
						// $(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
						return;
					}

					if(to) { clearTimeout(to); }
					$el.find(".vakata-context-hover").removeClass("vakata-context-hover").end();

					$(this)
						.siblings().find("ul").hide().end().end()
						.parentsUntil(".vakata-context", "li").addBack().addClass("vakata-context-hover");
					self._show_submenu(this);
				})
				// тестово - дали не натоварва?
				.on("mouseleave", "li", function (e) {
					if(noder.contains(this, e.relatedTarget)) { return; }
					$(this).find(".vakata-context-hover").addBack().removeClass("vakata-context-hover");
				})
				.on("mouseleave", function (e) {
					$(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
					if(self._options.hide_onmouseleave) {
						to = setTimeout(
							(function (t) {
								return function () { self.hide(); };
							}(this)), self._options.hide_onmouseleave);
					}
				})
				.on("click", "a", function (e) {
					e.preventDefault();
				//})
				//.on("mouseup", "a", function (e) {
					if(!$(this).blur().parent().hasClass("vakata-context-disabled") && self._execute($(this).attr("rel")) !== false) {
						self.hide();
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
								self.$el.find(".vakata-context-hover").last().closest("li").first().find("ul").hide().find(".vakata-context-hover").removeClass("vakata-context-hover").end().end().children('a').focus();
								e.stopImmediatePropagation();
								e.preventDefault();
								break;
							case 38:
								o = self.$el.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").prevAll("li:not(.vakata-context-separator)").first();
								if(!o.length) { o = self.$el.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").last(); }
								o.addClass("vakata-context-hover").children('a').focus();
								e.stopImmediatePropagation();
								e.preventDefault();
								break;
							case 39:
								self.$el.find(".vakata-context-hover").last().children("ul").show().children("li:not(.vakata-context-separator)").removeClass("vakata-context-hover").first().addClass("vakata-context-hover").children('a').focus();
								e.stopImmediatePropagation();
								e.preventDefault();
								break;
							case 40:
								o = self.$el.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").nextAll("li:not(.vakata-context-separator)").first();
								if(!o.length) { o = self.$el.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").first(); }
								o.addClass("vakata-context-hover").children('a').focus();
								e.stopImmediatePropagation();
								e.preventDefault();
								break;
							case 27:
								self.hide();
								e.preventDefault();
								break;
							default:
								//console.log(e.which);
								break;
						}
					})
				.on('keydown', function (e) {
					e.preventDefault();
					var a = self.$el.find('.vakata-contextmenu-shortcut-' + e.which).parent();
					if(a.parent().not('.vakata-context-disabled')) {
						a.click();
					}
				});

			this.render();
        },

        render : function() {
        	var items = this._options.items;
			if(this._parse(items)) {
				this.$el.html(this.html);
			}
			this.$el.width('');
        },

		_trigger : function (event_name) {
			$(document).trigger("context_" + event_name + ".fuelux", {
				"reference"	: this.reference,
				"element"	: this.$el,
				"position"	: {
					"x" : this.position_x,
					"y" : this.position_y
				}
			});
		},        

		_execute : function (i) {
			i = this.items[i];
			return i && (!i._disabled || (langx.isFunction(i._disabled) && !i._disabled({ "item" : i, "reference" : this.reference, "element" : this.$el }))) && i.action ? i.action.call(null, {
						"item"		: i,
						"reference"	: this.reference,
						"element"	: this.$el,
						"position"	: {
							"x" : this.position_x,
							"y" : this.position_y
						}
					}) : false;
		},
		_parse : function (o, is_callback) {
			var self = this,
				reference = self._options.reference;

			if(!o) { return false; }
			if(!is_callback) {
				self.html		= "";
				self.items	= [];
			}
			var str = "",
				sep = false,
				tmp;

			if(is_callback) { str += "<"+"ul>"; }
			langx.each(o, function (i, val) {
				if(!val) { return true; }
				self.items.push(val);
				if(!sep && val.separator_before) {
					str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + (self._options.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
				}
				sep = false;
				str += "<"+"li class='" + (val._class || "") + (val._disabled === true || (langx.isFunction(val._disabled) && val._disabled({ "item" : val, "reference" : reference, "element" : self.$el })) ? " vakata-contextmenu-disabled " : "") + "' "+(val.shortcut?" data-shortcut='"+val.shortcut+"' ":'')+">";
				str += "<"+"a href='#' rel='" + (self.items.length - 1) + "' " + (val.title ? "title='" + val.title + "'" : "") + ">";
				if(self._options.icons) {
					str += "<"+"i ";
					if(val.icon) {
						if(val.icon.indexOf("/") !== -1 || val.icon.indexOf(".") !== -1) { str += " style='background:url(\"" + val.icon + "\") center center no-repeat' "; }
						else { str += " class='" + val.icon + "' "; }
					}
					str += "><"+"/i><"+"span class='vakata-contextmenu-sep'>&#160;<"+"/span>";
				}
				str += (langx.isFunction(val.label) ? val.label({ "item" : i, "reference" : reference, "element" : self.$el }) : val.label) + (val.shortcut?' <span class="vakata-contextmenu-shortcut vakata-contextmenu-shortcut-'+val.shortcut+'">'+ (val.shortcut_label || '') +'</span>':'') + "<"+"/a>";
				if(val.submenu) {
					tmp = self._parse(val.submenu, true);
					if(tmp) { str += tmp; }
				}
				str += "<"+"/li>";
				if(val.separator_after) {
					str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + (self._options.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
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
			if(!is_callback) { self.html = str; self._trigger("parse"); }
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
			switch(cond) {
				case (!position && !reference):
					return false;
				case (!!position && !!reference):
					this.reference	= reference;
					this.position_x	= position.x;
					this.position_y	= position.y;
					break;
				case (!position && !!reference):
					this.reference	= reference;
					o = reference.offset();
					this.position_x	= o.left + reference.outerHeight();
					this.position_y	= o.top;
					break;
				case (!!position && !reference):
					this.position_x	= position.x;
					this.position_y	= position.y;
					break;
			}
			if(!!reference && !data && $(reference).data('vakata_contextmenu')) {
				data = $(reference).data('vakata_contextmenu');
			}

			if(this.items.length) {
				this.$el.appendTo(document.body);
				e = this.$el;
				x = this.position_x;
				y = this.position_y;
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

				this.$el
					.css({ "left" : x, "top" : y })
					.show()
					.find('a').first().focus().parent().addClass("vakata-context-hover");
				this.is_visible = true;

				popup = this;

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
			if(this.is_visible) {
				this.$el.hide().find("ul").hide().end().find(':focus').blur().end().detach();
				this.is_visible = false;
				popup = null;
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

    });	

	$(function () {
		right_to_left = $(document.body).css("direction") === "rtl";

		$(document)
			.on("mousedown.fuelux.popup", function (e) {
				if(popup && popup.$el[0] !== e.target  && !noder.contains(popup.$el[0], e.target)) {
					popup.hide();
				}
			})
			.on("context_show.fuelux.popup", function (e, data) {
				popup.$el.find("li:has(ul)").children("a").addClass("vakata-context-parent");
				if(right_to_left) {
					popup.$el.addClass("vakata-context-rtl").css("direction", "rtl");
				}
				// also apply a RTL class?
				popup.$el.find("ul").hide().end();
			});
	});

	Menu.popup = function (reference, position, data) {
		var m = new Menu({
			reference : reference,
			items : data
		});
		m.show(reference,position);
	};

	Menu.hide = function() {
		if (popup) {
			popup.hide();
		}
	}

	return Menu;

});

define('skylark-fuelux/picker',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
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
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux",
  "./dropdown-autoflip"
],function(langx,browser,eventer,noder,geom,$,fuelux){

	/*
	 * Fuel UX Checkbox
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
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
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
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.radio;

	// RADIO CONSTRUCTOR AND PROTOTYPE
	var logError = function logError (error) {
		if (window && window.console && window.console.error) {
			window.console.error(error);
		}
	};

	var Radio = fuelux.Radio = fuelux.WidgetBase.inherit({
		klassName: "Radio",

		init : function(element,options) {
			this.options = langx.mixin({}, $.fn.radio.defaults, options);

			if (element.tagName.toLowerCase() !== 'label') {
				logError('Radio must be initialized on the `label` that wraps the `input` element. See https://github.com/ExactTarget/fuelux/blob/master/reference/markup/radio.html for example of proper markup. Call `.radio()` on the `<label>` not the `<input>`');
				return;
			}

			// cache elements
			this.$label = $(element);
			this.$radio = this.$label.find('input[type="radio"]');
			this.groupName = this.$radio.attr('name'); // don't cache group itself since items can be added programmatically

			if (!this.options.ignoreVisibilityCheck && this.$radio.css('visibility').match(/hidden|collapse/)) {
				logError('For accessibility reasons, in order for tab and space to function on radio, `visibility` must not be set to `hidden` or `collapse`. See https://github.com/ExactTarget/fuelux/pull/1996 for more details.');
			}

			// determine if a toggle container is specified
			var containerSelector = this.$radio.attr('data-toggle');
			this.$toggleContainer = $(containerSelector);

			// handle internal events
			this.$radio.on('change', langx.proxy(this.itemchecked, this));

			// set default state
			this.setInitialState();
		},

		setInitialState: function setInitialState () {
			var $radio = this.$radio;

			// get current state of input
			var checked = $radio.prop('checked');
			var disabled = $radio.prop('disabled');

			// sync label class with input state
			this.setCheckedState($radio, checked);
			this.setDisabledState($radio, disabled);
		},

		resetGroup: function resetGroup () {
			var $radios = $('input[name="' + this.groupName + '"]');
			$radios.each(function resetRadio (index, item) {
				var $radio = $(item);
				var $lbl = $radio.parent();
				var containerSelector = $radio.attr('data-toggle');
				var $containerToggle = $(containerSelector);


				$lbl.removeClass('checked');
				$containerToggle.addClass('hidden');
			});
		},

		setCheckedState: function setCheckedState (element, checked) {
			var $radio = element;
			var $lbl = $radio.parent();
			var containerSelector = $radio.attr('data-toggle');
			var $containerToggle = $(containerSelector);

			if (checked) {
				// reset all items in group
				this.resetGroup();

				$radio.prop('checked', true);
				$lbl.addClass('checked');
				$containerToggle.removeClass('hide hidden');
				$lbl.trigger('checked.fu.radio');
			} else {
				$radio.prop('checked', false);
				$lbl.removeClass('checked');
				$containerToggle.addClass('hidden');
				$lbl.trigger('unchecked.fu.radio');
			}

			$lbl.trigger('changed.fu.radio', checked);
		},

		setDisabledState: function setDisabledState (element, disabled) {
			var $radio = $(element);
			var $lbl = this.$label;

			if (disabled) {
				$radio.prop('disabled', true);
				$lbl.addClass('disabled');
				$lbl.trigger('disabled.fu.radio');
			} else {
				$radio.prop('disabled', false);
				$lbl.removeClass('disabled');
				$lbl.trigger('enabled.fu.radio');
			}

			return $radio;
		},

		itemchecked: function itemchecked (evt) {
			var $radio = $(evt.target);
			this.setCheckedState($radio, true);
		},

		check: function check () {
			this.setCheckedState(this.$radio, true);
		},

		uncheck: function uncheck () {
			this.setCheckedState(this.$radio, false);
		},

		isChecked: function isChecked () {
			var checked = this.$radio.prop('checked');
			return checked;
		},

		enable: function enable () {
			this.setDisabledState(this.$radio, false);
		},

		disable: function disable () {
			this.setDisabledState(this.$radio, true);
		},

		destroy: function destroy () {
			this.$label.remove();
			return this.$label[0].outerHTML;
		}

	});


	Radio.prototype.getValue = Radio.prototype.isChecked;

	// RADIO PLUGIN DEFINITION

	$.fn.radio = function radio (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function applyData () {
			var $this = $(this);
			var data = $this.data('fu.radio');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.radio', (data = new Radio(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.radio.defaults = {
		ignoreVisibilityCheck: false
	};

	$.fn.radio.Constructor = Radio;

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

define('skylark-bootstrap3/bs3',[
  "skylark-utils-dom/skylark",
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query"
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

/*---------------------------------------------------------------------------------*/

	var WidgetBase = langx.Evented.inherit({
        klassName: "WidgetBase",
    });


	langx.mixin(bs3, {
		WidgetBase : WidgetBase
	});

	return bs3;
});

define('skylark-bootstrap3/dropdown',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./bs3"
],function(langx,browser,eventer,noder,geom,$,bs3){

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

  var Dropdown = bs3.Dropdown = bs3.WidgetBase.inherit({
    klassName: "Dropdown",

    init : function(element,options) {
      var $el = this.$element = $(element);
      $el.on('click.bs.dropdown', this.toggle);
      $el.on('keydown.bs.dropdown', '[data-toggle="dropdown"],.dropdown-menu',this.keydown);
    },

    toggle : function (e) {
      var $this = $(this)

      if ($this.is('.disabled, :disabled')) return

      var $parent  = getParent($this)
      var isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) {
        if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
          // if mobile we use a backdrop because click events don't delegate
          $(document.createElement('div'))
            .addClass('dropdown-backdrop')
            .insertAfter($(this))
            .on('click', clearMenus)
        }

        var relatedTarget = { relatedTarget: this }
        $parent.trigger(e = eventer.create('show.bs.dropdown', relatedTarget))

        if (e.isDefaultPrevented()) return

        $this
          .trigger('focus')
          .attr('aria-expanded', 'true')

        $parent
          .toggleClass('open')
          .trigger(eventer.create('shown.bs.dropdown', relatedTarget))
      }

      return false
    },

    keydown : function (e) {
      if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return

      var $this = $(this)

      e.preventDefault()
      e.stopPropagation()

      if ($this.is('.disabled, :disabled')) return

      var $parent  = getParent($this)
      var isActive = $parent.hasClass('open')

      if (!isActive && e.which != 27 || isActive && e.which == 27) {
        if (e.which == 27) $parent.find(toggle).trigger('focus')
        return $this.trigger('click')
      }

      var desc = ' li:not(.disabled):visible a'
      var $items = $parent.find('.dropdown-menu' + desc)

      if (!$items.length) return

      var index = $items.index(e.target)

      if (e.which == 38 && index > 0)                 index--         // up
      if (e.which == 40 && index < $items.length - 1) index++         // down
      if (!~index)                                    index = 0

      $items.eq(index).trigger('focus')
    }

  });

  Dropdown.VERSION = '3.3.7'

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector && $(selector)

    return $parent && $parent.length ? $parent : $this.parent()
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $this         = $(this)
      var $parent       = getParent($this)
      var relatedTarget = { relatedTarget: this }

      if (!$parent.hasClass('open')) return

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && noder.contains($parent[0], e.target)) return

      $parent.trigger(e = eventer.create('hide.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.attr('aria-expanded', 'false')
      $parent.removeClass('open').trigger(eventer.create('hidden.bs.dropdown', relatedTarget))
    })
  }



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


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================
  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() });

  return $.fn.dropdown;

});

define('skylark-fuelux/selectlist',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux",
  "skylark-bootstrap3/dropdown"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.selectlist;
	// SELECT CONSTRUCTOR AND PROTOTYPE

	var Selectlist = fuelux.Selectlist = fuelux.WidgetBase.inherit({
		klassName: "Selectlist",

		init : function(element,options) {
			this.$element = $(element);
			this.options = langx.mixin({}, $.fn.selectlist.defaults, options);


			this.$button = this.$element.find('.btn.dropdown-toggle');
			this.$hiddenField = this.$element.find('.hidden-field');
			this.$label = this.$element.find('.selected-label');
			this.$dropdownMenu = this.$element.find('.dropdown-menu');

			this.$button.dropdown();

			this.$element.on('click.fu.selectlist', '.dropdown-menu a', langx.proxy(this.itemClicked, this));
			this.setDefaultSelection();

			if (options.resize === 'auto' || this.$element.attr('data-resize') === 'auto') {
				this.resize();
			}

			// if selectlist is empty or is one item, disable it
			var items = this.$dropdownMenu.children('li');
			if( items.length === 0) {
				this.disable();
				this.doSelect( $(this.options.emptyLabelHTML));
			}

			// support jumping focus to first letter in dropdown when key is pressed
			this.$element.on('shown.bs.dropdown', function () {
					var $this = $(this);
					// attach key listener when dropdown is shown
					$(document).on('keypress.fu.selectlist', function(e){

						// get the key that was pressed
						var key = String.fromCharCode(e.which);
						// look the items to find the first item with the first character match and set focus
						$this.find("li").each(function(idx,item){
							if ($(item).text().charAt(0).toLowerCase() === key) {
								$(item).children('a').focus();
								return false;
							}
						});

				});
			});

			// unbind key event when dropdown is hidden
			this.$element.on('hide.bs.dropdown', function () {
					$(document).off('keypress.fu.selectlist');
			});
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

		doSelect: function ($item) {
			var $selectedItem;
			this.$selectedItem = $selectedItem = $item;

			this.$hiddenField.val(this.$selectedItem.attr('data-value'));
			this.$label.html($(this.$selectedItem.children()[0]).html());

			// clear and set selected item to allow declarative init state
			// unlike other controls, selectlist's value is stored internal, not in an input
			this.$element.find('li').each(function () {
				if ($selectedItem.is($(this))) {
					$(this).attr('data-selected', true);
				} else {
					$(this).removeData('selected').removeAttr('data-selected');
				}
			});
		},

		itemClicked: function (e) {
			this.$element.trigger('clicked.fu.selectlist', this.$selectedItem);

			e.preventDefault();
			// ignore if a disabled item is clicked
			if ($(e.currentTarget).parent('li').is('.disabled, :disabled')) { return; }

			// is clicked element different from currently selected element?
			if (!($(e.target).parent().is(this.$selectedItem))) {
				this.itemChanged(e);
			}

			// return focus to control after selecting an option
			this.$element.find('.dropdown-toggle').focus();
		},

		itemChanged: function (e) {
			//selectedItem needs to be <li> since the data is stored there, not in <a>
			this.doSelect($(e.target).closest('li'));

			// pass object including text and any data-attributes
			// to onchange event
			var data = this.selectedItem();
			// trigger changed event
			this.$element.trigger('changed.fu.selectlist', data);
		},

		resize: function () {
			var width = 0;
			var newWidth = 0;
			var sizer = $('<div/>').addClass('selectlist-sizer');


			if (Boolean($(document).find('html').hasClass('fuelux'))) {
				// default behavior for fuel ux setup. means fuelux was a class on the html tag
				$(document.body).append(sizer);
			} else {
				// fuelux is not a class on the html tag. So we'll look for the first one we find so the correct styles get applied to the sizer
				$('.fuelux:first').append(sizer);
			}

			sizer.append(this.$element.clone());

			this.$element.find('a').each(function () {
				sizer.find('.selected-label').text($(this).text());
				newWidth = sizer.find('.selectlist').outerWidth();
				newWidth = newWidth + sizer.find('.sr-only').outerWidth();
				if (newWidth > width) {
					width = newWidth;
				}
			});

			if (width <= 1) {
				return;
			}

			this.$button.css('width', width);
			this.$dropdownMenu.css('width', width);

			sizer.remove();
		},

		selectedItem: function () {
			var txt = this.$selectedItem.text();
			return langx.mixin({
				text: txt
			}, this.$selectedItem.data());
		},

		selectByText: function (text) {
			var $item = $([]);
			this.$element.find('li').each(function () {
				if ((this.textContent || this.innerText || $(this).text() || '').toLowerCase() === (text || '').toLowerCase()) {
					$item = $(this);
					return false;
				}
			});
			this.doSelect($item);
		},

		selectByValue: function (value) {
			var selector = 'li[data-value="' + value + '"]';
			this.selectBySelector(selector);
		},

		selectByIndex: function (index) {
			// zero-based index
			var selector = 'li:eq(' + index + ')';
			this.selectBySelector(selector);
		},

		selectBySelector: function (selector) {
			var $item = this.$element.find(selector);
			this.doSelect($item);
		},

		setDefaultSelection: function () {
			var $item = this.$element.find('li[data-selected=true]').eq(0);

			if ($item.length === 0) {
				$item = this.$element.find('li').has('a').eq(0);
			}

			this.doSelect($item);
		},

		enable: function () {
			this.$element.removeClass('disabled');
			this.$button.removeClass('disabled');
		},

		disable: function () {
			this.$element.addClass('disabled');
			this.$button.addClass('disabled');
		}

	});	


	Selectlist.prototype.getValue = Selectlist.prototype.selectedItem;


	// SELECT PLUGIN DEFINITION

	$.fn.selectlist = function (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.selectlist');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.selectlist', (data = new Selectlist(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.selectlist.defaults = {
		emptyLabelHTML: '<li data-value=""><a href="#">No items</a></li>'
	};

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
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
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
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux",
  "./combobox",
  "./datepicker",
  "./radio",
  "./selectlist",
  "./spinbox"
],function(langx,browser,eventer,noder,geom,$,fuelux){

	/*
	 * Fuel UX Checkbox
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
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){


	/*
	 * Fuel UX Checkbox
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

define('skylark-utils-dom/elmx',[
    "./dom",
    "./langx",
    "./datax",
    "./eventer",
    "./finder",
    "./fx",
    "./geom",
    "./noder",
    "./styler",
    "./query"
], function(dom, langx, datax, eventer, finder, fx, geom, noder, styler,$) {
    var map = Array.prototype.map,
        slice = Array.prototype.slice;
    /*
     * VisualElement is a skylark class type wrapping a visule dom node,
     * provides a number of prototype methods and supports chain calls.
     */
    var VisualElement = langx.klass({
        klassName: "VisualElement",

        "init": function(node) {
            if (langx.isString(node)) {
                node = document.getElementById(node);
            }
            this.domNode = node;
        }
    });

    VisualElement.prototype.$ = VisualElement.prototype.query = function(selector) {
        return $(selector,this.domNode);
    };

    /*
     * the VisualElement object wrapping document.body
     */
    var root = new VisualElement(document.body),
        elmx = function(node) {
            if (node) {
                return new VisualElement(node);
            } else {
                return root;
            }
        };
    /*
     * Extend VisualElement prototype with wrapping the specified methods.
     * @param {ArrayLike} fn
     * @param {Object} context
     */
    function _delegator(fn, context) {
        return function() {
            var self = this,
                elem = self.domNode,
                ret = fn.apply(context, [elem].concat(slice.call(arguments)));

            if (ret) {
                if (ret === context) {
                    return self;
                } else {
                    if (ret instanceof HTMLElement) {
                        ret = new VisualElement(ret);
                    } else if (langx.isArrayLike(ret)) {
                        ret = map.call(ret, function(el) {
                            if (el instanceof HTMLElement) {
                                return new VisualElement(el);
                            } else {
                                return el;
                            }
                        })
                    }
                }
            }
            return ret;
        };
    }

    langx.mixin(elmx, {
        batch: function(nodes, action, args) {
            nodes.forEach(function(node) {
                var elm = (node instanceof VisualElement) ? node : elmx(node);
                elm[action].apply(elm, args);
            });

            return this;
        },

        root: new VisualElement(document.body),

        VisualElement: VisualElement,

        partial: function(name, fn) {
            var props = {};

            props[name] = fn;

            VisualElement.partial(props);
        },

        delegate: function(names, context) {
            var props = {};

            names.forEach(function(name) {
                props[name] = _delegator(context[name], context);
            });

            VisualElement.partial(props);
        }
    });

    // from ./datax
    elmx.delegate([
        "attr",
        "data",
        "prop",
        "removeAttr",
        "removeData",
        "text",
        "val"
    ], datax);

    // from ./eventer
    elmx.delegate([
        "off",
        "on",
        "one",
        "shortcuts",
        "trigger"
    ], eventer);

    // from ./finder
    elmx.delegate([
        "ancestor",
        "ancestors",
        "children",
        "descendant",
        "find",
        "findAll",
        "firstChild",
        "lastChild",
        "matches",
        "nextSibling",
        "nextSiblings",
        "parent",
        "previousSibling",
        "previousSiblings",
        "siblings"
    ], finder);

    /*
     * find a dom element matched by the specified selector.
     * @param {String} selector
     */
    elmx.find = function(selector) {
        if (selector === "body") {
            return this.root;
        } else {
            return this.root.descendant(selector);
        }
    };

    // from ./fx
    elmx.delegate([
        "animate",
        "fadeIn",
        "fadeOut",
        "fadeTo",
        "fadeToggle",
        "hide",
        "scrollToTop",
        "show",
        "toggle"
    ], fx);


    // from ./geom
    elmx.delegate([
        "borderExtents",
        "boundingPosition",
        "boundingRect",
        "clientHeight",
        "clientSize",
        "clientWidth",
        "contentRect",
        "height",
        "marginExtents",
        "offsetParent",
        "paddingExtents",
        "pagePosition",
        "pageRect",
        "relativePosition",
        "relativeRect",
        "scrollIntoView",
        "scrollLeft",
        "scrollTop",
        "size",
        "width"
    ], geom);

    // from ./noder
    elmx.delegate([
        "after",
        "append",
        "before",
        "clone",
        "contains",
        "contents",
        "empty",
        "html",
        "isChildOf",
        "ownerDoc",
        "prepend",
        "remove",
        "removeChild",
        "replace",
        "reverse",
        "throb",
        "traverse",
        "wrapper",
        "wrapperInner",
        "unwrap"
    ], noder);

    // from ./styler
    elmx.delegate([
        "addClass",
        "className",
        "css",
        "hasClass",
        "hide",
        "isInvisible",
        "removeClass",
        "show",
        "toggleClass"
    ], styler);

    // properties

    var properties = [ 'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
    'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
    'background', 'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'textDecoration', 'textTransform', 'cursor', 'zIndex' ];

    properties.forEach( function ( property ) {

        var method = property;

        VisualElement.prototype[method ] = function (value) {

            this.css( property, value );

            return this;

        };

    });

    // events
    var events = [ 'keyUp', 'keyDown', 'mouseOver', 'mouseOut', 'click', 'dblClick', 'change' ];

    events.forEach( function ( event ) {

        var method = event;

        VisualElement.prototype[method ] = function ( callback ) {

            this.on( event.toLowerCase(), callback);

            return this;
        };

    });


    return dom.elmx = elmx;
});
define('skylark-fuelux/toolbar',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/elmx",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,elmx,$,fuelux){

	var Toolbar = fuelux.Toolbar = fuelux.WidgetBase.inherit({
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

			this.$container.on('mousedown.bs.dropdown.data-api', '[data-toggle="dropdown"]',function(e) {
				$(this).dropdown();
			}); 

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

define('skylark-fuelux/wizard',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux"
],function(langx,browser,eventer,noder,geom,$,fuelux){

	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.wizard;

	// WIZARD CONSTRUCTOR AND PROTOTYPE

	var Wizard = fuelux.Wizard = fuelux.WidgetBase.inherit({
		klassName: "Wizard",

		init : function(element,options) {
			this.$element = $(element);
			this.options = langx.mixin({}, $.fn.wizard.defaults, options);
			this.options.disablePreviousStep = (this.$element.attr('data-restrict') === 'previous') ? true : this.options.disablePreviousStep;
			this.currentStep = this.options.selectedItem.step;
			this.numSteps = this.$element.find('.steps li').length;
			this.$prevBtn = this.$element.find('button.btn-prev');
			this.$nextBtn = this.$element.find('button.btn-next');

			var kids = this.$nextBtn.children().detach();
			this.nextText = langx.trim(this.$nextBtn.text());
			this.$nextBtn.append(kids);

			var steps = this.$element.children('.steps-container');
			// maintains backwards compatibility with < 3.8, will be removed in the future
			if (steps.length === 0) {
				steps = this.$element;
				this.$element.addClass('no-steps-container');
				if (window && window.console && window.console.warn) {
					window.console.warn('please update your wizard markup to include ".steps-container" as seen in http://getfuelux.com/javascript.html#wizard-usage-markup');
				}
			}
			steps = steps.find('.steps');

			// handle events
			this.$prevBtn.on('click.fu.wizard', langx.proxy(this.previous, this));
			this.$nextBtn.on('click.fu.wizard', langx.proxy(this.next, this));
			steps.on('click.fu.wizard', 'li.complete', langx.proxy(this.stepclicked, this));

			this.selectedItem(this.options.selectedItem);

			if (this.options.disablePreviousStep) {
				this.$prevBtn.attr('disabled', true);
				this.$element.find('.steps').addClass('previous-disabled');
			}
		},

		destroy: function () {
			this.$element.remove();
			// any external bindings [none]
			// empty elements to return to original markup [none]
			// returns string of markup
			return this.$element[0].outerHTML;
		},

		//index is 1 based
		//second parameter can be array of objects [{ ... }, { ... }] or you can pass n additional objects as args
		//object structure is as follows (all params are optional): { badge: '', label: '', pane: '' }
		addSteps: function (index) {
			var items = [].slice.call(arguments).slice(1);
			var $steps = this.$element.find('.steps');
			var $stepContent = this.$element.find('.step-content');
			var i, l, $pane, $startPane, $startStep, $step;

			index = (index === -1 || (index > (this.numSteps + 1))) ? this.numSteps + 1 : index;
			if (items[0] instanceof Array) {
				items = items[0];
			}

			$startStep = $steps.find('li:nth-child(' + index + ')');
			$startPane = $stepContent.find('.step-pane:nth-child(' + index + ')');
			if ($startStep.length < 1) {
				$startStep = null;
			}

			for (i = 0, l = items.length; i < l; i++) {
				$step = $('<li data-step="' + index + '"><span class="badge badge-info"></span></li>');
				$step.append(items[i].label || '').append('<span class="chevron"></span>');
				$step.find('.badge').append(items[i].badge || index);

				$pane = $('<div class="step-pane" data-step="' + index + '"></div>');
				$pane.append(items[i].pane || '');

				if (!$startStep) {
					$steps.append($step);
					$stepContent.append($pane);
				} else {
					$startStep.before($step);
					$startPane.before($pane);
				}

				index++;
			}

			this.syncSteps();
			this.numSteps = $steps.find('li').length;
			this.setState();
		},

		//index is 1 based, howMany is number to remove
		removeSteps: function (index, howMany) {
			var action = 'nextAll';
			var i = 0;
			var $steps = this.$element.find('.steps');
			var $stepContent = this.$element.find('.step-content');
			var $start;

			howMany = (howMany !== undefined) ? howMany : 1;

			if (index > $steps.find('li').length) {
				$start = $steps.find('li:last');
			} else {
				$start = $steps.find('li:nth-child(' + index + ')').prev();
				if ($start.length < 1) {
					action = 'children';
					$start = $steps;
				}

			}

			$start[action]().each(function () {
				var item = $(this);
				var step = item.attr('data-step');
				if (i < howMany) {
					item.remove();
					$stepContent.find('.step-pane[data-step="' + step + '"]:first').remove();
				} else {
					return false;
				}

				i++;
			});

			this.syncSteps();
			this.numSteps = $steps.find('li').length;
			this.setState();
		},

		setState: function () {
			var canMovePrev = (this.currentStep > 1);//remember, steps index is 1 based...
			var isFirstStep = (this.currentStep === 1);
			var isLastStep = (this.currentStep === this.numSteps);

			// disable buttons based on current step
			if (!this.options.disablePreviousStep) {
				this.$prevBtn.attr('disabled', (isFirstStep === true || canMovePrev === false));
			}

			// change button text of last step, if specified
			var last = this.$nextBtn.attr('data-last');
			if (last) {
				this.lastText = last;
				// replace text
				var text = this.nextText;
				if (isLastStep === true) {
					text = this.lastText;
					// add status class to wizard
					this.$element.addClass('complete');
				} else {
					this.$element.removeClass('complete');
				}

				var kids = this.$nextBtn.children().detach();
				this.$nextBtn.text(text).append(kids);
			}

			// reset classes for all steps
			var $steps = this.$element.find('.steps li');
			$steps.removeClass('active').removeClass('complete');
			$steps.find('span.badge').removeClass('badge-info').removeClass('badge-success');

			// set class for all previous steps
			var prevSelector = '.steps li:lt(' + (this.currentStep - 1) + ')';
			var $prevSteps = this.$element.find(prevSelector);
			$prevSteps.addClass('complete');
			$prevSteps.find('span.badge').addClass('badge-success');

			// set class for current step
			var currentSelector = '.steps li:eq(' + (this.currentStep - 1) + ')';
			var $currentStep = this.$element.find(currentSelector);
			$currentStep.addClass('active');
			$currentStep.find('span.badge').addClass('badge-info');

			// set display of target element
			var $stepContent = this.$element.find('.step-content');
			var target = $currentStep.attr('data-step');
			$stepContent.find('.step-pane').removeClass('active');
			$stepContent.find('.step-pane[data-step="' + target + '"]:first').addClass('active');

			// reset the wizard position to the left
			this.$element.find('.steps').first().attr('style', 'margin-left: 0');

			// check if the steps are wider than the container div
			var totalWidth = 0;
			this.$element.find('.steps > li').each(function () {
				totalWidth += $(this).outerWidth();
			});
			var containerWidth = 0;
			if (this.$element.find('.actions').length) {
				containerWidth = this.$element.width() - this.$element.find('.actions').first().outerWidth();
			} else {
				containerWidth = this.$element.width();
			}

			if (totalWidth > containerWidth) {
				// set the position so that the last step is on the right
				var newMargin = totalWidth - containerWidth;
				this.$element.find('.steps').first().attr('style', 'margin-left: -' + newMargin + 'px');

				// set the position so that the active step is in a good
				// position if it has been moved out of view
				if (this.$element.find('li.active').first().position().left < 200) {
					newMargin += this.$element.find('li.active').first().position().left - 200;
					if (newMargin < 1) {
						this.$element.find('.steps').first().attr('style', 'margin-left: 0');
					} else {
						this.$element.find('.steps').first().attr('style', 'margin-left: -' + newMargin + 'px');
					}

				}

			}

			// only fire changed event after initializing
			if (typeof (this.initialized) !== 'undefined') {
				var e = eventer.create('changed.fu.wizard');
				this.$element.trigger(e, {
					step: this.currentStep
				});
			}

			this.initialized = true;
		},

		stepclicked: function (e) {
			var li = $(e.currentTarget);
			var index = this.$element.find('.steps li').index(li);

			if (index < this.currentStep && this.options.disablePreviousStep) {//enforce restrictions
				return;
			} else {
				var evt = eventer.create('stepclicked.fu.wizard');
				this.$element.trigger(evt, {
					step: index + 1
				});
				if (evt.isDefaultPrevented()) {
					return;
				}

				this.currentStep = (index + 1);
				this.setState();
			}
		},

		syncSteps: function () {
			var i = 1;
			var $steps = this.$element.find('.steps');
			var $stepContent = this.$element.find('.step-content');

			$steps.children().each(function () {
				var item = $(this);
				var badge = item.find('.badge');
				var step = item.attr('data-step');

				if (!isNaN(parseInt(badge.html(), 10))) {
					badge.html(i);
				}

				item.attr('data-step', i);
				$stepContent.find('.step-pane[data-step="' + step + '"]:last').attr('data-step', i);
				i++;
			});
		},

		previous: function () {
			if (this.options.disablePreviousStep || this.currentStep === 1) {
				return;
			}

			var e = eventer.create('actionclicked.fu.wizard');
			this.$element.trigger(e, {
				step: this.currentStep,
				direction: 'previous'
			});
			if (e.isDefaultPrevented()) {
				return;
			}// don't increment ...what? Why?

			this.currentStep -= 1;
			this.setState();

			// only set focus if focus is still on the $nextBtn (avoid stomping on a focus set programmatically in actionclicked callback)
			if (this.$prevBtn.is(':focus')) {
				var firstFormField = this.$element.find('.active').find('input, select, textarea')[0];

				if (typeof firstFormField !== 'undefined') {
					// allow user to start typing immediately instead of having to click on the form field.
					$(firstFormField).focus();
				} else if (this.$element.find('.active input:first').length === 0 && this.$prevBtn.is(':disabled')) {
					//only set focus on a button as the last resort if no form fields exist and the just clicked button is now disabled
					this.$nextBtn.focus();
				}

			}
		},

		next: function () {
			var e = eventer.create('actionclicked.fu.wizard');
			this.$element.trigger(e, {
				step: this.currentStep,
				direction: 'next'
			});
			if (e.isDefaultPrevented()) {
				return;
			}// respect preventDefault in case dev has attached validation to step and wants to stop propagation based on it.

			if (this.currentStep < this.numSteps) {
				this.currentStep += 1;
				this.setState();
			} else {//is last step
				this.$element.trigger('finished.fu.wizard');
			}

			// only set focus if focus is still on the $nextBtn (avoid stomping on a focus set programmatically in actionclicked callback)
			if (this.$nextBtn.is(':focus')) {
				var firstFormField = this.$element.find('.active').find('input, select, textarea')[0];

				if (typeof firstFormField !== 'undefined') {
					// allow user to start typing immediately instead of having to click on the form field.
					$(firstFormField).focus();
				} else if (this.$element.find('.active input:first').length === 0 && this.$nextBtn.is(':disabled')) {
					//only set focus on a button as the last resort if no form fields exist and the just clicked button is now disabled
					this.$prevBtn.focus();
				}

			}
		},

		selectedItem: function (selectedItem) {
			var retVal, step;

			if (selectedItem) {
				step = selectedItem.step || -1;
				//allow selection of step by data-name
				step = Number(this.$element.find('.steps li[data-name="' + step + '"]').first().attr('data-step')) || Number(step);

				if (1 <= step && step <= this.numSteps) {
					this.currentStep = step;
					this.setState();
				} else {
					step = this.$element.find('.steps li.active:first').attr('data-step');
					if (!isNaN(step)) {
						this.currentStep = parseInt(step, 10);
						this.setState();
					}

				}

				retVal = this;
			} else {
				retVal = {
					step: this.currentStep
				};
				if (this.$element.find('.steps li.active:first[data-name]').length) {
					retVal.stepname = this.$element.find('.steps li.active:first').attr('data-name');
				}

			}

			return retVal;
		}

	});


	// WIZARD PLUGIN DEFINITION

	$.fn.wizard = function (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function () {
			var $this = $(this);
			var data = $this.data('fu.wizard');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.wizard', (data = new Wizard(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.wizard.defaults = {
		disablePreviousStep: false,
		selectedItem: {
			step: -1
		}//-1 means it will attempt to look for "active" class in order to set the step
	};

	$.fn.wizard.Constructor = Wizard;

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
  "skylark-utils-dom/skylark",
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./fuelux",
  "./loader",
  "./selectlist",
  "./combobox"  
],function(skylark,langx,browser,eventer,noder,geom,$,fuelux){

	/*
	 * Repeater
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	var old = $.fn.repeater;

	// REPEATER CONSTRUCTOR AND PROTOTYPE

	var Repeater = fuelux.Repeater = fuelux.WidgetBase.inherit({
		klassName: "Repeater",

		init : function(element,options) {
			var self = this;
			var $btn;
			var currentView;

			this.$element = $(element);

			this.$canvas = this.$element.find('.repeater-canvas');
			this.$count = this.$element.find('.repeater-count');
			this.$end = this.$element.find('.repeater-end');
			this.$filters = this.$element.find('.repeater-filters');
			this.$loader = this.$element.find('.repeater-loader');
			this.$pageSize = this.$element.find('.repeater-itemization .selectlist');
			this.$nextBtn = this.$element.find('.repeater-next');
			this.$pages = this.$element.find('.repeater-pages');
			this.$prevBtn = this.$element.find('.repeater-prev');
			this.$primaryPaging = this.$element.find('.repeater-primaryPaging');
			this.$search = this.$element.find('.repeater-search').find('.search');
			this.$secondaryPaging = this.$element.find('.repeater-secondaryPaging');
			this.$start = this.$element.find('.repeater-start');
			this.$viewport = this.$element.find('.repeater-viewport');
			this.$views = this.$element.find('.repeater-views');

			this.$element.on('mousedown.bs.dropdown.data-api', '[data-toggle="dropdown"]',function(e) {
				$(this).dropdown();
			}); 

			this.currentPage = 0;
			this.currentView = null;
			this.isDisabled = false;
			this.infiniteScrollingCallback = function noop () {};
			this.infiniteScrollingCont = null;
			this.infiniteScrollingEnabled = false;
			this.infiniteScrollingEnd = null;
			this.infiniteScrollingOptions = {};
			this.lastPageInput = 0;
			this.options = langx.mixin({}, $.fn.repeater.defaults, options);
			this.pageIncrement = 0;// store direction navigated
			this.resizeTimeout = {};
			this.stamp = new Date().getTime() + (Math.floor(Math.random() * 100) + 1);
			this.storedDataSourceOpts = null;
			this.syncingViewButtonState = false;
			this.viewOptions = {};
			this.viewType = null;

			this.$filters.selectlist();
			this.$pageSize.selectlist();
			this.$primaryPaging.find('.combobox').combobox();
			this.$search.search({
				searchOnKeyPress: this.options.searchOnKeyPress,
				allowCancel: this.options.allowCancel
			});

			this.$filters.on('changed.fu.selectlist', function onFiltersChanged (e, value) {
				self.$element.trigger('filtered.fu.repeater', value);
				self.render({
					clearInfinite: true,
					pageIncrement: null
				});
			});
			this.$nextBtn.on('click.fu.repeater', langx.proxy(this.next, this));
			this.$pageSize.on('changed.fu.selectlist', function onPageSizeChanged (e, value) {
				self.$element.trigger('pageSizeChanged.fu.repeater', value);
				self.render({
					pageIncrement: null
				});
			});
			this.$prevBtn.on('click.fu.repeater', langx.proxy(this.previous, this));
			this.$primaryPaging.find('.combobox').on('changed.fu.combobox', function onPrimaryPagingChanged (evt, data) {
				self.pageInputChange(data.text, data);
			});
			this.$search.on('searched.fu.search cleared.fu.search', function onSearched (e, value) {
				self.$element.trigger('searchChanged.fu.repeater', value);
				self.render({
					clearInfinite: true,
					pageIncrement: null
				});
			});
			this.$search.on('canceled.fu.search', function onSearchCanceled (e, value) {
				self.$element.trigger('canceled.fu.repeater', value);
				self.render({
					clearInfinite: true,
					pageIncrement: null
				});
			});

			this.$secondaryPaging.on('blur.fu.repeater', function onSecondaryPagingBlur () {
				self.pageInputChange(self.$secondaryPaging.val());
			});
			this.$secondaryPaging.on('keyup', function onSecondaryPagingKeyup (e) {
				if (e.keyCode === 13) {
					self.pageInputChange(self.$secondaryPaging.val());
				}
			});
			this.$views.find('input').on('change.fu.repeater', langx.proxy(this.viewChanged, this));

			$(window).on('resize.fu.repeater.' + this.stamp, function onResizeRepeater () {
				clearTimeout(self.resizeTimeout);
				self.resizeTimeout = setTimeout(function resizeTimeout () {
					self.resize();
					self.$element.trigger('resized.fu.repeater');
				}, 75);
			});

			this.$loader.loader();
			this.$loader.loader('pause');
			if (this.options.defaultView !== -1) {
				currentView = this.options.defaultView;
			} else {
				$btn = this.$views.find('label.active input');
				currentView = ($btn.length > 0) ? $btn.val() : 'list';
			}

			this.setViewOptions(currentView);

			this.initViewTypes(function initViewTypes () {
				self.resize();
				self.$element.trigger('resized.fu.repeater');
				self.render({
					changeView: currentView
				});
			});
		},

		clear: function clear (opts) {
			var options = opts || {};

			if (!options.preserve) {
				// Just trash everything because preserve is false
				this.$canvas.empty();
			} else if (!this.infiniteScrollingEnabled || options.clearInfinite) {
				// Preserve clear only if infiniteScrolling is disabled or if specifically told to do so
				scan(this.$canvas);
			} // Otherwise don't clear because infiniteScrolling is enabled

			// If viewChanged and current viewTypeObj has a cleared function, call it
			var viewChanged = (options.viewChanged !== undefined) ? options.viewChanged : false;
			var viewTypeObj = $.fn.repeater.viewTypes[this.viewType] || {};
			if (!viewChanged && viewTypeObj.cleared) {
				viewTypeObj.cleared.call(this, {
					options: options
				});
			}
		},

		clearPreservedDataSourceOptions: function clearPreservedDataSourceOptions () {
			this.storedDataSourceOpts = null;
		},

		destroy: function destroy () {
			var markup;
			// set input value attrbute in markup
			this.$element.find('input').each(function eachInput () {
				$(this).attr('value', $(this).val());
			});

			// empty elements to return to original markup
			this.$canvas.empty();
			markup = this.$element[0].outerHTML;

			// destroy components and remove leftover
			this.$element.find('.combobox').combobox('destroy');
			this.$element.find('.selectlist').selectlist('destroy');
			this.$element.find('.search').search('destroy');
			if (this.infiniteScrollingEnabled) {
				$(this.infiniteScrollingCont).infinitescroll('destroy');
			}

			this.$element.remove();

			// any external events
			$(window).off('resize.fu.repeater.' + this.stamp);

			return markup;
		},

		disable: function disable () {
			var viewTypeObj = $.fn.repeater.viewTypes[this.viewType] || {};

			this.$search.search('disable');
			this.$filters.selectlist('disable');
			this.$views.find('label, input').addClass('disabled').attr('disabled', 'disabled');
			this.$pageSize.selectlist('disable');
			this.$primaryPaging.find('.combobox').combobox('disable');
			this.$secondaryPaging.attr('disabled', 'disabled');
			this.$prevBtn.attr('disabled', 'disabled');
			this.$nextBtn.attr('disabled', 'disabled');

			if (viewTypeObj.enabled) {
				viewTypeObj.enabled.call(this, {
					status: false
				});
			}

			this.isDisabled = true;
			this.$element.addClass('disabled');
			this.$element.trigger('disabled.fu.repeater');
		},

		enable: function enable () {
			var viewTypeObj = $.fn.repeater.viewTypes[this.viewType] || {};

			this.$search.search('enable');
			this.$filters.selectlist('enable');
			this.$views.find('label, input').removeClass('disabled').removeAttr('disabled');
			this.$pageSize.selectlist('enable');
			this.$primaryPaging.find('.combobox').combobox('enable');
			this.$secondaryPaging.removeAttr('disabled');

			if (!this.$prevBtn.hasClass('page-end')) {
				this.$prevBtn.removeAttr('disabled');
			}
			if (!this.$nextBtn.hasClass('page-end')) {
				this.$nextBtn.removeAttr('disabled');
			}

			// is 0 or 1 pages, if using $primaryPaging (combobox)
			// if using selectlist allow user to use selectlist to select 0 or 1
			if (this.$prevBtn.hasClass('page-end') && this.$nextBtn.hasClass('page-end')) {
				this.$primaryPaging.combobox('disable');
			}

			// if there are no items
			if (parseInt(this.$count.html(), 10) !== 0) {
				this.$pageSize.selectlist('enable');
			} else {
				this.$pageSize.selectlist('disable');
			}

			if (viewTypeObj.enabled) {
				viewTypeObj.enabled.call(this, {
					status: true
				});
			}

			this.isDisabled = false;
			this.$element.removeClass('disabled');
			this.$element.trigger('enabled.fu.repeater');
		},

		getDataOptions: function getDataOptions (opts) {
			var options = opts || {};
			if (options.pageIncrement !== undefined) {
				if (options.pageIncrement === null) {
					this.currentPage = 0;
				} else {
					this.currentPage += options.pageIncrement;
				}
			}

			var dataSourceOptions = {};
			if (options.dataSourceOptions) {
				dataSourceOptions = options.dataSourceOptions;

				if (options.preserveDataSourceOptions) {
					if (this.storedDataSourceOpts) {
						this.storedDataSourceOpts = langx.mixin(this.storedDataSourceOpts, dataSourceOptions);
					} else {
						this.storedDataSourceOpts = dataSourceOptions;
					}
				}
			}

			if (this.storedDataSourceOpts) {
				dataSourceOptions = langx.mixin(this.storedDataSourceOpts, dataSourceOptions);
			}

			var returnOptions = {
				view: this.currentView,
				pageIndex: this.currentPage,
				filter: {
					text: 'All',
					value: 'all'
				}
			};
			if (this.$filters.length > 0) {
				returnOptions.filter = this.$filters.selectlist('selectedItem');
			}

			if (!this.infiniteScrollingEnabled) {
				returnOptions.pageSize = 25;

				if (this.$pageSize.length > 0) {
					returnOptions.pageSize = parseInt(this.$pageSize.selectlist('selectedItem').value, 10);
				}
			}

			var searchValue = this.$search && this.$search.find('input') && this.$search.find('input').val();
			if (searchValue !== '') {
				returnOptions.search = searchValue;
			}

			var viewType = $.fn.repeater.viewTypes[this.viewType] || {};
			var addViewTypeData = viewType.dataOptions;
			if (addViewTypeData) {
				returnOptions = addViewTypeData.call(this, returnOptions);
			}

			returnOptions = langx.mixin(returnOptions, dataSourceOptions);

			return returnOptions;
		},

		infiniteScrolling: function infiniteScrolling (enable, opts) {
			var footer = this.$element.find('.repeater-footer');
			var viewport = this.$element.find('.repeater-viewport');
			var options = opts || {};

			if (enable) {
				this.infiniteScrollingEnabled = true;
				this.infiniteScrollingEnd = options.end;
				delete options.dataSource;
				delete options.end;
				this.infiniteScrollingOptions = options;
				viewport.css({
					height: viewport.height() + footer.outerHeight()
				});
				footer.hide();
			} else {
				var cont = this.infiniteScrollingCont;
				var data = cont.data();
				delete data.infinitescroll;
				cont.off('scroll');
				cont.removeClass('infinitescroll');

				this.infiniteScrollingCont = null;
				this.infiniteScrollingEnabled = false;
				this.infiniteScrollingEnd = null;
				this.infiniteScrollingOptions = {};
				viewport.css({
					height: viewport.height() - footer.outerHeight()
				});
				footer.show();
			}
		},

		infiniteScrollPaging: function infiniteScrollPaging (data) {
			var end = (this.infiniteScrollingEnd !== true) ? this.infiniteScrollingEnd : undefined;
			var page = data.page;
			var pages = data.pages;

			this.currentPage = (page !== undefined) ? page : NaN;

			if (data.end === true || (this.currentPage + 1) >= pages) {
				this.infiniteScrollingCont.infinitescroll('end', end);
			}
		},

		initInfiniteScrolling: function initInfiniteScrolling () {
			var cont = this.$canvas.find('[data-infinite="true"]:first');

			cont = (cont.length < 1) ? this.$canvas : cont;
			if (cont.data('fu.infinitescroll')) {
				cont.infinitescroll('enable');
			} else {
				var self = this;
				var opts = langx.mixin({}, this.infiniteScrollingOptions);
				opts.dataSource = function dataSource (helpers, callback) {
					self.infiniteScrollingCallback = callback;
					self.render({
						pageIncrement: 1
					});
				};
				cont.infinitescroll(opts);
				this.infiniteScrollingCont = cont;
			}
		},

		initViewTypes: function initViewTypes (callback) {
			var viewTypes = [];

			for (var key in $.fn.repeater.viewTypes) {
				if ({}.hasOwnProperty.call($.fn.repeater.viewTypes, key)) {
					viewTypes.push($.fn.repeater.viewTypes[key]);
				}
			}

			if (viewTypes.length > 0) {
				initViewType.call(this, 0, viewTypes, callback);
			} else {
				callback();
			}
		},

		itemization: function itemization (data) {
			this.$count.html((data.count !== undefined) ? data.count : '?');
			this.$end.html((data.end !== undefined) ? data.end : '?');
			this.$start.html((data.start !== undefined) ? data.start : '?');
		},

		next: function next () {
			this.$nextBtn.attr('disabled', 'disabled');
			this.$prevBtn.attr('disabled', 'disabled');
			this.pageIncrement = 1;
			this.$element.trigger('nextClicked.fu.repeater');
			this.render({
				pageIncrement: this.pageIncrement
			});
		},

		pageInputChange: function pageInputChange (val, dataFromCombobox) {
			// dataFromCombobox is a proxy for data from combobox's changed event,
			// if no combobox is present data will be undefined
			var pageInc;
			if (val !== this.lastPageInput) {
				this.lastPageInput = val;
				var value = parseInt(val, 10) - 1;
				pageInc = value - this.currentPage;
				this.$element.trigger('pageChanged.fu.repeater', [value, dataFromCombobox]);
				this.render({
					pageIncrement: pageInc
				});
			}
		},

		pagination: function pagination (data) {
			this.$primaryPaging.removeClass('active');
			this.$secondaryPaging.removeClass('active');

			var totalPages = data.pages;
			this.currentPage = (data.page !== undefined) ? data.page : NaN;
			// set paging to 0 if total pages is 0, otherwise use one-based index
			var currenPageOutput = totalPages === 0 ? 0 : this.currentPage + 1;

			if (totalPages <= this.viewOptions.dropPagingCap) {
				this.$primaryPaging.addClass('active');
				var dropMenu = this.$primaryPaging.find('.dropdown-menu');
				dropMenu.empty();
				for (var i = 0; i < totalPages; i++) {
					var l = i + 1;
					dropMenu.append('<li data-value="' + l + '"><a href="#">' + l + '</a></li>');
				}

				this.$primaryPaging.find('input.form-control').val(currenPageOutput);
			} else {
				this.$secondaryPaging.addClass('active');
				this.$secondaryPaging.val(currenPageOutput);
			}

			this.lastPageInput = this.currentPage + 1 + '';

			this.$pages.html('' + totalPages);

			// this is not the last page
			if ((this.currentPage + 1) < totalPages) {
				this.$nextBtn.removeAttr('disabled');
				this.$nextBtn.removeClass('page-end');
			} else {
				this.$nextBtn.attr('disabled', 'disabled');
				this.$nextBtn.addClass('page-end');
			}

			// this is not the first page
			if ((this.currentPage - 1) >= 0) {
				this.$prevBtn.removeAttr('disabled');
				this.$prevBtn.removeClass('page-end');
			} else {
				this.$prevBtn.attr('disabled', 'disabled');
				this.$prevBtn.addClass('page-end');
			}

			// return focus to next/previous buttons after navigating
			if (this.pageIncrement !== 0) {
				if (this.pageIncrement > 0) {
					if (this.$nextBtn.is(':disabled')) {
						// if you can't focus, go the other way
						this.$prevBtn.focus();
					} else {
						this.$nextBtn.focus();
					}
				} else if (this.$prevBtn.is(':disabled')) {
					// if you can't focus, go the other way
					this.$nextBtn.focus();
				} else {
					this.$prevBtn.focus();
				}
			}
		},

		previous: function previous () {
			this.$nextBtn.attr('disabled', 'disabled');
			this.$prevBtn.attr('disabled', 'disabled');
			this.pageIncrement = -1;
			this.$element.trigger('previousClicked.fu.repeater');
			this.render({
				pageIncrement: this.pageIncrement
			});
		},

		// This functions more as a "pre-render" than a true "render"
		render: function render (opts) {
			this.disable();

			var viewChanged = false;
			var viewTypeObj = $.fn.repeater.viewTypes[this.viewType] || {};
			var options = opts || {};

			if (options.changeView && (this.currentView !== options.changeView)) {
				var prevView = this.currentView;
				this.currentView = options.changeView;
				this.viewType = this.currentView.split('.')[0];
				this.setViewOptions(this.currentView);
				this.$element.attr('data-currentview', this.currentView);
				this.$element.attr('data-viewtype', this.viewType);
				viewChanged = true;
				options.viewChanged = viewChanged;

				this.$element.trigger('viewChanged.fu.repeater', this.currentView);

				if (this.infiniteScrollingEnabled) {
					this.infiniteScrolling(false);
				}

				viewTypeObj = $.fn.repeater.viewTypes[this.viewType] || {};
				if (viewTypeObj.selected) {
					viewTypeObj.selected.call(this, {
						prevView: prevView
					});
				}
			}

			this.syncViewButtonState();

			options.preserve = (options.preserve !== undefined) ? options.preserve : !viewChanged;
			this.clear(options);

			if (!this.infiniteScrollingEnabled || (this.infiniteScrollingEnabled && viewChanged)) {
				this.$loader.show().loader('play');
			}

			var dataOptions = this.getDataOptions(options);

			var beforeRender = this.viewOptions.dataSource;
			var repeaterPrototypeContext = this;
			beforeRender(
				dataOptions,
				// this serves as a bridge function to pass all required data through to the actual function
				// that does the rendering for us.
				function callDoRender (dataSourceReturnedData) {
					doRender.call(
						repeaterPrototypeContext,
						{
							data: dataSourceReturnedData,
							dataOptions: dataOptions,
							options: options,
							viewChanged: viewChanged,
							viewTypeObj: viewTypeObj
						}
					);
				}
			);
		},

		resize: function resize () {
			var staticHeight = (this.viewOptions.staticHeight === -1) ? this.$element.attr('data-staticheight') : this.viewOptions.staticHeight;
			var viewTypeObj = {};
			var height;
			var viewportMargins;
			var scrubbedElements = [];
			var previousProperties = [];
			//var $hiddenElements = this.$element.parentsUntil(':visible').addBack(); // del addBack() not supported by skyalrk
			var $hiddenElements = this.$element.parentsUntil(':visible');
			var currentHiddenElement;
			var currentElementIndex = 0;

			// Set parents to 'display:block' until repeater is visible again
			while (currentElementIndex < $hiddenElements.length && this.$element.is(':hidden')) {
				currentHiddenElement = $hiddenElements[currentElementIndex];
				// Only set display property on elements that are explicitly hidden (i.e. do not inherit it from their parent)
				if ($(currentHiddenElement).is(':hidden')) {
					previousProperties.push(currentHiddenElement.style['display']);
					currentHiddenElement.style['display'] = 'block';
					scrubbedElements.push(currentHiddenElement);
				}
				currentElementIndex++;
			}

			if (this.viewType) {
				viewTypeObj = $.fn.repeater.viewTypes[this.viewType] || {};
			}

			if (staticHeight !== undefined && staticHeight !== false && staticHeight !== 'false') {
				this.$canvas.addClass('scrolling');
				viewportMargins = {
					bottom: this.$viewport.css('margin-bottom'),
					top: this.$viewport.css('margin-top')
				};

				var staticHeightValue = (staticHeight === 'true' || staticHeight === true) ? this.$element.height() : parseInt(staticHeight, 10);
				var headerHeight = this.$element.find('.repeater-header').outerHeight();
				var footerHeight = this.$element.find('.repeater-footer').outerHeight();
				var bottomMargin = (viewportMargins.bottom === 'auto') ? 0 : parseInt(viewportMargins.bottom, 10);
				var topMargin = (viewportMargins.top === 'auto') ? 0 : parseInt(viewportMargins.top, 10);

				height = staticHeightValue - headerHeight - footerHeight - bottomMargin - topMargin;
				this.$viewport.outerHeight(height);
			} else {
				this.$canvas.removeClass('scrolling');
			}

			if (viewTypeObj.resize) {
				viewTypeObj.resize.call(this, {
					height: this.$element.outerHeight(),
					width: this.$element.outerWidth()
				});
			}

			scrubbedElements.forEach(function (element, i) {
				element.style['display'] = previousProperties[i];
			});
		},

		// e.g. "Rows" or "Thumbnails"
		renderItems: function renderItems (viewTypeObj, data, callback) {
			if (!viewTypeObj.render) {
				if (viewTypeObj.before) {
					var addBefore = viewTypeObj.before.call(this, {
						container: this.$canvas,
						data: data
					});
					addItem(this.$canvas, addBefore);
				}

				var $dataContainer = this.$canvas.find('[data-container="true"]:last');
				var $container = ($dataContainer.length > 0) ? $dataContainer : this.$canvas;

				// It appears that the following code would theoretically allow you to pass a deeply
				// nested value to "repeat on" to be added to the repeater.
				// eg. `data.foo.bar.items`
				if (viewTypeObj.renderItem) {
					var subset;
					var objectAndPropsToRepeatOnString = viewTypeObj.repeat || 'data.items';
					var objectAndPropsToRepeatOn = objectAndPropsToRepeatOnString.split('.');
					var objectToRepeatOn = objectAndPropsToRepeatOn[0];

					if (objectToRepeatOn === 'data' || objectToRepeatOn === 'this') {
						subset = (objectToRepeatOn === 'this') ? this : data;

						// Extracts subset from object chain (get `items` out of `foo.bar.items`). I think....
						var propsToRepeatOn = objectAndPropsToRepeatOn.slice(1);
						for (var prop = 0; prop < propsToRepeatOn.length; prop++) {
							if (subset[propsToRepeatOn[prop]] !== undefined) {
								subset = subset[propsToRepeatOn[prop]];
							} else {
								subset = [];
								logWarn('WARNING: Repeater unable to find property to iterate renderItem on.');
								break;
							}
						}

						for (var subItemIndex = 0; subItemIndex < subset.length; subItemIndex++) {
							var addSubItem = viewTypeObj.renderItem.call(this, {
								container: $container,
								data: data,
								index: subItemIndex,
								subset: subset
							});
							addItem($container, addSubItem);
						}
					} else {
						logWarn('WARNING: Repeater plugin "repeat" value must start with either "data" or "this"');
					}
				}

				if (viewTypeObj.after) {
					var addAfter = viewTypeObj.after.call(this, {
						container: this.$canvas,
						data: data
					});
					addItem(this.$canvas, addAfter);
				}

				callback(data);
			} else {
				viewTypeObj.render.call(this, {
					container: this.$canvas,
					data: data
				}, callback);
			}
		},

		setViewOptions: function setViewOptions (curView) {
			var opts = {};
			var viewName = curView.split('.')[1];

			if (this.options.views) {
				opts = this.options.views[viewName] || this.options.views[curView] || {};
			} else {
				opts = {};
			}

			this.viewOptions = langx.mixin({}, this.options, opts);
		},

		viewChanged: function viewChanged (e) {
			var $selected = $(e.target);
			var val = $selected.val();

			if (!this.syncingViewButtonState) {
				if (this.isDisabled || $selected.parents('label:first').hasClass('disabled')) {
					this.syncViewButtonState();
				} else {
					this.render({
						changeView: val,
						pageIncrement: null
					});
				}
			}
		},

		syncViewButtonState: function syncViewButtonState () {
			var $itemToCheck = this.$views.find('input[value="' + this.currentView + '"]');

			this.syncingViewButtonState = true;
			this.$views.find('input').prop('checked', false);
			this.$views.find('label.active').removeClass('active');

			if ($itemToCheck.length > 0) {
				$itemToCheck.prop('checked', true);
				$itemToCheck.parents('label:first').addClass('active');
			}
			this.syncingViewButtonState = false;
		}
		
	});

	var logWarn = function logWarn (msg) {
		if (window.console && window.console.warn) {
			window.console.warn(msg);
		}
	};

	var scan = function scan (cont) {
		var keep = [];
		cont.children().each(function eachContainerChild () {
			var item = $(this);
			var pres = item.attr('data-preserve');
			if (pres === 'deep') {
				item.detach();
				keep.push(item);
			} else if (pres === 'shallow') {
				scan(item);
				item.detach();
				keep.push(item);
			}
		});
		cont.empty();
		cont.append(keep);
	};

	var addItem = function addItem ($parent, response) {
		var action;
		if (response) {
			action = (response.action) ? response.action : 'append';
			if (action !== 'none' && response.item !== undefined) {
				var $container = (response.container !== undefined) ? $(response.container) : $parent;
				$container[action](response.item);
			}
		}
	};

	var callNextInit = function callNextInit (currentViewType, viewTypes, callback) {
		var nextViewType = currentViewType + 1;
		if (nextViewType < viewTypes.length) {
			initViewType.call(this, nextViewType, viewTypes, callback);
		} else {
			callback();
		}
	};

	var initViewType = function initViewType (currentViewtype, viewTypes, callback) {
		if (viewTypes[currentViewtype].initialize) {
			viewTypes[currentViewtype].initialize.call(this, {}, function afterInitialize () {
				callNextInit.call(this, currentViewtype, viewTypes, callback);
			});
		} else {
			callNextInit.call(this, currentViewtype, viewTypes, callback);
		}
	};

	// Does all of our cleanup post-render
	var afterRender = function afterRender (state) {
		var data = state.data || {};

		if (this.infiniteScrollingEnabled) {
			if (state.viewChanged || state.options.clearInfinite) {
				this.initInfiniteScrolling();
			}

			this.infiniteScrollPaging(data, state.options);
		}

		this.$loader.hide().loader('pause');
		this.enable();

		this.$search.trigger('rendered.fu.repeater', {
			data: data,
			options: state.dataOptions,
			renderOptions: state.options
		});
		this.$element.trigger('rendered.fu.repeater', {
			data: data,
			options: state.dataOptions,
			renderOptions: state.options
		});

		// for maintaining support of 'loaded' event
		this.$element.trigger('loaded.fu.repeater', state.dataOptions);
	};

	// This does the actual rendering of the repeater
	var doRender = function doRender (state) {
		var data = state.data || {};

		if (this.infiniteScrollingEnabled) {
			// pass empty object because data handled in infiniteScrollPaging method
			this.infiniteScrollingCallback({});
		} else {
			this.itemization(data);
			this.pagination(data);
		}

		var self = this;
		this.renderItems(
			state.viewTypeObj,
			data,
			function callAfterRender (d) {
				state.data = d;
				afterRender.call(self, state);
			}
		);
	};



	// For backwards compatibility.
	Repeater.prototype.runRenderer = Repeater.prototype.renderItems;

	// REPEATER PLUGIN DEFINITION

	$.fn.repeater = function fnrepeater (option) {
		var args = Array.prototype.slice.call(arguments, 1);
		var methodReturn;

		var $set = this.each(function eachThis () {
			var $this = $(this);
			var data = $this.data('fu.repeater');
			var options = typeof option === 'object' && option;

			if (!data) {
				$this.data('fu.repeater', (data = new Repeater(this, options)));
			}

			if (typeof option === 'string') {
				methodReturn = data[option].apply(data, args);
			}
		});

		return (methodReturn === undefined) ? $set : methodReturn;
	};

	$.fn.repeater.defaults = {
		dataSource: function dataSource (options, callback) {
			callback({ count: 0, end: 0, items: [], page: 0, pages: 1, start: 0 });
		},
		defaultView: -1, // should be a string value. -1 means it will grab the active view from the view controls
		dropPagingCap: 10,
		staticHeight: -1, // normally true or false. -1 means it will look for data-staticheight on the element
		views: null, // can be set to an object to configure multiple views of the same type,
		searchOnKeyPress: false,
		allowCancel: true
	};

	$.fn.repeater.viewTypes = {};

	$.fn.repeater.Constructor = Repeater;

	$.fn.repeater.noConflict = function noConflict () {
		$.fn.repeater = old;
		return this;
	};


	return $.fn.repeater;

});

define('skylark-fuelux/repeater-list',[
  "skylark-langx/langx",
  "skylark-utils-dom/browser",
  "skylark-utils-dom/eventer",
  "skylark-utils-dom/noder",
  "skylark-utils-dom/geom",
  "skylark-utils-dom/query",
  "./repeater"
],function(langx,browser,eventer,noder,geom,$){

	/*
	 * Fuel UX Checkbox
	 * https://github.com/ExactTarget/fuelux
	 *
	 * Copyright (c) 2014 ExactTarget
	 * Licensed under the BSD New license.
	 */

	if ($.fn.repeater) {
		// ADDITIONAL METHODS
		$.fn.repeater.Constructor.prototype.list_clearSelectedItems = function listClearSelectedItems () {
			this.$canvas.find('.repeater-list-check').remove();
			this.$canvas.find('.repeater-list table tbody tr.selected').removeClass('selected');
		};

		$.fn.repeater.Constructor.prototype.list_highlightColumn = function listHighlightColumn (index, force) {
			var tbody = this.$canvas.find('.repeater-list-wrapper > table tbody');
			if (this.viewOptions.list_highlightSortedColumn || force) {
				tbody.find('td.sorted').removeClass('sorted');
				tbody.find('tr').each(function eachTR () {
					var col = $(this).find('td:nth-child(' + (index + 1) + ')').filter(function filterChildren () { return !$(this).parent().hasClass('empty'); });
					col.addClass('sorted');
				});
			}
		};

		$.fn.repeater.Constructor.prototype.list_getSelectedItems = function listGetSelectedItems () {
			var selected = [];
			this.$canvas.find('.repeater-list .repeater-list-wrapper > table tbody tr.selected').each(function eachSelectedTR () {
				var $item = $(this);
				selected.push({
					data: $item.data('item_data'),
					element: $item
				});
			});
			return selected;
		};

		$.fn.repeater.Constructor.prototype.getValue = $.fn.repeater.Constructor.prototype.list_getSelectedItems;

		$.fn.repeater.Constructor.prototype.list_positionHeadings = function listPositionHeadings () {
			var $wrapper = this.$element.find('.repeater-list-wrapper');
			var offsetLeft = $wrapper.offset().left;
			var scrollLeft = $wrapper.scrollLeft();
			if (scrollLeft > 0) {
				$wrapper.find('.repeater-list-heading').each(function eachListHeading () {
					var $heading = $(this);
					var left = ($heading.parents('th:first').offset().left - offsetLeft) + 'px';
					$heading.addClass('shifted').css('left', left);
				});
			} else {
				$wrapper.find('.repeater-list-heading').each(function eachListHeading () {
					$(this).removeClass('shifted').css('left', '');
				});
			}
		};

		$.fn.repeater.Constructor.prototype.list_setSelectedItems = function listSetSelectedItems (itms, force) {
			var selectable = this.viewOptions.list_selectable;
			var self = this;
			var data;
			var i;
			var $item;
			var length;

			var items = itms;
			if (!$.isArray(items)) {
				items = [items];
			}

			// this function is necessary because lint yells when a function is in a loop
			var checkIfItemMatchesValue = function checkIfItemMatchesValue (rowIndex) {
				$item = $(this);

				data = $item.data('item_data') || {};
				if (data[items[i].property] === items[i].value) {
					selectItem($item, items[i].selected, rowIndex);
				}
			};

			var selectItem = function selectItem ($itm, slct, index) {
				var $frozenCols;

				var select = (slct !== undefined) ? slct : true;
				if (select) {
					if (!force && selectable !== 'multi') {
						self.list_clearSelectedItems();
					}

					if (!$itm.hasClass('selected')) {
						$itm.addClass('selected');

						if (self.viewOptions.list_frozenColumns || self.viewOptions.list_selectable === 'multi') {
							$frozenCols = self.$element.find('.frozen-column-wrapper tr:nth-child(' + (index + 1) + ')');

							$frozenCols.addClass('selected');
							$frozenCols.find('.repeater-select-checkbox').addClass('checked');
						}

						if (self.viewOptions.list_actions) {
							self.$element.find('.actions-column-wrapper tr:nth-child(' + (index + 1) + ')').addClass('selected');
						}

						$itm.find('td:first').prepend('<div class="repeater-list-check"><span class="glyphicon glyphicon-ok"></span></div>');
					}
				} else {
					if (self.viewOptions.list_frozenColumns) {
						$frozenCols = self.$element.find('.frozen-column-wrapper tr:nth-child(' + (index + 1) + ')');

						$frozenCols.addClass('selected');
						$frozenCols.find('.repeater-select-checkbox').removeClass('checked');
					}

					if (self.viewOptions.list_actions) {
						self.$element.find('.actions-column-wrapper tr:nth-child(' + (index + 1) + ')').removeClass('selected');
					}

					$itm.find('.repeater-list-check').remove();
					$itm.removeClass('selected');
				}
			};

			if (force === true || selectable === 'multi') {
				length = items.length;
			} else if (selectable) {
				length = (items.length > 0) ? 1 : 0;
			} else {
				length = 0;
			}

			for (i = 0; i < length; i++) {
				if (items[i].index !== undefined) {
					$item = this.$canvas.find('.repeater-list .repeater-list-wrapper > table tbody tr:nth-child(' + (items[i].index + 1) + ')');
					if ($item.length > 0) {
						selectItem($item, items[i].selected, items[i].index);
					}
				} else if (items[i].property !== undefined && items[i].value !== undefined) {
					this.$canvas.find('.repeater-list .repeater-list-wrapper > table tbody tr').each(checkIfItemMatchesValue);
				}
			}
		};

		$.fn.repeater.Constructor.prototype.list_sizeHeadings = function listSizeHeadings () {
			var $table = this.$element.find('.repeater-list table');
			$table.find('thead th').each(function eachTH () {
				var $th = $(this);
				var $heading = $th.find('.repeater-list-heading');
				$heading.css({ height: $th.outerHeight() });
				$heading.outerWidth($heading.data('forced-width') || $th.outerWidth());
			});
		};

		$.fn.repeater.Constructor.prototype.list_setFrozenColumns = function listSetFrozenColumns () {
			var frozenTable = this.$canvas.find('.table-frozen');
			var $wrapper = this.$element.find('.repeater-canvas');
			var $table = this.$element.find('.repeater-list .repeater-list-wrapper > table');
			var repeaterWrapper = this.$element.find('.repeater-list');
			var numFrozenColumns = this.viewOptions.list_frozenColumns;
			var self = this;

			if (this.viewOptions.list_selectable === 'multi') {
				numFrozenColumns = numFrozenColumns + 1;
				$wrapper.addClass('multi-select-enabled');
			}

			if (frozenTable.length < 1) {
				// setup frozen column markup
				// main wrapper and remove unneeded columns
				var $frozenColumnWrapper = $('<div class="frozen-column-wrapper"></div>').insertBefore($table);
				var $frozenColumn = $table.clone().addClass('table-frozen');
				$frozenColumn.find('th:not(:lt(' + numFrozenColumns + '))').remove();
				$frozenColumn.find('td:not(:nth-child(n+0):nth-child(-n+' + numFrozenColumns + '))').remove();

				// need to set absolute heading for vertical scrolling
				var $frozenThead = $frozenColumn.clone().removeClass('table-frozen');
				$frozenThead.find('tbody').remove();
				var $frozenTheadWrapper = $('<div class="frozen-thead-wrapper"></div>').append($frozenThead);

				// this gets a little messy with all the cloning. We need to make sure the ID and FOR
				// attribs are unique for the 'top most' cloned checkbox
				var $checkboxLabel = $frozenTheadWrapper.find('th label.checkbox-custom.checkbox-inline');
				$checkboxLabel.attr('id', $checkboxLabel.attr('id') + '_cloned');

				$frozenColumnWrapper.append($frozenColumn);
				repeaterWrapper.append($frozenTheadWrapper);
				this.$canvas.addClass('frozen-enabled');
			}

			this.list_sizeFrozenColumns();

			$('.frozen-thead-wrapper .repeater-list-heading').on('click', function onClickHeading () {
				var index = $(this).parent('th').index();
				index = index + 1;
				self.$element.find('.repeater-list-wrapper > table thead th:nth-child(' + index + ') .repeater-list-heading')[0].click();
			});
		};

		$.fn.repeater.Constructor.prototype.list_positionColumns = function listPositionColumns () {
			var $wrapper = this.$element.find('.repeater-canvas');
			var scrollTop = $wrapper.scrollTop();
			var scrollLeft = $wrapper.scrollLeft();
			var frozenEnabled = this.viewOptions.list_frozenColumns || this.viewOptions.list_selectable === 'multi';
			var actionsEnabled = this.viewOptions.list_actions;

			var canvasWidth = this.$element.find('.repeater-canvas').outerWidth();
			var tableWidth = this.$element.find('.repeater-list .repeater-list-wrapper > table').outerWidth();

			var actionsWidth = this.$element.find('.table-actions') ? this.$element.find('.table-actions').outerWidth() : 0;

			var shouldScroll = (tableWidth - (canvasWidth - actionsWidth)) >= scrollLeft;


			if (scrollTop > 0) {
				$wrapper.find('.repeater-list-heading').css('top', scrollTop);
			} else {
				$wrapper.find('.repeater-list-heading').css('top', '0');
			}

			if (scrollLeft > 0) {
				if (frozenEnabled) {
					$wrapper.find('.frozen-thead-wrapper').css('left', scrollLeft);
					$wrapper.find('.frozen-column-wrapper').css('left', scrollLeft);
				}
				if (actionsEnabled && shouldScroll) {
					$wrapper.find('.actions-thead-wrapper').css('right', -scrollLeft);
					$wrapper.find('.actions-column-wrapper').css('right', -scrollLeft);
				}
			} else {
				if (frozenEnabled) {
					$wrapper.find('.frozen-thead-wrapper').css('left', '0');
					$wrapper.find('.frozen-column-wrapper').css('left', '0');
				}
				if (actionsEnabled) {
					$wrapper.find('.actions-thead-wrapper').css('right', '0');
					$wrapper.find('.actions-column-wrapper').css('right', '0');
				}
			}
		};

		$.fn.repeater.Constructor.prototype.list_createItemActions = function listCreateItemActions () {
			var actionsHtml = '';
			var self = this;
			var i;
			var length;
			var $table = this.$element.find('.repeater-list .repeater-list-wrapper > table');
			var $actionsTable = this.$canvas.find('.table-actions');

			for (i = 0, length = this.viewOptions.list_actions.items.length; i < length; i++) {
				var action = this.viewOptions.list_actions.items[i];
				var html = action.html;

				actionsHtml += '<li><a href="#" data-action="' + action.name + '" class="action-item"> ' + html + '</a></li>';
			}

			var actionsDropdown = '<div class="btn-group">' +
				'<button type="button" class="btn btn-xs btn-default dropdown-toggle repeater-actions-button" data-toggle="dropdown" data-flip="auto" aria-expanded="false">' +
				'<span class="caret"></span>' +
				'</button>' +
				'<ul class="dropdown-menu dropdown-menu-right" role="menu">' +
				actionsHtml +
				'</ul></div>';

			if ($actionsTable.length < 1) {
				var $actionsColumnWrapper = $('<div class="actions-column-wrapper" style="width: ' + this.list_actions_width + 'px"></div>').insertBefore($table);
				var $actionsColumn = $table.clone().addClass('table-actions');
				$actionsColumn.find('th:not(:last-child)').remove();
				$actionsColumn.find('tr td:not(:last-child)').remove();

				// Dont show actions dropdown in header if not multi select
				if (this.viewOptions.list_selectable === 'multi' || this.viewOptions.list_selectable === 'action') {
					$actionsColumn.find('thead tr').html('<th><div class="repeater-list-heading">' + actionsDropdown + '</div></th>');

					if (this.viewOptions.list_selectable !== 'action') {
						// disable the header dropdown until an item is selected
						$actionsColumn.find('thead .btn').attr('disabled', 'disabled');
					}
				} else {
					var label = this.viewOptions.list_actions.label || '<span class="actions-hidden">a</span>';
					$actionsColumn.find('thead tr').addClass('empty-heading').html('<th>' + label + '<div class="repeater-list-heading">' + label + '</div></th>');
				}

				// Create Actions dropdown for each cell in actions table
				var $actionsCells = $actionsColumn.find('td');

				$actionsCells.each(function addActionsDropdown (rowNumber) {
					$(this).html(actionsDropdown);
					$(this).find('a').attr('data-row', rowNumber + 1);
				});

				$actionsColumnWrapper.append($actionsColumn);

				this.$canvas.addClass('actions-enabled');
			}

			this.list_sizeActionsTable();

			// row level actions click
			this.$element.find('.table-actions tbody .action-item').on('click', function onBodyActionItemClick (e) {
				if (!self.isDisabled) {
					var actionName = $(this).data('action');
					var row = $(this).data('row');
					var selected = {
						actionName: actionName,
						rows: [row]
					};
					self.list_getActionItems(selected, e);
				}
			});
			// bulk actions click
			this.$element.find('.table-actions thead .action-item').on('click', function onHeadActionItemClick (e) {
				if (!self.isDisabled) {
					var actionName = $(this).data('action');
					var selected = {
						actionName: actionName,
						rows: []
					};
					var selector = '.repeater-list-wrapper > table .selected';

					if ( self.viewOptions.list_selectable === 'action' ) {
						selector = '.repeater-list-wrapper > table tr';
					}
					self.$element.find(selector).each(function eachSelector (selectorIndex) {
						selected.rows.push(selectorIndex + 1);
					});

					self.list_getActionItems(selected, e);
				}
			});
		};

		$.fn.repeater.Constructor.prototype.list_getActionItems = function listGetActionItems (selected, e) {
			var selectedObj = [];
			var actionObj = $.grep(this.viewOptions.list_actions.items, function matchedActions (actions) {
				return actions.name === selected.actionName;
			})[0];
			for (var i = 0, selectedRowsL = selected.rows.length; i < selectedRowsL; i++) {
				var clickedRow = this.$canvas.find('.repeater-list-wrapper > table tbody tr:nth-child(' + selected.rows[i] + ')');
				selectedObj.push({
					item: clickedRow,
					rowData: clickedRow.data('item_data')
				});
			}
			if (selectedObj.length === 1) {
				selectedObj = selectedObj[0];
			}

			if (actionObj.clickAction) {
				var callback = function noop () {};// for backwards compatibility. No idea why this was originally here...
				actionObj.clickAction(selectedObj, callback, e);
			}
		};

		$.fn.repeater.Constructor.prototype.list_sizeActionsTable = function listSizeActionsTable () {
			var $actionsTable = this.$element.find('.repeater-list table.table-actions');
			var $actionsTableHeader = $actionsTable.find('thead tr th');
			var $table = this.$element.find('.repeater-list-wrapper > table');

			$actionsTableHeader.outerHeight($table.find('thead tr th').outerHeight());
			$actionsTableHeader.find('.repeater-list-heading').outerHeight($actionsTableHeader.outerHeight());
			$actionsTable.find('tbody tr td:first-child').each(function eachFirstChild (i) {
				$(this).outerHeight($table.find('tbody tr:eq(' + i + ') td').outerHeight());
			});
		};

		$.fn.repeater.Constructor.prototype.list_sizeFrozenColumns = function listSizeFrozenColumns () {
			var $table = this.$element.find('.repeater-list .repeater-list-wrapper > table');

			this.$element.find('.repeater-list table.table-frozen tr').each(function eachTR (i) {
				$(this).height($table.find('tr:eq(' + i + ')').height());
			});

			var columnWidth = $table.find('td:eq(0)').outerWidth();
			this.$element.find('.frozen-column-wrapper, .frozen-thead-wrapper').width(columnWidth);
		};

		$.fn.repeater.Constructor.prototype.list_frozenOptionsInitialize = function listFrozenOptionsInitialize () {
			var $checkboxes = this.$element.find('.frozen-column-wrapper .checkbox-inline');
			var $headerCheckbox = this.$element.find('.header-checkbox .checkbox-custom');
			var $everyTable = this.$element.find('.repeater-list table');
			var self = this;

			// Make sure if row is hovered that it is shown in frozen column as well
			this.$element.find('tr.selectable').on('mouseover mouseleave', function onMouseEvents (e) {
				var index = $(this).index();
				index = index + 1;
				if (e.type === 'mouseover') {
					$everyTable.find('tbody tr:nth-child(' + index + ')').addClass('hovered');
				} else {
					$everyTable.find('tbody tr:nth-child(' + index + ')').removeClass('hovered');
				}
			});

			$headerCheckbox.checkbox();
			$checkboxes.checkbox();

			// Row checkboxes
			var $rowCheckboxes = this.$element.find('.table-frozen tbody .checkbox-inline');
			var $checkAll = this.$element.find('.frozen-thead-wrapper thead .checkbox-inline input');
			$rowCheckboxes.on('change', function onChangeRowCheckboxes (e) {
				e.preventDefault();

				if (!self.list_revertingCheckbox) {
					if (self.isDisabled) {
						revertCheckbox($(e.currentTarget));
					} else {
						var row = $(this).attr('data-row');
						row = parseInt(row, 10) + 1;
						self.$element.find('.repeater-list-wrapper > table tbody tr:nth-child(' + row + ')').click();

						var numSelected = self.$element.find('.table-frozen tbody .checkbox-inline.checked').length;
						if (numSelected === 0) {
							$checkAll.prop('checked', false);
							$checkAll.prop('indeterminate', false);
						} else if (numSelected === $rowCheckboxes.length) {
							$checkAll.prop('checked', true);
							$checkAll.prop('indeterminate', false);
						} else {
							$checkAll.prop('checked', false);
							$checkAll.prop('indeterminate', true);
						}
					}
				}
			});

			// "Check All" checkbox
			$checkAll.on('change', function onChangeCheckAll (e) {
				if (!self.list_revertingCheckbox) {
					if (self.isDisabled) {
						revertCheckbox($(e.currentTarget));
					} else if ($(this).is(':checked')) {
						self.$element.find('.repeater-list-wrapper > table tbody tr:not(.selected)').click();
						self.$element.trigger('selected.fu.repeaterList', $checkboxes);
					} else {
						self.$element.find('.repeater-list-wrapper > table tbody tr.selected').click();
						self.$element.trigger('deselected.fu.repeaterList', $checkboxes);
					}
				}
			});

			function revertCheckbox ($checkbox) {
				self.list_revertingCheckbox = true;
				$checkbox.checkbox('toggle');
				delete self.list_revertingCheckbox;
			}
		};

		// ADDITIONAL DEFAULT OPTIONS
		$.fn.repeater.defaults = langx.mixin({}, $.fn.repeater.defaults, {
			list_columnRendered: null,
			list_columnSizing: true,
			list_columnSyncing: true,
			list_highlightSortedColumn: true,
			list_infiniteScroll: false,
			list_noItemsHTML: 'no items found',
			list_selectable: false,
			list_sortClearing: false,
			list_rowRendered: null,
			list_frozenColumns: 0,
			list_actions: false
		});

		// EXTENSION DEFINITION
		$.fn.repeater.viewTypes.list = {
			cleared: function cleared () {
				if (this.viewOptions.list_columnSyncing) {
					this.list_sizeHeadings();
				}
			},
			dataOptions: function dataOptions (options) {
				if (this.list_sortDirection) {
					options.sortDirection = this.list_sortDirection;
				}
				if (this.list_sortProperty) {
					options.sortProperty = this.list_sortProperty;
				}
				return options;
			},
			enabled: function enabled (helpers) {
				if (this.viewOptions.list_actions) {
					if (!helpers.status) {
						this.$canvas.find('.repeater-actions-button').attr('disabled', 'disabled');
					} else {
						this.$canvas.find('.repeater-actions-button').removeAttr('disabled');
						toggleActionsHeaderButton.call(this);
					}
				}
			},
			initialize: function initialize (helpers, callback) {
				this.list_sortDirection = null;
				this.list_sortProperty = null;
				this.list_specialBrowserClass = specialBrowserClass();
				this.list_actions_width = (this.viewOptions.list_actions.width !== undefined) ? this.viewOptions.list_actions.width : 37;
				this.list_noItems = false;
				callback();
			},
			resize: function resize () {
				sizeColumns.call(this, this.$element.find('.repeater-list-wrapper > table thead tr'));
				if (this.viewOptions.list_actions) {
					this.list_sizeActionsTable();
				}
				if (this.viewOptions.list_frozenColumns || this.viewOptions.list_selectable === 'multi') {
					this.list_sizeFrozenColumns();
				}
				if (this.viewOptions.list_columnSyncing) {
					this.list_sizeHeadings();
				}
			},
			selected: function selected () {
				var infScroll = this.viewOptions.list_infiniteScroll;
				var opts;

				this.list_firstRender = true;
				this.$loader.addClass('noHeader');

				if (infScroll) {
					opts = (typeof infScroll === 'object') ? infScroll : {};
					this.infiniteScrolling(true, opts);
				}
			},
			before: function before (helpers) {
				var $listContainer = helpers.container.find('.repeater-list');
				var self = this;
				var $table;

				// this is a patch, it was pulled out of `renderThead`
				if (helpers.data.count > 0) {
					this.list_noItems = false;
				} else {
					this.list_noItems = true;
				}

				if ($listContainer.length < 1) {
					$listContainer = $('<div class="repeater-list ' + this.list_specialBrowserClass + '" data-preserve="shallow"><div class="repeater-list-wrapper" data-infinite="true" data-preserve="shallow"><table aria-readonly="true" class="table" data-preserve="shallow" role="grid"></table></div></div>');
					$listContainer.find('.repeater-list-wrapper').on('scroll.fu.repeaterList', function onScrollRepeaterList () {
						if (self.viewOptions.list_columnSyncing) {
							self.list_positionHeadings();
						}
					});
					if (self.viewOptions.list_frozenColumns || self.viewOptions.list_actions || self.viewOptions.list_selectable === 'multi') {
						helpers.container.on('scroll.fu.repeaterList', function onScrollRepeaterList () {
							self.list_positionColumns();
						});
					}

					helpers.container.append($listContainer);
				}
				helpers.container.removeClass('actions-enabled actions-enabled multi-select-enabled');

				$table = $listContainer.find('table');
				renderThead.call(this, $table, helpers.data);
				renderTbody.call(this, $table, helpers.data);

				return false;
			},
			renderItem: function renderItem (helpers) {
				renderRow.call(this, helpers.container, helpers.subset, helpers.index);
				return false;
			},
			after: function after () {
				var $sorted;

				if ((this.viewOptions.list_frozenColumns || this.viewOptions.list_selectable === 'multi') && !this.list_noItems) {
					this.list_setFrozenColumns();
				}

				if (this.viewOptions.list_actions && !this.list_noItems) {
					this.list_createItemActions();
					this.list_sizeActionsTable();
				}

				if ((this.viewOptions.list_frozenColumns || this.viewOptions.list_actions || this.viewOptions.list_selectable === 'multi') && !this.list_noItems) {
					this.list_positionColumns();
					this.list_frozenOptionsInitialize();
				}

				if (this.viewOptions.list_columnSyncing) {
					this.list_sizeHeadings();
					this.list_positionHeadings();
				}

				$sorted = this.$canvas.find('.repeater-list-wrapper > table .repeater-list-heading.sorted');
				if ($sorted.length > 0) {
					this.list_highlightColumn($sorted.data('fu_item_index'));
				}

				return false;
			}
		};
	}

	// ADDITIONAL METHODS
	var areDifferentColumns = function areDifferentColumns (oldCols, newCols) {
		if (!newCols) {
			return false;
		}
		if (!oldCols || (newCols.length !== oldCols.length)) {
			return true;
		}
		for (var i = 0, newColsL = newCols.length; i < newColsL; i++) {
			if (!oldCols[i]) {
				return true;
			}

			for (var j in newCols[i]) {
				if (newCols[i].hasOwnProperty(j) && oldCols[i][j] !== newCols[i][j]) {
					return true;
				}
			}
		}
		return false;
	};

	var renderColumn = function renderColumn ($row, rows, rowIndex, columns, columnIndex) {
		var className = columns[columnIndex].className;
		var content = rows[rowIndex][columns[columnIndex].property];
		var $col = $('<td></td>');
		var width = columns[columnIndex]._auto_width;

		var property = columns[columnIndex].property;
		if (this.viewOptions.list_actions !== false && property === '@_ACTIONS_@') {
			content = '<div class="repeater-list-actions-placeholder" style="width: ' + this.list_actions_width  + 'px"></div>';
		}

		content = (content !== undefined) ? content : '';

		$col.addClass(((className !== undefined) ? className : '')).append(content);
		if (width !== undefined) {
			$col.outerWidth(width);
		}

		$row.append($col);

		if (this.viewOptions.list_selectable === 'multi' && columns[columnIndex].property === '@_CHECKBOX_@') {
			var checkBoxMarkup = '<label data-row="' + rowIndex + '" class="checkbox-custom checkbox-inline body-checkbox repeater-select-checkbox">' +
				'<input class="sr-only" type="checkbox"></label>';

			$col.html(checkBoxMarkup);
		}

		return $col;
	};

	var renderHeader = function renderHeader ($tr, columns, index) {
		var chevDown = 'glyphicon-chevron-down';
		var chevron = '.glyphicon.rlc:first';
		var chevUp = 'glyphicon-chevron-up';
		var $div = $('<div class="repeater-list-heading"><span class="glyphicon rlc"></span></div>');
		var checkAllID = (this.$element.attr('id') + '_' || '') + 'checkall';

		var checkBoxMarkup = '<div class="repeater-list-heading header-checkbox">' +
				'<label id="' + checkAllID + '" class="checkbox-custom checkbox-inline">' +
					'<input class="sr-only" type="checkbox" value="">' +
					'<span class="checkbox-label">&nbsp;</span>' +
				'</label>' +
			'</div>';

		var $header = $('<th></th>');
		var self = this;
		var $both;
		var className;
		var sortable;
		var $span;
		var $spans;

		$div.data('fu_item_index', index);
		$div.prepend(columns[index].label);
		$header.html($div.html()).find('[id]').removeAttr('id');

		if (columns[index].property !== '@_CHECKBOX_@') {
			$header.append($div);
		} else {
			$header.append(checkBoxMarkup);
		}

		$both = $header.add($div);
		$span = $div.find(chevron);
		$spans = $span.add($header.find(chevron));

		if (this.viewOptions.list_actions && columns[index].property === '@_ACTIONS_@') {
			var width = this.list_actions_width;
			$header.css('width', width);
			$div.css('width', width);
		}

		className = columns[index].className;
		if (className !== undefined) {
			$both.addClass(className);
		}

		sortable = columns[index].sortable;
		if (sortable) {
			$both.addClass('sortable');
			$div.on('click.fu.repeaterList', function onClickRepeaterList () {
				if (!self.isDisabled) {
					self.list_sortProperty = (typeof sortable === 'string') ? sortable : columns[index].property;
					if ($div.hasClass('sorted')) {
						if ($span.hasClass(chevUp)) {
							$spans.removeClass(chevUp).addClass(chevDown);
							self.list_sortDirection = 'desc';
						} else if (!self.viewOptions.list_sortClearing) {
							$spans.removeClass(chevDown).addClass(chevUp);
							self.list_sortDirection = 'asc';
						} else {
							$both.removeClass('sorted');
							$spans.removeClass(chevDown);
							self.list_sortDirection = null;
							self.list_sortProperty = null;
						}
					} else {
						$tr.find('th, .repeater-list-heading').removeClass('sorted');
						$spans.removeClass(chevDown).addClass(chevUp);
						self.list_sortDirection = 'asc';
						$both.addClass('sorted');
					}

					self.render({
						clearInfinite: true,
						pageIncrement: null
					});
				}
			});
		}

		if (columns[index].sortDirection === 'asc' || columns[index].sortDirection === 'desc') {
			$tr.find('th, .repeater-list-heading').removeClass('sorted');
			$both.addClass('sortable sorted');
			if (columns[index].sortDirection === 'asc') {
				$spans.addClass(chevUp);
				this.list_sortDirection = 'asc';
			} else {
				$spans.addClass(chevDown);
				this.list_sortDirection = 'desc';
			}

			this.list_sortProperty = (typeof sortable === 'string') ? sortable : columns[index].property;
		}

		$tr.append($header);
	};

	var onClickRowRepeaterList = function onClickRowRepeaterList (repeater) {
		var isMulti = repeater.viewOptions.list_selectable === 'multi';
		var isActions = repeater.viewOptions.list_actions;
		var $repeater = repeater.$element;

		if (!repeater.isDisabled) {
			var $item = $(this);
			var index = $(this).index() + 1;
			var $frozenRow = $repeater.find('.frozen-column-wrapper tr:nth-child(' + index + ')');
			var $actionsRow = $repeater.find('.actions-column-wrapper tr:nth-child(' + index + ')');
			var $checkBox = $repeater.find('.frozen-column-wrapper tr:nth-child(' + index + ') .checkbox-inline');

			if ($item.is('.selected')) {
				$item.removeClass('selected');
				if (isMulti) {
					$checkBox.click();
					$frozenRow.removeClass('selected');
					if (isActions) {
						$actionsRow.removeClass('selected');
					}
				} else {
					$item.find('.repeater-list-check').remove();
				}

				$repeater.trigger('deselected.fu.repeaterList', $item);
			} else {
				if (!isMulti) {
					repeater.$canvas.find('.repeater-list-check').remove();
					repeater.$canvas.find('.repeater-list tbody tr.selected').each(function deslectRow () {
						$(this).removeClass('selected');
						$repeater.trigger('deselected.fu.repeaterList', $(this));
					});
					$item.find('td:first').prepend('<div class="repeater-list-check"><span class="glyphicon glyphicon-ok"></span></div>');
					$item.addClass('selected');
					$frozenRow.addClass('selected');
				} else {
					$checkBox.click();
					$item.addClass('selected');
					$frozenRow.addClass('selected');
					if (isActions) {
						$actionsRow.addClass('selected');
					}
				}
				$repeater.trigger('selected.fu.repeaterList', $item);
			}

			toggleActionsHeaderButton.call(repeater);
		}
	};

	var renderRow = function renderRow ($tbody, rows, index) {
		var $row = $('<tr></tr>');

		if (this.viewOptions.list_selectable) {
			$row.data('item_data', rows[index]);

			if (this.viewOptions.list_selectable !== 'action') {
				$row.addClass('selectable');
				$row.attr('tabindex', 0);	// allow items to be tabbed to / focused on

				var repeater = this;
				$row.on('click.fu.repeaterList', function callOnClickRowRepeaterList() {
					onClickRowRepeaterList.call(this, repeater);
				});

				// allow selection via enter key
				$row.keyup(function onRowKeyup (e) {
					if (e.keyCode === 13) {
						// triggering a standard click event to be caught by the row click handler above
						$row.trigger('click.fu.repeaterList');
					}
				});
			}
		}

		if (this.viewOptions.list_actions && !this.viewOptions.list_selectable) {
			$row.data('item_data', rows[index]);
		}

		var columns = [];
		for (var i = 0, length = this.list_columns.length; i < length; i++) {
			columns.push(renderColumn.call(this, $row, rows, index, this.list_columns, i));
		}

		$tbody.append($row);

		if (this.viewOptions.list_columnRendered) {
			for (var columnIndex = 0, colLength = columns.length; columnIndex < colLength; columnIndex++) {
				if (!(this.list_columns[columnIndex].property === '@_CHECKBOX_@' || this.list_columns[columnIndex].property === '@_ACTIONS_@')) {
					this.viewOptions.list_columnRendered({
						container: $row,
						columnAttr: this.list_columns[columnIndex].property,
						item: columns[columnIndex],
						rowData: rows[index]
					}, function noop () {});
				}
			}
		}

		if (this.viewOptions.list_rowRendered) {
			this.viewOptions.list_rowRendered({
				container: $tbody,
				item: $row,
				rowData: rows[index]
			}, function noop () {});
		}
	};

	var renderTbody = function renderTbody ($table, data) {
		var $tbody = $table.find('tbody');
		var $empty;

		if ($tbody.length < 1) {
			$tbody = $('<tbody data-container="true"></tbody>');
			$table.append($tbody);
		}

		if (typeof data.error === 'string' && data.error.length > 0) {
			$empty = $('<tr class="empty text-danger"><td colspan="' + this.list_columns.length + '"></td></tr>');
			$empty.find('td').append(data.error);
			$tbody.append($empty);
		} else if (data.items && data.items.length < 1) {
			$empty = $('<tr class="empty"><td colspan="' + this.list_columns.length + '"></td></tr>');
			$empty.find('td').append(this.viewOptions.list_noItemsHTML);
			$tbody.append($empty);
		}
	};

	var renderThead = function renderThead ($table, data) {
		var columns = data.columns || [];
		var $thead = $table.find('thead');
		var i;
		var length;
		var $tr;

		if (this.list_firstRender || areDifferentColumns(this.list_columns, columns) || $thead.length === 0) {
			$thead.remove();

			// list_noItems is set in `before` method

			if (this.viewOptions.list_selectable === 'multi' && !this.list_noItems) {
				var checkboxColumn = {
					label: 'c',
					property: '@_CHECKBOX_@',
					sortable: false
				};
				columns.splice(0, 0, checkboxColumn);
			}

			this.list_columns = columns;
			this.list_firstRender = false;
			this.$loader.removeClass('noHeader');

			// keep action column header even when empty, you'll need it later....
			if (this.viewOptions.list_actions) {
				var actionsColumn = {
					label: this.viewOptions.list_actions.label || '<span class="actions-hidden">a</span>',
					property: '@_ACTIONS_@',
					sortable: false,
					width: this.list_actions_width
				};
				columns.push(actionsColumn);
			}


			$thead = $('<thead data-preserve="deep"><tr></tr></thead>');
			$tr = $thead.find('tr');
			for (i = 0, length = columns.length; i < length; i++) {
				renderHeader.call(this, $tr, columns, i);
			}
			$table.prepend($thead);

			if (this.viewOptions.list_selectable === 'multi' && !this.list_noItems) {
				// after checkbox column is created need to get width of checkbox column from
				// its css class
				var checkboxWidth = this.$element.find('.repeater-list-wrapper .header-checkbox').outerWidth();
				var selectColumn = $.grep(columns, function grepColumn (column) {
					return column.property === '@_CHECKBOX_@';
				})[0];
				selectColumn.width = checkboxWidth;
			}
			sizeColumns.call(this, $tr);
		}
	};

	var sizeColumns = function sizeColumns ($tr) {
		var automaticallyGeneratedWidths = [];
		var self = this;
		var i;
		var length;
		var newWidth;
		var widthTaken;

		if (this.viewOptions.list_columnSizing) {
			i = 0;
			widthTaken = 0;
			$tr.find('th').each(function eachTH () {
				var $th = $(this);
				var width;
				if (self.list_columns[i].width !== undefined) {
					width = self.list_columns[i].width;
					$th.outerWidth(width);
					widthTaken += $th.outerWidth();
					self.list_columns[i]._auto_width = width;
				} else {
					var outerWidth = $th.find('.repeater-list-heading').outerWidth();
					automaticallyGeneratedWidths.push({
						col: $th,
						index: i,
						minWidth: outerWidth
					});
				}

				i++;
			});

			length = automaticallyGeneratedWidths.length;
			if (length > 0) {
				var canvasWidth = this.$canvas.find('.repeater-list-wrapper').outerWidth();
				newWidth = Math.floor((canvasWidth - widthTaken) / length);
				for (i = 0; i < length; i++) {
					if (automaticallyGeneratedWidths[i].minWidth > newWidth) {
						newWidth = automaticallyGeneratedWidths[i].minWidth;
					}
					automaticallyGeneratedWidths[i].col.outerWidth(newWidth);
					this.list_columns[automaticallyGeneratedWidths[i].index]._auto_width = newWidth;
				}
			}
		}
	};

	var specialBrowserClass = function specialBrowserClass () {
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf('MSIE ');
		var firefox = ua.indexOf('Firefox');

		if (msie > 0 ) {
			return 'ie-' + parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		} else if (firefox > 0) {
			return 'firefox';
		}

		return '';
	};

	var toggleActionsHeaderButton = function toggleActionsHeaderButton () {
		var selectedSelector = '.repeater-list-wrapper > table .selected';
		var $actionsColumn = this.$element.find('.table-actions');
		var $selected;

		if (this.viewOptions.list_selectable === 'action') {
			selectedSelector = '.repeater-list-wrapper > table tr';
		}

		$selected = this.$canvas.find( selectedSelector );

		if ($selected.length > 0) {
			$actionsColumn.find('thead .btn').removeAttr('disabled');
		} else {
			$actionsColumn.find('thead .btn').attr('disabled', 'disabled');
		}
	};

});

define('skylark-fuelux/repeater-thumbnail',[
    "skylark-langx/langx",
    "skylark-utils-dom/browser",
    "skylark-utils-dom/eventer",
    "skylark-utils-dom/noder",
    "skylark-utils-dom/geom",
    "skylark-utils-dom/query",
    "./repeater"
], function(langx, browser, eventer, noder, geom, $) {

    /*
     * Fuel UX Checkbox
     * https://github.com/ExactTarget/fuelux
     *
     * Copyright (c) 2014 ExactTarget
     * Licensed under the BSD New license.
     */

    if ($.fn.repeater) {
        //ADDITIONAL METHODS
        $.fn.repeater.Constructor.prototype.thumbnail_clearSelectedItems = function() {
            this.$canvas.find('.repeater-thumbnail-cont .selectable.selected').removeClass('selected');
        };

        $.fn.repeater.Constructor.prototype.thumbnail_getSelectedItems = function() {
            var selected = [];
            this.$canvas.find('.repeater-thumbnail-cont .selectable.selected').each(function() {
                selected.push($(this));
            });
            return selected;
        };

        $.fn.repeater.Constructor.prototype.thumbnail_setSelectedItems = function(items, force) {
            var selectable = this.viewOptions.thumbnail_selectable;
            var self = this;
            var i, $item, l, n;

            //this function is necessary because lint yells when a function is in a loop
            function compareItemIndex() {
                if (n === items[i].index) {
                    $item = $(this);
                    return false;
                } else {
                    n++;
                }
            }

            //this function is necessary because lint yells when a function is in a loop
            function compareItemSelector() {
                $item = $(this);
                if ($item.is(items[i].selector)) {
                    selectItem($item, items[i].selected);
                }
            }

            function selectItem($itm, select) {
                select = (select !== undefined) ? select : true;
                if (select) {
                    if (!force && selectable !== 'multi') {
                        self.thumbnail_clearSelectedItems();
                    }

                    $itm.addClass('selected');
                } else {
                    $itm.removeClass('selected');
                }
            }

            if (!$.isArray(items)) {
                items = [items];
            }

            if (force === true || selectable === 'multi') {
                l = items.length;
            } else if (selectable) {
                l = (items.length > 0) ? 1 : 0;
            } else {
                l = 0;
            }

            for (i = 0; i < l; i++) {
                if (items[i].index !== undefined) {
                    $item = $();
                    n = 0;
                    this.$canvas.find('.repeater-thumbnail-cont .selectable').each(compareItemIndex);
                    if ($item.length > 0) {
                        selectItem($item, items[i].selected);
                    }

                } else if (items[i].selector) {
                    this.$canvas.find('.repeater-thumbnail-cont .selectable').each(compareItemSelector);
                }
            }
        };

        //ADDITIONAL DEFAULT OPTIONS
        $.fn.repeater.defaults = langx.mixin({}, $.fn.repeater.defaults, {
            thumbnail_alignment: 'left',
            thumbnail_infiniteScroll: false,
            thumbnail_itemRendered: null,
            thumbnail_noItemsHTML: 'no items found',
            thumbnail_selectable: false,
            thumbnail_template: '<div class="thumbnail repeater-thumbnail"><img height="75" src="{{src}}" width="65"><span>{{name}}</span></div>'
        });

        //EXTENSION DEFINITION
        $.fn.repeater.viewTypes.thumbnail = {
            selected: function() {
                var infScroll = this.viewOptions.thumbnail_infiniteScroll;
                var opts;
                if (infScroll) {
                    opts = (typeof infScroll === 'object') ? infScroll : {};
                    this.infiniteScrolling(true, opts);
                }
            },
            before: function(helpers) {
                var alignment = this.viewOptions.thumbnail_alignment;
                var $cont = this.$canvas.find('.repeater-thumbnail-cont');
                var data = helpers.data;
                var response = {};
                var $empty, validAlignments;

                if ($cont.length < 1) {
                    $cont = $('<div class="clearfix repeater-thumbnail-cont" data-container="true" data-infinite="true" data-preserve="shallow"></div>');
                    if (alignment && alignment !== 'none') {
                        validAlignments = {
                            'center': 1,
                            'justify': 1,
                            'left': 1,
                            'right': 1
                        };
                        alignment = (validAlignments[alignment]) ? alignment : 'justify';
                        $cont.addClass('align-' + alignment);
                        this.thumbnail_injectSpacers = true;
                    } else {
                        this.thumbnail_injectSpacers = false;
                    }
                    response.item = $cont;
                } else {
                    response.action = 'none';
                }

                if (data.items && data.items.length < 1) {
                    $empty = $('<div class="empty"></div>');
                    $empty.append(this.viewOptions.thumbnail_noItemsHTML);
                    $cont.append($empty);
                } else {
                    $cont.find('.empty:first').remove();
                }

                return response;
            },
            renderItem: function(helpers) {
                var selectable = this.viewOptions.thumbnail_selectable;
                var selected = 'selected';
                var self = this;
                var $thumbnail = $(fillTemplate(helpers.subset[helpers.index], this.viewOptions.thumbnail_template));

                $thumbnail.data('item_data', helpers.data.items[helpers.index]);

                if (selectable) {
                    $thumbnail.addClass('selectable');
                    $thumbnail.on('click', function() {
                        if (self.isDisabled) return;

                        if (!$thumbnail.hasClass(selected)) {
                            if (selectable !== 'multi') {
                                self.$canvas.find('.repeater-thumbnail-cont .selectable.selected').each(function() {
                                    var $itm = $(this);
                                    $itm.removeClass(selected);
                                    self.$element.trigger('deselected.fu.repeaterThumbnail', $itm);
                                });
                            }

                            $thumbnail.addClass(selected);
                            self.$element.trigger('selected.fu.repeaterThumbnail', $thumbnail);
                        } else {
                            $thumbnail.removeClass(selected);
                            self.$element.trigger('deselected.fu.repeaterThumbnail', $thumbnail);
                        }
                    });
                }

                helpers.container.append($thumbnail);
                if (this.thumbnail_injectSpacers) {
                    $thumbnail.after('<span class="spacer">&nbsp;</span>');
                }

                if (this.viewOptions.thumbnail_itemRendered) {
                    this.viewOptions.thumbnail_itemRendered({
                        container: helpers.container,
                        item: $thumbnail,
                        itemData: helpers.subset[helpers.index]
                    }, function() {});
                }

                return false;
            }
        };
    }

    //ADDITIONAL METHODS
    function fillTemplate(itemData, template) {
        var invalid = false;

        function replace() {
            var end, start, val;

            start = template.indexOf('{{');
            end = template.indexOf('}}', start + 2);

            if (start > -1 && end > -1) {
                val = langx.trim(template.substring(start + 2, end));
                val = (itemData[val] !== undefined) ? itemData[val] : '';
                template = template.substring(0, start) + val + template.substring(end + 2);
            } else {
                invalid = true;
            }
        }

        while (!invalid && template.search('{{') >= 0) {
            replace(template);
        }

        return template;
    }

});
define('skylark-fuelux/main',[
    "skylark-utils-dom/query",
    "./checkbox",
    "./combobox",
    "./datepicker",
    "./dropdown-autoflip",
    "./infinite-scroll",
    "./loader",
    "./menu",
    "./picker",
    "./pillbox",
    "./placard",
    "./radio",
    "./scheduler",
    "./search",
    "./selectlist",
    "./spinbox",
    "./toolbar",
    "./wizard",

    "./repeater",
    "./repeater-list",
    "./repeater-thumbnail"
    
], function($) {
    return $;
});
define('skylark-fuelux', ['skylark-fuelux/main'], function (main) { return main; });


},this);