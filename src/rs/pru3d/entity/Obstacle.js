
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    const MODEL_SCALE = 6;

    Obstacle.prototype = Object.create(THREE.Group.prototype);
    Obstacle.prototype.constructor = Obstacle;

    /**
     * Obstacle game object
     * @class Obstacle
     * @constructor
     */
    function Obstacle(pb) {

      this.pb = pb;
      this.am = pb.am;
      this.init();
    }

    /**
     * Init object
     */
    Obstacle.prototype.init = function() {
      
      THREE.Group.prototype.constructor.call(this);

      const list = ['Skull', 'LBone', 'PTree', 'Mako', 'Sharky', 'Skeleton', 'Tentacle'];
      const selectedName = this.selectedName = list[Math.floor(Math.random() * list.length)];
      const model = this.model = THREE.SkeletonUtils.clone(this.am[selectedName]);
      model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      this.selectedName = selectedName;

      switch (selectedName) {

        case 'Tentacle':
          model.scale.set(MODEL_SCALE * 3.4, MODEL_SCALE * 3.4, MODEL_SCALE * 3.4);
          break;

        case 'Anne':
          model.scale.set(MODEL_SCALE * 3.2, MODEL_SCALE * 3.2, MODEL_SCALE * 3.2);
          break;

        case 'Skeleton':
          model.scale.set(MODEL_SCALE * 3.2, MODEL_SCALE * 3.2, MODEL_SCALE * 3.2);
          break;

        case 'Sharky':
          model.scale.set(MODEL_SCALE * 3.2, MODEL_SCALE * 3.2, MODEL_SCALE * 3.2);
          break;

        case 'Mako':
          model.scale.set(MODEL_SCALE * 3.2, MODEL_SCALE * 3.2, MODEL_SCALE * 3.2);
          break;

        case 'PTree':
          model.scale.set(MODEL_SCALE * 5.2, MODEL_SCALE * 5.2, MODEL_SCALE * 5.2);
          break;

        case 'LBone':
          model.scale.set(MODEL_SCALE * 1.8, MODEL_SCALE * 1.8, MODEL_SCALE * 1.8);
          break;

        case 'Skull':
          model.scale.set(MODEL_SCALE * 2.5, MODEL_SCALE * 2.5, MODEL_SCALE * 2.5);
          break;
      }
      this.add(model);
      if (selectedName == 'Skeleton' || selectedName == 'Mako' || selectedName == 'Sharky' || selectedName == 'Tentacle') {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.animName = selectedName + 'Animations';
      }
      this.reset();
    };

    /**
     * Play a clip name
     * @method play
     */
    Obstacle.prototype.play = function(name) {

      if (this.currentAction)
        this.currentAction.fadeOut(0.5);

      const clip = THREE.AnimationClip.findByName( this.am[this.animName], name);
      const action = this.mixer.clipAction( clip );
      this.currentAction = action;

      action.clampWhenFinished = true;
      action
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .play();
    };

    /**
     * Play idle animation
     */
    Obstacle.prototype.playAttack = function() {
      if (this.selectedName == 'Tentacle')
        this.play('Tentacle_Idle');
      else
        this.play('Run');
    };

    /**
     * Hit interaction
     */
    Obstacle.prototype.hit = function() {
      
      if (this.isHit) return;
      this.isHit = true;

      // Play sound fx
      this.am.punch0.play();
    };

    /**
     * Self remove
     */
    Obstacle.prototype.selfRemove = function() {
      
      const ob = this, pb = this.pb;

      pb.remove(ob);

      for (let i = pb.opieces.length - 1; i >= 0; i--) {

        const otest = pb.opieces[i];
        if (otest === ob) {
          pb.opieces.splice(i, 1);
          pb.opool.free(ob);
          return;
        }
      }
    };

    /**
     * Animate obstacle
     */
    Obstacle.prototype.animate = function(delta) {
      
      if (this.selectedName == 'Mako' || this.selectedName == 'Sharky' || this.selectedName == 'Skeleton') {
        this.position.z += delta *this.pb.dopt.enemySpeed;
        const bs = this.pb.dopt.blockSize;
        let tz = -this.position.z + bs * 0.5;
        let ti = Math.ceil(tz / bs) - 1;
        this.ti = -ti;
      }
      if (this.mixer) this.mixer.update(delta);
    };

    /**
     * Reset
     */
    Obstacle.prototype.reset = function() {

      this.isHit = false;
      this.scale.set(1, 1, 1);
    };

    return Obstacle;

  });
