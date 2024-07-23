
/**
 * @author  raizensoft.com
 */
define([
  'rs/pru3d/ui/GameButton'
],
  function(GameButton) {

    "use strict";

    /**
     * GameScreenWonBar
     * @class GameScreenWonBar
     * @constructor
     */
    function GameScreenWonBar(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Init won bar components
     * @method init
     */
    GameScreenWonBar.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-gamewonbar';
      el.style.bottom = '-85px';

      // Status
      this.status = document.createElement('h1');
      this.status.className = 'trophy-level-title';
      this.status.innerHTML = 'DRAW';

      // Next icon
      this.nextBtn = new GameButton('icon-nextlevel', this.doNext.bind(this));
      this.nextBtn.addClass('rs-pru3d-mainbutton-extra');
      el.appendChild(this.nextBtn.el);
    };

    /**
     * Load next level
     * @method doNext
     */
    GameScreenWonBar.prototype.doNext = function() {

      var am = this.gs.pru3d.assetManager;
      am.btnClick.play();
      this.gs.nextLevel();
    };

    /**
     * Show the bar
     * @method show
     */
    GameScreenWonBar.prototype.show = function(status) {

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
     * Set won/lose/draw status
     * @method setStatus
     */
    GameScreenWonBar.prototype.setStatus = function(status) {
      this.status.innerHTML = status;
    };
 
    /**
     * Hide the bar
     * @method hide
     */
    GameScreenWonBar.prototype.hide = function(status) {

      anime({
        targets:this.el,
        bottom:-85,
        easing:'easeOutQuint',
        duration:800
      });
      if (document.body.contains(this.status))
        document.body.removeChild(this.status);
    };

    return GameScreenWonBar;
  });
