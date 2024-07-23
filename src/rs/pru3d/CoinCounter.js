
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    /**
     * Coin counter
     * @class CoinCounter
     * @constructor
     */
    function CoinCounter() {
      this.init();
    }

    /**
     * Init component
     * @method init
     */
    CoinCounter.prototype.init = function() {

      const el = this.el = document.createElement('div');
      el.className = 'coin-counter';
      document.body.appendChild(el);
      this.coin = 0;
    };

    /**
     * Show the counter
     * @method show
     */
    CoinCounter.prototype.show = function(x, y, val) {

      this.coin += val;

      this.el.innerHTML = this.coin;

      let s = this.el.style;
      s.display = 'block';
      s.top = y + 'px';
      s.left = x + 'px';
      if (val > 0) {
        s.color = '#b2d235';
      }
      else
        s.color = '#ec008c';

      const cc = this;

      anime({
        targets:this.el,
        top:y - 500,
        opacity:[1, 0],
        easing:'easeOutQuad',
        duration:2400,
        complete:function() {
          cc.hide();
        }
      });
    };

    /**
     * Hide the counter
     * @method hide
     */
    CoinCounter.prototype.hide = function() {
      this.el.style.display = 'none';
    };

    /**
     * Reset
     * @method reset
     */
    CoinCounter.prototype.reset = function() {
      this.coin = 0;
    };

    return CoinCounter;

  });
