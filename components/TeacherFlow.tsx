import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './LandingPage';
import AttendanceScreen from './AttendanceScreen';
import { StudentRecord } from './AttendanceList';
import { supabase } from '../lib/supabaseClient';
import { Student, STUDENTS } from '../lib/mock-data';


interface TeacherFlowProps {
  onLogout: () => void;
}

const LogoutIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const TeacherFlow: React.FC<TeacherFlowProps> = ({ onLogout }) => {
  const [isAttendanceActive, setIsAttendanceActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [presentStudents, setPresentStudents] = useState<StudentRecord[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [mlHeadcount, setMlHeadcount] = useState<number | null>(null);


  const startAttendance = useCallback(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newSessionId);
    setPresentStudents([]); // Clear list for new session
    setMlHeadcount(null); // Reset headcount for new session
    setIsAttendanceActive(true);
  }, []);

  const stopAttendance = useCallback(() => {
    setIsAttendanceActive(false);
    setSessionId(null);
  }, []);

  // Fetch all students on component mount
  useEffect(() => {
    const fetchAllStudents = async () => {
      setIsLoadingStudents(true);
      if (!supabase) {
        console.warn("Supabase not configured, using mock student list.");
        // Simulate network delay for mock data
        setTimeout(() => {
          setAllStudents(STUDENTS);
          setIsLoadingStudents(false);
        }, 500);
        return;
      }
      
      const { data, error } = await supabase
        .from('students')
        .select('id, name, roll_number')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        setAllStudents([]);
      } else if (data) {
        const formattedStudents: Student[] = data.map(student => ({
          id: student.id,
          name: student.name,
          rollNumber: student.roll_number,
        }));
        setAllStudents(formattedStudents);
      }
      setIsLoadingStudents(false);
    };

    fetchAllStudents();
  }, []); // Empty dependency array means this runs once on mount

  // Poll for live attendance data during an active session
  useEffect(() => {
    if (!isAttendanceActive || !sessionId) {
      return;
    }

    // --- MOCK POLLING FROM LOCALSTORAGE ---
    if (!supabase) {
      console.warn("Supabase is not configured. Live attendance polling is disabled.");
      
      const fetchAttendanceFromLocalStorage = () => {
        try {
          const attendanceData = JSON.parse(localStorage.getItem(`attendance-${sessionId}`) || '[]');
          if (attendanceData.length !== presentStudents.length) {
            const updatedStudents: StudentRecord[] = attendanceData.map((record: any) => {
                const studentDetails = STUDENTS.find(s => s.id === record.student_id);
                return {
                    id: record.student_id,
                    name: studentDetails ? studentDetails.name : 'Unknown Student',
                    timestamp: record.timestamp,
                };
            }).sort((a, b) => a.name.localeCompare(b.name));
            setPresentStudents(updatedStudents);
          }
        } catch (e) {
          console.error("Error reading mock attendance from localStorage:", e);
        }
      };

      const interval = setInterval(fetchAttendanceFromLocalStorage, 2000);
      fetchAttendanceFromLocalStorage(); // Initial fetch
      
      return () => clearInterval(interval);
    }
    // --- END MOCK POLLING ---

    // --- SUPABASE POLLING ---
    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          created_at,
          students (
            id,
            name
          )
        `)
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error fetching attendance:', error);
        return;
      }

      if (data && data.length !== presentStudents.length) {
        const updatedStudents: StudentRecord[] = data
          .map((rec: any) => ({
            id: rec.students.id,
            name: rec.students.name,
            timestamp: new Date(rec.created_at).getTime(),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setPresentStudents(updatedStudents);
      }
    };

    const interval = setInterval(fetchAttendance, 2000); // Poll every 2 seconds
    fetchAttendance(); // Initial fetch

    return () => clearInterval(interval);
  }, [isAttendanceActive, sessionId, presentStudents.length]);

  return (
    <div className="relative w-full flex items-center justify-center">
       <button
        onClick={onLogout}
        className="absolute top-4 right-4 inline-flex items-center justify-center px-4 py-2 bg-slate-700 text-slate-300 font-semibold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500/50 transition-colors duration-200 z-10"
        aria-label="Logout"
      >
        <LogoutIcon />
        Logout
      </button>

      {isAttendanceActive && sessionId ? (
        <AttendanceScreen 
          onStop={stopAttendance} 
          sessionId={sessionId} 
          presentStudents={presentStudents}
          totalStudents={allStudents.length}
          mlHeadcount={mlHeadcount}
          onHeadcountComplete={setMlHeadcount}
        />
      ) : (
        <LandingPage 
          onStart={startAttendance}
          allStudents={allStudents}
          isLoading={isLoadingStudents}
        />
      )}
    </div>
  );
};

export default TeacherFlow;