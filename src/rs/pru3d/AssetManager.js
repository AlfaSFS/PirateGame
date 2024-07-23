
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    var SOUNDS_PATH = 'assets/sounds';
    var GRAPHICS_PATH = 'assets/graphics';
    var MODEL_PATH = 'assets/model';

    /**
     * Central asset manager objec
     * @class AssetManager
     * @constructor
     */
    function AssetManager(pru3d) {

      this.pru3d = pru3d;
      this.config = pru3d.config;
      this.init();
    }

    /**
     * Init sub components
     * @method init
     */
    AssetManager.prototype.init = function() {

      // Init LoadingManager
      var lm = this.loadingManager = new THREE.LoadingManager();
      var am = this;
      lm.onLoad = function() {

        am.loaded = true;
        console.log('Assets loaded');

        if (am.onLoad)
          am.onLoad.call(am);
      };

      lm.onProgress = function(url, loaded, total) {
        if (am.onProgress)
          am.onProgress.call(am, url, loaded, total);
      };
      this.soundOn = true;
      this.loaded = false;
    };

    /**
     * Start loading assets
     * @method load
     */
    AssetManager.prototype.load = function() {

      this.loadAudio();
      this.loadTextures();
      this.loadSparkAtlas();
      this.loadModel();
    };

    /**
     * Load audio facility
     * @method loadAudio
     */
    AssetManager.prototype.loadAudio = function() {

      const am = this;

      // Audio 
      const listener = new THREE.AudioListener();

      function loadAudio (src, callback) {

        var au = new THREE.Audio(listener);
        var audioLoader = new THREE.AudioLoader(am.loadingManager);
        audioLoader.load(src, function(buffer) {
          au.setBuffer(buffer);
          if (callback)
            callback.call(am);
        });
        return au;
      }

      // Background
      if (this.pru3d.config.general.useBackgroundMusic)
        this.bgSound = loadAudio(SOUNDS_PATH + '/bg.mp3', function() {
          this.bgSound.setLoop(true);
          this.bgSound.setVolume(am.config.general.backgroundVolume);
        });

      // Piece moving
      this.btnClick = loadAudio(SOUNDS_PATH + '/btnClick.mp3');

      // Firework
      this.firework = loadAudio(SOUNDS_PATH + '/firework.mp3');

      // Win tune
      this.wintune = loadAudio(SOUNDS_PATH + '/wintune.mp3');

      // Lose tune
      this.losetune = loadAudio(SOUNDS_PATH + '/losetune.mp3');

      // Hit coin
      this.hitcoin = loadAudio(SOUNDS_PATH + '/hitcoin.mp3');

      // yahoo
      this.yahoo = loadAudio(SOUNDS_PATH + '/yahoo.mp3');

      // Punch sounds
      this.punch0 = loadAudio(SOUNDS_PATH + '/punch0.mp3');
    };

    /**
     * Load texture atlas
     * @method loadTextureAtlas
     */
    AssetManager.prototype.loadSparkAtlas = function() {

      const am = this;

      function processAtlas () {
        
        const frames = am.atlasData.frames;
        am.textures = [];

        var iw = am.atlasTex.image.width, ih = am.atlasTex.image.height;
        for (let k in frames) {

          const f = frames[k].frame;
          const t = am.atlasTex.clone();
          t.repeat.set(f.w / iw, f.h / ih);
          //f.x += 0.45;
          //f.y += 0.45;
          t.offset.x = ((f.x) / iw);
          t.offset.y = 1 - (f.h / ih) - (f.y / ih);
          t.needsUpdate = true;
          //am.textures.push({key:k.replace('/', '-'), tex:t});
        }
      }

      // Load json data
      const jloader = new THREE.FileLoader(am.loadingManager);
      jloader.load('assets/graphics/spark/spark.json', function(obj) {

        am.sparkData = JSON.parse(obj);

      });

      // Load atlas
      const tex = new THREE.TextureLoader(am.loadingManager);
      tex.load('assets/graphics/spark/spark.png', function(tex) {
        am.sparkTex = tex;
      });
    };

    /**
     * Load app textures
     * @method loadTextures
     */
    AssetManager.prototype.loadTextures = function() {

      const d = this.pru3d.defaultOptions;
      var am = this;

      // Firework texture
      const fwl = new THREE.TextureLoader(am.loadingManager);
      fwl.load(GRAPHICS_PATH + '/' + 'lensflare.png', function(tex) {
        am.fwTexture = tex;
      });

      // Other textures
      const loader = new THREE.TextureLoader(am.loadingManager);
      const list = ['shadow.png', 'ThePirateTarget1.png', 'Road.png', 'stars.png'];

      for (let i = 0; i < list.length; i++) {

        var path = list[i];
        loader.load(GRAPHICS_PATH + '/' + path, function(texture) {

          var name = texture.image.src.split('/').pop().split('.').shift();
          am[name] = texture;
        });
      }
    };

    /**
     * Load game models
     * @method loadModel
     */
    AssetManager.prototype.loadModel = function() {

      const am = this;
      const ml = new THREE.GLTFLoader(am.loadingManager);
      const list = [
        'Tentacle',
        'Skeleton',
        'Sharky',
        'Mako',
        'PTree',
        'LBone',
        'Skull',
        'Coin_Star',
        'Anne',
        'Captain',
        'Henry'];

      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath( 'js/draco/' );
      ml.setDRACOLoader( dracoLoader );

      function loadModel (name) {
        
        ml.load(MODEL_PATH + '/' + name + '.glb', function(gltf) {

          var model = gltf.scene;
          am[name] = model;
          am[name + 'Animations'] = gltf.animations;

          // Fix frustrum
          model.traverse(function(o) {

            if (o.isMesh) {

              // Fix frustum culling
              o.frustumCulled = false;
            }
          });
        });
      }

      for (var i = 0; i < list.length; i++) {
        loadModel(list[i]);
      }
    };

    /**
     * Toggle sound
     * @method toggleSound
     */
    AssetManager.prototype.toggleSound = function() {

      this.soundOn = !this.soundOn;

      if (this.soundOn) {

        if (this.bgSound) this.bgSound.setVolume(this.config.general.backgroundVolume);
        this.btnClick.setVolume(1);
        this.firework.setVolume(1);
        this.wintune.setVolume(1);
        this.losetune.setVolume(1);
        this.hitcoin.setVolume(1);
        this.yahoo.setVolume(1);
        this.punch0.setVolume(1);
      }
      else {
        if (this.bgSound) this.bgSound.setVolume(0);
        this.btnClick.setVolume(0);
        this.firework.setVolume(0);
        this.wintune.setVolume(0);
        this.losetune.setVolume(0);
        this.hitcoin.setVolume(0);
        this.yahoo.setVolume(0);
        this.punch0.setVolume(0);
      }
    };

    return AssetManager;

  });
