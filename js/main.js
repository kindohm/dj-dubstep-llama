var device, freePlay, keyIsDown = false, chorusL, chorusR, envelope, seqVoices = [], voices = [], voiceIds = [],
  wobbleLfo, tempo = 140, wobbleStep = 2, filter, cutoff = 6000, reverb, synthReverb, delay,
  kickSampler, snareSampler, hatSampler, hat2Sampler, synthSampler, tickCounter = 1, beatFractionConst, stepIndex = 100,
    playing = false;

var kickSample = atob(kick);
var snareSample = atob(snare);
var hatSample = atob(hat1);
var hat2Sample = atob(hat2);
var synthSample = atob(stab);

var getFrequency = function(note) {
  if (note === 'C1') return 32.7032;
  if (note === 'D1') return 36.7081;
  if (note === 'Eb1') return 38.8909;
  if (note === 'F1') return 43.6535;
  if (note === 'G1') return 48.9994;
  if (note === 'Ab1') return 51.9131;
  if (note === 'Bb1') return 58.2705;
  if (note === 'C2') return 65.4064; 
  return 0;
};

var buildBassSequenceUI = function(){

  var div = $('#bassSequence');
  var steps = 32;
  var pitches = 9;
  var cellClass = '';
  for (var row = 0; row < pitches; row++){
    rowClass = (row + 1) % 2 === 0 ? 'row' : 'altRow';
    var newDiv = $('<div class="' + rowClass + '">');
    div.prepend(newDiv);
    var value = "X";
    if (row === 1) {
      value = "C1";
    } else if (row === 2) {
      value = "D1";
    } else if (row === 3) {
      value = "Eb1";
    } else if (row === 4) {
      value = "F1";
    } else if (row === 5) {
      value = "G1";
    } else if (row === 6){
      value = "Ab1";
    } else if (row === 7) {
      value = "Bb1";
    } else if (row === 8) {
      value = "C2";
    }

    var label = $('<span class="rowLabel">');
    label.text(value);
    newDiv.append(label);
    for (var col = 0; col < steps; col++) {
      var cellClass = (col + 1) % 4 === 0 ? 'cell4' : 'cell';
      var span = $('<span class="' + cellClass + '">');
      var input = $('<input class="bassNote" type="radio" name="' + col + '" value="' + value + '"">');
      span.append(input);
      newDiv.append(span);
      if (row === 0){
        input.attr('checked', true);
      }
    }
  }


};

var voiceSequence = {
    steps: [ ]
};

/* function for debugging purposes */
var writeSortedSteps = function(){

  var sorted = voiceSequence.steps.sort(function(a,b){
    return a.step - b.step;
  });

  for (var i = 0; i < sorted.length; i++) {
    var step = sorted[i];
    console.log('step: ' + step.step + ', length: ' + step.length + ' hz: ' + step.hz + ', ignore: ' + step.ignore);
  }

  return;
};

var fixSustainedNotes = function (){
  if (voiceSequence.steps.length <= 1) return;

  var sorted = voiceSequence.steps.sort(function(a,b){
    return a.step - b.step;
  });

  for (var i = 0; i < sorted.length; i++) {
    sorted[i].ignore = false;
    sorted[i].length = 1;
  }

  var startStep = sorted[0];
  var currentLength = 2;
  var currentStepAhead = 1;
  for (var i = 1; i < sorted.length; i++) {

    var current = sorted[i];
    if (current.step === startStep.step + currentStepAhead){
      if (current.hz === startStep.hz) {
        startStep.length = currentLength;
        current.ignore = true;
        currentLength++;
        currentStepAhead++;
      }
      else {
        currentLength = 2;
        startStep = current;
        currentStepAhead = 1;
      }
    } else {
      currentLength = 2;
      startStep = current;
      currentStepAhead = 1;
    }

  }

}

$(document).ready(function(){

  /*
    setInterval(function(){
        if (!playing) return;
  
        // do any tempo-based stuff here        

    }, 428.5);
*/

    buildBassSequenceUI();

     $('#controls').tabSlideOut({
         tabHandle: '.handle',                              //class of the element that will be your tab
         pathToTabImage: 'img/controls.png',          //path to the image for the tab (optionaly can be set using css)
         imageHeight: '122px',                               //height of tab image
         imageWidth: '40px',                               //width of tab image    
         tabLocation: 'left',                               //side of screen where tab lives, top, right, bottom, or left
         speed: 300,                                        //speed of animation
         action: 'click',                                   //options: 'click' or 'hover', action to trigger animation
         topPos: '200px',                                   //position from the top
         fixedPosition: false                               //options: true makes it stick(fixed position) on scroll
     });

    $('.bassNote').click(function (arg) {
      var newStep = {
        step: parseInt($(this).attr('name')),
        hz: getFrequency($(this).val()),
        length: 1,
        ignore: false
      };

      var found = false;
      for (var i = 0; i < voiceSequence.steps.length; i++){
        var existingStep = voiceSequence.steps[i];
        if (existingStep.step === newStep.step) {
          existingStep.hz = newStep.hz;
          found = true;
          break;
        }
      }

      if (!found) {
        voiceSequence.steps.push(newStep);
      }

      fixSustainedNotes();
    });

});


var drumSequence = {
  steps: [
    { step: 0, sampler: 'synth' , hz: 523.251 },
    { step: 16, sampler: 'synth' , hz: 415.305 },
    { step: 24, sampler: 'synth' , hz: 391.995 },
    { step: 0, sampler: 'kick', hz: 440 },
    { step: 2, sampler: 'hat', hz: 440 },
    { step: 3, sampler: 'kick', hz: 440 },
    { step: 6, sampler: 'hat2' , hz: 440 },
    { step: 8, sampler: 'snare' , hz: 440 },
    { step: 10, sampler: 'hat' , hz: 440 },
    { step: 11, sampler: 'hat2' , hz: 440 },
    { step: 14, sampler: 'hat2' , hz: 440 },
    { step: 15, sampler: 'hat' , hz: 440 },
    { step: 16, sampler: 'kick' , hz: 440 },
    { step: 19, sampler: 'hat' , hz: 440 },
    { step: 22, sampler: 'hat2' , hz: 440 },
    { step: 23, sampler: 'hat' , hz: 440 },
    { step: 24, sampler: 'snare' , hz: 440 },
    { step: 26, sampler: 'hat' , hz: 440 },
    { step: 27, sampler: 'hat2' , hz: 440 },
    { step: 29, sampler: 'hat2' , hz: 440 },
    { step: 30, sampler: 'hat' , hz: 440 },
    { step: 31, sampler: 'hat2' , hz: 440 },
  ]
};

var audioCallback = function(buffer, channels){
  
    if (!playing) return;

  var sample = 0;
  var kickSampleL = 0;
  var kickSampleR = 0;
  var sampler;
  var s, step;
    var synthL, synthR, v;

  for (var i = 0; i < buffer.length; i+=2) {
    sample = 0;

      tickCounter = tickCounter + beatFractionConst;

      if (tickCounter >= 1){
        tickCounter = 0;

        stepIndex += 1;
        if (stepIndex >= 32){
          stepIndex = 0;
        }

        if (!freePlay) {
          for (s = 0; s < voiceSequence.steps.length; s++) {
            step = voiceSequence.steps[s];
            if (step.step === stepIndex && !step.ignore) {
              var voice = new Voice(device.sampleRate, 0, step.hz);
              voice.fixed = true;
              voice.samplesLeft = step.length / beatFractionConst;
              seqVoices.push(voice);
              wobbleLfo.reset();
            }  
          }
        }

        for (s = 0; s < drumSequence.steps.length; s++){
          step = drumSequence.steps[s];
          if (step.step === stepIndex){
            if (step.sampler === 'kick'){
              kickSampler.noteOn(step.hz);
            } else if (step.sampler === 'snare'){
              snareSampler.noteOn(step.hz);
            } else if (step.sampler === 'hat'){
                hatSampler.noteOn(step.hz);
            } else if (step.sampler === 'hat2'){
                hat2Sampler.noteOn(step.hz);
            } else if (step.sampler === 'synth'){
                synthSampler.noteOn(step.hz);
            }
          }
        }
      }

    // remove expired voices
    for (v = seqVoices.length - 1; v >= 0; v--){
        if (seqVoices[v].finished){
            seqVoices.splice(v, 1);
        }
    }

    for (v = voices.length - 1; v >= 0; v--){
        if (voices[v].finished){
            voices.splice(v);
            voiceIds.splice(v);
        }
    }

    if (freePlay) {

        for (v = 0; v < voices.length; v++){
            voices[v].generate();
            sample += voices[v].getMix() / voices.length;
        }
    } else {
        for (v = 0; v < seqVoices.length; v++){
            seqVoices[v].generate();
            sample += seqVoices[v].getMix();
        }
    }

    if (wobbleLfo.frequency !== 0){
        wobbleLfo.generate();
        filter.cutoff = cutoff * ((wobbleLfo.getMix() + 1) * 0.5);
    }

    filter.pushSample(sample);
    sample = filter.getMix();

    kickSampler.generate();
    kickSampleL = kickSampler.getMix(0) * .3;
    kickSampleR = kickSampler.getMix(1) * .3;

    snareSampler.generate();
    kickSampleL += snareSampler.getMix(0) * .3;
    kickSampleR += snareSampler.getMix(1) * .3;

    hatSampler.generate();
    kickSampleL += hatSampler.getMix(0) * .2;
    kickSampleR += hatSampler.getMix(1) * .2;

    hat2Sampler.generate();
    kickSampleL += hat2Sampler.getMix(0) * .15;
    kickSampleR += hat2Sampler.getMix(1) * .15;

    synthSampler.generate();
    synthL = synthSampler.getMix(0) * .3;

    synthReverb.pushSample(synthL, 0);
    synthReverb.pushSample(synthL, 1);

    reverb.pushSample(sample, 0);
    reverb.pushSample(sample, 1);

    buffer[i] = reverb.getMix(0) + synthReverb.getMix(0) + kickSampleL;
    buffer[i+1] = reverb.getMix(1) + synthReverb.getMix(1) + kickSampleR;


  }
}

window.addEventListener('load', function(){

  device = audioLib.AudioDevice(audioCallback, 2);
  wobbleLfo = audioLib.Oscillator(device.sampleRate, 0);
  wobbleLfo.waveShape = 'sine';
  wobbleLfo.phaseOffset = 45;

  filter = audioLib.IIRFilter(device.sampleRate, cutoff);
  bandPass = audioLib.IIRFilter(device.sampleRate, 3000, 0.5, 2);

  reverb = audioLib.Reverb(device.sampleRate, 2, .5, .5, .6);
  synthReverb = audioLib.Reverb(device.sampleRate, 2, .8, .5, .8);

  kickSampler = audioLib.Sampler(device.sampleRate);
  kickSampler.loadWav(kickSample, true);
  snareSampler = audioLib.Sampler(device.sampleRate);
  snareSampler.loadWav(snareSample, true);
  hatSampler = audioLib.Sampler(device.sampleRate);
  hatSampler.loadWav(hatSample, true);
  hat2Sampler = audioLib.Sampler(device.sampleRate);
  hat2Sampler.loadWav(hat2Sample, true);
  synthSampler = audioLib.Sampler(device.sampleRate);
  synthSampler.loadWav(synthSample, true);

  beatFractionConst = 1 / device.sampleRate * tempo / 60;
  beatFractionConst = beatFractionConst * 4;

  $(document).keydown(function(k){
    if (k.which === 38) {
      if (wobbleLfo.waveShape === 'sine') {
        wobbleLfo.waveShape = 'invSawtooth';
      } else if (wobbleLfo.waveShape === 'invSawtooth'){
        wobbleLfo.waveShape = 'sawtooth';
      } else if (wobbleLfo.waveShape === 'sawtooth') {
        wobbleLfo.waveShape = 'sine';
      }
    } else if (k.which === 32) {
      playing = !playing
    } else {
      if (voiceIds.indexOf(k.which) === -1){
        var note = 'X';
        if (k.which === 49) note = 'C1';
        else if (k.which === 50) note = 'D1';
        else if (k.which === 51) note = 'Eb1';
        else if (k.which === 52) note = 'F1';
        else if (k.which === 53) note = 'G1';
        else if (k.which === 54) note = 'Ab1';
        else if (k.which === 55) note = 'Bb1';
        else if (k.which === 56) note = 'C2';
        else note = 'X';

        var hz = getFrequency(note);
        var voice = new Voice(device.sampleRate, k.which, hz);
        voices.push(voice);
        voiceIds.push(k.which);
      }
    }
      
  });

    $(document).keyup(function(k){
      if (voiceIds.indexOf(k.which) !== -1){
            for (var i = 0; i < voices.length; i++){
                if (voices[i].id === k.which){
                    voices[i].stop();
                }
            }
        }     
    });

    $('#playButton').click(function(){
        playing = !playing;
    });

    $('#freePlayCheckbox').click(function(){
        freePlay = $('#freePlayCheckbox').is(':checked');
        seqVoices = [];
    });

    processWobbleStep();
    
}, true);

var processWobbleStep = function(){
    wobbleLfo.frequency = tempo / 60 * wobbleStep * 0.5;
    filter.cutoff = cutoff;
};

$(document).mousewheel(function(event, delta, deltaX, deltaY) {
    wobbleStep += delta;

    while (wobbleStep === 5 || wobbleStep === 7) {
      wobbleStep += delta;
    }

    wobbleStep = wobbleStep < 0 ? 0 : wobbleStep;
    wobbleStep = wobbleStep > 8 ? 8 : wobbleStep;
    processWobbleStep();
});











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
  if (!playing & degrees !== 0) return;

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


