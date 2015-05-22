/** @module lib/parser/parser */
var dom = require('../dom/dom');
var domArray = require('./domarray');
var fs = require('fs');

var doctypeStartRegex = /^<!doctype[\s>]/i;
var commentStartRegex = /^<!--/;
var cdataStartRegex = /^<!\[CDATA/;

function isClosingOrSelfClosing(html) {
  return /^<\s*\/?[^>]*?\/?>$/.test(html); //means <\s/....> or <...../\s>
}

/*
 * will return text
 */
function createText(text) {
  return dom.Text(text);
}

function parseAttributes(raw) {
  var keyValRegex = /(\w+)\s*(?:=\s*"([^"]*)")?/g;
  var match;
  var attrs = {};
  while ((match = keyValRegex.exec(raw))) {
    var keyVal = keyValRegex.match(match[0]);
    attrs[keyVal[1]] = attrs[keyVal[2]];
  }

  return attrs;
}

/*
 * will return comment, element, doctype
 */
function createTag(html) {
  if (commentStartRegex.test(html)) {
    return dom.Comment(html);
  } else if (doctypeStartRegex.test(html)) {
    return dom.DocType(html);
  } else if (cdataStartRegex.test(html)) {
    return dom.CData(html);
  } else { //Element
    var attrs = {};
    var match = /<\w+(.*)>/.exec(html);
    if (match[1]) {
      attrs = parseAttributes(match[1]);
    }

    return dom.Element(/<(\w+)/.exec(html)[1], attrs);
  }
}


/**
 * @class ParserOption
 * @prop {(Object|Array)} voidElements - A Map or an an array of Element's name that might be void
 */

/**
 * @constructor
 * @param {ParserOption} opt - Parser option
 */
function Parser(opt) {
  if (!opt)
    opt = {};

  if (!opt.voidElements)
    opt.voidElements = require('./void_elements');

  var voidElements = opt.voidElements;
  if (voidElements instanceof Array) {
    var map = {};
    for (var i in voidElements)
      map[opt.voidElements[i]] = true;
  }

  /**
    @param {string} - html to be parser
   */
  this.parse = function(html) {
    var tagRegex = /<(?:\s*\/\s*)?([^>\s]+).*?>/g; //close tag with spaces before / or open tag

    var match;
    var root = [];

    /*
     * it will contain elements {name:'tagname',children}
     */
    var context = [];
    var topLevelElts = []
    context.unshift({
      append: function(elt) {
        topLevelElts.push(elt);
      }
    });

    var lastProcessingIndex = 0;
    while (lastProcessingIndex < html.length) {

      match = tagRegex.exec(html);

      var textStopIndex;
      if (match) {
        textStopIndex = match.index;
      } else {
        textStopIndex = html.length;
      }

      if (textStopIndex > lastProcessingIndex) { //-1 means the including stop index
        var text = createText(html.substring(lastProcessingIndex, textStopIndex));
        context[0].append(text);
        lastProcessingIndex = textStopIndex;
      }

      if (match) {
        //console.log(tagRegex.lastIndex);
        lastProcessingIndex = tagRegex.lastIndex;
        //lastProcessingIndex = match.index + matc[0].length;//do not get from tagRegex.lastIndex because it will be zero after last match
        //match is always something like <tag-representation...>

        if (commentStartRegex.test(match[0]) || cdataStartRegex.test(match[0])) { //it's comment or cdata
          var searchFor;

          if (match[0][2] == '-') { //a comment
            searchFor = '-->';
          } else { //cdata
            searchFor = ']]>';
          }
          //must find the end of comment because the regex will find first '>', and start nexte iteration over there

          var nextIndex = html.indexOf(searchFor, match.index);

          if (nextIndex > -1) {
            nextIndex += searchFor.length;
            tagRegex.lastIndex = nextIndex; //skip the -->
          } else {
            nextIndex = html.length; //missing a close comment, everything gets commented
            tagRegex.lastIndex = nextIndex; //finished
          }
          var tag = createTag(html.substring(match.index, nextIndex));

          lastProcessingIndex = nextIndex;
          context[0].append(tag);
        } else if (doctypeStartRegex.test(match[0])) {
          var tag = createTag(match[0]);
          context[0].append(tag);
        } else { //it's an element
          if (/<\s*\//.test(match[0])) { //closing tag remove context

            /*
             * Behavior:
             * if is not closing the context's element, try to find some in the stack
             * if doesn't find it, it's just a lost closing tag, in the middle of the text
             */
            var i = 0;
            while (i < context.length) {
              if (!context[i].tagName) { //here we have root, adding to topLevelElts
                break;
              }
              if (context[i].tagName.toLowerCase() == match[1].toLowerCase()) {
                context.splice(0, i + 1);
                break;
              }
              i++;
            }
          } else {
            //self closing tag do not push to context or the user placed  a void element without self closing it? must check
            if ((match[1] in voidElements) || /.*\/\s*>/.test(match[0])) {
              context[0].append(createTag(match[0]));
            } else { //it's opening tag
              var tag = createTag(match[0]);
              context[0].append(tag);
              context.unshift(tag); //add tags context
            }
          }
        }
      }
    }

    return new domArray(topLevelElts);
  }
}

module.exports = function(opt) {
  return new Parser(opt);
};
