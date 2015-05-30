var log = {
  error: function(message) {
    console.log(message);
  }
};

module.exports = {
  msg: {
    nullArgumentException: function(msg) {
      return 'NullArgumentException: ' + msg;
    }
  },
  exitWithMessage: function(message, out) {
    if (out)
      out = log[out];

    if (!out)
      out = log.error;

    out(message);
    throw message;
  },
  exit: function(code) {
    process.exit(code);
  },
  exitCodes: {
    error:-1,
    success:0
  }
};
