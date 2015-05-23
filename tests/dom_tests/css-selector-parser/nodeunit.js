var path = require('path');
var domBasePath = path.join(path.dirname(require.resolve('webler')), 'dom');
var css = require(path.join(domBasePath, 'css-selector-parser/parser'));

module.exports.test0 = function(assert) {
  var query = 'div';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;

  assert.equals(match.tagName, 'div');
  assert.equals(parents.length, 0);
  assert.done();
}

module.exports.test1 = function(assert) {
  var query = '.class';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;

  assert.equals(match.classes[0], 'class');
  assert.equals(parents.length, 0);
  assert.done();
}

module.exports.test2 = function(assert) {
  var query = 'div[attribute]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;
  assert.equals(match.tagName, 'div');
  assert.equals(match.attributes.length, 1);
  assert.equals(match.attributes[0].type, css.attrTypes.has);

  assert.done();
}

module.exports.test3 = function(assert) {
  var query = 'div[attribute="value"]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;
  assert.equals(match.tagName, 'div');
  assert.equals(match.attributes.length, 1);
  assert.equals(match.attributes[0].type, css.attrTypes.exactlyEqual);
  assert.equals(match.attributes[0].name, 'attribute');
  assert.equals(match.attributes[0].value, 'value');

  assert.done();
}

module.exports.test4 = function(assert) {
  var query = 'div[attribute~="value"]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;
  assert.equals(match.tagName, 'div');
  assert.equals(match.attributes.length, 1);
  assert.equals(match.attributes[0].type, css.attrTypes.blankSepparated);
  assert.equals(match.attributes[0].name, 'attribute');
  assert.equals(match.attributes[0].value, 'value');

  assert.done();
}

module.exports.test5 = function(assert) {
  var query = 'div[attribute^="value"]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;
  assert.equals(match.tagName, 'div');
  assert.equals(match.attributes.length, 1);
  assert.equals(match.attributes[0].type, css.attrTypes.beginsWith);
  assert.equals(match.attributes[0].name, 'attribute');
  assert.equals(match.attributes[0].value, 'value');

  assert.done();
}

module.exports.test6 = function(assert) {
  var query = 'div[attribute$="value"]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;
  assert.equals(match.tagName, 'div');
  assert.equals(match.attributes.length, 1);
  assert.equals(match.attributes[0].type, css.attrTypes.endsWith);
  assert.equals(match.attributes[0].name, 'attribute');
  assert.equals(match.attributes[0].value, 'value');

  assert.done();
}

module.exports.test7 = function(assert) {
  var query = 'div[attribute*="value"]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;
  assert.equals(match.tagName, 'div');
  assert.equals(match.attributes.length, 1);
  assert.equals(match.attributes[0].type, css.attrTypes.containsSubstring);
  assert.equals(match.attributes[0].name, 'attribute');
  assert.equals(match.attributes[0].value, 'value');

  assert.done();
}

module.exports.test8 = function(assert) {
  var query = 'div[attribute|="value"]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;
  assert.equals(match.tagName, 'div');
  assert.equals(match.attributes.length, 1);
  assert.equals(match.attributes[0].type, css.attrTypes.hyphenSeppareted);
  assert.equals(match.attributes[0].name, 'attribute');
  assert.equals(match.attributes[0].value, 'value');

  assert.done();
}

module.exports.test9 = function(assert) {
  var query = 'tag.class1[attribute1="value1"].class2[attribute2]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;

  assert.equals(match.tagName, 'tag');
  assert.equals(match.classes[0],'class1');
  assert.equals(match.classes[1],'class2');
  assert.equals(match.attributes[0].type,css.attrTypes.exactlyEqual);
  assert.equals(match.attributes[0].name,'attribute1');
  assert.equals(match.attributes[0].value,'value1');
  assert.equals(match.attributes[1].type,css.attrTypes.has);
  assert.equals(match.attributes[1].name,'attribute2');
  assert.done();
}


module.exports.test20 = function(assert) {
  var query = '.class1 > a-child';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var parents = obj.parents;

  assert.equals(match.tagName, 'a-child');
  assert.equals(parents[0].type, css.types.parent);
  assert.equals(parents[0].value.classes.length, 1);
  assert.equals(parents[0].value.classes[0], 'class1');
  assert.done();
}
