export interface RecordedAudioResult {
  blob: Blob;
  duration: number; // in seconds
  waveformData: number[]; // 24-32 normalized bars between 0.1 and 1.0
  base64: string;
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private waveformSamples: number[] = [];
  private onVolumeChange?: (volume: number) => void;

  public isRecording = false;

  async start(onVolumeChange?: (volume: number) => void): Promise<void> {
    if (this.isRecording) return;
    this.onVolumeChange = onVolumeChange;
    this.audioChunks = [];
    this.waveformSamples = [];

    // Request microphone access
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Determine supported mime type
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else {
        mimeType = '';
      }
    }

    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.audioStream, { mimeType })
      : new MediaRecorder(this.audioStream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    // Set up Web Audio API Analyser for real-time live wave
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        let sampleCounter = 0;

        const updateVolume = () => {
          if (!this.isRecording || !this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);

          // Calculate average energy
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(Math.max(avg / 128, 0.05), 1.0);

          if (this.onVolumeChange) {
            this.onVolumeChange(normalized);
          }

          // Sample roughly every ~100ms
          sampleCounter++;
          if (sampleCounter % 6 === 0) {
            this.waveformSamples.push(normalized);
          }

          this.animFrameId = requestAnimationFrame(updateVolume);
        };

        this.animFrameId = requestAnimationFrame(updateVolume);
      }
    } catch (err) {
      console.warn('AudioContext analyser error:', err);
    }

    this.startTime = Date.now();
    this.mediaRecorder.start(200); // chunk every 200ms
    this.isRecording = true;
  }

  async stop(): Promise<RecordedAudioResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Recorder is not active'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const durationSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });

        // Normalize samples into 28 waveform bars
        const bars = this.normalizeWaveform(this.waveformSamples, 28);

        // Convert blob to base64
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(
            null,
            bytes.subarray(i, Math.min(i + chunkSize, bytes.length)) as unknown as number[]
          );
        }
        const base64 = btoa(binary);

        this.cleanup();
        resolve({
          blob,
          duration: durationSec,
          waveformData: bars,
          base64,
        });
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.isRecording = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.audioChunks = [];
    this.waveformSamples = [];
  }

  private normalizeWaveform(samples: number[], targetBars = 28): number[] {
    if (samples.length === 0) {
      return Array.from({ length: targetBars }, () => Math.random() * 0.4 + 0.2);
    }
    const result: number[] = [];
    const step = samples.length / targetBars;
    for (let i = 0; i < targetBars; i++) {
      const idx = Math.floor(i * step);
      const val = samples[idx] ?? 0.2;
      result.push(Math.round(Math.min(Math.max(val, 0.15), 1.0) * 100) / 100);
    }
    return result;
  }
}
