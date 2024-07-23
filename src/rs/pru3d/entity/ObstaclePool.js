
/**
 * @author  raizensoft.com
 */
define(['rs/pru3d/entity/Obstacle'],
  function(Obstacle) {

    "use strict";

    const DEFAULT_ITEMS = 2;

    /**
     * Pool of object
     * @class ObstaclePool
     * @constructor
     */
    function ObstaclePool(pb) {

      this.pb = pb;
      this.init();
    }

    /**
     * Init the pool
     * @method init
     */
    ObstaclePool.prototype.init = function() {

      this.pool = [];
      var pb = this.pb;

      for (var i = 0; i < DEFAULT_ITEMS; i++) {

        var p = new Obstacle(this.pb);
        this.pool.push(p);
      }
    };

    /**
     * Return a new piece
     * @method obtain
     */
    ObstaclePool.prototype.obtain = function() {

      if (this.pool.length > 0) {

        var p = this.pool.pop();
        p.reset();
        return p;
      }
      else {
        var p = new Obstacle(this.pb);
        p.reset();
        return p;
      }
    };

    /**
     * Free pool object
     * @method free
     */
    ObstaclePool.prototype.free = function(p) {
      this.pool.push(p);
    };

    return ObstaclePool;

  });
