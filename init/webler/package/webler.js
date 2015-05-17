function registerBundles(bundles) {
  /** Register yout bundles here **/
  /**
    bundles.add('scripts', '~/Destination')
    .include('js', '~/script1.js')
    .include('js', '~/script2.js');
  **/
}

module.exports.develop = function(webler) {
  webler.loadModule('razor').loadModule('bundle');

  registerBundles(webler.api('bundle').bundles());

  webler.cleanDest().weble({
    globs: {
      cwd: '~pages',
      src: ['**/*.@(html|cshtml)', '!**/_ViewStart.cshtml']//ignore _ViewStart.cshtml for razor
    }
  }).razor().bundle();

  webler.render().cleanUp().cleanTmp();
}
