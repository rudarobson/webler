function processFilesWithRegex(regex, content) {
	var files = [];
	var match;
	while ((match = regex.exec(content))) {
		files.push(match[1]);
	}
	return files;
}

var types = {
	js: {
		contentReplacer: function(target) {
			return '<script src="' + target + '"></script>';
		},
		getFiles: function(content) {
			var regex = /<script[\s\S]*?src=['"]([^"'<>]+)["']/g;
			return processFilesWithRegex(regex, content);
		}
	},
	css: {
		contentReplacer: function(target) {
			return '<link rel="stylesheet" type="text/css" href="' + target + '" />';
		},
		getFiles: function(content) {
			var regex = /<link[\s\S]*?href=['"]([^"'<>]+)["']/g;
			return processFilesWithRegex(regex, content);
		}
	},
	sass: {
		contentReplacer: function(target) {
			return '<link rel="stylesheet" type="text/css" href="' + target + '" />';
		},
		getFiles: function(content) {
			var regex = /<link[\s\S]*?href=['"]([^"'<>]+)["']/g;
			return processFilesWithRegex(regex, content);
		}
	}
}

module.exports = {
	render: function(type, target) {
		return types[type].contentReplacer(target);
	},
	getFiles: function(type, content) {
		return types[type].getFiles(content);
	}
};
