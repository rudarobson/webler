var fs = require('fs');
var path = require('path');
var loader = require('./parser');
var glob = require('glob');
var utils = require('../utils/utils');
var defaults = {
	componentsPath: null, //this is a required attribute, where to find components
	componentsExt: '.html',
	attrAction: 'merge', //can be merge or replace
	attrs: {},
	stopOnNotFound: true,
	validateName: function(name) {
		return /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(name);
	}
};

var templates = {};

function _registerTemplate(name, path, options) {
	if (templates[name] && templates[name].path != path) {
		var message = 'Tag already registered with a different path\nregistered: ' + templates[name].path + '\ntrying to register: ' + path;
		console.log(message);
		if (options.stopOnNotFound) //stop if must parse all tags
			throw message;
	}

	templates[name] = {
		path: path,
		cnt: null
	};
}

function _validateTagNameAnThrow(alias, options) {
	if (!options.validateName(alias)) {
		var message = 'Invalid tag name: ' + alias;
		console.log(message);
		throw message;
	}
}

function _loadTemplate(name, options) {
	if (templates[name]) {
		if (!templates[name].cnt) {
			var newPath = path.join(options.componentsPath, templates[name].path + options.componentsExt);
			templates[name].cnt = fs.readFileSync(newPath).toString();
		}

		return templates[name].cnt;
	} else {
		var message = 'Tag ' + name + ' not found!';
		//do not remove this log
		console.log(message);
		throw message;
	}
}

function _parseConfiguraion(src, options) {
	var configRegex = /<!--\s*components:([\w\W]*?)-->\t*(?:\r?\n)?/i;

	var cntMatch = configRegex.exec(src);
	var newSrc;
	if (cntMatch) {
		var cnt = cntMatch[1];
		var imports = /import\s*([^\s]+)(?:\s*as\s*([^\s]+))?\s*;/ig;
		var match;
		while (match = imports.exec(cnt)) {
			var alias;
			var cmpPath;

			if (match[2]) {
				alias = match[2];
				cmpPath = match[1];
			} else {
				alias = path.basename(match[1]);
				cmpPath = match[1];
			}

			var isDirectory = false;
			var dir = path.join(options.componentsPath, cmpPath);
			try {
				isDirectory = fs.lstatSync(dir).isDirectory();
			} catch (e) {

			}

			if (isDirectory) {
				var files = glob.sync('**/*' + options.componentsExt, {
					cwd: options.componentsPath
				});

				for (var i in files) {
					var pathWithoutExt = files[i].slice(0, -(options.componentsExt.length)); //trim extension
					var newAlias = path.basename(pathWithoutExt);
					_validateTagNameAnThrow(newAlias, options);

					_registerTemplate(newAlias, pathWithoutExt, options);
				}
			} else {
				_validateTagNameAnThrow(alias, options);
				_registerTemplate(alias, cmpPath, options);
			}
		}
		newSrc = src.replace(cntMatch[0], '');
	} else
		newSrc = src;


	return newSrc
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/*function _attrEngine(mergeInto, additionalAttrs, action, attrsToMerge, attrsToReplace) {
	for (var i in additionalAttrs) {
		if (mergeInto[i]) {
			if (action == 'replace') {
				if (i in attrsToMerge) //specific attribute to merge instead of replace
					mergeInto[i] = mergeInto[i] + ' ' + additionalAttrs[i];
				else
					mergeInto[i] = additionalAttrs[i];
			} else if (action == 'merge') {
				if (i in attrsToReplace) //specific attribute to replace instead of merge
					mergeInto[i] = mergeInto[i];
				else
					mergeInto[i] = mergeInto[i] + ' ' + additionalAttrs[i];
			} else {
				throw 'Attribute action not recognized';
			}
		} else { //just add the attribute
			mergeInto[i] = additionalAttrs[i];
		}
	}
}*/

function _attrEngine(mergeInto, additionalAttrs, action, attrs) {
	if (!attrs)
		attrs = {};

	for (var i in additionalAttrs) {
		if (mergeInto[i]) {

			action = attrs[i] || action;

			if (action == 'merge') //specific attribute to merge instead of replace
				mergeInto[i] = mergeInto[i] + ' ' + additionalAttrs[i];
			else if (action == 'replace')
				mergeInto[i] = mergeInto[i] + ' ' + additionalAttrs[i];
			else
				throw 'Attribute action not recognized';

		} else { //just add the attribute
			mergeInto[i] = additionalAttrs[i];
		}
	}
}

function _parseTagWithContent(template, cnt, options) {
	var $template = loader(template);
	var $tag = loader(cnt);

	var tagAttrs = $tag.root().children().first()[0].attribs;
	var templateAttrs = $template.root().children().first()[0].attribs;

	_attrEngine(templateAttrs, tagAttrs, options.attrAction, options.attrs);

	$template('content').each(function() {
		var content = this;

		var select = $template(this).attr('select');

		if (select) {
			$tag.root().children().first().children(select).each(function() {
				$template(content).before($tag.html(this).trim());
			}).remove();
		} else {
			$template(content).before($tag.root().children().first().html().trim());
			return false; //must break everything was placed inside content
		}
	});

	$template('content').remove();
	var html = $template.html();

	return _parse(html, options);
}

function _parse(rawCnt, options) {
	var cnt = _parseConfiguraion(rawCnt, options);

	var reg = new RegExp('<(\\w+(?:-\\w+)+)[^>]*>', 'g');
	var match;

	var $ = loader(cnt);
	var allHyphenTags = '';
	match = reg.exec(cnt);

	if (match) {
		allHyphenTags = match[1];

		while (match = reg.exec(cnt))
			allHyphenTags += ',' + match[1];

		var toReplace = [];

		$(allHyphenTags).each(function() {
			var tagName = this.tagName;
			var $this = $(this);

			var newElt = _parseTagWithContent(_loadTemplate(tagName, options), $.html($this), options);
			toReplace.push([$this, $(newElt)]);
		})

		for (var i in toReplace) {
			$(toReplace[i][0]).replaceWith(toReplace[i][1]);
		}
		cnt = $.html();
	}

	return cnt;
}




module.exports = {
	parse: function(cnt, options) {
		templates = {}; //reset templates
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

		return _parse(cnt, opt);
	}
};
