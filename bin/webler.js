var components = require('../lib/components/components');
var build = require('../lib/build/build');
var handlebars = require('../lib/handlebars/handlebars');
var markdown = require('../lib/markdown/markdown');
var razor = require('../lib/razor/razor');
var bundle = require('../lib/bundle/bundle');
var tasker = require('../lib/build/tasker');

var fs = require('fs');
var utils = require('../lib/utils/utils.js');
var vpCreator = require('../lib/utils/virtualPath.js');
var tpCreator = require('../lib/utils/tempPath.js');
var path = require('path');
var glob = require('glob');
var htmlmin = require('html-minifier').minify;

var modules = {
  /*build: function(content, options, globalOptions, src, dst) {
    var resp = build.parse(content, options, src, dst);
    var tasks = resp.tasks;

    for (var i in tasks) {
      var task = tasks[i];
      for (var j in task) {
        var res = tasker.exec(i, task[j].sources, task[j].options);
        utils.safeWriteFile(task[j].dest, res);
      }
    }

    return resp.content;
  },*/
  bundle: function(content, options, wp, globalOptions, htmlDest) {
    return bundle.parse(content, wp, htmlDest);
  },
  handlebars: function(content, options) {
    return handlebars.parse(content, options);
  },
  components: function(content, options) {
    return components.parse(content, options);
  },
  razor: function(files, options, wp) {
    return razor.parse(files, options, wp);
  },
  markdown: function(content, options) {
    return markdown.parse(content, options);
  }
};

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
    pipelineOrder.push({
      type: moduleName,
      options: opt
    });

    pipelineMap[moduleName] = true;
  }

  var parsers = {
    build: function(opt) {
      addToPipeline('build', opt);
      return parsers;
    },
    bundle: function(opt) {
      addToPipeline('bundle', opt);
      return parsers;
    },
    handlebars: function(opt) {
      addToPipeline('handlebars', opt);
      return parsers;
    },
    components: function(opt) {
      opt.componentsPath = wp.vp.resolveSrc(opt.componentsPath);
      //opt.componentsPath = path.join(wp.vp.vSrc(), opt.componentsPath);
      addToPipeline('components', opt);
      return parsers;
    },
    razor: function(opt) {
      if (pipelineMap['razor'] != undefined || pipelineOrder.length > 0) {
        throw 'Razor can be executed only once and be the first';
      }

      if (opt) {
        var toResolve = ['layoutsPath', 'modelsPath', 'viewBagsPath'];

        for (var i in toResolve) {
          if (opt[toResolve[i]]) {
            opt[toResolve[i]] = wp.vp.resolveSrc(opt[toResolve[i]]);
          }
        }
      }
      addToPipeline('razor', opt);
      return parsers;
    },
    markdown: function(opt) {
      addToPipeline('markdown', opt);
      return parsers;
    }
  }

  this.compile = function() {
    return parsers;
  }

  this.bundles = function() {
    return bundle.bundles();
  }

  this.render = function() {
    if (pipelineOrder.length > 0 && pipelineOrder[0].type == 'razor') {
      var razorConfig = pipelineOrder.shift(); //remove razor
      curFiles = modules.razor(curFiles, razorConfig.options, wp, options);
    }

    for (var i in curFiles) {
      var res = fs.readFileSync(curFiles[i].src).toString();
      for (var j in pipelineOrder) {
        var pipeline = pipelineOrder[j];

        res = modules[pipeline.type](
          res, pipeline.options,
          wp, options,
          curFiles[i].dest);
      }
      utils.safeWriteFile(curFiles[i].dest, options.htmlMiniier(res));
    }

  }

  this.clean = function() {
    utils.deleteFolder(options.temp);
  }
}


function solveGlobs(globs, src, dest) {
  var files = [];

  var vp = vpCreator(src, dest);

  for (var i in globs) {
    var obj = globs[i];
    var glob_opt = undefined;


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
        dest: p.dest, //fullpath
        ctx: {
          src: file,
          dest: obj.dest,
          cwd: obj.cwd
        }
      });
    }
  }

  return files;
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

    var globs = options.globs;
    if (globs.constructor !== Array) {
      globs = [globs];
    }



    var files = solveGlobs(globs, options.src, options.dest);

    return new Webler(files, options);
  }
}
