// source is usually window
var KeyHandler = function(source) {
  this.keyState = {};
  this.callbacks = {};
  source.onkeydown = this.onkeydown(this.keyState, this.callbacks);
  source.onkeyup = this.onkeyup(this.keyState);
};

KeyHandler.prototype.onkeydown = function(keyState, callbacks) {
  return function(e) {
    keyState[e.keyCode] = 'keydown';
    if(typeof(callbacks[e.keyCode]) !== 'undefined') {
      _.each(callbacks[e.keyCode], function(cb) {
        cb(e);
      });
      callbacks[e.keyCode] = undefined;
    }
  }
};

KeyHandler.prototype.onkeyup = function(keyState) {
  return function(e) {
    keyState[e.keyCode] = null;
  }
};

KeyHandler.prototype.isDown = function(keyCode) {
  var state = this.keyState[keyCode];
  return (typeof(state) !== 'undefined') && state != null;
};

KeyHandler.prototype.onceOnDown = function(keyCode, callback) {
  this.callbacks[keyCode] = this.callbacks[keyCode] || [];
  this.callbacks[keyCode].push(callback);
};

