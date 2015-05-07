var components = require('../lib/components/components');
var build = require('../lib/build/build');
var handlebars = require('../lib/handlebars/handlebars');
var markdown = require('../lib/markdown/markdown');
var razor = require('node-razor');

var tasker = require('../lib/build/tasker');
var fs = require('fs');
var utils = require('../lib/utils/utils.js');
var path = require('path');
var glob = require('glob');

var modules = {
  build: function(content, options, globalOptions, src, dst) {
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
  },
  handlebars: function(content, options) {
    return handlebars.parse(content, options);
  },
  components: function(content, options) {
    return components.parse(content, options);
  },
  razor: function(files, options, globalOptions) {
    var opt = {};
    if (options)
      utils.mergeObjects(opt, options);

    var pages = [];
    var destPaths = [];
    for (var i in files) {

      var fileName = files[i];
      var noExtName = utils.changeFileExt(fileName, '');

      pages.push({
        source: files[i].src,
        destination: files[i].dest,
        model: noExtName + '.model.json',
        viewBag: noExtName + '.viewbag.json'
      });

      destPaths.push({
        src: files[i].dest,
        dest: files[i].dest
      });
    }

    opt.pages = pages;
    var configFilePath = path.join(globalOptions.tmp, 'config.json');

    utils.safeWriteFile(configFilePath, JSON.stringify(opt));
    razor.parse(configFilePath);

    return destPaths;
  },
  markdown: function(content, options) {
    return markdown.parse(content, options);
  }
};

var defaultWeblerOpts = {
  tmp: '.webler_tmp',
  config: 'Webler.js'
};

function Webler(files, options) {
  if (!options)
    options = {};

  for (var i in defaultWeblerOpts) {
    if (!options[i])
      options[i] = defaultWeblerOpts[i];
  }

  var curFiles = files;
  var pipelineMap = {};
  var pipelineOrder = [];

  function addToPipeline(moduleName, opt) {
    var order = pipelineMap[moduleName];
    if (order != undefined) {
      pipelineOrder[order].options = opt;
    } else {
      pipelineOrder.push({
        type: moduleName,
        options: opt
      });
      pipelineMap[moduleName] = pipelineOrder.length - 1;
    }
  }

  var parsers = {
    build: function(opt) {
      addToPipeline('build', opt);
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
      var razor = pipelineOrder.shift(); //remove razor
      curFiles = modules.razor(curFiles, razor.options, options);
    }

    for (var i in pipelineOrder) {
      var mod = pipelineOrder[i];
      modules[mod]();
    }
    //utils.safeWriteFile(dst, content);
  }

  this.clean = function() {
    utils.deleteFolder(options.tmp);
  }
}


module.exports = {
  weble: function(globs, options) {
    var files = [];
    for (var i in globs) {
      var obj = globs[i];

      var group = glob.sync(obj.src, {
        cwd: obj.cwd
      });

      var cwd = obj.cwd || ''; //use with path.join cannot be undefined

      for (var j in group) {
        var file = group[j];

        files.push({
          src: path.join(cwd, file), //fullpath
          dest: utils.changeFileExt(path.join(obj.dest, file), '.html') //fullpath
        });
      }
    }
    
    return new Webler(files, options);
  },
  execConfig: function(config) {
    var f = require(path.resolve(process.cwd(), 'Webler.js'));
    f.call(this, config);
  }
}
