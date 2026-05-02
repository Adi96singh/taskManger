# 🚀 PulseBoard — Team Task Manager

A full-stack team task management application with a futuristic dark UI featuring glassmorphism, neon accents, and smooth animations.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Tech Stack](https://img.shields.io/badge/Flask-3.1-000000?style=flat-square&logo=flask)
![Tech Stack](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Tech Stack](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens)

---

## ✨ Features

### Authentication & Authorization
- JWT-based signup/login with bcrypt password hashing
- Role-based access (Admin / Member)
- Protected API routes and frontend routes
- First user auto-promoted to admin

### Project Management
- Create, view, and delete projects
- Add/remove team members by email
- Project progress tracking with visual indicators
- Owner-based permissions

### Task System
- Create tasks with title, description, priority, deadline
- Assign tasks to project members
- Kanban-style columns (Todo → In Progress → Done)
- Status transitions with single click
- Priority levels (Low / Medium / High)
- Search and filter by status/priority
- Overdue detection with pulsing glow effect

### Smart Dashboard
- Real-time stats (Total, Completed, In Progress, Overdue)
- Animated SVG progress ring
- Recent activity feed
- Personal task statistics

### My Tasks View
- All tasks assigned to you across all projects
- Quick status toggle
- Mini stat indicators

### UI/UX
- Dark futuristic theme with glassmorphism
- Neon cyan/purple accent colors
- Smooth loading skeletons (no spinners)
- Animated hover effects and micro-interactions
- Toast notification system
- Responsive design

---

## 🛠️ Tech Stack

| Layer      | Technology        |
|------------|-------------------|
| Frontend   | React 18          |
| Styling    | Vanilla CSS       |
| Backend    | Flask (Python)    |
| Database   | MongoDB           |
| Auth       | JWT + bcrypt      |
| HTTP       | Axios             |
| Deployment | Railway-ready     |

---

## 📁 Project Structure

```
PulseBoard/
├── Backend/
│   ├── app.py                 # Flask app factory
│   ├── config.py              # Environment config
│   ├── Procfile               # Railway deployment
│   ├── runtime.txt            # Python version
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   ├── models/
│   │   ├── user.py            # User model + schemas
│   │   ├── project.py         # Project model + schemas
│   │   └── task.py            # Task model + schemas
│   ├── routes/
│   │   ├── auth.py            # Auth endpoints
│   │   ├── projects.py        # Project CRUD
│   │   └── tasks.py           # Task CRUD + dashboard
│   └── middleware/
│       └── auth_middleware.py  # JWT & role decorators
│
└── pulseboard-frontend/
    ├── public/index.html
    ├── .env
    ├── package.json
    └── src/
        ├── index.js
        ├── index.css              # Global design system
        ├── App.js                 # Routes & providers
        ├── api/api.js             # Axios API client
        ├── context/
        │   ├── AuthContext.js     # Auth state management
        │   └── ToastContext.js    # Toast notifications
        └── components/
            ├── Auth/Login.js
            ├── Auth/Signup.js
            ├── Layout/Layout.js
            ├── Dashboard/Dashboard.js
            ├── Projects/Projects.js
            ├── Projects/ProjectDetail.js
            ├── Tasks/MyTasks.js
            └── common/ProgressRing.js
```

---

## 📊 MongoDB Schema Design

### Users Collection
```json
{
  "_id": "ObjectId",
  "username": "string (unique)",
  "email": "string (unique, lowercase)",
  "password": "string (bcrypt hash)",
  "role": "string (admin | member)",
  "avatar_color": "string (hsl)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Projects Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "owner_id": "ObjectId (ref: users)",
  "members": ["ObjectId (ref: users)"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Tasks Collection
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "project_id": "ObjectId (ref: projects)",
  "assigned_to": "ObjectId (ref: users)",
  "created_by": "ObjectId (ref: users)",
  "status": "string (todo | in_progress | done)",
  "priority": "string (low | medium | high)",
  "deadline": "datetime | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint         | Description          | Auth |
|--------|------------------|----------------------|------|
| POST   | /api/auth/signup  | Register new user    | No   |
| POST   | /api/auth/login   | Login & get token    | No   |
| GET    | /api/auth/me      | Get current profile  | Yes  |
| GET    | /api/auth/users   | List all users       | Yes  |

### Projects
| Method | Endpoint                              | Description          | Auth |
|--------|---------------------------------------|----------------------|------|
| POST   | /api/projects                         | Create project       | Yes  |
| GET    | /api/projects                         | List user's projects | Yes  |
| GET    | /api/projects/:id                     | Get project detail   | Yes  |
| DELETE | /api/projects/:id                     | Delete project       | Owner|
| POST   | /api/projects/:id/members             | Add member           | Owner|
| DELETE | /api/projects/:id/members/:memberId   | Remove member        | Owner|

### Tasks
| Method | Endpoint                      | Description              | Auth   |
|--------|-------------------------------|--------------------------|--------|
| POST   | /api/tasks/project/:projectId | Create task              | Member |
| GET    | /api/tasks/project/:projectId | List project tasks       | Member |
| PUT    | /api/tasks/:id                | Update task              | Member |
| DELETE | /api/tasks/:id                | Delete task              | Owner  |
| GET    | /api/tasks/my                 | Get my tasks             | Yes    |
| GET    | /api/tasks/dashboard          | Dashboard stats          | Yes    |

---

## ⚡ Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env with your MongoDB URI and JWT secret

# Run the server
python app.py
```

Backend runs at: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd pulseboard-frontend

# Install dependencies
npm install

# Configure environment
# Edit .env — set REACT_APP_API_URL to your backend URL

# Run dev server
npm start
```

Frontend runs at: `http://localhost:3000`

### 3. MongoDB Setup

**Local MongoDB:**
- Install MongoDB Community Server
- Start mongod service
- Use URI: `mongodb://localhost:27017/pulseboard`

**MongoDB Atlas (recommended for deployment):**
1. Create free cluster at mongodb.com
2. Create database user
3. Whitelist IP (or use 0.0.0.0/0 for Railway)
4. Get connection string
5. Replace `<username>`, `<password>` in the URI

---

## 🚀 Deployment (Railway)

### Backend Deployment

1. Push `Backend/` to a GitHub repo
2. Go to [railway.app](https://railway.app)
3. New Project → Deploy from GitHub repo
4. Add environment variables:
   - `MONGO_URI` = your MongoDB Atlas URI
   - `JWT_SECRET_KEY` = a strong random string
   - `PORT` = 5000
5. Railway auto-detects `Procfile` and deploys

### Frontend Deployment

1. Update `.env`:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```
2. Push `pulseboard-frontend/` to GitHub
3. Deploy on Railway (or Vercel/Netlify):
   - Build command: `npm run build`
   - Output directory: `build`

---

## 🎯 Usage Flow

1. **Sign up** — First user automatically becomes admin
2. **Create a project** — Click "New Project" on Projects page
3. **Add team members** — Use "Add Member" button (by email)
4. **Create tasks** — Click "New Task" inside a project
5. **Track progress** — Dashboard shows real-time insights
6. **Manage tasks** — Click → to advance task status

---

## 📄 License

MIT License — free to use, modify, and distribute.
