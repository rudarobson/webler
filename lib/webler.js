var time = require('../lib/utils/time');

var fs = require('fs');
var utils = require('../lib/utils/utils.js');
var vpCreator = require('../lib/utils/virtualPath.js');
var tpCreator = require('../lib/utils/tempPath.js');
var path = require('path');
var glob = require('glob');
var htmlmin = require('html-minifier').minify;
var log = require('../lib/utils/log');
var converters = require('../lib/moduleInput/converters');

var defaultWeblerOpts = {
  temp: '.webler_temp',
  config: 'Webler.js',
  htmlMiniier: function(html) {
    return htmlmin(html, { // Target options
      removeComments: true,
      collapseWhitespace: true,
      minifyCss: true,
      minifyJS: true
    });
  }
};

/*
 * { pipeline: [] }
 */
var webled = [];

function Webler(files, options) {
  if (!options)
    options = {};

  for (var i in defaultWeblerOpts) {
    if (!options[i])
      options[i] = defaultWeblerOpts[i];
  }

  var wp = {};

  wp.vp = vpCreator(options.src, options.dest)

  if (options.temp)
    wp.tp = tpCreator(options.temp);

  var curFiles = files;
  var pipelineMap = {};
  var pipelineOrder = [];

  function addToPipeline(moduleName, opt) {
    pipelineMap[moduleName] = true;
  }

  var self = this;

  function setupModuleInWebler(name) {

    self[name] = function(opt) {
      pipelineOrder.push({
        name: name,
        options: opt
      });
      return self;
    }
  }

  for (var i in modules) {
    var module = modules[i];
    module.config();
    setupModuleInWebler(i);
  }

  webled.push({
    pipeline: pipelineOrder,
    gOptions: options,
    files: files,
    wp: wp
  });
}


function solveGlobs(globs, srcRoot, destRoot) {
  files = [];

  vp = vpCreator(srcRoot, destRoot);
  if (!globs)
    globs = [{}];

  for (i in globs) {
    var obj = globs[i];


    var glob_opt = undefined;

    var virtualSrc = obj.src || '**/*.html';
    var virtualDest = obj.dest || '';
    var virtualCwd = obj.cwd || '';

    if (virtualSrc.indexOf('~') === 0) {
      virtualSrc = virtualSrc.substr(1);
    }

    if (virtualSrc.indexOf('/') === 0) {
      virtualSrc = virtualSrc.substr(1);
    }


    if (virtualDest.length == 0 || virtualDest[0] != '~')
      virtualDest = '~' + virtualDest;

    if (virtualCwd.length == 0 || virtualCwd[0] != '~')
      virtualCwd = '~' + virtualCwd;

    virtualSrc = vp.resolveSrc(virtualSrc);
    virtualCwd = vp.resolveSrc(virtualCwd);
    virtualDest = vp.resolveDest(virtualDest);

    var group = glob.sync(virtualSrc, {
      cwd: virtualCwd
    });

    for (var j in group) {
      var file = group[j];

      files.push({
        src: path.join(virtualCwd, file), //full src
        dest: path.join(virtualDest, utils.changeFileExt(file, '.html')) //full dst
      });
    }
  }
  return files;
}

var modules = {};


function setupWManagerForCurrentExecution(wManager, contentType, options) {

  wManager.options = options;
}

function processAllSequentialStream(pipelineStart, pipeline, files, wManager) {
  var stopedAt = pipelineStart;
  var newFiles = [];

  for (var i in files) {
    var file = files[i];
    var j = pipelineStart;
    for (; j < pipeline.length; j++) {
      var moduleName = pipeline[j].name;
      var options = pipeline[j].options;
      var moduleType = modules[moduleName].type;

      if (moduleType != 'stream') { //dot not process this pipeline but do evereything again for other files
        stopedAt = j;
        break;
      }

      setupWManagerForCurrentExecution(wManager, file.type, options);

      var newF = modules[moduleName].start(file, wManager);
      if (newF) {
        if (!newF.type || !newF.value) {
          log.error('Invalid return from module: ' + moduleName);
          log.error(newF);
        }
        file.type = newF.type;
        file.value = newF.value;
      }
    }

    if (j == pipeline.length) { //pipeline ended, just write the file
      stopedAt = pipeline.length; //return that ended

      if (file.type != 'string' && file.type != 'file') {
        log.error('Ended pipeline with unsupported at end!');
        system.exit(-1);
      }
      utils.safeWriteFile(file.wFile.dest, file.value);

      newFiles = files;
    } else { //didn't end, must process other kind of pipeline, write a temp file
      if (stopedAt != pipelineStart) { //there were changes
        if (file.type != 'string' && file.type != 'file')
          throw 'Type not supported';
        if (file.type == 'string') {
          var tempFile = wManager.tp.write(file.value);
          newFiles.push({
            type: 'file',
            value: tempFile,
            wFile: file.wFile
          });
        } else {
          newFiles.push(file);
        }
      } else { //no changes keep the same input
        newFiles = files;
      }
    }
  }


  return {
    pipelineIndex: stopedAt, //next to process
    files: newFiles
  };
}

function processAllSequentialBulks(pipelineIndex, pipeline, files, wManager) {
  var newFiles = files;

  if (pipelineIndex < pipeline.length) { //pipeline ended, just ignore

    while (pipelineIndex < pipeline.length) {
      var moduleName = pipeline[pipelineIndex].name;
      var options = pipeline[pipelineIndex].options;

      if (modules[moduleName].type != 'bulk')
        break;

      setupWManagerForCurrentExecution(wManager, 'file', options); //will always be file type
      var retF = modules[moduleName].start(files, wManager);
      if (retF)
        newFiles = retF;

      pipelineIndex++;
    }


    if (pipelineIndex == pipeline.length) { //pipeline ended, write all files
      for (var i in newFiles) {

        var newFile = newFiles[i]
        if (newFile.type != 'file') {
          log.error('Some error ocurred at one pipeline of bulk type!');
          system.exit(-1);
        }
        utils.safeWriteFile(newFile.wFile.dest, fs.readFileSync(newFile.value));
      }
    }
  }

  return {
    files: newFiles,
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
  //process bulk pipeline
}

module.exports = {
  /* [path],globs,options */
  weble: function(options) {
    if (!options.src) {
      options.src = './'; //use current working directory as app root
    }

    if (!options.dest) {
      options.dest = './webled';
    }

    if (path.resolve(options.src) === path.resolve(options.dest)) {
      log.error('source and destination directories can\'t be the same, it will destroy your source files');
      system.exit(-1);
    }

    if (options.log) {
      if (options.log.verbose)
        log.verbose.enable(options.log.verbose);
      if (options.log.dev)
        log.verbose.enable(options.log.dev);
    }

    var globs = options.globs;
    if (globs.constructor !== Array) {
      globs = [globs];
    }

    var files = solveGlobs(globs, options.src, options.dest);

    return new Webler(files, options);
  },
  require: function(name) {
    if (!modules[name]) {
      log.error('module: ' + trimedName + ' not loaded');
      system.exit(-1);
    }
    return modules[name].api;
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
  },
  cleanUp: function() {
    components.cleanUp();
    handlebars.cleanUp();
    markdown.cleanUp();
    razor.cleanUp();
    bundle.cleanUp();
  },
  render: function() {
    for (var w in webled) {
      var pipeline = webled[w].pipeline;
      renderWeble(webled[w].files, pipeline, {
        log: log,
        wp: webled[w].wp,
        gOptions: webled[w].gOptions,
        options: undefined, //will be replaced by each module option
        convert: function(input, to) { //this will be replaced by the current file beeing prcessed
          return converters.getConverter(input.type)[to](input.value);
        }
      });
    }
  },
  cleanDest: function() {
    utils.deleteFolder(wp.vp.vDest());
  },
  cleanTmp: function() {
    utils.deleteFolder(options.temp);
  }
}
