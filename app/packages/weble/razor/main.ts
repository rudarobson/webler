var exec = require('child_process').execFileSync;
var path = require('path');
var os = require('os');
var fs = require('fs');

function changeFileExt(fileName, ext) {
  var curExt = path.extname(fileName);
  if (!curExt)
    return fileName;
  return fileName.substr(0, fileName.length - curExt.length) + ext;
}

export = {
  start: function(files, options: RazorConfig) {
    var defaultOptions = {
      layoutsPath: 'layouts',
      modelsPath: 'models',
      viewBagsPath: 'viewbags'
    };

    var opt: RazorConfig = <any>defaultOptions;

    if (!options)
      options = <any>{};

    for (var i in options) {
      opt[i] = options[i];
    }
    if (opt.tmpDir) {
      opt.tmpDir = '';
      delete opt.tmpDir;
    }
    if (!options.appSrcRoot)
      throw 'appSrcRoot option missing in razor';
    if (!options.tmpDir)
      throw 'tmpDir missing in razor';

    var tmpDir = options.tmpDir;

    var pages = [];
    var viewStarts = [];

    for (var i in files) {
      var file = files[i];
      if (path.basename(file.src) === '_ViewStart.cshtml') {
        viewStarts.unshift(i); //must be in reverse order
        continue;
      }
      var noExtName = changeFileExt(path.basename(file.src), '');

      pages.push({
        source: file.src,
        originalSource: file.src,
        destination: file.dest,
        model: noExtName + '.model.json',
        viewBag: noExtName + '.viewbag.json'
      });
    }

    while (viewStarts.length > 0) //view starts are in reverse order
      files.splice(viewStarts[0], 1); //remove _ViewStart.cshtml

    opt.pages = pages;

    var configFilePath = path.join(tmpDir, 'razor.config.json');

    fs.writeFileSync(configFilePath, JSON.stringify(opt));

    var exePath = path.join(path.dirname(require.resolve('./main')), 'bin/WeblerRazor.exe');

    var cmd;
    var args;
    if (/^[wW]in/.test(os.type())) {
      cmd = exePath;
      args = [configFilePath];
    } else {
      cmd = 'mono';
      args = [exePath, configFilePath];
    }

    try {
      exec(cmd, args);
    } catch (ex) {
      try {
        console.log(ex.stdout.toString());
      } catch (ex2) {
        console.log(ex);
      }
      process.exit(-1);
    }
  }
};
