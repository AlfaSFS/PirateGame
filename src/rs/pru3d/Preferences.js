
/**
 * @author  raizensoft.com
 */
define(
  function() {

    "use strict";

    /**
     * Preferences
     * @class Preferences
     * @constructor
     */
    function Preferences(config, dataString) {

      this.dataString = dataString;
      this.config = config;
      this.init(dataString);
    }

    /**
     * Init preferences
     * @method init
     */
    Preferences.prototype.init = function(dataString) {

      if (dataString == null) {
        this.data = {
          name:'PirateRun',
          bestScore:0,
          unlocked:[]
        };
        const lvl = this.config.data.level;
        for (let k = 0; k < lvl.length; k++) {
          this.data.unlocked[k] = 0;
        }
        this.save();
      }
      else {
        this.data = JSON.parse(dataString);
      }
    };

    /**
     * Save new data to local storage
     * @method save
     */
    Preferences.prototype.save = function() {
      if (this.data != null)
        localStorage.setItem("PirateRun", JSON.stringify(this.data));
    };

    /**
     * Return unlocked status
     * @method isUnlocked
     */
    Preferences.prototype.isUnlocked = function(index) {

      if (index == 0) return true;
      if (this.data.unlocked[index] !== 1) return false;
      return true;
    };

    /**
     * Save unlock id to local storage
     * @method saveUnlock
     */
    Preferences.prototype.saveUnlock = function(index) {

      var ul = this.data.unlocked;
      ul[index] = 1;
      this.save();
    };

    /**
     * Save best score
     * @method saveBestScore
     */
    Preferences.prototype.saveBestScore = function(score) {

      if (this.data.bestScore < score)
        this.data.bestScore = score;
      this.save();
    };

    /**
     * Return best score
     */
    Preferences.prototype.getBestScore = function() {
      return this.data.bestScore;
    };

    return Preferences;

  });
