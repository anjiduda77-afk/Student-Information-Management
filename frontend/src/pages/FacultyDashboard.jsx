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
  Users, Check, X, AlertCircle, RefreshCw, Download,
  ExternalLink, Eye, FileText, Sparkles, ShieldCheck,
  Trophy, Medal, AlertTriangle, Ban
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { TableSkeleton, Spinner } from '../components/Loading'
import { formatDate } from '../utils/helpers'
import FacultyAttendanceSection from '../components/attendance/FacultyAttendanceSection'
import AcademicTimetable from '../components/timetable/AcademicTimetable'
import CertificatePreview from '../components/certificates/CertificatePreview'

const BASE = '/faculty'

const NAV_ITEMS = [
  { path: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
  { path: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { path: 'marks', label: 'Internal Marks Entry', icon: BarChart2 },
  { path: 'timetable', label: 'Academic Class Time Table', icon: Calendar },
  { path: 'events', label: 'Campus Events & Symposia', icon: Award },
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
            Aditya University &bull; Faculty Academic Portal
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 8px' }}>
            Namaste &bull; Welcome, {user?.name}
          </h2>
          <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
            {user?.designation || 'Assistant Professor / Faculty Member'} &bull; Department of {user?.department || 'Computer Science & Engineering'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate(`${BASE}/attendance`)} className="btn" style={{ background: '#fff', color: '#0f766e', fontWeight: 700 }}>
            <ClipboardCheck size={16} /> Attendance Hub
          </button>
          <button onClick={() => navigate(`${BASE}/marks`)} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>
            <BarChart2 size={16} /> Enter Internal Marks
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
            <p className="stat-label">Allocated Subjects / Papers</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/attendance`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={26} />
          </div>
          <div>
            <p className="stat-value">{pendingCorrectionsCount}</p>
            <p className="stat-label">Regularization / OD Pending</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate(`${BASE}/timetable`)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={26} />
          </div>
          <div>
            <p className="stat-value">Active</p>
            <p className="stat-label">Academic Class Time Table</p>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Allocated Subjects &amp; Laboratory Papers</h3>
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
                <span style={{ color: '#0f766e', fontWeight: 600 }}>{c.studentCount || 0} Students on Roll</span>
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
// 2. Marks Panel
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
        <div>
          <h2 className="section-title">Internal Marks Entry &amp; Assessment Register</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>Upload evaluation marks (Mid-1, Mid-2, Practical Lab Internals, SEE) under 10-point CBCS regulations</p>
        </div>
      </div>

      <div className="card">
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Paper / Subject</label>
            <select className="form-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assessment / Exam Type</label>
            <select className="form-select" value={examType} onChange={e => setExamType(e.target.value)}>
              <option value="MIDTERM">Mid-Term Examination 1 (Mid-1)</option>
              <option value="INTERNAL">Mid-Term Examination 2 (Mid-2)</option>
              <option value="FINAL">Semester End Examination (SEE)</option>
              <option value="PRACTICAL">Lab Practical Internal Assessment</option>
              <option value="ASSIGNMENT">Continuous Evaluation / Assignment</option>
              <option value="QUIZ">Class Test / Technical Seminar</option>
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
                <th>Roll No. / Hall Ticket No.</th>
                <th>Marks Secured (out of {totalMarks})</th>
                <th>Grade Letter</th>
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
function FacultyEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState('ACTIVE') // 'ACTIVE' | 'COMPLETED'
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [eventCertificates, setEventCertificates] = useState([])
  const [templates, setTemplates] = useState([])
  const [activeTab, setActiveTab] = useState('participants') // 'participants' | 'results' | 'certificates'
  const [submitting, setSubmitting] = useState(false)

  // Screen 5: Result & Certificate Type mapping state
  // Map of studentId -> { position: 'WINNER'|'RUNNER_UP'|'PARTICIPANT'|'NO_CERTIFICATE', certificateType: 'WINNER'|'RUNNER_UP'|'PARTICIPATION'|'NO_CERTIFICATE', selected: boolean }
  const [participantResults, setParticipantResults] = useState({})

  // Screen 6: Template selection for batch issuance
  const [winnerTemplateId, setWinnerTemplateId] = useState('')
  const [runnerUpTemplateId, setRunnerUpTemplateId] = useState('')
  const [participantTemplateId, setParticipantTemplateId] = useState('')
  const [generateSelectedOnly, setGenerateSelectedOnly] = useState(true)
  const [batchIssuing, setBatchIssuing] = useState(false)

  // Certificate Preview & Download
  const [previewCert, setPreviewCert] = useState(null)
  const [downloadingCertId, setDownloadingCertId] = useState(null)

  const loadEvents = () => {
    setLoading(true)
    eventService.getAll()
      .then(res => setEvents(res.data || []))
      .catch(() => toast.error('Failed to load events'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadEvents() }, [])

  const loadEventCertificates = async (eventId) => {
    try {
      const res = await eventService.getEventCertificates(eventId)
      setEventCertificates(res.data || [])
    } catch {
      console.warn('Could not load event certificates.')
    }
  }

  const openEvent = async (ev, defaultTab = 'participants') => {
    setSelectedEvent(ev)
    setActiveTab(defaultTab)
    try {
      const [partRes, certRes, tmplRes] = await Promise.all([
        eventService.getParticipants(ev.id),
        eventService.getEventCertificates(ev.id).catch(() => ({ data: [] })),
        certificateService.getTemplates().catch(() => ({ data: [] }))
      ])

      const parts = partRes.data || []
      const certs = certRes.data || []
      const tmpls = tmplRes.data || []

      setParticipants(parts)
      setEventCertificates(certs)
      setTemplates(tmpls)

      // Set default templates for Winner, Runner-up, Participation
      const winTmpl = tmpls.find(t => t.templateType === 'WINNER') || tmpls[0]
      const runTmpl = tmpls.find(t => t.templateType === 'RUNNER_UP') || tmpls.find(t => t.templateType === 'WINNER') || tmpls[0]
      const partTmpl = tmpls.find(t => t.templateType === 'PARTICIPATION') || tmpls[0]

      if (winTmpl) setWinnerTemplateId(winTmpl.id)
      if (runTmpl) setRunnerUpTemplateId(runTmpl.id)
      if (partTmpl) setParticipantTemplateId(partTmpl.id)

      // Initialize Screen 5 participant results
      const initResults = {}
      parts.forEach(p => {
        let pos = 'PARTICIPANT'
        let cType = 'PARTICIPATION'
        if (p.resultPosition === 'WINNER') {
          pos = 'WINNER'
          cType = 'WINNER'
        } else if (p.resultPosition === 'RUNNER_UP' || p.resultPosition === 'SECOND_RUNNER_UP') {
          pos = 'RUNNER_UP'
          cType = 'RUNNER_UP'
        } else if (p.resultPosition === 'NO_CERTIFICATE') {
          pos = 'NO_CERTIFICATE'
          cType = 'NO_CERTIFICATE'
        }
        initResults[p.studentId] = {
          position: pos,
          certificateType: cType,
          selected: pos !== 'NO_CERTIFICATE'
        }
      })
      setParticipantResults(initResults)

    } catch {
      toast.error('Failed to load event details.')
    }
  }

  // Auto Mark All as Participant (Screen 5)
  const handleAutoMarkAllAsParticipant = () => {
    setParticipantResults(prev => {
      const next = { ...prev }
      participants.forEach(p => {
        const current = next[p.studentId]
        // If not already Winner or Runner-up, make Participant
        if (current?.position !== 'WINNER' && current?.position !== 'RUNNER_UP') {
          next[p.studentId] = {
            position: 'PARTICIPANT',
            certificateType: 'PARTICIPATION',
            selected: true
          }
        }
      })
      return next
    })
    toast.success('Auto-marked attendees as Participant!')
  }

  // Clear All Results (Screen 5)
  const handleClearAll = () => {
    setParticipantResults(prev => {
      const next = { ...prev }
      participants.forEach(p => {
        next[p.studentId] = {
          position: 'NO_CERTIFICATE',
          certificateType: 'NO_CERTIFICATE',
          selected: false
        }
      })
      return next
    })
    toast.info('Cleared all results & certificate types.')
  }

  // Handle position change with strict rule: Only 1 Winner and 1 Runner-up! (Screen 5)
  const handlePositionChange = (studentId, newPosition) => {
    setParticipantResults(prev => {
      const next = { ...prev }

      // Rule: Only 1 Winner!
      if (newPosition === 'WINNER') {
        Object.keys(next).forEach(sid => {
          if (sid !== String(studentId) && next[sid]?.position === 'WINNER') {
            next[sid] = {
              position: 'PARTICIPANT',
              certificateType: 'PARTICIPATION',
              selected: true
            }
            toast.info('Previous Winner changed to Participant (Only 1 Winner allowed).')
          }
        })
      }

      // Rule: Only 1 Runner-up!
      if (newPosition === 'RUNNER_UP') {
        Object.keys(next).forEach(sid => {
          if (sid !== String(studentId) && next[sid]?.position === 'RUNNER_UP') {
            next[sid] = {
              position: 'PARTICIPANT',
              certificateType: 'PARTICIPATION',
              selected: true
            }
            toast.info('Previous Runner-up changed to Participant (Only 1 Runner-up allowed).')
          }
        })
      }

      let cType = 'PARTICIPATION'
      let isSel = true
      if (newPosition === 'WINNER') cType = 'WINNER'
      else if (newPosition === 'RUNNER_UP') cType = 'RUNNER_UP'
      else if (newPosition === 'NO_CERTIFICATE') {
        cType = 'NO_CERTIFICATE'
        isSel = false
      }

      next[studentId] = {
        position: newPosition,
        certificateType: cType,
        selected: isSel
      }

      return next
    })
  }

  // Toggle selection checkbox for student
  const handleToggleSelect = (studentId) => {
    setParticipantResults(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        selected: !prev[studentId]?.selected
      }
    }))
  }

  // Toggle Select All checkbox
  const allSelected = participants.length > 0 && participants.every(p => participantResults[p.studentId]?.selected)
  const handleToggleSelectAll = () => {
    const target = !allSelected
    setParticipantResults(prev => {
      const next = { ...prev }
      participants.forEach(p => {
        if (next[p.studentId]) {
          next[p.studentId] = { ...next[p.studentId], selected: target }
        }
      })
      return next
    })
  }

  // Save Results to Backend (Screen 5)
  const handleSaveResults = async () => {
    if (!selectedEvent) return
    setSubmitting(true)
    try {
      let savedCount = 0
      for (const p of participants) {
        const item = participantResults[p.studentId]
        if (item && item.position) {
          await eventService.updateResult(selectedEvent.id, p.studentId, {
            position: item.position,
            score: item.position === 'WINNER' ? 100 : item.position === 'RUNNER_UP' ? 90 : 75
          })
          savedCount++
        }
      }
      toast.success(`Successfully saved results for ${savedCount} participants!`)
      const res = await eventService.getParticipants(selectedEvent.id)
      setParticipants(res.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save results.')
    } finally {
      setSubmitting(false)
    }
  }

  // Batch Certificate Generation (Screen 6)
  const handleGenerateCertificates = async () => {
    if (!selectedEvent) return

    // Filter students eligible for certificate generation
    const eligibleStudents = participants.filter(p => {
      const res = participantResults[p.studentId]
      if (!res) return false
      if (generateSelectedOnly && !res.selected) return false
      return res.certificateType && res.certificateType !== 'NO_CERTIFICATE'
    })

    if (eligibleStudents.length === 0) {
      toast.warning('No students selected with an eligible certificate type.')
      return
    }

    setBatchIssuing(true)
    try {
      const batchReqs = eligibleStudents.map(p => {
        const res = participantResults[p.studentId]
        let tmplId = participantTemplateId || (templates[0]?.id || 1)
        if (res.certificateType === 'WINNER') {
          tmplId = winnerTemplateId || tmplId
        } else if (res.certificateType === 'RUNNER_UP') {
          tmplId = runnerUpTemplateId || tmplId
        }

        return {
          studentId: p.studentId,
          templateId: Number(tmplId),
          position: res.position === 'WINNER' ? 'Winner' : res.position === 'RUNNER_UP' ? 'Runner-up' : 'Participant',
          certificateType: res.certificateType
        }
      })

      await eventService.generateBatchCertificates(selectedEvent.id, batchReqs)
      toast.success(`Successfully generated ${batchReqs.length} official certificates!`)
      loadEventCertificates(selectedEvent.id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Batch certificate generation failed.')
    } finally {
      setBatchIssuing(false)
    }
  }

  const handleDownloadPdf = async (cert) => {
    setDownloadingCertId(cert.certificateId)
    try {
      toast.info(`Preparing certificate PDF for ${cert.studentName}...`)
      await certificateService.downloadPdf(cert.certificateId, cert)
      toast.success('Certificate PDF downloaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to download PDF.')
    } finally {
      setDownloadingCertId(null)
    }
  }

  // Compute stat counts for Screen 6
  const winnerCount = participants.filter(p => participantResults[p.studentId]?.position === 'WINNER').length
  const runnerUpCount = participants.filter(p => participantResults[p.studentId]?.position === 'RUNNER_UP').length
  const participantCount = participants.filter(p => participantResults[p.studentId]?.position === 'PARTICIPANT').length
  const noCertCount = participants.filter(p => participantResults[p.studentId]?.position === 'NO_CERTIFICATE' || !participantResults[p.studentId]?.position).length
  const certEligibleCount = winnerCount + runnerUpCount + participantCount

  const TAB_STYLE = (active) => ({
    padding: '8px 18px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
    fontSize: 13, transition: 'all 0.2s',
    background: active ? '#0f766e' : 'transparent',
    color: active ? '#fff' : '#64748b',
    display: 'flex', alignItems: 'center', gap: 6
  })

  // Filter events by Active / Completed (Screen 4)
  const filteredEvents = events.filter(ev => {
    if (eventFilter === 'ACTIVE') return ev.status !== 'COMPLETED' && ev.status !== 'CANCELLED'
    return ev.status === 'COMPLETED'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Tabs matching Screen 4 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            My Assigned Events
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Manage your assigned departmental events, mark participant results, and generate university certificates.
          </p>
        </div>

        {/* Active Events / Completed Events Tabs matching Screen 4 */}
        <div style={{ display: 'flex', gap: 6, background: '#f8fafc', padding: 4, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setEventFilter('ACTIVE')}
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: eventFilter === 'ACTIVE' ? 800 : 600,
              cursor: 'pointer',
              background: eventFilter === 'ACTIVE' ? '#0f766e' : 'transparent',
              color: eventFilter === 'ACTIVE' ? '#fff' : '#64748b'
            }}
          >
            Active Events
          </button>
          <button
            onClick={() => setEventFilter('COMPLETED')}
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: eventFilter === 'COMPLETED' ? 800 : 600,
              cursor: 'pointer',
              background: eventFilter === 'COMPLETED' ? '#0f766e' : 'transparent',
              color: eventFilter === 'COMPLETED' ? '#fff' : '#64748b'
            }}
          >
            Completed Events
          </button>
        </div>
      </div>

      {/* Screen 4 Event Cards */}
      {loading ? <TableSkeleton rows={3} cols={3} /> : (
        <div className="grid-3">
          {filteredEvents.map(ev => {
            const isOngoing = ev.status === 'REGISTRATION_OPEN' || ev.status === 'ONGOING'
            return (
              <div key={ev.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                    {ev.category || 'Technical Event'}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: isOngoing ? '#ecfdf5' : '#f1f5f9',
                    color: isOngoing ? '#059669' : '#64748b'
                  }}>
                    {isOngoing ? 'Ongoing' : 'Upcoming'}
                  </span>
                </div>

                <h4 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {ev.title}
                </h4>

                <p style={{ fontSize: 12, color: '#64748b', margin: 0, flex: 1, lineHeight: 1.5 }}>
                  {ev.description?.slice(0, 90)}{ev.description?.length > 90 ? '…' : ''}
                </p>

                <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>📅 {formatDate(ev.eventDate)} &bull; {ev.startTime || '09:30 AM'}</span>
                  <span>📍 {ev.venue || 'BB Bhavan, Aditya University'}</span>
                  <span>👥 {ev.participantCount || 0} Participants</span>
                </div>

                {/* Action Buttons matching Screen 4 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => openEvent(ev, 'results')}
                    className="btn btn-sm"
                    style={{
                      background: '#d97706',
                      borderColor: '#d97706',
                      color: '#fff',
                      fontWeight: 700,
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    <Trophy size={13} />
                    <span>Manage Results</span>
                  </button>

                  <button
                    onClick={() => openEvent(ev, 'certificates')}
                    className="btn btn-sm"
                    style={{
                      background: '#0f766e',
                      borderColor: '#0f766e',
                      color: '#fff',
                      fontWeight: 700,
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    <Award size={13} />
                    <span>Certificates</span>
                  </button>
                </div>
              </div>
            )
          })}
          {filteredEvents.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, borderRadius: 14 }}>
              <Award size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>No events matching the selected filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Main Event Modal: Results & Certificates (Screens 5 & 6) */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => { setSelectedEvent(null); }}
        title={selectedEvent?.title ? `Manage Event: ${selectedEvent.title}` : 'Manage Event'}
        size="xl"
      >
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Modal Tabs Header */}
            <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 10, padding: 4, border: '1px solid #e2e8f0' }}>
              <button onClick={() => setActiveTab('participants')} style={TAB_STYLE(activeTab === 'participants')}>
                <Users size={14} /> Participants ({participants.length})
              </button>
              <button onClick={() => setActiveTab('results')} style={TAB_STYLE(activeTab === 'results')}>
                <Trophy size={14} /> Mark Event Results
              </button>
              <button onClick={() => { setActiveTab('certificates'); loadEventCertificates(selectedEvent.id) }} style={TAB_STYLE(activeTab === 'certificates')}>
                <Award size={14} /> Generate Certificates ({eventCertificates.length})
              </button>
            </div>

            {/* TAB 1: Participants List & Attendance */}
            {activeTab === 'participants' && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll No.</th>
                      <th>Department</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => (
                      <tr key={p.id || p.studentId}>
                        <td>{idx + 1}</td>
                        <td><strong>{p.studentName}</strong></td>
                        <td>{p.rollNumber || '—'}</td>
                        <td>{p.department || '—'}</td>
                        <td>
                          <span className={`badge ${p.attendanceStatus === 'PRESENT' ? 'badge-success' : 'badge-neutral'}`}>
                            {p.attendanceStatus || 'REGISTERED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {participants.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No participants registered yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Screen 5: MARK EVENT RESULTS (EASY SELECTION) */}
            {activeTab === 'results' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Screen 5 Top Alert Notice */}
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  color: '#92400e',
                  fontWeight: 600
                }}>
                  <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                  <span>Select result and certificate type for each participant. Only one Winner and one Runner-up.</span>
                </div>

                {/* Screen 5 Top Right Quick Actions: Auto Mark All as Participant & Clear All */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleAutoMarkAllAsParticipant}
                    className="btn btn-sm"
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      fontWeight: 700,
                      fontSize: 12,
                      gap: 6
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>Auto Mark All as Participant</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="btn btn-ghost btn-sm"
                    style={{
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                      fontSize: 12,
                      gap: 6
                    }}
                  >
                    <X size={14} />
                    <span>Clear All</span>
                  </button>
                </div>

                {/* Screen 5 Easy Selection Table */}
                <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: 10 }}>
                  <table className="data-table">
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ width: 40, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={handleToggleSelectAll}
                            style={{ cursor: 'pointer' }}
                          />
                        </th>
                        <th style={{ width: 40 }}>#</th>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th style={{ width: 200 }}>Result / Position</th>
                        <th style={{ width: 220 }}>Certificate Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p, idx) => {
                        const res = participantResults[p.studentId] || { position: 'PARTICIPANT', certificateType: 'PARTICIPATION', selected: true }
                        const isWinner = res.position === 'WINNER'
                        const isRunnerUp = res.position === 'RUNNER_UP'
                        const isNoCert = res.position === 'NO_CERTIFICATE'

                        return (
                          <tr key={p.id || p.studentId} style={{
                            background: isWinner ? '#fefce8' : isRunnerUp ? '#f0f9ff' : 'transparent'
                          }}>
                            {/* Checkbox */}
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(res.selected)}
                                onChange={() => handleToggleSelect(p.studentId)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>

                            {/* Row # */}
                            <td style={{ color: '#64748b', fontSize: 12 }}>{idx + 1}</td>

                            {/* Roll Number */}
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                              {p.rollNumber || '—'}
                            </td>

                            {/* Student Name */}
                            <td>
                              <strong>{p.studentName}</strong>
                              {isWinner && <span style={{ marginLeft: 6, fontSize: 11, color: '#d97706', fontWeight: 800 }}>🏆 WINNER</span>}
                              {isRunnerUp && <span style={{ marginLeft: 6, fontSize: 11, color: '#2563eb', fontWeight: 800 }}>🥈 RUNNER-UP</span>}
                            </td>

                            {/* Result / Position Dropdown (Screen 5) */}
                            <td>
                              <select
                                className="form-select"
                                style={{
                                  fontSize: 12,
                                  height: 34,
                                  fontWeight: isWinner || isRunnerUp ? 700 : 500,
                                  borderColor: isWinner ? '#d97706' : isRunnerUp ? '#2563eb' : '#cbd5e1'
                                }}
                                value={res.position}
                                onChange={e => handlePositionChange(p.studentId, e.target.value)}
                              >
                                <option value="WINNER">Winner</option>
                                <option value="RUNNER_UP">Runner-up</option>
                                <option value="PARTICIPANT">Participant</option>
                                <option value="NO_CERTIFICATE">No Certificate</option>
                              </select>
                            </td>

                            {/* Certificate Type (Screen 5) */}
                            <td>
                              <div style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                background: isWinner ? '#fef3c7' : isRunnerUp ? '#eff6ff' : isNoCert ? '#f1f5f9' : '#dcfce7',
                                color: isWinner ? '#b45309' : isRunnerUp ? '#1d4ed8' : isNoCert ? '#94a3b8' : '#15803d',
                                border: `1px solid ${isWinner ? '#fde68a' : isRunnerUp ? '#bfdbfe' : isNoCert ? '#e2e8f0' : '#bbf7d0'}`,
                                display: 'inline-block'
                              }}>
                                {isWinner ? 'Winner Certificate' : isRunnerUp ? 'Runner-up Certificate' : isNoCert ? 'No Certificate' : 'Participation Certificate'}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {participants.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No participants found for this event.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Screen 5 Bottom Right: Save Results Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
                  <button
                    type="button"
                    onClick={handleSaveResults}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{
                      background: '#d97706',
                      borderColor: '#d97706',
                      fontWeight: 800,
                      padding: '0 24px',
                      height: 42,
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    {submitting ? <Spinner size={16} color="#fff" /> : <Save size={16} />}
                    <span>{submitting ? 'Saving Results…' : 'Save Results'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Screen 6: GENERATE CERTIFICATES */}
            {activeTab === 'certificates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Screen 6 Summary Stat Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12
                }}>
                  {/* Total Participants */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Total Participants</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{participants.length}</div>
                  </div>

                  {/* Winner */}
                  <div style={{ background: '#fefce8', padding: '12px 16px', borderRadius: 10, border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Trophy size={14} /> Winner
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706', marginTop: 4 }}>{winnerCount}</div>
                  </div>

                  {/* Runner-up */}
                  <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Medal size={14} /> Runner-up
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{runnerUpCount}</div>
                  </div>

                  {/* Participants */}
                  <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> Participants
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{participantCount}</div>
                  </div>

                  {/* No Certificate */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Ban size={14} /> No Certificate
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#64748b', marginTop: 4 }}>{noCertCount}</div>
                  </div>
                </div>

                {/* Screen 6 Select Certificate Template Controls Card */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    Select Certificate Template
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    {/* Winner Template */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Winner Template</label>
                      <select
                        className="form-select"
                        value={winnerTemplateId}
                        onChange={e => setWinnerTemplateId(e.target.value)}
                        style={{ fontSize: 12 }}
                      >
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.templateType})</option>
                        ))}
                      </select>
                    </div>

                    {/* Runner-up Template */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Runner-up Template</label>
                      <select
                        className="form-select"
                        value={runnerUpTemplateId}
                        onChange={e => setRunnerUpTemplateId(e.target.value)}
                        style={{ fontSize: 12 }}
                      >
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.templateType})</option>
                        ))}
                      </select>
                    </div>

                    {/* Participation Template */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>Participation Template</label>
                      <select
                        className="form-select"
                        value={participantTemplateId}
                        onChange={e => setParticipantTemplateId(e.target.value)}
                        style={{ fontSize: 12 }}
                      >
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.templateType})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Screen 6 Checkbox: Generate for selected students only */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                    <input
                      type="checkbox"
                      id="genSelected"
                      checked={generateSelectedOnly}
                      onChange={e => setGenerateSelectedOnly(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="genSelected" style={{ fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                      <strong>Generate for selected students only</strong>
                      <span style={{ display: 'block', fontSize: 11, color: '#94a3b8' }}>
                        Certificates will be generated only for students with a selected certificate type.
                      </span>
                    </label>
                  </div>

                  {/* Big Gold Action Button: [Generate Certificates (X)] */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                    <button
                      type="button"
                      onClick={handleGenerateCertificates}
                      disabled={batchIssuing || certEligibleCount === 0}
                      className="btn btn-primary"
                      style={{
                        background: '#d97706',
                        borderColor: '#d97706',
                        fontWeight: 800,
                        fontSize: 14,
                        padding: '0 28px',
                        height: 44,
                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
                        gap: 8
                      }}
                    >
                      {batchIssuing ? <Spinner size={16} color="#fff" /> : <Sparkles size={16} />}
                      <span>{batchIssuing ? 'Generating Certificates…' : `Generate Certificates (${certEligibleCount})`}</span>
                    </button>
                  </div>
                </div>

                {/* Issued Certificates Table */}
                <div style={{ marginTop: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                    Issued Certificates for This Event ({eventCertificates.length})
                  </h4>

                  <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: 10 }}>
                    <table className="data-table">
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th>Student</th>
                          <th>Certificate ID</th>
                          <th>Award / Position</th>
                          <th>Issue Date</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventCertificates.map(c => {
                          const isDownloading = downloadingCertId === c.certificateId
                          return (
                            <tr key={c.id || c.certificateId}>
                              <td>
                                <strong>{c.studentName}</strong>
                                {c.rollNumber && <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.rollNumber}</div>}
                              </td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>
                                {c.certificateId}
                              </td>
                              <td>
                                <span className={`badge ${c.position?.toUpperCase().includes('WINNER') ? 'badge-warning' : 'badge-neutral'}`}>
                                  {c.position || c.certificateType}
                                </span>
                              </td>
                              <td>{formatDate(c.issueDate)}</td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewCert(c)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '4px 10px', fontSize: 11, gap: 4 }}
                                  >
                                    <Eye size={13} /> View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf(c)}
                                    disabled={isDownloading}
                                    className="btn btn-sm"
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: 11,
                                      gap: 4,
                                      background: '#f0fdf4',
                                      color: '#15803d',
                                      border: '1px solid #bbf7d0',
                                      fontWeight: 700
                                    }}
                                  >
                                    <Download size={13} />
                                    <span>{isDownloading ? '…' : 'PDF'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {eventCertificates.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
                              No certificates generated for this event yet. Mark results and click Generate Certificates.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Certificate Live Preview Modal */}
      {previewCert && (
        <Modal
          isOpen={Boolean(previewCert)}
          onClose={() => setPreviewCert(null)}
          title={`Certificate: ${previewCert.eventName} (${previewCert.certificateId})`}
          size="xl"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#f8fafc',
              padding: 12,
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <CertificatePreview
                certificate={previewCert}
                mode="full"
                sampleData={{
                  studentName: previewCert.studentName,
                  eventName: previewCert.eventName || selectedEvent?.title,
                  position: previewCert.position,
                  date: formatDate(previewCert.issueDate),
                  venue: previewCert.venue || selectedEvent?.venue || 'Aditya University Campus',
                  department: previewCert.departmentName || 'Computer Science & Engineering',
                  certificateId: previewCert.certificateId
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Certificate ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{previewCert.certificateId}</strong>
              </span>

              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={`/verify/${previewCert.certificateId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ExternalLink size={14} /> Verify Online
                </a>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(previewCert)}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#15803d', borderColor: '#15803d', fontWeight: 700, gap: 6 }}
                >
                  <Download size={14} /> Download Official PDF
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
        <Route path="attendance" element={<FacultyAttendanceSection courses={courses} onCorrectionUpdate={setPendingCorrectionsCount} initialTab="manual" />} />
        <Route path="attendance/*" element={<FacultyAttendanceSection courses={courses} onCorrectionUpdate={setPendingCorrectionsCount} />} />
        <Route path="marks" element={<MarksPanel courses={courses} />} />
        <Route path="timetable" element={<AcademicTimetable role="FACULTY" user={user} />} />
        <Route path="events" element={<FacultyEvents />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
