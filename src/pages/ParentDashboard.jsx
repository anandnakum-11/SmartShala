import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCheckCircle, FiXCircle, FiBookOpen, FiClock, FiBell, FiBarChart, FiTrendingUp, FiClipboard, FiCalendar, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';
import CircularProgress from '../components/CircularProgress';
import SummaryCard from '../components/SummaryCard';

const ParentDashboard = () => {
  const { currentUser } = useAuth();

  // Safe date formatting utility
  const safeFormat = (date, formatStr) => {
    try {
      if (!date) return 'N/A';
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, formatStr);
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'N/A';
    }
  };
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
        <div className="section-header-modern" style={{ padding: '1rem 0' }}>
          <div>
            <h2 className="welcome-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Parent Dashboard</h2>
            <p className="welcome-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Monitoring Academic Excellence: {student.name || student.email}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', color: 'var(--primary-color)' }}>
              <div className="icon-circle" style={{ width: '32px', height: '32px', background: 'rgba(15, 118, 110, 0.1)' }}>
                <FiUser size={16} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Active Profile: {student.studentId || student.id?.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container-modern">
          <div className="tabs-list-modern">
            <button
              className={`tab-item-modern ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FiBarChart /> Overview
            </button>
            <button
              className={`tab-item-modern ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              <FiCheckCircle /> Attendance
            </button>
            <button
              className={`tab-item-modern ${activeTab === 'marks' ? 'active' : ''}`}
              onClick={() => setActiveTab('marks')}
            >
              <FiClipboard /> Performance
            </button>
            <button
              className={`tab-item-modern ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              <FiBell /> Notices
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content-card" style={{ padding: '2rem' }}>
            <div className="section-header-modern">
              <h3><FiTrendingUp className="icon-glow" /> Academic Overview</h3>
            </div>
            <div className="summary-cards-grid">
              <SummaryCard
                title="Attendance Rate"
                value={`${calculateAttendancePercentage()}%`}
                icon={<FiCheckCircle size={24} />}
                color="var(--primary-color)"
                subtitle={`${attendance.filter(a => a.present).length} / ${attendance.length} Days`}
              />
              <SummaryCard
                title="Cumulative Grade"
                value={`${calculateOverallPercentage()}%`}
                icon={<FiBarChart size={24} />}
                color="#7c3aed"
                subtitle={`From ${marks.length} Assessments`}
              />
              <SummaryCard
                title="Notices"
                value={announcements.length}
                icon={<FiBell size={24} />}
                color="#f59e0b"
                subtitle="Latest Updates"
              />
            </div>

            <div className="dashboard-grid" style={{ marginTop: '2.5rem' }}>
              <div className="card hover-scale" style={{ padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ width: '120px' }}>
                  <CircularProgress percentage={calculateAttendancePercentage()} size={120} strokeWidth={10} color="var(--primary-color)" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-dark)' }}>Presence Index</h4>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>Your child's participation in live academic sessions.</p>
                  <span className="status-indicator success">Steady Progress</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiCheckCircle className="icon-glow" /> Daily Register</h3>
            </div>

            {attendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <FiCalendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No attendance logs recorded for this period.</p>
              </div>
            ) : (
              <div className="modern-table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Academic Date</th>
                      <th>Roll Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(record => (
                      <tr key={record.id}>
                        <td style={{ fontWeight: 700 }}>{record.date ? safeFormat(record.date, 'MMM dd, yyyy') : 'N/A'}</td>
                        <td>
                          {record.present ? (
                            <span className="status-indicator success">
                              <FiCheck size={14} /> Present
                            </span>
                          ) : (
                            <span className="status-indicator danger">
                              <FiClock size={14} /> Absent
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Official School Record</td>
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
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiClipboard className="icon-glow" /> Academic Evaluation</h3>
            </div>
            {marks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <FiBookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No evaluation records published yet.</p>
              </div>
            ) : (
              <div className="modern-table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Subject Matter</th>
                      <th>Assessment Type</th>
                      <th>Metrics</th>
                      <th>Weightage</th>
                      <th>Standing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map(mark => {
                      const percentage = ((mark.marks / mark.totalMarks) * 100);
                      const getGrade = (perc) => {
                        if (perc >= 90) return { label: 'A+', class: 'success' };
                        if (perc >= 80) return { label: 'A', class: 'success' };
                        if (perc >= 70) return { label: 'B', class: 'info' };
                        if (perc >= 60) return { label: 'C', class: 'warning' };
                        if (perc >= 50) return { label: 'D', class: 'warning' };
                        return { label: 'F', class: 'danger' };
                      };
                      const grade = getGrade(percentage);
                      return (
                        <tr key={mark.id}>
                          <td style={{ fontWeight: 700 }}>{mark.subject}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{mark.examType}</td>
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{mark.marks} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/ {mark.totalMarks}</span></div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)' }}>{percentage.toFixed(1)}%</div>
                          </td>
                          <td>100%</td>
                          <td>
                            <span className={`status-indicator ${grade.class}`}>
                              {grade.label}
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
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiBell className="icon-glow" /> Official Gazettes</h3>
            </div>
            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <FiBell size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No official communications posted yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {announcements.map(announcement => (
                  <div key={announcement.id} className="card hover-scale" style={{ padding: '2rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: 'var(--primary-dark)', fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>{announcement.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                          {announcement.message}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'white', padding: '0.4rem 0.75rem', borderRadius: '0.6rem', fontWeight: 700, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiCalendar size={14} /> {announcement.createdAt ? safeFormat(announcement.createdAt, 'MMM dd, yyyy') : 'N/A'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 700 }}>
                            <FiClock size={14} /> {announcement.createdAt ? safeFormat(announcement.createdAt, 'HH:mm') : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
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

