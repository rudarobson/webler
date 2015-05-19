var webler = require('webler');
var fs = require('fs');
var path = require('path');

module.exports.components = function(assert) {
  var tests_count = 9;
  var test_options = {

  };
  webler.loadModule('components');
  assert.expect(9);
  for (var i = 0; i < tests_count; i++) {
    var testName = 'test' + i;
    webler.weble({
      src: 'components/tests',
      dest: 'components/tests_results',
      globs: {
        cwd: '~' + testName,
        src: ['*.html'],
        dest: '~'
      }
    }).components({
      componentsPath: '~/' + testName + '/components'
    });

    webler.render();

    var expected = fs.readFileSync('components/expected/' + testName + '/index.html').toString();
    var actual = fs.readFileSync('components/tests_results/' + testName + '/index.html').toString();
    assert.equals(expected, actual);
  }
  assert.done();
}
