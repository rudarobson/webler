var htmlmin = require('html-minifier').minify;

export = {
    type: 'stream',
    config: {
        removeComments: true,
        collapseWhitespace: true,
        minifyCss: true,
        minifyJS: true
    },
    require: ['gOptions', 'wp'],
    start: function (resource, options, gOptions, wp) {
        var opt = options;
        var isDebug = gOptions.debug;

        if (!isDebug) {
            var html = resource.value('string');
            resource.set('string', htmlmin(html, opt));
        }
    }
};
