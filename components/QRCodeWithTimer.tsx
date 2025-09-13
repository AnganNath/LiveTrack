import React, { useEffect, useRef } from 'react';

// Declare QRious for TypeScript since it's loaded from a script tag
declare var QRious: any;

interface QRCodeWithTimerProps {
  qrData: string;
  timeLeft: number;
  duration: number;
}

const QRCodeWithTimer: React.FC<QRCodeWithTimerProps> = ({ qrData, timeLeft, duration }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / duration);
  const offset = circumference * (1 - progress);

  useEffect(() => {
    if (canvasRef.current && qrData && typeof QRious !== 'undefined') {
      try {
        new QRious({
          element: canvasRef.current,
          value: qrData,
          size: 288,
          padding: 16,
          background: 'white',
          foreground: 'black',
          level: 'H', // High error correction for better scanning
        });
      } catch (error) {
        console.error("QRious failed to generate QR code:", error);
      }
    }
  }, [qrData]);

  return (
    <div className="bg-slate-800/70 p-6 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-sm flex flex-col items-center gap-6">
      <div className="p-4 bg-white rounded-lg shadow-inner">
        <canvas ref={canvasRef} style={{ width: '288px', height: '288px' }}></canvas>
      </div>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="12"
            className="text-slate-700"
            fill="transparent"
            stroke="currentColor"
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="12"
            className="text-cyan-400"
            fill="transparent"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-bold tracking-tighter text-white">{timeLeft}</span>
          <span className="text-sm text-slate-400 uppercase tracking-widest">Seconds</span>
        </div>
      </div>
       <p className="text-sm text-slate-400 text-center">Scan this code to mark your attendance. <br/> A new code will be generated automatically.</p>
    </div>
  );
};

export default QRCodeWithTimer;