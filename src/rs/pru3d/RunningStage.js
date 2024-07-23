
/**
 * @author  raizensoft.com
 */
define([
  'rs/pru3d/SparkAnimation', 
  'rs/pru3d/entity/Stars', 
  'rs/pru3d/entity/ObstaclePool', 
  'rs/pru3d/entity/GiftPool', 
  'rs/pru3d/entity/ThePirate', 
  'rs/pru3d/entity/Floor'],
  function(
    SparkAnimation,
    Stars,
    ObstaclePool,
    GiftPool,
    ThePirate,
    Floor) {

    "use strict";

    const FLOOR_OFFSET = -7;

    RunningStage.prototype = Object.create(THREE.Group.prototype);
    RunningStage.prototype.constructor = RunningStage; 

    /**
     * RunningStage class
     * @class RunningStage
     * @constructor
     */
    function RunningStage(g3d) {

      this.g3d = g3d;
      this.gs = g3d.gs;
      this.dopt = g3d.dopt;
      this.am = g3d.am;
      this.init();
    }

    /**
     * Build puzzle board
     * @method init
     */
    RunningStage.prototype.init = function() {

      THREE.Group.prototype.constructor.call(this);

      const d = this.dopt;
      const am = this.am;

      // Gift pool
      this.gpool = new GiftPool(this);
      this.gpieces = [];

      // Obstacles pool
      this.opool = new ObstaclePool(this);
      this.opieces = [];

      // Init stars
      this.stars = new Stars(this);
      this.add(this.stars);

      // Init Floor
      this.floor = new Floor(this);
      this.floor.position.y = FLOOR_OFFSET;
      this.add(this.floor);

      // Init spark animation
      this.sanim = new SparkAnimation(this);
      this.sanim.position.z = 2;
      this.add(this.sanim);

      // ThePirate list
      this.pirateList = [new ThePirate(this, 1), new ThePirate(this, 2), new ThePirate(this, 3)];
    };

    /**
     * Running stage
     * @method prepareLevel
     */
    RunningStage.prototype.prepareLevel = function(level) {

      this.reset();

      // Remove old pirate
      this.remove(this.pirate);

      // Pick a new pirate
      const sa = this.pirate = this.pirateList[Math.floor(Math.random() * this.pirateList.length)];
      sa.reset();
      sa.position.y = FLOOR_OFFSET;
      sa.playWalk();
      this.add(this.pirate);

      // Generate first level
      this.generateLevel(0);
    };

    /**
     * Generate next level
     */
    RunningStage.prototype.generateLevel = function(shiftLevel) {

      console.log('Generate level: ', shiftLevel, shiftLevel + 40);

      const track = [];
      const num = 10;
      let count = 0;
      const pad = (shiftLevel == 0) ? 5 : shiftLevel;

      while (++count <= num) {

        let ti = Math.floor(Math.random() * 40) + pad; 
        let tj = Math.floor(Math.random() * 7);
        while (track[ti] && track[ti][tj]) {

          ti = Math.floor(Math.random() * 40) + pad; 
          tj = Math.floor(Math.random() * 7);
        }
        if (!track[ti]) track[ti] = [];
        track[ti][tj] = 1;
        //console.log(ti, tj);

        let type = Math.floor(Math.random() * 2);

        // Type gift
        if (type == 0) {

          const gi = this.gpool.obtain();
          gi.reset();
          gi.position.y = FLOOR_OFFSET;
          this.gpieces.push(gi);
          this.placeItem(gi, -ti, tj);
        }
        // Type obstacles
        else {

          const ob = this.opool.obtain();
          ob.reset();
          ob.position.y = FLOOR_OFFSET;
          if (ob.mixer) ob.playAttack();
          this.opieces.push(ob);
          this.placeItem(ob, -ti, tj);
        }
      }
    };

    // Camera helper vectors
    let lookVector = new THREE.Vector3();
    let pointVector = new THREE.Vector3();

    /**
     * Update game component
     * @method update
     */
    RunningStage.prototype.update = function(delta) {

      // Hit detection
      const sa = this.pirate;
      const cam = this.g3d.camera;

      // Update spark animation
      this.sanim.update(delta);

      // Update pirate
      sa.update(delta);
      const pos = sa.getMatrixPosition();

      // Update obstacles
      for (let i = this.opieces.length - 1; i >=0; i--) {

        const ob = this.opieces[i];
        ob.animate(delta);
        if (ob.ti - 2 > pos[0])
          ob.selfRemove();
      }

      // Update gift
      for (let i = this.gpieces.length - 1; i >=0; i--) {

        const gi = this.gpieces[i];
        if (gi.ti - 2 > pos[0])
          gi.selfRemove();
      }

      // Obstacle hit detection
      for (let i = 0; i < this.opieces.length; i++) {

        const ob = this.opieces[i];

        if (ob.ti == pos[0] && ob.tj == pos[1] && !ob.isHit) {

          ob.hit();
          sa.hitObstacle();
          const end = this.gs.header.hbar.decreaseHealth();
          if (end) {
            this.g3d.setLoseState();
          }
          break;
        }
      }
      
      // Gift hit detection
      for (let i = 0; i < this.gpieces.length; i++) {

        const gi = this.gpieces[i];
        if (gi.ti == pos[0] && gi.tj == pos[1] && !gi.isHit) {

          gi.hit();
          this.sanim.show();

          // Coin counter
          sa.getWorldPosition(pointVector);
          pointVector.project(this.g3d.camera);
          const hw = this.g3d.width * 0.5;
          const hh = this.g3d.height * 0.5;
          const xp = pointVector.x * hw + hw;
          const yp = -pointVector.y * hh + hh;
          this.g3d.cc.show(xp, yp, 100);

          // Update score
          this.gs.header.levelBtn.setLevel(this.g3d.cc.coin);
          break;
        }
      }

      // Update camera
      lookVector.setFromMatrixPosition(sa.fpoint.matrixWorld);
      cam.position.lerp(lookVector, 0.2);
    };

    /**
     * Place item in matrix position
     */
    RunningStage.prototype.placeItem = function(item, ti, tj) {
      
      const bs = this.dopt.blockSize;
      this.add(item);
      const offsetX = -bs * 3;
      item.position.x = tj  * bs + offsetX;
      item.position.z = ti  * bs;
      item.ti = ti;
      item.tj = tj;
    };

    /**
     * Reset current objects
     */
    RunningStage.prototype.reset = function() {

      this.floor.selfAlign();
      this.stars.position.z = 70;
    };

    return RunningStage;

  });
