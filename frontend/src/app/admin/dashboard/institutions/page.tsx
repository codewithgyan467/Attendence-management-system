'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function InstitutionsManagement() {
  const [activeTab, setActiveTab] = useState<'universities' | 'departments'>('universities');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddUniForm, setShowAddUniForm] = useState(false);
  const [showAddDeptForm, setShowAddDeptForm] = useState(false);

  // Filter
  const [selectedUniFilter, setSelectedUniFilter] = useState<string>('ALL');

  // Modals
  const [editingUni, setEditingUni] = useState<any | null>(null);
  const [editingDept, setEditingDept] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [instRes, deptRes] = await Promise.all([
        fetch(`${API_URL}/academic/institutions`, { headers }),
        fetch(`${API_URL}/academic/departments`, { headers })
      ]);

      if (instRes.ok) setInstitutions(await instRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (err) {
      console.error('Failed to load institutions and departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDepartments = departments.filter((dept: any) => {
    if (selectedUniFilter === 'ALL') return true;
    return dept.institutionId === selectedUniFilter || dept.institution === selectedUniFilter;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Global Multi-Tenant Academic Core
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Universities & Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Register new universities worldwide and configure degree departments (B.Tech, B.Sc, BCA, MCA, MBBS, etc.)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Registered Universities</div>
            <div className="font-mono font-bold text-sky-400 text-sm">{institutions.length} Campuses</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Academic Departments</div>
            <div className="font-mono font-bold text-indigo-400 text-sm">{departments.length} Programs</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-white/10 overflow-x-auto w-full sm:w-fit">
        <button 
          onClick={() => { setActiveTab('universities'); setShowAddUniForm(false); setShowAddDeptForm(false); }}
          className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'universities'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🏛️</span> Universities & Colleges ({institutions.length})
        </button>
        <button 
          onClick={() => { setActiveTab('departments'); setShowAddUniForm(false); setShowAddDeptForm(false); }}
          className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'departments'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🎓</span> Departments & Programs ({departments.length})
        </button>
      </div>

      {/* Content */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6">

        {/* ================= TAB 1: UNIVERSITIES ================= */}
        {activeTab === 'universities' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">University Institutions</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Configure university campuses, short codes, and central GPS geofencing
                </p>
              </div>
              <button 
                onClick={() => setShowAddUniForm(!showAddUniForm)}
                className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>{showAddUniForm ? '✕ Close Form' : '+ Register New University'}</span>
              </button>
            </div>

            {/* Add University Form */}
            {showAddUniForm && (
              <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">➕</span> Register University / College
                  </h3>
                  <span className="text-xs text-slate-400">Enter institution details & campus geofence</span>
                </div>
                <form 
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                      const formData = new FormData(e.currentTarget);
                      const data = Object.fromEntries(formData.entries());
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${API_URL}/academic/institutions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        const newUni = await res.json();
                        setInstitutions([...institutions, newUni]);
                        (e.target as HTMLFormElement).reset();
                        setShowAddUniForm(false);
                      } else {
                        alert('Failed to register university. Code or name may already exist.');
                      }
                    } catch (err) {
                      alert('Error creating institution');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">University / College Name</label>
                    <input 
                      required 
                      name="name" 
                      placeholder="e.g. Gauhati University" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Short Code (Acronym)</label>
                    <input 
                      required 
                      name="code" 
                      placeholder="e.g. GU, DU, AEC" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15 uppercase font-mono" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">City / Campus Town</label>
                    <input 
                      name="city" 
                      placeholder="e.g. Guwahati" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">State</label>
                    <input 
                      name="state" 
                      placeholder="e.g. Assam" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Campus Latitude</label>
                    <input 
                      type="number" 
                      step="any" 
                      name="latitude" 
                      placeholder="e.g. 26.1558" 
                      defaultValue="26.140537"
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15 font-mono" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Campus Longitude</label>
                    <input 
                      type="number" 
                      step="any" 
                      name="longitude" 
                      placeholder="e.g. 91.6608" 
                      defaultValue="91.656738"
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15 font-mono" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Allowed Radius (Meters)</label>
                    <input 
                      type="number" 
                      name="allowedRadiusMeters" 
                      defaultValue="500" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15 font-mono" 
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Campus Address</label>
                    <input 
                      name="address" 
                      placeholder="e.g. Gopinath Bordoloi Nagar, Jalukbari" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="py-2.5 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                    >
                      {submitting ? 'Registering...' : 'Save University'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Universities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {institutions.map((uni: any) => {
                const uniDepts = departments.filter((d) => d.institutionId === uni.id || d.institution === uni.name);
                return (
                  <div key={uni.id} className="rounded-2xl p-5 bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 transition-all space-y-4 shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {uni.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                          {uniDepts.length} Departments
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{uni.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{uni.address || `${uni.city || 'Campus'}, ${uni.state || 'State'}`}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Coordinates:</span>
                        <span className="font-mono text-sky-400 font-semibold">{uni.latitude?.toFixed(4)}, {uni.longitude?.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Radius Fence:</span>
                        <span className="font-mono text-emerald-400 font-semibold">{uni.allowedRadiusMeters || 500}m</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <button 
                        onClick={() => {
                          setSelectedUniFilter(uni.id);
                          setActiveTab('departments');
                        }}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        View Departments →
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setEditingUni(uni)}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30 hover:bg-sky-500/30 transition-colors"
                        >
                          ✎ Edit
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm(`Delete university ${uni.name}?`)) {
                              const token = localStorage.getItem('token');
                              await fetch(`${API_URL}/academic/institutions/${uni.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                              setInstitutions(institutions.filter((u: any) => u.id !== uni.id));
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {institutions.length === 0 && (
                <div className="col-span-full p-8 text-center text-slate-400">
                  {loading ? 'Loading registered universities...' : 'No universities registered yet. Click "+ Register New University" to add one.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: DEPARTMENTS ================= */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Academic Departments & Degree Programs</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Manage department streams (e.g. B.Tech Computer Science, B.Sc, BCA, MCA) per university
                </p>
              </div>
              <button 
                onClick={() => setShowAddDeptForm(!showAddDeptForm)}
                className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>{showAddDeptForm ? '✕ Close Form' : '+ Add Department / Program'}</span>
              </button>
            </div>

            {/* University Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">University Filter:</span>
              <button 
                onClick={() => setSelectedUniFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedUniFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                All Institutions ({departments.length})
              </button>
              {institutions.map((uni: any) => (
                <button 
                  key={uni.id}
                  onClick={() => setSelectedUniFilter(uni.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedUniFilter === uni.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {uni.name} ({uni.code})
                </button>
              ))}
            </div>

            {/* Add Department Form */}
            {showAddDeptForm && (
              <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">➕</span> Add New Academic Department / Degree Program
                  </h3>
                  <span className="text-xs text-slate-400">Assign to parent university</span>
                </div>
                <form 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                      const formData = new FormData(e.currentTarget);
                      const uniId = formData.get('institutionId') as string;
                      const name = formData.get('name') as string;
                      const selectedUni = institutions.find(u => u.id === uniId);

                      const token = localStorage.getItem('token');
                      const res = await fetch(`${API_URL}/academic/departments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          name,
                          institutionId: uniId,
                          institution: selectedUni ? selectedUni.name : 'Assam Engineering College'
                        })
                      });
                      if (res.ok) {
                        const newDept = await res.json();
                        setDepartments([...departments, newDept]);
                        (e.target as HTMLFormElement).reset();
                        setShowAddDeptForm(false);
                      } else {
                        alert('Failed to create department.');
                      }
                    } catch (err) {
                      alert('Error creating department');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Parent University / College</label>
                    <select required name="institutionId" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="" className="bg-slate-900 text-slate-300">Select University</option>
                      {institutions.map((u: any) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white">{u.name} ({u.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Department / Program Name</label>
                    <input 
                      required 
                      name="name" 
                      placeholder="e.g. B.Tech Computer Science, B.Sc IT, BCA, MCA" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="py-2.5 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                    >
                      {submitting ? 'Saving...' : 'Save Department'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Departments Table */}
            <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3.5 sm:p-4">Department / Program</th>
                    <th className="p-3.5 sm:p-4">Parent University</th>
                    <th className="p-3.5 sm:p-4">Subjects</th>
                    <th className="p-3.5 sm:p-4">Classrooms</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredDepartments.map((dept: any) => {
                    const matchedUni = institutions.find(u => u.id === dept.institutionId || u.name === dept.institution);
                    return (
                      <tr key={dept.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-white">
                          <div>{dept.name}</div>
                          <span className="text-[11px] font-mono text-slate-500">{dept.id}</span>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                            {matchedUni ? `${matchedUni.name} (${matchedUni.code})` : dept.institution}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono text-slate-300">
                          {dept.subjects?.length || 0} Subjects
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono text-slate-300">
                          {dept.classrooms?.length || 0} Rooms
                        </td>
                        <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                          <button 
                            onClick={() => setEditingDept(dept)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 mr-2 transition-colors cursor-pointer"
                          >
                            ✎ Edit
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm(`Delete department ${dept.name}?`)) {
                                const token = localStorage.getItem('token');
                                await fetch(`${API_URL}/academic/departments/${dept.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                setDepartments(departments.filter((d: any) => d.id !== dept.id));
                              }
                            }}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDepartments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {loading ? 'Loading departments...' : 'No departments found for this university. Click "+ Add Department / Program" to create one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ================= EDIT UNIVERSITY MODAL ================= */}
      {editingUni && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✎</span> Edit University Campus
              </h3>
              <button onClick={() => setEditingUni(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/academic/institutions/${editingUni.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                const updated = await res.json();
                setInstitutions(institutions.map(u => u.id === updated.id ? updated : u));
                setEditingUni(null);
              } else {
                alert('Failed to update university');
              }
              setSubmitting(false);
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">University Name</label>
                  <input type="text" name="name" defaultValue={editingUni.name} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Code</label>
                  <input type="text" name="code" defaultValue={editingUni.code} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Latitude</label>
                  <input type="number" step="any" name="latitude" defaultValue={editingUni.latitude} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Longitude</label>
                  <input type="number" step="any" name="longitude" defaultValue={editingUni.longitude} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Radius (m)</label>
                  <input type="number" name="allowedRadiusMeters" defaultValue={editingUni.allowedRadiusMeters || 500} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Address</label>
                <input type="text" name="address" defaultValue={editingUni.address || ''} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">City</label>
                  <input type="text" name="city" defaultValue={editingUni.city || ''} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">State</label>
                  <input type="text" name="state" defaultValue={editingUni.state || ''} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingUni(null)} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Save University</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT DEPARTMENT MODAL ================= */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✎</span> Edit Academic Department
              </h3>
              <button onClick={() => setEditingDept(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const uniId = formData.get('institutionId') as string;
              const selectedUni = institutions.find(u => u.id === uniId);

              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/academic/departments/${editingDept.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  name,
                  institutionId: uniId,
                  institution: selectedUni ? selectedUni.name : editingDept.institution
                })
              });
              if (res.ok) {
                const updated = await res.json();
                setDepartments(departments.map(d => d.id === updated.id ? updated : d));
                setEditingDept(null);
              } else {
                alert('Failed to update department');
              }
              setSubmitting(false);
            }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Parent University</label>
                <select name="institutionId" defaultValue={editingDept.institutionId || ''} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                  {institutions.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Department / Program Name</label>
                <input type="text" name="name" defaultValue={editingDept.name} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingDept(null)} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
