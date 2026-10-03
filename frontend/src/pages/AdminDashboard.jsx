import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'
import {
  adminService, courseService, timetableService,
  eventService, certificateService
} from '../services/api'
import {
  LayoutDashboard, GraduationCap, Users, BookOpen,
  Calendar, Award, Bell, BarChart2, Shield, Plus,
  Trash2, Edit2, Search, CheckCircle, AlertTriangle,
  Clock, Eye, UserPlus, Filter, Download
} from 'lucide-react'
import { toast } from '../components/Toast'
import { Modal, ConfirmModal } from '../components/Modal'
import { Spinner, TableSkeleton } from '../components/Loading'
import { formatDate } from '../utils/helpers'
import {
  validateStudentForm, validateFacultyForm,
  validateCourseForm, validateTimetableForm, validateEventForm
} from '../utils/validators'

// =========================================================================
// 1. Dashboard Overview
// =========================================================================
function AdminHome() {
  const navigate = useNavigate()
  const setTab = (tab) => navigate(`/admin/${tab}`)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.dashboard()
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TableSkeleton rows={4} cols={4} />

  const stats = [
    { label: 'Total Students', value: data?.totalStudents || 0, icon: GraduationCap, color: '#2563eb', bg: '#eff6ff', tab: 'students' },
    { label: 'Faculty Members', value: data?.totalFaculty || 0, icon: Users, color: '#0f766e', bg: '#f0fdf4', tab: 'faculty' },
    { label: 'Academic Programs', value: data?.totalCourses || 0, icon: BookOpen, color: '#7c3aed', bg: '#faf5ff', tab: 'academics' },
    { label: 'Academic Departments', value: data?.totalDepartments || 0, icon: Shield, color: '#d97706', bg: '#fffbeb', tab: 'academics' },
  ]

  const attSummary = data?.attendanceSummary || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.85 }}>
            Central Administration Console
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 8px' }}>
            Aditya University
          </h2>
          <p style={{ fontSize: 14, opacity: 0.85, margin: 0, maxWidth: 600 }}>
            Monitor university operations, student registries, faculty allocations, timetable conflicts, and event accreditations in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/admin/students')} className="btn" style={{ background: '#fff', color: '#1e3a8a', fontWeight: 700 }}>
            <UserPlus size={16} /> Enroll Student
          </button>
          <button onClick={() => navigate('/admin/announcements')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            <Bell size={16} /> Post Notice
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="stat-card"
              onClick={() => setTab(s.tab)}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <Icon size={26} />
              </div>
              <div>
                <p className="stat-value">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Attendance & Recent Activity row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Attendance Health */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Institutional Attendance Health</h3>
            <span className="badge badge-primary">This Semester</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 0' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', border: '8px solid #2563eb',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a' }}>
                {attSummary.overallPercentage || 82}%
              </span>
              <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>AVERAGE</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Total Sessions Conducted:</span>
                <strong>{attSummary.totalSessions || 48}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Students At Risk (&lt;75%):</span>
                <span className="badge badge-danger">{attSummary.lowAttendanceCount || 2} students</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Active Today:</span>
                <span className="badge badge-success">Normal Operations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Recent System Activities</h3>
            <button onClick={() => navigate('/admin/audit_logs')} className="btn btn-ghost btn-sm">View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data?.recentActivities || []).slice(0, 5).map((log, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, borderBottom: '1px solid #f8fafc', paddingBottom: 8 }}>
                <span className={`badge ${log.action === 'DELETE' ? 'badge-danger' : log.action === 'CREATE' ? 'badge-success' : 'badge-info'}`}>
                  {log.action}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.details}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                    By {log.userName} • {formatDate(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {(!data?.recentActivities || data.recentActivities.length === 0) && (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 20 }}>No activity records recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// 2. Student Management Panel
// =========================================================================
function StudentsPanel() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', password: 'student123', rollNumber: '',
    department: 'Computer Science & Engineering', semester: '4', section: 'A',
    admissionYear: '2023', mobileNumber: ''
  })

  const loadStudents = () => {
    setLoading(true)
    adminService.getStudents()
      .then(res => setStudents(res.data))
      .catch(err => toast.error('Failed to load students'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStudents() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const errs = validateStudentForm(form)
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs)[0])
      return
    }
    setSubmitting(true)
    try {
      await adminService.addStudent({
        ...form,
        role: 'STUDENT',
        semester: Number(form.semester),
        admissionYear: Number(form.admissionYear)
      })
      toast.success(`Student ${form.name} enrolled successfully!`)
      setShowAdd(false)
      loadStudents()
      setForm({
        name: '', email: '', password: 'student123', rollNumber: '',
        department: 'Computer Science & Engineering', semester: '4', section: 'A',
        admissionYear: '2023', mobileNumber: ''
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminService.deleteStudent(deleteTarget.id)
      toast.success('Student record removed')
      setDeleteTarget(null)
      loadStudents()
    } catch {
      toast.error('Failed to delete student')
    }
  }

  const handleToggle = async (id) => {
    try {
      await adminService.toggleStudentStatus(id)
      toast.success('Status updated')
      loadStudents()
    } catch {
      toast.error('Failed to toggle status')
    }
  }

  const filtered = students.filter(s => {
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter
    return matchesSearch && matchesDept
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Controls */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Student Records & Enrollment</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
            Total {students.length} registered students
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <UserPlus size={16} /> Enroll New Student
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card card-sm" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll number, or student ID…"
            style={{ paddingLeft: 36 }}
          />
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        </div>
        <select
          className="form-select"
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="ALL">All Departments</option>
          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
          <option value="Artificial Intelligence & Machine Learning">AI & Machine Learning</option>
          <option value="Electronics & Communication Engineering">Electronics & Communication</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><span style={{ fontWeight: 700, color: '#1e3a8a' }}>{s.studentId || '—'}</span></td>
                  <td>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>{s.name}</p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{s.email}</p>
                    </div>
                  </td>
                  <td>{s.rollNumber || '—'}</td>
                  <td>{s.department || s.branch || '—'}</td>
                  <td>
                    <span className="badge badge-neutral">Sem {s.semester || 1} ({s.section || 'A'})</span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(s.id)}
                      className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Click to toggle status"
                    >
                      {s.status || 'ACTIVE'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 6 }}
                      title="Delete student"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    No matching student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Enroll New Student" size="md">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Ramesh Kumar" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="e.g. ramesh.k@student.apex.edu.in" />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number *</label>
              <input className="form-input" value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})} required placeholder="e.g. CSE2023045" />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password</label>
              <input className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Artificial Intelligence & Machine Learning">AI & Machine Learning</option>
                <option value="Electronics & Communication Engineering">Electronics & Communication</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester & Section</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" type="number" min="1" max="8" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} required />
                <input className="form-input" maxLength="2" value={form.section} onChange={e => setForm({...form, section: e.target.value})} style={{ width: 60 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Admission Year</label>
              <input className="form-input" type="number" value={form.admissionYear} onChange={e => setForm({...form, admissionYear: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input className="form-input" value={form.mobileNumber} onChange={e => setForm({...form, mobileNumber: e.target.value})} placeholder="10-digit mobile" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Enrolling…' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Student Record"
        message={`Are you sure you want to delete ${deleteTarget?.name} (${deleteTarget?.rollNumber})? This will permanently erase their attendance and mark history.`}
        confirmText="Delete Student"
        danger
      />
    </div>
  )
}

// =========================================================================
// 3. Faculty Management Panel
// =========================================================================
function FacultyPanel() {
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: 'faculty123', department: 'Computer Science & Engineering',
    designation: 'Assistant Professor', facultyId: '', mobileNumber: ''
  })

  const loadFaculty = () => {
    setLoading(true)
    adminService.getFaculty()
      .then(res => setFaculty(res.data))
      .catch(() => toast.error('Failed to load faculty'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadFaculty() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const errs = validateFacultyForm(form)
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs)[0])
      return
    }
    try {
      await adminService.addFaculty({ ...form, role: 'FACULTY' })
      toast.success(`Faculty ${form.name} registered successfully!`)
      setShowAdd(false)
      loadFaculty()
      setForm({
        name: '', email: '', password: 'faculty123', department: 'Computer Science & Engineering',
        designation: 'Assistant Professor', facultyId: '', mobileNumber: ''
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding faculty')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Faculty & Academic Staff</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
            Faculty members, professors and course coordinators
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <UserPlus size={16} /> Add Faculty Member
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Name & Designation</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map(f => (
                <tr key={f.id}>
                  <td><span style={{ fontWeight: 700, color: '#0f766e' }}>{f.facultyId || `FAC-${f.id}`}</span></td>
                  <td>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{f.designation || 'Professor'}</p>
                  </td>
                  <td>{f.email}</td>
                  <td>{f.department || '—'}</td>
                  <td>
                    <span className={`badge ${f.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                      {f.status || 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Faculty Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Faculty Member" size="md">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Dr. Anand Verma" />
            </div>
            <div className="form-group">
              <label className="form-label">Official Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="e.g. anand.v@apex.edu.in" />
            </div>
            <div className="form-group">
              <label className="form-label">Faculty ID *</label>
              <input className="form-input" value={form.facultyId} onChange={e => setForm({...form, facultyId: e.target.value})} required placeholder="e.g. FAC-CSE-005" />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <select className="form-select" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})}>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="HOD">Head of Department</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Artificial Intelligence & Machine Learning">AI & Machine Learning</option>
                <option value="Electronics & Communication Engineering">Electronics & Communication</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Faculty</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// =========================================================================
// 4. Academics (Departments & Courses) Panel
// =========================================================================
function AcademicsPanel() {
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [faculty, setFaculty] = useState([])
  const [courseForm, setCourseForm] = useState({
    code: '', name: '', description: '', credits: 4, semester: 1, duration: '4 Years', facultyId: '', departmentId: ''
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      courseService.getAll(),
      adminService.getDepartments(),
      adminService.getFaculty()
    ]).then(([cRes, dRes, fRes]) => {
      setCourses(cRes.data || [])
      setDepartments(dRes.data || [])
      setFaculty(fRes.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleAddCourse = async (e) => {
    e.preventDefault()
    const errs = validateCourseForm(courseForm)
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs)[0])
      return
    }
    try {
      await courseService.create({
        ...courseForm,
        credits: Number(courseForm.credits),
        semester: Number(courseForm.semester),
        facultyId: courseForm.facultyId ? Number(courseForm.facultyId) : null,
        departmentId: courseForm.departmentId ? Number(courseForm.departmentId) : null
      })
      toast.success('Course created successfully!')
      setShowAddCourse(false)
      loadData()
    } catch (err) {
      toast.error('Failed to create course')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Courses Section */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">Academic Courses & Curricula</h2>
            <p style={{ fontSize: 13, color: '#64748b' }}>Curriculum and credit allocations</p>
          </div>
          <button onClick={() => setShowAddCourse(true)} className="btn btn-primary">
            <Plus size={16} /> Add Course
          </button>
        </div>

        <div className="grid-3">
          {courses.map(c => (
            <div key={c.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-purple" style={{ fontWeight: 800 }}>{c.code}</span>
                <span className="badge badge-neutral">{c.credits} Credits</span>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{c.name}</h4>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5, flex: 1 }}>{c.description}</p>
              <div style={{ paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                <span>Semester {c.semester}</span>
                <span style={{ color: '#2563eb', fontWeight: 600 }}>{c.facultyName ? `Prof. ${c.facultyName}` : 'Unassigned'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments Section */}
      <div style={{ marginTop: 12 }}>
        <h3 className="section-title" style={{ marginBottom: 14 }}>Academic Departments ({departments.length})</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department Name</th>
                <th>Head of Department (HOD)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.code}</strong></td>
                  <td>{d.name}</td>
                  <td>{d.headOfDepartment || 'To be nominated'}</td>
                  <td><span className="badge badge-success">{d.status || 'ACTIVE'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal isOpen={showAddCourse} onClose={() => setShowAddCourse(false)} title="Add Academic Course" size="md">
        <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input className="form-input" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} required placeholder="e.g. CS401" />
            </div>
            <div className="form-group">
              <label className="form-label">Course Name *</label>
              <input className="form-input" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} required placeholder="e.g. Cloud Computing & Microservices" />
            </div>
            <div className="form-group">
              <label className="form-label">Credits *</label>
              <input className="form-input" type="number" min="1" max="10" value={courseForm.credits} onChange={e => setCourseForm({...courseForm, credits: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <input className="form-input" type="number" min="1" max="8" value={courseForm.semester} onChange={e => setCourseForm({...courseForm, semester: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={courseForm.departmentId} onChange={e => setCourseForm({...courseForm, departmentId: e.target.value})}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign Faculty</label>
              <select className="form-select" value={courseForm.facultyId} onChange={e => setCourseForm({...courseForm, facultyId: e.target.value})}>
                <option value="">Select Faculty</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.name} ({f.department})</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} placeholder="Detailed course syllabus overview..." />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddCourse(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Course</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// =========================================================================
// 5. Timetable Panel (Weekly Schedule & 4-way Conflict Check)
// =========================================================================
function TimetablePanel() {
  const [timetables, setTimetables] = useState([])
  const [courses, setCourses] = useState([])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    courseId: '', facultyId: '', dayOfWeek: 'MONDAY',
    startTime: '09:00', endTime: '10:00', classroom: 'Lecture Hall 101',
    semester: 4, section: 'A'
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      timetableService.getAll(),
      courseService.getAll(),
      adminService.getFaculty()
    ]).then(([tRes, cRes, fRes]) => {
      setTimetables(tRes.data || [])
      setCourses(cRes.data || [])
      setFaculty(fRes.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const errs = validateTimetableForm(form)
    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs)[0])
      return
    }
    try {
      await timetableService.create({
        ...form,
        courseId: Number(form.courseId),
        facultyId: Number(form.facultyId),
        semester: Number(form.semester)
      })
      toast.success('Timetable entry scheduled!')
      setShowAdd(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Schedule conflict detected!')
    }
  }

  const handleDelete = async (id) => {
    try {
      await timetableService.delete(id)
      toast.success('Slot removed')
      loadData()
    } catch {
      toast.error('Failed to remove slot')
    }
  }

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Institutional Timetable & Schedules</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Automated conflict-checked class timetables</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <Plus size={16} /> Schedule Class
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time Window</th>
                <th>Course</th>
                <th>Faculty</th>
                <th>Classroom / Lab</th>
                <th>Sem & Sec</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timetables.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.dayOfWeek}</strong></td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>
                      {t.startTime} – {t.endTime}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#1e3a8a' }}>{t.courseName}</td>
                  <td>{t.facultyName || '—'}</td>
                  <td>{t.classroom}</td>
                  <td>Sem {t.semester} ({t.section})</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(t.id)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {timetables.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    No timetable slots configured yet. Click "Schedule Class" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Slot Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Schedule New Class Slot" size="md">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Course *</label>
              <select className="form-select" value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})} required>
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Faculty *</label>
              <select className="form-select" value={form.facultyId} onChange={e => setForm({...form, facultyId: e.target.value})} required>
                <option value="">Select Faculty</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Day of Week *</label>
              <select className="form-select" value={form.dayOfWeek} onChange={e => setForm({...form, dayOfWeek: e.target.value})} required>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Classroom / Lab *</label>
              <input className="form-input" value={form.classroom} onChange={e => setForm({...form, classroom: e.target.value})} required placeholder="e.g. Hall 204 or Lab 3" />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input className="form-input" type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input className="form-input" type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <input className="form-input" type="number" min="1" max="8" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Section</label>
              <input className="form-input" maxLength="2" value={form.section} onChange={e => setForm({...form, section: e.target.value})} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule Class</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// =========================================================================
// 6. Events & Festivals Management
// =========================================================================
function EventsPanel() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technical',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '09:30', endTime: '17:00',
    venue: 'Main Campus Auditorium, Aditya University',
    organizer: 'Aditya University Student Council', maxParticipants: 200, rules: ''
  })

  const loadEvents = () => {
    setLoading(true)
    eventService.getAll()
      .then(res => setEvents(res.data || []))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadEvents() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await eventService.create({
        ...form,
        maxParticipants: Number(form.maxParticipants)
      })
      toast.success('Event published to university calendar!')
      setShowCreate(false)
      loadEvents()
    } catch (err) {
      toast.error('Failed to create event')
    }
  }

  const handleStatusChange = async (eventId, status) => {
    try {
      await eventService.updateStatus(eventId, status)
      toast.success(`Event status changed to ${status}`)
      loadEvents()
    } catch {
      toast.error('Failed to change status')
    }
  }

  const viewParticipants = async (ev) => {
    setSelectedEvent(ev)
    try {
      const res = await eventService.getParticipants(ev.id)
      setParticipants(res.data || [])
    } catch {
      toast.error('Failed to load participants')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Campus Events & Technical Symposia</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Conferences, hackathons, workshops, and cultural fests</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={16} /> Create Campus Event
        </button>
      </div>

      <div className="grid-3">
        {events.map(ev => (
          <div key={ev.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-purple">{ev.category || 'General'}</span>
              <span className={`badge ${ev.status === 'REGISTRATION_OPEN' ? 'badge-success' : 'badge-neutral'}`}>
                {ev.status}
              </span>
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{ev.title}</h4>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5, flex: 1 }}>{ev.description}</p>
            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>📅 {formatDate(ev.eventDate)} ({ev.startTime || '09:00'})</span>
              <span>📍 {ev.venue || 'Aditya University Campus'}</span>
              <span>👥 {ev.registeredCount || 0} registered / {ev.maxParticipants || 100} slots</span>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => viewParticipants(ev)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                <Eye size={14} /> Participants
              </button>
              {ev.status === 'REGISTRATION_OPEN' && (
                <button onClick={() => handleStatusChange(ev.id, 'COMPLETED')} className="btn btn-ghost btn-sm" style={{ color: '#0f766e' }}>
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Participants Modal */}
      <Modal isOpen={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title={`${selectedEvent?.title} — Registered Participants`} size="lg">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.studentName}</strong></td>
                  <td>{p.studentRollNumber || '—'}</td>
                  <td>{p.department || '—'}</td>
                  <td><span className="badge badge-success">{p.status || 'REGISTERED'}</span></td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                    No students registered for this event yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Create Event Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Publish New Campus Event" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g. National Hackathon 2026" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="Technical">Technical</option>
                <option value="Workshop">Workshop</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Event Date *</label>
              <input className="form-input" type="date" value={form.eventDate} onChange={e => setForm({...form, eventDate: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-input" type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-input" type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Venue</label>
            <input className="form-input" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Event</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// =========================================================================
// 7. Announcements Panel
// =========================================================================
function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    title: '', content: '', category: 'ACADEMIC', priority: 'NORMAL',
    targetRole: 'ALL', targetDepartment: 'ALL'
  })

  const loadData = () => {
    setLoading(true)
    adminService.getAnnouncements()
      .then(res => setAnnouncements(res.data || []))
      .catch(() => toast.error('Failed to load notices'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await adminService.createAnnouncement(form)
      toast.success('Notice published to student & faculty portals!')
      setShowAdd(false)
      loadData()
      setForm({ title: '', content: '', category: 'ACADEMIC', priority: 'NORMAL', targetRole: 'ALL', targetDepartment: 'ALL' })
    } catch {
      toast.error('Failed to publish announcement')
    }
  }

  const handleDelete = async (id) => {
    try {
      await adminService.deleteAnnouncement(id)
      toast.success('Notice removed')
      loadData()
    } catch {
      toast.error('Failed to remove notice')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Official Circulars & Notice Board</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>University-wide notifications, exam circulars, and advisories</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <Plus size={16} /> Publish Circular
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {announcements.map(a => (
          <div key={a.id} className="card" style={{ borderLeft: a.priority === 'HIGH' ? '5px solid #dc2626' : '5px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className={`badge ${a.priority === 'HIGH' ? 'badge-danger' : 'badge-primary'}`}>
                    {a.priority} PRIORITY
                  </span>
                  <span className="badge badge-neutral">{a.category}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Target: {a.targetRole}</span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{a.title}</h4>
              </div>
              <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: '10px 0 0', lineHeight: 1.6 }}>{a.content}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '10px 0 0' }}>
              Published: {formatDate(a.startDate || a.createdAt)}
            </p>
          </div>
        ))}
        {announcements.length === 0 && (
          <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No notices published yet.</p>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Publish Official Circular" size="md">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Circular Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g. Schedule for University Examinations Nov 2026" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="ACADEMIC">Academic</option>
                <option value="EXAM">Examination</option>
                <option value="ADMISSION">Admission</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High / Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select className="form-select" value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})}>
                <option value="ALL">All Campus (Students & Faculty)</option>
                <option value="STUDENT">Students Only</option>
                <option value="FACULTY">Faculty Only</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea className="form-textarea" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required placeholder="Enter full circular details..." />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Circular</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// =========================================================================
// 8. Audit Logs Panel
// =========================================================================
function AuditLogsPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getActivityLogs()
      .then(res => setLogs(res.data || []))
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">System Audit & Activity Trail</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Immutable record of critical administrative actions</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: 11, color: '#64748b' }}>{formatDate(l.timestamp)}</td>
                  <td><strong>{l.userName || l.userEmail}</strong></td>
                  <td><span className="badge badge-neutral">{l.role}</span></td>
                  <td>
                    <span className={`badge ${l.action === 'DELETE' ? 'badge-danger' : l.action === 'CREATE' ? 'badge-success' : 'badge-info'}`}>
                      {l.action}
                    </span>
                  </td>
                  <td>{l.entityName}</td>
                  <td style={{ fontSize: 12, color: '#334155' }}>{l.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    No audit records recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// =========================================================================
// Main Admin Dashboard Component
// =========================================================================
const ADMIN_NAV = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'students', label: 'Students', icon: GraduationCap },
  { path: 'faculty', label: 'Faculty', icon: Users },
  { path: 'academics', label: 'Departments & Courses', icon: BookOpen },
  { path: 'timetable', label: 'Timetable', icon: Calendar },
  { path: 'events', label: 'Events', icon: Award },
  { path: 'announcements', label: 'Notices', icon: Bell },
  { path: 'audit_logs', label: 'Audit Logs', icon: Shield },
]

export default function AdminDashboard() {
  return (
    <Layout navItems={ADMIN_NAV} role="ADMIN" basePath="/admin">
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="students" element={<StudentsPanel />} />
        <Route path="faculty" element={<FacultyPanel />} />
        <Route path="academics" element={<AcademicsPanel />} />
        <Route path="timetable" element={<TimetablePanel />} />
        <Route path="events" element={<EventsPanel />} />
        <Route path="announcements" element={<AnnouncementsPanel />} />
        <Route path="audit_logs" element={<AuditLogsPanel />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
