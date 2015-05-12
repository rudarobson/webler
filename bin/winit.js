#! /usr/bin/env node

var path = require('path');
var fs = require('fs');
var utils = require('../lib/utils/utils.js')
var system = require('../lib/utils/system.js')
var glob = require('glob');
var yargs = require('yargs')
  .usage('Usage: winit [name]')
  .help('h')
  .alias('h', 'help');

var argv = yargs.argv;

if (argv.help) {
  console.log(yargs.help());
}

var _ = argv._;
argv._ = undefined;

var name;
if (_ && _.length > 0)
  name = _[0];

if (!name) {
  if (fs.existsSync('Webler.js') && !argv.force) {
    system.exitWithMessage('Webler.js already exists use --force to overwrite')
  }

  var weblerPath = path.dirname(require.resolve('webler'));

  var base = path.join(weblerPath, '../winit/default');
  var files = glob.sync('**/*.*', {
    cwd: base
  });

  for (var i in files) {
    var content = fs.readFileSync(path.join(base, files[i]));
    utils.safeWriteFile(files[i], content);
  }

}
