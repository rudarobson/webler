var $ = require('cheerio');

var cheerio = require('cheerio');



module.exports = function(html, options) {
	var opt = {
		xmlMode: false
	};
	for (var i in options)
		opt[i] = options[i];

	return cheerio.load(html, options)
}
