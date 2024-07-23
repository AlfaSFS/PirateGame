
/**
 * @author  raizensoft.com
 */
define([
],
  function() {

    "use strict";

    /**
     * BasePanel component
     * @class BasePanel
     * @constructor
     */
    function BasePanel(width, height) {

      this.width = width || 300;
      this.height = height || 300;
      this.init();
    }

    /**
     * Init the panel
     * @method init
     */
    BasePanel.prototype.init = function() {

      // Overlay
      var ol = this.ol = document.createElement('div');
      ol.className = 'rs-game-overlay';

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-game-panel';
      el.style.width = this.width + 'px';
      el.style.height = this.height + 'px';

      // Close button
      var c = this.closeBtn = document.createElement('span');
      c.className = 'rs-closebtn';
      c.innerHTML = '&times';
      el.appendChild(c);
      c.addEventListener('click', this.hide.bind(this));

      anime({
        targets:this.el,
        translateX:'-50%',
        translateY:'-50%',
        duration:0,
        scale:1});
    };

    /**
     * Show panel in center document
     * @method show
     */
    BasePanel.prototype.show = function() {

      document.body.appendChild(this.ol);
      document.body.appendChild(this.el);
      anime.remove(this.el);
      anime({
        targets:this.el,
        opacity:[0, 1],
        duration:800,
        easing:'easeOutQuint'
      });
    };

    /**
     * Hide current panel
     * @method hide
     */
    BasePanel.prototype.hide = function() {

      if (document.body.contains(this.ol))
        document.body.removeChild(this.ol);
      if (document.body.contains(this.el))
        document.body.removeChild(this.el);
    };

    /**
     * Resize the panel
     * @method resize
     */
    BasePanel.prototype.resize = function(w, h) {

      // body...
    };

    return BasePanel;

  });
