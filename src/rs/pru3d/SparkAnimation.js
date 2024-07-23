
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    const FPS = 45;
    const TOTAL_FRAMES = 12;

    SparkAnimation.prototype = Object.create(THREE.Mesh.prototype);
    SparkAnimation.prototype.constructor = SparkAnimation; 

    /**
     * SparkAnimation
     * @class SparkAnimation
     * @constructor
     */
    function SparkAnimation(pb) {

      this.pb = pb;
      this.am = pb.am;
      this.init();
    }

    /**
     * Init spark animation
     */
    SparkAnimation.prototype.init = function() {

      THREE.Mesh.prototype.constructor.call(this);

      const am = this.am;
      this.fdata = [];
      this.flist = [];
      const frames = am.sparkData.frames;

      let iw = am.sparkTex.image.width, ih = am.sparkTex.image.height;
      for (let k in frames) {

        const f = frames[k].frame;
        const t = am.sparkTex.clone();
        //console.log(f);

        this.fdata[k] = {

          repeat:[f.w / iw, f.h / ih],
          offsetX: ((f.x) / iw),
          offsetY: 1 - (f.h / ih) - (f.y / ih)
        };

        t.repeat.set(f.w / iw, f.h / ih);
        t.offset.x =  ((f.x) / iw);
        t.offset.y = 1 - (f.h / ih) - (f.y / ih);
        this.flist[k] = t;
      }

      this.geometry = new THREE.PlaneBufferGeometry(20, 40);
      this.material = new THREE.MeshBasicMaterial({
        depthTest:false, 
        blending:THREE.AdditiveBlending,
        transparent:true, 
        map:am.sparkTex});

      this.reset();
    };

    /**
     * Update animation
     */
    SparkAnimation.prototype.update = function(delta) {

      if (!this.visible) return;
      const sa = this.pb.pirate;
      this.position.z = sa.position.z + 2;
      this.position.x = sa.position.x;
      this.etime += delta;
      const currentFrame = Math.floor(this.etime * FPS) % TOTAL_FRAMES;
      //console.log(currentFrame);
      
      const fdata = this.fdata[currentFrame];
      this.material.map.repeat.set(fdata.repeat[0], fdata.repeat[1]);
      this.material.map.offset.x = fdata.offsetX;
      this.material.map.offset.y = fdata.offsetY;
    };

    /**
     * Reset animation
     */
    SparkAnimation.prototype.reset = function() {

      this.etime = 0;
      this.visible = false;
    };

    /**
     * Show spark animation
     */
    SparkAnimation.prototype.show = function() {
      
      this.visible = true;
      const sanim = this;

      clearTimeout(this.showId);
      this.showId = setTimeout(function() {
        sanim.visible = false;
      }, 400);
    };

    return SparkAnimation;

  });
