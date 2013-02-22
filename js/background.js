(function(dj){

var context, canvas;
var degrees = 0;
var width, height, halfWidth, halfHeight;
var imgWidth = 800;
var imgHeight = 1023;
var doubleWidth, doubleHeight;
var circleWidth;
var scale;
var img = new Image();
img.src = 'img/whitellama.png';
var img2 = new Image();
img2.src = 'img/big.png';

var rotate = function(){
  if (!dj.playing & degrees !== 0) return;

  degrees += 0.01;

  context.clearRect(0,0,canvas.width, canvas.height);
  canvas.width = canvas.width;

  context.save();
  context.translate(halfWidth, halfHeight);
  context.rotate(degrees);
  context.translate(-halfWidth, -halfHeight);

  scale = 2.0;
  context.drawImage(img2, -halfWidth, -halfHeight,
    width * scale, height * scale);


  context.restore();

  var grd = context.createRadialGradient(halfWidth, halfHeight, 1, halfWidth, halfHeight, circleWidth);
  grd.addColorStop(0, 'rgba(255, 255, 255, .8)');
  grd.addColorStop(1, 'transparent');

  context.beginPath();
  context.arc(halfWidth, halfHeight, circleWidth, 0, 2 * Math.PI, false);
  context.fillStyle = grd;
  context.fill();

  scale = Math.min(.5, width * .7 / imgWidth);
  context.drawImage(img, halfWidth - imgWidth / 2 * scale, halfHeight - imgHeight / 2 * scale,
    imgWidth * scale, imgHeight * scale);
}

var calculateSizes = function(){
  width = $(window).width();
  height = $(window).height();
  halfWidth = width * 0.5;
  halfHeight = height * 0.5;
  doubleWidth = width * 2;
  doubleHeight = height * 2;
  $('#canvas').attr('width', width);
  $('#canvas').attr('height', height);
  circleWidth = width*.7;
};

$(document).ready(function(){

  calculateSizes();

  canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');

  setInterval(rotate, 1000 / 30);
  
  $(window).resize(function(){
    calculateSizes();
  });
});


})(window.DJ);