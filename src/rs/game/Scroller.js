
/**
 * @author  raizensoft.com
 */
define([
  'rs/utils/BrowserUtil'
],
  function(BrowserUtil) {

    "use strict";

    var mdown, mup, mmove;

    /**
     * Scroller object for smooth scrolling
     * @class Scroller
     * @constructor
     */
    function Scroller(el) {

      // Mobile or desktop event handlers
      if (BrowserUtil.isMobile()) {

        mdown = 'touchstart';
        mup = 'touchend';
        mmove = 'touchmove';
      }
      else {
        mdown = 'mousedown';
        mup = 'mouseup';
        mmove = 'mousemove';
      }

      this.el = el;
      this.el.style.overflow = 'hidden';
      this.init();
    }

    /**
     * Init component
     * @method init
     */
    Scroller.prototype.init = function() {

      var el = this.el;
      var scroller = this;
      var oY, topY, panelTargetY, clientY;

      function scrollHandler () {

        el.scrollTop += (panelTargetY - el.scrollTop) * 0.075;
        scroller.scrollId = requestAnimationFrame(scrollHandler);
      }

      function mouseDownHandler (e) {

        if (e.touches) {
          clientY = e.touches[0].clientY;
        }
        else {
          clientY = e.clientY;
        }
        oY = clientY;
        topY = panelTargetY = el.scrollTop;
        el.addEventListener(mmove, mouseMoveHandler);
        el.addEventListener(mup, mouseUpHandler);
        window.addEventListener(mmove, mouseMoveHandler);
        window.addEventListener(mup, mouseUpHandler);
        cancelAnimationFrame(scroller.scrollId);
        scroller.scrollId = requestAnimationFrame(scrollHandler);
        el.style.cursor = 'grab';
      }

      function mouseMoveHandler (e) {
        
        //e.preventDefault();

        if (e.changedTouches) {
          clientY = e.changedTouches[0].clientY;
        }
        else {
          clientY = e.clientY;
        }
        var delta = (clientY - oY) * 2.5;
        var range = el.scrollHeight - scroller.el.clientHeight;
        var target = topY - delta;
        if (target > range) target = range;
        if (target < 0) target = 0;
        panelTargetY = target;
        el.style.cursor = 'grabbing';
      }

      function mouseUpHandler (e) {
        
        el.removeEventListener(mmove, mouseMoveHandler);
        el.removeEventListener(mup, mouseUpHandler);
        window.removeEventListener(mmove, mouseMoveHandler);
        window.removeEventListener(mup, mouseUpHandler);
        cancelAnimationFrame(scroller.scrollId);
        el.style.cursor = 'grab';
      }
      el.addEventListener(mdown, mouseDownHandler);
      el.addEventListener('mouseover', function(e) {
        el.style.cursor = 'grab';
      });
    };

    return Scroller;
  });
