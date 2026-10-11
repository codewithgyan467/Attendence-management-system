import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-white text-black font-mono overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 h-full border-r-4 border-black flex flex-col bg-[#ffcc00] shrink-0">
        <div className="p-4 border-b-4 border-black bg-black text-white">
          <h1 className="text-xl font-bold uppercase tracking-widest">
            SYS.ADMIN
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="px-2 text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-1 mb-2">Modules</p>
          <Link href="/admin/dashboard" className="block w-full text-left font-bold uppercase px-4 py-2 border-2 border-transparent hover:border-black hover:bg-white transition-none">
            [01] Overview
          </Link>
          <Link href="/admin/dashboard/timetable" className="block w-full text-left font-bold uppercase px-4 py-2 border-2 border-transparent hover:border-black hover:bg-white transition-none">
            [02] Timetable
          </Link>
          <Link href="/admin/dashboard/users" className="block w-full text-left font-bold uppercase px-4 py-2 border-2 border-transparent hover:border-black hover:bg-white transition-none">
            [03] Users
          </Link>
        </nav>
        
        <div className="p-4 border-t-4 border-black bg-white">
          <Link href="/" className="block w-full text-center font-bold uppercase px-4 py-2 border-4 border-black bg-[#ff3366] text-white hover:bg-black transition-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            LOGOUT_
          </Link>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-white p-8">
        {children}
      </main>
    </div>
  );
}
