"use client";

import React, { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // In production, this would call our NestJS backend: GET /reports/global
    // For now, we simulate the API response
    setTimeout(() => {
      setStats({
        totalClassesConducted: 420,
        averageAttendanceRate: 85.5,
        anomaliesDetected: 12,
        onlineGeofenceRate: 70.0,
        offlineEsp32Rate: 30.0,
      });
    }, 1000);
  }, []);

  if (!stats) return <div className="p-8 text-white">Loading reports...</div>;

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">System Analytics & Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Average Attendance</h3>
          <p className="text-4xl font-bold mt-2 text-green-400">{stats.averageAttendanceRate}%</p>
        </div>
        
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Classes Conducted</h3>
          <p className="text-4xl font-bold mt-2 text-blue-400">{stats.totalClassesConducted}</p>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Spoof Anomalies</h3>
          <p className="text-4xl font-bold mt-2 text-red-400">{stats.anomaliesDetected}</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Verification Methods</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Online (GPS + AI)</span>
              <span>{stats.onlineGeofenceRate}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.onlineGeofenceRate}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Offline (ESP32 Bluetooth)</span>
              <span>{stats.offlineEsp32Rate}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.offlineEsp32Rate}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
