'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token
      localStorage.setItem('token', data.access_token);

      // Route based on role selected
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
      setLoading(false);
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
      {/* Ambient background glowing orbs (like in the Canva templates) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-[140px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute top-1/2 right-0 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none translate-y-1/3"></div>

      {/* Floating Glass Navigation Bar */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-5 py-3.5 flex items-center justify-between border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-sky-500/25">
              A
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">Assam Engineering College</span>
              <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">MCA Smart Attendance System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Geofence Active
            </div>
            <a 
              href="#login-box" 
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
            >
              Portal Login
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero & Split Layout */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Presentation & Open-Source Template Cards */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                Digital Campus Architecture
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Let&apos;s get <span className="text-gradient-cyan">digital</span>.
                <span className="block mt-1 sm:mt-2 text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-300">
                  Smart attendance that works.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Seamless multi-factor verification designed for universities. Eliminate proxy attendance with sub-second AI face matching and classroom GPS geo-fencing.
              </p>
            </div>

            {/* 3 Luminous Open-Source Style Glass Feature Cards (as seen in the template) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-2">
              {/* Card 1 */}
              <div className="card-glow-blue rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 text-sm">
                  ⚡
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">Face Liveness</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                    Real-time anti-spoofing engine detects depth and blinks to prevent photo spoofing.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="card-glow-purple rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 text-sm">
                  📍
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">GPS Geofence</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                    Haversine boundary calculation locks verification strictly to the classroom perimeter.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="card-glow-emerald rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-sm">
                  📊
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">Live Roster</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                    Instant synchronization updates faculty rosters and student analytics in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Glassmorphic Portal Login Card */}
          <div id="login-box" className="lg:col-span-5 w-full">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 md:p-9 border border-white/15 shadow-2xl relative">
              <div className="text-center mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Secure Access</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">Sign In to Portal</h2>
                <p className="text-xs text-slate-400 mt-1">Choose your account role to continue</p>
              </div>

              {/* Role Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-white/10 mb-6">
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

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Institute Email
                  </label>
                  <input 
                    type="email" 
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/80 border-white/15" 
                    placeholder="user@aec.ac.in" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input 
                    type="password" 
                    className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-950/80 border-white/15" 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    autoComplete="current-password"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="shimmer-btn glass-btn w-full py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-6 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Authenticating...
                    </span>
                  ) : (
                    <span>Sign In to {role.charAt(0) + role.slice(1).toLowerCase()} Portal →</span>
                  )}
                </button>
              </form>

              {/* Quick 1-Click Demo Fillers */}
              <div className="mt-6 pt-5 border-t border-white/10 text-center">
                <p className="text-[11px] text-slate-400 mb-2 font-medium">Quick Demo Accounts (1-Click Fill):</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo('STUDENT', 'abhinash.sarmah@aec.ac.in', 'Student@123')}
                    className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-sky-300 transition-colors"
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('FACULTY', 'sb.mca@aec.ac.in', 'Faculty@123')}
                    className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-indigo-300 transition-colors"
                  >
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('ADMIN', 'admin@aec.ac.in', 'MinorProject2026')}
                    className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-purple-300 transition-colors"
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full px-4 sm:px-8 py-4 border-t border-white/5 text-center text-xs text-slate-500">
        Assam Engineering College • Department of Computer Applications • MCA Project 2026
      </footer>
    </div>
  );
}
