'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const navLinks = [
    { href: '/faculty/dashboard', label: 'Live Lecture & Roster', icon: '📊', exact: true },
    { href: '/faculty/dashboard/reports', label: 'Attendance Registers & NC/DC', icon: '📋' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`min-vh-100 d-flex flex-column ${themeMode === 'dark' ? 'bg-dark text-light' : 'bg-body-tertiary text-dark'}`} style={{ backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f5f7fa' }}>
      {/* Phoenix Top Navbar */}
      <header className="navbar navbar-expand border-bottom px-3 px-lg-4 py-2 bg-white sticky-top shadow-sm z-3" style={{ minHeight: '62px', borderColor: '#e3e6ed' }}>
        <div className="container-fluid px-0 d-flex align-items-center justify-content-between">
          {/* Left Brand & Mobile Burger */}
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-sm btn-light d-lg-none border-0 p-1.5 rounded-2"
              aria-label="Toggle navigation drawer"
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>☰</span>
            </button>

            <Link href="/faculty/dashboard" className="text-decoration-none d-flex align-items-center gap-2">
              <span className="fs-4 lh-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(56,116,255,0.25))' }}>🪶</span>
              <span className="fw-bolder fs-5 tracking-tight text-dark">
                phoenix <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill fw-normal ms-1" style={{ fontSize: '10px' }}>Faculty</span>
              </span>
            </Link>
          </div>

          {/* Center Search Pill (Desktop) */}
          <div className="d-none d-md-flex align-items-center flex-grow-1 mx-4" style={{ maxWidth: '420px' }}>
            <div className="input-group input-group-sm rounded-pill overflow-hidden border" style={{ borderColor: '#e3e6ed', background: '#f5f7fa' }}>
              <span className="input-group-text bg-transparent border-0 pe-1 text-muted">🔍</span>
              <input
                type="text"
                className="form-control bg-transparent border-0 shadow-none ps-1 text-dark"
                placeholder="Search classes, registers, students..."
                style={{ fontSize: '0.825rem' }}
              />
            </div>
          </div>

          {/* Right Action Icons & User Badge */}
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 border"
              style={{ width: '34px', height: '34px', borderColor: '#e3e6ed' }}
              title="Toggle Theme"
            >
              {themeMode === 'light' ? '☀️' : '🌙'}
            </button>

            {/* Notification Bell */}
            <div className="position-relative">
              <button
                className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 border"
                style={{ width: '34px', height: '34px', borderColor: '#e3e6ed' }}
                title="Notifications"
              >
                🔔
              </button>
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            </div>

            {/* Apps Launcher */}
            <button
              className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 border d-none d-sm-flex"
              style={{ width: '34px', height: '34px', borderColor: '#e3e6ed' }}
              title="Quick Shortcuts"
            >
              ⊞
            </button>

            {/* User Profile Avatar */}
            <div className="d-flex align-items-center gap-2 ps-2 border-start" style={{ borderColor: '#e3e6ed' }}>
              <div
                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #3874ff 0%, #1a56db 100%)',
                  fontSize: '0.85rem'
                }}
              >
                F
              </div>
              <div className="d-none d-xl-block text-start lh-1">
                <div className="fw-bold small text-dark">Faculty Lead</div>
                <small className="text-muted" style={{ fontSize: '10px' }}>MCA Dept</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="d-flex flex-grow-1">
        {/* Phoenix Collapsible Desktop Sidebar */}
        <aside
          className={`d-none d-lg-flex flex-column justify-content-between bg-white border-end position-sticky top-0 transition-all ${
            sidebarCollapsed ? 'p-2' : 'p-3'
          }`}
          style={{
            width: sidebarCollapsed ? '76px' : '260px',
            minWidth: sidebarCollapsed ? '76px' : '260px',
            height: 'calc(100vh - 62px)',
            borderColor: '#e3e6ed',
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 2,
          }}
        >
          <div className="overflow-y-auto">
            {/* Sidebar Category: TEACHING */}
            <div className="mb-3">
              {!sidebarCollapsed && (
                <div className="text-uppercase text-muted fw-bold px-3 mb-2" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>
                  TEACHING & CLASSES
                </div>
              )}
              <nav className="nav flex-column gap-1">
                {navLinks.map((link) => {
                  const isActive = link.exact
                    ? pathname === link.href
                    : pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`nav-link d-flex align-items-center gap-2.5 px-3 py-2 rounded-3 fw-semibold small transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-secondary hover-bg-light'
                      }`}
                      title={sidebarCollapsed ? link.label : undefined}
                    >
                      <span className="fs-6 lh-1">{link.icon}</span>
                      {!sidebarCollapsed && <span>{link.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Attendance Status Widget */}
            {!sidebarCollapsed && (
              <div className="p-3 rounded-3 bg-light border mt-4 text-center" style={{ borderColor: '#e3e6ed' }}>
                <div className="d-flex align-items-center justify-content-center gap-1.5 text-success small fw-bold mb-1">
                  <span className="p-1 bg-success rounded-circle d-inline-block"></span>
                  Faculty Mode Active
                </div>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  Auto-syncing session registers to Cloud database.
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer with Collapse Toggle & Sign Out */}
          <div className="pt-3 border-top" style={{ borderColor: '#e3e6ed' }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="btn btn-sm btn-light w-100 rounded-3 d-flex align-items-center justify-content-center gap-2 mb-2 text-muted fw-semibold"
              style={{ fontSize: '0.8rem' }}
            >
              <span>{sidebarCollapsed ? '→' : '←'}</span>
              {!sidebarCollapsed && <span>Collapsed View</span>}
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm w-100 rounded-pill py-1.5 fw-semibold d-flex align-items-center justify-content-center gap-1.5"
              style={{ fontSize: '0.8rem' }}
            >
              <span>⏻</span>
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Off-Canvas / Drawer */}
        {mobileMenuOpen && (
          <div
            className="d-lg-none position-fixed top-0 start-0 w-100 h-100 z-3"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="bg-white h-100 p-3 shadow-lg d-flex flex-column justify-content-between"
              style={{ width: '280px', maxWidth: '85vw' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">🪶</span>
                    <span className="fw-bolder fs-5 text-dark">phoenix</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-sm btn-light rounded-circle p-1"
                  >
                    ✕
                  </button>
                </div>

                <nav className="nav flex-column gap-1">
                  {navLinks.map((link) => {
                    const isActive = link.exact
                      ? pathname === link.href
                      : pathname.startsWith(link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`nav-link d-flex align-items-center gap-2 px-3 py-2.5 rounded-3 fw-semibold small ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-secondary hover-bg-light'
                        }`}
                      >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-top">
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm w-100 rounded-pill py-2 fw-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow-1 p-3 p-md-4 p-xl-5 overflow-auto" style={{ minWidth: 0 }}>
          <div className="container-fluid px-0" style={{ maxWidth: '1440px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
