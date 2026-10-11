'use client';

import { useState } from 'react';

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
    <div className="p-8 max-w-6xl mx-auto">
      <header className="border-b-8 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold uppercase tracking-tighter">Admin Panel</h1>
          <p className="text-xl font-bold mt-2 bg-black text-white inline-block px-2 border-2 border-black">Master Control</p>
        </div>
      </header>

      <div className="brutal-card mb-8">
        <h2 className="text-3xl font-extrabold uppercase mb-6 bg-[#ffe600] inline-block px-4 py-1 border-4 border-black">Live Attendance Records</h2>
        
        <table className="w-full text-left border-collapse border-4 border-black font-bold">
          <thead>
            <tr className="bg-black text-white">
              <th className="p-4 border-2 border-black uppercase">Student</th>
              <th className="p-4 border-2 border-black uppercase">Status</th>
              <th className="p-4 border-2 border-black uppercase">Method</th>
              <th className="p-4 border-2 border-black uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b-4 border-black hover:bg-slate-100">
                <td className="p-4 border-r-4 border-black text-xl">{r.student}</td>
                <td className={`p-4 border-r-4 border-black text-xl ${r.status === 'PRESENT' ? 'text-green-600' : 'text-red-600'}`}>{r.status}</td>
                <td className="p-4 border-r-4 border-black">{r.method}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => overrideStatus(r.id, 'PRESENT')} className="brutal-btn py-2 px-4 text-sm bg-green-400 hover:bg-green-500">
                    SET PRESENT
                  </button>
                  <button onClick={() => overrideStatus(r.id, 'ABSENT')} className="brutal-btn py-2 px-4 text-sm bg-red-400 hover:bg-red-500 text-white hover:text-white">
                    SET ABSENT
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
