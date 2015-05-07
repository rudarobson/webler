var exec = require('child_process').execFileSync;
var path = require('path');
var utils = require('../utils/utils');
module.exports = {
  parse: function(files, options, tmpDir) {
    var opt = {};
    if (options)
      utils.mergeObjects(opt, options);

    var pages = [];
    var destPaths = [];
    for (var i in files) {

      var file = files[i];

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
    var configFilePath = path.join(tmpDir, 'config.json');

    utils.safeWriteFile(configFilePath, JSON.stringify(opt));


    var rootPackagePath = path.resolve(require.resolve('glob'), '../../..');
    var exePath = path.join(rootPackagePath, 'lib/razor/bin/NodeRazor.exe');

    var cmd = exePath;


    var args = [configFilePath];

    exec(cmd, args).toString();

    return destPaths;
  }
};
