
/**
 * @author  raizensoft.com
 */
define([
  'rs/game/ImagePanel',
  'rs/pru3d/ReadyPanel',
  'rs/pru3d/ui/GameOverPanel',
  'rs/pru3d/ui/HelpPanel',
  'rs/pru3d/ui/GameScreenButtonBar',
  'rs/pru3d/ui/GameScreenWonBar',
  'rs/pru3d/ui/GameScreenLoseBar',
  'rs/pru3d/ui/GameScreenHeader',
  'rs/pru3d/Game3d'],
  function(
    ImagePanel,
    ReadyPanel,
    GameOverPanel,
    HelpPanel,
    GameScreenButtonBar,
    GameScreenWonBar,
    GameScreenLoseBar,
    GameScreenHeader,
    Game3d) {

    "use strict";

    /**
     * main Game screen
     * @class GameScreen
     * @constructor
     */
    function GameScreen(pru3d, config) {

      this.pru3d = pru3d;
      this.am = pru3d.assetManager;
      this.config = pru3d.config;
      this.init();
    }

    /**
     * Init game screen components
     * @method init
     */
    GameScreen.prototype.init = function() {

      // Root element
      var gs = this;
      var el = this.el = document.createElement('div');
      el.className = 'rs-gscreen';
      el.style.width = el.style.height = '100%';
      el.style.display = 'none';

      // Setup level data
      var level = this.config.data.level;
      this.levels = level;

      // Setup panels
      this.initPanel();

      // Header
      this.header = new GameScreenHeader(this);
      el.appendChild(this.header.el);
      
      // ButtonBar
      this.bbar = new GameScreenButtonBar(this);
      el.appendChild(this.bbar.el);

      // Wonbar
      this.wbar = new GameScreenWonBar(this);
      el.appendChild(this.wbar.el);

      // Wonbar
      this.lbar = new GameScreenLoseBar(this);
      el.appendChild(this.lbar.el);

      // Game3d
      this.game3d = new Game3d(this);
      el.appendChild(this.game3d.el);

      // Initial parameters
      this.currentLevel = 0;
    };

    /**
     * Init game panels
     * @method initPanel
     */
    GameScreen.prototype.initPanel = function() {

      var gs = this;

      // Image panel
      this.imagePanel = new ImagePanel(this.applyNewLevel.bind(this));

      // Ready panel
      this.rpanel = new ReadyPanel(this);

      // Game over panel
      this.gopanel = new GameOverPanel(this);

      // Help Panel
      this.hpanel = new HelpPanel(function() {
        gs.game3d.restoreLastState();
      });
    };

    /**
     * Load a level index
     * @method loadLevel
     */
    GameScreen.prototype.loadLevel = function(levelIndex) {

      const gs = this;

      // Hide current panels
      this.gopanel.hide();
      this.rpanel.hide();
      this.wbar.hide();
      this.lbar.hide();

      // Show active bar
      this.showButtonBar();

      // Show preloader
      this.pru3d.showPreloader();

      function onLoadCallback () {

        gs.pru3d.hidePreloader();
        gs.reset();
        gs.header.levelBtn.setLevel(levelIndex + 1);
        gs.rpanel.countDown(function() {

          var g3d = gs.game3d;
          if (g3d.isReadyState())
            g3d.setRunningState();
          else 
          if (g3d.isPauseState()) {
            g3d.setRunningState();
            g3d.setPauseState();
          }
        });
      }

      this.game3d.loadLevel(levelIndex, onLoadCallback);
      this.currentLevel = levelIndex;
    };

    /**
     * Replay current level
     * @method replay
     */
    GameScreen.prototype.replayLevel = function() {
      this.loadLevel(this.currentLevel);
    };

    /**
     * Load next level
     * @method nextLevel
     */
    GameScreen.prototype.nextLevel = function() {

      // Hide current board
      var index = this.currentLevel + 1;

      // Back to level 0
      if (index == this.levels.length)
        index = 0;
      this.loadLevel(index);
    };

    /**
     * Unlock the next level
     * @method unlockNextLevel
     */
    GameScreen.prototype.unlockNextLevel = function() {

      var index = this.currentLevel + 1;

      // Back to level 0
      if (index < this.levels.length) {
        this.pru3d.pref.saveUnlock(index);
      }
    };

    /**
     * Return current image path
     * @method getCurrentImagePath
     */
    GameScreen.prototype.getCurrentImagePath = function() {

      var cat = this.levels[this.currentCategory];
      var path = cat.content[this.currentLevel].path;
      if (path == undefined)
        path = this.game3d.container.puzzleBoard.dataUrl;
      return path;
    };

    /**
     * Reset meta components
     * @method reset
     */
    GameScreen.prototype.reset = function() {

      this.header.hbar.reset();
      this.game3d.cc.reset();
    };

    /**
     * Show game screen
     * @method show
     */
    GameScreen.prototype.applyNewLevel = function(level) {

      this.currentCategory = 0;
      this.pru3d.root.appendChild(this.el);
      this.transitionIn();
      const d = this.pru3d.getAppDimension();
      this.game3d.resize(d[0], d[1]);
      this.game3d.startRendering();
      if (level == undefined) level = 0;
      this.loadLevel(level);
    };

    /**
     * Show game screen
     * @method show
     */
    GameScreen.prototype.show = function() {
     this.imagePanel.show('assets/graphics/tutor.png');
    };

    /**
     * Hide game screen
     * @method hide
     */
    GameScreen.prototype.hide = function() {

      this.pru3d.root.removeChild(this.el);
      this.game3d.stopRendering();
    };

    /**
     * Show game won bar
     * @method showWonBar
     */
    GameScreen.prototype.showWonBar = function() {

      this.bbar.hide();
      var wbar = this.wbar;
      setTimeout(function() {
        wbar.show("LEVEL PASSED");
      }, 400);
    };

    /**
     * Show game lose bar
     * @method showLoseBar
     */
    GameScreen.prototype.showLoseBar = function() {

      this.bbar.hide();
      var lbar = this.lbar;
      setTimeout(function() {
        lbar.show("Game Over");
      }, 400);
      this.pru3d.pref.saveBestScore(this.game3d.cc.coin);
      this.gopanel.show();
    };

    /**
     * Get best score
     */
    GameScreen.prototype.getBestScore = function() {
      return this.game3d.cc.coin;
    };

    /**
     * Show button bar
     * @method showButtonBar
     */
    GameScreen.prototype.showButtonBar = function() {

      this.wbar.hide();
      var bbar = this.bbar;
      setTimeout(function() {
        bbar.show();
      }, 400);
    };

    /**
     * Transition in
     * @method transitionIn
     */
    GameScreen.prototype.transitionIn = function() {

      this.el.style.display = 'block';
    };

    /**
     * Transition out
     * @method transitionOut
     */
    GameScreen.prototype.transitionOut = function() {

    };

    /**
     * Resizing handler
     * @method resize
     */
    GameScreen.prototype.resize = function(rw, rh) {
      this.game3d.resize(rw, rh);
    };

    /**
     * Start counter
     * @method startCounter
     */
    GameScreen.prototype.startCounter = function() {
      this.header.dbar.start();
    };

    /**
     * Dispose resources
     * @method dispose
     */
    GameScreen.prototype.dispose = function() {

    };

    return GameScreen;
  });
