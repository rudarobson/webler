export = function(grunt) {
  var child = require('child_process');
  var globule = wRequire('globule');
  var path = require('path');
  var wfs = wRequire('wfs');


  grunt.registerMultiTask('typescript', function() {
    var options = this.options();
    var srcs = [];
    this.files.forEach(function(file) {
      srcs.push(file.src[0]);
    });


    var tsConfig = {
      compilerOptions: {
        module: 'commonjs',
        outDir: 'bundle/typescript',
        rootDir: 'src',
        noImplicitAny: false,
        removeComments: false,
        sourceRoot: 'dest',//all sources will be copied to there, must compute the sourcemap relative to destination path
        sourceMap: true
      },
      files: srcs
    };

    wfs.safeWriteFile('tsconfig.json', JSON.stringify(tsConfig));

    child.exec('tsc', function(error, stderr, stdout) {
      if (error) {
        console.log(stderr);
      }
      console.log(stdout);
    });

  });
};
