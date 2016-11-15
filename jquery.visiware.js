if (typeof define !== 'function') {
    /* Define Visiware plugin */
    Visiware((require && require('jquery')) ? require('jquery') : jQuery);
} else {
    define(['require', 'jquery'], function(require){
        Visiware(require('jquery'))
    });
}


function Visiware($) {
    if (!$) throw new Error("jQuery is not defined");

    var $window = $(window);

    function VAEEngine() {

        this._instances = [];
        this._options = {
            intervalDuration: 25,
            timeoutDuration: 500,
            onScrollOnly: true
        };
        this._isListening = false;
        var self = this;

        this._onScroll$scoped = function () {
            self._onScroll.apply(self, arguments);
        };

        this._onTick$scoped = function () {
            self._onTick.apply(self, arguments);
        }
    }

    VAEEngine.prototype = {

        /**
         *
         * @param {String} propName
         * @param {*} value
         */
        setConfig : function(propName, value){
            this._options[propName] = value;
            this.restart();
        },
        /**
         *
         * @param instance {VAE}
         * @returns {VAE}
         */
        remove: function (instance) {
            var instanceIndex = this._instances.indexOf(instance);
            if (instanceIndex > -1) {
                return this._instances.splice(instanceIndex, 1)[0];
            } else {
                return false;
            }
        },
        /**
         *
         * @param instance {VAE}
         * @returns {VAE}
         */
        add: function (instance) {

            if (!instance.vaeIndex) {
                instance.vaeIndex = this._instances.lenght;
                this._instances.push(instance);
            }
            if (this._isListening) this._safeTick();

            return instance;
        },

        reset: function () {
            this._instances = [];
        },

        /**
         * Restarts VAEEngine engine scroll listener
         */
        restart: function () {
            this.off();
            this.start();
        },

        start: function () {
            this._safeTick();
            if (this._options.onScrollOnly === true) {
                $window.on('scroll', this._onScroll$scoped);
            } else {
                if (this.isLegacy()){
                    this._startLegacyListener();
                } else {
                    this._startListener();
                }
            }
        },

        stop: function () {
            if (this._intervalID) {
                clearInterval(this._intervalID);
                delete this._intervalID;
            }
            this._isActive = false;
        },

        off: function () {
            this._isListening = false;
            $window.off('scroll', null, this._onScroll$scoped);
            if (this._timeoutID) clearTimeout(this._timeoutID);
            if (this._intervalID) clearInterval(this._intervalID);
        },

        _onTick: function () {
            var index = this._instances.length;
            while (index--) {
                var visiwareWidget = this._instances[index];
                visiwareWidget._onScroll.call(visiwareWidget, index);
            }
            if (this._isActive) {
                window.requestAnimationFrame(this._onTick$scoped);
            }
        },
        _safeTick: function () {
            if (this.isLegacy()) {
                this._onTick();
            } else {
                this._onLegacyTick();
            }
        },
        _onLegacyTick: function () {
            var index = this._instances.length;
            while (index--) {
                var visiwareWidget = this._instances[index];
                visiwareWidget._onScroll.apply(visiwareWidget, [visiwareWidget, index]);
            }
        },
        _onScroll: function () {
            // restart the timeout countdown
            if (this._timeoutID) {
                clearTimeout(this._timeoutID);
            }
            this._startTimeout();
            if (this.isLegacy()) {
                if (!this.isRunning()) {
                    // start interval callbacks
                    this._startLegacyListener();
                }
            } else {
                if (!this.isRunning()) {
                    // set Active flag
                    this._startListener();
                } else {
                    // make requestAnimationFrame
                    this._onTick();
                }
            }
        },
        _startTimeout: function () {
            var self = this;
            this._timeoutID = setTimeout(function () {
                if (self.isRunning()) {
                    self.stop();
                    delete self._timeoutID;
                }
            }, this._options.timeoutDuration);
        },
        _startListener: function () {
            this._isActive = true;
            this._isListening = true;
            this._onTick();
        },
        _startLegacyListener: function () {
            var self = this;
            this._isActive = true;
            this._isListening = true;
            this._intervalID = setInterval(function () {
                if (self._instances.length > 0) self._onLegacyTick.apply(self, null);
            }, this._options.intervalDuration);
        },

        isLegacy: function () {
            return (!window.requestAnimationFrame)
        },

        isOn: function () {
            return this._isListening;
        },

        isRunning: function () {
            return this._isActive;
        }
    };

    var globalEngine = new VAEEngine();

    function VAE(el, options) {
        this._isPrevVisible = false;
        this._isInstanceListening = false;
        this.element = el;
        this.options = options;
        this.engine = globalEngine;
        this.parentDOMNode = document.body;
        return this;
    }

    VAE.prototype = {

        _trigger: function () {
            this.element.trigger.apply(this.element, arguments);
        },

        _getScrollStartPoint: function () {
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
                var result = (this.element.offset().top - (window.innerHeight * this.options.triggerAreaPercent));
                return (result < 0) ? 0 : result;
            }
        },

        _getScrollEndPoint: function () {
            if (this.options.scrollEndPoint && this.options.scrollEndPoint.apply) {
                //assume to be function
                return this.options.scrollEndPoint.apply(this, arguments);
            }
            return ((this.options.scrollEndPoint || this.options.scrollEndPoint === 0) ? this.options.scrollEndPoint : (this.element.offset().top + this.element.outerHeight()));
        },

        empty: function () {
            this.engine.off();
            this.engine.reset();
            this._trigger('empty');
            return this;
        },

        debug: function () {
            return {
                engine: this.engine,
                instance: this
            };
        },

        update: function (args) {
            if (args) $.extend(this.options, args);
            var self = this;
            this.options.scrollStartPoint = this._getScrollStartPoint();
            this.options.scrollEndPoint = this._getScrollEndPoint();
            if (args && args.intervalDuration) {
                this.engine.setConfig('intervalDuration', args.intervalDuration)
            }
            if (typeof self.options.onScrollOnly == 'boolean') {
                this.engine.setConfig('onScrollOnly', self.options.onScrollOnly);
            }
            this._trigger('update');
            return this;
        },

        isActive: function () {
            return this._isInstanceListening;
        },

        get: function (field) {
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
        },

        activate: function (options) {
            var self = this,
                _options = $.extend(self.options, options);


            if (!this._isInstanceListening) {
                this._subscribe()
            }
            if (!this.engine.isOn()) {
                this.engine.start();
            }
            this.update(_options);

            this._trigger('activate');
            return this;
        },

        deactivate: function (options) {
            var defaults = {
                    stopListening: false,
                    removeAll: false
                },
                settings = $.extend({}, defaults, options);

            this._unsubscribe();

            if (settings.removeAll === true) {
                this.engine.off();
                this.engine.reset();
                this._trigger('halt');
            } else if (settings.stopListening === true) {
                this.engine.off();
                this._trigger('halt');
            }
            this._trigger('deactivate');
            return this;
        },

        /**
         * Add caller VAEEngine instance to VAEEngine scrollListener loop
         * @returns {*|$.widget}
         * @private
         */
        _subscribe: function () {
            this._isInstanceListening = true;
            this._trigger('subscribe');
            return this.engine.add(this);
        },

        _unsubscribe: function () {
            this.engine.remove(this);
            this._isInstanceListening = false;
            this._trigger('unsubscribe');
            return this;
        },

        _destroy: function () {
            if (this._superApply) this._superApply.apply(this, arguments); // _superApply is a parent function provided by jquery-ui
            this.deactivate();
            return this;
        },

        _isEntirelyVisible: function () {
            this.currentRect = this.element[0].getBoundingClientRect();
            return (this.currentRect.top > 0 && this.currentRect.bottom < this.parentDOMNode.clientHeight);
        },

        _isVisible: function () {
            var scrollYPosition = this.parentScrollTop;
            return (scrollYPosition >= this._getScrollStartPoint() && scrollYPosition <= this._getScrollEndPoint());
        },
        _isScrolled: function () {
            var scrollYPosition = this.parentScrollTop;
            return (scrollYPosition >= this._getScrollStartPoint());
        },

        _getPercentage: function () {
            return (100 * (this.parentScrollTop - this._getScrollStartPoint()) / (this._getScrollEndPoint() - this._getScrollStartPoint()));
        },

        /**
         *
         * @param index
         * @private
         */
        _onScroll: function (index) {
            if (this.options.debug >= 2) console.log('onScroll: %o', this);
            this.parentScrollTop = this.parentDOMNode.scrollTop;

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
                if (this.options.isScrolledTriggerActive) this._trigger('scrolled');

            } else if (this._isPrevVisible) {
                if (this.options.onHidden) this.options.onHidden.apply(this, arguments); // run callback if provided
                this._isPrevVisible = false;
            }

            if (this._isPrevVisible === true && this.options.once === true) {
                this._unsubscribe();
            }
        }
    };

    function isString(value) {
        return typeof value === 'string' || value instanceof String
    }

    $.fn.visiware = function (options) {
        var defaults = {
            debug: 0,

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
        vaeInstance = this.VAE || new VAE(this, $.extend(defaults, options));

        if (isString(options)) {
            if (vaeInstance.options.debug >= 1) console.trace("executing '%s' on vaeInstance(%o)", options, vaeInstance);
            vaeInstance[options].apply(vaeInstance, [arguments[1]]);
        }

        this.VAE = vaeInstance;

        return this;
    };

}

