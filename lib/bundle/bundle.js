var ujs = require("uglify-js");

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
  scripts: /<script[\s\S]*?src=['"]([^"'<>]+)["']/g,
  styles: /<link[\s\S]*?href=['"]([^"'<>]+)["']/g
};

var renderes = {
  scripts: function(files, vp) {
    var pureScriptsFiles = [];

    for (var i in files) {
      var file = files[i];

      switch (file.type) {
        case 'javascript':
        case 'js':
          pureScriptsFiles.push(vp.resolveSrc(file.src));
          break;
      }
    }
    return ujs.minify(pureScriptsFiles).code;
  }
};

function checkBundleAndGetFiles(type, key) {
  var notFoundMessage = 'Bundle ' + key + ' type: ' + type + ' not found!';
  var col = collection.bundles[type];

  if (!col || !col[key])
    system.exitWithMessage(notFoundMessage);

  return col[key];
}


function renderBundle(type, key, vp) {
  var bundle = checkBundleAndGetFiles(type, key);
  var result = renderes[type](bundle.files, vp);

  utils.safeWriteFile(vp.resolveDest(bundle.key), result);
}

var bundleApi = {
  parse: function(content, opts, vp) {
    var obj;
    var vSrc = opts.vSrc;
    var vDest = opts.vDest;
    var pageOptions;
    var tasks = {};

    var match;
    for (var i in bundleRegex) {
      while ((match = bundleRegex[i].exec(content))) {
        renderBundle(i, match[1], vp);
      }
    }


    return content;
  },
  bundles: function() {
    return collection;
  }

};

module.exports = bundleApi;
