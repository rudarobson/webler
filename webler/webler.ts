require('./app/core/bootstrap');
var globule = wRequire('globule');
var path = require('path');
var fs = require('fs');
var wfs = wRequire('wfs');

interface Webled {
  files: Webler.WFile[];
  pipeline: (files: Webler.WFile[]) => any;
}

var webled: Webled[] = [];
var bundler = wPackage('bundle');

function deleteFolder(folder) {
  var files = [];
  if (fs.existsSync(folder)) {
    files = fs.readdirSync(folder);

    files.forEach(function(file, index) {
      var curFolder = path.join(folder, file);
      if (fs.lstatSync(curFolder).isDirectory()) { // recurse
        deleteFolder(curFolder);
      } else { // delete file
        fs.unlinkSync(curFolder);
      }
    });

    fs.rmdirSync(folder);
  }
}

function addCssImporter(srcCwd: string, bundler: Bundle.Bundler) {

  bundler.addStylesFileSolver('css', function(pattern): Bundle.FileMapResult[] {
    var files = globule.find(pattern, {
      cwd: srcCwd,
      filter: 'isFile'
    });

    var res: Bundle.FileMapResult[] = [];
    for (var i in files) {
      res.push({
        map: undefined,
        result: Webler.wFile(srcCwd, files[i])
      })
    }
    return res;
  });
}

function addSassImporter(cwd: string, bundler: Bundle.Bundler) {

  bundler.addStylesFileSolver('sass', function(pattern): Bundle.FileMapResult[] {
    var files = globule.find(pattern, {
      cwd: cwd,
      filter: 'isFile'
    });

    var res: Bundle.FileMapResult[] = [];

    for (var i in files) {
      res.push({
        map: Webler.wFile(cwd, files[i].replace('.scss', '.css') + '.map'),
        result: Webler.wFile(cwd, files[i].replace('.scss', '.css'))
      });
    }
    return res;
  });
}

export = {
  css: function(pattern: string[], cwd: string) {
    addCssImporter(cwd, bundler);
  },
  sass: function(pattern: string[], cwd: string, destCwd: string) {
    var sass = require('node-sass');
    addSassImporter(destCwd, bundler);

    var files = globule.find(pattern, {
      cwd: cwd,
      filter: 'isFile'
    });

    for (var i in files) {
      var file = files[i];
      var render = sass.renderSync({
        file: path.join(cwd, file),
        outFile: path.join(destCwd, file),
        sourceMap: true
      });

      var destFile = path.join(destCwd, file).replace('.scss', '.css');
      wfs.safeWriteFile(path.join(destCwd, file), fs.readFileSync(path.join(cwd, file)));//copy source file
      wfs.safeWriteFile(destFile, render.css);
      wfs.safeWriteFile(destFile + '.map', render.map);
    }
  },
  html: function(pattern: string[], cwd: string, destCwd: string, tmpDir: string = '.tmp', isProduction: boolean = false) {
    var weble: Webled = <any>{};

    var files = globule.find(pattern, {
      cwd: cwd,
      filter: 'isFile'
    });
    var wFiles: Webler.WFile[] = [];

    for (var i in files) {
      wFiles.push(Webler.wFile(cwd, files[i]));
    }

    wPackage('razor').start(wFiles, path.join(tmpDir, 'razor'), {
      appSrcRoot: cwd,
      tmpDir: tmpDir
    });

    for (var i in wFiles) {
      wPackage('components').start(wFiles[i], path.join(tmpDir, 'components'), {
        componentsPath: path.join(cwd, '_webler/components')
      });
    }

    deleteFolder(path.join(tmpDir, 'razor'));

    for (var i in wFiles) {
      bundler.start(wFiles[i], destCwd, {
        isProduction: isProduction
      });
    }

    deleteFolder(path.join(tmpDir, 'components'));
  }

}
