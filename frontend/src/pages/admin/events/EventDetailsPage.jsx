import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { eventService, certificateService } from '../../../services/api'
import { toast } from '../../../components/Toast'
import { TableSkeleton } from '../../../components/Loading'
import { Modal } from '../../../components/Modal'
import { formatDate } from '../../../utils/helpers'
import { useAuth } from '../../../context/AuthContext'
import { getCategoryTheme, getPosterDateParts } from '../../../components/events/EventPosterCard'
import {
  Calendar, Clock, MapPin, Users, Award, Edit, ArrowRight,
  CheckCircle, XCircle, Download, UserCheck,
  Building, ChevronRight, UserPlus, ArrowLeft,
  CheckCircle2, Sparkles, AlertTriangle, ShieldCheck, ExternalLink,
  Trash2, Ban, Upload, X, ZoomIn, Image as ImageIcon
} from 'lucide-react'

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const { user } = useAuth()
  const role = user?.role || 'ADMIN'
  const isStudent = role === 'STUDENT'
  const isFaculty = role === 'FACULTY'
  const isAdmin = role === 'ADMIN'
  const basePath = isStudent ? '/student' : isFaculty ? '/faculty' : '/admin'

  const [event, setEvent] = useState(null)
  const [coordinators, setCoordinators] = useState([])
  const [participants, setParticipants] = useState([])
  const [certificates, setCertificates] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  // Registration state for students
  const [registering, setRegistering] = useState(false)

  // Event removal / cancellation modal (Admin)
  const [removalModalOpen, setRemovalModalOpen] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')

  // Inline Edit Event modal (Admin)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({})

  // Poster lightbox
  const [posterLightbox, setPosterLightbox] = useState(false)

  // Poster upload ref
  const posterFileRef = useRef(null)

  // Certificate generation modal (Admin / Faculty)
  const [genModalOpen, setGenModalOpen] = useState(false)
  const [targetStudent, setTargetStudent] = useState(null)
  const [genForm, setGenForm] = useState({
    certificateType: 'WINNER',
    position: 'Winner',
    templateId: ''
  })
  const [generating, setGenerating] = useState(false)

  // Result inline state
  const [resultState, setResultState] = useState({})
  const [savingResultId, setSavingResultId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [eRes, cRes, pRes, certRes, tRes] = await Promise.all([
        eventService.getById(eventId),
        eventService.getCoordinators(eventId).catch(() => ({ data: [] })),
        eventService.getParticipants(eventId).catch(() => ({ data: [] })),
        eventService.getEventCertificates(eventId).catch(() => ({ data: [] })),
        certificateService.getTemplates().catch(() => ({ data: [] }))
      ])
      setEvent(eRes.data)
      setCoordinators(cRes.data || [])
      setParticipants(pRes.data || [])
      setCertificates(certRes.data || [])
      setTemplates(tRes.data || [])

      // Initialise result state
      const initialResults = {}
      ;(pRes.data || []).forEach(p => {
        initialResults[p.studentId] = {
          position: p.resultPosition || 'PARTICIPANT',
          score: '',
          remarks: ''
        }
      })
      setResultState(initialResults)
    } catch {
      toast.error('Failed to load event details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName })
  }

  // Student Register
  const handleStudentRegister = async () => {
    setRegistering(true)
    try {
      await eventService.register(eventId)
      toast.success('Successfully registered for this campus event!')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  // Student Cancel Registration
  const handleStudentCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration for this event?')) return
    setRegistering(true)
    try {
      await eventService.cancelRegistration(eventId)
      toast.info('Your registration has been cancelled.')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel registration.')
    } finally {
      setRegistering(false)
    }
  }

  // Admin Cancel Event
  const handleCancelEvent = async () => {
    try {
      await eventService.updateStatus(eventId, 'CANCELLED')
      toast.success('Event status marked as CANCELLED.')
      setRemovalModalOpen(false)
      loadData()
    } catch {
      toast.error('Failed to cancel event.')
    }
  }

  // Admin Permanent Delete Event
  const handlePermanentDelete = async () => {
    try {
      await eventService.delete(eventId)
      toast.success('Event permanently deleted.')
      navigate('/admin/events')
    } catch {
      toast.error('Failed to delete event.')
    }
  }

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await eventService.markAttendance(eventId, studentId, status)
      toast.success(`Attendance marked as ${status}`)
      const pRes = await eventService.getParticipants(eventId)
      setParticipants(pRes.data || [])
    } catch {
      toast.error('Failed to update attendance.')
    }
  }

  const handleSaveResult = async (studentId) => {
    const r = resultState[studentId]
    if (!r) return
    setSavingResultId(studentId)
    try {
      await eventService.updateResult(eventId, studentId, {
        studentId,
        position: r.position,
        score: r.score ? Number(r.score) : undefined,
        remarks: r.remarks
      })
      toast.success('Result saved successfully.')
      const [pRes, certRes] = await Promise.all([
        eventService.getParticipants(eventId),
        eventService.getEventCertificates(eventId)
      ])
      setParticipants(pRes.data || [])
      setCertificates(certRes.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save result.')
    } finally {
      setSavingResultId(null)
    }
  }

  const openGenerateModal = (student) => {
    setTargetStudent(student)
    const currentPos = resultState[student.studentId]?.position || student.resultPosition || 'PARTICIPANT'
    const matchingTemplate = templates.find(t => t.templateType === currentPos) || templates[0]
    setGenForm({
      certificateType: currentPos,
      position: currentPos === 'WINNER' ? 'Winner' : currentPos === 'RUNNER_UP' ? 'Runner-up' : 'Participant',
      templateId: matchingTemplate ? matchingTemplate.id : ''
    })
    setGenModalOpen(true)
  }

  const handleGenerateCertificate = async (e) => {
    e.preventDefault()
    if (!targetStudent) return
    setGenerating(true)
    try {
      await eventService.generateCertificate(eventId, {
        eventId: Number(eventId),
        studentId: targetStudent.studentId,
        certificateType: genForm.certificateType,
        position: genForm.position,
        templateId: genForm.templateId ? Number(genForm.templateId) : undefined
      })
      toast.success(`Certificate generated for ${targetStudent.studentName}!`)
      setGenModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certificate generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevokeCert = async (certId) => {
    const reason = window.prompt('Please enter reason for revocation:')
    if (!reason?.trim()) return
    try {
      await certificateService.revoke(certId, reason)
      toast.success('Certificate marked as REVOKED.')
      const certRes = await eventService.getEventCertificates(eventId)
      setCertificates(certRes.data || [])
    } catch {
      toast.error('Failed to revoke certificate.')
    }
  }

  // Open edit modal pre-filled
  const openEditModal = () => {
    if (!event) return
    setEditForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'Technical',
      posterUrl: event.posterUrl || '',
      eventDate: event.eventDate || '',
      startTime: event.startTime ? event.startTime.slice(0, 5) : '09:30',
      endTime: event.endTime ? event.endTime.slice(0, 5) : '17:00',
      venue: event.venue || '',
      department: event.department || 'CSE Department',
      maxParticipants: event.maxParticipants || 150,
      registrationDeadline: event.registrationDeadline ? event.registrationDeadline.split('T')[0] : '',
      status: event.status || 'REGISTRATION_OPEN',
    })
    setEditModalOpen(true)
  }

  const handleEditPosterFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB.'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        const max = 1400
        if (width > max || height > max) {
          if (width > height) { height = Math.round((height * max) / width); width = max }
          else { width = Math.round((width * max) / height); height = max }
        }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        setEditForm(prev => ({ ...prev, posterUrl: canvas.toDataURL('image/jpeg', 0.88) }))
        toast.success(`"${file.name}" uploaded!`)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.title.trim()) { toast.error('Title is required.'); return }
    setEditSubmitting(true)
    try {
      const payload = {
        ...editForm,
        registrationDeadline: editForm.registrationDeadline
          ? `${editForm.registrationDeadline}T23:59:00` : null,
        maxParticipants: editForm.maxParticipants ? Number(editForm.maxParticipants) : null,
        startTime: editForm.startTime ? `${editForm.startTime}:00` : null,
        endTime: editForm.endTime ? `${editForm.endTime}:00` : null,
      }
      await eventService.update(eventId, payload)
      toast.success('Event updated successfully!')
      setEditModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event.')
    } finally {
      setEditSubmitting(false)
    }
  }

  if (loading) return <TableSkeleton rows={5} cols={4} />
  if (!event) return (
    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
      <h3>Event not found</h3>
      <button onClick={() => navigate(`${basePath}/events`)} className="btn btn-primary" style={{ marginTop: 12 }}>
        Back to Events
      </button>
    </div>
  )

  const regOpen = event.status === 'REGISTRATION_OPEN' || event.status === 'ACTIVE' || event.status === 'UPCOMING'
  const isRegistered = Boolean(event.registered || participants.some(p => p.studentId === user?.id))
  const myParticipation = participants.find(p => p.studentId === user?.id)
  const myCert = certificates.find(c => c.studentId === user?.id)

  const theme = getCategoryTheme(event.category)
  const dateParts = getPosterDateParts(event.eventDate)
  const ThemeIcon = theme.icon

  // Tabs for Student vs Admin/Faculty
  const tabsList = isStudent ? [
    { id: 'overview', label: 'Overview & Schedule' },
    { id: 'my-status', label: isRegistered ? 'My Registration (Confirmed)' : 'Registration & Eligibility' },
    { id: 'coordinators', label: `Coordinators (${coordinators.length})` },
    ...(myCert ? [{ id: 'my-certificate', label: '🏆 My Certificate' }] : [])
  ] : [
    { id: 'overview', label: 'Overview' },
    { id: 'participants', label: `Participants (${participants.length})` },
    { id: 'coordinators', label: `Coordinators (${coordinators.length})` },
    { id: 'results', label: 'Results' },
    { id: 'certificates', label: `Certificates (${certificates.length})` }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        <button
          onClick={() => navigate(`${basePath}/events`)}
          style={{
            background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer',
            padding: 0, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4
          }}
        >
          <ArrowLeft size={14} />
          <span>Events</span>
        </button>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text)', fontWeight: 700 }}>{event.title}</span>
      </div>

      {/* ===================================================================== */}
      {/* FULL POSTER HERO BANNER */}
      {/* ===================================================================== */}
      <div
        style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          minHeight: 220,
          background: theme.gradient,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 28px',
          boxSizing: 'border-box',
          color: '#fff'
        }}
      >
        {/* Poster Image Background if valid */}
        {event.posterUrl && (
          <>
            <img
              src={event.posterUrl}
              alt={event.title}
              onClick={isAdmin ? () => setPosterLightbox(true) : undefined}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 1,
                cursor: isAdmin ? 'zoom-in' : 'default',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0.92) 100%)',
                zIndex: 2
              }}
            />
          </>
        )}

        {/* Ambient Decorative Icon */}
        {!event.posterUrl && (
          <ThemeIcon
            size={180}
            style={{
              position: 'absolute',
              right: 10,
              bottom: -30,
              color: 'rgba(255, 255, 255, 0.08)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}

        {/* Top Badges & Actions */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ThemeIcon size={13} style={{ color: theme.accentColor }} />
              <span>{event.category || 'General'}</span>
            </span>

            <span
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                background: regOpen ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.85)',
                color: '#fff'
              }}
            >
              {regOpen ? '● Registration Open' : event.status === 'COMPLETED' ? 'Completed' : 'Registration Closed'}
            </span>

            {isStudent && isRegistered && (
              <span
                style={{
                  background: '#d97706',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '4px 12px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <CheckCircle2 size={13} />
                <span>YOU ARE REGISTERED</span>
              </span>
            )}
          </div>

          {/* Action Buttons Top-Right */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isAdmin && (
              <>
                {/* View full poster */}
                {event.posterUrl && (
                  <button
                    onClick={() => setPosterLightbox(true)}
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', gap: 6, fontWeight: 700 }}
                  >
                    <ZoomIn size={14} />
                    <span>View Poster</span>
                  </button>
                )}

                <button
                  onClick={openEditModal}
                  className="btn btn-sm"
                  style={{ background: '#d97706', borderColor: '#d97706', color: '#fff', gap: 6, fontWeight: 700 }}
                >
                  <Edit size={14} />
                  <span>Edit Event</span>
                </button>

                <button
                  onClick={() => setRemovalModalOpen(true)}
                  className="btn btn-sm"
                  style={{ background: 'rgba(220, 38, 38, 0.85)', border: 'none', color: '#fff', gap: 6, fontWeight: 700 }}
                  title="Cancel or delete this event"
                >
                  <Trash2 size={14} />
                  <span>Cancel / Delete</span>
                </button>
              </>
            )}

            {/* Student Registration Button in Hero */}
            {isStudent && regOpen && (
              isRegistered ? (
                <button
                  onClick={handleStudentCancel}
                  disabled={registering}
                  className="btn btn-sm"
                  style={{
                    background: 'rgba(220, 38, 38, 0.85)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800
                  }}
                >
                  {registering ? 'Cancelling…' : 'Cancel Registration'}
                </button>
              ) : (
                <button
                  onClick={handleStudentRegister}
                  disabled={registering}
                  className="btn btn-sm"
                  style={{
                    background: '#d97706',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)',
                    padding: '8px 18px'
                  }}
                >
                  {registering ? 'Registering…' : 'Register for Event'}
                </button>
              )
            )}
          </div>
        </div>

        {/* Hero Title & Info */}
        <div style={{ position: 'relative', zIndex: 3, marginTop: 24, marginBottom: 12 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              margin: '0 0 10px',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {event.title}
          </h1>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px', maxWidth: 800, lineHeight: 1.6 }}>
            {event.description || 'University campus symposium and competition organized for skill enhancement.'}
          </p>

          {/* Quick Details Strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 13, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Calendar size={16} style={{ color: '#fbbf24' }} />
              <span>{formatDate(event.eventDate)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Clock size={16} style={{ color: '#67e8f9' }} />
              <span>{event.startTime ? event.startTime.slice(0, 5) : '09:30'} – {event.endTime ? event.endTime.slice(0, 5) : '17:00'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin size={16} style={{ color: '#a7f3d0' }} />
              <span>{event.venue || 'Aditya University Campus'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Building size={16} style={{ color: '#fbcfe8' }} />
              <span>{event.organizer || event.department || 'Aditya University'}</span>
            </div>
          </div>
        </div>

        {/* Hero Bottom Metric Cards */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginTop: 14
        }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Registered</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{participants.length} <span style={{ fontSize: 12, fontWeight: 500 }}>/ {event.maxParticipants || 150}</span></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Faculty Coordinators</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{coordinators.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Certificates Issued</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{certificates.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Status</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{event.status || 'Active'}</div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TABS HEADER */}
      {/* ===================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid var(--border)',
        paddingBottom: 2,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {tabsList.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px 10px 0 0',
                  border: 'none',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  color: isActive ? '#1e3a8a' : 'var(--text-muted)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid #d97706' : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Admin "+ Manage Coordinators" Shortcut */}
        {isAdmin && (
          <button
            onClick={() => navigate(`/admin/events/${eventId}/coordinators`)}
            className="btn btn-sm"
            style={{
              background: '#d97706',
              borderColor: '#d97706',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              gap: 6
            }}
          >
            <span>+ Manage Coordinators</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.8fr) minmax(280px, 1.2fr)',
          gap: 24
        }}>
          {/* Left: Description & Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px' }}>
                Event Description & Objectives
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: '0 0 16px' }}>
                {event.description || 'This event is designed to foster technical competence, innovation and collaboration among university students.'}
              </p>
              <div style={{ padding: 14, background: 'var(--surface-secondary)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Eligibility:</strong> Open to all enrolled undergraduate and postgraduate students. Registered attendees who participate receive verified academic certificates.
              </div>
            </div>

            {/* Rules & Guidelines */}
            <div className="card" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px' }}>
                Rules & Participation Guidelines
              </h3>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {event.rules ? (
                  event.rules.split('. ').map((rule, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#d97706', fontWeight: 800 }}>•</span>
                      <span>{rule}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#d97706' }}>•</span> All participants must carry their physical University Student ID card.</div>
                    <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#d97706' }}>•</span> Punctuality is mandatory. Late entries after start time may not be accommodated.</div>
                    <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#d97706' }}>•</span> The evaluation and decisions of the appointed faculty jury will be final and binding.</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Info Card & Coordinators Strip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px' }}>
                Event Specifications
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Category</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{event.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Organizing Unit</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{event.department || 'CSE Department'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Venue</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{event.venue}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Registration Status</span>
                  <span style={{ fontWeight: 700, color: regOpen ? '#15803d' : '#dc2626' }}>
                    {regOpen ? 'Open for Enrollment' : 'Closed'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{event.maxParticipants || 150} Participants</span>
                </div>
                {event.registrationDeadline && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Deadline</span>
                    <span style={{ fontWeight: 700, color: '#b45309' }}>{formatDate(event.registrationDeadline)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Coordinator Contacts */}
            <div className="card" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: '0 0 12px' }}>
                Event Coordinators
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {coordinators.map(c => (
                  <div key={c.facultyId} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#0f766e',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12
                    }}>
                      {c.facultyName?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{c.facultyName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.facultyDepartment || c.department}</div>
                    </div>
                  </div>
                ))}
                {coordinators.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Department Faculty Committee</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STUDENT TAB: MY STATUS */}
      {/* ===================================================================== */}
      {isStudent && activeTab === 'my-status' && (
        <div className="card" style={{ padding: 24, borderRadius: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>
            My Registration Status
          </h3>

          {isRegistered ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 18,
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <CheckCircle2 size={32} style={{ color: '#059669', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#065f46' }}>
                    Registration Confirmed
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#047857' }}>
                    You are officially registered for this event. Please be present at {event.venue} on {formatDate(event.eventDate)} by {event.startTime?.slice(0, 5) || '09:30'}.
                  </p>
                </div>
              </div>

              {/* Status details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ padding: 14, background: 'var(--surface-secondary)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Attendance Status</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                    <span className={`badge ${myParticipation?.attendanceStatus === 'PRESENT' ? 'badge-success' : 'badge-neutral'}`}>
                      {myParticipation?.attendanceStatus || 'PENDING (ON EVENT DAY)'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: 14, background: 'var(--surface-secondary)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Result / Position</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                    {myParticipation?.resultPosition || 'Awaiting Event Completion'}
                  </div>
                </div>

                <div style={{ padding: 14, background: 'var(--surface-secondary)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Official Certificate</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                    {myCert ? 'Issued & Ready' : 'Generated after event evaluation'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  onClick={handleStudentCancel}
                  disabled={registering}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#dc2626' }}
                >
                  Cancel Registration
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <AlertTriangle size={36} style={{ color: '#d97706', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>Not Yet Registered</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 450, margin: '0 auto 20px' }}>
                Seats are available. Click below to register and reserve your spot.
              </p>
              {regOpen ? (
                <button
                  onClick={handleStudentRegister}
                  disabled={registering}
                  className="btn btn-primary"
                  style={{ background: '#d97706', borderColor: '#d97706' }}
                >
                  {registering ? 'Registering…' : 'Register for Event'}
                </button>
              ) : (
                <span className="badge badge-danger">Registration is currently closed for this event</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* STUDENT TAB: MY CERTIFICATE */}
      {/* ===================================================================== */}
      {isStudent && activeTab === 'my-certificate' && (
        <div className="card" style={{ padding: 24, borderRadius: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>
            Earned University Certificate
          </h3>

          {myCert ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #fcd34d',
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Official University Credential
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: '#78350f', margin: '4px 0 6px' }}>
                    {myCert.certificateType} &bull; {myCert.position || 'Participant'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#92400e' }}>
                    Certificate ID: <strong>{myCert.certificateId}</strong> &bull; Issued: {formatDate(myCert.issueDate)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href={`/api/certificates/${myCert.certificateId}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ background: '#d97706', borderColor: '#d97706', gap: 6, fontWeight: 700 }}
                  >
                    <Download size={14} /> Download PDF
                  </a>
                  <a
                    href={`/verify/${myCert.certificateId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                    style={{ background: '#fff', border: '1px solid #d97706', color: '#d97706', gap: 6, fontWeight: 700 }}
                  >
                    <ExternalLink size={14} /> Verify Online
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              No certificate has been generated for you yet. Certificates will be released after event evaluation.
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADMIN / FACULTY TAB 2: PARTICIPANTS */}
      {/* ===================================================================== */}
      {!isStudent && activeTab === 'participants' && (
        <div className="card" style={{ padding: 24, borderRadius: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>
            Registered Participants ({participants.length})
          </h3>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Registered At</th>
                  <th>Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.studentId}>
                    <td><strong>{p.rollNumber || '—'}</strong></td>
                    <td>{p.studentName}</td>
                    <td>{p.department || '—'}</td>
                    <td>Sem {p.semester || 1}</td>
                    <td style={{ fontSize: 11, color: '#64748b' }}>{formatDate(p.registeredAt)}</td>
                    <td>
                      <span className={`badge ${p.attendanceStatus === 'PRESENT' ? 'badge-success' : p.attendanceStatus === 'ABSENT' ? 'badge-danger' : 'badge-neutral'}`}>
                        {p.attendanceStatus || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleMarkAttendance(p.studentId, 'PRESENT')}
                          className="btn btn-sm btn-ghost"
                          style={{ color: '#15803d', fontSize: 11, padding: '3px 8px' }}
                          title="Mark Present"
                        >
                          <CheckCircle size={13} /> Present
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(p.studentId, 'ABSENT')}
                          className="btn btn-sm btn-ghost"
                          style={{ color: '#dc2626', fontSize: 11, padding: '3px 8px' }}
                          title="Mark Absent"
                        >
                          <XCircle size={13} /> Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {participants.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    No students have registered for this event yet.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: COORDINATORS */}
      {/* ===================================================================== */}
      {activeTab === 'coordinators' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Event Coordinators ({coordinators.length})
            </h3>
            {isAdmin && (
              <button
                onClick={() => navigate(`/admin/events/${eventId}/coordinators`)}
                className="btn btn-primary btn-sm"
                style={{ background: '#d97706', borderColor: '#d97706' }}
              >
                <UserPlus size={14} /> Manage Coordinators
              </button>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16
          }}>
            {coordinators.map(c => (
              <div key={c.facultyId} className="card" style={{ padding: 18, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', background: '#0f766e',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14
                  }}>
                    {c.facultyName?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.facultyName}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{c.facultyDepartment || c.department || 'Faculty'}</p>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{c.email || c.facultyEmail || '—'}</div>
                <span className="badge badge-purple" style={{ fontSize: 10 }}>Event Coordinator</span>
              </div>
            ))}
            {coordinators.length === 0 && (
              <div className="card" style={{ padding: 32, textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8' }}>
                No coordinators assigned yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADMIN / FACULTY TAB 4: RESULTS */}
      {/* ===================================================================== */}
      {!isStudent && activeTab === 'results' && (
        <div className="card" style={{ padding: 24, borderRadius: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>
            Event Results & Certificate Issuance
          </h3>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Position / Result</th>
                  <th>Score</th>
                  <th>Remarks</th>
                  <th>Save</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => {
                  const state = resultState[p.studentId] || { position: 'PARTICIPANT', score: '', remarks: '' }
                  const hasCert = Boolean(p.certificateId)

                  return (
                    <tr key={p.studentId}>
                      <td><strong>{p.rollNumber}</strong></td>
                      <td>{p.studentName}</td>
                      <td>
                        <select
                          className="form-select"
                          style={{ fontSize: 12, height: 32, minWidth: 160 }}
                          value={state.position}
                          onChange={e => setResultState({
                            ...resultState,
                            [p.studentId]: { ...state, position: e.target.value }
                          })}
                        >
                          <option value="WINNER">Winner (1st Place)</option>
                          <option value="RUNNER_UP">Runner-up (2nd Place)</option>
                          <option value="SECOND_RUNNER_UP">Second Runner-up (3rd Place)</option>
                          <option value="SPECIAL_RECOGNITION">Special Recognition</option>
                          <option value="PARTICIPANT">Participant</option>
                          <option value="NO_CERTIFICATE">No Certificate</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: 70, height: 32, fontSize: 12 }}
                          placeholder="Score"
                          value={state.score}
                          onChange={e => setResultState({
                            ...resultState,
                            [p.studentId]: { ...state, score: e.target.value }
                          })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          style={{ height: 32, fontSize: 12, minWidth: 120 }}
                          placeholder="Remarks"
                          value={state.remarks}
                          onChange={e => setResultState({
                            ...resultState,
                            [p.studentId]: { ...state, remarks: e.target.value }
                          })}
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => handleSaveResult(p.studentId)}
                          disabled={savingResultId === p.studentId}
                          className="btn btn-sm btn-ghost"
                          style={{ color: '#2563eb', fontWeight: 700, fontSize: 12 }}
                        >
                          {savingResultId === p.studentId ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                      <td>
                        {hasCert ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="badge badge-success" style={{ fontSize: 10 }}>Issued</span>
                            <a
                              href={`/api/certificates/${p.certificateId}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-ghost"
                              style={{ padding: '2px 6px', fontSize: 11 }}
                            >
                              <Download size={12} />
                            </a>
                          </div>
                        ) : state.position === 'NO_CERTIFICATE' ? (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>None</span>
                        ) : (
                          <button
                            onClick={() => openGenerateModal(p)}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: 11, padding: '3px 10px', background: '#d97706', borderColor: '#d97706' }}
                          >
                            <Award size={12} /> Generate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADMIN / FACULTY TAB 5: CERTIFICATES */}
      {/* ===================================================================== */}
      {!isStudent && activeTab === 'certificates' && (
        <div className="card" style={{ padding: 24, borderRadius: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>
            Issued Certificates ({certificates.length})
          </h3>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Student Name</th>
                  <th>Type</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Issued Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map(c => (
                  <tr key={c.id}>
                    <td><strong style={{ color: '#1e3a8a' }}>{c.certificateId}</strong></td>
                    <td>{c.studentName}</td>
                    <td><span className="badge badge-purple">{c.certificateType}</span></td>
                    <td>{c.position || 'Participant'}</td>
                    <td>
                      <span className={`badge ${c.status === 'VALID' ? 'badge-success' : 'badge-danger'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: '#64748b' }}>{formatDate(c.issueDate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a
                          href={`/api/certificates/${c.certificateId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-ghost"
                          style={{ gap: 4, fontSize: 12 }}
                        >
                          <Download size={13} /> PDF
                        </a>
                        {c.status === 'VALID' && (
                          <button
                            onClick={() => handleRevokeCert(c.id)}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {certificates.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    No certificates have been generated for this event yet.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Certificate Generation Modal */}
      <Modal
        isOpen={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        title={`Generate Certificate: ${targetStudent?.studentName}`}
        size="md"
      >
        <form onSubmit={handleGenerateCertificate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Student</label>
            <input
              className="form-input"
              disabled
              value={`${targetStudent?.studentName} (${targetStudent?.rollNumber})`}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Certificate Type *</label>
              <select
                className="form-select"
                value={genForm.certificateType}
                onChange={e => setGenForm({ ...genForm, certificateType: e.target.value })}
              >
                <option value="WINNER">Winner</option>
                <option value="RUNNER_UP">Runner-up</option>
                <option value="SECOND_RUNNER_UP">Second Runner-up</option>
                <option value="SPECIAL_RECOGNITION">Special Recognition</option>
                <option value="PARTICIPATION">Participation</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Position Title</label>
              <input
                className="form-input"
                value={genForm.position}
                onChange={e => setGenForm({ ...genForm, position: e.target.value })}
                placeholder="e.g. Winner, First Runner-up"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Certificate Template</label>
            <select
              className="form-select"
              value={genForm.templateId}
              onChange={e => setGenForm({ ...genForm, templateId: e.target.value })}
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.templateType})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setGenModalOpen(false)} disabled={generating}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={generating} style={{ background: '#d97706', borderColor: '#d97706' }}>
              {generating ? 'Generating PDF…' : 'Generate Certificate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Professional Removal Modal */}
      {isAdmin && (
        <Modal
          isOpen={removalModalOpen}
          onClose={() => { setRemovalModalOpen(false); setConfirmDeleteText(''); }}
          title="Event Removal & Cancellation Controls"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              gap: 12
            }}>
              <AlertTriangle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#991b1b' }}>
                  {event.title}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#b91c1c' }}>
                  {event.category} &bull; {event.eventDate} &bull; <strong>{participants.length} enrolled participants</strong>.
                </p>
              </div>
            </div>

            {/* Option 1: Cancel Event */}
            <div style={{
              background: 'var(--surface-secondary)',
              borderRadius: 12,
              padding: 16,
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ban size={15} style={{ color: '#d97706' }} />
                  <span>1. Mark as Cancelled (Recommended)</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  Closes registration and sets status to CANCELLED. Preserves all attendance records.
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEvent}
                className="btn btn-sm"
                style={{ background: '#d97706', color: '#fff', border: 'none', fontWeight: 800, whiteSpace: 'nowrap' }}
              >
                Cancel Event
              </button>
            </div>

            {/* Option 2: Permanently Delete */}
            <div style={{
              background: 'var(--surface-secondary)',
              borderRadius: 12,
              padding: 16,
              border: '1px solid #fca5a5',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={15} />
                <span>2. Permanently Delete Record</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Completely deletes this event. Type <strong>DELETE</strong> below to confirm:
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                <input
                  className="form-input"
                  style={{ fontSize: 12, height: 34 }}
                  placeholder='Type "DELETE" to confirm'
                  value={confirmDeleteText}
                  onChange={e => setConfirmDeleteText(e.target.value)}
                />
                <button
                  type="button"
                  disabled={confirmDeleteText !== 'DELETE'}
                  onClick={handlePermanentDelete}
                  className="btn btn-sm"
                  style={{
                    background: confirmDeleteText === 'DELETE' ? '#dc2626' : '#cbd5e1',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    cursor: confirmDeleteText === 'DELETE' ? 'pointer' : 'not-allowed'
                  }}
                >
                  Purge Event
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { setRemovalModalOpen(false); setConfirmDeleteText(''); }}
                className="btn btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Poster Lightbox */}
      {posterLightbox && event?.posterUrl && (
        <div
          onClick={() => setPosterLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <button
            onClick={() => setPosterLightbox(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: 10,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <X size={14} /> Close (Esc)
          </button>
          <img
            src={event.posterUrl}
            alt={event.title}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '88vw',
              maxHeight: '84vh',
              borderRadius: 16,
              objectFit: 'contain',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8)'
            }}
          />
        </div>
      )}

      {/* Edit Event Modal */}
      {editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`✏️ Edit Event: ${event?.title?.slice(0, 40) || ''}`}
          size="lg"
        >
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input
                className="form-input"
                value={editForm.title || ''}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Poster URL / Upload</label>
              <input
                ref={posterFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleEditPosterFile}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  value={editForm.posterUrl?.startsWith('data:') ? '' : (editForm.posterUrl || '')}
                  onChange={e => setEditForm({ ...editForm, posterUrl: e.target.value })}
                  placeholder="Paste image URL or choose file"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => posterFileRef.current?.click()}
                  className="btn btn-ghost"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Upload size={14} /> Upload
                </button>
              </div>
              {editForm.posterUrl && (
                <img
                  src={editForm.posterUrl}
                  alt="Poster preview"
                  style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
                />
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={editForm.category || ''}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                >
                  {['Technical', 'Cultural', 'Academic', 'Sports', 'Workshop'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Venue</label>
                <input
                  className="form-input"
                  value={editForm.venue || ''}
                  onChange={e => setEditForm({ ...editForm, venue: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Event Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.eventDate || ''}
                  onChange={e => setEditForm({ ...editForm, eventDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={editForm.startTime || ''}
                  onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={editForm.endTime || ''}
                  onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Max Participants</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.maxParticipants || ''}
                  onChange={e => setEditForm({ ...editForm, maxParticipants: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editForm.status || ''}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="REGISTRATION_OPEN">Registration Open</option>
                  <option value="REGISTRATION_CLOSED">Registration Closed</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={editForm.description || ''}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Registration Deadline</label>
              <input
                type="date"
                className="form-input"
                value={editForm.registrationDeadline || ''}
                onChange={e => setEditForm({ ...editForm, registrationDeadline: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditModalOpen(false)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={editSubmitting}
                style={{ background: '#d97706', color: '#fff', border: 'none', fontWeight: 800 }}
              >
                {editSubmitting ? 'Saving…' : '✓ Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
