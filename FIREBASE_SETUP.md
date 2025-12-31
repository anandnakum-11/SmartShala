# Firebase Setup Guide

This guide will help you set up Firebase for the School Management System.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter a project name (e.g., "School Management System")
   - Enable/disable Google Analytics (optional)
   - Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Click on **Sign-in method** tab
3. Enable **Email/Password** provider:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development) or **Start in production mode** (for production)
4. Select a location for your database (choose the closest to your users)
5. Click **Enable**

### Firestore Security Rules (for production)

Update your Firestore rules in the **Rules** tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can manage all users
    match /users/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Students can read their own attendance, marks, assignments
    match /attendance/{document} {
      allow read: if request.auth != null && 
        (resource.data.studentId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /marks/{document} {
      allow read: if request.auth != null && 
        (resource.data.studentId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /assignments/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /classes/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /announcements/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 4: Enable Storage (for file uploads)

1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Start in test mode (for development) or set up production rules
4. Choose a location (same as Firestore is recommended)
5. Click **Done**

### Storage Security Rules (for production)

Update your Storage rules in the **Rules** tab:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /assignments/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```

## Step 5: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click on the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "School Management Web")
5. Copy the Firebase configuration object

## Step 6: Configure Environment Variables

1. Create a `.env.local` file in the project root
2. Copy the values from Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Step 7: Create First Admin User

1. Start the application: `npm run dev`
2. Register a new account with role "student" (you'll need to manually change it to admin)
3. In Firebase Console, go to **Firestore Database**
4. Find the user document in the `users` collection
5. Edit the document and change the `role` field to `"admin"`
6. Logout and login again - you should now have admin access

Alternatively, you can create an admin user directly in Firestore:
- Create a new document in the `users` collection
- Set fields: `email`, `role: "admin"`, `name`, `createdAt`
- Then create the authentication user in Firebase Authentication

## Step 8: Test the Application

1. Run `npm run dev`
2. Navigate to `http://localhost:3000`
3. Register a new account
4. Test the features based on your role

## Troubleshooting

### Authentication Errors
- Make sure Email/Password authentication is enabled
- Check that your Firebase config is correct in `.env.local`

### Firestore Permission Errors
- Verify your security rules are set correctly
- Check that users have the correct `role` field in their user document

### Storage Upload Errors
- Ensure Storage is enabled
- Check file size limits in Storage rules
- Verify Storage security rules allow uploads

## Production Deployment

Before deploying to production:

1. Update Firestore security rules (see Step 3)
2. Update Storage security rules (see Step 4)
3. Set up proper authentication restrictions if needed
4. Enable Firebase Hosting (optional):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy
   ```

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)




