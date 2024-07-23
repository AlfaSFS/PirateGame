
/**
 * @author  raizensoft.com
 */
define([
  'rs/three/BaseApp',
  'rs/utils/BrowserUtil', 
  'rs/game3d/Firework3DSet', 
  'rs/pru3d/CoinCounter', 
  'rs/pru3d/Game3dContainer'], 

  function(
    BaseApp,
    BrowserUtil,
    Firework3DSet,
    CoinCounter,
    Game3dContainer) {

    "use strict";

    Game3d.prototype = Object.create(BaseApp.prototype);
    Game3d.prototype.constructor = Game3d;

    var Game3dState = {
      RUNNING:0,
      WON:1,
      LOSE:2,
      READY:3,
      PAUSE:4
    };

    /**
     * Main game components
     * @class Game3d
     * @constructor
     */
    function Game3d(gs) {

      this.gs = gs;
      this.config = gs.config;
      this.pru3d = gs.pru3d;
      this.dopt = this.pru3d.defaultOptions;
      this.am = this.pru3d.assetManager;

      // Default temporary dimension
      var w = 500, h = 300; 
      BaseApp.prototype.constructor.call(this, w, h);
      this.setCameraMatchProjection();

      // Default cursor
      this.defaultCursor = 'auto';

      // Build basic threejs components
      this.buildScene();
      //this.enableOrbitControl();
      
      // Init dragging control
      this.initMouseDrag();

      // Init mouse handler
      this.initMouseHandler();

      // Init keyboard
      this.initKeyboard();
    }

    /**
     * Enable orbit controls
     * @method enableOrbitControl
     */
    Game3d.prototype.enableOrbitControl = function() {

      this.controls = new OrbitControls( this.camera, this.el );
      this.controls.enableDamping = true;
    };

    /**
     * Build scene
     * @method buildScene
     */
    Game3d.prototype.buildScene = function() {

      // Parent container of all 3d items
      this.container = new Game3dContainer(this);

      // Clock utility
      this.clock = new THREE.Clock();
      
      // Coin counter
      this.cc = new CoinCounter();

      // Add game container
      var scene = this.scene;
      scene.add(this.container);
      scene.background = new THREE.Color(this.dopt.sceneColor);
      scene.fog = new THREE.Fog(this.dopt.sceneColor, 10, 450);

      var am = this.am;

      // Init firework collection
      this.f3ds = new Firework3DSet(this, 
        {
          numParticles:3, 
          callback:function() {
            am.firework.play();
          }
        });
      scene.add(this.f3ds);
      
      // Default game states
      this.camera.rotation.x = 0;
      this.f3ds.visible = false;
      this.inTransition = false;

      // Setup raycasting
      this._setUpRaycaster();

      // Force resizing upon building scene
      this.resizeHandler();
    };

    /**
     * Init mouse dragging function
     * @method initMouseDrag
     */
    Game3d.prototype.initMouseDrag = function() {

      var me = BrowserUtil.getMouseTouchEvents();
      var mdown = me.mdown, mmove = me.mmove, mup = me.mup;
      var el = this.el;
      let oX, clientX, oRotZ;
      var g3d = this, container = this.container, rs = container.runningStage;

      function mouseDownHandler (e) {
        
        if (!g3d.isRunningState()) return;
        g3d.isDragging = true;
        if (e.touches) {
          clientX = e.touches[0].clientX;
        }
        else {
          clientX = e.clientX;
        }
        oX = clientX;
        el.addEventListener(mmove, mouseMoveHandler);
        el.addEventListener(mup, mouseUpHandler);
        window.addEventListener(mmove, mouseMoveHandler);
        window.addEventListener(mup, mouseUpHandler);
        //el.style.cursor = 'grabbing';
      }

      function mouseMoveHandler (e) {
        
        if (!g3d.isRunningState()) return;
        if (e.changedTouches) {
          clientX = e.changedTouches[0].clientX;
        }
        else {
          clientX = e.clientX;
        }
        var delta = (clientX - oX) * 0.25;
      }

      function mouseUpHandler (e) {
        
        g3d.isDragging = false;
        el.removeEventListener(mmove, mouseMoveHandler);
        el.removeEventListener(mup, mouseUpHandler);
        window.removeEventListener(mmove, mouseMoveHandler);
        window.removeEventListener(mup, mouseUpHandler);
        //el.style.cursor = 'grab';
      }

      el.addEventListener(mdown, mouseDownHandler);
      el.addEventListener('mouseover', function(e) {
        //el.style.cursor = 'grab';
      });
      this.disableDragEvent = mouseUpHandler;
    };

    /**
     * Init mouse handlers
     */
    Game3d.prototype.initMouseHandler = function() {

      const g3d = this;

      function pointeDownHandler (e) {
        
        if (g3d.state !== Game3dState.RUNNING) return;

        const rs = g3d.container.runningStage;

        if (e.clientX / window.innerWidth > 0.5) {
          rs.pirate.shiftRight();
        }
        else {
          rs.pirate.shiftLeft();
        }
      }

      function pointerMoveHandler (e) {
        
      }

      document.body.addEventListener('pointerdown', pointeDownHandler);
      document.body.addEventListener('pointermove', pointerMoveHandler);
    };

    /**
     * Init keyboard
     * @method initKeyboard
     */
    Game3d.prototype.initKeyboard = function() {

      const g3d = this;
      const kt = this.keyTracking = [];

      function keyDownHandler (e) {

        if (g3d.state !== Game3dState.RUNNING) return;

        const rs = g3d.container.runningStage;

        if (e.keyCode == 37 || e.keyCode == 65) {
          rs.pirate.shiftLeft();
        }
        else if (e.keyCode == 39 || e.keyCode == 68) {
          rs.pirate.shiftRight();
        }
        kt[e.keyCode] = 1;
      }

      function keyUpHandler (e) {
        kt[e.keyCode] = 0;
      }
      document.body.addEventListener('keydown', keyDownHandler);
      document.body.addEventListener('keyup', keyUpHandler);
    };

    /**
     * Setup raycasting
     * @method _setUpRaycaster
     * @private
     */
    Game3d.prototype._setUpRaycaster = function() {

      const camera = this.camera;
      const raycaster = this.raycaster;
      const container = this.container;
      const el = this.el;

      const g3d = this;
      const am = this.am;
      const rs = this.container.runningStage;
      let lastX, lastY;

      function doRaycast (e) {

        var oX, oY;
        if (e.touches) {
          oX = e.touches[0].clientX; oY = e.touches[0].clientY;
        }
        else
        if (e.changedTouches) {
          oX = e.changedTouches[0].clientX; oY = e.changedTouches[0].clientY;
        }
        else {
          oX = e.offsetX; oY = e.offsetY;
        }
        var mouse = {
          x: (oX / g3d.width) * 2 - 1,
          y: -(oY / g3d.height) * 2 + 1,
        };
        raycaster.setFromCamera( mouse, camera );    

        // Compute intersections
        var intersects = raycaster.intersectObjects( container.children, true);

        for ( var i = 0; i < intersects.length; i++ ) {

          const item = intersects[i].object;

          // Click handler
          if (e.type == 'pointerdown') {
            g3d.isHover = true;
          }

          // Mouse over out handler 
          if (e.type == 'pointerup') {
          }
          break;

          /*
          - object : intersected object (THREE.Mesh)
          - distance : distance from camera to intersection (number)
          - face : intersected face (THREE.Face3)
          - faceIndex : intersected face index (number)
          - point : intersection point (THREE.Vector3)
          - uv : intersection point in the object's UV coordinates (THREE.Vector2)
          */
        }

        // Mouseout
        if (intersects.length == 0 && e.type == 'pointermove') {
          g3d.isHover = false;
        }
      }

      function mouseUpHandler(pointer) {

      }

      // Mouse click, over, out
      el.addEventListener('pointerdown', doRaycast);

      // Check mousemove to determine over and out status
      el.addEventListener('pointerup', mouseUpHandler);
    };

    /**
     * Load level
     * @method loadLevel
     */
    Game3d.prototype.loadLevel = function(index, callback) {

      this.disableDragEvent();
      this.pru3d.inTransition = true;

      var levels = this.gs.levels;

      // Back to first level
      if (index == levels.length) 
        index = 0;

      var item = levels[index];
      var g3d = this;
      this.container.visible = false;

      // Show container
      g3d.container.show();

      // Prepare level
      this.container.runningStage.prepareLevel(item);

      // Reset camera
      this.camera.rotation.x = 0;
      this.camera.position.set(0, 0, 40);
      this.setReadyState();

      // Call callback
      callback.call(g3d);
    };

    /**
     * Override _renderRequest
     * @method _renderRequest
     */
    Game3d.prototype._renderRequest = function() {

      BaseApp.prototype._renderRequest.call(this);

      const delta = this.clock.getDelta();

      // Update orbit controls
      if (this.controls)
        this.controls.update();

      // Update light movements
      this.container.glight.animate();

      // Firework
      if (this.state == Game3dState.WON) {
        this.f3ds.update(delta);
      }
      
      // Update game objects
      const rs = this.container.runningStage;

      if (this.isReadyState()) {
        rs.pirate.mixer.update(delta);
      }
      else
      if (this.isRunningState())
        rs.update(delta);
    };

    /**
     * Set current state to be ready
     * @method setReadyState
     */
    Game3d.prototype.setReadyState = function() {
      this.state = Game3dState.READY;
    };

    /**
     * Ready state
     * @method isReadyState
     */
    Game3d.prototype.isReadyState = function() {
      return (this.state == Game3dState.READY);
    };

    /**
     * Return pause state 
     * @method isPauseState
     */
    Game3d.prototype.isPauseState = function() {
      return (this.state == Game3dState.PAUSE);
    };

    /**
     * Set pause state
     * @method setPauseState
     */
    Game3d.prototype.setPauseState = function() {

      this.lastState = this.state;
      this.state = Game3dState.PAUSE;
    };

    /**
     * Restore last state
     * @method restoreLastState
     */
    Game3d.prototype.restoreLastState = function() {
      this.state = this.lastState;
    };

    /**
     * Set current state to running
     * @method setRunningState
     */
    Game3d.prototype.setRunningState = function() {

      this.state = Game3dState.RUNNING;
      this.camera.rotation.x = 0;
      this.f3ds.visible = false;
      this.inTransition = false;
      this.gs.header.show();
    };

    /**
     * Test running state
     * @method isRunningState
     */
    Game3d.prototype.isRunningState = function() {
      return (this.state == Game3dState.RUNNING);
    };

    /**
     * Set current state to won
     * @method setWonState
     */
    Game3d.prototype.setWonState = function() {

      //if (this.state !== Game3dState.RUNNING) return;

      this.state = Game3dState.WON;
      this.inTransition = true;

      var rs = this.container.runningStage;
      rs.gi.lose();
      rs.astronaut.win();

      // Show firework
      this.f3ds.visible = true;
      this.f3ds.reset();
      this.f3ds.position.z = rs.astronaut.position.z - 1000;

      // Setup UI
      this.gs.header.hide();
      this.gs.showWonBar();
      this.am.wintune.play();
      this.am.yahoo.play();

      // Unlock next level
      this.gs.unlockNextLevel();
    };

    /**
     * Set lose state
     * @method setLoseState
     */
    Game3d.prototype.setLoseState = function() {

      //if (this.state !== Game3dState.RUNNING) return;

      this.state = Game3dState.LOSE;
      this.inTransition = true;
      this.container.setLoseState();

      // Setup UI
      this.gs.header.hide();
      this.gs.showLoseBar();
      this.am.losetune.play();
    };

    /**
     * Return current point/score
     * @method getCurrentScore
     */
    Game3d.prototype.getCurrentScore = function() {
      return this.cc.coin;
    };

    /**
     * Resize game
     * @method resize
     */
    Game3d.prototype.resize = function(rw, rh) {

      this.width = rw;
      this.height = rh;
      this.camera.aspect = rw / rh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(rw, rh);
      this.resizeHandler();
      this.camera.position.z = 40;
      this.f3ds.changeRegion(rw, rh);
    };

    /**
     * Override resizeHandler
     * @method resizeHandler
     */
    Game3d.prototype.resizeHandler = function(e) {

      BaseApp.prototype.resizeHandler.call(this);
      this.setCameraMatchProjection();
    };

    /**
     * Show this element
     * @method show
     */
    Game3d.prototype.show = function() {
      this.el.style.display = 'block';
    };

    /**
     * Hide this element
     * @method hide
     */
    Game3d.prototype.hide = function() {
      this.el.style.display = 'none';
    };

    /**
     * Destroy the game component and save resoureces
     * @method destroy
     */
    Game3d.prototype.destroy = function() {

    };

    return Game3d;

  });
