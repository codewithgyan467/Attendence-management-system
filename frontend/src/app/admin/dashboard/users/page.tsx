'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleTab, setRoleTab] = useState<'ALL' | 'STUDENT' | 'FACULTY' | 'ADMIN'>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<number | 'ALL' | 'GRADUATED'>('ALL');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  
  // Promotion modal state
  const [promoteMode, setPromoteMode] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [fromSem, setFromSem] = useState(1);
  const [toSem, setToSem] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter calculations
  const totalStudents = users.filter((u) => u.role === 'STUDENT');
  const totalFaculty = users.filter((u) => u.role === 'FACULTY');
  const totalAdmins = users.filter((u) => u.role === 'ADMIN');

  const filteredUsers = users.filter((u) => {
    // 1. Role filter
    if (roleTab !== 'ALL' && u.role !== roleTab) return false;

    // 2. Semester filter (when viewing students)
    if (roleTab === 'STUDENT' && semesterFilter !== 'ALL') {
      if (semesterFilter === 'GRADUATED') {
        if (u.studentProfile?.status !== 'GRADUATED') return false;
      } else {
        if (u.studentProfile?.semester !== semesterFilter || u.studentProfile?.status === 'GRADUATED') {
          return false;
        }
      }
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const roll = (u.studentProfile?.enrollmentNo || '').toLowerCase();
      const empId = (u.facultyProfile?.employeeId || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || roll.includes(q) || empId.includes(q);
    }

    return true;
  });

  // Handle Edit User Submit
  const handleUpdateUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update user profile');
      }

      setFeedback({ type: 'success', text: `User ${data.firstName} updated successfully!` });
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error updating user' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create User Submit
  const handleCreateUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create user. Ensure email is unique.');
      }

      setFeedback({ type: 'success', text: 'New user registered successfully!' });
      setShowAddModal(false);
      await fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error creating user' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Semester Promotion Submit
  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem('token');
      const payload = promoteMode === 'ALL'
        ? { mode: 'ALL' }
        : { mode: 'SPECIFIC', fromSemester: fromSem, toSemester: toSem };

      const res = await fetch(`${API_URL}/users/promote-semester`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Promotion engine failed');

      setFeedback({ type: 'success', text: data.message });
      setShowPromoteModal(false);
      await fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to promote students' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName} (${user.email})? This action is permanent.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== user.id));
        setFeedback({ type: 'success', text: `Deleted user ${user.firstName} ${user.lastName} successfully!` });
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', text: err.message || 'Failed to delete user profile from database' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Failed to delete user profile' });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Notifications */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-lg ${
          feedback.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <span>{feedback.type === 'success' ? '✓ ' : '✕ '} {feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-xs hover:underline ml-4 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Institutional User Directory & Progression
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage students across Semester 1–6, faculty assignments, and automated cohort promotions
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPromoteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
          >
            <span>🎓</span> Semester Progression Engine
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <span>+</span> Add New User
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6">
        {/* Navigation Tabs by Role */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => { setRoleTab('ALL'); setSemesterFilter('ALL'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              roleTab === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            👥 All Profiles ({users.length})
          </button>
          <button
            onClick={() => setRoleTab('STUDENT')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              roleTab === 'STUDENT'
                ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🎓 Students ({totalStudents.length})
          </button>
          <button
            onClick={() => { setRoleTab('FACULTY'); setSemesterFilter('ALL'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              roleTab === 'FACULTY'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            👨‍🏫 Faculty ({totalFaculty.length})
          </button>
          <button
            onClick={() => { setRoleTab('ADMIN'); setSemesterFilter('ALL'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              roleTab === 'ADMIN'
                ? 'bg-rose-500 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🛡️ Admins ({totalAdmins.length})
          </button>
        </div>

        {/* Semester Sub-Filter Pills (Active when viewing Students) */}
        {roleTab === 'STUDENT' && (
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-sky-500/20 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-sky-300 uppercase px-2">Cohort / Semester:</span>
            <button
              onClick={() => setSemesterFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                semesterFilter === 'ALL'
                  ? 'bg-sky-400 text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              All Semesters ({totalStudents.length})
            </button>
            {[1, 2, 3, 4, 5, 6].map((sem) => {
              const count = totalStudents.filter((s) => s.studentProfile?.semester === sem && s.studentProfile?.status !== 'GRADUATED').length;
              return (
                <button
                  key={sem}
                  onClick={() => setSemesterFilter(sem)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    semesterFilter === sem
                      ? 'bg-sky-400 text-slate-950 font-bold'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Sem {sem} ({count})
                </button>
              );
            })}
            <button
              onClick={() => setSemesterFilter('GRADUATED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                semesterFilter === 'GRADUATED'
                  ? 'bg-emerald-400 text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Alumni / Graduated ({totalStudents.filter((s) => s.studentProfile?.status === 'GRADUATED').length})
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search by student name, email, phone number, enrollment ID, or faculty ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                <th className="p-3.5 sm:p-4">User Identity</th>
                <th className="p-3.5 sm:p-4">Contact Info</th>
                <th className="p-3.5 sm:p-4">Role & Status</th>
                <th className="p-3.5 sm:p-4">Academic Details</th>
                <th className="p-3.5 sm:p-4 text-center">Biometrics</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredUsers.map((u: any) => {
                const hasFace = !!u.studentProfile?.faceProfile;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                    {/* User Identity */}
                    <td className="p-3.5 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
                          {u.studentProfile?.faceProfile?.imageUrl ? (
                            <img src={u.studentProfile.faceProfile.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{u.firstName?.[0] || 'U'}{u.lastName?.[0] || ''}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: {u.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="p-3.5 sm:p-4">
                      <div className="text-xs sm:text-sm text-slate-200 font-mono">{u.email}</div>
                      {u.phone ? (
                        <div className="text-xs text-slate-400 mt-0.5">{u.phone}</div>
                      ) : (
                        <div className="text-[11px] text-slate-600 italic">No phone</div>
                      )}
                    </td>

                    {/* Role & Status */}
                    <td className="p-3.5 sm:p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {u.role === 'ADMIN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            🛡️ ADMIN
                          </span>
                        )}
                        {u.role === 'FACULTY' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            👨‍🏫 FACULTY
                          </span>
                        )}
                        {u.role === 'STUDENT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            🎓 STUDENT
                          </span>
                        )}
                        {u.studentProfile?.status === 'GRADUATED' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ALUMNI / GRADUATED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Academic Details */}
                    <td className="p-3.5 sm:p-4 text-xs sm:text-sm text-slate-300">
                      {u.studentProfile && (
                        <div className="space-y-1">
                          <div className="font-mono text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded inline-block border border-sky-500/20 text-xs">
                            Roll: {u.studentProfile.enrollmentNo}
                          </div>
                          <div className="text-xs font-semibold text-indigo-300">
                            Semester {u.studentProfile.semester}
                          </div>
                        </div>
                      )}
                      {u.facultyProfile && (
                        <div className="space-y-1">
                          <div className="font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded inline-block border border-amber-500/20 text-xs">
                            Emp ID: {u.facultyProfile.employeeId}
                          </div>
                          <div className="text-xs text-slate-400">Dept: Computer Applications</div>
                        </div>
                      )}
                      {u.role === 'ADMIN' && (
                        <span className="text-slate-400 font-medium text-xs">Super Admin Authority</span>
                      )}
                    </td>

                    {/* Biometrics Status */}
                    <td className="p-3.5 sm:p-4 text-center">
                      {u.role === 'STUDENT' ? (
                        hasFace ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ Enrolled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⚠️ Missing
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 mr-2 transition-colors cursor-pointer"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        ✕ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                        Loading institutional directory...
                      </div>
                    ) : (
                      'No profiles match the selected filters or search query.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= EDIT USER MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>✎</span> Edit User Profile
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Editing credentials and academic records for {editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={editingUser.firstName}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={editingUser.lastName}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Institutional Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser.email}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingUser.phone || ''}
                    placeholder="+91..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">System Role</label>
                  <select
                    name="role"
                    defaultValue={editingUser.role}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="FACULTY">FACULTY</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Reset Password (Optional)</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Leave blank to preserve current"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Student Specific Fields */}
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 space-y-3">
                <span className="text-[11px] font-bold text-sky-300 uppercase block">Student Academic Details</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Enrollment / Roll No</label>
                    <input
                      type="text"
                      name="enrollmentNo"
                      defaultValue={editingUser.studentProfile?.enrollmentNo || ''}
                      placeholder="e.g. AEC-MCA-2026-001"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Current Semester</label>
                    <select
                      name="semester"
                      defaultValue={editingUser.studentProfile?.semester || 1}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white text-xs"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Enrollment Status</label>
                    <select
                      name="status"
                      defaultValue={editingUser.studentProfile?.status || 'ACTIVE'}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white text-xs"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="GRADUATED">GRADUATED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Faculty Specific Fields */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 space-y-2">
                <span className="text-[11px] font-bold text-amber-300 uppercase block">Faculty Details</span>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    defaultValue={editingUser.facultyProfile?.employeeId || ''}
                    placeholder="e.g. FAC-MCA-001"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Saving Changes...' : 'Save & Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SEMESTER PROGRESSION MODAL ================= */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-purple-500/40 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎓</span> Institutional Semester Progression Engine
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated semester rollover & cohort promotion tool</p>
              </div>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Visual Workflow */}
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-purple-300">Automated Progression Hierarchy:</span>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <span className="bg-purple-500/20 px-2 py-0.5 rounded">Sem 1 ➔ Sem 2</span>
                <span>➔</span>
                <span className="bg-purple-500/20 px-2 py-0.5 rounded">Sem 2 ➔ Sem 3</span>
                <span>➔</span>
                <span className="bg-purple-500/20 px-2 py-0.5 rounded">Sem 3 ➔ Sem 4</span>
                <span>➔</span>
                <span className="bg-purple-500/20 px-2 py-0.5 rounded">Sem 4 ➔ Sem 5</span>
                <span>➔</span>
                <span className="bg-purple-500/20 px-2 py-0.5 rounded">Sem 5 ➔ Sem 6</span>
                <span>➔</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Sem 6 ➔ Graduated</span>
              </div>
            </div>

            <form onSubmit={handlePromoteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Progression Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPromoteMode('ALL')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      promoteMode === 'ALL'
                        ? 'bg-purple-600/20 border-purple-400 text-white shadow-lg'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">🚀 Bulk Semester Rollover</div>
                    <div className="text-[11px] text-slate-400 mt-1">Advances all active students to their next semester simultaneously.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoteMode('SPECIFIC')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      promoteMode === 'SPECIFIC'
                        ? 'bg-purple-600/20 border-purple-400 text-white shadow-lg'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">🎯 Single Cohort Promotion</div>
                    <div className="text-[11px] text-slate-400 mt-1">Promotes only students of a specific chosen semester.</div>
                  </button>
                </div>
              </div>

              {promoteMode === 'SPECIFIC' && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/15 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">From Semester</label>
                    <select
                      value={fromSem}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFromSem(val);
                        setToSem(val + 1);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                    >
                      {[1, 2, 3, 4, 5, 6].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">To Target Semester</label>
                    <select
                      value={toSem}
                      onChange={(e) => setToSem(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                    >
                      {[2, 3, 4, 5, 6, 7].map((s) => (
                        <option key={s} value={s}>{s > 6 ? 'Graduated / Alumni' : `Semester ${s}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                ⚠️ <strong>Institutional Notice:</strong> This operation updates student enrollment records in the database and creates an immutable audit trail entry.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Processing Rollover...' : 'Execute Semester Progression'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD USER MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-indigo-500/30 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>👤</span> Register New User Profile
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Creates a new institutional credential record in the database</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="e.g. John"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    placeholder="e.g. Doe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="user@university.edu"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Initial Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    defaultValue="Aec@123"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Role</label>
                  <select
                    name="role"
                    defaultValue="STUDENT"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="FACULTY">FACULTY</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Semester (If Student)</label>
                  <select
                    name="semester"
                    defaultValue="1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Roll / Enrollment No (Student)</label>
                  <input
                    type="text"
                    name="enrollmentNo"
                    placeholder="e.g. AEC-MCA-2026-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Employee ID (Faculty)</label>
                  <input
                    type="text"
                    name="employeeId"
                    placeholder="e.g. FAC-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Creating Profile...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
