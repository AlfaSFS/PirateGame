
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    /**
     * HeaderMoveButton component
     * @class HeaderMoveButton
     * @constructor
     */
    function HeaderMoveButton(gh) {

      this.gh = gh;
      this.init();
    }

    /**
     * Init the component
     * @method init
     */
    HeaderMoveButton.prototype.init = function() {

      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-movebtn';
      this.count = 0;

      var gh = this.gh;
      var mbtn = this;
      el.addEventListener('click', function(e) {
        gh.gs.pru3d.assetManager.btnClick.play();
        mbtn.undo();
      });

      // Move icon
      var mi = this.micon = document.createElement('span');
      el.appendChild(mi);
      mi.className = 'icon-quill';

      // Move value
      var mv = this.mval = document.createElement('span');
      mv.className = 'movebtn-value';
      el.appendChild(mv);
      mv.innerHTML = '0000';

      // Undo button
      var ubtn = this.ubtn = document.createElement('span');
      ubtn.className = 'icon-undo';
      el.appendChild(ubtn);
    };

    /**
     * Add count value
     * @method addCount
     */
    HeaderMoveButton.prototype.addCount = function(val) {

      this.count += val;
      var n = this.count;
      var c = 0;
      var s = "";
      while (n >= 10) {
        c++;
        n = n / 10;
      }
      c = 4 - c - 1;
      for (var i = 0; i < c; i++) s += "0";
      this.mval.innerHTML = s + this.count;
    }; 

    /**
     * Reset count number
     * @method reset
     */
    HeaderMoveButton.prototype.reset = function() {

      this.count = 0;
      this.mval.innerHTML = "0000";
    };

    /**
     * Undo last move
     * @method undo
     */
    HeaderMoveButton.prototype.undo = function() {
      this.gh.gs.game3d.undo();
    };

    return HeaderMoveButton;

  });
