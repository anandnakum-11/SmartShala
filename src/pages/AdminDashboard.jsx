import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FiUsers, FiBook, FiUserPlus, FiPlus, FiEdit, FiTrash2, FiX, FiBell, FiBarChart, FiTrendingUp, FiEye, FiClipboard, FiCalendar, FiClock, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';
import { setDoc, getDoc } from 'firebase/firestore';
import SummaryCard from '../components/SummaryCard';
import { showToast } from '../components/ToastContainer';
import { generateIdByRole, getIdFieldName } from '../utils/idGenerator';

const AdminDashboard = () => {
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
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [studentFilter, setStudentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showAssignStudentsModal, setShowAssignStudentsModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudentsForClass, setSelectedStudentsForClass] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    name: '',
    studentId: '',
    parentId: '',
    teacherId: '',
    childEmail: '',
    childStudentId: ''
  });
  const [generatingId, setGeneratingId] = useState(false);
  const [classFormData, setClassFormData] = useState({
    standard: '',
    section: ''
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: ''
  });
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetableForm, setTimetableForm] = useState({
    day: 'Monday',
    startTime: '',
    endTime: '',
    subject: '',
    teacherId: ''
  });
  const [selectedTimetableClass, setSelectedTimetableClass] = useState(null);
  const [editingTimetableEntry, setEditingTimetableEntry] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setStudents(usersData.filter(u => u.role === 'student'));

      // Fetch classes
      const classesSnapshot = await getDocs(collection(db, 'classes'));
      const classesData = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesData);

      // Fetch timetables
      const timetablesSnapshot = await getDocs(collection(db, 'timetables'));
      const timetablesData = timetablesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTimetables(timetablesData);

      // Fetch announcements
      const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsData.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ));

      // Fetch assignments
      const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsData);

      // Fetch attendance
      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      const attendanceData = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendance(attendanceData);

      // Fetch marks
      const marksSnapshot = await getDocs(collection(db, 'marks'));
      const marksData = marksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarks(marksData);

      // Fetch submissions
      const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const idFieldName = getIdFieldName(formData.role);
      let userId = formData[idFieldName];

      // Generate ID if not already set
      if (!userId) {
        userId = await generateIdByRole(formData.role);
      }

      // For parent role, child email or student ID is compulsory
      if (formData.role === 'parent') {
        if (!formData.childEmail && !formData.childStudentId) {
          showToast('Child email or Student ID is required for parent registration.', 'error');
          return;
        }
      }

      // Create user document with generated ID
      const userData = {
        email: formData.email,
        role: formData.role,
        name: formData.name,
        [idFieldName]: userId,
        createdAt: new Date().toISOString()
      };

      // Store child information for parent
      if (formData.role === 'parent') {
        if (formData.childEmail) {
          userData.childEmail = formData.childEmail;
        }
        if (formData.childStudentId) {
          userData.childStudentId = formData.childStudentId;
        }
      }

      await addDoc(collection(db, 'users'), userData);
      setShowUserModal(false);
      setFormData({ email: '', password: '', role: 'student', name: '', studentId: '', parentId: '', teacherId: '', childEmail: '', childStudentId: '' });
      await fetchData();
      showToast(`User created successfully! ${idFieldName}: ${userId}`, 'success');
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('Error creating user. Please try again.', 'error');
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'classes'), {
        name: `${classFormData.standard} - ${classFormData.section}`,
        standard: classFormData.standard,
        section: classFormData.section,
        createdAt: new Date().toISOString()
      });
      setShowClassModal(false);
      setClassFormData({ standard: '', section: '' });
      await fetchData();
      showToast('Class created successfully!', 'success');
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Error creating class. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        await fetchData();
        showToast('User deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteDoc(doc(db, 'classes', classId));
        await fetchData();
        showToast('Class deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error deleting class. Please try again.');
      }
    }
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    try {
      const classRef = doc(db, 'classes', selectedClass.id);
      await updateDoc(classRef, {
        name: `${classFormData.standard} - ${classFormData.section}`,
        standard: classFormData.standard,
        section: classFormData.section,
        updatedAt: new Date().toISOString()
      });
      setShowEditClassModal(false);
      setSelectedClass(null);
      setClassFormData({ standard: '', section: '' });
      await fetchData();
      showToast('Class updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating class:', error);
      showToast('Error updating class. Please try again.', 'error');
    }
  };

  const handleAssignStudents = async () => {
    try {
      // Update each selected student with the classId
      for (const studentId of selectedStudentsForClass) {
        const studentRef = doc(db, 'users', studentId);
        await updateDoc(studentRef, {
          classId: selectedClass.id,
          updatedAt: new Date().toISOString()
        });
      }
      setShowAssignStudentsModal(false);
      setSelectedClass(null);
      setSelectedStudentsForClass([]);
      await fetchData();
      showToast(`${selectedStudentsForClass.length} student(s) assigned successfully!`, 'success');
    } catch (error) {
      console.error('Error assigning students:', error);
      showToast('Error assigning students. Please try again.', 'error');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'announcements'), {
        title: announcementForm.title,
        message: announcementForm.message,
        createdAt: new Date().toISOString()
      });
      setShowAnnouncementModal(false);
      setAnnouncementForm({ title: '', message: '' });
      await fetchData();
      showToast('Announcement created successfully!', 'success');
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Error creating announcement. Please try again.');
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteDoc(doc(db, 'announcements', announcementId));
        await fetchData();
        showToast('Announcement deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Error deleting announcement. Please try again.');
      }
    }
  };

  // Helper to convert HH:mm to minutes
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSaveTimetableEntry = async (e) => {
    e.preventDefault();
    if (!selectedTimetableClass) {
      showToast('Please select a class first.', 'error');
      return;
    }

    try {
      const timetableRef = doc(db, 'timetables', selectedTimetableClass.id);
      const timetableDoc = await getDoc(timetableRef);

      let currentSchedule = {};
      if (timetableDoc.exists()) {
        currentSchedule = timetableDoc.data().schedule || {};
      }

      const daySchedule = currentSchedule[timetableForm.day] || [];

      const teacher = users.find(u => u.teacherId === timetableForm.teacherId);
      const teacherName = teacher ? teacher.name : 'Unknown';

      const newEntry = {
        id: editingTimetableEntry ? editingTimetableEntry.id : Date.now().toString(),
        startTime: timetableForm.startTime,
        endTime: timetableForm.endTime,
        subject: timetableForm.subject,
        teacherId: timetableForm.teacherId,
        teacherName
      };

      // Collision Detection
      const newStart = timeToMinutes(newEntry.startTime);
      const newEnd = timeToMinutes(newEntry.endTime);

      if (newStart >= newEnd) {
        showToast('End time must be after start time.', 'error');
        return;
      }

      // 1. Check for overlap in the SAME class
      const isOverlapInClass = daySchedule.some(entry => {
        if (editingTimetableEntry && entry.id === editingTimetableEntry.id) return false;
        const entryStart = timeToMinutes(entry.startTime);
        const entryEnd = timeToMinutes(entry.endTime);
        return (newStart < entryEnd && newEnd > entryStart);
      });

      if (isOverlapInClass) {
        showToast('This time slot overlaps with another subject in this class.', 'error');
        return;
      }

      // 2. Check if the TEACHER is booked elsewhere
      let teacherConflictClass = null;
      for (const ttable of timetables) {
        const scheduleAtDay = ttable.schedule?.[timetableForm.day] || [];
        const conflict = scheduleAtDay.find(entry => {
          // If editing, skip the current entry in the same class
          if (ttable.id === selectedTimetableClass.id && editingTimetableEntry && entry.id === editingTimetableEntry.id) return false;

          if (entry.teacherId === timetableForm.teacherId) {
            const entryStart = timeToMinutes(entry.startTime);
            const entryEnd = timeToMinutes(entry.endTime);
            return (newStart < entryEnd && newEnd > entryStart);
          }
          return false;
        });

        if (conflict) {
          teacherConflictClass = ttable.className || ttable.name;
          break;
        }
      }

      if (teacherConflictClass) {
        showToast(`Teacher is already booked for ${teacherConflictClass} at this time.`, 'error');
        return;
      }

      let updatedDaySchedule;
      if (editingTimetableEntry) {
        updatedDaySchedule = daySchedule.map(entry =>
          entry.id === editingTimetableEntry.id ? newEntry : entry
        );
      } else {
        updatedDaySchedule = [...daySchedule, newEntry].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        );
      }

      const updatedSchedule = {
        ...currentSchedule,
        [timetableForm.day]: updatedDaySchedule
      };

      await setDoc(timetableRef, {
        classId: selectedTimetableClass.id,
        className: selectedTimetableClass.name,
        schedule: updatedSchedule,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setShowTimetableModal(false);
      setEditingTimetableEntry(null);
      setTimetableForm({
        day: 'Monday',
        startTime: '',
        endTime: '',
        subject: '',
        teacherId: ''
      });
      await fetchData();
      showToast('Timetable updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving timetable:', error);
      showToast('Error saving timetable. Please try again.', 'error');
    }
  };

  const handleDeleteTimetableEntry = async (day, entryId) => {
    if (!window.confirm('Are you sure you want to remove this entry?')) return;

    try {
      const timetableRef = doc(db, 'timetables', selectedTimetableClass.id);
      const timetableDoc = await getDoc(timetableRef);

      if (timetableDoc.exists()) {
        const schedule = timetableDoc.data().schedule;
        const updatedDaySchedule = schedule[day].filter(entry => entry.id !== entryId);

        await setDoc(timetableRef, {
          schedule: {
            ...schedule,
            [day]: updatedDaySchedule
          }
        }, { merge: true });

        await fetchData();
        showToast('Entry removed successfully!', 'success');
      }
    } catch (error) {
      console.error('Error deleting timetable entry:', error);
      showToast('Error removing entry.', 'error');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="container page-enter">
      <div className="animate-fade-in-up">
        <div className="section-header-modern" style={{ marginBottom: '2rem', padding: '1rem 0' }}>
          <div>
            <h2 className="welcome-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Control Center</h2>
            <p className="welcome-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Strategic management and oversight of school operations.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tabs-container-modern" style={{ marginBottom: '2.5rem' }}>
          <div className="tabs-list-modern">
            {[
              { id: 'overview', label: 'Overview', icon: <FiBarChart /> },
              { id: 'users', label: 'Users', icon: <FiUsers /> },
              { id: 'classes', label: 'Classes', icon: <FiBook /> },
              { id: 'announcements', label: 'Announcements', icon: <FiBell /> },
              { id: 'timetable', label: 'Timetable', icon: <FiCalendar /> }
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-item-modern ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content-card" style={{ padding: '2rem' }}>
            <div className="section-header-modern">
              <h3><FiBarChart className="icon-glow" /> System Overview</h3>
            </div>
            <div className="summary-cards-grid">
              <SummaryCard
                title="Total Users"
                value={users.length}
                change="+15%"
                changeType="positive"
                icon={<FiUsers size={28} />}
                color="var(--primary-color)"
              />
              <SummaryCard
                title="Students"
                value={students.length}
                change="+12%"
                changeType="positive"
                icon={<FiUsers size={28} />}
                color="#10b981"
              />
              <SummaryCard
                title="Teachers"
                value={users.filter(u => u.role === 'teacher').length}
                change="+8%"
                changeType="positive"
                icon={<FiUsers size={28} />}
                color="#7c3aed"
              />
              <SummaryCard
                title="Active Classes"
                value={classes.length}
                change="+5%"
                changeType="positive"
                icon={<FiBook size={28} />}
                color="#f59e0b"
              />
            </div>

            <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
              <div className="card hover-scale" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', boxShadow: 'none' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiTrendingUp style={{ color: 'var(--primary-color)' }} /> System Health
                  </h3>
                </div>
                <div className="stats-breakdown" style={{ padding: '1.5rem' }}>
                  <div className="stat-breakdown-item" style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', marginBottom: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div className="stat-breakdown-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Parents Joined</div>
                    <div className="stat-breakdown-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                      {users.filter(u => u.role === 'parent').length}
                    </div>
                  </div>
                  <div className="stat-breakdown-item" style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', marginBottom: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <div className="stat-breakdown-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Live Announcements</div>
                    <div className="stat-breakdown-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{announcements.length}</div>
                  </div>
                  <div className="stat-breakdown-item" style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div className="stat-breakdown-label" style={{ fontWeight: 600, color: '#047857' }}>Retention Rate</div>
                    <div className="stat-breakdown-value positive" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>+98%</div>
                  </div>
                </div>
              </div>

              <div className="card hover-scale" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', boxShadow: 'none' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiPlus style={{ color: 'var(--primary-color)' }} /> Management Shortcuts
                  </h3>
                </div>
                <div className="quick-actions" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    className="quick-action-btn hover-scale"
                    onClick={() => {
                      setActiveTab('users');
                      setShowUserModal(true);
                    }}
                    style={{ background: 'white', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <div className="icon-circle" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)' }}>
                      <FiUserPlus size={24} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enroll User</span>
                  </button>
                  <button
                    className="quick-action-btn hover-scale"
                    onClick={() => {
                      setActiveTab('classes');
                      setShowClassModal(true);
                    }}
                    style={{ background: 'white', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <div className="icon-circle" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      <FiPlus size={24} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Open Class</span>
                  </button>
                  <button
                    className="quick-action-btn hover-scale"
                    onClick={() => {
                      setActiveTab('announcements');
                      setShowAnnouncementModal(true);
                    }}
                    style={{ background: 'white', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <div className="icon-circle" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      <FiBell size={24} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Post Notice</span>
                  </button>
                  <button
                    className="quick-action-btn hover-scale"
                    onClick={() => {
                      setActiveTab('timetable');
                    }}
                    style={{ background: 'white', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <div className="icon-circle" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <FiCalendar size={24} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Timetable</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-content-card">
            <div className="section-header-modern" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiUsers className="icon-glow" />
                <h3 style={{ margin: 0 }}>User Management</h3>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <select
                  className="form-select"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  style={{ width: '180px', borderRadius: '0.75rem', fontSize: '0.9rem' }}
                >
                  <option value="">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="parent">Parents</option>
                  <option value="admin">Admins</option>
                </select>
                <button className="teacher-action-btn-modern btn-primary" onClick={() => setShowUserModal(true)}>
                  <FiUserPlus size={18} />
                  Add User
                </button>
              </div>
            </div>

            <div className="modern-table-container" style={{ marginTop: 0 }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>User Information</th>
                    <th>Role</th>
                    <th>ID / Credentials</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => !studentFilter || u.role === studentFilter).map(user => {
                    const userId = user.studentId || user.parentId || user.teacherId || 'N/A';
                    const roleColors = {
                      admin: 'danger',
                      teacher: 'info',
                      student: 'success',
                      parent: 'warning'
                    };
                    return (
                      <tr key={user.id} className="stagger-item">
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="icon-circle" style={{ width: '40px', height: '40px', background: 'var(--bg-color)', color: 'var(--primary-color)', fontSize: '1rem' }}>
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{user.name || 'Unknown'}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-indicator ${roleColors[user.role] || 'info'}`} style={{ textTransform: 'capitalize' }}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userId}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Created: {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="teacher-action-btn-modern btn-secondary"
                              onClick={() => {
                                if (user.role === 'student') {
                                  setSelectedStudent(user);
                                } else if (user.role === 'teacher') {
                                  setSelectedTeacher(user);
                                }
                              }}
                              style={{ padding: '0.5rem 0.75rem' }}
                              title="View Details"
                            >
                              <FiEye size={16} />
                              <span style={{ fontSize: '0.85rem' }}>View</span>
                            </button>
                            <button
                              className="teacher-action-btn-modern btn-danger"
                              onClick={() => handleDeleteUser(user.id)}
                              style={{ padding: '0.5rem 0.75rem' }}
                              title="Delete User"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="tab-content-card">
            <div className="section-header-modern" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiBook className="icon-glow" />
                <h3 style={{ margin: 0 }}>Class Management</h3>
              </div>
              <button className="teacher-action-btn-modern btn-primary" onClick={() => setShowClassModal(true)}>
                <FiPlus size={18} />
                Add Class
              </button>
            </div>

            <div className="modern-table-container" style={{ marginTop: 0 }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Class Information</th>
                    <th>Students Enrolled</th>
                    <th>Quick Management</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => {
                    const studentCount = students.filter(s => s.classId === cls.id).length;
                    return (
                      <tr key={cls.id} className="stagger-item">
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{cls.standard || cls.name}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Section {cls.section || 'N/A'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="status-indicator info" style={{ padding: '0.4rem 0.8rem' }}>
                              <FiUsers size={14} /> {studentCount} Students
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="teacher-action-btn-modern btn-secondary"
                              onClick={() => {
                                setSelectedClass(cls);
                                setClassFormData({
                                  standard: cls.standard || '',
                                  section: cls.section || ''
                                });
                                setShowEditClassModal(true);
                              }}
                              style={{ padding: '0.5rem' }}
                              title="Edit Class"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              className="teacher-action-btn-modern btn-primary"
                              onClick={() => {
                                setSelectedClass(cls);
                                // Get students already in this class
                                const studentsInClass = students
                                  .filter(s => s.classId === cls.id)
                                  .map(s => s.id);
                                setSelectedStudentsForClass(studentsInClass);
                                setShowAssignStudentsModal(true);
                              }}
                              style={{ padding: '0.5rem 0.75rem', gap: '0.25rem' }}
                              title="Assign Students"
                            >
                              <FiUserPlus size={16} />
                              <span style={{ fontSize: '0.85rem' }}>Assign</span>
                            </button>
                            <button
                              className="teacher-action-btn-modern btn-danger"
                              onClick={() => handleDeleteClass(cls.id)}
                              style={{ padding: '0.5rem' }}
                              title="Delete Class"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="tab-content-card">
            <div className="section-header-modern" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiBell className="icon-glow" />
                <h3 style={{ margin: 0 }}>School Announcements</h3>
              </div>
              <button className="teacher-action-btn-modern btn-primary" onClick={() => setShowAnnouncementModal(true)}>
                <FiPlus size={18} />
                New Announcement
              </button>
            </div>

            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <FiBell size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No announcements created yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {announcements.map(announcement => (
                  <div key={announcement.id} className="card hover-scale" style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1rem', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: 'var(--primary-dark)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{announcement.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                          {announcement.message}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontWeight: 600, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FiCalendar size={14} /> {announcement.createdAt ? format(new Date(announcement.createdAt), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 600 }}>
                            <FiClock size={14} /> {announcement.createdAt ? format(new Date(announcement.createdAt), 'HH:mm') : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <button
                        className="teacher-action-btn-modern btn-danger"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        style={{ padding: '0.6rem', marginLeft: '1rem' }}
                        title="Delete Announcement"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <div className="tab-content-card">
            <div className="section-header-modern">
              <h3><FiCalendar className="icon-glow" /> Timetable Management</h3>
            </div>

            <div style={{ marginBottom: '2rem', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.75rem', display: 'block' }}>Select Class to Manage</label>
              <select
                className="form-select"
                value={selectedTimetableClass ? selectedTimetableClass.id : ''}
                onChange={(e) => {
                  const cls = classes.find(c => c.id === e.target.value);
                  setSelectedTimetableClass(cls);
                }}
                style={{ maxWidth: '400px', borderRadius: '0.75rem' }}
              >
                <option value="">-- Choose a Class --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            {selectedTimetableClass ? (
              <div className="timetable-container" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '1rem', borderLeft: '5px solid var(--primary-color)' }}>
                  <h4 style={{ margin: 0, color: 'var(--primary-dark)', fontWeight: 800 }}>Weekly Schedule for {selectedTimetableClass.name}</h4>
                  <button
                    className="teacher-action-btn-modern btn-primary"
                    onClick={() => {
                      setEditingTimetableEntry(null);
                      setTimetableForm(prev => ({ ...prev, day: 'Monday', startTime: '', endTime: '', subject: '', teacherId: '' }));
                      setShowTimetableModal(true);
                    }}
                  >
                    <FiPlus size={18} /> Add New Entry
                  </button>
                </div>

                <div className="timetable-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const classTimetable = timetables.find(t => t.id === selectedTimetableClass.id);
                    const daySchedule = classTimetable?.schedule?.[day] || [];

                    return (
                      <div key={day} className="card" style={{ padding: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', boxShadow: 'none' }}>
                        <h5 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', color: 'var(--primary-dark)', fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {day}
                        </h5>
                        {daySchedule.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>No classes scheduled</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {daySchedule.map(entry => (
                              <div key={entry.id} style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: '1rem',
                                borderLeft: '4px solid var(--primary-color)',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'transform 0.2s'
                              }}
                                className="stagger-item hover-scale"
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>{entry.subject}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-color)', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', marginBottom: '0.5rem', width: 'fit-content' }}>
                                      <FiClock size={14} style={{ color: 'var(--primary-color)' }} />
                                      <span style={{ fontWeight: 600 }}>{entry.startTime} - {entry.endTime}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', paddingLeft: '0.25rem' }}>
                                      <FiUsers size={12} /> {entry.teacherName}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button
                                      className="btn-icon"
                                      style={{ color: 'var(--text-secondary)', padding: '0.4rem', background: 'var(--bg-color)', borderRadius: '0.5rem' }}
                                      onClick={() => {
                                        setEditingTimetableEntry(entry);
                                        setTimetableForm({
                                          day,
                                          startTime: entry.startTime,
                                          endTime: entry.endTime,
                                          subject: entry.subject,
                                          teacherId: entry.teacherId
                                        });
                                        setShowTimetableModal(true);
                                      }}
                                      title="Edit Entry"
                                    >
                                      <FiEdit size={14} />
                                    </button>
                                    <button
                                      className="btn-icon"
                                      style={{ color: 'var(--danger-color)', padding: '0.4rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '0.5rem' }}
                                      onClick={() => handleDeleteTimetableEntry(day, entry.id)}
                                      title="Remove Entry"
                                    >
                                      <FiX size={14} />
                                    </button>
                                  </div>
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
              <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                <FiCalendar size={64} style={{ marginBottom: '1.5rem', opacity: 0.1, color: 'var(--primary-color)' }} />
                <h4 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No Class Selected</h4>
                <p>Select a class from the dropdown above to manage its weekly schedule.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Timetable Modal */}
      {showTimetableModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowTimetableModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header-modern">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiCalendar className="icon-glow" style={{ fontSize: '1.25rem' }} />
                <h3 className="modal-title-modern">{editingTimetableEntry ? 'Edit Schedule Entry' : 'New Schedule Entry'}</h3>
              </div>
              <button className="modal-close-modern" onClick={() => setShowTimetableModal(false)}><FiX /></button>
            </div>
            <div className="modal-body-modern">
              <form onSubmit={handleSaveTimetableEntry}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Day of Week</label>
                  <select
                    className="form-select-modern"
                    value={timetableForm.day}
                    onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value })}
                    required
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row-modern">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Start Time</label>
                    <input
                      type="time"
                      className="form-input-modern"
                      value={timetableForm.startTime}
                      onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-modern">
                    <label className="form-label-modern">End Time</label>
                    <input
                      type="time"
                      className="form-input-modern"
                      value={timetableForm.endTime}
                      onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Subject Name</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={timetableForm.subject}
                    onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                    placeholder="e.g. Advanced Mathematics"
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Assigned Teacher</label>
                  <select
                    className="form-select-modern"
                    value={timetableForm.teacherId}
                    onChange={(e) => setTimetableForm({ ...timetableForm, teacherId: e.target.value })}
                    required
                  >
                    <option value="">Select a Teacher</option>
                    {users.filter(u => u.role === 'teacher').map(teacher => (
                      <option key={teacher.id} value={teacher.teacherId}>
                        {teacher.name} ({teacher.teacherId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer-modern">
                  <button type="button" className="teacher-action-btn-modern btn-secondary" onClick={() => setShowTimetableModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="teacher-action-btn-modern btn-primary">
                    {editingTimetableEntry ? 'Update Entry' : 'Add to Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowUserModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header-modern">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiUserPlus className="icon-glow" style={{ fontSize: '1.25rem' }} />
                <h3 className="modal-title-modern">Onboard New User</h3>
              </div>
              <button className="modal-close-modern" onClick={() => setShowUserModal(false)}><FiX /></button>
            </div>
            <div className="modal-body-modern">
              <form onSubmit={handleCreateUser}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Full Name</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full legal name"
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Email Address</label>
                  <input
                    type="email"
                    className="form-input-modern"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@school.edu"
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Organizational Role</label>
                  <select
                    className="form-select-modern"
                    value={formData.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      const idFieldName = getIdFieldName(newRole);
                      setGeneratingId(true);
                      try {
                        const generatedId = await generateIdByRole(newRole);
                        setFormData({
                          ...formData,
                          role: newRole,
                          [idFieldName]: generatedId,
                          studentId: newRole === 'student' ? generatedId : '',
                          parentId: newRole === 'parent' ? generatedId : '',
                          teacherId: newRole === 'teacher' ? generatedId : '',
                          childEmail: '',
                          childStudentId: ''
                        });
                      } catch (error) {
                        console.error('Error generating ID:', error);
                        showToast('Error generating ID.', 'error');
                      } finally {
                        setGeneratingId(false);
                      }
                    }}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>

                {formData.role === 'student' && (
                  <div className="form-group-modern animate-fade-in" style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.75rem' }}>
                    <label className="form-label-modern" style={{ color: 'var(--primary-color)' }}>Student Reference ID</label>
                    <input
                      type="text"
                      className="form-input-modern"
                      value={formData.studentId}
                      readOnly
                      style={{ background: 'white', fontWeight: 700, pointerEvents: 'none' }}
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                      ID is autogenerated for data integrity.
                    </small>
                  </div>
                )}

                {formData.role === 'parent' && (
                  <>
                    <div className="form-group-modern animate-fade-in" style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                      <label className="form-label-modern" style={{ color: 'var(--primary-color)' }}>Parent Reference ID</label>
                      <input
                        type="text"
                        className="form-input-modern"
                        value={formData.parentId}
                        readOnly
                        style={{ background: 'white', fontWeight: 700, pointerEvents: 'none' }}
                      />
                    </div>
                    <div className="form-group-modern animate-fade-in">
                      <label className="form-label-modern">Linked Child Email <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="email"
                        className="form-input-modern"
                        value={formData.childEmail}
                        onChange={(e) => setFormData({ ...formData, childEmail: e.target.value })}
                        placeholder="Child's registered email"
                      />
                    </div>
                    <div className="form-group-modern animate-fade-in">
                      <label className="form-label-modern">Linked Child Student ID <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        className="form-input-modern"
                        value={formData.childStudentId}
                        onChange={(e) => setFormData({ ...formData, childStudentId: e.target.value })}
                        placeholder="e.g. STU-101"
                      />
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Provide at least one child identifier.</small>
                    </div>
                  </>
                )}

                {formData.role === 'teacher' && (
                  <div className="form-group-modern animate-fade-in" style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '0.75rem' }}>
                    <label className="form-label-modern" style={{ color: 'var(--primary-color)' }}>Teacher Faculty ID</label>
                    <input
                      type="text"
                      className="form-input-modern"
                      value={formData.teacherId}
                      readOnly
                      style={{ background: 'white', fontWeight: 700, pointerEvents: 'none' }}
                    />
                  </div>
                )}

                <div className="modal-footer-modern">
                  <button type="button" className="teacher-action-btn-modern btn-secondary" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="teacher-action-btn-modern btn-primary" disabled={generatingId}>
                    {generatingId ? 'Generating ID...' : 'Finalize Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {showClassModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowClassModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header-modern">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiBook className="icon-glow" style={{ fontSize: '1.25rem' }} />
                <h3 className="modal-title-modern">Create New Class</h3>
              </div>
              <button className="modal-close-modern" onClick={() => setShowClassModal(false)}><FiX /></button>
            </div>
            <div className="modal-body-modern">
              <form onSubmit={handleCreateClass}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Academic Standard</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={classFormData.standard}
                    onChange={(e) => setClassFormData({ ...classFormData, standard: e.target.value })}
                    placeholder="e.g. Grade 10, Standard XII"
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Section Identifier</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={classFormData.section}
                    onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                    placeholder="e.g. A, Maple, Section 1"
                    required
                  />
                </div>
                <div className="modal-footer-modern">
                  <button type="button" className="teacher-action-btn-modern btn-secondary" onClick={() => setShowClassModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="teacher-action-btn-modern btn-primary">
                    Establish Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowEditClassModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header-modern">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiEdit className="icon-glow" style={{ fontSize: '1.25rem' }} />
                <h3 className="modal-title-modern">Modify Class Details</h3>
              </div>
              <button className="modal-close-modern" onClick={() => setShowEditClassModal(false)}><FiX /></button>
            </div>
            <div className="modal-body-modern">
              <form onSubmit={handleEditClass}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Academic Standard</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={classFormData.standard}
                    onChange={(e) => setClassFormData({ ...classFormData, standard: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Section Identifier</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={classFormData.section}
                    onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-footer-modern">
                  <button type="button" className="teacher-action-btn-modern btn-secondary" onClick={() => setShowEditClassModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="teacher-action-btn-modern btn-primary">
                    Update Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssignStudentsModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAssignStudentsModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header-modern">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiUserPlus className="icon-glow" style={{ fontSize: '1.25rem' }} />
                <h3 className="modal-title-modern">Cohort Assignment: {selectedClass?.standard} - {selectedClass?.section}</h3>
              </div>
              <button className="modal-close-modern" onClick={() => setShowAssignStudentsModal(false)}><FiX /></button>
            </div>
            <div className="modal-body-modern" style={{ padding: 0 }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  Select students to enroll in this academic group.
                </p>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                {students.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <FiUsers size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                    <p>No eligible students found in database.</p>
                  </div>
                ) : (
                  students.map(student => (
                    <div
                      key={student.id}
                      className="hover-scale"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '0.25rem',
                        border: selectedStudentsForClass.includes(student.id) ? '1px solid var(--primary-color)' : '1px solid transparent',
                        background: selectedStudentsForClass.includes(student.id) ? 'rgba(37, 99, 235, 0.03)' : 'transparent'
                      }}
                      onClick={() => {
                        if (selectedStudentsForClass.includes(student.id)) {
                          setSelectedStudentsForClass(selectedStudentsForClass.filter(id => id !== student.id));
                        } else {
                          setSelectedStudentsForClass([...selectedStudentsForClass, student.id]);
                        }
                      }}
                    >
                      <div className={`checkbox-custom ${selectedStudentsForClass.includes(student.id) ? 'checked' : ''}`} style={{ marginRight: '1rem' }}>
                        {selectedStudentsForClass.includes(student.id) && <FiCheck size={12} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{student.name || student.email}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                          <small className="status-indicator info" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>ID: {student.studentId || 'N/A'}</small>
                          {student.classId && student.classId !== selectedClass?.id && (
                            <small className="status-indicator warning" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Currently: {classes.find(c => c.id === student.classId)?.name}</small>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer-modern" style={{ background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                {selectedStudentsForClass.length} Candidates Selected
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="teacher-action-btn-modern btn-secondary" onClick={() => setShowAssignStudentsModal(false)}>
                  Cancel
                </button>
                <button
                  className="teacher-action-btn-modern btn-primary"
                  onClick={handleAssignStudents}
                  disabled={selectedStudentsForClass.length === 0}
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header-modern">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiBell className="icon-glow" style={{ fontSize: '1.25rem' }} />
                <h3 className="modal-title-modern">Broadcast Announcement</h3>
              </div>
              <button className="modal-close-modern" onClick={() => setShowAnnouncementModal(false)}><FiX /></button>
            </div>
            <div className="modal-body-modern">
              <form onSubmit={handleCreateAnnouncement}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Announcement Title</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    placeholder="e.g. Annual Sports Day 2024"
                    required
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Detailed Message</label>
                  <textarea
                    className="form-input-modern"
                    rows="5"
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    placeholder="Type the official announcement content here..."
                    required
                    style={{ resize: 'none' }}
                  />
                </div>
                <div className="modal-footer-modern">
                  <button type="button" className="teacher-action-btn-modern btn-secondary" onClick={() => setShowAnnouncementModal(false)}>
                    Discard
                  </button>
                  <button type="submit" className="teacher-action-btn-modern btn-primary">
                    Publish Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedStudent(null)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div className="modal-header-modern">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiEye className="icon-glow" style={{ fontSize: '1.25rem' }} />
                <h3 className="modal-title-modern">Academic Profile: {selectedStudent.name || selectedStudent.email}</h3>
              </div>
              <button className="modal-close-modern" onClick={() => setSelectedStudent(null)}><FiX /></button>
            </div>
            <div className="modal-body-modern" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Basic Info */}
                <div className="tab-content-card" style={{ padding: '1.5rem', marginBottom: 0 }}>
                  <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem' }}>General Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Legal Name</small>
                      <div style={{ fontWeight: 700 }}>{selectedStudent.name || 'N/A'}</div>
                    </div>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Email ID</small>
                      <div style={{ fontWeight: 700 }}>{selectedStudent.email}</div>
                    </div>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Internal ID</small>
                      <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{selectedStudent.studentId || 'N/A'}</div>
                    </div>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Academic Class</small>
                      <div style={{ fontWeight: 700 }}>{classes.find(c => c.id === selectedStudent.classId)?.name || 'Unassigned'}</div>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="tab-content-card" style={{ padding: '1.5rem', marginBottom: 0 }}>
                  <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem' }}>Overall Attendance</h4>
                  {(() => {
                    const studentAttendance = attendance.filter(a => a.studentId === selectedStudent.id);
                    const presentCount = studentAttendance.filter(a => a.present).length;
                    const totalCount = studentAttendance.length;
                    const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-color)', border: '6px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                          {percentage}%
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
                          <div><small style={{ color: 'var(--text-secondary)' }}>Present Journeys</small> <div style={{ fontWeight: 700, color: 'var(--success-color)' }}>{presentCount}</div></div>
                          <div><small style={{ color: 'var(--text-secondary)' }}>Absent Entries</small> <div style={{ fontWeight: 700, color: 'var(--danger-color)' }}>{totalCount - presentCount}</div></div>
                          <div><small style={{ color: 'var(--text-secondary)' }}>Total Tracked</small> <div style={{ fontWeight: 700 }}>{totalCount}</div></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Academic Performance */}
              <div className="tab-content-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem' }}>Academic Performance (Marks)</h4>
                {(() => {
                  const studentMarks = marks.filter(m => m.studentId === selectedStudent.id);
                  return studentMarks.length > 0 ? (
                    <div className="modern-table-container">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Examination</th>
                            <th>Score</th>
                            <th>Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentMarks.map(mark => {
                            const percentage = ((mark.marks / mark.totalMarks) * 100);
                            return (
                              <tr key={mark.id}>
                                <td style={{ fontWeight: 700 }}>{mark.subject}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{mark.examType}</td>
                                <td>
                                  <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{mark.marks} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/ {mark.totalMarks}</span></div>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)' }}>{percentage.toFixed(1)}%</div>
                                </td>
                                <td>
                                  <span className={`status-indicator ${percentage >= 40 ? 'success' : 'danger'}`}>
                                    {percentage >= 40 ? 'Pass' : 'Fail'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', borderRadius: '1rem' }}>No evaluation records found yet.</div>;
                })()}
              </div>

              {/* Curriculum Progress */}
              <div className="tab-content-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem' }}>Curriculum Progress (Assignments)</h4>
                {(() => {
                  const studentClass = classes.find(c => c.id === selectedStudent.classId);
                  const classAssignments = studentClass ? assignments.filter(a => a.classId === studentClass.id) : [];
                  const studentSubmissions = submissions.filter(s => s.studentId === selectedStudent.id);
                  return classAssignments.length > 0 ? (
                    <div className="modern-table-container">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Assignment Module</th>
                            <th>Deadlines</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classAssignments.map(assignment => {
                            const submitted = studentSubmissions.some(s => s.assignmentId === assignment.id);
                            return (
                              <tr key={assignment.id}>
                                <td style={{ fontWeight: 700 }}>{assignment.title}</td>
                                <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{assignment.dueDate ? safeFormat(assignment.dueDate, 'MMM dd, yyyy') : 'N/A'}</td>
                                <td>
                                  {submitted ? (
                                    <span className="status-indicator success">
                                      <FiCheck size={12} /> Received
                                    </span>
                                  ) : (
                                    <span className="status-indicator warning">
                                      <FiClock size={12} /> Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', borderRadius: '1rem' }}>No assignment history found.</div>;
                })()}
              </div>
            </div>
            <div className="modal-footer-modern" style={{ background: 'var(--bg-color)' }}>
              <button className="teacher-action-btn-modern btn-primary" onClick={() => setSelectedStudent(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Details Modal */}
      {selectedTeacher && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedTeacher(null)}>
          <div className="modal-modern animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div className="modal-header-modern">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiEye className="icon-glow" style={{ fontSize: '1.25rem' }} />
                <h3 className="modal-title-modern">Faculty Profile: {selectedTeacher.name || selectedTeacher.email}</h3>
              </div>
              <button className="modal-close-modern" onClick={() => setSelectedTeacher(null)}><FiX /></button>
            </div>
            <div className="modal-body-modern" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Basic Info */}
                <div className="tab-content-card" style={{ padding: '1.5rem', marginBottom: 0 }}>
                  <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem' }}>Personal Data</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Faculty Name</small>
                      <div style={{ fontWeight: 700 }}>{selectedTeacher.name || 'N/A'}</div>
                    </div>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Work Email</small>
                      <div style={{ fontWeight: 700 }}>{selectedTeacher.email}</div>
                    </div>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Teacher ID</small>
                      <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{selectedTeacher.teacherId || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Engagement Summary */}
                <div className="tab-content-card" style={{ padding: '1.5rem', marginBottom: 0 }}>
                  <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem' }}>Operational Scope</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Assigned Cohorts</small>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{classes.filter(c => c.teacherId === selectedTeacher.id).length}</div>
                    </div>
                    <div>
                      <small style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Active Materials</small>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{assignments.filter(a => a.teacherId === selectedTeacher.id).length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Classes */}
              <div className="tab-content-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem' }}>Allocated Academic Classes</h4>
                {(() => {
                  const teacherClasses = classes.filter(c => c.teacherId === selectedTeacher.id);
                  return teacherClasses.length > 0 ? (
                    <div className="modern-table-container">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Course Name</th>
                            <th>Academic Grade</th>
                            <th>Section Group</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherClasses.map(cls => (
                            <tr key={cls.id}>
                              <td style={{ fontWeight: 700 }}>{cls.name}</td>
                              <td>{cls.grade || 'N/A'}</td>
                              <td>{cls.section}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', borderRadius: '1rem' }}>No academic groups assigned yet.</div>;
                })()}
              </div>

              {/* Assignments Published */}
              <div className="tab-content-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem' }}>Published Materials & Assessments</h4>
                {(() => {
                  const teacherAssignments = assignments.filter(a => a.teacherId === selectedTeacher.id);
                  return teacherAssignments.length > 0 ? (
                    <div className="modern-table-container">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Material Title</th>
                            <th>Target Group</th>
                            <th>Published Date</th>
                            <th>Metrics</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherAssignments.map(assignment => {
                            const submissionCount = submissions.filter(s => s.assignmentId === assignment.id).length;
                            return (
                              <tr key={assignment.id}>
                                <td style={{ fontWeight: 700 }}>{assignment.title}</td>
                                <td>{classes.find(c => c.id === assignment.classId)?.name || 'Unknown'}</td>
                                <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{assignment.createdAt ? safeFormat(assignment.createdAt, 'MMM dd, yyyy') : 'N/A'}</td>
                                <td>
                                  <span className="status-indicator info" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>
                                    {submissionCount} Submissions
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', borderRadius: '1rem' }}>No educational materials published.</div>;
                })()}
              </div>
            </div>
            <div className="modal-footer-modern" style={{ background: 'var(--bg-color)' }}>
              <button className="teacher-action-btn-modern btn-primary" onClick={() => setSelectedTeacher(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
