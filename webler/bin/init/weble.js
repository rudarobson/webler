module.exports = {
  options: {
    production: false,
    tmpDir: '.tmp',
    ignoreFiles: ['_webler/**', 'bower_components/**']
  },
  modules: {
    javascript: {
      srcs: '**/*.js',
      cwd: 'src',
      destCwd: '.tmp/javascript'
    },
    css: {
      srcs: '**/*.css',
      cwd: 'src',
      destCwd: '.tmp/css'
    },
    sass: {
      srcs: '**/*.scss',
      cwd: 'src',
      destCwd: '.tmp/sass',
      options: {
        includePaths: ['src/assets']
      }
    }
  },
  chainModules: {
    html: {
      srcs: '**/*.html',
      cwd: 'src',
      destCwd: 'dest',
      options: {
        razor: {
          appSrcRoot: 'src',
          layoutsPath: 'src/_webler/layouts'
        },
        components: {
          componentsPath: 'src/_webler/components'
        },
        bundle: {},
        domcopy: {}
      }
    }
  }
}