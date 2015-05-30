var path = require('path');
var watch = require('node-watch');
var scopeCreator = require('../lib/core/weblerScopeCreator');
var colors = require('colors');
var globule = require('globule');
var vpCreator = _wRequire('vp');
var solveGlobs = require('../lib/core/fileSolver');

var cluster = require('cluster');
var cleanDestWarning = false;

function executeWebler(filename, configName, exp) {

  var webler = scopeCreator({
    fileSolver: function(globs, srcRoot, destRoot) {
      return solveGlobs(globs, srcRoot, destRoot, filename);
    },
    exportsOptions: exp
  });

  webler.cleanDest = function() {
    if (!cleanDestWarning) {
      cleanDestWarning = true;
      log.error('cleanDest() function is suppressed on watch');
    }

    return webler;
  }; //cannot clean dest on watch

  if (filename) {
    console.log('Changes to: ' + filename);
    console.log('');
  }

  var f = require(path.join(process.cwd(), 'webler.js'));

  f[configName](webler);
}


function launchLiveCompiler(p) {
  watch(p.srcDir, function(filename) {
    executeWebler(filename, p.configName)
  });
}


function launchCompiler(configName, srcDir) {
  return cluster.fork({
    watch_work_name: 'compiler',
    watch_work_configName: configName,
    watch_work_srcDir: srcDir
  });
}

function clusterize(srcDir, configName, serverRoot, argServer) {


  if (cluster.isMaster) {
    var server;
    var compiler = launchCompiler(configName, srcDir);

    if (argServer) {
      var p = {
        watch_work_name: 'server'
      };
      if (argServer.port)
        p.watch_work_port = argServer.port;

      if (argServer.host)
        p.watch_work_host = argServer.host;

      p.watch_work_root = serverRoot;

      if (argServer.open)
        p.watch_work_openBrowser = argServer.open;

      server = cluster.fork(p);
    }

    var rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on('SIGINT', function() {
      process.emit('SIGINT');
    });

    cluster.on('exit', function(worker, code, signal) {
      if (worker.process.pid == compiler.process.pid) {
        compiler = launchCompiler(configName, srcDir);
      }

    });

    process.on('SIGINT', function() {
      console.log('Killing compiler');
      compiler.kill();
      if (server) {
        console.log('Killing server');
        try {
          server.disconnect();
        } catch (ex) {

        }

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
        open: env.watch_work_openBrowser ? true : false
      };

      console.log('Launching Server at ' + p.root + '...');
      require(path.join(path.dirname(require.resolve('webler')), '../server/launch-server')).launch(p);
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
  try { //run silentrly
    executeWebler('', configName, exp);
    cleanDestWarning = false; //must reset it
  } catch (ex) {

  }
  console.log = _log;

  clusterize(srcDir, configName, exp.dest, argv.server);
}
