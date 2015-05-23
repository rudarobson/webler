var path = require('path');
var domBasePath = path.join(path.dirname(require.resolve('webler')), 'dom');
var css = require(path.join(domBasePath, 'css-selector-parser/parser'));

module.exports.test0 = function(assert) {
  var query = '.class1 > a-child';
  var obj = css.parse(query);
  var match = obj.match;
  var parents = obj.parents;

  assert.equals(match.tagName, 'a-child');
  assert.equals(parents[0].type, css.types.parent);
  assert.equals(parents[0].value.classes.length, 1);
  assert.equals(parents[0].value.classes[0], 'class1');
  assert.done();
}
