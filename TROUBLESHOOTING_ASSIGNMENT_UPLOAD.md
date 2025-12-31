# Troubleshooting Assignment Upload Issue

## Problem
Assignment upload form is not working - details are entered but assignment is not being saved.

## Solutions

### 1. Check Browser Console for Errors

**Steps:**
1. Open the browser (Chrome/Firefox/Edge)
2. Press `F12` to open Developer Tools
3. Click on the **Console** tab
4. Try uploading an assignment again
5. Look for any red error messages

**Common Errors:**
- `Firebase: Error (auth/permission-denied)` → Firestore permissions issue
- `Firebase Storage: User does not have permission` → Storage permissions issue
- `Failed to fetch` → Network/Firebase configuration issue

### 2. Verify Firebase Storage is Enabled

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Storage** in the left sidebar
4. If you see "Get started", click it and enable Storage
5. Make sure Storage is in **test mode** (for development)

### 3. Check Firestore Security Rules

**Steps:**
1. Go to Firebase Console → **Firestore Database**
2. Click on **Rules** tab
3. For development, rules should be:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Check Storage Security Rules

**Steps:**
1. Go to Firebase Console → **Storage**
2. Click on **Rules** tab
3. For development, rules should be:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Verify Classes Exist

**Problem:** If no classes are created, the dropdown will be empty and you can't select a class.

**Solution:**
1. Login as **Admin**
2. Go to **Classes** tab
3. Click **Add Class**
4. Create at least one class
5. Go back to Teacher dashboard and try again

### 6. Check Firebase Configuration

**Steps:**
1. Verify `.env.local` file exists in project root
2. Check all 6 environment variables are set:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Restart the dev server after changing `.env.local`:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### 7. Check File Size

**Problem:** Files larger than 10MB might fail to upload.

**Solution:**
- Try uploading a smaller file first (< 5MB)
- Check Storage rules for file size limits

### 8. Verify You're Logged In

**Steps:**
1. Check that you're logged in as a **Teacher**
2. Your email should show in the header
3. If not logged in, login again

### 9. Check Network Tab

**Steps:**
1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Try uploading assignment
4. Look for failed requests (red entries)
5. Click on failed request to see error details

### 10. Test with Console Logs

The updated code now includes detailed console logging. Check the browser console for:
- "Uploading file to Storage..."
- "File uploaded, getting download URL..."
- "Saving assignment to Firestore..."
- "Assignment saved successfully!"

If you see errors at any step, that's where the problem is.

## Quick Fix Checklist

- [ ] Firebase Storage is enabled
- [ ] Storage rules allow authenticated users
- [ ] Firestore rules allow authenticated users
- [ ] At least one class exists in the system
- [ ] `.env.local` file has correct Firebase config
- [ ] Dev server was restarted after changing `.env.local`
- [ ] You're logged in as a Teacher
- [ ] Browser console shows no errors
- [ ] File size is under 10MB (if uploading file)

## Still Not Working?

1. **Check the browser console** - Look for specific error messages
2. **Check Firebase Console** - Go to Firestore Database → assignments collection to see if anything was saved
3. **Try without file** - Upload assignment without a file to isolate the issue
4. **Check Network tab** - See if requests are being made and what responses you get

## Common Error Messages and Fixes

| Error Message | Solution |
|--------------|----------|
| "Permission denied" | Update Firestore/Storage rules to allow authenticated users |
| "Storage bucket not found" | Check `VITE_FIREBASE_STORAGE_BUCKET` in `.env.local` |
| "Invalid API key" | Verify all Firebase config values in `.env.local` |
| "No classes available" | Create a class in Admin dashboard first |
| "Network error" | Check internet connection and Firebase project status |

## Testing Steps

1. **Test without file:**
   - Fill all fields except file
   - Click Upload
   - Should work if Firestore is configured correctly

2. **Test with file:**
   - Add a small file (< 1MB)
   - Fill all fields
   - Click Upload
   - Should work if Storage is configured correctly

3. **Check Firestore:**
   - Go to Firebase Console → Firestore Database
   - Look for `assignments` collection
   - Should see your assignment document

4. **Check Storage:**
   - Go to Firebase Console → Storage
   - Look in `assignments/` folder
   - Should see uploaded file (if file was included)

## Need More Help?

If none of these solutions work:
1. Copy the exact error message from browser console
2. Check what appears in Firestore Database
3. Verify all Firebase services are enabled
4. Try creating a fresh Firebase project and reconfiguring




