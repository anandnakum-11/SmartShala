import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FiFile, FiDownload, FiCalendar, FiBookOpen, FiCheckCircle, FiXCircle, FiUpload, FiClock, FiBell, FiClipboard, FiUsers, FiBarChart } from 'react-icons/fi';
import { format } from 'date-fns';
import CircularProgress from '../components/CircularProgress';
import ProgressBar from '../components/ProgressBar';

const StudentDashboard = () => {
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
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState(null);
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [timetable, setTimetable] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch assignments (all assignments for now, in production filter by class)
      const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsData);

      // Fetch user details to get classId for Timetable
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.classId) {
          const timetableDoc = await getDoc(doc(db, 'timetables', userData.classId));
          if (timetableDoc.exists()) {
            setTimetable(timetableDoc.data());
          }
        }
      }

      // Fetch attendance for current student
      const attendanceSnapshot = await getDocs(
        query(collection(db, 'attendance'), where('studentId', '==', currentUser.uid))
      );
      const attendanceData = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendance(attendanceData);

      // Fetch marks for current student
      const marksSnapshot = await getDocs(
        query(collection(db, 'marks'), where('studentId', '==', currentUser.uid))
      );
      const marksData = marksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Add dummy data if no marks exist
      if (marksData.length === 0) {
        const dummyMarks = [
          { id: 'dummy1', subject: 'Mathematics', examType: 'Mid-Term', marks: 85, totalMarks: 100 },
          { id: 'dummy2', subject: 'English', examType: 'Mid-Term', marks: 92, totalMarks: 100 },
          { id: 'dummy3', subject: 'Science', examType: 'Mid-Term', marks: 78, totalMarks: 100 },
          { id: 'dummy4', subject: 'History', examType: 'Mid-Term', marks: 88, totalMarks: 100 },
          { id: 'dummy5', subject: 'Mathematics', examType: 'Final', marks: 90, totalMarks: 100 },
          { id: 'dummy6', subject: 'English', examType: 'Final', marks: 95, totalMarks: 100 }
        ];
        setMarks(dummyMarks);
      } else {
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

      // Fetch submissions for current student
      const submissionsSnapshot = await getDocs(
        query(collection(db, 'submissions'), where('studentId', '==', currentUser.uid))
      );
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(submissionsData);
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

  const handleFileSelect = (assignmentId, file) => {
    if (file) {
      const maxSize = 500 * 1024; // 500KB limit
      if (file.size > maxSize) {
        alert(`File is too large (${(file.size / 1024).toFixed(2)} KB). Maximum size is 500 KB.`);
        return;
      }
      setSubmissionFiles(prev => ({
        ...prev,
        [assignmentId]: file
      }));
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const file = submissionFiles[assignmentId];
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setUploadingAssignmentId(assignmentId);

    try {
      // Convert file to base64
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Check if submission already exists
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      const assignmentData = assignmentDoc.data();

      // Create or update submission
      const submissionData = {
        assignmentId,
        studentId: currentUser.uid,
        fileUrl: fileData,
        fileName: file.name,
        fileType: file.type,
        isBase64: true,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      // Check if submission exists
      const submissionsSnapshot = await getDocs(
        query(
          collection(db, 'submissions'),
          where('assignmentId', '==', assignmentId),
          where('studentId', '==', currentUser.uid)
        )
      );

      if (submissionsSnapshot.empty) {
        // Create new submission
        await addDoc(collection(db, 'submissions'), submissionData);
      } else {
        // Update existing submission
        const submissionDoc = submissionsSnapshot.docs[0];
        await updateDoc(doc(db, 'submissions', submissionDoc.id), submissionData);
      }

      // Clear file selection
      setSubmissionFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[assignmentId];
        return newFiles;
      });

      alert('Assignment submitted successfully!');

      // Refresh assignments to show updated status
      await fetchData();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment. Please try again.');
    } finally {
      setUploadingAssignmentId(null);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="container page-enter">
      <div className="card animate-fade-in-up">
        <div className="card-header">
          <div>
            <h2 className="card-title welcome-text">Student Dashboard</h2>
            <p className="welcome-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Track your academic journey, assignments, and school updates in one place.
            </p>
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
              className={`tab-item-modern ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              <FiClipboard /> Assignments
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
              <FiUpload /> Marks
            </button>
            <button
              className={`tab-item-modern ${activeTab === 'timetable' ? 'active' : ''}`}
              onClick={() => setActiveTab('timetable')}
            >
              <FiCalendar /> Timetable
            </button>
            <button
              className={`tab-item-modern ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              <FiBell /> Announcements
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content-card" style={{ padding: '2rem' }}>
            <div className="section-header-modern">
              <h3><FiBookOpen className="icon-glow" /> Academic Overview</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-card hover-scale" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>Attendance</h4>
                <div className="stat-value" style={{ display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress
                    percentage={parseFloat(calculateAttendancePercentage())}
                    color="#10b981"
                  />
                </div>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <span className="status-indicator success">
                    {attendance.filter(a => a.present).length} / {attendance.length} Days Present
                  </span>
                </div>
              </div>
              <div className="stat-card hover-scale" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 600 }}>Overall Performance</h4>
                <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1rem' }}>{calculateOverallPercentage()}%</div>
                <ProgressBar
                  percentage={parseFloat(calculateOverallPercentage())}
                  color="#2563eb"
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', fontWeight: 500 }}>
                  Based on {marks.length} exams
                </p>
              </div>
              <div className="stat-card hover-scale" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>Assignments</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="stat-value" style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)' }}>{assignments.length}</div>
                  <div className="icon-circle" style={{ background: 'var(--bg-color)', color: 'var(--primary-color)' }}>
                    <FiClipboard size={32} />
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                  Active coursework
                </p>
              </div>
              <div className="stat-card hover-scale" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>Latest Updates</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="stat-value" style={{ fontSize: '3rem', fontWeight: 800, color: '#f59e0b' }}>{announcements.length}</div>
                  <div className="icon-circle" style={{ background: '#fffbeb', color: '#d97706' }}>
                    <FiBell size={32} />
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                  New announcements
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiClipboard className="icon-glow" /> My Assignments</h3>
            </div>
            {assignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <FiClipboard size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No assignments available at the moment.</p>
              </div>
            ) : (
              <div className="modern-table-container" style={{ marginTop: 0 }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Assignment Title</th>
                      <th>Due Date</th>
                      <th>Class File</th>
                      <th>Status</th>
                      <th>Submission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment, index) => {
                      const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                      const selectedFile = submissionFiles[assignment.id];
                      const submission = submissions.find(s => s.assignmentId === assignment.id);
                      const isSubmitted = !!submission;
                      return (
                        <tr key={assignment.id} className="stagger-item">
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{assignment.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{assignment.description || 'No description provided'}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isOverdue ? 'var(--danger-color)' : 'var(--text-secondary)', fontWeight: 500 }}>
                              <FiCalendar size={14} />
                              {assignment.dueDate ? safeFormat(assignment.dueDate, 'MMM dd, yyyy') : 'No date'}
                            </div>
                          </td>
                          <td>
                            {assignment.fileUrl ? (
                              <a
                                href={assignment.fileUrl}
                                download={assignment.fileName || 'assignment-file'}
                                target={assignment.isBase64 ? "_self" : "_blank"}
                                rel="noopener noreferrer"
                                className="file-link-modern"
                              >
                                <FiDownload size={16} />
                                <span>{assignment.fileName ? (assignment.fileName.length > 15 ? assignment.fileName.substring(0, 12) + '...' : assignment.fileName) : 'Download'}</span>
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>No file</span>
                            )}
                          </td>
                          <td>
                            {isSubmitted ? (
                              <span className="status-indicator success">
                                <FiCheckCircle size={14} /> Submitted
                              </span>
                            ) : isOverdue ? (
                              <span className="status-indicator danger">
                                <FiClock size={14} /> Overdue
                              </span>
                            ) : (
                              <span className="status-indicator info">
                                <FiClock size={14} /> Active
                              </span>
                            )}
                          </td>
                          <td>
                            {isSubmitted ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--success-color)', fontWeight: 600 }}>Completed</span>
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                  {submission.submittedAt ? safeFormat(submission.submittedAt, 'MMM dd, HH:mm') : 'N/A'}
                                </small>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <label className="teacher-action-btn-modern btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                                  <FiUpload size={16} />
                                  <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileSelect(assignment.id, e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                  />
                                  <span>{selectedFile ? 'Change File' : 'Select File'}</span>
                                </label>
                                {selectedFile && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {selectedFile.name}
                                    </span>
                                    <button
                                      className="teacher-action-btn-modern btn-primary"
                                      onClick={() => handleSubmitAssignment(assignment.id)}
                                      disabled={uploadingAssignmentId === assignment.id}
                                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >
                                      {uploadingAssignmentId === assignment.id ? '...' : 'Upload'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
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

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiCalendar className="icon-glow" /> My Attendance History</h3>
            </div>
            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--bg-color)', borderRadius: '1rem', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '1rem' }}>
              <FiCheckCircle size={20} style={{ color: 'var(--primary-color)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Attendance</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{calculateAttendancePercentage()}%</span>
              </div>
            </div>
            {attendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <FiXCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No attendance records found yet.</p>
              </div>
            ) : (
              <div className="modern-table-container" style={{ marginTop: 0 }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Attendance Status</th>
                      <th>Subject/Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(record => (
                      <tr key={record.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {record.date ? safeFormat(record.date, 'MMMM dd, yyyy') : 'N/A'}
                        </td>
                        <td>
                          {record.present ? (
                            <span className="status-indicator success">
                              <FiCheckCircle size={14} /> Present
                            </span>
                          ) : (
                            <span className="status-indicator danger">
                              <FiXCircle size={14} /> Absent
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Regular Session</span>
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
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiCheckCircle className="icon-glow" /> Marks & Academic Results</h3>
            </div>
            <div className="modern-table-container" style={{ marginTop: 0 }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Assessment Type</th>
                    <th>Score / Total</th>
                    <th>Percentage</th>
                    <th>Grading</th>
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
                    const grade = getGrade(percentage);
                    return (
                      <tr key={mark.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{mark.subject}</td>
                        <td>
                          <span className="status-indicator info" style={{ padding: '0.35rem 0.75rem' }}>{mark.examType}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{mark.marks} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/ {mark.totalMarks}</span></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{percentage}%</span>
                            <ProgressBar percentage={parseFloat(percentage)} color={percentage >= 50 ? 'var(--primary-color)' : 'var(--danger-color)'} />
                          </div>
                        </td>
                        <td>
                          <span className={`status-indicator ${percentage >= 50 ? 'success' : 'danger'}`} style={{ minWidth: '45px', justifyContent: 'center' }}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiCalendar className="icon-glow" /> Class Timetable</h3>
            </div>
            {timetable ? (
              <div className="timetable-container" style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.75rem', borderLeft: '4px solid var(--primary-color)' }}>
                  Active Class: <strong style={{ color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{timetable.className}</strong>
                </div>
                <div className="timetable-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const daySchedule = timetable.schedule?.[day] || [];

                    return (
                      <div key={day} className="card" style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1rem', boxShadow: 'none' }}>
                        <h5 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', color: 'var(--primary-dark)', fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {day}
                        </h5>
                        {daySchedule.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>No classes scheduled</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {daySchedule.map(entry => (
                              <div key={entry.id} style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                borderLeft: '4px solid var(--primary-color)',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'transform 0.2s',
                              }}
                                className="stagger-item hover-scale"
                              >
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{entry.subject}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', marginBottom: '0.5rem' }}>
                                  <FiClock size={14} style={{ color: 'var(--primary-color)' }} />
                                  <span style={{ fontWeight: 600 }}>{entry.startTime} - {entry.endTime}</span>
                                </div>
                                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', paddingLeft: '0.25rem' }}>
                                  <FiUsers size={12} /> {entry.teacherName}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <FiCalendar size={64} style={{ marginBottom: '1.5rem', opacity: 0.2, color: 'var(--primary-color)' }} />
                <h4 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No Timetable Found</h4>
                <p>You may not be assigned to a class yet. Please contact administration.</p>
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiBell className="icon-glow" /> School Announcements</h3>
            </div>
            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <FiBell size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No announcements available yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {announcements.map(announcement => (
                  <div key={announcement.id} className="card hover-scale" style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1rem', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--primary-dark)', fontWeight: 700, fontSize: '1.1rem' }}>{announcement.title}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600, border: '1px solid var(--border-color)' }}>
                        {announcement.createdAt ? safeFormat(announcement.createdAt, 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                      {announcement.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <FiClock size={14} /> Posted at {announcement.createdAt ? safeFormat(announcement.createdAt, 'HH:mm') : 'N/A'}
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

export default StudentDashboard;

