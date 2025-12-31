# SmartShala - School Management System

**Simple Tools. Strong Schools.**

A comprehensive web-based School Management System powered by Google Firebase, designed to digitalize core school activities and provide a centralized online platform for administrators, teachers, students, and parents.

## Features

- 🔐 **User Authentication** - Secure login with role-based access control
- 👥 **Multi-Role Support** - Admin, Teacher, Student, and Parent dashboards
- 📚 **Student Management** - Complete student records and class management
- ✅ **Attendance Tracking** - Date-wise attendance records
- 📝 **Assignment Management** - Upload, share, and track assignments
- 📊 **Marks & Reports** - Exam marks entry and report generation
- 📢 **Announcements** - Communication module for all stakeholders
- ☁️ **Cloud Storage** - Secure data storage with Firebase Firestore

## Technology Stack

- **Frontend**: React 18 with Vite
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Routing**: React Router DOM

## Setup Instructions

### Quick Start
For a quick overview, see [QUICK_START.md](./QUICK_START.md)

### Detailed Setup
**For first-time setup, follow the comprehensive guide: [DETAILED_SETUP_GUIDE.md](./DETAILED_SETUP_GUIDE.md)**

This detailed guide includes:
- ✅ Prerequisites check
- Step-by-step Firebase setup
- Environment configuration
- Creating your first admin user
- Testing all features
- Troubleshooting common issues

### Basic Steps:

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Firebase:**
   - See [DETAILED_SETUP_GUIDE.md](./DETAILED_SETUP_GUIDE.md) for complete instructions
   - Or see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for Firebase-specific details
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore Database
   - Enable Storage for file uploads
   - Create a `.env.local` file with your Firebase configuration

3. **Run the development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## Firebase Configuration

Create a `.env.local` file in the root directory:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## User Roles

- **Admin**: Manages users, classes, announcements, and overall school operations
- **Teacher**: Marks attendance, uploads assignments, records marks, and manages class activities
- **Student**: Views assignments, attendance records, marks, and announcements
- **Parent**: Tracks student progress, attendance, and academic performance

## Project Structure

```
school-management-system/
├── src/
│   ├── components/       # Reusable components (Layout, ProtectedRoute)
│   ├── config/          # Firebase configuration
│   ├── context/         # React context (AuthContext)
│   ├── pages/           # Page components (Dashboards, Login, Register)
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json         # Dependencies
└── vite.config.js       # Vite configuration
```

## Key Features Implementation

### Authentication
- Email/password authentication via Firebase Auth
- Role-based access control
- Protected routes for each user role

### Admin Features
- User management (create, view, delete users)
- Class management (create, view, delete classes)
- Announcement management (create, view, delete announcements)
- Overview dashboard with statistics

### Teacher Features
- Mark student attendance (date-wise)
- Upload assignments with file attachments
- Record exam marks and grades
- View class statistics

### Student Features
- View assignments and download files
- Check attendance records and percentage
- View marks and academic performance
- Read school announcements

### Parent Features
- View linked student's attendance
- Track academic performance
- View marks and grades
- Read school announcements

## Development

### Running the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production
```bash
npm run build
```

The production build will be in the `dist` directory.

## Important Notes

1. **First Admin User**: After setting up Firebase, you'll need to manually create the first admin user. See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for details.

2. **Security Rules**: Make sure to update Firestore and Storage security rules before deploying to production. See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for production-ready rules.

3. **User Creation**: Currently, user registration creates a Firestore document. For production, consider using Firebase Admin SDK or Cloud Functions to properly create users with authentication.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

