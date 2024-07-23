(function() {
/**
 * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
        return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relParts) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0],
            relResourceName = relParts[1];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relResourceName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
            } else {
                name = normalize(name, relResourceName);
            }
        } else {
            name = normalize(name, relResourceName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, relParts,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;
        relParts = makeRelParts(relName);

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, makeRelParts(callback)).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("libs/almond", function(){});


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/Preferences',[],function() {

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


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/AssetManager',[],function() {

    "use strict";

    var SOUNDS_PATH = 'assets/sounds';
    var GRAPHICS_PATH = 'assets/graphics';
    var MODEL_PATH = 'assets/model';

    /**
     * Central asset manager objec
     * @class AssetManager
     * @constructor
     */
    function AssetManager(pru3d) {

      this.pru3d = pru3d;
      this.config = pru3d.config;
      this.init();
    }

    /**
     * Init sub components
     * @method init
     */
    AssetManager.prototype.init = function() {

      // Init LoadingManager
      var lm = this.loadingManager = new THREE.LoadingManager();
      var am = this;
      lm.onLoad = function() {

        am.loaded = true;
        console.log('Assets loaded');

        if (am.onLoad)
          am.onLoad.call(am);
      };

      lm.onProgress = function(url, loaded, total) {
        if (am.onProgress)
          am.onProgress.call(am, url, loaded, total);
      };
      this.soundOn = true;
      this.loaded = false;
    };

    /**
     * Start loading assets
     * @method load
     */
    AssetManager.prototype.load = function() {

      this.loadAudio();
      this.loadTextures();
      this.loadSparkAtlas();
      this.loadModel();
    };

    /**
     * Load audio facility
     * @method loadAudio
     */
    AssetManager.prototype.loadAudio = function() {

      const am = this;

      // Audio 
      const listener = new THREE.AudioListener();

      function loadAudio (src, callback) {

        var au = new THREE.Audio(listener);
        var audioLoader = new THREE.AudioLoader(am.loadingManager);
        audioLoader.load(src, function(buffer) {
          au.setBuffer(buffer);
          if (callback)
            callback.call(am);
        });
        return au;
      }

      // Background
      if (this.pru3d.config.general.useBackgroundMusic)
        this.bgSound = loadAudio(SOUNDS_PATH + '/bg.mp3', function() {
          this.bgSound.setLoop(true);
          this.bgSound.setVolume(am.config.general.backgroundVolume);
        });

      // Piece moving
      this.btnClick = loadAudio(SOUNDS_PATH + '/btnClick.mp3');

      // Firework
      this.firework = loadAudio(SOUNDS_PATH + '/firework.mp3');

      // Win tune
      this.wintune = loadAudio(SOUNDS_PATH + '/wintune.mp3');

      // Lose tune
      this.losetune = loadAudio(SOUNDS_PATH + '/losetune.mp3');

      // Hit coin
      this.hitcoin = loadAudio(SOUNDS_PATH + '/hitcoin.mp3');

      // yahoo
      this.yahoo = loadAudio(SOUNDS_PATH + '/yahoo.mp3');

      // Punch sounds
      this.punch0 = loadAudio(SOUNDS_PATH + '/punch0.mp3');
    };

    /**
     * Load texture atlas
     * @method loadTextureAtlas
     */
    AssetManager.prototype.loadSparkAtlas = function() {

      const am = this;

      function processAtlas () {
        
        const frames = am.atlasData.frames;
        am.textures = [];

        var iw = am.atlasTex.image.width, ih = am.atlasTex.image.height;
        for (let k in frames) {

          const f = frames[k].frame;
          const t = am.atlasTex.clone();
          t.repeat.set(f.w / iw, f.h / ih);
          //f.x += 0.45;
          //f.y += 0.45;
          t.offset.x = ((f.x) / iw);
          t.offset.y = 1 - (f.h / ih) - (f.y / ih);
          t.needsUpdate = true;
          //am.textures.push({key:k.replace('/', '-'), tex:t});
        }
      }

      // Load json data
      const jloader = new THREE.FileLoader(am.loadingManager);
      jloader.load('assets/graphics/spark/spark.json', function(obj) {

        am.sparkData = JSON.parse(obj);

      });

      // Load atlas
      const tex = new THREE.TextureLoader(am.loadingManager);
      tex.load('assets/graphics/spark/spark.png', function(tex) {
        am.sparkTex = tex;
      });
    };

    /**
     * Load app textures
     * @method loadTextures
     */
    AssetManager.prototype.loadTextures = function() {

      const d = this.pru3d.defaultOptions;
      var am = this;

      // Firework texture
      const fwl = new THREE.TextureLoader(am.loadingManager);
      fwl.load(GRAPHICS_PATH + '/' + 'lensflare.png', function(tex) {
        am.fwTexture = tex;
      });

      // Other textures
      const loader = new THREE.TextureLoader(am.loadingManager);
      const list = ['shadow.png', 'ThePirateTarget1.png', 'Road.png', 'stars.png'];

      for (let i = 0; i < list.length; i++) {

        var path = list[i];
        loader.load(GRAPHICS_PATH + '/' + path, function(texture) {

          var name = texture.image.src.split('/').pop().split('.').shift();
          am[name] = texture;
        });
      }
    };

    /**
     * Load game models
     * @method loadModel
     */
    AssetManager.prototype.loadModel = function() {

      const am = this;
      const ml = new THREE.GLTFLoader(am.loadingManager);
      const list = [
        'Tentacle',
        'Skeleton',
        'Sharky',
        'Mako',
        'PTree',
        'LBone',
        'Skull',
        'Coin_Star',
        'Anne',
        'Captain',
        'Henry'];

      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath( 'js/draco/' );
      ml.setDRACOLoader( dracoLoader );

      function loadModel (name) {
        
        ml.load(MODEL_PATH + '/' + name + '.glb', function(gltf) {

          var model = gltf.scene;
          am[name] = model;
          am[name + 'Animations'] = gltf.animations;

          // Fix frustrum
          model.traverse(function(o) {

            if (o.isMesh) {

              // Fix frustum culling
              o.frustumCulled = false;
            }
          });
        });
      }

      for (var i = 0; i < list.length; i++) {
        loadModel(list[i]);
      }
    };

    /**
     * Toggle sound
     * @method toggleSound
     */
    AssetManager.prototype.toggleSound = function() {

      this.soundOn = !this.soundOn;

      if (this.soundOn) {

        if (this.bgSound) this.bgSound.setVolume(this.config.general.backgroundVolume);
        this.btnClick.setVolume(1);
        this.firework.setVolume(1);
        this.wintune.setVolume(1);
        this.losetune.setVolume(1);
        this.hitcoin.setVolume(1);
        this.yahoo.setVolume(1);
        this.punch0.setVolume(1);
      }
      else {
        if (this.bgSound) this.bgSound.setVolume(0);
        this.btnClick.setVolume(0);
        this.firework.setVolume(0);
        this.wintune.setVolume(0);
        this.losetune.setVolume(0);
        this.hitcoin.setVolume(0);
        this.yahoo.setVolume(0);
        this.punch0.setVolume(0);
      }
    };

    return AssetManager;

  });


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/ui/HomeScreenHeader',[],function() {

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


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/ui/HomeScreenMenu',[],function() {

    "use strict";

    /**
     * The menu component for home screen
     * @class HomeScreenMenu
     * @constructor
     */
    function HomeScreenMenu(hs) {

      this.hs = hs;
      this.init();
    }

    /**
     * Init menu sub component
     * @method init
     */
    HomeScreenMenu.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-hscreenmenu';

      this.con = document.createElement('div');
      this.con.className = 'menu-list';
      el.appendChild(this.con);

      var config = this.hs.config;
      var hs = this.hs;

      // Menu items
      this.addItem(config.strings.NEW_GAME, function() {
        hs.startNewGame();
      });

      if (config.general.useHelpPanel)
        this.addItem(config.strings.HELP, function() {
          hs.showHelp();
        });

      if (config.general.useCreditPanel)
        this.addItem(config.strings.CREDIT, function() {
          hs.showCredit();
        });
    };

    /**
     * Add menu item with label
     * @method addItem
     */
    HomeScreenMenu.prototype.addItem = function(label, clickCallback) {

      var item = document.createElement('div');
      item.className = 'menu-item';
      item.innerHTML = label;
      item.style.opacity = 0;
      this.con.appendChild(item);

      // Interaction
      var am = this.hs.pru3d.assetManager;
      item.addEventListener('click', function(e) {
        if (clickCallback)
          clickCallback.call(this);
        am.btnClick.play();
      });
    };

    /**
     * Show the menu
     * @method show
     */
    HomeScreenMenu.prototype.show = function() {

      anime({
        targets:'.rs-hscreenmenu .menu-item',
        opacity:1,
        easing:'easeOutQuad',
        delay:anime.stagger(150, {start:500})
      });
    };

    return HomeScreenMenu;
  });

define(

'rs/utils/BrowserUtil',[],function() {

  "use strict";

	/**
	 * @class BrowserUtil
	 * @description Helper class with convenient methods to handle common browser tasks
	 *
	 */
	var BrowserUtil = {

    /** Standard breakpoints based on bootstrap 4.0 framework **/
    bp:{
      XS:0,
      SM:576,
      MD:768,
      LG:992,
      XL:1200,
      XXL:1500,
      X3L:1900,
      X4L:2000,
      X5L:3000
    },

    computeStyle:function(el, prop, unit) {
    
      if (unit === undefined) unit = "px";
      return (parseFloat(getComputedStyle(el)[prop].replace(unit, "")));
    },

		/**
		 * Apply CSS properties to element
		 * @method css
		 * @param {DOMElement} element
		 * @param {Object} CSS properties
		 *
		 */
		css: function(element, props) {
			for (var key in props) element.style[key] = props[key];
		},

		/*
		 * Detect browser prefix
		 * @method prefix
		 * @return {String} Browser prefix
		 *
		 */
		getPrefix: function() {

			if (!BrowserUtil.pf) {

				//Opera
				if (!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
				
					BrowserUtil.pf = 'Webkit';
					BrowserUtil.browserName = 'Opera';
				} 
				else
				//Firefox
				if (typeof InstallTrigger !== 'undefined') {
				
					BrowserUtil.pf = 'Moz';
					BrowserUtil.browserName = 'Firefox';
				}
				else
				// Safari
				// if (Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
				if (!!window.safari) {

					BrowserUtil.pf = 'Webkit';
					BrowserUtil.browserName = 'Safari';
				}
				else
				//Chrome
				if (!!window.chrome) {
				
					BrowserUtil.pf = 'Webkit';
					BrowserUtil.browserName = 'Chrome';
				}
				//IE
				else
				if (/*@cc_on!@*/false || !!document.documentMode) {

					BrowserUtil.pf = 'ms';
					BrowserUtil.browserName = 'MSIE';
				}
        else
        // Edge
        if (/Edge/.test(navigator.userAgent)) {

					BrowserUtil.pf = 'ms';
					BrowserUtil.browserName = 'MSIE';
				}
        // All fail, default to webkit Safari
        else {
          BrowserUtil.pf = 'Webkit';
          BrowserUtil.browserName = 'Safari';
        }

				if (BrowserUtil.pf === 'Webkit') 
          BrowserUtil.ps = ''; 
        else 
          BrowserUtil.ps = 'px'; //Perspective suffix for Webkit
				if (BrowserUtil.pf !== '') 
          BrowserUtil.csspf = '-' + BrowserUtil.pf.toLowerCase() + '-'; 
        else 
          BrowserUtil.csspf = '';
				console.log(BrowserUtil.pf);
			}

			return BrowserUtil.pf;
		},

    getMouseTouchEvents:function() {

      if (this.isMobile()) 
        return {
          mdown:'touchstart',
          mmove:'touchmove',
          mup:'touchend'
        };
      else 
        return {
          mdown:'mousedown',
          mmove:'mousemove',
          mup:'mouseup'
        };
    },

		/**
		 * Detect Mobile device
		 * @method isMobile
		 * @return Boolean True if agent is a mobile device
		 *
		 */
		isMobile: function() {

			//Not reliable but work ok in touchscreen cases
			if (BrowserUtil.imb === undefined) 
				BrowserUtil.imb = (document.createElement('span').ontouchstart === null);
			return (BrowserUtil.imb);
		},

		/*
		 * Detect capability and go fullscreen
		 * @method goFullScreen
		 *
		 */
		goFullscreen: function(e) {

			var pf = BrowserUtil.isFullscreenSupported();
			if (!pf) return false;
			return (pf === '') ? (e.requestFullScreen()) : (e[pf + 'RequestFullScreen']()); 
		},

		/**
		 * Exit fullscreen
		 * @method exitFullScreen
		 * 
		 */
		exitFullscreen: function(e) {

			var pf = BrowserUtil.isFullscreenSupported();
			if (!pf) return false;
      if (BrowserUtil.isFullscreen())
        return (pf === '') ? (document.cancelFullScreen()) : (document[pf + 'CancelFullScreen']()); 
      else
        return false;
		},

		/**
		 * Add callback on fullscreen event change
		 * @method fullscreenCallback
		 * 
		 */
		fullScreenCallback : function(e, callback, context) {

			var pf = BrowserUtil.isFullscreenSupported();
			if (!pf) return false;
			var eventName = pf + 'fullscreenchange';
			document.addEventListener(eventName, callback);
		},

		/**
		 * @method isFullscreen
		 *
		 */
		isFullscreen : function() {
			
			var pf = BrowserUtil.isFullscreenSupported();
			if (!pf) return false;

			switch (pf) {	

				case '':
					return document.fullScreen;

				case 'webkit':
					return document.webkitIsFullScreen;

				default:
					return document[pf + 'FullScreen'];
			}
		},

		/**
		 * Check if browser supports fullscreen
		 * @method isFullscreenSupported
		 *
		 */
		isFullscreenSupported : function() {

			var pf = BrowserUtil.pf.toLowerCase();
			if (document.cancelFullScreen !== undefined) return ''; else
				if (document[pf + 'CancelFullScreen'] !== undefined) return pf; else return false;
		}
	};

	return BrowserUtil;

});


/**
 * @author  raizensoft.com
 */
define('rs/game/Scroller',[
  'rs/utils/BrowserUtil'
],
  function(BrowserUtil) {

    "use strict";

    var mdown, mup, mmove;

    /**
     * Scroller object for smooth scrolling
     * @class Scroller
     * @constructor
     */
    function Scroller(el) {

      // Mobile or desktop event handlers
      if (BrowserUtil.isMobile()) {

        mdown = 'touchstart';
        mup = 'touchend';
        mmove = 'touchmove';
      }
      else {
        mdown = 'mousedown';
        mup = 'mouseup';
        mmove = 'mousemove';
      }

      this.el = el;
      this.el.style.overflow = 'hidden';
      this.init();
    }

    /**
     * Init component
     * @method init
     */
    Scroller.prototype.init = function() {

      var el = this.el;
      var scroller = this;
      var oY, topY, panelTargetY, clientY;

      function scrollHandler () {

        el.scrollTop += (panelTargetY - el.scrollTop) * 0.075;
        scroller.scrollId = requestAnimationFrame(scrollHandler);
      }

      function mouseDownHandler (e) {

        if (e.touches) {
          clientY = e.touches[0].clientY;
        }
        else {
          clientY = e.clientY;
        }
        oY = clientY;
        topY = panelTargetY = el.scrollTop;
        el.addEventListener(mmove, mouseMoveHandler);
        el.addEventListener(mup, mouseUpHandler);
        window.addEventListener(mmove, mouseMoveHandler);
        window.addEventListener(mup, mouseUpHandler);
        cancelAnimationFrame(scroller.scrollId);
        scroller.scrollId = requestAnimationFrame(scrollHandler);
        el.style.cursor = 'grab';
      }

      function mouseMoveHandler (e) {
        
        //e.preventDefault();

        if (e.changedTouches) {
          clientY = e.changedTouches[0].clientY;
        }
        else {
          clientY = e.clientY;
        }
        var delta = (clientY - oY) * 2.5;
        var range = el.scrollHeight - scroller.el.clientHeight;
        var target = topY - delta;
        if (target > range) target = range;
        if (target < 0) target = 0;
        panelTargetY = target;
        el.style.cursor = 'grabbing';
      }

      function mouseUpHandler (e) {
        
        el.removeEventListener(mmove, mouseMoveHandler);
        el.removeEventListener(mup, mouseUpHandler);
        window.removeEventListener(mmove, mouseMoveHandler);
        window.removeEventListener(mup, mouseUpHandler);
        cancelAnimationFrame(scroller.scrollId);
        el.style.cursor = 'grab';
      }
      el.addEventListener(mdown, mouseDownHandler);
      el.addEventListener('mouseover', function(e) {
        el.style.cursor = 'grab';
      });
    };

    return Scroller;
  });


/**
 * @author  raizensoft.com
 */
define('rs/game/BasePanel',[
],
  function() {

    "use strict";

    /**
     * BasePanel component
     * @class BasePanel
     * @constructor
     */
    function BasePanel(width, height) {

      this.width = width || 300;
      this.height = height || 300;
      this.init();
    }

    /**
     * Init the panel
     * @method init
     */
    BasePanel.prototype.init = function() {

      // Overlay
      var ol = this.ol = document.createElement('div');
      ol.className = 'rs-game-overlay';

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-game-panel';
      el.style.width = this.width + 'px';
      el.style.height = this.height + 'px';

      // Close button
      var c = this.closeBtn = document.createElement('span');
      c.className = 'rs-closebtn';
      c.innerHTML = '&times';
      el.appendChild(c);
      c.addEventListener('click', this.hide.bind(this));

      anime({
        targets:this.el,
        translateX:'-50%',
        translateY:'-50%',
        duration:0,
        scale:1});
    };

    /**
     * Show panel in center document
     * @method show
     */
    BasePanel.prototype.show = function() {

      document.body.appendChild(this.ol);
      document.body.appendChild(this.el);
      anime.remove(this.el);
      anime({
        targets:this.el,
        opacity:[0, 1],
        duration:800,
        easing:'easeOutQuint'
      });
    };

    /**
     * Hide current panel
     * @method hide
     */
    BasePanel.prototype.hide = function() {

      if (document.body.contains(this.ol))
        document.body.removeChild(this.ol);
      if (document.body.contains(this.el))
        document.body.removeChild(this.el);
    };

    /**
     * Resize the panel
     * @method resize
     */
    BasePanel.prototype.resize = function(w, h) {

      // body...
    };

    return BasePanel;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/ui/HelpPanel',[
  'rs/game/Scroller',
  'rs/game/BasePanel'
],
  function(Scroller, BasePanel) {

    "use strict";

    HelpPanel.prototype = Object.create(BasePanel.prototype);
    HelpPanel.prototype.constructor = HelpPanel;
    
    var CONTENT_PATH = 'assets/text/helpcontent.html';

    /**
     * Help panel class
     * @class HelpPanel
     * @constructor
     */
    function HelpPanel(callback) {

      this.callback = callback;
      BasePanel.prototype.constructor.call(this);
    }

    /**
     * Init panel
     * @method init
     */
    HelpPanel.prototype.init = function() {

      BasePanel.prototype.init.call(this);
      var el = this.el;
      el.classList.add('rs-pru3d-helppanel');
      el.style.width = el.style.height = '90%';

      // Playing instruction
      var c = this.container = document.createElement('div');
      c.className = 'rs-helpcontainer';
      el.appendChild(c);

      // Setup scroller
      this.scroller = new Scroller(this.container);

      // Setup content
      var hp = this;
      var req = new XMLHttpRequest();
      req.addEventListener("load", function(e) {
        var result = this.responseText;
        c.innerHTML = result;
      });
      req.open("GET", CONTENT_PATH);
      req.send();
    };

    /**
     * Hide the panel
     * @method hide
     */
    HelpPanel.prototype.hide = function() {

      BasePanel.prototype.hide.call(this);
      if (this.callback)
        this.callback.call(this);
    };

    return HelpPanel;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/ui/CreditPanel',[
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


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/screen/HomeScreen',[
  'rs/pru3d/ui/HomeScreenHeader',
  'rs/pru3d/ui/HomeScreenMenu',
  'rs/pru3d/ui/HelpPanel',
  'rs/pru3d/ui/CreditPanel'
  ],
  function(
    HomeScreenHeader,
    HomeScreenMenu, 
    HelpPanel, 
    CreditPanel) {

    "use strict";

    var SHOW_DELAY = 1500;

    /**
     * Game home screen
     * @class HomeScreen
     * @constructor
     */
    function HomeScreen(pru3d) {

      this.pru3d = pru3d;
      this.loaded = false;
      this.config = pru3d.config;
      this.init();
    }

    /**
     * Setup home screen components
     * @method init
     */
    HomeScreen.prototype.init = function() {

      var hs = this;
      var el = this.el = document.createElement('div');
      el.className = 'rs-hscreen';
      el.style.width = el.style.height = '100%';
      el.style.display = 'none';

      // Header 
      this.header = new HomeScreenHeader(this);

      // Menu
      this.menu = new HomeScreenMenu(this);
      
      // Panel
      this.hpanel = new HelpPanel();

      // Credit
      this.cpanel = new CreditPanel(this.pru3d);
    };

    /**
     * Load assets
     * @method load
     */
    HomeScreen.prototype.load = function() {

      this.el.style.display = 'block';
      this.el.appendChild(this.header.el);
      this.header.center();

      // AssetManager callbacks
      var am = this.pru3d.assetManager;
      var hs = this;
      var header = this.header;
      var menu = this.menu;

      am.onLoad = function() {

        setTimeout(function() {

          am.showDelay = true;

          // Move header to app top position
          header.moveTop();

          // Show menu
          hs.el.appendChild(menu.el);
          menu.show();

          // Play background music
          if (am.bgSound) am.bgSound.play();

        }, SHOW_DELAY);
      };

      am.onProgress = function(url, loaded, total) {
        hs.header.setProgress(loaded/total * 100);
      }
      this.pru3d.assetManager.load();
    };

    /**
     * Perform transition in
     * @method transitionIn
     */
    HomeScreen.prototype.transitionIn = function() {

      this.el.style.display = 'block';
      anime({
        targets:this.el,
        translateY:0,
        easing:'easeOutQuint',
        opacity:1,
        duration:1200
      });
    };

    /**
     * Perform transition out
     * @method transitionOut
     */
    HomeScreen.prototype.transitionOut = function() {

      var el = this.el;
      anime({
        targets:this.el,
        translateY:-400,
        easing:'easeOutQuint',
        opacity:0,
        duration:1200,
        complete:function() {
          el.style.display = 'none';
        }
      });
    };

    /**
     * Show screen
     * @method show
     */
    HomeScreen.prototype.show = function() {

      this.pru3d.root.appendChild(this.el);
      if (!this.pru3d.assetManager.loaded) {
        this.load();
        return;
      }
      this.transitionIn();
    };

    /**
     * Hide screen
     * @method hide
     */
    HomeScreen.prototype.hide = function() {

      this.pru3d.root.removeChild(this.el);
      this.transitionOut();
    };

    /**
     * Start new game
     * @method startNewGame
     */
    HomeScreen.prototype.startNewGame = function() {
      this.pru3d.setGameScreen();
    };

    /**
     * Show help panel
     * @method showHelp
     */
    HomeScreen.prototype.showHelp = function() {
      this.hpanel.show();
    };

    /**
     * Show credit panel
     * @method showCredit
     */
    HomeScreen.prototype.showCredit = function() {
      this.cpanel.show();
    };

    /**
     * Resize screen handler
     * @method resize
     */
    HomeScreen.prototype.resize = function(rw, rh) {

    };

    return HomeScreen;
  });


/**
 * @author  raizensoft.com
 */
define('rs/game/ImagePanel',[
  'rs/game/BasePanel'
],
  function(BasePanel) {

    "use strict";

    var SCALE = 0.85;

    ImagePanel.prototype = Object.create(BasePanel.prototype);
    ImagePanel.prototype.constructor = ImagePanel; 

    /**
     * A panel showing image
     * @class ImagePanel
     * @constructor
     */
    function ImagePanel(callback) {

      this.callback = callback;
      BasePanel.prototype.constructor.call(this);
    }

    /**
     * Init image panel
     * @method init
     */
    ImagePanel.prototype.init = function() {

      BasePanel.prototype.init.call(this);
      this.el.classList.add('rs-image-panel');

      var img = this.img = document.createElement('img');
      img.draggable = false;
      this.el.appendChild(this.img);
      this.el.style.width = this.el.style.height = 'auto';

      var ip = this;
      function closePanel (e) {
        
        if (ip.callback) ip.callback.call(ip);
        ip.hide();
      }

      // Config event
      this.closeBtn.addEventListener('click', closePanel);
      img.addEventListener('click', closePanel);

      // Constraint img dimension
      img.onload = function(e) {

        var r = img.naturalWidth / img.naturalHeight;
        if (img.naturalHeight >= window.innerHeight) {

          img.height = window.innerHeight * SCALE;
          img.width = img.height * r;
        }
        if (img.naturalWidth >= window.innerWidth) {

          img.width = window.innerWidth * SCALE;
          img.height = img.width / r;
        }
      };
    };

    /**
     * Show an image with input src
     * @method show
     */
    ImagePanel.prototype.show = function(src) {

      this.img.src = src;
      BasePanel.prototype.show.call(this);
    };

    /**
     * Show an image from asset manager
     */
    ImagePanel.prototype.showAsset = function(imgAsset) {
      
      this.img.src = imgAsset.src;
      BasePanel.prototype.show.call(this);
    };

    return ImagePanel;
  });



/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/ReadyPanel',[],function() {

    "use strict";

    const COUNT_NUMBER = 3;

    /**
     * ReadyPanel
     * @class ReadyPanel
     * @constructor
     */
    function ReadyPanel(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Init panel
     * @method init
     */
    ReadyPanel.prototype.init = function() {

      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-readypanel';
      el.innerHTML = 'READY';
    };

    /**
     * Show the panel
     * @method show
     */
    ReadyPanel.prototype.show = function() {

      this.el.style.display = 'block';
      document.body.appendChild(this.el);
      anime.remove(this.el);
      this.el.style.opacity = 1;
      anime({
        targets:this.el,
        opacity:0.1,
        direction:'alternate',
        loop:true,
        duration:300,
        easing:'easeOutQuad'
      });
    };

    /**
     * Hide the panel
     * @method hide
     */
    ReadyPanel.prototype.hide = function() {

      this.el.style.display = 'none';
      anime.remove(this.el);
    };

    /**
     * Start counting down
     * @method countDOwn
     */
    ReadyPanel.prototype.countDown = function(callback) {

      var count = COUNT_NUMBER;
      var rp = this;

      this.show();

      function doCount () {
        
        clearTimeout(rp.countId);
        if (count-- > 0) {
          rp.countId = setTimeout(doCount, 1000);
        }
        else {
          rp.hide();
          callback.call(this);
        }
      }
      doCount();
    };

    return ReadyPanel;

  });


/**
 * @author  raizensoft.com
 */
define('rs/game/IconButton',[
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


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/ui/GameButton',[
  'rs/game/IconButton'
],
  function(IconButton) {

    "use strict";

    GameButton.prototype = Object.create(IconButton.prototype);
    GameButton.prototype.constructor = GameButton;

    /**
     * GameButton component
     * @class GameButton
     * @constructor
     */
    function GameButton(className, clickCallback) {
      this.init(className, clickCallback);
    }

    /**
     * Init
     * @method init
     */
    GameButton.prototype.init = function(className, clickCallback) {

      IconButton.prototype.init.call(this, className, clickCallback);
      this.el.classList.add('rs-pru3d-mainbutton');
    };

    /**
     * Add a new class name
     * @method addClass
     */
    GameButton.prototype.addClass = function(className) {
      this.el.classList.add(className);
    };

    /**
     * Remove a class name
     * @method removeClass
     */
    GameButton.prototype.removeClass = function(className) {
      this.el.classList.remove(className);
    };

    return GameButton;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/ui/GameOverPanel',[
  'rs/game/BasePanel',
  'rs/pru3d/ui/GameButton'
],
  function(BasePanel, GameButton) {

    "use strict";

    var SCALE = 0.85;

    GameOverPanel.prototype = Object.create(BasePanel.prototype);
    GameOverPanel.prototype.constructor = GameOverPanel; 

    /**
     * A panel showing image
     * @class GameOverPanel
     * @constructor
     */
    function GameOverPanel(gs) {

      this.gs = gs;
      this.am = gs.pru3d.assetManager;
      BasePanel.prototype.constructor.call(this);
    }

    /**
     * Init image panel
     * @method init
     */
    GameOverPanel.prototype.init = function() {

      BasePanel.prototype.init.call(this);
      var el = this.el;
      el.classList.add('rs-trophy-panel');
      el.style.width = el.style.height = '90%';

      // Title
      this.title = document.createElement('h1');
      this.title.className = 'trophy-level-title';
      this.title.innerHTML = 'Level Up';

      // Meta info container
      var met = this.meta = document.createElement('div');
      met.className = 'meta-container';
      el.appendChild(met);

      var panelText = this.panelText = document.createElement('span');
      panelText.innerHTML = "BEST SCORE: 100";
      met.appendChild(panelText);

      // Trophy element
      var tc = document.createElement('div');
      tc.className = 'trophy-container';

      var trophy = document.createElement('img');
      trophy.src = 'assets/graphics/sad_pirate.png';
      trophy.draggable = false;
      tc.appendChild(trophy);
      el.appendChild(tc);

      var bc = this.btnContainer = document.createElement('div');
      bc.className = 'trophy-button-container';
      el.appendChild(bc);

      // Replay button
      this.replayBtn = new GameButton('icon-undo', this.doReplay.bind(this));
      bc.appendChild(this.replayBtn.el);

      // Hide close button
      this.closeBtn.style.display = 'none';
    };

    /**
     * Show panel
     * @method show
     */
    GameOverPanel.prototype.show = function() {

      document.body.appendChild(this.ol);
      document.body.appendChild(this.el);
      const scale = 1;
      anime.remove(this.el);
      anime({
        targets:this.el,
        opacity:[0, 1],
        translateX:'-50%',
        translateY:'-50%',
        scale:[0, scale],
        duration:1000,
        easing:'easeOutQuint'
      });
      this.setScore(this.gs.getBestScore());
    };

    /**
     * Set best score
     */
    GameOverPanel.prototype.setScore = function(score) {
      this.panelText.innerHTML = 'BEST SCORE: ' + score;
    };

    /**
     * Hide panel
     * @method hide
     */
    GameOverPanel.prototype.hide = function() {
      BasePanel.prototype.hide.call(this);
    };

    /**
     * Replay current level
     * @method doReplay
     */
    GameOverPanel.prototype.doReplay = function() {

      this.am.btnClick.play();
      this.gs.replayLevel();
    };

    return GameOverPanel;
  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/ui/GameScreenButtonBar',[
  'rs/pru3d/ui/GameButton'
],
  function(GameButton) {

    "use strict";

    /**
     * GameScreenButtonBar class
     * @class GameScreenButtonBar
     * @constructor
     */
    function GameScreenButtonBar(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Init the buttons
     * @method init
     */
    GameScreenButtonBar.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-gamebuttonbar';

      var am = this.gs.pru3d.assetManager;

      // Game level button
      this.levelBtn = new GameButton('icon-stack', this.showGameLevels.bind(this));
      this.levelBtn.addClass('rs-pru3d-mainbutton-extra');
      //el.appendChild(this.levelBtn.el);

      // Info Button
      this.infoBtn = new GameButton('icon-info', this.showHelp.bind(this));
      el.appendChild(this.infoBtn.el);

      // Home Button
      this.homeBtn = new GameButton('icon-home', this.showHome.bind(this));
      el.appendChild(this.homeBtn.el);

      // Sound control button
      this.soundBtn = new GameButton('icon-sound-on', this.toggleSound.bind(this));
      this.soundBtn.isOn = true;
      el.appendChild(this.soundBtn.el);
    };

    /**
     * Show button bar
     * @method show
     */
    GameScreenButtonBar.prototype.show = function() {

      anime({
        targets:this.el,
        bottom:15,
        easing:'easeOutQuint',
        duration:800
      });
    };

    /**
     * Hide button bar
     * @method hide
     */
    GameScreenButtonBar.prototype.hide = function() {

      anime({
        targets:this.el,
        bottom:-50,
        easing:'easeOutQuint',
        duration:800
      });
    };

    /**
     * Show levels selector
     * @method showGameLevels
     */
    GameScreenButtonBar.prototype.showGameLevels = function() {

      if (this.gs.game3d.container.isShuffling) return;
      var am = this.gs.pru3d.assetManager;
      am.btnClick.play();
      this.gs.levelPanel.show();
      this.gs.game3d.setPauseState();
    };

    /**
     * Show home page
     * @method showHome
     */
    GameScreenButtonBar.prototype.showHome = function(e) {

      var am = this.gs.pru3d.assetManager;
      am.btnClick.play();
      this.gs.pru3d.setHomeScreen();
    };

    /**
     * Show help panel
     * @method showHelp
     */
    GameScreenButtonBar.prototype.showHelp = function(e) {

      var am = this.gs.pru3d.assetManager;
      am.btnClick.play();
      this.gs.hpanel.show();
      this.gs.game3d.setPauseState();
    };

    /**
     * Toggle sound on/off
     * @method toggleSound
     */
    GameScreenButtonBar.prototype.toggleSound = function() {

      var am = this.gs.pru3d.assetManager;
      var btn = this.soundBtn;
      btn.isOn = !this.soundBtn.isOn;
      if (btn.isOn) {
        btn.removeClass('icon-sound-off');
        btn.addClass('icon-sound-on');
        am.btnClick.play();
      }
      else {
        btn.removeClass('icon-sound-on');
        btn.addClass('icon-sound-off');
      }
      am.toggleSound();
    };

    /**
     * Return client width and height
     * @method getClientSize
     */
    GameScreenButtonBar.prototype.getClientSize = function() {
      return [this.el.clientWidth, this.el.clientHeight];
    };

    return GameScreenButtonBar;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/ui/GameScreenWonBar',[
  'rs/pru3d/ui/GameButton'
],
  function(GameButton) {

    "use strict";

    /**
     * GameScreenWonBar
     * @class GameScreenWonBar
     * @constructor
     */
    function GameScreenWonBar(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Init won bar components
     * @method init
     */
    GameScreenWonBar.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-gamewonbar';
      el.style.bottom = '-85px';

      // Status
      this.status = document.createElement('h1');
      this.status.className = 'trophy-level-title';
      this.status.innerHTML = 'DRAW';

      // Next icon
      this.nextBtn = new GameButton('icon-nextlevel', this.doNext.bind(this));
      this.nextBtn.addClass('rs-pru3d-mainbutton-extra');
      el.appendChild(this.nextBtn.el);
    };

    /**
     * Load next level
     * @method doNext
     */
    GameScreenWonBar.prototype.doNext = function() {

      var am = this.gs.pru3d.assetManager;
      am.btnClick.play();
      this.gs.nextLevel();
    };

    /**
     * Show the bar
     * @method show
     */
    GameScreenWonBar.prototype.show = function(status) {

      anime({
        targets:this.el,
        bottom:12,
        easing:'easeOutQuint',
        duration:800
      });
      this.setStatus(status);
      document.body.appendChild(this.status);
    };

   /**
     * Set won/lose/draw status
     * @method setStatus
     */
    GameScreenWonBar.prototype.setStatus = function(status) {
      this.status.innerHTML = status;
    };
 
    /**
     * Hide the bar
     * @method hide
     */
    GameScreenWonBar.prototype.hide = function(status) {

      anime({
        targets:this.el,
        bottom:-85,
        easing:'easeOutQuint',
        duration:800
      });
      if (document.body.contains(this.status))
        document.body.removeChild(this.status);
    };

    return GameScreenWonBar;
  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/ui/GameScreenLoseBar',[
  'rs/pru3d/ui/GameButton'
],
  function(GameButton) {

    "use strict";

    /**
     * GameScreenLoseBar
     * @class GameScreenLoseBar
     * @constructor
     */
    function GameScreenLoseBar(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Init won bar components
     * @method init
     */
    GameScreenLoseBar.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-gamewonbar';
      el.style.bottom = '-85px';

      // Replay button
      this.replayBtn = new GameButton('icon-undo', this.doReplay.bind(this));
      this.replayBtn.addClass('rs-pru3d-mainbutton');
      el.appendChild(this.replayBtn.el);

      // Status
      this.status = document.createElement('h1');
      this.status.className = 'trophy-level-title';
      this.status.innerHTML = 'DRAW';
    };

    /**
     * Replay current level
     * @method doReplay
     */
    GameScreenLoseBar.prototype.doReplay = function() {

      var am = this.gs.pru3d.assetManager;
      am.btnClick.play();
      this.gs.replayLevel();
    };

    /**
     * Show the bar
     * @method show
     */
    GameScreenLoseBar.prototype.show = function(status) {

      anime({
        targets:this.el,
        bottom:12,
        easing:'easeOutQuint',
        duration:800
      });
      this.setStatus(status);
      document.body.appendChild(this.status);
    };

    /**
     * Hide the bar
     * @method hide
     */
    GameScreenLoseBar.prototype.hide = function() {

      anime({
        targets:this.el,
        bottom:-85,
        easing:'easeOutQuint',
        duration:800
      });
      if (document.body.contains(this.status))
        document.body.removeChild(this.status);
    };

   /**
     * Set won/lose/draw status
     * @method setStatus
     */
    GameScreenLoseBar.prototype.setStatus = function(status) {
      this.status.innerHTML = status;
    };

    return GameScreenLoseBar;
  });


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/ui/HeartBar',[],function() {

    "use strict";

    let MAX_HEALTH = 3;
    const FULL_HEART = '#f24437';
    const EMPTY_HEART = '#333333';

    /**
     * HeartBar displays current health point
     * @class HeartBar
     * @constructor
     */
    function HeartBar(gs) {

      this.gs = gs;
      MAX_HEALTH = gs.pru3d.defaultOptions.maxHealth;
      this.init();
    }

    /**
     * Init heart component
     * @method init
     */
    HeartBar.prototype.init = function() {
      
      var el = this.el = document.createElement('div');
      el.className = 'rs-heartbar';

      // Heart list
      var hl = this.hlist = [];
      for (var i = 0; i < MAX_HEALTH; i++) {

        var h = document.createElement('span');
        h.className = 'rs-heart-item icon-heart';
        h.style.color = FULL_HEART;
        el.appendChild(h);
        hl.push(h);
      }
      this.reset();
    };

    /**
     * Set health bar value
     * @method setValue
     */
    HeartBar.prototype.setValue = function(val) {
      
      this.value = val;
      this.setHeartColor(MAX_HEALTH, EMPTY_HEART);
      this.setHeartColor(val, FULL_HEART);
    };

    /**
     * Set heart item color
     * @method setHeartColor
     */
    HeartBar.prototype.setHeartColor = function(total, color) {
      
      for (var i = 0; i < total; i++) {

        var h = this.hlist[i];
        h.style.color = color;
      }
    };

    /**
     * Decrease current health
     */
    HeartBar.prototype.decreaseHealth = function() {
      
      this.value--;
      if (this.value <= 0) return true;
      this.setValue(this.value);
      return false;
    };

    /**
     * Reset heart bar
     * @method reset
     */
    HeartBar.prototype.reset = function() {

      this.value = MAX_HEALTH;
      this.setValue(MAX_HEALTH, FULL_HEART);
    };

    return HeartBar;

  });


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/ui/HeaderLevelButton',[],function() {

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


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/ui/GameScreenHeader',[
  'rs/pru3d/ui/HeartBar',
  'rs/pru3d/ui/HeaderLevelButton'],

  function(
    HeartBar,
    HeaderLevelButton) {

    "use strict";

    var INTERVAL = 200;

    /**
     * GameScreenHeader component
     * @class GameScreenHeader
     * @constructor
     */
    function GameScreenHeader(gs) {

      this.gs = gs;
      this.init();
    }

    /**
     * Build header components
     * @method init
     */
    GameScreenHeader.prototype.init = function() {

      // Root container
      var el = this.el = document.createElement('div');
      el.className = 'rs-pru3d-gameheader';

      // Level button
      this.levelBtn = new HeaderLevelButton(this);
      el.appendChild(this.levelBtn.el);

      this.hbar = new HeartBar(this.gs);
      el.appendChild(this.hbar.el);
    };

    /**
     * Return client size dimension
     * @method getClientSize
     */
    GameScreenHeader.prototype.getClientSize = function() {
      return [this.el.clientWidth, this.el.clientHeight];
    };

    /**
     * Show the header
     * @method show
     */
    GameScreenHeader.prototype.show = function() {

      anime({
        targets:this.el,
        top:4,
        easing:'easeOutQuint',
        duration:800
      });
    };

    /**
     * Hide the header
     * @method hide
     */
    GameScreenHeader.prototype.hide = function() {

      anime({
        targets:this.el,
        top:-80,
        easing:'easeOutQuint',
        duration:800
      });
    };

    /**
     * Count point down
     * @method countDown
     */
    GameScreenHeader.prototype.countDown = function(callback) {

      return;
      var it = this;

      function doCount () {

        clearTimeout(it.countId);
        if (as.currentValue == 0 || asg.currentValue == 0) {
          if (callback) callback.call(it, as.currentValue);
        }
        else
        it.countId = setTimeout(doCount, INTERVAL);
      }
      doCount();
    };

    return GameScreenHeader;

  });



/**
 * @author  raizensoft.com
 */
define('rs/three/BaseApp',[],

function() {

  "use strict";

  /**
   * Base class for simple 3d gallery
   * @class BaseApp
   * @constructor
   */
  function BaseApp(width, height, fov) {

    this.width = width || 1000;
    this.height = height || 600;
    this.fov = fov || 60; //(hov = 90)
    this.init();
  }

  /**
   * Init components
   * @method init
   */
  BaseApp.prototype.init = function() {

    // Default scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera( this.fov, this.width / this.height, 1, 50000);
    
    // Renderer
    var r = this.renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
    r.setSize(this.width, this.height);
    r.setPixelRatio(window.devicePixelRatio);
    r.outputEncoding = THREE.sRGBEncoding;

    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Render element
    this.el = r.domElement;

    // Raycasting setup
    this.raycaster = new THREE.Raycaster();
  };
  
  /**
   * Render objects
   * @method render
   */
  BaseApp.prototype._renderRequest = function(e) {

    this.renderer.render(this.scene, this.camera);
    this.rId  = requestAnimationFrame(this._renderRequest.bind(this));
  };

  /**
   * Start rendering
   * @method startRender
   */
  BaseApp.prototype.startRendering = function() {
    this.stopRendering();
    this.rId = requestAnimationFrame(this._renderRequest.bind(this));
  };

  /**
   * Stop rendering
   * @method stopRender
   */
  BaseApp.prototype.stopRendering = function() {
    cancelAnimationFrame(this.rId);
  };

  /**
   * Resize handling
   * @method resizeHandler
   */
  BaseApp.prototype.resizeHandler = function() {

    // Recalculate tan of half vfov
    this.thfov = Math.tan(this.camera.fov * Math.PI / 360);
  };

  /**
   * Set camera position to match projection dimension
   * @method setCameraMatchProjection
   */
  BaseApp.prototype.setCameraMatchProjection = function(scaleFactor) {

    scaleFactor = scaleFactor || 1;
    var cam = this.camera;
    var z = 0.5 * this.height / Math.tan(cam.fov * Math.PI / 360);
    cam.position.x = cam.position.y = 0;
    cam.position.z = z / scaleFactor;
    cam.lookAt(new THREE.Vector3(0, 0, 0));
  };

  /**
   * Get scaleFitRatio
   * @method getScaleFitRatio
   */
  BaseApp.prototype._getScaleFitRatio = function(w, h, k) {

    // Scale w and h to match app dimension
    k = k || 0.75;
    
    var r = w / h;
    var rt;
    if (this.width / r > this.height) {
      rt = this.height * k / h;
    }
    else {
      rt = this.width  * k/ w;
    }
    return rt;
  };

  /**
   * Get position z to fit the scaleToFit ratio
   * @method getScaleFitPositionZ
   */
  BaseApp.prototype.getScaleFitPositionZ = function(w, h, k) {

    this.setCameraMatchProjection();

    var rt = this._getScaleFitRatio(w, h, k);
    var camZ = this.camera.position.z;
    var zt = camZ - camZ / rt;
    return zt;
  };

  return BaseApp;

});

define(
	
'rs/utils/ObjectUtil',[],function() {

  "use strict";

	/**
	 * @class ObjectUtil
	 * @description Helper class with convenient method to handle common object functionalities
	 *
	 */
	var ObjectUtil = {
		
		/**
		 * Perform deep merging. Target object get updated with properties from source object.
		 * @method merge
		 * @param {Object} source Source object
		 * @param {Target} target Target object
		 *
		 */
		merge : function(source, target, overwrite) {

			for (var prop in source) {
				
				if (Object.prototype.toString.call(source[prop]) === "[object Object]") {

					if (target[prop] === undefined) target[prop] = {};
					this.merge(source[prop], target[prop]);
				} else
				{
					//if (target[prop] === undefined) target[prop] = source[prop];
					target[prop] = source[prop]; //TODO test
				}
			}
			
			return target;
		},


		clone: function(object, deep) {

			var c = {};
			ObjectUtil.merge(object, c, deep);
			return c;
		}
	};

	return ObjectUtil;
});


/**
 * @author  raizensoft.com
 */
define('rs/game3d/Firework3DState',[],function(){

  "use strict";

  return {
    EXPLODED:0,
    FALLING:1,
    EXPIRED:2
  }
});


/**
 * @author  raizensoft.com
 */
define('rs/game3d/Firework3D',[
  'rs/utils/ObjectUtil',
  'rs/game3d/Firework3DState'
],
  function(ObjectUtil, Firework3DState) {

    "use strict";

    var EASING = 0.1;
    var colors = [0xffffff, 0xffff00, 0xdaff00, 0xff00a4, 0xf3ff00 ]

    Firework3D.prototype = Object.create(THREE.Points.prototype);
    Firework3D.prototype.constructor = Firework3D;

    /**
     * FireWork in 3D using three.js
     * @class Firework3D
     * @constructor
     */
    function Firework3D(config) {

      // Init state and configurations
      this.config = {
        launchHeight:300,
        sphereRadius:200,
        color:0xffcc00,
        size:72,
        numParticles:24
      };
      config = config || {};
      ObjectUtil.merge(config, this.config);
      this.state = Firework3DState.EXPLODED;
      this.init();
    }

    /**
     * Init Firework3D
     * @method init
     */
    Firework3D.prototype.init = function() {

      THREE.Points.prototype.constructor.call(this);

      var c = this.config;

      // Geometry
      this.geometry = new THREE.Geometry();
      var v = this.geometry.vertices;
      var minRadius = 50;

      for (var i = 0; i < c.numParticles; i++) {

        var p = new THREE.Vector3();
        p.tX = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        p.tY = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        p.tZ = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        v.push(p);
      }
      this.geometry.verticesNeedUpdate = true;

      // Setup material
      var pickColor = colors[Math.floor(Math.random() * colors.length)];
      this.material = new THREE.PointsMaterial({
        size: c.size,
        color: pickColor,
        opacity: 1,
        transparent: true,
        blending:THREE.AdditiveBlending,
        depthTest: false,
        map:c.map
      });
      this.material.needsUpdate = true;
    };

    /**
     * Set region
     * @method setRegion
     */
    Firework3D.prototype.setRegion = function(regionWidth, regionHeight) {
      this.regionWidth = regionWidth;
      this.regionHeight = regionHeight;
    };

    /**
     * Update firework state
     * @method update
     */
    Firework3D.prototype.update = function(delta) {

      var v = this.geometry.vertices;
      if (this.state == Firework3DState.EXPLODED) {

        for (var i = 0; i < v.length; i++) {
          var p = v[i];
          p.x += (p.tX - p.x) * EASING;
          p.y += (p.tY - p.y) * EASING;
          p.z += (p.tZ - p.z) * EASING;
        }
        if (Math.abs(p.tX - p.x) < 5) {
          this.state = Firework3DState.FALLING;
        }
      }
      else {
        var gravity = -80 * delta;
        for (var i = 0; i < v.length; i++) {
          var p = v[i];
          p.vy += gravity;
          p.y += p.vy;
        }
        this.material.opacity += (0 - this.material.opacity) * 0.025;
        if (this.material.opacity <= 0.05) {
          this.reset();
        }
      }
      this.geometry.verticesNeedUpdate = true;
    }

    /**
     * Reset the firework state
     * @method reset
     */
    Firework3D.prototype.reset = function() {

      if (this.regionWidth) {

        this.position.x = Math.random() * this.regionWidth - this.regionWidth * 0.5;
        var hlh = this.regionHeight - this.config.launchHeight;
        this.position.y = Math.random() * hlh - hlh * 0.5;
      };
      this.state = Firework3DState.EXPLODED;
      this.material.opacity = 1;
      this.material.color.set(colors[Math.floor(Math.random() * colors.length)]);
      this.rotation.z = 0;

      var v = this.geometry.vertices;
      var c = this.config;
      var minRadius = 50;
      for (var i = 0; i < v.length; i++) {
        var p = v[i];
        p.x = p.y = p.z = p.vy = 0;
        p.tX = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        p.tY = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
        p.tZ = 2 * Math.random() * c.sphereRadius - c.sphereRadius + minRadius;
      };
      this.geometry.verticesNeedUpdate = true;
      this.material.needsUpdate = true;
      if (c.callback) c.callback.call(this);
    };

    return Firework3D;

  });



/**
 * @author  raizensoft.com
 */
define('rs/game3d/Firework3DSet',[
  'rs/utils/ObjectUtil',
  'rs/game3d/Firework3D',
  'rs/game3d/Firework3DState'
],
  function(ObjectUtil, Firework3D, Firework3DState) {

    "use strict";

    Firework3DSet.prototype = Object.create(THREE.Group.prototype);
    Firework3DSet.prototype.constructor = Firework3DSet;

    /**
     * Collection of Firework3D object
     * @class Firework3DSet
     * @constructor
     */
    function Firework3DSet(g3d, config) {

      this.g3d = g3d;
      this.config = {
        numFireworks:3,
        interval:500
      };
      config = config || {};
      ObjectUtil.merge(config, this.config);
      this.init();
    }

    /**
     * Init firework collection
     * @method init
     */
    Firework3DSet.prototype.init = function() {

      THREE.Group.prototype.constructor.call(this);

      // Create firework objects
      var c = this.config;
      var tex = this.g3d.gs.pru3d.assetManager.fwTexture;
      for (var i = 0; i < c.numFireworks; i++) {
        var fw = new Firework3D({
          map:tex,
          callback:c.callback
        });
        this.add(fw);
      }
    };

    /**
     * Update the set
     * @method update
     */
    Firework3DSet.prototype.update = function(delta) {

      for (var i = 0; i < this.children.length; i++) {
        var fw = this.children[i];
        fw.update(delta);
      }

    };

    /**
     * Change fireworks region
     * @method resize
     */
    Firework3DSet.prototype.changeRegion = function(width, height) {

      this.children.forEach(function(it) {
        it.setRegion(width, height);
      });
    };

    /**
     * Reset all firework objects
     * @method reset
     */
    Firework3DSet.prototype.reset = function() {

      this.children.forEach(function(it) {
        it.reset();
      });
    };

    return Firework3DSet;

  });


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/CoinCounter',[],function() {

    "use strict";

    /**
     * Coin counter
     * @class CoinCounter
     * @constructor
     */
    function CoinCounter() {
      this.init();
    }

    /**
     * Init component
     * @method init
     */
    CoinCounter.prototype.init = function() {

      const el = this.el = document.createElement('div');
      el.className = 'coin-counter';
      document.body.appendChild(el);
      this.coin = 0;
    };

    /**
     * Show the counter
     * @method show
     */
    CoinCounter.prototype.show = function(x, y, val) {

      this.coin += val;

      this.el.innerHTML = this.coin;

      let s = this.el.style;
      s.display = 'block';
      s.top = y + 'px';
      s.left = x + 'px';
      if (val > 0) {
        s.color = '#b2d235';
      }
      else
        s.color = '#ec008c';

      const cc = this;

      anime({
        targets:this.el,
        top:y - 500,
        opacity:[1, 0],
        easing:'easeOutQuad',
        duration:2400,
        complete:function() {
          cc.hide();
        }
      });
    };

    /**
     * Hide the counter
     * @method hide
     */
    CoinCounter.prototype.hide = function() {
      this.el.style.display = 'none';
    };

    /**
     * Reset
     * @method reset
     */
    CoinCounter.prototype.reset = function() {
      this.coin = 0;
    };

    return CoinCounter;

  });


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/SparkAnimation',[],function() {

    "use strict";

    const FPS = 45;
    const TOTAL_FRAMES = 12;

    SparkAnimation.prototype = Object.create(THREE.Mesh.prototype);
    SparkAnimation.prototype.constructor = SparkAnimation; 

    /**
     * SparkAnimation
     * @class SparkAnimation
     * @constructor
     */
    function SparkAnimation(pb) {

      this.pb = pb;
      this.am = pb.am;
      this.init();
    }

    /**
     * Init spark animation
     */
    SparkAnimation.prototype.init = function() {

      THREE.Mesh.prototype.constructor.call(this);

      const am = this.am;
      this.fdata = [];
      this.flist = [];
      const frames = am.sparkData.frames;

      let iw = am.sparkTex.image.width, ih = am.sparkTex.image.height;
      for (let k in frames) {

        const f = frames[k].frame;
        const t = am.sparkTex.clone();
        //console.log(f);

        this.fdata[k] = {

          repeat:[f.w / iw, f.h / ih],
          offsetX: ((f.x) / iw),
          offsetY: 1 - (f.h / ih) - (f.y / ih)
        };

        t.repeat.set(f.w / iw, f.h / ih);
        t.offset.x =  ((f.x) / iw);
        t.offset.y = 1 - (f.h / ih) - (f.y / ih);
        this.flist[k] = t;
      }

      this.geometry = new THREE.PlaneBufferGeometry(20, 40);
      this.material = new THREE.MeshBasicMaterial({
        depthTest:false, 
        blending:THREE.AdditiveBlending,
        transparent:true, 
        map:am.sparkTex});

      this.reset();
    };

    /**
     * Update animation
     */
    SparkAnimation.prototype.update = function(delta) {

      if (!this.visible) return;
      const sa = this.pb.pirate;
      this.position.z = sa.position.z + 2;
      this.position.x = sa.position.x;
      this.etime += delta;
      const currentFrame = Math.floor(this.etime * FPS) % TOTAL_FRAMES;
      //console.log(currentFrame);
      
      const fdata = this.fdata[currentFrame];
      this.material.map.repeat.set(fdata.repeat[0], fdata.repeat[1]);
      this.material.map.offset.x = fdata.offsetX;
      this.material.map.offset.y = fdata.offsetY;
    };

    /**
     * Reset animation
     */
    SparkAnimation.prototype.reset = function() {

      this.etime = 0;
      this.visible = false;
    };

    /**
     * Show spark animation
     */
    SparkAnimation.prototype.show = function() {
      
      this.visible = true;
      const sanim = this;

      clearTimeout(this.showId);
      this.showId = setTimeout(function() {
        sanim.visible = false;
      }, 400);
    };

    return SparkAnimation;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/entity/Stars',[
  'rs/utils/ObjectUtil',
],
  function(ObjectUtil) {

    "use strict";

    Stars.prototype = Object.create(THREE.Points.prototype);
    Stars.prototype.constructor = Stars;

    /**
     * FireWork in 3D using three.js
     * @class Stars
     * @constructor
     */
    function Stars(pb, config) {
      
      this.pb = pb;
      this.am = pb.am;

      // Init state and configurations
      this.config = {
        size:12,
        numParticles:20,
        range:350
      };
      config = config || {};
      ObjectUtil.merge(config, this.config);
      this.init();
    }

    /**
     * Init Stars
     * @method init
     */
    Stars.prototype.init = function() {

      THREE.Points.prototype.constructor.call(this);

      const c = this.config;

      // Geometry
      this.geometry = new THREE.Geometry();
      const v = this.geometry.vertices;

      const range = c.range;
      const rangeX = range * 2;
      for (let i = 0; i < c.numParticles; i++) {

        const p = new THREE.Vector3();
        p.x = Math.random() * rangeX - 0.5 * rangeX;
        p.y = Math.random() * 100;
        p.z = -Math.random() * range - 200;
        v.push(p);
      }
      this.geometry.verticesNeedUpdate = true;

      // Setup material
      this.material = new THREE.PointsMaterial({
        color:0xffffff,
        size: c.size,
        opacity: 1,
        transparent: true,
        blending:THREE.AdditiveBlending,
        depthTest: false,
        map:this.am['stars']
      });
      this.material.needsUpdate = true;

      this.reset();
    };

    /**
     * Update firework state
     * @method update
     */
    Stars.prototype.update = function(delta) {

    }

    /**
     * Reset the firework state
     * @method reset
     */
    Stars.prototype.reset = function() {

      anime.remove(this.scale);
      anime({
        targets:this.scale,
        x:[1, 1.25],
        y:[1, 1.25],
        z:[1, 1.25],
        easing:'linear',
        duration:2000,
        direction:'alternate',
        loop:true
      });
    };

    return Stars;

  });



/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/entity/Obstacle',[],function() {

    "use strict";

    const MODEL_SCALE = 6;

    Obstacle.prototype = Object.create(THREE.Group.prototype);
    Obstacle.prototype.constructor = Obstacle;

    /**
     * Obstacle game object
     * @class Obstacle
     * @constructor
     */
    function Obstacle(pb) {

      this.pb = pb;
      this.am = pb.am;
      this.init();
    }

    /**
     * Init object
     */
    Obstacle.prototype.init = function() {
      
      THREE.Group.prototype.constructor.call(this);

      const list = ['Skull', 'LBone', 'PTree', 'Mako', 'Sharky', 'Skeleton', 'Tentacle'];
      const selectedName = this.selectedName = list[Math.floor(Math.random() * list.length)];
      const model = this.model = THREE.SkeletonUtils.clone(this.am[selectedName]);
      model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      this.selectedName = selectedName;

      switch (selectedName) {

        case 'Tentacle':
          model.scale.set(MODEL_SCALE * 3.4, MODEL_SCALE * 3.4, MODEL_SCALE * 3.4);
          break;

        case 'Anne':
          model.scale.set(MODEL_SCALE * 3.2, MODEL_SCALE * 3.2, MODEL_SCALE * 3.2);
          break;

        case 'Skeleton':
          model.scale.set(MODEL_SCALE * 3.2, MODEL_SCALE * 3.2, MODEL_SCALE * 3.2);
          break;

        case 'Sharky':
          model.scale.set(MODEL_SCALE * 3.2, MODEL_SCALE * 3.2, MODEL_SCALE * 3.2);
          break;

        case 'Mako':
          model.scale.set(MODEL_SCALE * 3.2, MODEL_SCALE * 3.2, MODEL_SCALE * 3.2);
          break;

        case 'PTree':
          model.scale.set(MODEL_SCALE * 5.2, MODEL_SCALE * 5.2, MODEL_SCALE * 5.2);
          break;

        case 'LBone':
          model.scale.set(MODEL_SCALE * 1.8, MODEL_SCALE * 1.8, MODEL_SCALE * 1.8);
          break;

        case 'Skull':
          model.scale.set(MODEL_SCALE * 2.5, MODEL_SCALE * 2.5, MODEL_SCALE * 2.5);
          break;
      }
      this.add(model);
      if (selectedName == 'Skeleton' || selectedName == 'Mako' || selectedName == 'Sharky' || selectedName == 'Tentacle') {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.animName = selectedName + 'Animations';
      }
      this.reset();
    };

    /**
     * Play a clip name
     * @method play
     */
    Obstacle.prototype.play = function(name) {

      if (this.currentAction)
        this.currentAction.fadeOut(0.5);

      const clip = THREE.AnimationClip.findByName( this.am[this.animName], name);
      const action = this.mixer.clipAction( clip );
      this.currentAction = action;

      action.clampWhenFinished = true;
      action
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .play();
    };

    /**
     * Play idle animation
     */
    Obstacle.prototype.playAttack = function() {
      if (this.selectedName == 'Tentacle')
        this.play('Tentacle_Idle');
      else
        this.play('Run');
    };

    /**
     * Hit interaction
     */
    Obstacle.prototype.hit = function() {
      
      if (this.isHit) return;
      this.isHit = true;

      // Play sound fx
      this.am.punch0.play();
    };

    /**
     * Self remove
     */
    Obstacle.prototype.selfRemove = function() {
      
      const ob = this, pb = this.pb;

      pb.remove(ob);

      for (let i = pb.opieces.length - 1; i >= 0; i--) {

        const otest = pb.opieces[i];
        if (otest === ob) {
          pb.opieces.splice(i, 1);
          pb.opool.free(ob);
          return;
        }
      }
    };

    /**
     * Animate obstacle
     */
    Obstacle.prototype.animate = function(delta) {
      
      if (this.selectedName == 'Mako' || this.selectedName == 'Sharky' || this.selectedName == 'Skeleton') {
        this.position.z += delta *this.pb.dopt.enemySpeed;
        const bs = this.pb.dopt.blockSize;
        let tz = -this.position.z + bs * 0.5;
        let ti = Math.ceil(tz / bs) - 1;
        this.ti = -ti;
      }
      if (this.mixer) this.mixer.update(delta);
    };

    /**
     * Reset
     */
    Obstacle.prototype.reset = function() {

      this.isHit = false;
      this.scale.set(1, 1, 1);
    };

    return Obstacle;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/entity/ObstaclePool',['rs/pru3d/entity/Obstacle'],
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

/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/entity/Gift',[],function() {

    "use strict";

    const MODEL_SCALE = 15;

    Gift.prototype = Object.create(THREE.Group.prototype);
    Gift.prototype.constructor = Gift;

    /**
     * Gift game object
     * @class Gift
     * @constructor
     */
    function Gift(pb) {

      this.pb = pb;
      this.am = pb.am;
      this.init();
    }

    /**
     * Init objects
     */
    Gift.prototype.init = function() {
      
      THREE.Group.prototype.constructor.call(this);

      // Import model
      const bookList = [this.am['Coin_Star']];
      const model = this.model = THREE.SkeletonUtils.clone(bookList[Math.floor(Math.random() * bookList.length)]);
      model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      model.rotation.z = Math.random() * 2 * Math.PI;
      model.position.y = 8;
      this.add(model);
    };

    /**
     * Hit interaction
     */
    Gift.prototype.hit = function() {
      
      this.isHit = true;

      const am = this.am;

      // Play sound fx
      //am.yahoo.play();
      if (am.hitcoin.isPlaying) am.hitcoin.stop();
      am.hitcoin.play();

      anime.remove(this.position);
      anime({
        targets:this.position,
        y:30,
        easing:'easeOutQuint',
        duration:600
      });

      anime.remove(this.rotation);
      anime({
        targets:this.rotation,
        y:Math.random() * 2 * Math.PI,
        easing:'easeOutQuad',
        duration:1000
      });
    };

    /**
     * Selft remove
     */
    Gift.prototype.selfRemove = function() {
      
      // Cleanup
      const gi = this, pb = this.pb;

      pb.remove(gi);

      for (let i = pb.gpieces.length - 1; i >= 0; i--) {

        const gtest = pb.gpieces[i];
        if (gtest === gi) {
          pb.gpieces.splice(i, 1);
          pb.gpool.free(gi);
          return;
        }
      }
    };

    /**
     * Reset
     */
    Gift.prototype.reset = function() {

      this.isHit = false;
      anime.remove(this.position);
      this.scale.set(1, 1, 1);
    };

    return Gift;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/entity/GiftPool',[
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


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/entity/ThePirate',['rs/pru3d/SparkAnimation'],
  function(SparkAnimation) {

    "use strict";

    const MODEL_SCALE = 12;

    ThePirate.prototype = Object.create(THREE.Group.prototype);
    ThePirate.prototype.constructor = ThePirate;

    /**
     * ThePirate game object
     * @class ThePirate
     * @constructor
     */
    function ThePirate(pb, type) {

      this.pb = pb;
      this.am = pb.am;
      this.speed = pb.dopt.pirateSpeed;
      this.stype = type || 1;
      this.init();
    }

    /**
     * Init
     */
    ThePirate.prototype.init = function() {
      
      THREE.Group.prototype.constructor.call(this);

      this.animName = 'ThePirateInuAnimations';

      var modelName = 'Anne';

      switch (this.stype) {

        case 2: modelName = 'Captain'; break;
        case 3: modelName = 'Henry'; break;
      }
      this.animName = modelName + 'Animations';

      this.modelName = modelName;
      const model = this.model = this.am[this.modelName];
      model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      this.add(model);

      // Default orientation
      this.rotation.y = Math.PI;
      this.mixer = new THREE.AnimationMixer(this.model);
      
      const size = 12;
      const targetPlane = this.targetPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(size, size),
        new THREE.MeshBasicMaterial({map:this.am.ThePirateTarget1, transparent:true, opacity:1}));
      targetPlane.rotation.x = -Math.PI / 2;
      this.add(targetPlane);

      // Focal point position
      const fp = this.fpoint = new THREE.Mesh(
        new THREE.BoxBufferGeometry(1, 1, 1), 
        new THREE.MeshBasicMaterial({color:0xffcc00}));
      fp.visible = false;
      //fp.position.set(20, 20, -50);
      fp.position.set(-2, 80, -70); 
      this.add(fp);

      // Reset default state
      this.reset();
    };

    /**
     * Play a clip name
     * @method play
     */
    ThePirate.prototype.play = function(name) {

      if (this.currentAction)
        this.currentAction.fadeOut(0.5);

      const clip = THREE.AnimationClip.findByName( this.am[this.animName], name);
      const action = this.mixer.clipAction( clip );
      this.currentAction = action;

      action.clampWhenFinished = true;
      action
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .play();
    };

    /**
     * Play walk animation
     */
    ThePirate.prototype.playWalk = function() {
      this.play('Run');
    };

    /**
     * Play animation once
     * @method playOnce
     */
    ThePirate.prototype.playOnce = function(name) {

      if (this.currentAction)
        this.currentAction.fadeOut(0.5);

      const clip = THREE.AnimationClip.findByName( this.am[this.animName], name);
      const action = this.mixer.clipAction( clip );
      this.currentAction = action;

      action.clampWhenFinished = true;
      action
        .reset()
        .setLoop(THREE.LoopOnce, 1)
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .play();
    };

    /**
     * Update ninjaeaseOutQuad
     */
    ThePirate.prototype.update = function(delta) {

      const d = this.pb.dopt;
      const bs = d.blockSize;

      // Update circle
      this.targetPlane.rotation.z += 0.05;

      // Update animation
      this.mixer.update(delta);

      // Update position
      const speed = delta * d.pirateSpeed;
      this.position.z -= speed;

      // Update star position
      this.pb.stars.position.z -= speed;

      let ti = Math.ceil((-this.position.z + bs * 0.5) / bs) - 1;

      if (ti >= this.nextShift) {

        this.nextShift += 10;
        this.pb.floor.shiftForward();
        //console.log(this.nextShift);
      }
      if (ti + 10 >= this.nextGenShift) {

        this.pb.generateLevel(this.nextGenShift);
        this.nextGenShift += 40;
        //console.log('gen shift', this.nextGenShift);
      }
    };

    /**
     * Return current matrix position
     */
    ThePirate.prototype.getMatrixPosition = function() {
      
      const bs = this.pb.dopt.blockSize;
      let tx = this.position.x + bs * 0.5 + bs * 3;
      let tj = Math.ceil(tx / bs) - 1;
      let tz = -this.position.z + bs * 0.5;
      let ti = Math.ceil(tz / bs) - 1;
      return [-ti, tj];
    };

    /**
     * Reset ninja
     */
    ThePirate.prototype.reset = function() {

      this.nextShift = 10;
      this.ti = 0; 
      this.tj = 3;
      this.nextGenShift = 40;
      this.position.set(0, 0, 0);
    };

    /**
     * Hit obstacle
     */
    ThePirate.prototype.hitObstacle = function() {
      this.blink();
    };

    /**
     * Blink ninja
     */
    ThePirate.prototype.blink = function() {
      
      // Blink for a short time
      let count = 0;
      const character = this;
      this.isBlinking = true;

      function doBlink () {
        
        clearTimeout(character.blinkId);
        if (count++ < 12) {
          character.visible = !character.visible;
          character.blinkId = setTimeout(doBlink, 50);
        }
        else {
          character.visible = true;
          character.isBlinking = false;
        }
      }
      doBlink();

      // Also bounce
      this.bounce();
    };

    /**
     * Shift left
     */
    ThePirate.prototype.shiftLeft = function() {
      
      const sa = this;

      let tj = this.tj;
      if (tj == 0) return;
      tj--;

      const bs = this.pb.dopt.blockSize;
      const offsetX = -bs * 3;
      let tx = tj  * bs + offsetX;
      this.tj = tj;

      anime.remove(this.model.rotation);
      anime({
        targets:this.model.rotation,
        y:Math.PI * 0.3,
        duration:300,
        easing:'easeOutQuint'
      });

      clearTimeout(this.rotId);
      this.rotId = setTimeout(function() {

        anime.remove(sa.model.rotation);
        anime({
          targets:sa.model.rotation,
          y:0,
          duration:400,
          easing:'easeOutQuint'
        });
      }, 200);

      anime.remove(this.position);
      anime({
        targets:this.position,
        x:tx,
        duration:800,
        easing:'easeOutQuint'
      });
    };

    /**
     * Shift right
     */
    ThePirate.prototype.shiftRight = function() {
      
      const sa = this;

      let tj = this.tj;
      if (tj == 6) return;
      tj++;

      const bs = this.pb.dopt.blockSize;
      const offsetX = -bs * 3;
      let tx = tj  * bs + offsetX;
      this.tj = tj;

      anime.remove(this.model.rotation);
      anime({
        targets:this.model.rotation,
        y:-Math.PI * 0.3,
        duration:300,
        easing:'easeOutQuint'
      });

      clearTimeout(this.rotId);
      this.rotId = setTimeout(function() {

        anime.remove(sa.model.rotation);
        anime({
          targets:sa.model.rotation,
          y:0,
          duration:400,
          easing:'easeOutQuint'
        });
      }, 200);

      anime.remove(this.position);
      anime({
        targets:this.position,
        x:tx,
        duration:800,
        easing:'easeOutQuint'
      });
    };

    /**
     * Bounce effect
     */
    ThePirate.prototype.bounce = function() {

      anime.remove(this.scale);
      this.scale.set(1.5, 1.5, 1.5);
      anime({
        targets:this.scale,
        x:1,
        y:1,
        z:1,
        duration:2000,
        easing:'easeOutElastic'
      });
      
    };

    return ThePirate;

  });


/**
 * @author  raizensoft.com
 */
define(
  'rs/pru3d/entity/Floor',[],function() {

    "use strict";

    const LINES_WIDTH = 7;
    const LINES_HEIGHT = 40;

    Floor.prototype = Object.create(THREE.Group.prototype);
    Floor.prototype.constructor = Floor; 

    /**
     * Floor object
     * @class Floor
     * @constructor
     */
    function Floor(rs) {

      this.rs = rs;
      this.am = rs.am;
      this.dopt = rs.dopt;
      this.init();
    }

    /**
     * Init the floor
     * @method init
     */
    Floor.prototype.init = function() {

      THREE.Group.prototype.constructor.call(this);

      // Ground plane
      const bs = this.dopt.blockSize;
      const gridSize = this.gridSize = bs * 21;

      const tex = this.am.Road;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(LINES_WIDTH, LINES_HEIGHT);

      const mat = new THREE.MeshBasicMaterial({map:tex, color:0xeeeeee, depthWrite:false});
      //const mat = new THREE.MeshBasicMaterial({color:0xeeeeee, depthWrite:false});
      const gr = this.gridPlane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1, 1),
        mat);
      gr.rotation.x = - Math.PI / 2;
      gr.isFloor = true;
      this.add(gr);
      this.gridPlane.scale.set(LINES_WIDTH * bs, LINES_HEIGHT * bs);
      
      // Default config
      this.config(LINES_WIDTH, LINES_HEIGHT);
    };

    /**
     * Self Align
     * @method selfAlign
     */
    Floor.prototype.selfAlign = function() {

      var offset = 5;
      this.position.z = this.offsetZ = -(this.currentLineHeight - offset) * this.dopt.blockSize * 0.5;
    };

    /**
     * Create custom grid
     * @method createGrid
     */
    Floor.prototype.createGrid = function(opts) {

      var config = opts || {
        linesWidth: LINES_WIDTH,
        linesHeight: LINES_HEIGHT,
        color: 0x999999
      };
      var unitSize = this.dopt.blockSize;
      config.width = unitSize * config.linesWidth * 0.5;
      config.height = unitSize * config.linesHeight * 0.5;

      var material = new THREE.LineBasicMaterial({color: config.color});

      var gridObject = new THREE.Object3D(),
        gridGeo = new THREE.Geometry(),
        stepw = 2 * config.width / config.linesWidth,
        steph = 2 * config.height / config.linesHeight;

      // Width
      for (var i = -config.height; i <= config.height; i += stepw) {
        gridGeo.vertices.push(new THREE.Vector3(-config.width, i, 0));
        gridGeo.vertices.push(new THREE.Vector3(config.width, i, 0));
      }
      
      // Height
      for (var i = -config.width; i <= config.width; i += steph) {
        gridGeo.vertices.push(new THREE.Vector3(i, -config.height, 0));
        gridGeo.vertices.push(new THREE.Vector3(i, config.height, 0));
      }

      var line = new THREE.LineSegments(gridGeo, material);
      gridObject.add(line);
      gridObject.rotation.x = Math.PI / 2;
      return gridObject;
    };

    /**
     * Return matrix position from input point
     * @method getMatrixPosition
     */
    Floor.prototype.getMatrixPosition = function(point) {

      var bs = this.dopt.blockSize;
      var r = this.currentLineHeight, c = this.currentLineWidth;
      var rx = point.x / (this.currentLineWidth * bs) + 0.5;
      var pZ = point.z - this.offsetZ;
      var ry = 0.5 + pZ / (this.currentLineHeight * bs);
      var j = Math.floor(rx * c), i = Math.floor(ry * r);
      return [i, j];
    };

    /**
     * Get spatial position from i, j
     * @method getSpatialPosition
     */
    Floor.prototype.getSpatialPosition = function(i, j) {

      var x = j * this.dopt.blockSize + this.originX;
      var z = i * this.dopt.blockSize + this.originZ + this.offsetZ;
      return [x, z];
    };

    /**
     * Get point position
     * @method getPointPosition
     */
    Floor.prototype.getPointPosition = function(point) {

      var mp = this.getMatrixPosition(point);
      return this.getSpatialPosition(mp[0], mp[1]);
    };

    /**
     * Config floor
     * @method config
     */
    Floor.prototype.config = function(linesWidth, linesHeight) {

      // Create grid plane
      this.gridPlane.scale.set(linesWidth * this.dopt.blockSize, linesHeight * this.dopt.blockSize);

      // Create grid
      if (this.grid) this.remove(this.grid);
      this.grid = this.createGrid({linesWidth:linesWidth, linesHeight:linesHeight, color:0x999999});
      //this.add(this.grid);

      // Call self aligning
      this.originX = -this.dopt.blockSize * linesWidth * 0.5 + this.dopt.blockSize * 0.5;
      this.originZ = -this.dopt.blockSize * linesHeight * 0.5 + this.dopt.blockSize * 0.5;
      this.offsetZ = 0;
      this.currentLineWidth = linesWidth;
      this.currentLineHeight = linesHeight;
      this.selfAlign();
    };

    /**
     * Return matrix position from input point
     * @method getMatrixPosition
     */
    Floor.prototype.getMatrixPosition = function(point) {

      var bs = this.dopt.blockSize;
      var r = this.currentLineHeight, c = this.currentLineWidth;
      var rx = point.x / (this.currentLineWidth * bs) + 0.5;
      var pZ = point.z - this.offsetZ;
      var ry = 0.5 + pZ / (this.currentLineHeight * bs);
      var j = Math.floor(rx * c), i = Math.floor(ry * r);
      return [i, j];
    };

    /**
     * Get spatial position from i, j
     * @method getSpatialPosition
     */
    Floor.prototype.getSpatialPosition = function(i, j) {

      var bs = this.dopt.blockSize;
      var x = j * bs + this.originX;
      var z = i * bs + this.originZ + this.offsetZ;
      return [x, z];
    };

    /**
     * Get point position
     * @method getPointPosition
     */
    Floor.prototype.getPointPosition = function(point) {

      var mp = this.getMatrixPosition(point);
      return this.getSpatialPosition(mp[0], mp[1]);
    };

    /**
     * Get limit X position
     * @method getLimitX
     */
    Floor.prototype.getLimitX = function() {
      return  this.currentLineWidth * 0.5 * this.dopt.blockSize;
    };

    /**
     * Return midline
     * @method getMidLine
     */
    Floor.prototype.getMidLine = function() {
      return Math.floor(this.currentLineWidth * 0.5);
    };

    /**
     * Shift stage forward
     */
    Floor.prototype.shiftForward = function() {

      //console.log('shifting forward');
      const bs = this.dopt.blockSize;
      this.position.z -= (this.currentLineHeight * 0.25) * bs;
    };

    return Floor;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/RunningStage',[
  'rs/pru3d/SparkAnimation', 
  'rs/pru3d/entity/Stars', 
  'rs/pru3d/entity/ObstaclePool', 
  'rs/pru3d/entity/GiftPool', 
  'rs/pru3d/entity/ThePirate', 
  'rs/pru3d/entity/Floor'],
  function(
    SparkAnimation,
    Stars,
    ObstaclePool,
    GiftPool,
    ThePirate,
    Floor) {

    "use strict";

    const FLOOR_OFFSET = -7;

    RunningStage.prototype = Object.create(THREE.Group.prototype);
    RunningStage.prototype.constructor = RunningStage; 

    /**
     * RunningStage class
     * @class RunningStage
     * @constructor
     */
    function RunningStage(g3d) {

      this.g3d = g3d;
      this.gs = g3d.gs;
      this.dopt = g3d.dopt;
      this.am = g3d.am;
      this.init();
    }

    /**
     * Build puzzle board
     * @method init
     */
    RunningStage.prototype.init = function() {

      THREE.Group.prototype.constructor.call(this);

      const d = this.dopt;
      const am = this.am;

      // Gift pool
      this.gpool = new GiftPool(this);
      this.gpieces = [];

      // Obstacles pool
      this.opool = new ObstaclePool(this);
      this.opieces = [];

      // Init stars
      this.stars = new Stars(this);
      this.add(this.stars);

      // Init Floor
      this.floor = new Floor(this);
      this.floor.position.y = FLOOR_OFFSET;
      this.add(this.floor);

      // Init spark animation
      this.sanim = new SparkAnimation(this);
      this.sanim.position.z = 2;
      this.add(this.sanim);

      // ThePirate list
      this.pirateList = [new ThePirate(this, 1), new ThePirate(this, 2), new ThePirate(this, 3)];
    };

    /**
     * Running stage
     * @method prepareLevel
     */
    RunningStage.prototype.prepareLevel = function(level) {

      this.reset();

      // Remove old pirate
      this.remove(this.pirate);

      // Pick a new pirate
      const sa = this.pirate = this.pirateList[Math.floor(Math.random() * this.pirateList.length)];
      sa.reset();
      sa.position.y = FLOOR_OFFSET;
      sa.playWalk();
      this.add(this.pirate);

      // Generate first level
      this.generateLevel(0);
    };

    /**
     * Generate next level
     */
    RunningStage.prototype.generateLevel = function(shiftLevel) {

      console.log('Generate level: ', shiftLevel, shiftLevel + 40);

      const track = [];
      const num = 10;
      let count = 0;
      const pad = (shiftLevel == 0) ? 5 : shiftLevel;

      while (++count <= num) {

        let ti = Math.floor(Math.random() * 40) + pad; 
        let tj = Math.floor(Math.random() * 7);
        while (track[ti] && track[ti][tj]) {

          ti = Math.floor(Math.random() * 40) + pad; 
          tj = Math.floor(Math.random() * 7);
        }
        if (!track[ti]) track[ti] = [];
        track[ti][tj] = 1;
        //console.log(ti, tj);

        let type = Math.floor(Math.random() * 2);

        // Type gift
        if (type == 0) {

          const gi = this.gpool.obtain();
          gi.reset();
          gi.position.y = FLOOR_OFFSET;
          this.gpieces.push(gi);
          this.placeItem(gi, -ti, tj);
        }
        // Type obstacles
        else {

          const ob = this.opool.obtain();
          ob.reset();
          ob.position.y = FLOOR_OFFSET;
          if (ob.mixer) ob.playAttack();
          this.opieces.push(ob);
          this.placeItem(ob, -ti, tj);
        }
      }
    };

    // Camera helper vectors
    let lookVector = new THREE.Vector3();
    let pointVector = new THREE.Vector3();

    /**
     * Update game component
     * @method update
     */
    RunningStage.prototype.update = function(delta) {

      // Hit detection
      const sa = this.pirate;
      const cam = this.g3d.camera;

      // Update spark animation
      this.sanim.update(delta);

      // Update pirate
      sa.update(delta);
      const pos = sa.getMatrixPosition();

      // Update obstacles
      for (let i = this.opieces.length - 1; i >=0; i--) {

        const ob = this.opieces[i];
        ob.animate(delta);
        if (ob.ti - 2 > pos[0])
          ob.selfRemove();
      }

      // Update gift
      for (let i = this.gpieces.length - 1; i >=0; i--) {

        const gi = this.gpieces[i];
        if (gi.ti - 2 > pos[0])
          gi.selfRemove();
      }

      // Obstacle hit detection
      for (let i = 0; i < this.opieces.length; i++) {

        const ob = this.opieces[i];

        if (ob.ti == pos[0] && ob.tj == pos[1] && !ob.isHit) {

          ob.hit();
          sa.hitObstacle();
          const end = this.gs.header.hbar.decreaseHealth();
          if (end) {
            this.g3d.setLoseState();
          }
          break;
        }
      }
      
      // Gift hit detection
      for (let i = 0; i < this.gpieces.length; i++) {

        const gi = this.gpieces[i];
        if (gi.ti == pos[0] && gi.tj == pos[1] && !gi.isHit) {

          gi.hit();
          this.sanim.show();

          // Coin counter
          sa.getWorldPosition(pointVector);
          pointVector.project(this.g3d.camera);
          const hw = this.g3d.width * 0.5;
          const hh = this.g3d.height * 0.5;
          const xp = pointVector.x * hw + hw;
          const yp = -pointVector.y * hh + hh;
          this.g3d.cc.show(xp, yp, 100);

          // Update score
          this.gs.header.levelBtn.setLevel(this.g3d.cc.coin);
          break;
        }
      }

      // Update camera
      lookVector.setFromMatrixPosition(sa.fpoint.matrixWorld);
      cam.position.lerp(lookVector, 0.2);
    };

    /**
     * Place item in matrix position
     */
    RunningStage.prototype.placeItem = function(item, ti, tj) {
      
      const bs = this.dopt.blockSize;
      this.add(item);
      const offsetX = -bs * 3;
      item.position.x = tj  * bs + offsetX;
      item.position.z = ti  * bs;
      item.ti = ti;
      item.tj = tj;
    };

    /**
     * Reset current objects
     */
    RunningStage.prototype.reset = function() {

      this.floor.selfAlign();
      this.stars.position.z = 70;
    };

    return RunningStage;

  });


/**
 * @author  raizensoft.com
 */
define(
'rs/pru3d/GameLight',[],function() {

  "use strict";

  GameLight.prototype = Object.create(THREE.Group.prototype);
  GameLight.prototype.constructor = GameLight; 

  var SPEED = 2;

  /**
   * Group of lights in the game
   * @class GameLights
   * @constructor
   */
  function GameLight(g3d) {

    this.g3d = g3d;
    this.dopt = g3d.dopt;
    this.speed = this.dopt.lightMovingSpeed;
    this.init();
  }

  /**
   * Init the light
   * @method init
   */
  GameLight.prototype.init = function() {

    THREE.Group.prototype.constructor.call(this);

    // Default bound values
    this.bound = [300, 400, 10];
    this.dirX = 1;
    var lights = this.lights = [];

    var intensity = 1;
    lights[ 0 ] = new THREE.PointLight( 0xffffff, intensity, 0 );
    lights[ 1 ] = new THREE.PointLight( 0xffffff, intensity, 0 );

    lights[ 0 ].position.set( 0, -800, 0 );
    lights[ 0 ].oZ = 600;

    lights[ 1 ].position.set( 15, 20, 20);
    lights[ 1 ].oZ = 20;

    //this.add( lights[ 0 ] );
    this.add( lights[ 1 ] );

    var scene = this.g3d.scene;

    var h1 = new THREE.PointLightHelper(lights[0], 20);
    var h2 = new THREE.PointLightHelper(lights[1], 20);

    //scene.add(h1);
    //scene.add(h2);

    var ambientLight = new THREE.AmbientLight( this.dopt.ambientLight, 0.95);
    this.add( ambientLight );
  };

  /**
   * Move and animate lights
   * @method animate
   */
  GameLight.prototype.animate = function() {
    
    this.lights[1].position.x += this.dirX * this.speed;
    var lX = this.lights[1].position.x;
    if (lX > this.bound[0] * 0.5 || lX < -this.bound[0] * 0.5)
      this.dirX = -this.dirX;
  };

  /**
   * Transition light objects
   * @method transition
   */
  GameLight.prototype.transition = function() {
  };

  /**
   * Set boundary for light movements
   * @method setBound
   */
  GameLight.prototype.setBound = function(bound, shiftZ) {

    this.bound = bound;
    var l1 = this.lights[1];
    l1.position.set(bound[0] * 0.5, -bound[1] * 0.5, l1.oZ);
    l1.position.y = 0;
  };

  return GameLight;

});


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/Game3dContainer',[
  'rs/pru3d/RunningStage', 
  'rs/pru3d/GameLight'],

  function(
    RunningStage,
    GameLight) {

    "use strict";

    Game3dContainer.prototype = Object.create(THREE.Group.prototype);
    Game3dContainer.prototype.constructor = Game3dContainer; 

    const EASING = 'easeOutQuint';
    const DURATION = 1200;

    /**
     * Generic and root container for all 3d game items
     * @class Game3dContainer
     * @constructor
     */
    function Game3dContainer(g3d) {

      // References to Gallery3D
      this.g3d = g3d;
      this.init();
    }

    /**
     * Init the container
     * @method init
     */
    Game3dContainer.prototype.init = function() {

      // Call parent constructor
      THREE.Group.prototype.constructor.call(this);

      // Add Running Stage
      this.runningStage = new RunningStage(this.g3d);
      this.add(this.runningStage);

      // Light object
      var glight = this.glight = new GameLight(this.g3d);
      this.add(glight);
    };

    /**
     * Show puzzle board with transitioning effect
     * @method transitionIn
     */
    Game3dContainer.prototype.show = function() {

      const d = this.g3d.dopt;

      this.visible = false;

      // Starting position and rotation
      this.rotation.x = 0;
      var g3c = this;

      const targetScale = 1;
      const initScale = 0.1;
      this.scale.set(initScale, initScale, initScale);
      anime.remove(this.scale);
      anime({
        targets:this.scale,
        x:targetScale,
        y:targetScale,
        z:targetScale,
        easing:'easeOutQuad',
        duration:1200
      });

      // Container view and position
      this.position.y = d.verticalShift;
      this.position.z = -30;

      if (true) {

        this.rotation.y = Math.PI;
        let tY = 2 * Math.PI;
        let tX = d.shearAngle * Math.PI / 180;

        anime.remove(this.rotation);
        anime({
          targets:this.rotation,
          y:tY,
          x:tX,
          easing:'easeOutCubic',
          delay:1000,
          duration:2000,
          complete:function() {

            g3c.rotation.y = 0;
            //g3d.setRunningState();
          }
        });
      }
      g3c.visible = true;
    };

    /**
     * Set losing state
     * @method setLoseState
     */
    Game3dContainer.prototype.setLoseState = function() {

      /*
      anime.remove(this.rotation);
      anime({
        targets:this.rotation,
        x:4 * Math.PI / 180,
        easing:'easeOutQuint',
        duration:800
      });
      */
    };

    return Game3dContainer;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/Game3d',[
  'rs/three/BaseApp',
  'rs/utils/BrowserUtil', 
  'rs/game3d/Firework3DSet', 
  'rs/pru3d/CoinCounter', 
  'rs/pru3d/Game3dContainer'], 

  function(
    BaseApp,
    BrowserUtil,
    Firework3DSet,
    CoinCounter,
    Game3dContainer) {

    "use strict";

    Game3d.prototype = Object.create(BaseApp.prototype);
    Game3d.prototype.constructor = Game3d;

    var Game3dState = {
      RUNNING:0,
      WON:1,
      LOSE:2,
      READY:3,
      PAUSE:4
    };

    /**
     * Main game components
     * @class Game3d
     * @constructor
     */
    function Game3d(gs) {

      this.gs = gs;
      this.config = gs.config;
      this.pru3d = gs.pru3d;
      this.dopt = this.pru3d.defaultOptions;
      this.am = this.pru3d.assetManager;

      // Default temporary dimension
      var w = 500, h = 300; 
      BaseApp.prototype.constructor.call(this, w, h);
      this.setCameraMatchProjection();

      // Default cursor
      this.defaultCursor = 'auto';

      // Build basic threejs components
      this.buildScene();
      //this.enableOrbitControl();
      
      // Init dragging control
      this.initMouseDrag();

      // Init mouse handler
      this.initMouseHandler();

      // Init keyboard
      this.initKeyboard();
    }

    /**
     * Enable orbit controls
     * @method enableOrbitControl
     */
    Game3d.prototype.enableOrbitControl = function() {

      this.controls = new OrbitControls( this.camera, this.el );
      this.controls.enableDamping = true;
    };

    /**
     * Build scene
     * @method buildScene
     */
    Game3d.prototype.buildScene = function() {

      // Parent container of all 3d items
      this.container = new Game3dContainer(this);

      // Clock utility
      this.clock = new THREE.Clock();
      
      // Coin counter
      this.cc = new CoinCounter();

      // Add game container
      var scene = this.scene;
      scene.add(this.container);
      scene.background = new THREE.Color(this.dopt.sceneColor);
      scene.fog = new THREE.Fog(this.dopt.sceneColor, 10, 450);

      var am = this.am;

      // Init firework collection
      this.f3ds = new Firework3DSet(this, 
        {
          numParticles:3, 
          callback:function() {
            am.firework.play();
          }
        });
      scene.add(this.f3ds);
      
      // Default game states
      this.camera.rotation.x = 0;
      this.f3ds.visible = false;
      this.inTransition = false;

      // Setup raycasting
      this._setUpRaycaster();

      // Force resizing upon building scene
      this.resizeHandler();
    };

    /**
     * Init mouse dragging function
     * @method initMouseDrag
     */
    Game3d.prototype.initMouseDrag = function() {

      var me = BrowserUtil.getMouseTouchEvents();
      var mdown = me.mdown, mmove = me.mmove, mup = me.mup;
      var el = this.el;
      let oX, clientX, oRotZ;
      var g3d = this, container = this.container, rs = container.runningStage;

      function mouseDownHandler (e) {
        
        if (!g3d.isRunningState()) return;
        g3d.isDragging = true;
        if (e.touches) {
          clientX = e.touches[0].clientX;
        }
        else {
          clientX = e.clientX;
        }
        oX = clientX;
        el.addEventListener(mmove, mouseMoveHandler);
        el.addEventListener(mup, mouseUpHandler);
        window.addEventListener(mmove, mouseMoveHandler);
        window.addEventListener(mup, mouseUpHandler);
        //el.style.cursor = 'grabbing';
      }

      function mouseMoveHandler (e) {
        
        if (!g3d.isRunningState()) return;
        if (e.changedTouches) {
          clientX = e.changedTouches[0].clientX;
        }
        else {
          clientX = e.clientX;
        }
        var delta = (clientX - oX) * 0.25;
      }

      function mouseUpHandler (e) {
        
        g3d.isDragging = false;
        el.removeEventListener(mmove, mouseMoveHandler);
        el.removeEventListener(mup, mouseUpHandler);
        window.removeEventListener(mmove, mouseMoveHandler);
        window.removeEventListener(mup, mouseUpHandler);
        //el.style.cursor = 'grab';
      }

      el.addEventListener(mdown, mouseDownHandler);
      el.addEventListener('mouseover', function(e) {
        //el.style.cursor = 'grab';
      });
      this.disableDragEvent = mouseUpHandler;
    };

    /**
     * Init mouse handlers
     */
    Game3d.prototype.initMouseHandler = function() {

      const g3d = this;

      function pointeDownHandler (e) {
        
        if (g3d.state !== Game3dState.RUNNING) return;

        const rs = g3d.container.runningStage;

        if (e.clientX / window.innerWidth > 0.5) {
          rs.pirate.shiftRight();
        }
        else {
          rs.pirate.shiftLeft();
        }
      }

      function pointerMoveHandler (e) {
        
      }

      document.body.addEventListener('pointerdown', pointeDownHandler);
      document.body.addEventListener('pointermove', pointerMoveHandler);
    };

    /**
     * Init keyboard
     * @method initKeyboard
     */
    Game3d.prototype.initKeyboard = function() {

      const g3d = this;
      const kt = this.keyTracking = [];

      function keyDownHandler (e) {

        if (g3d.state !== Game3dState.RUNNING) return;

        const rs = g3d.container.runningStage;

        if (e.keyCode == 37 || e.keyCode == 65) {
          rs.pirate.shiftLeft();
        }
        else if (e.keyCode == 39 || e.keyCode == 68) {
          rs.pirate.shiftRight();
        }
        kt[e.keyCode] = 1;
      }

      function keyUpHandler (e) {
        kt[e.keyCode] = 0;
      }
      document.body.addEventListener('keydown', keyDownHandler);
      document.body.addEventListener('keyup', keyUpHandler);
    };

    /**
     * Setup raycasting
     * @method _setUpRaycaster
     * @private
     */
    Game3d.prototype._setUpRaycaster = function() {

      const camera = this.camera;
      const raycaster = this.raycaster;
      const container = this.container;
      const el = this.el;

      const g3d = this;
      const am = this.am;
      const rs = this.container.runningStage;
      let lastX, lastY;

      function doRaycast (e) {

        var oX, oY;
        if (e.touches) {
          oX = e.touches[0].clientX; oY = e.touches[0].clientY;
        }
        else
        if (e.changedTouches) {
          oX = e.changedTouches[0].clientX; oY = e.changedTouches[0].clientY;
        }
        else {
          oX = e.offsetX; oY = e.offsetY;
        }
        var mouse = {
          x: (oX / g3d.width) * 2 - 1,
          y: -(oY / g3d.height) * 2 + 1,
        };
        raycaster.setFromCamera( mouse, camera );    

        // Compute intersections
        var intersects = raycaster.intersectObjects( container.children, true);

        for ( var i = 0; i < intersects.length; i++ ) {

          const item = intersects[i].object;

          // Click handler
          if (e.type == 'pointerdown') {
            g3d.isHover = true;
          }

          // Mouse over out handler 
          if (e.type == 'pointerup') {
          }
          break;

          /*
          - object : intersected object (THREE.Mesh)
          - distance : distance from camera to intersection (number)
          - face : intersected face (THREE.Face3)
          - faceIndex : intersected face index (number)
          - point : intersection point (THREE.Vector3)
          - uv : intersection point in the object's UV coordinates (THREE.Vector2)
          */
        }

        // Mouseout
        if (intersects.length == 0 && e.type == 'pointermove') {
          g3d.isHover = false;
        }
      }

      function mouseUpHandler(pointer) {

      }

      // Mouse click, over, out
      el.addEventListener('pointerdown', doRaycast);

      // Check mousemove to determine over and out status
      el.addEventListener('pointerup', mouseUpHandler);
    };

    /**
     * Load level
     * @method loadLevel
     */
    Game3d.prototype.loadLevel = function(index, callback) {

      this.disableDragEvent();
      this.pru3d.inTransition = true;

      var levels = this.gs.levels;

      // Back to first level
      if (index == levels.length) 
        index = 0;

      var item = levels[index];
      var g3d = this;
      this.container.visible = false;

      // Show container
      g3d.container.show();

      // Prepare level
      this.container.runningStage.prepareLevel(item);

      // Reset camera
      this.camera.rotation.x = 0;
      this.camera.position.set(0, 0, 40);
      this.setReadyState();

      // Call callback
      callback.call(g3d);
    };

    /**
     * Override _renderRequest
     * @method _renderRequest
     */
    Game3d.prototype._renderRequest = function() {

      BaseApp.prototype._renderRequest.call(this);

      const delta = this.clock.getDelta();

      // Update orbit controls
      if (this.controls)
        this.controls.update();

      // Update light movements
      this.container.glight.animate();

      // Firework
      if (this.state == Game3dState.WON) {
        this.f3ds.update(delta);
      }
      
      // Update game objects
      const rs = this.container.runningStage;

      if (this.isReadyState()) {
        rs.pirate.mixer.update(delta);
      }
      else
      if (this.isRunningState())
        rs.update(delta);
    };

    /**
     * Set current state to be ready
     * @method setReadyState
     */
    Game3d.prototype.setReadyState = function() {
      this.state = Game3dState.READY;
    };

    /**
     * Ready state
     * @method isReadyState
     */
    Game3d.prototype.isReadyState = function() {
      return (this.state == Game3dState.READY);
    };

    /**
     * Return pause state 
     * @method isPauseState
     */
    Game3d.prototype.isPauseState = function() {
      return (this.state == Game3dState.PAUSE);
    };

    /**
     * Set pause state
     * @method setPauseState
     */
    Game3d.prototype.setPauseState = function() {

      this.lastState = this.state;
      this.state = Game3dState.PAUSE;
    };

    /**
     * Restore last state
     * @method restoreLastState
     */
    Game3d.prototype.restoreLastState = function() {
      this.state = this.lastState;
    };

    /**
     * Set current state to running
     * @method setRunningState
     */
    Game3d.prototype.setRunningState = function() {

      this.state = Game3dState.RUNNING;
      this.camera.rotation.x = 0;
      this.f3ds.visible = false;
      this.inTransition = false;
      this.gs.header.show();
    };

    /**
     * Test running state
     * @method isRunningState
     */
    Game3d.prototype.isRunningState = function() {
      return (this.state == Game3dState.RUNNING);
    };

    /**
     * Set current state to won
     * @method setWonState
     */
    Game3d.prototype.setWonState = function() {

      //if (this.state !== Game3dState.RUNNING) return;

      this.state = Game3dState.WON;
      this.inTransition = true;

      var rs = this.container.runningStage;
      rs.gi.lose();
      rs.astronaut.win();

      // Show firework
      this.f3ds.visible = true;
      this.f3ds.reset();
      this.f3ds.position.z = rs.astronaut.position.z - 1000;

      // Setup UI
      this.gs.header.hide();
      this.gs.showWonBar();
      this.am.wintune.play();
      this.am.yahoo.play();

      // Unlock next level
      this.gs.unlockNextLevel();
    };

    /**
     * Set lose state
     * @method setLoseState
     */
    Game3d.prototype.setLoseState = function() {

      //if (this.state !== Game3dState.RUNNING) return;

      this.state = Game3dState.LOSE;
      this.inTransition = true;
      this.container.setLoseState();

      // Setup UI
      this.gs.header.hide();
      this.gs.showLoseBar();
      this.am.losetune.play();
    };

    /**
     * Return current point/score
     * @method getCurrentScore
     */
    Game3d.prototype.getCurrentScore = function() {
      return this.cc.coin;
    };

    /**
     * Resize game
     * @method resize
     */
    Game3d.prototype.resize = function(rw, rh) {

      this.width = rw;
      this.height = rh;
      this.camera.aspect = rw / rh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(rw, rh);
      this.resizeHandler();
      this.camera.position.z = 40;
      this.f3ds.changeRegion(rw, rh);
    };

    /**
     * Override resizeHandler
     * @method resizeHandler
     */
    Game3d.prototype.resizeHandler = function(e) {

      BaseApp.prototype.resizeHandler.call(this);
      this.setCameraMatchProjection();
    };

    /**
     * Show this element
     * @method show
     */
    Game3d.prototype.show = function() {
      this.el.style.display = 'block';
    };

    /**
     * Hide this element
     * @method hide
     */
    Game3d.prototype.hide = function() {
      this.el.style.display = 'none';
    };

    /**
     * Destroy the game component and save resoureces
     * @method destroy
     */
    Game3d.prototype.destroy = function() {

    };

    return Game3d;

  });


/**
 * @author  raizensoft.com
 */
define('rs/pru3d/screen/GameScreen',[
  'rs/game/ImagePanel',
  'rs/pru3d/ReadyPanel',
  'rs/pru3d/ui/GameOverPanel',
  'rs/pru3d/ui/HelpPanel',
  'rs/pru3d/ui/GameScreenButtonBar',
  'rs/pru3d/ui/GameScreenWonBar',
  'rs/pru3d/ui/GameScreenLoseBar',
  'rs/pru3d/ui/GameScreenHeader',
  'rs/pru3d/Game3d'],
  function(
    ImagePanel,
    ReadyPanel,
    GameOverPanel,
    HelpPanel,
    GameScreenButtonBar,
    GameScreenWonBar,
    GameScreenLoseBar,
    GameScreenHeader,
    Game3d) {

    "use strict";

    /**
     * main Game screen
     * @class GameScreen
     * @constructor
     */
    function GameScreen(pru3d, config) {

      this.pru3d = pru3d;
      this.am = pru3d.assetManager;
      this.config = pru3d.config;
      this.init();
    }

    /**
     * Init game screen components
     * @method init
     */
    GameScreen.prototype.init = function() {

      // Root element
      var gs = this;
      var el = this.el = document.createElement('div');
      el.className = 'rs-gscreen';
      el.style.width = el.style.height = '100%';
      el.style.display = 'none';

      // Setup level data
      var level = this.config.data.level;
      this.levels = level;

      // Setup panels
      this.initPanel();

      // Header
      this.header = new GameScreenHeader(this);
      el.appendChild(this.header.el);
      
      // ButtonBar
      this.bbar = new GameScreenButtonBar(this);
      el.appendChild(this.bbar.el);

      // Wonbar
      this.wbar = new GameScreenWonBar(this);
      el.appendChild(this.wbar.el);

      // Wonbar
      this.lbar = new GameScreenLoseBar(this);
      el.appendChild(this.lbar.el);

      // Game3d
      this.game3d = new Game3d(this);
      el.appendChild(this.game3d.el);

      // Initial parameters
      this.currentLevel = 0;
    };

    /**
     * Init game panels
     * @method initPanel
     */
    GameScreen.prototype.initPanel = function() {

      var gs = this;

      // Image panel
      this.imagePanel = new ImagePanel(this.applyNewLevel.bind(this));

      // Ready panel
      this.rpanel = new ReadyPanel(this);

      // Game over panel
      this.gopanel = new GameOverPanel(this);

      // Help Panel
      this.hpanel = new HelpPanel(function() {
        gs.game3d.restoreLastState();
      });
    };

    /**
     * Load a level index
     * @method loadLevel
     */
    GameScreen.prototype.loadLevel = function(levelIndex) {

      const gs = this;

      // Hide current panels
      this.gopanel.hide();
      this.rpanel.hide();
      this.wbar.hide();
      this.lbar.hide();

      // Show active bar
      this.showButtonBar();

      // Show preloader
      this.pru3d.showPreloader();

      function onLoadCallback () {

        gs.pru3d.hidePreloader();
        gs.reset();
        gs.header.levelBtn.setLevel(levelIndex + 1);
        gs.rpanel.countDown(function() {

          var g3d = gs.game3d;
          if (g3d.isReadyState())
            g3d.setRunningState();
          else 
          if (g3d.isPauseState()) {
            g3d.setRunningState();
            g3d.setPauseState();
          }
        });
      }

      this.game3d.loadLevel(levelIndex, onLoadCallback);
      this.currentLevel = levelIndex;
    };

    /**
     * Replay current level
     * @method replay
     */
    GameScreen.prototype.replayLevel = function() {
      this.loadLevel(this.currentLevel);
    };

    /**
     * Load next level
     * @method nextLevel
     */
    GameScreen.prototype.nextLevel = function() {

      // Hide current board
      var index = this.currentLevel + 1;

      // Back to level 0
      if (index == this.levels.length)
        index = 0;
      this.loadLevel(index);
    };

    /**
     * Unlock the next level
     * @method unlockNextLevel
     */
    GameScreen.prototype.unlockNextLevel = function() {

      var index = this.currentLevel + 1;

      // Back to level 0
      if (index < this.levels.length) {
        this.pru3d.pref.saveUnlock(index);
      }
    };

    /**
     * Return current image path
     * @method getCurrentImagePath
     */
    GameScreen.prototype.getCurrentImagePath = function() {

      var cat = this.levels[this.currentCategory];
      var path = cat.content[this.currentLevel].path;
      if (path == undefined)
        path = this.game3d.container.puzzleBoard.dataUrl;
      return path;
    };

    /**
     * Reset meta components
     * @method reset
     */
    GameScreen.prototype.reset = function() {

      this.header.hbar.reset();
      this.game3d.cc.reset();
    };

    /**
     * Show game screen
     * @method show
     */
    GameScreen.prototype.applyNewLevel = function(level) {

      this.currentCategory = 0;
      this.pru3d.root.appendChild(this.el);
      this.transitionIn();
      const d = this.pru3d.getAppDimension();
      this.game3d.resize(d[0], d[1]);
      this.game3d.startRendering();
      if (level == undefined) level = 0;
      this.loadLevel(level);
    };

    /**
     * Show game screen
     * @method show
     */
    GameScreen.prototype.show = function() {
     this.imagePanel.show('assets/graphics/tutor.png');
    };

    /**
     * Hide game screen
     * @method hide
     */
    GameScreen.prototype.hide = function() {

      this.pru3d.root.removeChild(this.el);
      this.game3d.stopRendering();
    };

    /**
     * Show game won bar
     * @method showWonBar
     */
    GameScreen.prototype.showWonBar = function() {

      this.bbar.hide();
      var wbar = this.wbar;
      setTimeout(function() {
        wbar.show("LEVEL PASSED");
      }, 400);
    };

    /**
     * Show game lose bar
     * @method showLoseBar
     */
    GameScreen.prototype.showLoseBar = function() {

      this.bbar.hide();
      var lbar = this.lbar;
      setTimeout(function() {
        lbar.show("Game Over");
      }, 400);
      this.pru3d.pref.saveBestScore(this.game3d.cc.coin);
      this.gopanel.show();
    };

    /**
     * Get best score
     */
    GameScreen.prototype.getBestScore = function() {
      return this.game3d.cc.coin;
    };

    /**
     * Show button bar
     * @method showButtonBar
     */
    GameScreen.prototype.showButtonBar = function() {

      this.wbar.hide();
      var bbar = this.bbar;
      setTimeout(function() {
        bbar.show();
      }, 400);
    };

    /**
     * Transition in
     * @method transitionIn
     */
    GameScreen.prototype.transitionIn = function() {

      this.el.style.display = 'block';
    };

    /**
     * Transition out
     * @method transitionOut
     */
    GameScreen.prototype.transitionOut = function() {

    };

    /**
     * Resizing handler
     * @method resize
     */
    GameScreen.prototype.resize = function(rw, rh) {
      this.game3d.resize(rw, rh);
    };

    /**
     * Start counter
     * @method startCounter
     */
    GameScreen.prototype.startCounter = function() {
      this.header.dbar.start();
    };

    /**
     * Dispose resources
     * @method dispose
     */
    GameScreen.prototype.dispose = function() {

    };

    return GameScreen;
  });


/**
 * @author  raizensoft.com
 */
define('rs/ui/RingPreloader',[
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



/**
 * @author  raizensoft.com
 */
define('rs/pru3d/PirateRun',[
  'rs/pru3d/Preferences', 
  'rs/pru3d/AssetManager', 
  'rs/pru3d/screen/HomeScreen', 
  'rs/pru3d/screen/GameScreen', 
  'rs/ui/RingPreloader', 
  'rs/utils/ObjectUtil', 
  'rs/utils/BrowserUtil'],

  function(
    Preferences, 
    AssetManager, 
    HomeScreen, 
    GameScreen, 
    RingPreloader,
    ObjectUtil,
    BrowserUtil) {

    "use strict";

    const RESIZE_TIMEOUT = 200;
    const CONFIG_PATH = "config.json";

    function PirateRun(input, options) {

      // Load main config.json
      this.loadConfig();

      // Mobile setup
      this.isMobile = BrowserUtil.isMobile();

      // Init default options
      this.defaultOptions = {
        blockSize:16,
        sceneColor:0x2b2b2b,
        fitFactor:1,
        ambientLight:0xffffff,
        verticalShift:-20,
        shearAngle:25,
        lightMovingSpeed:3,
        pirateSpeed:140,
        enemySpeed:185,
        maxHealth:3
      };

      options = options || {};
      ObjectUtil.merge(options, this.defaultOptions);

      // Setup root reference
      this.root = input;
      BrowserUtil.css(this.root,{
        position:'relative',
        display:'block',
        overflow:'hidden'
      });

      // Setup gallery resize handler
      const pru3d = this;
      window.addEventListener('resize', function() {
        pru3d.resize();
      });

      // Set up background music on mobile devices
      document.body.addEventListener('click', function(e) {

        //var bgSound = pru3d.assetManager.bgSound;
        //bgSound.context.resume();
        //if (bgSound && !bgSound.isPlaying) {
          //bgSound.play();
        //}
      });
    }

    /**
     * Load configurations
     * @method loadConfig
     */
    PirateRun.prototype.loadConfig = function() {

      // Load main config.json
      var pru3d = this;
      var req = new XMLHttpRequest();
      req.addEventListener("load", function(e) {

        var result = JSON.parse(this.response);
        pru3d.config = result;
        pru3d.initComponents();
      });
      req.open("GET", CONFIG_PATH);
      req.send();
    };

    /**
     * Init compponents
     * @method initComponent
     */
    PirateRun.prototype.initComponents = function() {

      const pru3d = this;
      const dopt = this.defaultOptions;
      const config = this.config;

      // Preferences
      this.initPreferences();
      
      // GameAI
      this.initGameAI();

      // Preloader
      this.initPreloader();

      // Default screen
      this.activeScreen = null;

      // Asset managers
      this.assetManager = new AssetManager(this);

      if (window.location.search.includes('bypass'))  {

        this.assetManager.onLoad = function() {
          pru3d.setGameScreen();
        };
        this.assetManager.load();
      }
      else
      // Home Screen as default screen
      this.setHomeScreen();

      // Force resize on intialization
      setTimeout(function() {
        pru3d.resize();
      }, RESIZE_TIMEOUT);
    };

    /**
     * Initialize preferences
     * @method initPreferences
     */
    PirateRun.prototype.initPreferences = function() {
      this.pref = new Preferences(this.config, localStorage.getItem("PirateRun"));
    };

    /**
     * Init Game AI
     * @method initGameAI
     */
    PirateRun.prototype.initGameAI = function() {
    };

    /**
     * Init preloader component
     * @method initPreloader
     */
    PirateRun.prototype.initPreloader = function() {

      var rp = new RingPreloader({borderColor:'#ccc'});
      var el = rp.el;
      this.preloader = el;
      el.style.top = '50%';
    };

    /**
     * Show preloader
     * @method showPreloader
     */
    PirateRun.prototype.showPreloader = function() {
      this.root.appendChild(this.preloader);
    };

    /**
     * Hide preloader
     * @method hidePreloader
     */
    PirateRun.prototype.hidePreloader = function() {
      if (this.root.contains(this.preloader))
        this.root.removeChild(this.preloader);
    };

    /**
     * Init fullscreen functionalities
     * @method initFullcreen
     */
    PirateRun.prototype.initFullcreen = function() {

      // Fullscreen button
      const pru3d = this;
      this.fsbtn = new FullscreenButton(this.root, function(e) {
        console.log('fullsceen change');
      });
      this.root.appendChild(this.fsbtn.el);
    };

    /**
     * Shortcut to root element addEventListener method
     * @method addEventListener
     */
    PirateRun.prototype.addEventListener = function(event, listener) {
      this.root.addEventListener(event, listener);
    };

    /**
     * Set active screen
     * @method setScreen
     */
    PirateRun.prototype.setScreen = function(screen) {

      if (this.activeScreen) {
        this.activeScreen.hide();
      };
      screen.show();
      this.activeScreen = screen;
    };

    /**
     * Set active game screen
     * @method setGameScreen
     */
    PirateRun.prototype.setGameScreen = function() {

      if (!this.gameScreen) {
        this.gameScreen = new GameScreen(this);
      }
      this.setScreen(this.gameScreen);
    };

    /**
     * Set home screen as active screen
     * @method setHomeScreen
     */
    PirateRun.prototype.setHomeScreen = function() {

      if (!this.homeScreen)
        this.homeScreen = new HomeScreen(this);
      this.setScreen(this.homeScreen);
    };

    /**
     * Dispose resources
     * @method dispose
     */
    PirateRun.prototype.dispose = function() {

    };

    /**
     * Resize handler
     * @method resize
     */
    PirateRun.prototype.resize = function() {

      var d = this.getAppDimension();
      var rw = d[0], rh = d[1];
      if (this.activeScreen)
        this.activeScreen.resize(rw, rh);
    };

    /**
     * Return current app dimension
     * @method getAppDimension
     */
    PirateRun.prototype.getAppDimension = function() {

      var cs = BrowserUtil.computeStyle;
      var bo = cs(this.root, 'borderTopWidth');
      var rw = cs(this.root, 'width') - 2 * bo;
      var rh = cs(this.root, 'height') - 2 * bo;
      return [rw, rh];
    };

    return PirateRun;

  });


  window.PirateRun = require('rs/pru3d/PirateRun');
})();
