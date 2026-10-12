'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { compressImage } from '@/lib/image';

export default function LoginPage() {
  const router = useRouter();

  // Mode: 'login' | 'register' | 'forgot'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEnrollmentNo, setRegEnrollmentNo] = useState('');
  const [regSemester, setRegSemester] = useState(1);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFaceImage, setRegFaceImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone_email'>('email');
  const [phoneEmailVerifiedUrl, setPhoneEmailVerifiedUrl] = useState<string | null>(null);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // General notification/error states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [demoSessionStatus, setDemoSessionStatus] = useState<string | null>(null);
  const [demoSessionLoading, setDemoSessionLoading] = useState(false);

  // Camera refs for face biometric capture
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Ensure video element receives stream whenever camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  // Cleanup camera on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Phone.Email listener and script loading
  useEffect(() => {
    if (viewMode === 'forgot' && forgotMethod === 'phone_email') {
      (window as any).phoneEmailListener = (userObj: { user_json_url: string }) => {
        if (!userObj?.user_json_url) return;
        setPhoneEmailVerifiedUrl(userObj.user_json_url);
        setError('');
        setSuccessMsg('Phone verified successfully! Now enter your new password below.');
      };

      if (!document.getElementById('phone-email-script')) {
        const script = document.createElement('script');
        script.id = 'phone-email-script';
        script.src = 'https://www.phone.email/sign_in_button_v1.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [viewMode, forgotMethod]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setError('');
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Camera API not supported in this browser. Please use selfie upload or gallery file.');
        return;
      }

      let stream: MediaStream | null = null;
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
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera open error:', err);
      setIsCameraActive(false);
      setError('Camera access not granted. You can use selfie upload or device photo below.');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(videoRef.current.videoWidth || 640, 800);
    canvas.height = Math.min(videoRef.current.videoHeight || 480, 800);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const optimized = await compressImage(dataUrl, 800, 800, 0.75);
      setRegFaceImage(optimized);
      stopCamera();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError('');
        const optimized = await compressImage(file, 800, 800, 0.75);
        setRegFaceImage(optimized);
      } catch {
        setError('Failed to process image file. Please try a different photo.');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials. Please verify your login details.');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'STUDENT') {
        router.push('/student/dashboard');
      } else if (data.user.role === 'FACULTY') {
        router.push('/faculty/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          password: regPassword,
          role: 'STUDENT',
          firstName: regFirstName.trim(),
          lastName: regLastName.trim(),
          phone: regPhone.trim() || undefined,
          enrollmentNo: regEnrollmentNo.trim(),
          semester: Number(regSemester),
          faceImage: regFaceImage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMsg('Registration completed! Signing you into portal...');
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => {
        router.push('/student/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration');
    } finally {
      setRegLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!forgotIdentifier.trim()) {
      setError('Please provide your registered institute email.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to request OTP');
      }

      setSuccessMsg(data.message || 'Verification code sent to your email.');
      setForgotStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccessMsg('Password reset successful! Please log in with your new password.');
      setViewMode('login');
      setForgotStep(1);
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const handlePhoneEmailResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-phone-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_json_url: phoneEmailVerifiedUrl,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Phone.Email reset failed');
      }

      setSuccessMsg(data.message || 'Password successfully reset via Phone.Email! You can now login.');
      setTimeout(() => {
        setViewMode('login');
        setForgotStep(1);
        setPhoneEmailVerifiedUrl(null);
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to complete Phone.Email password reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleStartDemoSession = async () => {
    setDemoSessionLoading(true);
    setDemoSessionStatus(null);
    try {
      const res = await fetch(`${API_URL}/attendance/demo/start-live-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setDemoSessionStatus(`Active Lab Session Ready at 26.140537, 91.656738 (MCA-101 Lab)!`);
      } else {
        setDemoSessionStatus(`Failed to start session: ${data.message}`);
      }
    } catch {
      setDemoSessionStatus('Network error while launching live session.');
    } finally {
      setDemoSessionLoading(false);
    }
  };

  const fillDemo = (demoRole: 'STUDENT' | 'FACULTY' | 'ADMIN', demoEmail: string, demoPw: string) => {
    setRole(demoRole);
    setEmail(demoEmail);
    setPassword(demoPw);
    setError('');
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column justify-content-between text-dark">
      
      {/* Top Navbar */}
      <header className="navbar navbar-light bg-white border-bottom shadow-sm py-2 px-3 px-md-4">
        <div className="container-fluid max-w-5xl d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div 
              className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{ width: 36, height: 36, fontSize: 18 }}
            >
              A
            </div>
            <div>
              <span className="fw-bold d-block text-dark small">Assam Engineering College</span>
              <span className="text-muted d-block" style={{ fontSize: 11 }}>MCA Attendance Portal</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1.5 small d-none d-sm-inline-flex">
              ● Portal Active
            </span>
            <button
              onClick={handleStartDemoSession}
              disabled={demoSessionLoading}
              className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold"
            >
              ⚡ {demoSessionLoading ? 'Launching...' : 'Start Test Session'}
            </button>
          </div>
        </div>
      </header>

      {demoSessionStatus && (
        <div className="container mt-3" style={{ maxWidth: 540 }}>
          <div className="alert alert-info border-info-subtle py-2 px-3 small text-center mb-0">
            ✅ {demoSessionStatus}
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <main className="container my-auto py-4" style={{ maxWidth: 540 }}>
        <div className="card shadow-sm border-0 rounded-4 bg-white p-4 p-md-5">
          
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark mb-1">Attendance Portal</h3>
            <p className="text-muted small mb-0">
              Sign in with your institutional credentials to access your dashboard
            </p>
          </div>

          {/* Primary View Switcher Tabs */}
          <div className="nav nav-pills nav-fill bg-light p-1 rounded-3 mb-4">
            <button
              type="button"
              onClick={() => { setViewMode('login'); setError(''); setSuccessMsg(''); stopCamera(); }}
              className={`nav-link py-2 small fw-bold rounded-3 ${
                viewMode === 'login' ? 'active bg-white text-dark shadow-sm' : 'text-muted'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('register'); setError(''); setSuccessMsg(''); }}
              className={`nav-link py-2 small fw-bold rounded-3 ${
                viewMode === 'register' ? 'active bg-white text-dark shadow-sm' : 'text-muted'
              }`}
            >
              Registration
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('forgot'); setError(''); setSuccessMsg(''); stopCamera(); }}
              className={`nav-link py-2 small fw-bold rounded-3 ${
                viewMode === 'forgot' ? 'active bg-white text-dark shadow-sm' : 'text-muted'
              }`}
            >
              Reset Password
            </button>
          </div>

          {/* Status & Error Alerts */}
          {error && (
            <div className="alert alert-danger border-danger-subtle py-2.5 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success border-success-subtle py-2.5 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW 1: SIGN IN FORM */}
          {viewMode === 'login' && (
            <div>
              {/* Role Selector Tabs */}
              <div className="btn-group w-100 mb-4" role="group">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`btn btn-sm py-2 fw-semibold ${role === 'STUDENT' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('FACULTY')}
                  className={`btn btn-sm py-2 fw-semibold ${role === 'FACULTY' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Faculty
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`btn btn-sm py-2 fw-semibold ${role === 'ADMIN' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Admin
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">
                    Institute Email
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg rounded-3 fs-6"
                    placeholder="user@aec.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label small fw-semibold text-secondary mb-0">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setViewMode('forgot')}
                      className="btn btn-link p-0 text-decoration-none small"
                      style={{ fontSize: 12 }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    className="form-control form-control-lg rounded-3 fs-6"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="btn btn-primary btn-lg w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                >
                  {loginLoading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  ) : (
                    <span>Sign In to {role.charAt(0) + role.slice(1).toLowerCase()} Portal →</span>
                  )}
                </button>
              </form>

              {/* 1-Click Demo Fillers */}
              <div className="mt-4 pt-3 border-top text-center">
                <p className="text-muted small mb-2">Quick 1-Click Test Accounts:</p>
                <div className="row g-2">
                  <div className="col-4">
                    <button
                      type="button"
                      onClick={() => fillDemo('STUDENT', 'student.mca@aec.ac.in', 'Student@123')}
                      className="btn btn-outline-secondary btn-sm w-100 py-1.5 small text-nowrap"
                    >
                      Student
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      onClick={() => fillDemo('FACULTY', 'sbordoloi.mca@aec.ac.in', 'Faculty@123')}
                      className="btn btn-outline-secondary btn-sm w-100 py-1.5 small text-nowrap"
                    >
                      Faculty
                    </button>
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      onClick={() => fillDemo('ADMIN', 'admin@aec.ac.in', 'Admin@123')}
                      className="btn btn-outline-secondary btn-sm w-100 py-1.5 small text-nowrap"
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: DIRECT STUDENT SELF-REGISTRATION */}
          {viewMode === 'register' && (
            <div>
              <div className="mb-3">
                <h6 className="fw-bold text-dark mb-0">Student Self-Onboarding</h6>
                <p className="small text-muted mb-0">
                  Register with your institutional details and enroll biometric face template.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John"
                      className="form-control form-control-sm rounded-2"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      className="form-control form-control-sm rounded-2"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Institute Email</label>
                    <input
                      type="email"
                      required
                      placeholder="student@univ.edu"
                      className="form-control form-control-sm rounded-2"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      className="form-control form-control-sm rounded-2"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Roll / Enrollment</label>
                    <input
                      type="text"
                      required
                      placeholder="AEC-MCA-2026-001"
                      className="form-control form-control-sm rounded-2"
                      value={regEnrollmentNo}
                      onChange={(e) => setRegEnrollmentNo(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Semester</label>
                    <select
                      className="form-select form-select-sm rounded-2"
                      value={regSemester}
                      onChange={(e) => setRegSemester(Number(e.target.value))}
                    >
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                      <option value={3}>Semester 3</option>
                      <option value={4}>Semester 4</option>
                      <option value={5}>Semester 5</option>
                      <option value={6}>Semester 6</option>
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="form-control form-control-sm rounded-2"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="form-control form-control-sm rounded-2"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Biometric Face Template Capture */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small fw-bold text-dark">
                      📷 Biometric Face Photo Enrollment
                    </span>
                    {regFaceImage && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                        ✓ Photo Ready
                      </span>
                    )}
                  </div>

                  {/* Video viewfinder */}
                  {isCameraActive && (
                    <div className="position-relative rounded-2 overflow-hidden bg-dark mb-2 shadow-sm" style={{ aspectRatio: '4/3' }}>
                      <video
                        ref={(el) => {
                          videoRef.current = el;
                          if (el && streamRef.current && el.srcObject !== streamRef.current) {
                            el.srcObject = streamRef.current;
                            el.play().catch(() => {});
                          }
                        }}
                        onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                        className="w-100 h-100 object-fit-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="position-absolute top-50 start-50 translate-middle border border-2 border-primary rounded-circle" style={{ width: 130, height: 160, pointerEvents: 'none' }}></div>
                      <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex gap-2">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="btn btn-success btn-sm fw-bold rounded-pill px-3 shadow"
                        >
                          Capture Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="btn btn-secondary btn-sm rounded-pill px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo preview */}
                  {regFaceImage && !isCameraActive && (
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={regFaceImage}
                        alt="Biometric Preview"
                        className="rounded-3 object-fit-cover border border-2 border-primary shadow-sm"
                        style={{ width: 60, height: 60 }}
                      />
                      <div>
                        <span className="small text-dark fw-medium d-block">Face Image Attached</span>
                        <div className="d-flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => { setRegFaceImage(null); startCamera(); }}
                            className="btn btn-link p-0 small text-decoration-none"
                            style={{ fontSize: 12 }}
                          >
                            Retake Photo
                          </button>
                          <span className="text-muted">•</span>
                          <label className="btn btn-link p-0 small text-decoration-none cursor-pointer mb-0" style={{ fontSize: 12 }}>
                            Re-upload
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="d-none" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Camera & upload actions */}
                  {!regFaceImage && (
                    <div className="row g-2">
                      <div className="col-6">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="btn btn-outline-primary btn-sm w-100 py-1.5 fw-semibold"
                        >
                          📹 Live Camera
                        </button>
                      </div>
                      <div className="col-6">
                        <label className="btn btn-outline-secondary btn-sm w-100 py-1.5 fw-semibold mb-0 cursor-pointer text-center">
                          📱 Device Upload
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="d-none" />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                >
                  {regLoading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  ) : (
                    <span>Complete Registration & Enter Portal →</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW 3: FORGOT PASSWORD / OTP RECOVERY */}
          {viewMode === 'forgot' && (
            <div>
              <div className="mb-3">
                <h6 className="fw-bold text-dark mb-0">Reset Account Password</h6>
                <p className="small text-muted mb-0">
                  Choose your preferred verification method to recover your account:
                </p>
              </div>

              {/* Method Selector Tabs */}
              {forgotStep === 1 && (
                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    type="button"
                    onClick={() => setForgotMethod('email')}
                    className={`btn btn-sm py-2 fw-semibold ${forgotMethod === 'email' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    📧 Email OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotMethod('phone_email')}
                    className={`btn btn-sm py-2 fw-semibold ${forgotMethod === 'phone_email' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    📱 Phone.Email
                  </button>
                </div>
              )}

              {/* Step 2 Recipient Badge */}
              {forgotStep === 2 && forgotMethod === 'email' && (
                <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <div className="small text-muted text-uppercase" style={{ fontSize: 11 }}>Code Sent To:</div>
                    <div className="small fw-bold text-dark">{forgotIdentifier}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setError(''); setSuccessMsg(''); }}
                    className="btn btn-link p-0 small text-decoration-none"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* METHOD 1: EMAIL OTP */}
              {forgotMethod === 'email' && (
                <>
                  {forgotStep === 1 && (
                    <form onSubmit={handleRequestOtp} className="space-y-3">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">
                          Registered Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="student@aec.ac.in"
                          className="form-control rounded-3"
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                        />
                        <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                          A 6-digit verification code will be sent to your inbox.
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                      >
                        {forgotLoading ? (
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        ) : (
                          <span>Send Verification OTP →</span>
                        )}
                      </button>
                    </form>
                  )}

                  {forgotStep === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-3">
                      <div className="mb-2">
                        <label className="form-label small fw-semibold text-secondary mb-1">6-Digit OTP</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="123456"
                          className="form-control text-center font-monospace fs-5 rounded-3"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                        />
                      </div>

                      <div className="mb-2">
                        <label className="form-label small fw-semibold text-secondary mb-1">New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          className="form-control rounded-3"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          className="form-control rounded-3"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                      >
                        {forgotLoading ? 'Verifying...' : 'Set New Password & Sign In'}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* METHOD 2: PHONE.EMAIL VERIFICATION */}
              {forgotMethod === 'phone_email' && (
                <div>
                  {!phoneEmailVerifiedUrl ? (
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <p className="small text-muted mb-2">
                        Verify your phone number with 1-click using the Phone.Email widget:
                      </p>
                      <div className="d-flex justify-content-center py-2">
                        <div
                          className="pe_signin_button"
                          data-client-id="18664955320259466526"
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handlePhoneEmailResetPassword} className="space-y-3">
                      <div className="alert alert-success small py-2 mb-3">
                        Phone Verified Successfully! Enter your new password:
                      </div>

                      <div className="mb-2">
                        <label className="form-label small fw-semibold text-secondary mb-1">New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          className="form-control rounded-3"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">Confirm Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          className="form-control rounded-3"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold shadow-sm"
                      >
                        {forgotLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="bg-white border-top py-3 text-center text-muted small">
        <div className="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <span>Assam Engineering College • Attendance Management System</span>
          <span className="text-secondary">Department of Computer Applications</span>
        </div>
      </footer>
    </div>
  );
}
