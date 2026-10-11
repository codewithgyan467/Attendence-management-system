# AEC MCA Smart Attendance Management System — Deployment Guide

This guide covers deploying the system using Docker Compose locally or into cloud environments (e.g. Render, AWS, DigitalOcean).

---

## 1. System Requirements & Port Allocation

| Component | Runtime | Default Port | Internal Service Name |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | PostgreSQL 15 | `5432` | `attendance_db` |
| **NestJS Backend API** | Node.js 20+ | `3001` (dev: 3000) | `attendance_nestjs_api` |
| **FastAPI Vision Microservice**| Python 3.10+ | `8000` | `attendance_ai_service` |
| **Next.js Web Frontend** | Next.js 16 | `3000` | `attendance_frontend` |

---

## 2. Local Docker Compose Deployment

Run the complete multi-service stack with a single command:

```powershell
cd "e:\attendence system"
docker-compose up --build -d
```

### Health Verification:
* Database: `docker-compose exec postgres pg_isready -U admin -d attendance_platform`
* NestJS API: `curl http://localhost:3000/attendance/clock`
* Python AI Engine: `curl http://localhost:8000/health`

---

## 3. Cloud Deployment (Render Blueprint)

The repository includes `render.yaml` defining:
1. **`attendance-api`**: Node.js web service running NestJS production bundle.
2. **`attendance-ai`**: Dockerized Python FastAPI microservice.

### Required Environment Variables:
* `DATABASE_URL`: Managed PostgreSQL connection string (pooling enabled).
* `DIRECT_URL`: Direct PostgreSQL connection string (for Prisma migrations).
* `JWT_SECRET`: Cryptographically secure secret key (min 64 chars).
* `AI_SERVICE_URL`: Internal private network URL of the Python microservice (e.g. `http://attendance-ai:8000`).
* `NODE_ENV`: `production`
* `PORT`: `3001`
