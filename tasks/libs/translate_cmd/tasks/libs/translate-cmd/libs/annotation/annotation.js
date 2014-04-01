/**
 * Annotation
 * 注释管理
 * https://github.com/nateyang/Annotation
 * Copyright (c) 2014 nateyang
 * Licensed under the BSD license.
 */

'use strict';


function Annotation(str) {
  this.initilaze.apply(this,arguments);
}


/**
 * initilaze
 * 构造函数
 */
Annotation.prototype.initilaze = function (str) {
  this.str = str;
  this.posInfo = {};
  this.strPosInfo = {};
  this.extractAnnotation();
  this.recoverStr();
}


/**
 * @method getKey
 * 获取对象的key值，并将其由string转化为number
 * @param key {string} key
 * @return {string}
 */
Annotation.prototype.getKey = function (key) {
  return +key;
}


/**
 * @method getString
 * 获取被处理后的文本
 * @return {string}
 */
Annotation.prototype.getString = function () {
  return this.str;
}


/**
 * @method mergeStr
 * 合并多行字符字符串为一行
 * @return {string}
 */
Annotation.prototype.mergeStr = function (str) {
  var This = this;
  var matchLen = 0;
  return str.replace(Annotation.MULTI_LINE_STR,function (match,index) {
    index -= matchLen;
    This.posInfo && (This.posInfo[index] = match);
    This.strPosInfo && (This.strPosInfo[index] = match);
    matchLen += match.length;
    return '';
  })
}


/**
 * @method extractAnnotation
 * 抽取出注释,返回去除掉注释的内容(尚未合并多行)
 * @return {string}
 */
Annotation.prototype.extractAnnotation = function () {
  var This = this;
  var newPos = 0;
  var str = this.mergeStr(this.str);

  this.str = str.replace(Annotation.ANNOTATION_RE,function (match,submatch,index) {
    var multiAnnotation;
    var multiNewPos = 0;
    var newStr = match;
    // 针对一行多个//双斜杠
    var startPos = 0

    Annotation.MULTI_ANNOTATION.lastIndex = 0;

    while(multiAnnotation = Annotation.MULTI_ANNOTATION.exec(match)) {
      if (multiAnnotation[1]) {
        var annotation = multiAnnotation[1];
        var submatchIndex = match.indexOf(annotation);
        if (This.analyzeMatch(match,annotation,submatchIndex)) {
          var newIndex = index + submatchIndex - newPos - multiNewPos;
          var len = annotation.length;
          This.updatePos(newIndex,len,true);
          This.posInfo[newIndex] = annotation;
          multiNewPos += len;
          newStr = newStr.replace(annotation,'');
        }
      } else if (multiAnnotation[2]) {
        var annotation = multiAnnotation[2];
        var submatchIndex = match.indexOf(annotation,startPos);
        startPos = submatchIndex + annotation.length;
        if (This.analyzeMatch(match,annotation,submatchIndex)) {
          // 不截取最后一个换行符
          annotation = match.substring(submatchIndex,match.length - 1);
          var newIndex = index + submatchIndex - newPos - multiNewPos;
          var len = annotation.length;
          This.updatePos(newIndex,len,true);
          This.posInfo[newIndex] = annotation;
          multiNewPos += len;
          newStr = newStr.replace(annotation,'');
          break;
        }
      }
    }

    newPos += multiNewPos;
    return newStr;

  });
}


/**
 * @method analyzeMatch
 * 分析匹配条件是否为真正的注释,而非字符串或正则内容
 * @param match {string} 匹配到的块
 * @param submatch {string} 匹配到的注释
 * @param index {number} 匹配到块的位置
 * @return {string}
 */
Annotation.prototype.analyzeMatch = function (match,submatch,index) {
  var start = index;
  //单行注释//判断位置时，不需要到结尾,只判断//是否在字符串范围内即可
  var end = submatch.indexOf('//') == 0 ? index + 2 : index + submatch.length;
  var isAnnotation = true;
  if (index - 1 >= 0) {
    if (match.substring(index - 1,index) == '\\') {
      isAnnotation = false;
      return isAnnotation;
    }
  }
  match.replace(Annotation.WITHIN_THE_STRING,function (match_,submatch_,index_) {
    var start_ = index_;
    var end_ = index_ + match_.length;
    if (start >= start_ && end <= end_) {
      isAnnotation = false;
    }
    return match;
  })
  return isAnnotation;
}


/**
 * @method insertStr
 * 在指定位置插入字符串
 * @param index {number} 要插入内容的位置
 * @param insertedStr {string} 匹配到的注释条件
 * @return {object Annotation}
 */
Annotation.prototype.insertStr = function (index,insertedStr) {
  var str = this.str;
  var newStr = [str.slice(0,index),insertedStr,str.slice(index)];
  this.str = newStr.join('');
  
  var insertLen = insertedStr.length;
  this.updatePos(index,insertLen,true,true);
  return this;
}


/**
 * @method updatePos
 * 更新所有储存的位置信息
 * @param index {number} 要更新的参考位置
 * @param len {string} 要更新的位置长度
 * @param updatestr {boolean} 是否同步更新字符串换行符的位置
 * @param add {boolean} 是否为添加，默认为删除
 * @return {object Annotation}
 */
Annotation.prototype.updatePos = function (index,len,updatestr,add) {
  index = +index;
  len = +len;
  var posInfo = this.posInfo;
  var strPosInfo = this.strPosInfo;
  for (var key in this.posInfo) {
    key = this.getKey(key);
    if (index <= key) {
      if (add) {
        posInfo[key + len] = posInfo[key];
        if (updatestr && strPosInfo[key]) strPosInfo[key + len] = strPosInfo[key];
      } else {
        posInfo[key - len] = posInfo[key];
        if (updatestr && strPosInfo[key]) strPosInfo[key - len] = strPosInfo[key];
      }
      delete posInfo[key];
      updatestr && delete strPosInfo[key];
    }
  }
  return this;
}


/**
 * @method recoverStr
 * 将多行字符串恢复
 * @return {object Annotation}
 */
Annotation.prototype.recoverStr = function () {
  var newStr = [];
  var str = this.str;
  var lastPos = 0;
  var strPosInfo = this.strPosInfo;
  var posInfo = this.posInfo;
  var newPos = 0;

  for (var key in strPosInfo) {
    key = this.getKey(key);
    newStr.push(str.slice(lastPos,key));
    newStr.push(strPosInfo[key]);
    lastPos = key;
    this.updatePos(key,strPosInfo[key].length,false,true);
    newPos += strPosInfo[key].length;
    strPosInfo[key] = posInfo[key + newPos] = null;
  }

  newStr.push(str.slice(lastPos));
  this.str = newStr.join('');
  return this;
}


/**
 * @method recover
 * 恢复所有注释
 * @return {object Annotation}
 */
Annotation.prototype.recover = function () {
  var newStr = [];
  var str = this.str;
  var lastPos = 0;
  var posInfo = this.posInfo;
  for (var key in posInfo) {
    key = this.getKey(key);
    newStr.push(str.slice(lastPos,key));
    newStr.push(posInfo[key]);
    lastPos = key;
  }
  newStr.push(str.slice(lastPos));
  this.posInfo = {};
  this.strPosInfo = {};
  this.str = newStr.join('');
  return this;
}

// 通过\分隔的多行字符串
Annotation.MULTI_LINE_STR = /\\[\r\n]/g;
// 一个注释范围内多个注释
Annotation.MULTI_ANNOTATION = /(\/\*[\s\S]*?\*\/)|(\/\/)/g;
// 匹配//和/**/注释
Annotation.ANNOTATION_RE = /[^\r\n]?.*(\/\/.*|\/\*[\s\S]*?\*\/).*[\r\n]/g; 
// 验证注释是否为字符串
Annotation.WITHIN_THE_STRING = /('|").*?\1/g;

module.exports = Annotation;
