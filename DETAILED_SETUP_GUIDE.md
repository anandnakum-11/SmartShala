# Detailed Step-by-Step Setup Guide

This guide will walk you through every step needed to get your School Management System up and running.

---

## 📋 Prerequisites Check

Before starting, ensure you have:

1. **Node.js installed** (version 16 or higher)
   - Check: Open terminal/command prompt and type: `node --version`
   - If not installed: Download from [nodejs.org](https://nodejs.org/)
   - Recommended: LTS version

2. **npm installed** (comes with Node.js)
   - Check: Type `npm --version` in terminal
   - Should show version number

3. **A Google account** (for Firebase)
   - You'll need this to create a Firebase project

4. **A code editor** (optional but recommended)
   - VS Code, WebStorm, or any editor you prefer

---

## Step 1: Verify Project Files

Make sure you have all the project files in your workspace:

```
D:\Tech sprint\
├── src/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

If files are missing, the project won't work properly.

---

## Step 2: Install Dependencies

1. **Open Terminal/Command Prompt**
   - Windows: Press `Win + R`, type `cmd`, press Enter
   - Or right-click in project folder → "Open in Terminal"
   - Or use VS Code terminal: `Ctrl + ~`

2. **Navigate to Project Directory**
   ```bash
   cd "D:\Tech sprint"
   ```
   (Adjust path if your project is in a different location)

3. **Install All Dependencies**
   ```bash
   npm install
   ```
   
   This will:
   - Download React, Firebase, and all required packages
   - Create a `node_modules` folder
   - Take 1-3 minutes depending on internet speed
   
   **Expected Output:**
   ```
   added 234 packages, and audited 235 packages in 45s
   ```

4. **Verify Installation**
   - Check that `node_modules` folder was created
   - No error messages should appear

---

## Step 3: Create Firebase Project

### 3.1 Access Firebase Console

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Click **"Add project"** or **"Create a project"**

### 3.2 Project Setup Wizard

**Step 1: Project Name**
- Enter a name: `school-management-system` (or any name you prefer)
- Click **"Continue"**

**Step 2: Google Analytics** (Optional)
- You can enable or disable this
- For learning/testing: **Disable** is fine
- Click **"Continue"** or **"Create project"**

**Step 3: Wait for Creation**
- Firebase will create your project (takes 30-60 seconds)
- Click **"Continue"** when ready

---

## Step 4: Enable Firebase Authentication

1. **In Firebase Console**, you should see your project dashboard
2. Click on **"Authentication"** in the left sidebar
3. Click **"Get started"** button
4. Click on the **"Sign-in method"** tab (at the top)
5. Click on **"Email/Password"** from the list
6. Toggle **"Enable"** to ON
7. Leave "Email link (passwordless sign-in)" as OFF (unless you want it)
8. Click **"Save"**

✅ **Verification:** You should see "Email/Password" with a green checkmark

---

## Step 5: Create Firestore Database

1. **In Firebase Console**, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"** button
3. **Security Rules Selection:**
   - For development/testing: Select **"Start in test mode"**
   - ⚠️ **Important:** This allows all reads/writes. Only for development!
   - Click **"Next"**
4. **Location Selection:**
   - Choose a location closest to you (e.g., `us-central`, `europe-west`, `asia-south1`)
   - Click **"Enable"**
5. **Wait for Database Creation** (30-60 seconds)

✅ **Verification:** You should see an empty Firestore database interface

---

## Step 6: Enable Firebase Storage

1. **In Firebase Console**, click **"Storage"** in the left sidebar
2. Click **"Get started"** button
3. **Security Rules:**
   - Select **"Start in test mode"** (for development)
   - Click **"Next"**
4. **Location:**
   - Use the same location as Firestore (recommended)
   - Click **"Done"**

✅ **Verification:** You should see the Storage interface

---

## Step 7: Get Firebase Configuration

1. **In Firebase Console**, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. **Register App:**
   - App nickname: `School Management Web` (or any name)
   - Firebase Hosting: Leave unchecked (optional)
   - Click **"Register app"**
6. **Copy Configuration:**
   - You'll see a code block with `firebaseConfig`
   - **DO NOT** copy the entire code block
   - Instead, copy these individual values:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`

**Example of what you'll see:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "school-management.firebaseapp.com",
  projectId: "school-management",
  storageBucket: "school-management.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

---

## Step 8: Create Environment File

1. **In your project folder** (`D:\Tech sprint`), create a new file named `.env.local`
   - ⚠️ **Important:** The file must start with a dot (`.`)
   - ⚠️ **Important:** No extension (not `.env.local.txt`)

2. **How to create:**
   - **Windows:** 
     - Open Notepad
     - Save as: `.env.local` (with quotes around filename)
     - Or use VS Code: Right-click → New File → `.env.local`
   - **VS Code:** 
     - Click "New File" icon
     - Type `.env.local` and save

3. **Add Firebase Configuration:**
   Open `.env.local` and paste this template, then replace with YOUR values:

```env
VITE_FIREBASE_API_KEY=AIzaSyC_your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

**Example (with real values):**
```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnop
VITE_FIREBASE_AUTH_DOMAIN=school-management.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=school-management
VITE_FIREBASE_STORAGE_BUCKET=school-management.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
```

4. **Save the file**

✅ **Verification:** 
   - File should be in project root: `D:\Tech sprint\.env.local`
   - File should contain 6 lines (one for each variable)

---

## Step 9: Start Development Server

1. **Open Terminal/Command Prompt** in your project directory

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Expected Output:**
   ```
   VITE v5.0.8  ready in 500 ms

   ➜  Local:   http://localhost:3000/
   ➜  Network: use --host to expose
   ```

4. **Open Browser:**
   - The app should automatically open
   - Or manually go to: `http://localhost:3000`

✅ **Verification:** 
   - You should see the Login page
   - No errors in the browser console (F12 → Console tab)

---

## Step 10: Create Your First Admin User

### Option A: Register and Update Role (Easiest)

1. **On the Login Page**, click **"Register here"** link
2. **Fill Registration Form:**
   - Name: `Admin User`
   - Email: `admin@school.com` (use a real email you can access)
   - Role: Select **"Student"** (we'll change this)
   - Password: `admin123` (or any password, min 6 characters)
   - Confirm Password: Same as password
   - Click **"Register"**

3. **Verify Email** (if Firebase requires it):
   - Check your email inbox
   - Click verification link if sent

4. **Update User Role in Firestore:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click **"Firestore Database"**
   - Click on **"users"** collection (it should exist now)
   - Find the document with your email
   - Click on the document to open it
   - Click **"Edit document"** (pencil icon)
   - Find the `role` field
   - Change value from `"student"` to `"admin"` (with quotes)
   - Click **"Update"**

5. **Logout and Login Again:**
   - In the app, click **"Logout"**
   - Login with your credentials
   - You should now see the Admin Dashboard!

### Option B: Create Admin Directly in Firestore

1. **In Firebase Console** → Firestore Database
2. **Click "Start collection"** (if `users` doesn't exist)
3. **Collection ID:** `users`
4. **Document ID:** Click "Auto-ID" (or use a custom ID)
5. **Add Fields:**
   - Field: `email`, Type: `string`, Value: `admin@school.com`
   - Field: `role`, Type: `string`, Value: `admin`
   - Field: `name`, Type: `string`, Value: `Admin User`
   - Field: `createdAt`, Type: `string`, Value: `2024-01-01T00:00:00.000Z`
6. **Click "Save"**
7. **Create Authentication User:**
   - Go to Authentication → Users
   - Click "Add user"
   - Email: `admin@school.com`
   - Password: `admin123`
   - Click "Add user"
8. **Login** with these credentials

---

## Step 11: Test the System

### Test Admin Features:

1. **Login as Admin**
2. **Check Overview Tab:**
   - Should show statistics (users, students, teachers, classes)
3. **Test User Management:**
   - Click "Users" tab
   - Click "Add User"
   - Fill form and create a test user
   - Verify user appears in table
4. **Test Class Management:**
   - Click "Classes" tab
   - Click "Add Class"
   - Create a test class (e.g., Grade 10-A)
   - Verify class appears in table
5. **Test Announcements:**
   - Click "Announcements" tab
   - Click "Create Announcement"
   - Add title and message
   - Verify announcement appears

### Test Teacher Features:

1. **Create a Teacher User:**
   - As admin, create a user with role "teacher"
   - Or register a new account with teacher role
2. **Login as Teacher**
3. **Test Attendance:**
   - Click "Attendance" tab
   - Click "Mark Attendance"
   - Select date and class
   - Mark students present/absent
   - Save
4. **Test Assignments:**
   - Click "Assignments" tab
   - Click "Upload Assignment"
   - Fill form, optionally upload a file
   - Save
5. **Test Marks:**
   - Click "Marks" tab
   - Click "Add Marks"
   - Fill form with student, subject, marks
   - Save

### Test Student Features:

1. **Create/Login as Student**
2. **View Assignments:**
   - Should see assignments uploaded by teachers
   - Can download files if attached
3. **View Attendance:**
   - Should see attendance records
   - See attendance percentage
4. **View Marks:**
   - Should see marks entered by teachers
   - See grades and percentages

### Test Parent Features:

1. **Create/Login as Parent**
2. **View Student Progress:**
   - Should see linked student's attendance
   - View academic performance
   - See marks and grades

---

## Step 12: Troubleshooting Common Issues

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Solution:**
1. Check `.env.local` file exists in project root
2. Verify all 6 environment variables are present
3. Make sure values match Firebase Console exactly
4. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again
5. Clear browser cache and reload

### Issue: "Permission denied" in Firestore

**Solution:**
1. Make sure Firestore is in "test mode" (for development)
2. Check Firestore Rules tab → Should allow all reads/writes
3. Verify you're logged in to the app

### Issue: "Cannot find module" errors

**Solution:**
1. Delete `node_modules` folder
2. Delete `package-lock.json` (if exists)
3. Run `npm install` again
4. Restart dev server

### Issue: App shows blank page

**Solution:**
1. Open browser console (F12)
2. Check for error messages
3. Verify `.env.local` file is correct
4. Check that Firebase services are enabled
5. Verify you're accessing `http://localhost:3000`

### Issue: Can't see admin features after changing role

**Solution:**
1. Verify role is exactly `"admin"` (with quotes) in Firestore
2. Logout completely
3. Clear browser localStorage: F12 → Application → Local Storage → Clear
4. Login again

### Issue: File uploads not working

**Solution:**
1. Verify Firebase Storage is enabled
2. Check Storage is in test mode
3. Verify file size is under 10MB
4. Check browser console for specific errors

---

## Step 13: Next Steps

### For Development:
- ✅ System is ready to use!
- Test all features
- Customize UI/colors if desired
- Add more features as needed

### For Production:
1. **Update Security Rules:**
   - See `FIREBASE_SETUP.md` for production-ready rules
   - Update Firestore rules
   - Update Storage rules

2. **Deploy Application:**
   - Build: `npm run build`
   - Deploy to Firebase Hosting, Vercel, or Netlify

3. **Set Up Proper User Management:**
   - Consider using Firebase Admin SDK
   - Implement proper user creation flow

---

## ✅ Setup Complete Checklist

- [ ] Node.js installed and verified
- [ ] Dependencies installed (`npm install`)
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Firebase config copied
- [ ] `.env.local` file created with correct values
- [ ] Development server running (`npm run dev`)
- [ ] App opens in browser
- [ ] First admin user created
- [ ] Can login and see admin dashboard
- [ ] Tested at least one feature

---

## 🎉 Congratulations!

Your School Management System is now running! You can start using it to manage your school operations.

**Quick Reference:**
- **Login Page:** `http://localhost:3000/login`
- **Firebase Console:** [console.firebase.google.com](https://console.firebase.google.com/)
- **Project Files:** `D:\Tech sprint`

**Need Help?**
- Check `FIREBASE_SETUP.md` for detailed Firebase configuration
- Check `QUICK_START.md` for a condensed guide
- Review `README.md` for project overview




