/*
 * translate-cmd
 * 提取cmd模块id
 * https://github.com/nateyang/translate-cmd
 * Copyright (c) 2014 nateyang
 * Licensed under the BSD license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var Annotation = require('./libs/annotation');
var IS_ID_RE = /^(?:'|").+(?:'|")$/;
var DEFINE_RE = /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|(?:^|;|\}|\))\s*define\s*\(\s*(?:([^,]*?)\s*,)?\s*(?:([^,]*?)\s*,)?\s*(function)\s*\([\s\S]*?\)\s*\{/;
var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;

/**
 * extract 提取模块路径
 * @param str {string} 需要处理的字符内容
 * @param path {string} 要注入的cmd模块路径
 */
function extract(str,path,remove) {
  var _annotation = new Annotation(str);
  str = _annotation.getString();

  var require;
  var requiredModules = [];
  REQUIRE_RE.lastIndex = 0;
  while(require = REQUIRE_RE.exec(str)) {
    if (require[2]) {
      requiredModules.push("'" + require[2] + "'");
    }
  }
  
  str.replace(DEFINE_RE,function (match,group1,group2,group3,index) {
    var sliceIndex;
    var newStr;
    var insertedString;

    // 没有提供id和依赖
    if (!group1 && !group2 && group3) {
      sliceIndex = index + match.indexOf(group3);
      insertedString = "'" + path + "'," + "[" + requiredModules.join(',') + "],";
      _annotation.insertStr(sliceIndex,insertedString);
    // 提供了依赖，但没有提供id
    } else if (group1 && !IS_ID_RE.test(group1) && group3) {
      sliceIndex = index + match.indexOf(group1);
      insertedString = "'" + path + "',";
      _annotation.insertStr(sliceIndex,insertedString);
    } else if (group1 && IS_ID_RE.test(group1) && group3) {
      sliceIndex = index + match.indexOf(group3);
      insertedString = "[" + requiredModules.join(',') + "],";
      _annotation.insertStr(sliceIndex,insertedString);
    }

    return match;
  });

  return remove ? _annotation.getString() : _annotation.recover().getString();
}


/**
 * translate-cmd
 * @param filePath {string} 要处理的文件路径
 * @param targetFilePath {string} 处理后的文件路径
 * @param webRoot {string} web项目根目录
 * @param removeAnnotation {boolean} 是否移除掉注释
 * @param encoding {string} 字符类型
 */
module.exports = function(filePath,targetFilePath,webRoot,removeAnnotation,encoding) {
  encoding = encoding || 'utf-8';
  var string = fs.readFileSync(filePath,{
    encoding: encoding
  });
  var newStr = extract(string,'/' + path.relative(webRoot,filePath),removeAnnotation);
  // 如果没有目标目录，开始创建
  var directories = path.relative('./',targetFilePath).split('/');
  var directory = '';
  directories.pop();
  // 创建目录
  while(directories.length != 0) {
    directory += (directory == '' ? '' : '/') + directories.shift();
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
  }
  // 写入到目标文件当中去
  fs.writeFileSync(targetFilePath,newStr,{
    encoding: encoding
  });
};
