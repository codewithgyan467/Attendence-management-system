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
  const [activeTab, setActiveTab] = useState<'overview' | 'override' | 'holidays'>('overview');

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

      const [statsRes, schedRes, recordsRes, holidaysRes] = await Promise.all([
        fetch(`${API_URL}/reports/global`, { headers }),
        fetch(`${API_URL}/attendance/live-schedule?${params.toString()}`, { headers }),
        fetch(`${API_URL}/attendance/admin/records`, { headers }),
        fetch(`${API_URL}/attendance/admin/holidays`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (schedRes.ok) setScheduleData(await schedRes.json());
      if (recordsRes.ok) setAttendanceRecords(await recordsRes.json());
      if (holidaysRes.ok) setHolidays(await holidaysRes.json());
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
        <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('override')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'override' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Override Attendance ({attendanceRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'holidays' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Holidays ({holidays.length})
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
    </div>
  );
}
