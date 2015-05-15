var utils = require('./utils.js')
var path = require('path');

var globalCount = 0;

function TemporaryPath(temp) {
  var count = 0;
  var curGlobalCount = globalCount++;
  
  this.dir = function() {
    return temp;
  };

  this.write = function(content) {
    var fullPath = this.generatePath();

    utils.safeWriteFile(fullPath, content);

    return fullPath;
  }

  this.generateName = function() {
    return 'tempFile_' + curGlobalCount + '_' + count++;
  }

  this.generatePath = function() {
    return path.join(temp, this.generateName());
  }
}

module.exports = function(temp) {
  return new TemporaryPath(temp);
}
