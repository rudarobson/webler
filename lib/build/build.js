var fs = require('fs');
var minTypes = require('./types');
var path = require('path');
var blocksParser = require('./blocks');
var utils = require('../utils/utils');

var contexts = {};

var gruntTargets = {};

function _parsePageOptionsAndUpdateContent(content) {
  var pageOptions = /<!--\s*build\s*\*\s*options\s*(.*?)\s*-->/; //page options
  var pageMatch = pageOptions.exec(content);
  var pageOptions = {};
  if (pageMatch) {
    pageOptions = JSON.parse(pageMatch[1]);
    content = content.replace(pageMatch[0], '');
  }

  return {
    content: content,
    options: pageOptions
  };
}

function _parseCustomRelativePathAndUpdateContent(content) {
  var customRelativePath = /<!--\s*build\s*\*\s*cwd\s*(.*?)\s*-->/; //relative directory changed
  var relMatch = customRelativePath.exec(content);
  var dir = null;
  if (relMatch) {
    dir = relMatch[1];
    content = content.replace(relMatch[0], '');
  }

  return {
    content: content,
    dir: dir
  }
}

function _parseOptions(block, options, pageOptions) {
  var opt = {};
  if (options[block.type])
    utils.mergeObjects(opt, options[block.type]);

  if (pageOptions[block.type])
    utils.mergeObjects(opt, pageOptions[block.type]);

  utils.mergeObjects(opt, block.options);

  return opt;
}

function applyOptionsToFiles(files, target, opt, srcDir, destDir, srcRoot, dstRoot) {
  var dest;
  if (target[0] == '/') { //it's absolute to dstRoot
    dest = path.join(dstRoot, target);
  } else
    dest = path.join(destDir, target);
  var sources = [];

  for (var i in files) {
    file = files[i];
    if (file[0] != '/') //is relative to current parsing file
      file = path.join(srcDir, file);
    else {
      if (!srcRoot) { //is relative .html to root, must be supplied
        console.log('srcRoot wasn\'t provided');
        throw 'srcRoot wasn\'t provided';
      }
      file = path.join(srcRoot, file);
    }

    sources.push(file);
  }

  return {
    dest: dest,
    sources: sources,
    options: opt
  }
}

var buildApi = {
  /*
   * @param options {
   * 			srcRoot:'string',
   *			dstRoot:'string',
   * }
   */
  parse: function(content, opts, src, dest) {
    var options = {
      runAll: true
    };

    if (opts)
      utils.mergeObjects(options, opts);

    var obj;
    var blocks = blocksParser(content, options);
    var srcDir = path.dirname(src);
    var destDir = path.dirname(dest);
    var pageOptions;
    var tasks = {};

    obj = _parseCustomRelativePathAndUpdateContent(content);
    if (obj.dir)
      srcDir = obj.dir
    content = obj.content;

    obj = _parsePageOptionsAndUpdateContent(content);
    pageOptions = obj.options;
    content = obj.content;

    for (var i in blocks) {
      var opt = _parseOptions(blocks[i], options, pageOptions);

      var newValue = minTypes.render(blocks[i].type, blocks[i].target);
      content = content.replace(blocks[i].fullSpan, newValue);

      var newSrcDir = srcDir;
      if (blocks[i].relativePath)
        newSrcDir = blocks[i].relativePath;

      var files = minTypes.getFiles(blocks[i].type, blocks[i].content);
      obj = applyOptionsToFiles(files, blocks[i].target, opt, newSrcDir, destDir, options.srcRoot, options.dstRoot);

      if (!tasks[blocks[i].type])
        tasks[blocks[i].type] = {};

      tasks[blocks[i].type][obj.dest] = obj;
    }

    return {
      content: content,
      tasks: tasks
    };
  }
};

module.exports = buildApi;
