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
  bundle: function(content, options, wp) {
    return bundle.parse(content, options, wp);
  },
  handlebars: function(content, options, wp) {
    return handlebars.parse(content, options);
  },
  components: function(content, options, wp) {
    return components.parse(content, options);
  },
  razor: function(files, options, wp) {
    return razor.parse(files, options, wp.tp.dir());
  },
  markdown: function(content, options, wp) {
    return markdown.parse(content, options);
  }
};

var defaultWeblerOpts = {
  temp: '.webler_temp',
  config: 'Webler.js'
};

function Webler(files, options) {
  if (!options)
    options = {};

  for (var i in defaultWeblerOpts) {
    if (!options[i])
      options[i] = defaultWeblerOpts[i];
  }

  var wp = {};

  if (options.virtualPath)
    wp.vp = vpCreator(options.virtualPath.src, options.virtualPath.dest)

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
      addToPipeline('components', opt);
      return parsers;
    },
    razor: function(opt) {
      if (pipelineMap['razor'] != undefined || pipelineOrder.length > 0) {
        throw 'Razor can be executed only once and be the first';
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

  this.render = function() {
    if (pipelineOrder.length > 0 && pipelineOrder[0].type == 'razor') {
      var razorConfig = pipelineOrder.shift(); //remove razor
      curFiles = modules.razor(curFiles, razorConfig.options, wp, options);
    }

    for (var i in curFiles) {
      var res = fs.readFileSync(curFiles[i].src).toString();
      for (var j in pipelineOrder) {
        var pipeline = pipelineOrder[j];
        res = modules[pipeline.type](res, pipeline.options, wp, options);
      }
      utils.safeWriteFile(curFiles[i].dest, res);
    }

  }

  this.clean = function() {
    utils.deleteFolder(options.temp);
  }
}


module.exports = {
  weble: function(globs, options) {
    var files = [];

    if (globs.constructor !== Array) {
      globs = [globs];
    }

    for (var i in globs) {
      var obj = globs[i];
      var glob_opt = undefined;


      if (obj.cwd)
        glob_opt = {
          cwd: obj.cwd
        };

      var group = glob.sync(obj.src, glob_opt);


      var src;
      var dest;

      for (var j in group) {
        var file = group[j];

        if (obj.cwd) { //using cwd
          src = path.join(obj.cwd, file); //fullpath
          dest = utils.changeFileExt(path.join(obj.dest, file), '.html');
        } else {
          src = obj.src;
          dest = obj.dest; //no cwd dest path is absolute
        }

        files.push({
          src: src,
          dest: dest //fullpath
        });
      }
    }

    return new Webler(files, options);
  }
}
