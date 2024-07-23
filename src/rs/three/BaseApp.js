
/**
 * @author  raizensoft.com
 */
define([],

function() {

  "use strict";

  /**
   * Base class for simple 3d gallery
   * @class BaseApp
   * @constructor
   */
  function BaseApp(width, height, fov) {

    this.width = width || 1000;
    this.height = height || 600;
    this.fov = fov || 60; //(hov = 90)
    this.init();
  }

  /**
   * Init components
   * @method init
   */
  BaseApp.prototype.init = function() {

    // Default scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera( this.fov, this.width / this.height, 1, 50000);
    
    // Renderer
    var r = this.renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
    r.setSize(this.width, this.height);
    r.setPixelRatio(window.devicePixelRatio);
    r.outputEncoding = THREE.sRGBEncoding;

    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Render element
    this.el = r.domElement;

    // Raycasting setup
    this.raycaster = new THREE.Raycaster();
  };
  
  /**
   * Render objects
   * @method render
   */
  BaseApp.prototype._renderRequest = function(e) {

    this.renderer.render(this.scene, this.camera);
    this.rId  = requestAnimationFrame(this._renderRequest.bind(this));
  };

  /**
   * Start rendering
   * @method startRender
   */
  BaseApp.prototype.startRendering = function() {
    this.stopRendering();
    this.rId = requestAnimationFrame(this._renderRequest.bind(this));
  };

  /**
   * Stop rendering
   * @method stopRender
   */
  BaseApp.prototype.stopRendering = function() {
    cancelAnimationFrame(this.rId);
  };

  /**
   * Resize handling
   * @method resizeHandler
   */
  BaseApp.prototype.resizeHandler = function() {

    // Recalculate tan of half vfov
    this.thfov = Math.tan(this.camera.fov * Math.PI / 360);
  };

  /**
   * Set camera position to match projection dimension
   * @method setCameraMatchProjection
   */
  BaseApp.prototype.setCameraMatchProjection = function(scaleFactor) {

    scaleFactor = scaleFactor || 1;
    var cam = this.camera;
    var z = 0.5 * this.height / Math.tan(cam.fov * Math.PI / 360);
    cam.position.x = cam.position.y = 0;
    cam.position.z = z / scaleFactor;
    cam.lookAt(new THREE.Vector3(0, 0, 0));
  };

  /**
   * Get scaleFitRatio
   * @method getScaleFitRatio
   */
  BaseApp.prototype._getScaleFitRatio = function(w, h, k) {

    // Scale w and h to match app dimension
    k = k || 0.75;
    
    var r = w / h;
    var rt;
    if (this.width / r > this.height) {
      rt = this.height * k / h;
    }
    else {
      rt = this.width  * k/ w;
    }
    return rt;
  };

  /**
   * Get position z to fit the scaleToFit ratio
   * @method getScaleFitPositionZ
   */
  BaseApp.prototype.getScaleFitPositionZ = function(w, h, k) {

    this.setCameraMatchProjection();

    var rt = this._getScaleFitRatio(w, h, k);
    var camZ = this.camera.position.z;
    var zt = camZ - camZ / rt;
    return zt;
  };

  return BaseApp;

});
