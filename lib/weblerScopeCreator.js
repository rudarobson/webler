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

var package_manager = require('./package_manager');
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

  function at(moduleName) {
    return function(name) {

    }
  }

  function solveModule(userName, name, deferred) {
    if (!deferred) {
      deferred = name
      name = userName;
      userName = undefined;
    }

    if (!modules[name]) {
      log.error('module: ' + name + ' not loaded');
      system.exit(-1);
    }

    if (modules[name].length > 1) {
      return {
        at: function(uName) {
          for (var i in modules[name]) {
            if (modules[name][i].userName == uName) {
              return defferd(modules[name][i].module);
            }
          }
          log.error('user not found: ' + uName);
        }
      }
    }

    return deferred(modules[name][0].module);
  }

  function setupWManagerForCurrentExecution(wManager, m, options, pipeContext) {
    var opt = {};
    if (m.config)
      utils.mergeObjects(opt, m.config);

    utils.mergeObjects(opt, options);
    wManager.options = opt;
    wManager.pipeContext = {
      set: function(key, val) {
        if (arguments.length == 1) {
          val = key;
          key = moduleName
        }

        if (!pipeContext[moduleName])
          pipeContext[moduleName] = {};

        pipeContext[modulename][key] = val;
      },
      get: function(key, val) {
        if (arguments.length == 1) {
          val = key;
          key = moduleName
        }

        return pipeContext[key][val];
      }
    }
  }

  function processAllSequentialStream(pipelineStart, pipeline, files, wManager, pipeContext) {
    var stopedAt = pipelineStart;

    if (pipelineStart < pipeline.length) { //must process something

      for (var i in files) {
        var file = files[i];
        var j = pipelineStart;

        for (; j < pipeline.length; j++) {
          var module = pipeline[j].module;
          var options = pipeline[j].options;
          var moduleType = module.type;

          if (moduleType != 'stream') { //dot not process this pipeline but do evereything again for other files
            break;
          }

          setupWManagerForCurrentExecution(wManager, module, options, pipeContext);
          module.start(file, wManager);
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

  function processAllSequentialBulks(pipelineIndex, pipeline, files, wManager, pipeContext) {

    if (pipelineIndex < pipeline.length) { //pipeline ended, just ignore
      while (pipelineIndex < pipeline.length) {
        var module = pipeline[pipelineIndex].module;
        var options = pipeline[pipelineIndex].options;

        if (module.type != 'bulk')
          break;

        setupWManagerForCurrentExecution(wManager, module, options, pipeContext); //will always be file type
        module.start(files, wManager);
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
    var pipeContext = {};
    while (pipelineIndex < pipeline.length) {
      var ctx = processAllSequentialStream(pipelineIndex, pipeline, contents, wManager, pipeContext);
      pipelineIndex = ctx.pipelineIndex;

      ctx = processAllSequentialBulks(pipelineIndex, pipeline, ctx.files, wManager, pipeContext);
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
        if (!weble[name]) {
          /* returns the weble to the user
           * or an object containing a function at(name)
           * that will execute the module and return weble again for chaining*/
          weble[name] = function(opt) {
            return solveModule(name, function(module) {
              pipelineOrder.push({
                module: module,
                options: opt
              });
              return weble;
            });
          }
        }
      }

      for (var i in modules) {
        for (var j in modules[i]) {
          setupModuleInWebler(i);
          if (modules[i][j].module.setup)
            modules[i][j].module.setup(i);
        }
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
      var self = this;

      if (name && typeof(name) == typeof('')) {
        return solveModule(name, function(module) {
          if (!module.config) {
            log.error('module: ' + name + ' do not support config');
            system.exit(-1);
          }

          toOverride = module.config;
          if (opt) {
            for (var i in opt)
              toOverride[i] = opt[i];
          }

          return self;
        });
      } else {
        for (var i in opt)
          defaultWeblerOpts[i] = opt[i];
      }

      return this;
    },
    loadModule: function(userName, name) {
      if (!name) {
        name = userName;
        userName = undefined;
      }

      var obj = package_manager.weble(userName, name);

      if (obj.multiple && !obj.module) {
        return {
          at: function(uName) {
            if (!modules[name]) {
              modules[name] = [];
            }

            var obj = package_manager.weble(uName, name);
            modules[name].push({
              userName: uName,
              name: name,
              module: obj.module
            });
          }
        }
      }

      if (!modules[name]) {
        modules[name] = [];
      }

      modules[name].push({
        userName: userName,
        name: name,
        module: obj.module
      });

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
            api: function(userName, name) {
              if (!name) {
                name = userName;
                userName = undefined;
              }
              return solveModule(userName, name, function(module) {
                return module.api;
              });
            }
          });
        } else {
          log.error('No files at this weble!');
        }
      }
      if (toRender == webled)
        webled = [];//clear

      return this;
    },
    api: function(userName, name) {
      if (!name) {
        name = userName;
        userName = undefined;
      }
      return solveModule(userName, name, function(module) {
        return module.api;
      });
    },
    cleanUp: function(module) {
      var toClean;
      var self = this;
      if (module) {
        solveModule(name, function(module) {
          if (module.cleanUp)
            module.cleanUp();
          return self;
        });
      } else {
        for (var i in modules) {
          for (var j in modules[i]) {
            var toClean = modules[i][j].module;
            if (toClean.cleanUp)
              toClean.cleanUp();
          }
        }
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
