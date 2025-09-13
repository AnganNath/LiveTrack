import React from 'react';
import { Student } from '../lib/mock-data';

interface LandingPageProps {
  onStart: () => void;
  allStudents: Student[];
  isLoading: boolean;
}

const StartIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


const LandingPage: React.FC<LandingPageProps> = ({ onStart, allStudents, isLoading }) => {
  return (
    <div className="flex flex-col items-center w-full max-w-5xl gap-8">
        <div className="text-center p-8 w-full max-w-2xl mx-auto bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-sm">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-4">
                Dynamic QR Attendance
            </h1>
            <p className="text-slate-300 text-lg mb-8">
                Generate a secure, time-sensitive QR code for your students to scan. A new code is generated every 30 seconds to ensure attendance integrity.
            </p>
            <button
                onClick={onStart}
                className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
            >
                <StartIcon />
                Start Attendance Session
            </button>
        </div>

        <div className="bg-slate-800/70 p-6 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-sm w-full max-w-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4 text-center">
                Enrolled Students ({isLoading ? '...' : allStudents.length})
            </h2>
            {isLoading ? (
                <div className="text-center text-slate-400 py-4">Loading students...</div>
            ) : allStudents.length === 0 ? (
                <div className="text-center text-slate-400 py-4">
                    No students found. Please add students to the database to see them here.
                </div>
            ) : (
                <ul className="space-y-3 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                {allStudents.map((student) => (
                    <li key={student.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                        <span className="text-slate-200 truncate" title={student.name}>{student.name}</span>
                        <span className="text-xs text-slate-400 font-mono flex-shrink-0 ml-2">{student.rollNumber}</span>
                    </li>
                ))}
                </ul>
            )}
        </div>
    </div>
  );
};

export default LandingPage;