import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Student, STUDENTS } from '../lib/mock-data';

interface LoginPageProps {
  onLogin: (role: 'teacher' | 'student', userData?: Student) => void;
}

// --- Hardcoded Credentials for Demo ---
const TEACHER_ID = 'teacher@school.edu';
const TEACHER_PASS = 'password123';
const STUDENT_PASS = 'password456'; // Same password for all students in this demo
// ------------------------------------

const TeacherIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21h3a1 1 0 001-1v-1a2 2 0 00-2-2h-3v4z" />
    </svg>
);

const StudentIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [teacherId, setTeacherId] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [rememberTeacher, setRememberTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState('');
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [rememberStudent, setRememberStudent] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [isStudentLoading, setIsStudentLoading] = useState(false);

  useEffect(() => {
    const rememberedTeacherId = localStorage.getItem('rememberedTeacherId');
    if (rememberedTeacherId) {
      setTeacherId(rememberedTeacherId);
      setRememberTeacher(true);
    }

    const rememberedStudentId = localStorage.getItem('rememberedStudentId');
    if (rememberedStudentId) {
      setStudentId(rememberedStudentId);
      setRememberStudent(true);
    }
  }, []);

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTeacherLoading(true);
    // Simulate network delay
    setTimeout(() => {
      if (teacherId === TEACHER_ID && teacherPassword === TEACHER_PASS) {
        setTeacherError('');
        if (rememberTeacher) {
          localStorage.setItem('rememberedTeacherId', teacherId);
        } else {
          localStorage.removeItem('rememberedTeacherId');
        }
        onLogin('teacher');
      } else {
        setTeacherError('Invalid ID or password.');
      }
      setIsTeacherLoading(false);
    }, 500);
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStudentLoading(true);
    setStudentError('');

    // --- MOCK LOGIN FLOW (if Supabase is not configured) ---
    if (!supabase) {
      console.warn("Supabase not configured. Using mock student login.");
      // Simulate network delay
      setTimeout(() => {
        const student = STUDENTS.find(s => s.rollNumber === studentId.trim());

        if (student && studentPassword === STUDENT_PASS) {
          if (rememberStudent) {
            localStorage.setItem('rememberedStudentId', studentId);
          } else {
            localStorage.removeItem('rememberedStudentId');
          }
          onLogin('student', student);
        } else {
          setStudentError('Invalid Roll Number or password.');
        }
        setIsStudentLoading(false);
      }, 500);
      return;
    }
    // --- END MOCK FLOW ---

    // --- SUPABASE LOGIN FLOW ---
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('roll_number', studentId.trim())
      .single(); // .single() expects one result and makes it an object, not an array

    if (error || !student) {
      setStudentError('Invalid Roll Number.');
      setIsStudentLoading(false);
      return;
    }
    
    // In a real app, you would hash and compare passwords. Here we use plain text for simplicity.
    if (student && studentPassword === STUDENT_PASS) {
      if (rememberStudent) {
        localStorage.setItem('rememberedStudentId', studentId);
      } else {
        localStorage.removeItem('rememberedStudentId');
      }
      // The student object from Supabase has `roll_number`, we map it to `rollNumber`
      onLogin('student', { id: student.id, name: student.name, rollNumber: student.roll_number });
    } else {
      setStudentError('Invalid password.');
    }
    setIsStudentLoading(false);
  };


  return (
    <div className="text-center p-8 max-w-5xl mx-auto">
       <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-2">
        Welcome to LiveTrack
      </h1>
      <p className="text-slate-300 text-lg mb-12">Please login to continue.</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Teacher Card */}
        <div className="bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 p-8 flex flex-col items-center backdrop-blur-sm">
          <TeacherIcon />
          <h2 className="text-3xl font-bold text-slate-100 mb-6">Teacher Login</h2>
          <form onSubmit={handleTeacherLogin} className="w-full flex flex-col gap-4">
            <div>
              <label htmlFor="teacher-id" className="block text-sm font-medium text-slate-300 text-left mb-1">Login ID</label>
              <input
                id="teacher-id"
                type="text"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="teacher@school.edu"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all focus:bg-cyan-900/30"
                required
                disabled={isTeacherLoading}
              />
            </div>
            <div>
              <label htmlFor="teacher-password" className="block text-sm font-medium text-slate-300 text-left mb-1">Password</label>
              <input
                id="teacher-password"
                type="password"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-all focus:bg-cyan-900/30"
                required
                disabled={isTeacherLoading}
              />
            </div>
            <div className="flex items-center">
                <input
                    id="remember-teacher"
                    name="remember-teacher"
                    type="checkbox"
                    checked={rememberTeacher}
                    onChange={(e) => setRememberTeacher(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                    disabled={isTeacherLoading}
                />
                <label htmlFor="remember-teacher" className="ml-2 block text-sm text-slate-300">Remember me</label>
            </div>
            {teacherError && <p className="text-red-400 text-sm mt-1">{teacherError}</p>}
            <button
              type="submit"
              disabled={isTeacherLoading}
              className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-lg hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTeacherLoading ? 'Logging in...' : 'Login as Teacher'}
            </button>
          </form>
        </div>

        {/* Student Card */}
        <div className="bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 p-8 flex flex-col items-center backdrop-blur-sm">
           <StudentIcon />
           <h2 className="text-3xl font-bold text-slate-100 mb-6">Student Login</h2>
           <form onSubmit={handleStudentLogin} className="w-full flex flex-col gap-4">
            <div>
              <label htmlFor="student-id" className="block text-sm font-medium text-slate-300 text-left mb-1">Roll Number</label>
              <input
                id="student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., S001"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all focus:bg-indigo-900/30"
                required
                disabled={isStudentLoading}
              />
            </div>
            <div>
              <label htmlFor="student-password" className="block text-sm font-medium text-slate-300 text-left mb-1">Password</label>
              <input
                id="student-password"
                type="password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all focus:bg-indigo-900/30"
                required
                disabled={isStudentLoading}
              />
            </div>
            <div className="flex items-center">
                <input
                    id="remember-student"
                    name="remember-student"
                    type="checkbox"
                    checked={rememberStudent}
                    onChange={(e) => setRememberStudent(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                    disabled={isStudentLoading}
                />
                <label htmlFor="remember-student" className="ml-2 block text-sm text-slate-300">Remember me</label>
            </div>
            {studentError && <p className="text-red-400 text-sm mt-1">{studentError}</p>}
             <button
                type="submit"
                disabled={isStudentLoading}
                className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isStudentLoading ? 'Logging in...' : 'Login as Student'}
             </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;