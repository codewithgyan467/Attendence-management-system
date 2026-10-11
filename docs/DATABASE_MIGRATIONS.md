# PostgreSQL Database & Schema Migration Guide

## 1. Schema Modifications Overview

In this production upgrade, the Prisma schema (`backend/api/prisma/schema.prisma`) has been hardened with the following enhancements:

1. **Composite Unique Constraint:**
   ```prisma
   model AttendanceRecord {
     ...
     @@unique([studentProfileId, classSessionId])
   }
   ```
   * **Purpose:** Physically prevents concurrent race conditions where two simultaneous API calls mark attendance for the same student in the same session.

2. **Query Performance Indexes:**
   ```prisma
   @@index([studentProfileId])
   @@index([classSessionId])
   @@index([markedAt])
   @@index([status])
   ```
   * **Purpose:** Accelerates session roster lookups, administrative date-range reports, and student attendance calculations.

3. **Audit Trail Indexes:**
   ```prisma
   model AuditLog {
     ...
     @@index([action])
     @@index([userId])
   }
   ```
   * **Purpose:** Enables high-speed audit log inspection and compliance verification.

4. **Security Fields:**
   * Added `notes String?` and `riskFlag String?` to `AttendanceRecord`.

---

## 2. Migration Execution Procedure

### Development / Local:
```bash
cd backend/api
npx prisma migrate dev --name add_composite_constraints_and_indexes
```

### Staging & Production Deployment:
```bash
cd backend/api
npx prisma migrate deploy
```

---

## 3. Database Backup & Rollback Safety Rules

1. **Pre-Migration Snapshot:** Always create a point-in-time PostgreSQL backup before deploying migrations:
   ```bash
   pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE -F c -b -v -f pre_migration_backup.dump
   ```
2. **Zero Table Drop Policy:** Production migrations must be strictly additive. Dropping tables or clearing student historical records is strictly prohibited without institutional authorization.
