function Voice(sampleRate, id, frequency){

  this.id = id;
  this.sampleRate = sampleRate;
  this.frequency = frequency;
  this.samplesLeft = 0;
  this.fixedLength = false;

  this.osc1 = audioLib.Oscillator(sampleRate, frequency);
  this.osc2 = audioLib.Oscillator(sampleRate, 0);
  this.osc3 = audioLib.Oscillator(sampleRate, 0);

  this.lfo1 = audioLib.Oscillator(sampleRate, 200);
  this.lfo2 = audioLib.Oscillator(sampleRate, 190);

  this.osc2.waveShape = 'sawtooth';
  this.osc3.waveShape = 'square';

  this.osc2.frequency = this.osc3.frequency = this.osc1.frequency * 3;
  this.lfo1.frequency = this.osc1.frequency * 4.0;
  this.lfo2.frequency = this.osc1.frequency * 7.0;

  this.lfo1.waveShape = 'sine';
  this.lfo2.waveShape = 'sawtooth';

  this.envelope = audioLib.ADSREnvelope(sampleRate, 5, 1, 1, 50, null, null);

  this.sample = 0;
  this.decaying = false;
  this.finished = false;

  this.envelope.triggerGate(true);

}

Voice.prototype = {
  id: 0,
  fixedLength: false,
  samplesLeft: 0,
  decaying: false,
  finished: false,
  smpleRate: 44100,
  frequency: 440,
  osc1: null,
  osc2: null,
  osc3: null,
  lfo1: null,
  lfo2: null,
  envelope: null,
  sample: 0,
  generate: function(){
    this.sample = 0;

    if (!this.decaying){
      this.osc1.generate();
      this.osc2.generate();
      this.osc3.generate();
      this.lfo1.generate();
      this.lfo2.generate();

          this.osc2.fm = this.lfo1.getMix();
          this.osc3.fm = this.lfo2.getMix();

      this.sample = this.osc1.getMix() * .5 
        + this.osc2.getMix() * .5
        + this.osc3.getMix() * .3;
      this.sample = this.sample * .4;

      if (this.fixed) {
        this.samplesLeft--;
        if (this.samplesLeft <= 0) {
          this.stop();
        }
      }

    }

    this.envelope.generate();
    this.sample = this.sample * this.envelope.getMix();


    if (this.sample === 0){
      this.finished = true;
      this.generate = this._generate;
    }

  },
  getMix: function(){
    return this.sample;
  },
  stop: function(){
    this.decaying = true;
    this.envelope.triggerGate(false);
  },
  _generate: function(){
    // do nothing
  }
};