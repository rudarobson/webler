var path = require('path');
var fs = require('fs');
var domBasePath = path.join(path.dirname(require.resolve('webler')), 'dom');
var cssEngine = require(path.join(domBasePath, 'css/engine'));
var htmlParser = require(path.join(domBasePath, 'html/parser'))();


var dom1 = htmlParser.parse(fs.readFileSync('./srcs/src1.html').toString());

module.exports.test1 = function(assert) {
  var elts = dom1.filter('.class2 span');

  assert.equals(elts.length,1);
  assert.equals(elts[0].tagName,'span');

  elts = dom1.filter('#spanwithid');//changing sensitive case  of document
  assert.equals(elts.length,1);
  //assert.equals(elts[0].tagName,'span');
  //assert.equals(elts[0].attr('id'),'spanwithid');
  assert.done();
}
