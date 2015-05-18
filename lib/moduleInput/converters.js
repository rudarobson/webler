var inputTypes = {};
var log = require('../utils/log');
var system = require('../utils/system');
var fs = require('fs');
var typeHandlers = {};
var utils = require('../utils/utils');

module.exports = {
  registerType: function(type, handler) {
    if (typeHandlers[type]) {
      log.error('error registering input type: ' + type + ' was already registered');
      system.exit(-1);
    }
    typeHandlers[type] = handler;
  },
  addConverterTo: function(fromType, toType, handler) {
    if (!typeHandlers[fromType]) {
      log.error('error adding converter: type ' + fromType + ' doesn\'t exist ');
      system.exit(-1);
    }
    typeHandlers[fromType].to[toType] = handler;
    typeHandlers[fromType].supported.push(toType);
  },
  getConverter: function(type) {
    return typeHandlers[type];
  }
}

module.exports.registerType('string', {
  string: function(value) {
    return value
  },
  file: function(value, opt) {
    utils.safeWriteFile(opt, value);
  },
  cheerio: function(html, options) {
    var opt = {
      xmlMode: false
    };
    for (var i in options)
      opt[i] = options[i];

    return cheerio.load(html, options)
  }
});

module.exports.registerType('file', {
  string: function(value) {
    return fs.readFileSync(value).toString();
  },
  file: function(value) {
    return file;
  },
  cheerio: function(file, options) {
    var html = fs.readFileSync(file).toString();
    var opt = {
      xmlMode: false
    };
    for (var i in options)
      opt[i] = options[i];

    return cheerio.load(html, options)
  }
});

module.exports.registerType('cheerio', {
  string: function($elt) {
    return $elt.html();
  },
  file: function(value) {
    return file;
  },
  cheerio: function($elt) {
    return $elt;
  }
});
