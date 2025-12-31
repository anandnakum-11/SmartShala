import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FiUpload, FiFile, FiCheck, FiX, FiPlus, FiCalendar, FiBookOpen, FiClipboard, FiUsers, FiBarChart, FiSearch, FiFilter, FiCheckCircle, FiClock, FiBell } from 'react-icons/fi';
import { format } from 'date-fns';
import Calendar from '../components/Calendar';
import SummaryCard from '../components/SummaryCard';
import { showToast } from '../components/ToastContainer';
import ProgressBar from '../components/ProgressBar';

const TeacherDashboard = () => {
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
        ? safeFormat(a.date.toDate(), 'yyyy-MM-dd')
        : (a.date ? safeFormat(new Date(a.date), 'yyyy-MM-dd') : '');

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
        ? safeFormat(a.date.toDate(), 'yyyy-MM-dd')
        : (a.date ? safeFormat(new Date(a.date), 'yyyy-MM-dd') : '');
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
              className={`tab-item-modern ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              <FiClipboard /> Assignments
            </button>
            <button
              className={`tab-item-modern ${activeTab === 'marks' ? 'active' : ''}`}
              onClick={() => setActiveTab('marks')}
            >
              <FiUpload /> Marks
            </button>
            <button
              className={`tab-item-modern ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <FiCalendar /> My Schedule
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content-card" style={{ padding: '1.5rem' }}>
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
                  <h3><FiClock style={{ marginRight: '0.5rem' }} /> Recent Activity</h3>
                  <button className="btn-link">View All</button>
                </div>
                <div className="activity-list">
                  {Array.isArray(assignments) && assignments.slice(0, 5).map(assignment => (
                    <div key={assignment.id} className="activity-item">
                      <div className="activity-icon">
                        <FiClipboard size={20} />
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">New assignment: {assignment.title || 'Untitled'}</p>
                        <span className="activity-time">
                          {assignment.createdAt ? safeFormat(assignment.createdAt, 'MMM dd, yyyy') : 'Recently'}
                        </span>
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
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiCalendar className="icon-glow" /> Subject Attendance</h3>
              <button
                className="btn btn-primary"
                onClick={() => {
                  initializeAttendanceData();
                  setShowAttendanceModal(true);
                }}
              >
                <FiPlus size={18} />
                Mark New Attendance
              </button>
            </div>

            {/* Filters */}
            <div className="attendance-filters" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', background: 'var(--bg-color)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              <div className="filter-group">
                <label>Select Class</label>
                <select
                  className="filter-select"
                  value={attendanceFilters.class}
                  onChange={(e) => {
                    setAttendanceFilters({ ...attendanceFilters, class: e.target.value, section: 'All' });
                  }}
                >
                  <option value="">Choose Class...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `- ${cls.section}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Select Section</label>
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
                style={{ height: '3.1rem', marginTop: 'auto' }}
              >
                <FiSearch size={18} />
                Fetch Records
              </button>
            </div>

            {/* Attendance Content Grid */}
            <div className="attendance-content-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
              {/* Calendar and Summary Sidebar */}
              <div className="attendance-sidebar">
                <div className="calendar-card" style={{ border: '1px solid var(--border-color)' }}>
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      handleShowDayAttendance(date);
                      if (attendanceFilters.class) {
                        setTimeout(() => handleSearchAttendance(), 100);
                      }
                    }}
                    markedDates={attendance.map(a => {
                      if (a.date?.toDate) return a.date.toDate();
                      return a.date ? new Date(a.date) : new Date();
                    })}
                  />
                </div>

                <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-color)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Selection</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>
                    <FiCalendar style={{ marginRight: '0.5rem' }} />
                    {selectedDate ? safeFormat(new Date(selectedDate), 'MMMM dd, yyyy') : 'Pick a date'}
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="modern-table-container" style={{ marginTop: 0 }}>
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                    <h4 style={{ margin: 0, fontWeight: 700 }}>Students List</h4>
                    {filteredAttendance.length > 0 && (
                      <button
                        className="teacher-action-btn-modern btn-secondary"
                        onClick={() => setEditingAttendance(!editingAttendance)}
                      >
                        {editingAttendance ? <FiCheck /> : <FiSearch />}
                        {editingAttendance ? 'Finish' : 'Edit'}
                      </button>
                    )}
                  </div>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Status</th>
                        {editingAttendance && <th style={{ textAlign: 'right' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={editingAttendance ? 4 : 3} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                            <FiUsers size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p style={{ margin: 0 }}>No students found in this class/section. Select a class and click Fetch.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map(student => {
                          const attendanceRecord = filteredAttendance.find(a => a.studentId === student.id);
                          const isPresent = attendanceRecord?.present ?? false;
                          return (
                            <tr key={student.id}>
                              <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                                {student.studentId || student.id.slice(0, 8)}
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{student.name || student.email}</div>
                              </td>
                              <td>
                                {attendanceRecord ? (
                                  <span className={`status-indicator ${isPresent ? 'success' : 'danger'}`}>
                                    {isPresent ? <FiCheckCircle size={14} /> : <FiX size={14} />}
                                    {isPresent ? 'Present' : 'Absent'}
                                  </span>
                                ) : (
                                  <span className="status-indicator info">Not Marked</span>
                                )}
                              </td>
                              {editingAttendance && (
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button
                                      className={`teacher-action-btn-modern ${isPresent ? 'btn-success' : 'btn-secondary'}`}
                                      style={{ padding: '0.4rem 0.8rem' }}
                                      onClick={() => handleUpdateAttendance(attendanceRecord?.id, student.id, true)}
                                    >
                                      Present
                                    </button>
                                    <button
                                      className={`teacher-action-btn-modern ${!isPresent && attendanceRecord ? 'btn-danger' : 'btn-secondary'}`}
                                      style={{ padding: '0.4rem 0.8rem' }}
                                      onClick={() => handleUpdateAttendance(attendanceRecord?.id, student.id, false)}
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiClock className="icon-glow" /> My Weekly Schedule</h3>
            </div>
            {teacherProfile ? (
              <div className="timetable-container" style={{ marginTop: '1rem' }}>
                <div className="timetable-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    let myClasses = [];
                    timetables.forEach(t => {
                      if (t.schedule && t.schedule[day]) {
                        const matching = t.schedule[day].filter(entry =>
                          (entry.teacherId && entry.teacherId === teacherProfile.teacherId) ||
                          (entry.teacherId && entry.teacherId === currentUser.uid)
                        );
                        matching.forEach(m => {
                          myClasses.push({
                            ...m,
                            className: t.className || 'Unknown Class'
                          });
                        });
                      }
                    });

                    myClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

                    return (
                      <div key={day} className="card" style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1rem', boxShadow: 'none' }}>
                        <h5 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', color: 'var(--primary-dark)', fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {day}
                        </h5>
                        {myClasses.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>No classes scheduled</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {myClasses.map((entry, idx) => (
                              <div key={idx} style={{
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
                                <div style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                                  <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', fontWeight: 600 }}>{entry.className}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '0.4rem' }}>
                                  <FiClock size={14} style={{ color: 'var(--primary-color)' }} />
                                  <span style={{ fontWeight: 600 }}>{entry.startTime} - {entry.endTime}</span>
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
                <p>Loading your schedule...</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiClipboard className="icon-glow" /> Assignments</h3>
              <button className="btn btn-primary" onClick={() => setShowAssignmentModal(true)}>
                <FiPlus size={18} />
                Upload Assignment
              </button>
            </div>

            <div className="modern-table-container">
              <table className="modern-table">
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
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                            {assignment.title || 'Untitled'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <FiCalendar size={14} />
                            {(() => {
                              if (!assignment.dueDate) return 'N/A';
                              const date = new Date(assignment.dueDate);
                              return !isNaN(date.getTime()) ? safeFormat(date, 'MMM dd, yyyy') : 'Invalid Date';
                            })()}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ padding: '0.4rem 0.8rem', borderRadius: '0.5rem' }}>
                            {classObj?.name || assignment.classId || 'N/A'}
                          </span>
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
                              <FiFile size={18} />
                              <span>{assignment.fileName ? (assignment.fileName.length > 15 ? assignment.fileName.substring(0, 12) + '...' : assignment.fileName) : 'View File'}</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No file</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{submittedCount} Submitted</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning-color)' }}></div>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{remainingCount} Pending</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {remainingCount === 0 ? (
                            <span className="status-indicator success">
                              <FiCheckCircle size={14} /> Complete
                            </span>
                          ) : (
                            <span className="status-indicator warning">
                              <FiClock size={14} /> {submittedCount}/{totalStudents}
                            </span>
                          )}
                        </td>
                        <td>
                          {remainingCount > 0 && (
                            <button
                              className="teacher-action-btn-modern btn-secondary"
                              onClick={() => showToast(`Notification sent to ${remainingCount} students.`, 'info')}
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
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiBarChart className="icon-glow" /> Student Marks</h3>
              <button className="btn btn-primary" onClick={() => setShowMarksModal(true)}>
                <FiPlus size={18} />
                Add Marks
              </button>
            </div>

            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Exam Type</th>
                    <th>Marks</th>
                    <th>Total</th>
                    <th>Percentage</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map(mark => {
                    const student = students.find(s => s.id === mark.studentId);
                    const percentage = parseFloat(((mark.marks / mark.totalMarks) * 100).toFixed(2));

                    let statusClass = 'success';
                    if (percentage < 40) statusClass = 'danger';
                    else if (percentage < 75) statusClass = 'warning';

                    return (
                      <tr key={mark.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{student?.name || 'N/A'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student?.email}</div>
                        </td>
                        <td>{mark.subject}</td>
                        <td>
                          <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            {mark.examType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{mark.marks}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{mark.totalMarks}</td>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{percentage}%</div>
                        </td>
                        <td>
                          <span className={`status-indicator ${statusClass}`}>
                            {percentage >= 75 ? 'Excellent' : percentage >= 40 ? 'Satisfactory' : 'Needs Improvement'}
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
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header-modern">
              <h3 className="modal-title-modern">Mark Attendance</h3>
              <button className="modal-close-modern" onClick={() => setShowAttendanceModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body-modern">
              <form onSubmit={handleMarkAttendance}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Date</label>
                  <input
                    type="date"
                    className="form-input-modern"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Class</label>
                  <select
                    className="form-select-modern"
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
                <div className="form-group-modern">
                  <label className="form-label-modern">Students</label>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1rem', background: 'var(--bg-color)' }}>
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
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '0.75rem', transition: 'background 0.2s', background: 'white', marginBottom: '0.5rem', boxShadow: 'var(--shadow-sm)' }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{student.name || student.email}</span>
                        <div className="attendance-toggle" style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className={`teacher-action-btn-modern btn-success ${attendanceData[student.id] !== false ? 'active' : ''}`}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={(e) => {
                              setAttendanceData({ ...attendanceData, [student.id]: true });
                              // Add success animation
                              const btn = e.currentTarget;
                              btn.style.transform = 'scale(0.95)';
                              setTimeout(() => btn.style.transform = 'scale(1)', 150);
                            }}
                          >
                            <FiCheck size={14} /> Present
                          </button>
                          <button
                            type="button"
                            className={`teacher-action-btn-modern btn-danger ${attendanceData[student.id] === false ? 'active' : ''}`}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={(e) => {
                              setAttendanceData({ ...attendanceData, [student.id]: false });
                              // Add animation
                              const btn = e.currentTarget;
                              btn.style.transform = 'scale(0.95)';
                              setTimeout(() => btn.style.transform = 'scale(1)', 150);
                            }}
                          >
                            <FiX size={14} /> Absent
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer-modern" style={{ marginTop: '2rem', padding: 0, background: 'transparent', border: 'none' }}>
                  <button type="button" className="teacher-action-btn-modern btn-secondary" onClick={() => setShowAttendanceModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="teacher-action-btn-modern btn-primary">
                    Save Attendance Records
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAssignmentModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header-modern">
              <h3 className="modal-title-modern">Upload Assignment</h3>
              <button className="modal-close-modern" onClick={() => setShowAssignmentModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body-modern">
              <form onSubmit={handleUploadAssignment}>
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                    {error}
                  </div>
                )}
                <div className="form-group-modern">
                  <label className="form-label-modern">Assignment Title</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    placeholder="e.g. Physics Lab Report"
                    required
                    disabled={uploading}
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Academic Description</label>
                  <textarea
                    className="form-input-modern"
                    rows="4"
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    placeholder="Provide details about the assignment..."
                    disabled={uploading}
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Submission Deadline</label>
                  <input
                    type="date"
                    className="form-input-modern"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    required
                    disabled={uploading}
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Target Cohort/Class</label>
                  <select
                    className="form-select-modern"
                    value={assignmentForm.classId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                    required
                    disabled={uploading}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Reference Materials (Optional)</label>
                  <div className="file-drop-area-modern" style={{ border: '2px dashed var(--border-color)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', background: 'var(--bg-color)', transition: 'all 0.2s' }}>
                    <input
                      type="file"
                      className="form-input"
                      style={{ display: 'none' }}
                      id="file-input"
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, file: e.target.files?.[0] || null })}
                      disabled={uploading}
                    />
                    <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                      <FiUpload size={32} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
                      <p style={{ fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Upload Document</p>
                      <small style={{ color: 'var(--text-secondary)' }}>Max file size: 500 KB</small>
                    </label>
                  </div>
                </div>
                <div className="modal-footer-modern" style={{ padding: 0, marginTop: '2rem', background: 'transparent', border: 'none' }}>
                  <button
                    type="button"
                    className="teacher-action-btn-modern btn-secondary"
                    onClick={() => setShowAssignmentModal(false)}
                    disabled={uploading}
                  >
                    Discard
                  </button>
                  <button type="submit" className="teacher-action-btn-modern btn-primary" disabled={uploading}>
                    <FiUpload size={18} />
                    {uploading ? 'Processing...' : 'Upload Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Marks Modal */}
      {showMarksModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowMarksModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header-modern">
              <h3 className="modal-title-modern">Add Evaluation Marks</h3>
              <button className="modal-close-modern" onClick={() => setShowMarksModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body-modern">
              <form onSubmit={handleAddMarks}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Student</label>
                  <select
                    className="form-select-modern"
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
                <div className="form-group-modern">
                  <label className="form-label-modern">Subject</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={marksForm.subject}
                    onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Exam Type *</label>
                  <select
                    className="form-select-modern"
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
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group-modern" style={{ marginBottom: 0 }}>
                    <label className="form-label-modern">Marks Obtained</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input-modern"
                      value={marksForm.marks}
                      onChange={(e) => setMarksForm({ ...marksForm, marks: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-modern" style={{ marginBottom: 0 }}>
                    <label className="form-label-modern">Total Marks</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input-modern"
                      value={marksForm.totalMarks}
                      onChange={(e) => setMarksForm({ ...marksForm, totalMarks: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Class</label>
                  <select
                    className="form-select-modern"
                    value={marksForm.classId}
                    onChange={(e) => setMarksForm({ ...marksForm, classId: e.target.value })}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ''} {cls.grade ? `(Grade ${cls.grade})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer-modern" style={{ padding: 0, marginTop: '2rem', background: 'transparent', border: 'none' }}>
                  <button type="button" className="teacher-action-btn-modern btn-secondary" onClick={() => setShowMarksModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="teacher-action-btn-modern btn-primary">
                    <FiCheck style={{ marginRight: '0.5rem' }} /> Save Marks
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Day Attendance Modal */}
      {showDayAttendanceModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowDayAttendanceModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header-modern">
              <h3 className="modal-title-modern">
                Attendance for {dayAttendanceData.date ? safeFormat(dayAttendanceData.date, 'MMMM dd, yyyy') : ''}
              </h3>
              <button className="modal-close-modern" onClick={() => setShowDayAttendanceModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body-modern">
              {dayAttendanceData.students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', borderRadius: '1rem' }}>
                  <FiCalendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>No attendance records found for this date.</p>
                </div>
              ) : (
                <div>
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <FiCheckCircle size={20} style={{ color: 'var(--success-color)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--success-color)' }}>
                      {dayAttendanceData.students.length} student{dayAttendanceData.students.length !== 1 ? 's' : ''} present
                    </span>
                  </div>
                  <div className="modern-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Full Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayAttendanceData.students.map((student, index) => (
                          <tr key={student.id || index}>
                            <td style={{ fontWeight: 700 }}>{student.studentId}</td>
                            <td>{student.name}</td>
                            <td>
                              <span className="status-indicator success">
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
            <div className="modal-footer-modern">
              <button className="teacher-action-btn-modern btn-secondary" onClick={() => setShowDayAttendanceModal(false)}>
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

