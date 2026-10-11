'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

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
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [otpPreviewMsg, setOtpPreviewMsg] = useState<string | null>(null);
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
        setError('Camera API not supported in this browser. Please use "Phone Selfie" or "Upload File".');
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
      setError('Camera permission denied or camera unavailable. You can use "Phone Selfie" or "Upload File" below.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setRegFaceImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRegFaceImage(event.target.result as string);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoginLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.access_token);

      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'FACULTY') {
        router.push('/faculty/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Network error or service unavailable');
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
      setError('Password must be at least 6 characters');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: regFirstName.trim(),
          lastName: regLastName.trim(),
          email: regEmail.trim().toLowerCase(),
          phone: regPhone.trim() || undefined,
          enrollmentNo: regEnrollmentNo.trim().toUpperCase(),
          semester: Number(regSemester),
          password: regPassword,
          faceImage: regFaceImage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Automatically store token and enter student portal
      localStorage.setItem('token', data.access_token);
      setSuccessMsg('Registration successful! Launching your student dashboard...');

      setTimeout(() => {
        router.push('/student/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setOtpPreviewMsg(null);
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

      setForgotStep(2);
      setSuccessMsg(data.message || 'Verification code generated.');
      if (data.otpPreview) {
        setOtpPreviewMsg(`Test OTP Code: ${data.otpPreview}`);
      }
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
      setOtpPreviewMsg(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
    } catch (err) {
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
    <div className="relative min-h-screen w-full bg-[#070b14] text-slate-100 bg-grid-mesh overflow-hidden flex flex-col justify-between">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-[140px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute top-1/2 right-0 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none translate-y-1/3"></div>

      {/* Floating Header */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-5 py-3.5 flex items-center justify-between border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-sky-500/25">
              A
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">Assam Engineering College</span>
              <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">MCA Smart Attendance & Hardware Gateway</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              GPS Locked: 26.140537, 91.656738 (500m)
            </div>
            <button
              onClick={handleStartDemoSession}
              disabled={demoSessionLoading}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all flex items-center gap-1.5"
            >
              ⚡ {demoSessionLoading ? 'Launching...' : 'Start Live Test Session'}
            </button>
          </div>
        </div>

        {demoSessionStatus && (
          <div className="max-w-7xl mx-auto mt-2 p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-200 text-xs text-center font-medium">
            ✅ {demoSessionStatus}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero & Universal Campus Features */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                Universal University Edition
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] text-white">
                Zero-Admin <span className="text-gradient-cyan">Onboarding</span>.
                <span className="block mt-1 sm:mt-2 text-2xl sm:text-4xl font-extrabold text-slate-300">
                  Real-World Hardware Verified.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Direct student self-registration eliminates administrative data entry bottlenecks. Students enroll with real-time face biometric templates, verified by classroom ESP32 Bluetooth beacons and dynamic GPS geofences.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="card-glow-blue rounded-2xl p-4 flex flex-col justify-between space-y-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 text-sm">
                  👤
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Self-Registration</h3>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Students register directly with face image and roll number into cloud database.
                  </p>
                </div>
              </div>

              <div className="card-glow-purple rounded-2xl p-4 flex flex-col justify-between space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 text-sm">
                  📍
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Dynamic GPS</h3>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Admin can set classroom coordinates worldwide. Current: 26.140537, 91.656738.
                  </p>
                </div>
              </div>

              <div className="card-glow-emerald rounded-2xl p-4 flex flex-col justify-between space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-sm">
                  📡
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">ESP32 BLE Beacon</h3>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Flashed microcontroller emits rolling HMAC challenge tokens every 60 seconds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Card with Tabs (Login, Register, Forgot Password) */}
          <div id="login-box" className="lg:col-span-6 w-full">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative">
              
              {/* Primary View Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => { setViewMode('login'); setError(''); setSuccessMsg(''); stopCamera(); }}
                  className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                    viewMode === 'login'
                      ? 'border-sky-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setViewMode('register'); setError(''); setSuccessMsg(''); }}
                  className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                    viewMode === 'register'
                      ? 'border-indigo-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Student Self-Registration
                </button>
                <button
                  type="button"
                  onClick={() => { setViewMode('forgot'); setError(''); setSuccessMsg(''); stopCamera(); }}
                  className={`text-sm font-bold pb-2 transition-all border-b-2 ${
                    viewMode === 'forgot'
                      ? 'border-purple-400 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Status & Error Alerts */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-medium flex items-center gap-2">
                  <span>✅</span>
                  <span>{successMsg}</span>
                </div>
              )}
              {otpPreviewMsg && (
                <div className="mb-4 p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-between">
                  <span>🔑 {otpPreviewMsg}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = otpPreviewMsg.replace(/\D/g, '');
                      setForgotOtp(code);
                    }}
                    className="text-[11px] underline text-sky-300 font-bold"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* VIEW 1: SIGN IN FORM */}
              {viewMode === 'login' && (
                <div>
                  {/* Role Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-white/10 mb-5">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                        role === 'STUDENT'
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('FACULTY')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                        role === 'FACULTY'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Faculty
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('ADMIN')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                        role === 'ADMIN'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Admin
                    </button>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Institute Email
                      </label>
                      <input
                        type="email"
                        className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/80 border-white/15"
                        placeholder="user@aec.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setViewMode('forgot')}
                          className="text-[11px] text-sky-400 hover:underline font-semibold"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <input
                        type="password"
                        className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/80 border-white/15"
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
                      className="shimmer-btn glass-btn w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-5 disabled:opacity-50"
                    >
                      {loginLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Authenticating...
                        </span>
                      ) : (
                        <span>Sign In to {role.charAt(0) + role.slice(1).toLowerCase()} Portal →</span>
                      )}
                    </button>
                  </form>

                  {/* 1-Click Demo Fillers */}
                  <div className="mt-5 pt-4 border-t border-white/10 text-center">
                    <p className="text-[11px] text-slate-400 mb-2 font-medium">Quick 1-Click Test Accounts:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => fillDemo('STUDENT', 'student.mca@aec.ac.in', 'Student@123')}
                        className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-sky-300 transition-colors"
                      >
                        Student (MCA)
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemo('FACULTY', 'sbordoloi.mca@aec.ac.in', 'Faculty@123')}
                        className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-indigo-300 transition-colors"
                      >
                        Faculty (MCA)
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemo('ADMIN', 'admin@aec.ac.in', 'Admin@123')}
                        className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-purple-300 transition-colors"
                      >
                        Super Admin
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: DIRECT STUDENT SELF-REGISTRATION */}
              {viewMode === 'register' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white">Student Self-Onboarding</h3>
                    <p className="text-[11px] text-slate-400">
                      Direct database registration with biometric face template enrollment.
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="John"
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-950/80 border-white/15"
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Doe"
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-950/80 border-white/15"
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          Institute Email
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="student@univ.edu"
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-950/80 border-white/15"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          Phone Number (for OTP)
                        </label>
                        <input
                          type="tel"
                          placeholder="+91 9876543210"
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-950/80 border-white/15"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          Roll / Enrollment No
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="AEC-MCA-2026-001"
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-950/80 border-white/15"
                          value={regEnrollmentNo}
                          onChange={(e) => setRegEnrollmentNo(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          Semester
                        </label>
                        <select
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-950/80 border-white/15"
                          value={regSemester}
                          onChange={(e) => setRegSemester(Number(e.target.value))}
                        >
                          <option value={1} className="bg-slate-900 text-white">Semester 1</option>
                          <option value={2} className="bg-slate-900 text-white">Semester 2</option>
                          <option value={3} className="bg-slate-900 text-white">Semester 3</option>
                          <option value={4} className="bg-slate-900 text-white">Semester 4</option>
                          <option value={5} className="bg-slate-900 text-white">Semester 5</option>
                          <option value={6} className="bg-slate-900 text-white">Semester 6</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-950/80 border-white/15"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-950/80 border-white/15"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Biometric Face Template Capture */}
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-300 uppercase">
                          📷 Biometric Face Enrollment
                        </span>
                        {regFaceImage && (
                          <span className="text-[10px] text-emerald-400 font-semibold">✓ Photo Ready</span>
                        )}
                      </div>

                      {/* Video viewfinder */}
                      {isCameraActive && (
                        <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-sky-400/30">
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
                            className="w-full h-full object-cover"
                            autoPlay
                            playsInline
                            muted
                          />
                          <div className="absolute inset-0 border-2 border-dashed border-sky-400/50 rounded-full w-36 h-48 m-auto pointer-events-none"></div>
                          <div className="absolute bottom-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
                            >
                              Capture Frame
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-white/10"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Photo preview */}
                      {regFaceImage && !isCameraActive && (
                        <div className="flex items-center gap-3">
                          <img
                            src={regFaceImage}
                            alt="Biometric Preview"
                            className="w-16 h-16 rounded-xl object-cover border-2 border-sky-400 shadow-md"
                          />
                          <div>
                            <span className="text-[11px] text-slate-300 block font-medium">Face Biometrics Attached</span>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => { setRegFaceImage(null); startCamera(); }}
                                className="text-[10px] text-sky-400 hover:underline font-bold"
                              >
                                Retake via Camera
                              </button>
                              <span className="text-slate-600">•</span>
                              <label className="text-[10px] text-sky-400 hover:underline font-bold cursor-pointer">
                                Re-upload
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Always available camera & upload actions */}
                      {!regFaceImage && (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-semibold text-sky-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>📹</span> Live Camera
                            </button>
                            <label className="py-2 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-semibold text-indigo-200 text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                              <span>📱</span> Phone Selfie
                              <input type="file" accept="image/*" capture="user" onChange={handleFileUpload} className="hidden" />
                            </label>
                          </div>
                          <label className="block w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-400 text-center cursor-pointer transition-colors">
                            📁 Choose Photo from Gallery / Device
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                          </label>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="shimmer-btn glass-btn w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-3 disabled:opacity-50"
                    >
                      {regLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Registering Student...
                        </span>
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
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white">Reset Account Password</h3>
                    <p className="text-[11px] text-slate-400">
                      Recover access using your registered Email or Phone OTP verification.
                    </p>
                  </div>

                  {forgotStep === 1 && (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Registered Email or Phone
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. student@aec.ac.in or 9876543210"
                          className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/80 border-white/15"
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="shimmer-btn glass-btn w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                      >
                        {forgotLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Generating OTP...
                          </span>
                        ) : (
                          <span>Send Verification OTP →</span>
                        )}
                      </button>
                    </form>
                  )}

                  {forgotStep === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          6-Digit OTP Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="123456"
                          className="glass-input w-full px-4 py-2.5 rounded-xl text-sm font-mono text-center tracking-widest text-sky-300 bg-slate-950/80 border-white/15"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-slate-950/80 border-white/15"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••••••"
                          className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-white bg-slate-950/80 border-white/15"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="shimmer-btn glass-btn flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          {forgotLoading ? 'Verifying...' : 'Set New Password & Sign In'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full px-4 sm:px-8 py-3.5 border-t border-white/5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Smart Attendance Management System • Universal University Architecture</span>
        <span className="font-mono text-[11px] text-slate-400">GPS Testing Anchor: 26.140537, 91.656738</span>
      </footer>
    </div>
  );
}
