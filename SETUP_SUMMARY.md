# Setup Summary - Visual Flow

## 🚀 Quick Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PREREQUISITES CHECK                       │
├─────────────────────────────────────────────────────────────┤
│  ✓ Node.js (v16+) installed                                 │
│  ✓ npm installed                                             │
│  ✓ Google account for Firebase                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              STEP 1: INSTALL DEPENDENCIES                     │
├─────────────────────────────────────────────────────────────┤
│  $ cd "D:\Tech sprint"                                        │
│  $ npm install                                               │
│                                                               │
│  ✓ Creates node_modules/ folder                              │
│  ✓ Downloads all required packages                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              STEP 2: FIREBASE SETUP                           │
├─────────────────────────────────────────────────────────────┤
│  1. Go to console.firebase.google.com                        │
│  2. Create new project                                       │
│  3. Enable Authentication (Email/Password)                   │
│  4. Create Firestore Database (test mode)                    │
│  5. Enable Storage (test mode)                               │
│  6. Get config values from Project Settings                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         STEP 3: CREATE .env.local FILE                       │
├─────────────────────────────────────────────────────────────┤
│  Create file: .env.local in project root                     │
│                                                               │
│  Add your Firebase config:                                  │
│  VITE_FIREBASE_API_KEY=...                                   │
│  VITE_FIREBASE_AUTH_DOMAIN=...                               │
│  VITE_FIREBASE_PROJECT_ID=...                                │
│  VITE_FIREBASE_STORAGE_BUCKET=...                            │
│  VITE_FIREBASE_MESSAGING_SENDER_ID=...                       │
│  VITE_FIREBASE_APP_ID=...                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         STEP 4: START DEVELOPMENT SERVER                      │
├─────────────────────────────────────────────────────────────┤
│  $ npm run dev                                               │
│                                                               │
│  ✓ Server starts on http://localhost:3000                   │
│  ✓ Browser opens automatically                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│         STEP 5: CREATE ADMIN USER                            │
├─────────────────────────────────────────────────────────────┤
│  Option A: Register → Update role in Firestore              │
│  Option B: Create directly in Firestore + Auth              │
│                                                               │
│  ✓ Change role to "admin" in Firestore                      │
│  ✓ Logout and login again                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    ✅ READY TO USE!                          │
├─────────────────────────────────────────────────────────────┤
│  • Login as Admin                                            │
│  • Create users, classes, announcements                      │
│  • Test all features                                         │
└─────────────────────────────────────────────────────────────┘
```

## 📋 File Checklist

Before starting, verify you have these files:

```
D:\Tech sprint\
├── 📁 src/
│   ├── 📁 components/
│   │   ├── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── 📁 config/
│   │   └── firebase.js
│   ├── 📁 context/
│   │   └── AuthContext.jsx
│   ├── 📁 pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── TeacherDashboard.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── ParentDashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Unauthorized.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── .env.local (YOU NEED TO CREATE THIS)
```

## 🔑 Key Configuration Points

### Firebase Services Required:
- ✅ Authentication (Email/Password)
- ✅ Firestore Database
- ✅ Storage

### Environment Variables Required:
- ✅ VITE_FIREBASE_API_KEY
- ✅ VITE_FIREBASE_AUTH_DOMAIN
- ✅ VITE_FIREBASE_PROJECT_ID
- ✅ VITE_FIREBASE_STORAGE_BUCKET
- ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
- ✅ VITE_FIREBASE_APP_ID

## 🎯 Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Documentation Files

- **[DETAILED_SETUP_GUIDE.md](./DETAILED_SETUP_GUIDE.md)** - Complete step-by-step guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference guide
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebase-specific configuration
- **[README.md](./README.md)** - Project overview

## ⚠️ Important Notes

1. **`.env.local` file is REQUIRED** - Without it, the app won't connect to Firebase
2. **Firebase must be in test mode** - For development, use test mode security rules
3. **First admin user** - Must be created manually in Firestore
4. **Restart server** - After creating `.env.local`, restart `npm run dev`

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid API key" | Check `.env.local` file exists and has correct values |
| "Permission denied" | Ensure Firestore is in test mode |
| Blank page | Check browser console (F12) for errors |
| Can't see admin features | Verify role is "admin" in Firestore, logout/login |

## 🎉 Success Indicators

You'll know setup is complete when:
- ✅ `npm run dev` starts without errors
- ✅ Browser opens to login page
- ✅ Can register a new account
- ✅ Can login and see dashboard
- ✅ Admin can create users/classes

---

**Need detailed instructions?** → See [DETAILED_SETUP_GUIDE.md](./DETAILED_SETUP_GUIDE.md)




