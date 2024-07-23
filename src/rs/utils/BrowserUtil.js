define(

function() {

  "use strict";

	/**
	 * @class BrowserUtil
	 * @description Helper class with convenient methods to handle common browser tasks
	 *
	 */
	var BrowserUtil = {

    /** Standard breakpoints based on bootstrap 4.0 framework **/
    bp:{
      XS:0,
      SM:576,
      MD:768,
      LG:992,
      XL:1200,
      XXL:1500,
      X3L:1900,
      X4L:2000,
      X5L:3000
    },

    computeStyle:function(el, prop, unit) {
    
      if (unit === undefined) unit = "px";
      return (parseFloat(getComputedStyle(el)[prop].replace(unit, "")));
    },

		/**
		 * Apply CSS properties to element
		 * @method css
		 * @param {DOMElement} element
		 * @param {Object} CSS properties
		 *
		 */
		css: function(element, props) {
			for (var key in props) element.style[key] = props[key];
		},

		/*
		 * Detect browser prefix
		 * @method prefix
		 * @return {String} Browser prefix
		 *
		 */
		getPrefix: function() {

			if (!BrowserUtil.pf) {

				//Opera
				if (!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
				
					BrowserUtil.pf = 'Webkit';
					BrowserUtil.browserName = 'Opera';
				} 
				else
				//Firefox
				if (typeof InstallTrigger !== 'undefined') {
				
					BrowserUtil.pf = 'Moz';
					BrowserUtil.browserName = 'Firefox';
				}
				else
				// Safari
				// if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
				if (!!window.safari) {

					BrowserUtil.pf = 'Webkit';
					BrowserUtil.browserName = 'Safari';
				}
				else
				//Chrome
				if (!!window.chrome) {
				
					BrowserUtil.pf = 'Webkit';
					BrowserUtil.browserName = 'Chrome';
				}
				//IE
				else
				if (/*@cc_on!@*/false || !!document.documentMode) {

					BrowserUtil.pf = 'ms';
					BrowserUtil.browserName = 'MSIE';
				}
        else
        // Edge
        if (/Edge/.test(navigator.userAgent)) {

					BrowserUtil.pf = 'ms';
					BrowserUtil.browserName = 'MSIE';
				}
        // All fail, default to webkit Safari
        else {
          BrowserUtil.pf = 'Webkit';
          BrowserUtil.browserName = 'Safari';
        }

				if (BrowserUtil.pf === 'Webkit') 
          BrowserUtil.ps = ''; 
        else 
          BrowserUtil.ps = 'px'; //Perspective suffix for Webkit
				if (BrowserUtil.pf !== '') 
          BrowserUtil.csspf = '-' + BrowserUtil.pf.toLowerCase() + '-'; 
        else 
          BrowserUtil.csspf = '';
				console.log(BrowserUtil.pf);
			}

			return BrowserUtil.pf;
		},

    getMouseTouchEvents:function() {

      if (this.isMobile()) 
        return {
          mdown:'touchstart',
          mmove:'touchmove',
          mup:'touchend'
        };
      else 
        return {
          mdown:'mousedown',
          mmove:'mousemove',
          mup:'mouseup'
        };
    },

		/**
		 * Detect Mobile device
		 * @method isMobile
		 * @return Boolean True if agent is a mobile device
		 *
		 */
		isMobile: function() {

			//Not reliable but work ok in touchscreen cases
			if (BrowserUtil.imb === undefined) 
				BrowserUtil.imb = (document.createElement('span').ontouchstart === null);
			return (BrowserUtil.imb);
		},

		/*
		 * Detect capability and go fullscreen
		 * @method goFullScreen
		 *
		 */
		goFullscreen: function(e) {

			var pf = BrowserUtil.isFullscreenSupported();
			if (!pf) return false;
			return (pf === '') ? (e.requestFullScreen()) : (e[pf + 'RequestFullScreen']()); 
		},

		/**
		 * Exit fullscreen
		 * @method exitFullScreen
		 * 
		 */
		exitFullscreen: function(e) {

			var pf = BrowserUtil.isFullscreenSupported();
			if (!pf) return false;
      if (BrowserUtil.isFullscreen())
        return (pf === '') ? (document.cancelFullScreen()) : (document[pf + 'CancelFullScreen']()); 
      else
        return false;
		},

		/**
		 * Add callback on fullscreen event change
		 * @method fullscreenCallback
		 * 
		 */
		fullScreenCallback : function(e, callback, context) {

			var pf = BrowserUtil.isFullscreenSupported();
			if (!pf) return false;
			var eventName = pf + 'fullscreenchange';
			document.addEventListener(eventName, callback);
		},

		/**
		 * @method isFullscreen
		 *
		 */
		isFullscreen : function() {
			
			var pf = BrowserUtil.isFullscreenSupported();
			if (!pf) return false;

			switch (pf) {	

				case '':
					return document.fullScreen;

				case 'webkit':
					return document.webkitIsFullScreen;

				default:
					return document[pf + 'FullScreen'];
			}
		},

		/**
		 * Check if browser supports fullscreen
		 * @method isFullscreenSupported
		 *
		 */
		isFullscreenSupported : function() {

			var pf = BrowserUtil.pf.toLowerCase();
			if (document.cancelFullScreen !== undefined) return ''; else
				if (document[pf + 'CancelFullScreen'] !== undefined) return pf; else return false;
		}
	};

	return BrowserUtil;

});
