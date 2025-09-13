import React, { useState, useEffect, useCallback } from 'react';
import QRCodeWithTimer from './QRCodeWithTimer';
import AttendanceList, { StudentRecord } from './AttendanceList';
import Headcount from './Headcount';

interface AttendanceScreenProps {
  onStop: () => void;
  sessionId: string;
  presentStudents: StudentRecord[];
  totalStudents: number;
  mlHeadcount: number | null;
  onHeadcountComplete: (count: number) => void;
}

const DURATION = 30;

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 019.07 4h5.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const AttendanceScreen: React.FC<AttendanceScreenProps> = ({ onStop, sessionId, presentStudents, totalStudents, mlHeadcount, onHeadcountComplete }) => {
  const [qrData, setQrData] = useState('');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [isHeadcounting, setIsHeadcounting] = useState(false);

  const generateQRData = useCallback(() => {
    const payload = {
      sessionId: sessionId,
      timestamp: Date.now(),
      expiresAt: Date.now() + DURATION * 1000,
    };
    setQrData(JSON.stringify(payload));
  }, [sessionId]);

  useEffect(() => {
    generateQRData();

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          generateQRData();
          return DURATION;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [generateQRData]);
  
  const handleConfirmHeadcount = (count: number) => {
    onHeadcountComplete(count);
    setIsHeadcounting(false);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full max-w-5xl">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full">
          <div className="flex-shrink-0 w-full max-w-md mx-auto lg:mx-0">
            <QRCodeWithTimer qrData={qrData} timeLeft={timeLeft} duration={DURATION} />
          </div>
          <div className="w-full lg:max-w-sm">
            <AttendanceList
              presentStudents={presentStudents}
              totalStudents={totalStudents}
              mlHeadcount={mlHeadcount}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => setIsHeadcounting(true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-colors duration-200"
            >
              <CameraIcon />
              Perform Headcount
            </button>
            <button
              onClick={onStop}
              className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-colors duration-200"
            >
              Stop Session
            </button>
        </div>
      </div>
      {isHeadcounting && (
        <Headcount
          onClose={() => setIsHeadcounting(false)}
          onConfirm={handleConfirmHeadcount}
        />
      )}
    </>
  );
};

export default AttendanceScreen;