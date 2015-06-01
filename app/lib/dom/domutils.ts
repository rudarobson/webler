function ___visitNode(elt, enter, exit, level) {
  var ret;
  if (enter)
    ret = enter.call(elt) || 0;

  if (ret >= 0 && level != 0) { //ret >= 0 means to include children
    var children = elt.children;
    if (children) { //element or document
      if (level > 0) //using level prunning
        level--;
      for (var i in children) {
        ret = ___visitNode(children[i], enter, exit, level); //new level down
        if (ret == (<any>visitNode).stopSearch) {
          break;
        }
      }
    }
  }

  if (exit)
    exit.call(elt);

  if (ret == (<any>visitNode).stopSearch)
    return ret;
}

/**
 * visitNode - visit elements in pre order, includes root
 *
 * @param  {Element} elt   root element
 * @param  {function} enter function will be called when entering
 * @param  {function} exit  function will be called when exiting
 */
function visitNode(elt, enter, exit, opt) {

  if (typeof (exit) == typeof (0)) {
    level = exit;
    exit = undefined;
  }

  var level = -1;
  if (!opt)
    opt = {};

  if (opt.level)
    level = opt.level;

  if (level < -1)
    level = -1;

  ___visitNode(elt, enter, exit, level);
}

(<any>visitNode).skipChildren = -1;
(<any>visitNode).stopSearch = -2;
export = {
  visitNode :visitNode
}
