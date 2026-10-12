'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import ClockWidget from '@/components/ClockWidget';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 33,
    totalFaculty: 4,
    activeClasses: 60,
    averageAttendanceRate: 88,
  });

  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [simDay, setSimDay] = useState<number | null>(null);
  const [simTime, setSimTime] = useState<string | null>(null);
  const [simChoice, setSimChoice] = useState('live');
  const [activeTab, setActiveTab] = useState<'overview' | 'override' | 'holidays' | 'classrooms'>('overview');
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeRange, setTimeRange] = useState('May 1 - 31, 2026');

  // Classrooms & Geofence state
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [editingClassroomId, setEditingClassroomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomBuilding, setEditRoomBuilding] = useState('');
  const [editRoomLat, setEditRoomLat] = useState<number | string>('');
  const [editRoomLng, setEditRoomLng] = useState<number | string>('');
  const [editRoomRadius, setEditRoomRadius] = useState<number | string>(100);

  // Form states
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchData = useCallback(async (authToken: string, day: number | null, time: string | null) => {
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const params = new URLSearchParams();
      if (day !== null) params.append('simulateDay', String(day));
      if (time !== null) params.append('simulateTime', time);
      params.append('semester', '1');

      const [statsRes, schedRes, recordsRes, holidaysRes, classroomsRes] = await Promise.all([
        fetch(`${API_URL}/reports/global`, { headers }),
        fetch(`${API_URL}/attendance/live-schedule?${params.toString()}`, { headers }),
        fetch(`${API_URL}/attendance/admin/records`, { headers }),
        fetch(`${API_URL}/attendance/admin/holidays`, { headers }),
        fetch(`${API_URL}/academic/classrooms`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (schedRes.ok) setScheduleData(await schedRes.json());
      if (recordsRes.ok) setAttendanceRecords(await recordsRes.json());
      if (holidaysRes.ok) setHolidays(await holidaysRes.json());
      if (classroomsRes.ok) setClassrooms(await classroomsRes.json());
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchData(storedToken, simDay, simTime);
    }
  }, [fetchData, simDay, simTime]);

  const handleSimulation = (day: number | null, time: string | null) => {
    setSimDay(day);
    setSimTime(time);
    if (!day) setSimChoice('live');
    else if (day === 2 && time === '08:15') setSimChoice('tue-os');
    else if (day === 2 && time === '09:30') setSimChoice('tue-lab');
    else if (day === 3 && time === '11:15') setSimChoice('wed-coa');
    else if (day === 5 && time === '14:20') setSimChoice('fri-os');

    if (token) fetchData(token, day, time);
  };

  const handleOverride = async (recordId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/attendance/admin/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recordId, status: newStatus })
      });
      if (res.ok) {
        setActionMessage(`Updated record to ${newStatus}`);
        setTimeout(() => setActionMessage(''), 3000);
        fetchData(token, simDay, simTime);
      }
    } catch (e) {
      console.error('Override error:', e);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/attendance/admin/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: holidayTitle, date: holidayDate, description: holidayDesc })
      });
      if (res.ok) {
        setHolidayTitle('');
        setHolidayDate('');
        setHolidayDesc('');
        setActionMessage('Holiday declared successfully. Regular attendance locked.');
        setTimeout(() => setActionMessage(''), 4000);
        fetchData(token, simDay, simTime);
      }
    } catch (e) {
      console.error('Holiday add error:', e);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!token) return;
    if (!confirm('Remove this holiday?')) return;
    try {
      const res = await fetch(`${API_URL}/attendance/admin/holidays/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData(token, simDay, simTime);
      }
    } catch (e) {
      console.error('Holiday delete error:', e);
    }
  };

  const handleDeleteAttendanceRecord = async (recordId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to permanently delete this attendance record?')) return;
    try {
      const res = await fetch(`${API_URL}/attendance/admin/records/${recordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage('Attendance record deleted successfully');
        setTimeout(() => setActionMessage(''), 3000);
        fetchData(token, simDay, simTime);
      }
    } catch (e) {
      console.error('Delete record error:', e);
    }
  };

  const handleStartEditClassroom = (c?: any) => {
    if (c) {
      setEditingClassroomId(c.id);
      setEditRoomName(c.name);
      setEditRoomBuilding(c.building || '');
      setEditRoomLat(c.latitude || '');
      setEditRoomLng(c.longitude || '');
      setEditRoomRadius(c.allowedRadiusMeters || 100);
    } else {
      setEditingClassroomId('NEW');
      setEditRoomName('');
      setEditRoomBuilding('');
      setEditRoomLat('');
      setEditRoomLng('');
      setEditRoomRadius(100);
    }
  };

  const handleDetectCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditRoomLat(Number(pos.coords.latitude.toFixed(6)));
        setEditRoomLng(Number(pos.coords.longitude.toFixed(6)));
        setActionMessage('Auto-detected device GPS coordinates successfully!');
        setTimeout(() => setActionMessage(''), 3000);
      },
      (err) => alert(`Failed to detect GPS: ${err.message}`),
      { enableHighAccuracy: true }
    );
  };

  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const isNew = editingClassroomId === 'NEW';
      const url = isNew ? `${API_URL}/academic/classrooms` : `${API_URL}/academic/classrooms/${editingClassroomId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        name: editRoomName,
        building: editRoomBuilding,
        latitude: parseFloat(String(editRoomLat)),
        longitude: parseFloat(String(editRoomLng)),
        allowedRadiusMeters: parseFloat(String(editRoomRadius))
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setActionMessage(`Classroom coordinates saved (${editRoomLat}, ${editRoomLng})!`);
        setTimeout(() => setActionMessage(''), 4000);
        setEditingClassroomId(null);
        fetchData(token, simDay, simTime);
      }
    } catch (err) {
      console.error('Save classroom error:', err);
    }
  };

  // Filter attendance records
  const filteredRecords = attendanceRecords.filter((rec) => {
    const matchesSearch = 
      (rec.student?.user?.firstName || '').toLowerCase().includes(searchTableQuery.toLowerCase()) ||
      (rec.student?.user?.lastName || '').toLowerCase().includes(searchTableQuery.toLowerCase()) ||
      (rec.student?.enrollmentNo || '').toLowerCase().includes(searchTableQuery.toLowerCase()) ||
      (rec.classSession?.timetableEntry?.section?.subject?.code || '').toLowerCase().includes(searchTableQuery.toLowerCase()) ||
      (rec.classSession?.timetableEntry?.section?.subject?.name || '').toLowerCase().includes(searchTableQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && rec.status === statusFilter;
  });

  return (
    <div className="pb-5 space-y-4">
      {/* ================= PAGE HEADER & TITLE ================= */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-2">
        <div>
          <h2 className="fw-bold mb-1 text-dark" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
            Attendance Dashboard
          </h2>
          <p className="text-secondary small mb-0">
            Here's what's going on at Assam Engineering College right now
          </p>
        </div>

        {/* Tab Switcher Navigation */}
        <div className="d-flex align-items-center gap-1.5 p-1 bg-white rounded-3 border shadow-sm overflow-auto max-w-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold text-nowrap transition-all ${
              activeTab === 'overview'
                ? 'btn-primary text-white shadow-sm'
                : 'btn-light text-secondary border-0'
            }`}
            style={{ fontSize: 13 }}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('override')}
            className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold text-nowrap transition-all ${
              activeTab === 'override'
                ? 'btn-primary text-white shadow-sm'
                : 'btn-light text-secondary border-0'
            }`}
            style={{ fontSize: 13 }}
          >
            📋 Live Records ({attendanceRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('classrooms')}
            className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold text-nowrap transition-all ${
              activeTab === 'classrooms'
                ? 'btn-primary text-white shadow-sm'
                : 'btn-light text-secondary border-0'
            }`}
            style={{ fontSize: 13 }}
          >
            📍 Geofence Classrooms
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold text-nowrap transition-all ${
              activeTab === 'holidays'
                ? 'btn-primary text-white shadow-sm'
                : 'btn-light text-secondary border-0'
            }`}
            style={{ fontSize: 13 }}
          >
            🏖️ Holidays ({holidays.length})
          </button>
        </div>
      </div>

      {/* Action feedback toast banner */}
      {actionMessage && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 rounded-3 shadow-sm border-0 mb-3 small">
          <span>✓</span>
          <span className="fw-medium">{actionMessage}</span>
        </div>
      )}

      {/* Live Routine Clock & Calendar Widget */}
      <div className="mb-4">
        <ClockWidget 
          scheduleData={scheduleData}
          onSimulationChange={handleSimulation}
          selectedSimulation={simChoice}
        />
      </div>

      {/* ================= TAB 1: PHOENIX OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Summary Pill Highlights */}
          <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded-pill border shadow-sm">
              <span className="badge bg-success-subtle text-success p-1 rounded-circle">✓</span>
              <div>
                <span className="fw-bold text-dark small me-1">57 verified check-ins</span>
                <span className="text-muted small" style={{ fontSize: 11 }}>Awaiting next slot</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded-pill border shadow-sm">
              <span className="badge bg-warning-subtle text-warning p-1 rounded-circle">⏸</span>
              <div>
                <span className="fw-bold text-dark small me-1">5 on review</span>
                <span className="text-muted small" style={{ fontSize: 11 }}>Borderline face match</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-white rounded-pill border shadow-sm">
              <span className="badge bg-danger-subtle text-danger p-1 rounded-circle">✕</span>
              <div>
                <span className="fw-bold text-dark small me-1">15 students</span>
                <span className="text-muted small" style={{ fontSize: 11 }}>Below NC/DC 75% limit</span>
              </div>
            </div>
          </div>

          {/* ================= 4-CARD METRIC GRID ================= */}
          <div className="row g-3 g-lg-4 mb-4">
            {/* Card 1: Total Attendance Records */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="phoenix-card p-3.5 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small fw-semibold">Total attendance</span>
                    <span className="badge badge-phoenix-warning rounded-pill px-2 py-0.5" style={{ fontSize: 11 }}>
                      -6.8%
                    </span>
                  </div>
                  <div className="text-muted small mb-2" style={{ fontSize: 11 }}>Last 7 days</div>
                  <h3 className="fw-bold text-dark mb-3" style={{ fontSize: 26 }}>16,247</h3>
                </div>

                {/* Mini CSS Bar Chart */}
                <div>
                  <div className="d-flex align-items-end justify-content-between gap-1.5" style={{ height: 60 }}>
                    {[38, 55, 42, 60, 48, 70, 65].map((h, i) => (
                      <div key={i} className="w-100 bg-light rounded-top d-flex align-items-end" style={{ height: '100%' }}>
                        <div 
                          className="w-100 rounded-top" 
                          style={{ 
                            height: `${h}%`, 
                            backgroundColor: i === 5 ? '#3874ff' : '#85a9ff',
                            transition: 'height 0.3s'
                          }} 
                        />
                      </div>
                    ))}
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top" style={{ fontSize: 11 }}>
                    <span className="d-flex align-items-center gap-1 text-muted">
                      <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: '#3874ff' }} />
                      Completed
                    </span>
                    <span className="fw-bold text-dark">52%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Registered Students */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="phoenix-card p-3.5 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small fw-semibold">Enrolled students</span>
                    <span className="badge badge-phoenix-success rounded-pill px-2 py-0.5" style={{ fontSize: 11 }}>
                      +26.5%
                    </span>
                  </div>
                  <div className="text-muted small mb-2" style={{ fontSize: 11 }}>Last 7 days</div>
                  <h3 className="fw-bold text-dark mb-3" style={{ fontSize: 26 }}>356</h3>
                </div>

                {/* Mini SVG Wave Sparkline */}
                <div>
                  <svg viewBox="0 0 140 45" className="w-100" style={{ height: 50, overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="blueSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3874ff" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3874ff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,35 Q 20,25 40,30 T 80,10 T 115,22 T 140,5"
                      fill="none"
                      stroke="#3874ff"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 0,35 Q 20,25 40,30 T 80,10 T 115,22 T 140,5 L 140,45 L 0,45 Z"
                      fill="url(#blueSpark)"
                    />
                  </svg>
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top text-muted" style={{ fontSize: 11 }}>
                    <span>01 May</span>
                    <span>07 May</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Attendance Compliance Donut Gauge */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="phoenix-card p-3.5 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small fw-semibold">Compliance Rate</span>
                    <span className="badge badge-phoenix-primary rounded-pill px-2 py-0.5" style={{ fontSize: 11 }}>
                      72% Goal
                    </span>
                  </div>
                  <div className="text-muted small mb-2" style={{ fontSize: 11 }}>Last 7 days</div>
                </div>

                {/* Circular Donut Gauge in pure SVG */}
                <div className="d-flex align-items-center justify-content-center position-relative my-2">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f1f3f8" strokeWidth="9" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3874ff"
                      strokeWidth="9"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset="70.3"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="position-absolute text-center">
                    <span className="fw-bold text-dark fs-5">72%</span>
                  </div>
                </div>

                <div className="border-top pt-2" style={{ fontSize: 11 }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Regular (≥75%)</span>
                    <span className="fw-semibold text-dark">72%</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">NC / DC Risk</span>
                    <span className="fw-semibold text-dark">28%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Biometric vs Manual Override */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="phoenix-card p-3.5 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small fw-semibold">Biometric vs manual</span>
                    <span className="badge badge-phoenix-success rounded-pill px-2 py-0.5" style={{ fontSize: 11 }}>
                      Live
                    </span>
                  </div>
                  <div className="text-muted small mb-2" style={{ fontSize: 11 }}>Last 7 days</div>
                </div>

                {/* Semi-circular radial gauge */}
                <div className="d-flex align-items-center justify-content-center position-relative my-2">
                  <svg width="110" height="60" viewBox="0 0 110 60">
                    <path d="M 10,55 A 45,45 0 0,1 100,55" fill="none" stroke="#e8edf5" strokeWidth="10" strokeLinecap="round" />
                    <path
                      d="M 10,55 A 45,45 0 0,1 100,55"
                      fill="none"
                      stroke="#3874ff"
                      strokeWidth="10"
                      strokeDasharray="141.3"
                      strokeDashoffset="42.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="border-top pt-2" style={{ fontSize: 11 }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="d-flex align-items-center gap-1 text-muted">
                      <span className="rounded-circle d-inline-block" style={{ width: 7, height: 7, backgroundColor: '#3874ff' }} />
                      Face + GPS
                    </span>
                    <span className="fw-bold text-dark">70%</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="d-flex align-items-center gap-1 text-muted">
                      <span className="rounded-circle d-inline-block" style={{ width: 7, height: 7, backgroundColor: '#e8edf5' }} />
                      Manual Override
                    </span>
                    <span className="fw-bold text-dark">30%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= MAIN CENTRAL CHART: TOTAL TURNOUT ================= */}
          <div className="phoenix-card p-4 mb-4">
            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-4">
              <div>
                <h4 className="fw-bold text-dark mb-1" style={{ fontSize: 20 }}>
                  Total Turnout
                </h4>
                <p className="text-muted small mb-0">
                  Biometric check-ins received across all MCA lecture sessions
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="dropdown">
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="form-select form-select-sm rounded-pill border shadow-sm px-3 py-1.5 fw-semibold text-secondary"
                  style={{ fontSize: 13 }}
                >
                  <option value="May 1 - 31, 2026">May 1 - 31, 2026</option>
                  <option value="This Week">This Week (Mon - Sat)</option>
                  <option value="Today">Today (Real-time)</option>
                </select>
              </div>
            </div>

            {/* Main Interactive Spline Area Graph */}
            <div className="position-relative w-100" style={{ height: 260 }}>
              <svg viewBox="0 0 900 240" className="w-100 h-100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="phoenixTurnoutGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3874ff" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#3874ff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1="0" y1="40" x2="900" y2="40" stroke="#f1f3f8" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="900" y2="100" stroke="#f1f3f8" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="160" x2="900" y2="160" stroke="#f1f3f8" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="220" x2="900" y2="220" stroke="#f1f3f8" strokeWidth="1" />

                {/* Main Curve */}
                <path
                  d="M 0,190 
                     C 100,185 140,185 200,185 
                     C 250,185 290,130 350,130 
                     C 400,130 440,65 500,65 
                     C 530,65 550,150 600,150 
                     C 650,150 680,110 740,110 
                     C 800,110 840,170 900,170"
                  fill="none"
                  stroke="#3874ff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Filled Area */}
                <path
                  d="M 0,190 
                     C 100,185 140,185 200,185 
                     C 250,185 290,130 350,130 
                     C 400,130 440,65 500,65 
                     C 530,65 550,150 600,150 
                     C 650,150 680,110 740,110 
                     C 800,110 840,170 900,170 
                     L 900,240 L 0,240 Z"
                  fill="url(#phoenixTurnoutGrad)"
                />

                {/* Highlight Point */}
                <circle cx="500" cy="65" r="6" fill="#3874ff" stroke="#ffffff" strokeWidth="3" />
              </svg>
            </div>

            {/* X-Axis Date Ticks */}
            <div className="d-flex align-items-center justify-content-between pt-2 border-top text-muted small" style={{ fontSize: 12 }}>
              <span>01 May</span>
              <span>15 May</span>
              <span>30 May</span>
            </div>
          </div>

          {/* ================= LATEST ATTENDANCE STREAM TABLE ================= */}
          <div className="phoenix-card p-4">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
              <div>
                <h4 className="fw-bold text-dark mb-1" style={{ fontSize: 19 }}>
                  Latest Attendance Stream
                </h4>
                <p className="text-muted small mb-0">
                  Real-time facial verification records received across all classroom sessions
                </p>
              </div>

              {/* Table search & filter tools */}
              <div className="d-flex align-items-center gap-2 w-100 w-md-auto">
                <input
                  type="text"
                  placeholder="Search student or course..."
                  value={searchTableQuery}
                  onChange={(e) => setSearchTableQuery(e.target.value)}
                  className="form-control form-control-sm rounded-pill px-3 bg-light border"
                  style={{ maxWidth: 220, fontSize: 12.5 }}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select form-select-sm rounded-pill border px-2.5 py-1 text-secondary"
                  style={{ width: 140, fontSize: 12.5 }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present Only</option>
                  <option value="REVIEW_REQUIRED">Review Required</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Data Table */}
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0" style={{ fontSize: 13 }}>
                <thead className="table-light text-muted uppercase small" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" className="form-check-input" />
                    </th>
                    <th>STUDENT</th>
                    <th>COURSE / CLASSROOM</th>
                    <th>BIOMETRIC RATING</th>
                    <th>VERIFICATION DETAILS</th>
                    <th>STATUS</th>
                    <th>TIME</th>
                    <th className="text-end">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted small">
                        No matching attendance records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.slice(0, 15).map((rec) => {
                      const isApproved = rec.status === 'PRESENT';
                      const isReview = rec.status === 'REVIEW_REQUIRED';
                      const isRejected = rec.status === 'REJECTED';

                      return (
                        <tr key={rec.id}>
                          <td>
                            <input type="checkbox" className="form-check-input" />
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2.5">
                              <div 
                                className="rounded-circle overflow-hidden bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                style={{ width: 34, height: 34, fontSize: 13 }}
                              >
                                {rec.student?.user?.firstName?.[0] || 'S'}
                              </div>
                              <div>
                                <span className="fw-bold text-dark d-block">
                                  {rec.student?.user?.firstName} {rec.student?.user?.lastName}
                                </span>
                                <span className="text-muted font-monospace" style={{ fontSize: 11 }}>
                                  {rec.student?.enrollmentNo}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="fw-semibold text-dark d-block">
                              {rec.classSession?.timetableEntry?.section?.subject?.code || 'MCA-101'}
                            </span>
                            <span className="text-muted small" style={{ fontSize: 11 }}>
                              {rec.classSession?.classroom?.name || 'Computer Lab'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1 text-warning" style={{ fontSize: 12 }}>
                              <span>★★★★★</span>
                              <span className="text-muted font-monospace ms-1" style={{ fontSize: 11 }}>
                                {rec.faceScore ? `${(rec.faceScore * 100).toFixed(0)}%` : 'ArcFace'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="text-secondary small d-block">
                              {rec.notes || `${rec.verificationMethod || 'FACE_GPS'}`}
                            </span>
                          </td>
                          <td>
                            {isApproved && (
                              <span className="badge badge-phoenix-success rounded-pill px-2.5 py-1">
                                ✓ APPROVED
                              </span>
                            )}
                            {isReview && (
                              <span className="badge badge-phoenix-warning rounded-pill px-2.5 py-1">
                                ⏸ REVIEW
                              </span>
                            )}
                            {isRejected && (
                              <span className="badge badge-phoenix-danger rounded-pill px-2.5 py-1">
                                ✕ REJECTED
                              </span>
                            )}
                            {!isApproved && !isReview && !isRejected && (
                              <span className="badge badge-phoenix-primary rounded-pill px-2.5 py-1">
                                {rec.status}
                              </span>
                            )}
                          </td>
                          <td className="text-muted font-monospace" style={{ fontSize: 11.5 }}>
                            {rec.markedAt ? new Date(rec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </td>
                          <td className="text-end">
                            <div className="btn-group">
                              <button
                                onClick={() => handleOverride(rec.id, rec.status === 'PRESENT' ? 'REJECTED' : 'PRESENT')}
                                className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0.5"
                                style={{ fontSize: 11 }}
                                title="Toggle Status"
                              >
                                {rec.status === 'PRESENT' ? 'Reject' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleDeleteAttendanceRecord(rec.id)}
                                className="btn btn-sm btn-outline-danger rounded-circle p-1 ms-1 d-flex align-items-center justify-content-center"
                                style={{ width: 24, height: 24, fontSize: 10 }}
                                title="Delete Record"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: OVERRIDE ATTENDANCE ================= */}
      {activeTab === 'override' && (
        <div className="phoenix-card p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold text-dark mb-1">Administrative Attendance Overrides</h4>
              <p className="text-muted small mb-0">Modify, verify, or revoke student attendance entries</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle table-hover">
              <thead className="table-light small text-muted">
                <tr>
                  <th>STUDENT</th>
                  <th>SUBJECT / SESSION</th>
                  <th>METHOD</th>
                  <th>CURRENT STATUS</th>
                  <th>TIMESTAMP</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="fw-bold text-dark">{r.student?.user?.firstName} {r.student?.user?.lastName}</div>
                      <div className="text-muted small font-monospace">{r.student?.enrollmentNo}</div>
                    </td>
                    <td>
                      <div>{r.classSession?.timetableEntry?.section?.subject?.name || 'Class Session'}</div>
                      <div className="text-muted small">{r.classSession?.classroom?.name}</div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">{r.verificationMethod}</span>
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-2.5 py-1 ${
                        r.status === 'PRESENT' ? 'badge-phoenix-success' :
                        r.status === 'REVIEW_REQUIRED' ? 'badge-phoenix-warning' : 'badge-phoenix-danger'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="small font-monospace text-muted">
                      {new Date(r.markedAt).toLocaleString()}
                    </td>
                    <td className="text-end">
                      <div className="btn-group gap-1">
                        <button
                          onClick={() => handleOverride(r.id, 'PRESENT')}
                          className="btn btn-sm btn-outline-success rounded-pill px-2 py-0.5 small"
                        >
                          Mark Present
                        </button>
                        <button
                          onClick={() => handleOverride(r.id, 'REJECTED')}
                          className="btn btn-sm btn-outline-danger rounded-pill px-2 py-0.5 small"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDeleteAttendanceRecord(r.id)}
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0.5 small"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CLASSROOMS & GEOFENCE ================= */}
      {activeTab === 'classrooms' && (
        <div className="space-y-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1">Classroom Geofences & Coordinates</h4>
              <p className="text-muted small mb-0">Manage GPS boundaries and ESP32 attendance hardware</p>
            </div>
            <button
              onClick={() => handleStartEditClassroom()}
              className="btn btn-primary btn-sm rounded-pill px-3.5 py-1.5 fw-semibold shadow-sm"
            >
              + Register New Classroom
            </button>
          </div>

          {editingClassroomId && (
            <div className="phoenix-card p-4 mb-4 border-primary">
              <h5 className="fw-bold text-dark mb-3">
                {editingClassroomId === 'NEW' ? 'Register New Classroom' : 'Edit Classroom GPS Geofence'}
              </h5>
              <form onSubmit={handleSaveClassroom} className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Classroom Name</label>
                  <input
                    type="text"
                    required
                    value={editRoomName}
                    onChange={(e) => setEditRoomName(e.target.value)}
                    placeholder="MCA Computer Lab"
                    className="form-control form-control-sm rounded-2"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Building / Wing</label>
                  <input
                    type="text"
                    value={editRoomBuilding}
                    onChange={(e) => setEditRoomBuilding(e.target.value)}
                    placeholder="MCA Block"
                    className="form-control form-control-sm rounded-2"
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={editRoomLat}
                    onChange={(e) => setEditRoomLat(e.target.value)}
                    placeholder="26.140537"
                    className="form-control form-control-sm rounded-2 font-monospace"
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={editRoomLng}
                    onChange={(e) => setEditRoomLng(e.target.value)}
                    placeholder="91.656738"
                    className="form-control form-control-sm rounded-2 font-monospace"
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Radius (Meters)</label>
                  <input
                    type="number"
                    required
                    value={editRoomRadius}
                    onChange={(e) => setEditRoomRadius(e.target.value)}
                    placeholder="100"
                    className="form-control form-control-sm rounded-2 font-monospace"
                  />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button type="button" onClick={handleDetectCurrentGPS} className="btn btn-outline-info btn-sm rounded-pill px-3">
                    📍 Detect Device GPS
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm rounded-pill px-4 fw-semibold ms-auto">
                    Save Coordinates
                  </button>
                  <button type="button" onClick={() => setEditingClassroomId(null)} className="btn btn-light btn-sm rounded-pill px-3">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="row g-3">
            {classrooms.map((c) => (
              <div key={c.id} className="col-12 col-md-6 col-xl-4">
                <div className="phoenix-card p-3.5 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5 className="fw-bold text-dark mb-0">{c.name}</h5>
                      <span className="badge bg-light text-secondary border font-monospace small">
                        {c.allowedRadiusMeters || 100}m
                      </span>
                    </div>
                    <p className="text-muted small mb-2">{c.building || 'Main Campus Block'}</p>
                    <div className="small font-monospace text-secondary mb-3">
                      <div>Lat: {c.latitude || '26.140537'}</div>
                      <div>Lng: {c.longitude || '91.656738'}</div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                    <button
                      onClick={() => handleStartEditClassroom(c)}
                      className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 small"
                    >
                      Edit GPS
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: DECLARED HOLIDAYS ================= */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="phoenix-card p-4 mb-4">
            <h4 className="fw-bold text-dark mb-1">Declare Institutional Holiday</h4>
            <p className="text-muted small mb-3">Suspends scheduled classes and locks attendance for that date</p>
            <form onSubmit={handleAddHoliday} className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Holiday Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rongali Bihu"
                  value={holidayTitle}
                  onChange={(e) => setHolidayTitle(e.target.value)}
                  className="form-control form-control-sm rounded-2"
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Holiday Date</label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="form-control form-control-sm rounded-2"
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Description</label>
                <input
                  type="text"
                  placeholder="Official State Holiday"
                  value={holidayDesc}
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  className="form-control form-control-sm rounded-2"
                />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary btn-sm rounded-pill px-4 fw-semibold shadow-sm">
                  + Declare Holiday
                </button>
              </div>
            </form>
          </div>

          <div className="phoenix-card p-4">
            <h5 className="fw-bold text-dark mb-3">Declared Institutional Holidays ({holidays.length})</h5>
            <div className="table-responsive">
              <table className="table align-middle table-hover">
                <thead className="table-light small text-muted">
                  <tr>
                    <th>DATE</th>
                    <th>HOLIDAY TITLE</th>
                    <th>DESCRIPTION</th>
                    <th className="text-end">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted small">
                        No declared holidays in calendar.
                      </td>
                    </tr>
                  ) : (
                    holidays.map((h) => (
                      <tr key={h.id}>
                        <td className="font-monospace fw-bold text-dark">{h.date}</td>
                        <td className="fw-semibold text-dark">{h.title}</td>
                        <td className="text-secondary small">{h.description || '—'}</td>
                        <td className="text-end">
                          <button
                            onClick={() => handleDeleteHoliday(h.id)}
                            className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
