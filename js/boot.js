var main = function(doc) {
  var touchable = 'createTouch' in document;
  var canvas = doc.getElementById('canvas');
  var sheetEl = doc.getElementById('sheet1');
  var explosionEl = doc.getElementById('explosion');
  var scoreEl = doc.getElementById('score');
  var fireAu = doc.getElementById('audio-fire');
  var explosion6Au = doc.getElementById('audio-explosion-6');
  var blip1Au = doc.getElementById('audio-blip-1');
  var blip2Au = doc.getElementById('audio-blip-2');
  var deathAu = doc.getElementById('audio-death');
  var wonAu = doc.getElementById('audio-won');
  var pubSub = new PubSub();
  var sheet = new Sheet(sheetEl);
  var auAssets = [wonAu, deathAu, fireAu, explosion6Au, blip1Au, blip2Au];
  var assetsLoaded = 1; //auAssets.length+1;
  var width = window.innerWidth - 20;
  if(width > 640) width = 640;
  var height = width * 0.9;
  if(height > (window.innerHeight - 20)) height = window.innerHeight - 20;
  var sync = function() {
    assetsLoaded--;
    if(assetsLoaded == 0) {
      var game = new Game(
        width,
        height,
        touchable,
        new KeyHandler(window),
        new TouchHandler(window),
        canvas,
        sheet,
        explosionEl,
        scoreEl,
        fireAu,
        explosion6Au,
        blip1Au,
        blip2Au,
        deathAu,
        wonAu,
        pubSub
      );
      game.start();
    }
  };
  _.each(auAssets, function(asset) {
    asset.addEventListener('loadeddata', sync);
    asset.setAttribute('src', asset.getAttribute('data-src'));
  });
  sheet.load(sync);
}

main(window.document);
