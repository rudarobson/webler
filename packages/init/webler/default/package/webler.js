module.exports.develop = function(webler) {
  webler.loadModule('razor').loadModule('bundle').loadModule('components');

  webler.weble({
    globs: {
      src: ['**/*.@(html|cshtml)', '!**/_ViewStart.cshtml', '!_webler/**/*.*'] //ignore _ViewStart.cshtml for razor
    }
  }).razor({
    layoutsPath: '~/_webler/layouts'
  }).bundle().components({
    componentsPath: '~/_webler/components'
  });

  webler.cleanDest().render();
}
