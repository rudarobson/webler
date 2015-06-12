require('../app/core/bootstrap');
var fs = require('fs');
var path = require('path');

function weble(opt: Webler.CommandLine.WebleOptions) {
  var globule = wRequire('globule');

  if (fs.existsSync(path.join(process.cwd(), 'weble.js'))) {
    var config: Webler.WebleOptions = require(path.join(process.cwd(), 'weble'));
    require('../webler').weble(config);
  } else
    console.log('webler config file not found');
}

function watch(argv) {
  require('./watch')(argv);
}

export = {
  weble: weble,
  watch: watch
}
