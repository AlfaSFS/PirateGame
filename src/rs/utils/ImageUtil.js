/**
 * @author  rtr | www.raizensoft.com
 *
 */
define([
  'rs/utils/ObjectUtil'
],
  function(ObjectUtil) {

    "use strict";

    /**
     * ImageUtil
     * @class
     * @static
     */
    var ImageUtil = {

      /**
       * Create reflection image with provided settings
       * @method createReflection
       * @param {img} image Image
       * @param {params} settings Reflection settings
       */
      createReflection: function(img, params) {

        if (img === undefined) 
          throw("Invalid input image");
        // Default values
        if (params === undefined)
          params = [0, 0.5, 0.4, 0.25, 1, 0];

        // Create canvas
        var w = img.width, h = img.height;
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');

        // Create gradient
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        var l = params.length * 0.5;
        for (var i = 0; i < l; i++) {
          grad.addColorStop(params[i * 2], 'rgba(0, 0, 0, ' + params[i * 2 + 1] + ')');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Copy, composite and translate
        ctx.globalCompositeOperation = 'source-in';
        ctx.translate(0, img.height);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0);

        var refImg = document.createElement('img');
        refImg.src = c.toDataURL();
        return refImg;
      }
    };

    return ImageUtil;

  });
