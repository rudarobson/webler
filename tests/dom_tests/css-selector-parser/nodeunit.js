var path = require('path');
var domBasePath = path.join(path.dirname(require.resolve('webler')), 'dom');
var css = require(path.join(domBasePath, 'css/parser'));

module.exports.test0 = function(assert) {
  var query = 'div';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var combinators = obj.combinators;

  assert.equals(match.tagName, 'div');
  assert.equals(combinators.length, 0);
  assert.done();
}

module.exports.test1 = function(assert) {
  var query = '.class';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var combinators = obj.combinators;

  assert.equals(match.classes[0], 'class');
  assert.equals(combinators.length, 0);
  assert.done();
}

module.exports.test2 = function(assert) {
  var query = 'div[attribute]';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var combinators = obj.combinators;
  assert.equals(match.tagName, 'div');
  assert.equals(match.attributes.length, 1);
  assert.equals(match.attributes[0].type, css.attrTypes.has);

  assert.done();
}

module.exports.test3 = function(assert) {
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
}

module.exports.test4 = function(assert) {
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
}

module.exports.test5 = function(assert) {
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
}

module.exports.test6 = function(assert) {
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
}

module.exports.test7 = function(assert) {
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
}

module.exports.test8 = function(assert) {
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
}

module.exports.test9 = function(assert) {
  var query = '#id';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var combinators = obj.combinators;
  assert.equals(match.id, 'id');
  assert.equals(combinators.length, 0);
  assert.done();
}

module.exports.test10 = function(assert) {
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
}

module.exports.test11 = function(assert) {
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
}

module.exports.test12 = function(assert) {
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
}

module.exports.test13 = function(assert) {
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
}

module.exports.test14 = function(assert) {
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
}

module.exports.test15 = function(assert) {
  var query = 'div:first-child';
  var obj = css.parse(query)[0];
  var match = obj.match;
  var combinators = obj.combinators;

  assert.equals(match.tagName, 'div');
  assert.equals(match.pseudos[0].name, 'first-child');
  assert.equals(combinators.length, 0);
  assert.done();
}

module.exports.test16 = function(assert) {
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
}

module.exports.test17 = function(assert) {
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
}

module.exports.test18 = function(assert) {
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
}

module.exports.test19 = function(assert) {
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
}

module.exports.test20 = function(assert) {
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
}

module.exports.test20 = function(assert) {
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
}

module.exports.test21 = function(assert) {
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
}


module.exports.test22 = function(assert) {
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
}

module.exports.test23 = function(assert) {
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
