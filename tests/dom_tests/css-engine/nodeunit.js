var path = require('path');
var fs = require('fs');
var domBasePath = path.join(path.dirname(require.resolve('webler')), 'dom');
var cssEngine = require(path.join(domBasePath, 'css/engine'));
var htmlParser = require(path.join(domBasePath, 'html/parser'))();


var dom1 = htmlParser.parse(fs.readFileSync('./srcs/src1.html').toString());

module.exports.test1 = function(assert) {
  var elts = dom1.filter('.class2 span');

  assert.equals(elts.length, 1);
  assert.equals(elts[0].tagName, 'span');
  assert.done();
}
module.exports.test2 = function(assert) {
  var elts = dom1.filter('#spanwithid'); //changing sensitive case  of document
  assert.equals(elts.length, 1);
  assert.done();
}

module.exports.test3 = function(assert) {
  var elts = dom1.filter('[attribute1]');

  assert.equals(elts.length, 2);
  assert.equals(elts[0].tagName, 'div');
  assert.equals(elts[1].tagName, 'span');
  assert.done();
}

module.exports.test4 = function(assert) {
  var elts = dom1.filter('[attribute1="value"]');

  assert.equals(elts.length, 1);
  assert.equals(elts[0].tagName, 'div');
  assert.done();
}

module.exports.test5 = function(assert) {
  var elts = dom1.filter('[class~="div-class1"]');

  assert.equals(elts.length, 1);
  assert.equals(elts[0].tagName, 'div');
  assert.done();
}

module.exports.test6 = function(assert) {
  var elts = dom1.filter('[attribute1^="value"]');

  assert.equals(elts.length, 2);
  assert.equals(elts[0].tagName, 'div');
  assert.equals(elts[1].tagName, 'span');
  assert.done();
}

module.exports.test7 = function(assert) {
  var elts = dom1.filter('[attribute1$="alue1"]');

  assert.equals(elts.length, 1);
  assert.equals(elts[0].tagName, 'span');
  assert.done();
}

module.exports.test8 = function(assert) {
  var elts = dom1.filter('[attribute1*="alue"]');

  assert.equals(elts.length, 2);
  assert.equals(elts[0].tagName, 'div');
  assert.equals(elts[1].tagName, 'span');
  assert.done();
}


module.exports.test9 = function(assert) {
  var elts = dom1.filter('[attribute2|="value1"]');

  assert.equals(elts.length, 1);
  assert.equals(elts[0].tagName, 'span');
  assert.done();
}
