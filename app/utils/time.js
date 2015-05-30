var times = {};

module.exports = {
  start: function(id) {
    var start = process.hrtime();
    if (!times[id]) {
      times[id] = {
        elapsed: [0,0],
        lastStart: start
      };
    } else
      times[id].lastStart = start;
  },
  end: function(id) {
    var s = times[id];
    var elapsed = process.hrtime(s.lastStart);
    s.elapsed[0] += elapsed[0];
    s.elapsed[1] += elapsed[1];
  },
  show: function() {
    for (var id in times) {
      var s = times[id];
      console.log(id + ': ' + ((s.elapsed[0] * 1e9 + s.elapsed[1]) * 1e-9).toFixed(3) + " s");
    }
  }
};
