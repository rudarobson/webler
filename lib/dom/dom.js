var mtypes = require('./markuptype');
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
function DocType(content) {
  /** @type {string} */
  this.type = mtypes.doctype;
  this.content = content;
}


/**
 * @class
 * @param {string} content - fulll content tag
 * @augments Markup
 */
function CData(content) {
  this.type = mtypes.cdata;
  this.content = content;
}

/**
 * @class
 * @param {string} content - fulll content tag
 * @augments Markup
 */
function Comment(content) {
  this.type = mtypes.comment;
  this.content = content;
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

/**
 * @class
 * @param {string} tagName - Element's name
 * @param {Object} attributes - Start elements attribute
 * @augments Markup
 */
function Element(tagName, attributes) {
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
}

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
 * @param {Markup} - child to add
 */
Element.prototype.append = function(markup) {
  this.children.push(markup);
  markup.parent = this;
}

module.exports.CData = function(content){
  return new CData(content);
};
module.exports.Element = function(tagName,attributes){
  return new Element(tagName,attributes);
};
module.exports.Comment = function(content){
  return new Comment(content);
};
module.exports.Text = function(content){
  return new Text(content);
};
module.exports.DocType = function(content){
  return new DocType(content);
};
