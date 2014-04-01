/**
 * Sea.js 2.1.0 | seajs.org/LICENSE.md
 */
(function(global, undefined) {

// Avoid conflicting when `sea.js` is loaded multiple times
if (global.seajs) {
  return
}

var seajs = global.seajs = {
  // The current version of Sea.js being used
  version: "2.1.0"
}

var data = seajs.data = {}

/**
 * util-lang.js - The minimal language enhancement
 */

function isType(type) {
  return function(obj) {
    return Object.prototype.toString.call(obj) === "[object " + type + "]"
  }
}

var isObject = isType("Object")
var isString = isType("String")
var isArray = Array.isArray || isType("Array")
var isFunction = isType("Function")

var _cid = 0
function cid() {
  return _cid++
}


/**
 * util-events.js - The minimal events support
 */

var events = data.events = {}

// Bind event
seajs.on = function(name, callback) {
  var list = events[name] || (events[name] = [])
  list.push(callback)
  return seajs
}

// Remove event. If `callback` is undefined, remove all callbacks for the
// event. If `event` and `callback` are both undefined, remove all callbacks
// for all events
seajs.off = function(name, callback) {
  // Remove *all* events
  if (!(name || callback)) {
    events = data.events = {}
    return seajs
  }

  var list = events[name]
  if (list) {
    if (callback) {
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i] === callback) {
          list.splice(i, 1)
        }
      }
    }
    else {
      delete events[name]
    }
  }

  return seajs
}

// Emit event, firing all bound callbacks. Callbacks are passed the same
// arguments as `emit` is, apart from the event name
var emit = seajs.emit = function(name, data) {
  var list = events[name], fn

  if (list) {
    // Copy callback lists to prevent modification
    list = list.slice()

    // Execute event callbacks
    while ((fn = list.shift())) {
      fn(data)
    }
  }

  return seajs
}


/**
 * util-path.js - The utilities for operating path such as id, uri
 */

var DIRNAME_RE = /[^?#]*\//

var DOT_RE = /\/\.\//g
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//

// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
function dirname(path) {
  return path.match(DIRNAME_RE)[0]
}

// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
// 标准化路径,去掉多余的层级展示
function realpath(path) {
  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, "/")

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/")
  }

  return path
}

// Normalize an id
// normalize("path/to/a") ==> "path/to/a.js"
// NOTICE: substring is faster than negative slice and RegExp
function normalize(path) {
  var last = path.length - 1

  // If the uri ends with `#`, just return it without '#'
  if (path.charAt(last) === "#") {
    return path.substring(0, last)
  }

  return  (path.substring(last - 2) === ".js" ||
      path.indexOf("?") > 0 ||
      path.substring(last - 3) === ".css") ? path : path + ".js"
}


var PATHS_RE = /^([^/:]+)(\/.+)$/
var VARS_RE = /{([^{]+)}/g

function parseAlias(id) {
  var alias = data.alias
  return alias && isString(alias[id]) ? alias[id] : id
}

function parsePaths(id) {
  var paths = data.paths
  var m
  if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
    id = paths[m[1]] + m[2]
  }

  return id
}

function parseVars(id) {
  var vars = data.vars

  if (vars && id.indexOf("{") > -1) {
    id = id.replace(VARS_RE, function(m, key) {
      return isString(vars[key]) ? vars[key] : m
    })
  }

  return id
}

function parseMap(uri) {
  var map = data.map
  var ret = uri

  if (map) {
    for (var i = 0, len = map.length; i < len; i++) {
      var rule = map[i]

      ret = isFunction(rule) ?
          (rule(uri) || uri) :
          uri.replace(rule[0], rule[1])

      // Only apply the first matched rule
      if (ret !== uri) break
    }
  }

  return ret
}


var ABSOLUTE_RE = /^\/\/.|:\//
var ROOT_DIR_RE = /^.*?\/\/.*?\//

function addBase(id, refUri) {
  var ret
  var first = id.charAt(0)


  // Absolute
  // 对应的这种路径//xx或者:/xx的url绝对路径
  if (ABSOLUTE_RE.test(id)) {
    ret = id
  }
  // Relative
  // 对应这种相对路径 .xx
  else if (first === ".") {
    ret = realpath((refUri ? dirname(refUri) : data.cwd) + id)
  }
  // Root
  // 对应根路径 /xx
  else if (first === "/") {
    var m = data.cwd.match(ROOT_DIR_RE)
    ret = m ? m[0] + id.substring(1) : id
  }
  // Top-level
  else {
    ret = data.base + id
  }

  return ret
}

function id2Uri(id, refUri) {
  if (!id) return ""

  id = parseAlias(id)
  id = parsePaths(id)
  id = parseVars(id)
  id = normalize(id)

  var uri = addBase(id, refUri)
  uri = parseMap(uri)

  return uri
}


var doc = document
var loc = location
var cwd = dirname(loc.href)
var scripts = doc.getElementsByTagName("script")

// Recommend to add `seajsnode` id for the `sea.js` script element
var loaderScript = doc.getElementById("seajsnode") ||
    scripts[scripts.length - 1]

// When `sea.js` is inline, set loaderDir to current working directory
var loaderDir = dirname(getScriptAbsoluteSrc(loaderScript) || cwd)

function getScriptAbsoluteSrc(node) {
  return node.hasAttribute ? // non-IE6/7
      node.src :
    // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
      node.getAttribute("src", 4)
}


/**
 * util-request.js - The utilities for requesting script and style files
 * ref: tests/research/load-js-css/test.html
 */

var head = doc.getElementsByTagName("head")[0] || doc.documentElement
var baseElement = head.getElementsByTagName("base")[0]

var IS_CSS_RE = /\.css(?:\?|$)/i
var READY_STATE_RE = /^(?:loaded|complete|undefined)$/

var currentlyAddingScript
var interactiveScript

// `onload` event is supported in WebKit < 535.23 and Firefox < 9.0
// ref:
//  - https://bugs.webkit.org/show_activity.cgi?id=38995
//  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
//  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
var isOldWebKit = (navigator.userAgent
    .replace(/.*AppleWebKit\/(\d+)\..*/, "$1")) * 1 < 536


//加载外部文件
function request(url, callback, charset) {
  var isCSS = IS_CSS_RE.test(url)
  var node = doc.createElement(isCSS ? "link" : "script")

  //设置文件编码
  if (charset) {
    var cs = isFunction(charset) ? charset(url) : charset
    if (cs) {
      node.charset = cs
    }
  }

  //加载文件
  addOnload(node, callback, isCSS)

  if (isCSS) {
    node.rel = "stylesheet"
    node.href = url
  }
  else {
    node.async = true
    node.src = url
  }

  // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
  // the end of the insert execution, so use `currentlyAddingScript` to
  // hold current node, for deriving url in `define` call
  currentlyAddingScript = node

  // ref: #185 & http://dev.jquery.com/ticket/2709
  baseElement ?
      head.insertBefore(node, baseElement) :
      head.appendChild(node)

  currentlyAddingScript = null
}

function addOnload(node, callback, isCSS) {
  var missingOnload = isCSS && (isOldWebKit || !("onload" in node))

  // for Old WebKit and Old Firefox
  //由于有些浏览器无法通过onload或者onreadystatechange来加载检测css文件加载状态，需要使用轮询来检查
  if (missingOnload) {
    setTimeout(function() {
      pollCss(node, callback)
    }, 1) // Begin after node insertion
    return
  }

  //为其余浏览器绑定onload或者onreadystatechange事件
  node.onload = node.onerror = node.onreadystatechange = function() {
    if (READY_STATE_RE.test(node.readyState)) {

      // Ensure only run once and handle memory leak in IE
      //移除掉onload事件，释放内存
      node.onload = node.onerror = node.onreadystatechange = null

      // Remove the script to reduce memory leak
      //由于js被加载并执行后就保存在内存中，所以可以移除掉node，释放内存
      if (!isCSS && !data.debug) {
        head.removeChild(node)
      }

      // Dereference the node
      node = null

      callback()
    }
  }
}

//不支持css onload的浏览器判断css文件加载成功的方法
function pollCss(node, callback) {
  var sheet = node.sheet
  var isLoaded

  // for WebKit < 536
  if (isOldWebKit) {
    if (sheet) {
      isLoaded = true
    }
  }
  // for Firefox < 9.0
  else if (sheet) {
    try {
      if (sheet.cssRules) {
        isLoaded = true
      }
    } catch (ex) {
      // The value of `ex.name` is changed from "NS_ERROR_DOM_SECURITY_ERR"
      // to "SecurityError" since Firefox 13.0. But Firefox is less than 9.0
      // in here, So it is ok to just rely on "NS_ERROR_DOM_SECURITY_ERR"
      if (ex.name === "NS_ERROR_DOM_SECURITY_ERR") {
        isLoaded = true
      }
    }
  }

  setTimeout(function() {
    if (isLoaded) {
      // Place callback here to give time for style rendering
      callback()
    }
    else {
      pollCss(node, callback)
    }
  }, 20)
}

//通过script标签的interactive状态，获取当前script标签
function getCurrentScript() {
  if (currentlyAddingScript) {
    return currentlyAddingScript
  }

  // For IE6-9 browsers, the script onload event may not fire right
  // after the the script is evaluated. Kris Zyp found that it
  // could query the script nodes and the one that is in "interactive"
  // mode indicates the current script
  // ref: http://goo.gl/JHfFW
  if (interactiveScript && interactiveScript.readyState === "interactive") {
    return interactiveScript
  }

  var scripts = head.getElementsByTagName("script")

  for (var i = scripts.length - 1; i >= 0; i--) {
    var script = scripts[i]
    if (script.readyState === "interactive") {
      interactiveScript = script
      return interactiveScript
    }
  }
}


/**
 * util-deps.js - The parser for dependencies
 * ref: tests/research/parse-dependencies/test.html
 */

var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g
var SLASH_RE = /\\\\/g

//获取依赖
function parseDependencies(code) {
  var ret = []

  code.replace(SLASH_RE, "")
      .replace(REQUIRE_RE, function(m, m1, m2) {
        if (m2) {
          ret.push(m2)
        }
      })

  return ret
}


/**
 * module.js - The core of module loader
 */

var cachedMods = seajs.cache = {}
var anonymousMeta

var fetchingList = {}
var fetchedList = {}
var callbackList = {}

var STATUS = Module.STATUS = {
  // 1 - The `module.uri` is being fetched
  //正在获取模块
  FETCHING: 1,
  // 2 - The meta data has been saved to cachedMods
  //模块信息已经被保存
  SAVED: 2,
  // 3 - The `module.dependencies` are being loaded
  //模块依赖的模块都已经加载完毕,该模块开始加载
  LOADING: 3,
  // 4 - The module are ready to execute
  //模块加载完毕，已经可以开始执行
  LOADED: 4,
  // 5 - The module is being executed
  //开始执行模块
  EXECUTING: 5,
  // 6 - The `module.exports` is available
  //执行完毕
  EXECUTED: 6
}


function Module(uri, deps) {
  this.uri = uri
  this.dependencies = deps || []
  this.exports = null
  this.status = 0

  //依赖当前该模块的模块
  // Who depend on me
  this._waitings = {}

  //未被加载的依赖模块
  // The number of unloaded dependencies
  this._remain = 0
}

//解析该模块依赖列表上的模块
// Resolve module.dependencies
Module.prototype.resolve = function() {
  var mod = this
  var ids = mod.dependencies
  var uris = []

  for (var i = 0, len = ids.length; i < len; i++) {
    //根据id解析出url
    uris[i] = resolve(ids[i], mod.uri)
  }
  return uris
}

// Load module.dependencies and fire onload when all done
Module.prototype.load = function() {
  var mod = this

  //如果模块已经被加载了，不做处理,只有该模块所依赖的所有模块loaded，该模块才触发onload,
  //当前状态下需要等待其他模块的加载
  // If the module is being loaded, just wait it onload call
  if (mod.status >= STATUS.LOADING) {
    return
  }

  mod.status = STATUS.LOADING

  // Emit `load` event for plugins such as combo plugin
  //获取当前模块的依赖模块url,这里已经通过对依赖的模块id分析出物理路径
  var uris = mod.resolve()
  emit("load", uris)

  //依赖的模块数量
  var len = mod._remain = uris.length
  var m

  // Initialize modules and register waitings
  for (var i = 0; i < len; i++) {
    //获取依赖模块
    m = Module.get(uris[i])

    //依赖的但没有load完毕的模块
    if (m.status < STATUS.LOADED) {
      // Maybe duplicate
      //模块有可能重复
      //由于每个模块只可能执行一次load方法，所以这里的情况不会出现在一个模块两次load，而是类似这种情况
      //seajs.use(['a', 'b', 'a'], function(a, b, a) {})
      m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1
    }
    else {
      //如果依赖的模块已经loaded，降低计数器,这里只做简单的记数，不需要知道哪个模块已经被load
      mod._remain--
    }
  }

  //如果所有依赖的模块都load完毕，就执行onload
  if (mod._remain === 0) {
    mod.onload()
    return
  }

  // Begin parallel loading
  var requestCache = {}

  //对依赖的模块进行检查，主动触发其状态变化
  for (i = 0; i < len; i++) {
    m = cachedMods[uris[i]]

    //还未获取模块信息的，开始进行fetch操作
    //在这里可以过滤掉_waitings的重复模块的加载
    if (m.status < STATUS.FETCHING) {
      m.fetch(requestCache)
    }
    //已经保存信息和数据，但还没进行load完毕的
    else if (m.status === STATUS.SAVED) {
      m.load()
    }
  }

  // Send all requests at last to avoid cache bug in IE6-9. Issues#808
  //把requestCache保存的url在这里一次性的去请求,为了避免ie6-9存在缓存影响combo的模块加载的的情况，
  //所以在所有模块的对应的url的加载逻辑都确认以后,再去请求url,查看https://github.com/seajs/seajs/issues/808
  for (var requestUri in requestCache) {
    if (requestCache.hasOwnProperty(requestUri)) {
      requestCache[requestUri]()
    }
  }
}

//模块加载完毕
// Call this method when module is loaded
Module.prototype.onload = function() {
  var mod = this
  //改变模块的加载状态为已加载
  mod.status = STATUS.LOADED

  //执行model的callback回调
  if (mod.callback) {
    mod.callback()
  }

  // Notify waiting modules to fire onload
  //等待该模块加载的模块
  var waitings = mod._waitings
  var uri, m

  for (uri in waitings) {
    if (waitings.hasOwnProperty(uri)) {
      m = cachedMods[uri]
      //改变这些模块的remain数量，把对当前模块的依赖去掉
      m._remain -= waitings[uri]
      //如果这些模块的_remain列表为0
      if (m._remain === 0) {
        m.onload()
      }
    }
  }

  // Reduce memory taken
  //执行到onload的时候，_remain列表必然是已经清空的_waitings也没有意义了，可以清空
  delete mod._waitings
  delete mod._remain
}

//获取模块信息
// Fetch a module
Module.prototype.fetch = function(requestCache) {
  var mod = this
  var uri = mod.uri

  //改变模块当前的状态
  mod.status = STATUS.FETCHING

  // Emit `fetch` event for plugins such as combo plugin
  var emitData = { uri: uri }

  //通过fetch trigger可以为emitData添加requestUri属性，这个属性可以返回一个url，
  //这个url可以用来替换模块默认的url,比如combo，通过这个trigger可以让多个模块共用一个url请求资源
  emit("fetch", emitData)
  //优先获取trigger的requestUri,如果没有则使用模块的默认路径
  var requestUri = emitData.requestUri || uri

  //没有uri,还有已经fetched的直接执行模块的load方法(fetched的情况是该模块是一个combo请求，
  //通过别的模块combo的js文件已经加载,该模块可直接执行load方法)
  // Empty uri or a non-CMD module

  if (!requestUri || fetchedList[requestUri]) {
    mod.load()
    return
  }

  //有可能是combo的url,model直接添加进去
  //TODO:需要验证是否会同一个模块多次fetch
  if (fetchingList[requestUri]) {
    //放入回调列表,把model保存
    callbackList[requestUri].push(mod)
    return
  }

  //改变fetching状态
  fetchingList[requestUri] = true
  //放入回调列表,把model保存
  callbackList[requestUri] = [mod]

  // Emit `request` event for plugins such as text plugin
  //可以通过request的trigger为emitData添加requested属性，比如有些model不需要加载，像文字类的模块
  emit("request", emitData = {
    uri: uri,
    requestUri: requestUri,
    onRequest: onRequest,
    charset: data.charset
  })

  //如果设置了requestCache，则先不执行script的加载请求，先缓存,否则立即执行
  if (!emitData.requested) {
    requestCache ?
        requestCache[emitData.requestUri] = sendRequest :
        sendRequest()
  }

  //创建script或者css link标签，加载资源
  function sendRequest() {
    request(emitData.requestUri, emitData.onRequest, emitData.charset)
  }

  //加载完标签后，进行回调
  function onRequest() {
    //移除模块的fetching状态
    delete fetchingList[requestUri]
    //状态加入到fetched列表里
    fetchedList[requestUri] = true

    //TODO: Be going to read
    // Save meta data of anonymous module
    //在文件加载之后，获取define执行时获取的模块信息，执行save方法,将引入的模块信息注册到已创建的模块信息里，
    //值得注意的是匿名模块的dependencies信息就是在这里获取的
    if (anonymousMeta) {
      save(uri, anonymousMeta)
      anonymousMeta = null
    }

    //fetch之后开始执行模块的load方法,这里的mod储存为数组，是因为有可能通过combo的方式，加载资源
    //有可能多个模块使用同一个url，所以可能保存多个model来分别执行它们的load
    // Call callbacks
    var m, mods = callbackList[requestUri]
    delete callbackList[requestUri]
    while ((m = mods.shift())) m.load()
  }
}

// Execute a module
Module.prototype.exec = function () {
  var mod = this

  // When module is executed, DO NOT execute it again. When module
  // is being executed, just return `module.exports` too, for avoiding
  // circularly calling
  //如果模块的exec方法已经执行过一次，将不再执行，而直接返回exports，防止循环调用
  if (mod.status >= STATUS.EXECUTING) {
    return mod.exports
  }

  mod.status = STATUS.EXECUTING

  // Create require
  var uri = mod.uri

  //在下面的代码中，这个方法会被传递给当前model的factory，factory里的require会执行该模块所依赖模块的exec方法,
  //可以看出seajs是先从use开始，向上分析，确认模块之间的依赖关系，然后从顶层开始加载文件，待所有所依赖的文件
  //都加载完毕以后，再通过use的exec，通过require方法从顶层的exec执行下来返回exports
  //这里更像是这么一个过程： 冒泡的获取依赖关系和加载顺序，捕获的onload执行，冒泡的执行exec, 捕获的传递exports
  function require(id) {
    return cachedMods[require.resolve(id)].exec()
  }

  require.resolve = function(id) {
    return resolve(id, uri)
  }

  require.async = function(ids, callback) {
    Module.use(ids, callback, uri + "_async_" + cid())
    return require
  }

  // Exec factory
  var factory = mod.factory

  //通过执行model的factory,获取返回值作为exports，如果factory不是函数，则直接将factory作为exports
  //在这里肯定会执行该模块所依赖模块的exec方法
  var exports = isFunction(factory) ?
      factory(require, mod.exports = {}, mod) :
      factory

  //如果exports为undefined(对应factory的返回值),则直接使用mod的exports
  if (exports === undefined) {
    exports = mod.exports
  }

  // Emit `error` event
  //如果exports仍然为null,并且模块并不是css文件,则trigger一个error事件
  if (exports === null && !IS_CSS_RE.test(uri)) {
    emit("error", mod)
  }

  // Reduce memory leak
  delete mod.factory

  //为exports赋值(针对通过factory return的形式)
  mod.exports = exports
  mod.status = STATUS.EXECUTED

  // Emit `exec` event
  //执行exec的trigger
  emit("exec", mod)

  return exports
}

// Define a module
//声明一个模块,该方法在js模块文件被引入的时候执行
Module.define = function (id, deps, factory) {
  var argsLen = arguments.length

  // define(factory)
  //只传入一个参数
  if (argsLen === 1) {
    factory = id
    id = undefined
  }
  //传入两个参数
  else if (argsLen === 2) {
    factory = deps

    // define(deps, factory)
    if (isArray(id)) {
      deps = id
      id = undefined
    }
    // define(id, factory)
    else {
      deps = undefined
    }
  }

  // Parse dependencies according to the module factory code
  //如果没有手动传入依赖参数，则通过toSring来获取require的模块名
  if (!isArray(deps) && isFunction(factory)) {
    deps = parseDependencies(factory.toString())
  }

  //获取模块对应的信息
  var meta = {
    id: id,
    uri: resolve(id),
    deps: deps,
    factory: factory
  }

  // Try to derive uri in IE6-9 for anonymous modules
  //为ie获取当前script标签的src
  if (!meta.uri && doc.attachEvent) {
    var script = getCurrentScript()

    if (script) {
      meta.uri = script.src
    }

    // NOTE: If the id-deriving methods above is failed, then falls back
    // to use onload event to get the uri
  }

  // Emit `define` event, used in nocache plugin, seajs node version etc
  emit("define", meta)

  //如果(ie)能获取当前script的信息,则直接保存给model，不能的话就和其他浏览器一起，先将
  //模块信息保存在anonymousMeta
  meta.uri ? save(meta.uri, meta) :
      // Save information for "saving" work in the script onload event
      anonymousMeta = meta
}

//获取缓存的模块，如果还没有创建，新建一个
// Get an existed module or create a new one
Module.get = function(uri, deps) {
  return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps))
}

// Use function is equal to load a anonymous module
//使用该方法去加载一个匿名模块
Module.use = function (ids, callback, uri) {
  //当调用use的时候，也相当于创建了一个匿名模块，为该模块提供了dependencies等信息
  var mod = Module.get(uri, isArray(ids) ? ids : [ids])

  mod.callback = function() {
    var exports = []
    //use的这个模块的依赖模块的路径
    var uris = mod.resolve()

    //通过路径获取这些依赖的模块并执行exec方法
    for (var i = 0, len = uris.length; i < len; i++) {
      exports[i] = cachedMods[uris[i]].exec()
    }

    //执行use传入的callback
    if (callback) {
      //把所有模块的export对象队列传入
      callback.apply(global, exports)
    }

    delete mod.callback
  }

  //调用该匿名模块的load方法
  mod.load()
}

// Load preload modules before all other modules
//预加载模块，在所有模块加载之前加载，在调用seajs.use的时候执行
Module.preload = function(callback) {
  var preloadMods = data.preload
  var len = preloadMods.length

  if (len) {
    Module.use(preloadMods, function() {
      // Remove the loaded preload modules
      preloadMods.splice(0, len)

      // Allow preload modules to add new preload modules
      Module.preload(callback)
    }, data.cwd + "_preload_" + cid())
  }
  else {
    callback()
  }
}


// Helpers

function resolve(id, refUri) {
  // Emit `resolve` event for plugins such as text plugin
  var emitData = { id: id, refUri: refUri }
  emit("resolve", emitData)

  return emitData.uri || id2Uri(emitData.id, refUri)
}

function save(uri, meta) {
  var mod = Module.get(uri)

  // Do NOT override already saved modules
  if (mod.status < STATUS.SAVED) {
    mod.id = meta.id || uri
    mod.dependencies = meta.deps || []
    mod.factory = meta.factory
    mod.status = STATUS.SAVED
  }
}


// Public API
//通过use，调用模块
seajs.use = function(ids, callback) {
  Module.preload(function() {
    //每当调用use的时候，都生成一个临时的id，用来为当前的调用创建一个临时model对象，再去查找它的依赖,加载等操作
    Module.use(ids, callback, data.cwd + "_use_" + cid())
  })
  return seajs
}

Module.define.cmd = {}
global.define = Module.define


// For Developers

seajs.Module = Module
data.fetchedList = fetchedList
data.cid = cid

seajs.resolve = id2Uri
seajs.require = function(id) {
  return (cachedMods[resolve(id)] || {}).exports
}


/**
 * config.js - The configuration for the loader
 */

var BASE_RE = /^(.+?\/)(\?\?)?(seajs\/)+/

// The root path to use for id2uri parsing
// If loaderUri is `http://test.com/libs/seajs/[??][seajs/1.2.3/]sea.js`, the
// baseUri should be `http://test.com/libs/`
data.base = (loaderDir.match(BASE_RE) || ["", loaderDir])[1]

// The loader directory
data.dir = loaderDir

// The current working directory
data.cwd = cwd

// The charset for requesting files
data.charset = "utf-8"

// Modules that are needed to load before all other modules
data.preload = (function() {
  var plugins = []

  // Convert `seajs-xxx` to `seajs-xxx=1`
  // NOTE: use `seajs-xxx=1` flag in uri or cookie to preload `seajs-xxx`
  var str = loc.search.replace(/(seajs-\w+)(&|$)/g, "$1=1$2")

  // Add cookie string
  str += " " + doc.cookie

  // Exclude seajs-xxx=0
  str.replace(/(seajs-\w+)=1/g, function(m, name) {
    plugins.push(name)
  })

  return plugins
})()

// data.alias - An object containing shorthands of module id
// data.paths - An object containing path shorthands in module id
// data.vars - The {xxx} variables in module id
// data.map - An array containing rules to map module uri
// data.debug - Debug mode. The default value is false

//设置config
seajs.config = function(configData) {

  for (var key in configData) {
    // 最新传入的config配置
    var curr = configData[key]
    // 现有的config配置
    var prev = data[key]

    // Merge object config such as alias, vars
    // 如果参数是hash，合并配置,如果最新提供了，则覆盖已有的
    if (prev && isObject(prev)) {
      for (var k in curr) {
        prev[k] = curr[k]
      }
    }
    else {
      // Concat array config such as map, preload
      // 如果参数是一个数组
      if (isArray(prev)) {
        //合并数组
        curr = prev.concat(curr)
      }
      // Make sure that `data.base` is an absolute path
      //如果传入的参数是base
      else if (key === "base") {
        //强制为base路径添加文件夹结束符号
        (curr.slice(-1) === "/") || (curr += "/")
        curr = addBase(curr)
      }

      // Set config
      data[key] = curr
    }
  }

  emit("config", configData)
  return seajs
}


})(this);
