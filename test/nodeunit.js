var fs = require('fs');
var webler = require('../bin/webler');


function test(assert, tests, exec) {
	var src;
	var res;
	var dest;
	var expected;
	var actual;

	for (var i in tests) {
		var test = tests[i]

		webler.weble(test.src, test.dest, test.options, exec);

		for (var j in test.assert) {
			actual = fs.readFileSync(test.assert[j].actual).toString();
			expected = fs.readFileSync(test.assert[j].expected).toString();
			assert.equals(actual, expected, test.description);
		}
	}
}

module.exports.testBuildBlock = function(assert) {
	var tests = require('./nodeunit/buildBlock')();

	assert.expect(18);
	test(assert, tests, ['build-block']);
	assert.done();
};

module.exports.components = function(assert) {
	var tests = require('./nodeunit/components')();

	assert.expect(9);
	test(assert, tests, ['components']);
	assert.done();
};

module.exports.handlebars = function(assert) {
	var tests = require('./nodeunit/handlebars')();

	assert.expect(4);
	test(assert, tests, ['handlebars']);
	assert.done();
};
