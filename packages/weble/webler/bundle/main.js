var ujs = require("uglify-js");
var ccss = require('clean-css');
var sass = require('node-sass');
var fs = require('fs');
var path = require('path');
var utils = _wRequire('utils');

var system = _wRequire('system');
var log = wRequire('log');
var weblerScript = wRequire('weblerscript');

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
  },
  copy: {

  }
}

function generateUniquePathInDir(prefix, fileName, dir) {
  var generated = path.join(dir, fileName);
  return generated;
}

function justCopyFiles(files, destCode, ext) {
  var gen = [];
  for (var i in files) {
    var file = files[i];
    var generatedPath = generateUniquePathInDir(
      utils.changeFileExt(path.basename(destCode), ''),
      path.basename(file.src),
      path.dirname(destCode)
    );

    generatedPath = utils.changeFileExt(generatedPath, ext);
    gen.push(generatedPath);
    utils.safeWriteFile(generatedPath, fs.readFileSync(file.temp));
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
  },
  copy: {
    img: function(src, isDebug, opt, wp) {
      return src;
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
  },
  copy: function(files, isDebug, destCode) {
    if (isDebug) {
      return justCopyFiles(files, destCode, path.extname(destCode));
    }
    var f = [];
    for (var i in files)
      f.push(files[i].temp);
    var result = new ccss().minify(utils.concatFiles(f)).styles;
    utils.safeWriteFile(utils.changeFileExt(destCode, '.css'), result);
    return [destCode];
  }
}

/*
 * key is type_destination
 * value is an array of bundled files
 */
var alreadyRendered = {};
var alreadyCopiedFiles = {};
/*
 * @param type is scripts, styles
 * @param key is the destination path
 */
function renderBundle(type, key, wp, isDebug, opt, bundle) {
  var pureScriptsFiles = [];
  var renderedFiles = []
  var destCode = wp.vp.resolveDest(key);


  if (type != 'styles' && type != 'scripts' && type != 'copy') {
    log.error('bundle: ' + type + ' is not supported');
    system.exit(-1);
  }

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
    if (type == 'scripts') {
      switch (files[i].type) {
        case 'js':
        case 'javascript':
          fileType = 'javascript';
          break;
        default:
          fileType = files[i].type;
      }
    } else {
      fileType = files[i].type; //directly match
    }

    if (!(fileType in fileProcessor)) {
      log.error('bundle: ' + type + ' does not support ' + fileType + ' file type at bundle: ' + key);
      system.exit(-1);
    }

    var option = {};
    if (opt && opt[type] && opt[type][fileType])
      option = opt[type][fileType];

    var temp = fileProcessor[fileType](src, isDebug, option, wp);
    toCompress.push({
      src: src,
      temp: temp
    });
  }

  return compressors[type](toCompress, isDebug, destCode);

}

function BundleCollection() {
  this.bundles = {}

  this.add = function(type, key) {
    if (!supportedTypes[type]) {
      log.error('Type: ' + type + ' is not supported!')
      system.exit(-1);
    }

    if (!this.bundles[type])
      this.bundles[type] = {};

    if (this.bundles[type][key])
      return this.bundles[type][key];

    var bundle = new Bundle(type, key);
    this.bundles[type][key] = bundle;
    return bundle;
  }
}

function Bundle(type, key) {
  this.files = [];
  this.type = type;
  this.key = key;
  this.include = function(type, src) {

    this.files.push({
      type: type,
      src: src
    });

    return this;
  }
}

/*
 * @return the new reference to place in html
 */
function addBundleToCollection(collection, wp, type, fileType, vDest, vSrc, htmlSrc, htmlDest, elt) {
  if (!vDest) {
    log.error('missing destination at: ');
    log.normal(elt.serialize());
    log.error('\n parsing: ' + htmlSrc);
  }

  var dest = wp.vp.resolveDest(vDest);
  var src = wp.vp.resolveSrc(vSrc);

  var htmlDestDir = path.dirname(wp.vp.resolveDest(htmlDest));
  var relative = path.relative(htmlDestDir, dest);
  var ref = dest;

  if (!path.isAbsolute(relative))
    ref = relative;
  else {
    log.dev.error('not implemented exception bundles.js absolutePath for debuging')
    system.exit(system.exitCodes.error);
  }

  if (alreadyRendered[type + '_' + dest]) //do not process again
    return;

  if (!type) {
    log.error('missing type at: ' + script.html())
    log.error('\n parsing: ' + htmlSrc);
  }

  if (!src) {
    log.error('missing src at: ' + script.html());
    log.error('\n parsing: ' + htmlSrc);
  }


  collection.add(type, dest).include(fileType, src);

  return ref.replace(/\\/g, '/');
}

module.exports = {
  type: 'stream',
  require: ['$', 'gOptions', 'wp'],
  start: function(resource, options, $, gOptions, wp) {
    var bundleIgnoreAttr = 'bundle-ignore';
    var opt = options;
    var isDebug = gOptions.debug || false;

    var newSassIncludes = [];
    var oldIncludes = opt.styles.sass.includePaths;
    for (var i in oldIncludes) {
      newSassIncludes.push(wp.vp.resolveSrc(oldIncludes[i]));
    }
    opt.styles.sass.includePaths = newSassIncludes;

    var $dom = $(resource.value('dom'));
    var vSrc = wp.vp.vSrc();
    var vDest = wp.vp.vDest();
    var collection = new BundleCollection();
    var first = true;

    $dom.filter('script[bundle]').each(function() {
      if (!this.hasAttribute(bundleIgnoreAttr)) {
        var dest = this.attr('bundle');
        var fileType = this.attr('type');
        var src = this.attr('src');

        if (!src)
          src = dest;
        if (!dest)
          dest = src;

        if (!fileType)
          fileType = 'js';
        else {
          if (/\s*text\/javascript\s*/.test(fileType))
            fileType = 'js';
          else if (/\s*text\/weblerscript\s*/.test(fileType))
            fileType = 'ws';
          else {
            log.error('file type :' + this.getAttribute('type') + ' not supported');
            log.normal(this.serialize());
            system.exit(-1);
          }
        }

        var ref = addBundleToCollection(collection, wp, 'scripts', fileType, dest, src, resource.src(), resource.dest(), this);
        if (this.hasAttribute('type'))
          this.setAttribute('type', 'text/javascript');
        if (isDebug) {
          this.removeAttribute('bundle');
          this.setAttribute('src', ref);
        } else {
          if (first) {
            this.removeAttribute('bundle');
            this.setAttribute('src', ref);
            first = false;
          } else
            this.remove();
        }

      } else {
        this.removeAttribute(bundleIgnoreAttr);
      }
    });

    first = true;

    $dom.filter('link[bundle]').each(function() {
      if (!this.hasAttribute(bundleIgnoreAttr)) {
        var dest = this.attr('bundle');
        var fileType = this.attr('type');
        var src = this.attr('href');

        if (!src)
          src = dest;
        if (!dest)
          dest = src;

        if (!fileType)
          fileType = 'css';
        else {
          if (/\s*text\/css\s*/.test(fileType))
            fileType = 'css';
          else if (/\s*text\/sass\s*/.test(fileType))
            fileType = 'sass';
          else if (/\s*text\/weblerscript\s*/.test(fileType))
            fileType = 'ws';
          else {
            log.error('file type :' + this.getAttribute('type') + ' not supported');
            log.normal(this.serialize());
            system.exit(-1);
          }
        }

        var ref = addBundleToCollection(collection, wp, 'styles', fileType, dest, src, resource.src(), resource.dest(), this);
        if (this.hasAttribute('type'))
          this.setAttribute('type', 'text/css');
        if (isDebug) {
          this.removeAttribute('bundle');
          this.setAttribute('href', ref);
        } else {
          if (first) {
            this.removeAttribute('bundle');
            this.setAttribute('href', ref);
            first = false;
          } else
            this.remove();
        }

      } else {
        this.removeAttribute(bundleIgnoreAttr);
      }
    });

    $dom.filter('img[bundle]').each(function() {
      if (!this.hasAttribute(bundleIgnoreAttr)) {
        var dest;
        var fileType;
        var src;
        var refAttr;
        switch (this.tagName) {
          case 'img':
            refAttr = 'src';
            src = this.attr('src');
            dest = this.attr('bundle');
            if (!src)
              src = dest;
            if (!dest)
              dest = src;
            fileType = 'img';
            break;
          default:
            return;
        }

        var ref = addBundleToCollection(collection, wp, 'copy', fileType, dest, src, resource.src(), resource.dest(), this)
        this.setAttribute(refAttr, ref);
      } else {
        this.removeAttribute(bundleIgnoreAttr);
      }
    })



    var bundles = collection.bundles;
    for (var i in bundles) {
      for (var j in bundles[i]) {
        var bundle = bundles[i][j];
        if (!alreadyRendered[bundle.type + '_' + bundle.key]) {

          var col = bundles[bundle.type];
          log.verbose.normal('Rendering bundle:[' + bundle.type + '] .' + bundle.key, 0);

          if (!col || !col[bundle.key]) {
            var notFoundMessage = 'Bundle ' + bundle.key + ' type: ' + bundle.type + ' not found!';
            system.exitWithMessage(notFoundMessage);
          }

          alreadyRendered[bundle.type + '_' + bundle.key] = renderBundle(bundle.type, bundle.key, wp, isDebug, opt, col[bundle.key]);
        }
      }
    }

    resource.set('dom', $dom[0]);

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
  }
};
