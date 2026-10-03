import { useEffect, useState, useCallback } from 'react'
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
  Clock, Eye, UserPlus, Filter, Download, FileText,
  X, Star, Medal, Trophy, UserCheck, RefreshCw, Copy, KeyRound
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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
// 6. Events & Festivals Management (Full-Featured)
// =========================================================================
const EVENT_STATUS_COLORS = {
  DRAFT: { bg: '#f1f5f9', color: '#64748b' },
  REGISTRATION_OPEN: { bg: '#dcfce7', color: '#16a34a' },
  REGISTRATION_CLOSED: { bg: '#fef3c7', color: '#d97706' },
  ONGOING: { bg: '#dbeafe', color: '#2563eb' },
  COMPLETED: { bg: '#e0e7ff', color: '#7c3aed' },
  CANCELLED: { bg: '#fee2e2', color: '#dc2626' },
}

const POSITION_ICONS = {
  WINNER: <Trophy size={14} style={{ color: '#f59e0b' }} />,
  RUNNER_UP: <Medal size={14} style={{ color: '#94a3b8' }} />,
  SECOND_RUNNER_UP: <Medal size={14} style={{ color: '#cd7f32' }} />,
  SPECIAL_RECOGNITION: <Star size={14} style={{ color: '#8b5cf6' }} />,
  PARTICIPANT: <UserCheck size={14} style={{ color: '#0ea5e9' }} />,
  NO_CERTIFICATE: <X size={14} style={{ color: '#dc2626' }} />,
}

function EventsPanel() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('details') // details | coordinators | participants | results | certificates
  const [participants, setParticipants] = useState([])
  const [coordinators, setCoordinators] = useState([])
  const [certificates, setCertificates] = useState([])
  const [allFaculty, setAllFaculty] = useState([])
  const [assignFacultyId, setAssignFacultyId] = useState('')
  const [assignRemarks, setAssignRemarks] = useState('')
  const [resultEdits, setResultEdits] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technical',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '09:30', endTime: '17:00',
    venue: 'Main Campus Auditorium, Aditya University',
    organizer: 'Aditya University', maxParticipants: 200, rules: ''
  })

  const loadEvents = useCallback(() => {
    setLoading(true)
    eventService.getAll()
      .then(res => setEvents(res.data || []))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadEvents()
    adminService.getFaculty().then(res => setAllFaculty(res.data || [])).catch(() => {})
  }, [loadEvents])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await eventService.create({ ...form, maxParticipants: Number(form.maxParticipants) })
      toast.success('Event published to university calendar!')
      setShowCreate(false)
      loadEvents()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (eventId, status) => {
    try {
      await eventService.updateStatus(eventId, status)
      toast.success(`Event status changed to ${status}`)
      loadEvents()
      if (selectedEvent?.id === eventId) setSelectedEvent(ev => ({ ...ev, status }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change status')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    try {
      await eventService.delete(eventId)
      toast.success('Event deleted')
      loadEvents()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const openEventManage = async (ev) => {
    setSelectedEvent(ev)
    setActiveTab('details')
    await loadEventDetails(ev.id)
  }

  const loadEventDetails = async (eventId) => {
    try {
      const [pRes, cRes, certRes] = await Promise.allSettled([
        eventService.getParticipants(eventId),
        eventService.getCoordinators(eventId),
        eventService.getEventCertificates(eventId),
      ])
      setParticipants(pRes.status === 'fulfilled' ? pRes.value.data || [] : [])
      setCoordinators(cRes.status === 'fulfilled' ? cRes.value.data || [] : [])
      setCertificates(certRes.status === 'fulfilled' ? certRes.value.data || [] : [])
    } catch {}
  }

  const handleAssignCoordinator = async () => {
    if (!assignFacultyId) return toast.error('Select a faculty member')
    setSubmitting(true)
    try {
      await eventService.assignCoordinator(selectedEvent.id, Number(assignFacultyId), assignRemarks)
      toast.success('Coordinator assigned successfully!')
      setAssignFacultyId('')
      setAssignRemarks('')
      const res = await eventService.getCoordinators(selectedEvent.id)
      setCoordinators(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign coordinator')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveCoordinator = async (facultyId) => {
    try {
      await eventService.removeCoordinator(selectedEvent.id, facultyId)
      toast.success('Coordinator removed')
      setCoordinators(prev => prev.filter(c => c.facultyId !== facultyId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove coordinator')
    }
  }

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await eventService.markAttendance(selectedEvent.id, studentId, status)
      toast.success(`Attendance marked: ${status}`)
      setParticipants(prev => prev.map(p => p.studentId === studentId ? { ...p, attendanceStatus: status } : p))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance')
    }
  }

  const handleSaveResult = async (studentId) => {
    const data = resultEdits[studentId]
    if (!data?.position) return toast.error('Select a position')
    setSubmitting(true)
    try {
      await eventService.updateResult(selectedEvent.id, studentId, data)
      toast.success('Result saved!')
      const res = await eventService.getParticipants(selectedEvent.id)
      setParticipants(res.data || [])
      setResultEdits(prev => { const n = { ...prev }; delete n[studentId]; return n })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save result')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateCertificate = async (participant) => {
    const certType = participant.resultPosition === 'WINNER' ? 'WINNER'
      : participant.resultPosition === 'RUNNER_UP' ? 'RUNNER_UP'
      : participant.resultPosition === 'SECOND_RUNNER_UP' ? 'SECOND_RUNNER_UP'
      : participant.resultPosition === 'SPECIAL_RECOGNITION' ? 'SPECIAL_RECOGNITION'
      : 'PARTICIPATION'
    try {
      await eventService.generateCertificate(selectedEvent.id, {
        studentId: participant.studentId,
        certificateType: certType,
        position: participant.resultPosition,
      })
      toast.success(`Certificate generated for ${participant.studentName}`)
      const res = await eventService.getEventCertificates(selectedEvent.id)
      setCertificates(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certificate generation failed')
    }
  }

  const filtered = statusFilter === 'ALL' ? events : events.filter(e => e.status === statusFilter)

  const TAB_STYLE = (active) => ({
    padding: '8px 18px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
    fontSize: 13, transition: 'all 0.2s',
    background: active ? '#2563eb' : 'transparent',
    color: active ? '#fff' : '#64748b',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Campus Events & Technical Symposia</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Manage events, coordinators, participants, results, and certificates</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="form-select" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="REGISTRATION_OPEN">Registration Open</option>
            <option value="REGISTRATION_CLOSED">Registration Closed</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? <TableSkeleton rows={3} cols={3} /> : (
        <div className="grid-3">
          {filtered.map(ev => {
            const sc = EVENT_STATUS_COLORS[ev.status] || EVENT_STATUS_COLORS.DRAFT
            return (
              <div key={ev.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-purple">{ev.category || 'General'}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px', background: sc.bg, color: sc.color }}>
                    {ev.status?.replace('_', ' ')}
                  </span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{ev.title}</h4>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5, flex: 1 }}>
                  {ev.description?.slice(0, 100)}{ev.description?.length > 100 ? '…' : ''}
                </p>
                <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>📅 {formatDate(ev.eventDate)}</span>
                  <span>📍 {ev.venue}</span>
                  <span>👥 {ev.participantCount || 0} / {ev.maxParticipants || '∞'} registered</span>
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                  <button onClick={() => openEventManage(ev)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                    <Eye size={14} /> Manage
                  </button>
                  {ev.status === 'DRAFT' && (
                    <button onClick={() => handleStatusChange(ev.id, 'REGISTRATION_OPEN')} className="btn btn-ghost btn-sm" style={{ color: '#16a34a' }}>
                      Publish
                    </button>
                  )}
                  {ev.status === 'REGISTRATION_OPEN' && (
                    <button onClick={() => handleStatusChange(ev.id, 'COMPLETED')} className="btn btn-ghost btn-sm" style={{ color: '#7c3aed' }}>
                      Complete
                    </button>
                  )}
                  <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px 8px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#94a3b8' }}>
              <Award size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No events found. Create your first campus event!</p>
            </div>
          )}
        </div>
      )}

      {/* ========================= Event Management Modal ========================= */}
      <Modal isOpen={Boolean(selectedEvent)} onClose={() => { setSelectedEvent(null); setResultEdits({}) }}
        title={selectedEvent?.title || 'Manage Event'} size="xl">
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 10, padding: 4, flexWrap: 'wrap' }}>
              {[
                { key: 'details', label: 'Event Info', icon: <Award size={14} /> },
                { key: 'coordinators', label: `Coordinators (${coordinators.length})`, icon: <Users size={14} /> },
                { key: 'participants', label: `Participants (${participants.length})`, icon: <UserCheck size={14} /> },
                { key: 'results', label: 'Results', icon: <Trophy size={14} /> },
                { key: 'certificates', label: `Certificates (${certificates.length})`, icon: <FileText size={14} /> },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={TAB_STYLE(activeTab === t.key)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ---- Details Tab ---- */}
            {activeTab === 'details' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>Event Code</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedEvent.eventCode || '—'}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>Category</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedEvent.category}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>Status</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(s => (
                          <button key={s} onClick={() => handleStatusChange(selectedEvent.id, s)}
                            style={{
                              fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1.5px solid', cursor: 'pointer', fontWeight: 700,
                              background: selectedEvent.status === s ? '#2563eb' : 'transparent',
                              color: selectedEvent.status === s ? '#fff' : '#64748b',
                              borderColor: selectedEvent.status === s ? '#2563eb' : '#e2e8f0',
                            }}>
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {[
                  { label: 'Date', value: formatDate(selectedEvent.eventDate) },
                  { label: 'Time', value: `${selectedEvent.startTime || '—'} – ${selectedEvent.endTime || '—'}` },
                  { label: 'Venue', value: selectedEvent.venue },
                  { label: 'Organizer', value: selectedEvent.organizer },
                  { label: 'Max Participants', value: selectedEvent.maxParticipants },
                  { label: 'Registered', value: selectedEvent.participantCount || 0 },
                ].map(item => (
                  <div key={item.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{item.value || '—'}</p>
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1', background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Description</p>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: 1.7 }}>{selectedEvent.description || '—'}</p>
                </div>
                {selectedEvent.rules && (
                  <div style={{ gridColumn: '1/-1', background: '#fffbeb', borderRadius: 10, padding: '12px 16px', borderLeft: '4px solid #d97706' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>Rules & Guidelines</p>
                    <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.6 }}>{selectedEvent.rules}</p>
                  </div>
                )}
              </div>
            )}

            {/* ---- Coordinators Tab ---- */}
            {activeTab === 'coordinators' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Assign Coordinator Form */}
                <div style={{ background: '#f0f9ff', borderRadius: 12, padding: 16, border: '1px solid #bae6fd' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0369a1', margin: '0 0 12px' }}>
                    <UserPlus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Assign Faculty Coordinator
                  </h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
                      <label className="form-label">Faculty Member</label>
                      <select className="form-select" value={assignFacultyId} onChange={e => setAssignFacultyId(e.target.value)}>
                        <option value="">-- Select Faculty --</option>
                        {allFaculty.filter(f => !coordinators.some(c => c.facultyId === f.id)).map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.designation || 'Faculty'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
                      <label className="form-label">Remarks (optional)</label>
                      <input className="form-input" value={assignRemarks} onChange={e => setAssignRemarks(e.target.value)} placeholder="e.g. Lead Coordinator" />
                    </div>
                    <button onClick={handleAssignCoordinator} className="btn btn-primary" disabled={submitting}>
                      <Plus size={14} /> Assign
                    </button>
                  </div>
                </div>

                {/* Coordinators List */}
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr>
                      <th>Faculty Name</th><th>Designation</th><th>Department</th>
                      <th>Remarks</th><th>Assigned</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                      {coordinators.map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.facultyName}</strong><br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{c.facultyEmail}</span></td>
                          <td>{c.facultyDesignation || '—'}</td>
                          <td>{c.facultyDepartment || '—'}</td>
                          <td><span style={{ fontSize: 12 }}>{c.remarks || '—'}</span></td>
                          <td style={{ fontSize: 11, color: '#64748b' }}>{formatDate(c.assignedAt)}</td>
                          <td>
                            <button onClick={() => handleRemoveCoordinator(c.facultyId)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4 }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {coordinators.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                          No coordinators assigned yet.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ---- Participants Tab ---- */}
            {activeTab === 'participants' && (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr>
                    <th>Student</th><th>Roll No.</th><th>Department</th>
                    <th>Semester</th><th>Registered</th><th>Attendance</th>
                  </tr></thead>
                  <tbody>
                    {participants.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.studentName}</strong></td>
                        <td>{p.rollNumber || '—'}</td>
                        <td>{p.department || '—'}</td>
                        <td>{p.semester || '—'}</td>
                        <td style={{ fontSize: 11, color: '#64748b' }}>{formatDate(p.registeredAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {['PRESENT', 'ABSENT'].map(s => (
                              <button key={s} onClick={() => handleMarkAttendance(p.studentId, s)}
                                style={{
                                  fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1.5px solid',
                                  cursor: 'pointer', fontWeight: 700,
                                  background: p.attendanceStatus === s ? (s === 'PRESENT' ? '#16a34a' : '#dc2626') : 'transparent',
                                  color: p.attendanceStatus === s ? '#fff' : '#64748b',
                                  borderColor: p.attendanceStatus === s ? (s === 'PRESENT' ? '#16a34a' : '#dc2626') : '#e2e8f0',
                                }}>{s}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {participants.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                        No participants registered.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---- Results Tab ---- */}
            {activeTab === 'results' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#0369a1' }}>
                  💡 Assign positions to participants. WINNER / RUNNER_UP / SECOND_RUNNER_UP / SPECIAL_RECOGNITION / PARTICIPANT / NO_CERTIFICATE
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr>
                      <th>Student</th><th>Attendance</th><th>Position</th><th>Score</th><th>Remarks</th><th>Save</th>
                    </tr></thead>
                    <tbody>
                      {participants.map(p => {
                        const edit = resultEdits[p.studentId] || { position: p.resultPosition || '', score: p.score || '', remarks: '' }
                        const isEditing = Boolean(resultEdits[p.studentId])
                        return (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.studentName}</strong><br />
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.rollNumber}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, color: p.attendanceStatus === 'PRESENT' ? '#16a34a' : '#94a3b8' }}>
                                {p.attendanceStatus || 'Not marked'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {POSITION_ICONS[p.resultPosition]}
                                <select className="form-select" style={{ padding: '3px 8px', fontSize: 12, height: 'auto' }}
                                  value={edit.position}
                                  onChange={e => setResultEdits(prev => ({ ...prev, [p.studentId]: { ...edit, position: e.target.value } }))}>
                                  <option value="">-- Select --</option>
                                  <option value="WINNER">🏆 Winner</option>
                                  <option value="RUNNER_UP">🥈 Runner-Up</option>
                                  <option value="SECOND_RUNNER_UP">🥉 2nd Runner-Up</option>
                                  <option value="SPECIAL_RECOGNITION">⭐ Special Recognition</option>
                                  <option value="PARTICIPANT">✅ Participant</option>
                                  <option value="NO_CERTIFICATE">❌ No Certificate</option>
                                </select>
                              </div>
                            </td>
                            <td>
                              <input type="number" className="form-input" style={{ width: 70, padding: '3px 8px', fontSize: 12, height: 'auto' }}
                                placeholder="Score" value={edit.score}
                                onChange={e => setResultEdits(prev => ({ ...prev, [p.studentId]: { ...edit, score: e.target.value } }))} />
                            </td>
                            <td>
                              <input className="form-input" style={{ width: 120, padding: '3px 8px', fontSize: 12, height: 'auto' }}
                                placeholder="Remarks" value={edit.remarks}
                                onChange={e => setResultEdits(prev => ({ ...prev, [p.studentId]: { ...edit, remarks: e.target.value } }))} />
                            </td>
                            <td>
                              <button onClick={() => handleSaveResult(p.studentId)}
                                className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} disabled={submitting}>
                                <CheckCircle size={12} /> Save
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {participants.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                          No participants to record results for.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ---- Certificates Tab ---- */}
            {activeTab === 'certificates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#166534', border: '1px solid #bbf7d0' }}>
                  ✅ Generate certificates for participants who have result positions assigned. Download links open as PDFs.
                </div>
                {/* Generate from participants */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>Generate Certificates</h4>
                  <div className="table-container">
                    <table className="data-table">
                      <thead><tr><th>Student</th><th>Position</th><th>Already Generated</th><th>Action</th></tr></thead>
                      <tbody>
                        {participants.filter(p => p.resultPosition && p.resultPosition !== 'NO_CERTIFICATE').map(p => {
                          const existing = certificates.find(c => c.studentId === p.studentId)
                          return (
                            <tr key={p.id}>
                              <td><strong>{p.studentName}</strong><br /><span style={{ fontSize: 11, color: '#94a3b8' }}>{p.rollNumber}</span></td>
                              <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{POSITION_ICONS[p.resultPosition]}<span style={{ fontSize: 13 }}>{p.resultPosition?.replace('_', ' ')}</span></div></td>
                              <td>
                                {existing ? (
                                  <span className="badge badge-success">Generated</span>
                                ) : (
                                  <span className="badge badge-neutral">Not yet</span>
                                )}
                              </td>
                              <td style={{ display: 'flex', gap: 6 }}>
                                {existing ? (
                                  <a href={`/api/certificates/${existing.certificateId}/download`} target="_blank" rel="noreferrer"
                                    className="btn btn-ghost btn-sm" style={{ color: '#2563eb' }}>
                                    <Download size={14} /> Download PDF
                                  </a>
                                ) : (
                                  <button onClick={() => handleGenerateCertificate(p)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }}>
                                    <FileText size={12} /> Generate
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                        {participants.filter(p => p.resultPosition && p.resultPosition !== 'NO_CERTIFICATE').length === 0 && (
                          <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                            Assign results first to enable certificate generation.
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Issued Certificates */}
                {certificates.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>All Issued Certificates ({certificates.length})</h4>
                    <div className="table-container">
                      <table className="data-table">
                        <thead><tr><th>Certificate ID</th><th>Student</th><th>Type</th><th>Status</th><th>Issued</th><th>Actions</th></tr></thead>
                        <tbody>
                          {certificates.map(c => (
                            <tr key={c.id}>
                              <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.certificateId}</td>
                              <td><strong>{c.studentName}</strong></td>
                              <td><span className="badge badge-purple">{c.certificateType?.replace('_', ' ')}</span></td>
                              <td><span className={`badge ${c.status === 'VALID' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span></td>
                              <td style={{ fontSize: 11, color: '#64748b' }}>{formatDate(c.generatedAt)}</td>
                              <td>
                                <a href={`/api/certificates/${c.certificateId}/download`} target="_blank" rel="noreferrer"
                                  className="btn btn-ghost btn-sm"><Download size={14} /> PDF</a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========================= Create Event Modal ========================= */}
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
                <option value="Hackathon">Hackathon</option>
                <option value="Symposium">Symposium</option>
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
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Organizer</label>
              <input className="form-input" value={form.organizer} onChange={e => setForm({...form, organizer: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Participants</label>
              <input className="form-input" type="number" value={form.maxParticipants} onChange={e => setForm({...form, maxParticipants: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Describe the event..." />
          </div>
          <div className="form-group">
            <label className="form-label">Rules & Guidelines</label>
            <textarea className="form-textarea" rows={2} value={form.rules} onChange={e => setForm({...form, rules: e.target.value})} placeholder="Optional event rules..." />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Spinner size={14} /> : <Plus size={14} />} Publish Event
            </button>
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
// 8. Certificate Templates Management
// =========================================================================
function CertificatesPanel() {
  const [templates, setTemplates] = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState('templates') // templates | records
  const [showCreate, setShowCreate] = useState(false)
  const [editTemplate, setEditTemplate] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [defaultTemplate, setDefaultTemplate] = useState({
    name: '', templateType: 'PARTICIPATION',
    title: 'Certificate of Participation',
    subtitle: 'This is to certify that',
    collegeName: 'Aditya University',
    description: 'has participated in the event organized by Aditya University',
    borderStyle: 'CLASSIC', borderWidth: 2, borderColor: '#1e3a8a',
    fontFamily: 'Times New Roman', fontSize: 14, fontWeight: 'normal',
    textAlignment: 'center', textColor: '#1a1a1a',
    primaryColor: '#1e3a8a', secondaryColor: '#d97706',
    backgroundColor: '#ffffff',
    signatoryTitle: 'Principal', signatoryName: 'Dr. Name',
    signatory2Title: 'HOD', signatory2Name: 'Dr. Name',
    bodyTemplate: 'has successfully participated in {eventName} held on {eventDate} at {venue}.',
  })
  const [form, setForm] = useState({ ...defaultTemplate })

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.allSettled([
      certificateService.getTemplates(),
      certificateService.getAll(),
    ]).then(([tRes, cRes]) => {
      setTemplates(tRes.status === 'fulfilled' ? tRes.value.data || [] : [])
      setCertificates(cRes.status === 'fulfilled' ? cRes.value.data || [] : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await certificateService.createTemplate(form)
      toast.success('Certificate template created!')
      setShowCreate(false)
      setForm({ ...defaultTemplate })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await certificateService.updateTemplate(editTemplate.id, form)
      toast.success('Template updated!')
      setEditTemplate(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update template')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async (id) => {
    try {
      await certificateService.publishTemplate(id)
      toast.success('Template published!')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish')
    }
  }

  const handleDuplicate = async (id) => {
    try {
      await certificateService.duplicateTemplate(id)
      toast.success('Template duplicated!')
      loadData()
    } catch (err) {
      toast.error('Failed to duplicate')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return
    try {
      await certificateService.deleteTemplate(id)
      toast.success('Template deleted')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete published template')
    }
  }

  const handleRevoke = async (id) => {
    const reason = prompt('Enter revocation reason:')
    if (!reason) return
    try {
      await certificateService.revoke(id, reason)
      toast.success('Certificate revoked')
      loadData()
    } catch (err) {
      toast.error('Failed to revoke')
    }
  }

  const TAB_STYLE = (active) => ({
    padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
    fontSize: 13, transition: 'all 0.2s',
    background: active ? '#2563eb' : 'transparent',
    color: active ? '#fff' : '#64748b',
  })

  const TemplateForm = ({ onSubmit, title }) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Template Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Participation Certificate 2026" />
        </div>
        <div className="form-group">
          <label className="form-label">Certificate Type</label>
          <select className="form-select" value={form.templateType} onChange={e => setForm({...form, templateType: e.target.value})}>
            <option value="PARTICIPATION">Participation</option>
            <option value="WINNER">Winner</option>
            <option value="RUNNER_UP">Runner Up</option>
            <option value="ACHIEVEMENT">Achievement</option>
            <option value="SPECIAL_RECOGNITION">Special Recognition</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Certificate Title</label>
          <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">College Name</label>
          <input className="form-input" value={form.collegeName} onChange={e => setForm({...form, collegeName: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Primary Color</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
            <input className="form-input" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} placeholder="#1e3a8a" style={{ flex: 1 }} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Secondary Color</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={form.secondaryColor} onChange={e => setForm({...form, secondaryColor: e.target.value})} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
            <input className="form-input" value={form.secondaryColor} onChange={e => setForm({...form, secondaryColor: e.target.value})} placeholder="#d97706" style={{ flex: 1 }} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Signatory 1 Name</label>
          <input className="form-input" value={form.signatoryName} onChange={e => setForm({...form, signatoryName: e.target.value})} placeholder="Dr. Principal Name" />
        </div>
        <div className="form-group">
          <label className="form-label">Signatory 1 Title</label>
          <input className="form-input" value={form.signatoryTitle} onChange={e => setForm({...form, signatoryTitle: e.target.value})} placeholder="Principal" />
        </div>
        <div className="form-group">
          <label className="form-label">Signatory 2 Name</label>
          <input className="form-input" value={form.signatory2Name} onChange={e => setForm({...form, signatory2Name: e.target.value})} placeholder="Dr. HOD Name" />
        </div>
        <div className="form-group">
          <label className="form-label">Signatory 2 Title</label>
          <input className="form-input" value={form.signatory2Title} onChange={e => setForm({...form, signatory2Title: e.target.value})} placeholder="Head of Department" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Body Text Template</label>
        <textarea className="form-textarea" rows={2} value={form.bodyTemplate}
          onChange={e => setForm({...form, bodyTemplate: e.target.value})}
          placeholder="Use {studentName}, {eventName}, {eventDate}, {venue}, {position} as placeholders" />
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Available placeholders: {'{studentName}'}, {'{eventName}'}, {'{eventDate}'}, {'{venue}'}, {'{position}'}, {'{collegeName}'}</p>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={() => { setShowCreate(false); setEditTemplate(null) }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <Spinner size={14} /> : <CheckCircle size={14} />} {title}
        </button>
      </div>
    </form>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Certificates & Templates</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Design certificate templates and manage issued certificates</p>
        </div>
        {activeSubTab === 'templates' && (
          <button onClick={() => { setForm({ ...defaultTemplate }); setShowCreate(true) }} className="btn btn-primary">
            <Plus size={16} /> New Template
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button onClick={() => setActiveSubTab('templates')} style={TAB_STYLE(activeSubTab === 'templates')}>
          <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Templates ({templates.length})
        </button>
        <button onClick={() => setActiveSubTab('records')} style={TAB_STYLE(activeSubTab === 'records')}>
          <Award size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Issued Certificates ({certificates.length})
        </button>
      </div>

      {loading ? <TableSkeleton rows={4} cols={5} /> : (
        <>
          {/* Templates Tab */}
          {activeSubTab === 'templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2">
                {templates.map(t => (
                  <div key={t.id} className="card" style={{
                    borderLeft: `4px solid ${t.primaryColor || '#2563eb'}`,
                    display: 'flex', flexDirection: 'column', gap: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{t.name}</h4>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className="badge badge-purple">{t.templateType?.replace('_', ' ')}</span>
                          <span className={`badge ${t.status === 'PUBLISHED' ? 'badge-success' : 'badge-neutral'}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setForm({ ...t }); setEditTemplate(t) }}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 4 }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDuplicate(t.id)}
                          style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', padding: 4 }}>
                          <Copy size={14} />
                        </button>
                        <button onClick={() => handleDelete(t.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#475569' }}>
                      <span>College: {t.collegeName || '—'}</span>
                      <span>Font: {t.fontFamily || 'Default'}</span>
                      <span>Signatory 1: {t.signatoryName || '—'}</span>
                      <span>Signatory 2: {t.signatory2Name || '—'}</span>
                    </div>
                    {/* Color Swatches */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 4, background: t.primaryColor, border: '1px solid #e2e8f0', display: 'inline-block' }} />
                      <span style={{ width: 18, height: 18, borderRadius: 4, background: t.secondaryColor, border: '1px solid #e2e8f0', display: 'inline-block' }} />
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{t.primaryColor} / {t.secondaryColor}</span>
                    </div>
                    {t.status !== 'PUBLISHED' && (
                      <button onClick={() => handlePublish(t.id)} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                        <CheckCircle size={12} /> Publish Template
                      </button>
                    )}
                  </div>
                ))}
                {templates.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    <FileText size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>No templates yet. Create your first certificate template.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Records Tab */}
          {activeSubTab === 'records' && (
            <div className="table-container">
              <table className="data-table">
                <thead><tr>
                  <th>Certificate ID</th><th>Student</th><th>Event</th>
                  <th>Type</th><th>Status</th><th>Issued</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {certificates.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.certificateId}</td>
                      <td>
                        <strong>{c.studentName}</strong><br />
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{c.rollNumber}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>{c.eventName}</td>
                      <td><span className="badge badge-purple">{c.certificateType?.replace('_', ' ')}</span></td>
                      <td>
                        <span className={`badge ${c.status === 'VALID' ? 'badge-success' : 'badge-danger'}`}>
                          {c.status}
                        </span>
                        {c.status === 'REVOKED' && (
                          <p style={{ fontSize: 10, color: '#dc2626', margin: '2px 0 0' }}>{c.revocationReason}</p>
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: '#64748b' }}>{formatDate(c.generatedAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <a href={`/api/certificates/${c.certificateId}/download`} target="_blank" rel="noreferrer"
                            className="btn btn-ghost btn-sm"><Download size={12} /> PDF</a>
                          {c.status === 'VALID' && (
                            <button onClick={() => handleRevoke(c.id)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {certificates.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                      No certificates issued yet.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Template Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Certificate Template" size="lg">
        <TemplateForm onSubmit={handleCreate} title="Create Template" />
      </Modal>

      {/* Edit Template Modal */}
      <Modal isOpen={Boolean(editTemplate)} onClose={() => setEditTemplate(null)} title="Edit Certificate Template" size="lg">
        <TemplateForm onSubmit={handleUpdate} title="Update Template" />
      </Modal>
    </div>
  )
}

// =========================================================================
// 9. Audit Logs Panel
// =========================================================================

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
  { path: 'certificates', label: 'Certificates', icon: FileText },
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
        <Route path="certificates" element={<CertificatesPanel />} />
        <Route path="announcements" element={<AnnouncementsPanel />} />
        <Route path="audit_logs" element={<AuditLogsPanel />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
