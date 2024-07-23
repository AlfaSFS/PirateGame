
/**
 * @author  raizensoft.com
 */
define([
  'rs/game/BasePanel'
],
  function(BasePanel) {

    "use strict";

    WinPanel.prototype = Object.create(BasePanel.prototype);
    WinPanel.prototype.constructor = WinPanel;

    /**
     * WinPanel for showing winning state
     * @class WinPanel
     * @constructor
     */
    function WinPanel() {

      BasePanel.prototype.constructor.call(this);
      this.init();
    }

    /**
     * Init panel
     * @method init
     */
    WinPanel.prototype.init = function() {

      BasePanel.prototype.init.call(this);
      this.el.classList.add('rs-win-panel');
    };

    return WinPanel;
  });
