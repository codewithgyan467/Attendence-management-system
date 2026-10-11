'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-[#070b14] bg-grid-mesh text-slate-100 overflow-x-hidden">
      
      {/* Mobile Top Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-white/10 glass-panel sticky top-0 z-30 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-purple-500/20">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Faculty Portal</h1>
            <p className="text-[10px] text-slate-400">Assam Engineering College</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={() => localStorage.removeItem('token')}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium"
          >
            Sign Out
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-white/10 px-4 py-3 space-y-2 z-30 sticky top-[53px]">
          <Link
            href="/faculty/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white"
          >
            📊 Live Roster & Lectures
          </Link>
          <div className="text-[11px] text-slate-400 px-3 py-1">
            Department of Computer Applications • AEC
          </div>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex w-64 min-h-screen glass-panel flex-col z-20 shrink-0 border-r border-white/10 justify-between">
        <div>
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Faculty Portal</h1>
              <p className="text-[11px] text-slate-400">Assam Engg College</p>
            </div>
          </div>
          
          <div className="py-6 px-4 space-y-2">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">My Classes</p>
            <Link 
              href="/faculty/dashboard" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white border border-white/10 shadow-sm"
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Active Lecture</span>
            </Link>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10">
          <Link 
            href="/" 
            onClick={() => localStorage.removeItem('token')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition-colors justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
      
      {/* Main Content Area (100% width on mobile) */}
      <main className="flex-1 min-w-0 w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
