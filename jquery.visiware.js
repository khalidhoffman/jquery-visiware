if (typeof  define !== 'function') {
    Visiware(function () {/* placeholder require function */
        return false;
    })
} else {
    define(
        [
            'require',
            'jquery'
        ],
        function Visiware(require) {

            var $ = require('jquery') || jQuery,
                $window = $(window),
                VAE = {
                    _instances: [],
                    _options: {
                        intervalDuration: 25,
                        timeoutDuration: 500,
                        onScrollOnly: true
                    },
                    _isListening: false,
                    /**
                     *
                     * @param instance {$.widget}
                     * @returns {$.widget}
                     * @private
                     */
                    _find: function (instance) {
                        var global = VAE,
                            instanceIndex = global._instances.indexOf(instance);
                        return (instanceIndex > -1) ? global._instances[instanceIndex] : null;
                    },
                    /**
                     *
                     * @param instance {$.widget}
                     * @returns {$.widget}
                     * @private
                     */
                    _remove: function (instance) {
                        var global = VAE,
                            instanceIndex = global._instances.indexOf(instance);
                        if (instanceIndex > -1) {
                            return global._instances.splice(instanceIndex, 1)[0];
                        } else {
                            return false;
                        }
                    },
                    /**
                     *
                     * @param instance {$.widget}
                     * @returns {$.widget}
                     * @private
                     */
                    _add: function (instance) {
                        var newInstance = instance,
                            instanceIndex = VAE._instances.indexOf(newInstance);

                        if (instanceIndex < 0) {
                            VAE._instances.push(newInstance);
                        }
                        if (VAE._isListening) VAE._safeTick();

                        return newInstance;
                    },
                    _clear: function () {
                        VAE._instances = [];
                    },
                    /**
                     * Restarts VAE global scroll listener
                     * @private
                     */
                    _restart: function () {
                        this._quit();
                        this._start();
                    },
                    _start: function () {
                        this._safeTick();
                        if (this._options.onScrollOnly == true) {
                            $window.on('scroll', VAE._onScroll);
                        } else {
                            this._startListener();
                        }
                        this._isListening = true;
                    },
                    _quit: function () {
                        this._isListening = false;
                        $window.off('scroll', null, VAE._onScroll);
                        if (this._timeoutID) clearTimeout(this._timeoutID);
                        if (this._intervalID) clearInterval(this._intervalID);
                    },
                    _onTick: function () {
                        var index = VAE._instances.length;
                        while (index--) {
                            var visiwareWidget = VAE._instances[index];
                            visiwareWidget._onScroll.apply(visiwareWidget, [index]);
                        }
                        window.requestAnimationFrame(VAE._onTick);
                    },
                    _safeTick : function(){
                        if (window.requestAnimationFrame) {
                            VAE._onTick();
                        } else {
                            VAE._onLegacyTick();
                        }
                    },
                    _onLegacyTick: function () {
                        var index = VAE._instances.length;
                        while (index--) {
                            var visiwareWidget = VAE._instances[index];
                            visiwareWidget._onScroll.apply(visiwareWidget, [visiwareWidget, index]);
                        }
                    },
                    _onScroll: function () {
                        // restart the timeout countdown
                        if (VAE._timeoutID) {
                            clearTimeout(VAE._timeoutID);
                        }
                        VAE._startTimeout();
                        if (VAE._intervalID) {
                            // interval callback is already running
                            return;
                        } else {
                            // start interval callbacks
                            if (window.requestAnimationFrame) {
                                VAE._startListener();
                            } else {
                                VAE._startLegacyListener();
                            }
                        }
                    },
                    _startTimeout: function () {
                        this._timeoutID = setTimeout(function () {
                            if (VAE._isActive) {
                                // clearInterval(global._intervalID);
                                VAE._isActive = false;
                                delete VAE._timeoutID;
                                // delete global._intervalID;
                            }
                        }, this._options.timeoutDuration);
                    },
                    _startListener: function () {
                        this._isActive = true;
                        window.requestAnimationFrame(this._onTick);
                    },
                    _startLegacyListener: function () {
                        this._intervalID = setInterval(function () {
                            if (VAE._instances.length > 0) VAE._onLegacyTick.apply(null);
                        }, this._options.intervalDuration);
                    }
                };


            function isString(value) {
                return typeof value === 'string' || value instanceof String
            }

            $.fn.visiware = function(options) {
                var global = VAE,
                    defaults = {
                        triggerAreaPercent: .75,

                        onScrollOnly: true,

                        once: false,

                        onTick: false,
                        onVisibleTick: false,
                        onScrolled: false,
                        onVisible: false,
                        onEntirelyVisible: false,
                        onHidden: false,

                        isVisibleTriggerActive : false,
                        isEntireVisibleTriggerActive : false,
                        isScrolledTriggerActive: false
                    },
                    instance = this.VAE || {
                            element : this,
                            options : defaults
                        };

                if(isString(options)){
                    if (instance.options.debug === 1) console.trace("executing '%s' on VAE instance", options);
                    instance[options].apply(instance, [arguments[1]]);
                } else {
                    instance.options = $.extend({}, instance.options, options);
                    init(instance);
                    if (instance.options.debug === 1) console.trace('new VAE instance: %o', instance);
                    this.VAE = instance;
                }

                function init(instance){
                    instance._trigger = function(){
                        this.element.trigger.apply(this.element, arguments);
                    };

                    instance._getScrollStartPoint = function () {
                        if (instance.options.scrollStartPoint) {
                            if (instance.options.scrollStartPoint.apply) {
                                // assume to be a function
                                return instance.options.scrollStartPoint.apply(instance, arguments);
                            } else {
                                return instance.options.scrollStartPoint;
                            }
                        } else if (instance.options.scrollStartPoint === 0) {
                            return 0;
                        } else {
                            //var relativeTop = this.element[0].getBoundingClientRect().top;
                            var result = (instance.element.offset().top - ($window.height() * instance.options.triggerAreaPercent));
                            return (result < 0) ? 0 : result;
                        }
                    };
                    instance._getScrollEndPoint = function () {
                        if (instance.options.scrollEndPoint && instance.options.scrollEndPoint.apply) {
                            //assume to be function
                            return instance.options.scrollEndPoint.apply(instance, arguments);
                        }
                        return ((instance.options.scrollEndPoint || instance.options.scrollEndPoint === 0) ? instance.options.scrollEndPoint : (instance.element.offset().top + instance.element.outerHeight()));
                    };
                    instance._isPrevVisible = false;
                    instance._isInstanceListening = false;
                    instance.empty = function () {
                        global._quit();
                        global._clear();
                        instance._trigger('empty');
                        return instance;
                    };
                    instance.debug = function () {
                        var self = instance;
                        return {
                            global: global,
                            instance: self
                        };
                    };
                    instance.update = function (args) {
                        if (args) $.extend(instance.options, args);
                        var self = instance;
                        instance.options.scrollStartPoint = instance._getScrollStartPoint();
                        instance.options.scrollEndPoint = instance._getScrollEndPoint();
                        global._options.intervalDuration = (args && args.intervalDuration) || global._options.intervalDuration;
                        global._options.onScrollOnly = (typeof self.options.onScrollOnly == 'boolean') ? self.options.onScrollOnly : global._options.onScrollOnly;
                        instance._trigger('update');
                        return instance;
                    };
                    instance.isActive = function () {
                        return instance._isInstanceListening;
                    };
                    instance.get = function (field) {
                        switch (field) {
                            case 'scrollEndPoint':
                                return instance._getScrollEndPoint();
                                break;
                            case 'scrollStartPoint':
                                return instance._getScrollStartPoint();
                                break;
                            default:
                                break;
                        }
                    };
                    instance.activate = function (options) {
                        var self = instance,
                            _options = $.extend(self.options, options);


                        if (!instance._isInstanceListening) {
                            instance._subscribe()
                        }
                        if (!global._isListening) {
                            global._start();
                        }
                        instance.update(_options);

                        instance._trigger('activate');
                        return instance;
                    };

                    instance.deactivate = function (options) {
                        var defaults = {
                                stopListening: false,
                                removeAll: false
                            },
                            settings = $.extend({}, defaults, options);

                        instance._unsubscribe();

                        if (settings.removeAll === true) {
                            global._quit();
                            global._clear();
                            instance._trigger('halt');
                        } else if (settings.stopListening === true) {
                            global._quit();
                            instance._trigger('halt');
                        }
                        instance._trigger('deactivate');
                        return instance;
                    };

                    /**
                     * Add caller VAE instance to VAE scrollListener loop
                     * @returns {*|$.widget}
                     * @private
                     */
                    instance._subscribe = function () {
                        instance._isInstanceListening = true;
                        instance._trigger('subscribe');
                        return global._add(instance);
                    };

                    instance._unsubscribe = function () {
                        var visiwareInstance = global._find(instance);

                        if (visiwareInstance) {
                            global._remove(visiwareInstance);
                            visiwareInstance._isInstanceListening = false;
                        }
                        instance._trigger('unsubscribe');
                        return visiwareInstance;
                    };
                    instance._destroy = function () {
                        instance._superApply(arguments); // _superApply is a parent function provided by jquery-ui
                        instance.deactivate();
                        return instance;
                    };

                    instance._isEntirelyVisible = function () {
                        instance.currentRect = instance.element[0].getBoundingClientRect();
                        return (instance.currentRect.top > 0 && instance.currentRect.bottom < window.innerHeight);
                    };
                    instance._isVisible = function () {
                        var scrollYPosition = $window.scrollTop();
                        return (scrollYPosition >= instance._getScrollStartPoint() && scrollYPosition <= instance._getScrollEndPoint());
                    };
                    instance._isScrolled = function () {
                        var scrollYPosition = $window.scrollTop();
                        return (scrollYPosition >= instance._getScrollStartPoint());
                    };
                    instance._getPercentage = function () {
                        return (100 * ($window.scrollTop() - instance._getScrollStartPoint()) / (instance._getScrollEndPoint() - instance._getScrollStartPoint()));
                    };
                    /**
                     *
                     * @param index
                     * @private
                     */
                    instance._onScroll = function (index) {
                        if (instance.options.debug === 2) console.log('onScroll: %o', instance);

                        if (instance.options.onTick) instance.options.onTick.apply(instance, [instance._getPercentage(), instance, index]);
                        if (instance.options.onVisibleTick) {
                            var visibilityPercentage = instance._getPercentage();
                            if (visibilityPercentage >= 0 && visibilityPercentage < 101) {
                                instance.options.onVisibleTick.apply(instance, [visibilityPercentage, instance, index]);
                            }
                        }
                        if (instance.options.onVisible && instance._isVisible()) {
                            instance._isPrevVisible = true;
                            instance.options.onVisible.apply(instance, arguments); // run callback if provided
                            if(instance.options.isVisibleTriggerActive) instance._trigger('visible');

                        } else if (instance.options.onEntirelyVisible && instance._isEntirelyVisible()) {
                            instance._isPrevVisible = true;
                            instance.options.onEntirelyVisible.apply(instance, arguments); // run callback if provided
                            if(instance.options.isEntireVisibleTriggerActive) instance._trigger('entirelyVisible');

                        } else if (instance.options.onScrolled && instance._isScrolled()) {
                            instance._isPrevVisible = true;
                            instance.options.onScrolled.apply(instance, arguments); // run callback if provided
                            if(instance.options.isScrolledTriggerActive) instance.element._trigger('scrolled');

                        } else if (instance._isPrevVisible) {
                            if (instance.options.onHidden) instance.options.onHidden.apply(instance, arguments); // run callback if provided
                            instance._isPrevVisible = false;
                        }

                        if (instance._isPrevVisible === true && instance.options.once === true) {
                            instance._unsubscribe();
                        }
                    };
                    return instance;
                }

                return this;
            }
        });
}