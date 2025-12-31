# Quick Start Guide

Get your School Management System up and running in 5 minutes!

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Firebase account (free tier is sufficient)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable these services:
   - **Authentication** → Email/Password
   - **Firestore Database** → Start in test mode
   - **Storage** → Start in test mode

### 3. Get Firebase Config

1. In Firebase Console → Project Settings → General
2. Scroll to "Your apps" → Click Web icon (`</>`)
3. Register app → Copy the config values

### 4. Create Environment File

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Create Your First Admin User

1. Register a new account (any role)
2. Go to Firebase Console → Firestore Database
3. Find your user document in `users` collection
4. Edit the document → Change `role` to `"admin"`
5. Logout and login again

## Testing the System

### As Admin:
- Create users and classes
- Create announcements
- View statistics

### As Teacher:
- Mark attendance
- Upload assignments
- Record marks

### As Student:
- View assignments
- Check attendance
- View marks

### As Parent:
- Track student progress
- View attendance
- See academic performance

## Troubleshooting

**"Firebase: Error (auth/invalid-api-key)"**
- Check your `.env.local` file exists and has correct values
- Restart the dev server after creating `.env.local`

**"Permission denied" errors**
- Make sure Firestore is in test mode (for development)
- Check that you're logged in

**Can't see admin features**
- Verify your user document has `role: "admin"` in Firestore
- Logout and login again

## Next Steps

- Read [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for production setup
- Customize the UI and add more features
- Set up proper security rules before deploying

## Need Help?

- Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase configuration
- Review [README.md](./README.md) for project overview




