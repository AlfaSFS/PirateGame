
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    /**
     * HomeScreenHeader component
     * @class HomeScreenHeader
     * @constructor
     */
    function HomeScreenHeader(hs) {

      // Save HomeScreen reference
      this.hs = hs;
      this.init();
    }

    /**
     * Build header components
     * @method init
     */
    HomeScreenHeader.prototype.init = function() {

      // Container
      var el = this.el = document.createElement('div');
      el.className = 'rs-hscreen-header';

      var config = this.hs.config;

      // App title
      this.title = document.createElement('h1');
      this.title.className = 'app-title';
      this.title.innerHTML = config.strings.APP_TITLE;
      el.appendChild(this.title);


      // App info
      this.info = document.createElement('span');
      this.info.className = 'app-info';
      this.info.innerHTML = config.strings.APP_INFO;
      el.appendChild(this.info);
      
      // Progressbar
      this.progress = document.createElement('div');
      this.progress.className = 'app-progress';
      this.progressInner = document.createElement('div');
      this.progressInner.className = 'app-progress-inner';
      el.appendChild(this.progress);
      this.progress.appendChild(this.progressInner);
      this.setProgress(0);

      // Logo
      this.logo = document.createElement('img');
      this.logo.className = 'app-logo';
      this.logo.src = 'assets/graphics/logo.png';
      this.logo.onmousedown = function(e) {
        e.preventDefault();
      };
      el.appendChild(this.logo);
    };

    /**
     * Hide progress bar
     * @method hideProgress
     */
    HomeScreenHeader.prototype.hideProgress = function() {

      var p = this.progress;
      anime({
        targets:p,
        opacity:0,
        easing:'easeOutQuint',
        complete:function() {
          p.style.display = 'none';
        }
      });
    };

    /**
     * Hide logo
     * @method hideLogo
     */
    HomeScreenHeader.prototype.hideLogo = function() {

      var l = this.logo;
      var isMobile = this.hs.pru3d.isMobile;
      anime({
        targets:l,
        opacity:0,
        easing:'easeOutQuint',
        complete:function() {

          if (isMobile) {
            l.style.display = 'none';
            return;
          }
          anime.remove(l);
          anime({
            targets:l,
            width:32,
            marginTop:20,
            opacity:1
          });
        }
      });
    };

    /**
     * Set progress bar value
     * @method setProgress
     */
    HomeScreenHeader.prototype.setProgress = function(value) {
      this.progressInner.style.width = value + '%';
    };

    /**
     * Move header to top position
     * @method moveTop
     */
    HomeScreenHeader.prototype.moveTop = function() {

      this.hideProgress();
      this.hideLogo();
      anime.remove(this.el);
      anime({
        targets:this.el,
        top:0,
        translateY:0,
        easing:'easeOutQuint',
        duration:1200
      });
    };

    /**
     * Center this component
     * @method center
     */
    HomeScreenHeader.prototype.center = function() {

      var am = this.hs.pru3d.assetManager;
      var el = this.el;

      anime({
        targets:this.el,
        top:'50%',
        translateY:'-50%',
        duration:1400,
        update:function() {
          if (am.showDelay) {

            anime.remove(el);
            anime({
              targets:el,
              top:0,
              translateY:0,
              duration:0
            });
          }
        }
      });
    };

    return HomeScreenHeader;
  });
