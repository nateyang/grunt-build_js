<h1>grunt-build_js</h1>
<p>基于<strong>grunt-tanslate_cmd</strong> <strong>grunt-contrib-concat</strong> <strong>grunt-contrib-uglify</strong> <strong>grunt-contrib-clean</strong>整合的cmd build grunt小工具,grunt加载该插件后，无需再配置和加载以上插件，简化了grunt 进行cmd任务的配置</p>
<h3>update.js</h3>
<p>通过在此插件的根目录执行node update.js可以更新此插件依赖的<strong>grunt-tanslate_cmd</strong> <strong>grunt-contrib-concat</strong> <strong>grunt-contrib-uglify</strong> <strong>grunt-contrib-clean</strong> (为了简化，后续称这四个插件为基础插件)到最新版本</p>
<h3>options.root</h3>
<p>cmd提取id的根目录(转化cmd时必填)</p>
<h3>options.cmd</h3>
<p>是否进行translate_cmd的转化任务</p>
<h3>options.concat</h3>
<p>是否进行文件合并任务</p>
<h3>options.build</h3>
<p>concat和并的url路径</p>
<h3>options.clean</h3>
<p>是否清除cmd任务产生的单独文件</p>
<p>其余的options参数会带到<strong>grunt-tanslate_cmd</strong> <strong>grunt-contrib-concat</strong> <strong>grunt-contrib-uglify</strong> <strong>grunt-contrib-clean</strong>当中去，对各任务进行配置</p>
<pre>
module.exports = function(grunt) {

  grunt.initConfig({

    build_js: {
      app: {
        options: {
          root: './',
          build: 'test/dest/app/merge.js',
          clean: true
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

  grunt.loadNpmTasks('grunt-build_js');

  grunt.registerTask('default', ['build_js']);

};
</pre>
<p>以上是一个grunt-build_js任务的基本配置,通过npm install此插件后，不需要再配置concat,uglify,clean和translate_cmd,此插件已在内部集成它们，如果想要使用这四个基础插件的最新版本的,可以在grunt-build_js目录执行update.js,执行后会将最新的基础插件更新到build_js中去</p>
<pre>node update.js</pre>
<p>该插件执行的大致顺序是
  <ol>
    <li>通过tanslate_cmd提取出各个cmd模块文件的id</li>
    <li>通过concat将提取出来id的cmd模块进行合并</li>
    <li>通过uglify对concat合并的文件进行压缩</li>
    <li>清除translate_cmd创建出来的单独文件</li>
  </ol>
</p>
<p>通过以上流程可以看出，一旦有第一步的需求（可以通过options.cmd参数来制定是否需要cmd的id提取操作,该参数默认为true）,就必须要保证我们的grunt任务传入的src文件和dest文件必须是一一对应的，因为cmd提取id的操作是在合并文件之前，依赖文件路径操作的。所以在有cmd参数时，最好使用动态文件对象</p>
<pre>
  files: {
    expand: true,
    cwd: ''
    src: ''
    dest: ''
  }
</pre>
<p>对应第一步一定要提供options的root参数，该参数是对应的web项目的根目录，如果出于某种原因无法提供，也可以提供一个相对路径,但该路径一定要是web目录的子孙级目录</p>
<p>第二步concat处理的时候，合并文件的地址要通过options.build传入，为的是保证build_js文件对象的整洁和简化</p>
<p>第四步的由于第一步的任务会在制定位置创建出被提取过id以后的module js临时文件，合并之后无需保存，所以可以通过clean清除掉，如果不想清除，也可以通过options.clean = false来保留,注意，clean只在cmd为true时可以生效,为了是避免非cmd情况下，误删合并后的文件</p>
