function registerBundles(bundles) {
  /** Register yout bundles here **/
  /**
    bundles.add('scripts', '~/Destination')
    .include('js', '~/script1.js')
    .include('js', '~/script2.js');
  **/
}

module.exports = function(config) {
  var unit = this.weble({
    cwd: 'src/Pages',
    src: '**/*.@(cshtml|html)', //matches html and cshtml files
    dest: 'dist'
  }, {
    appRoot: {
      src: 'src', //~ will be substituted by this path when is a source file
      dest: 'dist' //~ will be substituted by this path when is a destination file
    }
  });

  registerBundles(unit.bundles());

  unit.compile().razor({
      modelsPath: 'ModelsAndViewBags',
      viewBagsPath: 'ModelsAndViewBags',
      layoutsPath: 'Layouts'
    })
    .bundle()
    .components({
      componentsPath: 'Components'
    })
    .markdown();

  unit.render();
  unit.clean();
}
