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

function addJavascriptImporter(srcCwd: string, bundler: Bundle.Bundler) {
  bundler.addScriptsFileSolver('javascript', function(pattern): Bundle.FileMapResult[] {
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

var defaultGOptions: Webler.GOptions = {
  tmpDir: '.webler',
  production: false,
  ignoreFiles: []
}

var bundler = wPackage('bundle');

var modules = {
  razor: wPackage('razor'),
  components: wPackage('components'),
  bundle: bundler,
  javascript: {
    start: function(config: Webler.WeblePackageOptions) {
      addJavascriptImporter(config.glob.cwd, bundler);
    }
  },
  css: {
    start: function(config: Webler.WeblePackageOptions) {
      addCssImporter(config.glob.cwd, bundler);
    }
  },
  sass: {
    start: function(config: Webler.WeblePackageOptions) {
      var files = config.glob.src;
      var cwd = config.glob.cwd;
      var destCwd = config.glob.dest;

      var sass = require('node-sass');
      addSassImporter(destCwd, bundler);

      var allF = globule.find(files, {
        cwd: cwd,
        filter: 'isFile'
      });

      for (var i in allF) {
        var file = allF[i];
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
    }
  }
}
var tmpDeleted = false;
export = {
  weble: function(config: Webler.WebleOptions) {

    var gOptions: Webler.GOptions = <any>{};

    for (var i in defaultGOptions)
      gOptions[i] = defaultGOptions[i];
    for (var i in config.options)
      gOptions[i] = config.options[i];

    if (!tmpDeleted) {
      tmpDeleted = true;
      deleteFolder(gOptions.tmpDir);
    }

    for (var m in config.modules) {

      var module = config.modules[m];

      if (!module.cwd)
        module.cwd = './';

      if (!module.destCwd) {
        console.log('destCwd not specified for module: ' + m)
        process.exit(-1);
        throw '';
      }
      var globs = [];
      if (Array.isArray(module.srcs)) {
        for (var i in module.srcs)
          globs.push(module.srcs[i]);
      } else
        globs.push(module.srcs);

      for (var i in gOptions.ignoreFiles)
        globs.push('!' + gOptions.ignoreFiles[i]);

      var allF = globule.find(globs, {
        cwd: module.cwd,
        filter: 'isFile'
      });

      var wFiles: Webler.WFile[] = [];

      for (var f in allF) {
        wFiles.push(Webler.wFile(module.cwd, allF[f]));
      }

      var lastTempFolder;
      var foldersToDelete = [];
      for (var j in module.packages) {
        var packageOptions = module.packages[j];
        var moduleName = j;


        console.log('Running ' + moduleName + '...');
        var folder = path.join(gOptions.tmpDir, j);
        foldersToDelete.push(folder);
        lastTempFolder = folder;

        modules[moduleName].start({
          files: wFiles,
          glob: {
            src: module.srcs,
            cwd: module.cwd,
            dest: module.destCwd
          },
          destCwd: folder,
          gOptions: gOptions,
          options: packageOptions
        });
      }

      allF = globule.find('**/*.*', {
        cwd: lastTempFolder,
        filter: 'isFile'
      });

      for (var k in allF) {
        wfs.safeWriteFile(path.join(module.destCwd, allF[k]), fs.readFileSync(path.join(lastTempFolder, allF[k])));
      }
    }
  }
}
