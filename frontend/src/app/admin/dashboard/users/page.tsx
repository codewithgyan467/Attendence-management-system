'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Directory & Access Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage institutional student, faculty, and administrative accounts</p>
        </div>
      </div>

      {/* Main Content Panel */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Active Profiles ({users.length})</h2>
            <p className="text-xs sm:text-sm text-slate-400">Registered users in the institutional database</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>{showAddForm ? '✕ Close Form' : '+ Add New User'}</span>
          </button>
        </div>

        {/* Add User Form Drawer */}
        {showAddForm && (
          <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-indigo-400">👤</span> Register New User Profile
              </h3>
              <span className="text-xs text-slate-400">Creates institutional credential record</span>
            </div>
            <form 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end" 
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                try {
                  const formData = new FormData(e.currentTarget as HTMLFormElement);
                  const data = Object.fromEntries(formData.entries());
                  const token = localStorage.getItem('token');
                  const res = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(data)
                  });
                  if (res.ok) {
                    const newUser = await res.json();
                    setUsers([...users, newUser]);
                    (e.target as HTMLFormElement).reset();
                    setShowAddForm(false);
                  } else {
                    alert('Failed to create user. Please check email uniqueness.');
                  }
                } catch (err) {
                  alert('Error creating user profile');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">First Name</label>
                <input 
                  required 
                  name="firstName" 
                  placeholder="e.g. Rahul"
                  className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Last Name</label>
                <input 
                  required 
                  name="lastName" 
                  placeholder="e.g. Sharma"
                  className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  required 
                  type="email" 
                  name="email" 
                  placeholder="e.g. user@aec.edu"
                  className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">System Role</label>
                <select name="role" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15" required>
                  <option value="STUDENT" className="bg-slate-900 text-white">Student</option>
                  <option value="FACULTY" className="bg-slate-900 text-white">Faculty</option>
                  <option value="ADMIN" className="bg-slate-900 text-white">Admin</option>
                </select>
              </div>
              <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="py-2.5 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                >
                  {submitting ? 'Registering...' : 'Save User Profile'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Responsive Table */}
        <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                <th className="p-3.5 sm:p-4">Name</th>
                <th className="p-3.5 sm:p-4">Email</th>
                <th className="p-3.5 sm:p-4">Role</th>
                <th className="p-3.5 sm:p-4">Profile ID / Details</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="p-3.5 sm:p-4 font-semibold text-white">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-3.5 sm:p-4 font-mono text-xs sm:text-sm text-slate-300">
                    {u.email}
                  </td>
                  <td className="p-3.5 sm:p-4">
                    {u.role === 'ADMIN' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        ADMIN
                      </span>
                    )}
                    {u.role === 'FACULTY' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        FACULTY
                      </span>
                    )}
                    {u.role === 'STUDENT' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        STUDENT
                      </span>
                    )}
                    {!['ADMIN', 'FACULTY', 'STUDENT'].includes(u.role) && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 sm:p-4 text-xs sm:text-sm text-slate-300">
                    {u.studentProfile && (
                      <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Roll: {u.studentProfile.enrollmentNo}
                      </span>
                    )}
                    {u.facultyProfile && (
                      <span className="font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Emp ID: {u.facultyProfile.employeeId}
                      </span>
                    )}
                    {u.role === 'ADMIN' && (
                      <span className="text-slate-400 font-medium">
                        Root Superuser
                      </span>
                    )}
                    {!u.studentProfile && !u.facultyProfile && u.role !== 'ADMIN' && (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </td>
                  <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                    <button 
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 mr-2 transition-colors"
                      onClick={() => alert(`Edit user ${u.email} coming soon!`)}
                    >
                      Edit
                    </button>
                    <button 
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                      onClick={async () => {
                        if (confirm(`Delete user ${u.firstName} ${u.lastName} (${u.email})?`)) {
                          const token = localStorage.getItem('token');
                          await fetch(`${API_URL}/users/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                          setUsers(users.filter((user: any) => user.id !== u.id));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {loading ? 'Loading registered users...' : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
