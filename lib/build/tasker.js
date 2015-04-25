var fs = require('fs');
var lf = require('os').EOL;
var ujs = require("uglify-js");
var ccss = require('clean-css');
var sass = require('node-sass');

function concatSources(sources) {
	var concat = '';
	for (var i in sources) {
		concat += fs.readFileSync(sources[i]).toString() + lf;
	}

	return concat;
}
var tasks = {
	js: function(sources, opts) {
		var f = concatSources(sources);

		return ujs.minify(f, {
			fromString: true
		}).code;
	},
	css: function(sources, opts) {
		var f = concatSources(sources);

		return new ccss().minify(f).styles;
	},
	sass: function(sources, opts) {
		//var f = concatSources(sources);
		//using file for now, invalid UTF 8 when using the data option
		var res = sass.renderSync({
			file: sources[0]
		});

		return res.css;
	}
};

module.exports = {
	exec: function(taskName, sources, opts) {
		return tasks[taskName](sources, opts);
	},
	addTask: function(taskName, fn) {
		tasks[taskName] = fn;
	}
}
