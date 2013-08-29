Array.prototype.last = function() {
  return this[this.length-1];
};

Object.prototype.addMixin = function (mixin) {    
  for (var prop in mixin) {
    if (mixin.hasOwnProperty(prop)) {
      this.prototype[prop] = mixin[prop];
    }
  }
};


