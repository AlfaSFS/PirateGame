
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    /**
     * LevelScreen class
     * @class LevelScreen
     * @constructor
     */
    function LevelScreen(pru3d, config) {

      this.pru3d = pru3d;
      this.config = pru3d.config;
      this.init();
    }

    /**
     * Init screen
     * @method init
     */
    LevelScreen.prototype.init = function() {
      
      var el = this.el = document.createElement('div');
      el.className = 'rs-lscreen';
      el.style.width = el.style.height = '100%';
      el.style.display = 'none';
      this.pru3d.root.appendChild(el);

      // body...
    };

    /**
     * Show screen
     * @method show
     */
    LevelScreen.prototype.show = function() {

      // body...
    };

    /**
     * Hide screen
     * @method hide
     */
    LevelScreen.prototype.hide = function() {

      // body...
    };

    /**
     * Resizing handler
     * @method resize
     */
    LevelScreen.prototype.resize = function() {

      // body...
    };

    return LevelScreen;

  });
