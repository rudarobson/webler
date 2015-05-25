var mtypes = require('./markuptype.js');
var domutils = require('./domutils.js');
var cssSelectorParser = require('./css/parser');
var htmlParser = require('./html/parser');
var cssEngine = require('./css/engine');

var $ = function(query, elts) {
  if (query instanceof DomArray)
    return query;

  if (elts == undefined) {
    elts = query;
    query = undefined;
  } else {
    if (typeof(query) == typeof('')) { //might be an html or a css selector, for now will be a css selector

    }
  }
  return new DomArray(elts);
};


/**
 * Similar to JQuery
 * @class
 */
function DomArray(elts) {
  if (!Array.isArray(elts))
    elts = [elts];

  for (var i = 0; i < elts.length; i++) {
    if (elts[i].type == mtypes.document || elts[i].type == mtypes.element) {
      this[i] = elts[i];
    }
  }

  this.length = elts.length;
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

DomArray.prototype.remove = function() {
  this.each(function() {
    this.remove();
  });

  return this;
}

DomArray.prototype.insertBefore = function(elts) {
  elts = $(elts);
  var self = this;
  elts.each(function() {
    var ref = this;
    self.each(function() {
      ref.insertBefore(this);
    });
  });

  return this;
}

DomArray.prototype.each = function(fn) {
  var br = false;
  for (var i = 0; i < this.length; i++) {
    br = fn.call(this[i]);
    if (br == false)
      break;
  }

  return this;
}

DomArray.prototype.serialize = function(fn) {
  var out = '';
  this.each(function() {
    out += this.serialize();
  });

  return out;
}

DomArray.prototype.attr = function(name, value) {
  var val = undefined;
  this.each(function() {
    if (this.type == mtypes.element) {
      if (arguments.length == 2) {
        this.attributes[name] = value;
      } else {
        if (typeof(name) == typeof('')) { //it's a get
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

DomArray.prototype.hasAttr = function(name) {
  return this[0].hasAttribute(name);
}

/**
 * DomArray.prototype.filter - includes root
 *
 * @param  {string}     query css selector query
 * @return {DomArray}   matched elements
 */
DomArray.prototype.filter = function(query) {
  var elts = [];
  var parsed = cssSelectorParser.parse(query);

  this.each(function() {
    if (this.visit) { //document or element
      this.visit(function() { //this may add same elements multiple times
        if (this.type == mtypes.element && this.is(query)) {
          elts.push(this);
        }
      });
    }
  });

  return $(elts);
}

/**
 * DomArray.prototype.filter - search only a single level
 *
 * @param  {string} query css selector query
 * @return {DomArray}       matched elements
 */
DomArray.prototype.children = function(query) {
  var elts = [];
  var parsed;
  if (query)
    parsed = cssSelectorParser.parse(query);

  this.each(function() {
    var self = this;
    domutils.visitNodeWithLevel(this, function() { //this may add same elements multiple times
      if (this != self && this.type == mtypes.element) { //do not include root
        var add = true;//if no query, just add the children
        if (query)
          add = this.is(parsed);

        if (add)
          elts.push(this);
      }
    }, null, 1);
  });

  return $(elts);
}

module.exports = $;
module.exports.parse = function(html, opt) {
  return htmlParser(opt).parse(html);
}
