import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Clock, CheckCircle, XCircle, AlertCircle,
  Users, Check, X, RefreshCw, ChevronRight,
  ShieldCheck, Search, ArrowLeft, Save,
  FileSpreadsheet
} from 'lucide-react'
import { attendanceService } from '../../services/api'
import { toast } from '../Toast'
import { TableSkeleton, Spinner } from '../Loading'
import { formatDate } from '../../utils/helpers'

export default function FacultyAttendanceSection({ onCorrectionUpdate, initialTab }) {
  const location = useLocation()
  const navigate = useNavigate()

  const getActiveTabFromLocation = () => {
    const p = location.pathname.toLowerCase()
    if (p.endsWith('/history')) return 'history'
    if (p.endsWith('/summary')) return 'summary'
    if (p.endsWith('/corrections')) return 'corrections'
    if (initialTab && initialTab !== 'qr' && initialTab !== 'code') return initialTab
    return 'manual'
  }

  // Active Modules: 'manual' | 'history' | 'summary' | 'corrections'
  const [activeTab, setActiveTab] = useState(getActiveTabFromLocation)

  useEffect(() => {
    const current = getActiveTabFromLocation()
    setActiveTab(current)
  }, [location.pathname, initialTab])

  const handleSwitchTab = (tab) => {
    setActiveTab(tab)
    if (tab === 'manual') {
      navigate('/faculty/attendance')
    } else {
      navigate(`/faculty/attendance/${tab}`)
    }
  }

  // =========================================================================
  // Manual Attendance State (Steps 1 to 5)
  // =========================================================================
  // Step View: 'SELECTION' (Steps 1-4) | 'ROSTER' (Step 5)
  const [selectionStep, setSelectionStep] = useState('SELECTION')

  // Step 1: Date selection (default today)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  // Step 2: Department selection
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  // Step 3: Section selection
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState('')
  const [loadingSections, setLoadingSections] = useState(false)

  // Step 4 & 5: Roster & Student Table
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [rosterData, setRosterData] = useState(null)
  const [studentStatusMap, setStudentStatusMap] = useState({})
  const [studentRemarksMap, setStudentRemarksMap] = useState({})
  const [savingRoster, setSavingRoster] = useState(false)
  const [studentSearchQuery, setStudentSearchQuery] = useState('')

  // History & Corrections state
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [corrections, setCorrections] = useState([])
  const [reviewingId, setReviewingId] = useState(null)

  // =========================================================================
  // Load Departments for Step 2
  // =========================================================================
  const loadAuthorizedDepartments = async () => {
    setLoadingDepartments(true)
    try {
      const res = await attendanceService.getAttendanceDepartments()
      const list = res.data || []
      setDepartments(list)
      if (list.length > 0 && !selectedDepartment) {
        setSelectedDepartment(list[0].name || list[0].code)
      }
    } catch (err) {
      console.error('Failed to load departments', err)
      toast.error('Failed to load authorized departments.')
    } finally {
      setLoadingDepartments(false)
    }
  }

  // Load Sections for Step 3 whenever Department changes
  const loadSectionsForDepartment = async (dept) => {
    if (!dept) {
      setSections([])
      setSelectedSection('')
      return
    }
    setLoadingSections(true)
    try {
      const res = await attendanceService.getAttendanceSections(dept)
      const list = res.data || []
      setSections(list)
      if (list.length > 0) {
        setSelectedSection(list[0])
      } else {
        setSelectedSection('')
      }
    } catch (err) {
      console.error('Failed to load sections', err)
      setSections([])
    } finally {
      setLoadingSections(false)
    }
  }

  useEffect(() => {
    loadAuthorizedDepartments()
  }, [])

  useEffect(() => {
    if (selectedDepartment) {
      loadSectionsForDepartment(selectedDepartment)
    }
  }, [selectedDepartment])

  // =========================================================================
  // Step 4 -> Step 5: Search / Continue Handler
  // =========================================================================
  const handleSearchContinue = async (e) => {
    if (e) e.preventDefault()
    if (!selectedDate || !selectedDepartment || !selectedSection) {
      toast.warning('Please select Date, Department, and Section.')
      return
    }

    setLoadingRoster(true)
    try {
      const res = await attendanceService.getManualRoster(
        selectedDate,
        selectedDepartment,
        selectedSection
      )
      const data = res.data
      setRosterData(data)

      // Initialize status & remarks map
      const initialMap = {}
      const remarksMap = {}
      if (data?.students) {
        data.students.forEach(s => {
          initialMap[s.studentId] = s.status || 'PRESENT'
          remarksMap[s.studentId] = s.remarks || ''
        })
      }
      setStudentStatusMap(initialMap)
      setStudentRemarksMap(remarksMap)

      // Open Manual Attendance Entry Screen
      setSelectionStep('ROSTER')

      if (data?.isExisting) {
        toast.info('Existing attendance records found for this session. You can review or update them.')
      } else {
        toast.success(`Loaded ${data?.students?.length || 0} students for attendance entry.`)
      }
    } catch (err) {
      console.error('Failed to load attendance roster', err)
      const msg = err.response?.data?.message || 'Access Denied: You are not authorised for this class.'
      toast.error(msg)
    } finally {
      setLoadingRoster(false)
    }
  }

  // =========================================================================
  // Step 5: Save Attendance Handler
  // =========================================================================
  const handleSaveAttendance = async () => {
    if (!rosterData || !rosterData.students || rosterData.students.length === 0) {
      toast.warning('No student records to save.')
      return
    }

    setSavingRoster(true)
    try {
      const records = rosterData.students.map(s => ({
        studentId: s.studentId,
        status: studentStatusMap[s.studentId] || 'PRESENT',
        remarks: studentRemarksMap[s.studentId] || ''
      }))

      const payload = {
        date: rosterData.date || selectedDate,
        department: rosterData.department || selectedDepartment,
        section: rosterData.section || selectedSection,
        subjectId: rosterData.subjectId,
        period: rosterData.period,
        records
      }

      const res = await attendanceService.saveManualRoster(payload)
      const updated = res.data
      setRosterData(updated)

      toast.success(`Attendance successfully saved for ${records.length} students!`)
    } catch (err) {
      console.error('Failed to save manual attendance', err)
      const msg = err.response?.data?.message || 'Failed to save attendance.'
      toast.error(msg)
    } finally {
      setSavingRoster(false)
    }
  }

  // Quick Batch Actions
  const handleMarkAll = (status) => {
    if (!rosterData?.students) return
    const updated = { ...studentStatusMap }
    rosterData.students.forEach(s => {
      updated[s.studentId] = status
    })
    setStudentStatusMap(updated)
    toast.info(`Marked all students as ${status}. Click 'Save Attendance' to submit.`)
  }

  // Individual Status Change
  const handleStudentStatusChange = (studentId, newStatus) => {
    setStudentStatusMap(prev => ({ ...prev, [studentId]: newStatus }))
  }

  // Individual Remarks Change
  const handleStudentRemarksChange = (studentId, remarks) => {
    setStudentRemarksMap(prev => ({ ...prev, [studentId]: remarks }))
  }

  // Live Counter Calculations
  const calculateLiveCounts = () => {
    if (!rosterData?.students) return { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
    let present = 0, absent = 0, late = 0, excused = 0
    rosterData.students.forEach(s => {
      const st = studentStatusMap[s.studentId] || 'PRESENT'
      if (st === 'PRESENT') present++
      else if (st === 'ABSENT') absent++
      else if (st === 'LATE') late++
      else if (st === 'EXCUSED') excused++
    })
    return { present, absent, late, excused, total: rosterData.students.length }
  }

  const liveCounts = calculateLiveCounts()

  // Filter students by search term
  const filteredStudents = (rosterData?.students || []).filter(s => {
    if (!studentSearchQuery.trim()) return true
    const q = studentSearchQuery.toLowerCase()
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    )
  })

  // Load History & Corrections
  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await attendanceService.getFacultyHistory()
      setHistory(res.data || [])
    } catch (err) {
      console.error('Failed to load history', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadCorrections = async () => {
    try {
      const res = await attendanceService.getPendingCorrections()
      const data = res.data || []
      setCorrections(data)
      onCorrectionUpdate?.(data.length)
    } catch (err) {
      console.error('Failed to load corrections', err)
    }
  }

  const handleReviewCorrection = async (correctionId, approve, remarks) => {
    setReviewingId(correctionId)
    try {
      await attendanceService.reviewCorrection(correctionId, approve, remarks)
      toast.success(approve ? 'Correction approved and updated.' : 'Correction request rejected.')
      loadCorrections()
    } catch {
      toast.error('Failed to process correction review.')
    } finally {
      setReviewingId(null)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') loadHistory()
    if (activeTab === 'corrections') loadCorrections()
  }, [activeTab])

  // Is Search / Continue button disabled?
  const isSearchDisabled = !selectedDate || !selectedDepartment || !selectedSection || loadingRoster

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
        borderRadius: 20,
        padding: '24px 28px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Manual Attendance Entry
            </span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>
            Faculty Attendance Management
          </h2>
          <p style={{ fontSize: 13, color: '#ccfbf1', margin: 0 }}>
            Mark student attendance period-wise with department, section, and timetable verification.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'rgba(0,0,0,0.2)',
          padding: 6,
          borderRadius: 12,
          backdropFilter: 'blur(8px)'
        }}>
          <button
            onClick={() => handleSwitchTab('manual')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              background: activeTab === 'manual' ? '#fff' : 'transparent',
              color: activeTab === 'manual' ? '#0f766e' : '#e2e8f0',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'manual' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <FileSpreadsheet size={16} /> Attendance Register
          </button>

          <button
            onClick={() => handleSwitchTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              background: activeTab === 'history' ? '#fff' : 'transparent',
              color: activeTab === 'history' ? '#0f766e' : '#e2e8f0',
              transition: 'all 0.2s ease'
            }}
          >
            <Clock size={16} /> Past Records Log
          </button>

          <button
            onClick={() => handleSwitchTab('corrections')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              background: activeTab === 'corrections' ? '#fff' : 'transparent',
              color: activeTab === 'corrections' ? '#0f766e' : '#e2e8f0',
              transition: 'all 0.2s ease'
            }}
          >
            <ShieldCheck size={16} /> Regularization / OD
            {corrections.length > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#fff',
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                fontWeight: 800
              }}>
                {corrections.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: MANUAL ATTENDANCE ENTRY (5-STEP FLOW)                        */}
      {/* =================================================================== */}
      {activeTab === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ------------------------------------------------------------- */}
          {/* SCREEN A: ATTENDANCE SELECTION SCREEN (STEPS 1 TO 4)          */}
          {/* ------------------------------------------------------------- */}
          {selectionStep === 'SELECTION' && (
            <div className="card" style={{
              padding: '32px 36px',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              background: '#fff'
            }}>
              <div style={{
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: 16,
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                    Select Attendance Details
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                    Please select the Date, Department, and Section to load the authorised class roster.
                  </p>
                </div>
                <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                  Step 1 of 2: Class Selection
                </span>
              </div>

              <form onSubmit={handleSearchContinue}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 24,
                  marginBottom: 32
                }}>
                  {/* STEP 1: DATE SELECTION */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: 8
                    }}>
                      Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        className="form-input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          height: 44,
                          fontSize: 14,
                          fontWeight: 600,
                          borderRadius: 10,
                          borderColor: '#cbd5e1'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                      Selected: {formatDate(selectedDate)}
                    </span>
                  </div>

                  {/* STEP 2: DEPARTMENT SELECTION */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: 8
                    }}>
                      Department <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      required
                      disabled={loadingDepartments}
                      style={{
                        width: '100%',
                        height: 44,
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 10,
                        borderColor: '#cbd5e1'
                      }}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.id || d.code} value={d.name || d.code}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                      Only departments authorised for your faculty profile
                    </span>
                  </div>

                  {/* STEP 3: SECTION SELECTION */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: 8
                    }}>
                      Section <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      required
                      disabled={loadingSections || !selectedDepartment}
                      style={{
                        width: '100%',
                        height: 44,
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 10,
                        borderColor: '#cbd5e1'
                      }}
                    >
                      <option value="">-- Select Section --</option>
                      {sections.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                      {loadingSections ? 'Loading sections…' : 'Valid sections belonging to the selected department'}
                    </span>
                  </div>
                </div>

                {/* STEP 4: SEARCH / CONTINUE BUTTON */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 16,
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 20
                }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    {isSearchDisabled && !loadingRoster
                      ? 'Select Date, Department, and Section to continue.'
                      : 'All required fields selected.'}
                  </span>
                  <button
                    type="submit"
                    disabled={isSearchDisabled}
                    className="btn btn-primary"
                    style={{
                      padding: '12px 28px',
                      fontSize: 14,
                      fontWeight: 700,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: isSearchDisabled ? 0.6 : 1,
                      cursor: isSearchDisabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loadingRoster ? (
                      <>
                        <Spinner size="sm" /> Validating &amp; Loading…
                      </>
                    ) : (
                      <>
                        Search / Continue <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SCREEN B: MANUAL ATTENDANCE ENTRY SCREEN (STEP 5)              */}
          {/* ------------------------------------------------------------- */}
          {selectionStep === 'ROSTER' && rosterData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Header Information Card */}
              <div className="card" style={{
                padding: '24px 28px',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                background: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 16,
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: 16,
                  marginBottom: 16
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span className="badge badge-success" style={{ fontSize: 11, fontWeight: 700 }}>
                        Step 2 of 2: Manual Attendance Entry
                      </span>
                      {rosterData.isExisting ? (
                        <span className="badge badge-warning" style={{ fontSize: 11, fontWeight: 700 }}>
                          Existing Records Loaded (Update Mode)
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: 11, fontWeight: 700 }}>
                          New Attendance Session
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {rosterData.subjectName} ({rosterData.subjectCode})
                    </h3>
                  </div>

                  <button
                    onClick={() => setSelectionStep('SELECTION')}
                    className="btn btn-outline btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 8,
                      fontWeight: 700
                    }}
                  >
                    <ArrowLeft size={14} /> Change Selection
                  </button>
                </div>

                {/* Header Information Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #edf2f7'
                }}>
                  <div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Date</span>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {formatDate(rosterData.date)}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Department</span>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {rosterData.department}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Section</span>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#0f766e' }}>
                      {rosterData.section}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Faculty</span>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {rosterData.facultyName}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Period</span>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                      Period {rosterData.period}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Room</span>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {rosterData.classroom || 'C-204'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Table & Roster Controls */}
              <div className="card" style={{
                padding: '24px 28px',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                background: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
              }}>
                {/* Roster Toolbar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginBottom: 20
                }}>
                  {/* Search Student Filter */}
                  <div style={{ position: 'relative', width: 280 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search Roll No. or Student Name…"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36, height: 40, fontSize: 13, borderRadius: 8 }}
                    />
                  </div>

                  {/* Quick Batch Marking Buttons */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginRight: 4 }}>
                      Batch Actions:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMarkAll('PRESENT')}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#16a34a', borderColor: '#bbf7d0', fontWeight: 700 }}
                    >
                      <Check size={14} /> Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAll('ABSENT')}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#dc2626', borderColor: '#fecaca', fontWeight: 700 }}
                    >
                      <X size={14} /> Mark All Absent
                    </button>
                  </div>
                </div>

                {/* Student Table */}
                <div className="table-container" style={{ borderRadius: 10, border: '1px solid #edf2f7' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ width: 60, textAlign: 'center' }}>#</th>
                        <th style={{ width: 180 }}>Roll Number</th>
                        <th>Student Name</th>
                        <th style={{ width: 180 }}>Status</th>
                        <th style={{ width: 220 }}>Remarks (Optional)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => {
                        const currentStatus = studentStatusMap[s.studentId] || 'PRESENT'
                        return (
                          <tr key={s.studentId} style={{
                            background: currentStatus === 'ABSENT' ? '#fff5f5' : currentStatus === 'LATE' ? '#fffbeb' : '#fff'
                          }}>
                            <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                              {idx + 1}
                            </td>

                            <td>
                              <span style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: 13,
                                color: '#1e293b',
                                background: '#f1f5f9',
                                padding: '3px 8px',
                                borderRadius: 6
                              }}>
                                {s.rollNumber || '—'}
                              </span>
                            </td>

                            <td>
                              <strong style={{ fontSize: 14, color: '#0f172a' }}>{s.name}</strong>
                              <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>
                                {s.department} &bull; {s.section}
                              </span>
                            </td>

                            <td>
                              <select
                                className="form-select"
                                value={currentStatus}
                                onChange={(e) => handleStudentStatusChange(s.studentId, e.target.value)}
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  height: 36,
                                  borderRadius: 8,
                                  borderColor:
                                    currentStatus === 'PRESENT' ? '#86efac' :
                                    currentStatus === 'ABSENT' ? '#fca5a5' :
                                    currentStatus === 'LATE' ? '#fde047' : '#93c5fd',
                                  background:
                                    currentStatus === 'PRESENT' ? '#f0fdf4' :
                                    currentStatus === 'ABSENT' ? '#fef2f2' :
                                    currentStatus === 'LATE' ? '#fefce8' : '#eff6ff',
                                  color:
                                    currentStatus === 'PRESENT' ? '#166534' :
                                    currentStatus === 'ABSENT' ? '#991b1b' :
                                    currentStatus === 'LATE' ? '#854d0e' : '#1e40af'
                                }}
                              >
                                <option value="PRESENT">PRESENT</option>
                                <option value="ABSENT">ABSENT</option>
                                <option value="LATE">LATE</option>
                                <option value="EXCUSED">EXCUSED</option>
                              </select>
                            </td>

                            <td>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Add note…"
                                value={studentRemarksMap[s.studentId] || ''}
                                onChange={(e) => handleStudentRemarksChange(s.studentId, e.target.value)}
                                style={{ height: 34, fontSize: 12, borderRadius: 6 }}
                              />
                            </td>
                          </tr>
                        )
                      })}

                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                            <AlertCircle size={28} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>No students found matching your criteria.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Bar: Live Counters and Save Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: '1px solid #f1f5f9'
                }}>
                  {/* Summary Counters */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#166534'
                    }}>
                      <CheckCircle size={15} /> Present: {liveCounts.present}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#991b1b'
                    }}>
                      <XCircle size={15} /> Absent: {liveCounts.absent}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fefce8',
                      border: '1px solid #fef08a',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#854d0e'
                    }}>
                      <Clock size={15} /> Late: {liveCounts.late}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1e40af'
                    }}>
                      <ShieldCheck size={15} /> Excused: {liveCounts.excused}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#475569'
                    }}>
                      <Users size={15} /> Total: {liveCounts.total}
                    </div>
                  </div>

                  {/* Save Attendance Button */}
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={savingRoster || rosterData.students.length === 0}
                    className="btn btn-primary"
                    style={{
                      padding: '12px 32px',
                      fontSize: 14,
                      fontWeight: 800,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
                    }}
                  >
                    {savingRoster ? (
                      <>
                        <Spinner size="sm" /> Saving Attendance…
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Attendance
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: PAST RECORDS & AUDIT HISTORY                                 */}
      {/* =================================================================== */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: '24px 28px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Past Attendance Sessions &amp; Records Log
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Audit register of past manual attendance submissions and marked sessions.
              </p>
            </div>
            <button onClick={loadHistory} className="btn btn-outline btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingHistory ? (
            <TableSkeleton rows={4} cols={5} />
          ) : history.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject / Paper</th>
                    <th>Section</th>
                    <th>Period</th>
                    <th>Students Marked</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td><strong>{formatDate(h.date)}</strong></td>
                      <td>
                        <strong>{h.subjectName}</strong>
                        <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>{h.subjectCode}</span>
                      </td>
                      <td><span className="badge badge-neutral">{h.section}</span></td>
                      <td>Period {h.period || 1}</td>
                      <td>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>{h.presentCount} Present</span> / {h.totalStudents || 0}
                      </td>
                      <td>
                        <span className="badge badge-success">RECORDED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
              <Clock size={36} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No past attendance records found.</p>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: REGULARIZATION & ON-DUTY (OD) CORRECTIONS                     */}
      {/* =================================================================== */}
      {activeTab === 'corrections' && (
        <div className="card" style={{ padding: '24px 28px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Student Attendance Regularization &amp; OD Requests
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Review and approve student on-duty or medical regularization requests.
              </p>
            </div>
            <button onClick={loadCorrections} className="btn btn-outline btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {corrections.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Previous</th>
                    <th>Requested</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.studentName}</strong>
                        <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>{c.rollNumber}</span>
                      </td>
                      <td>{c.subjectName || c.courseName}</td>
                      <td>{formatDate(c.attendanceDate)}</td>
                      <td><span className="badge badge-danger">{c.previousStatus}</span></td>
                      <td><span className="badge badge-success">{c.requestedStatus}</span></td>
                      <td style={{ maxWidth: 220, fontSize: 12, color: '#475569' }}>{c.reason}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => handleReviewCorrection(c.id, true, 'Approved by course faculty')}
                            disabled={reviewingId === c.id}
                            className="btn btn-sm btn-primary"
                            style={{ background: '#16a34a', borderColor: '#16a34a' }}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleReviewCorrection(c.id, false, 'Rejected by faculty')}
                            disabled={reviewingId === c.id}
                            className="btn btn-sm btn-outline"
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
              <ShieldCheck size={36} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No pending regularization or OD requests.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
