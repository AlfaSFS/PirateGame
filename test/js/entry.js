
// Setup baseUrl for source folder and library paths
requirejs.config({
  baseUrl:"../src/",
  paths:{
    libs:"../libs/"
  }
});

require(['rs/pru3d/PirateRun', 'libs/domReady'], 

  function(PirateRun, domReady) {
	console.log("Load test");
    "use strict";

    domReady(function() {

      var el = document.querySelector('.rs-pru3d');
      var pru3d = new PirateRun(el);
      window.pru3d = pru3d;
    });
  });
