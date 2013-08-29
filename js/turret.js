var Turret = function(pubSub, sprite) {
  this.pubSub = pubSub;
  this.sprite = sprite;
  this.x = null;
  this.y = null;
  this.z = null;
  this.w = this.sprite.w;
  this.h = this.sprite.h;
  this.beenHit = false;
  this.destroyed = false;
};

Turret.addMixin(TwoDim);

Turret.prototype.draw = function(ctx) {
  ctx.drawImage(
    this.sprite.imgEl,
    this.sprite.x, this.sprite.y,
    this.sprite.w, this.sprite.h,
    this.x, this.y,
    this.sprite.w, this.sprite.h
  );
};

Turret.prototype.clear = function(ctx) {
  ctx.fillRect(this.x, this.y-1, this.sprite.w, this.sprite.h);
};

Turret.prototype.update = function(ctx) {
  if(this.destroyed) return;
  this.clear(ctx);
  if(this.beenHit) {
    this.destroyed = true;
    this.publish("turret", {subject: 'destroyed', turret: this});
  }
  else {
    this.x += this.dx;
    this.draw(ctx);
  }
};

Turret.prototype.hit = function(ctx) {
  this.beenHit = true;
};

Turret.prototype.publish = function(channel, payload) {
  if(typeof(this.pubSub) !== 'undefined')
    this.pubSub.publish(channel, payload);
};


