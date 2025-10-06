# 🚀 Lumaa AI - Complete JavaScript Version

## ✅ MIGRATION COMPLETE!

Everything has been converted to JavaScript (Node.js + Express.js + React).

---

## 🎯 Super Simple Startup

### Prerequisites (One-time):
1. **PostgreSQL** - Already configured ✅
2. **Node.js 16+** - [Download](https://nodejs.org/)

---

## 🚀 Run the Application (2 Commands Only!)

### Terminal 1 - Landing Page:
```bash
cd landing-page
node start.js
```
**Opens at:** http://localhost:3000

### Terminal 2 - Dashboard:
```bash
cd dashboard
node start.js
```
**Opens at:** http://localhost:4000

---

## 🌐 Access Your Apps:

### Landing Page:
- **URL**: http://localhost:3000
- **Features**: Landing page with contact form, SEO, Spline 3D

### Dashboard:
- **URL**: http://localhost:4000
- **Login**:
  - Admin: `admin@lumaa.ai` / `pass` (PIN: 1509)
  - User: `user@lumaa.ai` / `pass` (PIN: 5678)

---

## 📂 Project Structure

```
lumaa-ai/
├── landing-page/
│   ├── backend/          # Express.js (port 3001)
│   ├── frontend/         # React (port 3000)
│   └── start.js         ← Run this for landing page
│
├── dashboard/
│   ├── backend/          # Express.js + Prisma (port 4001)
│   ├── frontend/         # React (port 4000)
│   └── start.js         ← Run this for dashboard
│
└── START_HERE.md        ← You are here
```

---

## 🎨 What Each Server Does

### Landing Page (Port 3000 + 3001):
- ✅ Landing page with dark theme
- ✅ Spline 3D animation
- ✅ Contact form (sends to dashboard)
- ✅ SEO optimized
- ✅ Login button redirects to dashboard

### Dashboard (Port 4000 + 4001):
- ✅ Complete authentication system
- ✅ Admin panel (user management, pause users with PIN 1509)
- ✅ User dashboard (call logs, bot settings, leads, payments)
- ✅ Password management (change, forgot password)
- ✅ Notification system
- ✅ Real-time metrics
- ✅ All existing features preserved

---

## 🛑 Stop Servers

Press **Ctrl + C** in each terminal

---

## ⚙️ Backend Technology

**Old**: Python + FastAPI
**New**: Node.js + Express.js + Prisma ✅

All features migrated successfully!

---

## 🔧 Environment Variables

Already configured:

**Landing Page Backend** (`landing-page/backend/.env`):
```env
PORT=3001
DASHBOARD_API=http://localhost:4001
```

**Dashboard Backend** (`dashboard/backend/.env`):
```env
PORT=4001
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

**Frontends**:
- Landing: `REACT_APP_BACKEND_URL=http://localhost:3001`
- Dashboard: `REACT_APP_BACKEND_URL=http://localhost:4001`

---

## ✨ Features Working

✅ Landing page with contact form
✅ User authentication (login, password reset, PIN)
✅ Admin dashboard (user management, pause with reason + PIN)
✅ User dashboard (call logs, bot settings, leads)
✅ Notifications (in-app, contact form → admin)
✅ Payment system
✅ Real-time overview metrics
✅ Password management
✅ Role-based access control
✅ Paused users can login (see blocking modal)

---

## 🎉 That's It!

Just run 2 commands and everything works!

**Happy coding! 🚀**