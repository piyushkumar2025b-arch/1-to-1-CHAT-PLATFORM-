import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { scanQrFromVideoFrame, scanQrFromImageFile, QrJoinPayload } from '../lib/qr-helper';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (payload: { roomId: string; password?: string }) => void;
}

// Synthesizes a clean success confirmation tone using Web Audio API
function playScanSuccessTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {
    // AudioContext blocked or not supported
  }
}

export function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<QrJoinPayload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream & scan loops cleanly
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Handle successful payload detection
  const handleSuccess = useCallback(
    (payload: QrJoinPayload) => {
      setScannedResult(payload);
      playScanSuccessTone();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(120);
        } catch {
          // ignore
        }
      }
      stopCamera();

      // Brief delay to allow user to see success checkmark
      setTimeout(() => {
        onScanSuccess({ roomId: payload.roomId, password: payload.password });
        onClose();
      }, 500);
    },
    [onScanSuccess, onClose, stopCamera]
  );

  // Live video frame processing loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const payload = scanQrFromVideoFrame(video, canvasRef.current);
      if (payload) {
        handleSuccess(payload);
        return;
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  }, [handleSuccess]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScannedResult(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsScanning(true);
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access or use the "Upload QR Code Image" tab below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please upload a QR code image/screenshot instead.');
      } else {
        setCameraError('Could not initialize camera stream. Try uploading an image/screenshot of the QR code.');
      }
      setActiveTab('upload');
    }
  }, [facingMode, scanFrame, stopCamera]);

  // Mount/unmount lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  // Toggle front/back camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Upload image file handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadError(null);
    setIsProcessingUpload(true);

    try {
      const payload = await scanQrFromImageFile(file);
      setIsProcessingUpload(false);
      if (payload) {
        handleSuccess(payload);
      } else {
        setUploadError('No valid QR code found in this image. Please ensure the QR code is clearly visible and try again.');
      }
    } catch (err) {
      setIsProcessingUpload(false);
      setUploadError('Failed to read image file. Please try another image.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
      className="fixed inset-0 z-[140] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 text-white animate-in fade-in duration-200 select-none"
    >
      <div
        id="qr-scanner-modal"
        className="relative w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col items-center gap-4"
      >
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 id="qr-scanner-title" className="text-base font-bold text-white tracking-tight">
                Scan Room QR Code
              </h2>
              <p className="text-xs text-neutral-400">Instantly join without typing credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Scanner"
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="w-full grid grid-cols-2 p-1 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs font-semibold z-10">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Active Scan Area */}
        <div className="w-full relative rounded-2xl overflow-hidden aspect-square bg-black border border-neutral-800 flex items-center justify-center">
          {scannedResult ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 block">
                  QR Code Verified!
                </span>
                <span className="text-lg font-mono font-extrabold text-white mt-1 block">
                  Room: {scannedResult.roomId}
                </span>
                {scannedResult.password && (
                  <span className="text-xs text-neutral-400 block mt-0.5">
                    Password auto-configured
                  </span>
                )}
              </div>
              <span className="text-xs text-emerald-300 animate-pulse">
                Entering room now...
              </span>
            </div>
          ) : activeTab === 'camera' ? (
            <>
              {/* Camera Video Viewport */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target & Laser Animation */}
              {isScanning && !cameraError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                    {/* Viewfinder Neon Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg shadow-[0_0_8px_#34d399]" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg shadow-[0_0_8px_#34d399]" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg shadow-[0_0_8px_#34d399]" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg shadow-[0_0_8px_#34d399]" />

                    {/* Laser Scanner Line Animation */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Flip camera control */}
              {isScanning && !cameraError && (
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  aria-label="Flip Camera"
                  className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
                  title="Switch front/back camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              {/* Camera Error / Fallback message */}
              {cameraError && (
                <div className="p-5 text-center flex flex-col items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-3.5 py-1.5 bg-emerald-500 text-neutral-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Upload QR Image
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Upload Image Tab */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:bg-neutral-950/60 transition-colors group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-neutral-800/90 group-hover:bg-emerald-500/20 border border-neutral-700 group-hover:border-emerald-500/40 flex items-center justify-center text-neutral-400 group-hover:text-emerald-400 transition-all shadow-inner">
                {isProcessingUpload ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                ) : (
                  <ImageIcon className="w-6 h-6" />
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-neutral-200 block">
                  {isProcessingUpload ? 'Analyzing QR Code...' : 'Choose or Drop QR Image'}
                </span>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Supports screenshot, photo, or saved PNG/JPG
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-white/5 text-[10px] text-neutral-300 font-medium">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Instant Auto-Detection</span>
              </div>

              {uploadError && (
                <div className="mt-2 p-2 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-[11px] leading-tight flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer instruction */}
        <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
          {activeTab === 'camera'
            ? 'Align the QR code within the frame to connect automatically.'
            : 'Select any screenshot or picture of a room QR code.'}
        </p>
      </div>
    </div>
  );
}
