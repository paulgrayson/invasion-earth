var Pool = function(maxSize) {
  this.pool = [];
  this.maxSize = maxSize;
};

Pool.prototype.take = function(createFn) {
  return this.pool.length == 0 ? createFn() : this.pool.shift();
};

Pool.prototype.give = function(obj) {
  if(this.pool.length > this.maxSize) return;
  this.pool.push(obj);
};

