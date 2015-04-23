module.exports = function(content, options) {
	var blocks = [];
	/* ex: <!-- build:type (another/relative/path) filename.type {options} --><!-- /build --> */
	var build = /<!--\s*build:(\w+)(?:\s+\(([^\)]+)\))?\s*([^\s]*)\s*({[\s\S]*?})?\s*-->([\s\S]*?)<!--\s*\/build\s*-->/g;

	var startMatch;
	var process;
	if (options.types) {
		process = {};
		for (var i in options.types) {
			process[options.types[i]] = true;
		}
	}

	while ((startMatch = build.exec(content))) {
		var options = {};
		if (process && process[startMatch[1]] != true)
			continue;

		if (startMatch[4])
			options = JSON.parse(startMatch[4]);

		blocks.push({
			type: startMatch[1],
			relativePath: startMatch[2],
			target: startMatch[3],
			options: options,
			content: startMatch[5],
			fullSpan: startMatch[0]
		});
	}

	return blocks;
}
