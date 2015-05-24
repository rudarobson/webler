var path = require('path');
var fs = require('fs');
var domBasePath = path.join(path.dirname(require.resolve('webler')), 'dom');
var cssEngine = require(path.join(domBasePath, 'css/engine'));
var htmlParser = require(path.join(domBasePath, 'html/parser'))();
var mtype = require(path.join(domBasePath, 'markuptype'));
var $ = require(path.join(domBasePath, 'domarray'));

var newLine = '\r\n';
var css = require(path.join(domBasePath, 'css/parser'));

var document1 = htmlParser.parse(fs.readFileSync('./dom_tests/css-engine/src1.html').toString());



function createTree(testName) {
  return htmlParser.parse(fs.readFileSync(path.join('dom_tests/html-parser', testName + '.html')).toString());
}

function createTreeSerialization(testName) {
  return htmlParser.parse(fs.readFileSync(path.join('dom_tests/html-parser-serialization', testName + '.html')).toString());
}

module.exports['css-engine'] = {
  test1: function(assert) {
    var elts = $(document1).filter('.class2 span');
    assert.equals(elts.length, 1);
    assert.equals(elts[0].tagName, 'span');
    assert.done();
  },
  test2: function(assert) {
    var elts = $(document1).filter('#spanwithid'); //changing sensitive case  of document
    assert.equals(elts.length, 1);
    assert.done();
  },
  test3: function(assert) {
    var elts = $(document1).filter('[attribute1]');

    assert.equals(elts.length, 2);
    assert.equals(elts[0].tagName, 'div');
    assert.equals(elts[1].tagName, 'span');
    assert.done();
  },

  test4: function(assert) {
    var elts = $(document1).filter('[attribute1="value"]');

    assert.equals(elts.length, 1);
    assert.equals(elts[0].tagName, 'div');
    assert.done();
  },
  test5: function(assert) {
    var elts = $(document1).filter('[class~="div-class1"]');

    assert.equals(elts.length, 1);
    assert.equals(elts[0].tagName, 'div');
    assert.done();
  },

  test6: function(assert) {
    var elts = $(document1).filter('[attribute1^="value"]');

    assert.equals(elts.length, 2);
    assert.equals(elts[0].tagName, 'div');
    assert.equals(elts[1].tagName, 'span');
    assert.done();
  },
  test7: function(assert) {
    var elts = $(document1).filter('[attribute1$="alue1"]');

    assert.equals(elts.length, 1);
    assert.equals(elts[0].tagName, 'span');
    assert.done();
  },
  test8: function(assert) {
    var elts = $(document1).filter('[attribute1*="alue"]');

    assert.equals(elts.length, 2);
    assert.equals(elts[0].tagName, 'div');
    assert.equals(elts[1].tagName, 'span');
    assert.done();
  },
  test9: function(assert) {
    var elts = $(document1).filter('[attribute2|="value1"]');

    assert.equals(elts.length, 1);
    assert.equals(elts[0].tagName, 'span');
    assert.done();
  },
}

module.exports['css-selector-parser'] = {
  test0: function(assert) {
    var query = 'div';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test1: function(assert) {
    var query = '.class';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.classes[0], 'class');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test2: function(assert) {
    var query = 'div[attribute]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;
    assert.equals(match.tagName, 'div');
    assert.equals(match.attributes.length, 1);
    assert.equals(match.attributes[0].type, css.attrTypes.has);

    assert.done();
  },
  test3: function(assert) {
    var query = 'div[attribute="value"]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;
    assert.equals(match.tagName, 'div');
    assert.equals(match.attributes.length, 1);
    assert.equals(match.attributes[0].type, css.attrTypes.exactlyEqual);
    assert.equals(match.attributes[0].name, 'attribute');
    assert.equals(match.attributes[0].value, 'value');

    assert.done();
  },
  test4: function(assert) {
    var query = 'div[attribute~="value"]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;
    assert.equals(match.tagName, 'div');
    assert.equals(match.attributes.length, 1);
    assert.equals(match.attributes[0].type, css.attrTypes.blankSepparated);
    assert.equals(match.attributes[0].name, 'attribute');
    assert.equals(match.attributes[0].value, 'value');

    assert.done();
  },
  test5: function(assert) {
    var query = 'div[attribute^="value"]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;
    assert.equals(match.tagName, 'div');
    assert.equals(match.attributes.length, 1);
    assert.equals(match.attributes[0].type, css.attrTypes.beginsWith);
    assert.equals(match.attributes[0].name, 'attribute');
    assert.equals(match.attributes[0].value, 'value');

    assert.done();
  },
  test6: function(assert) {
    var query = 'div[attribute$="value"]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;
    assert.equals(match.tagName, 'div');
    assert.equals(match.attributes.length, 1);
    assert.equals(match.attributes[0].type, css.attrTypes.endsWith);
    assert.equals(match.attributes[0].name, 'attribute');
    assert.equals(match.attributes[0].value, 'value');

    assert.done();
  },
  test7: function(assert) {
    var query = 'div[attribute*="value"]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;
    assert.equals(match.tagName, 'div');
    assert.equals(match.attributes.length, 1);
    assert.equals(match.attributes[0].type, css.attrTypes.containsSubstring);
    assert.equals(match.attributes[0].name, 'attribute');
    assert.equals(match.attributes[0].value, 'value');

    assert.done();
  },
  test8: function(assert) {
    var query = 'div[attribute|="value"]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;
    assert.equals(match.tagName, 'div');
    assert.equals(match.attributes.length, 1);
    assert.equals(match.attributes[0].type, css.attrTypes.hyphenSeppareted);
    assert.equals(match.attributes[0].name, 'attribute');
    assert.equals(match.attributes[0].value, 'value');

    assert.done();
  },
  test9: function(assert) {
    var query = '#id';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;
    assert.equals(match.id, 'id');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test10: function(assert) {
    var query = 'tag.class1[attribute1="value1"].class2[attribute2]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'tag');
    assert.equals(match.classes[0], 'class1');
    assert.equals(match.classes[1], 'class2');
    assert.equals(match.attributes[0].type, css.attrTypes.exactlyEqual);
    assert.equals(match.attributes[0].name, 'attribute1');
    assert.equals(match.attributes[0].value, 'value1');
    assert.equals(match.attributes[1].type, css.attrTypes.has);
    assert.equals(match.attributes[1].name, 'attribute2');
    assert.done();
  },
  test11: function(assert) {
    var query = 'body.class1[attr] > div tag.class1[attribute1="value1"].class2[attribute2]';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'tag');
    assert.equals(match.classes[0], 'class1');
    assert.equals(match.classes[1], 'class2');
    assert.equals(match.attributes[0].type, css.attrTypes.exactlyEqual);
    assert.equals(match.attributes[0].name, 'attribute1');
    assert.equals(match.attributes[0].value, 'value1');
    assert.equals(match.attributes[1].type, css.attrTypes.has);
    assert.equals(match.attributes[1].name, 'attribute2');


    assert.equals(combinators[0].type, css.types.anyParent);
    assert.equals(combinators[0].match.tagName, 'div');

    assert.equals(combinators[1].type, css.types.parent);
    assert.equals(combinators[1].match.tagName, 'body');
    assert.equals(combinators[1].match.classes[0], 'class1');
    assert.equals(combinators[1].match.attributes[0].type, css.attrTypes.has);
    assert.equals(combinators[1].match.attributes[0].name, 'attr');
    assert.done();
  },
  test12: function(assert) {
    var query = 'div,span';
    var obj = css.parse(query);

    var match = obj[0].match;
    var combinators = obj[0].combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(combinators.length, 0);

    match = obj[1].match;
    combinators = obj[1].combinators;

    assert.equals(match.tagName, 'span');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test13: function(assert) {
    var query = 'div , span';
    var obj = css.parse(query);

    var match = obj[0].match;
    var combinators = obj[0].combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(combinators.length, 0);

    match = obj[1].match;
    combinators = obj[1].combinators;

    assert.equals(match.tagName, 'span');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test14: function(assert) {
    var query = 'tag.class1[attribute1="value1"].class2[attribute2]        ,tag.class1[attribute1="value1"].class2[attribute2]#id';
    var obj = css.parse(query);
    var match = obj[0].match;
    var combinators = obj[0].combinators;

    assert.equals(match.tagName, 'tag');
    assert.equals(match.classes[0], 'class1');
    assert.equals(match.classes[1], 'class2');
    assert.equals(match.attributes[0].type, css.attrTypes.exactlyEqual);
    assert.equals(match.attributes[0].name, 'attribute1');
    assert.equals(match.attributes[0].value, 'value1');
    assert.equals(match.attributes[1].type, css.attrTypes.has);
    assert.equals(match.attributes[1].name, 'attribute2');

    match = obj[1].match;
    combinators = obj[1].combinators;

    assert.equals(match.tagName, 'tag');
    assert.equals(match.classes[0], 'class1');
    assert.equals(match.classes[1], 'class2');
    assert.equals(match.attributes[0].type, css.attrTypes.exactlyEqual);
    assert.equals(match.attributes[0].name, 'attribute1');
    assert.equals(match.attributes[0].value, 'value1');
    assert.equals(match.attributes[1].type, css.attrTypes.has);
    assert.equals(match.attributes[1].name, 'attribute2');
    assert.equals(match.id, 'id');

    assert.done();
  },
  test15: function(assert) {
    var query = 'div:first-child';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].name, 'first-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test16: function(assert) {
    var query = 'div:nth-child(n)';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.numerical);
    assert.equals(match.pseudos[0].value.left, '1');
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test17: function(assert) {
    var query = 'div:nth-child(1n)';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.numerical);
    assert.equals(match.pseudos[0].value.left, '1');
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test18: function(assert) {
    var query = 'div:nth-child(2n)';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.numerical);
    assert.equals(match.pseudos[0].value.left, '2');
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },

  test19: function(assert) {
    var query = 'div:nth-child( +1n )';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.numerical);
    assert.equals(match.pseudos[0].value.left, '1');
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test20: function(assert) {
    var query = 'div:nth-child( +1n + 32)';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.numerical);
    assert.equals(match.pseudos[0].value.left, '1');
    assert.equals(match.pseudos[0].value.right, '32');
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test20: function(assert) {
    var query = 'div:nth-child( +1n -32)';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.numerical);
    assert.equals(match.pseudos[0].value.left, '1');
    assert.equals(match.pseudos[0].value.right, '-32');
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test21: function(assert) {
    var query = 'div:nth-child( -3n +4)';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.numerical);
    assert.equals(match.pseudos[0].value.left, '-3');
    assert.equals(match.pseudos[0].value.right, '4');
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test22: function(assert) {
    var query = 'div:nth-child( odd )';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.odd);
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  },
  test23: function(assert) {
    var query = 'div:nth-child( even )';
    var obj = css.parse(query)[0];
    var match = obj.match;
    var combinators = obj.combinators;

    assert.equals(match.tagName, 'div');
    assert.equals(match.pseudos[0].type, css.pseudoTypes.withValue);
    assert.equals(match.pseudos[0].value.type, css.pseudoValueTypes.even);
    assert.equals(match.pseudos[0].name, 'nth-child');
    assert.equals(combinators.length, 0);
    assert.done();
  }
}

module.exports['html-parser'] = {
  test0: function(assert) {
    var document = createTree('test0');
    assert.equals(document.children.length, 0);
    assert.done();
  },

  test1: function(assert) {
    var document = createTree('test1');
    assert.equals(document.children.length, 2);
    assert.equals(document.children[0].type, mtype.element);
    assert.equals(document.children[0].tagName, 'div');
    assert.equals(document.children[0].children.length, 0);
    assert.equals(document.children[1].type, mtype.text);
    assert.equals(document.children[1].text, newLine);
    assert.done();
  },

  test2: function(assert) {
    var document = createTree('test2');
    assert.equals(document.children.length, 1);
    assert.equals(document.children[0].type, mtype.text);
    assert.equals(document.children[0].text, 'this is a text' + newLine);
    assert.done();
  },

  test3: function(assert) {
    var document = createTree('test3');
    assert.equals(document.children.length, 2);

    assert.equals(document.children[0].type, mtype.element);
    assert.equals(document.children[0].tagName, 'div');
    assert.equals(document.children[0].children.length, 1);
    assert.equals(document.children[0].children[0].type, mtype.text);
    assert.equals(document.children[0].children[0].text, 'Starts with element');

    assert.equals(document.children[1].type, 'text');
    assert.equals(document.children[1].text, newLine + 'Ends with text' + newLine);

    assert.done();
  },

  test4: function(assert) {
    var document = createTree('test4');

    assert.equals(document.children.length, 4);

    assert.equals(document.children[0].tagName, 'div');
    assert.equals(document.children[0].children[0].tagName, 'div');
    assert.equals(document.children[0].children[0].children[0].tagName, 'span');
    assert.equals(document.children[0].children[0].children[0].children[0].tagName, 'div');
    assert.equals(document.children[0].children[0].children[0].children[0].children[0].text, 'Correct Syntax');

    assert.equals(document.children[2].tagName, 'span');
    assert.equals(document.children[2].children.length, 1);
    assert.equals(document.children[2].children[0].tagName, 'div');
    assert.equals(document.children[2].children[0].children[0].text, 'Wrong Syntax');

    assert.done();
  },

  test5: function(assert) {
    var document = createTree('test5');

    assert.equals(document.children.length, 4);
    assert.equals(document.children[0].type, mtype.doctype);

    assert.equals(document.children[2].tagName, 'html');
    assert.equals(document.children[2].children[1].type, mtype.comment);
    assert.equals(document.children[2].children[1].content, '<!-- this is a comment <div>' + newLine + '</div>-->');
    assert.equals(document.children[2].children[3].type, mtype.cdata);
    assert.equals(document.children[2].children[3].content, '<![CDATA[ <!-- a comment --> ]]>');
    assert.equals(document.children[2].children[5].tagName, 'head');
    assert.equals(document.children[2].children[7].tagName, 'body');
    assert.equals(document.children[2].children[8].type, mtype.text);

    assert.done();
  },

  test6: function(assert) {
    var document = createTree('test6');

    assert.equals(document.children.length, 3);
    assert.equals(document.children[0].type, mtype.doctype);

    assert.equals(document.children[2].tagName, 'html');
    assert.equals(document.children[2].children[1].type, mtype.comment);


    assert.done();
  },

  test7: function(assert) {
    var document = createTree('test7');

    assert.equals(document.children.length, 3);
    assert.equals(document.children[0].type, mtype.doctype);

    assert.equals(document.children[2].tagName, 'html');
    assert.equals(document.children[2].children[1].type, mtype.cdata);
    assert.done();
  },

  test8: function(assert) {
    var document = createTree('test8');

    assert.equals(document.children.length, 2);

    assert.equals(document.children[0].tagName, 'div');
    assert.equals(document.children[0].attributes.class, 'class');

    assert.done();
  }
}

module.exports['html-parser-serialization'] = {
  test0: function(assert) {
    var testName = 'test0';
    var document = createTreeSerialization(testName);

    var actual = document.serialize();
    var expected = fs.readFileSync(path.join('dom_tests/html-parser-serialization/expected', testName + '.html'));
    assert.equals(expected, actual);
    assert.done();
  },

  test1: function(assert) {
    var testName = 'test1';
    var document = createTreeSerialization(testName);
    var actual = document.serialize();
    fs.writeFileSync(path.join('dom_tests/html-parser-serialization/expected', testName + '.html'), actual);
    var expected = fs.readFileSync(path.join('dom_tests/html-parser-serialization/expected', testName + '.html'));
    assert.equals(expected, actual);
    assert.done();
  },
}
