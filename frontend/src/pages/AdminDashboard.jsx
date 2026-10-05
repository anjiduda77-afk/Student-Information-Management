import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'
import AdminEventsList from './admin/events/AdminEventsList'
import EventDetailsPage from './admin/events/EventDetailsPage'
import EventCoordinatorsPage from './admin/events/EventCoordinatorsPage'
import CertificateTemplatesList from './admin/certificates/CertificateTemplatesList'
import CertificateTemplateEditor from './admin/certificates/CertificateTemplateEditor'
import CertificateTemplatePreviewPage from './admin/certificates/CertificateTemplatePreviewPage'
import {
  adminService, courseService, timetableService
} from '../services/api'
import {
  LayoutDashboard, GraduationCap, Users, BookOpen,
  Calendar, Award, Bell, Shield, Plus,
  Trash2, Search,
  Clock, UserPlus, FileText,
  KeyRound, ClipboardCheck
} from 'lucide-react'
import AdminAttendanceSection from '../components/attendance/AdminAttendanceSection'
import AcademicTimetable from '../components/timetable/AcademicTimetable'
import { toast } from '../components/Toast'
import { Modal, ConfirmModal } from '../components/Modal'
import { TableSkeleton } from '../components/Loading'
import { formatDate } from '../utils/helpers'
import {
  validateStudentForm, validateFacultyForm,
  validateCourseForm, validateTimetableForm
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
    { label: 'Total Students on Roll', value: data?.totalStudents || 0, icon: GraduationCap, color: '#2563eb', bg: '#eff6ff', tab: 'students' },
    { label: 'Faculty & Staff Roster', value: data?.totalFaculty || 0, icon: Users, color: '#0f766e', bg: '#f0fdf4', tab: 'faculty' },
    { label: 'Academic Programmes', value: data?.totalCourses || 0, icon: BookOpen, color: '#7c3aed', bg: '#faf5ff', tab: 'academics' },
    { label: 'Departments & Branches', value: data?.totalDepartments || 0, icon: Shield, color: '#d97706', bg: '#fffbeb', tab: 'academics' },
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
            Aditya University Central Administration
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 8px' }}>
            Institutional Administration Console
          </h2>
          <p style={{ fontSize: 14, opacity: 0.85, margin: 0, maxWidth: 640 }}>
            Monitor university operations, student roll lists, faculty teaching allotments, class time table matrix, and statutory attendance compliance in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/admin/students')} className="btn" style={{ background: '#fff', color: '#1e3a8a', fontWeight: 700 }}>
            <UserPlus size={16} /> Admit Student
          </button>
          <button onClick={() => navigate('/admin/announcements')} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>
            <Bell size={16} /> Issue Official Circular
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
      .catch(() => toast.error('Failed to load students'))
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

  const [resetTarget, setResetTarget] = useState(null)
  const [resetPasswordVal, setResetPasswordVal] = useState('student123')
  const [forceChange, setForceChange] = useState(true)
  const [resetting, setResetting] = useState(false)

  const handleAdminResetPassword = async (e) => {
    e.preventDefault()
    if (!resetPasswordVal || resetPasswordVal.length < 8) {
      toast.error('Password must be at least 8 characters long.')
      return
    }
    setResetting(true)
    try {
      await adminService.resetUserPassword(resetTarget.id, {
        newPassword: resetPasswordVal,
        confirmPassword: resetPasswordVal,
        forceChangeOnNextLogin: forceChange
      })
      toast.success(`Password for ${resetTarget.name} reset successfully!`)
      setResetTarget(null)
      setResetPasswordVal('student123')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setResetting(false)
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
                      onClick={() => { setResetTarget(s); setResetPasswordVal('student123'); }}
                      style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', padding: 6, marginRight: 4 }}
                      title="Reset student password"
                    >
                      <KeyRound size={16} />
                    </button>
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

      {/* Admin Reset Student Password Modal */}
      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={`Reset Password: ${resetTarget?.name}`}
        size="sm"
      >
        <form onSubmit={handleAdminResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Set a new temporary or permanent password for student <strong>{resetTarget?.rollNumber}</strong> ({resetTarget?.email}).
          </p>

          <div className="form-group">
            <label className="form-label">New Password * (Min 8 chars)</label>
            <input
              type="text"
              className="form-input"
              value={resetPasswordVal}
              onChange={e => setResetPasswordVal(e.target.value)}
              required
              minLength={8}
              placeholder="e.g. student123"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={forceChange}
              onChange={e => setForceChange(e.target.checked)}
            />
            <span>Force student to change password on next login</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setResetTarget(null)}
              disabled={resetting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={resetting}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <KeyRound size={15} />
              {resetting ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>
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
  const [resetTarget, setResetTarget] = useState(null)
  const [resetPasswordVal, setResetPasswordVal] = useState('faculty123')
  const [forceChange, setForceChange] = useState(true)
  const [resetting, setResetting] = useState(false)
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

  const handleAdminResetPassword = async (e) => {
    e.preventDefault()
    if (!resetPasswordVal || resetPasswordVal.length < 8) {
      toast.error('Password must be at least 8 characters long.')
      return
    }
    setResetting(true)
    try {
      await adminService.resetUserPassword(resetTarget.id, {
        newPassword: resetPasswordVal,
        confirmPassword: resetPasswordVal,
        forceChangeOnNextLogin: forceChange
      })
      toast.success(`Password for ${resetTarget.name} reset successfully!`)
      setResetTarget(null)
      setResetPasswordVal('faculty123')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setResetting(false)
    }
  }

  const handleToggle = async (id) => {
    try {
      await adminService.toggleFacultyStatus(id)
      toast.success('Faculty status updated')
      loadFaculty()
    } catch {
      toast.error('Failed to toggle faculty status')
    }
  }

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
        <TableSkeleton rows={4} cols={6} />
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
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                    <button
                      onClick={() => handleToggle(f.id)}
                      className={`badge ${f.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Click to toggle status"
                    >
                      {f.status || 'ACTIVE'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => { setResetTarget(f); setResetPasswordVal('faculty123'); }}
                      style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', padding: 6 }}
                      title="Reset faculty password"
                    >
                      <KeyRound size={16} />
                    </button>
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

      {/* Admin Reset Faculty Password Modal */}
      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={`Reset Password: ${resetTarget?.name}`}
        size="sm"
      >
        <form onSubmit={handleAdminResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Set a new password for faculty member <strong>{resetTarget?.facultyId || resetTarget?.name}</strong> ({resetTarget?.email}).
          </p>

          <div className="form-group">
            <label className="form-label">New Password * (Min 8 chars)</label>
            <input
              type="text"
              className="form-input"
              value={resetPasswordVal}
              onChange={e => setResetPasswordVal(e.target.value)}
              required
              minLength={8}
              placeholder="e.g. faculty123"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={forceChange}
              onChange={e => setForceChange(e.target.checked)}
            />
            <span>Force faculty to change password on next login</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setResetTarget(null)}
              disabled={resetting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={resetting}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <KeyRound size={15} />
              {resetting ? 'Resetting…' : 'Reset Password'}
            </button>
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
    } catch {
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

        {loading ? (
          <TableSkeleton rows={3} cols={3} />
        ) : (
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
        )}
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
  const [activeTab, setActiveTab] = useState('grid') // 'grid' | 'manager'
  const [timetables, setTimetables] = useState([])
  const [courses, setCourses] = useState([])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    courseId: '', facultyId: '', dayOfWeek: 'MONDAY',
    startTime: '09:00', endTime: '09:50', classroom: 'Lecture Hall 101',
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
      toast.success('Time table slot allotted successfully!')
      setShowAdd(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Schedule conflict detected! Check faculty, room or student section.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await timetableService.delete(id)
      toast.success('Slot deallocated')
      loadData()
    } catch {
      toast.error('Failed to remove slot')
    }
  }

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="section-title">Institutional Academic Time Table &amp; Period Allocation</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Aditya University Master Matrix &amp; 4-Way Automated Conflict Checking</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setActiveTab('grid')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'grid' ? '#1e3a8a' : '#f8fafc',
              color: activeTab === 'grid' ? '#fff' : '#475569',
              border: '1px solid #cbd5e1',
              fontWeight: 800,
              gap: 6
            }}
          >
            <Calendar size={14} /> Master Time Table Matrix
          </button>
          <button
            onClick={() => setActiveTab('manager')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'manager' ? '#1e3a8a' : '#f8fafc',
              color: activeTab === 'manager' ? '#fff' : '#475569',
              border: '1px solid #cbd5e1',
              fontWeight: 800,
              gap: 6
            }}
          >
            <Clock size={14} /> Slot Allocator &amp; Engine ({timetables.length})
          </button>
          {activeTab === 'manager' && (
            <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm" style={{ fontWeight: 800 }}>
              <Plus size={14} /> Allot Period Slot
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: MASTER TIME TABLE MATRIX (Indian University Standard) */}
      {activeTab === 'grid' ? (
        <AcademicTimetable role="ADMIN" />
      ) : (
        /* TAB 2: SLOT ALLOCATOR & CONFLICT ENGINE */
        <div className="card">
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0f172a' }}>Allotted Teaching Slots</h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Manage individual period allotments, faculty assignments, and venue allocation</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Allot New Slot
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
                    <th>Paper / Subject</th>
                    <th>Faculty In-Charge</th>
                    <th>Lecture Hall / Lab</th>
                    <th>Sem &amp; Sec</th>
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
                      <td style={{ fontWeight: 700, color: '#1e3a8a' }}>{t.courseName}</td>
                      <td>{t.facultyName || '—'}</td>
                      <td>{t.classroom}</td>
                      <td>Sem {t.semester} ({t.section})</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(t.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4 }}
                          title="Remove slot"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {timetables.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                        No time table slots configured yet. Click "Allot New Slot" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Slot Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Allot New Class Time Table Slot" size="md">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Paper / Subject *</label>
              <select className="form-select" value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})} required>
                <option value="">Select Paper / Subject</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Faculty In-Charge *</label>
              <select className="form-select" value={form.facultyId} onChange={e => setForm({...form, facultyId: e.target.value})} required>
                <option value="">Select Faculty Member</option>
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
              <label className="form-label">Lecture Hall / Lab *</label>
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
              <label className="form-label">Semester *</label>
              <input className="form-input" type="number" min="1" max="8" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Section *</label>
              <input className="form-input" maxLength="2" value={form.section} onChange={e => setForm({...form, section: e.target.value})} required placeholder="A or B" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Allot Time Table Slot</button>
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

      {loading ? (
        <TableSkeleton rows={3} cols={1} />
      ) : (
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
      )}

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
  { path: 'dashboard', label: 'Administration Console', icon: LayoutDashboard },
  { path: 'students', label: 'Student Admissions & Rolls', icon: GraduationCap },
  { path: 'faculty', label: 'Faculty & Staff Roster', icon: Users },
  { path: 'academics', label: 'Programmes & Branches', icon: BookOpen },
  { path: 'timetable', label: 'Academic Class Time Table', icon: Calendar },
  { path: 'attendance', label: 'Attendance Central Oversight', icon: ClipboardCheck },
  { path: 'events', label: 'Campus Events & Symposia', icon: Award },
  { path: 'certificates', label: 'Academic Certificates', icon: FileText },
  { path: 'announcements', label: 'Official Circulars & Notices', icon: Bell },
  { path: 'audit_logs', label: 'Institutional Audit Logs', icon: Shield },
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
        <Route path="attendance" element={<AdminAttendanceSection />} />
        <Route path="events" element={<AdminEventsList />} />
        <Route path="events/:eventId" element={<EventDetailsPage />} />
        <Route path="events/:eventId/coordinators" element={<EventCoordinatorsPage />} />
        <Route path="certificates" element={<CertificateTemplatesList />} />
        <Route path="certificates/templates/new" element={<CertificateTemplateEditor isNew />} />
        <Route path="certificates/templates/:templateId/edit" element={<CertificateTemplateEditor />} />
        <Route path="certificates/templates/:templateId/preview" element={<CertificateTemplatePreviewPage />} />
        <Route path="announcements" element={<AnnouncementsPanel />} />
        <Route path="audit_logs" element={<AuditLogsPanel />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
