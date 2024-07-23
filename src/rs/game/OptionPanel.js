
/**
 * @author  raizensoft.com
 */
define([
  'rs/game/BasePanel'
],
  function(BasePanel) {

    "use strict";

    OptionPanel.prototype = Object.create(BasePanel.prototype);
    OptionPanel.prototype.constructor = OptionPanel;

    /**
     * OptionPanel presents a list of option
     * @class OptionPanel
     * @constructor
     */
    function OptionPanel(data, callback) {

      this.data = data;
      this.callback = callback;
      BasePanel.prototype.constructor.call(this);
    }

    /**
     * Init
     * @method init
     */
    OptionPanel.prototype.init = function() {

      BasePanel.prototype.init.call(this);
      var el = this.el;
      el.classList.add('rs-game-optionpanel');
      el.style.height = 'auto';

      var op = this;

      function clickHandler (e) {
       
        var index = e.currentTarget.index;
        if (op.callback)
          op.callback.call(op, index);
        op.hide();
      }

      // Build option list
      for (var i = 0; i < this.data.length; i++) {

        var item = document.createElement('div');
        item.className = 'rs-optionitem';
        item.innerHTML = this.data[i];
        item.index = i;
        item.addEventListener('click', clickHandler);
        el.appendChild(item);
      }
    };

    return OptionPanel;
  });

