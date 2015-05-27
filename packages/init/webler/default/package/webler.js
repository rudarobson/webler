module.exports.develop = function(webler) {
  webler.loadModule('razor').loadModule('bundle');

  webler.cleanDest().weble({
    globs: {
      cwd: '~pages', //do not include layouts folder
      src: ['**/*.@(html|cshtml)', '!**/_ViewStart.cshtml'] //ignore _ViewStart.cshtml for razor
    }
  }).razor().bundle();

  webler.render();
}
