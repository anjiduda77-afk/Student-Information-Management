import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { eventService, certificateService } from '../../../services/api'
import { toast } from '../../../components/Toast'
import { TableSkeleton, Spinner } from '../../../components/Loading'
import { Modal } from '../../../components/Modal'
import { formatDate } from '../../../utils/helpers'
import {
  Calendar, Clock, MapPin, Users, Award, Edit, ArrowRight,
  CheckCircle, XCircle, FileText, Download, UserCheck, ShieldCheck,
  Building, ChevronRight, UserPlus, Trash2, ArrowLeft
} from 'lucide-react'

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  const [event, setEvent] = useState(null)
  const [coordinators, setCoordinators] = useState([])
  const [participants, setParticipants] = useState([])
  const [certificates, setCertificates] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  // Certificate generation modal
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

  if (loading) return <TableSkeleton rows={5} cols={4} />
  if (!event) return <div className="card" style={{ padding: 40, textAlign: 'center' }}>Event not found.</div>

  const regOpen = event.status === 'ACTIVE' || event.status === 'UPCOMING'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        <button
          onClick={() => navigate('/admin/events')}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontWeight: 600 }}
        >
          Events
        </button>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text)', fontWeight: 700 }}>{event.title}</span>
      </div>

      {/* Main Event Card matching Image 1 bottom-left */}
      <div className="card" style={{ padding: 28, position: 'relative', border: '1px solid var(--border)', borderRadius: 16 }}>
        {/* Top Badges & Edit Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-purple">{event.category || 'Cultural'}</span>
            <span className={`badge ${regOpen ? 'badge-success' : 'badge-danger'}`}>
              {regOpen ? 'Registration Open' : 'Registration Closed'}
            </span>
          </div>

          <button
            onClick={() => navigate('/admin/events')}
            className="btn btn-sm"
            style={{ background: '#d97706', borderColor: '#d97706', color: '#fff', gap: 6, fontWeight: 700 }}
          >
            <Edit size={14} />
            <span>Edit Event</span>
          </button>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          {event.title}
        </h1>

        {/* Subtitle / Short Description */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 16px', maxWidth: '85%' }}>
          {event.description || 'An inter-department technical quiz to encourage learning, teamwork and problem-solving skills among students.'}
        </p>

        {/* Info Strip (Date, Time, Venue) */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          fontSize: 13,
          color: 'var(--text)',
          fontWeight: 600,
          padding: '12px 16px',
          background: 'var(--surface-secondary)',
          borderRadius: 12,
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} style={{ color: '#d97706' }} />
            <span>{formatDate(event.eventDate)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} style={{ color: '#2563eb' }} />
            <span>{event.startTime || '09:30 AM'} – {event.endTime || '05:00 PM'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} style={{ color: '#0f766e' }} />
            <span>{event.venue || 'BB Bhavan, Aditya University'}</span>
          </div>
        </div>

        {/* Metric Pill Boxes matching Image 1 bottom-left */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14
        }}>
          <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{participants.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Registrations</div>
            </div>
          </div>

          <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>
                {new Set(participants.map(p => p.department).filter(Boolean)).size || 1}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Departments</div>
            </div>
          </div>

          <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{coordinators.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Coordinators</div>
            </div>
          </div>

          <div style={{ padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{event.status || 'Active'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar with "+ Manage Coordinators ->" Button matching Image 1 bottom-left */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid var(--border)',
        paddingBottom: 2,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'participants', label: `Participants (${participants.length})` },
            { id: 'coordinators', label: `Coordinators (${coordinators.length})` },
            { id: 'results', label: 'Results' },
            { id: 'certificates', label: `Certificates (${certificates.length})` }
          ].map(tab => {
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

        {/* "+ Manage Coordinators ->" button */}
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
      </div>

      {/* TAB 1: OVERVIEW matching Image 1 bottom-left */}
      {activeTab === 'overview' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.8fr) minmax(280px, 1.2fr)',
          gap: 24
        }}>
          {/* Left: Event Description */}
          <div className="card" style={{ padding: 24, borderRadius: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px' }}>
              Event Description
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: '0 0 16px' }}>
              {event.description || 'The event is an inter-department competition designed to test and enhance students\' technical, problem-solving, and collaboration skills across all branches.'}
            </p>
            <div style={{ padding: 14, background: 'var(--surface-secondary)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              <strong>Eligibility:</strong> Open to all undergraduate & postgraduate students. Registered participants receive verified academic certificates.
            </div>
          </div>

          {/* Right: Event Information Card */}
          <div className="card" style={{ padding: 24, borderRadius: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px' }}>
              Event Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Category</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{event.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Organized By</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{event.department || 'CSE Department'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Venue</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{event.venue}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registration</span>
                <span style={{ fontWeight: 700, color: regOpen ? '#15803d' : '#dc2626' }}>
                  {regOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Capacity</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{event.maximumParticipants || 'Unlimited'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === 'participants' && (
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

      {/* TAB 3: COORDINATORS */}
      {activeTab === 'coordinators' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Event Coordinators ({coordinators.length})
            </h3>
            <button
              onClick={() => navigate(`/admin/events/${eventId}/coordinators`)}
              className="btn btn-primary btn-sm"
              style={{ background: '#d97706', borderColor: '#d97706' }}
            >
              <UserPlus size={14} /> Manage Coordinators
            </button>
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
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{c.facultyId} • {c.department}</p>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{c.email}</div>
                <span className="badge badge-purple" style={{ fontSize: 10 }}>Event Coordinator</span>
              </div>
            ))}
            {coordinators.length === 0 && (
              <div className="card" style={{ padding: 32, textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8' }}>
                No coordinators assigned yet. Click "Manage Coordinators" to assign faculty.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RESULTS */}
      {activeTab === 'results' && (
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

      {/* TAB 5: CERTIFICATES */}
      {activeTab === 'certificates' && (
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
    </div>
  )
}
