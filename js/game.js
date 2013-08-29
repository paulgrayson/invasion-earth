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
};

Game.prototype.start = function() {
  this.bullets = [];
  this.turret = null;
  this.swarm = null;
  this.score = 0;
  this.gameOver = false;
  this.didWin = false;
  this.ctx.fillStyle = "#bbccff";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  var self = this;
  // TODO unsubscribe from previous start?
  this.pubSub.reset();
  self.pubSub.subscribe('swarm', function(payload) {self.processSwarmEvent.call(self, payload)});
  self.pubSub.subscribe("bullets", function(payload) {self.processBulletsEvent.call(self, payload)});
  self.pubSub.subscribe("aliens", function(payload) {self.processAliensEvent.call(self, payload)});
  self.swarm = new Swarm(self.canvas, self.sheet, self.blip1Au, self.blip2Au, self.pubSub); 
  self.updateScoreView();
  var turretUpdate = self.createTurret();
  self.pubSub.subscribe("turret", function(payload) {self.processTurretEvent.call(self, payload)});
  var bulletsUpdate = function() {
    for(var i = 0; i < self.bullets.length; i++) {
      self.bullets[i].update(self.ctx);
    }
    self.swarm.anyBulletsHit(self.ctx, self.bullets, self.turret);
    self.bullets = self.pruneDeadBullets(self.bullets);
  };
  self.createTicker(function() {
    self.swarm.update(self.ctx);
  }, turretUpdate, bulletsUpdate);
};

Game.prototype.createTicker = function(aliensUpdate, turretUpdate, bulletsUpdate) {
  var count = 0;
  var self = this;
  var animateInterval = setInterval(function() {
    aliensUpdate();
    turretUpdate();
    bulletsUpdate();
    count += 1;
    if(self.swarm.bounds().y2 >= self.turret.bounds().y1) {
      self.gameOver = true;
      self.didWin = false;
    }
    if(self.gameOver) {
      clearInterval(animateInterval);
      self.gameFinished();
      self.pubSub.unsubscribeAll('swarm');
      self.pubSub.unsubscribeAll('bullets');
      self.pubSub.unsubscribeAll('aliens');
      self.pubSub.unsubscribeAll('turret');
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
    }
  }, 33);
};

Game.prototype.gameFinished = function() {
  var self = this;
  if(self.didWin) {
    self.wonAu.play();
  }
  else {
    self.deathAu.play();
  }
  _.each(self.bullets, function(bullet) { bullet.clear(self.ctx) });
  var i = 0.2;
  var bckImgData = self.ctx.getImageData(0, 0, canvas.width, canvas.height); 
  var interval = setInterval(function() {
    self.ctx.putImageData(bckImgData, 0, 0);
    self.ctx.fillStyle = self.didWin ? "#3d4" : "f33";
    self.ctx.font = ""+ (68*i) +"pt Impact";
    var text = "GAME OVER";
    var width = self.ctx.measureText(text).width;
    self.ctx.fillText(
      text,
      (self.canvas.width-width)*0.5,
      self.canvas.height*0.4,
      width
    );
    self.ctx.font = ""+ (88*i) +"pt Impact";
    text = self.didWin ? "WINNER!" : "LOSER!";
    width = self.ctx.measureText(text).width;
    self.ctx.fillText(
      text,
      (self.canvas.width-width)*0.5,
      self.canvas.height*0.6,
      width
    );
    text = self.touchable ? "Touch to play again" : "Press 's' to play again";
    self.ctx.font = ""+ (32*i) +"pt Arial";
    width = self.ctx.measureText(text).width;
    self.ctx.fillStyle = "#000";
    self.ctx.fillText(
      text,
      (self.canvas.width-width)*0.5,
      self.canvas.height*0.9,
      width
    );
    i += 0.1;
    if(i > 1.0) clearInterval(interval);
  }, 20);
};

Game.prototype.createTurret = function() {
  this.turret = new Turret(this.pubSub, this.sheet.spriteFor("turret"));
  this.turret.setCoord(this.canvas.width/2, this.canvas.height - this.turret.h*2);
  this.turret.draw(this.ctx);
  // TODO is window the right thing to set this on?
  var dx = 0;
  var self = this;
  var firing = false;
  return function() {
    dx = 0;
    firing = false;
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
};

Game.prototype.fire = function(turret) {
  var bullet = this.createBullet(turret);
  this.bullets.push(bullet);
  this.fireAu.play();
};

Game.prototype.createBullet = function(turret) {
  var bullet = new Bullet(this.pubSub, this.sheet.spriteFor("bullet"));
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
    return off;
  });
};

Game.prototype.processAliensEvent = function(payload) {
  switch(payload.subject) {
    case 'destroyed':
      this.explosion6Au.play();
      this.score += 10 + 2 * payload.row;
      this.updateScoreView();
      break;
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
  }
};

Game.prototype.processTurretEvent = function(payload) {
  if(payload.subject == 'destroyed') {
    this.gameOver = true;
    this.didWin = false;
  }
};


