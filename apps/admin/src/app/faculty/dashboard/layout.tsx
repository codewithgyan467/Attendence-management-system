import Link from 'next/link';

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden w-full">
      <aside className="w-72 h-full glass-panel flex flex-col z-20 shrink-0">
        <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Faculty Portal
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">My Classes</p>
          <Link href="/faculty/dashboard" className="nav-item active">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span>Live Session</span>
          </Link>
          <a href="#" className="nav-item">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span>Attendance Reports</span>
          </a>
        </div>
        
        <div className="p-4 border-t border-slate-700/50">
          <Link href="/faculty" className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="font-medium">Sign Out</span>
          </Link>
        </div>
      </aside>
      
      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-500/10 to-transparent -z-10"></div>
        {children}
      </main>
    </div>
  );
}
