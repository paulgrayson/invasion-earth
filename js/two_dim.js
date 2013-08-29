var TwoDim = {

  /* Mixed in object needs:
  x: null,
  y: null,
  z: null,
  w: null,
  h: null,
  */

  bounds: function() {
    return {
      x1: this.x,
      x2: this.x + this.w,
      y1: this.y,
      y2: this.y + this.h
    }
  },

  setCoord: function(x, y, z) {
    if(typeof(z) === undefined) z = 0;
    this.x = x;
    this.y = y;
    this.z = z;
  },

  isIntersecting: function(bounds) {
    var b1 = this.bounds();
    return this.isContaining(b1, bounds.x1, bounds.y1)
      || this.isContaining(b1, bounds.x2, bounds.y1)
      || this.isContaining(b1, bounds.x1, bounds.y2)
      || this.isContaining(b1, bounds.x2, bounds.y2);
  },

  isContaining: function(bounds, x, y) {
    return x >= bounds.x1 && x <= bounds.x2
      && y >= bounds.y1 && y <= bounds.y2;
  }

};


