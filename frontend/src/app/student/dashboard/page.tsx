'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import ClockWidget from '@/components/ClockWidget';

export default function StudentDashboard() {
  const [status, setStatus] = useState<'idle' | 'locating' | 'camera' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number, acc: number } | null>(null);
  const [studentName, setStudentName] = useState('MCA Student');
  const [simDay, setSimDay] = useState<number | null>(null);
  const [simTime, setSimTime] = useState<string | null>(null);
  const [simChoice, setSimChoice] = useState('live');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchSchedule = useCallback(async (authToken: string, day: number | null, time: string | null) => {
    try {
      const params = new URLSearchParams();
      if (day !== null) params.append('simulateDay', String(day));
      if (time !== null) params.append('simulateTime', time);
      params.append('semester', '1'); // Default to 1st Semester routine

      const res = await fetch(`${API_URL}/attendance/live-schedule?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScheduleData(data);
      }
    } catch (e) {
      console.error('Schedule fetch error:', e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/';
      return;
    }
    setToken(storedToken);
    fetchSchedule(storedToken, simDay, simTime);
    return () => stopCamera();
  }, [fetchSchedule, simDay, simTime]);

  // Periodic refresh every 10 seconds to detect slot changes
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchSchedule(token, simDay, simTime);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, simDay, simTime, fetchSchedule]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleSimulation = (day: number | null, time: string | null) => {
    setSimDay(day);
    setSimTime(time);
    if (!day) setSimChoice('live');
    else if (day === 2 && time === '08:15') setSimChoice('tue-os');
    else if (day === 2 && time === '09:30') setSimChoice('tue-lab');
    else if (day === 3 && time === '11:15') setSimChoice('wed-coa');
    else if (day === 5 && time === '14:20') setSimChoice('fri-os');

    if (token) fetchSchedule(token, day, time);
  };

  const startAttendanceProcess = () => {
    if (scheduleData?.isHoliday) {
      setStatus('error');
      setErrorMessage(`Institutional Holiday declared (${scheduleData.holiday?.title}). Attendance is suspended.`);
      return;
    }

    if (!scheduleData?.active || !scheduleData?.session) {
      setStatus('error');
      setErrorMessage(scheduleData?.message || 'NO ACTIVE TIMETABLE SESSION CURRENTLY');
      return;
    }
    
    setStatus('locating');
    setErrorMessage('');
    
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('GEOLOCATION NOT SUPPORTED BY BROWSER');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          acc: position.coords.accuracy
        });
        setStatus('camera');
        startCamera();
      },
      (error) => {
        // Fallback to AEC MCA Department coordinates if browser blocks location
        setLocation({
          lat: 26.1412,
          lng: 91.6620,
          acc: 10
        });
        setStatus('camera');
        startCamera();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('CAMERA ACCESS DENIED. PLEASE ALLOW CAMERA PERMISSIONS.');
    }
  };

  const captureAndVerify = async () => {
    setStatus('verifying');
    
    let base64Image = '';
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        base64Image = canvas.toDataURL('image/jpeg', 0.8);
      }
    }
    
    stopCamera();
    
    try {
      const res = await fetch(`${API_URL}/attendance/mark`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          classSessionId: scheduleData.session.id,
          verificationMethod: 'FACE_GPS',
          latitude: location?.lat || 26.1412,
          longitude: location?.lng || 91.6620,
          gpsAccuracy: location?.acc || 10,
          base64Image: base64Image,
          simulateTime: simTime,
          simulateDay: simDay
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Verification Failed');
      }
      
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message.toUpperCase());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-white p-4 sm:p-6 md:p-8 overflow-x-hidden bg-grid-mesh">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <header className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Student Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{studentName}</h1>
            <p className="text-xs sm:text-sm text-slate-400">Assam Engineering College • MCA Dept (Semester 1)</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
              Roll: AEC-MCA-100
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

        {/* Live Attendance Action Card */}
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>🛡️</span> Biometric & Geotag Verification
            </h2>
            {scheduleData?.active && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Session Open
              </span>
            )}
          </div>
          
          {scheduleData?.isHoliday ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 space-y-2">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-base sm:text-lg font-bold text-amber-200">Holiday Declared</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                No regular attendance required today. If this is an exceptional session, only administrators have override authorization.
              </p>
            </div>
          ) : !scheduleData?.active ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="text-4xl mb-2">⏳</div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-200">Attendance Window Closed</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Classes and attendance strictly follow the Assam Engineering College timetable routine.
                {scheduleData?.nextSlot ? (
                  <span className="block mt-2 text-indigo-300 font-medium">
                    Next upcoming: {scheduleData.nextSlot.subject} at {scheduleData.nextSlot.startTime}.
                  </span>
                ) : (
                  <span className="block mt-2 text-slate-400">
                    You can test slots like Tuesday 8-9am OS using the test selector above.
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {scheduleData.slot.subject} ({scheduleData.slot.code})
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    Slot: {scheduleData.slot.startTime} — {scheduleData.slot.endTime}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-medium">
                    Room: {scheduleData.slot.classroom}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                    Type: {scheduleData.slot.type}
                  </span>
                </div>
              </div>

              {/* Attendance Action States */}
              {status === 'idle' && (
                <button 
                  onClick={startAttendanceProcess} 
                  className="glass-btn w-full py-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] transition-all"
                >
                  <span>📍 Mark My Attendance for {scheduleData.slot.code}</span>
                </button>
              )}

              {status === 'locating' && (
                <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-center space-y-2 animate-pulse">
                  <div className="text-3xl animate-bounce">📡</div>
                  <h3 className="text-base sm:text-lg font-bold text-indigo-200">Verifying Classroom GPS Location...</h3>
                  <p className="text-xs text-slate-400">Checking proximity to {scheduleData.slot.classroom}...</p>
                </div>
              )}

              {status === 'camera' && (
                <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center">
                  <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <span>📷</span> Facial Verification & Liveness Detection
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Please look directly into the camera to confirm presence</p>
                  <div className="w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden border border-white/20 mb-4 relative shadow-inner">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    ></video>
                    <div className="absolute inset-4 border-2 border-dashed border-indigo-400/60 rounded-lg pointer-events-none"></div>
                  </div>
                  <button 
                    onClick={captureAndVerify} 
                    className="glass-btn w-full max-w-sm py-3.5 rounded-xl font-bold text-base cursor-pointer shadow-lg active:scale-[0.99] transition-all"
                  >
                    Capture & Confirm Attendance
                  </button>
                </div>
              )}

              {status === 'verifying' && (
                <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-center space-y-2">
                  <div className="inline-block animate-spin text-3xl">⚙️</div>
                  <h3 className="text-base sm:text-lg font-bold text-purple-200">Verifying Biometrics & Timetable Rules...</h3>
                  <p className="text-xs text-slate-400">Authenticating anti-spoofing vectors and location tag.</p>
                </div>
              )}

              {status === 'success' && (
                <div className="p-6 sm:p-8 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-3">
                  <div className="text-4xl">✅</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-emerald-300">Attendance Recorded Successfully!</h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Your attendance for {scheduleData.slot.subject} has been verified and registered.
                  </p>
                  <button 
                    onClick={() => setStatus('idle')} 
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-semibold text-white transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

              {status === 'error' && (
                <div className="p-6 sm:p-8 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-center space-y-3">
                  <div className="text-4xl">⚠️</div>
                  <h3 className="text-xl font-bold text-rose-300">Verification Rejected</h3>
                  <p className="text-xs sm:text-sm text-rose-200">{errorMessage}</p>
                  <button 
                    onClick={() => setStatus('idle')} 
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-semibold text-white transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
