define(function (require,exports,moudle) {
  // 获取模块
  var _moudle = require('./moudle.js');
  console.log(_moudle.text);
  return {
    newText: _moudle.text + '来自于testscript'
  }
})
