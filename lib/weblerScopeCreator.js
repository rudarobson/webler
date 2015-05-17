var time = require('../lib/utils/time');

var fs = require('fs');
var utils = require('../lib/utils/utils.js');
var vpCreator = require('../lib/utils/virtualPath.js');
var tpCreator = require('../lib/utils/tempPath.js');
var path = require('path');
var htmlmin = require('html-minifier').minify;
var log = require('../lib/utils/log');
var converters = require('../lib/moduleInput/converters');
var system = require('../lib/utils/system');

var defaultWeblerOpts = {
  src: 'src', //use current working directory as app root
  dest: 'webled',
  debug: false, //should be used by all modules meaning not to uglify, compress or anything else
  globs: [{
    src: '**/*.html',
    dest: '~',
    cwd: '~'
  }],
  log: undefined,
  temp: '.webler_temp',
  htmlMiniier: function(html) {
    return htmlmin(html, { // Target options
      removeComments: true,
      collapseWhitespace: true,
      minifyCss: true,
      minifyJS: true
    });
  }
};

function scopeCreator(di) {
  var webled = [];
  var modules = {};

  var allDestFolders = {};
  var allTempFolders = {};

  function solveModule(name) {
    if (!modules[name]) {
      log.error('module: ' + name + ' not loaded');
      system.exit(-1);
    }

    return modules[name];
  }

  function setupWManagerForCurrentExecution(wManager, moduleName, options) {
    var opt = {};
    if (modules[moduleName].config)
      utils.mergeObjects(opt, modules[moduleName].config);

    utils.mergeObjects(opt, options);
    wManager.options = opt;
  }

  function processAllSequentialStream(pipelineStart, pipeline, files, wManager) {
    var stopedAt = pipelineStart;

    if (pipelineStart < pipeline.length) { //must process something

      for (var i in files) {
        var file = files[i];
        var j = pipelineStart;

        for (; j < pipeline.length; j++) {
          var moduleName = pipeline[j].name;
          var options = pipeline[j].options;
          var moduleType = modules[moduleName].type;

          if (moduleType != 'stream') { //dot not process this pipeline but do evereything again for other files
            break;
          }

          setupWManagerForCurrentExecution(wManager, moduleName, options);
          modules[moduleName].start(file, wManager);
        }

        stopedAt = j;
        if (stopedAt != pipelineStart && j != pipeline.length) { //there were changes and do not handle the last write which must be the destination
          if (file.type != 'file') {
            var tempFile = wManager.tp.write(wManager.convert(file, 'string'));
            file.type = 'file';
            file.value = tempFile;
          }
        }
      }
    }

    return {
      pipelineIndex: stopedAt, //next to process
      files: files
    };
  }

  function processAllSequentialBulks(pipelineIndex, pipeline, files, wManager) {

    if (pipelineIndex < pipeline.length) { //pipeline ended, just ignore
      while (pipelineIndex < pipeline.length) {
        var moduleName = pipeline[pipelineIndex].name;
        var options = pipeline[pipelineIndex].options;

        if (modules[moduleName].type != 'bulk')
          break;

        setupWManagerForCurrentExecution(wManager, moduleName, options); //will always be file type
        modules[moduleName].start(files, wManager);
        pipelineIndex++;
      }
    }

    return {
      files: files,
      pipelineIndex: pipelineIndex
    };
  }

  function renderWeble(files, pipeline, wManager) {
    var pipelineIndex = 0;
    var curFiles = files;

    var contents = [];
    for (var i in files) {
      contents.push({
        type: 'file',
        value: files[i].src,
        wFile: {
          src: files[i].src,
          dest: files[i].dest
        }
      });
    }

    while (pipelineIndex < pipeline.length) {
      var ctx = processAllSequentialStream(pipelineIndex, pipeline, contents, wManager);
      pipelineIndex = ctx.pipelineIndex;

      ctx = processAllSequentialBulks(pipelineIndex, pipeline, ctx.files, wManager);
      pipelineIndex = ctx.pipelineIndex;
      curFiles = ctx.files;

      if (!curFiles || curFiles.constructor !== Array || curFiles.length == 0) {
        log.verbose.error(pipeline[pipelineIndex - 1].name + ': returned no files!', 0);
        break;
      }
    }


    for (var i in contents) {
      var file = contents[i];
      utils.safeWriteFile(file.wFile.dest, wManager.convert(file, 'string'));
    }
  }



  return {
    /* [path],globs,options */
    weble: function(options) {

      var opt = {};
      var pipelineOrder = [];
      var weble = {};
      var globs;

      utils.mergeObjects(opt, defaultWeblerOpts);
      utils.mergeObjects(opt, options);

      if (path.resolve(opt.src) === path.resolve(opt.dest)) {
        log.error('source and destination directories can\'t be the same, it will destroy your source files');
        system.exit(-1);
      }

      if (opt.log) {
        if (opt.log.verbose)
          log.verbose.enable(opt.log.verbose);
        if (opt.log.dev)
          log.verbose.enable(opt.log.dev);
      }

      globs = opt.globs;
      if (globs.constructor !== Array) {
        globs = [globs];
      }

      var files = di.fileSolver(globs, opt.src, opt.dest);

      var wp = {};

      wp.vp = vpCreator(opt.src, opt.dest)

      if (!allDestFolders[opt.dest])
        allDestFolders[opt.dest] = true;

      options.temp = wp.vp.resolveDest(opt.temp);
      if (!allTempFolders[opt.temp])
        allTempFolders[opt.temp] = true;

      if (opt.temp)
        wp.tp = tpCreator(opt.temp);

      function setupModuleInWebler(name) {
        weble[name] = function(opt) {
          pipelineOrder.push({
            name: name,
            options: opt
          });
          return weble;
        }
      }

      for (var i in modules) {
        var module = modules[i];
        if (module.setup)
          module.setup();
        setupModuleInWebler(i);
      }

      webled.push({
        unit: weble,
        pipeline: pipelineOrder,
        gOptions: opt,
        files: files,
        wp: wp
      });

      return weble;
    },
    config: function(name, opt) {
      var toOverride;

      if (name && typeof(name) == typeof('')) {
        var module = solveModule(name);
        if (!module.config) {
          log.error('module: ' + name + ' do not support config');
          system.exit(-1);
        }
        toOverride = module.config;
      } else {
        toOverride = defaultWeblerOpts;
        opt = name; //name is undefined or an object
      }

      if (opt) {
        for (var i in opt)
          toOverride[i] = opt[i];
      }

      return this;
    },
    loadModule: function(name) {
      var module;
      var moduleName;
      var loadPath;

      if (/^\.?\.?(\/|\\)/.test(name)) { //relative
        moduleName = path.basename(name);
        loadPath = path.join(process.cwd(), name, 'main.js')
      } else {
        moduleName = name;
        loadPath = path.join('../modules', name, 'main.js');
      }

      log.verbose.normal('loading module: ' + name, 0);
      log.verbose.normal('location: ' + loadPath, 1);

      var module = require(loadPath);

      if (modules[moduleName]) {
        log.error('module: ' + name + ' already loaded');
        system.exit(-1);
      }

      if (!module.type) {
        log.error('module type wasn\'t provided');
        system.exit(-1);
      }

      if (module.type !== 'stream' && module.type !== 'bulk') {
        log.error('module type not supporter: ' + module.type);
        system.exit(-1);
      }

      modules[moduleName] = module;

      return this;
    },
    render: function(unit) {
      var toRender;

      if (unit) {
        for (var w = 0,
            l = webled.length; w < l; w++) {
          if (unit == webled[w].unit) {
            toRender = webled.splice(w, 1);
            break;
          }
        }

        if (toRender == undefined || toRender.length == 0) {
          log.error('cannot render supplied unit!');
          system.exit(-1);
        }
      } else
        toRender = webled;


      for (var w in toRender) {
        var pipeline = toRender[w].pipeline;
        if (toRender[w].files.length > 0) {
          renderWeble(toRender[w].files, pipeline, {
            log: log,
            wp: toRender[w].wp,
            gOptions: toRender[w].gOptions,
            options: undefined, //will be replaced by each module option
            convert: function(input, to) { //this will be replaced by the current file beeing prcessed
              return converters.getConverter(input.type)[to](input.value);
            },
            api: function(name) {
              return solveModule(name).api;
            }
          });
        } else {
          log.error('No files at this weble!');
        }
      }


      return this;
    },
    api: function(name) {
      return solveModule(name).api;
    },
    cleanUp: function(module) {
      var toClean;
      if (module) {
        toClean = [solveModule(module)];
      } else
        toClean = modules;

      for (var i in toClean) {
        if (toClean[i].cleanUp)
          toClean[i].cleanUp();
      }

      return this;
    },
    cleanDest: function() {
      for (var i in allDestFolders)
        utils.deleteFolder(i);
      return this;
    },
    cleanTmp: function() {
      for (var i in allTempFolders)
        utils.deleteFolder(i);
      return this;
    }
  }
}

module.exports = scopeCreator;
