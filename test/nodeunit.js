var fs = require('fs');
var webler = require('../bin/webler');


function test(assert, tests, moduleName) {
  var src;
  var res;
  var dest;
  var expected;
  var actual;

  for (var i in tests) {
    var test = tests[i]

    webler.weble(test.src, test.dest, test.options).compile()[moduleName]();

    for (var j in test.assert) {
      actual = fs.readFileSync(test.assert[j].actual).toString();
      expected = fs.readFileSync(test.assert[j].expected).toString();
      assert.equals(actual, expected, test.description);
    }
  }
}

module.exports.build = function(assert) {
  var tests = require('./nodeunit/build')();

  assert.expect(18);
  test(assert, tests, 'build');
  assert.done();
};

module.exports.components = function(assert) {
  var tests = require('./nodeunit/components')();

  assert.expect(9);
  test(assert, tests, 'components');
  assert.done();
};

module.exports.handlebars = function(assert) {
  var tests = require('./nodeunit/handlebars')();

  assert.expect(4);
  test(assert, tests, 'handlebars');
  assert.done();
};

module.exports.markdown = function(assert) {
  var tests = require('./nodeunit/markdown')();

  assert.expect(2);
  test(assert, tests, 'markdown');
  assert.done();
};

module.exports.razor = function(assert) {
  var tests = require('./nodeunit/razor')();

  assert.expect(2);
  test(assert, tests, 'razor');
  assert.done();
};
