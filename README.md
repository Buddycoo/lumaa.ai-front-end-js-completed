# 🚀 Lumaa AI - Complete JavaScript Stack

> **MIGRATION COMPLETE!** Full application converted to JavaScript (Express.js + React + Prisma + PostgreSQL)

---

## ⚡ Quick Start (Choose One)

### Option 1: Run Everything (Easiest)
```bash
./start_all.sh        # Mac/Linux
start_all.bat         # Windows
```

### Option 2: Run Separately

**Terminal 1 - Landing Page:**
```bash
cd landing-page && node start.js
```

**Terminal 2 - Dashboard:**
```bash
cd dashboard && node start.js
```

---

## 🌐 Access

- **Landing Page**: http://localhost:3000
- **Dashboard**: http://localhost:4000
  - Admin: `admin@lumaa.ai` / `pass` (PIN: 1234)
  - User: `user@lumaa.ai` / `pass` (PIN: 5678)

---

## 📦 Tech Stack

**Backend**: Express.js + Prisma + PostgreSQL
**Frontend**: React + Tailwind CSS + Zustand
**Database**: PostgreSQL (shared by both servers)

---

## 📂 Structure

```
lumaa-ai/
├── landing-page/
│   ├── backend/      Express.js (contact form API)
│   ├── frontend/     React landing page
│   └── start.js     ← Run this
│
├── dashboard/
│   ├── backend/      Express.js + Prisma (full API)
│   ├── frontend/     React dashboard
│   └── start.js     ← Run this
│
└── start_all.sh     ← Or run this for both
```

---

## ✨ Features

✅ Landing page with Spline 3D & contact form
✅ Complete authentication (JWT, password reset, PIN)
✅ Admin panel (user management, pause with reason + PIN 1509)
✅ User dashboard (call logs, bot settings, leads, payments)
✅ In-app notifications
✅ Real-time metrics & overview
✅ Role-based access control
✅ Paused users see blocking modal with reason

---

## 🛑 Stop Servers

Press **Ctrl + C** in the terminals

---

## 📖 Documentation

See [START_HERE.md](./START_HERE.md) for detailed info.

---

**Made with ❤️ - Full JavaScript Migration Complete!**
