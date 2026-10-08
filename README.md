# ShiftOps

> Staff Operations Platform for small businesses

ShiftOps centralizes daily operational workflows — shifts, attendance, tasks, issue tracking, and shift handovers — replacing fragmented chat messages and spreadsheets.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Java 21 + Spring Boot 3.4 |
| Security | Spring Security + JWT |
| Database | PostgreSQL 16 (Docker) |
| Migrations | Flyway |
| Frontend | React 18 + TypeScript + Vite |
| State Management | TanStack Query |
| API Docs | SpringDoc OpenAPI |

## Prerequisites

- Java 21 (JDK)
- Node.js 20+
- Docker & Docker Compose

## Quick Start

### 1. Start PostgreSQL via Docker Compose

```bash
cd docker
docker compose up -d
```

This starts a PostgreSQL 16 container (`shiftops-postgres`) exposed on host port `5433` (mapped to container port `5432` to avoid host database conflicts). The container includes healthchecks and initializes the `shiftops` database for user `shiftops`.

### 2. Start Backend

```bash
cd backend
./gradlew bootRun
```

Backend runs at `http://localhost:8080/api`

- Health check: `GET http://localhost:8080/api/v1/health`
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Project Structure

```
shiftops/
├── backend/          # Spring Boot application
├── frontend/         # React + TypeScript application
├── docker/           # Docker Compose for infrastructure
├── docs/             # Documentation
└── README.md
```

## Development

### Running Tests

#### Backend Testing

The backend test suite is partitioned into fast unit/mock tests and full PostgreSQL container integration tests:

```bash
cd backend

# Run fast unit & MockMvc tests (no Docker required)
./gradlew test
# or explicitly:
./gradlew unitTest

# Run PostgreSQL 16 Testcontainers integration tests (requires Docker daemon)
./gradlew integrationTest
```

> **Note on Testcontainers:** The `integrationTest` task genuinely boots a PostgreSQL 16 container, applies Flyway migrations (`V1`–`V6`), and validates JPA entity schema against real PostgreSQL. It strictly requires Docker. If Docker is offline, `integrationTest` fails immediately and explicitly with `IllegalStateException` (no silent fallback).

#### Frontend Testing & Verification

```bash
cd frontend

# Run ESLint (0 errors enforced)
npm run lint

# Run TypeScript check & Vite production build
npm run build
```

## License

Proprietary — All rights reserved.
