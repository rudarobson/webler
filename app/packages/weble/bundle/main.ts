var $: Dom.$Static = wRequire('$');

var bundlers: { [cssSelector: string]: Bundle.Bundler } = {};

var id = 0;

export = {
  start: function(document: Dom.Document, isDebug: boolean, opt: Bundle.Options) {
    var selectors: string[] = [];
    for (var i in bundlers)
      selectors.push(i);
    var selector = selectors.join(',');
    var $dom = $(document);

    var toBundle: {
      [dest_or_id: string]:
      { bundler: Bundle.Bundler, elements: Dom.Element[] };
    } = {};

    $dom.filter(selector).each(function() {
      for (var i in bundlers) {

        if ((<Dom.Element>this).is(i)) {
          var key = (<Dom.Element>this).getAttribute('bundle');
          if (!toBundle[key]) {
            toBundle[key] = {
              bundler: bundlers[i],
              elements: []
            };
          }
          toBundle[key].elements.push(<Dom.Element>this);
        }
      }
    });


    for (var i in toBundle) {
      var obj = toBundle[i];
      var res = obj.bundler({
        isDebug: isDebug,
        elements: obj.elements
      });

      var before = obj.elements[0];

      for (var j in res.elements)
        before.insertBefore(res.elements[j]);


      for (var j in obj.elements)
        obj.elements[j].remove();
    }
  },
  addBundler: function(selector: string[], bundler: Bundle.Bundler) {
    for (var i in selector)
      bundlers[selector[i]] = bundler;
  }
}
