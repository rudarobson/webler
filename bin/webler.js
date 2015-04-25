var components = require('../lib/components/components');
var build = require('../lib/build/build');
var handlebars = require('../lib/handlebars/handlebars');
var tasker = require('../lib/build/tasker');
var fs = require('fs');
var utils = require('../lib/utils/utils.js');
var path = require('path');


var modules = {
	build: function(content, srcDir, dst, options) {
		var res = build.parse(content, srcDir, dst, options);
		return res;
	},
	components: function(cnt, options) {
		return components.parse(cnt, options);
	},
	handlebars: function(cnt, options) {
		return handlebars.parse(cnt, options);
	}
}

var defaultExec = ['components', 'build']
module.exports = {
	weble: function(src, dst, options, exec) {

		if (!options)
			options = {};
		if (!exec)
			exec = defaultExec;

		var content = fs.readFileSync(src).toString();

		
		for (var i in exec) {
			var res = modules[exec[i]](content, options[exec[i]], src, dst);
			switch (exec[i]) {
				case 'build':
					content = res.content;
					var tasks = res.tasks;
					for (var i in tasks) {
						var task = tasks[i];
						for (var j in task) {
							var res = tasker.exec(i, task[j].sources, task[j].options);
							utils.safeWriteFile(task[j].dest, res);
						}
					}
					break;
				case 'components':
					content = res;
					break;
				case 'handlebars':
					content = res;
					break;
				default:
					console.log('Unsuported command!');
					throw 'Unsuported command!';
			}
		}

		utils.safeWriteFile(dst, content);
	}
}
