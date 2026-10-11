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

  return (
    <div className="p-8 max-w-4xl mx-auto selection:bg-[#ffe600] selection:text-black">
      <header className="border-b-8 border-black pb-4 mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-extrabold uppercase tracking-tighter bg-black text-white inline-block px-4 py-2">STUDENT PORTAL</h1>
          <p className="text-2xl font-bold mt-4 border-l-4 border-black pl-4 uppercase">{studentName} • MCA</p>
        </div>
        <div className="bg-[#ffe600] border-4 border-black px-6 py-3 text-xl font-bold uppercase shadow-[8px_8px_0_0_#000]">
          ID: AEC-MCA-100
        </div>
      </header>

      <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0_0_#000] mb-8">
        <h2 className="text-3xl font-extrabold uppercase mb-6 bg-black text-white inline-block px-4 py-1">LIVE CLASSES</h2>
        
        {!activeSession ? (
          <div className="p-8 text-center border-4 border-black bg-gray-100 text-gray-500 font-bold uppercase text-2xl">
            Waiting for faculty to open a session...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl font-black uppercase px-2 bg-red-600 text-white blink">● IN PROGRESS</span>
            </div>
            <div className="text-5xl font-black uppercase tracking-tighter mb-4">{activeSession.timetableEntry?.section?.subject?.name || 'Live Class'}</div>
            <div className="text-2xl font-bold mb-8 border-l-4 border-black pl-4 uppercase">
              ROOM: {activeSession.classroom?.name} • STARTED: {new Date(activeSession.startTime).toLocaleTimeString()}
            </div>

            {status === 'idle' && (
              <button onClick={startAttendanceProcess} className="bg-black text-white hover:bg-[#ffe600] hover:text-black w-full font-black uppercase text-3xl py-6 border-4 border-transparent hover:border-black transition-colors shadow-[8px_8px_0_0_#000]">
                MARK ATTENDANCE
              </button>
            )}

            {status === 'locating' && (
              <div className="bg-[#ffe600] border-4 border-black p-8 text-center animate-pulse">
                <h3 className="text-3xl font-black uppercase">Acquiring GPS...</h3>
              </div>
            )}

            {status === 'camera' && (
              <div className="border-4 border-black p-4 bg-white flex flex-col items-center">
                <h3 className="text-2xl font-black uppercase mb-4">Face Recognition</h3>
                <div className="w-full max-w-md aspect-video bg-black border-4 border-black mb-6 relative overflow-hidden">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  ></video>
                  <div className="absolute inset-0 border-[8px] border-[#ffe600] opacity-50"></div>
                </div>
                <button onClick={captureAndVerify} className="bg-black text-white hover:bg-[#ffe600] hover:text-black font-black uppercase text-3xl py-6 w-full border-4 border-transparent hover:border-black transition-colors shadow-[8px_8px_0_0_#000]">
                  CAPTURE & VERIFY
                </button>
              </div>
            )}

            {status === 'verifying' && (
              <div className="bg-black text-white border-4 border-black p-8 text-center">
                <h3 className="text-3xl font-black uppercase blink">Verifying Biometrics & Location...</h3>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-[#ffe600] border-4 border-black p-8 text-center shadow-[12px_12px_0_0_#000]">
                <h3 className="text-5xl font-black uppercase mb-4 text-black">SUCCESS!</h3>
                <p className="text-2xl font-bold uppercase border-t-4 border-black pt-4">Attendance Logged Successfully</p>
                <button onClick={() => setStatus('idle')} className="bg-black text-white font-black uppercase text-xl px-8 py-4 mt-8 border-4 border-black hover:bg-white hover:text-black transition-colors">
                  DONE
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-600 text-white border-4 border-black p-8 text-center shadow-[12px_12px_0_0_#000]">
                <h3 className="text-5xl font-black uppercase mb-4">ERROR</h3>
                <p className="text-2xl font-bold uppercase border-t-4 border-black pt-4">{errorMessage}</p>
                <button onClick={() => setStatus('idle')} className="bg-white text-black font-black uppercase text-xl px-8 py-4 mt-8 border-4 border-black hover:bg-black hover:text-white transition-colors">
                  RETRY
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .blink { animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }
      `}} />
    </div>
  );
}
