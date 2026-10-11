# AEC MCA Smart Attendance Management System — Testing & QA Guide

This guide details the commands to execute the multi-tiered test suite across Backend, AI Engine, Hardware, and Frontend.

---

## 1. Backend Core Unit Tests (NestJS / Vitest)

* **Location:** `backend/api`
* **Test Suite:** `src/attendance/attendance.service.spec.ts`, `src/app.controller.spec.ts`
* **Covered Rules:**
  * Haversine distance math & GPS accuracy radius enforcement.
  * Timetable window boundary checks (before class, during class, after class).
  * Institutional holiday attendance lock.
  * Student section enrollment validation.
  * Database duplicate prevention.
  * Fail-secure AI fallback policy (`REVIEW_REQUIRED` on AI outage).
  * Transactional administrative overrides with `AuditLog` generation.

**Command:**
```powershell
cd "e:\attendence system\backend\api"
npm.cmd test
```

---

## 2. Computer Vision & Biometrics Unit Tests (Python / OpenCV)

* **Location:** `backend/ai`
* **Test Suite:** `test_ai_engine.py`
* **Covered Rules:**
  * Blank/non-face frame detection and rejection (`No face detected`).
  * Face bounding box localization & blur quality assessment.
  * Frequency-spectrum & color saturation Presentation Attack Detection (liveness).
  * 512-D spatial LBP/gradient feature embedding extraction with L2 unit normalization.
  * Cosine similarity verification ($1.0$ for identical, lower for distinct faces).

**Command:**
```powershell
cd "e:\attendence system\backend\ai"
.\venv\Scripts\python.exe test_ai_engine.py
```

---

## 3. ESP32 Hardware & Offline Batch Sync Simulation

* **Location:** `backend/hardware`
* **Test Script:** `esp32_simulator.ts`
* **Covered Rules:**
  * ESP32 rotating challenge token generation (HMAC-SHA256 signature).
  * Mobile client offline queue generation.
  * Payload structural validation for `POST /attendance/sync-offline-batch`.

**Command:**
```powershell
cd "e:\attendence system"
.\backend\api\node_modules\.bin\tsx.cmd backend/hardware/esp32_simulator.ts
```

---

## 4. Frontend Compilation & Type Checks (Next.js / Turbopack)

* **Location:** `frontend`
* **Command:**
```powershell
cd "e:\attendence system\frontend"
npm.cmd run build
```
