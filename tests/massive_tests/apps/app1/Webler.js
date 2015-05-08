module.exports = function(config) {
  var unit = this.weble({
    cwd: 'src/Pages',
    src: '**/*.cshtml',
    dest: 'tests_results'
  });

  unit.compile().razor({
    layoutsPath: 'src/Layouts',
    startupPath: 'src/Startup.cs'
  })
  .components({
    componentsPath:'src/Components'
  })
  .markdown();

  unit.render();
}
