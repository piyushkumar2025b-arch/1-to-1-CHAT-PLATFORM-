/**
 * Acoustic Surveillance & Ultrasonic Tracking Beacon Scanner
 * Monitors 15 kHz - 22 kHz frequencies for covert cross-device tracking audio chirps
 * (e.g. SilverPush, Lisnr, uXDT tracking beacons).
 */

export interface UltrasonicScanResult {
  isScanning: boolean;
  peakFrequency: number;
  peakMagnitude: number;
  beaconDetected: boolean;
  detectedBand?: string;
  threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'CRITICAL';
}

export class UltrasonicBeaconDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private onUpdate: ((result: UltrasonicScanResult, freqData: Uint8Array) => void) | null = null;

  async startScanning(
    callback: (result: UltrasonicScanResult, freqData: Uint8Array) => void
  ): Promise<boolean> {
    this.onUpdate = callback;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      this.mediaStream = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      this.audioCtx = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // Higher resolution for high frequencies
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      this.analyser = analyser;

      this.loop();
      return true;
    } catch (err) {
      console.warn('Ultrasonic scanner microphone access error:', err);
      return false;
    }
  }

  private loop = () => {
    if (!this.analyser || !this.audioCtx) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const sampleRate = this.audioCtx.sampleRate;
    const binSize = sampleRate / this.analyser.fftSize;

    // Scan the 16,000 Hz to 22,000 Hz band (Ultrasonic surveillance beacons)
    const minBin = Math.floor(16000 / binSize);
    const maxBin = Math.min(bufferLength - 1, Math.floor(22000 / binSize));

    let maxMag = 0;
    let maxBinIdx = minBin;

    for (let i = minBin; i <= maxBin; i++) {
      if (dataArray[i] > maxMag) {
        maxMag = dataArray[i];
        maxBinIdx = i;
      }
    }

    const peakFreq = Math.round(maxBinIdx * binSize);
    const beaconDetected = maxMag > 130; // High intensity threshold in ultrasonic band

    let threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'CRITICAL' = 'CLEAN';
    let detectedBand: string | undefined;

    if (maxMag > 150) {
      threatLevel = 'CRITICAL';
      detectedBand = `${peakFreq} Hz (High-Power Ultrasonic Beacon)`;
    } else if (maxMag > 110) {
      threatLevel = 'SUSPICIOUS';
      detectedBand = `${peakFreq} Hz (Ambient High-Frequency Acoustic Energy)`;
    }

    if (this.onUpdate) {
      this.onUpdate(
        {
          isScanning: true,
          peakFrequency: peakFreq,
          peakMagnitude: maxMag,
          beaconDetected,
          detectedBand,
          threatLevel,
        },
        dataArray
      );
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  stopScanning() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    this.analyser = null;
    this.onUpdate = null;
  }
}
