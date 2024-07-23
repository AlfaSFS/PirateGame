
/**
 * @author  raizensoft.com
 */
define(['rs/pru3d/SparkAnimation'],
  function(SparkAnimation) {

    "use strict";

    const MODEL_SCALE = 12;

    ThePirate.prototype = Object.create(THREE.Group.prototype);
    ThePirate.prototype.constructor = ThePirate;

    /**
     * ThePirate game object
     * @class ThePirate
     * @constructor
     */
    function ThePirate(pb, type) {

      this.pb = pb;
      this.am = pb.am;
      this.speed = pb.dopt.pirateSpeed;
      this.stype = type || 1;
      this.init();
    }

    /**
     * Init
     */
    ThePirate.prototype.init = function() {
      
      THREE.Group.prototype.constructor.call(this);

      this.animName = 'ThePirateInuAnimations';

      var modelName = 'Anne';

      switch (this.stype) {

        case 2: modelName = 'Captain'; break;
        case 3: modelName = 'Henry'; break;
      }
      this.animName = modelName + 'Animations';

      this.modelName = modelName;
      const model = this.model = this.am[this.modelName];
      model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      this.add(model);

      // Default orientation
      this.rotation.y = Math.PI;
      this.mixer = new THREE.AnimationMixer(this.model);
      
      const size = 12;
      const targetPlane = this.targetPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(size, size),
        new THREE.MeshBasicMaterial({map:this.am.ThePirateTarget1, transparent:true, opacity:1}));
      targetPlane.rotation.x = -Math.PI / 2;
      this.add(targetPlane);

      // Focal point position
      const fp = this.fpoint = new THREE.Mesh(
        new THREE.BoxBufferGeometry(1, 1, 1), 
        new THREE.MeshBasicMaterial({color:0xffcc00}));
      fp.visible = false;
      //fp.position.set(20, 20, -50);
      fp.position.set(-2, 80, -70); 
      this.add(fp);

      // Reset default state
      this.reset();
    };

    /**
     * Play a clip name
     * @method play
     */
    ThePirate.prototype.play = function(name) {

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
     * Play walk animation
     */
    ThePirate.prototype.playWalk = function() {
      this.play('Run');
    };

    /**
     * Play animation once
     * @method playOnce
     */
    ThePirate.prototype.playOnce = function(name) {

      if (this.currentAction)
        this.currentAction.fadeOut(0.5);

      const clip = THREE.AnimationClip.findByName( this.am[this.animName], name);
      const action = this.mixer.clipAction( clip );
      this.currentAction = action;

      action.clampWhenFinished = true;
      action
        .reset()
        .setLoop(THREE.LoopOnce, 1)
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .play();
    };

    /**
     * Update ninjaeaseOutQuad
     */
    ThePirate.prototype.update = function(delta) {

      const d = this.pb.dopt;
      const bs = d.blockSize;

      // Update circle
      this.targetPlane.rotation.z += 0.05;

      // Update animation
      this.mixer.update(delta);

      // Update position
      const speed = delta * d.pirateSpeed;
      this.position.z -= speed;

      // Update star position
      this.pb.stars.position.z -= speed;

      let ti = Math.ceil((-this.position.z + bs * 0.5) / bs) - 1;

      if (ti >= this.nextShift) {

        this.nextShift += 10;
        this.pb.floor.shiftForward();
        //console.log(this.nextShift);
      }
      if (ti + 10 >= this.nextGenShift) {

        this.pb.generateLevel(this.nextGenShift);
        this.nextGenShift += 40;
        //console.log('gen shift', this.nextGenShift);
      }
    };

    /**
     * Return current matrix position
     */
    ThePirate.prototype.getMatrixPosition = function() {
      
      const bs = this.pb.dopt.blockSize;
      let tx = this.position.x + bs * 0.5 + bs * 3;
      let tj = Math.ceil(tx / bs) - 1;
      let tz = -this.position.z + bs * 0.5;
      let ti = Math.ceil(tz / bs) - 1;
      return [-ti, tj];
    };

    /**
     * Reset ninja
     */
    ThePirate.prototype.reset = function() {

      this.nextShift = 10;
      this.ti = 0; 
      this.tj = 3;
      this.nextGenShift = 40;
      this.position.set(0, 0, 0);
    };

    /**
     * Hit obstacle
     */
    ThePirate.prototype.hitObstacle = function() {
      this.blink();
    };

    /**
     * Blink ninja
     */
    ThePirate.prototype.blink = function() {
      
      // Blink for a short time
      let count = 0;
      const character = this;
      this.isBlinking = true;

      function doBlink () {
        
        clearTimeout(character.blinkId);
        if (count++ < 12) {
          character.visible = !character.visible;
          character.blinkId = setTimeout(doBlink, 50);
        }
        else {
          character.visible = true;
          character.isBlinking = false;
        }
      }
      doBlink();

      // Also bounce
      this.bounce();
    };

    /**
     * Shift left
     */
    ThePirate.prototype.shiftLeft = function() {
      
      const sa = this;

      let tj = this.tj;
      if (tj == 0) return;
      tj--;

      const bs = this.pb.dopt.blockSize;
      const offsetX = -bs * 3;
      let tx = tj  * bs + offsetX;
      this.tj = tj;

      anime.remove(this.model.rotation);
      anime({
        targets:this.model.rotation,
        y:Math.PI * 0.3,
        duration:300,
        easing:'easeOutQuint'
      });

      clearTimeout(this.rotId);
      this.rotId = setTimeout(function() {

        anime.remove(sa.model.rotation);
        anime({
          targets:sa.model.rotation,
          y:0,
          duration:400,
          easing:'easeOutQuint'
        });
      }, 200);

      anime.remove(this.position);
      anime({
        targets:this.position,
        x:tx,
        duration:800,
        easing:'easeOutQuint'
      });
    };

    /**
     * Shift right
     */
    ThePirate.prototype.shiftRight = function() {
      
      const sa = this;

      let tj = this.tj;
      if (tj == 6) return;
      tj++;

      const bs = this.pb.dopt.blockSize;
      const offsetX = -bs * 3;
      let tx = tj  * bs + offsetX;
      this.tj = tj;

      anime.remove(this.model.rotation);
      anime({
        targets:this.model.rotation,
        y:-Math.PI * 0.3,
        duration:300,
        easing:'easeOutQuint'
      });

      clearTimeout(this.rotId);
      this.rotId = setTimeout(function() {

        anime.remove(sa.model.rotation);
        anime({
          targets:sa.model.rotation,
          y:0,
          duration:400,
          easing:'easeOutQuint'
        });
      }, 200);

      anime.remove(this.position);
      anime({
        targets:this.position,
        x:tx,
        duration:800,
        easing:'easeOutQuint'
      });
    };

    /**
     * Bounce effect
     */
    ThePirate.prototype.bounce = function() {

      anime.remove(this.scale);
      this.scale.set(1.5, 1.5, 1.5);
      anime({
        targets:this.scale,
        x:1,
        y:1,
        z:1,
        duration:2000,
        easing:'easeOutElastic'
      });
      
    };

    return ThePirate;

  });
