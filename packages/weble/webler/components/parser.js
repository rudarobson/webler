var cssSelect = require('css-select');
var parse5 = require('parse5');


/*var parser = new parse5.Parser(parse5.TreeAdapters.htmlparser2);
var serializer = new parse5.Serializer(parse5.TreeAdapters.htmlparser2);



module.exports = {
  parse: function(html, opt) {
    return parser.parseFragment(html);
  },
  forEachSel: function(query, elt, fn) {
    var elts = cssSelect(query, elt);

    for (var i in elts) {
      if (!elts[i].________aCustomId) {
        elts[i].________aCustomId = true;
        fn(elts[i]);
      }
    }
  },
  serialize: function(elt) {
    console.log(parser);
    return serializer.serialize(elt);
  }
}*/


var cssSelect = require('css-select');
var htmlparser = require("htmlparser2");
var domutils = require('domutils');


module.exports = {
  parse: function(html, opt) {
    var elt;
    var handler = new htmlparser.DomHandler(function(error, dom) {
      if (error) {
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
  serialize: function(elt) {
    return domutils.getOuterHTML(elt);
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
  removeElement: function(elt) {
    domutils.removeElement(elt);
  }
}
