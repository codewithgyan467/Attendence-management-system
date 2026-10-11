'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function TimetableManagement() {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'terms' | 'timetable'>('syllabus');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [editingTerm, setEditingTerm] = useState<any | null>(null);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [subRes, termsRes, ttRes, secRes, clsRes] = await Promise.all([
          fetch(`${API_URL}/academic/subjects`, { headers }),
          fetch(`${API_URL}/academic/terms`, { headers }),
          fetch(`${API_URL}/academic/timetable`, { headers }),
          fetch(`${API_URL}/academic/sections`, { headers }),
          fetch(`${API_URL}/academic/classrooms`, { headers }),
        ]);

        if (subRes.ok) setSubjects(await subRes.json());
        if (termsRes.ok) setTerms(await termsRes.json());
        if (ttRes.ok) setTimetable(await ttRes.json());
        if (secRes.ok) setSections(await secRes.json());
        if (clsRes.ok) setClassrooms(await clsRes.json());
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Curriculum & Schedules
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Academic Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Configure subjects, academic calendars, and weekly classroom timetables</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-white/10 overflow-x-auto w-full sm:w-fit">
        <button 
          onClick={() => { setActiveTab('syllabus'); setShowAddForm(false); }}
          className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'syllabus'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>📚</span> Syllabus & Subjects
        </button>
        <button 
          onClick={() => { setActiveTab('terms'); setShowAddForm(false); }}
          className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'terms'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🗓️</span> Academic Terms
        </button>
        <button 
          onClick={() => { setActiveTab('timetable'); setShowAddForm(false); }}
          className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'timetable'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>⏰</span> Timetable Records
        </button>
      </div>

      {/* Content Container */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6">
        
        {/* ===================== TAB 1: SYLLABUS & SUBJECTS ===================== */}
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Subject Catalog</h2>
                <p className="text-xs sm:text-sm text-slate-400">{subjects.length} registered academic subjects</p>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Add Subject'}</span>
              </button>
            </div>

            {/* Add Subject Drawer / Form */}
            {showAddForm && (
              <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">➕</span> Add New Subject
                  </h3>
                  <span className="text-xs text-slate-400">Enter code and description</span>
                </div>
                <form 
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                      const formData = new FormData(e.currentTarget as HTMLFormElement);
                      const data = Object.fromEntries(formData.entries());
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${API_URL}/academic/subjects`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        const newSub = await res.json();
                        setSubjects([...subjects, newSub]);
                        (e.target as HTMLFormElement).reset();
                        setShowAddForm(false);
                      } else {
                        alert('Failed to create subject. Please check inputs.');
                      }
                    } catch (err) {
                      alert('Error creating subject');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Subject Code</label>
                    <input 
                      required 
                      name="code" 
                      placeholder="e.g. CS-301" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Subject Name</label>
                    <input 
                      required 
                      name="name" 
                      placeholder="e.g. Data Structures & Algorithms" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>
                  <div>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                    >
                      {submitting ? 'Saving...' : 'Save Subject'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3.5 sm:p-4">Code</th>
                    <th className="p-3.5 sm:p-4">Subject Name</th>
                    <th className="p-3.5 sm:p-4">Department</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {subjects.map((subject: any) => (
                    <tr key={subject.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-3.5 sm:p-4 font-mono font-bold text-indigo-300 text-xs sm:text-sm">
                        <span className="px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                          {subject.code}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 font-medium text-white">
                        {subject.name}
                      </td>
                      <td className="p-3.5 sm:p-4 text-slate-300">
                        {subject.department?.name || 'Computer Science / Engineering'}
                      </td>
                      <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                        <button 
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 mr-2 transition-colors cursor-pointer"
                          onClick={() => setEditingSubject(subject)}
                        >
                          ✎ Edit
                        </button>
                        <button 
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                          onClick={async () => {
                            if (confirm(`Delete subject ${subject.code} (${subject.name})?`)) {
                              const token = localStorage.getItem('token');
                              await fetch(`${API_URL}/academic/subjects/${subject.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                              setSubjects(subjects.filter((s: any) => s.id !== subject.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        {loading ? 'Loading registered subjects...' : 'No subjects found. Click "+ Add Subject" to register one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: ACADEMIC TERMS ===================== */}
        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Academic Terms & Semesters</h2>
                <p className="text-xs sm:text-sm text-slate-400">{terms.length} academic periods configured</p>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Add Term'}</span>
              </button>
            </div>

            {/* Add Term Form */}
            {showAddForm && (
              <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">➕</span> Add New Academic Term
                  </h3>
                  <span className="text-xs text-slate-400">Semester dates & active flag</span>
                </div>
                <form 
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                      const formData = new FormData(e.currentTarget as HTMLFormElement);
                      const data: any = Object.fromEntries(formData.entries());
                      data.year = Number(data.year);
                      data.isCurrent = formData.get('isCurrent') === 'on';
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${API_URL}/academic/terms`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        const newTerm = await res.json();
                        setTerms([...terms, newTerm]);
                        (e.target as HTMLFormElement).reset();
                        setShowAddForm(false);
                      } else {
                        alert('Failed to create academic term');
                      }
                    } catch (err) {
                      alert('Error creating term');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Term Name</label>
                    <input 
                      required 
                      name="name" 
                      placeholder="e.g. Autumn Semester 2026" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Year</label>
                    <input 
                      required 
                      type="number" 
                      name="year" 
                      defaultValue={2026} 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input 
                      required 
                      type="date" 
                      name="startDate" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">End Date</label>
                    <input 
                      required 
                      type="date" 
                      name="endDate" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2 md:col-span-2">
                    <input 
                      type="checkbox" 
                      id="isCurrent"
                      name="isCurrent" 
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20 focus:ring-0" 
                    />
                    <label htmlFor="isCurrent" className="text-xs font-medium text-slate-300 cursor-pointer">Set as Current Active Term</label>
                  </div>
                  <div className="md:col-span-3">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                    >
                      {submitting ? 'Saving...' : 'Save Academic Term'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3.5 sm:p-4">Term Name</th>
                    <th className="p-3.5 sm:p-4">Academic Year</th>
                    <th className="p-3.5 sm:p-4">Status</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {terms.map((term: any) => (
                    <tr key={term.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-white text-xs sm:text-sm">
                        {term.name}
                      </td>
                      <td className="p-3.5 sm:p-4 font-mono text-slate-300">
                        {term.year}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        {term.isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                        <button 
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 mr-2 transition-colors cursor-pointer"
                          onClick={() => setEditingTerm(term)}
                        >
                          ✎ Edit
                        </button>
                        <button 
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                          onClick={async () => {
                            if (confirm(`Delete academic term ${term.name}?`)) {
                              const token = localStorage.getItem('token');
                              await fetch(`${API_URL}/academic/terms/${term.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                              setTerms(terms.filter((t: any) => t.id !== term.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {terms.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        {loading ? 'Loading academic terms...' : 'No terms configured. Click "+ Add Term" to create one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: TIMETABLE RECORDS ===================== */}
        {activeTab === 'timetable' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Timetable Schedule Slots</h2>
                <p className="text-xs sm:text-sm text-slate-400">{timetable.length} assigned classroom timetable slots</p>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Add Slot'}</span>
              </button>
            </div>

            {/* Add Timetable Slot Form */}
            {showAddForm && (
              <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">➕</span> Schedule New Timetable Slot
                  </h3>
                  <span className="text-xs text-slate-400">Select section, classroom, day and time</span>
                </div>
                <form 
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                      const formData = new FormData(e.currentTarget as HTMLFormElement);
                      const data: any = Object.fromEntries(formData.entries());
                      data.dayOfWeek = Number(data.dayOfWeek);
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${API_URL}/academic/timetable`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        const newSlot = await res.json();
                        const completeSlot = {
                          ...newSlot,
                          academicTerm: terms.find((t: any) => t.id === newSlot.academicTermId),
                          section: sections.find((s: any) => s.id === newSlot.sectionId),
                          classroom: classrooms.find((c: any) => c.id === newSlot.classroomId)
                        };
                        setTimetable([...timetable, completeSlot]);
                        (e.target as HTMLFormElement).reset();
                        setShowAddForm(false);
                      } else {
                        alert('Failed to schedule timetable slot. Check parameters.');
                      }
                    } catch (err) {
                      alert('Error scheduling slot');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Academic Term</label>
                    <select required name="academicTermId" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="" className="bg-slate-900 text-slate-300">Select Term</option>
                      {terms.map((t: any) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Section / Subject</label>
                    <select required name="sectionId" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="" className="bg-slate-900 text-slate-300">Select Section</option>
                      {sections.map((s: any) => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                          {s.name} - {s.subject?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Classroom</label>
                    <select required name="classroomId" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="" className="bg-slate-900 text-slate-300">Select Classroom</option>
                      {classrooms.map((c: any) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Day of Week</label>
                    <select required name="dayOfWeek" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="1" className="bg-slate-900 text-white">Monday</option>
                      <option value="2" className="bg-slate-900 text-white">Tuesday</option>
                      <option value="3" className="bg-slate-900 text-white">Wednesday</option>
                      <option value="4" className="bg-slate-900 text-white">Thursday</option>
                      <option value="5" className="bg-slate-900 text-white">Friday</option>
                      <option value="6" className="bg-slate-900 text-white">Saturday</option>
                      <option value="0" className="bg-slate-900 text-white">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Start Time</label>
                    <input required type="time" name="startTime" className="glass-input rounded-xl px-4 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">End Time</label>
                    <input required type="time" name="endTime" className="glass-input rounded-xl px-4 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Session Type</label>
                    <select required name="subjectType" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="Theory" className="bg-slate-900 text-white">Theory</option>
                      <option value="Lab" className="bg-slate-900 text-white">Lab</option>
                      <option value="Tutorial" className="bg-slate-900 text-white">Tutorial</option>
                    </select>
                  </div>

                  <div>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                    >
                      {submitting ? 'Scheduling...' : 'Save Slot'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3.5 sm:p-4">Day</th>
                    <th className="p-3.5 sm:p-4">Timing</th>
                    <th className="p-3.5 sm:p-4">Term & Section</th>
                    <th className="p-3.5 sm:p-4">Subject & Type</th>
                    <th className="p-3.5 sm:p-4">Classroom</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {timetable.map((tt: any) => {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return (
                      <tr key={tt.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                            {days[tt.dayOfWeek]}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono font-medium text-white text-xs sm:text-sm">
                          {tt.startTime} - {tt.endTime}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <div className="font-semibold text-white">{tt.academicTerm?.name?.split(' (')[0]}</div>
                          <div className="text-xs text-indigo-300 font-medium">{tt.section?.name}</div>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <div className="font-semibold text-white">{tt.section?.subject?.name}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {tt.subjectType}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-slate-300 font-medium">
                          {tt.classroom?.name}
                        </td>
                        <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                          <button 
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 mr-2 transition-colors cursor-pointer"
                            onClick={() => setEditingSlot(tt)}
                          >
                            ✎ Edit
                          </button>
                          <button 
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                            onClick={async () => {
                              if (confirm(`Delete slot ${tt.subjectType} - ${tt.startTime}?`)) {
                                const token = localStorage.getItem('token');
                                await fetch(`${API_URL}/academic/timetable/${tt.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                setTimetable(timetable.filter((t: any) => t.id !== tt.id));
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {timetable.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {loading ? 'Loading timetable records...' : 'No timetable slots scheduled yet. Click "+ Add Slot" to create one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ================= EDIT SUBJECT MODAL ================= */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✎</span> Edit Subject Curriculum
              </h3>
              <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/academic/subjects/${editingSubject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                const updated = await res.json();
                setSubjects(subjects.map((s) => s.id === updated.id ? updated : s));
                setEditingSubject(null);
              } else {
                alert('Failed to update subject');
              }
              setSubmitting(false);
            }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Code</label>
                <input type="text" name="code" defaultValue={editingSubject.code} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Name</label>
                <input type="text" name="name" defaultValue={editingSubject.name} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingSubject(null)} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TERM MODAL ================= */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✎</span> Edit Academic Term
              </h3>
              <button onClick={() => setEditingTerm(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/academic/terms/${editingTerm.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                const updated = await res.json();
                setTerms(terms.map((t) => t.id === updated.id ? updated : t));
                setEditingTerm(null);
              } else {
                alert('Failed to update term');
              }
              setSubmitting(false);
            }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Term Name</label>
                <input type="text" name="name" defaultValue={editingTerm.name} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Year</label>
                  <input type="number" name="year" defaultValue={editingTerm.year} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" name="isCurrent" id="editIsCurrent" defaultChecked={editingTerm.isCurrent} className="rounded" />
                  <label htmlFor="editIsCurrent" className="text-xs text-slate-300">Active Term</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
                  <input type="date" name="startDate" defaultValue={editingTerm.startDate ? new Date(editingTerm.startDate).toISOString().split('T')[0] : ''} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Date</label>
                  <input type="date" name="endDate" defaultValue={editingTerm.endDate ? new Date(editingTerm.endDate).toISOString().split('T')[0] : ''} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingTerm(null)} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Save Term</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TIMETABLE SLOT MODAL ================= */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✎</span> Edit Timetable Class Slot
              </h3>
              <button onClick={() => setEditingSlot(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/academic/timetable/${editingSlot.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                // Refresh timetable
                const ttRes = await fetch(`${API_URL}/academic/timetable`, { headers: { Authorization: `Bearer ${token}` } });
                if (ttRes.ok) setTimetable(await ttRes.json());
                setEditingSlot(null);
              } else {
                alert('Failed to update timetable slot');
              }
              setSubmitting(false);
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Day of Week</label>
                  <select name="dayOfWeek" defaultValue={editingSlot.dayOfWeek} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Class Type</label>
                  <select name="subjectType" defaultValue={editingSlot.subjectType} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                    <option value="THEORY">Theory</option>
                    <option value="LAB">Lab</option>
                    <option value="PRACTICAL">Practical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time</label>
                  <input type="text" name="startTime" defaultValue={editingSlot.startTime} placeholder="HH:MM" required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Time</label>
                  <input type="text" name="endTime" defaultValue={editingSlot.endTime} placeholder="HH:MM" required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Section</label>
                  <select name="sectionId" defaultValue={editingSlot.sectionId} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.subject?.name} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Classroom</label>
                  <select name="classroomId" defaultValue={editingSlot.classroomId} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingSlot(null)} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
