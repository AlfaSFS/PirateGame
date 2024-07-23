
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    let MAX_HEALTH = 3;
    const FULL_HEART = '#f24437';
    const EMPTY_HEART = '#333333';

    /**
     * HeartBar displays current health point
     * @class HeartBar
     * @constructor
     */
    function HeartBar(gs) {

      this.gs = gs;
      MAX_HEALTH = gs.pru3d.defaultOptions.maxHealth;
      this.init();
    }

    /**
     * Init heart component
     * @method init
     */
    HeartBar.prototype.init = function() {
      
      var el = this.el = document.createElement('div');
      el.className = 'rs-heartbar';

      // Heart list
      var hl = this.hlist = [];
      for (var i = 0; i < MAX_HEALTH; i++) {

        var h = document.createElement('span');
        h.className = 'rs-heart-item icon-heart';
        h.style.color = FULL_HEART;
        el.appendChild(h);
        hl.push(h);
      }
      this.reset();
    };

    /**
     * Set health bar value
     * @method setValue
     */
    HeartBar.prototype.setValue = function(val) {
      
      this.value = val;
      this.setHeartColor(MAX_HEALTH, EMPTY_HEART);
      this.setHeartColor(val, FULL_HEART);
    };

    /**
     * Set heart item color
     * @method setHeartColor
     */
    HeartBar.prototype.setHeartColor = function(total, color) {
      
      for (var i = 0; i < total; i++) {

        var h = this.hlist[i];
        h.style.color = color;
      }
    };

    /**
     * Decrease current health
     */
    HeartBar.prototype.decreaseHealth = function() {
      
      this.value--;
      if (this.value <= 0) return true;
      this.setValue(this.value);
      return false;
    };

    /**
     * Reset heart bar
     * @method reset
     */
    HeartBar.prototype.reset = function() {

      this.value = MAX_HEALTH;
      this.setValue(MAX_HEALTH, FULL_HEART);
    };

    return HeartBar;

  });
