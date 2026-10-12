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

interface StudentAnalyticsProps {
  studentName?: string;
  semester?: number;
}

export default function StudentAnalytics({ studentName = 'Student', semester = 1 }: StudentAnalyticsProps) {
  const trendChartRef = useRef<HTMLCanvasElement | null>(null);
  const subjectChartRef = useRef<HTMLCanvasElement | null>(null);
  const ratioChartRef = useRef<HTMLCanvasElement | null>(null);

  const trendInstance = useRef<ChartJS | null>(null);
  const subjectInstance = useRef<ChartJS | null>(null);
  const ratioInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    // 1. Weekly Attendance Trend Line Chart
    if (trendChartRef.current) {
      if (trendInstance.current) trendInstance.current.destroy();

      const ctx = trendChartRef.current.getContext('2d');
      if (ctx) {
        trendInstance.current = new ChartJS(ctx, {
          type: 'line',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
            datasets: [
              {
                label: 'Attendance Rate (%)',
                data: [82, 88, 85, 92, 90, 86, 94, 89],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.08)',
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#0d6efd',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
              {
                label: 'Exam Cutoff (75%)',
                data: [75, 75, 75, 75, 75, 75, 75, 75],
                borderColor: '#dc3545',
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
                cornerRadius: 8
              }
            },
            scales: {
              y: {
                min: 50,
                max: 100,
                ticks: {
                  callback: (value) => `${value}%`
                },
                grid: {
                  color: '#e9ecef'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }

    // 2. Subject-Wise Breakdown Bar Chart
    if (subjectChartRef.current) {
      if (subjectInstance.current) subjectInstance.current.destroy();

      const ctx = subjectChartRef.current.getContext('2d');
      if (ctx) {
        const subjects = semester === 3
          ? ['MCA-301 (AI)', 'MCA-302 (Web)', 'MCA-303 (Data Sci)', 'MCA-305 (Embedded)', 'MCA-306 (Seminar)']
          : ['MCA-101 (COA)', 'MCA-102 (DAA)', 'MCA-103 (Prog)', 'MCA-104 (Database)', 'MCA-106 (Lab)'];

        const attendanceData = semester === 3
          ? [91, 86, 94, 82, 96]
          : [88, 84, 92, 80, 95];

        subjectInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: subjects,
            datasets: [
              {
                label: 'Attendance %',
                data: attendanceData,
                backgroundColor: attendanceData.map(val => val >= 85 ? '#198754' : val >= 75 ? '#0d6efd' : '#ffc107'),
                borderRadius: 6,
                borderSkipped: false,
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
                  label: (context) => ` Attendance: ${context.parsed.y}%`
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

    // 3. Attendance Status Ratio Donut Chart
    if (ratioChartRef.current) {
      if (ratioInstance.current) ratioInstance.current.destroy();

      const ctx = ratioChartRef.current.getContext('2d');
      if (ctx) {
        ratioInstance.current = new ChartJS(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Present (On-Time)', 'Late Verified', 'Excused / Leave', 'Absent'],
            datasets: [
              {
                data: [85, 7, 4, 4],
                backgroundColor: ['#198754', '#ffc107', '#0dcaf0', '#dc3545'],
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
                  padding: 12
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
      if (trendInstance.current) trendInstance.current.destroy();
      if (subjectInstance.current) subjectInstance.current.destroy();
      if (ratioInstance.current) ratioInstance.current.destroy();
    };
  }, [semester]);

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-body p-3">
              <span className="text-muted small text-uppercase fw-semibold">Overall Attendance</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <h3 className="fw-bold text-primary mb-0">88.5%</h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  ✓ Eligible
                </span>
              </div>
              <div className="progress mt-2" style={{ height: '6px' }}>
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{ width: '88.5%' }}
                  aria-valuenow={88.5}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
              <small className="text-muted d-block mt-2 font-monospace" style={{ fontSize: '11px' }}>
                Threshold: 75% required
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-body p-3">
              <span className="text-muted small text-uppercase fw-semibold">Classes Attended</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <h3 className="fw-bold text-dark mb-0">46 / 52</h3>
                <span className="badge bg-light text-secondary border">Total</span>
              </div>
              <small className="text-muted d-block mt-3" style={{ fontSize: '12px' }}>
                6 classes missed or excused
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-body p-3">
              <span className="text-muted small text-uppercase fw-semibold">Face & Liveness Score</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <h3 className="fw-bold text-success mb-0">99.2%</h3>
                <span className="badge bg-success-subtle text-success border border-success-subtle">High Confidence</span>
              </div>
              <small className="text-muted d-block mt-3" style={{ fontSize: '12px' }}>
                Anti-spoofing verified in all sessions
              </small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-body p-3">
              <span className="text-muted small text-uppercase fw-semibold">GPS & Proximity Check</span>
              <div className="d-flex align-items-baseline justify-content-between mt-2">
                <h3 className="fw-bold text-info mb-0">100%</h3>
                <span className="badge bg-info-subtle text-info border border-info-subtle">Geofence Pass</span>
              </div>
              <small className="text-muted d-block mt-3" style={{ fontSize: '12px' }}>
                Average radius: 14m from classroom
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="row g-3">
        {/* Trend Line Chart */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 fw-bold text-dark">Weekly Attendance Trajectory</h6>
                <small className="text-muted">Semester compliance over previous 8 academic weeks</small>
              </div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                Live Analytics
              </span>
            </div>
            <div className="card-body p-3">
              <div style={{ height: '260px' }}>
                <canvas ref={trendChartRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Ratio Donut Chart */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 h-100 bg-white">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="mb-0 fw-bold text-dark">Attendance Distribution</h6>
              <small className="text-muted">Breakdown by session check-in status</small>
            </div>
            <div className="card-body p-3 d-flex align-items-center justify-content-center">
              <div style={{ height: '260px', width: '100%' }}>
                <canvas ref={ratioChartRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Subject-Wise Breakdown Bar Chart */}
        <div className="col-12">
          <div className="card shadow-sm border-0 bg-white">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 fw-bold text-dark">Subject-Wise Attendance Breakdown</h6>
                <small className="text-muted">Individual compliance for enrolled Semester {semester} courses</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle">≥ 85% Optimal</span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">75-84% Normal</span>
              </div>
            </div>
            <div className="card-body p-3">
              <div style={{ height: '240px' }}>
                <canvas ref={subjectChartRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
