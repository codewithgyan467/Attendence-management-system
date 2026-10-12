'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const navSections = [
    {
      title: 'HOME',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard Overview', icon: '⚡', exact: true },
        { href: '/admin/dashboard/reports', label: 'Registers & NC/DC Hub', icon: '📋' },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { href: '/admin/dashboard/timetable', label: 'Timetable & Routine', icon: '📅' },
        { href: '/admin/dashboard/users', label: 'Users & Student Profiles', icon: '👥' },
        { href: '/admin/dashboard/institutions', label: 'Universities & Depts', icon: '🏛️' },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className={`min-vh-100 d-flex flex-column ${darkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      {/* ================= PHOENIX TOP NAVBAR ================= */}
      <header className="bg-white border-bottom sticky-top z-3 px-3 px-md-4 py-2.5 shadow-sm">
        <div className="d-flex align-items-center justify-content-between gap-3">
          {/* Left: Brand Logo & Mobile Toggle */}
          <div className="d-flex align-items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="d-md-none btn btn-light border btn-sm p-1.5 rounded-2 text-secondary"
              aria-label="Toggle mobile menu"
            >
              <span className="fs-6 lh-1">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>

            <Link href="/admin/dashboard" className="text-decoration-none d-flex align-items-center gap-2">
              <div 
                className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                style={{
                  width: 34,
                  height: 34,
                  background: 'linear-gradient(135deg, #ff6b35 0%, #3874ff 100%)',
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 900
                }}
              >
                🪶
              </div>
              <div className="d-flex align-items-baseline gap-1.5">
                <span className="fw-bold tracking-tight text-dark" style={{ fontSize: 18, fontFamily: 'system-ui' }}>
                  phoenix
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small" style={{ fontSize: 9 }}>
                  MCA AEC
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="d-none d-md-block flex-grow-1 mx-4" style={{ maxWidth: 440 }}>
            <div className="position-relative">
              <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted small" style={{ pointerEvents: 'none' }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Search students, courses, attendance sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control form-control-sm rounded-pill ps-5 pe-3 bg-light border-0 text-dark small"
                style={{ fontSize: 13, height: 38 }}
              />
            </div>
          </div>

          {/* Right: Quick Action Utilities */}
          <div className="d-flex align-items-center gap-2">
            {/* Theme Switcher Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-light btn-sm rounded-circle p-1.5 border text-secondary d-flex align-items-center justify-content-center"
              style={{ width: 34, height: 34 }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span>{darkMode ? '🌙' : '☀️'}</span>
            </button>

            {/* Notification Bell */}
            <div className="position-relative">
              <button
                className="btn btn-light btn-sm rounded-circle p-1.5 border text-secondary d-flex align-items-center justify-content-center"
                style={{ width: 34, height: 34 }}
                title="Notifications"
              >
                <span>🔔</span>
              </button>
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            </div>

            {/* Apps Grid Launcher */}
            <Link
              href="/admin/dashboard/timetable"
              className="btn btn-light btn-sm rounded-circle p-1.5 border text-secondary d-none d-sm-flex align-items-center justify-content-center"
              style={{ width: 34, height: 34 }}
              title="Timetable Routine Hub"
            >
              <span>⊞</span>
            </Link>

            {/* User Profile Pill Avatar */}
            <div className="dropdown d-flex align-items-center ps-2 border-start ms-1">
              <div 
                className="rounded-circle overflow-hidden border border-2 border-primary d-flex align-items-center justify-content-center bg-primary text-white fw-bold shadow-sm"
                style={{ width: 34, height: 34, fontSize: 14 }}
              >
                A
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="pt-3 pb-2 border-top mt-2 d-md-none animate-fadeIn">
            {navSections.map((sec) => (
              <div key={sec.title} className="mb-2">
                <div className="text-muted fw-bold px-3 mb-1" style={{ fontSize: 10, letterSpacing: '0.08em' }}>
                  {sec.title}
                </div>
                <nav className="nav flex-column gap-1">
                  {sec.items.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`nav-link px-3 py-2 rounded-2 fw-semibold small d-flex align-items-center gap-2 ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-secondary hover-bg-light'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
            <div className="pt-2 border-top px-2">
              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm w-100 rounded-pill py-2 fw-semibold">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ================= MAIN WRAPPER (SIDEBAR + CONTENT) ================= */}
      <div className="d-flex flex-grow-1">
        {/* ================= DESKTOP PHOENIX SIDEBAR ================= */}
        <aside
          className="d-none d-md-flex bg-white border-end shadow-sm flex-column justify-content-between p-3 position-sticky"
          style={{
            top: 55,
            height: 'calc(100vh - 55px)',
            width: sidebarCollapsed ? 76 : 260,
            minWidth: sidebarCollapsed ? 76 : 260,
            transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Navigation Links */}
          <div className="overflow-auto pr-1">
            {navSections.map((sec) => (
              <div key={sec.title} className="mb-3">
                {!sidebarCollapsed && (
                  <div className="text-muted fw-bold px-3 mb-1.5" style={{ fontSize: 10.5, letterSpacing: '0.08em' }}>
                    {sec.title}
                  </div>
                )}
                <nav className="nav flex-column gap-1">
                  {sec.items.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`nav-link px-3 py-2 rounded-2 fw-semibold small d-flex align-items-center gap-2.5 transition-all ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-secondary hover-bg-light'
                        } ${sidebarCollapsed ? 'justify-content-center px-0' : ''}`}
                        style={{ fontSize: 13 }}
                      >
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        {!sidebarCollapsed && (
                          <span className="text-truncate">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Sidebar Footer with Collapse Toggle */}
          <div className="pt-3 border-top mt-auto">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="btn btn-light btn-sm w-100 rounded-2 py-1.5 fw-semibold text-secondary d-flex align-items-center justify-content-center gap-2 small border-0"
              style={{ fontSize: 12 }}
            >
              <span>{sidebarCollapsed ? '➔' : '◀'}</span>
              {!sidebarCollapsed && <span>Collapsed View</span>}
            </button>
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm w-100 rounded-pill py-1.5 fw-semibold mt-2 small"
              >
                Sign Out
              </button>
            )}
          </div>
        </aside>

        {/* ================= PAGE CONTENT ================= */}
        <main className="flex-grow-1 p-2.5 p-sm-3 p-md-4 p-lg-4 overflow-auto" style={{ minWidth: 0 }}>
          <div className="container-fluid px-1 px-sm-2 px-md-3" style={{ maxWidth: 1360 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
