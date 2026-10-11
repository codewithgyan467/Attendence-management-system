'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    activeClasses: 0,
    averageAttendanceRate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/reports/global`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            System Live
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Admin Overview</h1>
          <p className="text-xs sm:text-sm text-slate-400">Institutional metrics and real-time biometric monitors</p>
        </div>
      </div>

      {/* Stats Grid */}
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
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Classes</p>
          <p className="text-2xl sm:text-4xl font-extrabold text-white">{stats.activeClasses}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-indigo-500/20 bg-indigo-500/[0.04]">
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">Avg Attendance</p>
          <p className="text-2xl sm:text-4xl font-extrabold text-indigo-300">{stats.averageAttendanceRate}%</p>
        </div>
      </div>

      {/* Subsystems & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🛡️</span> Biometrics & AI Subsystems
          </h2>
          <ul className="space-y-3 text-xs sm:text-sm">
            <li className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-medium text-slate-300">Face Recognition Engine</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
            </li>
            <li className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-medium text-slate-300">Live Anti-Spoofing Detection</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
            </li>
            <li className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-medium text-slate-300">GPS Proximity Verification</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
            </li>
            <li className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-medium text-slate-300">Bluetooth / Offline Mode</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">Standby</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
