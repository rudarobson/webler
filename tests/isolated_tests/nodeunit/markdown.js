var path = require('path');

function setTestsOptions(testsPath, test_resultsPath, expectedPath) {

	var options = {};
	for (var i = 1; i <= 1; i++) {
		var testName = 'test' + i
		options[testName] = {};
	}

	return options;
}

function setTests() {
	var testsDescription = {
		test1: 'test1: ',
	};

	var testsPath = 'markdown/tests';
	var expectedPath = 'markdown/expected';
	var test_resultsPath = 'markdown/tests_results';
	var tests = {}
	var testsOptions = setTestsOptions(testsPath, test_resultsPath, expectedPath);


	for (var i = 0; i <= 1; i++) {
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

	return tests;
};

module.exports = setTests;
