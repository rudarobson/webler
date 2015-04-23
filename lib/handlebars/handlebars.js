var fs = require('fs');
var path = require('path');
var utils = require('../utils/utils');


var defaults = {
	layoutsExt: '.hbs'
};



module.exports = {
	parse: function(cnt, options) {
		var opt = {};
		if (!options)
			opt = utils.mergeObjects(opt, defaults);
		else {
			utils.mergeObjects(opt, options);
			for (var i in defaults) {
				if (!(i in opt))
					opt[i] = defaults[i];
			}
		}

		var Handlebars = require('handlebars');

		require('handlebars-layouts').register(Handlebars);
		var partialsToUnregister = [];
		var layoutsPath = opt.layoutsPath;
		if (layoutsPath) {
			var layouts = fs.readdirSync(layoutsPath);
			var regex = new RegExp(opt.layoutsExt + "$");

			for (var i in layouts) {
				if (regex.test(layouts[i])) {
					var name = (layouts[i] + '?..').replace(opt.layoutsExt + '?..', '');

					partialsToUnregister.push(name);
					Handlebars.registerPartial(name, fs.readFileSync(path.join(layoutsPath, layouts[i]), 'utf8'));
				}
			}
		}

		var template = Handlebars.compile(cnt);
		var temp = template();

		for (var i in partialsToUnregister) {
			Handlebars.unregisterPartial(partialsToUnregister[i]);
		}
		return temp;
	}
};
