var components = require('../lib/components/components');
var build = require('../lib/build/build');
var handlebars = require('../lib/handlebars/handlebars');
var markdown = require('../lib/markdown/markdown');
var razor = require('node-razor');

var tasker = require('../lib/build/tasker');
var fs = require('fs');
var utils = require('../lib/utils/utils.js');
var path = require('path');

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
  razor: function(content, options, globalOptions, src) {
    var opt = {};
    if (options)
      utils.mergeObjects(opt, options);

    var tmpSrcRazor = path.join(globalOptions.tmp, 'razor.cshtml');
    utils.safeWriteFile(tmpSrcRazor, content);
    opt.src = tmpSrcRazor;

    if (options.model) {
      var tmpModelRazor = path.join(globalOptions.tmp, 'model_razor.json');
      utils.safeWriteFile(tmpModelRazor, JSON.stringify(options.model));
      opt.model = tmpModelRazor;
    }


    return razor.parse(opt);
  },
  markdown: function(content, options) {
    return markdown.parse(content, options);
  }
};

var defaultWeblerOpts = {
  tmp: '.webler_tmp',
  config: 'Webler.js'
};

function Webler(src, dst, options) {
  if (!options)
    options = {};

  for (var i in defaultWeblerOpts) {
    if (!options[i])
      options[i] = defaultWeblerOpts[i];
  }

  var content = fs.readFileSync(src).toString();

  var parsers = {
    build: function(opt) {
      if (!opt)
        opt = {};

      content = modules.build(content, opt, options, src, dst);
      return parsers;
    },
    handlebars: function(opt) {
      if (!opt)
        opt = {};

      content = modules.handlebars(content, opt, options, src, dst);
      return parsers;
    },
    components: function(opt) {
      if (!opt)
        opt = {};

      content = modules.components(content, opt, options, src, dst);
      return parsers;
    },
    razor: function(opt) {
      if (!opt)
        opt = {};

      content = modules.razor(content, opt, options, src);
      return parsers;
    },
    markdown: function(opt) {
      if (!opt)
        opt = {};

      content = modules.markdown(content, opt, options, src, dst);
      return parsers;
    }
  }

  this.compile = function() {
    return parsers;
  }

  this.render = function() {
    utils.safeWriteFile(dst, content);
  }

  this.clean = function() {
    utils.deleteFolder(options.tmp);
  }
}


module.exports = {
  weble: function(src, dst, options) {
    return new Webler(src, dst, options);
  },
  execConfig: function(src, dst, config) {
    var f = require(path.resolve(process.cwd(), 'Webler.js'));
    f.call(this, src, dst, config);
  }
}
