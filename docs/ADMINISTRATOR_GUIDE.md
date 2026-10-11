# AEC MCA Smart Attendance Management System — Administrator Guide

## 1. Administrative Roles & Permissions

Administrators hold master oversight of the academic structure, user profiles, timetable schedules, institutional holidays, and manual attendance overrides.

---

## 2. Managing the Academic Structure

1. **Departments & Subjects:**
   * Create academic departments (e.g. `MCA Department`, `Assam Engineering College`).
   * Add subjects with official subject codes (e.g., `OS` - Operating Systems, `DAA` - Design and Analysis of Algorithms, `COA` - Computer Organization and Architecture).

2. **Classrooms & Geofence Coordinates:**
   * Enter physical classroom locations:
     * **Latitude / Longitude:** Decimal degrees (e.g., AEC MCA Department: `26.1412, 91.6620`).
     * **Allowed Radius:** Configurable per room geometry (default: 50m to 100m).
     * **Max Accuracy Threshold:** Reject readings where browser reports accuracy radius $> 20$m.

3. **Timetable Configuration:**
   * Configure weekly routine entries mapping `DayOfWeek` (1 = Monday, 6 = Saturday) to `StartTime`, `EndTime`, `Section`, and `Classroom`.

4. **Holiday Scheduling:**
   * Declaring a holiday via the Admin Console locks automated student attendance for that date institutional-wide.
   * Only administrators can record attendance on declared holidays.

---

## 3. Attendance Overrides & Audit Accountability

When students dispute attendance (e.g., valid medical excuse, official university duty, or verified GPS receiver failure):
1. Navigate to **Admin Dashboard -> Attendance Overrides**.
2. Select the affected record or enter student enrollment number and class session ID.
3. Choose the new status (`PRESENT`, `EXCUSED`, `LATE`, or `ABSENT`).
4. **Mandatory Note:** Enter the reason (e.g., "Medical leave approved by HOD").
5. The system records an immutable entry in the `AuditLog` table capturing the admin ID, previous value, new value, and justification.
