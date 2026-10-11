'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
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
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-8 font-mono pb-12">
      <header className="border-4 border-black p-6 bg-[#00ffcc] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black uppercase tracking-tighter">User Management</h1>
        <p className="text-xl font-bold mt-2 bg-black text-white inline-block px-2 py-1">ALL REGISTERED PROFILES</p>
      </header>

      <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-6">
          <h2 className="text-2xl font-black uppercase">Users List ({users.length})</h2>
          <button className="bg-[#ff9900] border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-none">
            + NEW USER
          </button>
        </div>

        <table className="w-full text-left border-collapse border-2 border-black">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-3 border-2 border-black">NAME</th>
              <th className="p-3 border-2 border-black">EMAIL</th>
              <th className="p-3 border-2 border-black">ROLE</th>
              <th className="p-3 border-2 border-black">DETAILS</th>
              <th className="p-3 border-2 border-black">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-100">
                <td className="p-3 border-2 border-black font-bold">{u.firstName} {u.lastName}</td>
                <td className="p-3 border-2 border-black text-sm">{u.email}</td>
                <td className="p-3 border-2 border-black font-black uppercase">{u.role}</td>
                <td className="p-3 border-2 border-black text-sm">
                  {u.studentProfile && `Enrollment: ${u.studentProfile.enrollmentNo}`}
                  {u.facultyProfile && `Emp ID: ${u.facultyProfile.employeeId}`}
                  {u.role === 'ADMIN' && 'System Access'}
                </td>
                <td className="p-3 border-2 border-black">
                  <button className="text-xs bg-black text-white px-2 py-1 mr-2" onClick={() => alert('Edit feature coming soon!')}>EDIT</button>
                  <button className="text-xs bg-[#ff3366] text-white px-2 py-1" onClick={async () => {
                    if (confirm(`Delete ${u.firstName} ${u.lastName}?`)) {
                      const token = localStorage.getItem('token');
                      await fetch(`${API_URL}/users/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                      setUsers(users.filter((user: any) => user.id !== u.id));
                    }
                  }}>DEL</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center font-bold border-2 border-black">LOADING USERS...</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Basic Add User Form */}
        <div className="mt-8 border-4 border-black p-6 bg-gray-100">
          <h3 className="text-xl font-black mb-4">ADD NEW USER</h3>
          <form className="flex gap-4 items-end flex-wrap" onSubmit={async (e) => {
            e.preventDefault();
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
            } else {
              alert('Failed to create user');
            }
          }}>
            <div><label className="block text-xs font-bold">First Name</label><input required name="firstName" className="border-2 border-black p-2" /></div>
            <div><label className="block text-xs font-bold">Last Name</label><input required name="lastName" className="border-2 border-black p-2" /></div>
            <div><label className="block text-xs font-bold">Email</label><input required type="email" name="email" className="border-2 border-black p-2" /></div>
            <div>
              <label className="block text-xs font-bold">Role</label>
              <select name="role" className="border-2 border-black p-2" required>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button type="submit" className="bg-[#ff9900] border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ADD USER
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
