var miniViewObject = {
    selector: null,
    zoom: 0.03,
    viewZoom: 1,
    onZoom: null,
    refresh: function(config) {
      this.getParams(config);
      var selector = this.selector,
        p = ["webkit", "moz", "ms", "o"],
        oString = "left top";
  
      if (config && config.viewZoom) {
        this.viewZoom = config.viewZoom;
  
        if(this.onZoom) {
          this.onZoom(this.viewZoom);
        }
      }
  
      var el = $(selector).clone().removeAttr("style"),
        s = "scale(" + this.zoom + ")",
        parentDiv = $(selector).parent();
  
      for (var i = 0; i < p.length; i++) {
        el[0].style[p[i] + "Transform"] = s;
        el[0].style[p[i] + "TransformOrigin"] = oString
      }
  
      el[0].style["transform"] = s;
      el[0].style["transformOrigin"] = oString;
  
      $("#miniview " + selector + "Mini").remove();
      $("#miniview").append(el.attr("id", $(selector).attr("id") + "Mini").removeAttr("data-bind"));
  
      $("#minimap, #selectWin, #miniview").css({
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        width: $(selector).width() * this.zoom,
        height: $(selector).height() * this.zoom
      });
  
      $(".selectionWin").css({
        width: parentDiv.width() * this.zoom / this.viewZoom,
        height: parentDiv.height() * this.zoom / this.viewZoom
      });
  
      var selLeft = parseInt($(selector).css("left")),
          selTop = parseInt($(selector).css("top"));
      $(".selectionWin").css({
        left: -selLeft * this.zoom / this.viewZoom,
        top: -selTop * this.zoom / this.viewZoom
      })
    },
    getParams: function(config) {
      if (!config) return false;
      if (config.selector) this.selector = config.selector;
      if (config.zoom) this.zoom = config.zoom;
      if (config.viewZoom) this.viewZoom = config.viewZoom;
      if (config.onZoom) this.onZoom = config.onZoom;
    }
  };
  var setViewZoom = function(event, delta, deltaX, deltaY) {
    var el = event.delegateTarget,
        mousePosX = event.clientX - el.offsetLeft,
        mousePosY = event.clientY - el.offsetTop,
        origZoom = miniViewObject.viewZoom,
        zoom, elCurrLeft = parseInt($(el).css("left")),
        elCurrTop = parseInt($(el).css("top"));
  
    var maxZoom, minZoom;
    //minZoom = 1 - (($(miniViewObject.selector).width() - $(window).width()) / $(miniViewObject.selector).width());
    minZoom = 0.75;
    maxZoom = 1.25;
  
    if (delta > 0 && origZoom < maxZoom) zoom = origZoom + 0.05;
    else if (delta < 0 && origZoom > minZoom) zoom = origZoom - 0.05;
    else return false;
  
    var p = ["webkit", "moz", "ms", "o"],
        s = "scale(" + zoom + ")",
        oString = "left top";
  
    for (var i = 0; i < p.length; i++) {
      el.style[p[i] + "Transform"] = s;
      el.style[p[i] + "TransformOrigin"] = oString
    }
  
    el.style["transform"] = s;
    el.style["transformOrigin"] = oString;
  
    var leftDiff = mousePosX * (1 - zoom / origZoom),
      topDiff = mousePosY * (1 - zoom / origZoom),
      newPosLeft = elCurrLeft + leftDiff,
      newPostRight = elCurrTop + topDiff;
  
    newPosLeft > 0 ? $(el).css("left", 0) : $(el).css("left", newPosLeft);
    newPostRight > 0 ? $(el).css("top", 0) : $(el).css("top", newPostRight);
  
    //$(el).css("left", elCurrLeft + leftDiff);
    //$(el).css("top", elCurrTop + TopDiff);
  
    miniViewObject.refresh({
      viewZoom: zoom
    });
  
    return false;
  };
  window.MiniView = {
    init: function(config) {
      miniViewObject.getParams(config);
      var selector = config.selector;
      var parentDiv = $(selector).parent();
      parentDiv.after('<div id="minimap">' +
        '<div id="selectWin">' +
        '<div class="selectionWin"></div>' +
        '</div>' +
        '<div id="miniview"></div>' +
        '</div>');
  
      $(".selectionWin").draggable({
        containment: 'parent',
        drag: function() {
          var selectionLeft = parseInt($(".selectionWin").css("left")),
            selectionTop = parseInt($(".selectionWin").css("top"));
          $(miniViewObject.selector).css({
            left: -selectionLeft / (miniViewObject.zoom / miniViewObject.viewZoom),
            top: -selectionTop / (miniViewObject.zoom / miniViewObject.viewZoom)
          });
          //App.sb.updateMetrics();
        }
      });
  
      $(selector).mousewheel(function(event, delta, deltaX, deltaY) {
        setViewZoom(event, delta, deltaX, deltaY);
        return false;
      });
  
      miniViewObject.refresh();
      return miniViewObject;
    }
  }