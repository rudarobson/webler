var exec = require('child_process').execFileSync;
var path = require('path');
var os = require('os');
var wfs = wRequire('wfs');

function changeFileExt(fileName, ext) {
  var curExt = path.extname(fileName);
  if (!curExt)
    return fileName;
  return fileName.substr(0, fileName.length - curExt.length) + ext;
}

export = {
  start: function(config:Webler.WeblePackageOptions) {
    var files: Webler.WFile[] = config.files;
    var destCwd: string = config.destCwd;
    var gOptions = config.gOptions;
    var options: RazorConfig = config.options;

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

    if (!options.appSrcRoot)
      throw 'appSrcRoot option missing in razor';

    var tmpDir = gOptions.tmpDir;

    var pages = [];
    var viewStarts = [];

    for (var i in files) {
      if (files[i].cwd() !== options.appSrcRoot) {
        console.log('Razor: file not in appSrcRoot Directory:' + files[i].fullPath())
      }
      var file = files[i];
      if (path.basename(file.src()) === '_ViewStart.cshtml') {
        viewStarts.unshift(i); //must be in reverse order
        continue;
      }
      var noExtName = changeFileExt(path.basename(file.src()), '');

      pages.push({
        source: file.fullPath(),
        originalSource: file.fullPath(),
        destination: path.join(destCwd, file.src()),
        model: noExtName + '.model.json',
        viewBag: noExtName + '.viewbag.json'
      });

      file.setCWD(destCwd);
    }

    while (viewStarts.length > 0) //view starts are in reverse order
      files.splice(viewStarts[0], 1); //remove _ViewStart.cshtml

    opt.pages = pages;

    var configFilePath = path.join(tmpDir, 'razor.config.json');

    wfs.safeWriteFile(configFilePath, JSON.stringify(opt));

    var exePath = path.join(path.dirname(require.resolve('./razor')), 'bin/WeblerRazor.exe');

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
