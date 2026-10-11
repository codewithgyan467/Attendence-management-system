'use client';

import { useState, useEffect } from 'react';

import { API_URL } from '@/lib/api';

export default function FacultyDashboard() {
  const [sessionActive, setSessionActive] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [facultyName, setFacultyName] = useState('Faculty');
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);

  // Authenticate and fetch timetable on mount
  useEffect(() => {
    async function init() {
      try {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          window.location.href = '/';
          return;
        }
        setToken(storedToken);

        // Fetch timetable
        const ttRes = await fetch(`${API_URL}/attendance/faculty/timetable`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (!ttRes.ok) throw new Error("Unauthorized");
        const ttData = await ttRes.json();
        setTodayClasses(ttData);
      } catch (e) {
        console.error("Init Error:", e);
        window.location.href = '/';
      }
    }
    init();
  }, []);

  // Poll for roster when session is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive && activeSession && token) {
      const fetchRoster = async () => {
        try {
          const res = await fetch(`${API_URL}/attendance/session/${activeSession.id}/attendance`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setRoster(data);
          }
        } catch (e) {
          console.error("Failed to fetch roster", e);
        }
      };
      
      fetchRoster(); // Fetch immediately
      interval = setInterval(fetchRoster, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [sessionActive, activeSession, token]);

  const startSession = async (cls: any) => {
    if (!token) return alert('Not authenticated yet');
    try {
      const res = await fetch(`${API_URL}/attendance/session/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          classroomId: cls.classroomId,
          timetableEntryId: cls.id
        }) 
      });
      const data = await res.json();
      if (res.ok) {
        setSessionActive(true);
        setActiveSession({ ...data, classDetails: cls });
      } else {
        alert('Failed to start session: ' + data.message);
      }
    } catch (e) {
      console.error("Error starting session", e);
    }
  };

  const endSession = async () => {
    if (!token || !activeSession) return;
    try {
      await fetch(`${API_URL}/attendance/session/${activeSession.id}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSessionActive(false);
      setActiveSession(null);
    } catch (e) {
      console.error("Error ending session", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-white p-4 sm:p-6 md:p-8 overflow-x-hidden bg-grid-mesh">
      {/* Ambient background glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <header className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Faculty Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{facultyName}</h1>
            <p className="text-xs sm:text-sm text-slate-400">Department of Computer Applications • AEC</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              System Live
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {!sessionActive ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>📅</span> Today&apos;s Lecture Schedule
              </h2>
              <span className="text-xs text-slate-400 font-medium">{todayClasses.length} Scheduled</span>
            </div>
            
            {todayClasses.length === 0 && (
              <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center text-slate-400">
                <div className="text-3xl mb-2">☕</div>
                <h3 className="text-base font-semibold text-slate-200">No classes scheduled for today</h3>
                <p className="text-xs text-slate-400 mt-1">Enjoy your time or check other semester assignments.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {todayClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className="glass-panel rounded-2xl p-5 sm:p-6 relative hover:border-indigo-400/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {cls.subjectType}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {cls.startTime} — {cls.endTime}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2">
                      {cls.section?.subject?.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Code: {cls.section?.subject?.code} • {cls.classroom?.name}
                    </p>
                  </div>

                  <button 
                    onClick={() => startSession(cls)}
                    className="glass-btn w-full py-3 rounded-xl font-bold text-sm sm:text-base cursor-pointer shadow-lg active:scale-[0.99] transition-all"
                  >
                    🚀 Start Attendance Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Active Session Banner */}
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-rose-500/30 bg-rose-500/[0.05]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 mb-3 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span> Active Classroom Session
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                    {activeSession.classDetails?.section?.subject?.name || 'Class Session'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {activeSession.classDetails?.classroom?.name} • Started at {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <button 
                  onClick={endSession}
                  className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm sm:text-base transition-colors shadow-lg shadow-rose-900/30 shrink-0 cursor-pointer"
                >
                  ⏹ End Attendance Session
                </button>
              </div>
            </div>

            {/* Attendance Stats Cards */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="glass-panel rounded-2xl p-5 sm:p-6 text-center border-emerald-500/20 bg-emerald-500/[0.04]">
                <span className="text-xs font-bold uppercase text-emerald-300 tracking-wider">Present / Late</span>
                <div className="text-3xl sm:text-5xl font-extrabold text-emerald-400 mt-1">
                  {roster.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length}
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 sm:p-6 text-center border-amber-500/20 bg-amber-500/[0.04]">
                <span className="text-xs font-bold uppercase text-amber-300 tracking-wider">Pending / Offline</span>
                <div className="text-3xl sm:text-5xl font-extrabold text-amber-400 mt-1">
                  {roster.filter(r => r.status === 'PENDING').length}
                </div>
              </div>
            </div>

            {/* Live Student Roster */}
            <div className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h3 className="font-bold text-base sm:text-lg text-white">Live Student Roster ({roster.length})</h3>
                <span className="text-xs text-slate-400">Auto-refreshing every 3 seconds</span>
              </div>
              
              {roster.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Waiting for students to mark attendance...
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                  {roster.map((student) => (
                    <div key={student.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          student.status === 'PRESENT' || student.status === 'LATE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {student.status === 'PRESENT' || student.status === 'LATE' ? '✓' : '✕'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm sm:text-base text-white">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.enrollmentNo}</p>
                        </div>
                      </div>
                      {student.time && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                          {new Date(student.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
