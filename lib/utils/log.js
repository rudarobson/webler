var colors = require('colors');

var verboseLevel = 0;
var devLevel = 0;
var devEnabled = false;

module.exports = {
  error: function(message) {
    console.log(message);
  },
  normal: function(message) {
    console.log(message);
  },
  verbose: {
    error: function(message, level) {
      if (!level)
        level = 0;
      if (level <= verboseLevel) {
        console.log(colors.red(message));
      }
    },
    normal: function(message, level) {
      if (!level)
        level = 0;
      if (level <= verboseLevel) {
        console.log(message);
      }
    },
    enable: function(level) {
      if (level === false || level < 0)
        verboseLevel = -1;
      else {
        if (typeof(level) == typeof(true))
          verboseLevel = 1;
        else verboseLevel = level;
      }
    },
    isEnabled: function(level) {
      return verboseEnabled >= level;
    }
  },
  dev: {
    error: function(message, level) {
      if (!level)
        level = 0;
      if (level <= devLevel) {
        console.log(colors.red(message));
      }
    },
    normal: function(message, level) {
      if (!level)
        level = 0;
      if (level <= devLevel) {
        console.log(message);
      }
    },
    enable: function(level) {
      if (level === false || level < 0)
        devLevel = -1;
      else {
        if (typeof(level) == typeof(true))
          devLevel = 1;
        else devLevel = level;
      }
    },
    isEnabled: function(level) {
      return devEnabled >= level;
    }
  }
}
