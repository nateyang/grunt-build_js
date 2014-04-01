/*
 * grunt-build_js
 * https://github.com/nateyang/grunt-build_js
 *
 * Copyright (c) 2014 nateyang
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({

    build_js: {
      options: {
        root: 'test/src/'
      },
      core: {
        options: {
          cmd: false
        },
        files: {
          'test/dest/core/core_merge.js': ['test/src/core/*.js']
        }
      },
      app: {
        options: {
          clean: true,
          build: 'test/dest/app/merge.js'
        },
        files: [{
          expand: true,
          cwd: 'test/src/app/',
          src: '*.js',
          dest: 'test/dest/app/'
        }]
      }
    }

  });

  grunt.loadTasks('tasks');

  grunt.registerTask('test', ['build_js']);

};
