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

function init(argv) {
  var wfs = wRequire('wfs');
  if(!fs.existsSync('weble.js')){
    wfs.safeWriteFile('weble.js', fs.readFileSync(path.join(path.dirname(require.resolve('./launcher')), 'init', 'weble.js')));
    var mkdirp = require('mkdirp');
    mkdirp.sync(path.join('src','_webler','components'));
    mkdirp.sync(path.join('src','_webler','layouts'));
  }
}

export = {
  weble: weble,
  watch: watch,
  init: init
}
