# TaskFlow — Full Stack Project Management App

## Stack
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React 18 + React Router v6
- **Auth**: JWT (stored in localStorage)
- **Roles**: `Admin` | `Member`

---

## Project Structure

```
taskflow/
├── backend/               ← Your existing backend files
│   ├── server.js
│   ├── src/
│   │   ├── app.js         ← Use BACKEND_app.js (has CORS fix)
│   │   ├── config/db.js   ← MongoDB connection
│   │   ├── models/
│   │   │   ├── authModel.js   (User)
│   │   │   ├── projectModel.js
│   │   │   └── taskModel.js
│   │   ├── controllers/
│   │   │   ├── authControllers.js
│   │   │   ├── projectControllers.js
│   │   │   ├── taskControllers.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   └── routes/
│   │       ├── authRoutes.js
│   │       ├── projectRoutes.js
│   │       ├── taskRoutes.js
│   │       └── dashboardRoutes.js
│   └── package.json
│
└── taskflow-frontend/     ← This React frontend
    ├── public/index.html
    ├── package.json
    ├── .env
    └── src/
        ├── index.js
        ├── App.jsx              ← Routes
        ├── api/index.js         ← All API calls
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── common/
        │   │   ├── ProtectedRoute.jsx
        │   │   ├── Modal.jsx
        │   │   └── Badges.jsx
        │   └── layout/
        │       ├── Sidebar.jsx
        │       └── AppLayout.jsx
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.jsx
        │   │   └── Signup.jsx
        │   ├── dashboard/Dashboard.jsx
        │   ├── projects/
        │   │   ├── Projects.jsx
        │   │   └── ProjectDetail.jsx
        │   ├── tasks/MyTasks.jsx
        │   └── team/Team.jsx
        └── styles/globals.css
```

---

## Backend Setup

### 1. Fix app.js — add CORS
Replace your `src/app.js` content with `BACKEND_app.js` (already included in this folder).

### 2. Fix db.js — proper MongoDB connection
Your `src/config/db.js` should be:
```js
const mongoose = require('mongoose');
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};
module.exports = connectDB;
```

### 3. Backend .env
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskflow
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

### 4. Run backend
```bash
cd backend
npm install
npm run dev     # nodemon src/index.js  (note: your entry is server.js — fix scripts.start in package.json)
```
> **Note**: Your `package.json` has `"main": "src/index.js"` but your entry file is `server.js`.
> Fix: change `"start": "node server.js"` and `"dev": "nodemon server.js"`.

---

## Frontend Setup

### 1. Install & configure
```bash
cd taskflow-frontend
npm install
```

### 2. .env (already created)
```
REACT_APP_API_URL=http://localhost:5000/api
```
For production (Railway), set:
```
REACT_APP_API_URL=https://your-backend.up.railway.app/api
```

### 3. Run frontend
```bash
npm start    # starts on http://localhost:3000
```

---

## API Mapping (Frontend ↔ Backend)

| Action | Method | Endpoint | Auth | Role |
|---|---|---|---|---|
| Sign up | POST | `/api/auth/signup` | — | — |
| Login | POST | `/api/auth/login` | — | — |
| Dashboard stats | GET | `/api/dashboard` | ✓ | Any |
| List projects | GET | `/api/projects` | ✓ | Any |
| Create project | POST | `/api/projects` | ✓ | Admin |
| Add member | POST | `/api/projects/:id/add-member` | ✓ | Admin |
| Get tasks | GET | `/api/tasks/:projectId` | ✓ | Any |
| Create task | POST | `/api/tasks` | ✓ | Any |
| Update task | PUT | `/api/tasks/:id` | ✓ | Any |

---

## Role-Based Access

| Feature | Admin | Member |
|---|---|---|
| Create projects | ✓ | ✗ |
| Add members to projects | ✓ | ✗ |
| View team page | ✓ | ✗ |
| Create tasks | ✓ | ✓ (in their projects) |
| Update task status | ✓ | ✓ (assigned tasks) |
| View dashboard | ✓ | ✓ |

---

## Railway Deployment

### Backend on Railway
1. Create new Railway project → "Deploy from GitHub"
2. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`
3. Railway auto-detects Node.js and runs `npm start`

### Frontend on Railway (or Vercel/Netlify)
1. Set `REACT_APP_API_URL` to your Railway backend URL
2. Build command: `npm run build`
3. Publish directory: `build`

---

## Key Implementation Notes

- **Token format**: Backend `authMiddleware.js` reads `req.headers.authorization` directly (no "Bearer " prefix). The frontend sends the raw token accordingly.
- **Role enum**: Must be exactly `'Admin'` or `'Member'` (capital first letter) to match mongoose schema.
- **Task status enum**: `'Todo'`, `'In Progress'`, `'Done'` — exact strings.
- **MongoDB ObjectIds**: Frontend uses `._id` field (not `.id`).
