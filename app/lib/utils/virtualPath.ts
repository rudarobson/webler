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

  this.resolveSrc = function(p: string) {
    if ((<any>p)._vpResolvedSrc)
      return p;
    var ret = path.join('', p.replace(/([^~])?~/g, '$1' + vSrc).replace('~~', '~'));
    (<any>ret)._vpResolvedSrc = true;
    return ret;
  }

  this.unresolveSrc = function(p: string) {
    if ((<any>p)._vpUnresolvedSrc)
      return p;
    var ret = path.relative(vSrc, p);

    if (!/$(\.\.|\/|\\)/.test(ret)) {//same path
      ret = path.replace(vSrc, '~');//must be at the begining
      (<any>ret)._vpUnresolvedSrc = true;
      return ret;
    }
    return p;
  }

  this.resolveDest = function(p) {
    if ((<any>p)._vpResolvedDest)
      return p;
    var ret = path.join('', p.replace(/([^~])?~/g, '$1' + vDest).replace('~~', '~'));
    (<any>ret)._vpResolvedDest = true;
    return ret;
  }

  this.unresolveDest = function(p: string) {
    if ((<any>p)._vpUnresolvedDest)
      return p;
    var ret = path.relative(vDest, p);

    if (!/$(\.\.|\/|\\)/.test(ret)) {//same path
      ret = path.replace(vDest, '~');//must be at the begining
      (<any>ret)._vpUnresolvedDest = true;
      return ret;
    }
    return p;
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

export = function(vSrc, vDest): VPManager {
  return new VirtualPath(vSrc, vDest);
}
