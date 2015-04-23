var path = require('path');

function setTestsOptions(testsPath, test_resultsPath, expectedPath) {

	var options = {};
	for (var i = 0; i <= 8; i++) {
		var testName = 'test' + i
		options[testName] = {
			componentsPath: path.join(testsPath, testName, 'components')
		}
	}

	return options;
}

function setTests() {
	var testsDescription = {
		test1: 'a simple test with one custom tag',
		test2: 'a more complex test with one custom tag',
		test3: 'one custom tag testing attribute merging',
		test4: 'testing attribute merging with nested custom tags',
		test5: 'testing multiple uses of tag with nesting',
		test6: 'testing alias same tag with different alias and multiple tags',
		test7: 'testing directory importing',
		test8: 'testing default directry importing'

	};

	var testsPath = 'components/tests';
	var expectedPath = 'components/expected';
	var test_resultsPath = 'components/tests_results';
	var tests = {}
	var testsOptions = setTestsOptions(testsPath, test_resultsPath, expectedPath);


	for (var i = 0; i <= 8; i++) {
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
