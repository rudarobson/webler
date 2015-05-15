var ujs = require("uglify-js");
var ccss = require('clean-css');
var sass = require('node-sass');

var fs = require('fs');
var path = require('path');
var utils = require('../../lib/utils/utils');
var time = require('../../lib/utils/time');
var system = require('../../lib/utils/system');
var log = require('../../lib/utils/log');
var os = require('os');

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
  if (!utils.fileExists(generated)) {
    return generated;
  }

  generated = path.join(dir, prefix + '.' + fileName);

  if (!utils.fileExists(generated)) {
    return generated;
  }

  var counter = 0;

  while (utils.fileExists(generated)) {
    generated = generated + '_' + counter;
  }

  return generated;
}

var renderes = {
  scripts: function(files, key, opt, wp, isDebug) {
    var pureScriptsFiles = [];
    var renderedFiles = []
    var destCode = wp.vp.resolveDest(key);

    for (var i in files) {
      var file = files[i];
      var src = wp.vp.resolveSrc(file.src);

      switch (file.type) {
        case 'javascript':
        case 'js':
          if (isDebug) {
            var generatedPath = generateUniquePathInDir(
              utils.changeFileExt(path.basename(destCode), ''),
              path.basename(file.src),
              path.dirname(destCode)
            );

            utils.safeWriteFile(generatedPath, fs.readFileSync(src).toString());
            renderedFiles.push(generatedPath);
          } else {
            pureScriptsFiles.push(src);
          }
          break;
      }
    }

    if (!isDebug) {
      utils.safeWriteFile(destCode, ujs.minify(pureScriptsFiles).code);
      renderedFiles.push(destCode);
    }

    return renderedFiles;
  },
  styles: function(files, key, opt, wp, isDebug) {
    var pureStylesFiles = [];
    var renderedFiles = []
    var tmpFile;
    var destCode = wp.vp.resolveDest(key);
    var curOpt;
    for (var i in files) {
      var file = files[i];
      var src = wp.vp.resolveSrc(file.src);

      switch (file.type) {
        case 'css':
          if (isDebug) {
            var generatedPath = generateUniquePathInDir(
              utils.changeFileExt(path.basename(destCode), ''),
              path.basename(file.src),
              path.dirname(destCode)
            );

            utils.safeWriteFile(generatedPath, fs.readFileSync(src).toString());
            renderedFiles.push(generatedPath);
          } else {
            pureStylesFiles.push(wp.vp.resolveSrc(file.src));
          }

          break;
        case 'sass':
          curOpt = {};
          if (opt.styles && opt.styles.sass)
            utils.mergeObjects(curOpt, opt.styles.sass);
          curOpt.file = wp.vp.resolveSrc(file.src);

          var sassRes = sass.renderSync(curOpt);

          if (isDebug) {
            var generatedPath = generateUniquePathInDir(
              utils.changeFileExt(path.basename(destCode), ''),
              path.basename(utils.changeFileExt(file.src, '.css')),
              path.dirname(destCode)
            );

            utils.safeWriteFile(generatedPath, sassRes.css);
            renderedFiles.push(generatedPath);
          } else {
            tmpFile = wp.tp.write(sassRes.css);
            pureStylesFiles.push(tmpFile);
          }
          break;
      }
    }

    if (!isDebug) {
      var result = new ccss().minify(utils.concatFiles(pureStylesFiles)).styles;
      utils.safeWriteFile(destCode, result);
      renderedFiles.push(destCode);
    }

    return renderedFiles;
  }
};

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

function renderBundle(type, key, wp, isDebug, opt) {
  if (!alreadyRendered[type + '_' + key]) {
    log.verbose.normal('Rendering bundle:[' + type + '] .' + key, 0);
    var bundle = checkBundleAndGetFiles(type, key);

    if (log.dev.isEnabled(0)) {
      log.dev.normal('', 0);
      log.dev.normal('sources:', 0);
      for (var i in bundle.files) {
        log.dev.normal(bundle.files[i].src, 0)
      }
    }

    alreadyRendered[type + '_' + key] = renderes[type](bundle.files, key, opt, wp, isDebug);

    log.verbose.normal('', 0);
  }


  return alreadyRendered[type + '_' + key];
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


    var opt = {};
    utils.mergeObjects(opt, options);

    var obj;
    var vSrc = wp.vp.vSrc();
    var vDest = wp.vp.vDest();
    var pageOptions;
    var tasks = {};

    var match;
    var toReplace = [];
    var htmlDestDir = path.dirname(htmlDest);
    var isDebug = opt.debug || false;

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
  cleanUp: function() {
    alreadyRendered = {};
    alreadyCopiedFiles = {};
  },
  api: {
    bundles: function() {
      return collection;
    }
  }
};
