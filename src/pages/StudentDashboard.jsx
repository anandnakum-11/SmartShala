import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FiFile, FiDownload, FiCalendar, FiBookOpen, FiCheckCircle, FiXCircle, FiUpload, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import CircularProgress from '../components/CircularProgress';
import ProgressBar from '../components/ProgressBar';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
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
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Student Dashboard</h2>
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
            className={`btn ${activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('assignments')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Assignments
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
            Marks & Results
          </button>
          <button
            className={`btn ${activeTab === 'timetable' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('timetable')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Timetable
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
          <div className="dashboard-overview animate-fade-in">
            <div className="stats-grid">
              <div className="stat-card stagger-item">
                <h3>Attendance</h3>
                <div className="stat-value">
                  <CircularProgress
                    percentage={parseFloat(calculateAttendancePercentage())}
                    color="#10b981"
                  />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                  {attendance.filter(a => a.present).length} / {attendance.length} days
                </p>
              </div>
              <div className="stat-card stagger-item">
                <h3>Overall Performance</h3>
                <div className="stat-value">{calculateOverallPercentage()}%</div>
                <ProgressBar
                  percentage={parseFloat(calculateOverallPercentage())}
                  color="#2563eb"
                />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Based on {marks.length} exams
                </p>
              </div>
              <div className="stat-card stagger-item">
                <h3>Assignments</h3>
                <div className="stat-value">{assignments.length}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Total assignments
                </p>
              </div>
              <div className="stat-card stagger-item">
                <h3>Announcements</h3>
                <div className="stat-value">{announcements.length}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Recent updates
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>My Assignments</h3>
            {assignments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No assignments available
              </p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Due Date</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Submit</th>
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
                          <td>{assignment.title}</td>
                          <td>{assignment.description || 'N/A'}</td>
                          <td>
                            {assignment.dueDate ? (
                              <span style={{ color: isOverdue ? 'var(--danger-color)' : 'inherit' }}>
                                {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td>
                            {assignment.fileUrl ? (
                              assignment.isBase64 ? (
                                <a
                                  href={assignment.fileUrl}
                                  download={assignment.fileName || 'assignment-file'}
                                  className="btn btn-primary download-btn"
                                  style={{ padding: '0.5rem', textDecoration: 'none' }}
                                >
                                  <FiDownload size={16} />
                                </a>
                              ) : (
                                <a
                                  href={assignment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary download-btn"
                                  style={{ padding: '0.5rem', textDecoration: 'none' }}
                                >
                                  <FiDownload size={16} />
                                </a>
                              )
                            ) : 'No file'}
                          </td>
                          <td>
                            {isOverdue ? (
                              <span className="badge badge-danger" style={{ display: 'inline-block' }}>Overdue</span>
                            ) : (
                              <span className="badge badge-success" style={{ display: 'inline-block' }}>Active</span>
                            )}
                          </td>
                          <td>
                            {isSubmitted ? (
                              <span className="badge badge-success" style={{ display: 'inline-block' }}>
                                <FiCheckCircle size={14} style={{ marginRight: '0.25rem' }} />
                                Submitted
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <FiUpload size={16} />
                                  <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileSelect(assignment.id, e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                  />
                                  <span style={{ fontSize: '0.875rem' }}>Choose File</span>
                                </label>
                                {selectedFile && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {selectedFile.name}
                                  </span>
                                )}
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleSubmitAssignment(assignment.id)}
                                  disabled={!selectedFile || uploadingAssignmentId === assignment.id}
                                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                >
                                  {uploadingAssignmentId === assignment.id ? 'Uploading...' : 'Submit'}
                                </button>
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
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>My Attendance</h3>
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
            <h3 style={{ marginBottom: '1.5rem' }}>My Marks & Results</h3>
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
          </div>
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>Class Timetable</h3>
            {timetable ? (
              <div className="timetable-container">
                <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Class: <strong>{timetable.className}</strong>
                </div>
                <div className="timetable-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const daySchedule = timetable.schedule?.[day] || [];

                    return (
                      <div key={day} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)' }}>
                        <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                          {day}
                        </h5>
                        {daySchedule.length === 0 ? (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No classes</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {daySchedule.map(entry => (
                              <div key={entry.id} style={{
                                background: 'var(--bg-color)',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                borderLeft: '3px solid var(--primary-color)'
                              }}>
                                <div style={{ fontWeight: 'bold' }}>{entry.subject}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <FiClock size={12} /> {entry.startTime} - {entry.endTime}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {entry.teacherName}
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
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <FiCalendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No timetable found. You may not be assigned to a class yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>Announcements</h3>
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

export default StudentDashboard;

