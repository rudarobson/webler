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
  build: function(content, options, src, dst) {
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
    return components.parse(content, options);
  },
  components: function(content, options) {
    return components.parse(content, options);
  },
  razor: function(src, options) {
    var opt = {};

    if (options)
      util.mergeObjects(opt, options);
    opt.src = src;

    return razor.parse(opt);
  },
  markdown: function(content, options) {
    return markdown.parse(content, options);
  }
};

function Webler(src, dst, options) {
  if (!options)
    options = {};

  var content = fs.readFileSync(src).toString();

  var parsers = {
    build: function(opt) {
      if (!opt) {
        opt = options.build || {};
      }
      content = modules.build(content, opt, src, dst);
      return parsers;
    },
    handlebars: function(opt) {
      if (!opt) {
        opt = options.handlebars || {};
      }
      content = modules.handlebars(content, opt, src, dst);
      return parsers;
    },
    components: function(opt) {
      if (!opt) {
        opt = options.components || {};
      }
      content = modules.components(content, opt, src, dst);
      return parsers;
    },
    razor: function(opt) {
      if (!opt) {
        opt = options.razor || {};
      }
      content = modules.razor(content, opt, src, dst);
      return parsers;
    },
    markdown: function(opt) {
      if (!opt) {
        opt = options.markdown || {};
      }
      content = modules.markdown(content, opt, src, dst);
      return parsers;
    }
  }

  this.compile = function() {
    return parsers;
  }

  this.render = function() {
    utils.safeWriteFile(dst, content);
  }
}


module.exports = {
  weble: function(src, dst, options) {
    if (typeof(options) == typeof('')) { //this is the file configuration path
      var f = require(options);
      return f(new Webler(src, dst));
    } else
      return new Webler(src, dst, options);
  }
}
