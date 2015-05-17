var marked = require('marked');

module.exports = {
  type: 'stream',
  start: function(input, wManager) {
    var cnt = wManager.convert(input, 'string');
    var options = wManager.options;
    var md = /<!--\s*markdown:\s*({[\s\S]*?})?\s*-->([\s\S]*?)<!--\s*\/markdown\s*-->/g;
    var startMatch;
    if (options)
      marked.setOptions(options);

    while ((startMatch = md.exec(cnt))) {
      var options = {};
      var html = marked(startMatch[2]);
      cnt = cnt.replace(startMatch[0], html);
    }
    return cnt;
  }
}
