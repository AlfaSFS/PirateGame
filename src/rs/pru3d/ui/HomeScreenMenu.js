
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    /**
     * The menu component for home screen
     * @class HomeScreenMenu
     * @constructor
     */
    function HomeScreenMenu(hs) {

      this.hs = hs;
      this.init();
    }

    /**
     * Init menu sub component
     * @method init
     */
    HomeScreenMenu.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-hscreenmenu';

      this.con = document.createElement('div');
      this.con.className = 'menu-list';
      el.appendChild(this.con);

      var config = this.hs.config;
      var hs = this.hs;

      // Menu items
      this.addItem(config.strings.NEW_GAME, function() {
        hs.startNewGame();
      });

      if (config.general.useHelpPanel)
        this.addItem(config.strings.HELP, function() {
          hs.showHelp();
        });

      if (config.general.useCreditPanel)
        this.addItem(config.strings.CREDIT, function() {
          hs.showCredit();
        });
    };

    /**
     * Add menu item with label
     * @method addItem
     */
    HomeScreenMenu.prototype.addItem = function(label, clickCallback) {

      var item = document.createElement('div');
      item.className = 'menu-item';
      item.innerHTML = label;
      item.style.opacity = 0;
      this.con.appendChild(item);

      // Interaction
      var am = this.hs.pru3d.assetManager;
      item.addEventListener('click', function(e) {
        if (clickCallback)
          clickCallback.call(this);
        am.btnClick.play();
      });
    };

    /**
     * Show the menu
     * @method show
     */
    HomeScreenMenu.prototype.show = function() {

      anime({
        targets:'.rs-hscreenmenu .menu-item',
        opacity:1,
        easing:'easeOutQuad',
        delay:anime.stagger(150, {start:500})
      });
    };

    return HomeScreenMenu;
  });
