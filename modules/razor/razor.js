var exec = require('child_process').execFileSync;
var path = require('path');
var utils = require('../../utils/utils');
var system = require('../../utils/system');
var os = require('os');

module.exports = {
  config:function(){
    if (opt) {
      var toResolve = ['layoutsPath', 'modelsPath', 'viewBagsPath'];

      for (var i in toResolve) {
        if (opt[toResolve[i]]) {
          opt[toResolve[i]] = wp.vp.resolveSrc(opt[toResolve[i]]);
        }
      }
    }
  },
  start: function(files, options, wp) {
    var tmpDir = wp.tp.dir();

    var opt = {};
    if (options)
      utils.mergeObjects(opt, options);

    var pages = [];
    var destPaths = [];
    for (var i in files) {

      var file = files[i];
      if (path.basename(file.src) === '_ViewStart.cshtml')
        continue;

      var noExtName = utils.changeFileExt(path.basename(file.src), '');


      pages.push({
        source: file.src,
        destination: file.dest,
        model: noExtName + '.model.json',
        viewBag: noExtName + '.viewbag.json'
      });

      destPaths.push({
        src: file.dest,
        dest: file.dest
      });
    }

    opt.pages = pages;
    opt.appSrcRoot = wp.vp.vSrc();
    var configFilePath = path.join(tmpDir, 'config.json');

    utils.safeWriteFile(configFilePath, JSON.stringify(opt));


    var rootPackagePath = path.dirname(require.resolve('webler')) //bin folder
    var exePath = path.join(rootPackagePath, '../lib/razor/bin/WeblerRazor.exe');

    var cmd;
    var args;

    if (/^[wW]in/.test(os.type())) {
      cmd = exePath;
      args = [configFilePath]
    } else {
      cmd = 'mono';
      args = [exePath, configFilePath];
    }

    try {
      exec(cmd, args);
    } catch (ex) {
      console.log(ex.stdout.toString());
      system.exit(1);
    }
    return destPaths;
  },
  cleanUp:function(){

  }
};
