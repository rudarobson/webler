function registerBundles(bundles) {
  bundles.add('scripts', '~/Home/Index/index.js')
    .include('js', '~/Pages/Home/Index/js/index.js');
}

module.exports = function(config) {
  var unit = this.weble({
    cwd: 'src/Pages',
    src: '**/*.cshtml',
    dest: 'tests_results'
  }, {
    appRoot: {
      src: 'src',
      dest: 'tests_result'
    }
  });

  registerBundles(unit.bundles());

  unit.compile().razor({
      layoutsPath: 'src/Layouts'
    })
    .bundle()
    .components({
      componentsPath: 'src/Components'
    })
    .markdown();

  unit.render();
}
