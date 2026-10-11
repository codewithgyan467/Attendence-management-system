import Link from 'next/link';

export default function FacultyLogin() {
  return (
    <div className="flex h-screen w-full items-center justify-center relative overflow-hidden bg-slate-950">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-900/20 to-transparent -z-10"></div>
      
      <div className="glass-card p-10 w-full max-w-md flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Faculty Login</h1>
        <p className="text-slate-400 mb-8 text-center">Sign in to manage your classes and sessions.</p>
        
        <form className="w-full space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Faculty Email</label>
            <input type="text" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="professor@platform.edu" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input type="password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="••••••••" />
          </div>
          
          <Link href="/faculty/dashboard" className="w-full block text-center bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors mt-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            Login as Faculty
          </Link>
        </form>
        
        <Link href="/" className="mt-8 text-sm text-slate-500 hover:text-white transition-colors">
          ← Back to Portal Selection
        </Link>
      </div>
    </div>
  );
}
