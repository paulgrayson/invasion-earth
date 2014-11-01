
var Sheet = function(imageEl) {
  this.imageEl = imageEl;
};

Sheet.prototype.load = function(callback) {
  this.imageEl.onload = callback;
  this.imageEl.setAttribute('src', this.imageEl.getAttribute('data-src'));
};

Sheet.prototype.onImageLoaded = function() {
  this.isLoaded = true;
};

// Get everything needed to draw the sprite with the specified name
Sheet.prototype.spriteFor = function(name) {
  // TODO actually look this stuff up somewhere..
  if(name == "alien") {
    return {
      name: name, x: 8, y: 8, w: 32, h: 32, imgEl: this.imageEl
    }
  }
  else if(name == "alien1") {
    return {
      name: name, x: 12+32, y: 8, w: 34, h: 30, imgEl: this.imageEl
    }
  }
  else if(name == "alien2") {
    return {
      name: name, x:24+32, y:12+32, w: 34, h: 30, imgEl: this.imageEl
    }
  }
  else if(name == "turret") {
    return {
      name: name, x: 24+32, y: 24+32*2, w: 32, h: 32, imgEl: this.imageEl
    }
  }
  else if(name == "bullet") {
    return {
      name: name, x: 6, y: 28+32*3, w: 2,  h: 10, imgEl: this.imageEl
    }
  }
  return null;
};

