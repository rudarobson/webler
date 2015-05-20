var webler = require('webler');
var fs = require('fs');
var path = require('path');

module.exports.components = function(assert) {
  var tests_count = 10;
  var test_options = {

  };
  webler.loadModule('components');
  assert.expect(tests_count);
  for (var i = 0; i < tests_count; i++) {
    var testName = 'test' + i;
    webler.weble({
      src: 'components/tests/' + testName,
      dest: 'components/tests_results/' + testName,
      globs: {
        cwd: '~',
        src: ['*.html'],
        dest: '~'
      }
    }).components({
      componentsPath: '~components'
    });

    webler.render();

    var expected = fs.readFileSync('components/expected/' + testName + '/index.html').toString();
    var actual = fs.readFileSync('components/tests_results/' + testName + '/index.html').toString();
    assert.equals(expected, actual);
  }
  assert.done();
}
