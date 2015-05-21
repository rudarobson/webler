var fs = require('fs');
var path = require('path');
var loader = require('./parser');
var glob = require('glob-expand');
var parser = require('./parser');

function isIgnored($tag, options, remove) {
  var attribs = $tag.attribs;
  var attr = options.ignoreAttribute;

  if (!attr)
    return false;

  if (parser.hasAttr($tag, attr)) {
    if (remove)
      parser.deleteAttr($tag, attr);
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


function _parseConfiguraion(currentSrcPath, root, options, templates) {
  var configRegex = /<!--\s*components:([\w\W]*?)-->\t*(?:\r?\n)?/i;
  var comments = [];

  parser.filter(root, function(elt) {
    if (elt.type == 'comment') {
      comments.push(elt.data);
      parser.removeElement(elt);

      if (root == elt) //break top level is a comment
        return false;
    }
  });

  for (var i in comments) {
    var cnt = comments[i];
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
}

function _parseTagWithContent(currentSrcPath, template, $customElt, options, templates, root) {
  var $template = parser.parse(template)[0];
  if (!$template.attribs)
    $template.attribs = {};
  if (!$customElt.attribs)
    $customElt.attribs = {};

  var tagAttrs = $customElt.attribs;
  var templateAttrs = $template.attribs;

  _attrEngine(templateAttrs, tagAttrs, options.attrAction, options.attrs);

  var allPlacedInContentGenericTag = false;

  parser.forEachSel('content', $template, function(content) {
    if (!isIgnored(content, options)) {
      if (!allPlacedInContentGenericTag) {
        var select = parser.attr(content, 'select');
        if (select) {
          parser.filter($customElt, function(elt) {
            if (elt != $customElt && parser.is(select, elt)) {
              parser.removeElement(elt); //remove to place the reamaining content inside a generic content tag
              parser.insertBefore(content, elt); //this must be after remove
            }
          }, 1);
        } else {
          parser.placeAllChildrenBefore(content, $customElt);
          allPlacedInContentGenericTag = true; //must break everything was placed inside content
        }
      }
    }
    parser.removeElement(content); //remove content tag
  });
  return $template;
}

function _parse(currentSrcPath, root, options, templates, level) {
  _parseConfiguraion(currentSrcPath, root, options, templates);

  parser.filter(root, function(elt) {
    if (options.validateName(elt.name) && elt.type == 'tag') {
      if (root == elt) {
        throw 'Top level custom tag is not supported, must be a child of another tag';
      }
      var tagName = elt.name;

      if (!isIgnored(elt, options)) {
        var template = _loadTemplate(tagName, options, templates);

        var newElt = _parseTagWithContent(template.path, template.cnt, elt, options, templates);
        if (newElt.name == 'web-fluid-grid') {
          console.log(parser.serialize(newElt));
          throw '';
        }
        parser.insertBefore(elt, newElt);
        parser.removeElement(elt);
        _parse(template.path, newElt, options, templates, level + 1);
      }
    }
  });

  return root;
}

function _preParse(src, root, opt, templates) {
  for (var i in root) {
    root[i]._array = root; //top level elements
    _parse(src, root[i], opt, templates, 0);
    root[i]._array = undefined;;
  }
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
    var cnt = wManager.convert(input, 'string');
    var opt = wManager.options;

    if (opt.componentsPath)
      opt.componentsPath = wManager.wp.vp.resolveSrc(opt.componentsPath);

    input.type = 'string';
    var root = parser.parse(cnt);
    _preParse(input.wFile.src, root, opt, {});

    input.value = parser.serialize(root).trim();
  }
};
