import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import TeacherFlow from './components/TeacherFlow';
import StudentDashboard from './components/StudentDashboard';
import { Student } from './lib/mock-data';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);

  const handleLogin = (role: 'teacher' | 'student', userData?: Student) => {
    setUserRole(role);
    if (userData) {
      setCurrentUser(userData);
    }
  };

  const handleLogout = () => {
    // Clear remembered ID on logout
    if (userRole === 'teacher') {
      localStorage.removeItem('rememberedTeacherId');
    } else if (userRole === 'student') {
      localStorage.removeItem('rememberedStudentId');
    }
    setUserRole(null);
    setCurrentUser(null);
  };

  const renderContent = () => {
    if (!userRole) {
      return <LoginPage onLogin={handleLogin} />;
    }
    if (userRole === 'teacher') {
      return <TeacherFlow onLogout={handleLogout} />;
    }
    if (userRole === 'student' && currentUser) {
      return <StudentDashboard onLogout={handleLogout} student={currentUser} />;
    }
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-900 font-sans antialiased">
      <main className="flex-grow w-full flex items-center justify-center">
        {renderContent()}
      </main>
      <footer className="text-slate-500 text-xs py-4">
        made by Ctrl Alt Win
      </footer>
    </div>
  );
};

export default App;
