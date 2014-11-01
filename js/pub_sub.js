var PubSub = function() {
  this.reset();
};

PubSub.prototype.reset = function() {
  this.channels = {};
};

PubSub.prototype.subscribe = function(channel, callback) {
  if(typeof(this.channels[channel]) === 'undefined') {
    console.log("new channel "+ channel);
    this.channels[channel] = [];
  }
  else {
    // ensure no double sub
    this.unsubscribe(channel, callback);
  }
  this.channels[channel].push(callback);
};

PubSub.prototype.unsubscribe = function(channel, callback) {
  var subs = this.channels[channel];
  if(typeof(subs) !== 'undefined')
    this.channels[channel] = _.difference(subs, callback);
};

PubSub.prototype.unsubscribeAll = function(channel) {
  this.channels[channel] = null;
};

PubSub.prototype.publish = function(channel, payload) {
  var subs = this.channels[channel];
  if(typeof(subs) !== 'undefined') {
    for(var i = 0; i < subs.length; i++) subs[i](payload);
  }
};

