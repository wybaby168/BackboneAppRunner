/**
 * config.js
 * AMD模块化全局配置工具 Ver2.0
 *
 * @author wangyu
 *
 * 符合AMD规范的编程适用，命名空间自动管理和手动管理（默认手动管理）
 * 请尽量使用$$.import和$$.modules来进行页面控制
 * $$(func) 定义一个Ready方法，提供由$$.modules里加载的所有模块支持
 * $$.mod(key, path, deps, exports...) 定义一个新的模块路径设置，并且定义依赖（可以无依赖）
 * $$.import(mod) 导入方法，类似于java的导入，可以为指定页面添加模块（IE6下用config.put）
 *
 * @description 所有模块都采用匿名访问方式
 *
 */
(function(root, factory){
    /**
     * 默认包含的模块
     * @type {string[]}
     * @private
     */
    var _DEFAULT_MODULES_ = [
        'commons',   //公共类
        'bootbox',   //提示框
        'navbar',  //导航操作
        'cedpui',     //公共UI
        'lodash',
        'validation'
    ],
    /**
     * 默认配置文件路径
     * @type {string}
     * @private
     */
    _SETTING_PATH_ = _CONTEXT_PATH + '/static/js/commons/settings/modules.conf',
    /**
     * 默认查找路径
     * @type {string}
     * @private
     */
    _DEFAULT_BASEPATH_ = _CONTEXT_PATH + '/static/js/commons',
	BLANK_FUNC = function () {};

    var util = function () {
        var dom, path, urlPath;

        var abs2relative = function (path, base) {
            base = base ? base : _DEFAULT_BASEPATH_;
            var br = base.split('/'),
                pr = path.split('/'),
                brl = br.length,
                prl = pr.length,
                rr = '',
                cache = '';
            for (var i = 0; i < brl; i ++) {
                if (typeof pr[i] == 'undefined' || br[i] != pr[i]) {
                    cache += typeof pr[i] == 'undefined' ? '' : path.substr(path.indexOf(pr[i]));
                    rr += '../';
                    if (i == brl - 1) {
                        rr += cache;
                    }
                }
            }
            if (prl > brl && rr == '') {
                rr = path.substr(base.length + 1);
            }
            return rr;
        },
        assign = function (source, dest, deep) {
            return assignWith(source, dest, deep, BLANK_FUNC);
        },
        assignWith = function (source, dest, deep, func, force) {
			//deep 深拷贝，将原来对象替换为一个新的对象并赋值，浅拷贝，只赋值
			dest = deep ? assign(dest , {}) : dest;
			if (force || (source && dest && source.constructor == Object && dest.constructor == Object)) {
				for (var key in source) {
					if (source.hasOwnProperty(key) && source[key]) {
						func(dest);
						dest[key] = source[key];
					}
				}
			}
			return dest;
		},
        assignTo = function (source, dest) {
            return assignWith(source, dest, false, BLANK_FUNC, true);
        },
        relative2abs = function (relative, base, mid) {
            base = base ? base : _DEFAULT_BASEPATH_;
            var rr = relative.split('/'),
                br = base.split('/'),
                brl = br.length, abs;
            for (var i = 0; i < brl; i ++) {
                if (rr[i] == '..') {
                    br.pop();
                    brl --;
                } else {
                    break;
                }
            }
            abs = br.join('/') + '/' + relative.substr(relative.lastIndexOf(rr[i]));
            return mid ? abs2relative(abs, mid) : abs;
        },
        currentPath = function(abs)  {
            var url = document.scripts[document.scripts.length - 1].src,
                pos = url.indexOf('/',url.indexOf('//') + 2);  //'https://'.length
            path = url.substring(pos, url.lastIndexOf('/'));
            return abs ? abs2relative(path) : path;
        },
        currentURLPath = function () {
            if (!urlPath) {
                urlPath = location.pathname.replace(location.search,'');
                urlPath = urlPath.substr(0, urlPath.lastIndexOf('/'));
            }
            return urlPath;
        },
        getArgs = function(func) {
            // 先用正则匹配,取得符合参数模式的字符串.
            // 第一个分组是这个: ([^)]*) 非右括号的任意字符
            var args = func.toString().match(/function.*?\(([^)]*)\)/);
            args = args && args.index == 0 ? args[1].split(',') : [];
            var each;
            for (var i = 0; i < args.length; i ++) {
                if ((each = args[i])) {
                    each = each.replace(/\/\*.*\*\//, "").trim();
                } else {
                    args.splice(i, 1);
                }
            }
            return args;
        },
        appendRequireJs = function (config) {
            dom = document.createElement('script');
            dom.setAttribute('data-main', _DEFAULT_BASEPATH_ + '/' + (config ? config : 'requireJs/config.js'));
            dom.src = _DEFAULT_BASEPATH_ + '/requireJs/require.js';
            document.body.appendChild(dom);
        },
        ready = function (callback) {
            document.addEventListener && document.addEventListener('DOMContentLoaded', function(){
                document.removeEventListener('DOMContentLoaded',arguments.callee,false);
				callback && callback();
            }, false);
        };

        return {
            abs2relative: abs2relative,
            relative2abs: relative2abs,
            assign : assign,
			assignWith : assignWith,
			assignTo: assignTo,
            getArgs : getArgs,
            currentPath: currentPath,
            currentURLPath : currentURLPath,
            appendRequireJs: appendRequireJs,
            ready: ready
        }
    }();

    var xhrHelper = function () {
        var rsyncXHR = new XMLHttpRequest(),
            count = 0;

        var DEFAULT_FETCH_SETTING = {
            headers : {contentType: "application/x-www-form-urlencoded;charset=utf-8"},
            method : 'GET',
            responseType : 'json',
            data : {},
            filter : BLANK_FUNC,
            rsync : false
        };

        var DataModel = function (baseUrl, method) {
            var data = {}, length = 0;
			method = method ? method : 'GET';

            this.append = function (key, value) {
                if (key && value) {
					data[key] = value;
					length ++;
                }
            };
            this.appendAll = function (obj) {
                util.assignWith(obj, data, false, function () {
					length ++;
				});
			};
			this.serialize = function () {
				var prefix = '', key, start, result = baseUrl && baseUrl.indexOf('?') == -1 ? '?' : '';
				for (key in data) {
                    result += prefix + key + '=' + data[key];
					if (!start) {
						prefix = '&';
						start = true;
					}
				}
                return method == 'GET' ? encodeURI(result) : result;
            };
			this.isEmpty = function () {
                return length == 0;
            };
        };

        var BatchLiner = function (paths, setting, prefix) {
            var executors = this.executors = [], results = [], i, length = paths.length;
            var already = 0, after;
            prefix = prefix ? prefix : '';

            for (i = 0; i < length; i ++) {
                executors.push(load(prefix + paths[i], setting).then(function (data) {
                    if ((++already) == length) {
                        for (var j = 0; j < length; j ++) {
                            results[j] = executors[j].result;
                        }
                        after.apply({}, results);
                    }
                }));
            }
            this.then = function (callback) {
                after = callback;
            };
            this.when = function (name, callback) {
                for (i = 0; i < length; i ++) {
                    executors[i].xhr[name] = callback;
                }
            };
        };

        var RequestExecutor = function (setting) {
            var xhr = setting.rsync ? rsyncXHR : new XMLHttpRequest();
            var path = setting.path;
            var formData = new DataModel(path, setting.method);
            var self = this, key;
            xhr.abort();
            this.result = null;
            this.id = count ++;
            this.xhr = xhr;
            this.then = function (callback) {
                callback = callback ? callback : BLANK_FUNC;
                xhr.onreadystatechange = function () {
                    packet.apply(self, [xhr, callback, setting]);
                };
                return this;
            };
            this.when = function (name, callback) {
                xhr[name] = callback;
                return this;
            };
            if (setting.rsync && !xhr.onreadystatechange) this.then();
            formData.appendAll(setting.data);
            path = formData.isEmpty() ? path : path + formData.serialize();

            //false同步发送，true异步发送
            xhr.open(setting.method, path, !setting.rsync);
            if (!setting.rsync) xhr.responseType = setting.responseType;
            for (key in setting.headers) {
                if (setting.headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, setting.headers[key]);
                }
            }
            xhr.send(null);
        };

        var packet = function (xmlHttpRequest, callback, xhrSetting) {
			if (xmlHttpRequest.status == 200) {
				if(xmlHttpRequest.readyState == 4){
				    var result;
					try {
						var response = xmlHttpRequest.response;
                        result = response ? response : xmlHttpRequest.responseText;
						if (xhrSetting.responseType == 'json' && result && result.constructor != Object) {
							result = JSON.parse(result);
						}
						this.result = result;
					} catch (e) {
						location.replace(_CONTEXT_PATH);
					}
					xhrSetting.filter(result);
					callback(result);
				}
            } else {
                console.error('fetch加载失败[url:'+xhrSetting.path+']，请检查网络连接或者请求路径！');
            }
        };

        var load = function (path, setting) {
            var xhrSetting = util.assign(setting, DEFAULT_FETCH_SETTING, true), executor;
            if (path instanceof Array && path.length > 0) {
                return new BatchLiner(path, setting, arguments[2]);
            }
            xhrSetting.path = path;
            executor = new RequestExecutor(xhrSetting);
            return xhrSetting.rsync ? executor.result : executor;
        };

        var loadTpl = function (path, prefix, modify) {
            var setting = { responseType : 'text' };
            util.assign(modify, setting);
            if (typeof path === 'string') {
                path = prefix ? prefix + path : path;
            }
            return load(path, setting, prefix);
        };

        var template = function (length, templates, urls, keys, then) {
			loadTpl(urls).then(function () {
			    for (var i = 0; i < length; i++) {
					templates[keys[i]] = _.template(arguments[i]);
				}
				then ? then.apply({},arguments) : null;
			});
		},  templates = function (templates, then) {
            var keys = [], urls = [], i = 0; //有序的键值对
            for (var key in templates) {
                if (templates.hasOwnProperty(key)) {
					keys[i] = key;
					urls[i++] = templates[key];
                }
            }
            template(i, templates, urls, keys, then);
		};

        var configure = function (_setting) {
            util.assign(_setting, DEFAULT_FETCH_SETTING);
		};

        return {
            load : load,
            loadTpl : loadTpl,
            templates : templates,
            configure: configure
        }
    }();


    /**
     * 全局加载设置 - 核心
     * @type {{set, get, clear, ready, init, state, take, unbind}}
     * 自动命名空间管理，生命周期创建全局变量，执行完毕清理全局变量
     * 可以手动绑定，也可以手动清理
     */
    factory = function () {

        var cfg = {
            //拷贝数据
            data : [].concat(_DEFAULT_MODULES_),
            //方法池
            func_pool : [],
            //是否立即执行
            immediate : false,
            //命名空间自动销毁
            autoNS: false,
            //DOM加载需求
            dom: true,
            //DEBUG开关
            debug : false,
            //基本查找路径
            baseUrl : _DEFAULT_BASEPATH_,
            //模块路径
            paths : {},
            //模块依赖
            shim: {},
            //全局依赖
            map: {},
            setting_path : _SETTING_PATH_
        };

        var i,c,rn,mn;

        //全局执行函数
        var init = function () {
            /* 初始化layer 设置 */
            layer.config({
                path: commons.getPath() + '/static/js/commons/frame/layer/'
            });

            //显式调用自动初始化
            for (c = 0; c < arguments.length; c ++) {
                if ((rn = arguments[c]) && typeof rn.init === 'function' && util.getArgs(rn.init).length == 0) {
                    rn.init();
                }
            }

            //执行预定义方法
            for (c = 0; c < cfg.func_pool.length; c ++) {
                cfg.func_pool[c].apply(this, arguments);
            }
        },
        put = function (config) {
            if (arguments.length == 1) {
                if (config instanceof Array) {
                    cfg.data = cfg.data.concat(config);
                } else if (typeof config == 'string') {
                    cfg.data.push(config);
                }
            } else {
                cfg.data = cfg.data.concat(Array.prototype.slice.call(arguments,0));
            }
            return $$;
        },
        cat = function (modules, path) {
            path = wrapPath(path);
            if (modules instanceof Array) {
                for (i = 0; i < modules.length; i ++) {
                    put(path + '/' + modules[i]);
                }
            } else {
                put(path + '/' + modules);
            }
            return $$;
        },
        getAll = function () {
            return cfg.data;
        },
        getPath = function (name) {
            var result = util.currentPath();
            if (name && cfg.paths && cfg.paths.hasOwnProperty(name)) {
                result = cfg.baseUrl + '/' + cfg.paths[name];
            }
            return result.substr(0, result.lastIndexOf('/') + 1);
        },
        enableAutoNS = function (flag) {
            cfg.autoNS =flag ? flag : true;
        },
        enableDOMReady = function (flag) {
            cfg.dom = flag ? flag : true;
        },
        enableDEBUG = function (flag) {
            cfg.debug = flag ? flag : true;
        },
        mod = function(key,path,deps,exports) {
            cfg.paths[key] = wrapPath(path);
            if (typeof deps != 'undefined' && deps != null) {
                if (!(deps instanceof Array)) {
                    deps = [deps];
                }
                for (i = 0; i < deps.length; i ++) {
                    if (!cfg.paths.hasOwnProperty(deps[i])) {
                        deps.splice(i,1);
                    }
                }
                rn = {deps: deps};
                if (typeof exports == 'string') {
                    rn.exports = exports;
                }
                cfg.shim[key] = rn;
            }
            return $$;
        },
        //进行参数空间初始化(劫持调用)
        nameSpace = function () {
            for (i = 0; i < cfg.data.length; i ++) {
                mn = cfg.data[i];
                if (typeof arguments[i] != 'undefined') {
                    rn = cfg.shim[mn];
                    if (typeof rn != 'undefined' && typeof rn.exports == 'string') {
                        mn = rn.exports;
                    } else if((rn = mn.lastIndexOf('/')) != -1) {
                        mn = mn.substr(rn + 1);
                    }
                    //过滤全局变量
                    if (typeof root[mn] == 'undefined') {
                        root[mn] = this[mn] = arguments[i];
                    }
                }
            }
            return this;
        },
        //进行参数空间清理（劫持调用）
        cleanSpace = function () {
            for (mn in this) {
                if (this.hasOwnProperty(mn) && typeof root[mn] != 'undefined') {
                    delete root[mn];
                }
            }
        },
        ready = function (func) {
            if (typeof func == 'function') {
				//只要绑定了Ready方法，就立即执行，否则必须手动
				if (!cfg.immediate && !cfg.debug) {
					util.ready(util.appendRequireJs);
					cfg.immediate = true;
				}

                cfg.func_pool.push(function () {
                    nameSpace.apply(this,arguments);
                    func.apply(this,arguments);
                    cfg.autoNS && cleanSpace.apply(this);
                });
            }
        },
        clear = function () {
            cfg.data = [].concat(_DEFAULT_MODULES_);
            cfg.immediate = false;
        },
        //立即执行种子
        state = function () {
            return cfg.immediate;
        },
        getUtil = function () {
            return util;
        },
        getConfig = function () {
            return cfg;
        },
        setConfig = function (conf) {
            cfg = conf;
        },
        wrapPath = function (path) {
            var src = util.currentPath();
            if (typeof AppConfigurator != 'undefined' && AppConfigurator.start) src = AppConfigurator.start;
			if (typeof path == 'undefined' && document.scripts) {
				path = util.currentPath(true);
			} else if (typeof path != 'undefined'){
				path = util.relative2abs(path, src, _DEFAULT_BASEPATH_);
			} else {
				path = '.';
			}
			return path;
		};

        //设置便利使用方法
        if (typeof $$ == 'undefined') {
            root.$$ = ready;
            root.include = cat;
            util.assignTo({
                'include': cat,
                'modules': getAll,
                'mod': mod,
                'import': put,
                'fetch': xhrHelper.load,
                'fetchSetup': xhrHelper.configure,
                'load': xhrHelper.loadTpl,
                'templates': xhrHelper.templates
            }, $$);
        }

        return {
            //导入模块
            put: put,
            //拼接js
            cat: cat,
            //获取现有加载的模块
            getAll: getAll,
            //获取组件自我路径
            getPath : getPath,
            //获取内部工具
            getUtil : getUtil,
            //设置
            setConfig: setConfig,
            //获取设置
            getConfig: getConfig,
            //清除自定义数据
            clear : clear,
            //JS加载完毕的事件
            ready: ready,
            //js初始化函数
            init: init,
            //模块设置
            mod: mod,
            //管理自动命名空间功能
            enableAutoNS: enableAutoNS,
            //管理DOM加载前置条件
            enableDOMReady: enableDOMReady,
            //管理调试状态
            enableDEBUG : enableDEBUG,
            //自动执行状态
            state: state
        };
    }();
    root.config = factory;
})(this);