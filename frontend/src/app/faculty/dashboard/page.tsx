'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import ClockWidget from '@/components/ClockWidget';

export default function FacultyDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [facultyName, setFacultyName] = useState('Dr. S. Bordoloi (SB)');
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [simDay, setSimDay] = useState<number | null>(null);
  const [simTime, setSimTime] = useState<string | null>(null);
  const [simChoice, setSimChoice] = useState('live');

  const fetchScheduleAndClasses = useCallback(async (authToken: string, day: number | null, time: string | null) => {
    try {
      const params = new URLSearchParams();
      if (day !== null) params.append('simulateDay', String(day));
      if (time !== null) params.append('simulateTime', time);
      params.append('semester', '1');

      const [scheduleRes, ttRes] = await Promise.all([
        fetch(`${API_URL}/attendance/live-schedule?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_URL}/attendance/faculty/timetable`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (scheduleRes.ok) {
        const sData = await scheduleRes.json();
        setScheduleData(sData);

        // Fetch roster if active session exists
        if (sData.active && sData.session) {
          const rRes = await fetch(`${API_URL}/attendance/session/${sData.session.id}/attendance`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (rRes.ok) {
            setRoster(await rRes.json());
          }
        }
      }

      if (ttRes.ok) {
        setTodayClasses(await ttRes.json());
      }
    } catch (e) {
      console.error('Faculty fetch error:', e);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/';
      return;
    }
    setToken(storedToken);
    fetchScheduleAndClasses(storedToken, simDay, simTime);
  }, [fetchScheduleAndClasses, simDay, simTime]);

  // Periodic roster polling
  useEffect(() => {
    if (!token || !scheduleData?.session?.id) return;
    const interval = setInterval(async () => {
      try {
        const rRes = await fetch(`${API_URL}/attendance/session/${scheduleData.session.id}/attendance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (rRes.ok) {
          setRoster(await rRes.json());
        }
      } catch (e) {
        console.error('Roster polling error:', e);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [token, scheduleData?.session?.id]);

  const handleSimulation = (day: number | null, time: string | null) => {
    setSimDay(day);
    setSimTime(time);
    if (!day) setSimChoice('live');
    else if (day === 2 && time === '08:15') setSimChoice('tue-os');
    else if (day === 2 && time === '09:30') setSimChoice('tue-lab');
    else if (day === 3 && time === '11:15') setSimChoice('wed-coa');
    else if (day === 5 && time === '14:20') setSimChoice('fri-os');

    if (token) fetchScheduleAndClasses(token, day, time);
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
            <p className="text-xs sm:text-sm text-slate-400">Assam Engineering College • Department of Computer Applications</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Timetable Enforced
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Live Clock & Routine Calendar Component */}
        <ClockWidget 
          scheduleData={scheduleData}
          onSimulationChange={handleSimulation}
          selectedSimulation={simChoice}
        />

        {/* Live Active Session Panel */}
        {scheduleData?.active && scheduleData?.slot ? (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-indigo-500/30 bg-indigo-500/[0.04]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> In Progress: Routine Timetable Slot
                  </div>
                  <h2 className="text-xl sm:text-3xl font-extrabold text-white">
                    {scheduleData.slot.subject} ({scheduleData.slot.code})
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Slot: {scheduleData.slot.startTime} — {scheduleData.slot.endTime} • Room: {scheduleData.slot.classroom} • Type: {scheduleData.slot.type}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Stats Cards */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="glass-panel rounded-2xl p-5 sm:p-6 text-center border-emerald-500/20 bg-emerald-500/[0.04]">
                <span className="text-xs font-bold uppercase text-emerald-300 tracking-wider">Present Students</span>
                <div className="text-3xl sm:text-5xl font-extrabold text-emerald-400 mt-1">
                  {roster.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length}
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 sm:p-6 text-center border-amber-500/20 bg-amber-500/[0.04]">
                <span className="text-xs font-bold uppercase text-amber-300 tracking-wider">Pending Roster</span>
                <div className="text-3xl sm:text-5xl font-extrabold text-amber-400 mt-1">
                  {roster.filter(r => r.status === 'PENDING').length}
                </div>
              </div>
            </div>

            {/* Live Student Roster */}
            <div className="glass-panel rounded-2xl sm:rounded-3xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Live Attendance Stream ({roster.length} registered students)
                </h3>
                <span className="text-xs text-slate-400">Auto-refreshing every 4 seconds</span>
              </div>
              
              {roster.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Waiting for enrolled students to complete face and location verification...
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                  {roster.map((student) => (
                    <div key={student.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          student.status === 'PRESENT' || student.status === 'LATE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/40'
                        }`}>
                          {student.status === 'PRESENT' || student.status === 'LATE' ? '✓' : '—'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm sm:text-base text-white">{student.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{student.enrollmentNo}</p>
                        </div>
                      </div>
                      <div>
                        {student.status === 'PRESENT' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Present
                          </span>
                        ) : student.status === 'LATE' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Late
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-slate-400 space-y-2">
            <div className="text-4xl mb-2">📋</div>
            <h3 className="text-base sm:text-lg font-bold text-white">No Active Class Scheduled Right Now</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Under strict AEC routine enforcement, attendance sessions automatically open and close precisely with each scheduled timetable slot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
