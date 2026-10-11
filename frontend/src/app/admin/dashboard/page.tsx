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
    <div className="space-y-8 font-mono">
      <header className="border-4 border-black p-6 bg-[#00ffcc] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Admin Overview</h1>
        <p className="text-xl font-bold mt-2 bg-black text-white inline-block px-2 py-1">SYS.STATUS: ONLINE</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold uppercase border-b-2 border-black pb-2 mb-4">Total Students</p>
          <p className="text-5xl font-black">{stats.totalStudents}</p>
        </div>
        <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold uppercase border-b-2 border-black pb-2 mb-4">Total Faculty</p>
          <p className="text-5xl font-black">{stats.totalFaculty}</p>
        </div>
        <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold uppercase border-b-2 border-black pb-2 mb-4">Active Classes</p>
          <p className="text-5xl font-black">{stats.activeClasses}</p>
        </div>
        <div className="border-4 border-black p-6 bg-[#ff3366] text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold uppercase border-b-2 border-white pb-2 mb-4">Avg Attendance</p>
          <p className="text-5xl font-black">{stats.averageAttendanceRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border-4 border-black p-8 bg-[#ffff00] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2">AI Subsystems</h2>
          <ul className="space-y-4 text-lg font-bold">
            <li className="flex justify-between border-b-2 border-black border-dashed pb-2">
              <span>FACE_RECOGNITION</span>
              <span className="bg-black text-[#00ffcc] px-2">ACTIVE</span>
            </li>
            <li className="flex justify-between border-b-2 border-black border-dashed pb-2">
              <span>LIVENESS_DETECT</span>
              <span className="bg-black text-[#00ffcc] px-2">ACTIVE</span>
            </li>
            <li className="flex justify-between border-b-2 border-black border-dashed pb-2">
              <span>GPS_VERIFICATION</span>
              <span className="bg-black text-[#00ffcc] px-2">ACTIVE</span>
            </li>
            <li className="flex justify-between border-b-2 border-black border-dashed pb-2">
              <span>ESP32_PROXIMITY</span>
              <span className="bg-black text-[#ff3366] px-2">OFFLINE</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
