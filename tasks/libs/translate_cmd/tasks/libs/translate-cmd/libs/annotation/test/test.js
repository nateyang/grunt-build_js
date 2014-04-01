// 测试文件

var fs = require('fs');
var annotation = require('../annotation');

var fileContent = fs.readFileSync('src/testscript.js',{encoding:'utf-8'});
// 实例化时传入文件内容
var _annotation = new annotation(fileContent);
var newFileContent = _annotation.getString();
fs.writeFileSync('dest/testscript.js',newFileContent,{encoding:'utf-8'});

/*_annotation.insertStr(18,'//末尾插入一段文字__');
//恢复注释
_annotation.recover();
_annotation.insertStr(41,'__恢复注释后末尾再插入一段文字__');
var newFileContent = _annotation.getString();
fs.writeFileSync('dest/testscript.js',newFileContent,{encoding:'utf-8'});*/
