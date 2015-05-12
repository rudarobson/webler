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

  options.test3 = {
    module: {
      bundlesToRegister: [{
        type: 'styles',
        key: '~/index.css',
        files: [{
          type: 'sass',
          src: '~/index.scss'
        }]
      }]
    }
  };

  for (var i = 0; i <= 3; i++) {
    var testName = 'test' + i;
    if (!options[testName])
      options[testName] = {};

    options[testName].webler = {
      src: path.join(testsPath, testName),
      dest: path.join(test_resultsPath, testName)
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
    test2: 'test2: javascript bundle',
    test3: 'test3: sass bundle',
  };



  for (var i = 0; i <= 3; i++) {
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

  tests.test3.assert.push({
    actual: path.join(test_resultsPath, 'test3/index.css'),
    expected: path.join(expectedPath, 'test3/index.css')
  });

  return tests;
}

module.exports = setTests;
