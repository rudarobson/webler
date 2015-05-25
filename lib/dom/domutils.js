/**
 * visitNode - visit elements in pre order, includes root
 *
 * @param  {Element} elt   root element
 * @param  {function} enter function will be called when entering
 * @param  {function} exit  function will be called when exiting
 */
function visitNode(elt, enter, exit) {
  if (enter)
    enter.call(elt)

  var children = elt.children;
  if (children) { //element or document
    for (var i in children)
      visitNode(children[i], enter, exit);
  }
  if (exit)
    exit.call(elt);
}

function visitNodeWithLevel(elt, enter, exit, level) {
  if (enter)
    enter.call(elt)
  var children = elt.children;


  if (children) { //element or document
    for (var i in children) {
      if (level > 0)
        visitNode(children[i], enter, exit, level - 1);
    }
  }

  if (exit)
    exit.call(elt);
}

module.exports.visitNode = visitNode;
module.exports.visitNodeWithLevel = visitNodeWithLevel;
