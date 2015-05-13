var fs = require('fs');
var webler = require('webler');
var glob = require('glob');
var path = require('path');

module.exports.SimpleApp = function(assert) {
  var web = require('./webler.js').develop(webler);
  var srcs = '**/*.*';
  var expected = glob.sync(srcs, {
    cwd: 'expected/release'
  });

  var actual = glob.sync(srcs, {
    cwd: 'release'
  });

  if (expected.length != actual.length) {
    var msg = 'Different number of files';
    console.log(msg);
    throw msg;
  }

  assert.expect(expected.length);

  for (var i in expected) {
    var expSrc = path.join('expected/release', expected[i]);
    var actSrc = path.join('release', expected[i]);
    assert.equals(fs.readFileSync(expSrc).toString(), fs.readFileSync(actSrc).toString())
  }
  assert.done();
};
