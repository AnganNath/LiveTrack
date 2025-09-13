import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';

// This is a placeholder for the environment variable that is expected to be available in the execution environment.
declare var process: {
  env: {
    API_KEY: string;
  }
};

interface HeadcountProps {
  onClose: () => void;
  onConfirm: (count: number) => void;
}

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 019.07 4h5.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const Headcount: React.FC<HeadcountProps> = ({ onClose, onConfirm }) => {
  const [status, setStatus] = useState<'idle' | 'initializing' | 'scanning' | 'processing' | 'complete'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [detectedCount, setDetectedCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = async () => {
    setStatus('initializing');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setStatus('scanning');
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errorMessage = "Could not access the camera. Please check permissions.";
      if (err instanceof DOMException) {
          switch (err.name) {
              case 'NotAllowedError':
                  errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
                  break;
              case 'NotFoundError':
                  errorMessage = "No camera found on this device.";
                  break;
              case 'NotReadableError':
                  errorMessage = "Camera is in use by another application.";
                  break;
              default:
                  errorMessage = `An unexpected camera error occurred: ${err.message}`;
          }
      }
      setError(errorMessage);
      setStatus('idle');
      cleanupCamera();
    }
  };

  const takePictureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setStatus('processing');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setError("Could not get canvas context.");
        setStatus('scanning');
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    cleanupCamera();

    const base64ImageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64ImageData,
            },
        };

        const textPart = {
            text: "Count the number of people in this image. Respond with only a single number and nothing else.",
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const countText = response.text.trim();
        const count = parseInt(countText, 10);

        if (isNaN(count)) {
            throw new Error(`AI returned a non-numeric response: "${countText}"`);
        }
        
        setDetectedCount(count);
        setStatus('complete');

    } catch (e: any) {
        console.error("Analysis failed:", e);
        setError(`Analysis failed: ${e.message}. Please try again.`);
        setStatus('idle');
    }
  };
  
  useEffect(() => {
    return () => cleanupCamera();
  }, [cleanupCamera]);

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-slate-100">AI Headcount</h3>
            <p className="text-slate-300 mb-8">Use your device's camera to perform an AI-powered headcount of the classroom. The result can be compared with the attendance list.</p>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <button
              onClick={startCamera}
              className="inline-flex items-center justify-center px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
            >
              <CameraIcon />
              Start Camera
            </button>
          </div>
        );
      case 'initializing':
        return (
          <div className="text-center p-8">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400 mx-auto mb-4"></div>
            <h3 className="text-2xl font-bold">Initializing Camera...</h3>
          </div>
        )
      case 'scanning':
        return (
            <div className="w-full">
                <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-inner">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                </div>
                 <button
                    onClick={takePictureAndAnalyze}
                    className="mt-6 w-full inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
                >
                    <CameraIcon />
                    Take Picture & Analyze
                </button>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        )
      case 'processing':
        return (
          <div className="w-full">
            <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-inner flex items-center justify-center">
              <canvas ref={canvasRef} className="max-w-full max-h-full object-contain opacity-30" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-center text-white p-4 rounded-lg bg-black/50 backdrop-blur-sm">
                      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400 mx-auto mb-4"></div>
                      <h3 className="text-2xl font-bold">Analyzing with AI...</h3>
                      <p className="text-slate-200">This may take a moment.</p>
                  </div>
              </div>
            </div>
          </div>
        );
      case 'complete':
        return (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-100">AI Analysis Complete</h3>
            <p className="text-8xl font-bold my-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">{detectedCount}</p>
            <p className="text-slate-300 mb-8">students detected.</p>
            <div className="flex justify-center gap-4">
               <button
                  onClick={() => { setStatus('idle'); setError(null); }}
                  className="px-6 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-500/50 transition-colors"
                >
                  Scan Again
                </button>
                <button
                  onClick={() => onConfirm(detectedCount)}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-colors"
                >
                  Confirm Headcount
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">
         <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default Headcount;
