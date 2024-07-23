
/**
 * @author  rtr | www.raizensoft.com
 * 
 */
define([
  'rs/utils/BrowserUtil'
],
  (function(BrowserUtil) {

    "use strict";

    var pf = BrowserUtil.getPrefix();

    var map = {
      rotate:'deg',
      rotateX:'deg',
      rotateY:'deg',
      rotateZ:'deg',
      translateX:'px',
      translateY:'px',
      translateZ:'px',
      scale:'',
      scaleX:'',
      scaleY:'',
      skew:'deg',
      skewX:'deg',
      skewY:'deg'
    };

    function applyStyle (options) {

      var s = '';
      var props = '';

      if ('transformExpression' in options) {
        s = options.transformExpression + ' ';
      }

      for (var key in options)
      {
        if (key in map) {
          s = s + key + '(' + options[key] + map[key] + ')' + ' ';
        } 
        else
          if (key != 'start' && key != 'transformExpression')
          {
            if (props !=='') props += ', ' + key; else props += key;
            $(this).css(key, options[key]); //TODO remove jquery
          }
      }

      if (s !== '') { 

        if (this.style.transform !== undefined) {
          this.style.transform = s;
          if (props !== '') props += ', transform'; else props = 'transform';
        } 
        else { 

          this.style[pf + "Transform"] = s;
          var p = '-' + pf.toLowerCase() + '-transform'; 
          if (props !=='') props += ', ' + p ; else props = p;
        }
      }

      return props;
    }

    /**
     * Tween uses CSS transition
     * @class
     *
     */
    var Tween = function(e, options, duration, easing, delay) {

      if (!duration) duration = 1;
      if (!easing) easing = 'ease-out';
      if (!delay) delay = 0;

      if (options.start) applyStyle.call(e, options.start);
      clearTimeout(e.fwtweenID);

      var pre;
      if (e.style.transition !== undefined) 
        pre = 'transition'; 
      else 
        //pre = BrowserUtil.getPrefix() + 'Transition';
        pre = pf + 'Transition';

      setTimeout(function() {

        e.style[pre + 'Property'] = applyStyle.call(e, options);
        e.style[pre + 'TimingFunction'] = easing;
        e.style[pre + 'Duration'] = duration + 's';
        e.style[pre + 'Delay'] = delay + 's';
      }, 10);

      // remove transition
      e.fwtweenID = setTimeout(function() {

        e.style[pre + 'Property'] = '';
        e.style[pre + 'Duration'] = '0s'; 
      }, (duration + delay) * 1000);

      return this;
    };

    return Tween;

  }));
