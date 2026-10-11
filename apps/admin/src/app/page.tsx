'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim(); // Trimming in case of accidental space from copy-paste
      
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
      setError(err.message.toUpperCase());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-6 font-mono selection:bg-[#ffe600] selection:text-black relative overflow-hidden bg-[#e0e0e0]" 
      style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
    >
      <div className="w-full max-w-xl bg-white border-8 border-black p-8 md:p-12 shadow-[16px_16px_0_0_#000] flex flex-col gap-8 relative z-10 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
        
        {/* Decorative corner tapes */}
        <div className="absolute -top-4 -left-4 w-12 h-4 bg-[#ffe600] border-2 border-black rotate-45"></div>
        <div className="absolute -bottom-4 -right-4 w-12 h-4 bg-[#ffe600] border-2 border-black rotate-45"></div>

        <div className="border-b-8 border-black pb-6 text-center">
          <h1 className="text-6xl font-black uppercase tracking-tighter bg-black text-white inline-block px-6 py-2 transform skew-x-[-5deg]">LOGIN</h1>
          <p className="text-2xl font-bold mt-6 uppercase tracking-widest">Assam Engineering College</p>
        </div>

        {error && (
          <div className="bg-red-600 text-white font-black p-4 border-4 border-black uppercase text-xl text-center blink shadow-[6px_6px_0_0_#000]">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-black text-2xl uppercase tracking-tighter">Email</label>
            <input 
              type="email" 
              className="px-6 py-4 border-4 border-black font-bold text-xl focus:outline-none focus:bg-[#ffe600] focus:shadow-[6px_6px_0_0_#000] transition-all" 
              placeholder="ENTER EMAIL..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-black text-2xl uppercase tracking-tighter">Password</label>
            <input 
              type="password" 
              className="px-6 py-4 border-4 border-black font-bold text-xl focus:outline-none focus:bg-[#ffe600] focus:shadow-[6px_6px_0_0_#000] transition-all" 
              placeholder="ENTER PASSWORD..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-black text-2xl uppercase tracking-tighter">Portal Role</label>
            <div className="relative">
              <select 
                className="w-full appearance-none px-6 py-4 border-4 border-black font-bold uppercase text-xl focus:outline-none focus:bg-[#ffe600] cursor-pointer focus:shadow-[6px_6px_0_0_#000] transition-all bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="STUDENT">STUDENT PORTAL</option>
                <option value="FACULTY">FACULTY PORTAL</option>
                <option value="ADMIN">ADMIN PORTAL</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 border-l-4 border-black font-black text-xl">
                ▼
              </div>
            </div>
          </div>

          <button type="submit" className="bg-black text-white hover:bg-[#ffe600] hover:text-black font-black uppercase text-3xl py-6 border-4 border-transparent hover:border-black transition-colors shadow-[8px_8px_0_0_#000] mt-8 group relative overflow-hidden">
            <span className="relative z-10">ENTER SYSTEM</span>
            <div className="absolute inset-0 h-full w-0 bg-[#ffe600] transition-all duration-300 ease-out group-hover:w-full z-0"></div>
          </button>
        </form>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .blink { animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0.8; } }
      `}} />
    </div>
  );
}
