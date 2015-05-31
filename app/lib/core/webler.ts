var scopeCreator = require('./weblerScopeCreator');
var solveGlobs = require('./fileSolver');



export = scopeCreator({
	fileSolver: solveGlobs
});