/**
 * AppLoader
 * 系统加载器接口（Api，无实现）
 * @author wangyu
 */
AppLoader = function (loader) {
	AppLoader.load = function() {
		AppLoader.configure(function () {
			AppLoader.commonInit();
			require(['AppDelegate'], loader);
		});
	};
	AppLoader.configure = function () {
		return AppConfigurator.url;
	};
	AppLoader.commonInit = function () {};
	/* 记录当前脚本位置 */
	AppConfigurator.start = function() {
		var scripts = document.scripts,
			url = scripts[scripts.length - 1].src,
			pos = url.indexOf('/', url.indexOf('//') + 2);
		//'https://'.length
		return url.substring(pos, url.lastIndexOf('/'));
	}();
};
AppModule = function (module) {

};
AppConfigurator = function (url) {
	AppConfigurator.url = url;
};