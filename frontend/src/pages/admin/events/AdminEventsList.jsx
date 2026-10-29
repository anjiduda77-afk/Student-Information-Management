import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventService, adminService } from '../../../services/api'
import { toast } from '../../../components/Toast'
import { Modal } from '../../../components/Modal'
import { TableSkeleton } from '../../../components/Loading'
import {
  Calendar, MapPin, Users, Award, Plus, Search, Filter,
  Edit, UserCheck, CheckSquare, FileText, Trash2, ChevronDown,
  X, Upload, Ban, AlertTriangle, Clock, Eye, MoreVertical,
  Image as ImageIcon, ZoomIn, CheckCircle2, Building
} from 'lucide-react'

// ─── Category colours ────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  Technical:  { bg: 'linear-gradient(135deg,#1e3a8a,#2563eb)', chip: '#3b82f6', label: '💻' },
  Cultural:   { bg: 'linear-gradient(135deg,#7c3aed,#a855f7)', chip: '#8b5cf6', label: '🎭' },
  Sports:     { bg: 'linear-gradient(135deg,#065f46,#059669)', chip: '#10b981', label: '⚽' },
  Academic:   { bg: 'linear-gradient(135deg,#92400e,#d97706)', chip: '#f59e0b', label: '📚' },
  Workshop:   { bg: 'linear-gradient(135deg,#0c4a6e,#0284c7)', chip: '#06b6d4', label: '🔧' },
}
const getCfg = (cat) => CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Technical

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    REGISTRATION_OPEN:   { label: 'Open',     bg: '#22c55e', color: '#fff' },
    REGISTRATION_CLOSED: { label: 'Closed',   bg: '#94a3b8', color: '#fff' },
    ONGOING:             { label: 'Ongoing',  bg: '#f59e0b', color: '#fff' },
    COMPLETED:           { label: 'Completed',bg: '#6366f1', color: '#fff' },
    CANCELLED:           { label: 'Cancelled',bg: '#ef4444', color: '#fff' },
  }
  const s = map[status] || { label: status, bg: '#94a3b8', color: '#fff' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color, letterSpacing: 0.4, whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ ev, onView, onEdit, onCoordinators, onParticipants, onResults, onCertificates, onDelete, onPosterView }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const cfg = getCfg(ev.category)

  useEffect(() => {
    const fn = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const hasPoster = Boolean(ev.posterUrl)
  const filled = ev.maxParticipants > 0
    ? Math.min(100, Math.round(((ev.participantCount || 0) / ev.maxParticipants) * 100))
    : 0

  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden', background: 'var(--surface)',
      border: '1px solid var(--card-border)',
      boxShadow: '0 4px 18px -4px rgba(0,0,0,0.10)',
      display: 'flex', flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px -6px rgba(0,0,0,0.18)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px -4px rgba(0,0,0,0.10)' }}
    >
      {/* ── Poster / Banner ── */}
      <div
        style={{
          height: 190,
          position: 'relative',
          background: hasPoster ? '#000' : cfg.bg,
          cursor: hasPoster ? 'zoom-in' : 'pointer',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        onClick={() => hasPoster ? onPosterView(ev) : onView(ev.id)}
      >
        {hasPoster ? (
          <>
            <img
              src={ev.posterUrl}
              alt={ev.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* zoom hint */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.30)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
            >
              <div style={{
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                borderRadius: 10, padding: '6px 14px', fontSize: 12, color: '#fff',
                fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                opacity: 0, transition: 'opacity 0.2s',
              }}
                className="poster-zoom-hint"
              >
                <ZoomIn size={14} /> View Poster
              </div>
            </div>
            {/* gradient overlay at bottom */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
              pointerEvents: 'none',
            }} />
          </>
        ) : (
          <>
            {/* Decorative icon when no poster */}
            <div style={{
              position: 'absolute', right: -20, bottom: -20,
              fontSize: 110, opacity: 0.12, pointerEvents: 'none', lineHeight: 1,
            }}>
              {cfg.label}
            </div>
          </>
        )}

        {/* Top chips */}
        <div style={{
          position: 'absolute', top: 10, left: 12, right: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          pointerEvents: 'none',
        }}>
          <span style={{
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
          }}>
            {cfg.label} {ev.category}
          </span>
          <StatusBadge status={ev.status} />
        </div>

        {/* Bottom date strip if poster */}
        {hasPoster && ev.eventDate && (
          <div style={{
            position: 'absolute', bottom: 8, left: 12,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
            color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 5,
            pointerEvents: 'none',
          }}>
            <Calendar size={11} />
            {new Date(ev.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* ── Card Body ── */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3
            style={{
              margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text)',
              lineHeight: 1.3, flex: 1, cursor: 'pointer',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}
            onClick={() => onView(ev.id)}
          >
            {ev.title}
          </h3>

          {/* ⋮ menu */}
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
              style={{
                background: 'var(--surface-secondary)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center',
              }}
              title="More actions"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 36, zIndex: 200,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, boxShadow: '0 8px 28px -4px rgba(0,0,0,0.18)',
                minWidth: 188, padding: 6, animation: 'fadeIn 0.15s ease',
              }}>
                <MenuItem icon={<Eye size={14} color="#2563eb"/>} label="View Details"       onClick={() => { setMenuOpen(false); onView(ev.id) }} />
                <MenuItem icon={<Edit size={14} color="#d97706"/>} label="Edit Event"         onClick={() => { setMenuOpen(false); onEdit(ev) }} />
                <MenuItem icon={<UserCheck size={14} color="#0f766e"/>} label="Coordinators"  onClick={() => { setMenuOpen(false); onCoordinators(ev.id) }} />
                <MenuItem icon={<Users size={14} color="#7c3aed"/>} label="Participants"      onClick={() => { setMenuOpen(false); onParticipants(ev.id) }} />
                <MenuItem icon={<CheckSquare size={14} color="#059669"/>} label="Results"     onClick={() => { setMenuOpen(false); onResults(ev.id) }} />
                <MenuItem icon={<FileText size={14} color="#0284c7"/>} label="Certificates"   onClick={() => { setMenuOpen(false); onCertificates(ev.id) }} />
                {hasPoster && (
                  <MenuItem icon={<ZoomIn size={14} color="#6366f1"/>} label="View Poster"    onClick={() => { setMenuOpen(false); onPosterView(ev) }} />
                )}
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <MenuItem icon={<Trash2 size={14} color="#dc2626"/>} label="Cancel / Delete"  onClick={() => { setMenuOpen(false); onDelete(ev) }} danger />
              </div>
            )}
          </div>
        </div>

        {/* Venue & Date info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <Calendar size={13} style={{ flexShrink: 0, color: '#d97706' }} />
            <span>{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
          </div>
          {ev.startTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <Clock size={13} style={{ flexShrink: 0, color: '#0284c7' }} />
              <span>{ev.startTime?.slice(0, 5)} – {ev.endTime?.slice(0, 5)}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <MapPin size={13} style={{ flexShrink: 0, color: '#7c3aed' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.venue || '—'}</span>
          </div>
        </div>

        {/* Capacity bar */}
        {ev.maxParticipants > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span><Users size={11} style={{ verticalAlign: 'middle' }} /> {ev.participantCount || 0} registered</span>
              <span style={{ fontWeight: 700 }}>{filled}% full</span>
            </div>
            <div style={{ height: 5, background: 'var(--surface-secondary)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${filled}%`,
                background: filled > 90 ? '#ef4444' : filled > 70 ? '#f59e0b' : '#22c55e',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* Footer action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          <button
            onClick={() => onView(ev.id)}
            className="btn btn-sm"
            style={{
              flex: 1, background: 'var(--surface-secondary)', color: 'var(--text)',
              border: '1px solid var(--border)', fontWeight: 700, fontSize: 12,
            }}
          >
            <Eye size={13} /> View
          </button>
          <button
            onClick={() => onEdit(ev)}
            className="btn btn-sm"
            style={{
              flex: 1, background: '#d97706', color: '#fff',
              border: 'none', fontWeight: 700, fontSize: 12,
            }}
          >
            <Edit size={13} /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8, border: 'none',
        background: hov ? (danger ? '#fef2f2' : 'var(--surface-secondary)') : 'transparent',
        color: danger ? '#dc2626' : 'var(--text)', fontSize: 13,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ─── Poster Lightbox ──────────────────────────────────────────────────────────
function PosterLightbox({ event, onClose, onEdit }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  if (!event) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 24,
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', borderRadius: 10, padding: '6px 14px', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <X size={15} /> Close (Esc)
      </button>

      {/* Poster image */}
      <img
        src={event.posterUrl}
        alt={event.title}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '88vw', maxHeight: '82vh',
          borderRadius: 16, objectFit: 'contain',
          boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
        }}
      />

      {/* Meta strip */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          marginTop: 18, display: 'flex', alignItems: 'center', gap: 16,
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 14, padding: '12px 24px', color: '#fff', flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{event.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            {event.category} · {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} · {event.venue}
          </div>
        </div>
        <button
          onClick={() => { onClose(); onEdit(event) }}
          style={{
            background: '#d97706', border: 'none', color: '#fff',
            borderRadius: 10, padding: '8px 18px', fontWeight: 700,
            fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Edit size={14} /> Edit Event
        </button>
      </div>
    </div>
  )
}

// ─── Poster Upload Panel ──────────────────────────────────────────────────────
function PosterUploader({ value, onChange }) {
  const [mode, setMode] = useState(value?.startsWith('data:') ? 'upload' : value ? 'url' : 'upload')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const processFile = (file) => {
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
        onChange(canvas.toDataURL('image/jpeg', 0.88))
        toast.success(`"${file.name}" uploaded & optimised!`)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const presets = [
    { label: '💻 Tech', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80' },
    { label: '🎭 Cultural', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80' },
    { label: '⚽ Sports', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80' },
    { label: '🤖 AI/ML', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80' },
    { label: '🎓 Academic', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80' },
    { label: '🏆 Awards', url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=900&q=80' },
  ]

  const tabs = [
    { id: 'upload', label: '⬆ Upload File' },
    { id: 'url', label: '🔗 Image URL' },
    { id: 'presets', label: '🖼 Presets' },
  ]

  return (
    <div>
      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: 4, background: 'var(--surface-secondary)',
        borderRadius: 10, padding: 3, marginBottom: 10,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
              fontWeight: 700, fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit',
              background: mode === t.id ? 'var(--primary)' : 'transparent',
              color: mode === t.id ? 'var(--primary-text)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upload drop zone */}
      {mode === 'upload' && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]) }}
          style={{
            border: `2px dashed ${dragging ? '#d97706' : 'var(--border)'}`,
            borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(217,119,6,0.06)' : 'var(--surface-secondary)',
            transition: 'all 0.2s',
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => processFile(e.target.files?.[0])} />
          <Upload size={28} style={{ color: '#d97706', margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
            {dragging ? 'Drop it here!' : 'Click or drag & drop poster image'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            PNG, JPG, WEBP — auto-optimised to 1400px max
          </div>
        </div>
      )}

      {/* URL input */}
      {mode === 'url' && (
        <input
          className="form-input"
          value={value?.startsWith('data:') ? '' : (value || '')}
          onChange={e => onChange(e.target.value)}
          placeholder="https://your-poster-image-url.jpg"
        />
      )}

      {/* Presets */}
      {mode === 'presets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {presets.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.url)}
              style={{
                border: value === p.url ? '2px solid #d97706' : '2px solid var(--border)',
                borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                background: 'none', padding: 0, position: 'relative',
              }}
            >
              <img src={p.url} alt={p.label} style={{ width: '100%', height: 60, objectFit: 'cover', display: 'block' }} />
              <div style={{
                fontSize: 10, fontWeight: 700, padding: '3px 0',
                background: value === p.url ? '#d97706' : 'var(--surface-secondary)',
                color: value === p.url ? '#fff' : 'var(--text-muted)',
              }}>
                {p.label}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Live preview */}
      {value && (
        <div style={{
          marginTop: 10, borderRadius: 12, overflow: 'hidden',
          position: 'relative', border: '1px solid var(--border)',
        }}>
          <img src={value} alt="Preview" style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 60%)',
            display: 'flex', alignItems: 'center', paddingLeft: 14,
          }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.5)', padding: '3px 10px', borderRadius: 20 }}>
              ✓ Poster Preview
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(220,38,38,0.9)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '4px 10px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <X size={11} /> Remove
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main AdminEventsList ─────────────────────────────────────────────────────
export default function AdminEventsList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showFilter, setShowFilter] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [departments, setDepartments] = useState([])

  const emptyForm = {
    title: '', description: '', category: 'Technical', posterUrl: '',
    eventDate: '', startTime: '09:30', endTime: '17:00',
    venue: 'BB Bhavan, Aditya University',
    department: 'CSE Department', maxParticipants: 150,
    registrationDeadline: '', status: 'REGISTRATION_OPEN',
  }
  const [form, setForm] = useState(emptyForm)

  // Removal modal
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [confirmTxt, setConfirmTxt] = useState('')

  // Poster lightbox
  const [lightboxEvent, setLightboxEvent] = useState(null)

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
      toast.error('Failed to load events.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setEditingEvent(null)
    setForm({
      ...emptyForm,
      eventDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      registrationDeadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      department: departments[0]?.name || 'CSE Department',
    })
    setModalOpen(true)
  }

  const openEdit = (ev) => {
    setEditingEvent(ev)
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      category: ev.category || 'Technical',
      posterUrl: ev.posterUrl || '',
      eventDate: ev.eventDate || '',
      startTime: ev.startTime ? ev.startTime.slice(0, 5) : '09:30',
      endTime: ev.endTime ? ev.endTime.slice(0, 5) : '17:00',
      venue: ev.venue || '',
      department: ev.department || 'CSE Department',
      maxParticipants: ev.maxParticipants || 150,
      registrationDeadline: ev.registrationDeadline ? ev.registrationDeadline.split('T')[0] : '',
      status: ev.status || 'REGISTRATION_OPEN',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Event title is required.'); return }
    if (!form.eventDate) { toast.error('Event date is required.'); return }
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      toast.error('End time must be after start time.'); return
    }
    setSubmitting(true)
    const payload = {
      ...form,
      registrationDeadline: form.registrationDeadline
        ? (form.registrationDeadline.includes('T') ? form.registrationDeadline : `${form.registrationDeadline}T23:59:00`)
        : null,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      startTime: form.startTime ? (form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime) : null,
      endTime: form.endTime ? (form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime) : null,
    }
    try {
      if (editingEvent) {
        await eventService.update(editingEvent.id, payload)
        toast.success(`"${form.title}" updated!`)
      } else {
        await eventService.create(payload)
        toast.success(`"${form.title}" published!`)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelEvent = async () => {
    if (!deleteTarget) return
    try {
      await eventService.updateStatus(deleteTarget.id, 'CANCELLED')
      toast.success(`"${deleteTarget.title}" marked as CANCELLED.`)
      setDeleteTarget(null); setConfirmTxt(''); loadData()
    } catch { toast.error('Failed to cancel event.') }
  }

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return
    try {
      await eventService.delete(deleteTarget.id)
      toast.success('Event permanently deleted.')
      setDeleteTarget(null); setConfirmTxt(''); loadData()
    } catch { toast.error('Failed to delete event.') }
  }

  const filtered = events.filter(ev => {
    const q = search.toLowerCase()
    const matchQ = !q || ev.title?.toLowerCase().includes(q) || ev.venue?.toLowerCase().includes(q)
    const matchC = catFilter === 'ALL' || ev.category?.toUpperCase() === catFilter.toUpperCase()
    const matchS = statusFilter === 'ALL' || ev.status === statusFilter
    return matchQ && matchC && matchS
  })

  // Stats
  const total = events.length
  const open = events.filter(e => e.status === 'REGISTRATION_OPEN').length
  const completed = events.filter(e => e.status === 'COMPLETED').length
  const totalParticipants = events.reduce((a, e) => a + (e.participantCount || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', margin: '0 0 3px', letterSpacing: '-0.3px' }}>
            Campus Events &amp; Activities
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Publish, manage and track all university campus events
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn"
          style={{
            background: '#d97706', color: '#fff', border: 'none',
            fontWeight: 800, fontSize: 13, padding: '10px 20px',
            borderRadius: 12, boxShadow: '0 4px 14px rgba(217,119,6,0.30)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <Plus size={16} /> Publish New Event
        </button>
      </div>

      {/* ── Quick Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
        {[
          { label: 'Total Events', val: total, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Open for Registration', val: open, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Completed', val: completed, color: '#7c3aed', bg: '#faf5ff' },
          { label: 'Total Participants', val: totalParticipants, color: '#d97706', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 14, padding: '14px 18px',
            border: `1px solid ${s.color}22`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, opacity: 0.75, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter bar ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            className="form-input"
            style={{ paddingLeft: 36, height: 40, borderRadius: 10 }}
            placeholder="Search events by title, venue…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-light)' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <select
          className="form-select"
          style={{ height: 40, width: 150, borderRadius: 10 }}
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          {['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="form-select"
          style={{ height: 40, width: 160, borderRadius: 10 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="REGISTRATION_OPEN">Open</option>
          <option value="REGISTRATION_CLOSED">Closed</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {(catFilter !== 'ALL' || statusFilter !== 'ALL' || search) && (
          <button
            onClick={() => { setCatFilter('ALL'); setStatusFilter('ALL'); setSearch('') }}
            style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            ✕ Clear
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Events Grid ── */}
      {loading ? (
        <TableSkeleton rows={2} cols={3} />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Award size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No Events Found</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto 20px' }}>
            {search || catFilter !== 'ALL' ? 'No events match your filters.' : 'Create and publish your first university campus event.'}
          </p>
          <button onClick={openCreate} className="btn" style={{ background: '#d97706', color: '#fff', border: 'none', fontWeight: 700 }}>
            <Plus size={15} /> Publish Event
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {filtered.map(ev => (
            <EventCard
              key={ev.id}
              ev={ev}
              onView={(id) => navigate(`/admin/events/${id}`)}
              onEdit={openEdit}
              onCoordinators={(id) => navigate(`/admin/events/${id}/coordinators`)}
              onParticipants={(id) => navigate(`/admin/events/${id}?tab=participants`)}
              onResults={(id) => navigate(`/admin/events/${id}?tab=results`)}
              onCertificates={(id) => navigate(`/admin/events/${id}?tab=certificates`)}
              onDelete={(ev) => { setDeleteTarget(ev); setConfirmTxt('') }}
              onPosterView={(ev) => setLightboxEvent(ev)}
            />
          ))}
        </div>
      )}

      {/* ── Poster Lightbox ── */}
      {lightboxEvent && (
        <PosterLightbox
          event={lightboxEvent}
          onClose={() => setLightboxEvent(null)}
          onEdit={(ev) => { setLightboxEvent(null); openEdit(ev) }}
        />
      )}

      {/* ── Publish / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? `✏️ Edit: ${editingEvent.title?.slice(0, 40)}` : '📢 Publish New Campus Event'}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. TechWave 2026 — National Hackathon"
            />
          </div>

          {/* Poster */}
          <div className="form-group">
            <label className="form-label">Event Poster / Banner</label>
            <PosterUploader value={form.posterUrl} onChange={(url) => setForm({ ...form, posterUrl: url })} />
          </div>

          {/* Category & Department */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {['Technical', 'Cultural', 'Academic', 'Sports', 'Workshop'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Organising Dept.</label>
              <select className="form-select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                {['CSE Department', 'ECE Department', 'AI & ML Department', 'Sports Committee', 'Student Affairs',
                  ...departments.map(d => d.name)].filter((v, i, a) => a.indexOf(v) === i).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Date / Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Event Date *</label>
              <input type="date" className="form-input" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input type="time" className="form-input" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input type="time" className="form-input" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>

          {/* Venue & Participants */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Venue *</label>
              <input className="form-input" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="e.g. BB Bhavan, Aditya University" required />
            </div>
            <div className="form-group">
              <label className="form-label">Max Participants</label>
              <input type="number" className="form-input" value={form.maxParticipants} min={1} onChange={e => setForm({ ...form, maxParticipants: Number(e.target.value) })} />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief event overview, eligibility, prizes, schedule…" />
          </div>

          {/* Deadline & Status */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Registration Deadline</label>
              <input type="date" className="form-input" value={form.registrationDeadline} onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="REGISTRATION_OPEN">Registration Open</option>
                <option value="REGISTRATION_CLOSED">Registration Closed</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={submitting}>Cancel</button>
            <button
              type="submit"
              className="btn"
              disabled={submitting}
              style={{ background: '#d97706', color: '#fff', border: 'none', fontWeight: 800 }}
            >
              {submitting ? 'Saving…' : editingEvent ? '✓ Save Changes' : '📢 Publish Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Removal / Cancellation Modal ── */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => { setDeleteTarget(null); setConfirmTxt('') }}
        title="Event Removal Controls"
        size="md"
      >
        {deleteTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Event summary */}
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              {deleteTarget.posterUrl && (
                <img src={deleteTarget.posterUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#991b1b' }}>{deleteTarget.title}</div>
                <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 3 }}>
                  {deleteTarget.category} · {deleteTarget.eventDate} · <strong>{deleteTarget.participantCount || 0} participants</strong>
                </div>
              </div>
            </div>

            {/* Option 1: Cancel */}
            <div style={{ background: 'var(--surface-secondary)', borderRadius: 12, padding: 14, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ban size={15} style={{ color: '#d97706' }} /> 1. Cancel Event (Recommended)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  Sets status to CANCELLED — preserves all registration history for records.
                </div>
              </div>
              <button type="button" onClick={handleCancelEvent} className="btn btn-sm" style={{ background: '#d97706', color: '#fff', border: 'none', fontWeight: 800, whiteSpace: 'nowrap' }}>
                Cancel Event
              </button>
            </div>

            {/* Option 2: Purge */}
            <div style={{ background: '#fef2f2', borderRadius: 12, padding: 14, border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={15} /> 2. Permanently Purge Event
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Completely removes this event and all registrations. Type <strong>DELETE</strong> to confirm:
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ fontSize: 12, height: 36 }}
                  placeholder='Type "DELETE" to confirm'
                  value={confirmTxt}
                  onChange={e => setConfirmTxt(e.target.value)}
                />
                <button
                  type="button"
                  disabled={confirmTxt !== 'DELETE'}
                  onClick={handlePermanentDelete}
                  className="btn btn-sm"
                  style={{ background: confirmTxt === 'DELETE' ? '#dc2626' : '#cbd5e1', color: '#fff', border: 'none', fontWeight: 800, whiteSpace: 'nowrap', cursor: confirmTxt === 'DELETE' ? 'pointer' : 'not-allowed' }}
                >
                  Purge Event
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setDeleteTarget(null); setConfirmTxt('') }} className="btn btn-ghost">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .poster-zoom-hint { opacity: 0 !important; transition: opacity 0.2s; }
        div:hover > div > .poster-zoom-hint { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
