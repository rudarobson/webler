var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');

function deleteFolder(folder) {
  var files = [];
  if (fs.existsSync(folder)) {
    files = fs.readdirSync(folder);

    files.forEach(function(file, index) {
      var curFolder = path.join(folder, file);
      if (fs.lstatSync(curFolder).isDirectory()) { // recurse
        deleteFolder(curFolder);
      } else { // delete file
        fs.unlinkSync(curFolder);
      }
    });

    fs.rmdirSync(folder);
  }
}

module.exports = {
  mergeObjects: function(obj1, obj2) {
    for (var attrname in obj2) {
      obj1[attrname] = obj2[attrname];
    }
  },
  safeWriteFile: function(dest, content) {
    var dir = path.dirname(dest);

    mkdirp.sync(dir)
    fs.writeFileSync(dest, content);
  },
  deleteFolder: function(folder) {
    deleteFolder(folder);
  },
  changeFileExt: function(fileName, ext) {
    var curExt = path.extname(fileName);
    if (!curExt)
      return fileName;
    return fileName.substr(0, fileName.length - curExt.length) + ext;
  },
  concatFiles: function(srcs) {
    var res = '';

    for (var i in srcs) {
      res += fs.readFileSync(srcs[i]);
    }

    return res;
  },
  resolveGlob: function(src, dest, cwd) {
    var p = {};
    if (cwd) { //using cwd
      p.src = path.join(cwd, src); //fullpath
      p.dest = this.changeFileExt(path.join(dest, src), '.html');
    } else {
      p.src = src;
      p.dest = dest; //no cwd dest path is absolute
    }

    return p;
  },
  fileExists: function(p) {
    return fs.existsSync(p);
  }
};
