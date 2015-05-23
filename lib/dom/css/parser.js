function parseAttribute(str) {
  var i = 0;
  for (; i < str.length; i++) {
    if (str[i] == '"') {
      i++;
      break;
    }
  }

  /**
   * @class AttributeSelectorWrapper
   * @prop {int} index - index where it ended
   * @prop {Object} match - Has type and value, type is the type of matching, startsWith,containingWord etc and value, the value to match
   */
  return {
    index: i,
    match: {
      type: '',
      value: ''
    }
  }
}

var tkTypes = {
  selector: '',
  combinator: '+'
}

var matchTypes = {
  any: '*',
  class: '.',
  id: '#',
  parent: '>',
  sibling: '+',
  preceded: '~',
  seaparator: ' ',
  attribute: '[',
  pseudo: ':',
  name: '',
  comma: ','
};


var identifierRegex = /-?(?:[_a-z]|[\240-\377]|\{h}{1,6}(?:\r\n|[ \t\r\n\f])?|\[^\r\n\f0-9a-f])(?:[_a-z0-9-]|[\240-\377]|(?:\{h}{1,6}(?:\r\n|[ \t\r\n\f])?)|\[^\r\n\f0-9a-f])*/ig;

function getIdentifierName(str, i) {
  //regex taken from the css grammar

  //var regex = /-?(?:[_a-z0-9]|[\240-\377])*/ig;

  identifierRegex.lastIndex = i;

  var match = identifierRegex.exec(str);

  if (match && match.index == i)
    return match[0];
  else
    throw ('Syntax error "' + str.substring(i) + '"');
}

function getCombinator(str, i) {
  var regex = /[\s\\]*([~+>\s,])[\s\\]*/g
  regex.lastIndex = i;
  var match = regex.exec(str);
  var type;

  if (match && match.index == i) {
    if (/\s+/.test(match[1]))
      type = matchTypes.separator;
    else
      type = match[1];
  }
  return {
    full: match[0],
    type: type
  };
}

function parseAttributeSelector(str) {
  var attributeName = getIdentifierName(str, 0);
  if (!attributeName) {
    throw 'Syntax Error parsing attribute' + str;
  }

  if (attributeName.length == str.length) { //just has attribute
    return {
      type: attributeMatch.has,
      name: attributeName
    }
  }
  var regex = /([~^\$\*\|]?=)"?([^"]*)"?/gi;
  regex.lastIndex = attributeName.length;
  var match = regex.exec(str);

  if (!match)
    throw 'Syntax Error parsing attribute' + str;

  return {
    type: match[1],
    name: attributeName,
    value: match[2]
  };
}

function getAttributeMatch(str, i) {
  var regex = /\[(.*?)\]/ig;
  regex.lastIndex = i;
  var match = regex.exec(str);

  if (match && match.index == i) {
    return {
      full: match[0],
      value: parseAttributeSelector(match[1])
    };
  }

  throw ('Syntax error "' + str.substring(i) + '"');
}

function getValueFromStructuralPseudo(str, i) {
  var regex = /\s*\(\s*(.*?)\s*\)\s*/g;
  regex.lastIndex = i;
  var match = regex.exec(str);

  if (!match || match.index != i)
    throw 'Syntax Error at ' + str;

  var structuralRegex1 = /([+-]?)(\d*)n\s*(?:([+-])\s*(\d+))?/;
  var structuralRegex2 = /([+-]?)(\d+)|odd|even/i;
  var structuralMatch = structuralRegex1.exec(match[1]);

  var sign1;
  var int1;

  if (!structuralMatch || structuralMatch.index != 0) {
    structuralMatch = structuralRegex2.exec(match[0]);
    if (!structuralMatch) {
      throw 'Syntax Error at ' + str;
    }

    if (/odd|even/i.test(structuralMatch[0])) {
      if (structuralMatch[0].toLowerCase() == 'odd') {
        return {
          type: pseudoValueTypes.odd
        }
      }

      return {
        type: pseudoValueTypes.even
      }
    }
  }


  sign1 = structuralMatch[1];
  int1 = structuralMatch[2];
  if (int1 == '')
    int1 = '1';
  if (sign1 == '+')
    sign1 = '';

  var right;
  if (structuralMatch[3]) {
    var sign2;
    var int2;
    sign2 = structuralMatch[3];
    int2 = structuralMatch[4];
    if (sign2 == '+')
      sign2 = '';
    right = sign2 + '' + int2;
  }

  return {
    type: pseudoValueTypes.numerical,
    left: sign1 + '' + int1,
    right: right
  }
}

function getPseudo(str, i, pseudoList) {
  var preffix;
  if (str.length > i + 1 && str[i + 1] == matchTypes.pseudo) {
    preffix = '::';
  } else {
    preffix = ':';
  }

  var name = getIdentifierName(str, i + preffix.length);

  if (!((preffix + name) in pseudoList)) {
    throw 'Unkown pseudo ' + preffix + 'name';
  }

  var value;
  if (pseudoList[preffix + name] == 1) {
    value = getValueFromStructuralPseudo(str, i + preffix.length + name.length);
  }

  return {
    full: 0,
    value: {
      type: value ? pseudoTypes.withValue : pseudoTypes.noValue,
      name: name,
      value: value
    }
  }
}

function createSelector() {
  return {
    type: tkTypes.selector,
    tagName: undefined,
    attributes: [],
    classes: [],
    id: undefined,
    pseudos: []
  }
}

function Tokenize(query, opt) {
  var tokenStreams = [];
  var pseudoList;
  if (!opt)
    opt = {};
  if (!opt.pseudoList)
    pseudoList = require('./pseudo-list.json');
  /*
   * selector: selectorType
   * value: value to match
   * space[bool]: which means the selector had a space there
   */
  var tokenStream = [];
  var selector = undefined;
  var i = 0;
  while (i < query.length) {
    var value;
    switch (query[i]) {
      case matchTypes.any:
        //ignore for a while
        i++;
        break;
      case matchTypes.class:
      case matchTypes.id:
        if (!selector) {
          selector = createSelector();
        }
        var value = getIdentifierName(query, i + 1);
        if (query[i] == matchTypes.id) {
          if (selector.id)
            throw 'Syntax error #' + value;
          selector.id = value;
        } else {
          selector.classes.push(value);
        }
        i += value.length + 1;
        break;
      case matchTypes.parent:
      case matchTypes.sibling:
      case matchTypes.preceded:
      case ' ':
      case '\t':
      case '\n':
      case '\r':
      case matchTypes.comma:
        if (selector) {
          tokenStream.push(selector);
          selector = undefined;
        }

        var value = getCombinator(query, i);
        i += value.full.length;

        if (value.type == matchTypes.comma) {
          if (tokenStream.length == 0)
            throw 'Syntax error at , position: ' + i;

          tokenStreams.push(tokenStream);
          tokenStream = [];
        } else {
          tokenStream.push({
            type: tkTypes.combinator,
            value: value.type
          });
        }
        break;
      case matchTypes.attribute:
        if (!selector) {
          selector = createSelector();
        }
        var value = getAttributeMatch(query, i);

        selector.attributes.push(value.value);
        i += value.full.length;
        break;
      case matchTypes.pseudo:
        if (!selector) {
          selector = createSelector();
        }

        var value = getPseudo(query, i, pseudoList);
        i += value.full.length;
        selector.pseudos.push(value.value);
        break;
      default:
        if (!selector) {
          selector = createSelector();
        } else {
          //matching an element name after some match
          var value = getIdentifierName(query, i);
          throw 'Syntax Error at ' + value;
        }

        var value = getIdentifierName(query, i);
        i += value.length;

        selector.tagName = value
        break;
    } //parse selectors
  }
  if (selector)
    tokenStream.push(selector);
  if (tokenStream.length > 0)
    tokenStreams.push(tokenStream);
  return tokenStreams;
}


/**
 * return parents on reverse order, more effective for finding elements
 */
function parse(tokenStreams) {
  var all = [];
  for (var i in tokenStreams) {
    var tokenStream = tokenStreams[i];
    var contexts = [];

    var i = tokenStream.length - 2;
    var childMatch = tokenStream[i + 1];

    while (i >= 0) {
      var tk = tokenStream[i];
      switch (tk.type) {
        case tkTypes.combinator:
          contexts.push({
            type: tk.value,
            match: tokenStream[i - 1]
          });
          i--;
          break;
        case tkTypes.selector:
          contexts.push({
            type: executeTypes.anyParent,
            match: tokenStream[i]
          });

          break;
      }
      i--;
    }

    all.push({
      match: childMatch,
      combinators: contexts
    });
  }
  return all;
}

var executeTypes = {
  anyParent: matchTypes.separator,
  parent: matchTypes.parent,
  sibling: matchTypes.sibling,
  preceded: matchTypes.preceded,
};


var attributeMatch = {
  has: '',
  exactlyEqual: '=',
  blankSepparated: '~=',
  beginsWith: '^=',
  endsWith: '$=',
  containsSubstring: '*=',
  hyphenSeppareted: '|='
};

var pseudoTypes = {
  noValue: 0,
  withValue: 1
}

var pseudoValueTypes = {
  numerical: 0,
  odd: 1,
  even: 2
}

module.exports = {
  parse: function(query, opt) {
    if (query._type == 'parsedcssselector')
      return query;
    var ret = parse(Tokenize(query, opt));
    ret._type = 'parsedcssselector';
    return ret;
  },
  types: executeTypes,
  attrTypes: attributeMatch,
  pseudoTypes: pseudoTypes,
  pseudoValueTypes: pseudoValueTypes
}
