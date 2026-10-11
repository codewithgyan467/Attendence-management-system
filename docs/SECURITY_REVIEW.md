# Cybersecurity & Privacy Review — AEC MCA Smart Attendance Platform

**Classification:** Institutional Security Assessment  
**Target:** AEC MCA Smart Attendance Management System  
**Frameworks Referenced:** OWASP Top 10 API Security, ISO/IEC 27001, Indian Digital Personal Data Protection (DPDP) Act  

---

## 1. Threat Modeling & Attack Surface

The system protects against academic attendance fraud ("proxy attendance") while safeguarding student biometric and geolocation privacy.

```
       [Attacker Surfaces]
       |-- 1. Client GPS spoofing (Mock location apps, developer settings)
       |-- 2. Facial presentation attacks (Photo printout, tablet display, deepfake replay)
       |-- 3. Unauthorized API replay (Re-sending valid student tokens / eventIds)
       |-- 4. Cross-student marking (Student A marking for Student B)
       |-- 5. Out-of-window submission (Attempting to mark before or after class)
       |-- 6. AI Service denial-of-service to force fallback to auto-PRESENT
       |-- 7. Silent admin modification of student records
```

---

## 2. Security Assessment & Hardening Requirements

### 2.1 Threat Vector 1: AI Service Outage Exploitation (Critical)
* **Finding:** Previous implementation caught AI exceptions and defaulted to:
  ```typescript
  aiLivenessScore = 0.95;
  aiFaceScore = 0.98;
  finalStatus = 'PRESENT';
  ```
* **Vulnerability:** An attacker who blocks network access to port 8000 or floods the AI service could bypass facial verification completely.
* **Remediation:** If the AI service is unavailable or returns an error, the attendance status **must** transition to `REVIEW_REQUIRED` or reject the transaction. It must **never** fail open to `PRESENT`.

### 2.2 Threat Vector 2: Enrollment Authorization Bypass (Critical)
* **Finding:** Any authenticated student could submit attendance for any active session.
* **Remediation:** The backend must execute an explicit enrollment check:
  ```typescript
  const isEnrolled = await prisma.enrollment.findFirst({
    where: {
      studentProfileId: student.id,
      sectionId: session.timetableEntry.sectionId
    }
  });
  if (!isEnrolled) throw new ForbiddenException('NOT_ENROLLED_IN_SUBJECT');
  ```

### 2.3 Threat Vector 3: Concurrent Submission Race Condition (High)
* **Finding:** Attendance duplication was checked solely with `prisma.attendanceRecord.findFirst(...)`, allowing simultaneous requests to produce duplicate entries.
* **Remediation:** Enforce a database-level composite unique constraint on `(studentProfileId, classSessionId)` in `schema.prisma`.

### 2.4 Threat Vector 4: Unaudited Administrative Modifications (High)
* **Finding:** Administrators could change attendance records from `ABSENT` to `PRESENT` without creating an audit log.
* **Remediation:** Every call to `adminOverrideRecord` must execute inside a database transaction that creates an immutable `AuditLog` entry detailing:
  * Admin user ID
  * Target student and class session ID
  * Previous status vs. new status
  * Mandatory justification note
  * Timestamp and client IP

### 2.5 Threat Vector 5: Biometric & Facial Data Privacy (DPDP Act)
* **Finding:** Raw base64 images should never be permanently persisted in the main relational database or plain server logs.
* **Remediation:**
  * Raw facial images must be processed in-memory only by the AI engine.
  * Only feature vectors / numerical encodings (`faceTemplate`) and verification outcome metrics (`faceScore`, `livenessScore`) may be stored long term.
  * Implement explicit biometric data retention policies.

---

## 3. Summary of Hardening Actions

| Risk ID | Severity | Mitigation Implemented |
| :--- | :--- | :--- |
| **SEC-01** | Critical | Fail-secure AI verification; transition to `REVIEW_REQUIRED` on AI unavailability |
| **SEC-02** | Critical | Section enrollment validation before attendance record creation |
| **SEC-03** | High | Composite unique constraint on `[studentProfileId, classSessionId]` |
| **SEC-04** | High | Mandatory audit logging on all administrative overrides and deletions |
| **SEC-05** | Medium | Elimination of third-party public clock dependencies |
| **SEC-06** | Medium | Request payload size limits and sanitized input validation |
