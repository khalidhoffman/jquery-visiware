if (typeof  define !== 'function') {
    Visiware(function () {/* placeholder require function */
        return false;
    })
} else {
    define(
        [
            'require',
            'jquery-ui'
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
                            visiwareWidget._onScroll.apply(visiwareWidget, [visiwareWidget, index]);
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

            function VisiwareInstance() {
                var global = VAE;

                this._create = function () {
                    this._superApply(arguments); // _superApply is a parent function provided by jquery-ui
                    return this;
                };

                this.options = {
                    triggerAreaPercent: .75,

                    onScrollOnly: true,

                    once: false,

                    onTick: false,
                    onVisibleTick: false,
                    onScrolled: false,
                    onVisible: false,
                    onEntirelyVisible: false,
                    onHidden: false
                };
                this._getScrollStartPoint = function () {
                    if (this.options.scrollStartPoint) {
                        if (this.options.scrollStartPoint.apply) {
                            // assume to be a function
                            return this.options.scrollStartPoint.apply(this, arguments);
                        } else {
                            return this.options.scrollStartPoint;
                        }
                    } else if (this.options.scrollStartPoint === 0) {
                        return 0;
                    } else {
                        //var relativeTop = this.element[0].getBoundingClientRect().top;
                        var result = (this.element.offset().top - ($window.height() * this.options.triggerAreaPercent));
                        return (result < 0) ? 0 : result;
                    }
                };
                this._getScrollEndPoint = function () {
                    if (this.options.scrollEndPoint && this.options.scrollEndPoint.apply) {
                        //assume to be function
                        return this.options.scrollEndPoint.apply(this, arguments);
                    }
                    return ((this.options.scrollEndPoint || this.options.scrollEndPoint === 0) ? this.options.scrollEndPoint : (this.element.offset().top + this.element.outerHeight()));
                };
                this._isPrevVisible = false;
                this._isInstanceListening = false;
                this.empty = function () {
                    global._quit();
                    global._clear();
                    this._trigger('empty');
                    return this;
                };
                this.debug = function () {
                    var self = this;
                    return {
                        global: global,
                        instance: self
                    };
                };
                this.update = function (args) {
                    if (args) $.extend(this.options, args);
                    var self = this;
                    this.options.scrollStartPoint = this._getScrollStartPoint();
                    this.options.scrollEndPoint = this._getScrollEndPoint();
                    global._options.intervalDuration = (args && args.intervalDuration) || global._options.intervalDuration;
                    global._options.onScrollOnly = (typeof self.options.onScrollOnly == 'boolean') ? self.options.onScrollOnly : global._options.onScrollOnly;
                    this._trigger('update');
                    return this;
                };
                this.isActive = function () {
                    return this._isInstanceListening;
                };
                this.get = function (field) {
                    switch (field) {
                        case 'scrollEndPoint':
                            return this._getScrollEndPoint();
                            break;
                        case 'scrollStartPoint':
                            return this._getScrollStartPoint();
                            break;
                        default:
                            break;
                    }
                };
                this.activate = function (options) {
                    var self = this,
                        _options = $.extend(self.options, options);


                    if (!this._isInstanceListening) {
                        this._subscribe()
                    }
                    if (!global._isListening) {
                        global._start();
                    }
                    this.update(_options);

                    this._trigger('activate');
                    return this;
                };

                this.deactivate = function (options) {
                    var defaults = {
                            stopListening: false,
                            removeAll: false
                        },
                        settings = $.extend({}, defaults, options);

                    this._unsubscribe();

                    if (settings.removeAll === true) {
                        global._quit();
                        global._clear();
                        this._trigger('halt');
                    } else if (settings.stopListening === true) {
                        global._quit();
                        this._trigger('halt');
                    }
                    this._trigger('deactivate');
                    return this;
                };

                /**
                 * Add caller VAE instance to VAE scrollListener loop
                 * @returns {*|$.widget}
                 * @private
                 */
                this._subscribe = function () {
                    this._isInstanceListening = true;
                    this._trigger('subscribe');
                    return global._add(this);
                };

                this._unsubscribe = function () {
                    var visiwareInstance = global._find(this);

                    if (visiwareInstance) {
                        global._remove(visiwareInstance);
                        visiwareInstance._isInstanceListening = false;
                    }
                    this._trigger('unsubscribe');
                    return visiwareInstance;
                };
                this._destroy = function () {
                    this._superApply(arguments); // _superApply is a parent function provided by jquery-ui
                    this.deactivate();
                    return this;
                };

                this._isEntirelyVisible = function () {
                    this.currentRect = this.element[0].getBoundingClientRect();
                    return (this.currentRect.top > 0 && this.currentRect.bottom < window.innerHeight);
                };
                this._isVisible = function () {
                    var scrollYPosition = $window.scrollTop();
                    return (scrollYPosition >= this._getScrollStartPoint() && scrollYPosition <= this._getScrollEndPoint());
                };
                this._isScrolled = function () {
                    var scrollYPosition = $window.scrollTop();
                    return (scrollYPosition >= this._getScrollStartPoint());
                };
                this._getPercentage = function () {
                    return (100 * ($window.scrollTop() - this._getScrollStartPoint()) / (this._getScrollEndPoint() - this._getScrollStartPoint()));
                };
                this._onScroll = function ($$widget, index) {
                    if (this.options.debug === 2) console.log('onScroll: %o', $$widget);

                    if (this.options.onTick) this.options.onTick.apply(this, [this._getPercentage(), $$widget, index]);
                    if (this.options.onVisibleTick) {
                        var visibilityPercentage = this._getPercentage();
                        if (visibilityPercentage >= 0 && visibilityPercentage < 101) {
                            this.options.onVisibleTick.apply(this, [visibilityPercentage, $$widget, index]);
                        }
                    }
                    if (this.options.onVisible && this._isVisible()) {
                        ////console.log('visible: ', this._getScrollStartPoint(), this.element[0]);
                        this._isPrevVisible = true;
                        //this.element.trigger('visible');
                        this.options.onVisible.apply(this, arguments); // run callback if provided
                        this._trigger('visible');
                    } else if (this.options.onEntirelyVisible && this._isEntirelyVisible()) {
                        this._isPrevVisible = true;
                        //this.element.trigger('entirelyVisible');;
                        this.options.onEntirelyVisible.apply(this, arguments); // run callback if provided
                        this._trigger('entirelyVisible')
                    } else if (this.options.onScrolled && this._isScrolled()) {
                        this._isPrevVisible = true;
                        //this.element.trigger('scrolled');
                        this.options.onScrolled.apply(this, arguments); // run callback if provided
                        this._trigger('scrolled');
                    } else if (this._isPrevVisible) {
                        if (this.options.onHidden) this.options.onHidden.apply(this, arguments); // run callback if provided
                        this._isPrevVisible = false;
                    }

                    if (this._isPrevVisible === true && this.options.once === true) {
                        this._unsubscribe();
                    }
                }
            }

            return $.widget("dp.visiware", new VisiwareInstance());
        });
}