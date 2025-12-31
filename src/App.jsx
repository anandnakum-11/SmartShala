import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';



function App() {
  const { currentUser, userRole } = useAuth();

  const getDefaultRoute = () => {
    if (!currentUser) return '/login';
    switch (userRole) {
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      case 'student':
        return '/student';
      case 'parent':
        return '/parent';
      default:
        return '/login';
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={currentUser ? <Navigate to={getDefaultRoute()} replace /> : <Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={currentUser ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to={getDefaultRoute()} replace /> : <Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Layout>
                <TeacherDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/parent/*"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <Layout>
                <ParentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Chatbot />
    </>
  );
}

export default App;

