var Game = function(width, height,
                    touchable, keyHandler, touchHandler, canvas, sheet, explosion, scoreEl,
                    fireAu, explosion6Au, blip1Au, blip2Au, deathAu, wonAu,
                    pubSub) {
  this.touchable = touchable;
  this.keyHandler = keyHandler;
  this.touchHandler = touchHandler;
  this.canvas = canvas;
  this.canvas.width = width;
  this.canvas.height = height;
  this.ctx = canvas.getContext("2d");
  this.sheet = sheet;
  this.explosion = explosion;
  this.pubSub = pubSub;
  this.scoreEl = scoreEl;
  this.fireAu = fireAu;
  this.explosion6Au = explosion6Au;
  this.blip1Au = blip1Au;
  this.blip2Au = blip2Au;
  this.deathAu = deathAu;
  this.wonAu = wonAu;
  this.bulletPool = new Pool(100);
};

Game.prototype.warmBulletPool = function() {
  for(var i = 0; i < 20; i++) {
    var bullet = new Bullet(this.pubSub, this.sheet.spriteFor("bullet"));
    this.bulletPool.give(bullet);
  }
};

Game.prototype.start = function() {
  this.bullets = [];
//  this.warmBulletPool();
  this.turret = null;
  this.swarm = null;
  this.score = 0;
  this.gameOver = false;
  this.didWin = false;
  this.pubSub.reset();
  this.subscribeToGameEvents(this.pubSub);
  this.swarm = new Swarm(this.canvas, this.sheet, this.blip1Au, this.blip2Au, this.pubSub); 
  this.clearCanvas();
  this.updateScoreView();
  this.turret = this.createTurret();
  this.createTicker(this.swarmUpdate, this.turretUpdate, this.bulletsUpdate);
};

Game.prototype.subscribeToGameEvents = function(pubSub) {
  var self = this;
  pubSub.subscribe('swarm', function(payload) {self.processSwarmEvent.call(self, payload)});
  pubSub.subscribe('bullets', function(payload) {self.processBulletsEvent.call(self, payload)});
  pubSub.subscribe('aliens', function(payload) {self.processAliensEvent.call(self, payload)});
  pubSub.subscribe('turret', function(payload) {self.processTurretEvent.call(self, payload)});
};

Game.prototype.clearCanvas = function() {
  this.ctx.fillStyle = "#bbccff";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

Game.prototype.createTicker = function(swarmUpdate, turretUpdate, bulletsUpdate) {
  var count = 0;
  var self = this;
  self.ticksSinceLastFire = 0;
  var animateInterval = setInterval(function() {
    swarmUpdate(self);
    turretUpdate(self);
    bulletsUpdate(self);
    count += 1;
    self.ticksSinceLastFire += 1;
    if(self.hasSwarmReachedTurret()) {
      self.gameOver = true;
      self.didWin = false;
    }
    if(self.gameOver) {
      self.stopGame(animateInterval);
      self.offerStartNewGame();
    }
  }, 33);
};

Game.prototype.offerStartNewGame = function() {
  var self = this;
  if(self.touchable) {
    self.touchHandler.onceTouchEnd(function(e) {
      self.touchHandler.onceTouchStart(function(e) {
        self.start.call(self);
      });
    });
  }
  else {
    self.keyHandler.onceOnDown(83, function(e) {
      if(e.keyCode == 83) self.start.call(self);
    });
  }
};

Game.prototype.stopGame = function(animateInterval) {
  clearInterval(animateInterval);
  this.gameFinished();
  this.pubSub.unsubscribeAll('swarm');
  this.pubSub.unsubscribeAll('bullets');
  this.pubSub.unsubscribeAll('aliens');
  this.pubSub.unsubscribeAll('turret');
};

Game.prototype.hasSwarmReachedTurret = function() {
  return this.swarm.bounds().y2 >= this.turret.bounds().y1;
};

Game.prototype.gameFinished = function() {
  var self = this;
  if(this.didWin) {
    this.wonAu.play();
  }
  else {
    this.deathAu.play();
  }
  _.each(this.bullets, function(bullet) { bullet.clear(self.ctx) });
  this.showAnimateUserWonLost();
};

Game.prototype.showAnimateUserWonLost = function() {
  var self = this;
  var scale = 0.2;
  var bckImgData = self.ctx.getImageData(0, 0, canvas.width, canvas.height); 
  var interval = setInterval(function() {
    self.ctx.putImageData(bckImgData, 0, 0);
    self.drawWonLost(self.touchable, self.didWin, self.ctx, self.canvas, scale);
    scale += 0.1;
    if(scale > 1.0) clearInterval(interval);
  }, 20);
};

Game.prototype.drawWonLost = function(touchable, didWin, ctx, canvas, scale) {
  ctx.fillStyle = didWin ? "#3d4" : "#f33";
  ctx.font = ""+ (68*scale) +"pt Impact";
  var text = "GAME OVER";
  var width = ctx.measureText(text).width;
  ctx.fillText(
    text,
    (canvas.width-width)*0.5,
    canvas.height*0.4,
    width
  );
  ctx.font = ""+ (88*scale) +"pt Impact";
  text = didWin ? "WINNER!" : "LOSER!";
  width = ctx.measureText(text).width;
  ctx.fillText(
    text,
    (canvas.width-width)*0.5,
    canvas.height*0.6,
    width
  );
  text = touchable ? "Touch to play again" : "Press 's' to play again";
  ctx.font = ""+ (32*scale) +"pt Arial";
  width = ctx.measureText(text).width;
  ctx.fillStyle = "#000";
  ctx.fillText(
    text,
    (canvas.width-width)*0.5,
    canvas.height*0.9,
    width
  );
};

Game.prototype.swarmUpdate = function(self) {
  self.swarm.update(self.ctx)
};

Game.prototype.bulletsUpdate = function(self) {
  for(var i = 0; i < self.bullets.length; i++) {
    self.bullets[i].update(self.ctx);
  }
  self.swarm.anyBulletsHit(self.ctx, self.bullets, self.turret);
  self.bullets = self.pruneDeadBullets(self.bullets);
};

Game.prototype.turretUpdate = function(self) {
  var dx = 0;
  var firing = false;
  if(self.keyHandler.isDown(32) || self.touchHandler.isTouching()) firing = true;
  if(self.keyHandler.isDown(37)) dx = -8;
  if(self.keyHandler.isDown(39)) dx = 8;
  if(self.touchHandler.isTouching() && self.touchHandler.touchDirectionX() < 0) dx = -4;
  if(self.touchHandler.isTouching() && self.touchHandler.touchDirectionX() > 0) dx = 4;
  self.turret.dx = dx;
  var bounds = self.turret.bounds();
  if(dx > 0 && bounds.x2 >= self.canvas.width) self.turret.dx = 0;
  if(dx < 0 && bounds.x1 <= 0) self.turret.dx = 0;
  self.turret.update(self.ctx);
  if(firing) self.fire(self.turret);
};

Game.prototype.createTurret = function() {
  var turret = new Turret(this.pubSub, this.sheet.spriteFor("turret"));
  turret.setCoord(this.canvas.width/2, this.canvas.height - turret.h*2);
  turret.draw(this.ctx);
  return turret;
};

Game.prototype.fire = function(turret) {
  if(this.ticksSinceLastFire >= 6) {
    var bullet = this.createBullet(turret);
    this.bullets.push(bullet);
    this.fireAu.play();
    this.ticksSinceLastFire = 0;
  }
};

Game.prototype.createBullet = function(turret) {
  var self = this;
// TODO fix problem with pool occassionally resulting in no bullet  
//  var bullet = this.bulletPool.take(function() {
//    return new Bullet(self.pubSub, self.sheet.spriteFor("bullet"));
//  });
  var bullet = new Bullet(self.pubSub, self.sheet.spriteFor("bullet"));
  bullet.setCoord(turret.x + 14, turret.y-4);
  bullet.dy = -8;
  return bullet;
};

Game.prototype.isCompletelyOffScreen = function(canvas, bounds) {
  var w = canvas.width, h = canvas.height;
  return bounds.x2 < 0 || bounds.x1 > w || bounds.y1 > h || bounds.y2 < 0;
};

Game.prototype.pruneDeadBullets = function(bullets) {
  var self = this;
  return _.reject(bullets, function(bullet) {
    var off = self.isCompletelyOffScreen(self.canvas, bullet.bounds());
    if(off) self.bulletPool.give(bullet);
    return off;
  });
};

Game.prototype.processAliensEvent = function(payload) {
  if(payload.subject === 'destroyed') {
    this.explosion6Au.play();
    this.score += 10 + 2 * payload.row;
    // TODO better if score view subscribed to score events and we emit a score event here
    this.updateScoreView();
  }
};

Game.prototype.updateScoreView = function() {
  this.scoreEl.innerHTML = ""+ this.score;
};

Game.prototype.processSwarmEvent = function(payload) {
  if(payload.subject === 'destroyed') {
    this.gameOver = true;
    this.didWin = true;
  }
};

Game.prototype.processBulletsEvent = function(payload) {
  if(payload.subject == 'destroyed') {
    this.bullets = _.difference(this.bullets, [payload.bullet]);
    this.bulletPool.give(payload.bullet);
  }
};

Game.prototype.processTurretEvent = function(payload) {
  if(payload.subject == 'destroyed') {
    this.gameOver = true;
    this.didWin = false;
  }
};


