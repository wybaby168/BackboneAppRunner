/**
 * mvc
 * Backbone MVC工厂
 * @warnning 全英文注释，需要上传github进行大家的验证
 * @author wangyu
 * @date 2017/1/13
 * 涉及到模型，视图，事件，路由，集合等，简化调用方法;
 * 基础描述
 * @desc Backbone的每个类里都有默认的参数属性名，请不要搞错（传递参数时）
 * Collection: [model, comparator],
 * Model: 有两个：用户自定义的参数表attrs， 系统默认[collection, parse(boolean), defaults]，
 * View: ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events']，
 * Router： [routes]
 * @desc Backbone使用方法请勿照搬，根据实际场景使用
 * 目前尚未完善：
 * 1.page对象未封装
 * 2.部分方法存在强耦合
 * 3.事件机制还未扩展
 * 目前已经完善：
 * 1.简单的双向绑定和智能分页支持
 * 2.系统启动事件
 */
;(function (root, factory) {

	if (typeof define === "function" && define.amd) {
		define('mvc', ['Backbone', 'AppDelegate'], factory);
	} else {
		factory(root.Backbone);
	}

}(this, function (Backbone, App) {
	//made by wy
	'use strict';
	var templateParent = _CONTEXT_PATH + '/static/templates',
		requestParent  = _CONTEXT_PATH,
		fetchSetting = {
			reset : true
		};
	//to make every tpl just load once!
	var tplWrapper = function () {
		var tplPool = {};
		//handle all the tpl callbacks
		var handler = function (tpl) {
			this._template = tpl;
			this.temp();
		};
		var future = function (obj, that) {
			var _loader = obj.tplLoader;
			obj.tplLoader = function (tpl) {
				_loader.apply(this, [tpl]);
				handler.apply(that, [obj._template]);
			}
		};
		return function (that) {
			var path = that.template(), template;
			if (tplPool.hasOwnProperty(path)) {
				if (typeof (template = tplPool[path]) === 'function') {
					that._template = template;
				} else {
					future(template, that);
				}
			} else {
				tplPool[path] = that;
				that.tplLoader = handler;
				$$.load(path, templateParent).then(function (tpl) {
					tpl = tplPool[path] = _.template(tpl);
					that.tplLoader(tpl);
					delete that.tplLoader;
				});
			}
			return path;
		}
	}(),tplRender = function () {
		var that = this,
			target = that.collection ? that.collection : that.model;
		//single handle the flow view exception, don't need to fetch
		if (this.flowed) return;
		if (this.flow){
			require(['flow'], function (flow) {
				flow.load({
					target : that.frame,
					url: _.isString(target.url) ? target.url : target.url(),
					flowSize: 8,
					template : that._template,
					done: function (result) {
						//额外操作 //填充并创建分页
						_.assign(result, that.constants);
					}
				});
			});
			this.flow = false;
			this.flowed = true;
		}
		//fetch when empty(or not parsed)
		if (!target.isParsed) {
			target.fetch({
				reset: true,
				data: this.serialize()
			});
		} else {
			//render the html
			var data = target.toJSON({expose: true});
			_.assign(data, this.constants);
			this.frame.html(this._template(data));
		}
		//handle the page Method
		if (this.page && target.isParsed) {
			require(['realPage', 'layer'], function(realPage, layer) {
				if (!that.paged) {
					realPage.create({
						frame: true,
						obj: that.frame.parent(),
						page: target.page,
						callback: function (pageNum) {
							layer.load(1, {
								shade: [0.3,'#fff']
							});
							var options = {};
							_.assign(options, fetchSetting);
							options.data = {
								pageNum: pageNum,
								pageSize: realPage.getPageSize()
							};
							_.assign(options.data, that.serialize());
							target.fetch(options);
						}
					})
				} else {
					realPage.update(target.page);
					layer.closeAll('loading');
				}
				that.paged = true;
			});
		}
	};
	//add the namespace and extend them
	_.assign(App, {
		Model : Backbone.Model.extend({
			//page indicator
			page : null,
			//the baseUrl you request
			urlRoot : requestParent,
			//the url you need to appoint
			id: null,
			//keys in this model, in the parseMethod and fetch serialize
			props: {},
			//common init realization! you need to execute this function when override this function.
			initialize : function () {
				this.url = typeof this.url === 'function' ? this.url() : this.urlRoot + this.url;
			},
			parse: function (resp, options) {
				if (resp.page) {
					this.page = resp.page;
				}
				this.isParsed = true;
				return _.pick(resp, this.props);
			},
			//interceptor for toJSON method
			toJSON: function(options) {
				var json = Backbone.Model.prototype.toJSON.apply(this, [options]);
				if (!_.isEmpty(this.page)) json.page = this.page;
				return json;
			},
			//common validation function, don't modify this function
			validate : function (attrs, options) {

			}
		}),
		View : Backbone.View.extend({
			//if you enable that, the view will be created by realPage
			page : false,
			//if you enable that, the view will be created by flowView
			flow: false,
			//save the common templates
			_template : null,
			//the selector you want to render, blank if there is the el's dom
			frame: null,
			//it's a function pool you put callbacks in it
			temp : function () {},
			//default data you bind to the render method
			constants: function () {},
			//when finished initialize
			after : function () {},
			//this is the most important method that you need override
			template : function () {},
			//common init realization! you need to execute this function when override this function.
			initialize : function () {
				var that = this;
				//init the frame
				this.frame = this.frame ? this.$el.find(this.frame) : this.$el;
				//init the templates
				tplWrapper(that);
				//init the constants
				that.constants = that.constants();
				//to do some config, initialize some data
				this.listenTo(this.collection, 'reset', this.render);
				this.listenTo(this.model, 'change', this.render);
				this.after();
				this.delegateEvents();
			},
			//you can override this method if there is a append or prepend shower
			render : function () {
				//template async to be retain
				if (typeof this._template === 'function') {
					tplRender.apply(this);
				} else {
					this.temp = tplRender;
				}
				return this;
			},
			//important method when doing page and post(序列化实现在此)
			serialize : function () {
				//the searchField or post data
				return {}
			},
			//the events you need to delegate, don't put in the template!!!
			events : {}
		}),
		Router: Backbone.Router.extend({
			//the default router every page would need
		}),
		Collection : Backbone.Collection.extend({
			//page indicator
			page : null,
			//the parse according to the resp object, when you need modify parse content
			identifier: null,
			//the url you request to server
			url: null,
			//it's possibly need to appoint what you want to get from response
			parse: function (resp) {
				if (resp.page) {
					this.page = resp.page;
				}
				this.isParsed = true;
				return this.identifier ? resp[this.identifier] : resp;
			},
			//this method judge the difference between 'View'
			initialize: function () {
				this.url = this.url ? requestParent + this.url : '';
			},
			//override the function fetch, and then apply a default option
			fetch: function (options) {
				if (!options) {
					options = _.clone(fetchSetting);
				}
				Backbone.Collection.prototype.fetch.apply(this, [options]);
			},
			//interceptor for toJSON method
			toJSON: function(options) {
				var json = Backbone.Collection.prototype.toJSON.apply(this, [options]), result = {};
				if (options && options.expose && (this.identifier)) {
					if (!_.isEmpty(this.page)) result.page = this.page;
					result[this.identifier] = json;
				} else {
					result = json;
				}
				return result;
			}
		}),
		history : Backbone.history,
		Events : Backbone.Events
	});
	return App;
}));