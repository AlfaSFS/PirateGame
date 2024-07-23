
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    var COUNT_NUMBER = 3;

    /**
     * RestartPanel
     * @class RestartPanel
     * @constructor
     */
    function RestartPanel(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Init panel
     * @method init
     */
    RestartPanel.prototype.init = function() {

      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-restartpanel';
      el.innerHTML = 'BEST SCORE';

      // Restart button
    };

    /**
     * Show the panel
     * @method show
     */
    RestartPanel.prototype.show = function(score) {

      this.el.style.display = 'block';
      this.el.innerHTML = 'BEST SCORE: ' + score;
      document.body.appendChild(this.el);
      this.el.style.opacity = 1;
      anime.remove(this.el);
      anime({
        targets:this.el,
        opacity:0.1,
        loop:true,
        direction:'alternate',
        duration:1000,
        easing:'easeOutQuad'
      });
    };

    /**
     * Hide the panel
     * @method hide
     */
    RestartPanel.prototype.hide = function() {
      this.el.style.display = 'none';
    };


    return RestartPanel;

  });
