var path = require('path');

function setTestsOptions(testsPath, test_resultsPath, expectedPath) {

	var options = {};
	for (var i = 1; i <= 3; i++) {
		var testName = 'test' + i
		options[testName] = {
			layoutsPath: path.join(testsPath, testName, 'layouts')
		}
	}

	options.test3.layoutsExt = '.layout';

	return options;
}

function setTests() {
	var testsDescription = {
		test1: 'test1: a simple test with layout',
		test2: 'test2: ',
		test3: 'test3: '
	};

	var testsPath = 'handlebars/tests';
	var expectedPath = 'handlebars/expected';
	var test_resultsPath = 'handlebars/tests_results';
	var tests = {}
	var testsOptions = setTestsOptions(testsPath, test_resultsPath, expectedPath);


	for (var i = 0; i <= 3; i++) {
		var testName = 'test' + i;

		tests[testName] = {
			src: path.join(testsPath, testName, 'index.hbs'),
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
