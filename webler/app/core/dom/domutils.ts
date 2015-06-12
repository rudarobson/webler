var mtype: Dom.MarkupTypes = require('./markuptype');

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

function findBlockComments(elt, name, close): Dom.BlockComment[] {
  var comments: Dom.BlockComment[] = [];
  var regex = new RegExp('<!--\\s*' + name + '\\s*');

  if (elt.type == mtype.comment && regex.test((<Dom.Comment> elt).content)) {
    var s = elt.next;
    var closeRegex = new RegExp('<!--\\s*' + (close ? close : '/' + name) + '\\s*')
    var children = [];
    var found = false;

    while (s) {
      if (s.type == mtype.comment && closeRegex.test((<Dom.Comment>s).content)) {
        found = true;
        break;
      } else {
        children.push(s);
      }
      s = s.next;
    }

    if (found) {
      return [{
        open: elt,
        close: s,
        children: children
      }];
    }
  } else if (elt.type == mtype.element || elt.type == mtype.document) {
    for (var i in elt.children) {
      var c = findBlockComments(elt.children[i], name, close);
      comments = comments.concat(c);
      if (elt.children[i].type == mtype.comment && regex.test((<Dom.Comment> elt.children[i]).content)) {
        i += c.length + 1;//skips siblings plus close tag, open tag will be skipped at loop iteration
      }//else it's a match in the children of the current child
    }
  }

  return comments;
}

(<any>visitNode).skipChildren = -1;
(<any>visitNode).stopSearch = -2;
export = {
  visitNode: visitNode,
  findCommentBlocks: findBlockComments
}
