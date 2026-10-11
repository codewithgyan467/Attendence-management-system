import Link from 'next/link';

export default function StudentLogin() {
  return (
    <div className="flex h-screen w-full items-center justify-center relative overflow-hidden bg-slate-950">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-transparent -z-10"></div>
      
      <div className="glass-card p-10 w-full max-w-md flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Student Login</h1>
        <p className="text-slate-400 mb-8 text-center">Sign in to check attendance and active sessions.</p>
        
        <form className="w-full space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Student ID / Email</label>
            <input type="text" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="STD-101" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input type="password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" placeholder="••••••••" />
          </div>
          
          <Link href="/student/dashboard" className="w-full block text-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors mt-6 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            Login as Student
          </Link>
        </form>
        
        <Link href="/" className="mt-8 text-sm text-slate-500 hover:text-white transition-colors">
          ← Back to Portal Selection
        </Link>
      </div>
    </div>
  );
}
