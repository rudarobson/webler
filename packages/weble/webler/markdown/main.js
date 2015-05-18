var marked = require('marked');

var useHighlightjs = false;
module.exports = {
  type: 'stream',
  start: function(input, wManager) {
    var cnt = wManager.convert(input, 'string');
    var options = wManager.options;
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
            highlight: function(code, lang) {
              return require('highlight.js').highlight(startMatch[1], code).value;
            }
          });
        } else {
          html = marked(startMatch[2], {
            highlight: function(code) {
              return require('highlight.js').highlightAuto(code).value;
            }
          });
        }
      } else {
        html = marked(startMatch[2]);
      }

      cnt = cnt.replace(startMatch[0], html);
    }

    input.value = cnt;
    input.type = 'string';
  },
  api: {
    useHighlightjs: function() {
      useHighlights = false;
    }
  }
}
