var ujs = require("uglify-js");
var ccss = require('clean-css');
var sass = require('node-sass');

var fs = require('fs');
var path = require('path');
var utils = require('../../../../lib/utils/utils');
var time = require('../../../../lib/utils/time');
var system = require('../../../../lib/utils/system');
var log = require('../../../../lib/utils/log');
var os = require('os');
var weblerScript = require('../../../../lib/weblerscript');

var supportedTypes = {
  scripts: {
    javascript: true,
    js: true,
    ts: true,
    typescript: true
  },
  styles: {
    sass: true,
    css: true
  }
}

var collection = new BundleCollection();

var bundleRegex = {
  scripts: function() {
    return /<script[\s\S]*?src=['"](~[^"'<>]+)["'][\s\S]*?>.*?<[\s\S]*?\/[\s\S]*?script[\s\S]*?>/g;
  },
  styles: function() {
    return /<link[\s\S]*?href=['"](~[^"'<>]+)["'][\s\S]*?\/?>/g;
  }
};

var copyBundleRegex = {
  img: function() {
    return /<img[\s\S]*?src=['"](~[^"'<>]+)["'][\s\S]*?\/?>/g;
  }
};

function justCopyFiles(files, destCode, ext) {
  var gen = [];
  for (var i in files) {
    var file = files[i];
    var generatedPath = generateUniquePathInDir(
      utils.changeFileExt(path.basename(destCode), ''),
      path.basename(file.src),
      path.dirname(destCode)
    );

    gen.push(generatedPath);
    utils.safeWriteFile(utils.changeFileExt(generatedPath, ext), fs.readFileSync(file.tmp));
  }
  return gen;
}


var processors = {
  scripts: {
    javascript: function(src) {
      return src;
    }
  },
  styles: {
    css: function(src) {
      return src;
    },
    sass: function(src, isDebug, opt, wp) {
      var curOpt = {};
      if (opt)
        utils.mergeObjects(curOpt, opt);

      curOpt.file = wp.vp.resolveSrc(src);

      var sassRes = sass.renderSync(curOpt);

      return wp.tp.write(sassRes.css);
    }
  }
}


var compressors = {
  scripts: function(files, isDebug, destCode) {
    if (isDebug) {
      return justCopyFiles(files, destCode, '.js');
    }
    var f = [];
    for (var i in files)
      f.push(files[i].temp);
    utils.safeWriteFile(utils.changeFileExt(destCode, '.js'), ujs.minify(f).code);
    return [destCode];

  },
  styles: function(files, isDebug, destCode) {
    if (isDebug) {
      return justCopyFiles(files, destCode, '.css');
    }
    var f = [];
    for (var i in files)
      f.push(files[i].temp);
    var result = new ccss().minify(utils.concatFiles(f)).styles;
    utils.safeWriteFile(utils.changeFileExt(destCode, '.css'), result);
    return [destCode];
  }
}

var copyRenderer = function(ref, wp, isDebug) {
  var filePath = wp.vp.resolveDest(ref);
  var src = wp.vp.resolveSrc(ref);
  if (utils.fileExists(src)) {
    utils.safeWriteFile(filePath, fs.readFileSync(src));
  } else {
    log.error('File not found: ' + src + ' when processing: ' + ref);
  }
  alreadyCopiedFiles[ref] = filePath;
  return filePath;
};

function checkBundleAndGetFiles(type, key) {
  var notFoundMessage = 'Bundle ' + key + ' type: ' + type + ' not found!';
  var col = collection.bundles[type];

  if (!col || !col[key])
    system.exitWithMessage(notFoundMessage);

  return col[key];
}

var alreadyRendered = {};
var alreadyCopiedFiles = {};
/*
 * @param type is scripts, styles
 * @param key is the destination path
 */
function renderBundle(type, key, wp, isDebug, opt) {
  var pureScriptsFiles = [];
  var renderedFiles = []
  var destCode = wp.vp.resolveDest(key);

  if (!alreadyRendered[type + '_' + key]) {


    if (type != 'styles' && type != 'scripts') {
      log.error('bundle: ' + type + ' is not supported');
      system.exit(-1);
    }

    log.verbose.normal('Rendering bundle:[' + type + '] .' + key, 0);
    var bundle = checkBundleAndGetFiles(type, key);

    if (log.dev.isEnabled(0)) {
      log.dev.normal('', 0);
      log.dev.normal('sources:', 0);
      for (var i in bundle.files) {
        log.dev.normal(bundle.files[i].src, 0);
      }
    }

    var files = bundle.files;

    var defaultFileType;
    switch (type) {
      case 'scripts':
        defaultFileType = 'javascript';
        break;
      case 'styles':
        defaultFileType = 'css';
        break;
    }
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.type == 'ws' || file.type == 'weblerscript') { //expand the webler script
        var srcs = weblerScript.parse(file.src, {
          vSrc: wp.vp.vSrc(),
          vDest: wp.vp.vDest()
        });

        files.splice(i, 1);

        for (var j in srcs) {
          files.splice(i, 0, srcs[j]);
          if (!srcs[j].type)
            srcs[j].type = defaultFileType;
        }
        i += srcs.length; //skip files added
      }
    }

    var toCompress = [];

    for (var i in files) {
      var file = files[i]; //file.type is css,sass, javascript etc...
      var src = wp.vp.resolveSrc(file.src);

      var fileProcessor = processors[type];
      var fileType;
      switch (files[i].type) {
        case 'js':
        case 'javascript':
          fileType = 'javascript';
          break;
        default:
          fileType = files[i].type;
      }

      if (!fileProcessor[fileType]) {
        log.error('bundle: ' + type + ' does not support ' + fileType + ' file type at bundle: ' + key);
        system.exit(-1);
      }


      var option = {};
      if (opt && opt[type] && opt[type][fileType])
        option = opt[type][fileType];

      var temp = fileProcessor[fileType](src, isDebug, option, wp);
      toCompress.push({
        old: src,
        temp: temp
      });
    }


    alreadyRendered[type + '_' + key] = compressors[type](toCompress, isDebug, destCode);
    log.verbose.normal('', 0);
  }

  return alreadyRendered[type + '_' + key];
}

function BundleCollection() {
  this.bundles = {}

  this.add = function(type, key) {
    if (!supportedTypes[type])
      system.exitWithMessage('Type: ' + type + ' is not supported!');

    var bundle = new Bundle(type, key);

    if (!this.bundles[type])
      this.bundles[type] = {};

    this.bundles[type][key] = bundle;

    return bundle;
  }
}

function Bundle(type, key) {
  this.files = [];
  this.type = type;
  this.key = key;
  this.include = function(type, src) {
    if (!type)
      type = 'js';

    this.files.push({
      type: type,
      src: src
    });

    return this;
  }
}

function defineReference(type, htmlDestDir, tag, destRef, wp, isDebug, generatedFiles) {
  if (isDebug) {
    var tags = '';

    for (var i in generatedFiles) {
      var filePath = generatedFiles[i];
      var relPath = path.relative(htmlDestDir, filePath);
      var ret;
      if (path.isAbsolute(relPath)) { //cannot be replace by a relative path
        log.dev.error('not implemented exception bundles.js absolutePath for debuging')
        system.exit(system.exitCodes.error);
      } else { //can be replace by a relative path
        ret = relPath;
      }

      var ref = ret.replace(/\\/g, '/');
      tags += tag.replace(destRef, ref) + os.EOL
    }

    return tags;
  } else {
    var relPath = path.relative(htmlDestDir, wp.vp.resolveDest(destRef))
    var ret;
    if (path.isAbsolute(relPath)) { //cannot be replace by a relative path
      ret = '/' + wp.vp.trim(destRef);
    } else { //can be replace by a relative path
      ret = relPath;
    }

    var ref = ret.replace(/\\/g, '/');
    return tag.replace(destRef, ref);
  }
}

function generateUniquePathInDir(prefix, fileName, dir) {
  var generated = path.join(dir, fileName);
  return generated;
}

module.exports = {
  type: 'stream',
  start: function(input, wManager) {
    log.verbose.normal('Bundling...');
    log.verbose.normal('');

    var content = wManager.convert(input, 'string');
    var options = wManager.options;
    var wp = wManager.wp;
    var htmlDest = input.wFile.dest;


    var opt = wManager.options;

    var newSassIncludes = [];
    var oldIncludes = opt.styles.sass.includePaths;
    for (var i in oldIncludes) {
      newSassIncludes.push(wp.vp.resolveSrc(oldIncludes[i]));
    }
    opt.styles.sass.includePaths = newSassIncludes;

    var obj;
    var vSrc = wp.vp.vSrc();
    var vDest = wp.vp.vDest();
    var pageOptions;
    var tasks = {};

    var match;
    var toReplace = [];
    var htmlDestDir = path.dirname(htmlDest);
    var isDebug = wManager.gOptions.debug || false;

    for (var i in bundleRegex) {
      var regex = bundleRegex[i]();
      while ((match = regex.exec(content))) {
        var generatedFiles = renderBundle(i, match[1], wp, isDebug, opt);
        var newRef = defineReference(i, htmlDestDir, match[0], match[1], wp, isDebug, generatedFiles);

        toReplace.push({
          old: match[0],
          new: newRef
        });
      }
    }

    for (var i in copyBundleRegex) {
      var regex = copyBundleRegex[i]();

      while ((match = regex.exec(content))) {
        var copiedFilePath;
        if (!alreadyCopiedFiles[match[1]]) {
          log.verbose.normal('Copying [' + i + '] .' + match[1], 0);
          copyRenderer(match[1], wp, isDebug);
        }
        copiedFilePath = alreadyCopiedFiles[match[1]];

        var newRef = path.relative(htmlDestDir, copiedFilePath);
        if (path.isAbsolute(newRef)) { //cannot be replace by a relative path
          throw 'absolute not yet implemented'
        }

        var newTag = match[0].replace(match[1], newRef); // defineReference(i, htmlDestDir, , match[1], wp, false, generatedFiles);//isDebug is always false

        toReplace.push({
          old: match[0],
          new: newTag
        });
      }
    }


    for (var i in toReplace) {
      content = content.replace(toReplace[i].old, toReplace[i].new);
    }

    input.type = 'string';
    input.value = content;
  },
  config: {
    styles: {
      sass: {
        includePaths: []
      }
    }
  },
  cleanUp: function() {
    alreadyRendered = {};
    alreadyCopiedFiles = {};
    collection = new BundleCollection();
  },
  api: {
    bundles: function() {
      return collection;
    }
  }
};
