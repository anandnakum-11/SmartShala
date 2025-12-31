import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCheckCircle, FiXCircle, FiBookOpen } from 'react-icons/fi';
import { format } from 'date-fns';
import CircularProgress from '../components/CircularProgress';

const ParentDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current parent user data using currentUser.uid
      const parentDocRef = doc(db, 'users', currentUser.uid);
      const parentDocSnap = await getDoc(parentDocRef);
      
      if (!parentDocSnap.exists() || parentDocSnap.data().role !== 'parent') {
        setLoading(false);
        return;
      }
      
      const parentData = { id: parentDocSnap.id, ...parentDocSnap.data() };
      
      // Find student linked to this parent by childEmail or childStudentId
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Find student by childEmail or childStudentId
      let linkedStudent = null;
      if (parentData.childEmail) {
        linkedStudent = usersData.find(u => 
          u.role === 'student' && u.email === parentData.childEmail
        );
      }
      
      // If not found by email, try by student ID
      if (!linkedStudent && parentData.childStudentId) {
        linkedStudent = usersData.find(u => 
          u.role === 'student' && u.studentId === parentData.childStudentId
        );
      }
      
      setStudent(linkedStudent);

      if (linkedStudent) {
        // Fetch attendance for linked student
        const attendanceSnapshot = await getDocs(
          query(collection(db, 'attendance'), where('studentId', '==', linkedStudent.id))
        );
        const attendanceData = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAttendance(attendanceData);

        // Fetch marks for linked student
        const marksSnapshot = await getDocs(
          query(collection(db, 'marks'), where('studentId', '==', linkedStudent.id))
        );
        const marksData = marksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMarks(marksData);
      }

      // Fetch announcements
      const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsData.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.present).length;
    return ((present / attendance.length) * 100).toFixed(1);
  };

  const calculateOverallPercentage = () => {
    if (marks.length === 0) return 0;
    const total = marks.reduce((sum, m) => sum + (m.marks / m.totalMarks) * 100, 0);
    return (total / marks.length).toFixed(2);
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!student) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-info">
            No student linked to your account. Please contact the administrator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-enter">
      <div className="card animate-fade-in-up">
        <div className="card-header">
          <div>
            <h2 className="card-title welcome-text">Parent Dashboard</h2>
            <p className="welcome-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Track your child's academic progress and attendance.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <FiUser size={20} />
              <span style={{ fontWeight: 500 }}>Viewing: {student.name || student.email}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)' }}>
          <button
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('overview')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Overview
          </button>
          <button
            className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('attendance')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Attendance
          </button>
          <button
            className={`btn ${activeTab === 'marks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('marks')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Academic Performance
          </button>
          <button
            className={`btn ${activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('announcements')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Announcements
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Attendance Rate</h3>
                <div className="stat-value">{calculateAttendancePercentage()}%</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {attendance.filter(a => a.present).length} / {attendance.length} days
                </p>
              </div>
              <div className="stat-card">
                <h3>Overall Performance</h3>
                <div className="stat-value">{calculateOverallPercentage()}%</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Based on {marks.length} exams
                </p>
              </div>
              <div className="stat-card">
                <h3>Total Exams</h3>
                <div className="stat-value">{marks.length}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Marks recorded
                </p>
              </div>
              <div className="stat-card">
                <h3>Announcements</h3>
                <div className="stat-value">{announcements.length}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Recent updates
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>Attendance Records</h3>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.5rem' }}>
              <strong>Overall Attendance: {calculateAttendancePercentage()}%</strong>
            </div>
            {attendance.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No attendance records found
              </p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(record => (
                      <tr key={record.id}>
                        <td>{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                        <td>
                          {record.present ? (
                            <span className="badge badge-success">
                              <FiCheckCircle size={14} style={{ marginRight: '0.25rem' }} />
                              Present
                            </span>
                          ) : (
                            <span className="badge badge-danger">
                              <FiXCircle size={14} style={{ marginRight: '0.25rem' }} />
                              Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Marks Tab */}
        {activeTab === 'marks' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>Academic Performance</h3>
            {marks.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No marks available
              </p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Exam Type</th>
                      <th>Marks Obtained</th>
                      <th>Total Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map(mark => {
                      const percentage = ((mark.marks / mark.totalMarks) * 100).toFixed(2);
                      const getGrade = (perc) => {
                        if (perc >= 90) return 'A+';
                        if (perc >= 80) return 'A';
                        if (perc >= 70) return 'B';
                        if (perc >= 60) return 'C';
                        if (perc >= 50) return 'D';
                        return 'F';
                      };
                      return (
                        <tr key={mark.id}>
                          <td>{mark.subject}</td>
                          <td>{mark.examType}</td>
                          <td>{mark.marks}</td>
                          <td>{mark.totalMarks}</td>
                          <td>{percentage}%</td>
                          <td>
                            <span className={`badge ${percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                              {getGrade(percentage)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>School Announcements</h3>
            {announcements.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No announcements available
              </p>
            ) : (
              <div>
                {announcements.map(announcement => (
                  <div key={announcement.id} className="card" style={{ marginBottom: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>{announcement.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {announcement.message}
                    </p>
                    <small style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(announcement.createdAt), 'MMM dd, yyyy HH:mm')}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;

