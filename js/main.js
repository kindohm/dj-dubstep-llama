window.DJ = (function($){

var module = {};
module.playing = false;
module.oscilloscope = new Array();

var device, /* audiolib.js device */

    /* tempo vars for music tempo, wobble speed, etc */
    tempo         = 140, 
    wobbleStep    = 2,
    tickCounter   = 1, 
    stepIndex     = 100,
    beatFractionConst, 

    /* sampler objects for drum sequence */
    kickSample    = atob(kick),
    snareSample   = atob(snare),
    hatSample     = atob(hat1),
    hat2Sample    = atob(hat2),
    synthSample   = atob(stab),
    kickSampler, 
    snareSampler, 
    hatSampler, 
    hat2Sampler, 
    synthSampler,

    /* effects */
    wobbleLfo, 
    filter, 
    reverb, 
    synthReverb, 
    cutoff        = 6000, 

    /* arrays to keep track of the bass sounds in play */
    seqVoices     = [], 
    voices        = [], 
    voiceIds      = [],
    voiceSequence = { steps: [] },

    /* misc */
    freePlay, 
    keyIsDown     = false;

/* convers a note string to Hz */
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

/* builds the HTML UI for the sequencer */
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

/* helper function that adjusts consecutive notes in the sequencer
   that are at the same pitch to be a single sustained note */
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

  buildBassSequenceUI();

  $('#controls').tabSlideOut({
    tabHandle: '.handle',
    pathToTabImage: 'img/controls.png',
    imageHeight: '122px',
    imageWidth: '40px',
    tabLocation: 'left',
    speed: 300,
    action: 'click',
    topPos: '200px',
    fixedPosition: false
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
  
  if (!module.playing) return;

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
    kickSampleL = kickSampler.getMix(0) * .5;
    kickSampleR = kickSampler.getMix(1) * .5;

    snareSampler.generate();
    kickSampleL += snareSampler.getMix(0) * .5;
    kickSampleR += snareSampler.getMix(1) * .5;

    hatSampler.generate();
    kickSampleL += hatSampler.getMix(0) * .4;
    kickSampleR += hatSampler.getMix(1) * .4;

    hat2Sampler.generate();
    kickSampleL += hat2Sampler.getMix(0) * .35;
    kickSampleR += hat2Sampler.getMix(1) * .35;

    synthSampler.generate();
    synthL = synthSampler.getMix(0) * .5;

    synthReverb.pushSample(synthL, 0);
    synthReverb.pushSample(synthL, 1);

    reverb.pushSample(sample, 0);
    reverb.pushSample(sample, 1);

    buffer[i] = reverb.getMix(0) + synthReverb.getMix(0) + kickSampleL;
    buffer[i+1] = reverb.getMix(1) + synthReverb.getMix(1) + kickSampleR;

    module.oscilloscope[i] = buffer[i];
    module.oscilloscope[i+1] = buffer[i+1];
  }
}

window.addEventListener('load', function(){

  var bufSize = 8192;
  // firefox can't take such a short buffer run
  if(navigator.userAgent.indexOf("Firefox")!=-1) {
    bufSize = 4096;
  }

  device = audioLib.AudioDevice(audioCallback, 2, bufSize);
  module.oscilloscope = new Array(bufSize);

  wobbleLfo = audioLib.Oscillator(device.sampleRate, 0);
  wobbleLfo.waveShape = 'sine';
  wobbleLfo.phaseOffset = 45;

  filter = audioLib.IIRFilter(device.sampleRate, cutoff);
  bandPass = audioLib.IIRFilter(device.sampleRate, 3000, 0.5, 2);

  reverb = audioLib.Reverb(device.sampleRate, 2, .5, .5, .6);
  synthReverb = audioLib.Reverb(device.sampleRate, 2, .8, .5, .6);

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
      module.playing = !module.playing
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
    module.playing = !module.playing;
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

  wobbleStep = Math.max(0, wobbleStep);
  wobbleStep = Math.min(wobbleStep, 8);
  processWobbleStep();
});


return module;

})(jQuery);
