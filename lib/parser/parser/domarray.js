var mtypes = require('../dom/markuptype.js');

function visitNode(elt, enter, exit) {
  enter(elt)
  if (elt.children) {
    for (var i in elt.children)
      visitNode(elt.children[i], enter, exit);
  }
  exit(elt);
}

function serializeAttributes(element) {
  var ser = '';
  for (var i in element.attributes) {
    var attr = element.attributes[i];
    ser += i;
    if (attr[i] != undefined && attr[i] != null) { //was supplied at least an empty string
      ser += '="' + attr[i] + '"';
    }
    ser += ' ';
  }

  return ser; //with a trailing space
}

function getMarkupStart(markup) {
  switch (markup.type) {
    case mtypes.doctype:
    case mtypes.comment:
      return markup.content;
    case mtypes.text:
      return markup.text;
    case mtypes.element:
      var attributes = serializeAttributes(markup);
      return '<' + markup.tagName + (attributes ? attributes : '') + '>';
    default:
      throw 'Markup type ' + markup.type + ' not supported'
  }
}

function getMarkupEnd(markup) {
  switch (markup.type) {
    case mtypes.doctype:
    case mtypes.text:
    case mtypes.comment:
      return '';
      break;
    case mtypes.element:
      return '</' + markup.tagName + '>';
    default:
      throw new 'Markup type ' + markup.type + ' not supported'
  }
}


/**
 * Similar to JQuery
 * @class
 */
function DomArray(elts) {
  for (var i = 0; i < elts.length; i++) {
    this[i] = elts[i];
  }
  this.length = elts.length;
}

DomArray.prototype = new Array;

DomArray.prototype.setAttribute = function() {
  for (var i = 0; i < this.length; i++) {
    this[i].setAttribute.apply(this[i], arguments);
  }
}

DomArray.prototype.removeAttribute = function() {
  for (var i = 0; i < this.length; i++) {
    this[i].removeAttribute.apply(this[i], arguments);
  }
}

DomArray.prototype.hasAttribute = function() {
  for (var i = 0; i < this.length; i++) {
    this[i].hasAttribute.apply(this[i], arguments);
  }
}

DomArray.prototype.append = function() {
  for (var i = 0; i < this.length; i++) {
    this[i].append.apply(this[i], arguments);
  }
}

DomArray.prototype.html = function() {
  var out = '';
  for (var i = 0; i < this.length; i++) {
    visitNode(this[i], function(elt) {
      out += getMarkupStart(elt);
    }, function(elt) {
      out += getMarkupEnd(elt);
    })
  }
  return out;
}

module.exports = DomArray;
