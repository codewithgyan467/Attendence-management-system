'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center text-dark">
      <div className="spinner-border text-primary me-2" role="status"></div>
      <span className="fw-semibold">Redirecting to Admin Dashboard...</span>
    </div>
  );
}
