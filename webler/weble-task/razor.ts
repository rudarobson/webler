export = function(grunt) {
  var razor = wPackage('razor');

  grunt.registerMultiTask('razor', function() {
    var options = this.options();
    var files = [];
    this.files.forEach(function(file) {
      files.push({
        src: file.src[0],
        dest: file.dest
      });
    });

    razor.start(files,options);
  });
};
