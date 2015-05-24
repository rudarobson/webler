var mtypes = require('./markuptype.js');
var domutils = require('./domutils.js');
var cssSelectorParser = require('./css/parser');


/**
 * Similar to JQuery
 * @class
 */
function DomArray(elts) {
  if (elts.type == mtypes.document)
    elts = elts.children;


  for (var i = 0; i < elts.length; i++) {
    this[i] = elts[i];
  }

  this.length = elts.length;
}

DomArray.prototype.setAttribute = function() {
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
}

DomArray.prototype.append = function() {
  this.each(function() {
    this.append.apply(this, arguments);
  });
}

DomArray.prototype.toString = function() {
  var out = '';
  this.each(function() {
    domutils.visitNode(this, function(elt) {
      out += getMarkupStart(elt);
    }, function(elt) {
      out += getMarkupEnd(elt);
    });
  });
  return out;
}

DomArray.prototype.each = function(fn) {
  for (var i = 0; i < this.length; i++) {
    fn.call(this[i]);
  }
}

DomArray.prototype.serialize = function(fn) {
  var out = '';
  this.each(function() {
    out += this.serialize();
  });

  return out;
}

/**
 * DomArray.prototype.filter - includes root
 *
 * @param  {string} query css selector query
 * @return {DomArray}       matched elements
 */
DomArray.prototype.filter = function(query) {
  var elts = [];
  var parsed = cssSelectorParser.parse(query);

  this.each(function() {
    domutils.visitNode(this, function(elt) { //this may add same elements multiple times
      if (elt.type == mtypes.element && elt.is(query)) {
        elts.push(elt);
      }
    });
  });

  return new DomArray(elts);
}

module.exports = function(elts) {
  return new DomArray(elts);
};
