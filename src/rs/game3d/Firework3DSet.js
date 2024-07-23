
/**
 * @author  raizensoft.com
 */
define([
  'rs/utils/ObjectUtil',
  'rs/game3d/Firework3D',
  'rs/game3d/Firework3DState'
],
  function(ObjectUtil, Firework3D, Firework3DState) {

    "use strict";

    Firework3DSet.prototype = Object.create(THREE.Group.prototype);
    Firework3DSet.prototype.constructor = Firework3DSet;

    /**
     * Collection of Firework3D object
     * @class Firework3DSet
     * @constructor
     */
    function Firework3DSet(g3d, config) {

      this.g3d = g3d;
      this.config = {
        numFireworks:3,
        interval:500
      };
      config = config || {};
      ObjectUtil.merge(config, this.config);
      this.init();
    }

    /**
     * Init firework collection
     * @method init
     */
    Firework3DSet.prototype.init = function() {

      THREE.Group.prototype.constructor.call(this);

      // Create firework objects
      var c = this.config;
      var tex = this.g3d.gs.pru3d.assetManager.fwTexture;
      for (var i = 0; i < c.numFireworks; i++) {
        var fw = new Firework3D({
          map:tex,
          callback:c.callback
        });
        this.add(fw);
      }
    };

    /**
     * Update the set
     * @method update
     */
    Firework3DSet.prototype.update = function(delta) {

      for (var i = 0; i < this.children.length; i++) {
        var fw = this.children[i];
        fw.update(delta);
      }

    };

    /**
     * Change fireworks region
     * @method resize
     */
    Firework3DSet.prototype.changeRegion = function(width, height) {

      this.children.forEach(function(it) {
        it.setRegion(width, height);
      });
    };

    /**
     * Reset all firework objects
     * @method reset
     */
    Firework3DSet.prototype.reset = function() {

      this.children.forEach(function(it) {
        it.reset();
      });
    };

    return Firework3DSet;

  });
