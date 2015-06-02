require('./bootstrap_global');

var time = require('../../lib/utils/time');

var fs = require('fs');
var utils: Utils = _wRequire('utils');
var vpCreator = _wRequire('vp');
var tpCreator = _wRequire('tp');
var path = require('path');
var log = wRequire('log');
var converters = _wRequire('converters');
var system = _wRequire('system');
var $ = wRequire('$');
var package_manager = _wRequire('package_manager');


interface Webled {
  unit: any;
  pipeline: any[];
  gOptions: any;
  resources: FileResource[];
  wp: WPManager;
}

var defaultWeblerOpts = {
  src: 'src', //use current working directory as app root
  dest: 'webled',
  debug: false, //should be used by all modules meaning not to uglify, compress or anything else for debugging purposes
  globs: [{
    src: '**/*.html',
    dest: '~',
    cwd: '~'
  }],
  log: undefined,
  temp: '.webler_temp'
};

var requireMap = {
  log: log,
  gOptions: true, //map to current options
  wp: true,
  pipedata: true,
  $: $
};

function convertFile(file, to) {
  return converters.getConverter(file.type)[to](file.value)
}


function persistDependencies(resources: FileResource[]) {
  var deps = {};

  for (var i in resources) {
    var resDep = resources[i].getDependencies();
    for (var j in resDep) {
      var d;
      if (!deps[resources[i].src()])
        deps[resources[i].src()] = {};
      deps[resources[i].src()][j] = {
        lastModified: 'last'
      };

    }

    deps[resources[i].src()]
  }

  utils.safeWriteFile('.fdeps.json', JSON.stringify(deps));
}

var persistedDependencies = (function() {
  var deps = {};
  if (fs.existsSync('.fdeps.json'))
    deps = JSON.parse(fs.readFileSync('.fdeps.json'));
  return deps;
})();

/**
 * format is
 * {
 *  moduleName:{ userName: {userName:userName,name:name,module:module} }
 * }
 */
var modules = {};

function scopeCreator(di) {
  /**
   * @type {Object[]} - { unit: weble,pipeline: pipelineOrder,gOptions: globalOptions,files: {src:virtualSrc,dest:virtualDest},wp: {tp:temporaryPathmanager,vp:virtualPathManager} }
   */
  var webled: Webled[] = [];

  var allDestFolders = {};
  var allTempFolders = {};
  var cleanTmp = true;
  var cleanUp = true;

  function solveModule(name: string, deferred, userName?: string) {

    if (!modules[name]) {
      log.error('module: ' + name + ' not loaded');
      system.exit(-1);
    }

    var count = 0;
    var i: string;
    for (i in modules[name]) {
      count++;
      if (count > 1)
        break;
    }

    if (count > 1) {
      return {
        at: function(uName) {
          if (modules[name][uName]) {
            return deferred(modules[name][uName].module, uName);
          }
          log.error('user not found: ' + uName);
        }
      }
    } else {
      if (!userName)
        userName = i;
    }

    return deferred(modules[name][userName].module);
  }

  function setupModuleRequirements(module, input, options, gOptions, wp, pipedata) {
    var requirements = [];
    for (var i in module.require) {
      var name = module.require[i];
      if (requireMap[name] == true) {
        switch (name) {
          case 'pipedata':
            requirements.push(pipedata);
            break;
          case 'gOptions':
            requirements.push(gOptions);
            break;
          case 'wp':
            requirements.push(wp);
            break;
        }
      } else {
        requirements.push(requireMap[name]);
      }
    }

    requirements.unshift(options);
    requirements.unshift(input);

    return requirements;
  }

  function setupOptionsForModule(m, options) {
    var opt = {};
    if (m.config)
      utils.mergeObjects(opt, m.config);

    utils.mergeObjects(opt, options);
    return opt;
  }


  function processAllSequentialStream(pipelineStart, weble: Webled, pipeContext) {
    var stopedAt = pipelineStart;
    var pipeline = weble.pipeline;
    var resources = weble.resources;
    var wp = weble.wp;
    var gOptions = weble.gOptions;

    if (pipelineStart < pipeline.length) { //must process something

      for (var i in resources) {
        var resource = resources[i];
        var j = pipelineStart;

        for (; j < pipeline.length; j++) {
          var module = pipeline[j].module;
          var moduleType = module.type;

          if (moduleType != 'stream') { //dot not process this pipeline but do evereything again for other files
            break;
          }


          var moduleName = pipeline[j].name;
          var userName = pipeline[j].userName;
          var options = setupOptionsForModule(module, pipeline[j].options);
          var moduleRequirements = setupModuleRequirements(module, resource, options, gOptions, wp, pipeContext);

          log.resetIndentation().nl()
            .normal('Running ' + moduleName + (userName ? ' at ' + userName : '') + '...')
            .indent()
            .normal('Processing: ' + resource.src());
          module.start.apply(module, moduleRequirements);
          log.resetIndentation();
        }

        stopedAt = j;
        if (stopedAt != pipelineStart && j != pipeline.length) { //there were changes and do not handle the last write which must be the destination
          if (!resource.is('file')) {
            var tempFile = wp.tp.write(resource.value('string'));
            resource.set('file', tempFile);
          }
        }
      }
    }

    return stopedAt;
  }

  function processAllSequentialBulks(pipelineIndex, weble: Webled, pipeContext) {
    var pipeline = weble.pipeline;
    var resources = weble.resources;
    var wp = weble.wp;
    var gOptions = weble.gOptions;

    if (pipelineIndex < pipeline.length) { //pipeline ended, just ignore
      while (pipelineIndex < pipeline.length) {
        var module = pipeline[pipelineIndex].module;
        if (module.type != 'bulk')
          break;

        var moduleName = pipeline[pipelineIndex].name;
        var userName = pipeline[pipelineIndex].userName;
        var options = setupOptionsForModule(module, pipeline[pipelineIndex].options);
        var moduleRequirements = setupModuleRequirements(module, resources, options, gOptions, wp, pipeContext);

        log.resetIndentation().nl()
          .normal('Running ' + moduleName + (userName ? ' at ' + userName : '') + '...')
        module.start.apply(module, moduleRequirements);
        log.resetIndentation();
        pipelineIndex++;
      }
    }

    return pipelineIndex;
  }

  function renderWeble(weble: Webled) {

    var pipeline = weble.pipeline;
    var pipelineIndex = 0;

    var pipeContext = {};
    while (pipelineIndex < pipeline.length) {
      pipelineIndex = processAllSequentialStream(pipelineIndex, weble, pipeContext);
      pipelineIndex = processAllSequentialBulks(pipelineIndex, weble, pipeContext);
    }

    for (var i in weble.resources) {
      var resource = weble.resources[i];
      utils.safeWriteFile(resource.dest(), resource.value('string'));
    }
  }



  return {
    /* [path],globs,options */
    weble: function(options) {

      var opt: any = {};
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

      var resources: FileResource[] = di.fileSolver(globs, opt.src, opt.dest);

      for (var i in resources) {
        var res = resources[i];
        var dep = persistedDependencies[res.src()];

        if (dep)
          res.addDependency(dep);
      }

      var wp: any = {};

      wp.vp = vpCreator(opt.src, opt.dest)

      if (!allDestFolders[opt.dest])
        allDestFolders[opt.dest] = true;

      options.temp = wp.vp.resolveDest(opt.temp);
      if (!allTempFolders[opt.temp])
        allTempFolders[opt.temp] = true;

      if (opt.temp)
        wp.tp = tpCreator(opt.temp);


      function setupModuleInWebler(name: string) {
        if (!weble[name]) {
          /* returns the weble to the user
           * or an object containing a function at(name)
           * that will execute the module and return weble again for chaining*/
          weble[name] = function(opt) {
            return solveModule(name, function(module, userName) {
              pipelineOrder.push({
                name: name,
                userName: userName,
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
        resources: resources,
        wp: wp
      });

      if (di.exportsOptions) {
        utils.mergeObjects(di.exportsOptions, opt);
      }
      return weble;
    },
    config: function(name, opt) {
      var self = this;

      if (name && typeof (name) == typeof ('')) {
        return solveModule(name, function(module) {
          if (!module.config) {
            log.error('module: ' + name + ' do not support config');
            system.exit(-1);
          }

          var toOverride: any = module.config;
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
              modules[name] = {};
            }

            var obj = package_manager.weble(uName, name);
            modules[name][uName] = {
              userName: uName,
              name: name,
              module: obj.module
            };
          }
        }
      }

      if (!modules[name]) {
        modules[name] = {};
      }

      modules[name][userName] = {
        userName: userName,
        name: name,
        module: obj.module
      };

      return this;
    },
    render: function(unit) {
      var toRender: Webled[];
      var i: any;
      var l: number;
      if (unit) {
        for (i = 0,
          l = webled.length; i < l; i++) {
          if (unit == webled[i].unit) {
            toRender = webled.splice(i, 1);
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
        if (toRender[w].resources.length > 0) {
          renderWeble(toRender[w]);
          persistDependencies(toRender[w].resources);
        } else {
          log.error('No files at this weble!');
        }
      }
      if (toRender == webled)
        webled = []; //clear



      if (cleanTmp) {
        for (var i in allTempFolders)
          utils.deleteFolder(i);
      }
      cleanTmp = true; //reset to default

      if (cleanUp) {
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
    api: function(userName, name) {
      if (!name) {
        name = userName;
        userName = undefined;
      }
      return solveModule(name, function(module) {
        return module.api;
      }, userName);
    },
    doNotCleanUp: function(module) {
      cleanUp = false;

      return this;
    },
    cleanDest: function() {
      for (var i in allDestFolders)
        utils.deleteFolder(i);
      return this;
    },
    doNotCleanTmp: function() {
      cleanTmp = false;
      return this;
    }
  }
}

export = scopeCreator;
