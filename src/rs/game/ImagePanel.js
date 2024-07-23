
/**
 * @author  raizensoft.com
 */
define([
  'rs/game/BasePanel'
],
  function(BasePanel) {

    "use strict";

    var SCALE = 0.85;

    ImagePanel.prototype = Object.create(BasePanel.prototype);
    ImagePanel.prototype.constructor = ImagePanel; 

    /**
     * A panel showing image
     * @class ImagePanel
     * @constructor
     */
    function ImagePanel(callback) {

      this.callback = callback;
      BasePanel.prototype.constructor.call(this);
    }

    /**
     * Init image panel
     * @method init
     */
    ImagePanel.prototype.init = function() {

      BasePanel.prototype.init.call(this);
      this.el.classList.add('rs-image-panel');

      var img = this.img = document.createElement('img');
      img.draggable = false;
      this.el.appendChild(this.img);
      this.el.style.width = this.el.style.height = 'auto';

      var ip = this;
      function closePanel (e) {
        
        if (ip.callback) ip.callback.call(ip);
        ip.hide();
      }

      // Config event
      this.closeBtn.addEventListener('click', closePanel);
      img.addEventListener('click', closePanel);

      // Constraint img dimension
      img.onload = function(e) {

        var r = img.naturalWidth / img.naturalHeight;
        if (img.naturalHeight >= window.innerHeight) {

          img.height = window.innerHeight * SCALE;
          img.width = img.height * r;
        }
        if (img.naturalWidth >= window.innerWidth) {

          img.width = window.innerWidth * SCALE;
          img.height = img.width / r;
        }
      };
    };

    /**
     * Show an image with input src
     * @method show
     */
    ImagePanel.prototype.show = function(src) {

      this.img.src = src;
      BasePanel.prototype.show.call(this);
    };

    /**
     * Show an image from asset manager
     */
    ImagePanel.prototype.showAsset = function(imgAsset) {
      
      this.img.src = imgAsset.src;
      BasePanel.prototype.show.call(this);
    };

    return ImagePanel;
  });

