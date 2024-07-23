
/**
 * @author  raizensoft.com
 */
define([
  'rs/pru3d/ui/HeartBar',
  'rs/pru3d/ui/HeaderLevelButton'],

  function(
    HeartBar,
    HeaderLevelButton) {

    "use strict";

    var INTERVAL = 200;

    /**
     * GameScreenHeader component
     * @class GameScreenHeader
     * @constructor
     */
    function GameScreenHeader(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Build header components
     * @method init
     */
    GameScreenHeader.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-gameheader';

      // Level button
      this.levelBtn = new HeaderLevelButton(this);
      el.appendChild(this.levelBtn.el);

      this.hbar = new HeartBar(this.gs);
      el.appendChild(this.hbar.el);
    };

    /**
     * Return client size dimension
     * @method getClientSize
     */
    GameScreenHeader.prototype.getClientSize = function() {
      return [this.el.clientWidth, this.el.clientHeight];
    };

    /**
     * Show the header
     * @method show
     */
    GameScreenHeader.prototype.show = function() {

      anime({
        targets:this.el,
        top:4,
        easing:'easeOutQuint',
        duration:800
      });
    };

    /**
     * Hide the header
     * @method hide
     */
    GameScreenHeader.prototype.hide = function() {

      anime({
        targets:this.el,
        top:-80,
        easing:'easeOutQuint',
        duration:800
      });
    };

    /**
     * Count point down
     * @method countDown
     */
    GameScreenHeader.prototype.countDown = function(callback) {

      return;
      var it = this;

      function doCount () {

        clearTimeout(it.countId);
        if (as.currentValue == 0 || asg.currentValue == 0) {
          if (callback) callback.call(it, as.currentValue);
        }
        else
        it.countId = setTimeout(doCount, INTERVAL);
      }
      doCount();
    };

    return GameScreenHeader;

  });

