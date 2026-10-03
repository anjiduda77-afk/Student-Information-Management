import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'
import {
  courseService, attendanceService, marksService,
  timetableService, eventService, certificateService, adminService
} from '../services/api'
import {
  LayoutDashboard, BookOpen, ClipboardCheck, BarChart2,
  Calendar, Award, Plus, CheckCircle, XCircle, Clock,
  Users, Check, X, AlertCircle, RefreshCw, QrCode
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { TableSkeleton, Spinner } from '../components/Loading'
import { formatDate } from '../utils/helpers'
import { isFutureDate, isValidMarks, validateEventForm } from '../utils/validators'

const BASE = '/faculty'

const NAV_ITEMS = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { path: 'marks', label: 'Marks', icon: BarChart2 },
  { path: 'timetable', label: 'Timetable', icon: Calendar },
  { path: 'events', label: 'Events', icon: Award },
]

// =========================================================================
// 1. Faculty Dashboard Overview
// =========================================================================
function FacultyHome({ courses, pendingCorrectionsCount }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.85 }}>
            Faculty Portal
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 8px' }}>
            Welcome, {user?.name}
          </h2>
          <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
            {user?.designation || 'Faculty Member'} &bull; Department of {user?.department || 'Engineering'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate(`${BASE}/attendance`)} className="btn" style={{ background: '#fff', color: '#0f766e', fontWeight: 700 }}>
            <ClipboardCheck size={16} /> Mark Attendance
          </button>
          <button onClick={() => navigate(`${BASE}/marks`)} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            <BarChart2 size={16} /> Update Marks
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-3">
        <div className="stat-card" onClick={() => navigate(`${BASE}/timetable`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <BookOpen size={26} />
          </div>
          <div>
            <p className="stat-value">{courses.length}</p>
            <p className="stat-label">Assigned Courses</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/attendance`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={26} />
          </div>
          <div>
            <p className="stat-value">{pendingCorrectionsCount}</p>
            <p className="stat-label">Pending Corrections</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/timetable`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={26} />
          </div>
          <div>
            <p className="stat-value">Active</p>
            <p className="stat-label">Weekly Timetable</p>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div>
        <h3 className="section-title" style={{ marginBottom: 16 }}>My Courses</h3>
        <div className="grid-3">
          {courses.map(c => (
            <div key={c.id} className="card card-hover" style={{ borderLeft: '4px solid #0f766e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="badge badge-purple">{c.code}</span>
                <span className="badge badge-neutral">{c.credits} Credits</span>
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{c.name}</h4>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>{c.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <span>Semester {c.semester}</span>
                <span style={{ color: '#0f766e', fontWeight: 600 }}>{c.studentCount || 0} Students</span>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No courses assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// 2. Attendance Panel
// =========================================================================
function AttendancePanel({ courses, onCorrectionUpdate }) {
  const [activeSubTab, setActiveSubTab] = useState('live')
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '')
  const [section, setSection] = useState('A')

  useEffect(() => {
    if (courses && courses.length > 0) {
      if (!selectedCourse || !courses.some(c => String(c.id) === String(selectedCourse))) {
        setSelectedCourse(courses[0].id)
      }
    }
  }, [courses, selectedCourse])

  const [session, setSession] = useState(null)
  const [timeLeft, setTimeLeft] = useState(600)

  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [savingManual, setSavingManual] = useState(false)

  const [corrections, setCorrections] = useState([])
  const [loadingCorrections, setLoadingCorrections] = useState(false)

  const loadCorrections = async () => {
    setLoadingCorrections(true)
    try {
      const res = await attendanceService.getPendingCorrections()
      setCorrections(res.data || [])
      onCorrectionUpdate?.((res.data || []).length)
    } catch {
      // ignore
    } finally {
      setLoadingCorrections(false)
    }
  }

  useEffect(() => { loadCorrections() }, [])

  const handleStartSession = async () => {
    if (!selectedCourse) { toast.warning('Please select a course.'); return }
    try {
      const res = await attendanceService.startSession(selectedCourse, section, 'ONLINE_CODE')
      setSession(res.data)
      setTimeLeft(600)
      toast.success(`Session started! Code: ${res.data.sessionCode}`)
    } catch {
      toast.error('Failed to start session. Please try again.')
    }
  }

  const handleCloseSession = async () => {
    if (!session) return
    try {
      await attendanceService.closeSession(session.id)
      setSession(null)
      toast.success('Attendance session closed.')
    } catch {
      toast.error('Failed to close session.')
    }
  }

  useEffect(() => {
    if (!session || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleCloseSession(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [session, timeLeft])

  useEffect(() => {
    if (!selectedCourse || activeSubTab !== 'manual') return
    adminService.getStudents().then(res => {
      setStudents(res.data || [])
      const initial = {}
      res.data.forEach(s => { initial[s.id] = 'PRESENT' })
      setAttendanceMap(initial)
    })
  }, [selectedCourse, activeSubTab])

  const handleSaveManual = async () => {
    if (students.length === 0) return
    if (!selectedCourse) {
      toast.warning('Please select a course.')
      return
    }
    if (isFutureDate(manualDate)) {
      toast.error('Attendance date cannot be in the future.')
      return
    }
    setSavingManual(true)
    try {
      const records = students.map(s => ({ studentId: s.id, status: attendanceMap[s.id] || 'PRESENT' }))
      await attendanceService.markManual(selectedCourse, manualDate, records)
      toast.success('Attendance saved successfully.')
    } catch {
      toast.error('Failed to save attendance. Please try again.')
    } finally {
      setSavingManual(false)
    }
  }

  const handleReviewCorrection = async (id, approve) => {
    try {
      await attendanceService.reviewCorrection(id, approve, approve ? 'Approved by faculty' : 'Declined')
      toast.success(approve ? 'Correction approved. Student marked Present.' : 'Correction request rejected.')
      loadCorrections()
    } catch {
      toast.error('Failed to process correction.')
    }
  }

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <h2 className="section-title">Attendance</h2>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap' }}>
        {[
          { id: 'live', label: '⚡ Live Session' },
          { id: 'manual', label: '📋 Manual Entry' },
          { id: 'corrections', label: `📬 Corrections (${corrections.length})` },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => setActiveSubTab(st.id)}
            className={`btn ${activeSubTab === st.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 13 }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Live Session */}
      {activeSubTab === 'live' && (
        <div className="card">
          <div className="section-header">
            <div>
              <h3 className="section-title">Start Attendance Session</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Students enter the code from their dashboard to mark attendance.
              </p>
            </div>
          </div>

          {!session ? (
            <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-select" value={selectedCourse || ''} onChange={e => setSelectedCourse(e.target.value)}>
                  {courses.length === 0 && <option value="">No courses assigned</option>}
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input className="form-input" value={section} onChange={e => setSection(e.target.value)} />
              </div>
              <button onClick={handleStartSession} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <QrCode size={16} /> Start Session (10 min)
              </button>
            </div>
          ) : (
            <div style={{
              background: '#f0fdf4', borderRadius: 16, padding: 32, textAlign: 'center',
              border: '2px solid #86efac', maxWidth: 500, margin: '0 auto'
            }}>
              <span className="badge badge-success" style={{ marginBottom: 12 }}>SESSION ACTIVE</span>
              <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>Share this code with students:</p>
              <div style={{
                fontSize: 48, fontWeight: 900, letterSpacing: 8, color: '#1e3a8a',
                padding: '16px 24px', background: '#fff', borderRadius: 16, margin: '16px auto',
                width: 'fit-content', border: '2px dashed #3b82f6', fontFamily: 'monospace'
              }}>
                {session.sessionCode}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                Time remaining: <span style={{ color: '#dc2626' }}>{formatCountdown(timeLeft)}</span>
              </p>
              <button onClick={handleCloseSession} className="btn btn-danger" style={{ marginTop: 16 }}>
                End Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Attendance */}
      {activeSubTab === 'manual' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Course</label>
              <select className="form-select" value={selectedCourse || ''} onChange={e => setSelectedCourse(e.target.value)}>
                {courses.length === 0 && <option value="">No courses assigned</option>}
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ width: 180 }}>
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  const allP = {}
                  students.forEach(s => { allP[s.id] = 'PRESENT' })
                  setAttendanceMap(allP)
                  toast.info('All students marked Present.')
                }}
                className="btn btn-ghost"
              >
                Mark All Present
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th style={{ textAlign: 'center' }}>Present</th>
                  <th style={{ textAlign: 'center' }}>Absent</th>
                  <th style={{ textAlign: 'center' }}>Late</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.rollNumber || '—'}</td>
                    {['PRESENT', 'ABSENT', 'LATE'].map(st => (
                      <td key={st} style={{ textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={`att-${s.id}`}
                          checked={attendanceMap[s.id] === st}
                          onChange={() => setAttendanceMap(m => ({ ...m, [s.id]: st }))}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No students enrolled.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSaveManual} disabled={savingManual || students.length === 0} className="btn btn-primary">
              {savingManual ? 'Saving…' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {/* Corrections */}
      {activeSubTab === 'corrections' && (
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Student Correction Requests</h3>
            <button onClick={loadCorrections} className="btn btn-ghost btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingCorrections ? (
            <TableSkeleton rows={4} cols={5} />
          ) : (
            <div className="table-container">
              <table className="data-table table-responsive">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No.</th>
                    <th>Date</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map(c => (
                    <tr key={c.id}>
                      <td data-label="Student"><strong>{c.studentName}</strong></td>
                      <td data-label="Roll No.">{c.studentRollNumber || '—'}</td>
                      <td data-label="Date">{c.attendanceDate}</td>
                      <td data-label="Reason"><p style={{ margin: 0, fontSize: 13, color: '#334155' }}>{c.reason}</p></td>
                      <td data-label="Action" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button onClick={() => handleReviewCorrection(c.id, true)} className="btn btn-success btn-sm">
                            <Check size={14} /> Approve
                          </button>
                          <button onClick={() => handleReviewCorrection(c.id, false)} className="btn btn-danger btn-sm">
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {corrections.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                        No pending correction requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =========================================================================
// 3. Marks Panel
// =========================================================================
function MarksPanel({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '')
  const [examType, setExamType] = useState('MIDTERM')

  useEffect(() => {
    if (courses && courses.length > 0) {
      if (!selectedCourse || !courses.some(c => String(c.id) === String(selectedCourse))) {
        setSelectedCourse(courses[0].id)
      }
    }
  }, [courses, selectedCourse])
  const [totalMarks, setTotalMarks] = useState(100)
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState([])

  const loadData = () => {
    if (!selectedCourse) return
    adminService.getStudents().then(res => {
      setStudents(res.data || [])
      const init = {}
      res.data.forEach(s => { init[s.id] = '' })
      setScores(init)
    })
    marksService.getCourseMarks(selectedCourse).then(r => setHistory(r.data || []))
  }

  useEffect(() => { loadData() }, [selectedCourse])

  const handleSubmit = async () => {
    if (!totalMarks || Number(totalMarks) <= 0) {
      toast.warning('Maximum marks must be greater than 0.')
      return
    }

    const list = students
      .filter(s => scores[s.id] !== '')
      .map(s => ({
        studentId: s.id,
        courseId: Number(selectedCourse),
        examType,
        marksObtained: Number(scores[s.id]),
        totalMarks: Number(totalMarks)
      }))

    if (list.length === 0) { toast.warning('Please enter marks for at least one student.'); return }

    for (const item of list) {
      if (item.marksObtained < 0) {
        toast.error('Marks obtained cannot be negative.')
        return
      }
      if (item.marksObtained > Number(totalMarks)) {
        toast.error(`Marks obtained (${item.marksObtained}) cannot exceed maximum marks (${totalMarks}).`)
        return
      }
    }

    setSaving(true)
    try {
      await marksService.uploadBatch(selectedCourse, examType, totalMarks, list)
      toast.success('Marks published and students notified.')
      loadData()
    } catch {
      toast.error('Failed to publish marks. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <h2 className="section-title">Update Marks</h2>
      </div>

      <div className="card">
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Course</label>
            <select className="form-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Exam Type</label>
            <select className="form-select" value={examType} onChange={e => setExamType(e.target.value)}>
              <option value="MIDTERM">Mid-Term</option>
              <option value="FINAL">Semester End</option>
              <option value="INTERNAL">Internal Assessment</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="QUIZ">Quiz / Class Test</option>
              <option value="PRACTICAL">Lab Practical</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Maximum Marks</label>
            <input className="form-input" type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Marks (out of {totalMarks})</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const val = scores[s.id]
                let grade = '—'
                if (val !== '' && !isNaN(val)) {
                  const pct = (Number(val) / Number(totalMarks)) * 100
                  if (pct >= 90) grade = 'O'
                  else if (pct >= 80) grade = 'A+'
                  else if (pct >= 70) grade = 'A'
                  else if (pct >= 60) grade = 'B+'
                  else if (pct >= 50) grade = 'B'
                  else if (pct >= 40) grade = 'C'
                  else grade = 'F'
                }
                return (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.rollNumber || '—'}</td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        max={totalMarks}
                        value={scores[s.id]}
                        onChange={e => setScores({ ...scores, [s.id]: e.target.value })}
                        placeholder="0"
                        style={{ width: 100 }}
                      />
                    </td>
                    <td>
                      <span className={`badge ${grade === 'O' || grade === 'A+' || grade === 'A' ? 'badge-success' : grade === 'F' ? 'badge-danger' : 'badge-primary'}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : 'Publish Marks'}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card">
          <h4 className="section-title" style={{ marginBottom: 14 }}>Published Marks</h4>
          <div className="table-container">
            <table className="data-table table-responsive">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Exam Type</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td data-label="Student"><strong>{h.studentName}</strong></td>
                    <td data-label="Exam"><span className="badge badge-neutral">{h.examType}</span></td>
                    <td data-label="Marks">{h.marksObtained} / {h.totalMarks}</td>
                    <td data-label="Grade"><span className="badge badge-success">{h.grade}</span></td>
                    <td data-label="%">{h.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// =========================================================================
// 4. Timetable Panel
// =========================================================================
function FacultyTimetable() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState('Monday')

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  useEffect(() => {
    timetableService.getFacultyTimetable()
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
          <p style={{ fontSize: 13, color: '#64748b' }}>Weekly teaching schedule</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="card timetable-desktop">
        {loading ? <TableSkeleton rows={5} cols={5} /> : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Course</th>
                  <th>Room</th>
                  <th>Semester &amp; Section</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.dayOfWeek}</strong></td>
                    <td><span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{s.startTime} – {s.endTime}</span></td>
                    <td style={{ fontWeight: 600, color: '#1e3a8a' }}>{s.courseName}</td>
                    <td>{s.classroom}</td>
                    <td>Sem {s.semester} (Sec {s.section})</td>
                  </tr>
                ))}
                {schedule.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No timetable available.</td></tr>
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
            <button key={day} onClick={() => setSelectedDay(day)} className={`day-btn ${selectedDay === day ? 'day-btn-active' : ''}`}>
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {loading ? <TableSkeleton rows={3} cols={2} /> : daySchedule.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No classes on {selectedDay}.</div>
          ) : daySchedule.map(s => (
            <div key={s.id} className="card" style={{ padding: 16, borderLeft: '4px solid #0f766e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{s.startTime} – {s.endTime}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{s.classroom}</span>
              </div>
              <p style={{ fontWeight: 700, color: '#1e3a8a', margin: '0 0 4px' }}>{s.courseName}</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Sem {s.semester} | Section {s.section}</p>
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
function FacultyEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [resultForm, setResultForm] = useState({ studentId: '', position: 'FIRST', remarks: '' })

  const loadEvents = () => {
    setLoading(true)
    eventService.getAll()
      .then(res => setEvents(res.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadEvents() }, [])

  const openParticipants = async (ev) => {
    setSelectedEvent(ev)
    try {
      const res = await eventService.getParticipants(ev.id)
      setParticipants(res.data || [])
    } catch {
      toast.error('Failed to load participants.')
    }
  }

  const handleRecordResult = async (e) => {
    e.preventDefault()
    if (!resultForm.studentId) {
      toast.warning('Please select a student to award result.')
      return
    }
    try {
      await eventService.recordResult(selectedEvent.id, resultForm)
      toast.success('Result recorded and certificate generated.')
      setResultForm({ studentId: '', position: 'FIRST', remarks: '' })
      openParticipants(selectedEvent)
    } catch {
      toast.error('Failed to record result.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Events</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Manage events and issue certificates</p>
        </div>
      </div>

      {loading ? <TableSkeleton rows={3} cols={3} /> : (
        <div className="grid-3">
          {events.map(ev => (
            <div key={ev.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="badge badge-purple" style={{ alignSelf: 'flex-start' }}>{ev.category}</span>
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{ev.title}</h4>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, flex: 1 }}>{ev.description}</p>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                <span>📅 {formatDate(ev.eventDate)}</span> &bull; <span>👥 {ev.registeredCount || 0} registered</span>
              </div>
              <button onClick={() => openParticipants(ev)} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                Manage &amp; Issue Certificates
              </button>
            </div>
          ))}
          {events.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No events found.</p>
          )}
        </div>
      )}

      <Modal isOpen={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title={`${selectedEvent?.title} — Results & Certificates`} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <form onSubmit={handleRecordResult} style={{ background: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Record Result &amp; Generate Certificate</h4>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Student</label>
                <select className="form-select" value={resultForm.studentId} onChange={e => setResultForm({...resultForm, studentId: e.target.value})} required>
                  <option value="">Select Student</option>
                  {participants.map(p => <option key={p.studentId} value={p.studentId}>{p.studentName} ({p.studentRollNumber})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Position</label>
                <select className="form-select" value={resultForm.position} onChange={e => setResultForm({...resultForm, position: e.target.value})}>
                  <option value="FIRST">1st Place</option>
                  <option value="SECOND">2nd Place</option>
                  <option value="THIRD">3rd Place</option>
                  <option value="SPECIAL_MENTION">Special Mention</option>
                  <option value="PARTICIPANT">Participation</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input className="form-input" value={resultForm.remarks} onChange={e => setResultForm({...resultForm, remarks: e.target.value})} placeholder="e.g. Best Project" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Generate Certificate
            </button>
          </form>

          <div className="table-container">
            <table className="data-table table-responsive">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Status</th>
                  <th>Award</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id}>
                    <td data-label="Student"><strong>{p.studentName}</strong></td>
                    <td data-label="Roll No.">{p.studentRollNumber || '—'}</td>
                    <td data-label="Status"><span className="badge badge-success">{p.attendanceStatus || 'PRESENT'}</span></td>
                    <td data-label="Award"><span className="badge badge-warning">{p.position || 'Registered'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// =========================================================================
// Main Faculty Dashboard
// =========================================================================
export default function FacultyDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [pendingCorrectionsCount, setPendingCorrectionsCount] = useState(0)

  useEffect(() => {
    if (user) {
      courseService.getFacultyCourses().then(r => setCourses(r.data || [])).catch(console.error)
    }
  }, [user])

  const navItems = [
    ...NAV_ITEMS.map(item => {
      if (item.path === 'attendance' && pendingCorrectionsCount > 0) {
        return { ...item, badge: `${pendingCorrectionsCount}`, badgeColor: 'badge-warning' }
      }
      return item
    })
  ]

  return (
    <Layout navItems={navItems} role="FACULTY" basePath={BASE}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FacultyHome courses={courses} pendingCorrectionsCount={pendingCorrectionsCount} />} />
        <Route path="attendance" element={<AttendancePanel courses={courses} onCorrectionUpdate={setPendingCorrectionsCount} />} />
        <Route path="marks" element={<MarksPanel courses={courses} />} />
        <Route path="timetable" element={<FacultyTimetable />} />
        <Route path="events" element={<FacultyEvents />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
