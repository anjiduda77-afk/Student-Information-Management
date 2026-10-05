import { useState, useEffect } from 'react'
import {
  ClipboardCheck, AlertTriangle, CheckCircle, Clock, Search,
  Shield, Edit3, Download, RefreshCw, FileText,
  Users, AlertCircle
} from 'lucide-react'
import { attendanceService, adminService } from '../../services/api'
import { toast } from '../Toast'
import { Modal } from '../Modal'
import { TableSkeleton, Spinner } from '../Loading'
import { formatDate } from '../../utils/helpers'

export default function AdminAttendanceSection() {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'shortage' | 'correction'
  const [loading, setLoading] = useState(true)

  // Data states
  const [overview, setOverview] = useState(null)
  const [shortageReport, setShortageReport] = useState([])
  const [allStudents, setAllStudents] = useState([])

  // Filters for Shortage Report
  const [sectionFilter, setSectionFilter] = useState('ALL')
  const [thresholdFilter, setThresholdFilter] = useState(75)
  const [searchStudent, setSearchStudent] = useState('')

  // Manual Correction State
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentHistory, setStudentHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [correctingRecord, setCorrectingRecord] = useState(null)
  const [correctionForm, setCorrectionForm] = useState({
    newStatus: 'PRESENT',
    reason: ''
  })
  const [submittingCorrection, setSubmittingCorrection] = useState(false)

  // Load all overview and shortage data
  const loadData = async () => {
    setLoading(true)
    try {
      const [overRes, shortRes, stuRes] = await Promise.all([
        attendanceService.getAdminOverview(),
        attendanceService.getAdminShortageReport(thresholdFilter),
        adminService.getStudents()
      ])
      setOverview(overRes.data || null)
      setShortageReport(shortRes.data || [])
      setAllStudents(stuRes.data || [])
      if (stuRes.data?.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stuRes.data[0].id)
      }
    } catch (err) {
      console.error('Failed to load admin attendance data', err)
      toast.error('Failed to load attendance metrics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [thresholdFilter])

  // Load selected student's attendance history when viewing correction tab
  const loadStudentRecords = async (studentId) => {
    if (!studentId) return
    setLoadingHistory(true)
    try {
      const res = await attendanceService.getStudentDateWiseAttendance(studentId, 'ALL')
      setStudentHistory(res.data || [])
    } catch (err) {
      console.error('Failed to load student history', err)
      toast.error('Could not load student attendance records.')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'correction' && selectedStudentId) {
      loadStudentRecords(selectedStudentId)
    }
  }, [activeTab, selectedStudentId])

  // Handle Admin Manual Correction Submission
  const handleOpenCorrection = (record) => {
    setCorrectingRecord(record)
    setCorrectionForm({
      newStatus: record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT',
      reason: ''
    })
    setShowCorrectionModal(true)
  }

  const handleSubmitCorrection = async (e) => {
    e.preventDefault()
    if (!correctionForm.reason.trim()) {
      toast.warning('Please provide an official audit reason for this correction.')
      return
    }
    setSubmittingCorrection(true)
    try {
      await attendanceService.adminCorrectAttendance(
        correctingRecord.id,
        correctionForm.newStatus,
        correctionForm.reason.trim()
      )
      toast.success('Attendance record updated and logged to audit system.')
      setShowCorrectionModal(false)
      loadStudentRecords(selectedStudentId)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update record.')
    } finally {
      setSubmittingCorrection(false)
    }
  }

  // Filtered Shortage List
  const filteredShortage = shortageReport.filter(s => {
    if (sectionFilter !== 'ALL' && s.section !== sectionFilter) return false
    if (searchStudent) {
      const q = searchStudent.toLowerCase()
      return (s.studentName || '').toLowerCase().includes(q) ||
             (s.rollNumber || '').toLowerCase().includes(q)
    }
    return true
  })

  // Export CSV
  const handleExportCSV = () => {
    if (filteredShortage.length === 0) {
      toast.warning('No records to export.')
      return
    }
    const headers = ['Roll Number', 'Student Name', 'Section', 'Total Classes', 'Attended Classes', 'Attendance %', 'Status']
    const rows = filteredShortage.map(s => [
      `"${s.rollNumber || ''}"`,
      `"${s.studentName || ''}"`,
      `"${s.section || ''}"`,
      s.totalClasses || 0,
      s.attendedClasses || 0,
      `${s.attendancePercentage || 0}%`,
      s.attendancePercentage < 65 ? 'CRITICAL_SHORTAGE' : 'SHORTAGE'
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Aditya_University_Shortage_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Shortage report exported as CSV.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e3a8a 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        color: '#fff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              background: '#d99b26',
              color: '#0f172a',
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Aditya University
            </span>
            <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>
              Central Administration
            </span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            Attendance Oversight & Governance
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            University-wide attendance compliance, shortage monitoring (&lt;75%), and audited administrative corrections.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadData}
            className="btn btn-ghost"
            style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="btn"
            style={{ background: '#d99b26', color: '#0f172a', fontWeight: 700 }}
          >
            <Download size={15} /> Export Shortage CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: 12,
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Institutional Overview', icon: ClipboardCheck },
          { id: 'shortage', label: 'Shortage Report (< 75%)', icon: AlertTriangle, badge: shortageReport.length, badgeColor: '#ef4444' },
          { id: 'correction', label: 'Audit & Manual Corrections', icon: Shield }
        ].map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="btn"
              style={{
                background: isActive ? '#0f172a' : '#f8fafc',
                color: isActive ? '#fff' : '#475569',
                border: isActive ? 'none' : '1px solid #e2e8f0',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 10,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#d99b26' : '#64748b'} />
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span style={{
                  background: t.badgeColor || '#e2e8f0',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INSTITUTIONAL OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Key Metrics Grid */}
          <div className="grid-4">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                <Clock size={26} />
              </div>
              <div>
                <p className="stat-value">{overview?.todaySessions || 0}</p>
                <p className="stat-label">Today's Class Sessions</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <CheckCircle size={26} />
              </div>
              <div>
                <p className="stat-value">{overview?.overallAttendanceRate || 85}%</p>
                <p className="stat-label">Institution Present Rate</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <p className="stat-value">{overview?.studentsWithShortage || shortageReport.length}</p>
                <p className="stat-label">Students Below 75%</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                <Users size={26} />
              </div>
              <div>
                <p className="stat-value">{overview?.totalAttendanceRecords || 0}</p>
                <p className="stat-label">Total Attendance Logs</p>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Card */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 className="section-title">Academic Governance & Threshold Rules</h3>
                <p style={{ fontSize: 13, color: '#64748b' }}>
                  Aditya University Academic Regulations (Section 7.2) for Examination Eligibility.
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16
            }}>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <CheckCircle size={18} color="#16a34a" />
                  <strong style={{ color: '#166534', fontSize: 14 }}>Eligible (&ge; 75%)</strong>
                </div>
                <p style={{ fontSize: 12, color: '#14532d', margin: 0 }}>
                  Eligible for Semester End Examinations (SEE). Allowed standard hall ticket issuance.
                </p>
              </div>

              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <AlertTriangle size={18} color="#d97706" />
                  <strong style={{ color: '#92400e', fontSize: 14 }}>Condonation Band (65% - 74%)</strong>
                </div>
                <p style={{ fontSize: 12, color: '#78350f', margin: 0 }}>
                  Requires formal medical / institutional approval and condonation fee payment.
                </p>
              </div>

              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <AlertCircle size={18} color="#dc2626" />
                  <strong style={{ color: '#991b1b', fontSize: 14 }}>Detained (&lt; 65%)</strong>
                </div>
                <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>
                  Strictly barred from Semester End Exams. Must repeat the semester in the next academic year.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHORTAGE REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'shortage' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="section-title">Attendance Shortage Registry (&lt; 75%)</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Students at risk of exam debarment. Generated automatically from recorded session lectures.
              </p>
            </div>
            <span className="badge badge-danger">
              {filteredShortage.length} Students At Risk
            </span>
          </div>

          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
            background: '#f8fafc',
            padding: 12,
            borderRadius: 10
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Search Student
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                <input
                  className="form-input"
                  placeholder="Filter by name or roll number..."
                  value={searchStudent}
                  onChange={e => setSearchStudent(e.target.value)}
                  style={{ paddingLeft: 30, fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ width: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Section
              </label>
              <select
                className="form-select"
                value={sectionFilter}
                onChange={e => setSectionFilter(e.target.value)}
                style={{ fontSize: 12 }}
              >
                <option value="ALL">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div style={{ width: 160 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Shortage Threshold
              </label>
              <select
                className="form-select"
                value={thresholdFilter}
                onChange={e => setThresholdFilter(Number(e.target.value))}
                style={{ fontSize: 12 }}
              >
                <option value={75}>Under 75% (Mandatory)</option>
                <option value={65}>Under 65% (Detained)</option>
                <option value={80}>Under 80% (Warning)</option>
              </select>
            </div>
          </div>

          {/* Shortage Table */}
          {loading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : filteredShortage.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Section</th>
                    <th>Classes Attended / Held</th>
                    <th>Attendance %</th>
                    <th>Condition Status</th>
                    <th>Required to Reach 75%</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShortage.map(s => {
                    const pct = s.attendancePercentage || 0
                    const isCritical = pct < 65
                    const held = s.totalClasses || 0
                    const attended = s.attendedClasses || 0
                    const needed = Math.max(0, Math.ceil((0.75 * held - attended) / 0.25))

                    return (
                      <tr key={s.studentId}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                          {s.rollNumber || `STU-${s.studentId}`}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {s.studentName}
                        </td>
                        <td>
                          <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                            Sec {s.section || 'A'}
                          </span>
                        </td>
                        <td>
                          <strong>{attended}</strong> / {held} Periods
                        </td>
                        <td>
                          <span style={{
                            background: isCritical ? '#fee2e2' : '#fef3c7',
                            color: isCritical ? '#dc2626' : '#b45309',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 12
                          }}>
                            {pct}%
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${isCritical ? 'badge-danger' : 'badge-warning'}`}>
                            {isCritical ? 'CRITICAL / DETAINED' : 'CONDONATION BAND'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                          Must attend <strong>+{needed}</strong> consecutive classes
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <CheckCircle size={40} style={{ color: '#86efac', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                All Students In Good Standing
              </h4>
              <p style={{ fontSize: 13 }}>No students are below the {thresholdFilter}% threshold.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT & MANUAL CORRECTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'correction' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="section-title">Administrative Attendance Override</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Inspect any student's complete attendance record and perform authorized corrections with audit tracking.
              </p>
            </div>
          </div>

          {/* Select Student Selector */}
          <div style={{
            background: '#f8fafc',
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Select Student for Inspection
              </label>
              <select
                className="form-select"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.rollNumber || s.id} — {s.name} ({s.department || 'CSE'}, Sec {s.section || 'A'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadStudentRecords(selectedStudentId)}
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-end', height: 38 }}
            >
              <RefreshCw size={14} /> Refresh Records
            </button>
          </div>

          {/* Student Records Table */}
          {loadingHistory ? (
            <TableSkeleton rows={4} cols={6} />
          ) : studentHistory.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th>Date & Period</th>
                    <th>Subject Details</th>
                    <th>Faculty</th>
                    <th>Recorded Status</th>
                    <th>Remarks / Source</th>
                    <th style={{ textAlign: 'right' }}>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studentHistory.map(rec => {
                    const isPresent = rec.status === 'PRESENT'
                    return (
                      <tr key={rec.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatDate(rec.date)}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Period {rec.period || 1}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{rec.courseName || rec.subjectName || 'Course Class'}</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{rec.courseCode || rec.subjectCode || '—'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{rec.facultyName || 'Faculty Member'}</div>
                        </td>
                        <td>
                          <span style={{
                            background: isPresent ? '#dcfce7' : '#fee2e2',
                            color: isPresent ? '#15803d' : '#b91c1c',
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6
                          }}>
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>
                          {rec.remarks || 'Standard Session'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenCorrection(rec)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                          >
                            <Edit3 size={12} /> Correct Status
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <FileText size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p>No attendance logs found for selected student.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Admin Correction */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="Admin Attendance Correction"
      >
        {correctingRecord && (
          <form onSubmit={handleSubmitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 12, color: '#475569' }}>
              <div><strong>Record Date:</strong> {formatDate(correctingRecord.date)} (Period {correctingRecord.period || 1})</div>
              <div><strong>Subject:</strong> {correctingRecord.courseName || correctingRecord.subjectName}</div>
              <div><strong>Current Status:</strong> <span style={{ fontWeight: 800, color: correctingRecord.status === 'PRESENT' ? '#15803d' : '#b91c1c' }}>{correctingRecord.status}</span></div>
            </div>

            <div className="form-group">
              <label className="form-label">New Status</label>
              <select
                className="form-select"
                value={correctionForm.newStatus}
                onChange={e => setCorrectionForm({ ...correctionForm, newStatus: e.target.value })}
                required
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="LATE">LATE</option>
                <option value="EXCUSED">EXCUSED</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Audit Justification / Reason *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Official OD (On Duty) letter approved by Dean of Academics for Sports event participation"
                value={correctionForm.reason}
                onChange={e => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button type="button" onClick={() => setShowCorrectionModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={submittingCorrection} className="btn btn-primary">
                {submittingCorrection ? <Spinner size={14} color="#fff" /> : <Shield size={14} />}
                <span>Authorize & Update</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
