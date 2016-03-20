define(
    [
        'require',
        'jquery-ui'
    ],
    function (require) {

        var $ = require('jquery');

        function VisiwareInstance() {
            var $window = $(window),
                VAE = {
                    _instances: [],
                    _options: {
                        intervalDuration: 25,
                        timeoutDuration: 500,
                        onScrollOnly: false
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

                        if (instanceIndex > -1) {
                            return newInstance;
                        } else {
                            VAE._instances.push(newInstance);
                            return newInstance;
                        }
                    },
                    _clear: function () {
                        VAE._instances = [];
                    },
                    /**
                     * Restarts VAE global scroll listener
                     * @private
                     */
                    _restart: function () {
                        var global = VAE;
                        global._quit();
                        global._start();
                    },
                    _start: function () {
                        var global = VAE;
                        if (global._options.onScrollOnly == true) {
                            $window.on('scroll', global._onScroll);
                        } else {
                            global._startListener();
                        }
                        global._isListening = true;
                    },
                    _quit: function () {
                        var global = VAE;
                        global._isListening = false;
                        $window.off('scroll', null, global._onScroll);
                        if (global._timeoutID) clearTimeout(global._timeoutID);
                        if (global._intervalID) clearInterval(global._intervalID);
                    },
                    _onTick: function () {
                        var global = VAE,
                            index = global._instances.length;
                        while (index--) {
                            var visiwareWidget = global._instances[index];
                            visiwareWidget._onScroll.apply(visiwareWidget, [visiwareWidget, index]);
                        }
                    },
                    _onScroll: function () {
                        // restart the timeout countdown
                        var global = VAE;
                        if (global._timeoutID) {
                            clearTimeout(global._timeoutID);
                        }
                        global._startTimeout();
                        if (global._intervalID) {
                            // interval callback is already running
                            return;
                        } else {
                            // start interval callbacks
                            global._startListener();
                        }
                        global._startTimeout();
                    },
                    _startTimeout: function () {
                        var global = VAE;
                        global._timeoutID = setTimeout(function () {
                            if (global._intervalID) {
                                clearInterval(global._intervalID);
                                delete global._timeoutID;
                                delete global._intervalID;
                            }
                        }, global._options.timeoutDuration);
                    },
                    _startListener: function () {
                        var global = VAE;
                        global._intervalID = setInterval(function () {
                            if (global._instances.length > 0) global._onTick.apply(null);
                        }, global._options.intervalDuration);
                    }
                };

            this._create = function () {
                this._superApply(arguments);
                return this;
            };

            this.options = {
                triggerAreaPercent: .75,

                onScrollOnly: false,

                once: false,

                onScrolled: false,
                onVisible: false,
                onEntirelyVisible: false,
                onHidden: false
            };
            this._getScrollStartPoint = function () {
                if (typeof this.options.scrollStartPoint === "function") {
                    return this.options.scrollStartPoint.apply(this, arguments);
                } else if (this.options.scrollStartPoint || this.options.scrollStartPoint === 0) {
                    return this.options.scrollStartPoint;
                } else {

                    //var relativeTop = this.element[0].getBoundingClientRect().top;

                    return (this.element.offset().top - ($window.height() * this.options.triggerAreaPercent));
                }
            };
            this._getScrollEndPoint = function () {
                if (typeof this.options.scrollEndPoint === "function") {
                    return this.options.scrollEndPoint.apply(this, arguments);
                }
                return ((this.options.scrollEndPoint || this.options.scrollEndPoint === 0) ? this.options.scrollEndPoint : (this.element.offset().top + this.element.outerHeight()));
            };
            this._isPrevVisible = false;
            this._isInstanceListening = false;
            this.empty = function () {
                var global = VAE;
                global._quit();
                global._clear();
                this._trigger('empty');
                return this;
            };
            this.debug = function () {
                var self = this;
                return {
                    global: VAE,
                    instance: self
                };
            };
            this.update = function (args) {
                if (args) $.extend(this.options, args);
                this.options.scrollStartPoint = this._getScrollStartPoint();
                this.options.scrollEndPoint = this._getScrollEndPoint();
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
                var global = VAE,
                    self = this,
                    _options = $.extend(self.options, options);

                if (!global._isListening) {
                    global._start();
                }

                if (this._isInstanceListening) {
                    this.update(_options);
                } else {
                    this._subscribe()
                }

                global._options.intervalDuration = _options.intervalDuration || global._options.intervalDuration;

                // set onScrollOnly, and re-initialize if onScrollOnly setting changes
                var onScrollOnlyPreviousSetting = global._options.onScrollOnly;
                global._options.onScrollOnly = (_options.onScrollOnly === false || _options.onScrollOnly === true) ? _options.onScrollOnly : global._options.onScrollOnly;
                if (onScrollOnlyPreviousSetting != global._options.onScrollOnly) global._restart();

                console.debug('jquery.visiware.activate() w/ %O | %O', _options, global._options);
                this._trigger('activate');
                return this;
            };

            this.deactivate = function (options) {
                var global = VAE,
                    defaults = {
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
                var global = VAE;
                this._isInstanceListening = true;
                this._trigger('subscribe');
                return global._add(this);
            };

            this._unsubscribe = function () {
                var global = VAE,
                    visiwareInstance = global._find(this);

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
            this._onScroll = function ($$widget, index) {
                //if(this.options.debug) console.log('onScroll: %o',$$widget);
                var args = arguments;

                if (typeof this.options.onVisible == 'function' && this._isVisible()) {
                    ////console.log('visible: ', this._getScrollStartPoint(), this.element[0]);
                    this._isPrevVisible = true;
                    //this.element.trigger('visible');
                    this._trigger('visible');
                    if (this.options.onVisible) this.options.onVisible.apply(this, args); // run callback if provided
                } else if (typeof this.options.onEntirelyVisible == 'function' && this._isEntirelyVisible()) {
                    this._isPrevVisible = true;
                    //this.element.trigger('entirelyVisible');
                    this._trigger('entirelyVisible');
                    if (this.options.onEntirelyVisible) this.options.onEntirelyVisible.apply(this, args); // run callback if provided
                } else if (typeof this.options.onScrolled == 'function' && this._isScrolled()) {
                    this._isPrevVisible = true;
                    //this.element.trigger('scrolled');
                    this._trigger('scrolled');
                    if (this.options.onScrolled) this.options.onScrolled.apply(this, args); // run callback if provided
                } else if (this._isPrevVisible) {
                    if (this.options.onHidden) this.options.onHidden.apply(this, args); // run callback if provided
                    this._isPrevVisible = false;
                }


                if (this._isPrevVisible === true && this.options.once === true) {
                    this._unsubscribe();
                }
            }
        }

        return $.widget("dp.visiware", new VisiwareInstance());
    });