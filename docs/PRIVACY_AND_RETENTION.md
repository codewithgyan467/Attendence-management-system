# Biometric & Location Data Privacy and Retention Policy

**Target Entity:** Assam Engineering College (AEC), Department of Computer Applications  
**Compliance Baseline:** Indian Digital Personal Data Protection (DPDP) Act, University Privacy Guidelines  

---

## 1. Principles of Data Minimization

1. **Ephemeral Image Processing:**
   * Raw facial video streams and Base64 captured frames are processed in-memory by the AI microservice for verification and immediately discarded.
   * **No raw student selfies are stored** in relational database rows or server log files.

2. **Biometric Template Isolation:**
   * Only normalized numerical feature embeddings (`FaceProfile.faceTemplate`) are stored for identity matching.
   * Biometric templates cannot be reverse-engineered into high-resolution photographic portraits.

3. **Restricted Geolocation Tracking:**
   * GPS coordinates are captured **only** upon the explicit click of "Mark Attendance" inside an authorized class session.
   * Continuous background location tracking is strictly forbidden and technically prevented.

---

## 2. Retention Periods & Purging Schedules

| Data Category | Retention Schedule | Purging Mechanism |
| :--- | :--- | :--- |
| **Attendance Records** | Current Academic Degree Duration + 1 Year | Archived to cold encrypted storage, then permanently deleted. |
| **Audit Logs** | 3 Academic Years | Maintained for university accreditation and compliance review. |
| **Biometric Face Templates** | Active Enrollment Duration | Deleted immediately upon student graduation or formal withdrawal. |
| **Support Dispute Tickets**| 1 Academic Term | Purged at the conclusion of end-semester examinations. |

---

## 3. Alternative Attendance Pathway

Per privacy compliance mandates, students unable or unwilling to undergo automated facial biometrics have the legal right to request an approved alternative attendance pathway:
* **Manual Verification:** Faculty roll-call verification recorded directly on the Faculty Dashboard.
* **Classroom Hardware Token:** Physical presence verification via classroom BLE beacon gateway.
