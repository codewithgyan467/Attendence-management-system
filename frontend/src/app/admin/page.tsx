'use client';

import { useState } from 'react';
import Link from 'next/link';

type Record = {
  id: string;
  student: string;
  status: string;
  method: string;
};

export default function AdminPanel() {
  const [records, setRecords] = useState<Record[]>([
    { id: '1', student: 'Gyan (AEC-045)', status: 'PRESENT', method: 'FACE_GPS' },
    { id: '2', student: 'Alice (AEC-012)', status: 'ABSENT', method: 'NONE' },
    { id: '3', student: 'Bob (AEC-099)', status: 'REJECTED (GPS)', method: 'FACE_GPS' },
  ]);

  const overrideStatus = (id: string, newStatus: string) => {
    setRecords(records.map(r => r.id === id ? { ...r, status: newStatus, method: 'MANUAL_OVERRIDE' } : r));
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Real-Time Monitor
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Admin Live Records</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Manual overrides & verification stream</p>
        </div>
        <Link 
          href="/admin/dashboard" 
          className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-center whitespace-nowrap"
        >
          Go to Full Dashboard →
        </Link>
      </div>

      <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Live Attendance Records</h2>
        
        <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                <th className="p-3.5 sm:p-4">Student</th>
                <th className="p-3.5 sm:p-4">Status</th>
                <th className="p-3.5 sm:p-4">Verification Method</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="p-3.5 sm:p-4 font-semibold text-white">
                    {r.student}
                  </td>
                  <td className="p-3.5 sm:p-4">
                    {r.status === 'PRESENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        PRESENT
                      </span>
                    ) : r.status === 'ABSENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        ABSENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {r.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs sm:text-sm text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {r.method}
                    </span>
                  </td>
                  <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                    <button 
                      onClick={() => overrideStatus(r.id, 'PRESENT')} 
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 mr-2 transition-colors"
                    >
                      Set Present
                    </button>
                    <button 
                      onClick={() => overrideStatus(r.id, 'ABSENT')} 
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                    >
                      Set Absent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
