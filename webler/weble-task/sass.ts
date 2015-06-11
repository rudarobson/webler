export = function(grunt) {
  var sass = require('node-sass');
  var globule = wRequire('globule');
  var path = require('path');
  var wfs = wRequire('wfs');


  grunt.registerMultiTask('sass', function() {
    var options = this.options();

    this.files.forEach(function(file) {
      var render = sass.renderSync({
        file: file.src[0],
        outFile: file.dest.replace('bundle/', ''),//remove first bundle
        sourceMap: true
      });


      wfs.safeWriteFile(file.dest, render.css);
      wfs.safeWriteFile(file.dest + '.map', render.map);
    });
  });
};
