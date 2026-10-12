'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FacultyAnalyticsProps {
  facultyName?: string;
  totalStudents?: number;
}

export default function FacultyAnalytics({ facultyName = 'Faculty', totalStudents = 68 }: FacultyAnalyticsProps) {
  const turnoutChartRef = useRef<HTMLCanvasElement | null>(null);
  const courseComparisonChartRef = useRef<HTMLCanvasElement | null>(null);
  const methodChartRef = useRef<HTMLCanvasElement | null>(null);

  const turnoutInstance = useRef<ChartJS | null>(null);
  const courseComparisonInstance = useRef<ChartJS | null>(null);
  const methodInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    // 1. Lecture Turnout Trend Line Chart
    if (turnoutChartRef.current) {
      if (turnoutInstance.current) turnoutInstance.current.destroy();

      const ctx = turnoutChartRef.current.getContext('2d');
      if (ctx) {
        turnoutInstance.current = new ChartJS(ctx, {
          type: 'line',
          data: {
            labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6', 'Session 7', 'Session 8'],
            datasets: [
              {
                label: 'Class Turnout Rate (%)',
                data: [86, 91, 88, 94, 90, 95, 89, 93],
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.08)',
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#198754',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
              {
                label: 'Department Benchmark (80%)',
                data: [80, 80, 80, 80, 80, 80, 80, 80],
                borderColor: '#6c757d',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1200,
              easing: 'easeOutQuart'
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  boxWidth: 12,
                  font: { size: 12, family: 'system-ui' }
                }
              },
              tooltip: {
                backgroundColor: '#212529',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: (context) => ` ${context.dataset.label}: ${context.parsed.y}%`
                }
              }
            },
            scales: {
              y: {
                min: 60,
                max: 100,
                ticks: {
                  callback: (value) => `${value}%`
                },
                grid: {
                  color: '#e9ecef'
                }
              },
              x: {
                grid: { display: false }
              }
            }
          }
        });
      }
    }

    // 2. Course Attendance Comparison Bar Chart
    if (courseComparisonChartRef.current) {
      if (courseComparisonInstance.current) courseComparisonInstance.current.destroy();

      const ctx = courseComparisonChartRef.current.getContext('2d');
      if (ctx) {
        courseComparisonInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: ['MCA-101 (Prog)', 'MCA-106 (Lab)', 'MCA-306 (Seminar)', 'MCA-301 (AI)', 'MCA-BC (Bridge)'],
            datasets: [
              {
                label: 'Average Attendance %',
                data: [91, 95, 94, 88, 83],
                backgroundColor: ['#0d6efd', '#198754', '#6f42c1', '#0dcaf0', '#ffc107'],
                borderRadius: 6,
                borderSkipped: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1300,
              easing: 'easeOutQuart'
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#212529',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: (context) => ` Turnout: ${context.parsed.y}%`
                }
              }
            },
            scales: {
              y: {
                min: 0,
                max: 100,
                ticks: {
                  callback: (value) => `${value}%`
                },
                grid: { color: '#e9ecef' }
              },
              x: {
                grid: { display: false }
              }
            }
          }
        });
      }
    }

    // 3. Verification Method Distribution Doughnut Chart
    if (methodChartRef.current) {
      if (methodInstance.current) methodInstance.current.destroy();

      const ctx = methodChartRef.current.getContext('2d');
      if (ctx) {
        methodInstance.current = new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Face Biometric + GPS', 'ESP32 BLE Beacon', 'Offline Sync Pending', 'Faculty Manual Override'],
            datasets: [
              {
                data: [78, 14, 5, 3],
                backgroundColor: ['#0d6efd', '#6f42c1', '#ffc107', '#198754'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1400,
              easing: 'easeOutQuart'
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  font: { size: 11, family: 'system-ui' },
                  padding: 10
                }
              },
              tooltip: {
                backgroundColor: '#212529',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                  label: (context) => ` ${context.label}: ${context.parsed}%`
                }
              }
            },
            cutout: '68%'
          }
        });
      }
    }

    return () => {
      if (turnoutInstance.current) turnoutInstance.current.destroy();
      if (courseComparisonInstance.current) courseComparisonInstance.current.destroy();
      if (methodInstance.current) methodInstance.current.destroy();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Faculty KPI Row */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-body p-3">
              <span className="text-muted small text-uppercase fw-semibold">Average Class Turnout</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <h3 className="fw-bold text-success mb-0">90.8%</h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  +3.2% vs Dept
                </span>
              </div>
              <small className="text-muted d-block mt-3" style={{ fontSize: '12px' }}>
                Benchmark across all enrolled batches
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-body p-3">
              <span className="text-muted small text-uppercase fw-semibold">Active Roster Size</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <h3 className="fw-bold text-primary mb-0">{totalStudents} Students</h3>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Enrolled</span>
              </div>
              <small className="text-muted d-block mt-3" style={{ fontSize: '12px' }}>
                MCA 1st & 3rd Semester sections
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-body p-3">
              <span className="text-muted small text-uppercase fw-semibold">Sessions Conducted</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <h3 className="fw-bold text-dark mb-0">34 Lectures</h3>
                <span className="badge bg-light text-secondary border">This Term</span>
              </div>
              <small className="text-muted d-block mt-3" style={{ fontSize: '12px' }}>
                100% timetable routine adherence
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-body p-3">
              <span className="text-muted small text-uppercase fw-semibold">Attendance Shortage Alert</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <h3 className="fw-bold text-danger mb-0">3 Students</h3>
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">&lt; 75% Risk</span>
              </div>
              <small className="text-muted d-block mt-3" style={{ fontSize: '12px' }}>
                Eligible for automated warning email
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="row g-3">
        {/* Turnout Trend Chart */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 fw-bold text-dark">Lecture Session Turnout Trajectory</h6>
                <small className="text-muted">Attendance percentage for recent timetable sessions</small>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                Real-Time Verified
              </span>
            </div>
            <div className="card-body p-3">
              <div style={{ height: '260px' }}>
                <canvas ref={turnoutChartRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Method Donut Chart */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="mb-0 fw-bold text-dark">Verification Channel Split</h6>
              <small className="text-muted">Biometric, BLE Beacon and Geofence</small>
            </div>
            <div className="card-body p-3 d-flex align-items-center justify-content-center">
              <div style={{ height: '260px', width: '100%' }}>
                <canvas ref={methodChartRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Course-Wise Comparison Bar Chart */}
        <div className="col-12">
          <div className="card shadow-sm border-0 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 fw-bold text-dark">Course-Wise Attendance Comparison</h6>
                <small className="text-muted">Average turnout across different allocated courses and labs</small>
              </div>
              <span className="badge bg-light text-muted border">MCA Department</span>
            </div>
            <div className="card-body p-3">
              <div style={{ height: '240px' }}>
                <canvas ref={courseComparisonChartRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
