import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Student } from '../lib/mock-data';
import { supabase } from '../lib/supabaseClient';

declare const jsQR: any;

interface StudentDashboardProps {
  onLogout: () => void;
  student: Student;
}

/**
 * Records student attendance, either to Supabase or localStorage as a fallback.
 * Checks for duplicates before inserting a new record.
 * @param sessionId The unique ID for the current attendance session.
 * @param student The student object to record attendance for.
 * @returns A promise that resolves with a success message.
 * @throws An error if the database/storage operation fails.
 */
const recordAttendance = async (sessionId: string, student: Student): Promise<{ message: string }> => {
  // --- MOCK ATTENDANCE FLOW (if Supabase is not configured) ---
  if (!supabase) {
    console.warn("Supabase not configured. Saving attendance to localStorage.");
    const storageKey = `attendance-${sessionId}`;
    try {
      const currentAttendance: any[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const alreadyExists = currentAttendance.some(rec => rec.student_id === student.id);

      if (alreadyExists) {
        return { message: "Attendance already marked for this session." };
      }
      
      const newRecord = { 
        student_id: student.id, 
        session_id: sessionId,
        timestamp: Date.now() 
      };
      currentAttendance.push(newRecord);
      localStorage.setItem(storageKey, JSON.stringify(currentAttendance));
      return { message: "Attendance Marked Successfully! (Demo Mode)" };

    } catch (e: any) {
      console.error("Failed to write to localStorage:", e);
      throw new Error("An error occurred while saving attendance in demo mode.");
    }
  }
  
  // --- SUPABASE ATTENDANCE FLOW ---
  // Check if attendance has already been recorded for this student in this session
  const { data: existingRecord, error: checkError } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', student.id)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (checkError) {
    console.error("Supabase check error:", checkError);
    throw new Error(`Database error: ${checkError.message}`);
  }

  if (existingRecord) {
    return { message: "Attendance already marked for this session." };
  }

  // Insert new attendance record
  const { error: insertError } = await supabase
    .from('attendance')
    .insert({
        student_id: student.id,
        session_id: sessionId
    });
  
  if (insertError) {
    console.error("Supabase insert error:", insertError);
    throw new Error(`Database error: ${insertError.message}`);
  }
  
  return { message: "Attendance Marked Successfully!" };
};


const ScanIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 019.07 4h5.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LogoutIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout, student }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCodeDetected, setIsCodeDetected] = useState(false);
  const [scannedData, setScannedData] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
    }
    if(videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, []);

  const startScan = async () => {
    setScannedData(null);
    setScanError(null);
    setSuccessMessage(null);
    setIsScanning(true);
    setIsProcessing(false);
    setIsCodeDetected(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errorMessage = "Could not access the camera. Please check permissions.";
      if (err instanceof DOMException) {
          switch (err.name) {
              case 'NotAllowedError':
                  errorMessage = "Camera permission denied. Please allow camera access in your browser settings to continue.";
                  break;
              case 'NotFoundError':
                  errorMessage = "No camera found on this device. Please ensure one is connected and enabled.";
                  break;
              case 'NotReadableError':
                  errorMessage = "Your camera is currently in use by another application. Please close it and try again.";
                  break;
              case 'AbortError':
                   errorMessage = "Camera access was aborted. Please try again.";
                   break;
              default:
                  errorMessage = `An unexpected camera error occurred: ${err.message}`;
          }
      }
      setScanError(errorMessage);
      setIsScanning(false);
      cleanup();
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    cleanup();
  };
  
  const handleScannedCode = async (data: any) => {
    // isProcessing state is set in scanFrame before this is called
    try {
      // 1. Validate QR code data expiration
      if (Date.now() > data.expiresAt) {
          throw new Error("This QR code has expired. Please scan the new one.");
      }
      
      // 2. Send the student's ID and session ID to the backend/mock
      const result = await recordAttendance(data.sessionId, student);
      
      // 3. Provide success message
      setSuccessMessage(result.message);
      setScannedData(data); // Show details of the last successful scan

    } catch (e: any) {
      // 4. Provide error message on failure
      // Use setTimeout to ensure the user sees the error after the UI transitions back
      setTimeout(() => setScanError(e.message || "Failed to process attendance code."), 100);
      setScannedData(null);
    } finally {
      // 5. Cleanup
      stopScan();
      setIsProcessing(false);
    }
  };


  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      if (streamRef.current) animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;

    if(context){
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            setIsCodeDetected(true);
            setIsProcessing(true);
            // Stop scanning immediately
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }

            setTimeout(() => {
                try {
                    const data = JSON.parse(code.data);
                    if (data.sessionId && data.timestamp && data.expiresAt) {
                         handleScannedCode(data);
                    } else {
                        throw new Error("Invalid attendance code format.");
                    }
                } catch(e: any) {
                    const errorMessage = e.message || "This is not a valid attendance QR code.";
                     // Use setTimeout to ensure the user sees the error after the UI transitions back
                    setTimeout(() => setScanError(errorMessage), 100);
                    setScannedData(null);
                    stopScan();
                    setIsProcessing(false);
                }
            }, 500); // 500ms delay to show the "detected" state
        } else {
            if (streamRef.current) animationFrameIdRef.current = requestAnimationFrame(scanFrame);
        }
    }
  };

  useEffect(() => {
      return () => {
          cleanup();
      }
  }, [cleanup]);

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center text-center p-8 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-sm">
        <button
            onClick={onLogout}
            className="absolute top-4 right-4 inline-flex items-center justify-center px-4 py-2 bg-slate-700 text-slate-300 font-semibold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500/50 transition-colors duration-200"
            aria-label="Logout"
        >
            <LogoutIcon />
            Logout
        </button>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Student Dashboard</h1>
        <p className="text-slate-300 mb-4">Welcome, {student.name}!</p>
        
        {isScanning ? (
            <div className="w-full mt-4">
                <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden shadow-inner">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 border-8 rounded-lg transition-colors ${isCodeDetected ? 'border-green-400 animate-fast-pulse' : 'border-cyan-500/50'}`} />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <button onClick={stopScan} className="mt-6 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-colors duration-200">
                    Cancel Scan
                </button>
            </div>
        ) : (
            <div className="flex flex-col items-center">
                 <p className="text-slate-300 text-lg my-6">
                    Ready to check in? Click the button below to scan the attendance QR code.
                </p>
                <button
                    onClick={startScan}
                    className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
                >
                    <ScanIcon />
                    Scan Attendance QR Code
                </button>
            </div>
        )}

        {scanError && <p className="mt-4 text-red-400 font-semibold">{scanError}</p>}
        {successMessage && <p className="mt-4 text-green-400 font-semibold">{successMessage}</p>}
        
        {scannedData && (
            <div className="mt-6 w-full text-left bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Last Scan Details:</h3>
                <p className="text-slate-300 text-sm">Session ID: <span className="font-mono text-cyan-400">{scannedData.sessionId}</span></p>
                <p className="text-slate-300 text-sm">Timestamp: <span className="font-mono text-cyan-400">{new Date(scannedData.timestamp).toLocaleString()}</span></p>
            </div>
        )}
    </div>
  );
};

export default StudentDashboard;