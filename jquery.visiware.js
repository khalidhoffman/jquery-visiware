if (typeof define !== 'function') {
    /* Define Visiware plugin */
    Visiware(function () {
        return false;
    });
    /* stub define function */
    define = function () {
    };
}
define(['require', 'jquery'], function Visiware(require) {

    var $ = require('jquery') || jQuery,
        $window = $(window),
        VAEEngine = {
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
                var instanceIndex = VAEEngine._instances.indexOf(instance);
                return (instanceIndex > -1) ? VAEEngine._instances[instanceIndex] : null;
            },
            /**
             *
             * @param instance {$.widget}
             * @returns {$.widget}
             * @private
             */
            _remove: function (instance) {
                var instanceIndex = VAEEngine._instances.indexOf(instance);
                if (instanceIndex > -1) {
                    return VAEEngine._instances.splice(instanceIndex, 1)[0];
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
                    instanceIndex = VAEEngine._instances.indexOf(newInstance);

                if (instanceIndex < 0) {
                    VAEEngine._instances.push(newInstance);
                }
                if (VAEEngine._isListening) VAEEngine._safeTick();

                return newInstance;
            },
            _clear: function () {
                VAEEngine._instances = [];
            },
            /**
             * Restarts VAEEngine global scroll listener
             * @private
             */
            _restart: function () {
                this._quit();
                this._start();
            },
            _start: function () {
                this._safeTick();
                if (this._options.onScrollOnly == true) {
                    $window.on('scroll', VAEEngine._onScroll);
                } else {
                    this._startListener();
                }
                this._isListening = true;
            },
            _quit: function () {
                this._isListening = false;
                $window.off('scroll', null, VAEEngine._onScroll);
                if (this._timeoutID) clearTimeout(this._timeoutID);
                if (this._intervalID) clearInterval(this._intervalID);
            },
            _onTick: function () {
                var index = VAEEngine._instances.length;
                while (index--) {
                    var visiwareWidget = VAEEngine._instances[index];
                    visiwareWidget._onScroll.apply(visiwareWidget, [index]);
                }
                if (this._isActive) window.requestAnimationFrame(VAEEngine._onTick);
            },
            _safeTick: function () {
                if (window.requestAnimationFrame) {
                    VAEEngine._onTick();
                } else { VAEEngine._onLegacyTick();
                }
            },
            _onLegacyTick: function () {
                var index = VAEEngine._instances.length;
                while (index--) {
                    var visiwareWidget = VAEEngine._instances[index];
                    visiwareWidget._onScroll.apply(visiwareWidget, [visiwareWidget, index]);
                }
            },
            _onScroll: function () {
                // restart the timeout countdown
                if (VAEEngine._timeoutID) {
                    clearTimeout(VAEEngine._timeoutID);
                }
                VAEEngine._startTimeout();
                if (VAEEngine._intervalID) {
                    // interval callback is already running
                    return;
                } else {
                    // start interval callbacks
                    if (window.requestAnimationFrame) {
                        VAEEngine._startListener();
                    } else {
                        VAEEngine._startLegacyListener();
                    }
                }
            },
            _startTimeout: function () {
                this._timeoutID = setTimeout(function () {
                    if (VAEEngine._isActive) {
                        clearInterval(VAEEngine._intervalID);
                        VAEEngine._isActive = false;
                        delete VAEEngine._timeoutID;
                        // delete VAEEngine._intervalID;
                    }
                }, this._options.timeoutDuration);
            },
            _startListener: function () {
                this._isActive = true;
                window.requestAnimationFrame(this._onTick);
            },
            _startLegacyListener: function () {
                this._isActive = true;
                this._intervalID = setInterval(function () {
                    if (VAEEngine._instances.length > 0) VAEEngine._onLegacyTick.apply(null);
                }, this._options.intervalDuration);
            }
        };


    function isString(value) {
        return typeof value === 'string' || value instanceof String
    }

    function VAE(el, options) {
        this._isPrevVisible = false;
        this._isInstanceListening = false;
        this.element = el;
        this.options = options;
        return this;
    }

    function VAEInstance() {

        this._trigger = function () {
            this.element.trigger.apply(this.element, arguments);
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
        this.empty = function () {
            VAEEngine._quit();
            VAEEngine._clear();
            this._trigger('empty');
            return this;
        };
        this.debug = function () {
            var self = this;
            return {
                global: VAEEngine,
                instance: self
            };
        };
        this.update = function (args) {
            if (args) $.extend(this.options, args);
            var self = this;
            this.options.scrollStartPoint = this._getScrollStartPoint();
            this.options.scrollEndPoint = this._getScrollEndPoint();
            if (args && args.intervalDuration) VAEEngine._options.intervalDuration = args.intervalDuration;
            if (typeof self.options.onScrollOnly == 'boolean') VAEEngine._options.onScrollOnly = self.options.onScrollOnly;
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
            if (!VAEEngine._isListening) {
                VAEEngine._start();
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
                VAEEngine._quit();
                VAEEngine._clear();
                this._trigger('halt');
            } else if (settings.stopListening === true) {
                VAEEngine._quit();
                this._trigger('halt');
            }
            this._trigger('deactivate');
            return this;
        };

        /**
         * Add caller VAEEngine instance to VAEEngine scrollListener loop
         * @returns {*|$.widget}
         * @private
         */
        this._subscribe = function () {
            this._isInstanceListening = true;
            this._trigger('subscribe');
            return VAEEngine._add(this);
        };

        this._unsubscribe = function () {
            var visiwareInstance = VAEEngine._find(this);

            if (visiwareInstance) {
                VAEEngine._remove(visiwareInstance);
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
        /**
         *
         * @param index
         * @private
         */
        this._onScroll = function (index) {
            if (this.options.debug >= 2) console.log('onScroll: %o', this);

            if (this.options.onTick) this.options.onTick.apply(this, [this._getPercentage(), this, index]);
            if (this.options.onVisibleTick) {
                var visibilityPercentage = this._getPercentage();
                if (visibilityPercentage >= 0 && visibilityPercentage < 101) {
                    this.options.onVisibleTick.apply(this, [visibilityPercentage, this, index]);
                }
            }
            if (this.options.onVisible && this._isVisible()) {
                this._isPrevVisible = true;
                this.options.onVisible.apply(this, arguments); // run callback if provided
                if (this.options.isVisibleTriggerActive) this._trigger('visible');

            } else if (this.options.onEntirelyVisible && this._isEntirelyVisible()) {
                this._isPrevVisible = true;
                this.options.onEntirelyVisible.apply(this, arguments); // run callback if provided
                if (this.options.isEntireVisibleTriggerActive) this._trigger('entirelyVisible');

            } else if (this.options.onScrolled && this._isScrolled()) {
                this._isPrevVisible = true;
                this.options.onScrolled.apply(this, arguments); // run callback if provided
                if (this.options.isScrolledTriggerActive) this.element._trigger('scrolled');

            } else if (this._isPrevVisible) {
                if (this.options.onHidden) this.options.onHidden.apply(this, arguments); // run callback if provided
                this._isPrevVisible = false;
            }

            if (this._isPrevVisible === true && this.options.once === true) {
                this._unsubscribe();
            }
        };
        return this;
    }

    VAE.prototype = new VAEInstance();

    $.fn.visiware = function (options) {
        var defaults = {
                triggerAreaPercent: .75,

                onScrollOnly: true,

                once: false,

                onTick: false,
                onVisibleTick: false,
                onScrolled: false,
                onVisible: false,
                onEntirelyVisible: false,
                onHidden: false,

                isVisibleTriggerActive: false,
                isEntireVisibleTriggerActive: false,
                isScrolledTriggerActive: false
            };
        instance = this.VAE || new VAE(this, defaults);

        if (isString(options)) {
            if (instance.options.debug >= 1) console.trace("executing '%s' on VAE instance(%o)", options, instance);
            instance[options].apply(instance, [arguments[1]]);
        } else {
            instance = new VAE(this, $.extend({}, instance.options, options));
            if (instance.options.debug >= 1) console.trace('new VAE instance: %o', instance);
            this.VAE = instance;
        }

        return this;
    };

});

