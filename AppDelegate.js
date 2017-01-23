/**
 * AppDelegate
 * 系统总代理程序
 * @desc 废弃config.js，使用单例App对象模式，取消命名空间手动管理
 * @author wangyu
 * @date 2017/1/16
 */
;(function (root, factory) {

	if (typeof define === "function" && define.amd) {
		define('AppDelegate', ['underscore'], factory);
	} else {
		root.App = factory();
		$(function () {
			App.start();
		});
	}

}(this, function (_) {

	var implement = config;
	//系统全局总代理，目前优先级低于config.js。
	//TODO config.js 后续废弃
	var initializes = {
		before: [],
		after: []
	}, 	modules = [],
		namespace = [];
	//poly_fill
	_.substringAfter = function (str, pattern) {
		return str.indexOf(pattern) != -1 ? str.substr(str.lastIndexOf(pattern)+1) : str;
	};
	/* 方法执行器 */
	var execute = function(func_arr) {
		_.each(func_arr, function (func) {
			func.apply(this, [App.modules]);
		})
	},  lastComponent = function (url) {
		return _.substringAfter(url, '/');
	},	moduleInit = function (modules) {
		_.each(modules, function (module) {
			_.has(module, 'init') && _.isFunction(module.init) && module.init();
		});
	};

	var App = {
		initialize : function() {
			//关闭自动命名空间管理
			implement.enableAutoNS(false);
			modules = implement.getAll();
			namespace = _.map(modules, lastComponent);
			//做初始化和最后的工作
			require(modules, function () {
				App.modules = modules = _.zipObject(namespace, arguments);
				if (!_.isEmpty(initializes.after)) {
					execute.call(this, initializes.after);
				}
				//执行模块初始化
				moduleInit.call(this, modules);
				//启动路由
				if (App.history) App.history.start();
			});
			return this;
		},
		need: function () {
			var modules = Array.prototype.slice.call(arguments,0), length = modules.length;
			for (var i = 0; i < length; i ++) {
				if (modules[i].indexOf('mod:') != -1) {
					var uris = modules[i].split('|'), pos, first = uris[0], path;
					pos = (pos = first.lastIndexOf('/')) != -1 ? pos : 4;
					uris[0] = first.substr(pos + 1);
					path = first.substring(0, pos + 1).replace('mod:','../');
					modules[i] = path + uris[0];
					if (uris.length > 1) {
						for (var j = 1; j < uris.length; j ++) {
							modules.push(path + uris[j]);
						}
					}
				}
			}
			implement.put.apply(implement, [modules]);
			return this;
		},
		start: function () {
			if (!_.isEmpty(initializes.before)) {
				execute.call(this, initializes.before);
			}
			return this.initialize();
		},
		on: function (expression, func) {
			var chain = _.chain(expression).trim();
			if (_.isFunction(func)) {
				if (chain.startsWith('initialize')) {
					if (chain.endsWith('before').value()) {
						initializes.before.push(func);
					} else if (chain.endsWith('after').value()) {
						initializes.after.push(func);
					}
				} else {
					//do nothing
				}
			}
			return this;
 		}
	};

	return App;
}));
