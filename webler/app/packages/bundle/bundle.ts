var path = require('path');
var $: Dom.$Static = wRequire('$');
var cleanCss = require('clean-css');
var uglifyJs = require('uglify-js');
var fs = require('fs');
var wfs = wRequire('wfs');
var sourcemap = <Webler.SourceMap> wRequire('sourcemap');


function generateProductionFileName() {
  return (Math.random() * 100000).toString();
}
function concatFiles(toConcat: string[]) {
  var str = '';
  for (var i in toConcat) {
    str += fs.readFileSync(toConcat[i]).toString();
  }

  return str;
}

interface BundleMap {
  [type: string]:
  {
    [destination: string]: {
      fileResults: Bundle.FileMapResult[],
      eltsToReplace: {
        toRemove: Dom.Markup[],
        toInsert: Dom.Markup[]
      }
    }
  };
}

interface FileHandlerMap {
  [type: string]: Bundle.FileHandler;
}

var typeFileSolvers = {
  scripts: <FileHandlerMap>{},
  styles: <FileHandlerMap>{},
  img: <FileHandlerMap>{}
};


var alreadyBundled: {
  [type: string]:
  {
    [destination: string]: boolean;
  };
} = {
    scripts: {},
    styles: {},
    img: {}
  };


export = <Bundle.Bundler> {
  addImgFileSolver: function(handler: Bundle.FileHandler) {
    typeFileSolvers.img['img'] = handler;
  },
  addScriptsFileSolver: function(type: string, handler: Bundle.FileHandler) {
    if (typeFileSolvers[type]) {
      console.log('Type ' + type + ' already registered in Scripts.');
      process.exit(-1);
    }

    typeFileSolvers.scripts[type] = handler;
  },
  addStylesFileSolver: function(type: string, handler: Bundle.FileHandler) {
    if (typeFileSolvers.styles[type]) {
      console.log('Type ' + type + ' already registered in styles.');
      process.exit(-1);
    }

    typeFileSolvers.styles[type] = handler;
  },
  start: function(config: Webler.WeblePackageOptions) {
    var srcsFiles: Webler.WFile[] = config.files;
    var destCwd: string = config.destCwd;
    var options: Bundle.Config = config.options;
    var gOptions: Webler.GOptions = config.gOptions;

    srcsFiles.forEach(function(srcFile) {
      var dom: Dom.Document = $.parse(fs.readFileSync(srcFile.fullPath()).toString());

      var comments = $.findBlockComments(dom, 'bundle:', '/bundle');
      var regex = /<!--\s*bundle:\s*([\s\S].*?)\s*-->/;
      var bundles: BundleMap = {
        styles: {},
        scripts: {},
        img: {}
      };

      for (var i in comments) {

        var match = regex.exec(comments[i].open.content);

        var srcAttribute;
        var type;
        var bundleType;
        var setAttrs = <any> {};
        var fileExt;
        var dest = match[1].trim();

        var allFiles: Bundle.FileMapResult[][] = [];
        var commonTagName = undefined;
        var firstElementChild: Dom.Element = undefined;

        for (var j in comments[i].children) {

          var child = <any>comments[i].children[j];

          if (child.type != $.markupTypes.element) {
            child.remove();
            continue;
          }

          if (!firstElementChild)
            firstElementChild = child;

          if (!commonTagName) {
            commonTagName = child.tagName;

            switch (child.tagName) {
              case 'link':
                bundleType = 'styles';
                srcAttribute = 'href';
                setAttrs.type = 'text/css';
                setAttrs.rel = 'stylesheet';
                fileExt = '.css';
                break;
              case 'script':
                bundleType = 'scripts';
                srcAttribute = 'src';
                setAttrs.type = 'text/javascript';
                fileExt = '.js';
                break;
            }

          } else if (child.tagName != commonTagName) {
            console.log('file: ' + srcFile);
            console.log('Mixing types on bundle ' + child.serialize());
            process.exit(-1);
          }

          type = child.getAttribute('type');
          type = type.replace('text/', '');//sass or css
          if (!typeFileSolvers[bundleType][type]) {
            console.log('File Solver not found for ' + type);
            process.exit(-1);
          }

          var res: Bundle.FileMapResult[] = typeFileSolvers[bundleType][type](child.getAttribute(srcAttribute));

          if (!gOptions.production) {

            for (var k in res) {
              var file = res[k];

              var newElt = <Dom.Element>(<Dom.Markup>child).cloneNode();

              var relativePath = path.relative(path.dirname(srcFile.src()), file.result.src());

              setAttrs[srcAttribute] = relativePath.replace(/\\/g, '/');
              for (var o in setAttrs)
                newElt.setAttribute(o, setAttrs[o]);

              comments[i].open.insertBefore(newElt);
              config.additionalFiles.push(file.result)

              //wfs.safeWriteFile(path.join(destCwd, file.result.src()), fs.readFileSync(file.result.fullPath()).toString());

              if (file.map) {
                var smap = sourcemap.getMap(file.map.fullPath());

                var resultBasePath = path.dirname(file.result.src());

                for (var z in smap.sources) {
                  var srcPath = path.dirname(file.map.fullPath());
                  srcPath = path.resolve(srcPath, smap.sources[z]);
                  srcPath = path.relative('./', srcPath);

                  var srcFileName = path.basename(smap.sources[z]);

                  wfs.safeWriteFile(path.join(destCwd, resultBasePath, srcFileName), fs.readFileSync(srcPath).toString());
                  config.additionalFiles.push(Webler.wFile(destCwd, path.join(resultBasePath, srcFileName)));

                }
                sourcemap.flattenSources(smap, resultBasePath);
                var destMapFile = path.basename(file.map.src());
                wfs.safeWriteFile(path.join(destCwd, resultBasePath, destMapFile), JSON.stringify(smap));
                config.additionalFiles.push(Webler.wFile(destCwd, path.join(resultBasePath, destMapFile)));
              }
            }
          } else {
            allFiles.push(res);
          }

          child.remove();
        }

        if (gOptions.production && firstElementChild) {
          var newElt = <Dom.Element>(<Dom.Markup>firstElementChild).cloneNode();
          setAttrs[srcAttribute] = path.relative(path.dirname(srcFile.src()), dest).replace(/\\/g, '/');;

          for (var k in setAttrs)
            newElt.setAttribute(k, setAttrs[k]);

          comments[i].open.insertBefore(newElt);

          var toBundle = [];
          for (var k in allFiles) {
            for (var l in allFiles[k]) {
              toBundle.push(allFiles[k][l].result.fullPath());
            }
          }

          switch (bundleType) {
            case 'styles':
              var bundled = new cleanCss().minify(concatFiles(toBundle));
              wfs.safeWriteFile(path.join(destCwd, dest), bundled.styles);
              config.additionalFiles.push(Webler.wFile(destCwd, dest));
              break;
            case 'scripts':
              var bundled = uglifyJs.minify(toBundle);
              wfs.safeWriteFile(path.join(destCwd, dest), bundled.code);
              config.additionalFiles.push(Webler.wFile(destCwd, dest));
              break;
          }
        }

        comments[i].open.remove();
        comments[i].close.remove();
      }


      //imags do not need comments
      /*$(dom).filter('img').each(function() {
        var filesResult = typeFileSolvers.img['img']([this.getAttribute('src')]);

        wfs.safeWriteFile(
          path.join(destCwd, this.getAttribute('src')),
          fs.readFileSync(filesResult[0].result.fullPath())
          );
      });*/

      wfs.safeWriteFile(path.join(destCwd, srcFile.src()), dom.serialize());
      srcFile.setCWD(destCwd);
    });
  }
};
