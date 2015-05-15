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
  var glob = require('glob-expand');
  var log = require('../lib/utils/log');
  var utils = require('../lib/utils/utils');
  var system = require('../lib/utils/system');
  var name = (argv.length > 0) ? _[0] : undefined;

  var name;
  if (argv._.length > 0)
    name = argv._[0];
  if (!name)
    name = 'webler';

  var base;
  if (/^\.?\.?(\/|\\)/.test(name)) { //relative
    base = path.join(process.cwd(), name);
  } else {
    var weblerPath = path.dirname(require.resolve('webler'));
    base = path.join(weblerPath, '../init', name);
  }

  var initFile = path.join(base, 'init.js');

  if (fs.existsSync(initFile)) { //execute file initalizer
    require(initFile)({
      base: base,
      force: argv.force || false,
      log: log,
      glob: glob,
      mkdirp: require('mkdirp')
    });
  } else { //just copy packages files
    var cwd = path.join(base, 'package');
    var files = glob({
      cwd: cwd,
      filter: 'isFile'
    }, '**/*.*');

    for (var i in files) {
      var content = fs.readFileSync(path.join(cwd, files[i]));
      utils.safeWriteFile(files[i], content);
    }
  }
}

function watch(argv) {
  var watch = require('node-watch');
  var webler = require('webler');
  var path = require('path');
  var colors = require('colors');

  var srcDir = argv._[0];
  var configName;
  if (argv._.length > 1)
    configName = argv._[1];
  else
    configName = 'develop';

  console.log('Watching ' + srcDir + '...');
  watch(srcDir, function(filename) {
    try {
      webler.cleanUp();
      if (filename) {
        console.log('Changes to: ' + filename);
        console.log('');
      }

      var f = require(path.join(process.cwd(), 'webler.js'));
      f[configName](webler);
    } catch (ex) {
      console.log('');
      console.log(colors.red('Exception thrown:'));
      console.log(ex);
    }
  });
}

module.exports = {
  weble: weble,
  init: init,
  watch: watch
}
