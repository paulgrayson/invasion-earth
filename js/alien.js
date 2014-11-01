var Alien = function(pubSub, row, sprite1, sprite2) {
  this.sprite = sprite1;
  this.row = row;
  this.w = this.sprite.w;
  this.h = this.sprite.h;
  this.sprites = [sprite1, sprite2];
  this.pubSub = pubSub;
  this.x = null;
  this.y = null;
  this.z = null;
  this.dx = 4;
  this.dy = 16;
  this.tdy = 0;
  this.frame = 0;
  this.change = 8;
  this.beenHit = false;
  this.scale = 1;
  this.destroyed = false;
};

Alien.addMixin(TwoDim);

Alien.prototype.draw = function(ctx, scale) {
  var sprite = this.sprites[Math.floor(this.frame/this.change)];
  scale = scale || 1;
  var ax = sprite.w * 0.5 * (1 - scale);
  var ay = sprite.h * 0.5 * (1 - scale);
  ctx.drawImage(
    sprite.imgEl,
    sprite.x, sprite.y,
    sprite.w, sprite.h,
    this.x + ax, this.y + ay,
    sprite.w * scale, sprite.h * scale
  );
};

Alien.prototype.clear = function(ctx) {
  ctx.fillRect(this.x, this.y-1, this.sprite.w, this.sprite.h+2);
};

Alien.prototype.update = function(ctx) {
  if(this.destroyed) return;
  this.clear(ctx);
  this.frame = (this.frame + 1) % (this.sprites.length*this.change);
  if(this.beenHit) {
    this.scale *= 0.6;
    if(this.scale < 0.1) {
      this.scale = 0;
      this.publish("aliens", {subject: 'destroyed', row: this.row, alien: this});
      this.destroyed = true;
    }
  }
  if(this.scale > 0) {
    this.updateCoord();
    this.draw(ctx, this.scale);
  }
};

Alien.prototype.publish = function(channel, payload) {
  if(typeof this.pubSub !== undefined)
    this.pubSub.publish(channel, payload);
};

Alien.prototype.updateCoord = function() {
  this.x += this.dx;
  this.y += this.tdy;
  this.tdy = 8 * Math.sin(this.x/10);
  this.y -= this.tdy;
  this.y += this.dy;
};

Alien.prototype.hit = function(ctx) {
  this.beenHit = true;
};

