var path = require('path');
var fs = require('fs');

module.exports = function(manager) {
  var cwd = manager.vp.resolveSrc('~package');
  var files = manager.glob({
    cwd: cwd,
    filter: 'isFile'
  }, ['**/*.*']);

  for (var i in files) {
    if (fs.existsSync(files[i]) && !manager.force) {
      manager.log.error('File: ' + files[i] + ' already exists, use --force to overwrite');
    } else {
      manager.mkdirp.sync(path.dirname(files[i]));
      fs.writeFileSync(files[i], fs.readFileSync(path.join(cwd, files[i])));
    }
  }

  manager.mkdirp('src');
  manager.mkdirp('src/components');
  manager.mkdirp('src/layouts');
  manager.mkdirp('src/pages');
}
