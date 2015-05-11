var ujs = require("uglify-js");
var ccss = require('clean-css');
var sass = require('node-sass');

var fs = require('fs');
var path = require('path');
var utils = require('../utils/utils');
var system = require('../utils/system');


var contexts = {};

var gruntTargets = {};

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

function defineReference(type, htmlDest, destRef, wp) {
  var absDestRef = wp.vp.resolveDest(destRef);
  var htmlDestDir = path.dirname(htmlDest);
  var relPath = path.relative(htmlDestDir, wp.vp.resolveDest(destRef))
  var ret;
  if (path.isAbsolute(relPath)) { //cannot be replace by a relative path
    ret = '/' + wp.vp.trim(destRef);
  } else { //can be replace by a relative path
    ret = relPath;
  }

  return ret.replace(/\\/g, '/');
}
var renderes = {
  scripts: function(files, wp) {
    var pureScriptsFiles = [];

    for (var i in files) {
      var file = files[i];

      switch (file.type) {
        case 'javascript':
        case 'js':
          pureScriptsFiles.push(wp.vp.resolveSrc(file.src));
          break;
      }
    }
    return ujs.minify(pureScriptsFiles).code;
  },
  styles: function(files, wp) {
    var pureStylesFiles = [];
    var tmpFile;

    for (var i in files) {
      var file = files[i];

      switch (file.type) {
        case 'css':
          pureStylesFiles.push(wp.vp.resolveSrc(file.src));
          break;
        case 'sass':
          var sassRes = sass.renderSync({
            file: wp.vp.resolveSrc(file.src)
          });
          tmpFile = wp.tp.write(sassRes.css);


          pureStylesFiles.push(tmpFile);
          break;
      }
    }

    return new ccss().minify(utils.concatFiles(pureStylesFiles)).styles;
  },
};

function checkBundleAndGetFiles(type, key) {
  var notFoundMessage = 'Bundle ' + key + ' type: ' + type + ' not found!';
  var col = collection.bundles[type];

  if (!col || !col[key])
    system.exitWithMessage(notFoundMessage);

  return col[key];
}


function renderBundle(type, key, wp) {
  var bundle = checkBundleAndGetFiles(type, key);
  var result = renderes[type](bundle.files, wp);

  utils.safeWriteFile(wp.vp.resolveDest(bundle.key), result);
}

var bundleApi = {
  parse: function(content, wp, htmlDest) {
    var obj;
    var vSrc = wp.vp.vSrc();
    var vDest = wp.vp.vDest();
    var pageOptions;
    var tasks = {};

    var match;
    var toReplace = [];
    for (var i in bundleRegex) {
      var regex = bundleRegex[i]();
      while ((match = regex.exec(content))) {
        renderBundle(i, match[1], wp);
        var newRef = defineReference(i, htmlDest, match[1], wp);

        toReplace.push({
          old: match[0],
          new: match[0].replace(match[1], newRef)
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
