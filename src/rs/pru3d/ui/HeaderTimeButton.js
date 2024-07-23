
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    /**
     * HeaderTimeButton component
     * @class HeaderTimeButton
     * @constructor
     */
    function HeaderTimeButton(gh) {

      this.gh = gh;
      this.init();
    }

    /**
     * Init the component
     * @method init
     */
    HeaderTimeButton.prototype.init = function() {

      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-timebtn';
      this.isPlaying = false;
      this.currentTime = 0;

      var gh = this.gh;
      var tbtn = this;
      el.addEventListener('click', function(e) {
        gh.gs.pru3d.assetManager.btnClick.play();
        tbtn.toggleTime();
      });

      // Time icon
      var ti = this.ticon = document.createElement('span');
      el.appendChild(ti);
      ti.className = 'icon-timer';
      
      // Time value
      var tv = this.tval = document.createElement('span');
      tv.className = 'timebtn-value';
      el.appendChild(tv);
      tv.innerHTML = '00:00:00';
      
      // Pause button
      var tp = this.tpause = document.createElement('span');
      tp.className = 'icon-pausetime';
      el.appendChild(tp);
    };

    /**
     * Start elapsed time
     * @method start
     */
    HeaderTimeButton.prototype.resume = function() {
      
      clearInterval(this.timeId);
      this.timeId = setInterval(this.timeTick.bind(this), 1000);
      this.isPlaying = true;
      this.tpause.className = 'icon-pausetime';
    };

    /**
     * Pause the timer
     * @method pause
     */
    HeaderTimeButton.prototype.pause = function() {
      clearInterval(this.timeId);
      this.isPlaying = false;
      this.tpause.className = 'icon-playtime';
    };

    /**
     * Reset timer value
     * @method reset
     */
    HeaderTimeButton.prototype.reset = function() {

      this.currentTime = 0;
      this.tval.innerHTML = "00:00:00";
    };

    /**
     * Time ticking handler
     * @method timeTick
     */
    HeaderTimeButton.prototype.timeTick = function() {

      this.currentTime += 1;
      var c = this.currentTime;
      var h = Math.floor(c / 3600); 
      var m = Math.floor((c - h * 3600) / 60); 
      var s = (c - h * 3600) % 60;

      function format(n) {
        if (n < 10)
          return "0" + n;
        else
          return n;
      }
      this.tval.innerHTML = format(h) + ":" + format(m) + ":" + format(s);
    };

    /**
     * Toggle time 
     * @method toggleTime
     */
    HeaderTimeButton.prototype.toggleTime = function() {

      if (!this.gh.gs.game3d.isRunningState()) return;
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.resume();
      }
      else
        this.pause();
    };

    return HeaderTimeButton;

  });
