var system = require('./system.js');
var path = require('path');

function VirtualPath(vSrc, vDest) {

  if (!vSrc)
    system.exitWithMessage(system.msg.nullArgumentException('Source virtual path cannot ben null'));

  if (!vDest)
    system.exitWithMessage(system.msg.nullArgumentException('Destination virtual path cannot ben null'));

  this.vSrc = function() {
    return vSrc;
  }

  this.vDest = function() {
    return vDest;
  }

  this.resolveSrc = function(p) {
    return path.join('', p.replace(/([^~])?~/g, '$1' + vSrc));
  }

  this.resolveDest = function(p) {
    return path.join('', p.replace(/([^~])?~/g, '$1' + vDest));
  }

  this.trim = function(p) {
    var res = p;
    if (p[0] == '~') {
      if (p[1] == '/' || p[1] == '\\')
        res = p.substr(2);
      else
        res = p.substr(1);
    }

    return res;
  }
}

module.exports = function(vSrc, vDest) {
  return new VirtualPath(vSrc, vDest);
}
