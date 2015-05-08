var path = require('path');

function setTestsOptions(testsPath, test_resultsPath, expectedPath) {
  var options = {};

  options.test2 = {
    module: {
      bundlesToRegister: [{
        type: 'scripts',
        key: '~/index.js',
        files: [{
          type: 'js',
          src: '~/index1.js'
        }, {
          type: 'js',
          src: '~/index2.js'
        }]
      }]
    }
  };

  for (var i = 0; i <= 2; i++) {
    var testName = 'test' + i;
    if (!options[testName])
      options[testName] = {};

    options[testName].webler = {
      virtualPath: {
        src: path.join(testsPath, testName),
        dest: path.join(test_resultsPath, testName)
      }
    }

    if (!options[testName].module)
      options[testName].module = {};
  }

  return options;
}


function setTests() {
  var testsPath = 'bundle/tests';
  var expectedPath = 'bundle/expected';
  var test_resultsPath = 'bundle/tests_results';
  var tests = {}

  var testsOptions = setTestsOptions(testsPath, test_resultsPath, expectedPath);
  var testsDescription = {
    test0: 'test0: empty file test',
    test1: 'test1: html without any bundle',
    test2: 'test2: javascript bundle'
  };



  for (var i = 0; i <= 2; i++) {
    var testName = 'test' + i;

    tests[testName] = {
      src: path.join(testsPath, testName, 'index.html'),
      dest: path.join(test_resultsPath, testName, 'index.html'),
      description: testsDescription[testName],
      options: testsOptions[testName],
      assert: [{
        actual: path.join(test_resultsPath, testName, 'index.html'),
        expected: path.join(expectedPath, testName, 'index.html')
      }]
    };
  }

  tests.test2.assert.push({
    actual: path.join(test_resultsPath, 'test2/index.js'),
    expected: path.join(expectedPath, 'test2/index.js')
  });

  return tests;
}

module.exports = setTests;
