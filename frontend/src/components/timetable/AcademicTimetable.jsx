import { useState, useEffect } from 'react'
import {
  Calendar, Clock, BookOpen, Users, MapPin, Printer,
  Sparkles, CheckCircle2, ArrowRight, ClipboardCheck,
  FileSpreadsheet, Filter, Search, Award, AlertCircle
} from 'lucide-react'
import { timetableService } from '../../services/api'
import { toast } from '../Toast'
import { TableSkeleton } from '../Loading'
import { useNavigate } from 'react-router-dom'
import AuLogo from '../common/AuLogo'

// Standard Indian University Academic Period Schedule
const PERIOD_SLOTS = [
  { period: 1, name: 'Period 1', start: '09:00', end: '09:50', isBreak: false },
  { period: 2, name: 'Period 2', start: '09:50', end: '10:40', isBreak: false },
  { period: 0, name: 'Tea Break', start: '10:40', end: '10:55', isBreak: true },
  { period: 3, name: 'Period 3', start: '10:55', end: '11:45', isBreak: false },
  { period: 4, name: 'Period 4', start: '11:45', end: '12:35', isBreak: false },
  { period: -1, name: 'Lunch Break', start: '12:35', end: '13:25', isBreak: true },
  { period: 5, name: 'Period 5', start: '13:25', end: '14:15', isBreak: false },
  { period: 6, name: 'Period 6', start: '14:15', end: '15:05', isBreak: false },
  { period: 7, name: 'Period 7 / Lab', start: '15:05', end: '15:55', isBreak: false }
]

const WORKING_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

// Helper to convert 24hr time to standard Indian format (e.g. 09:50 AM)
const formatIndianTime = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  let h = parseInt(parts[0], 10)
  const m = parts[1] || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h < 10 ? '0' + h : h}:${m} ${ampm}`
}

export default function AcademicTimetable({ role = 'STUDENT', user }) {
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'daily' | 'directory'
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    const today = days[new Date().getDay()]
    return today === 'SUNDAY' ? 'MONDAY' : today
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [liveSlot, setLiveSlot] = useState(null)

  const [selectedSemester, setSelectedSemester] = useState('ALL')
  const [selectedSection, setSelectedSection] = useState('ALL')

  // Load timetable based on user role
  const loadTimetable = async () => {
    setLoading(true)
    try {
      let res
      if (role === 'FACULTY') {
        res = await timetableService.getFacultyTimetable()
      } else if (role === 'ADMIN') {
        res = await timetableService.getAll()
      } else {
        res = await timetableService.getMyTimetable()
      }
      setSchedule(res.data || [])
    } catch {
      toast.error('Could not load academic time table. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTimetable()
  }, [role])

  // Compute Current Live Period based on real Indian Standard Time
  useEffect(() => {
    const checkLivePeriod = () => {
      const now = new Date()
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      const currentDay = days[now.getDay()]
      const curH = now.getHours()
      const curM = now.getMinutes()
      const curMinutes = curH * 60 + curM

      // Find if any scheduled class matches current day & period window
      const todaysClasses = schedule.filter(s => s.dayOfWeek === currentDay)
      for (const item of todaysClasses) {
        if (!item.startTime || !item.endTime) continue
        const [sH, sM] = item.startTime.split(':').map(Number)
        const [eH, eM] = item.endTime.split(':').map(Number)
        const startMin = sH * 60 + (sM || 0)
        const endMin = eH * 60 + (eM || 0)

        if (curMinutes >= startMin && curMinutes < endMin) {
          setLiveSlot(item)
          return
        }
      }
      setLiveSlot(null)
    }

    checkLivePeriod()
    const interval = setInterval(checkLivePeriod, 30000)
    return () => clearInterval(interval)
  }, [schedule])

  // Extract distinct subjects and faculty for the Official Subject Legend / Directory
  const subjectDirectory = []
  const seenCodes = new Set()
  schedule.forEach(s => {
    const code = s.subjectCode || s.courseCode || 'SUB'
    if (!seenCodes.has(code)) {
      seenCodes.add(code)
      subjectDirectory.push({
        code,
        name: s.subjectName || s.courseName || 'Core Subject',
        faculty: s.facultyName || 'Staff Member',
        room: s.classroom || 'Lecture Hall',
        type: code.includes('LAB') || (s.subjectName || '').toLowerCase().includes('lab') ? 'Practical Lab' : 'Theory Paper'
      })
    }
  })

  // Extract distinct semesters and sections available in schedule
  const availableSemesters = Array.from(new Set(schedule.map(s => s.semester).filter(Boolean))).sort((a, b) => a - b)
  const availableSections = Array.from(new Set(schedule.map(s => s.section).filter(Boolean))).sort()

  // Filter schedule by search and semester/section
  const filteredSchedule = schedule.filter(s => {
    if (selectedSemester !== 'ALL' && String(s.semester) !== String(selectedSemester)) return false
    if (selectedSection !== 'ALL' && String(s.section) !== String(selectedSection)) return false
    const q = searchTerm.toLowerCase()
    return (
      (s.subjectName || '').toLowerCase().includes(q) ||
      (s.courseName || '').toLowerCase().includes(q) ||
      (s.subjectCode || '').toLowerCase().includes(q) ||
      (s.facultyName || '').toLowerCase().includes(q) ||
      (s.classroom || '').toLowerCase().includes(q)
    )
  })

  // Group classes by day and period for the Master Grid
  const gridMap = {}
  WORKING_DAYS.forEach(d => {
    gridMap[d] = {}
  })
  filteredSchedule.forEach(item => {
    const day = (item.dayOfWeek || '').toUpperCase()
    if (gridMap[day]) {
      // Find matching period slot (1-7) or map based on hour
      let p = item.period
      if (!p && item.startTime) {
        const h = parseInt(item.startTime.split(':')[0], 10)
        if (h <= 9) p = 1
        else if (h === 10) p = 2
        else if (h === 11) p = 3
        else if (h === 12) p = 4
        else if (h === 13 || h === 14) p = 5
        else if (h === 15) p = 6
        else p = 7
      }
      gridMap[day][p] = item
    }
  })

  // Print Time Table handler
  const handlePrint = () => {
    window.print()
  }

  // First sample record to extract Department, Programme, Semester, Section
  const sample = schedule[0] || {}
  const departmentTitle = sample.departmentName || user?.department || 'Department of Computer Science & Engineering'
  const programmeTitle = sample.programmeName || sample.courseName || 'B.Tech (Four Year Degree Programme)'
  const semSecText = `Semester ${sample.semester || user?.semester || 4} • Section ${sample.section || user?.section || 'A'}`
  const academicYearText = sample.academicYear || '2025–2026'

  return (
    <div className="academic-timetable-root" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Official Institutional Time Table Header ────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f766e 100%)',
        borderRadius: 20,
        padding: '26px 30px',
        color: '#fff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <AuLogo size={52} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                background: '#d99b26',
                color: '#0f172a',
                fontSize: 10,
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Aditya University
              </span>
              <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                Autonomous Institution &bull; Accredited with NAAC 'A++' Grade
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
              Academic Class Time Table — {academicYearText}
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
              {departmentTitle} &bull; {programmeTitle} &bull; <strong>{semSecText}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handlePrint}
            className="btn btn-ghost"
            style={{ color: '#fff', background: 'rgba(255,255,255,0.12)', gap: 8, fontWeight: 700 }}
            title="Print official academic time table"
          >
            <Printer size={16} /> Print / Export Time Table
          </button>
        </div>
      </div>

      {/* ── Live Ongoing Period Callout Banner ────────────────────────── */}
      {liveSlot ? (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '2px solid #86efac',
          borderRadius: 16,
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 4px 14px rgba(22, 101, 52, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: '#16a34a',
              boxShadow: '0 0 10px #16a34a',
              animation: 'pulse 1.8s infinite'
            }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4 }}>
                  LIVE ONGOING CLASS NOW
                </span>
                <span style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>
                  Period {liveSlot.period || 1} ({formatIndianTime(liveSlot.startTime)} – {formatIndianTime(liveSlot.endTime)})
                </span>
              </div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#14532d' }}>
                {liveSlot.subjectName || liveSlot.courseName} ({liveSlot.subjectCode || 'CS301'})
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#166534' }}>
                Staff In-Charge: <strong>{liveSlot.facultyName || 'Course Faculty'}</strong> &bull; Hall: <strong>{liveSlot.classroom || 'C-204'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {role === 'FACULTY' ? (
              <button
                onClick={() => navigate('/faculty/attendance')}
                className="btn"
                style={{ background: '#0f766e', color: '#fff', fontWeight: 800, fontSize: 12, gap: 6 }}
              >
                <ClipboardCheck size={15} /> Take Class Attendance
              </button>
            ) : (
              <button
                onClick={() => navigate('/student/attendance')}
                className="btn"
                style={{ background: '#0f766e', color: '#fff', fontWeight: 800, fontSize: 12, gap: 6 }}
              >
                <ClipboardCheck size={15} /> View Attendance Register
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={18} color="#64748b" />
            <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
              Working Hours: <strong>09:00 AM to 03:55 PM</strong> &bull; Tea Break: 10:40 AM &bull; Lunch Recess: 12:35 PM
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', background: '#f0fdf4', padding: '3px 10px', borderRadius: 20 }}>
            Aditya University Academic Regulations
          </span>
        </div>
      )}

      {/* ── View Mode Switcher & Search Bar ──────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '10px 16px'
      }}>
        {/* View Mode Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'grid', label: 'Weekly Master Matrix', icon: Calendar },
            { id: 'daily', label: 'Day-by-Day Schedule', icon: Clock },
            { id: 'directory', label: 'Staff & Subject Legend', icon: BookOpen }
          ].map(v => {
            const Icon = v.icon
            const isActive = viewMode === v.id
            return (
              <button
                key={v.id}
                id={`timetable-tab-${v.id}`}
                onClick={() => setViewMode(v.id)}
                className="btn btn-sm"
                style={{
                  background: isActive ? '#0f172a' : '#f8fafc',
                  color: isActive ? '#fff' : '#475569',
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 12,
                  gap: 6
                }}
              >
                <Icon size={14} color={isActive ? '#d99b26' : '#64748b'} />
                <span>{v.label}</span>
              </button>
            )
          })}
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {role === 'ADMIN' && (
            <>
              {availableSemesters.length > 0 && (
                <select
                  className="form-select"
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value)}
                  style={{ height: 34, fontSize: 12, padding: '4px 10px', minWidth: 120 }}
                >
                  <option value="ALL">All Semesters</option>
                  {availableSemesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              )}
              {availableSections.length > 0 && (
                <select
                  className="form-select"
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  style={{ height: 34, fontSize: 12, padding: '4px 10px', minWidth: 110 }}
                >
                  <option value="ALL">All Sections</option>
                  {availableSections.map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              )}
            </>
          )}

          {/* Search */}
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            <input
              className="form-input"
              placeholder="Search paper, code or staff..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 30, fontSize: 12, height: 34 }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: WEEKLY MASTER MATRIX (The Standard Indian College Time Table)     */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="card" style={{ padding: 20, overflowX: 'auto' }}>
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Standard Weekly Time Table Matrix
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              6 Working Days (Monday through Saturday) &bull; 7 Academic Periods
            </span>
          </div>

          {loading ? (
            <TableSkeleton rows={7} cols={8} />
          ) : (
            <table className="academic-master-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              textAlign: 'center'
            }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#fff' }}>
                  <th style={{ padding: '12px 10px', width: 110, border: '1px solid #334155' }}>
                    Day / Period
                  </th>
                  {PERIOD_SLOTS.map((slot, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #334155',
                        background: slot.isBreak ? '#1e293b' : '#0f172a',
                        color: slot.isBreak ? '#d99b26' : '#fff',
                        width: slot.isBreak ? 70 : 'auto',
                        minWidth: slot.isBreak ? 70 : 130
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: slot.isBreak ? 11 : 12 }}>
                        {slot.name}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.8, fontFamily: 'monospace', marginTop: 2 }}>
                        {slot.start} – {slot.end}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WORKING_DAYS.map(day => {
                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() === day
                  return (
                    <tr
                      key={day}
                      style={{
                        background: isToday ? '#fffbeb' : '#ffffff',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      {/* Day Label Header Column */}
                      <td style={{
                        padding: 12,
                        fontWeight: 900,
                        color: isToday ? '#b45309' : '#0f172a',
                        border: '1px solid #e2e8f0',
                        background: isToday ? '#fef3c7' : '#f8fafc',
                        position: 'relative'
                      }}>
                        {day.slice(0, 3)}
                        {isToday && (
                          <div style={{
                            fontSize: 9,
                            background: '#d97706',
                            color: '#fff',
                            borderRadius: 4,
                            padding: '1px 4px',
                            fontWeight: 800,
                            marginTop: 4
                          }}>
                            TODAY
                          </div>
                        )}
                      </td>

                      {/* Period Cells */}
                      {PERIOD_SLOTS.map((slot, sIdx) => {
                        if (slot.isBreak) {
                          // Tea or Lunch Break Column
                          return (
                            <td
                              key={sIdx}
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                color: '#94a3b8',
                                fontSize: 11,
                                fontWeight: 800,
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                padding: '8px 4px'
                              }}
                            >
                              {slot.name}
                            </td>
                          )
                        }

                        // Normal Class Period
                        const entry = gridMap[day]?.[slot.period]
                        if (entry) {
                          const isLab = (entry.subjectCode || '').includes('LAB') || (entry.classroom || '').includes('Lab')
                          return (
                            <td
                              key={sIdx}
                              style={{
                                padding: 10,
                                border: '1px solid #e2e8f0',
                                background: isLab ? '#f0fdf4' : (isToday ? '#fffdf7' : '#ffffff'),
                                verticalAlign: 'top',
                                textAlign: 'left'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{
                                  background: isLab ? '#dcfce7' : '#eff6ff',
                                  color: isLab ? '#15803d' : '#1d4ed8',
                                  fontFamily: 'monospace',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: 4
                                }}>
                                  {entry.subjectCode || 'SUB'}
                                </span>
                                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                                  {entry.classroom}
                                </span>
                              </div>

                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 12, lineHeight: 1.3, marginBottom: 4 }}>
                                {entry.subjectName || entry.courseName}
                              </div>

                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                👤 {entry.facultyName || 'Staff In-Charge'}
                              </div>
                            </td>
                          )
                        }

                        // Free / Library / Study Slot
                        return (
                          <td
                            key={sIdx}
                            style={{
                              padding: 8,
                              border: '1px solid #e2e8f0',
                              color: '#cbd5e1',
                              fontSize: 11,
                              background: '#fafafa'
                            }}
                          >
                            <span style={{ fontStyle: 'italic' }}>— Library / Study —</span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DAY-BY-DAY SCHEDULE TIMELINE CARDS                               */}
      {/* ========================================================================= */}
      {viewMode === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Day Selector Buttons */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {WORKING_DAYS.map(day => {
              const count = schedule.filter(s => s.dayOfWeek === day).length
              const isSelected = selectedDay === day
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="btn"
                  style={{
                    background: isSelected ? '#0f172a' : '#ffffff',
                    color: isSelected ? '#fff' : '#0f172a',
                    border: isSelected ? 'none' : '1px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '10px 18px',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span>{day}</span>
                  <span style={{
                    background: isSelected ? '#d99b26' : '#f1f5f9',
                    color: isSelected ? '#0f172a' : '#64748b',
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: 10
                  }}>
                    {count} {count === 1 ? 'Period' : 'Periods'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Cards for Selected Day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {schedule.filter(s => s.dayOfWeek === selectedDay).length > 0 ? (
              schedule
                .filter(s => s.dayOfWeek === selectedDay)
                .sort((a, b) => (a.period || 1) - (b.period || 1))
                .map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="card card-hover"
                    style={{
                      borderLeft: '5px solid #0f766e',
                      padding: 20,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 16
                    }}
                  >
                    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                      <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                        background: '#f0fdf4',
                        color: '#0f766e',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900
                      }}>
                        <span style={{ fontSize: 9, textTransform: 'uppercase' }}>Period</span>
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{item.period || idx + 1}</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>
                            {item.subjectCode || 'CS301'}
                          </span>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                            {formatIndianTime(item.startTime)} – {formatIndianTime(item.endTime)}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                          {item.subjectName || item.courseName}
                        </h4>
                        <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 14 }}>
                          <span>👤 Staff In-Charge: <strong>{item.facultyName || 'Staff Member'}</strong></span>
                          <span>📍 Hall: <strong>{item.classroom}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {role === 'FACULTY' ? (
                        <button
                          onClick={() => navigate('/faculty/attendance')}
                          className="btn btn-outline btn-sm"
                          style={{ fontWeight: 700 }}
                        >
                          <ClipboardCheck size={14} /> Mark Attendance
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/student/attendance')}
                          className="btn btn-outline btn-sm"
                          style={{ fontWeight: 700 }}
                        >
                          <ClipboardCheck size={14} /> View Attendance
                        </button>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <Calendar size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                <h4 style={{ color: '#0f172a', margin: '0 0 4px' }}>No Classes Scheduled on {selectedDay}</h4>
                <p style={{ fontSize: 13, margin: 0 }}>This is reserved for self-study, lab work, or seminar activities.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: STAFF & SUBJECT LEGEND DIRECTORY                                  */}
      {/* ========================================================================= */}
      {viewMode === 'directory' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="section-title">Faculty In-Charge &amp; Subject Directory</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Official allocation of teaching faculty for {semSecText}
              </p>
            </div>
            <span className="badge badge-primary">{subjectDirectory.length} Allotted Subjects</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Paper Code</th>
                  <th>Subject / Paper Title</th>
                  <th>Category</th>
                  <th>Faculty In-Charge</th>
                  <th>Lecture Hall / Lab</th>
                </tr>
              </thead>
              <tbody>
                {subjectDirectory.map((sub, idx) => (
                  <tr key={sub.code}>
                    <td><strong>{idx + 1}</strong></td>
                    <td><span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{sub.code}</span></td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{sub.name}</td>
                    <td>
                      <span className={`badge ${sub.type.includes('Lab') ? 'badge-success' : 'badge-primary'}`}>
                        {sub.type}
                      </span>
                    </td>
                    <td>
                      <strong>{sub.faculty}</strong>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Department Faculty Member</div>
                    </td>
                    <td>{sub.room}</td>
                  </tr>
                ))}
                {subjectDirectory.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
                      No subject allocations available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Departmental Authority Endorsement Block */}
          <div style={{
            marginTop: 24,
            padding: 16,
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                Class In-Charge / Mentor
              </span>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Dr. Priya Sharma, Associate Professor
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                Head of Department (HOD)
              </span>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Dr. S. K. Narayana, Professor &amp; HOD
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                Dean &amp; Principal
              </span>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Dr. V. Ramanathan, Principal
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Official Print Media Query Styles ──────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .academic-timetable-root, .academic-timetable-root * {
            visibility: visible;
          }
          .academic-timetable-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .btn, input, .header-right {
            display: none !important;
          }
          .academic-master-table th, .academic-master-table td {
            border: 1px solid #000 !important;
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  )
}
