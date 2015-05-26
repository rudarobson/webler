var fs = require('fs');
var path = require('path');
var loader = require('./parser');
var glob = require('glob-expand');
var parser = require('./parser');

function isIgnored($tag, options) {
  var attr = options.ignoreAttribute;

  if (attr && $tag.hasAttribute(attr)) {
    $tag.removeAttribute(attr);
    return true;
  }

  return false;
}

function _registerTemplate(from, name, path, options, templates) {
  if (templates[name] && templates[name].path != path) {
    console.log('');
    console.log('Error while processing: ' + from);
    var message = 'Tag ' + name + ' already registered at source file:\n\t' + templates[name].from + '\nwith a different path\nregistered: ' + templates[name].path + '\ntrying to register: ' + path;
    console.log(message);
    if (options.stopOnNotFound) //stop if must parse all tags
      throw message;
  }

  templates[name] = {
    from: from,
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
    console.log(message);
    throw message;
  }
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function _attrEngine($template, $tag, action, attrs) {
  if (!attrs)
    attrs = {};

  for (var i in $tag[0].attributes) {

    action = attrs[i] || action;

    var newValue = $tag.first().attr(i);
    var templateValue = $template.first().attr(i);

    if (action == 'merge') { //specific attribute to merge instead of replace
      if (templateValue) {
        if (newValue)
          newValue = templateValue + ' ' + newValue;
        else
          newValue = templateValue;
      }
    }

    $template.attr(i, newValue);
  }
}


function _parseConfiguraion(currentSrcPath, markupType, $root, options, templates) {
  var configRegex = /<!--\s*components:([\w\W]*?)-->\t*(?:\r?\n)?/i;
  var comments = [];
  $root[0].visit(function() {
    if (this.type == markupType.comment) {
      var serialize = this.serialize();
      var commentMatch = configRegex.exec(serialize);
      if (commentMatch) {
        var cnt = commentMatch[1];
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

              _registerTemplate(currentSrcPath, newAlias, path.join(dir, pathWithoutExt), options, templates);
            }
          } else {
            _validateTagNameAnThrow(alias, options);
            _registerTemplate(currentSrcPath, alias, dir, options, templates);
          }
        }
      }
      comments.push(this);
    }
  });

  for (var i in comments)
    comments[i].remove();
}

function _parseTagWithContent($, currentSrcPath, template, customElt, options, templates, root) {
  var $template = $($.parse(template).children[0]);

  var $customElt = $(customElt);
  _attrEngine($template, $customElt, options.attrAction, options.attrs);

  var $content = $template.filter('content');

  $content.each(function() {
    if (!isIgnored(this, options)) {
      var select = this.attr('select');

      if (select) {
        $customElt.children(select).insertBefore(this);
      } else {

        $customElt.contents().insertBefore(this);

        return false; //all elements placed stop
      }
    }
  }).remove();

  return $template;
}

function _parse($, currentSrcPath, markupType, $root, options, templates, level) {

  _parseConfiguraion(currentSrcPath, markupType, $root, options, templates);

  $root[0].visit(function() {
    if (this.type == markupType.element && options.validateName(this.tagName) && !isIgnored(this, options)) {

      var tagName = this.tagName;
      var template = _loadTemplate(tagName, options, templates);


      var $newElt = _parseTagWithContent($, template.path, template.cnt, this, options, templates);

      this.insertBefore($newElt[0]);
      this.remove();

      _parse($, template.path, markupType, $newElt, options, templates, level + 1);

      return this.visit.skipChildren;
    }
  });
}

module.exports = {
  type: 'stream',
  config: {
    componentsPath: '~components', //this is a required attribute, where to find components
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
    //var cnt = wManager.convert(input, 'string');

    var opt = wManager.options;

    if (opt.componentsPath)
      opt.componentsPath = wManager.wp.vp.resolveSrc(opt.componentsPath);

    //input.type = 'string';
    var $ = wManager.dom.$;
    var markupType = wManager.dom.markupType;
    var document = wManager.convert(input, 'dom');

    _parse($, input.wFile.src, markupType, $(document), opt, {});

    input.value = document;
    input.type = 'dom';
  }
};
