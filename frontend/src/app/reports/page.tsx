'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!token || token === 'undefined' || token === 'null') {
      router.replace('/');
      return;
    }

    try {
      const user = userStr ? JSON.parse(userStr) : null;
      if (user?.role === 'FACULTY') {
        router.replace('/faculty/dashboard/reports');
      } else if (user?.role === 'ADMIN') {
        router.replace('/admin/dashboard/reports');
      } else {
        router.replace('/student/dashboard');
      }
    } catch {
      router.replace('/admin/dashboard/reports');
    }
  }, [router]);

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center text-dark">
      <div className="spinner-border text-primary me-2" role="status"></div>
      <span className="fw-semibold">Redirecting to Official Subject Attendance Register...</span>
    </div>
  );
}

