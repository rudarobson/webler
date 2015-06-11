if (!global.wRequire) {
  var path = require('path');
  var wPath;

  function WFile(cwd: string, src: string) {
    this.src = function() {
      return src;
    }
    this.cwd = function() {
      return cwd;
    }
    this.setCWD = function(val: string) {
      cwd = val;
    }
    this.fullPath = function() {
      return path.join(cwd, src);
    }
  }

  function configPath(src, dest) {
    wPath = {
      relative: function(from, to) {
        return path.relative(from, to);
      },
      processCwd: function(rel) {
        var ret = process.cwd();
        if (rel)
          ret = path.relative(ret, rel);
        return ret;
      },
      src: function(rel) {
        var ret = src;
        if (rel)
          ret = path.relative(ret, rel);
        return ret;
      },
      dest: function(rel) {
        var ret = dest;
        if (rel)
          ret = path.relative(ret, rel);
        return ret;
      }
    }

    Webler.wpath = wPath;
  }

  global.wPackage = function(name) {
    switch (name) {
      case 'razor':
        return require('../packages/razor/razor');
      case 'components':
        return require('../packages/components/components');
      case 'bundle':
        return require('../packages/bundle/bundle');
    }
  };

  global.wRequire = function(mod) {
    switch (mod) {
      case 'sourcemap':
        return require('./utils/sourcemap');
      case 'wpath':
        if (!wPath)
          throw 'wPath path not configured';
        return wPath;
      case 'wfs':
        return require('./utils/wfs');
      case '$':
        return require('./dom/domArray');
      case 'globule':
        return require('globule');
    }
  }

  global.Webler = {
    require: wRequire,
    package: wPackage,
    wpath: undefined,
    configPath: configPath,
    wFile: function(cwd: string, route: string): Webler.WFile {
      return new WFile(cwd, route);
    }
  };
}
