import { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
  Printer, Download, Search, Clock, MapPin, Users,
  AlertCircle, CheckCircle, Edit, Trash2, X, Award, BookOpen,
  Sparkles, GraduationCap, Sun, FileText, ChevronDown, Check
} from 'lucide-react'
import { academicCalendarService } from '../../services/api'
import { toast } from '../Toast'
import { Modal, ConfirmModal } from '../Modal'
import { TableSkeleton } from '../Loading'
import { formatDate } from '../../utils/helpers'
import AuLogo from '../common/AuLogo'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Academic Year 2026-2027 Cycle (July 2026 to June 2027)
const ACADEMIC_CYCLE = [
  { year: 2026, month: 6, label: 'Jul' },
  { year: 2026, month: 7, label: 'Aug' },
  { year: 2026, month: 8, label: 'Sep' },
  { year: 2026, month: 9, label: 'Oct' },
  { year: 2026, month: 10, label: 'Nov' },
  { year: 2026, month: 11, label: 'Dec' },
  { year: 2027, month: 0, label: 'Jan' },
  { year: 2027, month: 1, label: 'Feb' },
  { year: 2027, month: 2, label: 'Mar' },
  { year: 2027, month: 3, label: 'Apr' },
  { year: 2027, month: 4, label: 'May' },
  { year: 2027, month: 5, label: 'Jun' }
]

const CATEGORIES = [
  {
    id: 'ALL',
    label: 'All Categories',
    color: '#0f172a',
    bg: '#f8fafc',
    border: '#cbd5e1',
    dot: '#475569',
    icon: CalendarIcon
  },
  {
    id: 'ACADEMIC_MILESTONE',
    label: 'Academic Milestones',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    dot: '#2563eb',
    icon: GraduationCap
  },
  {
    id: 'EXAMINATION',
    label: 'Examinations (CIE / SEE)',
    color: '#7e22ce',
    bg: '#faf5ff',
    border: '#e9d5ff',
    dot: '#9333ea',
    icon: Award
  },
  {
    id: 'HOLIDAY',
    label: 'University Holidays',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    dot: '#16a34a',
    icon: Sun
  },
  {
    id: 'DEADLINE',
    label: 'Deadlines & Submissions',
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#fecaca',
    dot: '#dc2626',
    icon: AlertCircle
  },
  {
    id: 'CAMPUS_EVENT',
    label: 'Campus Events & Symposia',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    dot: '#d97706',
    icon: Sparkles
  },
  {
    id: 'GENERAL',
    label: 'General Notices',
    color: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
    dot: '#64748b',
    icon: FileText
  }
]

// ICS Calendar file download helper
function exportToIcs(eventOrList, filename = 'aditya_academic_calendar.ics') {
  const events = Array.isArray(eventOrList) ? eventOrList : [eventOrList]
  if (events.length === 0) return

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aditya University//Academic Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Aditya University Academic Calendar',
    'X-WR-TIMEZONE:Asia/Kolkata'
  ]

  events.forEach(e => {
    const sDate = (e.startDate || '').replace(/-/g, '')
    const eDateObj = e.endDate ? new Date(e.endDate) : new Date(e.startDate)
    eDateObj.setDate(eDateObj.getDate() + 1)
    const eDate = eDateObj.toISOString().split('T')[0].replace(/-/g, '')

    lines.push(
      'BEGIN:VEVENT',
      `UID:au-event-${e.id || Math.random()}@aditya.ac.in`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${sDate}`,
      `DTEND;VALUE=DATE:${eDate}`,
      `SUMMARY:${(e.title || 'Academic Event').replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(e.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
      `LOCATION:${(e.venue || 'Aditya University Campus').replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    )
  })

  lines.push('END:VCALENDAR')
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AcademicCalendar({ role = 'STUDENT' }) {
  const isAdmin = role === 'ADMIN'

  // View & Date State
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' | 'agenda' | 'roadmap'
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [audienceFilter, setAudienceFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Modals & Details
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [dayPopover, setDayPopover] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'ACADEMIC_MILESTONE',
    startDate: '',
    endDate: '',
    startTime: '09:30',
    endTime: '16:30',
    venue: 'Aditya University Campus',
    targetAudience: 'ALL',
    isHoliday: false
  })
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Load calendar events
  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await academicCalendarService.getAll()
      setEvents(res.data || [])
    } catch {
      toast.error('Unable to load academic calendar events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const jumpToMonth = (yearVal, monthVal) => {
    setCurrentDate(new Date(yearVal, monthVal, 1))
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Build calendar matrix (42 cells: 6 rows x 7 cols)
  const calendarCells = useMemo(() => {
    const cells = []

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const dateObj = new Date(year, month - 1, dayNum)
      cells.push({
        date: dateObj,
        dayNum,
        isCurrentMonth: false,
        dateString: dateObj.toISOString().split('T')[0]
      })
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateObj = new Date(year, month, dayNum)
      cells.push({
        date: dateObj,
        dayNum,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      })
    }

    const remaining = 42 - cells.length
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const dateObj = new Date(year, month + 1, dayNum)
      cells.push({
        date: dateObj,
        dayNum,
        isCurrentMonth: false,
        dateString: dateObj.toISOString().split('T')[0]
      })
    }

    return cells
  }, [year, month, firstDayOfMonth, daysInMonth, daysInPrevMonth])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedCategory !== 'ALL' && e.eventType !== selectedCategory) return false
      if (audienceFilter !== 'ALL' && e.targetAudience !== 'ALL' && e.targetAudience !== audienceFilter) return false

      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const titleMatch = e.title?.toLowerCase().includes(q)
        const venueMatch = e.venue?.toLowerCase().includes(q)
        const descMatch = e.description?.toLowerCase().includes(q)
        if (!titleMatch && !venueMatch && !descMatch) return false
      }
      return true
    })
  }, [events, selectedCategory, audienceFilter, searchTerm])

  // Map events to date strings
  const eventsByDate = useMemo(() => {
    const map = {}
    filteredEvents.forEach(e => {
      const start = e.startDate
      const end = e.endDate || e.startDate

      const cur = new Date(start)
      const last = new Date(end)
      while (cur <= last) {
        const dStr = cur.toISOString().split('T')[0]
        if (!map[dStr]) map[dStr] = []
        map[dStr].push(e)
        cur.setDate(cur.getDate() + 1)
      }
    })
    return map
  }, [filteredEvents])

  // Count events in active cycle months
  const eventCountByMonth = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!e.startDate) return
      const [y, m] = e.startDate.split('-').map(Number)
      const key = `${y}-${m - 1}`
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [events])

  // KPI calculations
  const kpiData = useMemo(() => {
    const total = events.length
    const exams = events.filter(e => e.eventType === 'EXAMINATION').length
    const holidays = events.filter(e => e.isHoliday || e.eventType === 'HOLIDAY').length

    const upcoming = events
      .filter(e => e.startDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]

    let countdownText = 'No upcoming event'
    if (upcoming) {
      const today = new Date(todayStr)
      const target = new Date(upcoming.startDate)
      const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) countdownText = 'Today'
      else if (diffDays === 1) countdownText = 'Tomorrow'
      else countdownText = `In ${diffDays}d`
    }

    return { total, exams, holidays, upcoming, countdownText }
  }, [events, todayStr])

  const getCategoryMeta = (type) => {
    return CATEGORIES.find(c => c.id === type) || CATEGORIES[CATEGORIES.length - 1]
  }

  // Handle Form open
  const handleOpenAdd = (dateStr) => {
    const defaultDate = dateStr || new Date().toISOString().split('T')[0]
    setEditingId(null)
    setForm({
      title: '',
      description: '',
      eventType: 'ACADEMIC_MILESTONE',
      startDate: defaultDate,
      endDate: defaultDate,
      startTime: '09:30',
      endTime: '16:30',
      venue: 'Aditya University Campus',
      targetAudience: 'ALL',
      isHoliday: false
    })
    setShowModal(true)
  }

  const handleOpenEdit = (e) => {
    setEditingId(e.id)
    setForm({
      title: e.title || '',
      description: e.description || '',
      eventType: e.eventType || 'ACADEMIC_MILESTONE',
      startDate: e.startDate || '',
      endDate: e.endDate || e.startDate || '',
      startTime: e.startTime || '',
      endTime: e.endTime || '',
      venue: e.venue || '',
      targetAudience: e.targetAudience || 'ALL',
      isHoliday: e.isHoliday || false
    })
    setSelectedEvent(null)
    setShowModal(true)
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!form.title.trim()) {
      toast.error('Event title is required.')
      return
    }
    if (!form.startDate) {
      toast.error('Start date is required.')
      return
    }
    if (form.endDate && form.endDate < form.startDate) {
      toast.error('End date cannot be earlier than start date.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        isHoliday: form.isHoliday || form.eventType === 'HOLIDAY',
        endDate: form.endDate || form.startDate
      }

      if (editingId) {
        await academicCalendarService.update(editingId, payload)
        toast.success('Academic calendar entry updated successfully!')
      } else {
        await academicCalendarService.create(payload)
        toast.success('Academic calendar entry added successfully!')
      }
      setShowModal(false)
      loadEvents()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save calendar entry.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await academicCalendarService.delete(deleteTarget.id)
      toast.success('Calendar entry removed.')
      setDeleteTarget(null)
      setSelectedEvent(null)
      loadEvents()
    } catch {
      toast.error('Failed to delete calendar entry.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* ── Official Print Header (Visible ONLY on paper print) ── */}
      <div className="print-header" style={{ display: 'none', textAlign: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#0f172a' }}>ADITYA UNIVERSITY</h2>
        <p style={{ fontSize: 12, color: '#475569', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Directorate of Academic Affairs & Office of Controller of Examinations
        </p>
        <p style={{ fontSize: 12, fontWeight: 800, margin: '2px 0 0', color: '#1e3a8a' }}>
          OFFICIAL ACADEMIC CALENDAR &bull; ACADEMIC YEAR 2026–2027
        </p>
        <hr style={{ margin: '10px 0', border: 'none', borderTop: '2px solid #0f172a' }} />
      </div>

      {/* ── UNIFIED SLIM TOOLBAR (Everything fit in ONE clear executive bar) ── */}
      <div className="card" style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        borderRadius: 14,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
      }}>
        {/* Left: Month Stepper & Term Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={prevMonth}
              className="btn btn-sm btn-ghost"
              style={{ width: 30, height: 30, padding: 0, border: '1px solid #e2e8f0', borderRadius: 6 }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 style={{
              fontSize: 17,
              fontWeight: 900,
              color: '#0f172a',
              margin: 0,
              minWidth: 140,
              textAlign: 'center',
              letterSpacing: -0.2
            }}>
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="btn btn-sm btn-ghost"
              style={{ width: 30, height: 30, padding: 0, border: '1px solid #e2e8f0', borderRadius: 6 }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="btn btn-sm btn-ghost"
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              height: 28,
              color: '#15803d',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 6
            }}
          >
            Today
          </button>
        </div>

        {/* Center / Search & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
          {/* Quick Search Input */}
          <div style={{ position: 'relative', width: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search milestones..."
              style={{ paddingLeft: 28, paddingRight: 24, fontSize: 12, height: 32, borderRadius: 8 }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 2
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <select
            className="form-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ height: 32, fontSize: 12, padding: '2px 8px', borderRadius: 8, maxWidth: 160 }}
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.label} {c.id !== 'ALL' ? `(${events.filter(ev => ev.eventType === c.id).length})` : `(${events.length})`}
              </option>
            ))}
          </select>

          {/* Audience Filter Dropdown */}
          <select
            className="form-select"
            value={audienceFilter}
            onChange={e => setAudienceFilter(e.target.value)}
            style={{ height: 32, fontSize: 12, padding: '2px 8px', borderRadius: 8, maxWidth: 120 }}
          >
            <option value="ALL">All Members</option>
            <option value="STUDENTS">Students</option>
            <option value="FACULTY">Faculty</option>
          </select>
        </div>

        {/* Right: View Toggles & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* View Mode Pills (Icons only for maximum screen fit & clarity) */}
          <div style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            padding: 2,
            borderRadius: 8,
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setViewMode('month')}
              style={{
                background: viewMode === 'month' ? '#ffffff' : 'transparent',
                color: viewMode === 'month' ? '#0f172a' : '#64748b',
                border: 'none',
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: viewMode === 'month' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
              title="Month View"
            >
              <CalendarIcon size={14} />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              style={{
                background: viewMode === 'agenda' ? '#ffffff' : 'transparent',
                color: viewMode === 'agenda' ? '#0f172a' : '#64748b',
                border: 'none',
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: viewMode === 'agenda' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
              title="Agenda Schedule"
            >
              <FileText size={14} />
            </button>
            <button
              onClick={() => setViewMode('roadmap')}
              style={{
                background: viewMode === 'roadmap' ? '#ffffff' : 'transparent',
                color: viewMode === 'roadmap' ? '#0f172a' : '#64748b',
                border: 'none',
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: viewMode === 'roadmap' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
              title="Semester Roadmap"
            >
              <GraduationCap size={14} />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="btn btn-sm btn-ghost"
            style={{ width: 28, height: 28, padding: 0, border: '1px solid #e2e8f0', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            title="Print Official Calendar"
          >
            <Printer size={14} />
          </button>

          <button
            onClick={() => exportToIcs(filteredEvents, 'aditya_academic_calendar.ics')}
            className="btn btn-sm btn-ghost"
            style={{ width: 28, height: 28, padding: 0, border: '1px solid #e2e8f0', borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            title="Export Calendar (.ICS)"
          >
            <Download size={14} />
          </button>

          {isAdmin && (
            <button
              onClick={() => handleOpenAdd()}
              className="btn btn-sm btn-primary"
              style={{ width: 28, height: 28, padding: 0, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              title="Add Academic Milestone"
            >
              <Plus size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── COMPACT STATS & MONTH STRIP (Slim & Screen-Fitting) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '6px 12px',
        background: '#ffffff',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        fontSize: 11
      }}>
        {/* KPI Mini Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#475569', fontWeight: 700 }}>
            <strong style={{ color: '#0f172a' }}>{kpiData.total}</strong> Milestones
          </span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#7e22ce', fontWeight: 700 }}>
            <strong>{kpiData.exams}</strong> Exams (CIE/SEE)
          </span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#15803d', fontWeight: 700 }}>
            <strong>{kpiData.holidays}</strong> Holidays
          </span>
          {kpiData.upcoming && (
            <>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{
                background: '#fef3c7',
                color: '#b45309',
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 800
              }}>
                Next: {kpiData.upcoming.title} ({kpiData.countdownText})
              </span>
            </>
          )}
        </div>

        {/* 12-Month Quick Jumper Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {ACADEMIC_CYCLE.map(item => {
            const isSelected = item.year === year && item.month === month
            const count = eventCountByMonth[`${item.year}-${item.month}`] || 0

            return (
              <button
                key={`${item.year}-${item.month}`}
                onClick={() => jumpToMonth(item.year, item.month)}
                style={{
                  padding: '2px 7px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: isSelected ? 900 : 600,
                  border: isSelected ? '1px solid #d99b26' : '1px solid transparent',
                  background: isSelected ? '#fffbeb' : 'transparent',
                  color: isSelected ? '#b45309' : '#64748b',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title={`${MONTH_NAMES[item.month]} ${item.year} (${count} events)`}
              >
                {item.label}
                {count > 0 && (
                  <span style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: isSelected ? '#d99b26' : '#2563eb',
                    display: 'inline-block',
                    marginLeft: 2,
                    verticalAlign: 'middle'
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VIEW 1: SCREEN-FITTING MONTH GRID VIEW
         ══════════════════════════════════════════════════════════ */}
      {viewMode === 'month' && (
        <div className="card" style={{
          padding: 0,
          overflow: 'hidden',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Day Header Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                textAlign: 'center',
                fontWeight: 800,
                fontSize: 11,
                color: '#64748b'
              }}>
                {DAYS_OF_WEEK.map((d, idx) => (
                  <div
                    key={d}
                    style={{
                      padding: '8px 2px',
                      color: idx === 0 ? '#dc2626' : '#475569',
                      background: idx === 0 ? '#fef2f2' : 'transparent',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 42 Calendar Grid Cells (Sleek, Screen-fitted) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: '#e2e8f0',
                gap: '1px'
              }}>
                {calendarCells.map((cell, idx) => {
                  const dayEvents = eventsByDate[cell.dateString] || []
                  const isToday = cell.dateString === todayStr
                  const isSunday = cell.date.getDay() === 0
                  const hasHoliday = dayEvents.some(e => e.isHoliday || e.eventType === 'HOLIDAY')

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isAdmin && dayEvents.length === 0) {
                          handleOpenAdd(cell.dateString)
                        }
                      }}
                      style={{
                        background: isToday
                          ? '#f0fdf4'
                          : (hasHoliday && cell.isCurrentMonth
                            ? '#fafdfb'
                            : (cell.isCurrentMonth
                              ? (isSunday ? '#fffdfd' : '#ffffff')
                              : '#f8fafc')),
                        minHeight: 78,
                        maxHeight: 96,
                        padding: '4px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: isAdmin ? 'pointer' : 'default',
                        position: 'relative',
                        border: isToday ? '1.5px solid #22c55e' : 'none',
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Day Number Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: isToday ? 900 : (cell.isCurrentMonth ? 700 : 500),
                          color: isToday
                            ? '#15803d'
                            : (cell.isCurrentMonth ? (isSunday ? '#dc2626' : '#0f172a') : '#94a3b8'),
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          background: isToday ? '#dcfce7' : 'transparent'
                        }}>
                          {cell.dayNum}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {isToday && (
                            <span style={{
                              fontSize: 8,
                              fontWeight: 900,
                              color: '#15803d',
                              textTransform: 'uppercase',
                              letterSpacing: 0.4,
                              background: '#dcfce7',
                              padding: '1px 4px',
                              borderRadius: 3
                            }}>
                              Today
                            </span>
                          )}
                          {hasHoliday && cell.isCurrentMonth && (
                            <span style={{ fontSize: 9 }} title="Holiday">
                              🏖️
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Chips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
                        {dayEvents.slice(0, 2).map(ev => {
                          const meta = getCategoryMeta(ev.eventType)
                          const isHolidayEv = ev.isHoliday || ev.eventType === 'HOLIDAY'
                          const isExamEv = ev.eventType === 'EXAMINATION'

                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEvent(ev)
                              }}
                              style={{
                                background: meta.bg,
                                color: meta.color,
                                borderLeft: `3px solid ${meta.dot}`,
                                borderTop: `1px solid ${meta.border}`,
                                borderRight: `1px solid ${meta.border}`,
                                borderBottom: `1px solid ${meta.border}`,
                                borderRadius: 4,
                                padding: '1px 4px',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.3
                              }}
                              title={`${ev.title} (${meta.label})`}
                            >
                              {isHolidayEv ? '🏖️ ' : isExamEv ? '📝 ' : ''}
                              {ev.title}
                            </div>
                          )
                        })}

                        {dayEvents.length > 2 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDayPopover({ dateStr: cell.dateString, events: dayEvents })
                            }}
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              borderRadius: 3,
                              padding: '1px 4px',
                              fontSize: 9,
                              fontWeight: 800,
                              cursor: 'pointer',
                              textAlign: 'left',
                              lineHeight: 1.2
                            }}
                          >
                            +{dayEvents.length - 2} more…
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 2: CLEAN AGENDATABLE SCHEDULE
         ══════════════════════════════════════════════════════════ */}
      {viewMode === 'agenda' && (
        <div className="card" style={{ padding: 0, borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#475569', margin: 0 }}>
                No academic milestones found matching current filters.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Date Schedule</th>
                    <th style={{ width: 160 }}>Category</th>
                    <th>Milestone Title &amp; Details</th>
                    <th style={{ width: 180 }}>Audience / Venue</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredEvents]
                    .sort((a, b) => a.startDate.localeCompare(b.startDate))
                    .map(e => {
                      const meta = getCategoryMeta(e.eventType)
                      const isMultiDay = e.endDate && e.endDate !== e.startDate
                      const isCurrent = e.startDate <= todayStr && (e.endDate || e.startDate) >= todayStr

                      return (
                        <tr
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          style={{
                            cursor: 'pointer',
                            background: isCurrent ? '#f0fdf4' : 'transparent'
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>
                              {formatDate(e.startDate)}
                            </div>
                            {isMultiDay && (
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                to {formatDate(e.endDate)}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{
                              background: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.border}`,
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 5
                            }}>
                              {meta.label}
                            </span>
                            {e.isHoliday && (
                              <span style={{ marginLeft: 4, fontSize: 10 }}>🏖️</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{e.title}</div>
                            {e.description && (
                              <div style={{ fontSize: 12, color: '#64748b', maxWidth: 450, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {e.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: 12, color: '#475569' }}>
                              <div><strong>{e.targetAudience || 'All University'}</strong></div>
                              {e.venue && <div style={{ fontSize: 11, color: '#64748b' }}>📍 {e.venue}</div>}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={ev => ev.stopPropagation()}>
                            <div style={{ display: 'inline-flex', gap: 4 }}>
                              <button
                                onClick={() => exportToIcs(e, `${e.title}.ics`)}
                                className="btn btn-sm btn-ghost"
                                style={{ padding: '3px 6px', fontSize: 11 }}
                                title="Download .ics"
                              >
                                <Download size={13} />
                              </button>
                              <button
                                onClick={() => setSelectedEvent(e)}
                                className="btn btn-sm btn-ghost"
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                View
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(e)}
                                    className="btn btn-sm btn-ghost"
                                    style={{ padding: '3px 6px', color: '#2563eb' }}
                                    title="Edit"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(e)}
                                    className="btn btn-sm btn-ghost"
                                    style={{ padding: '3px 6px', color: '#dc2626' }}
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 3: SEMESTER ROADMAP (COMPACT FLOW)
         ══════════════════════════════════════════════════════════ */}
      {viewMode === 'roadmap' && (
        <div className="card" style={{ padding: '16px 20px', borderRadius: 14 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
              Academic Semester Progression Flow (AY 2026–2027)
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              Chronological progression from instructional start through CIE evaluations and Semester End Exams.
            </p>
          </div>

          <div style={{ position: 'relative', paddingLeft: 20 }}>
            {/* Timeline Vertical Bar */}
            <div style={{
              position: 'absolute',
              left: 7,
              top: 6,
              bottom: 6,
              width: 2,
              background: '#cbd5e1'
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...filteredEvents]
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((e, idx) => {
                  const meta = getCategoryMeta(e.eventType)
                  const isCurrent = e.startDate <= todayStr && (e.endDate || e.startDate) >= todayStr

                  return (
                    <div key={e.id} style={{ position: 'relative', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {/* Node Bullet */}
                      <div style={{
                        position: 'absolute',
                        left: -17,
                        top: 4,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: isCurrent ? '#16a34a' : meta.dot,
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 0 1px #cbd5e1'
                      }} />

                      {/* Compact Event Pill */}
                      <div
                        onClick={() => setSelectedEvent(e)}
                        className="card card-hover"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          cursor: 'pointer',
                          borderLeft: `3px solid ${meta.dot}`,
                          background: isCurrent ? '#f0fdf4' : '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              background: meta.bg,
                              color: meta.color,
                              fontSize: 9,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 4
                            }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                              {e.title}
                            </span>
                          </div>
                          {e.venue && <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>📍 {e.venue}</p>}
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a' }}>
                          {formatDate(e.startDate)}
                          {e.endDate && e.endDate !== e.startDate ? ` – ${formatDate(e.endDate)}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── SLIM CATEGORY LEGEND BAR (Bottom) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        fontSize: 10,
        fontWeight: 700,
        color: '#64748b',
        padding: '2px 4px'
      }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Legend:</span>
        {CATEGORIES.filter(c => c.id !== 'ALL').map(c => (
          <div key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
            <span>{c.label}</span>
          </div>
        ))}
      </div>

      {/* ── Day Popover Modal (+N more) ── */}
      {dayPopover && (
        <Modal
          isOpen={Boolean(dayPopover)}
          onClose={() => setDayPopover(null)}
          title={`Milestones for ${formatDate(dayPopover.dateStr)}`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dayPopover.events.map(ev => {
              const meta = getCategoryMeta(ev.eventType)
              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    setDayPopover(null)
                    setSelectedEvent(ev)
                  }}
                  className="card card-hover"
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderLeft: `3px solid ${meta.dot}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{
                      background: meta.bg,
                      color: meta.color,
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 4
                    }}>
                      {meta.label}
                    </span>
                    <h5 style={{ fontSize: 13, fontWeight: 800, margin: '2px 0 0', color: '#0f172a' }}>
                      {ev.title}
                    </h5>
                  </div>
                  <button className="btn btn-sm btn-ghost" style={{ fontSize: 11 }}>
                    View &rarr;
                  </button>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <Modal
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: getCategoryMeta(selectedEvent.eventType).bg,
                color: getCategoryMeta(selectedEvent.eventType).color,
                border: `1px solid ${getCategoryMeta(selectedEvent.eventType).border}`,
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800
              }}>
                {getCategoryMeta(selectedEvent.eventType).label}
              </span>

              {selectedEvent.isHoliday && (
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  🏖️ Official Holiday
                </span>
              )}
            </div>

            <div className="grid-2" style={{
              background: '#f8fafc',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              gap: 10
            }}>
              <div>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>
                  Date Schedule
                </p>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                  {formatDate(selectedEvent.startDate)}
                  {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate ? ` to ${formatDate(selectedEvent.endDate)}` : ''}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>
                  Timing
                </p>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                  {selectedEvent.startTime ? `${selectedEvent.startTime} – ${selectedEvent.endTime || 'End'}` : 'Full Day'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>
                  Venue
                </p>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                  {selectedEvent.venue || 'Aditya University Campus'}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>
                  Audience
                </p>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                  {selectedEvent.targetAudience || 'All University Members'}
                </p>
              </div>
            </div>

            {selectedEvent.description && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  Instructions &amp; Details
                </p>
                <div style={{
                  fontSize: 12,
                  color: '#475569',
                  lineHeight: 1.5,
                  background: '#ffffff',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  {selectedEvent.description}
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #f1f5f9',
              paddingTop: 12
            }}>
              <button
                onClick={() => exportToIcs(selectedEvent, `${selectedEvent.title}.ics`)}
                className="btn btn-sm btn-ghost"
                style={{ gap: 5, fontSize: 11, fontWeight: 700 }}
              >
                <Download size={13} /> Add to Calendar (.ics)
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        const tgt = selectedEvent
                        setSelectedEvent(null)
                        setDeleteTarget(tgt)
                      }}
                      className="btn btn-sm btn-ghost"
                      style={{ color: '#dc2626', fontSize: 11 }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                    <button
                      onClick={() => handleOpenEdit(selectedEvent)}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 11 }}
                    >
                      <Edit size={13} /> Edit
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedEvent(null)} className="btn btn-sm btn-ghost" style={{ fontSize: 11 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add / Edit Academic Event Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Academic Milestone' : 'Add Academic Milestone'}
        size="md"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. First Continuous Internal Evaluation (CIE-I)"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={form.eventType}
                onChange={e => setForm({ ...form, eventType: e.target.value })}
              >
                {CATEGORIES.filter(c => c.id !== 'ALL').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select
                className="form-select"
                value={form.targetAudience}
                onChange={e => setForm({ ...form, targetAudience: e.target.value })}
              >
                <option value="ALL">All University Members</option>
                <option value="STUDENTS">Students Only</option>
                <option value="FACULTY">Faculty &amp; Staff Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                className="form-input"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                className="form-input"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Venue / Hall</label>
            <input
              type="text"
              className="form-input"
              value={form.venue}
              onChange={e => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. Central Examination Hall / BB Bhavan"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Guidelines</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Instructions, syllabus coverage, or regulations..."
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isHoliday}
              onChange={e => setForm({ ...form, isHoliday: e.target.checked })}
            />
            <span>Declare as Official University Non-Instructional Holiday</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : (editingId ? 'Save Changes' : 'Publish')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Academic Milestone"
        message={`Are you sure you want to remove "${deleteTarget?.title}" from the University Academic Calendar?`}
        confirmText="Delete"
        danger
      />
    </div>
  )
}
