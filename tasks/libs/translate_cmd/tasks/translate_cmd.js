/*
 * grunt-translate_cmd
 * 提取cmd模块路径
 * https://github.com/nateyang/grunt-translate_cmd
 * Copyright (c) 2014 nateyang
 * Licensed under the MIT license.
 */

'use strict';


module.exports = function(grunt) {

  var translate = require('./libs/translate-cmd')

  // 注册grunt任务
  grunt.registerMultiTask('translate_cmd', 'The best Grunt plugin ever.', function() {
    var options = this.options({
      // 静态资源根目录，为了获取模块绝对路径
      root: '',
      useConfig: false,
      removeAnnomation: false,
      encoding: 'utf-8'
    });
    var files = this.files;
    var log = grunt.log.write;
    var scripts = [];
    var dest = [];

    // 对每个文件进行操作
    files.forEach(function (fileInfo) {
      var filepath = fileInfo.src[0];
      var targetFilePath = fileInfo.dest;
      translate(filepath,targetFilePath,options.root,options.useConfig,options.removeAnnomation,options.encoding);
    });
  });

};
