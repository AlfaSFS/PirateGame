
/**
 * @author  raizensoft.com
 */
define([
    'rs/utils/BrowserUtil'
  ],
  function(BrowserUtil) {

    "use strict";

    /**
     * Button used font icons technique
     * @class IconButton
     * @constructor
     */
    function IconButton(className, clickCallback) {
      this.init(className, clickCallback);
    }

    /**
     * Init button
     * @method init
     */
    IconButton.prototype.init = function(className, clickCallback) {

      var el = this.el = document.createElement('span');
      el.className = className;
      BrowserUtil.css(el,{
        display:'block',
        cursor:'pointer',
        borderRadius:'50%',
        textAlign:'center'
      });

      var btn = this;
      if (clickCallback)
      el.addEventListener('click', function(e) {
        clickCallback.call(btn);
      });
    };

    return IconButton;

  });
