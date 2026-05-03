# ⚡ TaskFlow — Team Task Management App

A full-stack collaborative task management application built with **React**, **Node.js/Express**, and **MongoDB**. Supports role-based access, kanban boards, real-time dashboards, and team collaboration.

---

## 🚀 Live Demo

> **URL:**(https://taskflow-production-bd82.up.railway.app)

---

## ✨ Features

### Authentication
- JWT-based signup & login
- Protected routes, token expiry handling
- Secure password hashing (bcryptjs)

### Projects
- Create projects with name, description, custom color
- Admin role auto-assigned to creator
- Add/remove members by email
- Role-based permissions (Admin / Member)

### Tasks
- Create tasks with title, description, due date, priority
- Assign to project members
- Three statuses: **To Do → In Progress → Done**
- Kanban board + list view
- Overdue detection

### Dashboard
- Total tasks, projects, completion rate
- Tasks by status (visual bars)
- Team workload visualization
- Overdue tasks alert
- My assigned tasks

### Role-Based Access
| Action | Admin | Member |
|--------|-------|--------|
| Create/Delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| Add/Remove members | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| View project | ✅ | ✅ |

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Styling | Custom CSS (no UI library) |
| Deployment | Railway |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── models/
│   │   ├── User.js       # User schema
│   │   ├── Project.js    # Project schema with members
│   │   └── Task.js       # Task schema
│   ├── routes/
│   │   ├── auth.js       # Signup, login, profile
│   │   ├── projects.js   # CRUD + member management
│   │   ├── tasks.js      # CRUD + status updates
│   │   └── dashboard.js  # Aggregate stats
│   ├── middleware/
│   │   └── auth.js       # JWT verification
│   └── server.js         # Entry point
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── Layout.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── SignupPage.js
│       │   ├── DashboardPage.js
│       │   ├── ProjectsPage.js
│       │   └── ProjectDetailPage.js
│       └── utils/
│           └── api.js
├── package.json
├── railway.toml
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |
| POST | `/api/projects/:id/members` | Add member (Admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (Admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?projectId=xxx` | Get tasks |
| POST | `/api/tasks` | Create task (Admin) |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Aggregated stats |

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/taskflow.git
cd taskflow

# 2. Install backend dependencies
cd backend
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 4. Install frontend dependencies
cd ../frontend
npm install

# 5. Start backend (from /backend)
npm run dev

# 6. Start frontend (from /frontend) — in another terminal
npm start
```

The app runs at `http://localhost:3000` with API at `http://localhost:5000`.

---

## 🚢 Deployment on Railway

### Steps

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/taskflow.git
git push -u origin main
```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub repo
   - Select your `taskflow` repository

3. **Add MongoDB**
   - In Railway: New → Database → MongoDB
   - Copy the `MONGODB_URL` variable

4. **Set environment variables** in Railway:
```
MONGODB_URI=<from Railway MongoDB plugin>
JWT_SECRET=your_super_secret_32_char_minimum_key
NODE_ENV=production
PORT=5000
```

5. **Build command** (set in Railway settings):
```
cd frontend && npm install && npm run build && cd ../backend && npm install
```

6. **Start command**:
```
node backend/server.js
```

7. **Generate domain** in Railway → Settings → Networking

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for JWT signing (min 32 chars) |
| `NODE_ENV` | ✅ | `production` or `development` |
| `PORT` | ❌ | Server port (default: 5000) |
| `FRONTEND_URL` | ❌ | Frontend URL for CORS |

---

## 🎥 Demo Video

> (https://www.loom.com/share/c392e2c272654404b8457f96b76361a5)

---

## 👨‍💻 Author

Built as a full-stack assignment demonstrating:
- RESTful API design
- JWT authentication
- MongoDB data modeling
- Role-based access control
- React state management
- Production deployment
--made by AMAN RAJ SINGH
