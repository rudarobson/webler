var system = require('./system.js');
var path = require('path');

enum VPState {
  resolved = 0,
  unresolved = 1
};

function VirtualPath(p: string, vSrc, vDest) {
  var _srcstate: VPState = VPState.unresolved;
  var _deststate: VPState = VPState.unresolved;
  var _src = p;
  var _dest = p;

  this.vSrc = function() {
    return vSrc;
  }

  this.vDest = function() {
    return vDest;
  }

  this.resolveSrc = function() {
    if (_srcstate == VPState.resolved)
      return _src;

    var ret = path.join('', _src.replace(/([^~])?~/g, '$1' + vSrc).replace('~~', '~'));
    _srcstate = VPState.resolved;
    _src = ret;

    return _src;
  }

  this.unresolveSrc = function() {
    if (_srcstate == VPState.unresolved)
      return _src;

    var ret = path.relative(vSrc, _src);

    if (!/$(\.\.|\/|\\)/.test(ret)) {//same path
      ret = path.replace(vSrc, '~');//must be at the begining
      _src = ret;
    }

    return _src;
  }

  this.resolveDest = function() {
    if (_deststate == VPState.resolved)
      return _dest;
    var ret = path.join('', _dest.replace(/([^~])?~/g, '$1' + vDest).replace('~~', '~'));
    _dest = ret;
  }

  this.unresolveDest = function(p) {
    if ((<any>p)._vpUnresolvedDest)
      return _dest;
    var ret = path.relative(vDest, _dest);

    if (!/$(\.\.|\/|\\)/.test(ret)) {//same path
      ret = path.replace(vDest, '~');//must be at the begining
      (<any>ret)._vpUnresolvedDest = true;
      return ret;
    }
    return _dest;
  }
}

function VirtualPathCreator(vSrc, vDest) {

  if (!vSrc)
    system.exitWithMessage(system.msg.nullArgumentException('Source virtual path cannot ben null'));

  if (!vDest)
    system.exitWithMessage(system.msg.nullArgumentException('Destination virtual path cannot ben null'));

  this.create = function(p) {
    return new VirtualPath(p, vSrc, vDest);
  }
}

export = function(vSrc, vDest): Webler.VirtualPath {
  return new VirtualPathCreator(vSrc, vDest);
}
