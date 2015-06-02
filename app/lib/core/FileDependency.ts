var fs = require('fs');
var utils: Utils = _wRequire('utils');

function FileDependency(path: string) {

  this.dependencies = {};

  this.add = function(dep: string) {
    this.dependencies[dep] = true;
  }
}


var deps: { [id: string]: FileDependency } = {};


function FileManager(path: string) {

  this.get = function(p: string): FileDependency {
    if (!deps[p]) {
      deps[p] = new FileDependency(p);
    }
    return deps[p];
  }

  this.persist = function() {
    utils.safeWriteFile(path, JSON.stringify(deps));
  }

  if (fs.existsSync(path)) {
    var js = JSON.parse(fs.readFileSync(path));
    for (var i in js) {
      var fdep = this.get(i);
      for (var j in js[i].dependencies)
        fdep.add(j);
    }
  }
  console.log(deps);
}

export = {
  create: function(path: string) {
    return new FileDependency(path);
  },
  manager: function(path: string) {
    return new FileManager(path);
  }
};
