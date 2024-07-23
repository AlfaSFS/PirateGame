define(

['rs/utils/BrowserUtil'],

function(BrowserUtil) {

  "use strict";

	var cb, ctx;

	function mouseWheelHandler (e) {

		e.preventDefault();
		var cb = e.currentTarget.mouseWheelCallback;
		cb.call(e.currentTarget.mousewheelContext, Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))));
	}

	/**
	 * @class MouseUtil
	 * @description Helper class with convenient methods to handle interacitivy with mouse and touch interface
	 *
	 */
	var MouseUtil = {

    /**
     * Add a touchstar or click event based on current devices
     */
    touchClick:function(el, fun) {

      if (BrowserUtil.isMobile())
        el.addEventListener('touchstart', fun);
      else
        el.addEventListener('click', fun);
    },

    /**
     * Remove touchstart or click event based on current devices
     */
    removeTouchClick:function(el, fun) {
    
      if (BrowserUtil.isMobile())
        el.removeEventListener('touchstart', fun);
      else
        el.removeEventListener('click', fun);
    },
	
		/*
		 * Track mousewheel with callback
		 * @method startMousewheel
		 * @param {DOMElement} element Element to track on
		 * @param {Function} callback Callback function
		 * @param {Object} context  Callback context
		 *
		 */
		startMouseWheel: function(element, callback, context) {
		
			element.mouseWheelCallback = callback;
			element.mousewheelContext = context;
			element.addEventListener("DOMMouseScroll", mouseWheelHandler, false); //Firefox
			element.addEventListener("mousewheel", mouseWheelHandler, false); // other browsers
		},

		/**
		 * Stop mousewheel tracking
		 * @method stopMousewheel
		 * @param {DOMElement} element Element to track on
		 * 
		 */
		stopMouseWheel: function(element) {
		
			element.removeEventListener("DOMMouseScroll", mouseWheelHandler);
			element.removeEventListener("mousewheel", mouseWheelHandler);
		},

		/**
		 * Start gesture tracking
		 * @paramaram {HTMLElement} element Element to track on
		 * @param {hCallback} hCallback Horizontal gesture callback
		 * @param {vCallback} vCallback Vertical gesture callback
		 * 
		 */
		swipeStart : function (element, swipeDelta, dragDelta, hCallback, vCallback) {

			var originX, originY, startTimer;
			element.style[BrowserUtil.getPrefix() + 'UserSelect'] = 'none';

			////////////////////////////////////////////////////////////////////////////////
			//				DESKTOP TRACKING
			////////////////////////////////////////////////////////////////////////////////

			function mouseDownHandler(event) {
				
				originX = event.clientX;
				originY = event.clientY;
				startTimer = new Date().getTime();
				
				// Track mouse moving
				element.addEventListener('mousemove', mouseMoveHandler);
				//element.addEventListener('mouseout', mouseOutHandler);
				window.addEventListener('mouseup', mouseUpHandler);
			}

			function mouseOutHandler(event) {

				element.removeEventListener('mousemove', mouseMoveHandler);
				window.removeEventListener('mouseup', mouseUpHandler);
				element.removeEventListener('mouseout', mouseOutHandler);
			}
			
			function mouseMoveHandler(event) {

				var distX = (event.clientX - originX); 
				var distY = (event.clientY - originY);
				BrowserUtil.swipeState = 'move';
				if (Math.abs(distX) > Math.abs(distY)) hCallback(distX * dragDelta); else vCallback(distY * dragDelta);
			}

			function mouseUpHandler(event) {

				element.removeEventListener('mousemove', mouseMoveHandler);
				window.removeEventListener('mouseup', mouseUpHandler);
			}

			////////////////////////////////////////////////////////////////////////////////
			//				MOIBLE TRACKING
			////////////////////////////////////////////////////////////////////////////////

			function touchStartHandler(event) {

				originX = event.touches[0].clientX;
				originY = event.touches[0].clientY;
				startTimer = new Date().getTime();
				element.addEventListener('touchmove', touchMoveHandler);
				window.addEventListener('touchend', touchEndHandler);
			}

			function touchMoveHandler(event) {

				event.preventDefault();
				var distX = (event.changedTouches[0].clientX - originX); 
				var distY = (event.changedTouches[0].clientY - originY);
				BrowserUtil.swipeState = 'move';
				if (Math.abs(distX) > Math.abs(distY)) hCallback(distX * dragDelta); else vCallback(distY * dragDelta);
			}

			function touchEndHandler(event) {

				element.removeEventListener('touchmove', touchMoveHandler);
				window.removeEventListener('touchend', touchEndHandler);
			}

			element.removeTracking = function () {

				element.removeEventListener('mousedown', mouseDownHandler);
				window.removeEventListener('mouseup', mouseUpHandler);
				element.removeEventListener('mousemove', mouseMoveHandler);
				element.removeEventListener('mouseout', mouseOutHandler);
				element.removeEventListener('touchstart', touchStartHandler);
				element.removeEventListener('touchend', touchEndHandler);
				element.removeEventListener('touchmove', touchMoveHandler);
				element.removeTracking = null;
			};
		
			// Desktop
			if (!BrowserUtil.isMobile()) {

				element.addEventListener('mousedown', mouseDownHandler);
			}
			else
			//Mobile
			{
				element.addEventListener('touchstart', touchStartHandler);
			}
		},

		/**
		 * Stop tracking swipe gesture
		 * @method swipeStop
		 *
		 */
		swipeStop : function (element) {

			element.style[BrowserUtil.getPrefix() + 'UserSelect'] = 'all';
			if (element.removeTracking) element.removeTracking();
		}
	};

	return MouseUtil;
});
