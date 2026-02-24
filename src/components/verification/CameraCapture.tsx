import { useState, useRef, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available. Please ensure you have granted camera permissions.');
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  }

  function startCountdown() {
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        capturePhoto();
      }
    }, 1000);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Mirror effect for natural selfie view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.95);
  }

  function handleCancel() {
    stopCamera();
    onCancel();
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-lg p-6 max-w-sm text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 text-white bg-black/50">
        <h2 className="text-lg font-semibold">Take Selfie</h2>
        <button 
          onClick={handleCancel}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
        >
          ✕
        </button>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* Face guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-white/70 rounded-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-white text-xs bg-black/50 px-2 py-1 rounded">
              Position face here
            </div>
          </div>
        </div>
        
        {/* Countdown overlay */}
        {countdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-9xl font-bold text-white animate-pulse">{countdown}</span>
          </div>
        )}
      </div>
      
      <div className="p-6 bg-black/50 flex flex-col items-center gap-4">
        <p className="text-white/80 text-sm text-center">
          Tap the button and look at the camera
        </p>
        <button
          onClick={startCountdown}
          disabled={countdown !== null}
          className="w-20 h-20 rounded-full bg-white border-4 border-white/30 disabled:opacity-50 transition-transform active:scale-95"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500 border-2 border-white" />
        </button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}