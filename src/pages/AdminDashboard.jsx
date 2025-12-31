import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FiUsers, FiBook, FiUserPlus, FiPlus, FiEdit, FiTrash2, FiX, FiBell, FiBarChart, FiTrendingUp, FiEye, FiClipboard, FiCalendar, FiClock } from 'react-icons/fi';
import { setDoc, getDoc } from 'firebase/firestore';
import SummaryCard from '../components/SummaryCard';
import { showToast } from '../components/ToastContainer';
import { generateIdByRole, getIdFieldName } from '../utils/idGenerator';

const AdminDashboard = () => {
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
      <div className="card animate-fade-in-up">
        <div className="card-header">
          <div>
            <h2 className="card-title welcome-text">Admin Dashboard</h2>
            <p className="welcome-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Manage your school operations from one central location.
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
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Users
          </button>
          <button
            className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('classes')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Classes
          </button>
          <button
            className={`btn ${activeTab === 'announcements' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('announcements')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Announcements
          </button>
          <button
            className={`btn ${activeTab === 'timetable' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('timetable')}
            style={{ borderRadius: '0.5rem 0.5rem 0 0', marginBottom: '-2px' }}
          >
            Timetable
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-overview">
            <div className="summary-cards-grid">
              <SummaryCard
                title="Total Users"
                value={users.length}
                change="+15%"
                changeType="positive"
                icon={<FiUsers size={28} />}
                color="#667eea"
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
                color="#764ba2"
              />
              <SummaryCard
                title="Classes"
                value={classes.length}
                change="+5%"
                changeType="positive"
                icon={<FiBook size={28} />}
                color="#f59e0b"
              />
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h3>System Statistics</h3>
                </div>
                <div className="stats-breakdown">
                  <div className="stat-breakdown-item">
                    <div className="stat-breakdown-label">Parents</div>
                    <div className="stat-breakdown-value">
                      {users.filter(u => u.role === 'parent').length}
                    </div>
                  </div>
                  <div className="stat-breakdown-item">
                    <div className="stat-breakdown-label">Announcements</div>
                    <div className="stat-breakdown-value">{announcements.length}</div>
                  </div>
                  <div className="stat-breakdown-item">
                    <div className="stat-breakdown-label">Growth Rate</div>
                    <div className="stat-breakdown-value positive">+18%</div>
                  </div>
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
                      setActiveTab('users');
                      setShowUserModal(true);
                    }}
                  >
                    <FiUserPlus size={24} />
                    <span>Add User</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => {
                      setActiveTab('classes');
                      setShowClassModal(true);
                    }}
                  >
                    <FiPlus size={24} />
                    <span>Add Class</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => {
                      setActiveTab('announcements');
                      setShowAnnouncementModal(true);
                    }}
                  >
                    <FiBell size={24} />
                    <span>New Announcement</span>
                  </button>
                  <button
                    className="quick-action-btn"
                    onClick={() => {
                      setActiveTab('timetable');
                    }}
                  >
                    <FiCalendar size={24} />
                    <span>Manage Timetable</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="card-header">
              <h3>User Management</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <select
                  className="form-select"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  style={{ width: '200px' }}
                >
                  <option value="">All Users</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="parent">Parents Only</option>
                  <option value="admin">Admins Only</option>
                </select>
                <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
                  <FiUserPlus size={18} />
                  Add User
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>ID</th>
                    <th>Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => !studentFilter || u.role === studentFilter).map(user => {
                    const userId = user.studentId || user.parentId || user.teacherId || 'N/A';
                    return (
                      <tr key={user.id}>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email}</td>
                        <td><span className={`badge badge-info`}>{user.role}</span></td>
                        <td>{userId}</td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              if (user.role === 'student') {
                                setSelectedStudent(user);
                              } else if (user.role === 'teacher') {
                                setSelectedTeacher(user);
                              }
                            }}
                            style={{ padding: '0.5rem' }}
                          >
                            <FiEye size={16} /> View Details
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteUser(user.id)}
                            style={{ padding: '0.5rem' }}
                          >
                            <FiTrash2 size={16} />
                          </button>
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
          <div>
            <div className="card-header">
              <h3>Class Management</h3>
              <button className="btn btn-primary" onClick={() => setShowClassModal(true)}>
                <FiPlus size={18} />
                Add Class
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Standard</th>
                    <th>Section</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => (
                    <tr key={cls.id}>
                      <td>{cls.standard || cls.name}</td>
                      <td>{cls.section}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
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
                            className="btn btn-primary"
                            onClick={() => {
                              setSelectedClass(cls);
                              // Get students already in this class
                              const studentsInClass = students
                                .filter(s => s.classId === cls.id)
                                .map(s => s.id);
                              setSelectedStudentsForClass(studentsInClass);
                              setShowAssignStudentsModal(true);
                            }}
                            style={{ padding: '0.5rem' }}
                            title="Assign Students"
                          >
                            <FiUserPlus size={16} />
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteClass(cls.id)}
                            style={{ padding: '0.5rem' }}
                            title="Delete Class"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div>
            <div className="card-header">
              <h3>Announcements</h3>
              <button className="btn btn-primary" onClick={() => setShowAnnouncementModal(true)}>
                <FiBell size={18} />
                Create Announcement
              </button>
            </div>

            {announcements.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No announcements yet
              </p>
            ) : (
              <div>
                {announcements.map(announcement => (
                  <div key={announcement.id} className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>{announcement.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          {announcement.message}
                        </p>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {new Date(announcement.createdAt).toLocaleString()}
                        </small>
                      </div>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        style={{ padding: '0.5rem', marginLeft: '1rem' }}
                      >
                        <FiTrash2 size={16} />
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
          <div>
            <div className="card-header">
              <h3>Timetable Management</h3>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label className="form-label">Select Class to Manage</label>
              <select
                className="form-select"
                value={selectedTimetableClass ? selectedTimetableClass.id : ''}
                onChange={(e) => {
                  const cls = classes.find(c => c.id === e.target.value);
                  setSelectedTimetableClass(cls);
                }}
              >
                <option value="">-- Select Class --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            {selectedTimetableClass ? (
              <div className="timetable-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4>Schedule for {selectedTimetableClass.name}</h4>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingTimetableEntry(null);
                      setTimetableForm(prev => ({ ...prev, day: 'Monday', startTime: '', endTime: '', subject: '', teacherId: '' }));
                      setShowTimetableModal(true);
                    }}
                  >
                    <FiPlus size={18} /> Add Entry
                  </button>
                </div>

                <div className="timetable-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const classTimetable = timetables.find(t => t.id === selectedTimetableClass.id);
                    const daySchedule = classTimetable?.schedule?.[day] || [];

                    return (
                      <div key={day} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)' }}>
                        <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                          {day}
                        </h5>
                        {daySchedule.length === 0 ? (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No classes scheduled</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {daySchedule.map(entry => (
                              <div key={entry.id} style={{
                                background: 'var(--bg-color)',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                borderLeft: '3px solid var(--primary-color)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                  <div>
                                    <div style={{ fontWeight: 'bold' }}>{entry.subject}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <FiClock size={12} /> {entry.startTime} - {entry.endTime}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {entry.teacherName}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button
                                      className="btn-icon"
                                      style={{ color: 'var(--text-secondary)', padding: 0 }}
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
                                    >
                                      <FiEdit size={14} />
                                    </button>
                                    <button
                                      className="btn-icon"
                                      style={{ color: 'var(--danger-color)', padding: 0 }}
                                      onClick={() => handleDeleteTimetableEntry(day, entry.id)}
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
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                <FiCalendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Select a class above to view and manage its timetable</p>
              </div>
            )}
          </div>
        )}

        {/* Timetable Modal */}
        {showTimetableModal && (
          <div className="modal-overlay" onClick={() => setShowTimetableModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editingTimetableEntry ? 'Edit Class' : 'Add Class'}</h3>
                <button className="modal-close" onClick={() => setShowTimetableModal(false)}>
                  <FiX size={24} />
                </button>
              </div>
              <form onSubmit={handleSaveTimetableEntry}>
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select
                    className="form-select"
                    value={timetableForm.day}
                    onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value })}
                    required
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={timetableForm.startTime}
                      onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={timetableForm.endTime}
                      onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={timetableForm.subject}
                    onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                    placeholder="e.g. Mathematics"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teacher</label>
                  <select
                    className="form-select"
                    value={timetableForm.teacherId}
                    onChange={(e) => setTimetableForm({ ...timetableForm, teacherId: e.target.value })}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {users.filter(u => u.role === 'teacher').map(teacher => (
                      <option key={teacher.id} value={teacher.teacherId}>
                        {teacher.name} ({teacher.teacherId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTimetableModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTimetableEntry ? 'Update' : 'Add'} Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New User</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
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
                      showToast('Error generating ID. Please try again.', 'error');
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
                <div className="form-group">
                  <label className="form-label">Student ID (Auto-generated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    placeholder={generatingId ? "Generating ID..." : "Student ID will be auto-generated"}
                    disabled={generatingId}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Generated ID: {formData.studentId || 'Generating...'}
                  </small>
                </div>
              )}
              {formData.role === 'parent' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Parent ID (Auto-generated)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      required
                      placeholder={generatingId ? "Generating ID..." : "Parent ID will be auto-generated"}
                      disabled={generatingId}
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Generated ID: {formData.parentId || 'Generating...'}
                    </small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Child's Email Address <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.childEmail}
                      onChange={(e) => setFormData({ ...formData, childEmail: e.target.value })}
                      placeholder="Enter child's email address"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Required: Enter either child's email OR student ID below
                    </small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Child's Student ID <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.childStudentId}
                      onChange={(e) => setFormData({ ...formData, childStudentId: e.target.value })}
                      placeholder="Enter child's Student ID (e.g., STU-1)"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Required: Enter either child's email OR student ID above
                    </small>
                  </div>
                </>
              )}
              {formData.role === 'teacher' && (
                <div className="form-group">
                  <label className="form-label">Teacher ID (Auto-generated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    required
                    placeholder={generatingId ? "Generating ID..." : "Teacher ID will be auto-generated"}
                    disabled={generatingId}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Generated ID: {formData.teacherId || 'Generating...'}
                  </small>
                </div>
              )}
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {showClassModal && (
        <div className="modal-overlay" onClick={() => setShowClassModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Class</h3>
              <button className="modal-close" onClick={() => setShowClassModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label className="form-label">Standard</label>
                <input
                  type="text"
                  className="form-input"
                  value={classFormData.standard}
                  onChange={(e) => setClassFormData({ ...classFormData, standard: e.target.value })}
                  placeholder="e.g., Class 10, Grade 9, Standard 8"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input
                  type="text"
                  className="form-input"
                  value={classFormData.section}
                  onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                  placeholder="e.g., A, B, C"
                  required
                />
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowClassModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && (
        <div className="modal-overlay" onClick={() => setShowEditClassModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Class</h3>
              <button className="modal-close" onClick={() => setShowEditClassModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleEditClass}>
              <div className="form-group">
                <label className="form-label">Standard</label>
                <input
                  type="text"
                  className="form-input"
                  value={classFormData.standard}
                  onChange={(e) => setClassFormData({ ...classFormData, standard: e.target.value })}
                  placeholder="e.g., Class 10, Grade 9, Standard 8"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input
                  type="text"
                  className="form-input"
                  value={classFormData.section}
                  onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                  placeholder="e.g., A, B, C"
                  required
                />
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditClassModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssignStudentsModal && (
        <div className="modal-overlay" onClick={() => setShowAssignStudentsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Assign Students to {selectedClass?.standard} - {selectedClass?.section}
              </h3>
              <button className="modal-close" onClick={() => setShowAssignStudentsModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Select students to assign to this class:
              </p>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {students.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No students available
                  </p>
                ) : (
                  students.map(student => (
                    <div
                      key={student.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        if (selectedStudentsForClass.includes(student.id)) {
                          setSelectedStudentsForClass(selectedStudentsForClass.filter(id => id !== student.id));
                        } else {
                          setSelectedStudentsForClass([...selectedStudentsForClass, student.id]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentsForClass.includes(student.id)}
                        onChange={() => { }}
                        style={{ marginRight: '1rem', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{student.name || student.email}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          ID: {student.studentId || 'N/A'}
                          {student.classId && student.classId !== selectedClass?.id && (
                            <span style={{ marginLeft: '0.5rem', color: 'var(--warning-color)' }}>
                              (Currently in another class)
                            </span>
                          )}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '0.5rem' }}>
                <strong>Selected: {selectedStudentsForClass.length} student(s)</strong>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowAssignStudentsModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignStudents}
                disabled={selectedStudentsForClass.length === 0}
              >
                Assign {selectedStudentsForClass.length} Student(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Announcement</h3>
              <button className="modal-close" onClick={() => setShowAnnouncementModal(false)}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-input"
                  rows="5"
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAnnouncementModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Student Details: {selectedStudent.name || selectedStudent.email}</h3>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>
                <FiX size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Basic Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <strong>Name:</strong> {selectedStudent.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedStudent.email}
                  </div>
                  <div>
                    <strong>Student ID:</strong> {selectedStudent.studentId || 'N/A'}
                  </div>
                  <div>
                    <strong>Class:</strong> {classes.find(c => c.id === selectedStudent.classId)?.name || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Attendance</h4>
                {(() => {
                  const studentAttendance = attendance.filter(a => a.studentId === selectedStudent.id);
                  const presentCount = studentAttendance.filter(a => a.present).length;
                  const totalCount = studentAttendance.length;
                  const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;
                  return (
                    <div>
                      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                        <div><strong>Present:</strong> {presentCount}</div>
                        <div><strong>Absent:</strong> {totalCount - presentCount}</div>
                        <div><strong>Total:</strong> {totalCount}</div>
                        <div><strong>Percentage:</strong> {percentage}%</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Marks</h4>
                {(() => {
                  const studentMarks = marks.filter(m => m.studentId === selectedStudent.id);
                  return studentMarks.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Exam Type</th>
                          <th>Marks</th>
                          <th>Total</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentMarks.map(mark => (
                          <tr key={mark.id}>
                            <td>{mark.subject}</td>
                            <td>{mark.examType}</td>
                            <td>{mark.marks}</td>
                            <td>{mark.totalMarks}</td>
                            <td>{((mark.marks / mark.totalMarks) * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p>No marks recorded</p>;
                })()}
              </div>

              <div>
                <h4 style={{ marginBottom: '1rem' }}>Assignments</h4>
                {(() => {
                  const studentClass = classes.find(c => c.id === selectedStudent.classId);
                  const classAssignments = studentClass ? assignments.filter(a => a.classId === studentClass.id) : [];
                  const studentSubmissions = submissions.filter(s => s.studentId === selectedStudent.id);
                  return classAssignments.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classAssignments.map(assignment => {
                          const submitted = studentSubmissions.some(s => s.assignmentId === assignment.id);
                          return (
                            <tr key={assignment.id}>
                              <td>{assignment.title}</td>
                              <td>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</td>
                              <td>
                                {submitted ? (
                                  <span className="badge badge-success">Submitted</span>
                                ) : (
                                  <span className="badge badge-warning">Pending</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : <p>No assignments found</p>;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Details Modal */}
      {selectedTeacher && (
        <div className="modal-overlay" onClick={() => setSelectedTeacher(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Teacher Details: {selectedTeacher.name || selectedTeacher.email}</h3>
              <button className="modal-close" onClick={() => setSelectedTeacher(null)}>
                <FiX size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Basic Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <strong>Name:</strong> {selectedTeacher.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedTeacher.email}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Assigned Classes</h4>
                {(() => {
                  const teacherClasses = classes.filter(c => c.teacherId === selectedTeacher.id);
                  return teacherClasses.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Class Name</th>
                          <th>Grade</th>
                          <th>Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherClasses.map(cls => (
                          <tr key={cls.id}>
                            <td>{cls.name}</td>
                            <td>{cls.grade}</td>
                            <td>{cls.section}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p>No classes assigned</p>;
                })()}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Assignments Uploaded</h4>
                {(() => {
                  const teacherAssignments = assignments.filter(a => a.teacherId === selectedTeacher.id);
                  return teacherAssignments.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Class</th>
                          <th>Due Date</th>
                          <th>Submissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherAssignments.map(assignment => {
                          const classObj = classes.find(c => c.id === assignment.classId);
                          const classStudents = students.filter(s => s.classId === assignment.classId);
                          const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id);
                          return (
                            <tr key={assignment.id}>
                              <td>{assignment.title}</td>
                              <td>{classObj?.name || 'N/A'}</td>
                              <td>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</td>
                              <td>{assignmentSubmissions.length} / {classStudents.length}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : <p>No assignments uploaded</p>;
                })()}
              </div>

              <div>
                <h4 style={{ marginBottom: '1rem' }}>Marks Entered</h4>
                {(() => {
                  const teacherMarks = marks.filter(m => m.teacherId === selectedTeacher.id);
                  return teacherMarks.length > 0 ? (
                    <div>
                      <p><strong>Total Marks Entered:</strong> {teacherMarks.length}</p>
                      <p><strong>Can Upload Marks:</strong> <span className="badge badge-success">Yes</span></p>
                    </div>
                  ) : <p>No marks entered yet</p>;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

