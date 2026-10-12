'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/faculty/dashboard', label: '📊 Live Lecture & Roster', exact: true },
    { href: '/faculty/dashboard/reports', label: '📋 Attendance Register & NC/DC' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 bg-light text-dark">
      {/* Sidebar on desktop */}
      <aside 
        className="bg-white border-end shadow-sm d-flex flex-column justify-content-between p-3"
        style={{ minWidth: 260, maxWidth: 280 }}
      >
        <div>
          {/* Brand Header */}
          <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div 
                className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{ width: 36, height: 36, fontSize: 18 }}
              >
                F
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-dark">Faculty Portal</h6>
                <span className="small text-muted" style={{ fontSize: 11 }}>AEC MCA Department</span>
              </div>
            </div>
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
              ● Online
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="nav flex-column gap-1">
            {navLinks.map((link) => {
              const isActive = link.exact 
                ? pathname === link.href 
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link px-3 py-2.5 rounded-3 fw-semibold small transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondary hover-bg-light'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 border-top mt-auto">
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger btn-sm w-100 rounded-pill py-2 fw-semibold"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Faculty Content Area */}
      <main className="flex-grow-1 p-3 p-md-4 p-lg-5 overflow-auto">
        <div className="container-fluid" style={{ maxWidth: 1140 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
