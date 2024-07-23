
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    /**
     * HeaderLevelButton component
     * @class HeaderLevelButton
     * @constructor
     */
    function HeaderLevelButton(gh) {
      this.gh = gh;
      this.init();
    }

    /**
     * Init the button
     * @method init
     */
    HeaderLevelButton.prototype.init = function() {

      const el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-levelbtn';

      const gh = this.gh;
      
      // Label
      this.label = document.createElement('span');
      this.label.className = 'levelbtn-label';
      el.appendChild(this.label);

      // Shuffle button
      this.btn = document.createElement('span');
      this.btn.className = 'levelbtn-shuffle icon-shuffle';
      //el.appendChild(this.btn);
      this.setLevel(0);
    };

    /**
     * Set current level label
     * @method setLevel
     */
    HeaderLevelButton.prototype.setLevel = function(level) {

      this.label.innerHTML = 'Score: ' + level;
      function randColor () {
        return Math.floor(Math.random() * 150);
      }
      this.el.style.backgroundColor = 'rgba(' + randColor() + ', ' + randColor() + ', ' + randColor() + ', 0.65)';
    };

    return HeaderLevelButton;
  });
