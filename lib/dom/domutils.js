
/**
 * visitNode - visit elements in pre order, includes root
 *
 * @param  {Element} elt   root element
 * @param  {function} enter function will be called when entering
 * @param  {function} exit  function will be called when exiting
 */
function visitNode(elt, enter, exit) {
  if (enter)
    enter(elt)
  if (elt.children) {
    for (var i in elt.children)
      visitNode(elt.children[i], enter, exit);
  }
  if (exit)
    exit(elt);
}

module.exports.visitNode = visitNode;
