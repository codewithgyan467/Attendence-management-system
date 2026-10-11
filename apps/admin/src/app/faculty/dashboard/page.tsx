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

  return (
    <div className="min-h-screen bg-white text-black p-8 md:p-12 font-mono selection:bg-[#ffe600] selection:text-black">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-8 border-black pb-6">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter bg-black text-white inline-block px-4 py-2">FACULTY PORTAL</h1>
            <p className="text-2xl font-bold mt-4 border-l-4 border-black pl-4 uppercase">{facultyName} • MCA Dept</p>
          </div>
          <div className="bg-[#ffe600] border-4 border-black px-6 py-3 text-xl font-bold uppercase shadow-[8px_8px_0_0_#000]">
            System Online • 2026
          </div>
        </header>

        {!sessionActive ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-black uppercase tracking-widest bg-black text-white inline-block px-3 py-1 mb-4">TODAY'S CLASSES</h2>
            
            {todayClasses.length === 0 && (
              <div className="border-4 border-black p-8 text-xl font-bold uppercase bg-gray-100">
                No classes scheduled for today.
              </div>
            )}

            {todayClasses.map((cls) => (
              <div key={cls.id} className="bg-white border-4 border-black p-8 relative shadow-[12px_12px_0_0_#000] hover:-translate-y-1 hover:shadow-[16px_16px_0_0_#000] transition-all mb-6">
                <div className="absolute top-0 right-0 bg-black text-white font-bold px-4 py-2 uppercase text-xl">
                  {cls.subjectType}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                  <div>
                    <h3 className="text-4xl font-black uppercase mb-4">{cls.section.subject.name} ({cls.section.subject.code})</h3>
                    <div className="flex flex-wrap items-center gap-4 font-bold text-lg uppercase">
                      <span className="bg-[#ffe600] border-2 border-black px-4 py-2">
                        {cls.classroom.name}
                      </span>
                      <span className="bg-white border-2 border-black px-4 py-2">
                        {cls.startTime} — {cls.endTime}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => startSession(cls)}
                    className="bg-black text-white hover:bg-[#ffe600] hover:text-black font-black uppercase text-2xl py-6 px-10 border-4 border-transparent hover:border-black transition-colors"
                  >
                    START SESSION
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-[#ffe600] border-4 border-black p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[12px_12px_0_0_#000]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-black uppercase px-2 bg-red-600 text-white blink">● LIVE SESSION</span>
                </div>
                <h2 className="text-5xl font-black uppercase">{activeSession.classDetails.section.subject.name}</h2>
                <p className="text-2xl font-bold mt-2 uppercase border-t-4 border-black pt-2">
                  {activeSession.classDetails.classroom.name} • STARTED AT {new Date(activeSession.startTime).toLocaleTimeString()}
                </p>
              </div>
              
              <button 
                onClick={endSession}
                className="bg-red-600 hover:bg-black text-white font-black text-2xl py-6 px-10 border-4 border-black transition-colors uppercase"
              >
                END SESSION
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black uppercase mb-2 bg-black text-white px-4 py-1">PRESENT</span>
                <span className="text-7xl font-black text-green-600">
                  {roster.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length}
                </span>
              </div>
              <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black uppercase mb-2 bg-black text-white px-4 py-1">PENDING</span>
                <span className="text-7xl font-black text-red-600">
                  {roster.filter(r => r.status === 'PENDING').length}
                </span>
              </div>
            </div>

            <div className="bg-white border-4 border-black shadow-[12px_12px_0_0_#000]">
              <div className="p-6 border-b-4 border-black flex justify-between items-center bg-gray-100">
                <h3 className="font-black text-3xl uppercase">Student Roster</h3>
                <input type="text" placeholder="SEARCH..." className="px-4 py-2 border-4 border-black font-bold uppercase text-lg focus:outline-none focus:bg-[#ffe600]" />
              </div>
              
              {roster.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-bold uppercase text-xl">
                  Waiting for students to mark attendance...
                </div>
              ) : (
                <div className="divide-y-4 divide-black">
                  {roster.map((student) => (
                    <div key={student.id} className="p-6 flex items-center justify-between hover:bg-gray-100">
                      <div className="flex items-center gap-6">
                        {student.status === 'PRESENT' || student.status === 'LATE' ? (
                          <div className="w-12 h-12 bg-green-500 border-4 border-black flex items-center justify-center font-black text-white text-2xl">
                            ✓
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-red-500 border-4 border-black flex items-center justify-center font-black text-white text-2xl">
                            ✕
                          </div>
                        )}
                        <div>
                          <p className="font-black text-2xl uppercase">{student.name}</p>
                          <p className="text-lg font-bold text-gray-600">{student.enrollmentNo}</p>
                        </div>
                      </div>
                      {student.time && (
                        <span className="text-2xl font-black bg-[#ffe600] border-2 border-black px-4 py-1">
                          {new Date(student.time).toLocaleTimeString()}
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
      
      <style dangerouslySetInnerHTML={{__html: `
        .blink { animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }
      `}} />
    </div>
  );
}
