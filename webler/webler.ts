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
  copy: {
    start: function(config: Webler.WeblePackageOptions) {
      for (var i in config.files) {
        var file = config.files[i];
        config.additionalFiles.push(file);
      }
    }
  },
  domcopy: {
    start: function(config: Webler.WeblePackageOptions) {
      var $ = wRequire('$');

      for (var i in config.files) {

        var dom = $.parse(fs.readFileSync(config.files[i].fullPath()).toString());

        var comments = $.findComments(dom);
        var regex = /<!--\s*copy:\s*([\S]+)\s*([\S]+)?-->/;

        comments.each(function() {
          var match = regex.exec(this.content);

          if (match) {
            var from = match[1];
            var to = match[2] || from;
            wfs.safeWriteFile(path.join(config.destCwd, to), fs.readFileSync(path.join(config.glob.cwd, from)));
            config.additionalFiles.push(Webler.wFile(config.destCwd, to));
          }
          this.remove();
        })
      }
    }
  },
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
      var options = config.options;


      var sass = require('node-sass');

      addSassImporter(destCwd, bundler);

      var allF = globule.find(files, {
        cwd: cwd,
        filter: 'isFile'
      });

      for (var i in allF) {
        var file = allF[i];
        wfs.safeWriteFile(path.join(destCwd, file), fs.readFileSync(path.join(cwd, file)));//copy source file
        if (path.basename(file)[0] == '_')
          continue;
        var opt = <any>{};//need to copy multiple times

        for (var i in options)
          opt[i] = options[i];

        opt.file = path.join(cwd, file);
        opt.outFile = path.join(destCwd, file);
        opt.sourceMap = true;
        console.log('\t' + opt.file);
        var render = sass.renderSync(opt);

        var destFile = path.join(destCwd, file).replace('.scss', '.css');

        wfs.safeWriteFile(destFile, render.css);
        wfs.safeWriteFile(destFile + '.map', render.map);
      }
    }
  }
}

function getFiles(cwd: string, srcs, ignoreFiles: string[]): Webler.WFile[] {
  var globs = [];
  if (Array.isArray(srcs)) {
    for (var i in srcs)
      globs.push(srcs[i]);
  } else
    globs.push(srcs);

  for (var i in ignoreFiles)
    globs.push('!' + ignoreFiles[i]);

  var allF = globule.find(globs, {
    cwd: cwd,
    filter: 'isFile'
  });

  var wFiles: Webler.WFile[] = [];
  for (var f in allF) {
    wFiles.push(Webler.wFile(cwd, allF[f]));
  }

  return wFiles;
}

function executeModule(moduleName,
  srcs, cwd, destCwd,
  wFiles: Webler.WFile[],
  additionalFiles: Webler.WFile[],
  packageOptions, gOptions: Webler.GOptions) {

  console.log('Running ' + moduleName + '...');

  modules[moduleName].start(<Webler.WeblePackageOptions>{
    files: wFiles,
    additionalFiles: additionalFiles,
    glob: {
      src: srcs,
      cwd: cwd,
      dest: destCwd
    },
    destCwd: path.join(gOptions.tmpDir, moduleName),
    gOptions: gOptions,
    options: packageOptions
  });
}

function writeFiles(files: Webler.WFile[], destCwd: string) {
  for (var k in files) {
    wfs.safeWriteFile(path.join(destCwd,files[k].src()), fs.readFileSync(files[k].fullPath()));
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

    var additionalFiles: Webler.WFile[] = [];

    for (var m in config.modules) {
      var package = config.modules[m];
      var cwd;
      var destCwd;
      if (!package.destCwd) {
        console.log('destCwd not specified for module: ' + m)
        process.exit(-1);
        throw '';
      }

      destCwd = package.destCwd;
      cwd = package.cwd || './';
      var wFiles: Webler.WFile[] = getFiles(cwd, package.srcs, gOptions.ignoreFiles);

      executeModule(m,
        package.srcs, cwd, destCwd,
        wFiles, additionalFiles,
        package.options, gOptions);
      writeFiles(additionalFiles, destCwd);
      additionalFiles = [];
    }


    for (var m in config.chainModules) {
      var module = config.chainModules[m];
      var cwd;
      var destCwd;
      if (!module.destCwd) {
        console.log('destCwd not specified for module: ' + m)
        process.exit(-1);
        throw '';
      }

      destCwd = module.destCwd;
      cwd = module.cwd || './';
      var wFiles: Webler.WFile[] = getFiles(cwd, module.srcs, gOptions.ignoreFiles);

      var foldersToDelete = [];


      for (var j in module.options) {
        executeModule(j,
          module.srcs, cwd, destCwd,
          wFiles, additionalFiles,
          module.options[j], gOptions);
      }

      writeFiles(wFiles, destCwd);
      writeFiles(additionalFiles, destCwd);
      additionalFiles = [];
    }

  }
}
