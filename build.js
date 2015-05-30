var glob = require('globule');
var fs = require('fs');
var child = require('child_process');
var path = require('path');
var mkdirp = require('mkdirp');


var destFolder = 'lib';
var srcFolder = 'app';

function deleteFolder(folder) {
  var files = [];
  if (fs.existsSync(folder)) {
    files = fs.readdirSync(folder);

    files.forEach(function(file, index) {
      var curFolder = path.join(folder, file);
      if (fs.lstatSync(curFolder).isDirectory()) { // recurse
        deleteFolder(curFolder);
      } else { // delete file
        fs.unlinkSync(curFolder);
      }
    });

    fs.rmdirSync(folder);
  }
}

var files = glob.find(srcFolder + '/**/*.@(ts|d.ts)', {
  filter: 'isFile'
});

deleteFolder(destFolder);

var tsConfig = {
  compilerOptions: {
    module: 'commonjs',
    outDir: destFolder,
    rootDir: srcFolder,
    noImplicitAny: false,
    removeComments: false,
    sourceMap: false
  },
  files: files
};

fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfig));

child.exec('tsc', function(error, stderr, stdout) {
  if (error) {
    console.log(stderr);
  }
  console.log(stdout);
});


function safeWriteFile(dest, content) {
  var dir = path.dirname(dest);

  mkdirp.sync(dir)
  fs.writeFileSync(dest, content);
}


var jsfiles = glob.find('**/*.@(js|json)', {
  filter: 'isFile',
  cwd: srcFolder
});

for (var i in jsfiles) {
  safeWriteFile(path.join(destFolder, jsfiles[i]), fs.readFileSync(path.join(srcFolder, jsfiles[i])));
}
