
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    const COUNT_NUMBER = 3;

    /**
     * ReadyPanel
     * @class ReadyPanel
     * @constructor
     */
    function ReadyPanel(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Init panel
     * @method init
     */
    ReadyPanel.prototype.init = function() {

      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-readypanel';
      el.innerHTML = 'READY';
    };

    /**
     * Show the panel
     * @method show
     */
    ReadyPanel.prototype.show = function() {

      this.el.style.display = 'block';
      document.body.appendChild(this.el);
      anime.remove(this.el);
      this.el.style.opacity = 1;
      anime({
        targets:this.el,
        opacity:0.1,
        direction:'alternate',
        loop:true,
        duration:300,
        easing:'easeOutQuad'
      });
    };

    /**
     * Hide the panel
     * @method hide
     */
    ReadyPanel.prototype.hide = function() {

      this.el.style.display = 'none';
      anime.remove(this.el);
    };

    /**
     * Start counting down
     * @method countDOwn
     */
    ReadyPanel.prototype.countDown = function(callback) {

      var count = COUNT_NUMBER;
      var rp = this;

      this.show();

      function doCount () {
        
        clearTimeout(rp.countId);
        if (count-- > 0) {
          rp.countId = setTimeout(doCount, 1000);
        }
        else {
          rp.hide();
          callback.call(this);
        }
      }
      doCount();
    };

    return ReadyPanel;

  });
