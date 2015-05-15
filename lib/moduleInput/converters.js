var inputTypes = {};

var log = require('../utils/log');
var system = require('../utils/system');

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
    if (!typeHandlers[type]) {
      log.error('error adding converter: type ' + type + ' doesn\'t exist ');
      system.exit(-1);
    }
  },
  getConverter: function(type) {
    return typeHandlers[type];
  }
}

module.exports.registerType('string', {
  toString: function(content) {
    return content;
  },
  toDom: function(content) {
    throw 'must call cheerio';
  },
  toFile: function(content) {
    throw 'must writeFile';
  }
});

module.exports.registerType('dom', {
  toString: function(content) {
    throw 'must return cheerio to string';
  },
  toDom: function(content) {
    return content;
  },
  toFile: function(content) {
    throw 'must writeFile';
  }
});

module.exports.registerType('file', {
  toString: function(content) {
    return fs.readFileSync(content);
  },
  toDom: function(content) {
    throw 'must call cheerio';
    return fs.readFileSync(content);
    return content;
  },
  toFile: function(content) {
    return content;
  }
})
