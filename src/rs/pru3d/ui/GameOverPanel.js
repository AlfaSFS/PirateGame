
/**
 * @author  raizensoft.com
 */
define([
  'rs/game/BasePanel',
  'rs/pru3d/ui/GameButton'
],
  function(BasePanel, GameButton) {

    "use strict";

    var SCALE = 0.85;

    GameOverPanel.prototype = Object.create(BasePanel.prototype);
    GameOverPanel.prototype.constructor = GameOverPanel; 

    /**
     * A panel showing image
     * @class GameOverPanel
     * @constructor
     */
    function GameOverPanel(gs) {

      this.gs = gs;
      this.am = gs.pru3d.assetManager;
      BasePanel.prototype.constructor.call(this);
    }

    /**
     * Init image panel
     * @method init
     */
    GameOverPanel.prototype.init = function() {

      BasePanel.prototype.init.call(this);
      var el = this.el;
      el.classList.add('rs-trophy-panel');
      el.style.width = el.style.height = '90%';

      // Title
      this.title = document.createElement('h1');
      this.title.className = 'trophy-level-title';
      this.title.innerHTML = 'Level Up';

      // Meta info container
      var met = this.meta = document.createElement('div');
      met.className = 'meta-container';
      el.appendChild(met);

      var panelText = this.panelText = document.createElement('span');
      panelText.innerHTML = "BEST SCORE: 100";
      met.appendChild(panelText);

      // Trophy element
      var tc = document.createElement('div');
      tc.className = 'trophy-container';

      var trophy = document.createElement('img');
      trophy.src = 'assets/graphics/sad_pirate.png';
      trophy.draggable = false;
      tc.appendChild(trophy);
      el.appendChild(tc);

      var bc = this.btnContainer = document.createElement('div');
      bc.className = 'trophy-button-container';
      el.appendChild(bc);

      // Replay button
      this.replayBtn = new GameButton('icon-undo', this.doReplay.bind(this));
      bc.appendChild(this.replayBtn.el);

      // Hide close button
      this.closeBtn.style.display = 'none';
    };

    /**
     * Show panel
     * @method show
     */
    GameOverPanel.prototype.show = function() {

      document.body.appendChild(this.ol);
      document.body.appendChild(this.el);
      const scale = 1;
      anime.remove(this.el);
      anime({
        targets:this.el,
        opacity:[0, 1],
        translateX:'-50%',
        translateY:'-50%',
        scale:[0, scale],
        duration:1000,
        easing:'easeOutQuint'
      });
      this.setScore(this.gs.getBestScore());
    };

    /**
     * Set best score
     */
    GameOverPanel.prototype.setScore = function(score) {
      this.panelText.innerHTML = 'BEST SCORE: ' + score;
    };

    /**
     * Hide panel
     * @method hide
     */
    GameOverPanel.prototype.hide = function() {
      BasePanel.prototype.hide.call(this);
    };

    /**
     * Replay current level
     * @method doReplay
     */
    GameOverPanel.prototype.doReplay = function() {

      this.am.btnClick.play();
      this.gs.replayLevel();
    };

    return GameOverPanel;
  });
