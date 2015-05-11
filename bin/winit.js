#! /usr/bin/env node

var path = require('path');
var fs = require('fs');
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
  var weblerPath = path.dirname(require.resolve('webler'));
  console.log(weblerPath);
  var srcPath = path.join(weblerPath, '../winit/default/Webler.js');
  fs.writeFileSync('Webler.js', fs.readFileSync(srcPath));
}
