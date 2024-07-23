
/**
 * @author  raizensoft.com
 */
define([
  'rs/utils/ObjectUtil',
  'rs/game3d/Firework3DState'
],
  function(ObjectUtil, Firework3DState) {

    "use strict";

    var EASING = 0.1;
    var colors = [0xffffff, 0xffff00, 0xdaff00, 0xff00a4, 0xf3ff00 ]

    Firework3D.prototype = Object.create(THREE.Points.prototype);
    Firework3D.prototype.constructor = Firework3D;

    /**
     * FireWork in 3D using three.js
     * @class Firework3D
     * @constructor
     */
    function Firework3D(config) {

      // Init state and configurations
      this.config = {
        launchHeight:300,
        sphereRadius:200,
        color:0xffcc00,
        size:72,
        numParticles:24
      };
      config = config || {};
      ObjectUtil.merge(config, this.config);
      this.state = Firework3DState.EXPLODED;
      this.init();
    }

    /**
     * Init Firework3D
     * @method init
     */
    Firework3D.prototype.init = function() {

      THREE.Points.prototype.constructor.call(this);

      var c = this.config;

      // Geometry
      this.geometry = new THREE.Geometry();
      var v = this.geometry.vertices;
      var minRadius = 50;

      for (var i = 0; i < c.numParticles; i++) {

        var p = new THREE.Vector3();
        p.tX = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        p.tY = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        p.tZ = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        v.push(p);
      }
      this.geometry.verticesNeedUpdate = true;

      // Setup material
      var pickColor = colors[Math.floor(Math.random() * colors.length)];
      this.material = new THREE.PointsMaterial({
        size: c.size,
        color: pickColor,
        opacity: 1,
        transparent: true,
        blending:THREE.AdditiveBlending,
        depthTest: false,
        map:c.map
      });
      this.material.needsUpdate = true;
    };

    /**
     * Set region
     * @method setRegion
     */
    Firework3D.prototype.setRegion = function(regionWidth, regionHeight) {
      this.regionWidth = regionWidth;
      this.regionHeight = regionHeight;
    };

    /**
     * Update firework state
     * @method update
     */
    Firework3D.prototype.update = function(delta) {

      var v = this.geometry.vertices;
      if (this.state == Firework3DState.EXPLODED) {

        for (var i = 0; i < v.length; i++) {
          var p = v[i];
          p.x += (p.tX - p.x) * EASING;
          p.y += (p.tY - p.y) * EASING;
          p.z += (p.tZ - p.z) * EASING;
        }
        if (Math.abs(p.tX - p.x) < 5) {
          this.state = Firework3DState.FALLING;
        }
      }
      else {
        var gravity = -80 * delta;
        for (var i = 0; i < v.length; i++) {
          var p = v[i];
          p.vy += gravity;
          p.y += p.vy;
        }
        this.material.opacity += (0 - this.material.opacity) * 0.025;
        if (this.material.opacity <= 0.05) {
          this.reset();
        }
      }
      this.geometry.verticesNeedUpdate = true;
    }

    /**
     * Reset the firework state
     * @method reset
     */
    Firework3D.prototype.reset = function() {

      if (this.regionWidth) {

        this.position.x = Math.random() * this.regionWidth - this.regionWidth * 0.5;
        var hlh = this.regionHeight - this.config.launchHeight;
        this.position.y = Math.random() * hlh - hlh * 0.5;
      };
      this.state = Firework3DState.EXPLODED;
      this.material.opacity = 1;
      this.material.color.set(colors[Math.floor(Math.random() * colors.length)]);
      this.rotation.z = 0;

      var v = this.geometry.vertices;
      var c = this.config;
      var minRadius = 50;
      for (var i = 0; i < v.length; i++) {
        var p = v[i];
        p.x = p.y = p.z = p.vy = 0;
        p.tX = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        p.tY = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        p.tZ = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
      };
      this.geometry.verticesNeedUpdate = true;
      this.material.needsUpdate = true;
      if (c.callback) c.callback.call(this);
    };

    return Firework3D;

  });

