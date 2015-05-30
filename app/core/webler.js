var scopeCreator = require('./weblerScopeCreator');
var solveGlobs = require('./fileSolver');



module.exports = scopeCreator({
  fileSolver: solveGlobs
})
