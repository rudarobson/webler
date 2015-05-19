var fs = require('fs');
var path = require('path');
var loader = require('./parser');
var glob = require('glob-expand');
var utils = require('../../../../lib/utils/utils');

function isIgnored($tag, options, remove) {

  var attribs = $tag[0].attribs;
  for (var i in attribs) {
    if (i == options.ignoreAttribute) {
      if(remove)
        delete attribs[i];
      return true;
    }
  }
  return false;
}

function _registerTemplate(name, path, options, templates) {
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

function _loadTemplate(name, options, templates) {
  if (templates[name]) {
    if (!templates[name].cnt) {
      var newPath = path.join(templates[name].path + options.componentsExt);
      templates[name].cnt = fs.readFileSync(newPath).toString();
    }

    return templates[name];
  } else {
    var message = 'Tag ' + name + ' not found!';
    //do not remove this log
    console.log(message);
    throw message;
  }
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

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

function _parseTagWithContent(currentSrcPath, template, cnt, options, templates, $) {
  var $template = loader(template);
  var $tag = loader(cnt);

  var tagAttrs = $tag.root().children().first()[0].attribs;
  var templateAttrs = $template.root().children().first()[0].attribs;

  _attrEngine(templateAttrs, tagAttrs, options.attrAction, options.attrs);

  var toRemove = [];
  $template('content').each(function() {
    var $this = $template(this);
    if (!isIgnored($this, options,true)) {
      toRemove.push($this);
      var content = this;
      var select = $this.attr('select');

      if (select) {
        $tag.root().children().first().children(select).each(function() {
          //$template(content).before($tag.html(this).trim());
          $this.before($tag.html(this).trim());
        }).remove();
      } else {
        $template(content).before($tag.root().children().first().html().trim());
        return false; //must break everything was placed inside content
      }
    }
  });

  for (var i in toRemove)
    toRemove[i].remove();
  //$template('content').remove();
  var html = $template.html();

  return _parse(currentSrcPath, html, options, templates);
}



function _parseConfiguraion(currentSrcPath, src, options, templates) {
  var configRegex = /<!--\s*components:([\w\W]*?)-->\t*(?:\r?\n)?/i;

  var cntMatch = configRegex.exec(src);
  var newSrc;
  if (cntMatch) {
    var cnt = cntMatch[1];
    var imports = /#?import\s*([^\s]+)(?:\s*as\s*([^\s]+))?\s*;/ig;
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
      var dir;
      if (match[0][0] == '#') {
        dir = path.join(path.dirname(currentSrcPath), cmpPath);
      } else {
        dir = path.join(options.componentsPath, cmpPath);

      }
      try {
        isDirectory = fs.lstatSync(dir).isDirectory();
      } catch (e) {

      }

      if (isDirectory) {
        var files = glob({
          cwd: dir
        }, ['**/*' + options.componentsExt]);

        for (var i in files) {
          var pathWithoutExt = files[i].slice(0, -(options.componentsExt.length)); //trim extension
          var newAlias = path.basename(pathWithoutExt);
          _validateTagNameAnThrow(newAlias, options);

          _registerTemplate(newAlias, path.join(dir, pathWithoutExt), options, templates);
        }
      } else {
        _validateTagNameAnThrow(alias, options);
        _registerTemplate(alias, dir, options, templates);
      }
    }
    newSrc = src.replace(cntMatch[0], '');
  } else
    newSrc = src;


  return newSrc
}


function _parse(currentSrcPath, rawCnt, options, templates) {
  var cnt = _parseConfiguraion(currentSrcPath, rawCnt, options, templates);

  var reg = /<(\w+(?:-\w+)+)[^>]*?>/g;
  var match = reg.exec(cnt);

  if (match) {
    var $ = loader(cnt);

    var allHyphenTags = match[1];

    while (match = reg.exec(cnt))
      allHyphenTags += ',' + match[1];

    var toReplace = [];

    $(allHyphenTags).each(function() {
      var tagName = this.tagName;
      var $this = $(this);

      if (!isIgnored($this, options,true)) {
        var template = _loadTemplate(tagName, options, templates);
        var newElt = _parseTagWithContent(template.path, template.cnt, $.html($this), options, templates, $);
        toReplace.push([$this, $(newElt)]);
      }
    });

    for (var i in toReplace) {
      $(toReplace[i][0]).replaceWith(toReplace[i][1]);
    }
    cnt = $.html();
  }

  return cnt;
}




module.exports = {
  type: 'stream',
  config: {
    componentsPath: '~Components', //this is a required attribute, where to find components
    componentsExt: '.component',
    ignoreAttribute: 'components-ignore',
    attrAction: 'merge', //can be merge or replace
    attrs: {},
    stopOnNotFound: true,
    validateName: function(name) {
      return /^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(name);
    }
  },
  start: function(input, wManager) {
    var options = wManager.options;
    var cnt = wManager.convert(input, 'string');
    var opt = wManager.options;

    if (opt.componentsPath)
      opt.componentsPath = wManager.wp.vp.resolveSrc(opt.componentsPath);

    input.type = 'string';
    input.value = _parse(input.wFile.src, cnt, opt, {});
  }
};
