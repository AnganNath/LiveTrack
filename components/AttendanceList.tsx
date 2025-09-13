import React from 'react';

export interface StudentRecord {
    id: string;
    name: string;
    timestamp: number;
}

interface AttendanceListProps {
  presentStudents: StudentRecord[];
  totalStudents: number;
  mlHeadcount: number | null;
}

const CheckCircleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const AttendanceList: React.FC<AttendanceListProps> = ({ presentStudents, totalStudents, mlHeadcount }) => {
  const presentCount = presentStudents.length;
  const discrepancy = mlHeadcount !== null ? mlHeadcount - presentCount : null;

  let discrepancyColor = 'text-slate-400';
  if (discrepancy !== null) {
      if (discrepancy > 0) discrepancyColor = 'text-yellow-400'; // More people than scanned
      if (discrepancy < 0) discrepancyColor = 'text-red-400'; // Less people than scanned
      if (discrepancy === 0) discrepancyColor = 'text-green-400'; // Match
  }

  return (
    <div className="bg-slate-800/70 p-6 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-sm h-full max-h-[504px] w-full">
      <h2 className="text-xl font-bold text-slate-100 mb-4 text-center">
        Session Status
      </h2>

      <div className="grid grid-cols-2 gap-4 text-center mb-6">
        <div className="bg-slate-900/50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-cyan-400">{presentCount} / {totalStudents}</div>
            <div className="text-xs text-slate-400 uppercase">Present Students</div>
        </div>
         <div className="bg-slate-900/50 p-3 rounded-lg">
            <div className={`text-2xl font-bold ${mlHeadcount === null ? 'text-slate-500' : 'text-cyan-400'}`}>{mlHeadcount ?? 'N/A'}</div>
            <div className="text-xs text-slate-400 uppercase">ML Headcount</div>
        </div>
        {discrepancy !== null && (
             <div className="col-span-2 bg-slate-900/50 p-3 rounded-lg">
                <div className={`text-2xl font-bold ${discrepancyColor}`}>
                    {discrepancy > 0 ? `+${discrepancy}` : discrepancy}
                </div>
                <div className="text-xs text-slate-400 uppercase">Discrepancy</div>
            </div>
        )}
      </div>

      <div className="w-full h-px bg-slate-700 mb-4"></div>

      {presentStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48">
             <p className="text-slate-400 text-center mt-8">Waiting for students to scan...</p>
        </div>
      ) : (
        <ul className="space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
          {presentStudents.map((student) => (
            <li key={student.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg animate-fade-in">
              <div className="flex items-center overflow-hidden">
                <CheckCircleIcon />
                <span className="ml-3 text-slate-200 truncate" title={student.name}>{student.name}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono flex-shrink-0 ml-2">
                {new Date(student.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttendanceList;