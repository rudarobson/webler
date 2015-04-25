var path = require('path');

function setTestsOptions(testsPath, test_resultsPath, expectedPath) {
  var testOptionsGroup1 = [2, 3, 4];
  var options = {};
  for (var i in testOptionsGroup1) {
    options['test' + testOptionsGroup1[i]] = {
      srcRoot: path.join(testsPath, 'test' + testOptionsGroup1[i]),
      dstRoot: path.join(test_resultsPath, 'test' + testOptionsGroup1[i])
    }
  }

  options.test22 = {
    tasks: {
      sass: true
    },
    runAll: false
  };

  options.test23 = {
    srcRoot: path.join(testsPath, 'test23/'),
    dstRoot: path.join(test_resultsPath, 'test23/'),
    tasks: {
      sass: true
    }
  };

  for (var i in options) {
    options[i] = {
      build: options[i]
    };
  }
  return options;
}


function setTests() {
  var testsPath = 'build/tests';
  var expectedPath = 'build/expected';
  var test_resultsPath = 'build/tests_results';
  var tests = {}

  var testsOptions = setTestsOptions(testsPath, test_resultsPath, expectedPath);
  var testsDescription = {
    test0: 'test0: empty file test',
    test1: 'test1: html without any build block',
    test2: 'test2: html in a directory different of assets',
    test3: 'test3: html in a directory different of assets',
    test4: 'test4: using a different relative path',
    test10: 'test10:',
    test11: 'test11:',
    test20: 'test20:',
    test21: 'test21:',
    test22: 'test22:',
    test23: 'test23:'
  };

  /* js */
  var group1 = [0, 1];
  for (var i in group1) {
    var testName = 'test' + group1[i];

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

  tests.test2 = {
    src: path.join(testsPath, 'test2/subdir/index.html'),
    dest: path.join(test_resultsPath, 'test2/index.html'),
    description: testsDescription.test2,
    options: testsOptions.test2,
    assert: [{
      actual: path.join(test_resultsPath, 'test2/index.html'),
      expected: path.join(expectedPath, 'test2/index.html')
    }, {
      actual: path.join(test_resultsPath, 'test2/app.js'),
      expected: path.join(expectedPath, 'test2/app.js')
    }]
  };

  var group2 = [3, 4];
  for (var i in group2) {
    var testName = 'test' + group2[i];

    tests[testName] = {
      src: path.join(testsPath, testName, 'index.html'),
      dest: path.join(test_resultsPath, testName, 'index.html'),
      description: testsDescription[testName],
      options: testsOptions[testName],
      assert: [{
        actual: path.join(test_resultsPath, testName, 'index.html'),
        expected: path.join(expectedPath, testName, 'index.html')
      }, {
        actual: path.join(test_resultsPath, testName, 'app.js'),
        expected: path.join(expectedPath, testName, 'app.js')
      }]
    };
  }
  /* js */

  /* css */
  var group3 = [10, 11];
  for (var i in group3) {
    var testName = 'test' + group3[i];

    tests[testName] = {
      src: path.join(testsPath, testName, 'index.html'),
      dest: path.join(test_resultsPath, testName, 'index.html'),
      description: testsDescription[testName],
      options: testsOptions[testName],
      assert: [{
        actual: path.join(test_resultsPath, testName, 'index.html'),
        expected: path.join(expectedPath, testName, 'index.html')
      }, {
        actual: path.join(test_resultsPath, testName, 'index.css'),
        expected: path.join(expectedPath, testName, 'index.css')
      }]
    };
  }
  /* css */

  /* scss */
  var group4 = [21, 22]; //test 20 should be here but data option throws invalid UTF 8
  for (var i in group4) {
    var testName = 'test' + group4[i];

    tests[testName] = {
      src: path.join(testsPath, testName, 'index.html'),
      dest: path.join(test_resultsPath, testName, 'index.html'),
      description: testsDescription[testName],
      options: testsOptions[testName],
      assert: [{
        actual: path.join(test_resultsPath, testName, 'index.html'),
        expected: path.join(expectedPath, testName, 'index.html')
      }, {
        actual: path.join(test_resultsPath, testName, 'index.css'),
        expected: path.join(expectedPath, testName, 'index.css')
      }]
    };
  }

  tests.test23 = {
    src: path.join(testsPath, 'test23/Home/index.html'),
    dest: path.join(test_resultsPath, 'test23/Home/index.html'),
    description: testsDescription.test23,
    options: testsOptions.test23,
    assert: [{
      actual: path.join(test_resultsPath, 'test23/Home/index.html'),
      expected: path.join(expectedPath, 'test23/Home/index.html')
    }, {
      actual: path.join(test_resultsPath, 'test23/assets/css/index.css'),
      expected: path.join(expectedPath, 'test23/assets/css/index.css')
    }]
  };
  /* scss */

  return tests;
}

module.exports = setTests;
