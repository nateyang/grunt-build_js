/*
 * grunt-build_js
 * https://github.com/nateyang/grunt-build_js
 *
 * Copyright (c) 2014 nateyang
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  require('./libs/translate_cmd').call(grunt,grunt);
  require('./libs/concat').call(grunt,grunt);
  require('./libs/uglify').call(grunt,grunt);
  require('./libs/clean').call(grunt,grunt);


  grunt.registerMultiTask('build_js', 'build js', function() {

    var options = this.options({
      // web根目录
      root: '',
      // cmd是否进行cmd转换
      cmd: true,
      // concat是否合并文件
      concat: true,
      // concat合并的url路径(在开启cmd模式时，为必填选项)
      build: '',
      // 是否清除合并前的文件(只在cmd模式打开时有效)
      clean: false
    });
    var concat_config = {};
    var clean_config = {};
    var uglify_config = {};
    var translate_config = {};
    var fileParams = [];
    var fileParams = [];
    var onlyUglifyFiles = [];
    var srcFiles = [];
    var destFiles =[];
    var concatFiles = '';


    this.files.forEach(function (file) {
      if (options.cmd) {
        srcFiles.push(file.src[0]);
      } else {
        srcFiles = srcFiles.concat(file.src);
      }
      destFiles.push(file.dest);
      fileParams.push({
        src: file.src[0],
        dest: file.dest
      })
      onlyUglifyFiles.push({
        src: file.dest,
        dest: file.dest
      })
    });

    // translate 任务
    translate_config[this.target] = {
      options: options, 
      files: fileParams
    }

    // concat 任务
    concat_config[this.target] = {
      options: options,
      src: options.cmd ? destFiles : srcFiles,
      dest: options.cmd ? options.build : destFiles[0] || options.build
    }
    concatFiles = concat_config[this.target].dest;

    // uglify
    if (options.cmd) {
      options.mangle = {
        except: ['require']
      }
    } 
    if (options.concat) {
      var uglifyFiles = [{
        src: concatFiles,
        dest: concatFiles
      }]
    } else {
      if (options.cmd) {
        var uglifyFiles = onlyUglifyFiles;
      } else {
        var uglifyFiles = fileParams;
      }
    }
    uglify_config[this.target] = {
      options: options,
      files: uglifyFiles
    }

    // clean 任务
    clean_config[this.target] = {
      options: {
        force: true
      },
      src: destFiles
    }

    // 初始化各任务目标
    var taskQueue = [];
    if (options.cmd) {
      grunt.config.data.translate_cmd = translate_config;
      taskQueue.push('translate_cmd:' + this.target);
    }
    if (options.concat) {
      grunt.config.data.concat = concat_config;
      taskQueue.push('concat:' + this.target);
    }
    grunt.config.data.uglify = uglify_config;
    taskQueue.push('uglify:' + this.target);
    if (options.cmd && options.concat && options.clean) {
      grunt.config.data.clean = clean_config;
      taskQueue.push('clean:' + this.target);
    }

    grunt.registerTask('build-translate_cmd',taskQueue);

    grunt.task.run('build-translate_cmd');

  });

};
