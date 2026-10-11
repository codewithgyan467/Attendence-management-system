'use client';

import { useState, useRef, useEffect } from 'react';

import { API_URL } from '@/lib/api';

export default function StudentDashboard() {
  const [status, setStatus] = useState<'idle' | 'locating' | 'camera' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number, acc: number } | null>(null);
  const [studentName, setStudentName] = useState('STUDENT');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Authenticate and get active session on mount
  useEffect(() => {
    async function init() {
      try {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          window.location.href = '/';
          return;
        }
        setToken(storedToken);

        const sessionsRes = await fetch(`${API_URL}/attendance/sessions/active`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (!sessionsRes.ok) throw new Error("Unauthorized");
        const sessions = await sessionsRes.json();
        if (sessions.length > 0) {
          setActiveSession(sessions[0]);
        }
      } catch (e) {
        console.error("Init Error:", e);
        window.location.href = '/';
      }
    }
    init();
    return () => stopCamera();
  }, []);

  // Poll for active sessions if none exist yet
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (token && !activeSession) {
      interval = setInterval(async () => {
        try {
          const sessionsRes = await fetch(`${API_URL}/attendance/sessions/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const sessions = await sessionsRes.json();
          if (sessions.length > 0) {
            setActiveSession(sessions[0]);
          }
        } catch (e) {
          console.error("Polling Error:", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [token, activeSession]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startAttendanceProcess = () => {
    if (!activeSession) {
      setStatus('error');
      setErrorMessage('NO ACTIVE SESSIONS FOUND');
      return;
    }
    
    setStatus('locating');
    setErrorMessage('');
    
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('GEOLOCATION NOT SUPPORTED');
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
        setStatus('error');
        setErrorMessage(error.message.toUpperCase() || 'FAILED TO GET LOCATION');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
      setErrorMessage('CAMERA ACCESS DENIED');
    }
  };

  const captureAndVerify = async () => {
    setStatus('verifying');
    
    // Capture image from video
    let base64Image = '';
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
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
          classSessionId: activeSession.id,
          verificationMethod: 'FACE_GPS',
          latitude: location?.lat,
          longitude: location?.lng,
          gpsAccuracy: location?.acc,
          base64Image: base64Image
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
            <p className="text-xs sm:text-sm text-slate-400">Assam Engineering College • MCA Dept</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300">
              ID: AEC-MCA-100
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Live Classes Card */}
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>📚</span> Live Classroom Session
            </h2>
            {activeSession && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Active
              </span>
            )}
          </div>
          
          {!activeSession ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="text-4xl mb-3">⏳</div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-200">No active class session</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Waiting for your faculty to start attendance for today&apos;s lecture. This card updates automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                  {activeSession.timetableEntry?.section?.subject?.name || 'Classroom Lecture'}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    Room: {activeSession.classroom?.name || 'Classroom'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-medium">
                    Started: {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Attendance Action State */}
              {status === 'idle' && (
                <button 
                  onClick={startAttendanceProcess} 
                  className="glass-btn w-full py-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] transition-all"
                >
                  <span>📍 Mark My Attendance</span>
                </button>
              )}

              {status === 'locating' && (
                <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-center space-y-2 animate-pulse">
                  <div className="text-3xl animate-bounce">📡</div>
                  <h3 className="text-base sm:text-lg font-bold text-indigo-200">Checking GPS Location...</h3>
                  <p className="text-xs text-slate-400">Verifying proximity to classroom...</p>
                </div>
              )}

              {status === 'camera' && (
                <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center">
                  <h3 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <span>📷</span> Facial Verification & Liveness
                  </h3>
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
                    Capture & Verify Attendance
                  </button>
                </div>
              )}

              {status === 'verifying' && (
                <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-center space-y-2">
                  <div className="inline-block animate-spin text-3xl">⚙️</div>
                  <h3 className="text-base sm:text-lg font-bold text-purple-200">Verifying Biometrics & Distance...</h3>
                  <p className="text-xs text-slate-400">Please wait while the server logs your record.</p>
                </div>
              )}

              {status === 'success' && (
                <div className="p-6 sm:p-8 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-3">
                  <div className="text-4xl">✅</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-emerald-300">Attendance Logged Successfully!</h3>
                  <p className="text-xs sm:text-sm text-slate-300">Your presence and coordinates have been verified.</p>
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
                  <h3 className="text-xl font-bold text-rose-300">Verification Failed</h3>
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
