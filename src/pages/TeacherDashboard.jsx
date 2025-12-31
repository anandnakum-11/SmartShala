import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FiUpload, FiFile, FiCheck, FiX, FiPlus, FiCalendar, FiBookOpen, FiClipboard, FiUsers, FiBarChart, FiSearch, FiFilter, FiCheckCircle, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import Calendar from '../components/Calendar';
import SummaryCard from '../components/SummaryCard';
import { showToast } from '../components/ToastContainer';
import ProgressBar from '../components/ProgressBar';

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [marks, setMarks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceFilters, setAttendanceFilters] = useState({
    class: '',
    section: 'All'
  });
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [editingAttendance, setEditingAttendance] = useState(false);
  const [showDayAttendanceModal, setShowDayAttendanceModal] = useState(false);
  const [dayAttendanceData, setDayAttendanceData] = useState({ date: '', students: [] });
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    classId: '',
    file: null
  });
  const [marksForm, setMarksForm] = useState({
    studentId: '',
    subject: '',
    examType: '',
    marks: '',
    totalMarks: '',
    classId: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch teacher profile to get 'teacherId' (e.g. TEA-123)
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      let currentTeacherId = '';
      if (userDoc.exists()) {
        const data = userDoc.data();
        setTeacherProfile(data);
        currentTeacherId = data.teacherId;
      }

      // Fetch all classes
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const classesData = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesData);

      // Get class IDs for filtering
      const classIds = classesData.map(c => c.id);

      // Fetch students in teacher's classes
      const studentsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      const allStudents = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter students by teacher's classes
      const studentsData = classIds.length > 0
        ? allStudents.filter(s => s.classId && classIds.includes(s.classId))
        : allStudents;
      setStudents(studentsData);

      // Fetch assignments by this teacher
      const assignmentsSnapshot = await getDocs(query(collection(db, 'assignments'), where('teacherId', '==', currentUser.uid)));
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsData);

      // Fetch marks by this teacher
      const marksSnapshot = await getDocs(query(collection(db, 'marks'), where('teacherId', '==', currentUser.uid)));
      const marksData = marksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarks(marksData);

      // Fetch assignment submissions
      const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(submissionsData);

      // Fetch attendance for teacher's classes only
      const attendanceSnapshot = await getDocs(query(collection(db, 'attendance'), where('teacherId', '==', currentUser.uid)));
      const attendanceData = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendance(attendanceData);
      setAttendance(attendanceData);

      // Fetch all timetables
      const timetablesSnapshot = await getDocs(collection(db, 'timetables'));
      const timetablesData = timetablesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTimetables(timetablesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      // Check if attendance already exists for this date and class
      const existingAttendanceSnapshot = await getDocs(
        query(
          collection(db, 'attendance'),
          where('date', '==', selectedDate),
          where('classId', '==', selectedClass)
        )
      );

      if (!existingAttendanceSnapshot.empty) {
        alert('Attendance has already been marked for this class on this date. Please select a different date or class.');
        return;
      }

      const attendanceRecords = Object.keys(attendanceData).map(studentId => ({
        studentId,
        present: attendanceData[studentId],
        date: selectedDate,
        classId: selectedClass,
        teacherId: currentUser.uid,
        createdAt: new Date().toISOString()
      }));

      for (const record of attendanceRecords) {
        await addDoc(collection(db, 'attendance'), record);
      }

      setShowAttendanceModal(false);
      setAttendanceData({});
      setSelectedClass('');
      await fetchData();
      showToast('Attendance marked successfully!', 'success');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance. Please try again.');
    }
  };

  const handleUploadAssignment = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      // Validate required fields
      if (!assignmentForm.title.trim()) {
        throw new Error('Title is required');
      }
      if (!assignmentForm.dueDate) {
        throw new Error('Due date is required');
      }
      if (!assignmentForm.classId) {
        throw new Error('Class is required');
      }

      let fileUrl = '';
      let fileName = '';
      let fileData = null;

      // Handle file upload - Using base64 for free storage (no Firebase Storage needed)
      if (assignmentForm.file) {
        const maxSize = 500 * 1024; // 500KB limit for base64 storage
        const fileSize = assignmentForm.file.size;

        if (fileSize > maxSize) {
          throw new Error(`File is too large (${(fileSize / 1024).toFixed(2)} KB). Maximum size is 500 KB. Please compress the file or use a smaller file.`);
        }

        try {
          // Convert file to base64
          if (import.meta.env.DEV) {
            console.log('Converting file to base64...');
          }
          fileData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(assignmentForm.file);
          });

          fileName = assignmentForm.file.name;
          fileUrl = fileData; // Store base64 data as URL
          if (import.meta.env.DEV) {
            console.log('File converted to base64 successfully');
          }
        } catch (fileError) {
          console.error('File conversion error:', fileError);
          throw new Error(`File processing failed: ${fileError.message}`);
        }
      }

      // Save assignment to Firestore
      if (import.meta.env.DEV) {
        console.log('Saving assignment to Firestore...');
      }
      const assignmentData = {
        title: assignmentForm.title.trim(),
        description: assignmentForm.description.trim() || '',
        dueDate: assignmentForm.dueDate,
        classId: assignmentForm.classId,
        fileUrl, // This will be base64 data for small files
        fileName,
        fileType: assignmentForm.file ? assignmentForm.file.type : '',
        isBase64: !!fileData, // Flag to indicate if file is stored as base64
        teacherId: currentUser.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'assignments'), assignmentData);
      if (import.meta.env.DEV) {
        console.log('Assignment saved successfully!');
      }

      // Reset form and close modal
      setShowAssignmentModal(false);
      setAssignmentForm({ title: '', description: '', dueDate: '', classId: '', file: null });

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }

      // Refresh data
      await fetchData();

      alert('Assignment uploaded successfully!');
    } catch (error) {
      console.error('Error uploading assignment:', error);
      const errorMessage = error.message || 'Error uploading assignment. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleAddMarks = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'marks'), {
        studentId: marksForm.studentId,
        subject: marksForm.subject,
        examType: marksForm.examType,
        marks: parseFloat(marksForm.marks),
        totalMarks: parseFloat(marksForm.totalMarks),
        classId: marksForm.classId,
        teacherId: currentUser.uid,
        createdAt: new Date().toISOString()
      });

      setShowMarksModal(false);
      setMarksForm({ studentId: '', subject: '', examType: '', marks: '', totalMarks: '', classId: '' });
      await fetchData();
      showToast('Marks added successfully!', 'success');
    } catch (error) {
      console.error('Error adding marks:', error);
      alert('Error adding marks. Please try again.');
    }
  };

  const initializeAttendanceData = () => {
    const data = {};
    // Filter students by selected class if class is selected
    const filteredStudents = selectedClass
      ? students.filter(student => student.classId === selectedClass || !student.classId)
      : students;

    filteredStudents.forEach(student => {
      data[student.id] = true; // Default to present
    });
    setAttendanceData(data);
  };

  const handleSearchAttendance = () => {
    if (!selectedDate || !attendanceFilters.class) {
      showToast('Please select a date and class', 'warning');
      return;
    }

    const selectedClassObj = classes.find(c => c.id === attendanceFilters.class);
    if (!selectedClassObj) return;

    // Filter students by class and section
    let filtered = students.filter(student => {
      if (student.classId !== attendanceFilters.class) return false;
      if (attendanceFilters.section !== 'All' && selectedClassObj.section) {
        // If class has a section, match it
        return selectedClassObj.section === attendanceFilters.section;
      }
      return true;
    });

    setFilteredStudents(filtered);

    // Filter attendance records for selected date, class, and students
    const dateStr = selectedDate;
    const filteredAtt = attendance.filter(a => {
      const attendanceDate = a.date?.toDate
        ? format(a.date.toDate(), 'yyyy-MM-dd')
        : (a.date ? format(new Date(a.date), 'yyyy-MM-dd') : '');

      if (attendanceDate !== dateStr) return false;
      if (a.classId !== attendanceFilters.class) return false;
      return filtered.some(s => s.id === a.studentId);
    });

    setFilteredAttendance(filteredAtt);
  };

  const handleUpdateAttendance = async (attendanceId, studentId, isPresent) => {
    try {
      const dateStr = selectedDate;
      const classId = attendanceFilters.class;

      if (attendanceId) {
        // Update existing attendance record
        const attendanceRef = doc(db, 'attendance', attendanceId);
        await updateDoc(attendanceRef, {
          present: isPresent,
          updatedAt: new Date().toISOString()
        });
        showToast('Attendance updated successfully!', 'success');
      } else {
        // Create new attendance record
        await addDoc(collection(db, 'attendance'), {
          studentId,
          present: isPresent,
          date: dateStr,
          classId,
          teacherId: currentUser.uid,
          createdAt: new Date().toISOString()
        });
        showToast('Attendance marked successfully!', 'success');
      }

      // Refresh data
      await fetchData();
      // Re-run search to update filtered view
      setTimeout(() => handleSearchAttendance(), 500);
    } catch (error) {
      console.error('Error updating attendance:', error);
      showToast('Error updating attendance. Please try again.', 'error');
    }
  };

  const handleShowDayAttendance = (clickedDate) => {
    // Filter attendance records for the clicked date
    const dateStr = clickedDate;
    const dayAttendance = attendance.filter(a => {
      const attendanceDate = a.date?.toDate
        ? format(a.date.toDate(), 'yyyy-MM-dd')
        : (a.date ? format(new Date(a.date), 'yyyy-MM-dd') : '');
      return attendanceDate === dateStr && a.present;
    });

    // Get student details for present students
    const presentStudents = dayAttendance.map(att => {
      const student = students.find(s => s.id === att.studentId);
      return {
        id: student?.id || att.studentId,
        name: student?.name || student?.email || 'Unknown',
        studentId: student?.studentId || student?.id?.slice(0, 8) || 'N/A',
        classId: att.classId
      };
    });

    setDayAttendanceData({
      date: clickedDate,
      students: presentStudents
    });
    setShowDayAttendanceModal(true);
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="container page-enter">
      <div className="card animate-fade-in-up">
        <div className="card-header">
          <div>
            <h2 className="card-title welcome-text">Teacher Dashboard</h2>
            <p className="welcome-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Welcome back! Manage your classes and students efficiently.
            </p>
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
            className={`btn ${activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('assignments')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Assignments
          </button>
          <button
            className={`btn ${activeTab === 'marks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('marks')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Marks
          </button>
          <button
            className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('schedule')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            My Schedule
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            {/* Summary Cards */}
            <div className="summary-cards-grid">
              <SummaryCard
                title="Total Students"
                value={students.length}
                change="+12%"
                changeType="positive"
                icon={<FiUsers size={28} />}
                color="#667eea"
              />
              <SummaryCard
                title="Total Classes"
                value={classes.length}
                change="+5%"
                changeType="positive"
                icon={<FiBookOpen size={28} />}
                color="#764ba2"
              />
              <SummaryCard
                title="Assignments"
                value={assignments.length}
                change="+8%"
                changeType="positive"
                icon={<FiClipboard size={28} />}
                color="#10b981"
              />
              <SummaryCard
                title="Marks Entered"
                value={marks.length}
                change="+15%"
                changeType="positive"
                icon={<FiBarChart size={28} />}
                color="#f59e0b"
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h3>Recent Activity</h3>
                  <button className="btn-link">View All</button>
                </div>
                <div className="activity-list">
                  {assignments.slice(0, 5).map(assignment => (
                    <div key={assignment.id} className="activity-item">
                      <div className="activity-icon">
                        <FiClipboard size={20} />
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">New assignment: {assignment.title}</p>
                        <span className="activity-time">{format(new Date(assignment.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h3>Quick Actions</h3>
                </div>
                <div className="quick-actions">
                  <button
                    className="quick-action-btn"
                    onClick={() => {
                      setActiveTab('attendance');
                      initializeAttendanceData();
                      setShowAttendanceModal(true);
                    }}
                  >
                    <FiCalendar size={24} />
                    <span>Mark Attendance</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => {
                      setActiveTab('assignments');
                      setShowAssignmentModal(true);
                    }}
                  >
                    <FiPlus size={24} />
                    <span>Upload Assignment</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => {
                      setActiveTab('marks');
                      setShowMarksModal(true);
                    }}
                  >
                    <FiBarChart size={24} />
                    <span>Add Marks</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="attendance-section">
            <div className="attendance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title">Subject Attendance</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  initializeAttendanceData();
                  setShowAttendanceModal(true);
                }}
              >
                <FiCalendar size={18} />
                Mark Attendance
              </button>
            </div>

            {/* Filters */}
            <div className="attendance-filters" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div className="filter-group" style={{ flex: 1 }}>
                <label>Class *</label>
                <select
                  className="filter-select"
                  value={attendanceFilters.class}
                  onChange={(e) => {
                    setAttendanceFilters({ ...attendanceFilters, class: e.target.value, section: 'All' });
                  }}
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ flex: 1 }}>
                <label>Section *</label>
                <select
                  className="filter-select"
                  value={attendanceFilters.section}
                  onChange={(e) => setAttendanceFilters({ ...attendanceFilters, section: e.target.value })}
                  disabled={!attendanceFilters.class}
                >
                  <option value="All">All Sections</option>
                  {(() => {
                    let sectionsToShow = [];
                    if (attendanceFilters.class) {
                      const selectedClassObj = classes.find(c => c.id === attendanceFilters.class);
                      if (selectedClassObj?.section) {
                        sectionsToShow = [selectedClassObj.section];
                      } else {
                        sectionsToShow = [...new Set(classes.filter(c => c.section).map(c => c.section))];
                      }
                    } else {
                      sectionsToShow = [...new Set(classes.filter(c => c.section).map(c => c.section))];
                    }
                    return sectionsToShow.map((section, idx) => (
                      <option key={idx} value={section}>{section}</option>
                    ));
                  })()}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSearchAttendance}
                disabled={!attendanceFilters.class || !selectedDate}
                style={{ height: 'fit-content' }}
              >
                <FiSearch size={18} />
                Search
              </button>
            </div>

            {/* Selected Date Display */}
            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.5rem' }}>
              <strong>Selected Date: </strong>
              <span>{selectedDate ? format(new Date(selectedDate), 'MMMM dd, yyyy') : 'Please select a date from calendar'}</span>
            </div>

            {/* Attendance Content Grid */}
            <div className="attendance-content-grid">
              {/* Calendar and Summary Sidebar */}
              <div className="attendance-sidebar">
                <div className="calendar-card">
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      // Show day attendance modal
                      handleShowDayAttendance(date);
                      // Auto-search if filters are already set
                      if (attendanceFilters.class) {
                        setTimeout(() => handleSearchAttendance(), 100);
                      }
                    }}
                    markedDates={attendance.map(a => {
                      if (a.date?.toDate) {
                        return a.date.toDate();
                      }
                      return a.date ? new Date(a.date) : new Date();
                    })}
                  />
                </div>


              </div>

              {/* Attendance Table */}
              <div className="attendance-table-card" style={{ flex: 1 }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Attendance for {selectedDate ? format(new Date(selectedDate), 'MMMM dd, yyyy') : 'Selected Date'}</h3>
                  {filteredAttendance.length > 0 && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setEditingAttendance(!editingAttendance)}
                    >
                      {editingAttendance ? 'Done Editing' : 'Edit Attendance'}
                    </button>
                  )}
                </div>
                {filteredAttendance.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    {!selectedDate ? (
                      <p>Please select a date from the calendar</p>
                    ) : !attendanceFilters.class ? (
                      <p>Please select a class and section, then click Search</p>
                    ) : (
                      <p>No attendance records found for this date, class, and section</p>
                    )}
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Status</th>
                          {editingAttendance && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(student => {
                          const attendanceRecord = filteredAttendance.find(a => a.studentId === student.id);
                          const isPresent = attendanceRecord?.present ?? false;
                          return (
                            <tr key={student.id}>
                              <td>{student.studentId || student.id.slice(0, 8)}</td>
                              <td>{student.name || student.email}</td>
                              <td>
                                {attendanceRecord ? (
                                  <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`}>
                                    {isPresent ? 'Present' : 'Absent'}
                                  </span>
                                ) : (
                                  <span className="badge badge-secondary">Not Marked</span>
                                )}
                              </td>
                              {editingAttendance && (
                                <td>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      className={`btn ${isPresent ? 'btn-success' : 'btn-secondary'}`}
                                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                      onClick={() => handleUpdateAttendance(attendanceRecord?.id, student.id, true)}
                                    >
                                      <FiCheck size={14} /> Present
                                    </button>
                                    <button
                                      className={`btn ${!isPresent && attendanceRecord ? 'btn-danger' : 'btn-secondary'}`}
                                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                      onClick={() => handleUpdateAttendance(attendanceRecord?.id, student.id, false)}
                                    >
                                      <FiX size={14} /> Absent
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div>
            <div className="card-header">
              <h3>My Weekly Schedule</h3>
            </div>
            {teacherProfile ? (
              <div className="timetable-container">
                <div className="timetable-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    // Filter and aggregate classes for this day across all timetables
                    let myClasses = [];
                    timetables.forEach(t => {
                      if (t.schedule && t.schedule[day]) {
                        const matching = t.schedule[day].filter(entry =>
                          (entry.teacherId && entry.teacherId === teacherProfile.teacherId) ||
                          (entry.teacherId && entry.teacherId === currentUser.uid) // Fallback support
                        );
                        matching.forEach(m => {
                          myClasses.push({
                            ...m,
                            className: t.className || 'Unknown Class'
                          });
                        });
                      }
                    });

                    // Sort by time
                    myClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

                    return (
                      <div key={day} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)' }}>
                        <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                          {day}
                        </h5>
                        {myClasses.length === 0 ? (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No classes</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {myClasses.map((entry, idx) => (
                              <div key={idx} style={{
                                background: 'var(--bg-color)',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                borderLeft: '3px solid var(--primary-color)'
                              }}>
                                <div style={{ fontWeight: 'bold' }}>{entry.subject}</div>
                                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{entry.className}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                                  <FiClock size={12} /> {entry.startTime} - {entry.endTime}
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
                <p>Loading profile...</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            <div className="card-header">
              <h3>Assignments</h3>
              <button className="btn btn-primary" onClick={() => setShowAssignmentModal(true)}>
                <FiPlus size={18} />
                Upload Assignment
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Class</th>
                    <th>File</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(assignments) && assignments.map(assignment => {
                    if (!assignment) return null;

                    // Defensive checks for arrays
                    const safeStudents = Array.isArray(students) ? students : [];
                    const safeSubmissions = Array.isArray(submissions) ? submissions : [];
                    const safeClasses = Array.isArray(classes) ? classes : [];

                    const assignmentStudents = safeStudents.filter(s => s && s.classId === assignment.classId);
                    const assignmentSubmissions = safeSubmissions.filter(s => s && s.assignmentId === assignment.id);
                    const submittedCount = assignmentSubmissions.length;
                    const totalStudents = assignmentStudents.length;
                    const remainingCount = totalStudents - submittedCount;
                    const classObj = safeClasses.find(c => c && c.id === assignment.classId);

                    return (
                      <tr key={assignment.id}>
                        <td>{assignment.title || 'Untitled'}</td>
                        <td>
                          {(() => {
                            if (!assignment.dueDate) return 'N/A';
                            const date = new Date(assignment.dueDate);
                            return !isNaN(date.getTime()) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
                          })()}
                        </td>
                        <td>{classObj?.name || assignment.classId || 'N/A'}</td>
                        <td>
                          {assignment.fileUrl ? (
                            assignment.isBase64 ? (
                              <a
                                href={assignment.fileUrl}
                                download={assignment.fileName || 'assignment-file'}
                                style={{ textDecoration: 'none' }}
                              >
                                <FiFile size={18} /> {assignment.fileName || 'Download'}
                              </a>
                            ) : (
                              <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer">
                                <FiFile size={18} />
                              </a>
                            )
                          ) : 'No file'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                              ✓ {submittedCount} Submitted
                            </span>
                            <span style={{ color: 'var(--warning-color)', fontWeight: 600 }}>
                              ⚠ {remainingCount} Remaining
                            </span>
                            <small style={{ color: 'var(--text-secondary)' }}>
                              Total: {totalStudents} students
                            </small>
                          </div>
                        </td>
                        <td>
                          {remainingCount > 0 ? (
                            <span className="badge badge-warning">Pending</span>
                          ) : (
                            <span className="badge badge-success">All Submitted</span>
                          )}
                        </td>
                        <td>
                          {remainingCount > 0 && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                              onClick={() => {
                                showToast(`Notification feature coming soon! ${remainingCount} students need to submit.`, 'info');
                              }}
                            >
                              <FiBell size={14} /> Notify
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Marks Tab */}
        {activeTab === 'marks' && (
          <div>
            <div className="card-header">
              <h3>Student Marks</h3>
              <button className="btn btn-primary" onClick={() => setShowMarksModal(true)}>
                <FiPlus size={18} />
                Add Marks
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Exam Type</th>
                    <th>Marks</th>
                    <th>Total</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map(mark => {
                    const student = students.find(s => s.id === mark.studentId);
                    const percentage = ((mark.marks / mark.totalMarks) * 100).toFixed(2);
                    return (
                      <tr key={mark.id}>
                        <td>{student?.name || 'N/A'}</td>
                        <td>{mark.subject}</td>
                        <td>{mark.examType}</td>
                        <td>{mark.marks}</td>
                        <td>{mark.totalMarks}</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Mark Attendance</h3>
              <button className="modal-close" onClick={() => setShowAttendanceModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleMarkAttendance}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select
                  className="form-select"
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    // Reinitialize attendance data when class changes
                    if (e.target.value) {
                      const filteredStudents = students.filter(student => student.classId === e.target.value || !student.classId);
                      const data = {};
                      filteredStudents.forEach(student => {
                        data[student.id] = true;
                      });
                      setAttendanceData(data);
                    } else {
                      initializeAttendanceData();
                    }
                  }}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Students</label>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem' }}>
                  {students.filter(student => {
                    // Filter by selected class if class is selected
                    if (selectedClass) {
                      return student.classId === selectedClass || !student.classId;
                    }
                    return true;
                  }).map((student, index) => (
                    <div
                      key={student.id}
                      className="stagger-item"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '0.5rem', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontWeight: 500 }}>{student.name || student.email}</span>
                      <div className="attendance-toggle">
                        <button
                          type="button"
                          className={`attendance-toggle-btn present ${attendanceData[student.id] !== false ? 'active' : ''}`}
                          onClick={(e) => {
                            setAttendanceData({ ...attendanceData, [student.id]: true });
                            // Add success animation
                            const btn = e.target.closest('.attendance-toggle-btn');
                            if (btn) {
                              btn.style.transform = 'scale(0.95)';
                              setTimeout(() => btn.style.transform = 'scale(1)', 150);
                            }
                          }}
                        >
                          <FiCheck size={16} /> Present
                        </button>
                        <button
                          type="button"
                          className={`attendance-toggle-btn absent ${attendanceData[student.id] === false ? 'active' : ''}`}
                          onClick={(e) => {
                            setAttendanceData({ ...attendanceData, [student.id]: false });
                            // Add animation
                            const btn = e.target.closest('.attendance-toggle-btn');
                            if (btn) {
                              btn.style.transform = 'scale(0.95)';
                              setTimeout(() => btn.style.transform = 'scale(1)', 150);
                            }
                          }}
                        >
                          <FiX size={16} /> Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAttendanceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Assignment</h3>
              <button className="modal-close" onClick={() => setShowAssignmentModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleUploadAssignment}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  required
                  disabled={uploading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  disabled={uploading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={assignmentForm.dueDate}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                  required
                  disabled={uploading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select
                  className="form-select"
                  value={assignmentForm.classId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                  required
                  disabled={uploading}
                >
                  <option value="">Select Class</option>
                  {classes.length === 0 ? (
                    <option value="" disabled>No classes available. Please create a class first.</option>
                  ) : (
                    classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))
                  )}
                </select>
                {classes.length === 0 && (
                  <small style={{ color: 'var(--warning-color)', display: 'block', marginTop: '0.5rem' }}>
                    ⚠️ No classes found. Please create a class in the Admin dashboard first.
                  </small>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">File (Optional)</label>
                <div
                  className={`file-drop-area ${uploading ? 'uploading' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('dragover');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('dragover');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setAssignmentForm({ ...assignmentForm, file });
                    }
                  }}
                >
                  <input
                    type="file"
                    className="form-input"
                    style={{ display: 'none' }}
                    id="file-input"
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, file: e.target.files?.[0] || null })}
                    disabled={uploading}
                  />
                  <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
                    <FiUpload size={32} style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }} />
                    <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Click to upload or drag and drop</p>
                    <small style={{ color: 'var(--text-secondary)' }}>Files up to 500 KB (Free storage)</small>
                  </label>
                </div>
                {assignmentForm.file && (
                  <div style={{ marginTop: '0.5rem' }} className="animate-fade-in-up">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <small style={{ color: 'var(--text-secondary)' }}>
                        <FiFile size={14} style={{ marginRight: '0.25rem' }} />
                        {assignmentForm.file.name} ({(assignmentForm.file.size / 1024).toFixed(2)} KB)
                      </small>
                      <button
                        type="button"
                        onClick={() => setAssignmentForm({ ...assignmentForm, file: null })}
                        style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                    {assignmentForm.file.size > 500 * 1024 && (
                      <div className="alert alert-error" style={{ padding: '0.5rem', marginTop: '0.5rem' }}>
                        ⚠️ File is larger than 500 KB. Please compress it.
                      </div>
                    )}
                    {assignmentForm.file.size <= 500 * 1024 && (
                      <div className="alert alert-success" style={{ padding: '0.5rem', marginTop: '0.5rem' }}>
                        <FiCheckCircle size={14} style={{ marginRight: '0.25rem' }} />
                        File size is acceptable
                      </div>
                    )}
                  </div>
                )}
                {uploading && uploadProgress > 0 && (
                  <div className="upload-progress animate-fade-in-up" style={{ marginTop: '1rem' }}>
                    <div className="upload-progress-text">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <ProgressBar percentage={uploadProgress} color="#2563eb" />
                  </div>
                )}
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setError('');
                    setAssignmentForm({ title: '', description: '', dueDate: '', classId: '', file: null });
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) fileInput.value = '';
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  <FiUpload size={18} />
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marks Modal */}
      {showMarksModal && (
        <div className="modal-overlay" onClick={() => setShowMarksModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Marks</h3>
              <button className="modal-close" onClick={() => setShowMarksModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleAddMarks}>
              <div className="form-group">
                <label className="form-label">Student</label>
                <select
                  className="form-select"
                  value={marksForm.studentId}
                  onChange={(e) => setMarksForm({ ...marksForm, studentId: e.target.value })}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.name || student.email}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={marksForm.subject}
                  onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Exam Type *</label>
                <select
                  className="form-select"
                  value={marksForm.examType}
                  onChange={(e) => setMarksForm({ ...marksForm, examType: e.target.value })}
                  required
                >
                  <option value="">Select Exam Type</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Project">Project</option>
                  <option value="Practical">Practical</option>
                  <option value="Internal Assessment">Internal Assessment</option>
                  <option value="External Assessment">External Assessment</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Marks Obtained</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={marksForm.marks}
                  onChange={(e) => setMarksForm({ ...marksForm, marks: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Marks</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={marksForm.totalMarks}
                  onChange={(e) => setMarksForm({ ...marksForm, totalMarks: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select
                  className="form-select"
                  value={marksForm.classId}
                  onChange={(e) => setMarksForm({ ...marksForm, classId: e.target.value })}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.length === 0 ? (
                    <option value="" disabled>No classes available. Please create a class first.</option>
                  ) : (
                    classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ''} {cls.grade ? `(Grade ${cls.grade})` : ''}
                      </option>
                    ))
                  )}
                </select>
                {classes.length === 0 && (
                  <small style={{ color: 'var(--warning-color)', display: 'block', marginTop: '0.5rem' }}>
                    ⚠️ No classes found. Please create a class in the Admin dashboard first.
                  </small>
                )}
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMarksModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day Attendance Modal */}
      {showDayAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowDayAttendanceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Attendance for {dayAttendanceData.date ? format(new Date(dayAttendanceData.date), 'MMMM dd, yyyy') : ''}
              </h3>
              <button className="modal-close" onClick={() => setShowDayAttendanceModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body">
              {dayAttendanceData.students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <FiCalendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>No attendance records found for this date.</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Students may not have been marked present on this day.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'var(--success-color-light, #d1fae5)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiCheckCircle size={20} style={{ color: 'var(--success-color)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>
                      {dayAttendanceData.students.length} student{dayAttendanceData.students.length !== 1 ? 's' : ''} present
                    </span>
                  </div>
                  <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayAttendanceData.students.map((student, index) => (
                          <tr key={student.id || index}>
                            <td>{student.studentId}</td>
                            <td>{student.name}</td>
                            <td>
                              <span className="badge badge-success">
                                <FiCheck size={14} /> Present
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowDayAttendanceModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

