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
        setActionMessage('Holiday declared successfully. Regular class attendance locked for that day.');
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
    if (!confirm('Are you sure you want to permanently delete this attendance record from the database?')) return;
    try {
      const res = await fetch(`${API_URL}/attendance/admin/records/${recordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage('Attendance record deleted successfully from database');
        setTimeout(() => setActionMessage(''), 3000);
        fetchData(token, simDay, simTime);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete attendance record');
      }
    } catch (e) {
      console.error('Delete record error:', e);
    }
  };

  const handleDeleteClassroom = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete classroom "${name}"? This action will safely clean up associated routine slots and hardware bindings.`)) return;
    try {
      const res = await fetch(`${API_URL}/academic/classrooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMessage(`Classroom "${name}" deleted successfully`);
        setTimeout(() => setActionMessage(''), 3000);
        fetchData(token, simDay, simTime);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete classroom from database');
      }
    } catch (e) {
      console.error('Delete classroom error:', e);
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
      (err) => {
        alert(`Failed to detect GPS: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const payload = {
        name: editRoomName,
        building: editRoomBuilding,
        latitude: Number(editRoomLat),
        longitude: Number(editRoomLng),
        allowedRadiusMeters: Number(editRoomRadius),
      };

      const isNew = editingClassroomId === 'NEW';
      const url = isNew
        ? `${API_URL}/academic/classrooms`
        : `${API_URL}/academic/classrooms/${editingClassroomId}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
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
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to save classroom');
      }
    } catch (err) {
      console.error('Save classroom error:', err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Master Authority Access
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Admin Master Control</h1>
          <p className="text-xs sm:text-sm text-slate-400">Time-window governance, attendance override, and holiday management</p>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-white/10 w-full sm:w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('override')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'override' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Override Attendance ({attendanceRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'holidays' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Holidays ({holidays.length})
          </button>
          <button
            onClick={() => setActiveTab('classrooms')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'classrooms' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Classrooms & GPS ({classrooms.length})
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Live Clock & Calendar Widget */}
      <ClockWidget 
        scheduleData={scheduleData}
        onSimulationChange={handleSimulation}
        selectedSimulation={simChoice}
      />

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="glass-panel rounded-2xl p-4 sm:p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Students</p>
              <p className="text-2xl sm:text-4xl font-extrabold text-white">{stats.totalStudents}</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 sm:p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Faculty</p>
              <p className="text-2xl sm:text-4xl font-extrabold text-white">{stats.totalFaculty}</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 sm:p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Timetable Slots</p>
              <p className="text-2xl sm:text-4xl font-extrabold text-white">60</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 sm:p-6 border-indigo-500/20 bg-indigo-500/[0.04]">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">Avg Attendance</p>
              <p className="text-2xl sm:text-4xl font-extrabold text-indigo-300">{stats.averageAttendanceRate}%</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>🏛️</span> Institutional Timetable Policy & Strict Hierarchy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="font-bold text-indigo-300 block">Strict 1-Hour Time Window</span>
                <p className="text-slate-400">Students and faculties must follow the Assam Engineering College timetable. Once a class slot ends, its attendance session locks automatically.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="font-bold text-emerald-300 block">Multi-Factor Liveness Check</span>
                <p className="text-slate-400">Requires facial depth/anti-spoofing vectors and geofenced classroom radius containment. No proxy attendance permitted.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="font-bold text-purple-300 block">Admin Master Override</span>
                <p className="text-slate-400">Admin holds absolute authority to override student or faculty attendance records, update past sessions, or declare holidays.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OVERRIDE & MANIPULATE ATTENDANCE */}
      {activeTab === 'override' && (
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Master Attendance Override</h2>
              <p className="text-xs sm:text-sm text-slate-400">Modify any record status at any time regardless of routine locks</p>
            </div>
          </div>

          <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3.5 sm:p-4">Student</th>
                  <th className="p-3.5 sm:p-4">Roll / ID</th>
                  <th className="p-3.5 sm:p-4">Subject</th>
                  <th className="p-3.5 sm:p-4">Status</th>
                  <th className="p-3.5 sm:p-4">Logged Method</th>
                  <th className="p-3.5 sm:p-4 text-right">Admin Override Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {attendanceRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3.5 sm:p-4 font-semibold text-white">
                      {r.student?.user?.firstName} {r.student?.user?.lastName}
                    </td>
                    <td className="p-3.5 sm:p-4 font-mono text-xs text-indigo-300">
                      {r.student?.enrollmentNo}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-200">
                      {r.classSession?.timetableEntry?.section?.subject?.name || 'Class Session'}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {r.status === 'PRESENT' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PRESENT
                        </span>
                      )}
                      {r.status === 'ABSENT' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          ABSENT
                        </span>
                      )}
                      {r.status === 'LATE' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          LATE
                        </span>
                      )}
                      {r.status === 'EXCUSED' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          EXCUSED
                        </span>
                      )}
                      {!['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(r.status) && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300">
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 sm:p-4 font-mono text-xs text-slate-400">
                      {r.verificationMethod}
                    </td>
                    <td className="p-3.5 sm:p-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleOverride(r.id, 'PRESENT')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleOverride(r.id, 'ABSENT')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleOverride(r.id, 'EXCUSED')}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-colors"
                      >
                        Excused
                      </button>
                      <button
                        onClick={() => handleDeleteAttendanceRecord(r.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                        title="Delete record from database"
                      >
                        ✕ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No attendance records logged yet. Records will stream here as students complete verification.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HOLIDAY & SUSPENSION MANAGEMENT */}
      {activeTab === 'holidays' && (
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Institutional Holiday Control</h2>
              <p className="text-xs sm:text-sm text-slate-400">Declare holidays to suspend regular student attendance locks</p>
            </div>
          </div>

          {/* Add Holiday Form */}
          <div className="rounded-2xl p-5 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🎉</span> Declare New Holiday
            </h3>
            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Holiday Title</label>
                <input
                  required
                  placeholder="e.g. Durga Puja / College Week"
                  value={holidayTitle}
                  onChange={(e) => setHolidayTitle(e.target.value)}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  required
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm text-white w-full bg-slate-950/80 border-white/15"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <input
                  placeholder="e.g. Official campus suspension"
                  value={holidayDesc}
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                >
                  Declare Holiday
                </button>
              </div>
            </form>
          </div>

          {/* Holidays Table */}
          <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3.5 sm:p-4">Holiday Name</th>
                  <th className="p-3.5 sm:p-4">Scheduled Date</th>
                  <th className="p-3.5 sm:p-4">Details</th>
                  <th className="p-3.5 sm:p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3.5 sm:p-4 font-bold text-white">
                      🎉 {h.title}
                    </td>
                    <td className="p-3.5 sm:p-4 font-mono text-indigo-300">
                      {h.date}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-400">
                      {h.description || 'Institutional Holiday'}
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {holidays.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No holidays declared. Standard timetable routine is in effect every weekday.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CLASSROOMS & GPS GEOFENCE MANAGEMENT */}
      {activeTab === 'classrooms' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>📍</span> Campus Classrooms & Dynamic GPS Geofence
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure coordinates and perimeter radius for any classroom, department, or university globally.
                </p>
              </div>
              <button
                onClick={() => handleStartEditClassroom()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                <span>+</span> Add New Classroom
              </button>
            </div>

            {/* Modal/Form for Editing Classroom Coordinates */}
            {editingClassroomId && (
              <form onSubmit={handleSaveClassroom} className="p-5 rounded-2xl bg-slate-950/80 border border-sky-400/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    {editingClassroomId === 'NEW' ? 'Register New Classroom' : 'Edit Classroom Coordinates & Geofence'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingClassroomId(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Room Name</label>
                    <input
                      type="text"
                      required
                      placeholder="MCA Computer Lab"
                      value={editRoomName}
                      onChange={(e) => setEditRoomName(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-900 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Building</label>
                    <input
                      type="text"
                      placeholder="MCA Department Block"
                      value={editRoomBuilding}
                      onChange={(e) => setEditRoomBuilding(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-900 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Allowed Radius (Meters)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={5000}
                      placeholder="100"
                      value={editRoomRadius}
                      onChange={(e) => setEditRoomRadius(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-900 border-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300 uppercase">Latitude</label>
                      <span className="text-[10px] text-slate-400 font-mono">Current: 26.140537</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="26.140537"
                      value={editRoomLat}
                      onChange={(e) => setEditRoomLat(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-900 border-white/10"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300 uppercase">Longitude</label>
                      <span className="text-[10px] text-slate-400 font-mono">Current: 91.656738</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="91.656738"
                      value={editRoomLng}
                      onChange={(e) => setEditRoomLng(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white bg-slate-900 border-white/10"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDetectCurrentGPS}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-2"
                  >
                    <span>🎯</span> Auto-Detect My Current GPS Location
                  </button>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setEditingClassroomId(null)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
                    >
                      Save Coordinates
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Classrooms Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-white/[0.03] text-slate-400 uppercase text-[11px] border-b border-white/10">
                  <tr>
                    <th className="p-3.5 sm:p-4">Room & Campus</th>
                    <th className="p-3.5 sm:p-4">GPS Coordinates</th>
                    <th className="p-3.5 sm:p-4">Geofence Radius</th>
                    <th className="p-3.5 sm:p-4">Hardware Device</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classrooms.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="p-3.5 sm:p-4 font-semibold text-white">
                        {c.name}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {c.building ? `${c.building} (${c.floor || 'Ground'} Floor)` : 'Main Campus'}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 font-mono text-sky-300">
                        {c.latitude && c.longitude ? (
                          <span>{c.latitude.toFixed(6)}, {c.longitude.toFixed(6)}</span>
                        ) : (
                          <span className="text-slate-500">Not Configured</span>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {c.allowedRadiusMeters || 100} meters
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4">
                        {c.esp32Device ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/25">
                            {c.esp32Device.deviceId}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">Simulated / None</span>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4 text-right">
                        <button
                          onClick={() => handleStartEditClassroom(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-colors"
                        >
                          Edit Coordinates
                        </button>
                        <button
                          onClick={() => handleDeleteClassroom(c.id, c.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors ml-2"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {classrooms.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No classrooms loaded.
                      </td>
                    </tr>
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
