'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Mobile Header (< md) */}
      <header className="d-md-none bg-white border-bottom shadow-sm px-3 py-2.5 sticky-top z-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div 
              className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{ width: 34, height: 34, fontSize: 16 }}
            >
              F
            </div>
            <div>
              <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 14 }}>Faculty Portal</h6>
              <span className="text-muted" style={{ fontSize: 10 }}>AEC MCA Department</span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-outline-secondary btn-sm px-2.5 py-1.5 rounded-3 d-flex align-items-center gap-1.5"
            aria-label="Toggle Navigation Menu"
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{mobileMenuOpen ? '✕' : '☰'}</span>
            <span className="small fw-semibold">{mobileMenuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>

        {/* Collapsible Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="pt-3 pb-2 border-top mt-2">
            <nav className="nav flex-column gap-1 mb-3">
              {navLinks.map((link) => {
                const isActive = link.exact 
                  ? pathname === link.href 
                  : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-link px-3 py-2 rounded-3 fw-semibold small transition-all ${
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

            <button
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm w-100 rounded-pill py-2 fw-semibold"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Desktop Sidebar (>= md) */}
      <aside 
        className="d-none d-md-flex bg-white border-end shadow-sm flex-column justify-content-between p-3 position-sticky top-0 vh-100"
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
      <main className="flex-grow-1 p-2.5 p-sm-3 p-md-4 p-lg-5 overflow-auto">
        <div className="container-fluid px-1 px-sm-2 px-md-3" style={{ maxWidth: 1140 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
