
/**
 * @author  raizensoft.com
 */
define([
  'rs/utils/ObjectUtil',
],
  function(ObjectUtil) {

    "use strict";

    Stars.prototype = Object.create(THREE.Points.prototype);
    Stars.prototype.constructor = Stars;

    /**
     * FireWork in 3D using three.js
     * @class Stars
     * @constructor
     */
    function Stars(pb, config) {
      
      this.pb = pb;
      this.am = pb.am;

      // Init state and configurations
      this.config = {
        size:12,
        numParticles:20,
        range:350
      };
      config = config || {};
      ObjectUtil.merge(config, this.config);
      this.init();
    }

    /**
     * Init Stars
     * @method init
     */
    Stars.prototype.init = function() {

      THREE.Points.prototype.constructor.call(this);

      const c = this.config;

      // Geometry
      this.geometry = new THREE.Geometry();
      const v = this.geometry.vertices;

      const range = c.range;
      const rangeX = range * 2;
      for (let i = 0; i < c.numParticles; i++) {

        const p = new THREE.Vector3();
        p.x = Math.random() * rangeX - 0.5 * rangeX;
        p.y = Math.random() * 100;
        p.z = -Math.random() * range - 200;
        v.push(p);
      }
      this.geometry.verticesNeedUpdate = true;

      // Setup material
      this.material = new THREE.PointsMaterial({
        color:0xffffff,
        size: c.size,
        opacity: 1,
        transparent: true,
        blending:THREE.AdditiveBlending,
        depthTest: false,
        map:this.am['stars']
      });
      this.material.needsUpdate = true;

      this.reset();
    };

    /**
     * Update firework state
     * @method update
     */
    Stars.prototype.update = function(delta) {

    }

    /**
     * Reset the firework state
     * @method reset
     */
    Stars.prototype.reset = function() {

      anime.remove(this.scale);
      anime({
        targets:this.scale,
        x:[1, 1.25],
        y:[1, 1.25],
        z:[1, 1.25],
        easing:'linear',
        duration:2000,
        direction:'alternate',
        loop:true
      });
    };

    return Stars;

  });

