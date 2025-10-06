# 🚀 Lumaa AI - Quick Start Guide

## Super Simple Setup (2 Steps Only!)

### Prerequisites
- Install **PostgreSQL** (database): https://www.postgresql.org/download/
- Install **Python 3.11+**: https://www.python.org/downloads/
- Install **Node.js 16+**: https://nodejs.org/

---

## Step 1: Setup PostgreSQL Database (One-time only)

Open PostgreSQL terminal (psql) and run:
```sql
CREATE DATABASE lumaa_ai_db;
```

---

## Step 2: Run the Application

### On Mac/Linux:

**Terminal 1 - Backend:**
```bash
chmod +x start_backend.sh
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
chmod +x start_frontend.sh
./start_frontend.sh
```

### On Windows:

**Terminal 1 - Backend:**
```cmd
start_backend.bat
```

**Terminal 2 - Frontend:**
```cmd
start_frontend.bat
```

---

## 🎯 Access Your App

Open browser: **http://localhost:3000**

**Login Credentials:**
- **Admin**: admin@lumaa.ai / pass (PIN: 1509)
- **User**: user@lumaa.ai / pass (PIN: 5678)

---

## ⚙️ Important: First Time Setup

When you run `start_backend.sh` for the first time:

1. It will create a `.env` file in the `backend` folder
2. **PAUSE** and edit `backend/.env`
3. Replace `YOUR_PASSWORD` with your PostgreSQL password
4. Press Enter to continue

Example:
```env
DATABASE_URL="postgresql+psycopg2://postgres:mypassword123@localhost:5432/lumaa_ai_db"
```

---

## 🛑 Stopping the Application

Press `Ctrl + C` in both terminals to stop the servers.

---

## 🔄 Next Time

Just run the same two files - no setup needed:
- `./start_backend.sh` (or `.bat`)
- `./start_frontend.sh` (or `.bat`)

---

## ✅ What Each Script Does Automatically

**Backend Script:**
- ✅ Creates Python virtual environment (if needed)
- ✅ Installs all Python packages
- ✅ Creates .env configuration file
- ✅ Runs database migrations
- ✅ Starts FastAPI server on port 8001

**Frontend Script:**
- ✅ Installs all Node packages (if needed)
- ✅ Creates .env configuration file
- ✅ Starts React dev server on port 3000

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error?
Make sure:
1. PostgreSQL is running
2. Database `lumaa_ai_db` exists
3. Password in `backend/.env` is correct

### Port Already in Use?
**Kill port 8001 (backend):**
```bash
# Mac/Linux
lsof -ti:8001 | xargs kill -9

# Windows
netstat -ano | findstr :8001
taskkill /PID [PID_NUMBER] /F
```

**Kill port 3000 (frontend):**
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

---

## 📂 Project Structure

```
lumaa-ai/
├── start_backend.sh      ← Run this in Terminal 1
├── start_frontend.sh     ← Run this in Terminal 2
├── backend/              ← Python FastAPI backend
└── frontend/             ← React frontend
```

---

## 🎓 Development Tips

- **Hot Reload**: Both servers auto-reload when you save changes
- **Backend URL**: http://localhost:8001
- **Frontend URL**: http://localhost:3000
- **API Docs**: http://localhost:8001/docs (Swagger UI)

---

That's it! Just 2 commands and you're running! 🚀