import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { eventService, adminService } from '../../../services/api'
import { toast } from '../../../components/Toast'
import { TableSkeleton, Spinner } from '../../../components/Loading'
import { Modal, ConfirmModal } from '../../../components/Modal'
import { formatDate } from '../../../utils/helpers'
import {
  ArrowLeft, Calendar, Clock, MapPin, Search, Filter,
  UserPlus, MinusCircle, Eye, Info, MoreVertical, Building,
  ShieldAlert, Mail, UserCheck
} from 'lucide-react'

export default function EventCoordinatorsPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [coordinators, setCoordinators] = useState([])
  const [facultyList, setFacultyList] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')

  // Assign Faculty Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Remove confirmation
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [eRes, cRes, fRes, dRes] = await Promise.all([
        eventService.getById(eventId),
        eventService.getCoordinators(eventId),
        adminService.getFaculty().catch(() => ({ data: [] })),
        adminService.getDepartments().catch(() => ({ data: [] }))
      ])
      setEvent(eRes.data)
      setCoordinators(cRes.data || [])
      setFacultyList(fRes.data || [])
      setDepartments(dRes.data || [])
    } catch {
      toast.error('Failed to load coordinator data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  // Faculty not yet assigned as coordinators
  const assignedFacultyIds = new Set(coordinators.map(c => c.facultyId))
  const unassignedFaculty = facultyList.filter(f => !assignedFacultyIds.has(f.id) && f.status !== 'INACTIVE')

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedFacultyId) {
      toast.error('Please select a faculty member.')
      return
    }
    setAssigning(true)
    try {
      await eventService.assignCoordinator(eventId, Number(selectedFacultyId), remarks)
      toast.success('Faculty member assigned as Event Coordinator successfully!')
      setAssignModalOpen(false)
      setSelectedFacultyId('')
      setRemarks('')
      const cRes = await eventService.getCoordinators(eventId)
      setCoordinators(cRes.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to assign faculty coordinator.')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await eventService.removeCoordinator(eventId, removeTarget.facultyId)
      toast.success(`Removed ${removeTarget.facultyName} from coordinators.`)
      setRemoveTarget(null)
      const cRes = await eventService.getCoordinators(eventId)
      setCoordinators(cRes.data || [])
    } catch {
      toast.error('Failed to remove coordinator.')
    } finally {
      setRemoving(false)
    }
  }

  const filteredCoordinators = coordinators.filter(c => {
    const matchesSearch = !search ||
      c.facultyName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.department?.toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === 'ALL' || c.department === deptFilter
    return matchesSearch && matchesDept
  })

  if (loading) return <TableSkeleton rows={4} cols={3} />
  if (!event) return <div className="card" style={{ padding: 40, textAlign: 'center' }}>Event not found.</div>

  const regOpen = event.status === 'ACTIVE' || event.status === 'UPCOMING'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Back Action Button matching Image 1 bottom-right */}
      <div>
        <button
          onClick={() => navigate(`/admin/events/${eventId}`)}
          className="btn btn-ghost btn-sm"
          style={{ gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Event</span>
        </button>
      </div>

      {/* Event Summary Card matching Image 1 bottom-right */}
      <div className="card" style={{ padding: '20px 24px', borderRadius: 14, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span className="badge badge-purple">{event.category || 'Cultural'}</span>
              <span className={`badge ${regOpen ? 'badge-success' : 'badge-danger'}`}>
                {regOpen ? 'Registration Open' : 'Registration Closed'}
              </span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px' }}>
              {event.title}
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} style={{ color: '#d97706' }} />
                {formatDate(event.eventDate)}
              </span>
              <span>|</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} style={{ color: '#2563eb' }} />
                {event.startTime || '09:30 AM'} – {event.endTime || '05:00 PM'}
              </span>
              <span>|</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} style={{ color: '#0f766e' }} />
                {event.venue || 'BB Bhavan, Aditya University'}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate(`/admin/events/${eventId}`)}
            className="btn btn-ghost btn-sm"
            style={{ gap: 6, fontWeight: 700, fontSize: 12 }}
          >
            <Eye size={14} />
            <span>View Event</span>
          </button>
        </div>
      </div>

      {/* Section Header: Event Coordinators matching Image 1 bottom-right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>
            Event Coordinators
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Manage faculty members assigned to this event.
          </p>
        </div>

        {/* "+ Assign Faculty" Button (Gold) */}
        <button
          onClick={() => { setSelectedFacultyId(''); setRemarks(''); setAssignModalOpen(true); }}
          className="btn btn-primary"
          style={{
            background: '#d97706',
            borderColor: '#d97706',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            padding: '0 18px',
            height: 40,
            gap: 8,
            boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)'
          }}
        >
          <UserPlus size={16} />
          <span>Assign Faculty</span>
        </button>
      </div>

      {/* Filter Row: Search faculty... & Departments dropdown */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 280 }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 36, height: 38, fontSize: 13, borderRadius: 10 }}
            placeholder="Search faculty..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-light)' }} />
        </div>

        <select
          className="form-select"
          style={{ height: 38, fontSize: 13, width: 200, borderRadius: 10 }}
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
          <option value="CSE Department">CSE Department</option>
          <option value="ECE Department">ECE Department</option>
          <option value="AI & ML Department">AI & ML Department</option>
        </select>
      </div>

      {/* Faculty Coordinator Cards Grid matching Image 1 bottom-right */}
      {filteredCoordinators.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 14 }}>
          <UserCheck size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No Event Coordinators Assigned</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 18px' }}>
            Assign faculty members from the university to coordinate participants, evaluate results and issue certificates.
          </p>
          <button
            onClick={() => setAssignModalOpen(true)}
            className="btn btn-primary"
            style={{ background: '#d97706', borderColor: '#d97706' }}
          >
            <UserPlus size={16} /> Assign Faculty
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20
        }}>
          {filteredCoordinators.map(c => {
            return (
              <div
                key={c.facultyId}
                className="card"
                style={{
                  padding: 20,
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  position: 'relative'
                }}
              >
                {/* Faculty Info Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 16,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)'
                  }}>
                    {c.facultyName?.slice(0, 2).toUpperCase() || 'FC'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.facultyName}
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>
                      Faculty ID: {c.facultyCode || `FAC${String(c.facultyId).padStart(3, '0')}`}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', fontWeight: 600 }}>
                      {c.department || 'Academic Department'}
                    </p>
                    <a
                      href={`mailto:${c.email}`}
                      style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Mail size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                    </a>
                  </div>
                </div>

                {/* Coordinator Badge */}
                <div>
                  <span className="badge badge-purple" style={{ fontSize: 11, padding: '4px 10px', background: '#f3e8ff', color: '#7e22ce' }}>
                    Event Coordinator
                  </span>
                </div>

                {/* Bottom Card Actions: [ ⊖ Remove ] and [...] */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)'
                }}>
                  <button
                    onClick={() => setRemoveTarget(c)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      borderRadius: 6
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <MinusCircle size={15} />
                    <span>Remove</span>
                  </button>

                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 6, color: 'var(--text-light)' }}
                    title="Coordinator Options"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Blue Notice Box matching Image 1 bottom-right */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 12,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        color: '#1e40af',
        fontSize: 13,
        lineHeight: 1.5
      }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: 2, color: '#2563eb' }} />
        <div>
          <strong>Only administrators can assign or change event coordinators.</strong> Assigned faculty can manage this event as per their authorised permissions.
        </div>
      </div>

      {/* Assign Faculty Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Faculty Coordinator"
        size="md"
      >
        <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Select a faculty member from Aditya University to serve as an official coordinator for <strong>{event.title}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Select Faculty Member *</label>
            <select
              className="form-select"
              value={selectedFacultyId}
              onChange={e => setSelectedFacultyId(e.target.value)}
              required
            >
              <option value="">-- Choose faculty member --</option>
              {unassignedFaculty.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.facultyId || `FAC${f.id}`}) — {f.department || 'Faculty'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Role Remarks / Assigned Duties (Optional)</label>
            <input
              className="form-input"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Lead Coordinator & Quiz Master"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setAssignModalOpen(false)}
              disabled={assigning}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={assigning}
              style={{ background: '#d97706', borderColor: '#d97706' }}
            >
              {assigning ? 'Assigning…' : 'Assign Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Coordinator Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove Event Coordinator"
        message={`Are you sure you want to remove ${removeTarget?.facultyName} as coordinator for this event? They will no longer be able to manage results or issue certificates for this event.`}
        confirmText="Remove Coordinator"
        danger
      />
    </div>
  )
}
