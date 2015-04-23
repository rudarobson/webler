var components = require('../lib/components/components');
var buildBlock = require('../lib/build-block/build-block');
var handlebars = require('../lib/handlebars/handlebars');
var tasker = require('../lib/build-block/tasker');
var fs = require('fs');
var utils = require('../lib/utils/utils.js');
var path = require('path');


var modules = {
	'build-block': function(content, srcDir, dst, options) {
		var res = buildBlock.parse(content, srcDir, dst, options);
		return res;
	},
	components: function(cnt, options) {
		return components.parse(cnt, options);
	},
	handlebars: function(cnt, options) {
		return handlebars.parse(cnt, options);
	}
}

var defaultExec = ['components', 'build-block']
module.exports = {
	weble: function(src, dst, options, exec) {

		if (!options)
			options = {};
		if (!exec)
			exec = defaultExec;

		var content = fs.readFileSync(src).toString();
		var srcDir = path.dirname(src);

		for (var i in exec) {
			switch (exec[i]) {
				case 'build-block':
					var b = modules['build-block'](content, srcDir, dst, options); //******* options must be changed
					content = b.content;
					var tasks = b.tasks;

					for (var i in tasks) {
						var task = tasks[i];
						for (var j in task) {
							var res = tasker.exec(i, task[j].sources, task[j].options);
							utils.safeWriteFile(task[j].dest, res);
						}
					}
					break;
				case 'components':
					content = modules.components(content, options);
					break;
				case 'handlebars':
					content = modules.handlebars(content, options);
					break;
				default:
					console.log('Unsuported command!');
					throw 'Unsuported command!';
			}
		}

		utils.safeWriteFile(dst, content);
	}
}
