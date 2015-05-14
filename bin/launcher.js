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
  var name = (_.length > 0) ? _[0] : undefined;
  var fs = require('fs');

  if (!name) {
    if (fs.existsSync('webler.js') && !argv.force) {
      system.exitWithMessage('webler.js already exists use --force to overwrite')
    }

    var weblerPath = path.dirname(require.resolve('webler'));

    var base = path.join(weblerPath, '../init/default');
    var files = glob.sync('**/*.*', {
      cwd: base
    });

    for (var i in files) {
      var content = fs.readFileSync(path.join(base, files[i]));
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
