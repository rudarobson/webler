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
    src: 'src',
    dest: 'dist',
    globs: {
      cwd: '~Pages',
      src: '**/*.@(cshtml|html)', //matches html and cshtml files
      dest: 'dist'
    }
  })

  registerBundles(unit.bundles());

  unit.compile().razor({
      layoutsPath: '~Layouts'
    })
    .bundle()
    .components({
      componentsPath: '~Components'
    })
    .markdown();

  unit.render();
  unit.clean();
}
