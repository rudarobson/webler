var fs = require('fs');
var webler = require('../../bin/webler');

function assertFiles(assert, files, description) {
  for (var j in files) {
    actual = fs.readFileSync(files[j].actual).toString();
    expected = fs.readFileSync(files[j].expected).toString();
    assert.equals(actual, expected, description);
  }
}

function test(assert, tests, moduleName) {
  var src;
  var res;
  var dest;
  var expected;
  var actual;

  for (var i in tests) {
    var test = tests[i]
    var unitOfCompilation = webler.weble({
      src: test.src,
      dest: test.dest
    });

    unitOfCompilation.compile()[moduleName](test.options);
    unitOfCompilation.render();
    unitOfCompilation.clean();

    assertFiles(assert, test.assert, test.description);
  }
}


/*module.exports.build = function(assert) {
  var tests = require('./nodeunit/build')();

  assert.expect(18);
  test(assert, tests, 'build');
  assert.done();
};*/

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

  assert.expect(3);
  test(assert, tests, 'razor');
  assert.done();
};


module.exports.bundle = function(assert) {
  var tests = require('./nodeunit/bundle')();
  var src;
  var res;
  var dest;
  var expected;
  var actual;

  assert.expect(6);
  var bundleApi = require('../../lib/bundle/bundle');

  for (var i in tests) {
    var test = tests[i]
    var unitOfCompilation = webler.weble({
      src: test.src,
      dest: test.dest
    }, test.options.webler);

    var bundlesToRegister = test.options.module.bundlesToRegister;
    for (var i in bundlesToRegister) {
      var register = bundlesToRegister[i];
      var bundle = bundleApi.bundles().add(register.type, register.key);
      for (var j in register.files) {
        var file = register.files[j];
        bundle.include(file.type, file.src)
      }
    }

    unitOfCompilation.compile().bundle(test.options.module);
    unitOfCompilation.render();
    unitOfCompilation.clean();

    bundleApi.bundles().bundles = {}; //clean registered bundles
    assertFiles(assert, test.assert, test.description);
  }


  assert.done();
}
