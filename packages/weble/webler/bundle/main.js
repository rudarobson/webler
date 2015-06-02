var ujs = require("uglify-js");
var ccss = require('clean-css');
var sass = require('node-sass');
var fs = require('fs');
var path = require('path');
var utils = _wRequire('utils');
var globule = wRequire('globule');
var system = _wRequire('system');
var log = wRequire('log');
var weblerScript = wRequire('weblerscript');
var dom = wRequire('dom');
function generateRandomPathInDir(dir) {
    var p;
    do {
        p = path.join(dir, (Math.random() * 1000000).toString());
    } while (path.existsSync(p));
    return p;
}
function generateUniquePathInDir(prefix, fileName, dir) {
    var generated = path.join(dir, fileName);
    return generated;
}
function isWeblerScript(type) {
    return /\s*(text\/)?weblerscript\s*/.test(type) || /\s*(text\/)?ws\s*/.test(type);
}
function isJavaScript(type) {
    return /\s*(text\/)?javascript\s*/.test(type) || /\s*(text\/)?js\s*/.test(type);
}
function isSass(type) {
    return /\s*(text\/)?sass\s*/.test(type);
}
function expandFiles(src, type, wp, defaultFileType) {
    var srcs = [];
    if (isWeblerScript(type)) {
        var wsFiles = weblerScript.parse(wp.vp.resolveSrc(src), {
            vSrc: wp.vp.vSrc(),
            vDest: wp.vp.vDest()
        });
        for (var i in wsFiles) {
            srcs.push({
                src: wsFiles[i].src,
                readFrom: wsFiles[i].src,
                type: wsFiles[i].type || type
            });
        }
    }
    else {
        var files = globule.find([wp.vp.resolveSrc(src)], {
            filter: 'isFile'
        });
        for (var j in files) {
            srcs.push({
                type: type,
                src: files[j],
                readFrom: files[j]
            });
        }
    }
    return srcs;
}
function justCopyFiles(files, wp, destCode, ext) {
    var gen = [];
    var destCode = destCode;
    for (var i in files) {
        var fileName = wp.vp.resolveSrc(files[i].src);
        var readFrom = wp.vp.resolveSrc(files[i].readFrom);
        var generatedPath = generateUniquePathInDir(utils.changeFileExt(path.basename(destCode), ''), path.basename(fileName), path.dirname(destCode));
        generatedPath = utils.changeFileExt(generatedPath, ext);
        utils.safeWriteFile(generatedPath, fs.readFileSync(readFrom));
        gen.push(generatedPath);
    }
    return gen;
}
function getRelativeOrAbsoluteReference(htmlDestDir, dest, wp) {
    htmlDestDir = wp.vp.resolveDest(htmlDestDir);
    dest = wp.vp.resolveDest(dest);
    var relative = path.relative(htmlDestDir, dest);
    var ref = dest;
    if (!path.isAbsolute(relative))
        ref = relative;
    else {
        log.dev.error('not implemented exception bundles.js absolutePath for debuging');
        system.exit(system.exitCodes.error);
    }
    return ref.replace(/\\/g, '/');
}
function ScriptsBundle(wp, opt, resource) {
    var markups = [];
    var files = [];
    this.addWithMarkup = function (markup) {
        var type = markup.getAttribute('type');
        var src = markup.getAttribute('src');
        var f = expandFiles(src, type, wp, 'js');
        files = files.concat(f);
        markups.push(markup);
    };
    this.render = function (dest, htmlDestDir, isDebug) {
        dest = wp.vp.resolveDest(dest);
        var refs;
        if (isDebug) {
            refs = justCopyFiles(files, wp, dest, '.js');
        }
        else {
            refs = [dest];
            utils.safeWriteFile(utils.changeFileExt(dest, '.js'), ujs.minify(utils.packProps(files, 'readFrom')).code);
        }
        var markup = markups[0];
        for (var i in refs) {
            var script = dom.Element('script');
            if (markup.hasAttribute('type'))
                script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', getRelativeOrAbsoluteReference(htmlDestDir, refs[i], wp));
            markup.insertBefore(script);
        }
        for (var i in markups)
            markups[i].remove();
    };
}
function StylesBundle(wp, opt, resource) {
    var files = [];
    var markups = [];
    this.addWithMarkup = function (markup) {
        var type = markup.getAttribute('type');
        var src = markup.getAttribute('href');
        if (!src)
            src = markup.getAttribute('bundle');
        var f = expandFiles(src, type, wp, 'css');
        files = files.concat(f);
        markups.push(markup);
    };
    this.render = function (dest, htmlDestDir, isDebug) {
        dest = wp.vp.resolveDest(dest);
        for (var i in files) {
            if (isSass(files[i].type)) {
                var curOpt = {};
                if (opt.sass)
                    utils.mergeObjects(curOpt, opt.sass);
                curOpt.file = wp.vp.resolveSrc(files[i].src);
                curOpt.importer = function (url, prev, done) {
                    resource.addDependency(prev);
                };
                var sassRes = sass.renderSync(curOpt);
                files[i].readFrom = wp.tp.write(sassRes.css, files[i].src);
            }
        }
        var refs;
        if (isDebug) {
            refs = justCopyFiles(files, wp, dest, '.css');
        }
        else {
            refs = [dest];
            var result = new ccss().minify(utils.concatFiles(utils.packProps(files, 'readFrom'))).styles;
            utils.safeWriteFile(utils.changeFileExt(dest, '.css'), result);
        }
        var markup = markups[0];
        for (var i in refs) {
            var link = dom.Element('link', true); //self closing
            if (markup.hasAttribute('type'))
                link.setAttribute('type', 'text/css');
            if (markup.hasAttribute('rel'))
                link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', getRelativeOrAbsoluteReference(htmlDestDir, refs[i], wp));
            markup.insertBefore(link);
        }
        for (var i in markups)
            markups[i].remove();
    };
}
function ImgBundle(wp, resource) {
    var files = [];
    var markups = [];
    this.addWithMarkup = function (markup) {
        var src = markup.getAttribute('src');
        markups.push(markup);
        var f = expandFiles(src, undefined, wp, null);
        files = files.concat(f);
    };
    this.render = function (dest, htmlDestDir, isdebug) {
        dest = wp.vp.resolveDest(dest);
        justCopyFiles(files, wp, dest, path.extname(dest));
        for (var i in markups)
            markups[i].setAttribute('src', wp.vp.resolveDest(dest));
    };
}
function CopyBundle(wp, resource) {
    var files = [];
    var markups = [];
    this.addWithMarkup = function (markup) {
        var src = markup.getAttribute('src');
        markups.push(markup);
        var f = expandFiles(src, undefined, wp, null);
        files = files.concat(f);
    };
    this.render = function (dest, htmlDestDir, isdebug) {
        dest = wp.vp.resolveDest(dest);
        justCopyFiles(files, wp, dest, path.extname(dest));
        for (var i in markups)
            markups[i].remove();
    };
}
var alreadyRendered = {};
var alreadyCopiedFiles = {};
function renderBundles(bundles, htmlDestDir, isDebug) {
    for (var i in bundles) {
        bundles[i].bundle.render(bundles[i].dest, htmlDestDir, isDebug);
    }
}
function createBundleFromElement(bundles, elt, wp, opt, resource) {
    var key;
    var type;
    var src;
    var bundle;
    switch (elt.tagName) {
        case 'script':
            var dest = elt.getAttribute('bundle');
            if (!dest)
                dest = elt.getAttribute('src');
            key = 'scripts_' + dest;
            if (!bundles[key]) {
                bundles[key] = {
                    bundle: new ScriptsBundle(wp, opt.scripts, resource),
                    dest: dest
                };
            }
            bundle = bundles[key].bundle;
            break;
        case 'img':
            var dest = elt.getAttribute('bundle');
            if (!dest)
                dest = elt.getAttribute('src');
            key = 'img_' + dest;
            if (!bundles[key]) {
                bundles[key] = {
                    bundle: new ImgBundle(wp, resource),
                    dest: dest
                };
            }
            bundle = bundles[key].bundle;
            break;
        case 'bundle':
            var dest = elt.getAttribute('dest');
            if (!dest)
                dest = elt.getAttribute('src');
            key = 'copy_' + dest;
            if (!bundles[key]) {
                bundles[key] = {
                    bundle: new CopyBundle(wp, resource),
                    dest: dest
                };
            }
            bundle = bundles[key].bundle;
            break;
        case 'link':
            var dest = elt.getAttribute('bundle');
            if (!dest)
                dest = elt.getAttribute('href');
            key = 'styles_' + dest;
            if (!bundles[key]) {
                bundles[key] = {
                    bundle: new StylesBundle(wp, opt.styles, resource),
                    dest: dest
                };
            }
            bundle = bundles[key].bundle;
            break;
    }
    bundle.addWithMarkup(elt);
}
module.exports = {
    type: 'stream',
    require: ['$', 'gOptions', 'wp'],
    start: function (resource, options, $, gOptions, wp) {
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
        var first = true;
        var placedTags = {
            scripts: {},
            styles: {}
        };
        var bundles = {};
        $dom.filter('script[bundle],script[src^="~"],link[bundle],link[href^="~"],img[bundle],img[src^="~"],bundle').each(function () {
            if (!this.hasAttribute(bundleIgnoreAttr)) {
                createBundleFromElement(bundles, this, wp, opt, resource);
            }
            else {
                this.removeAttribute(bundleIgnoreAttr);
            }
        });
        var htmlDestDir = path.dirname(wp.vp.resolveDest(resource.dest()));
        renderBundles(bundles, htmlDestDir, isDebug);
        resource.set('dom', $dom[0]);
    },
    setup: function () {
        wRequire('$').voidElements.push('bundle'); //add additional void element
    },
    config: {
        styles: {
            sass: {
                includePaths: []
            }
        }
    },
    cleanUp: function () {
        alreadyRendered = {};
        alreadyCopiedFiles = {};
    }
};
