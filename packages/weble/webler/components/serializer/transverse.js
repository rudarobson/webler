var ElementType = require('domelementtype');

var render = module.exports = function(dom, fn, level) {

  for (var i = 0; i < dom.length; i++) {
    var elem = dom[i];
    if (fn(elem) == false)
      return false;

    if (elem.type === 'root' ||
      ElementType.isTag(elem) ||
      elem.type === ElementType.Directive ||
      elem.type === ElementType.Comment ||
      elem.type === ElementType.CDATA
    ) {
      if (elem.children && (level == undefined || level > 0)) {
        if (render(elem.children, fn, level != undefined ? level - 1 : undefined) == false)
          return false;
      }
    }
  }
};
