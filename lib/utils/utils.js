var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');

module.exports = {
	mergeObjects: function(obj1, obj2) {
		for (var attrname in obj2) {
			obj1[attrname] = obj2[attrname];
		}
	},
	safeWriteFile: function(dest, content) {
		var dir = path.dirname(dest);
		mkdirp.sync(dir)
		fs.writeFileSync(dest, content);
	}
};
