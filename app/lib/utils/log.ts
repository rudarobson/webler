var colors = require('colors');

var verboseLevel = 0;
var devLevel = 0;
var devEnabled = false;

var indent = '';

function formatMessage(message) {
  return indent + message.replace(/([\r\n]+)/g, indent + '$1');
}
export = {
  nl: function() {
    console.log('');
    return this;
  },
  indent: function() {
    indent += '\t';
    return this;
  },
  unindent: function() {
    indent = indent.substr(0, indent.length - 1);
    return this;
  },
  resetIndentation: function() {
    indent = '';
    return this;
  },
  error: function(message) {
    console.log(colors.red(formatMessage(message)));
    return this;
  },
  normal: function(message) {
    console.log(formatMessage(message));
    return this;
  },
  verbose: {
    error: function(message, level) {
      if (!level)
        level = 0;
      if (level <= verboseLevel) {
        console.log(colors.red(formatMessage(message)));
      }
      return this;
    },
    normal: function(message, level) {
      if (!level)
        level = 0;
      if (level <= verboseLevel) {
        console.log(formatMessage(message));
      }
      return this;
    },
    enable: function(level) {
      if (level === false || level < 0)
        verboseLevel = -1;
      else {
        if (typeof(level) == typeof(true))
          verboseLevel = 1;
        else verboseLevel = level;
      }
      return this;
    },
    isEnabled: function(level) {
      return verboseLevel >= level;
    }
  }
}