
/**
 * @author  raizensoft.com
 */
define([
  'rs/utils/ObjectUtil'
],
function(ObjectUtil) {

  "use strict";

  /**
   * Ring Preloader
   * @class RingPreloader
   * @constructor
   */
  function RingPreloader(opt) {

    this.dopt = {
      size:40,
      borderWidth:6,
      borderColor:'#AAA'
    };
    ObjectUtil.merge(opt, this.dopt);
    this.build();
  }

  /**
   * Build the preloader
   * @method build
   */
  RingPreloader.prototype.build = function() {

    var dopt = this.dopt;

    // Root element
    var el = this.el = document.createElement('div');
    el.className = 'rs-ringpreloader';
    el.innerHTML = 
      "<div class='lds-ring'><div></div><div></div><div></div><div></div></div>";

    el.style.marginLeft = el.style.marginTop = -dopt.size * 0.5 + 'px';
    var divs = el.firstChild.children;
    for (var i = 0; i < divs.length; i++) {

      var s = divs[i].style;
      s.width = s.height = dopt.size + 'px';
      s.borderWidth = dopt.borderWidth + 'px';
      s.borderTopColor = dopt.borderColor;
    }
  };

  /**
   * Show this preloader
   * @method show
   */
  RingPreloader.prototype.show = function() {
    this.el.style.display = 'block';
  };

  /**
   * Hide this preloader
   * @method hide
   */
  RingPreloader.prototype.hide = function() {
    this.el.style.display = 'none';
  };

  return RingPreloader;

});

