/**
 * AppConfigurator
 * 系统配置器（Api的部分实现）
 * @author wangyu
 * @date 2017/1/16
 */
;(function (root, factory) {

	if (typeof define === "function" && define.amd) {
		define('AppConfigurator', ['config'], factory);
	} else {
		factory();
	}

}(this, function () {

	var root = window;
	//FIXME 暂时依赖config.js 废弃后改造
	var cfg = config.getConfig(), assign = config.getUtil().assign,
		url = AppLoader.configure();

	var Module = function() {
		this.basePath = _CONTEXT_PATH + '/static/js/commons/components/';
		this.need = function () {this.deps = Array.apply([], arguments)};
		this.name = function (name) {this._name = name};
		this.factory = function (factory) {this._factory = factory};
	};

	Module.prototype.exports = function (src) {
		var args = [];
		for (var i = 0; i < this.deps.length; i++) {
			args[i] = src[this.deps[i]];
		}
		return args;
	};

	root.AppModule = function (module) {
		var mod = new Module();
		module.call(this, mod);
		if (typeof define === "function" && define.amd) {
			var args = [mod.deps, mod._factory],
				name = mod._name;
			if (name) args.unshift(name);
			define.apply(root, args);
		} else {
			$(function () {
				root[mod._name] = mod.factory.apply(root, mod.exports(root));
			});
		}
	};

	AppLoader.configure = function (after) {
		//加载配置
		$$.fetch(url).then(function (setting) {
			cfg.paths = assign(cfg.paths, setting['_DEFAULT_PATHS_']);
			cfg.shim = assign(cfg.shim, setting['_DEFAULT_SHIM_']);
			cfg.map = assign(cfg.map, setting['_DEFAULT_MAP_']);
			requirejs.config({
				//定义基本查找路径
				baseUrl: cfg.baseUrl,
				//定义特殊查找路径
				paths: cfg.paths,
				//配置依赖关系
				//exports所做的就是把exports的对象交由requirejs管理
				shim: cfg.shim,
				//配置映射
				map: cfg.map
			});
			after();
		});
	};
	AppLoader.commonInit = function () {
		//菜单数量
		$$.fetch(_CONTEXT_PATH+'/count.json').then(function (result) {
			document.getElementById('menu').querySelector('.count_todo').innerHTML = result.todo;
		});
		require(['layer'], function (layer) {
			/* 初始化layer 设置 */
			layer.config({
				path: _CONTEXT_PATH + '/static/js/commons/frame/layer/'
			});
		});
	};

	AppLoader.load();

}));