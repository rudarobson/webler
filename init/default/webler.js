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
    src: 'src', //~ will be substituted by this path when is a source file
    dest: 'dist', //~ will be substituted by this path when is a destination file
    globs: {
      cwd: '~Pages',
      src: '**/*.@(cshtml|html)', //matches html and cshtml files
      dest: '~' //destination root
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
  unit.cleanTmp();
}
