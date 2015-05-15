var inputTypes = {};

var log = require('../utils/log');
var system = require('../utils/system');
var fs = require('fs');
var typeHandlers = {};

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
  dom: function(value) {
    throw 'must call cheerio';
  },
  file: function(value) {
    throw 'must writeFile';
  }
});

module.exports.registerType('dom', {
  string: function(value) {
    throw 'must return cheerio to string';
  },
  dom: function(value) {
    return value
  },
  file: function(value) {
    throw 'must writeFile';
  }
});


module.exports.registerType('file', {
  string: function(value) {
    return fs.readFileSync(value).toString();
  },
  dom: function(value) {
    throw 'must call cheerio'
  },
  file: function(value) {
    return file;
  }
});
