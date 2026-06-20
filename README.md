# Student Management System

A full-stack student management application featuring CRUD operations, academic mark management, pagination, search, validation, and a premium dark-themed glassmorphism interface.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (pg pool connection)
- **Frontend**: React.js, Vite, Tailwind CSS v4
- **API Client**: Axios, React Router Dom

---

## 🔗 Live Demo

- **Walkthrough Video**: https://www.loom.com/share/da2631a86e2143d49d74dcca5b0d0092
- **Frontend Application**: https://student-management-system-ute1.vercel.app/
- **Backend API Base**: `https://student-management-system-production-4cd2.up.railway.app/api`
- **API Health Check**: `https://student-management-system-production-4cd2.up.railway.app/api/health`

---

## 📂 Project Structure

```
student-management-system/
├── backend/
│   ├── src/
│   │   ├── config/db.js                 # DB connection pool setup
│   │   ├── controllers/
│   │   │   ├── student.controller.js    # Student CRUD & pagination
│   │   │   └── marks.controller.js      # Marks CRUD handlers
│   │   ├── routes/
│   │   │   ├── student.routes.js        # REST endpoints for Students
│   │   │   └── marks.routes.js          # REST endpoints for Marks
│   │   ├── middlewares/
│   │   │   ├── validate.js              # Field type & constraint validator
│   │   │   └── errorHandler.js          # Centralized standardized JSON error shape
│   │   ├── db/schema.sql                # Normalized schema definition
│   │   └── app.js                       # Express app wiring
│   ├── server.js                        # Server entry listener
│   ├── .env.example
│   └── postman_collection.json          # Pre-configured Postman tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StudentList.jsx          # Dashboard, registry table, search & pagination controls
│   │   │   ├── StudentDetail.jsx        # Detailed profile card, stats, academic marks table
│   │   │   ├── StudentForm.jsx          # Validation-heavy modal for student creation/edits
│   │   │   └── Toast.jsx                # Self-clearing CRUD feedback alerts
│   │   ├── services/api.js              # Axios-driven API handlers
│   │   ├── App.jsx                      # Navigation, routes, and global notifications layout
│   │   ├── index.css                    # Tailwind CSS v4 directive and global glassmorphic design theme
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

---

## 🚀 Setup & Installation

### 1. Database Setup
Ensure PostgreSQL is active on your system.
Create the database and load the schema:
```bash
# Create student_db
createdb student_db

# Load schema
psql -d student_db -f backend/src/db/schema.sql
```

### 2. Backend Setup
Configure your environment and launch the backend server:
```bash
cd backend

# Copy environment variables template
cp .env.example .env

# Adjust connection credentials in .env if needed:
# PORT=5001
# DATABASE_URL=postgresql://<user>:<password>@localhost:5432/student_db

# Install dependencies and start server
npm install
npm start
```
The server will boot up and bind to `http://localhost:5001`. A health check endpoint is active at `http://localhost:5001/api/health`.

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite hot-reload server
npm run dev
```
Open the browser at the local Vite address (typically `http://localhost:5173`).

---

## 💾 Database Design & Normalization

The schema divides data into two normalized tables maintaining a **1:N relationship** with strong relational integrity rules:

### Normalization Rationale
- **1NF / 2NF / 3NF Compliance**: All student profile properties (`first_name`, `last_name`, `email`, etc.) are independent non-composite attributes in the `students` table. Academic marks are stored in a separate table (`marks`), eliminating multi-valued columns and update/insert/delete anomalies.
- **Referential Integrity**: A foreign key `student_id` references `students(id)` using `ON DELETE CASCADE`. When a student is deleted, all their academic marks are cleaned up from the database automatically.
- **Data Safeguards**:
  - `CHECK (score >= 0 AND score <= 100)` enforces logical score limits directly at the storage level.
  - `UNIQUE(student_id, subject, exam_type)` prevents double logs of academic scores for the same subject within the same exam term.

---

## 🔗 REST API Endpoints

### Student Actions
- `GET /api/students?page=1&limit=5` — Retrieve paginated students.
- `POST /api/students` — Register a student (with validation).
- `GET /api/students/:id` — Retrieve student details + nested list of marks.
- `PUT /api/students/:id` — Update student fields (with validation).
- `DELETE /api/students/:id` — Delete student (cascades marks).

### Marks Actions
- `POST /api/students/:studentId/marks` — Record a mark.
- `GET /api/students/:studentId/marks` — Get marks list.
- `PUT /api/marks/:id` — Edit an exam mark.
- `DELETE /api/marks/:id` — Remove an exam mark.

---

## 💡 Assumptions Made

1. **No Authentication Required**: Based on the project requirements, endpoints are public with no security headers or OAuth middlewares.
2. **Subject Scores Constraints**: Marks are unique per student for any specific `(subject, exam_type)` tuple. For example, a student can have one `Mathematics` mark for `final` and one for `midterm`, but not two for `final`.
3. **Pagination Default**: Paginated list default parameters are `page = 1` and `limit = 10`.