var ujs = require("uglify-js");
var ccss = require('clean-css');
var sass = require('node-sass');

var fs = require('fs');
var path = require('path');
var utils = require('../utils/utils');
var system = require('../utils/system');


var supportedTypes = {
  scripts: {
    javascript: true,
    js: true,
    ts: true,
    typescript: true
  },
  styles: {
    sass: true,
    css: true
  }
}

function BundleCollection() {
  this.bundles = {}

  this.add = function(type, key) {
    if (!supportedTypes[type])
      system.exitWithMessage('Type: ' + type + ' is not supported!');

    var bundle = new Bundle(type, key);

    if (!this.bundles[type])
      this.bundles[type] = {};

    this.bundles[type][key] = bundle;

    return bundle;
  }
}

function Bundle(type, key) {
  this.files = [];
  this.type = type;
  this.key = key;
  this.include = function(type, src) {
    if (!type)
      type = 'js';

    this.files.push({
      type: type,
      src: src
    });

    return this;
  }
}


var collection = new BundleCollection();

var bundleRegex = {
  scripts: function() {
    return /<script[\s\S]*?src=['"](~[^"'<>]+)["']/g;
  },
  styles: function() {
    return /<link[\s\S]*?href=['"](~[^"'<>]+)["']/g;
  }
};

function defineReference(type, htmlDestDir, tag, destRef, wp, simplyCopy) {
  if (simplyCopy) {

  } else {
    var absDestRef = wp.vp.resolveDest(destRef);
    var relPath = path.relative(htmlDestDir, wp.vp.resolveDest(destRef))
    var ret;
    if (path.isAbsolute(relPath)) { //cannot be replace by a relative path
      ret = '/' + wp.vp.trim(destRef);
    } else { //can be replace by a relative path
      ret = relPath;
    }

    var ref = ret.replace(/\\/g, '/');

    return tag.replace(destRef, ref)
  }
}

function generateUniquePathInDir(prefix, fileName, dir) {
  var generated = path.join(dir, fileName);
  if (!utils.fileExists(generated)) {
    return generated;
  }

  generated = path.join(dir, prefix + '.' + fileName);

  if (!utils.fileExists(generated)) {
    return generated;
  }

  var counter = 0;

  while (utils.fileExists(generated)) {
    generated = generated + '_' + counter;
  }

  return generated;
}

var renderes = {
  scripts: function(files, key, wp, isDebug) {
    var pureScriptsFiles = [];
    var destCode = wp.vp.resolveDest(key);

    for (var i in files) {
      var file = files[i];
      var src = wp.vp.resolveSrc(file.src);

      switch (file.type) {
        case 'javascript':
        case 'js':
          if (isDebug) {
            var generatedPath = generateUniquePathInDir(
              utils.changeFileExt(path.basename(destCode), ''),
              path.basename(file.src),
              path.dirname(destCode)
            );

            utils.safeWriteFile(generatedPath, fs.readFileSync(src).toString());
          } else {
            pureScriptsFiles.push(src);
          }
          break;
      }
    }

    if (!isDebug)
      utils.safeWriteFile(destCode, ujs.minify(pureScriptsFiles).code);
  },
  styles: function(files, key, wp, isDebug) {
    var pureStylesFiles = [];
    var tmpFile;
    var destCode = wp.vp.resolveDest(key);

    for (var i in files) {
      var file = files[i];
      var src = wp.vp.resolveSrc(file.src);

      switch (file.type) {
        case 'css':
          if (isDebug) {
            var generatedPath = generateUniquePathInDir(
              utils.changeFileExt(path.basename(destCode), ''),
              path.basename(file.src),
              path.dirname(destCode)
            );

            utils.safeWriteFile(generatedPath, fs.readFileSync(src).toString());
          } else {
            pureStylesFiles.push(wp.vp.resolveSrc(file.src));
          }

          break;
        case 'sass':
          var sassRes = sass.renderSync({
            file: wp.vp.resolveSrc(file.src)
          });

          if (isDebug) {
            var generatedPath = generateUniquePathInDir(
              utils.changeFileExt(path.basename(destCode), ''),
              path.basename(file.src),
              path.dirname(destCode)
            );

            utils.safeWriteFile(generatedPath, sassRes.css);
          } else {
            tmpFile = wp.tp.write(sassRes.css);
            pureStylesFiles.push(tmpFile);
          }
          break;
      }
    }

    if (!isDebug) {
      var result = new ccss().minify(utils.concatFiles(pureStylesFiles)).styles;
      utils.safeWriteFile(destCode, result);
    }

  }
};

function checkBundleAndGetFiles(type, key) {
  var notFoundMessage = 'Bundle ' + key + ' type: ' + type + ' not found!';
  var col = collection.bundles[type];

  if (!col || !col[key])
    system.exitWithMessage(notFoundMessage);

  return col[key];
}


function renderBundle(type, key, wp, isDebug) {
  var bundle = checkBundleAndGetFiles(type, key);
  renderes[type](bundle.files, key, wp, isDebug);
}

var bundleApi = {
  parse: function(content, options, wp, htmlDest) {
    var opt = {};
    utils.mergeObjects(opt, options);

    var obj;
    var vSrc = wp.vp.vSrc();
    var vDest = wp.vp.vDest();
    var pageOptions;
    var tasks = {};

    var match;
    var toReplace = [];
    var htmlDestDir = path.dirname(htmlDest);
    var isDebug = opt.debug || false;

    for (var i in bundleRegex) {
      var regex = bundleRegex[i]();
      while ((match = regex.exec(content))) {
        renderBundle(i, match[1], wp, isDebug);
        var newRef = defineReference(i, htmlDestDir, match[0], match[1], wp, isDebug);

        toReplace.push({
          old: match[0],
          new: newRef
        });
      }
    }

    for (var i in toReplace) {
      content = content.replace(toReplace[i].old, toReplace[i].new);
    }

    return content;
  },
  bundles: function() {
    return collection;
  }

};

module.exports = bundleApi;
