
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

    TrophyPanel.prototype = Object.create(BasePanel.prototype);
    TrophyPanel.prototype.constructor = TrophyPanel; 

    /**
     * A panel showing image
     * @class TrophyPanel
     * @constructor
     */
    function TrophyPanel(gs) {

      this.gs = gs;
      this.am = gs.pru3d.assetManager;
      BasePanel.prototype.constructor.call(this);
    }

    /**
     * Init image panel
     * @method init
     */
    TrophyPanel.prototype.init = function() {

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

      var timespan = this.timespan = document.createElement('span');
      timespan.innerHTML = 'Time: 323s';
      met.appendChild(timespan);

      var movespan = this.movespan = document.createElement('span');
      movespan.innerHTML = 'Moves: 232';
      met.appendChild(movespan);
      
      // Trophy element
      var tc = document.createElement('div');
      tc.className = 'trophy-container';

      var trophy = document.createElement('img');
      trophy.src = 'assets/graphics/trophy.png';
      tc.appendChild(trophy);
      el.appendChild(tc);

      var lvl = document.createElement('span');
      lvl.className = 'level-label';
      lvl.innerHTML = 23;
      tc.appendChild(lvl);
      this.lvl = lvl;

      var bc = this.btnContainer = document.createElement('div');
      bc.className = 'trophy-button-container';
      el.appendChild(bc);

      // Replay button
      this.replayBtn = new GameButton('icon-undo', this.doReplay.bind(this));
      this.replayBtn.addClass('rs-pru3d-mainbutton-extra');
      bc.appendChild(this.replayBtn.el);

      // Next icon
      this.nextBtn = new GameButton('icon-nextlevel', this.doNext.bind(this));
      this.nextBtn.addClass('rs-pru3d-mainbutton-extra');
      bc.appendChild(this.nextBtn.el);
    };

    /**
     * Show panel
     * @method show
     */
    TrophyPanel.prototype.show = function() {

      BasePanel.prototype.show.call(this);
      document.body.appendChild(this.title);

      // Update values
      this.setValues(
        this.gs.getPlayingTime(), 
        this.gs.getMoveCount(), 
        (this.gs.currentLevel + 1));
    };

    /**
     * Hide panel
     * @method hide
     */
    TrophyPanel.prototype.hide = function() {

      BasePanel.prototype.hide.call(this);
      if (document.body.contains(this.title))
        document.body.removeChild(this.title);
    };

    /**
     * Replay current level
     * @method doReplay
     */
    TrophyPanel.prototype.doReplay = function() {

      this.am.btnClick.play();
      this.gs.replayLevel();
    };

    /**
     * Next level
     * @method doNext
     */
    TrophyPanel.prototype.doNext = function() {

      this.am.btnClick.play();
      this.gs.nextLevel();
    };

    /**
     * Set trophy values
     * @method setValues
     */
    TrophyPanel.prototype.setValues = function(times, move, level) {

      this.timespan.innerHTML = 'Times: ' + times + 's'; 
      this.lvl.innerHTML = level;
      this.movespan.innerHTML = 'Moves: ' + move;
    };

    return TrophyPanel;
  });
