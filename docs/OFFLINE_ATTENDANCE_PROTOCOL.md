# AEC MCA Offline Attendance Protocol Specification

**Status:** Approved Architecture Standard  
**Target Hardware:** ESP32-WROOM-32 / ESP32-S3 BLE Classroom Gateways  
**Client Protocols:** Bluetooth Low Energy (BLE 4.2 / 5.0) & HTTP Synchronization  

---

## 1. Operating Modes & Trust Boundaries

The system handles three operational connectivity scenarios:

```
+-----------------------------------------------------------------------------------+
| MODE A: ONLINE CLASSROOM                                                          |
| Internet Available -> Full Multi-Factor (GPS Geofence + AI Liveness + Timetable)  |
+-----------------------------------------------------------------------------------+
| MODE B: INDOOR DRIFT / WEAK GPS CLASSROOM                                         |
| ESP32 Emits Rolling Cryptographic Challenge -> App captures BLE Beacon ->        |
| Submits {challengeToken, faceCapture} -> Server validates token signature & time. |
+-----------------------------------------------------------------------------------+
| MODE C: FULL DISCONNECTED OFFLINE (Campus Network Outage)                         |
| Client caches encrypted attendance attempt in durable IndexedDB with eventId      |
| -> Displays PENDING status -> Batch syncs via /attendance/sync-offline-batch      |
| when network restores -> Server reconciles idempotently.                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. Cryptographic Beacon Challenge Structure

The ESP32 Classroom Gateway advertises BLE manufacturer data or issues challenges through local pairing with a rolling 90-second Time-based One-Time Token:

$$\text{Challenge Token} = \text{Nonce} \mathbin{\Vert} \text{ExpiryMs} \mathbin{\Vert} \text{HMAC-SHA256}_{K_{\text{device}}}(\text{DeviceId} : \text{ClassroomId} : \text{Nonce} : \text{ExpiryMs})$$

* **`Nonce`:** 16-byte cryptographically secure random hexadecimal string.
* **`ExpiryMs`:** Unix epoch timestamp in milliseconds when the challenge expires.
* **`Signature`:** 32-byte HMAC-SHA256 signature generated using the secret provisioning key unique to that classroom ESP32.

---

## 3. Client Offline Queue Data Schema

When a client device loses network connectivity, attendance events are queued locally with the following record structure:

```json
{
  "eventId": "evt_7f8a9b2c-3d4e-5f6a-b7c8-d9e0f1a2b3c4",
  "studentProfileId": "stu-aec-mca-001",
  "classSessionId": "sess-os-lecture-01",
  "verificationMethod": "ESP32_BLE_BEACON",
  "challengeToken": "8f3a1b...1728643200000.4a2b9c...",
  "latitude": 26.1412,
  "longitude": 91.6620,
  "gpsAccuracy": 8.5,
  "recordedAt": "2026-10-11T13:45:00.000Z",
  "syncState": "QUEUED"
}
```

---

## 4. Server Reconciliation & Idempotency Pipeline

1. **Batch Submission:** Clients issue `POST /attendance/sync-offline-batch` upon reconnect.
2. **Transaction Isolation:** The batch is processed inside a PostgreSQL transaction.
3. **Idempotency Guarantee:**
   * Every record's `eventId` is verified. Replays are acknowledged without duplicating the database record.
   * Composite constraint `(studentProfileId, classSessionId)` guarantees a student cannot be recorded twice for the same class session.
4. **Status Assignment:**
   * If `challengeToken` matches a verified classroom hardware beacon, status becomes `PRESENT`.
   * If unverified offline evidence is provided, status becomes `PENDING` awaiting faculty or administrative review.
