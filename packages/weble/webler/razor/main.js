var exec = require('child_process').execFileSync;
var path = require('path');
var utils = require('../../../../lib/utils/utils');
var system = require('../../../../lib/utils/system');
var os = require('os');
module.exports = {
    type: 'bulk',
    config: {
        layoutsPath: '~layouts',
        modelsPath: '~models',
        viewBagsPath: '~viewbags'
    },
    require: ['wp'],
    start: function (resources, options, wp) {
        var opt = options;
        var toResolve = ['layoutsPath', 'modelsPath', 'viewBagsPath'];
        for (var i in toResolve) {
            if (opt[toResolve[i]]) {
                opt[toResolve[i]] = wp.vp.resolveSrc(opt[toResolve[i]]);
            }
        }
        var pages = [];
        var viewStarts = [];
        for (var i in resources) {
            var resource = resources[i];
            if (path.basename(resource.value()) === '_ViewStart.cshtml') {
                viewStarts.push(i);
                continue;
            }
            var noExtName = utils.changeFileExt(path.basename(resource.value()), '');
            var fName = wp.tp.generatePath();
            pages.push({
                source: resource.value(),
                originalSource: resource.src(),
                destination: fName,
                model: noExtName + '.model.json',
                viewBag: noExtName + '.viewbag.json'
            });
            resource.set('file', fName);
        }
        while (viewStarts.length > 0)
            resources.splice(viewStarts[0], 1); //remove _ViewStart.cshtml
        opt.pages = pages;
        opt.appSrcRoot = wp.vp.vSrc();
        var configFilePath = wp.tp.write(JSON.stringify(opt));
        var rootPackagePath = wRequire.resolve(); //root Path
        var exePath = path.join(rootPackagePath, 'packages/weble/webler/razor/bin/WeblerRazor.exe');
        var cmd;
        var args;
        if (/^[wW]in/.test(os.type())) {
            cmd = exePath;
            args = [configFilePath];
        }
        else {
            cmd = 'mono';
            args = [exePath, configFilePath];
        }
        try {
            exec(cmd, args);
        }
        catch (ex) {
            try {
                console.log(ex.stdout.toString());
            }
            catch (ex2) {
                console.log(ex);
            }
            system.exit(1);
        }
    }
};
