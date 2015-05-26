var htmlmin = require('html-minifier').minify;

module.exports = {
  type: 'stream',
  config: {
    removeComments: true,
    collapseWhitespace: true,
    minifyCss: true,
    minifyJS: true
  },
  start: function(input, wManager) {
    var wp = wManager.wp;
    var opt = wManager.options;
    var isDebug = wManager.isDebug;

    if (!isDebug) {
      var html = wManager.convert(input, 'string');
      input.value = htmlmin(html, opt);
      input.type = 'string';
    }
  }
};
