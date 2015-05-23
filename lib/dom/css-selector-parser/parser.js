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
  doublePseudo: '::',
  name: '',
  comma: ','
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
  var regex = /[\s\\]*([~+>\s])[\s\\]*/g
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

function getPseudo(str, i) {
  throw 'Pseudo not implemented';
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

function Tokenize(query) {
  var tokenStreams = [];
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
        if (selector) {
          tokenStream.push(selector);
          selector = undefined;
        }

        var value = getCombinator(query, i);
        i += value.full.length;
        tokenStream.push({
          type: tkTypes.combinator,
          value: value.type
        });

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

        var type;
        if (query.length > i + 1 && query[i + 1] == matchTypes.pseudo) {
          i += 2;
          type = matchTypes.doublePseudo;
        } else {
          i++;
          type = matchTypes.pseudo;
        }
        var value = getPseudo(query, i);
        selector.pseudos.push(value);
        break;
      case matchTypes.comma:
        tokenStreams.push(tokenStream);
        tokenStream = [];
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


var executeTypes = {
  anyParent: matchTypes.separator,
  parent: matchTypes.parent,
  sibling: matchTypes.sibling,
  preceded: matchTypes.preceded,
};

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
            value: tokenStream[i - 1]
          });
          i--;
          break;
        case tkTypes.selector:
          contexts.push({
            type: executeTypes.anyParent,
            value: tokenStream[i]
          });

          break;
      }
      i--;
    }

    all.push({
      match: childMatch,
      parents: contexts
    });
  }
  return all;
}

module.exports = {
  parse: function(query) {
    return parse(Tokenize(query));
  },
  types: executeTypes,
  attrTypes: attributeMatch
}
