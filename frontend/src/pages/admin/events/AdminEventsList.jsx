import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventService, adminService } from '../../../services/api'
import { toast } from '../../../components/Toast'
import { Modal, ConfirmModal } from '../../../components/Modal'
import { TableSkeleton } from '../../../components/Loading'
import { formatDate } from '../../../utils/helpers'
import {
  Calendar, MapPin, Users, Award, Plus, Search, Filter,
  Edit, UserCheck, CheckSquare, FileText, Trash2,
  ChevronDown, X, GraduationCap
} from 'lucide-react'

export default function AdminEventsList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showFilterBar, setShowFilterBar] = useState(false)

  // Active dropdown menu for an event card
  const [activeMenuId, setActiveMenuId] = useState(null)
  const menuRef = useRef(null)

  // Create / Edit Event Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [departments, setDepartments] = useState([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Cultural',
    eventDate: '',
    startTime: '09:30',
    endTime: '17:00',
    venue: 'BB Bhavan, Aditya University',
    department: 'CSE Department',
    maximumParticipants: 150,
    registrationDeadline: '',
    status: 'ACTIVE'
  })

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [eRes, dRes] = await Promise.all([
        eventService.getAll(),
        adminService.getDepartments().catch(() => ({ data: [] }))
      ])
      setEvents(eRes.data || [])
      setDepartments(dRes.data || [])
    } catch {
      toast.error('Failed to load events. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Close card menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openCreateModal = () => {
    setEditingEvent(null)
    setForm({
      title: '',
      description: '',
      category: 'Cultural',
      eventDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      startTime: '09:30',
      endTime: '17:00',
      venue: 'BB Bhavan, Aditya University',
      department: departments[0]?.name || 'CSE Department',
      maximumParticipants: 150,
      registrationDeadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      status: 'ACTIVE'
    })
    setModalOpen(true)
  }

  const openEditModal = (ev) => {
    setEditingEvent(ev)
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      category: ev.category || 'Cultural',
      eventDate: ev.eventDate || '',
      startTime: ev.startTime || '09:30',
      endTime: ev.endTime || '17:00',
      venue: ev.venue || '',
      department: ev.department || 'CSE Department',
      maximumParticipants: ev.maximumParticipants || 150,
      registrationDeadline: ev.registrationDeadline || '',
      status: ev.status || 'ACTIVE'
    })
    setActiveMenuId(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Event title is required.')
      return
    }
    setSubmitting(true)
    try {
      if (editingEvent) {
        await eventService.update(editingEvent.id, form)
        toast.success(`Event "${form.title}" updated successfully!`)
      } else {
        await eventService.create(form)
        toast.success(`Event "${form.title}" published successfully!`)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await eventService.delete(deleteTarget.id)
      toast.success('Event deleted successfully.')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Failed to delete event.')
    }
  }

  const filteredEvents = events.filter(ev => {
    const matchesSearch = !search ||
      ev.title?.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase()) ||
      ev.venue?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || ev.category?.toUpperCase() === categoryFilter.toUpperCase()
    const matchesStatus = statusFilter === 'ALL' || ev.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getCategoryBadgeClass = (category) => {
    const c = (category || '').toLowerCase()
    if (c.includes('cultural')) return 'badge-purple'
    if (c.includes('academic') || c.includes('tech')) return 'badge-success'
    if (c.includes('sports')) return 'badge-blue'
    return 'badge-warning'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header matching Reference Image 1 */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Campus Events & Activities
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Organize, manage and track university events
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: 240 }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, height: 40, fontSize: 13, borderRadius: 10 }}
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-light)' }} />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`btn ${showFilterBar ? 'btn-primary' : 'btn-ghost'}`}
            style={{ height: 40, padding: '0 14px', gap: 6, fontSize: 13, borderRadius: 10 }}
          >
            <Filter size={15} />
            <span>Filter</span>
          </button>

          {/* Publish New Event Button (Gold) */}
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            style={{
              height: 40,
              padding: '0 18px',
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 10,
              background: '#d97706',
              borderColor: '#d97706',
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>Publish New Event</span>
          </button>
        </div>
      </div>

      {/* Expandable Filter Bar */}
      {showFilterBar && (
        <div style={{
          background: 'var(--surface)',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Category:</span>
            <select
              className="form-select"
              style={{ height: 34, fontSize: 12, width: 140 }}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Cultural">Cultural</option>
              <option value="Academic">Academic</option>
              <option value="Sports">Sports</option>
              <option value="Technical">Technical</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="form-select"
              style={{ height: 34, fontSize: 12, width: 140 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || search) && (
            <button
              onClick={() => { setCategoryFilter('ALL'); setStatusFilter('ALL'); setSearch('') }}
              style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Events Grid */}
      {loading ? (
        <TableSkeleton rows={3} cols={3} />
      ) : filteredEvents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Award size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No Events Found</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 20px' }}>
            {search || categoryFilter !== 'ALL' ? 'No events match your search criteria.' : 'Create and publish your first university event.'}
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ background: '#d97706', borderColor: '#d97706' }}>
            <Plus size={16} /> Publish New Event
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20
        }}>
          {filteredEvents.map(ev => {
            const isMenuOpen = activeMenuId === ev.id
            const regOpen = ev.status === 'ACTIVE' || ev.status === 'UPCOMING'

            return (
              <div
                key={ev.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 20,
                  position: 'relative',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Top Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className={`badge ${getCategoryBadgeClass(ev.category)}`} style={{ textTransform: 'capitalize' }}>
                    {ev.category || 'General'}
                  </span>
                  <span className={`badge ${regOpen ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 11 }}>
                    {regOpen ? 'Registration Open' : 'Registration Closed'}
                  </span>
                </div>

                {/* Event Title */}
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.3 }}>
                  {ev.title}
                </h3>

                {/* Date & Venue */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} style={{ color: '#d97706', flexShrink: 0 }} />
                    <span>{formatDate(ev.eventDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} style={{ color: '#0f766e', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.venue || 'Main Campus'}
                    </span>
                  </div>
                </div>

                {/* Description snippet */}
                <p style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  margin: '0 0 16px',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {ev.description || 'No description provided.'}
                </p>

                {/* Participants & Department Info Strip */}
                <div style={{
                  padding: '10px 12px',
                  background: 'var(--surface-secondary)',
                  borderRadius: 10,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#2563eb' }}>
                      <Users size={13} />
                      <span>{ev.participantCount || 0} Participants</span>
                    </div>
                    <span style={{ color: regOpen ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                      ● {regOpen ? 'Registration Open' : 'Closed'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)' }}>
                    <GraduationCap size={13} />
                    <span>Organized by: {ev.department || 'Aditya University'}</span>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  {/* View Details */}
                  <button
                    onClick={() => navigate(`/admin/events/${ev.id}`)}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
                  >
                    <span>View Details</span>
                  </button>

                  {/* Manage Dropdown Toggle */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActiveMenuId(isMenuOpen ? null : ev.id)}
                      className="btn btn-sm"
                      style={{
                        padding: '0 12px',
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        borderColor: '#d97706',
                        color: '#d97706',
                        background: 'transparent'
                      }}
                    >
                      <span>Manage</span>
                      <ChevronDown size={14} />
                    </button>

                    {/* Manage Dropdown Menu matching Image 1 */}
                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        style={{
                          position: 'absolute',
                          right: 0,
                          bottom: 'calc(100% + 6px)',
                          width: 200,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.18)',
                          padding: 6,
                          zIndex: 50
                        }}
                      >
                        <button
                          onClick={() => openEditModal(ev)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                            color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Edit size={14} style={{ color: '#2563eb' }} />
                          <span>Edit Event</span>
                        </button>

                        <button
                          onClick={() => navigate(`/admin/events/${ev.id}/coordinators`)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                            color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <UserCheck size={14} style={{ color: '#0f766e' }} />
                          <span>Manage Coordinators</span>
                        </button>

                        <button
                          onClick={() => navigate(`/admin/events/${ev.id}?tab=participants`)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                            color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Users size={14} style={{ color: '#d97706' }} />
                          <span>Manage Participants</span>
                        </button>

                        <button
                          onClick={() => navigate(`/admin/events/${ev.id}?tab=results`)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                            color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <CheckSquare size={14} style={{ color: '#7c3aed' }} />
                          <span>Manage Results</span>
                        </button>

                        <button
                          onClick={() => navigate(`/admin/events/${ev.id}?tab=certificates`)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                            color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <FileText size={14} style={{ color: '#0284c7' }} />
                          <span>Certificates</span>
                        </button>

                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                        <button
                          onClick={() => { setActiveMenuId(null); setDeleteTarget(ev); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                            color: '#dc2626', fontSize: 13, cursor: 'pointer', textAlign: 'left'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={14} />
                          <span>Delete Event</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Publish / Edit Event Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? 'Edit Event Details' : 'Publish New Campus Event'}
        size="md"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. TechWave 2026 - Hackathon"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="Cultural">Cultural</option>
                <option value="Academic">Academic</option>
                <option value="Technical">Technical</option>
                <option value="Sports">Sports</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Organizing Department *</label>
              <select
                className="form-select"
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
              >
                <option value="CSE Department">CSE Department</option>
                <option value="ECE Department">ECE Department</option>
                <option value="AI & ML Department">AI & ML Department</option>
                <option value="Sports Committee">Sports Committee</option>
                <option value="Student Affairs">Student Affairs</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Event Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.eventDate}
                onChange={e => setForm({ ...form, eventDate: e.target.value })}
                required
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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Venue *</label>
              <input
                className="form-input"
                value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })}
                required
                placeholder="e.g. BB Bhavan, Aditya University"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Participants</label>
              <input
                type="number"
                className="form-input"
                value={form.maximumParticipants}
                onChange={e => setForm({ ...form, maximumParticipants: Number(e.target.value) })}
                min={10}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the event, eligibility and schedule"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Registration Deadline</label>
              <input
                type="date"
                className="form-input"
                value={form.registrationDeadline}
                onChange={e => setForm({ ...form, registrationDeadline: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active (Registration Open)</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ background: '#d97706', borderColor: '#d97706' }}
            >
              {submitting ? 'Saving…' : editingEvent ? 'Save Changes' : 'Publish Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All coordinators and registrations will be removed.`}
        confirmText="Delete Event"
        danger
      />
    </div>
  )
}
