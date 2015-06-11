export = function(grunt) {
  var fs = require('fs');
  var bundle = wPackage('bundle');
  var $ = wRequire('$');
  var globule = wRequire('globule');
  var path = require('path');

  var javascriptFilePath = 'src';
  var typescriptFilePath = 'bundle/typescript';
  var cssFilePath = 'src';
  var sassFilePath = 'bundle/sass';

  var vp = wRequire('wvp');

  bundle.addStylesFileSolver('css', function(pattern): Bundle.FileMapResult[] {
    var files = globule.find(pattern, {
      cwd: cssFilePath,
      filter: 'isFile'
    });

    var res: Bundle.FileMapResult[] = [];
    for (var i in files) {
      res.push({
        map: undefined,
        result: Webler.wFile(cssFilePath, files[i])
      })
    }
    return res;
  });

  /*bundle.addStylesFileSolver('sass', function(pattern): Bundle.FileResult {

    var files = globule.find(pattern, {
      cwd: sassFilePath,
      filter: 'isFile'
    });

    var res = [];
    for (var i in files) {
      res.push({
        map: files[i].replace('.scss', '.css') + '.map',
        result: files[i].replace('.scss', '.css')
      })
    }

    return {
      files: res,
      cwd: sassFilePath
    };
  });

  bundle.addScriptsFileSolver('javascript', function(pattern): Bundle.FileResult {
    var files = globule.find(pattern, {
      cwd: javascriptFilePath,
      filter: 'isFile'
    });

    var res = [];
    for (var i in files) {
      res.push({
        map: undefined,
        result: files[i]
      })
    }
    return {
      files: res,
      cwd: javascriptFilePath
    };
  });

  bundle.addScriptsFileSolver('typescript', function(pattern): Bundle.FileResult {
    var files = globule.find(pattern, {
      cwd: typescriptFilePath,
      filter: 'isFile'
    });

    var res = [];
    for (var i in files) {
      res.push({
        map: files[i].replace('.ts', '.js') + '.map',
        result: files[i].replace('.ts', '.js')
      })
    }

    return {
      files: res,
      cwd: typescriptFilePath
    };
  });*/

  grunt.registerMultiTask('bundle', function() {
    var options = this.options();

    this.files.forEach(function(file) {


      options.htmlDestDir = path.dirname(file.dest);

      bundle.start(file.src[0], file.dest, options);

    });
  });
};
