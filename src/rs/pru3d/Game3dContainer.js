
/**
 * @author  raizensoft.com
 */
define([
  'rs/pru3d/RunningStage', 
  'rs/pru3d/GameLight'],

  function(
    RunningStage,
    GameLight) {

    "use strict";

    Game3dContainer.prototype = Object.create(THREE.Group.prototype);
    Game3dContainer.prototype.constructor = Game3dContainer; 

    const EASING = 'easeOutQuint';
    const DURATION = 1200;

    /**
     * Generic and root container for all 3d game items
     * @class Game3dContainer
     * @constructor
     */
    function Game3dContainer(g3d) {

      // References to Gallery3D
      this.g3d = g3d;
      this.init();
    }

    /**
     * Init the container
     * @method init
     */
    Game3dContainer.prototype.init = function() {

      // Call parent constructor
      THREE.Group.prototype.constructor.call(this);

      // Add Running Stage
      this.runningStage = new RunningStage(this.g3d);
      this.add(this.runningStage);

      // Light object
      var glight = this.glight = new GameLight(this.g3d);
      this.add(glight);
    };

    /**
     * Show puzzle board with transitioning effect
     * @method transitionIn
     */
    Game3dContainer.prototype.show = function() {

      const d = this.g3d.dopt;

      this.visible = false;

      // Starting position and rotation
      this.rotation.x = 0;
      var g3c = this;

      const targetScale = 1;
      const initScale = 0.1;
      this.scale.set(initScale, initScale, initScale);
      anime.remove(this.scale);
      anime({
        targets:this.scale,
        x:targetScale,
        y:targetScale,
        z:targetScale,
        easing:'easeOutQuad',
        duration:1200
      });

      // Container view and position
      this.position.y = d.verticalShift;
      this.position.z = -30;

      if (true) {

        this.rotation.y = Math.PI;
        let tY = 2 * Math.PI;
        let tX = d.shearAngle * Math.PI / 180;

        anime.remove(this.rotation);
        anime({
          targets:this.rotation,
          y:tY,
          x:tX,
          easing:'easeOutCubic',
          delay:1000,
          duration:2000,
          complete:function() {

            g3c.rotation.y = 0;
            //g3d.setRunningState();
          }
        });
      }
      g3c.visible = true;
    };

    /**
     * Set losing state
     * @method setLoseState
     */
    Game3dContainer.prototype.setLoseState = function() {

      /*
      anime.remove(this.rotation);
      anime({
        targets:this.rotation,
        x:4 * Math.PI / 180,
        easing:'easeOutQuint',
        duration:800
      });
      */
    };

    return Game3dContainer;

  });
