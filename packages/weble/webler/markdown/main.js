var marked = require('marked');
var useHighlightjs = false;
module.exports = {
    type: 'stream',
    start: function (resource, options) {
        var cnt = resource.value('string');
        var md = /<!--\s*markdown:\s*([\S]*?)?\s*-->([\s\S]*?)<!--\s*\/markdown\s*-->/g;
        var startMatch;
        if (options)
            marked.setOptions(options);
        while ((startMatch = md.exec(cnt))) {
            var options = {};
            var html;
            if (useHighlightjs) {
                if (startMatch[1]) {
                    html = marked(startMatch[2], {
                        highlight: function (code, lang) {
                            return require('highlight.js').highlight(startMatch[1], code).value;
                        }
                    });
                }
                else {
                    html = marked(startMatch[2], {
                        highlight: function (code) {
                            return require('highlight.js').highlightAuto(code).value;
                        }
                    });
                }
            }
            else {
                html = marked(startMatch[2]);
            }
            cnt = cnt.replace(startMatch[0], html);
        }
        resource.set('string', cnt);
    },
    api: {
        useHighlightjs: function () {
            useHighlightjs = false;
        }
    }
};
