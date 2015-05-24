var mtypes = require('./markuptype');
var cssEngine = require('./css/engine');
var domutils = require('./domutils');

function SerializableNode() {

}

SerializableNode.prototype.serialize = function() {

  switch (this.type) {
    case mtypes.doctype:
    case mtypes.comment:
      return this.content;
    case mtypes.text:
      return this.text;
    case mtypes.document:
      var out = '';
      for (var i in this.children) {
        domutils.visitNode(this.children[i], function(elt) {
          out += getMarkupStart(elt);
        }, function(elt) {
          out += getMarkupEnd(elt);
        });
      }
      return out;
    case mtypes.element:
      return this.outerHTML();
  }
}

function serializeAttributes(element) {
  var ser = '';
  for (var i in element.attributes) {
    var attr = element.attributes[i];

    ser += i;
    if (attr != undefined && attr != null) { //was supplied at least an empty string, might be attr=""
      ser += '="' + attr + '"';
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
      return '<' + markup.tagName + (attributes ? ' ' + attributes : '') + (markup.isSelfClosing ? '/' : '') + '>';
    default:
      throw 'Markup type ' + markup.type + ' not supported';
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
      return markup.isSelfClosing ? '' : '</' + markup.tagName + '>';
    default:
      throw new 'Markup type ' + markup.type + ' not supported';
  }
}

/** @namespace Dom */
/** @module lib/dom/dom  */
/**
 * A Super class for Tag,Comment,CData,DocType, no code for this class, just descriptive
 * @class Markup
 * @prop {string} type - Markup type, might be: doctype,text,entity,cdata,comment
 * @prop {Markup} parent - markup's parent
 */


/**
 * @class
 * @param {string} content - fulll content tag
 * @augments Markup
 */
function Document(children) {
  /** @type {string} */
  this.type = mtypes.document;
  /** @type {Markup[]} */
  this.children = children || [];
  for (var i in children)
    children[i].parent = this;
}

Document.prototype = new SerializableNode();

Document.prototype.removeChild = function(child) {
  var indexOf = this.children.lastIndexOf(child);

  var child = this.children.splice(indexOf, 1);
  if (child) {
    child = child[0];

    if (child.prev)
      child.prev.next = child.next || null;
    if (child.next)
      child.next.prev = child.prev || null;

    return child;
  }
  return null;
}



/**
 * @class
 * @param {string} content - fulll content tag
 * @augments Markup
 */
function DocType(content) {
  /** @type {string} */
  this.type = mtypes.doctype;
  this.content = content;
}
DocType.prototype = new SerializableNode();

/**
 * @class
 * @param {string} content - fulll content tag
 * @augments Markup
 */
function CData(content) {
  this.type = mtypes.cdata;
  this.content = content;
}

CData.prototype.toString = function() {
  return this.content;
}
CData.prototype = new SerializableNode();

/**
 * @class
 * @param {string} content - fulll content tag
 * @augments Markup
 */
function Comment(content) {
  this.type = mtypes.comment;
  this.content = content;
}
Comment.prototype = new SerializableNode();

Comment.prototype.toString = function() {
    return this.content;
  }
  /**
   * @class
   * @param {string} text - text value
   * @augments Markup
   */
function Text(text) {
  /** @type {string} */
  this.type = mtypes.text;
  /** @type {string} */
  this.text = text;
}
Text.prototype = new SerializableNode();

Text.prototype.toString = function() {
    return this.text;
  }
  /**
   * @class
   * @param {string} tagName - Element's name
   * @param {Object} attributes - Start elements attribute
   * @augments Markup
   */
function Element(tagName, attributes, selfClosing) {
  /** @type {Markup} */
  this.parent = null;

  /** @type {string} */
  this.type = mtypes.element;

  /** @type {object} */
  this.attributes = attributes || {};

  /** @type {string} */
  this.tagName = tagName;

  /**  @type {Markup[]} */
  this.children = [];

  /**  @type {Markup[]} */
  this.next;

  /**  @type {Markup[]} */
  this.prev;

  /** @type {Boolean} }*/
  this.isSelfClosing = selfClosing || false;
}
Element.prototype = new SerializableNode();

/**
 * Element.prototype.getAttribute - Get an attribute by name
 *
 * @param  {string}   - attribute name
 * @return {string}   - attriibute value
 */
Element.prototype.getAttribute = function(name) {
  return this.attributes[name];
}

/**
 * Element.prototype.attr - Get an attribute by name
 *
 * @param  {string}   - attribute name
 * @return {string}   - attriibute value
 */
Element.prototype.attr = function(name, value) {
  if (arguments.length == 2) {
    this.attributes[name] = value;

  } else {
    if (typeof(name) == typeof(''))
      return this.attributes[name];
    else { //map passed to set attributes
      value = name;
      for (var i in value)
        this.attributes[i] = value[i];
    }
  }
}


/**
 * Tag,prototype.setAttribute - Set an attribute value by name
 *
 * @param  {string} name  - attribute nme
 * @param  {string} value - attribute value
 */
Element.prototype.setAttribute = function(name, value) {
  this.attributes[name] = value;
}

/**
 * Element.prototype.removeAttribute - Removes an attribute
 *
 * @param  {string} name - attribute bane
 */
Element.prototype.removeAttribute = function(name) {
  delete this.attributes[name];
}

/**
 * Element.prototype.hasAttribute - checks if has attribute
 *
 * @param  {string} name  - attribute's name
 * @return {boolean} - true if attribute is set in attributes arrays
 */
Element.prototype.hasAttribute = function(name) {
  return name in this.attributes;
}

/**
 * Element.prototype.append - adds a element at the end
 *
 * @param {Markup} markup - child to add
 */
Element.prototype.append = function(markup) {
  this.children.push(markup);
  markup.parent = this;
}

/**
 * Element.prototype.remove - Removes element from tree
 *
 */
Element.prototype.remove = function() {
  return this.parent.removeChild(this);
}

Element.prototype.removeChild = function(child) {
  var indexOf = this.children.lastIndexOf(child);

  var child = this.children.splice(indexOf, 1);
  if (child) {
    child = child[0];

    if (child.prev)
      child.prev.next = child.next || null;
    if (child.next)
      child.next.prev = child.prev || null;

    return child;
  }
  return null;
}

/**
 * Element.prototype.is - checks if matches css selctor
 *
 * @param {string} query - css selector
 * @return {boolean} - true if elements matches query
 */
Element.prototype.is = function(query) {
  return cssEngine.is(query, this);
}

Element.prototype.innerHTML = function() {
  var out = '';
  for (var i in this.children) {
    domutils.visitNode(this.children[i], function(elt) {
      out += getMarkupStart(elt);
    }, function(elt) {
      out += getMarkupEnd(elt);
    });
  }
  return out;
}

Element.prototype.outerHTML = function() {
  return getMarkupStart(this) + this.innerHTML() + getMarkupEnd(this);
}

Element.prototype.toString = function() {
  return this.outerHTML();
}


module.exports.Document = function(children) {
  return new Document(children);
};
module.exports.CData = function(content) {
  return new CData(content);
};
module.exports.Element = function(tagName, attributes, selfClosing) {
  return new Element(tagName, attributes, selfClosing);
};
module.exports.Comment = function(content) {
  return new Comment(content);
};
module.exports.Text = function(content) {
  return new Text(content);
};
module.exports.DocType = function(content) {
  return new DocType(content);
};
