var package_json = require('../../packages/package.json');
var log = wRequire('log');
var system = _wRequire('system');
var path = require('path');

module.exports = {
  weble: function(userName, name) {
    var modules = package_json['weble'];

    if (!name) {
      name = userName;
      userName = undefined;
    }

    var loadPath;
    var moduleName;
    if (/^\.?\.?(\/|\\)/.test(userName)) { //relative
      if (!name) {
        log.error('Must supply name to local module');
        system.exit(-1);
      }

      loadPath = path.join(process.cwd(), userName);
    } else {
      if (!modules[name]) {
        log.error('module ' + name + ' not found');
        system.exit(-1);
      }
      if (!userName) {
        if (modules[name].length > 1) {
          return {
            multiple: true,
            module: undefined,
            fullName: undefined
          };
        }

        userName = modules[name][0];
      }

      loadPath = path.join('../../packages/weble', userName, name, 'main.js');
    }

    fullName = userName + ':' + name;
    log.normal('loading weble module: ' + fullName, 0).indent();

    var module = require(loadPath);

    if (!module.type) {
      log.error('module type wasn\'t provided');
      system.exit(-1);
    }

    if (module.type !== 'stream' && module.type !== 'bulk') {
      log.error('module type not supported: ' + module.type);
      system.exit(-1);
    }
    log.unindent();
    return {
      fullName: fullName,
      module: module,
      multiple: false
    }
  },
  init: function(userName, name) {

  }
}
