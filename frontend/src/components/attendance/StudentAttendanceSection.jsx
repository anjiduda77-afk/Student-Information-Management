import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ClipboardCheck, AlertTriangle, CheckCircle, Calendar,
  AlertCircle, Plus
} from 'lucide-react'
import { attendanceService } from '../../services/api'
import { toast } from '../Toast'
import { Modal } from '../Modal'
import { TableSkeleton, Spinner } from '../Loading'
import { formatDate } from '../../utils/helpers'
import { isFutureDate } from '../../utils/validators'

export default function StudentAttendanceSection({ user, initialTab }) {
  const location = useLocation()
  const navigate = useNavigate()

  const getActiveTabFromLocation = () => {
    const p = location.pathname.toLowerCase()
    if (p.endsWith('/history')) return 'history'
    if (p.endsWith('/corrections')) return 'corrections'
    if (p.endsWith('/date-wise')) return 'date-wise'
    if (initialTab) return initialTab
    return 'subject-wise'
  }

  // Active Modules: 'subject-wise' | 'date-wise' | 'history' | 'corrections'
  const [activeTab, setActiveTab] = useState(getActiveTabFromLocation)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const current = getActiveTabFromLocation()
    setActiveTab(current)
  }, [location.pathname, initialTab])

  const handleSwitchTab = (tab) => {
    setActiveTab(tab)
    if (tab === 'subject-wise') navigate('/student/attendance')
    else navigate(`/student/attendance/${tab}`)
  }

  // Data states
  const [summary, setSummary] = useState(null)
  const [subjectWise, setSubjectWise] = useState([])
  const [dateWise, setDateWise] = useState([])
  const [history, setHistory] = useState([])
  const [corrections, setCorrections] = useState([])

  // Date-wise filters
  const [datePreset, setDatePreset] = useState('all') // 'today' | 'week' | 'month' | 'all' | 'custom'
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Correction Request Modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [correctionForm, setCorrectionForm] = useState({
    subjectId: '',
    courseId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    previousStatus: 'ABSENT',
    requestedStatus: 'PRESENT',
    reason: ''
  })
  const [submittingCorrection, setSubmittingCorrection] = useState(false)

  // Load all attendance data
  const loadAttendanceData = async () => {
    setLoading(true)
    try {
      const [sumRes, subRes, histRes, corrRes] = await Promise.all([
        attendanceService.getAttendanceSummary(),
        attendanceService.getMySubjectWiseAttendance(),
        attendanceService.getMyAttendance(),
        attendanceService.getMyCorrections()
      ])

      setSummary(sumRes.data || null)
      setSubjectWise(subRes.data || [])
      setHistory(histRes.data || [])
      setCorrections(corrRes.data || [])
    } catch {
      toast.error('Could not load attendance details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendanceData()
  }, [])

  // Load date-wise attendance whenever filters change
  const loadDateWiseRecords = async () => {
    try {
      const params = {
        preset: datePreset,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        subjectId: selectedSubjectId || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      }
      const res = await attendanceService.getMyDateWiseAttendance(params)
      setDateWise(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (activeTab === 'date-wise') {
      loadDateWiseRecords()
    }
  }, [activeTab, datePreset, fromDate, toDate, selectedSubjectId, statusFilter])

  // Submit Correction Request
  const handleSubmitCorrection = async (e) => {
    e.preventDefault()
    if (!correctionForm.reason.trim()) {
      toast.warning('Please state the valid reason for attendance correction.')
      return
    }
    if (isFutureDate(correctionForm.attendanceDate)) {
      toast.error('Attendance date cannot be in the future.')
      return
    }

    setSubmittingCorrection(true)
    try {
      await attendanceService.submitCorrection({
        courseId: correctionForm.courseId ? Number(correctionForm.courseId) : (subjectWise[0]?.courseId || 1),
        attendanceDate: correctionForm.attendanceDate,
        previousStatus: correctionForm.previousStatus,
        requestedStatus: correctionForm.requestedStatus,
        reason: correctionForm.reason.trim()
      })
      toast.success('Correction request submitted to faculty successfully.')
      setShowCorrectionModal(false)
      setCorrectionForm({
        subjectId: '',
        courseId: '',
        attendanceDate: new Date().toISOString().split('T')[0],
        previousStatus: 'ABSENT',
        requestedStatus: 'PRESENT',
        reason: ''
      })
      loadAttendanceData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit correction request.')
    } finally {
      setSubmittingCorrection(false)
    }
  }

  // Shortage check (<75%)
  const shortageSubjects = subjectWise.filter(s => (s.attendancePercentage || s.percentage) < 75.0 && s.totalClasses > 0)
  const isOverallShortage = (summary?.overallPercentage || 0) < 75.0 && (summary?.totalClasses || 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
              Academic Records Portal
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
            My Attendance
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Subject breakdown, period register, and date-wise attendance records.
          </p>
        </div>
      </div>

      {/* ── Shortage Alert Banner ────────────────────────────────── */}
      {(isOverallShortage || shortageSubjects.length > 0) && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #f87171',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          boxShadow: '0 2px 8px rgba(220,38,38,0.08)'
        }}>
          <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: '#991b1b' }}>
              ⚠ Attendance Shortage Alert
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: '#b91c1c', lineHeight: 1.6 }}>
              {isOverallShortage ? (
                <>Your overall attendance is currently <strong>{summary?.overallPercentage}%</strong>, which is below the mandatory university threshold of <strong>75%</strong>.</>
              ) : (
                <>
                  Your attendance is below 75% in the following subject(s):{' '}
                  <strong>{shortageSubjects.map(s => `${s.subjectName} (${s.attendancePercentage || s.percentage}%)`).join(', ')}</strong>.
                </>
              )}{' '}
              Please ensure regular attendance in upcoming periods or consult your faculty advisor to prevent examination hall ticket debarment.
            </p>
          </div>
        </div>
      )}

      {/* ── Top Metric Cards ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16
      }}>
        <div className="card" style={{
          padding: '20px 22px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(15,23,42,0.18)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#d99b26' }}>
              Overall Attendance
            </span>
            <ClipboardCheck size={20} color="#d99b26" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, color: '#fff' }}>
              {summary ? summary.overallPercentage : 85.0}%
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: (summary?.overallPercentage || 85) >= 75 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.25)',
              color: (summary?.overallPercentage || 85) >= 75 ? '#4ade80' : '#f87171'
            }}>
              {(summary?.overallPercentage || 85) >= 75 ? 'Good Standing' : 'Shortage'}
            </span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.8 }}>
            {summary?.presentCount ?? 0} of {summary?.totalClasses ?? 0} total periods attended
          </p>
        </div>

        <div className="card" style={{ padding: '20px 22px', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Classes Present</span>
            <CheckCircle size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>
            {summary?.presentCount ?? 0}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8' }}>Verified present periods</p>
        </div>

        <div className="card" style={{ padding: '20px 22px', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Classes Absent</span>
            <AlertCircle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>
            {summary?.absentCount ?? 0}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8' }}>Unattended periods</p>
        </div>

        <div className="card" style={{ padding: '20px 22px', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Excused / OD</span>
            <Calendar size={18} color="#9333ea" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#9333ea' }}>
            {summary?.excusedCount ?? 0}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8' }}>Approved official duty</p>
        </div>
      </div>

      {/* ── Separate Module Navigation Tabs ─────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0',
        paddingBottom: 12, flexWrap: 'wrap', overflowX: 'auto'
      }}>
        {[
          { id: 'subject-wise', label: '📊 Paper / Subject-wise Summary' },
          { id: 'date-wise', label: '📅 Date-wise Attendance Log' },
          { id: 'history', label: '📜 Period Attendance Register' },
          { id: 'corrections', label: `📬 Regularization & OD Records (${corrections.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleSwitchTab(tab.id)}
            className="btn"
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 800 : 600,
              borderRadius: 10,
              background: activeTab === tab.id ? '#0f172a' : '#f8fafc',
              color: activeTab === tab.id ? '#fff' : '#475569',
              border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* MODULE 1: SUBJECT-WISE SUMMARY */}
      {/* ========================================================================= */}
      {activeTab === 'subject-wise' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: '24px', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Subject-wise Attendance Status
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Minimum threshold: 75%. Shortage in any course requires condonation or debarment.
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '6px 12px', borderRadius: 20 }}>
              Aditya University Requirement: 75%
            </span>
          </div>

          {loading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Faculty</th>
                    <th style={{ textAlign: 'center' }}>Attended / Total</th>
                    <th style={{ width: 180 }}>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectWise.map((sub, idx) => {
                    const pct = sub.attendancePercentage || sub.percentage || 0
                    const isShort = pct < 75.0 && sub.totalClasses > 0
                    return (
                      <tr key={sub.subjectId || idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                          {sub.subjectCode}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          {sub.subjectName}
                        </td>
                        <td style={{ color: '#475569' }}>
                          {sub.facultyName || 'Faculty Member'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          {sub.attendedClasses} / {sub.totalClasses}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.min(100, pct)}%`,
                                height: '100%',
                                background: isShort ? '#ef4444' : '#10b981',
                                borderRadius: 4
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 800, width: 44, textAlign: 'right', color: isShort ? '#dc2626' : '#15803d' }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: isShort ? '#fee2e2' : '#dcfce7',
                            color: isShort ? '#b91c1c' : '#15803d'
                          }}>
                            {isShort ? 'Shortage (<75%)' : 'Eligible'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 2: DATE-WISE LOG */}
      {/* ========================================================================= */}
      {activeTab === 'date-wise' && (
        <div className="card" style={{ padding: '24px', borderRadius: 16 }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="section-title">Date-wise Period Attendance Log</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Complete chronological record of all class periods and marked statuses.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 18
          }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Date Presets
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'This Week' },
                  { id: 'month', label: 'This Month' },
                  { id: 'all', label: 'All Time' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setDatePreset(p.id)}
                    className="btn btn-sm"
                    style={{
                      background: datePreset === p.id ? '#0f172a' : '#fff',
                      color: datePreset === p.id ? '#fff' : '#475569',
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>
                Status Filter
              </label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ fontSize: 12 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="LATE">LATE</option>
                <option value="EXCUSED">EXCUSED</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Date & Period</th>
                  <th>Subject Details</th>
                  <th>Faculty</th>
                  <th>Status</th>
                  <th>Verification Method</th>
                </tr>
              </thead>
              <tbody>
                {dateWise.length > 0 ? (
                  dateWise.map(d => {
                    const isPres = d.status === 'PRESENT'
                    return (
                      <tr key={d.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatDate(d.date)}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Period {d.period || 1}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.courseName || d.subjectName}</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{d.courseCode || d.subjectCode}</div>
                        </td>
                        <td>{d.facultyName || 'Faculty Member'}</td>
                        <td>
                          <span style={{
                            background: isPres ? '#dcfce7' : '#fee2e2',
                            color: isPres ? '#15803d' : '#b91c1c',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11
                          }}>
                            {d.status}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: 10 }}>
                            {d.verificationMethod || 'ONLINE'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
                      No attendance records found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 3: ATTENDANCE HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="section-title">All Attendance History</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Complete ledger of your attendance marks since semester commencement.
              </p>
            </div>
            <span className="badge badge-primary">{history.length} Logs</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Date & Period</th>
                  <th>Course / Subject</th>
                  <th>Status</th>
                  <th>Verification Method</th>
                  <th>Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatDate(h.date)}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Period {h.period || 1}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.courseName || h.subjectName}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{h.courseCode || h.subjectCode}</div>
                    </td>
                    <td>
                      <span style={{
                        background: h.status === 'PRESENT' ? '#dcfce7' : '#fee2e2',
                        color: h.status === 'PRESENT' ? '#15803d' : '#b91c1c',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11
                      }}>
                        {h.status}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: 10 }}>
                        {h.verificationMethod || 'ONLINE'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {h.markedAt ? h.markedAt.replace('T', ' ').substring(0, 16) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 6: CORRECTION REQUESTS */}
      {/* ========================================================================= */}
      {activeTab === 'corrections' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="section-title">Submitted Attendance Correction Requests</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Track the status of your absence rectification requests submitted to faculty.
              </p>
            </div>
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              <Plus size={15} /> New Request
            </button>
          </div>

          {corrections.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {corrections.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{c.courseName}</span>
                      <span className={`badge ${c.status === 'APPROVED' ? 'badge-success' : c.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                        {c.status || 'PENDING'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                      Class Date: <strong>{formatDate(c.attendanceDate)}</strong> &bull; Requested: <span style={{ fontWeight: 700, color: '#16a34a' }}>{c.requestedStatus}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                      Reason: "{c.reason}"
                    </div>
                  </div>

                  {c.reviewRemarks && (
                    <div style={{ fontSize: 12, color: '#1e40af', background: '#eff6ff', padding: '6px 12px', borderRadius: 8 }}>
                      Faculty note: {c.reviewRemarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
              No correction requests filed.
            </div>
          )}
        </div>
      )}

      {/* Modal: New Correction Request */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="Request Attendance Correction"
      >
        <form onSubmit={handleSubmitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Submit an authorised request if your attendance was incorrectly marked absent or late.
          </p>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <select
              className="form-select"
              value={correctionForm.courseId}
              onChange={e => setCorrectionForm({ ...correctionForm, courseId: e.target.value })}
              required
            >
              <option value="">Select Subject</option>
              {subjectWise.map(s => (
                <option key={s.subjectId || s.courseId} value={s.courseId}>
                  {s.subjectCode} — {s.subjectName} ({s.facultyName})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Attendance Date</label>
            <input
              type="date"
              className="form-input"
              value={correctionForm.attendanceDate}
              onChange={e => setCorrectionForm({ ...correctionForm, attendanceDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Current Status</label>
              <select
                className="form-select"
                value={correctionForm.previousStatus}
                onChange={e => setCorrectionForm({ ...correctionForm, previousStatus: e.target.value })}
              >
                <option value="ABSENT">ABSENT</option>
                <option value="LATE">LATE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Requested Status</label>
              <select
                className="form-select"
                value={correctionForm.requestedStatus}
                onChange={e => setCorrectionForm({ ...correctionForm, requestedStatus: e.target.value })}
              >
                <option value="PRESENT">PRESENT</option>
                <option value="EXCUSED">EXCUSED (On-Duty / Leave)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Justification</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Attended class in Room C-204 but device lost network connectivity during session."
              value={correctionForm.reason}
              onChange={e => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setShowCorrectionModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCorrection}
              className="btn btn-primary"
            >
              {submittingCorrection ? <Spinner size={16} color="#fff" /> : 'Submit to Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
