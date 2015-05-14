var time = require('../lib/utils/time');

var fs = require('fs');
var utils = require('../lib/utils/utils.js');
var vpCreator = require('../lib/utils/virtualPath.js');
var tpCreator = require('../lib/utils/tempPath.js');
var path = require('path');
var glob = require('glob');
var htmlmin = require('html-minifier').minify;
var log = require('../lib/utils/log');


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


function solveGlobs(globs, src, dest) {
  files = [];

  vp = vpCreator(src, dest);

  for (i in globs) {
    var obj = globs[i];
    var glob_opt = undefined;

    obj.dest = vp.resolveDest(obj.dest);

    if (obj.cwd) {
      obj.cwd = vp.resolveSrc(obj.cwd);
      glob_opt = {
        cwd: obj.cwd
      };
    }

    var group = glob.sync(vp.resolveSrc(obj.src), glob_opt);
    var src;
    var dest;

    for (var j in group) {
      var file = group[j];

      var p = utils.resolveGlob(file, vp.resolveDest(obj.dest), obj.cwd);

      files.push({
        src: p.src,
        dest: p.dest
      });
    }
  }

  return files;
}

var modules = {
  test1: {
    type: 'stream',
    config: function() {
      console.log('config test1');
    },
    start: function(content, wManager) {
      console.log('start test1');
      return content;
    },
    cleanUp: function() {
      console.log('cleanup test1');
    }
  },
  test2: {
    type: 'stream',
    config: function() {
      console.log('config test2');
    },
    start: function(content, wManager) {
      console.log('start test2');
      return content;
    },
    cleanUp: function() {
      console.log('cleanup test2');
    }
  },
  test3: {
    type: 'bulk',
    config: function() {
      console.log('config test3');
    },
    start: function(content, wManager) {
      console.log('start test3');
      return content;
    },
    cleanUp: function() {
      console.log('cleanup test3');
    }
  },
  test4: {
    type: 'bulk',
    config: function() {
      console.log('config test4');
    },
    start: function(content, wManager) {
      console.log('start test4');
      console.log(content);
      return content;
    },
    cleanUp: function() {
      console.log('cleanup test4');
    }
  },
  test5: {
    type: 'stream',
    config: function() {
      console.log('config test5');
    },
    start: function(content, wManager) {
      console.log('start test5');
      return content;
    },
    cleanUp: function() {
      console.log('cleanup test5');
    }
  }
};


function processAllSequentialStream(pipelineStart, pipeline, files, wManager) {
  var stopedAt = pipelineStart;
  var startedProcessingAt = pipelineStart;
  var newFiles = [];

  for (var i in files) {
    var file = files[i];
    for (var j = pipelineStart; j < pipeline.length; j++) {
      var moduleName = pipeline[j].name;
      var options = pipeline[j].options;
      var moduleType = modules[moduleName].type;

      if (moduleType != 'stream') { //dot not process thie pipeline but do evereything again for other files
        stopedAt = j;
        break;
      }

      wManager.options = options;
      var newF = modules[moduleName].start(file, wManager);
      if (newF) {
        if (!newF.type || !newF.content) {
          log.error('Invalid return from module: ' + moduleName);
          log.error(newF);
        }
        file.type = newF.type;
        file.content = newF.content;
      }
    }


    if (stopedAt != pipelineStart) {
      if (file.type != 'string' && file.type != 'file')
        throw 'Type not supported';
      if (file.type == 'string') {
        var tempFile = wManager.tp.write(wManager.content);
        newFiles.push({
          type: 'file',
          content: tempFile,
          wFile: file.wFile
        });
      } else {
        newFiles.push(file);
      }
    } else { //no changes were made
      newFiles = files;
      break;
    }
  }

  return {
    pipelineIndex: stopedAt, //next to process
    files: newFiles
  };
}

function processAllSequentialBulks(pipelineIndex, pipeline, files, wManager) {
  var newFiles = files;


  while (pipelineIndex < pipeline.length) {
    var moduleName = pipeline[pipelineIndex].name;
    var options = pipeline[pipelineIndex].options;

    if (modules[moduleName].type != 'bulk')
      break;

    wManager.options = options;
    newFiles = modules[moduleName].start(files, wManager);
    pipelineIndex++;
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
      content: files[i].src,
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
      log.verbose.error(pipeline[pipelineIndex].name + ': returned no files!', 0);
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
      options.dest = './dist';
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
  registerModule: function(name, type) {

  },
  loadModule: function(name) {

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
        options: undefined //will be replaced by each module option
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
