
/**
 * @author  raizensoft.com
 */
define([
  'rs/pru3d/Preferences', 
  'rs/pru3d/AssetManager', 
  'rs/pru3d/screen/HomeScreen', 
  'rs/pru3d/screen/GameScreen', 
  'rs/ui/RingPreloader', 
  'rs/utils/ObjectUtil', 
  'rs/utils/BrowserUtil'],

  function(
    Preferences, 
    AssetManager, 
    HomeScreen, 
    GameScreen, 
    RingPreloader,
    ObjectUtil,
    BrowserUtil) {

    "use strict";

    const RESIZE_TIMEOUT = 200;
    const CONFIG_PATH = "config.json";

    function PirateRun(input, options) {

      // Load main config.json
      this.loadConfig();

      // Mobile setup
      this.isMobile = BrowserUtil.isMobile();

      // Init default options
      this.defaultOptions = {
        blockSize:16,
        sceneColor:0x2b2b2b,
        fitFactor:1,
        ambientLight:0xffffff,
        verticalShift:-20,
        shearAngle:25,
        lightMovingSpeed:3,
        pirateSpeed:140,
        enemySpeed:185,
        maxHealth:3
      };

      options = options || {};
      ObjectUtil.merge(options, this.defaultOptions);

      // Setup root reference
      this.root = input;
      BrowserUtil.css(this.root,{
        position:'relative',
        display:'block',
        overflow:'hidden'
      });

      // Setup gallery resize handler
      const pru3d = this;
      window.addEventListener('resize', function() {
        pru3d.resize();
      });

      // Set up background music on mobile devices
      document.body.addEventListener('click', function(e) {

        //var bgSound = pru3d.assetManager.bgSound;
        //bgSound.context.resume();
        //if (bgSound && !bgSound.isPlaying) {
          //bgSound.play();
        //}
      });
    }

    /**
     * Load configurations
     * @method loadConfig
     */
    PirateRun.prototype.loadConfig = function() {

      // Load main config.json
      var pru3d = this;
      var req = new XMLHttpRequest();
      req.addEventListener("load", function(e) {

        var result = JSON.parse(this.response);
        pru3d.config = result;
        pru3d.initComponents();
      });
      req.open("GET", CONFIG_PATH);
      req.send();
    };

    /**
     * Init compponents
     * @method initComponent
     */
    PirateRun.prototype.initComponents = function() {

      const pru3d = this;
      const dopt = this.defaultOptions;
      const config = this.config;

      // Preferences
      this.initPreferences();
      
      // GameAI
      this.initGameAI();

      // Preloader
      this.initPreloader();

      // Default screen
      this.activeScreen = null;

      // Asset managers
      this.assetManager = new AssetManager(this);

      if (window.location.search.includes('bypass'))  {

        this.assetManager.onLoad = function() {
          pru3d.setGameScreen();
        };
        this.assetManager.load();
      }
      else
      // Home Screen as default screen
      this.setHomeScreen();

      // Force resize on intialization
      setTimeout(function() {
        pru3d.resize();
      }, RESIZE_TIMEOUT);
    };

    /**
     * Initialize preferences
     * @method initPreferences
     */
    PirateRun.prototype.initPreferences = function() {
      this.pref = new Preferences(this.config, localStorage.getItem("PirateRun"));
    };

    /**
     * Init Game AI
     * @method initGameAI
     */
    PirateRun.prototype.initGameAI = function() {
    };

    /**
     * Init preloader component
     * @method initPreloader
     */
    PirateRun.prototype.initPreloader = function() {

      var rp = new RingPreloader({borderColor:'#ccc'});
      var el = rp.el;
      this.preloader = el;
      el.style.top = '50%';
    };

    /**
     * Show preloader
     * @method showPreloader
     */
    PirateRun.prototype.showPreloader = function() {
      this.root.appendChild(this.preloader);
    };

    /**
     * Hide preloader
     * @method hidePreloader
     */
    PirateRun.prototype.hidePreloader = function() {
      if (this.root.contains(this.preloader))
        this.root.removeChild(this.preloader);
    };

    /**
     * Init fullscreen functionalities
     * @method initFullcreen
     */
    PirateRun.prototype.initFullcreen = function() {

      // Fullscreen button
      const pru3d = this;
      this.fsbtn = new FullscreenButton(this.root, function(e) {
        console.log('fullsceen change');
      });
      this.root.appendChild(this.fsbtn.el);
    };

    /**
     * Shortcut to root element addEventListener method
     * @method addEventListener
     */
    PirateRun.prototype.addEventListener = function(event, listener) {
      this.root.addEventListener(event, listener);
    };

    /**
     * Set active screen
     * @method setScreen
     */
    PirateRun.prototype.setScreen = function(screen) {

      if (this.activeScreen) {
        this.activeScreen.hide();
      };
      screen.show();
      this.activeScreen = screen;
    };

    /**
     * Set active game screen
     * @method setGameScreen
     */
    PirateRun.prototype.setGameScreen = function() {

      if (!this.gameScreen) {
        this.gameScreen = new GameScreen(this);
      }
      this.setScreen(this.gameScreen);
    };

    /**
     * Set home screen as active screen
     * @method setHomeScreen
     */
    PirateRun.prototype.setHomeScreen = function() {

      if (!this.homeScreen)
        this.homeScreen = new HomeScreen(this);
      this.setScreen(this.homeScreen);
    };

    /**
     * Dispose resources
     * @method dispose
     */
    PirateRun.prototype.dispose = function() {

    };

    /**
     * Resize handler
     * @method resize
     */
    PirateRun.prototype.resize = function() {

      var d = this.getAppDimension();
      var rw = d[0], rh = d[1];
      if (this.activeScreen)
        this.activeScreen.resize(rw, rh);
    };

    /**
     * Return current app dimension
     * @method getAppDimension
     */
    PirateRun.prototype.getAppDimension = function() {

      var cs = BrowserUtil.computeStyle;
      var bo = cs(this.root, 'borderTopWidth');
      var rw = cs(this.root, 'width') - 2 * bo;
      var rh = cs(this.root, 'height') - 2 * bo;
      return [rw, rh];
    };

    return PirateRun;

  });
