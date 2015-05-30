var mtypes = require('./markuptype.js');
var cssSelectorParser = require('./css/parser');
var htmlParser = require('./html/parser');
var cssEngine = require('./css/engine');

var $ = function (query, elts) {
    if (query instanceof DomArray)
        return query;

    if (elts == undefined) {
        elts = query;
        query = undefined;
    } else {
        if (typeof (query) == typeof ('')) { //might be an html or a css selector, for now will be a css selector
            throw 'Not implemented $(string) domaray.js';
        }
    }
    return new DomArray(elts);
};


/**
 * Similar to JQuery
 * @class
 */
function DomArray(elts, /* internal only*/ filter) {
    if (!filter) {
        filter = {
            document: true,
            element: true
        };
    }

    if (!Array.isArray(elts))
        elts = [elts];

    var added = 0;

    for (var i = 0; i < elts.length; i++) {
        var add = false;

        switch (elts[i].type) {
        case mtypes.document:
            if (filter.document || filter.all)
                add = true;
            break;
        case mtypes.element:
            if (filter.element || filter.all)
                add = true;
            break;
        case mtypes.doctype:
            if (filter.doctype || filter.all)
                add = true;
            break;
        case mtypes.comment:
            if (filter.comment || filter.all)
                add = true;
            break;
        case mtypes.text:
            if (filter.text || filter.all)
                add = true;
            break;
        }

        if (add) {
            this[added++] = elts[i];
        }
    }

    this.length = added;
}

/*DomArray.prototype.setAttribute = function() {
  this.each(function() {
    this.setAttribute.apply(this, arguments);
  });
}

DomArray.prototype.removeAttribute = function() {
  this.each(function() {
    this.removeAttribute.apply(this, arguments);
  });
}

DomArray.prototype.hasAttribute = function() {
  this.each(function() {
    this.hasAttribute.apply(this, arguments);
  });
}*/

/*DomArray.prototype.append = function() {
  this.each(function() {
    this.append.apply(this, arguments);
  });
}*/

DomArray.prototype.remove = function () {
    this.each(function () {
        this.remove();
    });

    return this;
}

DomArray.prototype.insertBefore = function (elts) {
    elts = new DomArray(elts, {
        all: true
    });
    var self = this;
    elts.each(function () {
        var ref = this;
        self.each(function () {
            ref.insertBefore(this);
        });
    });

    return this;
}

DomArray.prototype.each = function (fn) {
    var br = false;
    for (var i = 0; i < this.length; i++) {
        br = fn.call(this[i]);
        if (br == false)
            break;
    }

    return this;
}

DomArray.prototype.serialize = function (fn) {
    var out = '';
    this.each(function () {
        out += this.serialize();
    });

    return out;
}

DomArray.prototype.attr = function (name, value) {
    var val = undefined;
    var args = arguments;
    this.each(function () {
        if (this.type == mtypes.element) {
            if (args.length == 2) {
                this.attributes[name] = value;
            } else {
                if (typeof (name) == typeof ('')) { //it's a get
                    val = this.attributes[name];
                    return false; //return the first value
                } else { //map passed to set attributes
                    value = name;
                    for (var i in value)
                        this.attributes[i] = value[i];
                }
            }
        }
    });

    return val; //return undefiend upon set value
}

DomArray.prototype.hasAttr = function (name) {
    return this[0].hasAttribute(name);
}

/**
 * DomArray.prototype.filter - includes root
 *
 * @param  {string}     query css selector query
 * @return {DomArray}   matched elements
 */
DomArray.prototype.filter = function (query) {
    var elts = [];
    var parsed = cssSelectorParser.parse(query);

    this.each(function () {
        if (this.visit) { //document or element
            this.visit(function () { //this may add same elements multiple times
                if (this.type == mtypes.element && this.is(query)) {
                    elts.push(this);
                }
            });
        }
    });

    return new DomArray(elts);
}

/**
 * DomArray.prototype.find - do not includes root
 *
 * @param  {string}     query css selector query
 * @return {DomArray}   matched elements
 */
DomArray.prototype.find = function (query) {
    var elts = [];
    var parsed = cssSelectorParser.parse(query);
    var self = this;
    this.each(function () {
        if (self != this) {
            if (this.visit) { //document or element
                this.visit(function () { //this may add same elements multiple times
                    if (this.type == mtypes.element && this.is(query)) {
                        elts.push(this);
                    }
                });
            }
        }
    });

    return new DomArray(elts);
}

/**
 * DomArray.prototype.children - search only a single level
 *
 * @param  {string} query css selector query
 * @return {DomArray}       matched elements
 */
DomArray.prototype.children = function (query) {
    var elts = [];
    var parsed;
    if (query)
        parsed = cssSelectorParser.parse(query);

    this.each(function () {
        var self = this;
        this.visit(function () { //this may add same elements multiple times
            if (this != self && this.type == mtypes.element) { //do not include root
                var add = true; //if no query, just add the children
                if (query)
                    add = this.is(parsed);

                if (add)
                    elts.push(this);
            }
        }, null, {
            level: 1
        });
    });

    return new DomArray(elts);
}

/**
 * DomArray.prototype.contents - search only a single level (includes text comment cdata and doctype nodes)
 *
 * @param  {string} query css selector query
 * @return {DomArray}       matched elements
 */
DomArray.prototype.contents = function () {
    var elts = [];

    this.each(function () {
        var self = this;
        this.visit(function () { //this may add same elements multiple times
            if (this != self) { //do not include root
                elts.push(this);
            }
        }, null, {
            level: 1
        });
    });

    return new DomArray(elts, {
        all: true
    });
}

/**
 * DomArray.prototype.first - return first element of array or undefined
 *
 * @param  {string} query css selector query
 * @return {Dom}       matched elements
 */
DomArray.prototype.first = function () {
    if (this.length > 0) {
        return new DomArray(this[0], {
            all: true
        });
    }
}

module.exports = $;
$.voidElements = [];
module.exports.parse = function (html, opt) {
    return htmlParser(opt).parse(html);
}

module.exports.markupTypes = mtypes;
