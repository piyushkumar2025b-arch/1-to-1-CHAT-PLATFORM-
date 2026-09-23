// Web Audio API Acoustic Privacy & Speech Jamming Noise Synthesizer
// Generates client-side acoustic masking to prevent eavesdropping and microphone recording.

export type NoiseType = 'pink' | 'brown' | 'white' | 'speech_jam' | 'binaural';

class AcousticShieldController {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isPlaying = false;
  private currentVolume = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public start(type: NoiseType, volume: number = 0.5) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentVolume = volume;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      // 1/f Pink Noise (Paul Kellet's filtered method)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      // 1/f^2 Brownian / Red Noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Gain boost
      }
    } else if (type === 'speech_jam') {
      // Modulated noise tailored to speech frequencies (300Hz - 3400Hz voice band)
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const modulator = Math.sin((2 * Math.PI * 4 * i) / this.ctx.sampleRate); // 4Hz syllabic modulation
        data[i] = ((lastOut + 0.05 * white) / 1.05) * (0.7 + 0.3 * modulator);
        lastOut = data[i];
        data[i] *= 2.8;
      }
    } else if (type === 'binaural') {
      // 432Hz deep meditative ambient wave
      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.ctx.sampleRate;
        const carrier = Math.sin(2 * Math.PI * 432 * t);
        const beat = Math.sin(2 * Math.PI * 6 * t); // 6Hz theta pulse
        const sub = Math.sin(2 * Math.PI * 216 * t) * 0.5;
        data[i] = (carrier * 0.5 + sub) * (0.8 + 0.2 * beat) * 0.3;
      }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter bandpass for speech jam
    this.filterNode = this.ctx.createBiquadFilter();
    if (type === 'speech_jam') {
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.value = 1400;
      this.filterNode.Q.value = 0.8;
    } else if (type === 'pink') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 8000;
    } else {
      this.filterNode.type = 'allpass';
    }

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 64;

    source.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);

    source.start();
    this.noiseNode = source;
    this.isPlaying = true;
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch {
        // already stopped
      }
      this.noiseNode = null;
    }
    this.isPlaying = false;
  }
}

export const acousticShield = new AcousticShieldController();
