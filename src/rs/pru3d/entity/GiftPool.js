
/**
 * @author  raizensoft.com
 */
define([
  'rs/pru3d/entity/Gift'
],
  function(Gift) {

    "use strict";

    var DEFAULT_ITEMS = 2;

    /**
     * Pool of object
     * @class GiftPool
     * @constructor
     */
    function GiftPool(pb) {

      this.pb = pb;
      this.init();
    }

    /**
     * Init the pool
     * @method init
     */
    GiftPool.prototype.init = function() {

      this.pool = [];
      var pb = this.pb;

      for (var i = 0; i < DEFAULT_ITEMS; i++) {

        var p = new Gift(this.pb);
        this.pool.push(p);
      }
    };

    /**
     * Return a new piece
     * @method obtain
     */
    GiftPool.prototype.obtain = function() {

      //if (this.pool.length > 0) {
      if (false) {

        var p = this.pool.pop();
        p.reset();
        return p;
      }
      else {
        var p = new Gift(this.pb);
        p.reset();
        return p;
      }
    };

    /**
     * Free pool object
     * @method free
     */
    GiftPool.prototype.free = function(p) {
      this.pool.push(p);
    };

    return GiftPool;

  });
