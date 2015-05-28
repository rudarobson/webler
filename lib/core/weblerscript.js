var log = wRequire('log');
var system = _wRequire('system');
var path = require('path');
var fs = require('fs');
var vpCreator = _wRequire('vp');

var wsRegex = function() {
  return /@import[\s]*?['"]([\s\S]*?)['"][\s]*?([^;]*?)\s*?;/g;
};

module.exports = {
  parse: function(source, opt) {
    if (!opt)
      opt = {};
    var includes = opt.includes;
    var vp = vpCreator(opt.vSrc, opt.vDest);
    source = vp.resolveSrc(source);

    if (!includes)
      includes = [];

    if (includes.constructor == Array) {
      if (includes.length > 0) {
        log.error('Multiple path include references not supported');
        system.exit(-1);
      }
    } else {
      includes = [includes];
    }

    includes.splice(0, 0, path.dirname(source)); //ws source

    var imports = fs.readFileSync(source).toString();
    var match;
    var regex = wsRegex();
    var files = [];

    while ((match = regex.exec(imports))) {

      var src = vp.resolveSrc(match[1]);

      if (/^\.?\.?\//.test(src)) { //relative
        var found = false;
        var type = match[2];
        if (type)
          type = type.trim();

        for (var i in includes) {
          log.verbose.normal('looking for: ' + src + ' at ' + includes[i]);
          var fullName = path.join(vp.resolveSrc(includes[i]), src);
          if (fs.existsSync(fullName)) {
            found = true;
            files.push({
              src: fullName,
              type: type
            });
            break;
            log.verbose.normal('found : ' + src + ' at ' + includes[i]);
          }
        }

        if (!found) {
          log.error('file: ' + src + ' not found');
        }
      } else {
        if (fs.existsSync(src)) {
          files.push({
            type: type,
            src: src
          });
        }else
          log.error('file: ' + src + ' not found');
        
      }
    }

    return files;
  }
}
