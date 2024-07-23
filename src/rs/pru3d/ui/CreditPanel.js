
/**
 * @author  raizensoft.com
 */
define([
  'rs/game/BasePanel'
],
  function(BasePanel) {

    "use strict";

    CreditPanel.prototype = Object.create(BasePanel.prototype);
    CreditPanel.prototype.constructor = CreditPanel;

    /**
     * Credit panel component
     * @class CreditPanel
     * @constructor
     */
    function CreditPanel(pru3d) {

      this.pru3d = pru3d;
      BasePanel.prototype.constructor.call(this);
    }

    /**
     * Init
     * @method init
     */
    CreditPanel.prototype.init = function() {

      BasePanel.prototype.init.call(this);
      var el = this.el;
      el.classList.add('rs-pru3d-cpanel');
      el.style.width = '90%';
      el.style.height = 'auto';

      var c = this.content = document.createElement('div');
      var strings = this.pru3d.config.strings;
      c.innerHTML = '<h3>' + strings.APP_TITLE + '</h3>';
      c.innerHTML += '<p>'+ strings.CREDIT_TEXT + '</p>';
      el.appendChild(c);
    };

    return CreditPanel;

  });
