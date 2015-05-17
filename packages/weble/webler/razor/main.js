var exec = require('child_process').execFileSync;
var path = require('path');
var utils = require('../../../../lib/utils/utils');
var system = require('../../../../lib/utils/system');
var os = require('os');



module.exports = {
  type: 'bulk',
  config: {
    layoutsPath: '~layouts',
    modelsPath: '~models',
    viewBagsPath: '~viewbags',
  },
  start: function(input, wManager) {
    var wp = wManager.wp;

    var opt = wManager.options;

    var toResolve = ['layoutsPath', 'modelsPath', 'viewBagsPath'];

    for (var i in toResolve) {
      if (opt[toResolve[i]]) {
        opt[toResolve[i]] = wp.vp.resolveSrc(opt[toResolve[i]]);
      }
    }


    var pages = [];


    for (var i in input) {

      var file = input[i];
      if (path.basename(file.value) === '_ViewStart.cshtml')
        continue;

      var noExtName = utils.changeFileExt(path.basename(file.value), '');
      var fName = wp.tp.generatePath();

      pages.push({
        source: file.value,
        originalSource: file.wFile.src,
        destination: fName,
        model: noExtName + '.model.json',
        viewBag: noExtName + '.viewbag.json'
      });

      input[i].value = fName;
    }

    opt.pages = pages;
    opt.appSrcRoot = wp.vp.vSrc();

    var configFilePath = wp.tp.write(JSON.stringify(opt));

    var rootPackagePath = path.dirname(require.resolve('webler')) //bin folder
    var exePath = path.join(rootPackagePath, '../packages/weble/webler/razor/bin/WeblerRazor.exe');

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
  }
};
