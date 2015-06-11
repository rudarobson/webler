var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');

export = {
  safeWriteFile: function(dest, content) {
    var dir = path.dirname(dest);

    mkdirp.sync(dir)
    fs.writeFileSync(dest, content);
  },
}
