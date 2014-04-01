<h1>Annotation</h1>
<p>一个注释的操作小工具,可以用于一般的js文件内容操作，比如在js文件做一些正则匹配，如果不想将注释计算在内，可以先利用这个工具移除掉注释</p>
<h3>实例化</h3>
<pre>
var Annotation = require(annotation);
var annotation = new Annotation(str);
</pre>
<h3>getString</h3>
<p>获取处理后的文字</p>
<pre>
  annotation.getString();
</pre>
<h3>insertStr</h3>
<p>在指定位置插入内容</p>
<pre>
  annotation.insertStr(index,str);
</pre>
<p><strong>index</strong> 插入内容的位置</p>
<p><strong>str</strong> 插入的内容</p>
<h3>recover</h3>
<p>恢复所有注释</p>
<pre>
  annotation.recover();
</pre>
