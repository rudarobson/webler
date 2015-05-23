var selectorParser = require('./parser');
var domutils = require('../domutils');
var domArray = require('../domarray');
var dom = require('../dom');


function elementAgainstSelector(elt, match) {

  if (match.id && !(elt.attr('id') && elt.attr('id').toLowerCase() == match.id.toLowerCase()))//insensitive case comparision
    return false;

  if (match.classes && match.classes.length > 0) {
    var classes = elt.attr('class');
    if (classes)
      classes = classes.split(/\s+/);
    if (!classes)
      return false;

    var hasClasses = {};

    for (var i in classes)
      hasClasses[classes[i].toLowerCase()] = true;

    for (var i in match.classes) {
      if (!(match.classes[i].toLowerCase() in hasClasses))
        return false;
    }
  }

  /*if(match.attributes){
    for(var i in match.attributes){
      var attr = match.attributes[i];
      switch (attr.type) {
        case selectorParser.attrTypes:

          break;
        default:

      }
    }
  }*/

  return true;
}

module.exports.is = function(query, elt) {
  var parsed = selectorParser.parse(query);
  var match = false;

  var allPossibleRules = [];
  for (var i = 0; i < parsed.length; i++) {
    if (elementAgainstSelector(elt, parsed[i].match)) {
      allPossibleRules.push(parsed[i]);
    }
  }

  var curElt = elt;

  for (var j in allPossibleRules) {
    var rule = allPossibleRules[j];

    var i = 0;

    while (curElt && i < rule.combinators.length) {

      var combinator = rule.combinators[i];
      switch (combinator.type) {
        case selectorParser.types.anyParent:
          if (curElt.parent && elementAgainstSelector(curElt.parent, combinator.match))
            i++;
          break;
        case selectorParser.types.parent:
          if (!(curElt.parent && elementAgainstSelector(curElt.parent, combinator.match)))
            break; //cannot match anymore
          i++;
          break;
        case selectorParser.types.sibling:
          var any = false;

          var next = curElt.next;
          while (next) {
            if (elementAgainstSelector(next, combinator.match)) {
              any = true;
              break;
            }
            next = next.next;
          }

          var prev = curElt.prev;
          while (prev) {
            if (elementAgainstSelector(prev, combinator.match)) {
              any = true;
              break;
            }
            prev = prev.prev;
          }

          if (!any)
            return false;
          i++;
          break;
        case selectorParser.types.preceded:
          var any = false;
          var prev = curElt.prev;
          while (prev) {
            if (elementAgainstSelector(prev, combinator.match)) {
              any = true;
              break;
            }
            prev = prev.prev;
          }

          if (!any)
            return false;
          i++;
          break;
      }

      curElt = curElt.parent;
    }

    if (i == rule.combinators.length)
      return true;
  }

  return false;
}
