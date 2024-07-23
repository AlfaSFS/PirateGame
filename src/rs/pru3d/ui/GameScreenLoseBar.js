
/**
 * @author  raizensoft.com
 */
define([
  'rs/pru3d/ui/GameButton'
],
  function(GameButton) {

    "use strict";

    /**
     * GameScreenLoseBar
     * @class GameScreenLoseBar
     * @constructor
     */
    function GameScreenLoseBar(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Init won bar components
     * @method init
     */
    GameScreenLoseBar.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-gamewonbar';
      el.style.bottom = '-85px';

      // Replay button
      this.replayBtn = new GameButton('icon-undo', this.doReplay.bind(this));
      this.replayBtn.addClass('rs-pru3d-mainbutton');
      el.appendChild(this.replayBtn.el);

      // Status
      this.status = document.createElement('h1');
      this.status.className = 'trophy-level-title';
      this.status.innerHTML = 'DRAW';
    };

    /**
     * Replay current level
     * @method doReplay
     */
    GameScreenLoseBar.prototype.doReplay = function() {

      var am = this.gs.pru3d.assetManager;
      am.btnClick.play();
      this.gs.replayLevel();
    };

    /**
     * Show the bar
     * @method show
     */
    GameScreenLoseBar.prototype.show = function(status) {

      anime({
        targets:this.el,
        bottom:12,
        easing:'easeOutQuint',
        duration:800
      });
      this.setStatus(status);
      document.body.appendChild(this.status);
    };

    /**
     * Hide the bar
     * @method hide
     */
    GameScreenLoseBar.prototype.hide = function() {

      anime({
        targets:this.el,
        bottom:-85,
        easing:'easeOutQuint',
        duration:800
      });
      if (document.body.contains(this.status))
        document.body.removeChild(this.status);
    };

   /**
     * Set won/lose/draw status
     * @method setStatus
     */
    GameScreenLoseBar.prototype.setStatus = function(status) {
      this.status.innerHTML = status;
    };

    return GameScreenLoseBar;
  });
