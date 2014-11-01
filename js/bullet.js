var Bullet = function(pubSub, sprite) {
  this.pubSub = pubSub;
  this.sprite = sprite;
  this.x = null;
  this.y = null;
  this.z = null;
  this.w = this.sprite.w;
  this.h = this.sprite.h;
  this.hasHit = false;
  this.destroyed = false;
};

Bullet.addMixin(TwoDim);

Bullet.prototype.draw = function(ctx) {
  ctx.drawImage(
    this.sprite.imgEl,
    this.sprite.x, this.sprite.y,
    this.sprite.w, this.sprite.h,
    this.x, this.y,
    this.sprite.w, this.sprite.h
  );
};

Bullet.prototype.clear = function(ctx) {
  ctx.fillRect(this.x, this.y-1, this.sprite.w, this.sprite.h+1);
};

Bullet.prototype.update = function(ctx) {
  if(this.destroyed) return;
  this.clear(ctx);
  if(this.hasHit) {
    this.destroyed = true;
    this.publish("bullets", {subject: 'destroyed', bullet: this});
  }
  else {
    this.y += this.dy;
    this.draw(ctx);
  }
};

Bullet.prototype.hit = function(ctx) {
  this.hasHit = true;
};

Bullet.prototype.publish = function(channel, payload) {
  if(typeof(this.pubSub) !== 'undefined')
    this.pubSub.publish(channel, payload);
};



