export = function(grunt) {
  var fs = require('fs');
  var components = wPackage('components');
  var $ = wRequire('$');

  grunt.registerMultiTask('components', function() {
    var options = this.options();

    this.files.forEach(function(file) {
      var contents = fs.readFileSync(file.src[0]).toString();
      options.srcFile = file.src[0];
      var dom = $.parse(contents);

      components.start(dom, options);
      fs.writeFileSync(file.dest, dom.serialize());
    });
  });
};
