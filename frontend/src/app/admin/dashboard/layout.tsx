import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-slate-950 text-slate-100">
      {/* Responsive Navigation: Top bar on mobile, Sidebar on desktop */}
      <aside className="w-full md:w-64 glass-panel shrink-0 md:min-h-screen border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Control Center</span>
              <h1 className="text-lg font-bold text-white tracking-tight">Admin Portal</h1>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          
          {/* Nav links */}
          <nav className="p-3 sm:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            <Link 
              href="/admin/dashboard" 
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 hover:border-white/15 transition-all whitespace-nowrap"
            >
              📊 Overview
            </Link>
            <Link 
              href="/admin/dashboard/timetable" 
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 hover:border-white/15 transition-all whitespace-nowrap"
            >
              📅 Timetable
            </Link>
            <Link 
              href="/admin/dashboard/users" 
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 hover:border-white/15 transition-all whitespace-nowrap"
            >
              👥 Users
            </Link>
          </nav>
        </div>
        
        {/* Logout bottom action */}
        <div className="p-3 sm:p-4 border-t border-white/10 hidden md:block">
          <Link 
            href="/" 
            className="block w-full text-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition-colors"
          >
            Log Out
          </Link>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
