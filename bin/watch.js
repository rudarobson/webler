var path = require('path');
var watch = require('node-watch');
var scopeCreator = require('../lib/core/weblerScopeCreator');
var colors = require('colors');
var globule = require('globule');
var vpCreator = _wRequire('vp');
var solveGlobs = require('../lib/core/fileSolver');


function executeWebler(filename, configName, exp) {
  try {
    var webler = scopeCreator({
      fileSolver: function(globs, srcRoot, destRoot) {
        return solveGlobs(globs, srcRoot, destRoot, filename);
      },
      exportsOptions: exp
    });

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
}


function launchLiveCompiler(p) {
  watch(p.srcDir, function(filename) {
    executeWebler(filename, p.configName)
  });
}


function clusterize(srcDir, configName, serverRoot, argServer) {
  var cluster = require('cluster');

  if (cluster.isMaster) {
    var server;
    var compiler = cluster.fork({
      watch_work_name: 'compiler',
      watch_work_configName: configName,
      watch_work_srcDir: srcDir
    });

    if (argServer) {
      server = cluster.fork({
        watch_work_name: 'server',
        watch_work_port: argServer.port,
        watch_work_host: argServer.host,
        watch_work_root: serverRoot,
        watch_work_openBrowser: argServer.openBrowser
      });
    }

    var rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on('SIGINT', function() {
      process.emit('SIGINT');
    });


    cluster.on('exit', function(worker, code, signal) {
      console.log('worker ' + worker.process.pid + ' exited');
    });

    process.on('SIGINT', function() {
      compiler.kill();
      if (server) {
        server.disconnect();
        server.kill();
      }
      process.exit(0);
    });
  } else {
    var env = process.env;

    if (env.watch_work_name == 'server') {
      var p = {
        port: env.watch_work_port,
        host: env.watch_work_host,
        root: env.watch_work_root,
        openBrowser: env.watch_work_openBrowser
      }
      console.log('Launching Server at ' + p.root + '...');

    } else {
      console.log('Watching ' + env.watch_work_srcDir + '...');
      launchLiveCompiler({
        configName: env.watch_work_configName,
        srcDir: env.watch_work_srcDir
      });
    }
  }
}

module.exports = function(argv) {
  var srcDir = argv._[0];
  var configName;

  if (argv._.length > 1)
    configName = argv._[1];
  else
    configName = 'develop';

  var exp = {};

  var _log = console.log;
  console.log = function() {}; //suppress first logs
  executeWebler('', configName, exp);
  console.log = _log;

  clusterize(srcDir, configName, exp.dest, argv.server);
}
