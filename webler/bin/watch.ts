var path = require('path');
var watch = require('node-watch');
var globule = require('globule');


var cluster = require('cluster');
var cleanDestWarning = false;


function launchCompiler(srcDir) {
  return cluster.fork({
    watch_work_name: 'compiler',
    watch_work_srcDir: srcDir
  });
}

function clusterize(srcDir, serverRoot, argServer) {


  if (cluster.isMaster) {
    var server;
    var compiler = launchCompiler(srcDir);

    if (argServer) {
      var p = <any>{
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
        compiler = launchCompiler(srcDir);
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
      var p2 = <any>{
        port: env.watch_work_port,
        host: env.watch_work_host,
        root: env.watch_work_root,
        open: env.watch_work_openBrowser ? true : false
      };

      console.log('Launching Server at ' + p2.root + '...');
      require('../app/core/server/launch-server').launch(p2);

    } else {

      console.log('Watching ' + env.watch_work_srcDir + '...');
      watch(env.watch_work_srcDir, function(filename) {
        console.log(filename);
        require('./launcher').weble();
      });

    }
  }
}

export = function(argv) {
  var srcDir = argv._[1];
  var destDir = argv._[2];
  if (argv.server && !argv.server.root)
    argv.server.root = destDir;

  clusterize(srcDir, destDir, argv.server);
}
