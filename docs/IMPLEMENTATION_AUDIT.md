# AEC MCA Smart Attendance Management System — Implementation Audit

**Audit Date:** October 2026  
**Audited Target:** AEC MCA Smart Attendance Management System  
**Baseline Git Branch:** `main` (clean working tree)  
**Auditor:** Senior Software & Systems Architecture Team

---

## 1. Executive Summary & Verification Classification

This document provides an objective, code-verified audit of the entire codebase. Features are classified under one of the following states:
* **Verified Working:** Tested and validated with executable verification.
* **Implemented but Unverified:** Code exists but lacks automated regression tests.
* **Partially Implemented:** Functional stub or UI present, but backend logic/rules are incomplete.
* **Missing:** Documented or expected feature with zero underlying implementation.
* **Defective:** Implemented logic contains logical or runtime defects.
* **Security Critical:** Architectural vulnerability permitting unauthorized bypass, spoofing, or data inconsistency.

---

## 2. Feature-by-Feature Verification Matrix

| Component | Status | Classification | Evidence & Findings |
| :--- | :--- | :--- | :--- |
| **Authentication & JWT** | Implemented | Verified Working | Bcrypt password hashing (`bcrypt v6.0`), JWT token signing (`@nestjs/jwt`), Passport strategy validated. Role guards enforced. |
| **User Roles (RBAC)** | Implemented | Verified Working | `STUDENT`, `FACULTY`, `ADMIN` roles supported across routes with `@Roles(...)` and `RolesGuard`. |
| **Schedule Resolution (IST)** | Implemented | Partially Implemented | Timetable lookup correctly maps Mon–Sat routines and 1st/3rd Semesters. **Defect:** Calls external `worldtimeapi.org` on schedule resolution, prone to DNS/rate-limit failure. Authoritative server time with IST conversion exists as fallback. |
| **Holiday Enforcement** | Implemented | Verified Working | Checks declared `Holiday` records and suspends regular class attendance for the date. |
| **Session Windowing** | Implemented | Verified Working | Blocks attendance before `startTime` (`ATTENDANCE_WINDOW_NOT_OPEN`) and after `endTime` (`ATTENDANCE_WINDOW_EXPIRED`). |
| **Enrollment Validation** | Missing | **Security Critical** | `markAttendance` does **not** verify whether the student is actually enrolled in the section/subject of the active session. Any authenticated student can mark attendance for any class. |
| **Duplicate Prevention** | Partially Implemented | **Security Critical** | Checks `findFirst` in application code, but lacks a database unique constraint `@@unique([studentProfileId, classSessionId])`. Vulnerable to concurrent race conditions. |
| **GPS Geofencing** | Implemented | Partially Implemented | Haversine formula calculation performed backend-side. Radius enforcement works. **Limitation:** Client accuracy filtering is rudimentary, and spoofed coordinates from rooted/developer mode devices are not cryptographically challenged. |
| **Facial Liveness Detection** | Stub / Mock | **Security Critical** | `backend/ai/core/face_engine.py` only runs OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`) to count faces, then hardcodes `liveness_score: 0.95, is_live: True`. No genuine presentation attack detection (PAD). |
| **Facial Identity Verification**| Stub / Mock | **Security Critical** | `verify_face_match` does not extract deep face embeddings (e.g. MobileFaceNet / FaceNet). It returns hardcoded `match_score: 0.98, is_match: True`. |
| **AI Fallback in API** | Defective | **Security Critical** | In `backend/api/src/attendance/attendance.service.ts`, when the AI service fails or is unreachable, the catch block silently treats the face as verified (`aiLivenessScore = 0.95; aiFaceScore = 0.98`) and marks the student `PRESENT`. |
| **Admin Overrides & Auditing** | Partially Implemented | Security Critical | Admins can override records, but `AuditLog` table is never written to. No record of which admin performed the override, when, or why. |
| **ESP32 Device Integration** | Missing | Missing | Prisma model `ESP32Device` exists, but there are zero endpoints, zero firmware files, and zero synchronization handlers. |
| **Offline Sync Protocol** | Missing | Missing | `eventId` idempotency column exists in `AttendanceRecord`, but there is no persistent client queue, offline token challenge, or batch reconciliation API. |
| **Analytics & Reporting** | Implemented | Partially Implemented | `ReportsService` aggregates counts, but lacks date-range filters, CSV/PDF export generation, and attendance shortage forecasting. |
| **Feedback & Appeals** | Implemented | Verified Working | Ticket creation, status updates (`OPEN`, `RESOLVED`, `CLOSED`), and message threads are functional. |

---

## 3. Toolchain & Environment Baseline

* **Frontend:** Next.js `16.4.0` (Turbopack, App Router), React `19.3.0`, TypeScript `5.x`, Tailwind CSS `4.x`. Builds cleanly via `npm run build`.
* **Backend API:** NestJS `12.0.1`, Prisma `5.13.0`, TypeScript `5.4.5`. Builds cleanly via `npm run build`. Unit tests run via Vitest `v4.1.11` (currently only 1 basic app controller test).
* **AI Service:** Python `3.14.2`, FastAPI `0.103+`, Uvicorn `0.23+`, OpenCV `4.8+`, NumPy `1.25+`.
* **Database:** PostgreSQL (with Docker Compose config: PostgreSQL `15-alpine`).
* **Deployment:** `docker-compose.yml` (multi-service), `render.yaml` (Render Web Services).

---

## 4. Prioritized Vulnerabilities & Defects

1. **VULN-01 (Critical): AI Service Mock & Silent Fallback Bypass**
   * Haar cascade is used without actual embeddings or PAD.
   * Connection failures to the AI service result in auto-marking students as `PRESENT`.
2. **VULN-02 (Critical): Missing Student Enrollment Authorization Check**
   * Students can mark attendance in sessions for subjects/sections they do not take.
3. **VULN-03 (High): Race Condition on Attendance Duplication**
   * Concurrent requests can create duplicate attendance records because the database lacks a composite unique constraint on `(studentProfileId, classSessionId)`.
4. **VULN-04 (High): Missing Audit Trails on Administrative Overrides**
   * Admin status overrides are silent and unverifiable.
5. **VULN-05 (Medium): External Clock Dependency**
   * Relying on `worldtimeapi.org` risks blocking attendance during network drops or API rate-limiting.
6. **VULN-06 (High): Unimplemented Offline & Hardware Workflow**
   * Classroom hardware (ESP32) and offline sync claim to exist in design docs but have zero implementation in the codebase.
