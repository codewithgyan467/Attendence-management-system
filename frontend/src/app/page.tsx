'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
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

  const fillDemo = (demoRole: string, demoEmail: string, demoPw: string) => {
    setRole(demoRole);
    setEmail(demoEmail);
    setPassword(demoPw);
    setError('');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950 overflow-hidden">
      {/* Ambient background glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 sm:w-96 h-72 sm:h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-white transition-all">
        {/* Header Branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            AEC Attendance Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Assam Engineering College • MCA Department
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm font-medium flex items-center gap-2.5 backdrop-blur-md animate-shake">
            <svg className="w-5 h-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="break-words uppercase">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Institute Email
            </label>
            <input 
              type="email" 
              className="glass-input w-full px-4 py-3 sm:py-3.5 rounded-xl text-base text-white placeholder-slate-500" 
              placeholder="name@aec.ac.in" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input 
              type="password" 
              className="glass-input w-full px-4 py-3 sm:py-3.5 rounded-xl text-base text-white placeholder-slate-500" 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              autoComplete="current-password"
            />
          </div>

          {/* Portal Role Dropdown */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
              Portal Role
            </label>
            <div className="relative">
              <select 
                className="glass-input w-full appearance-none px-4 py-3 sm:py-3.5 pr-10 rounded-xl text-base text-white cursor-pointer bg-slate-900/90"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="STUDENT" className="bg-slate-900 text-white">Student Portal</option>
                <option value="FACULTY" className="bg-slate-900 text-white">Faculty Portal</option>
                <option value="ADMIN" className="bg-slate-900 text-white">Admin Portal</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="glass-btn w-full py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-6 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              <span>Sign In to Portal</span>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Tabs */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400 mb-2.5 font-medium">Auto-fill demo accounts:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('FACULTY', 'sb.mca@aec.ac.in', 'Faculty@123')}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => fillDemo('STUDENT', 'abhinash.sarmah@aec.ac.in', 'Student@123')}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillDemo('ADMIN', 'admin@aec.ac.in', 'MinorProject2026')}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
