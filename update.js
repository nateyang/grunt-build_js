/*
 * update
 * Copyright (c) 2014 nateyang
 * Licensed under the MIT license.
 */

(function () {

  var deferred = require('./tasks/libs/deferred');
  var exec = require('child_process').exec;
  var fs = require('fs');
  var mainReg = /"\s*main\s*"\s*:\s*"(.*)",?/;
  var ruleEnding = /,[\r\n]/;


  /**
   * process
   * 执行process
   * @param command {string} shell命令
   * @return deferred.promise {function}
   */
  function process(command) {
    var _deferred = deferred();
    var _exec = exec(command);
    _exec.stdout.on('data',function(data) {
      console.log(data);
    })
    _exec.stderr.on('data',function(data) {
      console.log(data);
    })
    _exec.on('exit',function () {
      _deferred.resolve();
    })
    return _deferred.promise;
  }



  /**
   * done
   * 任务计数器
   */
  function done() {
    done.resolved++;
    if (done.resolved == done.total) {
      success();
    }
  }
  done.resolved = done.total = 0;
  done.addTask = function () {
    done.total += 1;
  }


  /**
   * 任务成功回调
   */
  function success() {
    console.log('---updated successfully!---');
  }


  /**
   * replacePackageJson
   * 替换package.json，增加替换main的js文件
   * @param fileDir {string} 文件目录
   * @param fileName {string} 文件名
   */
  function replacePackageJson(fileDir,fileName) {
    var filePath = fileDir + 'package.json';
    var fileContent = fs.readFileSync(filePath,{
      encoding: 'utf-8'
    });
    if (mainReg.test(fileContent)) {
      fileContent = fileContent.replace(mainReg,function (match,submatch) {
        return match.replace(submatch,'tasks/' + fileName);
      })
    } else {
      fileContent = fileContent.replace(ruleEnding,function (match) {
        return match + '  "main": "tasks/' + fileName + '",\n';
      })
    }
    fs.writeFileSync(filePath,fileContent);
  }


  /**
   * 更新grunt-contrib-concat
   */
  function updateConcat() {
    done.addTask();
    process('npm install grunt-contrib-concat --save-dev')(function () {
      process('rm -rf tasks/libs/concat')(function () {
        process('cp -rf node_modules/grunt-contrib-concat tasks/libs/concat')(function () {
          exec('rm -rf node_modules/grunt-contrib-concat');
          replacePackageJson('tasks/libs/concat/','concat.js')
          done();
        });
      })
    });
  }


  /**
   * 更新grunt-contrib-uglify
   */
  function updateUglify() {
    done.addTask();
    process('npm install grunt-contrib-uglify --save-dev')(function () {
      process('rm -rf tasks/libs/uglify')(function () {
        process('cp -rf node_modules/grunt-contrib-uglify tasks/libs/uglify')(function () {
          exec('rm -rf node_modules/grunt-contrib-uglify');
          replacePackageJson('tasks/libs/uglify/','uglify.js')
          done();
        });
      })
    });
  }


  /**
   * 更新grunt-contrib-clean
   */
  function updateClean() {
    done.addTask();
    process('npm install grunt-contrib-clean --save-dev')(function () {
      process('rm -rf tasks/libs/clean')(function () {
        process('cp -rf node_modules/grunt-contrib-clean tasks/libs/clean')(function () {
          exec('rm -rf node_modules/grunt-contrib-clean');
          replacePackageJson('tasks/libs/clean/','clean.js')
          done();
        });
      })
    });
  }


  /**
   * 更新grunt-translate_cmd
   */
  function updateTranslateCmd() {
    done.addTask();
    process('npm install grunt-translate_cmd --save-dev')(function () {
      process('rm -rf tasks/libs/translate_cmd')(function () {
        process('cp -rf node_modules/grunt-translate_cmd tasks/libs/translate_cmd')(function () {
          exec('rm -rf node_modules/grunt-translate_cmd');
          replacePackageJson('tasks/libs/translate_cmd/','translate_cmd.js')
          done();
        });
      })
    });
  }

  updateConcat();
  updateUglify();
  updateClean();
  updateTranslateCmd();

})();
