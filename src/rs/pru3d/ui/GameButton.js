
/**
 * @author  raizensoft.com
 */
define([
  'rs/game/IconButton'
],
  function(IconButton) {

    "use strict";

    GameButton.prototype = Object.create(IconButton.prototype);
    GameButton.prototype.constructor = GameButton;

    /**
     * GameButton component
     * @class GameButton
     * @constructor
     */
    function GameButton(className, clickCallback) {
      this.init(className, clickCallback);
    }

    /**
     * Init
     * @method init
     */
    GameButton.prototype.init = function(className, clickCallback) {

      IconButton.prototype.init.call(this, className, clickCallback);
      this.el.classList.add('rs-pru3d-mainbutton');
    };

    /**
     * Add a new class name
     * @method addClass
     */
    GameButton.prototype.addClass = function(className) {
      this.el.classList.add(className);
    };

    /**
     * Remove a class name
     * @method removeClass
     */
    GameButton.prototype.removeClass = function(className) {
      this.el.classList.remove(className);
    };

    return GameButton;

  });
