declare var wRequire;
declare var _wRequire;

if (!global.wRequire) {
  var path = require('path');
  var rootPath = path.join(require.resolve('webler'), '../../..');
  var basePath = '../../lib';

  var domBasePath = path.join(basePath, 'dom');
  var corePath = path.join(basePath, 'core');
  var utilsBasePath = path.join(basePath, 'utils');
  var moduleInputBasePath = path.join(basePath, 'moduleInput');

  var log = require('../utils/log');
  var system = require('../utils/system');
  global.wRequire = function(moduleName) {
    return require(wRequire.resolve(moduleName));
  }

  wRequire.resolve = function(moduleName) {
    if (!moduleName)
      return rootPath;
    switch (moduleName) {
      case 'globule':
        return require.resolve('globule');
      case 'webler':
        return path.join(corePath, 'webler');
      case 'dom':
        return path.join(domBasePath, 'dom');
      case '$':
        return path.join(domBasePath, 'domArray');
      case 'weblerscript':
        return path.join(corePath, 'weblerscript');
      case 'log':
        return path.join(utilsBasePath, 'log');
      default:
        log.error('No webler module: ' + moduleName);
        system.exit(-1);
    }
  }


  /* should only be used internally */
  global._wRequire = function(moduleName) {
    switch (moduleName) {
      case 'vp':
        return require(path.join(utilsBasePath, 'virtualPath'));
      case 'tp':
        return require(path.join(utilsBasePath, 'tempPath'));
      case 'utils':
        return require(path.join(utilsBasePath, 'utils'));
      case 'system':
        return require(path.join(utilsBasePath, 'system'));
      case 'converters':
        return require(path.join(moduleInputBasePath, 'converters'));
      case 'resource':
        return require(path.join(moduleInputBasePath, 'resource'));
      case 'package_manager':
        return require(path.join(corePath, 'package_manager'));
      default:
        throw 'No internal webler module: ' + moduleName;
    }
  }
}
