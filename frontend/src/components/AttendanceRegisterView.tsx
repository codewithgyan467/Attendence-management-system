'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { exportRegisterToExcel, exportRegisterToWord, printOrSavePdf } from '@/lib/exportUtils';

interface AttendanceRegisterViewProps {
  isAdmin?: boolean;
}

export default function AttendanceRegisterView({ isAdmin = false }: AttendanceRegisterViewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-12');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'nc' | 'dc'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Register Matrix Data
  const [registerData, setRegisterData] = useState<any | null>(null);

  // Policy Settings (Configurable by Admin)
  const [policy, setPolicy] = useState<{ ncThreshold: number; dcThreshold: number; updatedAt?: string }>({
    ncThreshold: 75,
    dcThreshold: 65
  });
  const [editNc, setEditNc] = useState<number>(75);
  const [editDc, setEditDc] = useState<number>(65);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyMessage, setPolicyMessage] = useState('');

  // Daily Master Report for Admin
  const [activeMainTab, setActiveMainTab] = useState<'register' | 'dailyMaster'>('register');
  const [dailyMasterData, setDailyMasterData] = useState<any | null>(null);
  const [dailyMasterLoading, setDailyMasterLoading] = useState(false);

  // Load token & sections
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      fetchInitialData(stored);
    }
  }, []);

  const fetchInitialData = async (authToken: string) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${authToken}` };

      // Fetch Policy & Available Sections
      const [policyRes, sectionsRes] = await Promise.all([
        fetch(`${API_URL}/reports/policy`, { headers }),
        fetch(`${API_URL}/reports/sections`, { headers })
      ]);

      if (policyRes.ok) {
        const p = await policyRes.json();
        setPolicy(p);
        setEditNc(p.ncThreshold);
        setEditDc(p.dcThreshold);
      }

      if (sectionsRes.ok) {
        const secs = await sectionsRes.json();
        setSections(secs);
        if (secs.length > 0) {
          setSelectedSectionId(secs[0].id);
          fetchRegister(authToken, secs[0].id, timeframe, selectedDate, selectedMonth, statusFilter);
        } else {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
      setLoading(false);
    }
  };

  const fetchRegister = useCallback(async (
    authToken: string,
    secId: string,
    tf: string,
    dt: string,
    mth: string,
    sf: string
  ) => {
    if (!secId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('sectionId', secId);
      params.append('timeframe', tf);
      if (tf === 'daily' || tf === 'weekly') params.append('date', dt);
      if (tf === 'monthly') params.append('month', mth);
      if (sf !== 'all') params.append('statusFilter', sf);

      const res = await fetch(`${API_URL}/reports/register?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRegisterData(data);
      }
    } catch (e) {
      console.error('Error fetching register:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailyMaster = async (authToken: string, dateStr: string) => {
    try {
      setDailyMasterLoading(true);
      const res = await fetch(`${API_URL}/reports/daily-master?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setDailyMasterData(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch daily master:', e);
    } finally {
      setDailyMasterLoading(false);
    }
  };

  // Re-fetch register when filters change
  const handleFilterChange = (newTf?: any, newSecId?: string, newDate?: string, newMonth?: string, newSf?: any) => {
    const tf = newTf !== undefined ? newTf : timeframe;
    const secId = newSecId !== undefined ? newSecId : selectedSectionId;
    const dt = newDate !== undefined ? newDate : selectedDate;
    const mth = newMonth !== undefined ? newMonth : selectedMonth;
    const sf = newSf !== undefined ? newSf : statusFilter;

    if (newTf !== undefined) setTimeframe(newTf);
    if (newSecId !== undefined) setSelectedSectionId(newSecId);
    if (newDate !== undefined) setSelectedDate(newDate);
    if (newMonth !== undefined) setSelectedMonth(newMonth);
    if (newSf !== undefined) setStatusFilter(newSf);

    if (token && secId) {
      fetchRegister(token, secId, tf, dt, mth, sf);
    }
  };

  // Handle Policy Update by Admin
  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setPolicySaving(true);
      setPolicyMessage('');

      const res = await fetch(`${API_URL}/reports/policy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ncThreshold: Number(editNc),
          dcThreshold: Number(editDc)
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setPolicy(updated);
        setPolicyMessage('✅ Attendance criteria updated successfully!');
        // Reload register to re-compute statuses immediately
        if (selectedSectionId) {
          fetchRegister(token, selectedSectionId, timeframe, selectedDate, selectedMonth, statusFilter);
        }
      } else {
        setPolicyMessage('❌ Failed to update criteria');
      }
    } catch (e) {
      console.error(e);
      setPolicyMessage('❌ Network error while saving policy');
    } finally {
      setPolicySaving(false);
      setTimeout(() => setPolicyMessage(''), 4000);
    }
  };

  // Filter students by search term
  const displayedStudents = (registerData?.students || []).filter((st: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return st.name.toLowerCase().includes(q) || st.enrollmentNo.toLowerCase().includes(q);
  });

  // Export handlers
  const handleExcelExport = () => {
    if (!registerData) return;
    exportRegisterToExcel({
      institutionName: 'Assam Engineering College (AEC)',
      departmentName: registerData.section?.departmentName,
      subjectCode: registerData.section?.subjectCode,
      subjectName: registerData.section?.subjectName,
      sectionName: registerData.section?.name,
      semester: registerData.section?.semester,
      facultyName: registerData.section?.assignedFaculty,
      timeframe,
      ncThreshold: policy.ncThreshold,
      dcThreshold: policy.dcThreshold,
      sessions: registerData.sessions,
      students: registerData.students
    });
  };

  const handleWordExport = () => {
    if (!registerData) return;
    exportRegisterToWord({
      institutionName: 'Assam Engineering College (AEC)',
      departmentName: registerData.section?.departmentName,
      subjectCode: registerData.section?.subjectCode,
      subjectName: registerData.section?.subjectName,
      sectionName: registerData.section?.name,
      semester: registerData.section?.semester,
      facultyName: registerData.section?.assignedFaculty,
      timeframe,
      ncThreshold: policy.ncThreshold,
      dcThreshold: policy.dcThreshold,
      sessions: registerData.sessions,
      students: registerData.students
    });
  };

  return (
    <div className="text-dark">
      {/* Header Banner */}
      <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill fw-semibold">
                  {isAdmin ? '🛡️ Administration Control' : '👨‍🏫 Faculty Subject Register'}
                </span>
                <span className="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill">
                  Routine Roll Register
                </span>
              </div>
              <h4 className="fw-bold mb-1 text-dark">
                {isAdmin ? 'Master Attendance Registers & Compliance Hub' : 'Class Attendance Register & NC/DC Roster'}
              </h4>
              <p className="text-muted small mb-0">
                Track everyday attendance, weekly progress, monthly school registers, and filter Non-Collegiate (NC) & Dis-Collegiate (DC) students.
              </p>
            </div>

            {/* Export Action Buttons */}
            <div className="d-flex flex-wrap gap-2">
              <button
                onClick={handleExcelExport}
                disabled={!registerData || registerData.students.length === 0}
                className="btn btn-outline-success btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                title="Download as Excel Sheet"
              >
                <span>📊</span> Export Excel (.xls)
              </button>
              <button
                onClick={handleWordExport}
                disabled={!registerData || registerData.students.length === 0}
                className="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                title="Download as Word Document"
              >
                <span>📄</span> Export Word (.doc)
              </button>
              <button
                onClick={printOrSavePdf}
                disabled={!registerData}
                className="btn btn-outline-dark btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                title="Print or Save as PDF"
              >
                <span>🖨️</span> PDF / Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs (Admin has Register vs Everyday Master Report) */}
      {isAdmin && (
        <ul className="nav nav-pills bg-white p-1.5 rounded-4 shadow-sm border mb-4 d-inline-flex flex-nowrap overflow-x-auto mw-100">
          <li className="nav-item">
            <button
              onClick={() => setActiveMainTab('register')}
              className={`nav-link rounded-pill px-3 px-sm-4 py-2 fw-semibold small whitespace-nowrap ${
                activeMainTab === 'register' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'
              }`}
            >
              📋 Subject School Register
            </button>
          </li>
          <li className="nav-item">
            <button
              onClick={() => {
                setActiveMainTab('dailyMaster');
                if (token) fetchDailyMaster(token, selectedDate);
              }}
              className={`nav-link rounded-pill px-3 px-sm-4 py-2 fw-semibold small whitespace-nowrap ${
                activeMainTab === 'dailyMaster' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'
              }`}
            >
              📅 Everyday College Master Report
            </button>
          </li>
        </ul>
      )}

      {/* Admin Attendance Policy Configuration Card */}
      {isAdmin && (
        <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white border-start border-4 border-warning">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div>
                <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                  <span>⚙️ Institutional Attendance Threshold Policy</span>
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill">
                    Configurable by College
                  </span>
                </h6>
                <p className="text-muted small mb-0">
                  College criteria vary across universities. Adjust the Non-Collegiate (NC) and Dis-Collegiate (DC) thresholds below. All reports and student rosters update in real time.
                </p>
              </div>

              <form onSubmit={handleUpdatePolicy} className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <label className="small fw-bold text-secondary mb-0">NC Cutoff (&lt; %):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={editNc}
                    onChange={(e) => setEditNc(Number(e.target.value))}
                    className="form-control form-control-sm text-center fw-bold"
                    style={{ width: 75 }}
                    required
                  />
                </div>

                <div className="d-flex align-items-center gap-2">
                  <label className="small fw-bold text-secondary mb-0">DC Cutoff (&lt; %):</label>
                  <input
                    type="number"
                    min="1"
                    max={editNc}
                    step="1"
                    value={editDc}
                    onChange={(e) => setEditDc(Number(e.target.value))}
                    className="form-control form-control-sm text-center fw-bold"
                    style={{ width: 75 }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={policySaving}
                  className="btn btn-warning btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm"
                >
                  {policySaving ? 'Saving...' : '💾 Save Policy'}
                </button>
              </form>
            </div>

            {policyMessage && (
              <div className="mt-3 small alert alert-info py-2 px-3 mb-0 rounded-3">
                {policyMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main View: Attendance Register View */}
      {activeMainTab === 'register' && (
        <>
          {/* Controls Bar: Course Selector + Timeframe + Date/Month Pickers */}
          <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
            <div className="card-body p-4">
              <div className="row g-3 align-items-center">
                {/* Subject / Course Section Selector */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-bold text-secondary mb-1">
                    📖 Select Course & Section:
                  </label>
                  <select
                    className="form-select form-select-sm rounded-3 shadow-none fw-semibold"
                    value={selectedSectionId}
                    onChange={(e) => handleFilterChange(undefined, e.target.value)}
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.subjectCode} - {sec.subjectName} ({sec.name}) [Sem {sec.semester}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timeframe Selector (Daily / Weekly / Monthly / All) */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-bold text-secondary mb-1">
                    ⏱️ Report Aggregation Timeframe:
                  </label>
                  <div className="btn-group w-100 btn-group-sm" role="group">
                    <button
                      type="button"
                      onClick={() => handleFilterChange('daily')}
                      className={`btn ${timeframe === 'daily' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFilterChange('weekly')}
                      className={`btn ${timeframe === 'weekly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFilterChange('monthly')}
                      className={`btn ${timeframe === 'monthly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFilterChange('all')}
                      className={`btn ${timeframe === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      All Sessions
                    </button>
                  </div>
                </div>

                {/* Date / Month Picker */}
                <div className="col-12 col-md-4">
                  {timeframe === 'daily' || timeframe === 'weekly' ? (
                    <div>
                      <label className="form-label small fw-bold text-secondary mb-1">
                        📅 Select Target Date:
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm rounded-3"
                        value={selectedDate}
                        onChange={(e) => handleFilterChange(undefined, undefined, e.target.value)}
                      />
                    </div>
                  ) : timeframe === 'monthly' ? (
                    <div>
                      <label className="form-label small fw-bold text-secondary mb-1">
                        🗓️ Select Academic Month:
                      </label>
                      <input
                        type="month"
                        className="form-control form-control-sm rounded-3"
                        value={selectedMonth}
                        onChange={(e) => handleFilterChange(undefined, undefined, undefined, e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="form-label small fw-bold text-secondary mb-1">
                        Status:
                      </label>
                      <div className="form-control-plaintext small text-success fw-bold">
                        Viewing Entire Term Sessions
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          {registerData && (
            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6 col-md-3">
                <div className="card shadow-sm border-0 rounded-4 bg-white p-3">
                  <span className="small text-muted fw-semibold">Total Enrolled Students</span>
                  <div className="d-flex align-items-baseline gap-2 mt-1">
                    <h3 className="fw-bold mb-0 text-primary">{registerData.summary.totalStudents}</h3>
                    <span className="small text-muted">Students</span>
                  </div>
                  <span className="text-secondary small mt-1" style={{ fontSize: 11 }}>
                    {registerData.sessions.length} Lectures Held
                  </span>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-3">
                <div className="card shadow-sm border-0 rounded-4 bg-white p-3">
                  <span className="small text-muted fw-semibold">Class Attendance Rate</span>
                  <div className="d-flex align-items-baseline gap-2 mt-1">
                    <h3 className="fw-bold mb-0 text-success">{registerData.summary.avgPercentage}%</h3>
                    <span className="badge bg-success-subtle text-success rounded-pill small">Average</span>
                  </div>
                  <div className="progress mt-2" style={{ height: 5 }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${registerData.summary.avgPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-3">
                <div 
                  className={`card shadow-sm border-0 rounded-4 p-3 cursor-pointer ${
                    statusFilter === 'nc' ? 'bg-warning-subtle border border-warning' : 'bg-white'
                  }`}
                  onClick={() => handleFilterChange(undefined, undefined, undefined, undefined, statusFilter === 'nc' ? 'all' : 'nc')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="small text-muted fw-semibold">Non-Collegiate (NC)</span>
                    <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: 10 }}>
                      &lt; {policy.ncThreshold}%
                    </span>
                  </div>
                  <div className="d-flex align-items-baseline gap-2 mt-1">
                    <h3 className="fw-bold mb-0 text-warning">{registerData.summary.ncCount}</h3>
                    <span className="small text-muted">At Warning</span>
                  </div>
                  <span className="text-warning small mt-1" style={{ fontSize: 11 }}>
                    Click to filter NC only
                  </span>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md-3">
                <div 
                  className={`card shadow-sm border-0 rounded-4 p-3 cursor-pointer ${
                    statusFilter === 'dc' ? 'bg-danger-subtle border border-danger' : 'bg-white'
                  }`}
                  onClick={() => handleFilterChange(undefined, undefined, undefined, undefined, statusFilter === 'dc' ? 'all' : 'dc')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="small text-muted fw-semibold">Dis-Collegiate (DC)</span>
                    <span className="badge bg-danger text-white rounded-pill" style={{ fontSize: 10 }}>
                      &lt; {policy.dcThreshold}%
                    </span>
                  </div>
                  <div className="d-flex align-items-baseline gap-2 mt-1">
                    <h3 className="fw-bold mb-0 text-danger">{registerData.summary.dcCount}</h3>
                    <span className="small text-muted">Critical Deficit</span>
                  </div>
                  <span className="text-danger small mt-1" style={{ fontSize: 11 }}>
                    Click to filter DC only
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar & Student Search */}
          <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
            <div className="card-body p-3">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3">
                {/* Status Pills */}
                <div className="d-flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange(undefined, undefined, undefined, undefined, 'all')}
                    className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold ${
                      statusFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                  >
                    All Students ({registerData?.allStudentsCount || 0})
                  </button>
                  <button
                    onClick={() => handleFilterChange(undefined, undefined, undefined, undefined, 'normal')}
                    className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold ${
                      statusFilter === 'normal' ? 'btn-success text-white' : 'btn-outline-success'
                    }`}
                  >
                    ● Eligible / Normal ({registerData?.summary?.normalCount || 0})
                  </button>
                  <button
                    onClick={() => handleFilterChange(undefined, undefined, undefined, undefined, 'nc')}
                    className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold ${
                      statusFilter === 'nc' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'
                    }`}
                  >
                    ⚠️ NC Below {policy.ncThreshold}% ({registerData?.summary?.ncCount || 0})
                  </button>
                  <button
                    onClick={() => handleFilterChange(undefined, undefined, undefined, undefined, 'dc')}
                    className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold ${
                      statusFilter === 'dc' ? 'btn-danger text-white' : 'btn-outline-danger'
                    }`}
                  >
                    ⛔ DC Below {policy.dcThreshold}% ({registerData?.summary?.dcCount || 0})
                  </button>
                </div>

                {/* Search Box */}
                <div style={{ minWidth: 260 }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Search student name or roll..."
                    className="form-control form-control-sm rounded-pill px-3 py-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* School Register Table Card */}
          <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white overflow-hidden">
            <div className="card-header bg-white border-bottom p-3.5 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0 text-dark">
                  📖 {registerData?.section?.subjectCode} - {registerData?.section?.subjectName}
                </h6>
                <span className="small text-muted">
                  Section {registerData?.section?.name} • Faculty: {registerData?.section?.assignedFaculty} • Department of MCA
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted">
                  Showing <b>{displayedStudents.length}</b> Students
                </span>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="small text-muted mt-2">Loading register records...</p>
                </div>
              ) : displayedStudents.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <h5>No students match the selected filter</h5>
                  <p className="small">Try changing the status filter or search query</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: 600 }}>
                  <table className="table table-hover table-bordered align-middle mb-0 text-center" style={{ fontSize: 13 }}>
                    <thead className="table-light sticky-top" style={{ zIndex: 2 }}>
                      <tr>
                        <th style={{ width: 45 }}>#</th>
                        <th className="text-start" style={{ minWidth: 150 }}>Roll / Enrollment</th>
                        <th className="text-start" style={{ minWidth: 180 }}>Student Name</th>
                        
                        {/* Lecture Sessions Date Headers */}
                        {(registerData?.sessions || []).map((session: any) => (
                          <th key={session.id} style={{ minWidth: 70 }} title={`${session.date} (${session.classroomName})`}>
                            <div className="fw-bold" style={{ fontSize: 12 }}>{session.formattedDate}</div>
                            <div className="text-muted" style={{ fontSize: 9 }}>{session.timeSlot}</div>
                            <div className="badge bg-light text-secondary border mt-1" style={{ fontSize: 9 }}>
                              {session.presentCount}/{session.totalStudents}
                            </div>
                          </th>
                        ))}

                        <th style={{ width: 65 }}>Held</th>
                        <th style={{ width: 65 }}>Attended</th>
                        <th style={{ width: 65 }}>Absent</th>
                        <th style={{ width: 95 }}>Attendance %</th>
                        <th style={{ width: 120 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedStudents.map((st: any, idx: number) => {
                        const isDc = st.status === 'DC';
                        const isNc = st.status === 'NC';

                        return (
                          <tr key={st.studentProfileId} className={isDc ? 'table-danger' : isNc ? 'table-warning' : ''}>
                            <td className="text-muted small">{idx + 1}</td>
                            <td className="text-start fw-semibold font-monospace small">{st.enrollmentNo}</td>
                            <td className="text-start">
                              <div className="fw-bold text-dark">{st.name}</div>
                              <div className="text-muted" style={{ fontSize: 11 }}>{st.email}</div>
                            </td>

                            {/* Session P/A/L Badges */}
                            {(registerData?.sessions || []).map((session: any) => {
                              const rec = st.records[session.id];
                              const isPresent = rec?.status === 'PRESENT';
                              const isLate = rec?.status === 'LATE';

                              return (
                                <td key={session.id} className="p-1">
                                  {isPresent ? (
                                    <span 
                                      className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded"
                                      title={`Present (${rec?.method || 'Marked'})`}
                                    >
                                      P
                                    </span>
                                  ) : isLate ? (
                                    <span 
                                      className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded"
                                      title="Late Arrival"
                                    >
                                      L
                                    </span>
                                  ) : (
                                    <span 
                                      className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded"
                                      title="Absent"
                                    >
                                      A
                                    </span>
                                  )}
                                </td>
                              );
                            })}

                            <td className="fw-bold">{st.totalHeld}</td>
                            <td className="fw-bold text-success">{st.totalAttended}</td>
                            <td className="fw-bold text-danger">{st.totalAbsent}</td>
                            <td>
                              <div className="d-flex align-items-center justify-content-center gap-1.5">
                                <span className={`fw-bold ${isDc ? 'text-danger' : isNc ? 'text-warning' : 'text-success'}`}>
                                  {st.percentage}%
                                </span>
                              </div>
                              <div className="progress mx-auto mt-1" style={{ height: 4, width: 60 }}>
                                <div
                                  className={`progress-bar ${isDc ? 'bg-danger' : isNc ? 'bg-warning' : 'bg-success'}`}
                                  style={{ width: `${Math.min(100, st.percentage)}%` }}
                                />
                              </div>
                            </td>
                            <td>
                              {isDc ? (
                                <span className="badge bg-danger text-white rounded-pill px-2.5 py-1">
                                  ⛔ DC (&lt;{policy.dcThreshold}%)
                                </span>
                              ) : isNc ? (
                                <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1">
                                  ⚠️ NC (&lt;{policy.ncThreshold}%)
                                </span>
                              ) : (
                                <span className="badge bg-success text-white rounded-pill px-2.5 py-1">
                                  ✓ Eligible
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Table Footer with Legend */}
            <div className="card-footer bg-light p-3 d-flex flex-wrap justify-content-between align-items-center gap-2 small">
              <div className="d-flex align-items-center gap-3">
                <span className="fw-bold text-secondary">Register Notation:</span>
                <span className="d-flex align-items-center gap-1">
                  <span className="badge bg-success-subtle text-success border border-success-subtle">P</span> Present
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle">L</span> Late
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle">A</span> Absent
                </span>
              </div>
              <div className="text-muted">
                Institutional Policy: <b>Eligible &ge; {policy.ncThreshold}%</b> | <b>NC: {policy.dcThreshold}% - {policy.ncThreshold - 0.1}%</b> | <b>DC &lt; {policy.dcThreshold}%</b>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Everyday Master Report View (For Admin) */}
      {isAdmin && activeMainTab === 'dailyMaster' && (
        <div className="card shadow-sm border-0 rounded-4 bg-white p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
            <div>
              <h5 className="fw-bold mb-1 text-dark">📅 Everyday College Master Attendance Log</h5>
              <p className="text-muted small mb-0">
                Detailed day-by-day attendance across every class and department in the institution.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="small fw-bold text-secondary mb-0">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (token) fetchDailyMaster(token, e.target.value);
                }}
                className="form-control form-control-sm rounded-pill px-3"
              />
            </div>
          </div>

          {dailyMasterLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="small text-muted mt-2">Loading everyday records...</p>
            </div>
          ) : !dailyMasterData || dailyMasterData.sessions.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h5>No class lectures recorded for {selectedDate}</h5>
              <p className="small">Select a date when classes were held (e.g., October 12, 2026)</p>
            </div>
          ) : (
            <div>
              {/* Daily Summary Stats */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-sm-4">
                  <div className="card bg-light border-0 p-3 rounded-4">
                    <span className="small text-muted">Lectures Conducted</span>
                    <h3 className="fw-bold text-primary mb-0">{dailyMasterData.totalSessions}</h3>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="card bg-light border-0 p-3 rounded-4">
                    <span className="small text-muted">Student Attendance Marked</span>
                    <h3 className="fw-bold text-success mb-0">{dailyMasterData.totalPresentSum} / {dailyMasterData.totalEnrolledSum}</h3>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="card bg-light border-0 p-3 rounded-4">
                    <span className="small text-muted">Overall Day Attendance Rate</span>
                    <h3 className="fw-bold text-dark mb-0">{dailyMasterData.overallRate}%</h3>
                  </div>
                </div>
              </div>

              {/* Class by Class Accordion / Cards */}
              <div className="d-flex flex-column gap-3">
                {dailyMasterData.sessions.map((ses: any) => (
                  <div key={ses.sessionId} className="card border rounded-4 shadow-none p-3.5">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary text-white">{ses.subjectCode}</span>
                          <h6 className="fw-bold mb-0 text-dark">{ses.subjectName}</h6>
                        </div>
                        <span className="small text-muted">
                          Section: <b>{ses.sectionName}</b> • Faculty: <b>{ses.facultyName}</b> • Room: <b>{ses.classroom}</b>
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        <div className="text-end">
                          <div className="fw-bold text-success small">
                            {ses.presentCount} Present / {ses.totalEnrolled} Enrolled
                          </div>
                          <span className="text-muted" style={{ fontSize: 11 }}>
                            Rate: <b>{ses.attendanceRate}%</b>
                          </span>
                        </div>
                        <span className={`badge rounded-pill px-3 py-2 ${
                          ses.attendanceRate >= policy.ncThreshold ? 'bg-success' : ses.attendanceRate >= policy.dcThreshold ? 'bg-warning text-dark' : 'bg-danger'
                        }`}>
                          {ses.attendanceRate >= policy.ncThreshold ? 'Normal' : ses.attendanceRate >= policy.dcThreshold ? 'NC Warning' : 'DC Alert'}
                        </span>
                      </div>
                    </div>

                    {/* Student List in this session */}
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: 12 }}>
                        <thead className="table-light">
                          <tr>
                            <th>Enrollment No</th>
                            <th>Student Name</th>
                            <th>Status</th>
                            <th>Verification</th>
                            <th>Marked Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ses.roster.map((st: any, sIdx: number) => (
                            <tr key={sIdx}>
                              <td className="font-monospace fw-semibold">{st.enrollmentNo}</td>
                              <td>{st.name}</td>
                              <td>
                                <span className={`badge ${
                                  st.status === 'PRESENT' ? 'bg-success-subtle text-success' : st.status === 'LATE' ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'
                                }`}>
                                  {st.status}
                                </span>
                              </td>
                              <td className="text-muted">{st.verificationMethod}</td>
                              <td className="text-muted">{new Date(st.markedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
