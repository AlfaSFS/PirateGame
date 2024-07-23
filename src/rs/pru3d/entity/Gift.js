/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    const MODEL_SCALE = 15;

    Gift.prototype = Object.create(THREE.Group.prototype);
    Gift.prototype.constructor = Gift;

    /**
     * Gift game object
     * @class Gift
     * @constructor
     */
    function Gift(pb) {

      this.pb = pb;
      this.am = pb.am;
      this.init();
    }

    /**
     * Init objects
     */
    Gift.prototype.init = function() {
      
      THREE.Group.prototype.constructor.call(this);

      // Import model
      const bookList = [this.am['Coin_Star']];
      const model = this.model = THREE.SkeletonUtils.clone(bookList[Math.floor(Math.random() * bookList.length)]);
      model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      model.rotation.z = Math.random() * 2 * Math.PI;
      model.position.y = 8;
      this.add(model);
    };

    /**
     * Hit interaction
     */
    Gift.prototype.hit = function() {
      
      this.isHit = true;

      const am = this.am;

      // Play sound fx
      //am.yahoo.play();
      if (am.hitcoin.isPlaying) am.hitcoin.stop();
      am.hitcoin.play();

      anime.remove(this.position);
      anime({
        targets:this.position,
        y:30,
        easing:'easeOutQuint',
        duration:600
      });

      anime.remove(this.rotation);
      anime({
        targets:this.rotation,
        y:Math.random() * 2 * Math.PI,
        easing:'easeOutQuad',
        duration:1000
      });
    };

    /**
     * Selft remove
     */
    Gift.prototype.selfRemove = function() {
      
      // Cleanup
      const gi = this, pb = this.pb;

      pb.remove(gi);

      for (let i = pb.gpieces.length - 1; i >= 0; i--) {

        const gtest = pb.gpieces[i];
        if (gtest === gi) {
          pb.gpieces.splice(i, 1);
          pb.gpool.free(gi);
          return;
        }
      }
    };

    /**
     * Reset
     */
    Gift.prototype.reset = function() {

      this.isHit = false;
      anime.remove(this.position);
      this.scale.set(1, 1, 1);
    };

    return Gift;

  });
