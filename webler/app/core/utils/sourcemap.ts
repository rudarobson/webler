var fs = require('fs');
var path = require('path');
export = <Webler.SourceMap>{
  getMap: function(file: string) {
    return JSON.parse(fs.readFileSync(file).toString());
  },
  flattenSources: function(map: any, dir: string) {
    if (typeof (map) == typeof (''))
      map = JSON.parse(fs.readFileSync(map).toString());
    for (var i in map.sources) {
      map.sources[i] = path.basename(map.sources[i]);
    }
    map.sourceRoot = 'dir';

    return map;
  }
}
