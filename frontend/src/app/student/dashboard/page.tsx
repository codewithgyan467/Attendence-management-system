'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { compressImage } from '@/lib/image';
import ClockWidget from '@/components/ClockWidget';

export default function StudentDashboard() {
  const [status, setStatus] = useState<'idle' | 'locating' | 'camera' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number, acc: number } | null>(null);
  const [studentName, setStudentName] = useState('MCA Student');
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoModalActive, setPhotoModalActive] = useState(false);
  const [photoUploadMsg, setPhotoUploadMsg] = useState<string | null>(null);
  const [simDay, setSimDay] = useState<number | null>(null);
  const [simTime, setSimTime] = useState<string | null>(null);
  const [simChoice, setSimChoice] = useState('live');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoModalVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoModalStreamRef = useRef<MediaStream | null>(null);

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

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        if (data.firstName) {
          setStudentName(`${data.firstName} ${data.lastName}`);
        }
      }
    } catch (e) {
      console.error('Failed to load student profile:', e);
    }
  };

  // Initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/';
      return;
    }
    setToken(storedToken);
    fetchProfile(storedToken);
    fetchSchedule(storedToken, simDay, simTime);
    return () => {
      stopCamera();
      if (photoModalStreamRef.current) {
        photoModalStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [fetchSchedule, simDay, simTime]);

  // Periodic refresh every 10 seconds to detect slot changes
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchSchedule(token, simDay, simTime);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, simDay, simTime, fetchSchedule]);

  // Ensure video element receives stream whenever camera becomes active
  useEffect(() => {
    if (status === 'camera' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [status]);

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
        // Fallback to active testing coordinates if browser blocks location
        setLocation({
          lat: 26.140537,
          lng: 91.656738,
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
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera open error:', err);
      // Even if stream failed, remain in camera status so user can tap Native Selfie / Upload
      setErrorMessage('Camera access was not granted. Please allow camera permissions or tap "Phone Selfie" below.');
    }
  };

  const submitAttendancePayload = async (base64Image: string) => {
    stopCamera();
    setStatus('verifying');
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
          latitude: location?.lat || 26.140537,
          longitude: location?.lng || 91.656738,
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

  const captureAndVerify = async () => {
    let base64Image = '';
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(videoRef.current.videoWidth || 640, 800);
      canvas.height = Math.min(videoRef.current.videoHeight || 480, 800);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const raw = canvas.toDataURL('image/jpeg', 0.8);
        base64Image = await compressImage(raw, 800, 800, 0.75);
      }
    }
    await submitAttendancePayload(base64Image);
  };

  const handleNativeUploadAndVerify = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await compressImage(file, 800, 800, 0.75);
      await submitAttendancePayload(optimized);
    } catch {
      setStatus('error');
      setErrorMessage('FAILED TO PROCESS IMAGE');
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
        
        {/* Missing Photo Alert Banner */}
        {userProfile && !userProfile.studentProfile?.faceProfile?.imageUrl && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-amber-500/10">
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl">⚠️</span>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-amber-100">Biometric Face Photo Missing</h4>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Automated attendance verification requires your enrolled face photo. Please upload or capture your photo soon to avoid check-in rejections.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPhotoModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md shrink-0 active:scale-95 transition-all cursor-pointer"
            >
              📸 Upload Photo Now
            </button>
          </div>
        )}

        {/* Interactive Student Identity Header Card */}
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-white/10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Profile Photo Avatar */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border-2 border-indigo-400/40 overflow-hidden shadow-xl flex items-center justify-center font-bold text-xl text-white">
                  {userProfile?.studentProfile?.faceProfile?.imageUrl ? (
                    <img
                      src={userProfile.studentProfile.faceProfile.imageUrl}
                      alt="Student Face"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userProfile?.firstName?.[0] || 'S'}{userProfile?.lastName?.[0] || 'T'}</span>
                  )}
                </div>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  title="Update Biometric Photo"
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] shadow-lg border border-white/20 cursor-pointer"
                >
                  📷
                </button>
              </div>

              {/* Student Details */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : studentName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Semester {userProfile?.studentProfile?.semester || 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    {userProfile?.studentProfile?.status || 'ACTIVE'}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Assam Engineering College • Department of Computer Applications (MCA)
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1 font-mono">
                  <span>Roll: <strong className="text-sky-300">{userProfile?.studentProfile?.enrollmentNo || 'AEC-MCA-100'}</strong></span>
                  <span>•</span>
                  <span>Email: <strong className="text-indigo-300">{userProfile?.email || 'student@aec.ac.in'}</strong></span>
                  {userProfile?.phone && (
                    <>
                      <span>•</span>
                      <span>Phone: <strong className="text-slate-300">{userProfile.phone}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Logout & Quick Badges */}
            <div className="flex items-center gap-3 self-end md:self-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

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
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && streamRef.current && el.srcObject !== streamRef.current) {
                          el.srcObject = streamRef.current;
                          el.play().catch(() => {});
                        }
                      }}
                      onLoadedMetadata={(e) => {
                        e.currentTarget.play().catch(() => {});
                      }}
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
                  <label className="mt-3.5 py-2 px-4 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-semibold text-indigo-200 cursor-pointer transition-colors flex items-center justify-center gap-2">
                    <span>📱</span> Or Take Selfie via Phone Camera / Upload Photo
                    <input type="file" accept="image/*" capture="user" onChange={handleNativeUploadAndVerify} className="hidden" />
                  </label>
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

      {/* ================= BIOMETRIC PHOTO ENROLLMENT MODAL ================= */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-indigo-500/40 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📸</span> Enroll Biometric Face Photo
                </h3>
                <p className="text-xs text-slate-400">Used for automated classroom facial verification</p>
              </div>
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  if (photoModalStreamRef.current) {
                    photoModalStreamRef.current.getTracks().forEach(t => t.stop());
                    photoModalStreamRef.current = null;
                  }
                  setPhotoModalActive(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {photoUploadMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                {photoUploadMsg}
              </div>
            )}

            {/* Video Viewfinder */}
            {photoModalActive && (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-indigo-400/40">
                <video
                  ref={(el) => {
                    photoModalVideoRef.current = el;
                    if (el && photoModalStreamRef.current && el.srcObject !== photoModalStreamRef.current) {
                      el.srcObject = photoModalStreamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-indigo-400/60 rounded-full w-32 h-44 m-auto pointer-events-none"></div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!photoModalVideoRef.current) return;
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.min(photoModalVideoRef.current.videoWidth || 640, 800);
                    canvas.height = Math.min(photoModalVideoRef.current.videoHeight || 480, 800);
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(photoModalVideoRef.current, 0, 0, canvas.width, canvas.height);
                      const raw = canvas.toDataURL('image/jpeg', 0.8);
                      const compressed = await compressImage(raw, 800, 800, 0.75);
                      
                      // Submit to backend
                      const res = await fetch(`${API_URL}/users/me/face-photo`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ base64Image: compressed })
                      });
                      if (res.ok) {
                        setPhotoUploadMsg('Photo enrolled successfully!');
                        if (photoModalStreamRef.current) {
                          photoModalStreamRef.current.getTracks().forEach(t => t.stop());
                          photoModalStreamRef.current = null;
                        }
                        setPhotoModalActive(false);
                        if (token) fetchProfile(token);
                        setTimeout(() => setShowPhotoModal(false), 1200);
                      }
                    }
                  }}
                  className="absolute bottom-2 px-4 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg"
                >
                  Capture & Save
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
                      });
                      photoModalStreamRef.current = stream;
                      setPhotoModalActive(true);
                      if (photoModalVideoRef.current) {
                        photoModalVideoRef.current.srcObject = stream;
                        photoModalVideoRef.current.play().catch(() => {});
                      }
                    } catch {
                      alert('Could not access live camera. Please use Native Selfie or file upload.');
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-semibold text-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>📹</span> Live Camera
                </button>

                <label className="py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-semibold text-purple-200 text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                  <span>📱</span> Phone Selfie
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImage(file, 800, 800, 0.75);
                      const res = await fetch(`${API_URL}/users/me/face-photo`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ base64Image: compressed })
                      });
                      if (res.ok) {
                        setPhotoUploadMsg('Photo enrolled successfully!');
                        if (token) fetchProfile(token);
                        setTimeout(() => setShowPhotoModal(false), 1200);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <label className="block w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-400 text-center cursor-pointer transition-colors">
                📁 Upload Existing Photo from Gallery
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const compressed = await compressImage(file, 800, 800, 0.75);
                    const res = await fetch(`${API_URL}/users/me/face-photo`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ base64Image: compressed })
                    });
                    if (res.ok) {
                      setPhotoUploadMsg('Photo enrolled successfully!');
                      if (token) fetchProfile(token);
                      setTimeout(() => setShowPhotoModal(false), 1200);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
