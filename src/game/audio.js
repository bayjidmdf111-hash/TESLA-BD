/**
 * Dhaka Dhamaka 3D - Procedural Web Audio Engine
 * Pure procedural synthesis without external MP3/WAV dependencies
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.engineGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.currentVehicleType = 'cng';
    this.isEngineRunning = false;
    this.isHornPlaying = false;
    this.activeHornNodes = [];
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.6, this.ctx.currentTime);
    }
  }

  startEngine(vehicleType = 'cng') {
    this.ensureContext();
    if (!this.ctx || this.isEngineRunning) return;
    this.currentVehicleType = vehicleType;

    try {
      const now = this.ctx.currentTime;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, now);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(320, now);

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();

      if (vehicleType === 'cng') {
        // Sputtery 2-stroke engine
        this.engineOsc1.type = 'sawtooth';
        this.engineOsc1.frequency.setValueAtTime(45, now);
        this.engineOsc2.type = 'square';
        this.engineOsc2.frequency.setValueAtTime(90, now);
        this.engineFilter.frequency.setValueAtTime(400, now);
      } else if (vehicleType === 'bus') {
        // Heavy diesel roar
        this.engineOsc1.type = 'sawtooth';
        this.engineOsc1.frequency.setValueAtTime(32, now);
        this.engineOsc2.type = 'sawtooth';
        this.engineOsc2.frequency.setValueAtTime(64, now);
        this.engineFilter.frequency.setValueAtTime(260, now);
      } else if (vehicleType === 'rickshaw') {
        // Rickshaw has no engine, subtle chain rhythm
        this.engineOsc1.type = 'triangle';
        this.engineOsc1.frequency.setValueAtTime(18, now);
        this.engineOsc2.type = 'sine';
        this.engineOsc2.frequency.setValueAtTime(36, now);
        this.engineGain.gain.setValueAtTime(0.02, now);
      } else {
        // Private car: smooth 4-cylinder
        this.engineOsc1.type = 'triangle';
        this.engineOsc1.frequency.setValueAtTime(55, now);
        this.engineOsc2.type = 'sawtooth';
        this.engineOsc2.frequency.setValueAtTime(110, now);
        this.engineFilter.frequency.setValueAtTime(500, now);
      }

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Engine start failed:', e);
    }
  }

  updateEngine(speed, maxSpeed) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1) return;
    const ratio = Math.min(Math.abs(speed) / (maxSpeed || 50), 1.2);
    const now = this.ctx.currentTime;

    try {
      if (this.currentVehicleType === 'cng') {
        const baseFreq = 45 + ratio * 85;
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.08);
        this.engineFilter.frequency.setTargetAtTime(350 + ratio * 550, now, 0.08);
        this.engineGain.gain.setTargetAtTime(0.06 + ratio * 0.08, now, 0.08);
      } else if (this.currentVehicleType === 'bus') {
        const baseFreq = 30 + ratio * 55;
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.1);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.1, now, 0.1);
        this.engineFilter.frequency.setTargetAtTime(250 + ratio * 450, now, 0.1);
        this.engineGain.gain.setTargetAtTime(0.08 + ratio * 0.1, now, 0.1);
      } else if (this.currentVehicleType === 'rickshaw') {
        const baseFreq = 16 + ratio * 32;
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.12);
        this.engineGain.gain.setTargetAtTime(0.01 + ratio * 0.03, now, 0.12);
      } else {
        const baseFreq = 50 + ratio * 100;
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.07);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.07);
        this.engineFilter.frequency.setTargetAtTime(450 + ratio * 600, now, 0.07);
        this.engineGain.gain.setTargetAtTime(0.05 + ratio * 0.07, now, 0.07);
      }
    } catch {
      // Audio node may be disposing
    }
  }

  stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
      }
    } catch {
      // Ignore
    }
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isEngineRunning = false;
  }

  playHorn(vehicleType = this.currentVehicleType) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    if (vehicleType === 'rickshaw') {
      // Rickshaw Bell "Tring Tring!"
      for (let i = 0; i < 2; i++) {
        const startTime = now + i * 0.13;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1950, startTime);
        osc.frequency.exponentialRampToValueAtTime(1750, startTime + 0.12);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.13);
      }
      return;
    }

    if (vehicleType === 'bus') {
      // Dhaka Bus Musical Air Horn
      const notes = [420, 560, 420, 680];
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.11;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(freq, startTime);
        osc2.frequency.setValueAtTime(freq * 1.5, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + 0.13);
        osc2.stop(startTime + 0.13);
      });
      return;
    }

    if (vehicleType === 'cng') {
      // CNG sharp beep
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(580, now);
      osc2.frequency.setValueAtTime(690, now);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.setValueAtTime(0.24, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
      return;
    }

    // Default Private Car Horn (dual tone Pip-pip)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(554, now); // Major third

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.setValueAtTime(0.22, now + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  }

  playCollision(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Low thud
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      const amp = Math.min(Math.max(intensity, 0.4), 1.0);
      oscGain.gain.setValueAtTime(0.4 * amp, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.36);

      // Noise metal crunch burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(2.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35 * amp, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.26);
    } catch (e) {
      console.warn('Crash sound error:', e);
    }
  }

  playCollect() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.26);
      });
    } catch {
      // Ignore
    }
  }

  playBrake() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.linearRampToValueAtTime(1800, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  cleanup() {
    this.stopEngine();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {
        // Ignore
      }
    }
    this.ctx = null;
  }
}

export const soundManager = new SoundSystem();
