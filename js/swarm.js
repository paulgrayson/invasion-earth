var Swarm = function(speed, canvas, sheet, blip1Au, blip2Au, pubSub) {
  this.canvas = canvas;
  this.sheet = sheet;
  this.pubSub = pubSub;
  this.aliens = [];
  this.bullets = [];
  this.createAliens();
  this.dx = speed;
  this.row = 0;
  this.blip1Au = blip1Au;
  this.blip2Au = blip2Au;
  this.blipPeriod = 18;
  this.countAtNextBlip = 0;
  this.nextBlipIdx= 0;
  this.blipAus = [this.blip1Au, this.blip2Au];
  _.each(this.blipAus, function(au) { au.volume = 0.2 });
  this.count = 0;
  this.bulletPool = new Pool(100);
  this.warmBulletPool();
};

Swarm.prototype.warmBulletPool = function() {
  for(var i = 0; i < 50; i++) {
    var bullet = new Bullet(this.pubSub, this.sheet.spriteFor("bullet"));
    this.bulletPool.give(bullet);
  }
};

Swarm.prototype.createAliens = function() {
  var sp1 = this.sheet.spriteFor('alien1');
  var sp2 = this.sheet.spriteFor('alien2');
  for(var c = 1; c < 8; c++) {
    for(var r = 1; r < 7; r++) {
      var alien = new Alien(this.pubSub, r, sp1, sp2);
      this.aliens.push(alien);
      var x = c * (32 + alien.sprite.w);
      var y = r * (8 + alien.sprite.h);
      alien.setCoord(x, y);
    }
  }
  var self = this;
  this.pubSub.subscribe("aliens", function(payload) {
    if(payload.subject == 'destroyed') {
      self.aliens = _.difference(self.aliens, [payload.alien]);
    }
  });
};

Swarm.prototype.update = function(ctx) {
  if(this.aliens.length == 0 ) {
    this.swarmDestroyed();
    return;
  }
  var last = this.aliens.last();
  var dy = 0;
  var lastBounds = last.bounds();
  if((lastBounds.x2+this.dx) >= this.canvas.width) {
    this.row += 1;
    this.dx *= -1;
    if(this.row % 4 == 0) {
      this.dx -= 1;
      this.blipPeriod -= 2;
      this.blip1Au.volume += 0.2;
    }
    dy = 8;
  }
  else if((this.aliens[0].x+this.dx) <= 0) {
    this.row += 1;
    this.dx *= -1;
    if(this.row % 4 == 0) {
      this.dx += 1;
      this.blipPeriod -= 2;
      this.blip1Au.volume += 0.2;
    }
    dy = 8
  }
  for(var i=0; i < this.aliens.length; i++) {
    this.aliens[i].dx = this.dx;
    this.aliens[i].dy = dy;
    this.aliens[i].update(ctx);
  }
  if(Math.random()*100 >= (90-this.row*4)) {
    var i = Math.floor(Math.random()*(this.aliens.length-1));
    var bullet = this.createBullet(this.aliens[i]);
    this.bullets.push(bullet);
  }
  this.bullets = this.pruneDeadBullets(this.bullets);
  for(var i = 0; i < this.bullets.length; i++) {
    this.bullets[i].update(ctx);
  }
  if(this.count == this.countAtNextBlip) {
    this.blipAus[this.nextBlipIdx].play();
    this.nextBlipIdx = (this.nextBlipIdx + 1) % this.blipAus.length;
    this.countAtNextBlip = this.count + this.blipPeriod;
  }
  this.count += 1;
};

Swarm.prototype.createBullet = function(alien) {
  var self = this;
  var bullet = this.bulletPool.take(function() {
    return new Bullet(self.pubSub, self.sheet.spriteFor("bullet"));
  });
  var bounds = alien.bounds();
  bullet.setCoord(bounds.x1 + 14, bounds.y2+4);
  bullet.dy = 6 + Math.floor(this.row / 3);
  return bullet;
};

Swarm.prototype.swarmDestroyed = function() {
  if(this.pubSub)
    this.pubSub.publish("swarm", {subject: 'destroyed', swarm: this});
};

Swarm.prototype.anyBulletsHit = function(ctx, bullets, turret) {
  var self = this;
  var hitBullets = [];
  var hitAliens = _.filter(self.aliens, function(alien) {
    var newHitBullets = _.filter(bullets, function(bullet) {
      return alien.isIntersecting(bullet.bounds());
    });
    hitBullets = _.union(hitBullets, newHitBullets);
    return newHitBullets.length > 0;
  });
  _.each(hitBullets, function(bullet) {
    bullet.hit(ctx);
  });
  _.each(hitAliens, function(alien) {
    alien.hit(ctx);
  });
  _.each(this.bullets, function(bullet) {
    if(turret.isIntersecting(bullet.bounds())) turret.hit(ctx);
  });
};

Swarm.prototype.isCompletelyOffScreen = function(canvas, bounds) {
  var w = canvas.width, h = canvas.height;
  return bounds.x2 < 0 || bounds.x1 > w || bounds.y1 > h || bounds.y2 < 0;
};

Swarm.prototype.pruneDeadBullets = function(bullets) {
  var self = this;
  return _.reject(bullets, function(bullet) {
    var off = self.isCompletelyOffScreen(self.canvas, bullet.bounds());
    if(off) self.bulletPool.give(bullet);
    return off;
  });
};

Swarm.prototype.bounds = function() {
  var b = {x1: null, x2: null, y1: null, y2: null};
  _.each(this.aliens, function(alien) {
    var a = alien.bounds();
    if(b.x1 == null || a.x1 < b.x1) b.x1 = a.x1;
    if(b.x2 == null || a.x2 > b.x2) b.x2 = a.x2;
    if(b.y1 == null || a.y1 < b.y1) b.y1 = a.y1;
    if(b.y2 == null || a.y2 > b.y2) b.y2 = a.y2;
  });
  return b;
};




