var utils = require('./utils.js')
var path = require('path');

function TemporaryPath(temp) {
  var count = 0;

  this.dir = function() {
    return temp;
  };

  this.write = function(content) {
    var fileName = 'tempFile' + count++;
    var fullPath = path.join(temp, 'tempFile' + count++);

    utils.safeWriteFile(fullPath,content);

    return fullPath;
  }
}

module.exports = function(temp) {
  return new TemporaryPath(temp);
}
