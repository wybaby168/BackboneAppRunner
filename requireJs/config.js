/**
 * RequireJS全局设置，模块管理
 * baseUrl: 基本查找路径，根目录
 * paths: 定义模块，使用模块名作为key，使用相对baseUrl的路径作为value
 * shim：定义依赖
 *       依赖会逐个定义，按照树形结构加载
 *       定义依赖使用deps 定义前置依赖，
 *              使用exports 定义导出变量
 * ~~~~~~注意~~~~~~所有设置都在commons/config.js下进行定义~~~~~~~~~
 */

//初始化设置
(function () {
    var cfg = config.getConfig(), assign = config.getUtil().assign;

    $$.fetch(cfg.setting_path)
        .then(function (setting) {

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

            //通过全局设置，判断立即执行
            if (config.state()) {
                //加载完页面之后异步加载js模块
                require($$.modules(),function () {
                    //config永远定义在执行之前
                    config.init.apply({},arguments);
                });
            }
        })
        .when('onerror',function (error) {
            alert('err: network error!' + error);
        });
}());


