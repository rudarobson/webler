require('./app/core/bootstrap');

module.exports = {
  gruntconfig: {
    config: {
      webler: 'src/_webler',
      src: 'src',
      tmp: 'tmp',
      dest: 'dest',
      bundle: 'bundle'
    },
    sass: {
      dev: {
        files: [{
          expand: true,
          cwd: '<%= config.src %>/',
          src: ['**/*.scss', '!<%= config.webler %=>'],
          dest: '<%= config.bundle %>/sass',
          ext:'.css'
        }]
      }
    },
    typescript: {
      dev: {
        files: [{
          expand: true,
          cwd: '<%= config.src %>/',
          src: ['**/*.ts', '!<%= config.webler %=>'],
          dest: '<%= config.bundle %>/typescript',
          ext:'.js'
        }]
      }
    },
    razor: {
      options: {
        appSrcRoot: '<%= config.src %>',
        tmpDir: '<%= config.tmp %>',
        layoutsPath: '<%= config.webler %>/layouts'
      },
      dev: {
        files: [{
          expand: true,
          cwd: '<%= config.src %>/',
          src: ['**/*.html', '!<%= config.webler %=>'],
          dest: '<%= config.dest %>/'
        }]
      }
    },
    components: {
      options: {
        componentsPath: '<%= config.webler %>/components'
      },
      dev: {
        files: [{
          expand: true,
          cwd: '<%= config.dest %>',
          src: ['**/*.html', '!<%= config.webler %=>'],
          dest: '<%= config.dest %>/'
        }]
      }
    },
    bundle: {
      options: {
        destPath: '<%= config.dest %>'
      },
      dev: {
        files: [{
          expand: true,
          cwd: '<%= config.dest %>',
          src: ['**/*.html', '!<%= config.webler %=>'],
          dest: '<%= config.dest %>/'
        }]
      }
    }
  },
  loadTasks: function(grunt) {
    var path = require('path');

    grunt.loadTasks(path.join(require.resolve('./weble-task/razor'), '..'));
  }
};
