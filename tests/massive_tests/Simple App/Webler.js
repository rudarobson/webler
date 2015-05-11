function registerBundles(bundles) {
  bundles.add('scripts', '~/Home/Index/index.js')
    .include('js', '~/Pages/Home/Index/js/index.js');

  bundles.add('scripts', '~/Home/Contact/index.js')
    .include('js', '~/Pages/Home/contact.js');

  bundles.add('scripts', '~/assets/js/commonAsset.js')
    .include('js', '~/assets/js/commonAsset.js');

  bundles.add('styles', '~/assets/css/site.css')
    .include('css', '~/assets/css/site2.css')
    .include('sass', '~/assets/sass/site.scss')

  bundles.add('styles', '~/Home/Index/css/index.css')
    .include('sass', '~/Pages/Home/Index/css/index.scss')

  bundles.add('styles', '~/Home/Contact/index.css')
    .include('sass', '~/Pages/Home/contact1.scss')
    .include('sass', '~/Pages/Home/contact2.scss')
}

module.exports = function(config) {
  var unit = this.weble({
    cwd: 'src/Pages',
    src: '**/*.@(cshtml|html)',
    dest: 'release'
  }, {
    appRoot: {
      src: 'src',
      dest: 'release'
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
