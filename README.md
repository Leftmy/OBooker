# OBooker - Meeting Room Booking Platform

OBooker is a web application for booking office meeting rooms. It features an interactive weekly schedule grid, automatic timezone conversions, recurring bookings, room filtering, and database-level race condition protection.

---

## Quick Start (Docker Compose)

The entire application stack (Frontend, Backend API, and PostgreSQL database) is configured to run with a single command.

### 1. Run the Application

```bash
docker compose up --build

```

Database migrations and initial data seeding (rooms, demo users, and bookings) execute automatically on startup.

### 2. Service Endpoints

* **Frontend App:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:4000](http://localhost:4000)
* **Swagger API Documentation:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## Test User Credentials

The database comes pre-seeded with the following test accounts:

| Role / Description | Email | Password | Email Status |
| --- | --- | --- | --- |
| **Primary User** | `user1@example.com` | `Password123!` | Confirmed |
| **Secondary User** | `user2@example.com` | `Password123!` | Confirmed |
| **Unconfirmed User** | `unconfirmed@example.com` | `Password123!` | Pending Confirmation |

---

## Architecture & Technical Implementation

### 1. Timezone Management

* **Database Storage:** All dates and booking timestamps are stored strictly in **UTC** format (`ISO 8601`).


* **Office Working Hours:** Fixed between **09:00 and 19:00** in the office timezone (`Europe/Kyiv`). Server-side validation converts incoming UTC booking requests to `Europe/Kyiv` time to verify working hours compliance.


* **Client Display:** The frontend automatically detects the user's browser timezone. Time slots are rendered shifted according to the user's local timezone (e.g., `10:00–10:30 Kyiv` displays as `09:00–09:30 Berlin`). An informational indicator displays the office timezone reference whenever browser time differs from Kyiv time.



### 2. Booking Overlap Validation

Validation is enforced both at the application logic layer and at the database boundary. Two time intervals $[Start_A, End_A)$ and $[Start_B, End_B)$ conflict if and only if:

$$Start_A < End_B \quad \text{AND} \quad End_A > Start_B$$

Back-to-back (adjacent) bookings (e.g., `10:00–11:00` and `11:00–12:00`) do not overlap and are valid.

### 3. Race Condition Protection

To prevent double bookings when multiple users attempt to reserve the exact same slot concurrently:

* Booking creation runs inside isolated database transactions (`SERIALIZABLE` or pessimistic locking via `SELECT ... FOR UPDATE`).
* A PostgreSQL exclusion constraint (`EXCLUDE USING gist`) prevents overlapping time ranges for the same `room_id`.
* If a concurrent conflict occurs, the losing transaction rolls back gracefully and returns a clear conflict error message to the client.


---

## ⭐ Implemented Bonus Features

* [x] **Docker Compose Setup:** Single-command deployment for all services.


* [x] **Race Condition Protection:** Transactional isolation and database constraints against concurrent slot claims.


* [x] **API Integration & E2E Tests:** Automated end-to-end tests covering booking lifecycle and validation rejections.


* [x] **Room Filtering & Sorting:** Real-time client-side modal filtering by room capacity, floor, search query, and sorting options.


* [x] **Mobile Responsive UI:** Fully mobile-optimized schedule grid and navigation.



---

## Testing

To run unit tests verifying slot overlap logic (adjacent slots, partial overlap, exact match, cross-day scenarios):

```bash
npm run test

```

To run API integration / E2E tests:

```bash
npm run test:e2e

```

---

## Local Development (Without Docker)

### Prerequisites

* Node.js (v18+)
* PostgreSQL (v14+)

### Manual Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env

```


2. Install dependencies, run migrations, seed data, and start the backend:
```bash
npm install
npm run migration:run
npx prisma db seed
npm run start:dev

```


3. In a separate terminal, start the frontend client:
```bash
cd client
npm install
npm run dev

```