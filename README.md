# 🌱 SmartSeason — Field Monitoring System

A full-stack web application for tracking crop progress across multiple fields during a growing season.

---

## Quick Start

### Prerequisites
- **Node.js** v18 or higher — https://nodejs.org
- **npm** v9 or higher (comes with Node.js)
- **VS Code** — https://code.visualstudio.com

---

## Setup Instructions

### Step 1 — Open in VS Code
```
File → Open Folder → select the `smartseason` folder
```

### Step 2 — Set up the Backend

Open the **integrated terminal** in VS Code (`Ctrl+`` ` `` or Terminal → New Terminal), then:

```bash
cd backend
npm install
```

This installs all backend dependencies (Express, SQLite, JWT, bcrypt).

**Seed the database with demo data:**
```bash
npm run seed
```

You should see:
```
Seed complete!
Demo credentials:
  Admin:  admin@smartseason.com / admin123
  Agent1: james@smartseason.com / agent123
  Agent2: aisha@smartseason.com / agent123
  Agent3: peter@smartseason.com / agent123
```

**Start the backend server:**
```bash
npm run dev
```

The API will be running at: `http://localhost:5000`

---

### Step 3 — Set up the Frontend

Open a **second terminal** in VS Code (`+` button in terminal panel), then:

```bash
cd frontend
npm install
```

This may take 2–3 minutes as it installs React and all dependencies.

**Start the frontend:**
```bash
npm start
```

The app will open automatically at: `http://localhost:3000`

---

## Demo Credentials

| Role  | Email                       | Password  |
|-------|-----------------------------|-----------|
| Admin | admin@smartseason.com       | admin123  |
| Agent | james@smartseason.com       | agent123  |
| Agent | aisha@smartseason.com       | agent123  |
| Agent | peter@smartseason.com       | agent123  |

---

## Project Structure

```
smartseason/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   │   ├── authController.js
│   │   │   ├── fieldsController.js
│   │   │   └── usersController.js
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT middleware
│   │   ├── models/
│   │   │   ├── db.js         # SQLite connection & schema
│   │   │   └── fieldStatus.js # Status computation logic
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── fields.js
│   │   │   └── users.js
│   │   ├── utils/
│   │   │   └── seed.js       # Demo data seeder
│   │   └── server.js         # Express entry point
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── auth/         # Login & Register pages
    │   │   ├── dashboard/    # Dashboard with charts
    │   │   ├── fields/       # Fields list, detail, form, agents
    │   │   ├── layout/       # Sidebar app layout
    │   │   └── shared/       # Reusable UI components
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── utils/
    │   │   └── api.js        # Axios instance
    │   ├── App.js            # Routes
    │   └── index.js
    ├── .env
    └── package.json
```

---

## Design Decisions

### Stack
- **Backend**: Node.js + Express — lightweight, fast, well-understood
- **Database**: SQLite (via better-sqlite3) — zero-config, file-based, perfect for this scope
- **Frontend**: React 18 + React Router v6 — component-based, widely adopted
- **Charts**: Recharts — declarative, React-native charting
- **Auth**: JWT (stored in localStorage) + bcrypt for passwords

### Field Status Logic

Status is computed server-side on every fetch using `fieldStatus.js`:

| Condition | Status |
|---|---|
| Stage = Harvested | **Completed** |
| Days since planting > expected crop duration | **At Risk** |
| Stage = Ready, no update in 14 days | **At Risk** |
| Stage = Planted after 21 days with no progression | **At Risk** |
| No update in 30 days (active field) | **At Risk** |
| Everything else | **Active** |

Each crop type has an expected lifecycle (e.g. Maize = 120 days, Tomato = 80 days). The progress percentage is `days_planted / expected_days * 100`, capped at 100%.

### Role-Based Access
- **Admin**: Full CRUD on fields, view all fields, manage assignments, see all agents
- **Agent**: Can only view assigned fields, add updates/observations to those fields

### API Design
RESTful with clear separation:
```
POST   /api/auth/login
GET    /api/fields          → admin: all; agent: assigned
GET    /api/fields/:id
POST   /api/fields          → admin only
PUT    /api/fields/:id      → admin only
DELETE /api/fields/:id      → admin only
POST   /api/fields/:id/updates → agent or admin
GET    /api/users/dashboard → role-scoped stats
GET    /api/users/agents    → admin only
```

---

## Assumptions Made

1. A field can be unassigned (no agent) — admin still manages it
2. Agents register with `role: agent`; role assignment at creation time
3. SQLite is sufficient for this assessment (PostgreSQL/MySQL swap is trivial — just change the db driver)
4. JWT tokens expire in 7 days; no refresh token flow for simplicity
5. Field status is computed dynamically (not stored), ensuring always-fresh derived data
6. Expected crop duration is a static lookup by crop type — in production this could be a DB table

---

## Running Both Servers

Keep **two terminals open** simultaneously:

| Terminal | Command | Port |
|---|---|---|
| Terminal 1 (backend) | `cd backend && npm run dev` | 5000 |
| Terminal 2 (frontend) | `cd frontend && npm start` | 3000 |

---

## Troubleshooting

**"Port 5000 already in use"**
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**"Module not found"**
```bash
cd backend && npm install
cd frontend && npm install
```

**Database reset**
```bash
cd backend
rm database.sqlite
npm run seed
```

**Frontend not connecting to backend**
- Ensure backend is running on port 5000
- Check `frontend/.env` has `REACT_APP_API_URL=http://localhost:5000/api`
- Check browser console for CORS errors

---

## Features Summary

- JWT authentication with role-based access (Admin / Agent)
- Field CRUD with crop type, planting date, stage, size, location
- Agent assignment to fields
- Field update history with notes, observations, weather
- Computed field status (Active / At Risk / Completed)
- Season progress bar per field
- Admin dashboard with Pie + Bar charts, agent overview, activity feed
- Agent dashboard scoped to assigned fields
- Responsive design (mobile sidebar)
- Demo seed data (10 fields, 4 users, real-world crop types)
