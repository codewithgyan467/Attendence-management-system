'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { compressImage } from '@/lib/image';
import ClockWidget from '@/components/ClockWidget';
import StudentAnalytics from '@/components/StudentAnalytics';

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

  const fetchSchedule = useCallback(async (authToken: string, day: number | null, time: string | null, customSemester?: number) => {
    try {
      const params = new URLSearchParams();
      if (day !== null) params.append('simulateDay', String(day));
      if (time !== null) params.append('simulateTime', time);
      if (customSemester) {
        params.append('semester', String(customSemester));
      }

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
          setStudentName(`${data.firstName} ${data.lastName || ''}`.trim());
        }
        localStorage.setItem('user', JSON.stringify(data));
        const studentSem = data.studentProfile?.semester || data.semester;
        if (studentSem) {
          fetchSchedule(authToken, simDay, simTime, studentSem);
        }
      }
    } catch (e) {
      console.error('Failed to load student profile:', e);
    }
  };

  // Initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');

    if (storedUserStr) {
      try {
        const u = JSON.parse(storedUserStr);
        setUserProfile(u);
        if (u.firstName) {
          setStudentName(`${u.firstName} ${u.lastName || ''}`.trim());
        }
      } catch {}
    }

    if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
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
      const sem = userProfile?.studentProfile?.semester || userProfile?.semester;
      fetchSchedule(token, simDay, simTime, sem);
    }, 10000);
    return () => clearInterval(interval);
  }, [token, simDay, simTime, userProfile, fetchSchedule]);

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

    const sem = userProfile?.studentProfile?.semester || userProfile?.semester;
    if (token) fetchSchedule(token, day, time, sem);
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
      () => {
        // Fallback coordinates for demo classroom in AEC
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
      setErrorMessage('Camera access was not granted. Please allow camera permissions or use "Phone Selfie / Upload".');
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
    <div className="min-vh-100 bg-light py-4 text-dark">
      <div className="container" style={{ maxWidth: 1040 }}>
        
        {/* Missing Photo Alert Banner */}
        {userProfile && !userProfile.studentProfile?.faceProfile?.imageUrl && (
          <div className="alert alert-warning border-warning-subtle shadow-sm rounded-4 mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 p-3 p-md-4">
            <div className="d-flex align-items-start gap-3">
              <span className="fs-3">⚠️</span>
              <div>
                <h6 className="alert-heading fw-bold mb-1">Biometric Face Photo Missing</h6>
                <p className="mb-0 small text-muted">
                  Automated attendance verification requires your enrolled face photo. Please upload or capture your photo to avoid verification rejections.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPhotoModal(true)}
              className="btn btn-warning text-dark fw-bold btn-sm rounded-pill px-3 py-2 text-nowrap shadow-sm"
            >
              📸 Upload Photo Now
            </button>
          </div>
        )}

        {/* Student Identity Header Card */}
        <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                {/* Profile Photo Avatar */}
                <div className="position-relative">
                  <div 
                    className="rounded-circle bg-light border border-2 border-primary d-flex align-items-center justify-content-center fw-bold text-primary overflow-hidden shadow-sm"
                    style={{ width: 72, height: 72, fontSize: 24 }}
                  >
                    {userProfile?.studentProfile?.faceProfile?.imageUrl ? (
                      <img
                        src={userProfile.studentProfile.faceProfile.imageUrl}
                        alt="Student Face"
                        className="w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      <span>{userProfile?.firstName?.[0] || 'S'}{userProfile?.lastName?.[0] || 'T'}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPhotoModal(true)}
                    title="Update Biometric Photo"
                    className="position-absolute bottom-0 end-0 btn btn-sm btn-primary rounded-circle p-1 d-flex align-items-center justify-content-center shadow"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                  >
                    📷
                  </button>
                </div>

                {/* Student Details */}
                <div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <h3 className="h4 fw-bold mb-0 text-dark">
                      {userProfile?.firstName
                        ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
                        : studentName}
                    </h3>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">
                      Semester {userProfile?.studentProfile?.semester || userProfile?.semester || 1}
                    </span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                      {userProfile?.studentProfile?.status || 'ACTIVE'}
                    </span>
                  </div>

                  <p className="small text-muted mb-1">
                    Assam Engineering College • Department of Computer Applications (MCA)
                  </p>

                  <div className="d-flex flex-wrap align-items-center gap-2 small text-secondary font-monospace">
                    <span>Roll: <strong className="text-dark">{userProfile?.studentProfile?.enrollmentNo || userProfile?.enrollmentNo || '—'}</strong></span>
                    <span>•</span>
                    <span>Email: <strong className="text-dark">{userProfile?.email || '—'}</strong></span>
                    {userProfile?.phone && (
                      <>
                        <span>•</span>
                        <span>Phone: <strong className="text-dark">{userProfile.phone}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="align-self-end align-self-md-center">
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Clock & Timetable Routine Widget */}
        <div className="mb-4">
          <ClockWidget 
            scheduleData={scheduleData} 
            onSimulationChange={handleSimulation}
            selectedSimulation={simChoice}
          />
        </div>

        {/* Live Attendance Action Card */}
        <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
              <span>🛡️</span> Biometric & Geotag Verification
            </h5>
            {scheduleData?.active && (
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1.5">
                ● Session Active
              </span>
            )}
          </div>
          
          <div className="card-body p-4">
            {scheduleData?.isHoliday ? (
              <div className="text-center py-5">
                <div className="display-4 mb-2">🎉</div>
                <h5 className="fw-bold text-warning mb-1">Holiday Declared</h5>
                <p className="text-muted small mb-0 max-w-md mx-auto">
                  Institutional Holiday declared ({scheduleData.holiday?.title}). No regular attendance required today.
                </p>
              </div>
            ) : !scheduleData?.active ? (
              <div className="text-center py-5">
                <div className="display-4 mb-2">⏳</div>
                <h5 className="fw-semibold text-secondary mb-1">Attendance Window Currently Closed</h5>
                <p className="text-muted small max-w-md mx-auto mb-0">
                  Classes and attendance strictly follow the Assam Engineering College timetable routine.
                  {scheduleData?.nextSlot ? (
                    <span className="d-block mt-2 text-primary fw-medium">
                      Next upcoming: {scheduleData.nextSlot.subject} at {scheduleData.nextSlot.startTime}.
                    </span>
                  ) : (
                    <span className="d-block mt-2 text-muted">
                      You can test upcoming slots using the schedule tester selector above.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div>
                {/* Active Session Info Banner */}
                <div className="p-3 bg-light rounded-3 border mb-4">
                  <div className="h5 fw-bold text-dark mb-1">
                    {scheduleData.slot.subject} ({scheduleData.slot.code})
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2 small text-secondary">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      Slot: {scheduleData.slot.startTime} — {scheduleData.slot.endTime}
                    </span>
                    <span className="badge bg-light text-dark border">
                      Room: {scheduleData.slot.classroom}
                    </span>
                    <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                      Type: {scheduleData.slot.type}
                    </span>
                  </div>
                </div>

                {/* State: Idle */}
                {status === 'idle' && (
                  <button 
                    onClick={startAttendanceProcess} 
                    className="btn btn-primary btn-lg w-100 py-3 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  >
                    <span>📍</span> Mark My Attendance for {scheduleData.slot.code}
                  </button>
                )}

                {/* State: Locating */}
                {status === 'locating' && (
                  <div className="p-4 bg-primary-subtle rounded-3 border border-primary-subtle text-center">
                    <div className="spinner-border text-primary mb-2" role="status"></div>
                    <h6 className="fw-bold text-primary mb-1">Verifying Classroom GPS Location...</h6>
                    <p className="small text-muted mb-0">Checking proximity to {scheduleData.slot.classroom}...</p>
                  </div>
                )}

                {/* State: Camera */}
                {status === 'camera' && (
                  <div className="p-4 bg-light rounded-3 border text-center">
                    <h6 className="fw-bold text-dark mb-1 d-flex align-items-center justify-content-center gap-2">
                      <span>📷</span> Facial Verification & Liveness Detection
                    </h6>
                    <p className="small text-muted mb-3">Please position your face within the frame and capture</p>
                    
                    <div className="mx-auto bg-dark rounded-3 overflow-hidden position-relative mb-3 shadow-sm" style={{ maxWidth: 440, aspectRatio: '4/3' }}>
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
                        className="w-100 h-100 object-fit-cover"
                      />
                      <div className="position-absolute top-50 start-50 translate-middle border border-2 border-primary rounded-circle" style={{ width: 180, height: 230, pointerEvents: 'none' }}></div>
                    </div>

                    <div className="d-flex flex-column gap-2 mx-auto" style={{ maxWidth: 440 }}>
                      <button 
                        onClick={captureAndVerify} 
                        className="btn btn-success btn-lg fw-bold shadow-sm py-2.5 rounded-3"
                      >
                        ✓ Capture & Confirm Attendance
                      </button>
                      <label className="btn btn-outline-secondary btn-sm rounded-3 py-2 cursor-pointer mb-0">
                        📱 Or Take Photo with Phone Camera / Upload File
                        <input type="file" accept="image/*" capture="user" onChange={handleNativeUploadAndVerify} className="d-none" />
                      </label>
                    </div>
                  </div>
                )}

                {/* State: Verifying */}
                {status === 'verifying' && (
                  <div className="p-4 bg-light rounded-3 border text-center">
                    <div className="spinner-border text-info mb-2" role="status"></div>
                    <h6 className="fw-bold text-dark mb-1">Authenticating Attendance...</h6>
                    <p className="small text-muted mb-0">Validating facial biometric anti-spoofing and geo-fence parameters.</p>
                  </div>
                )}

                {/* State: Success */}
                {status === 'success' && (
                  <div className="alert alert-success border-success-subtle rounded-3 text-center p-4 mb-0">
                    <div className="display-5 mb-2">✅</div>
                    <h5 className="fw-bold text-success mb-1">Attendance Recorded Successfully!</h5>
                    <p className="small text-muted mb-3">
                      Your attendance for <strong>{scheduleData.slot.subject}</strong> has been verified and registered.
                    </p>
                    <button 
                      onClick={() => setStatus('idle')} 
                      className="btn btn-success btn-sm px-4 rounded-pill fw-semibold"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* State: Error */}
                {status === 'error' && (
                  <div className="alert alert-danger border-danger-subtle rounded-3 text-center p-4 mb-0">
                    <div className="display-5 mb-2">⚠️</div>
                    <h5 className="fw-bold text-danger mb-1">Verification Rejected</h5>
                    <p className="small text-danger mb-3">{errorMessage}</p>
                    <button 
                      onClick={() => setStatus('idle')} 
                      className="btn btn-outline-danger btn-sm px-4 rounded-pill fw-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Student Analytics & Attendance Charts */}
        <div className="mb-4">
          <StudentAnalytics 
            studentName={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : studentName}
            semester={userProfile?.studentProfile?.semester || 1}
          />
        </div>

      </div>

      {/* ================= BIOMETRIC PHOTO ENROLLMENT MODAL ================= */}
      {showPhotoModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold text-dark">📸 Enroll Biometric Face Photo</h5>
                  <p className="small text-muted mb-0">Used for automated classroom facial verification</p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPhotoModal(false);
                    if (photoModalStreamRef.current) {
                      photoModalStreamRef.current.getTracks().forEach(t => t.stop());
                      photoModalStreamRef.current = null;
                    }
                    setPhotoModalActive(false);
                  }}
                ></button>
              </div>

              <div className="modal-body p-4">
                {photoUploadMsg && (
                  <div className="alert alert-success small py-2 mb-3">
                    {photoUploadMsg}
                  </div>
                )}

                {/* Video Viewfinder */}
                {photoModalActive && (
                  <div className="position-relative rounded-3 overflow-hidden bg-dark mb-3 shadow-sm" style={{ aspectRatio: '4/3' }}>
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
                      className="w-100 h-100 object-fit-cover"
                    />
                    <div className="position-absolute top-50 start-50 translate-middle border border-2 border-primary rounded-circle" style={{ width: 140, height: 180, pointerEvents: 'none' }}></div>
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
                      className="position-absolute bottom-0 start-50 translate-middle-x mb-3 btn btn-success btn-sm rounded-pill px-4 fw-bold shadow"
                    >
                      Capture & Save
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex flex-column gap-2">
                  <div className="row g-2">
                    <div className="col-6">
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
                            alert('Could not access live camera. Please use selfie upload or gallery.');
                          }
                        }}
                        className="btn btn-outline-primary btn-sm w-100 py-2 fw-semibold"
                      >
                        📹 Live Camera
                      </button>
                    </div>
                    <div className="col-6">
                      <label className="btn btn-outline-secondary btn-sm w-100 py-2 fw-semibold mb-0 cursor-pointer">
                        📱 Phone Selfie
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
                          className="d-none"
                        />
                      </label>
                    </div>
                  </div>

                  <label className="btn btn-light border btn-sm py-2 fw-medium text-secondary text-center cursor-pointer mb-0">
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
                      className="d-none"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
