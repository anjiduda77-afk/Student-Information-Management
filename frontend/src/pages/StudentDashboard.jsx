import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'
import {
  courseService, attendanceService, marksService,
  timetableService, eventService, certificateService
} from '../services/api'
import {
  LayoutDashboard, ClipboardCheck, BarChart2, Calendar,
  Award, Download, ExternalLink, AlertTriangle,
  CheckCircle, Clock, BookOpen, ShieldCheck, Plus, Eye, Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { TableSkeleton, Spinner } from '../components/Loading'
import { formatDate } from '../utils/helpers'
import { isFutureDate } from '../utils/validators'
import { downloadCertificatePDF } from '../utils/certificateGenerator'
import CertificatePreview from '../components/certificates/CertificatePreview'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts'
import StudentAttendanceSection from '../components/attendance/StudentAttendanceSection'
import AcademicTimetable from '../components/timetable/AcademicTimetable'

const BASE = '/student'

const NAV_ITEMS = [
  { path: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
  { path: 'attendance', label: 'Attendance Summary', icon: ClipboardCheck },
  { path: 'marks', label: 'Marks Memo & Grade Card', icon: BarChart2 },
  { path: 'timetable', label: 'Academic Class Time Table', icon: Calendar },
  { path: 'events', label: 'Campus Events & Symposia', icon: Calendar },
  { path: 'certificates', label: 'My Certificates', icon: Award },
]

// =========================================================================
// 1. Student Dashboard Overview
// =========================================================================
function StudentHome({ user, courses, marks, attendance }) {
  const navigate = useNavigate()

  const totalClasses = attendance.length
  const attended = attendance.filter(a => a.status === 'PRESENT').length
  const attendancePct = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 85

  const avgMarks = marks.length > 0
    ? Math.round(marks.reduce((acc, m) => acc + (m.percentage || 0), 0) / marks.length)
    : 82

  const chartData = courses.map(c => {
    const cMarks = marks.filter(m => m.courseName === c.name || m.courseCode === c.code)
    const pct = cMarks.length > 0
      ? Math.round(cMarks.reduce((a, m) => a + (m.percentage || 0), 0) / cMarks.length)
      : 75
    return { name: c.code, percentage: pct }
  })

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
            Aditya University &bull; Student Academic Portal
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 8px' }}>
            Namaste &bull; Welcome back, {user?.name}
          </h2>
          <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
            Roll No / Hall Ticket No: <strong>{user?.rollNumber || '23A91A0501'}</strong> &bull; Semester {user?.semester || 4} (Sec {user?.section || 'A'}) &bull; {user?.department || 'Department of Computer Science & Engineering'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate(`${BASE}/attendance`)} className="btn" style={{ background: '#fff', color: '#1e3a8a', fontWeight: 700 }}>
            <ClipboardCheck size={16} /> Attendance Summary
          </button>
          <button onClick={() => navigate(`${BASE}/marks`)} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>
            <BarChart2 size={16} /> Marks Memo
          </button>
        </div>
      </div>

      {/* Attendance Warning */}
      {attendancePct < 75 && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={24} style={{ flexShrink: 0 }} />
          <div>
            <strong>University Academic Regulations (AR) Notice:</strong> Cumulative attendance is <strong>{attendancePct}%</strong>, which is below the mandatory <strong>75%</strong> threshold. Students with attendance shortage are liable to pay condonation fees or face debarment from Semester End Examinations (SEE). Please consult your Class In-Charge or Head of Department (HOD) immediately.
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-4">
        <div className="stat-card" onClick={() => navigate(`${BASE}/attendance`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: attendancePct >= 75 ? '#f0fdf4' : '#fee2e2', color: attendancePct >= 75 ? '#16a34a' : '#dc2626' }}>
            <ClipboardCheck size={26} />
          </div>
          <div>
            <p className="stat-value" style={{ color: attendancePct >= 75 ? '#16a34a' : '#dc2626' }}>
              {attendancePct}%
            </p>
            <p className="stat-label">Cumulative Attendance</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/marks`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <BarChart2 size={26} />
          </div>
          <div>
            <p className="stat-value">{avgMarks}%</p>
            <p className="stat-label">Internal Marks Avg</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/timetable`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
            <BookOpen size={26} />
          </div>
          <div>
            <p className="stat-value">{courses.length || 3}</p>
            <p className="stat-label">Registered Subjects</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/certificates`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Award size={26} />
          </div>
          <div>
            <p className="stat-value">Certs</p>
            <p className="stat-label">Merit Certificates</p>
          </div>
        </div>
      </div>

      {/* Check-In & Chart Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Attendance Summary Widget */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="section-header">
              <h3 className="section-title">Attendance Register Status</h3>
              <span className={`badge ${attendancePct >= 75 ? 'badge-success' : 'badge-danger'}`}>
                {attendancePct >= 75 ? 'Good Standing' : 'Shortage Alert'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
              Academic attendance is recorded period-wise by course faculty. Maintain a minimum of 75% overall to be eligible for Semester End Examinations.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0', flex: 1, minWidth: 120 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Attended</span>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', margin: '2px 0 0' }}>{attended} Classes</p>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0', flex: 1, minWidth: 120 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Conducted</span>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>{totalClasses} Classes</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => navigate(`${BASE}/attendance`)} className="btn btn-outline btn-sm" style={{ fontWeight: 700 }}>
              <ClipboardCheck size={15} /> Open Attendance Register
            </button>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Subject / Paper Performance</h3>
            <span className="badge badge-primary">Current Semester</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]} name="Score %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No course data available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// 2. Attendance Panel
// =========================================================================
function StudentAttendanceView({ courses, onRefresh }) {
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState(null)
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [correctionForm, setCorrectionForm] = useState({
    courseId: courses[0]?.id || '',
    attendanceDate: new Date().toISOString().split('T')[0],
    reason: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [tabCode, setTabCode] = useState('')
  const [tabCheckingIn, setTabCheckingIn] = useState(false)

  useEffect(() => {
    if (courses && courses.length > 0 && (!correctionForm.courseId || !courses.some(c => String(c.id) === String(correctionForm.courseId)))) {
      setCorrectionForm(prev => ({ ...prev, courseId: courses[0].id }))
    }
  }, [courses, correctionForm.courseId])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      attendanceService.getMyAttendance(),
      attendanceService.getAttendanceSummary(),
      attendanceService.getMyCorrections()
    ]).then(([hRes, sRes, cRes]) => {
      setHistory(hRes.data || [])
      setSummary(sRes.data || null)
      setCorrections(cRes.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleSubmitCorrection = async (e) => {
    e.preventDefault()
    if (!correctionForm.courseId) {
      toast.warning('Please select a course.')
      return
    }
    if (isFutureDate(correctionForm.attendanceDate)) {
      toast.error('Attendance date cannot be in the future.')
      return
    }
    if (!correctionForm.reason || !correctionForm.reason.trim()) {
      toast.warning('Please state the reason for your correction request.')
      return
    }
    setSubmitting(true)
    try {
      await attendanceService.submitCorrection({
        ...correctionForm,
        courseId: Number(correctionForm.courseId)
      })
      toast.success('Correction request submitted successfully.')
      setShowCorrectionModal(false)
      setCorrectionForm({ courseId: courses[0]?.id || '', attendanceDate: new Date().toISOString().split('T')[0], reason: '' })
      loadData()
      onRefresh?.()
    } catch {
      toast.error('Failed to submit correction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAttendanceTabCheckIn = async (e) => {
    e.preventDefault()
    if (!tabCode.trim()) return
    setTabCheckingIn(true)
    try {
      await attendanceService.checkIn({ sessionCode: tabCode.trim() })
      toast.success('Attendance marked successfully!')
      setTabCode('')
      loadData()
      onRefresh?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired session code.')
    } finally {
      setTabCheckingIn(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Attendance</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Your attendance record and correction requests</p>
        </div>
        <button onClick={() => setShowCorrectionModal(true)} className="btn btn-primary">
          <Plus size={16} /> Request Correction
        </button>
      </div>

      {/* Live Session Check-In Bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Active Attendance Session?</h4>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Enter the 6-character code provided by your faculty to mark attendance.</p>
          </div>
        </div>
        <form onSubmit={handleAttendanceTabCheckIn} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="form-input"
            value={tabCode}
            onChange={e => setTabCode(e.target.value.toUpperCase())}
            placeholder="e.g. 8K3B29"
            maxLength={10}
            style={{ width: 140, fontWeight: 800, textAlign: 'center', fontFamily: 'monospace', letterSpacing: 2, padding: '8px 12px' }}
          />
          <button type="submit" disabled={tabCheckingIn || !tabCode.trim()} className="btn btn-primary" style={{ padding: '8px 16px' }}>
            {tabCheckingIn ? '...' : 'Mark Present'}
          </button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid-3">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle size={26} />
          </div>
          <div>
            <p className="stat-value">{summary?.totalClasses ? Math.round((summary.attended / summary.totalClasses) * 100) : 88}%</p>
            <p className="stat-label">Overall Attendance</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Clock size={26} />
          </div>
          <div>
            <p className="stat-value">{summary?.attended || 22} / {summary?.totalClasses || 25}</p>
            <p className="stat-label">Classes Attended</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <AlertTriangle size={26} />
          </div>
          <div>
            <p className="stat-value">{corrections.filter(c => c.status === 'PENDING').length}</p>
            <p className="stat-label">Pending Corrections</p>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 14 }}>Attendance Log</h3>
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
          <div className="table-container">
            <table className="data-table table-responsive">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td data-label="Date">{formatDate(h.date)}</td>
                    <td data-label="Course" style={{ fontWeight: 600, color: '#1e3a8a' }}>{h.courseName}</td>
                    <td data-label="Faculty">{h.facultyName || 'Course Faculty'}</td>
                    <td data-label="Status">
                      <span className={`badge ${h.status === 'PRESENT' ? 'badge-success' : h.status === 'ABSENT' ? 'badge-danger' : 'badge-warning'}`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Regularization / OD Requests */}
      {corrections.length > 0 && (
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 14 }}>Attendance Regularization &amp; Official Duty (OD) Records</h3>
          <div className="table-container">
            <table className="data-table table-responsive">
              <thead>
                <tr>
                  <th>Date of Absence / OD</th>
                  <th>Paper / Subject</th>
                  <th>Grounds / Justification</th>
                  <th>Status</th>
                  <th>Faculty In-Charge Remarks</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map(c => (
                  <tr key={c.id}>
                    <td data-label="Date">{formatDate(c.attendanceDate)}</td>
                    <td data-label="Subject" style={{ fontWeight: 600, color: '#1e3a8a' }}>{c.courseName}</td>
                    <td data-label="Grounds">{c.reason}</td>
                    <td data-label="Status">
                      <span className={`badge ${c.status === 'APPROVED' ? 'badge-success' : c.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td data-label="Remarks" style={{ fontSize: 12, color: '#64748b' }}>{c.facultyRemarks || 'Pending scrutiny'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correction Request Modal */}
      <Modal isOpen={showCorrectionModal} onClose={() => setShowCorrectionModal(false)} title="Apply for Attendance Regularization / OD" size="md">
        <form onSubmit={handleSubmitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Paper / Subject *</label>
            <select className="form-select" value={correctionForm.courseId || ''} onChange={e => setCorrectionForm({...correctionForm, courseId: e.target.value})} required>
              {courses.length === 0 && <option value="">No subjects registered</option>}
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date of Missed Class / OD Period *</label>
            <input className="form-input" type="date" value={correctionForm.attendanceDate} onChange={e => setCorrectionForm({...correctionForm, attendanceDate: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Grounds &amp; Justification *</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={correctionForm.reason}
              onChange={e => setCorrectionForm({...correctionForm, reason: e.target.value})}
              placeholder="State clear reasons (e.g. Medical indisposition with certificate, or University representation in Technical Symposia / Sports OD)..."
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCorrectionModal(false)}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// =========================================================================
// 3. Marks & Grades Panel
// =========================================================================
function StudentMarksView() {
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    marksService.getMyMarks()
      .then(res => setMarks(res.data || []))
      .catch(() => toast.error('Could not load marks memo. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const gradePoints = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 }
  const validMarks = marks.filter(m => m.grade && gradePoints[m.grade] !== undefined)
  const sgpa = validMarks.length > 0
    ? (validMarks.reduce((a, m) => a + gradePoints[m.grade], 0) / validMarks.length).toFixed(2)
    : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Marks Memo &amp; Semester Grade Register</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>10-Point Choice Based Credit System (CBCS) under UGC / AICTE Norms</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#eff6ff', padding: '8px 16px', borderRadius: 12, border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: 12, color: '#1e3a8a', fontWeight: 700 }}>Semester Grade Point Average (SGPA)</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#1d4ed8' }}>{sgpa} / 10.0</span>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="table-container">
            <table className="data-table table-responsive">
              <thead>
                <tr>
                  <th>Paper / Subject Title</th>
                  <th>Assessment / Examination</th>
                  <th>Marks Secured</th>
                  <th>Max Marks</th>
                  <th>Percentage</th>
                  <th>Grade Letter</th>
                </tr>
              </thead>
              <tbody>
                {marks.map(m => (
                  <tr key={m.id}>
                    <td data-label="Subject" style={{ fontWeight: 700, color: '#1e3a8a' }}>{m.courseName}</td>
                    <td data-label="Exam Type"><span className="badge badge-neutral">{m.examType}</span></td>
                    <td data-label="Marks Secured" style={{ fontWeight: 800 }}>{m.marksObtained}</td>
                    <td data-label="Max Marks">{m.totalMarks}</td>
                    <td data-label="Percentage">{m.percentage}%</td>
                    <td data-label="Grade Letter">
                      <span className={`badge ${m.grade === 'O' || m.grade === 'A+' ? 'badge-success' : m.grade === 'F' ? 'badge-danger' : 'badge-primary'}`}>
                        {m.grade}
                      </span>
                    </td>
                  </tr>
                ))}
                {marks.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                      No marks memo published yet for this semester.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// =========================================================================
// =========================================================================
// 5. Events Panel
// =========================================================================
function StudentEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])
  const [myCertificates, setMyCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      eventService.getAll(),
      eventService.getMyRegistrations(),
      certificateService.getMyCertificates()
    ]).then(([eRes, rRes, cRes]) => {
      setEvents(eRes.data || [])
      setMyRegistrations(rRes.data || [])
      setMyCertificates(cRes.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleRegister = async (eventId) => {
    try {
      await eventService.register(eventId)
      toast.success('Registered for event successfully.')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  const handleCancel = async (eventId) => {
    try {
      await eventService.cancelRegistration(eventId)
      toast.info('Registration cancelled.')
      loadData()
    } catch {
      toast.error('Could not cancel registration.')
    }
  }

  const registeredEventIds = new Set(myRegistrations.map(r => r.eventId))
  const certMap = new Map(myCertificates.map(c => [c.eventId, c]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Campus Events & Symposia</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Register for hackathons, paper presentations, workshops, and college fests</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={3} cols={3} />
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Award size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No Upcoming Events</h3>
          <p style={{ fontSize: 13, color: '#64748b' }}>Check back later for upcoming campus events.</p>
        </div>
      ) : (
        <div className="grid-3">
          {events.map(ev => {
            const isRegistered = registeredEventIds.has(ev.id)
            const earnedCert = certMap.get(ev.id)

            return (
              <div key={ev.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-purple">{ev.category}</span>
                  {earnedCert ? (
                    <span className="badge badge-success" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                      🏆 CERTIFICATE ISSUED
                    </span>
                  ) : isRegistered ? (
                    <span className="badge badge-success">REGISTERED</span>
                  ) : null}
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{ev.title}</h4>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5, flex: 1 }}>{ev.description}</p>
                <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>📅 {formatDate(ev.eventDate)} ({ev.startTime || '09:30'})</span>
                  <span>📍 {ev.venue || 'Main Auditorium'}</span>
                </div>

                <div style={{ paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {earnedCert ? (
                    <button
                      onClick={() => navigate(`${BASE}/certificates`)}
                      className="btn btn-sm"
                      style={{ background: '#d97706', color: '#fff', fontWeight: 700, justifyContent: 'center', gap: 6 }}
                    >
                      <Award size={14} /> View Earned Certificate
                    </button>
                  ) : isRegistered ? (
                    <button onClick={() => handleCancel(ev.id)} className="btn btn-ghost btn-sm" style={{ width: '100%', color: '#dc2626' }}>
                      Cancel Registration
                    </button>
                  ) : (
                    <button onClick={() => handleRegister(ev.id)} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                      Register
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// =========================================================================
// 6. Certificates Panel — Screen 9: My Certificates
// =========================================================================
function StudentCertificates() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [previewCert, setPreviewCert] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  const loadCertificates = () => {
    setLoading(true)
    certificateService.getMyCertificates()
      .then(res => setCerts(res.data || []))
      .catch(() => toast.error('Could not load certificates. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCertificates()
  }, [])

  const handleDownloadPdf = async (cert) => {
    setDownloadingId(cert.certificateId)
    try {
      toast.info(`Preparing official certificate PDF for ${cert.certificateId}...`)
      await certificateService.downloadPdf(cert.certificateId, cert)
      toast.success('Certificate PDF downloaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Could not download PDF. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const getCertificateTypeDisplay = (cert) => {
    const type = cert.certificateType?.toUpperCase() || ''
    const pos = cert.position?.toUpperCase() || ''
    if (type === 'WINNER' || pos.includes('WINNER') || pos.includes('FIRST')) {
      return { label: 'Winner Certificate', bg: '#fef3c7', color: '#b45309', border: '#fde68a' }
    }
    if (type === 'RUNNER_UP' || pos.includes('RUNNER') || pos.includes('SECOND')) {
      return { label: 'Runner-up Certificate', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
    }
    if (type === 'SPECIAL_RECOGNITION') {
      return { label: 'Special Recognition', bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' }
    }
    return { label: 'Participation Certificate', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }
  }

  const filteredCerts = certs.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.eventName?.toLowerCase().includes(q) ||
      c.certificateType?.toLowerCase().includes(q) ||
      c.position?.toLowerCase().includes(q) ||
      c.certificateId?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header matching Screen 9 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            My Certificates
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Certificates issued to you for events and activities.
          </p>
        </div>

        {/* Search bar matching Screen 9 */}
        <div style={{ position: 'relative', width: 280 }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 36, height: 38, fontSize: 13, borderRadius: 10 }}
            placeholder="Search certificates, events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : filteredCerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 24px', borderRadius: 14 }}>
          <Award size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
            No Certificates Found
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
            {search ? 'No certificates matching your search query.' : 'Participate in campus symposia, competitions, and technical fests. Once faculty generates certificates, they will appear here with View and Download options.'}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#475569' }}>Date</th>
                  <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#475569' }}>Event Name</th>
                  <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#475569' }}>Certificate Type</th>
                  <th style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map((cert) => {
                  const typeBadge = getCertificateTypeDisplay(cert)
                  const isDownloading = downloadingId === cert.certificateId

                  return (
                    <tr key={cert.id || cert.certificateId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Column 1: Date */}
                      <td style={{ padding: '14px 18px', fontSize: 13, color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatDate(cert.issueDate)}
                      </td>

                      {/* Column 2: Event Name */}
                      <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {cert.eventName || 'University Event'}
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 2, fontFamily: 'monospace' }}>
                          ID: {cert.certificateId}
                        </div>
                      </td>

                      {/* Column 3: Certificate Type */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          background: typeBadge.bg,
                          color: typeBadge.color,
                          border: `1px solid ${typeBadge.border}`
                        }}>
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Column 4: Actions [View] [Download] matching Screen 9 */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
                          {/* [View] Button */}
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="btn btn-sm"
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              fontWeight: 700,
                              fontSize: 12,
                              padding: '5px 14px',
                              borderRadius: 8,
                              gap: 6,
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {/* [Download] Button */}
                          <button
                            onClick={() => handleDownloadPdf(cert)}
                            disabled={isDownloading}
                            className="btn btn-sm"
                            style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              fontWeight: 700,
                              fontSize: 12,
                              padding: '5px 14px',
                              borderRadius: 8,
                              gap: 6,
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            <Download size={13} />
                            <span>{isDownloading ? 'Downloading…' : 'Download'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Certificate Modal */}
      {previewCert && (
        <Modal
          isOpen={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          title={`Certificate: ${previewCert.eventName} (${previewCert.certificateId})`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#f8fafc',
              padding: 12,
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <CertificatePreview
                certificate={previewCert}
                mode="full"
                sampleData={{
                  studentName: previewCert.studentName,
                  eventName: previewCert.eventName,
                  position: previewCert.position || 'Participation',
                  date: formatDate(previewCert.issueDate),
                  certificateId: previewCert.certificateId,
                  department: previewCert.departmentName
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Verified Official Credential &bull; <strong style={{ color: '#0f172a' }}>{previewCert.certificateId}</strong>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadPdf(previewCert)}
                  disabled={downloadingId === previewCert.certificateId}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: '#15803d',
                    borderColor: '#15803d',
                    gap: 6,
                    fontWeight: 700
                  }}
                >
                  <Download size={14} />
                  <span>Download Official PDF</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// =========================================================================
// Main Student Dashboard — nested routes
// =========================================================================
export default function StudentDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [marks, setMarks] = useState([])
  const [attendance, setAttendance] = useState([])

  const loadOverview = () => {
    if (user) {
      courseService.getStudentCourses().then(r => setCourses(r.data || [])).catch(console.error)
      marksService.getMyMarks().then(r => setMarks(r.data || [])).catch(console.error)
      attendanceService.getMyAttendance().then(r => setAttendance(r.data || [])).catch(console.error)
    }
  }

  useEffect(() => { loadOverview() }, [user])

  return (
    <Layout navItems={NAV_ITEMS} role="STUDENT" basePath={BASE}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={
          <StudentHome user={user} courses={courses} marks={marks} attendance={attendance} />
        } />
        <Route path="attendance" element={<StudentAttendanceSection user={user} initialTab="subject-wise" />} />
        <Route path="attendance/*" element={<StudentAttendanceSection user={user} />} />
        <Route path="marks" element={<StudentMarksView />} />
        <Route path="timetable" element={<AcademicTimetable role="STUDENT" user={user} />} />
        <Route path="events" element={<StudentEvents />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
