'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && token !== 'undefined' && token !== 'null') {
      router.replace('/student/dashboard');
    } else {
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center text-dark">
      <div className="spinner-border text-primary me-2" role="status"></div>
      <span className="fw-semibold">Redirecting to Student Portal...</span>
    </div>
  );
}

