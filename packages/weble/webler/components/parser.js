var cssSelect = require('css-select');
var parse5 = require('parse5');
var elementytype = require('domelementtype');

var htmlparser = require("htmlparser2");
var domutils = require('domutils');

var customSerializer = require('./serializer/serializer');
var transverse = require('./serializer/transverse');
/*function filter(elts, all, fn) {
  for (var i in elts) {
    var elt = elts[i];

    if (elt && elt.children && elt.children.length > 0) {
      console.log(elt.name);
      for (var j in elt.children) {
        if (fn(elt.children[j]))
          all.push(elt.children[j]);
        if (elt.children[j] != elt)
          filter(elt.children[j], all, fn);
      }
    }
  }
}*/

module.exports = {
  parse: function(html, opt) {
    var elt;
    var handler = new htmlparser.DomHandler(function(error, dom) {
      if (error) {
        console.log('Error at parsing, htmlparser2');
        console.log(errors);
        throw errors;
      } else
        elt = dom;
    });
    var parser = new htmlparser.Parser(handler);
    parser.write(html);
    parser.done();

    return elt;
  },
  /*filter: function(elt, fn, self) {
    var all = [];
    if (elt.constructor != Array)
      elt = [elt];
    for (var i in elt) {
      if (self && fn(elt[i])) {
        all.push(elt[i]);
      }
    }
    filter(elt, all, fn);

    return all;
  },*/
  filter: function(elt, fn) {
    if (!Array.isArray(elt))
      elt = [elt];
    transverse(elt, fn);
  },
  isComment: function(elt) {
    return elt.type == elementytype.Comment;
  },
  forEachSel: function(query, elt, fn) {
    var elts = cssSelect(query, elt);
    for (var i in elts) {
      var bre = fn(elts[i]);
      if (bre == false) {
        break;
      }
    }
  },
  placeAllChildrenBefore: function(ref, elt) {
    for (var i in elt.children)
      this.insertBefore(ref, elt.children[i]);
  },
  innerHTML: function(elt) {
    return domutils.getInnerHTML(elt);
  },
  replaceWith: function(replace, newElt) {
    this.insertBefore(replace, newElt);
    this.removeElement(replace);
  },
  serialize: function(elt) {
    //return domutils.getOuterHTML(elt);
    return customSerializer(elt);
  },
  attr: function(elem, name) {
    return elem.attribs[name];
  },
  hasAttr: function(elem, name) {
    return name in elem.attribs;
  },
  deleteAttr: function(elem, name) {
    delete elem.attribs[name];
  },
  insertBefore: function(elem, newElem) {
    var prev = newElem.prev = elem.prev;
    if (prev) {
      prev.next = newElem;
    }
    newElem.next = elem;
    elem.prev = newElem;

    var parent = newElem.parent = elem.parent;
    if (parent) {
      var childs = parent.children;
      childs.splice(childs.lastIndexOf(elem), 0, newElem);
    }
  },
  removeElement: function(elem) {
    domutils.removeElement(elem);
  }
}
