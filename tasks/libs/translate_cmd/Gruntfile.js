/*
 * grunt-translate_cmd
 * https://github.com/nateyang/izhe
 *
 * Copyright (c) 2014 nateyang
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    clean: {
      tests: ['tmp'],
    },

    translate_cmd: {
      default_options: {
        files: [{
          expand: true,
          cwd: 'test/src/',
          src: '*.js',
          dest: 'test/dest/'
        }],
      }
    }

  });

  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('test', ['clean', 'translate_cmd']);

};
