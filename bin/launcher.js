require('../lib/core/bootstrap_global');

function weble(argv) {
  var config = argv._[0];

  var webler = require('webler');
  var path = require('path');

  var f = require(path.resolve(process.cwd(), 'webler.js'));

  if (!config)
    config = 'develop';

  f[config](webler);
}

function init(argv) {
  var path = require('path');
  var fs = require('fs');
  var glob = require('globule');
  var log = wRequire('log');
  var utils = _wRequire('utils');
  var system = _wRequire('system');
  var vpCreator = _wRequire('vp');

  var name = (argv.length > 0) ? _[0] : undefined;
  var userName = (argv.length > 1) ? _[1] : 'webler';
  var name;
  if (argv._.length > 0)
    name = argv._[0];
  if (!name)
    name = 'default';

  var base;
  if (/^\.?\.?(\/|\\)/.test(name)) { //relative
    base = path.join(process.cwd(), name);
  } else {
    var weblerPath = path.dirname(require.resolve('webler'));
    base = path.join(weblerPath, '../../packages/init', userName, name);
  }
  var vp = vpCreator(base, './');

  var initFile = vp.resolveSrc('~/init.js'); // path.join(base, 'init.js');

  if (fs.existsSync(initFile)) { //execute file initalizer
    require(initFile)({
      force: argv.force || false,
      log: log,
      vp: vp,
      glob: glob,
      mkdirp: require('mkdirp')
    });
  } else { //just copy packages files
    var cwd = vp.resolveSrc('~package'); // path.join(base, 'package');
    var files = glob.find(['**/*.*'], {
      srcBase: cwd,
      filter: 'isFile'
    });

    for (var i in files) {
      var content = fs.readFileSync(path.join(cwd, files[i]));
      utils.safeWriteFile(files[i], content);
    }
  }
}

function watch(argv) {
  require('./watch')(argv);
}

module.exports = {
  weble: weble,
  init: init,
  watch: watch
}
