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
    var res = p;
    if (p[0] == '~') {
      if (!vSrc)
        system.exitWithMessage('Virtual paths wren\'t configured');

      if (p[1] == '/' || p[1] == '\\')
        res = p.substr(2);
      else
        res = p.substr(1);
      res = path.join(vSrc, res);
    }
    return res;
  }

  this.resolveDest = function(p) {
    var res = p;
    if (p[0] == '~') {
      if (!vDest)
        system.exitWithMessage('Virtual paths weren\'t configured');

      if (p[1] == '/' || p[1] == '\\')
        res = p.substr(2);
      else
        res = p.substr(1);
      res = path.join(vDest, res)
    }

    return res;
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
