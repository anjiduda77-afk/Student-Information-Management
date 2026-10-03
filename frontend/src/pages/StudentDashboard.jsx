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
  CheckCircle, Clock, BookOpen, ShieldCheck, Plus
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { TableSkeleton, Spinner } from '../components/Loading'
import { formatDate } from '../utils/helpers'
import { isFutureDate } from '../utils/validators'
import { downloadCertificatePDF } from '../utils/certificateGenerator'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts'

const BASE = '/student'

const NAV_ITEMS = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { path: 'marks', label: 'Marks & Grades', icon: BarChart2 },
  { path: 'timetable', label: 'Timetable', icon: Calendar },
  { path: 'events', label: 'Upcoming Events', icon: Award },
  { path: 'certificates', label: 'My Certificates', icon: ShieldCheck },
]

// =========================================================================
// 1. Student Dashboard Overview
// =========================================================================
function StudentHome({ user, courses, marks, attendance, onCheckInSuccess }) {
  const navigate = useNavigate()
  const [sessionCode, setSessionCode] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)

  const totalClasses = attendance.length
  const attended = attendance.filter(a => a.status === 'PRESENT').length
  const attendancePct = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 85

  const avgMarks = marks.length > 0
    ? Math.round(marks.reduce((acc, m) => acc + (m.percentage || 0), 0) / marks.length)
    : 82

  const handleQuickCheckIn = async (e) => {
    e.preventDefault()
    if (!sessionCode.trim()) return
    setCheckingIn(true)
    try {
      await attendanceService.checkIn({ sessionCode: sessionCode.trim() })
      toast.success('Attendance marked successfully!')
      setSessionCode('')
      onCheckInSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired session code.')
    } finally {
      setCheckingIn(false)
    }
  }

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
            Student Information Portal
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 8px' }}>
            Welcome back, {user?.name}
          </h2>
          <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
            Roll No: <strong>{user?.rollNumber || 'CSE2023001'}</strong> &bull; Sem {user?.semester || 4} (Sec {user?.section || 'A'}) &bull; {user?.department || 'Computer Science & Engineering'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate(`${BASE}/attendance`)} className="btn" style={{ background: '#fff', color: '#1e3a8a', fontWeight: 700 }}>
            <ClipboardCheck size={16} /> View Attendance
          </button>
          <button onClick={() => navigate(`${BASE}/marks`)} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            <BarChart2 size={16} /> Grade Sheet
          </button>
        </div>
      </div>

      {/* Attendance Warning */}
      {attendancePct < 75 && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={24} style={{ flexShrink: 0 }} />
          <div>
            <strong>Attendance Shortage:</strong> Your attendance is {attendancePct}%, which is below the required 75%. Please contact your faculty adviser.
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
            <p className="stat-label">Attendance</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/marks`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <BarChart2 size={26} />
          </div>
          <div>
            <p className="stat-value">{avgMarks}%</p>
            <p className="stat-label">Academic Average</p>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
            <BookOpen size={26} />
          </div>
          <div>
            <p className="stat-value">{courses.length || 3}</p>
            <p className="stat-label">Enrolled Courses</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/certificates`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Award size={26} />
          </div>
          <div>
            <p className="stat-value">Certs</p>
            <p className="stat-label">My Certificates</p>
          </div>
        </div>
      </div>

      {/* Check-In & Chart Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Attendance Check-In Widget */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="section-header">
              <h3 className="section-title">Quick Attendance Check-In</h3>
              <span className="badge badge-success">Live Session</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Enter the 6-digit session code shown by your faculty to mark your attendance.
            </p>
          </div>

          <form onSubmit={handleQuickCheckIn} style={{ marginTop: 20 }}>
            <div className="form-group">
              <label className="form-label">Session Code</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="form-input"
                  value={sessionCode}
                  onChange={e => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 748291"
                  maxLength={10}
                  style={{
                    fontSize: 20, fontWeight: 800, letterSpacing: 4,
                    textAlign: 'center', fontFamily: 'monospace'
                  }}
                  required
                />
                <button type="submit" disabled={checkingIn} className="btn btn-primary" style={{ padding: '0 20px', flexShrink: 0 }}>
                  {checkingIn ? <Spinner size={16} color="#fff" /> : 'Check In'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Performance Chart */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Course Performance</h3>
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

      {/* Correction Requests */}
      {corrections.length > 0 && (
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 14 }}>My Correction Requests</h3>
          <div className="table-container">
            <table className="data-table table-responsive">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Faculty Remarks</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map(c => (
                  <tr key={c.id}>
                    <td data-label="Date">{formatDate(c.attendanceDate)}</td>
                    <td data-label="Course">{c.courseName}</td>
                    <td data-label="Reason">{c.reason}</td>
                    <td data-label="Status">
                      <span className={`badge ${c.status === 'APPROVED' ? 'badge-success' : c.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td data-label="Remarks" style={{ fontSize: 12, color: '#64748b' }}>{c.facultyRemarks || 'Pending review'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correction Request Modal */}
      <Modal isOpen={showCorrectionModal} onClose={() => setShowCorrectionModal(false)} title="Request Attendance Correction" size="md">
        <form onSubmit={handleSubmitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Course</label>
            <select className="form-select" value={correctionForm.courseId || ''} onChange={e => setCorrectionForm({...correctionForm, courseId: e.target.value})} required>
              {courses.length === 0 && <option value="">No courses enrolled</option>}
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date of Missed Class</label>
            <input className="form-input" type="date" value={correctionForm.attendanceDate} onChange={e => setCorrectionForm({...correctionForm, attendanceDate: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={correctionForm.reason}
              onChange={e => setCorrectionForm({...correctionForm, reason: e.target.value})}
              placeholder="Provide a valid reason for the absence..."
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
      .catch(() => toast.error('Could not load marks. Please try again.'))
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
          <h2 className="section-title">Marks &amp; Grades</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>10-point CBCS grading system</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#eff6ff', padding: '8px 16px', borderRadius: 12, border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: 12, color: '#1e3a8a', fontWeight: 600 }}>SGPA</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1d4ed8' }}>{sgpa} / 10.0</span>
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
                  <th>Course</th>
                  <th>Exam Type</th>
                  <th>Marks</th>
                  <th>Max</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {marks.map(m => (
                  <tr key={m.id}>
                    <td data-label="Course" style={{ fontWeight: 600, color: '#1e3a8a' }}>{m.courseName}</td>
                    <td data-label="Exam Type"><span className="badge badge-neutral">{m.examType}</span></td>
                    <td data-label="Marks" style={{ fontWeight: 700 }}>{m.marksObtained}</td>
                    <td data-label="Max">{m.totalMarks}</td>
                    <td data-label="%">{m.percentage}%</td>
                    <td data-label="Grade">
                      <span className={`badge ${m.grade === 'O' || m.grade === 'A+' ? 'badge-success' : m.grade === 'F' ? 'badge-danger' : 'badge-primary'}`}>
                        {m.grade}
                      </span>
                    </td>
                  </tr>
                ))}
                {marks.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                      No marks published yet for this semester.
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
// 4. Timetable Panel
// =========================================================================
function StudentTimetable() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState('Monday')

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  useEffect(() => {
    timetableService.getMyTimetable()
      .then(res => setSchedule(res.data || []))
      .catch(() => toast.error('Could not load timetable. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const daySchedule = schedule.filter(s => s.dayOfWeek === selectedDay)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Timetable</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Weekly class schedule</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="card timetable-desktop">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.dayOfWeek}</strong></td>
                    <td><span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{s.startTime} – {s.endTime}</span></td>
                    <td style={{ fontWeight: 600, color: '#1e3a8a' }}>{s.courseName}</td>
                    <td>{s.facultyName || '—'}</td>
                    <td>{s.classroom}</td>
                  </tr>
                ))}
                {schedule.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                      No timetable available for your section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Day View */}
      <div className="timetable-mobile">
        <div className="day-selector">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`day-btn ${selectedDay === day ? 'day-btn-active' : ''}`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {loading ? <TableSkeleton rows={4} cols={2} /> : daySchedule.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
              No classes on {selectedDay}.
            </div>
          ) : daySchedule.map(s => (
            <div key={s.id} className="card" style={{ padding: 16, borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{s.startTime} – {s.endTime}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{s.classroom}</span>
              </div>
              <p style={{ fontWeight: 700, color: '#1e3a8a', margin: '0 0 4px' }}>{s.courseName}</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{s.facultyName || 'Faculty'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// 5. Events Panel
// =========================================================================
function StudentEvents() {
  const [events, setEvents] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      eventService.getAll(),
      eventService.getMyRegistrations()
    ]).then(([eRes, rRes]) => {
      setEvents(eRes.data || [])
      setMyRegistrations(rRes.data || [])
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Upcoming Events</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Register for campus events and competitions</p>
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
            return (
              <div key={ev.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-purple">{ev.category}</span>
                  {isRegistered && <span className="badge badge-success">REGISTERED</span>}
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{ev.title}</h4>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5, flex: 1 }}>{ev.description}</p>
                <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>📅 {formatDate(ev.eventDate)} ({ev.startTime || '09:30'})</span>
                  <span>📍 {ev.venue || 'Main Auditorium'}</span>
                </div>
                <div style={{ paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  {isRegistered ? (
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
// 6. Certificates Panel
// =========================================================================
function StudentCertificates() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    certificateService.getMyCertificates()
      .then(res => setCerts(res.data || []))
      .catch(() => toast.error('Could not load certificates. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">My Certificates</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Verified certificates issued by Aditya University</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : certs.length > 0 ? (
        <div className="grid-2">
          {certs.map(cert => (
            <div key={cert.id} className="card card-hover" style={{ border: '2px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} />
                </div>
                <span className="badge badge-success">VERIFIED</span>
              </div>

              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                {cert.eventName || 'Academic Certificate'}
              </h4>
              <p style={{ fontSize: 13, color: '#d97706', fontWeight: 700, margin: '0 0 10px' }}>
                {cert.position ? `${cert.position} Place` : 'Certificate of Participation'}
              </p>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 11, color: '#64748b', marginBottom: 16 }}>
                <div><strong>Certificate ID:</strong> {cert.certificateId}</div>
                <div><strong>Issue Date:</strong> {formatDate(cert.issueDate)}</div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => downloadCertificatePDF(cert)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Download size={14} /> Download
                </button>
                <a
                  href={`/verify/${cert.certificateId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                >
                  <ExternalLink size={14} /> Verify
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Award size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No Certificates Yet</h3>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 400, margin: '0 auto' }}>
            Participate in campus events to earn certificates.
          </p>
        </div>
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
          <StudentHome user={user} courses={courses} marks={marks} attendance={attendance} onCheckInSuccess={loadOverview} />
        } />
        <Route path="attendance" element={<StudentAttendanceView courses={courses} onRefresh={loadOverview} />} />
        <Route path="marks" element={<StudentMarksView />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="events" element={<StudentEvents />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
