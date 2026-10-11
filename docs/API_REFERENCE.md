# AEC MCA Smart Attendance Management System — API Reference

All requests must use `Content-Type: application/json` unless otherwise specified. Authenticated endpoints require the header `Authorization: Bearer <jwt_access_token>`.

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/login`
Authenticates user email and password.
* **Headers:** None
* **Request Body:**
  ```json
  {
    "email": "student@aec.ac.in",
    "password": "SecurePassword123!"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "user": {
      "id": "usr-uuid",
      "email": "student@aec.ac.in",
      "role": "STUDENT",
      "firstName": "Rahul",
      "lastName": "Sharma"
    }
  }
  ```

---

## 2. Attendance & Live Routine (`/attendance`)

### `GET /attendance/clock`
Returns authoritative server time formatted in Indian Standard Time (IST).
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "source": "AuthoritativeServerIST",
    "date": "2026-10-11T13:40:00.000Z",
    "timezone": "Asia/Kolkata (IST)"
  }
  ```

### `GET /attendance/live-schedule`
Resolves the active lecture slot, time remaining, and next scheduled class.
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:**
  * `simulateDay` (optional): `0-6` (0 = Sunday, 1 = Monday)
  * `simulateTime` (optional): `"HH:mm"`
  * `semester` (optional): `1` or `3`
* **Response (200 OK):**
  ```json
  {
    "active": true,
    "isHoliday": false,
    "session": { "id": "sess-uuid", "status": "ACTIVE" },
    "slot": {
      "subject": "Operating Systems",
      "code": "MCA101",
      "startTime": "08:00",
      "endTime": "09:00",
      "classroom": "MCA Classroom 1"
    },
    "timeRemainingSeconds": 1820
  }
  ```

### `POST /attendance/mark`
Submits student attendance with geolocation and facial verification frame.
* **Headers:** `Authorization: Bearer <token>` (Role: `STUDENT`)
* **Request Body:**
  ```json
  {
    "classSessionId": "sess-uuid",
    "latitude": 26.1412,
    "longitude": 91.6620,
    "gpsAccuracy": 9.5,
    "base64Image": "data:image/jpeg;base64,...",
    "verificationMethod": "FACE_GPS",
    "eventId": "evt_optional_uuid"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "rec-uuid",
    "status": "PRESENT",
    "verificationMethod": "FACE_GPS",
    "distanceMeters": 14.2,
    "faceScore": 1.0,
    "livenessScore": 0.95,
    "markedAt": "2026-10-11T13:42:00.000Z"
  }
  ```

### `POST /attendance/hardware/beacon-challenge`
Issues rolling 90-second cryptographic challenge token for classroom ESP32 device.
* **Request Body:** `{ "deviceId": "ESP32-AEC-MCA-LAB1" }`
* **Response (200 OK):**
  ```json
  {
    "deviceId": "ESP32-AEC-MCA-LAB1",
    "classroomId": "class-uuid",
    "nonce": "16c119b5c...",
    "expiresAt": 1728643290000,
    "challengeToken": "16c119...1728643290000.4a2b9..."
  }
  ```

### `POST /attendance/sync-offline-batch`
Synchronizes offline queued student attendance attempts idempotently.
* **Request Body:**
  ```json
  {
    "events": [
      {
        "eventId": "evt_unique_1",
        "studentProfileId": "stu-uuid",
        "classSessionId": "sess-uuid",
        "challengeToken": "nonce.exp.sig",
        "latitude": 26.1412,
        "longitude": 91.6620,
        "gpsAccuracy": 10
      }
    ]
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "totalReceived": 1,
    "processedCount": 1,
    "skippedDuplicates": 0,
    "successfulEventIds": ["evt_unique_1"]
  }
  ```

---

## 3. Analytics & Reports (`/reports`)

### `GET /reports/global`
Returns institutional attendance totals, percentages, anomaly counts, and method distribution.
* **Headers:** `Authorization: Bearer <token>` (Role: `ADMIN`)

### `GET /reports/student/:id`
Returns subject-wise attendance breakdown, 75% shortage alert, and dispute history.
* **Headers:** `Authorization: Bearer <token>` (Roles: `STUDENT`, `FACULTY`, `ADMIN`)

### `GET /reports/session/:id/export-csv`
Exports CSV attendance roster for a class session with formula-injection sanitation.
* **Headers:** `Authorization: Bearer <token>` (Roles: `FACULTY`, `ADMIN`)
* **Response (200 OK):** `Content-Type: text/csv`
