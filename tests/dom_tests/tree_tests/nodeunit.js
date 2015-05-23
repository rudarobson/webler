var fs = require('fs');
var path = require('path');
var domBasePath = path.join(path.dirname(require.resolve('webler')), 'dom');
var parserCreator = require(path.join(domBasePath, 'html/parser'));
var mtype = require(path.join(domBasePath, 'markuptype'));
var parser = parserCreator();
var newLine = '\r\n';

function createTree(testName) {
  return parser.parse(fs.readFileSync(path.join('srcs', testName + '.html')).toString());
}

module.exports.test0 = function(assert) {
  var domArray = createTree('test0');
  assert.equals(domArray.length, 0);
  assert.done();
}

module.exports.test1 = function(assert) {
  var domArray = createTree('test1');
  assert.equals(domArray.length, 2);
  assert.equals(domArray[0].type, mtype.element);
  assert.equals(domArray[0].tagName, 'div');
  assert.equals(domArray[0].children.length, 0);
  assert.equals(domArray[1].type, mtype.text);
  assert.equals(domArray[1].text, newLine);
  assert.done();
}

module.exports.test2 = function(assert) {
  var domArray = createTree('test2');
  assert.equals(domArray.length, 1);
  assert.equals(domArray[0].type, mtype.text);
  assert.equals(domArray[0].text, 'this is a text' + newLine);
  assert.done();
}

module.exports.test3 = function(assert) {
  var domArray = createTree('test3');
  assert.equals(domArray.length, 2);

  assert.equals(domArray[0].type, mtype.element);
  assert.equals(domArray[0].tagName, 'div');
  assert.equals(domArray[0].children.length, 1);
  assert.equals(domArray[0].children[0].type, mtype.text);
  assert.equals(domArray[0].children[0].text, 'Starts with element');

  assert.equals(domArray[1].type, 'text');
  assert.equals(domArray[1].text, newLine + 'Ends with text' + newLine);

  assert.done();
}

module.exports.test4 = function(assert) {
  var domArray = createTree('test4');

  assert.equals(domArray.length, 4);

  assert.equals(domArray[0].tagName, 'div');
  assert.equals(domArray[0].children[0].tagName, 'div');
  assert.equals(domArray[0].children[0].children[0].tagName, 'span');
  assert.equals(domArray[0].children[0].children[0].children[0].tagName, 'div');
  assert.equals(domArray[0].children[0].children[0].children[0].children[0].text, 'Correct Syntax');

  assert.equals(domArray[2].tagName, 'span');
  assert.equals(domArray[2].children.length, 1);
  assert.equals(domArray[2].children[0].tagName, 'div');
  assert.equals(domArray[2].children[0].children[0].text, 'Wrong Syntax');

  assert.done();
}

module.exports.test5 = function(assert) {
  var domArray = createTree('test5');

  assert.equals(domArray.length, 4);
  assert.equals(domArray[0].type, mtype.doctype);

  assert.equals(domArray[2].tagName, 'html');
  assert.equals(domArray[2].children[1].type, mtype.comment);
  assert.equals(domArray[2].children[1].content, '<!-- this is a comment <div>' + newLine + '</div>-->');
  assert.equals(domArray[2].children[3].type, mtype.cdata);
  assert.equals(domArray[2].children[3].content, '<![CDATA[ <!-- a comment --> ]]>');
  assert.equals(domArray[2].children[5].tagName, 'head');
  assert.equals(domArray[2].children[7].tagName, 'body');
  assert.equals(domArray[2].children[8].type, mtype.text);

  assert.done();
}

module.exports.test6 = function(assert) {
  var domArray = createTree('test6');

  assert.equals(domArray.length, 3);
  assert.equals(domArray[0].type, mtype.doctype);

  assert.equals(domArray[2].tagName, 'html');
  assert.equals(domArray[2].children[1].type, mtype.comment);


  assert.done();
}

module.exports.test7 = function(assert) {
  var domArray = createTree('test7');

  assert.equals(domArray.length, 3);
  assert.equals(domArray[0].type, mtype.doctype);

  assert.equals(domArray[2].tagName, 'html');
  assert.equals(domArray[2].children[1].type, mtype.cdata);
  assert.done();
}


module.exports.test8 = function(assert) {
  var domArray = createTree('test8');

  assert.equals(domArray.length, 2);

  assert.equals(domArray[0].tagName, 'div');
  assert.equals(domArray[0].attributes.class, 'class');
  
  assert.done();
}
