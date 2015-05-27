var globule = require('globule');
var vpCreator = require('../utils/virtualPath');
var path = require('path');
var utils = _wRequire('utils');
var resource = _wRequire('resource');
/**
 * @returns {Object[]} - {src:virtualSourcePath,dest:virtualDestPath}
 */
function solveGlobs(globs, srcRoot, destRoot, /*changedFile: only used by watch*/ changedFile) {
    var files = [];

    vp = vpCreator(srcRoot, destRoot);
    if (!globs)
        globs = [{}];

    var fullFileMap = {};
    for (i in globs) {
        var obj = globs[i];
        var glob_opt = undefined;

        var virtualSrcs = obj.src || ['~**/*.html'];
        var virtualDest = obj.dest || '~';
        var virtualCwd = obj.cwd || '~';


        if (virtualSrcs.constructor !== Array)
            virtualSrcs = [virtualSrcs];

        for (var i in virtualSrcs) {
            virtualSrcs[i] = vp.resolveSrc(virtualSrcs[i]);
        }

        virtualCwd = vp.resolveSrc(virtualCwd);
        virtualDest = vp.resolveDest(virtualDest);

        var group;
        if (changedFile) {
            changedFile = path.join('', changedFile);
            virtualCwd = path.join('', virtualCwd);


            if (changedFile.toLowerCase().indexOf(virtualCwd.toLowerCase()) == 0) { //it's possibly inside cwd
                group = globule.match(virtualSrcs, changedFile, {
                    srcBase: virtualCwd,
                    filter: 'isFile'
                });

                if (group && group.length) {
                    group = [path.relative(virtualCwd, changedFile)];
                }
            }
        } else {
            group = globule.find(virtualSrcs, {
                srcBase: virtualCwd,
                filter: 'isFile'
            });
        }

        for (var j in group) {
            var file = group[j];
            if (!fullFileMap[file]) {
                fullFileMap[file] = true;
                files.push(resource.createResource(path.join(virtualCwd, file), path.join(virtualDest, utils.changeFileExt(file, '.html'))));
            }
        }
    }
    return files;
}

module.exports = solveGlobs;
