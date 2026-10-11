# Implementation Roadmap & Milestone Tracker

## Overview
This roadmap establishes the step-by-step engineering sequence to bring the AEC MCA Smart Attendance System from baseline to production readiness.

---

## Milestone Breakdown & Execution Status

### [x] Milestone 1: Audit and Baseline
* **Tasks:**
  * Complete full-codebase inspection (Next.js, NestJS, FastAPI, Prisma, Docker).
  * Run and document baseline builds, lint checks, and test suites.
  * Identify architectural defects, security bypasses, and unverified mock features.
  * Author foundation documents: `IMPLEMENTATION_AUDIT.md`, `ARCHITECTURE.md`, `SECURITY_REVIEW.md`, and `IMPLEMENTATION_ROADMAP.md`.
* **Deliverables:** Baseline documentation suite in `/docs`.

---

### [ ] Milestone 2: Stabilize the Attendance Core
* **Tasks:**
  * **Eliminate Clock Vulnerability:** Replace external `worldtimeapi.org` network dependency with authoritative server IST time calculation.
  * **Enrollment Check:** Add verification in `AttendanceService.markAttendance` ensuring the student is enrolled in the session's section.
  * **Database Race Prevention:** Add unique constraint `@@unique([studentProfileId, classSessionId])` in `schema.prisma`.
  * **Administrative Audit Logging:** Instrument `AuditLog` writes in `AttendanceService.adminOverrideRecord` capturing actor, timestamp, previous status, new status, and justification.
  * **Fail-Secure AI Integration:** If the AI service fails, do not mark `PRESENT`; designate status as `REVIEW_REQUIRED`.
  * **Comprehensive Core Unit Tests:** Write Vitest suites covering geofence math, windowing, holiday locks, enrollment checks, duplicate rejection, and audit logging.
* **Deliverables:** Patched `attendance.service.ts`, updated `schema.prisma`, passing Vitest unit test suite.

---

### [ ] Milestone 3: Real Identity Verification & Liveness Pipeline
* **Tasks:**
  * **Separate AI Responsibilities:** Distinct pipelines for (1) Face Detection, (2) Face Quality Assessment, (3) Liveness Anti-Spoofing, and (4) Embedding Identity Matching.
  * **True Anti-Spoofing / PAD:** Implement texture/frequency analysis (Laplacian variance, eye aspect ratio / blinking, color spectrum checks) to detect printed photos and screen replays.
  * **Real Feature Embeddings:** Compute normalized face feature descriptors (using OpenCV deep neural net / face embeddings) to compute genuine cosine similarity rather than hardcoded 0.98.
  * **Configurable Verification Thresholds:** Reject under 0.60, mark `REVIEW_REQUIRED` between 0.60–0.75, mark `VERIFIED` above 0.75.
* **Deliverables:** Upgraded `backend/ai/core/face_engine.py`, enhanced `backend/ai/main.py`, automated AI test script.

---

### [ ] Milestone 4: Operational Workflows, Analytics & Dispute Handling
* **Tasks:**
  * **Analytics Engine:** Expand `ReportsService` with subject-wise percentages, student shortage alerts (<75% threshold), and date-filtered queries.
  * **CSV Export:** Implement secure CSV data export endpoint for class attendance rosters.
  * **Dispute & Feedback Flow:** Enhance feedback ticket resolution workflow allowing faculty/admin to approve student appeals and update attendance with an audit trail.
* **Deliverables:** Updated `reports.service.ts`, `reports.controller.ts`, export endpoints.

---

### [ ] Milestone 5: ESP32 Hardware Integration & Offline Sync Protocol
* **Tasks:**
  * **Protocol Specification:** Author `docs/OFFLINE_ATTENDANCE_PROTOCOL.md` and `docs/ESP32_SETUP.md`.
  * **API Endpoints:** Implement `/attendance/hardware/beacon-challenge` and `/attendance/sync-offline-batch`.
  * **Hardware Mock Simulator:** Build a runnable Node.js/TypeScript ESP32 emulator simulating rolling beacon challenges and offline event queuing.
  * **Firmware Reference:** Provide production-ready ESP32 Arduino/C++ firmware sketch supporting BLE advertising and rotating cryptographic challenge nonces.
* **Deliverables:** Offline protocol docs, sync endpoints, firmware sketch, hardware simulator script.

---

### [ ] Milestone 6: Cross-Platform & Mobile PWA Readiness
* **Tasks:**
  * Configure Web App Manifest (`manifest.json`) and service worker configuration for offline capability and installable PWA behavior.
  * Ensure responsive layout across iOS Safari and Android Chrome viewports with camera and GPS diagnostic aids.
* **Deliverables:** `public/manifest.json`, mobile meta tags in `frontend/src/app/layout.tsx`.

---

### [ ] Milestone 7: Testing, Quality Assurance & Security Hardening
* **Tasks:**
  * Run adversarial test cases (duplicate submissions, out-of-window requests, spoofed distances, AI service offline, unauthorized override attempts).
  * Validate end-to-end compilation, build, and test pass rates.
* **Deliverables:** Comprehensive test suites in `backend/api/test/`.

---

### [ ] Milestone 8: Deployment & Production Preparation
* **Tasks:**
  * Author operational documentation: `API_REFERENCE.md`, `DEPLOYMENT_GUIDE.md`, `ADMINISTRATOR_GUIDE.md`, `PRIVACY_AND_RETENTION.md`.
  * Update environment templates (`.env.example`).
  * Final implementation and verification summary.
