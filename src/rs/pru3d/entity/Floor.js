
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    const LINES_WIDTH = 7;
    const LINES_HEIGHT = 40;

    Floor.prototype = Object.create(THREE.Group.prototype);
    Floor.prototype.constructor = Floor; 

    /**
     * Floor object
     * @class Floor
     * @constructor
     */
    function Floor(rs) {

      this.rs = rs;
      this.am = rs.am;
      this.dopt = rs.dopt;
      this.init();
    }

    /**
     * Init the floor
     * @method init
     */
    Floor.prototype.init = function() {

      THREE.Group.prototype.constructor.call(this);

      // Ground plane
      const bs = this.dopt.blockSize;
      const gridSize = this.gridSize = bs * 21;

      const tex = this.am.Road;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(LINES_WIDTH, LINES_HEIGHT);

      const mat = new THREE.MeshBasicMaterial({map:tex, color:0xeeeeee, depthWrite:false});
      //const mat = new THREE.MeshBasicMaterial({color:0xeeeeee, depthWrite:false});
      const gr = this.gridPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1, 1),
        mat);
      gr.rotation.x = - Math.PI / 2;
      gr.isFloor = true;
      this.add(gr);
      this.gridPlane.scale.set(LINES_WIDTH * bs, LINES_HEIGHT * bs);
      
      // Default config
      this.config(LINES_WIDTH, LINES_HEIGHT);
    };

    /**
     * Self Align
     * @method selfAlign
     */
    Floor.prototype.selfAlign = function() {

      var offset = 5;
      this.position.z = this.offsetZ = -(this.currentLineHeight - offset) * this.dopt.blockSize * 0.5;
    };

    /**
     * Create custom grid
     * @method createGrid
     */
    Floor.prototype.createGrid = function(opts) {

      var config = opts || {
        linesWidth: LINES_WIDTH,
        linesHeight: LINES_HEIGHT,
        color: 0x999999
      };
      var unitSize = this.dopt.blockSize;
      config.width = unitSize * config.linesWidth * 0.5;
      config.height = unitSize * config.linesHeight * 0.5;

      var material = new THREE.LineBasicMaterial({color: config.color});

      var gridObject = new THREE.Object3D(),
        gridGeo = new THREE.Geometry(),
        stepw = 2 * config.width / config.linesWidth,
        steph = 2 * config.height / config.linesHeight;

      // Width
      for (var i = -config.height; i <= config.height; i += stepw) {
        gridGeo.vertices.push(new THREE.Vector3(-config.width, i, 0));
        gridGeo.vertices.push(new THREE.Vector3(config.width, i, 0));
      }
      
      // Height
      for (var i = -config.width; i <= config.width; i += steph) {
        gridGeo.vertices.push(new THREE.Vector3(i, -config.height, 0));
        gridGeo.vertices.push(new THREE.Vector3(i, config.height, 0));
      }

      var line = new THREE.LineSegments(gridGeo, material);
      gridObject.add(line);
      gridObject.rotation.x = Math.PI / 2;
      return gridObject;
    };

    /**
     * Return matrix position from input point
     * @method getMatrixPosition
     */
    Floor.prototype.getMatrixPosition = function(point) {

      var bs = this.dopt.blockSize;
      var r = this.currentLineHeight, c = this.currentLineWidth;
      var rx = point.x / (this.currentLineWidth * bs) + 0.5;
      var pZ = point.z - this.offsetZ;
      var ry = 0.5 + pZ / (this.currentLineHeight * bs);
      var j = Math.floor(rx * c), i = Math.floor(ry * r);
      return [i, j];
    };

    /**
     * Get spatial position from i, j
     * @method getSpatialPosition
     */
    Floor.prototype.getSpatialPosition = function(i, j) {

      var x = j * this.dopt.blockSize + this.originX;
      var z = i * this.dopt.blockSize + this.originZ + this.offsetZ;
      return [x, z];
    };

    /**
     * Get point position
     * @method getPointPosition
     */
    Floor.prototype.getPointPosition = function(point) {

      var mp = this.getMatrixPosition(point);
      return this.getSpatialPosition(mp[0], mp[1]);
    };

    /**
     * Config floor
     * @method config
     */
    Floor.prototype.config = function(linesWidth, linesHeight) {

      // Create grid plane
      this.gridPlane.scale.set(linesWidth * this.dopt.blockSize, linesHeight * this.dopt.blockSize);

      // Create grid
      if (this.grid) this.remove(this.grid);
      this.grid = this.createGrid({linesWidth:linesWidth, linesHeight:linesHeight, color:0x999999});
      //this.add(this.grid);

      // Call self aligning
      this.originX = -this.dopt.blockSize * linesWidth * 0.5 + this.dopt.blockSize * 0.5;
      this.originZ = -this.dopt.blockSize * linesHeight * 0.5 + this.dopt.blockSize * 0.5;
      this.offsetZ = 0;
      this.currentLineWidth = linesWidth;
      this.currentLineHeight = linesHeight;
      this.selfAlign();
    };

    /**
     * Return matrix position from input point
     * @method getMatrixPosition
     */
    Floor.prototype.getMatrixPosition = function(point) {

      var bs = this.dopt.blockSize;
      var r = this.currentLineHeight, c = this.currentLineWidth;
      var rx = point.x / (this.currentLineWidth * bs) + 0.5;
      var pZ = point.z - this.offsetZ;
      var ry = 0.5 + pZ / (this.currentLineHeight * bs);
      var j = Math.floor(rx * c), i = Math.floor(ry * r);
      return [i, j];
    };

    /**
     * Get spatial position from i, j
     * @method getSpatialPosition
     */
    Floor.prototype.getSpatialPosition = function(i, j) {

      var bs = this.dopt.blockSize;
      var x = j * bs + this.originX;
      var z = i * bs + this.originZ + this.offsetZ;
      return [x, z];
    };

    /**
     * Get point position
     * @method getPointPosition
     */
    Floor.prototype.getPointPosition = function(point) {

      var mp = this.getMatrixPosition(point);
      return this.getSpatialPosition(mp[0], mp[1]);
    };

    /**
     * Get limit X position
     * @method getLimitX
     */
    Floor.prototype.getLimitX = function() {
      return  this.currentLineWidth * 0.5 * this.dopt.blockSize;
    };

    /**
     * Return midline
     * @method getMidLine
     */
    Floor.prototype.getMidLine = function() {
      return Math.floor(this.currentLineWidth * 0.5);
    };

    /**
     * Shift stage forward
     */
    Floor.prototype.shiftForward = function() {

      //console.log('shifting forward');
      const bs = this.dopt.blockSize;
      this.position.z -= (this.currentLineHeight * 0.25) * bs;
    };

    return Floor;

  });
