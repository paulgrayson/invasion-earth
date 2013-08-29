var TouchHandler = function(source) {
  this.touching = false;
  this.startCallbacks = [];
  this.endCallbacks = [];
  this.previousTouchX = null;
  this.lastTouchX = null;
  source.addEventListener('touchmove', this.touchMove(), false);
  source.addEventListener('touchstart', this.touchStart(), false);
  source.addEventListener('touchend', this.touchEnd(), false);
};

TouchHandler.prototype.touchStart = function() {
  var self = this;
  return function(e) {
    self.touching = true;
    self.previousTouchX = self.lastTouchX;
    self.lastTouchX = e.changedTouches[0].screenX;
    e.preventDefault();
    if(self.startCallbacks.length > 0) {
      _.each(self.startCallbacks, function(cb) {
        cb(e);
      });
      self.startCallbacks = [];
    }
  }
};

TouchHandler.prototype.touchEnd = function() {
  var self = this;
  return function(e) {
    self.touching = false;
    self.previousTouchX = self.lastTouchX;
    self.lastTouchX = e.changedTouches[0].screenX;
    e.preventDefault();
    if(self.endCallbacks.length > 0) {
      _.each(self.endCallbacks, function(cb) {
        cb(e);
      });
      self.endCallbacks = [];
    }
  }
};

TouchHandler.prototype.touchMove = function() {
  var self = this;
  return function(e) {
    self.touching = true;
    self.previousTouchX = self.lastTouchX;
    self.lastTouchX = e.changedTouches[0].screenX;
    e.preventDefault();
  }
};

TouchHandler.prototype.isTouching = function() {
  return this.touching;
};

TouchHandler.prototype.onceTouchStart = function(callback) {
  this.startCallbacks.push(callback);
};

TouchHandler.prototype.onceTouchEnd = function(callback) {
  this.endCallbacks.push(callback);
};

TouchHandler.prototype.touchDirectionX = function() {
  return this.lastTouchX - this.previousTouchX; 
};

