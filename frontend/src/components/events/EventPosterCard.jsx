import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, MapPin, Users, Award, ChevronRight,
  Sparkles, Code, Trophy, BookOpen, Wrench, CheckCircle2,
  ExternalLink, AlertCircle
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

// Category theme styling helper
export const getCategoryTheme = (category = '') => {
  const cat = category.toLowerCase()
  if (cat.includes('tech') || cat.includes('hack') || cat.includes('code')) {
    return {
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)',
      accentColor: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      badgeColor: '#38bdf8',
      icon: Code,
      fallbackPattern: 'radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.25) 0%, transparent 60%)'
    }
  }
  if (cat.includes('cultural') || cat.includes('art') || cat.includes('music') || cat.includes('dance')) {
    return {
      gradient: 'linear-gradient(135deg, #4c0519 0%, #831843 50%, #d97706 100%)',
      accentColor: '#f43f5e',
      badgeBg: 'rgba(244, 63, 94, 0.15)',
      badgeColor: '#fb7185',
      icon: Sparkles,
      fallbackPattern: 'radial-gradient(circle at 20% 80%, rgba(217, 119, 6, 0.3) 0%, transparent 60%)'
    }
  }
  if (cat.includes('sport') || cat.includes('athletic')) {
    return {
      gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)',
      accentColor: '#fb923c',
      badgeBg: 'rgba(251, 146, 60, 0.15)',
      badgeColor: '#fdba74',
      icon: Trophy,
      fallbackPattern: 'radial-gradient(circle at 75% 25%, rgba(251, 146, 60, 0.3) 0%, transparent 60%)'
    }
  }
  if (cat.includes('workshop') || cat.includes('hands-on') || cat.includes('bootcamp')) {
    return {
      gradient: 'linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #0d9488 100%)',
      accentColor: '#2dd4bf',
      badgeBg: 'rgba(45, 212, 191, 0.15)',
      badgeColor: '#5eead4',
      icon: Wrench,
      fallbackPattern: 'radial-gradient(circle at 30% 30%, rgba(45, 212, 191, 0.25) 0%, transparent 60%)'
    }
  }
  return {
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    accentColor: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.15)',
    badgeColor: '#a5b4fc',
    icon: BookOpen,
    fallbackPattern: 'radial-gradient(circle at 50% 50%, rgba(129, 140, 248, 0.2) 0%, transparent 60%)'
  }
}

// Format month & day for the poster calendar stamp
export const getPosterDateParts = (dateStr) => {
  if (!dateStr) return { month: 'TBA', day: '--', year: '2026' }
  try {
    const d = new Date(dateStr)
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    const day = String(d.getDate()).padStart(2, '0')
    const year = String(d.getFullYear())
    return { month, day, year }
  } catch {
    return { month: 'EVT', day: '01', year: '2026' }
  }
}

export default function EventPosterCard({
  event,
  role = 'ADMIN',
  basePath = '/admin',
  onRegister,
  onCancelRegistration,
  isRegistering = false,
  extraActions,
  showManageMenu = false,
  activeMenuId = null,
  setActiveMenuId = () => {},
  menuRef = null,
  menuContent = null
}) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const theme = getCategoryTheme(event.category)
  const dateParts = getPosterDateParts(event.eventDate)
  const ThemeIcon = theme.icon

  const isRegOpen = event.status === 'REGISTRATION_OPEN' || event.status === 'ACTIVE' || event.status === 'UPCOMING'
  const isCompleted = event.status === 'COMPLETED'
  const isOngoing = event.status === 'ONGOING'
  const isCancelled = event.status === 'CANCELLED'

  const maxCap = event.maxParticipants || 150
  const count = event.participantCount || 0
  const fillPct = Math.min(100, Math.round((count / maxCap) * 100))

  const detailsUrl = `${basePath}/events/${event.id}`

  const handleCardClick = (e) => {
    // If clicked on an interactive button/menu, do not navigate
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.no-card-nav')) {
      return
    }
    navigate(detailsUrl)
  }

  return (
    <div
      onClick={handleCardClick}
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
        boxShadow: '0 4px 14px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.05)'
      }}
    >
      {/* ============================================================== */}
      {/* 1. VISUAL POSTER HEADER BANNER */}
      {/* ============================================================== */}
      <div
        style={{
          position: 'relative',
          height: 170,
          width: '100%',
          overflow: 'hidden',
          background: theme.gradient,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 14,
          boxSizing: 'border-box'
        }}
      >
        {/* Background poster image if provided and valid */}
        {event.posterUrl && !imgError ? (
          <>
            <img
              src={event.posterUrl}
              alt={event.title}
              onError={() => setImgError(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 1,
                transition: 'transform 0.4s ease'
              }}
            />
            {/* Dark gradient overlay for contrast */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)',
                zIndex: 2
              }}
            />
          </>
        ) : (
          /* Rich stylized procedural poster graphics */
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.fallbackPattern,
              zIndex: 1,
              opacity: 0.9
            }}
          >
            {/* Themed watermark background icon */}
            <ThemeIcon
              size={130}
              style={{
                position: 'absolute',
                right: -20,
                bottom: -25,
                color: 'rgba(255, 255, 255, 0.08)',
                pointerEvents: 'none'
              }}
            />
            {/* Ambient circuit / star dot lines */}
            <div
              style={{
                position: 'absolute',
                left: 16,
                bottom: 12,
                fontSize: 10,
                fontFamily: 'monospace',
                letterSpacing: 2,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase'
              }}
            >
              ADITYA UNIVERSITY &bull; {event.eventCode || 'CAMPUS EVENT'}
            </div>
          </div>
        )}

        {/* Top Overlay Strip: Date Stamp & Category Pill */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Calendar Date Stamp */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              minWidth: 46
            }}
          >
            <div
              style={{
                background: '#d97706',
                color: '#fff',
                width: '100%',
                textAlign: 'center',
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 1,
                padding: '2px 6px'
              }}
            >
              {dateParts.month}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: '#0f172a',
                padding: '2px 6px 4px',
                lineHeight: 1
              }}
            >
              {dateParts.day}
            </div>
          </div>

          {/* Category Chip + Registered Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <ThemeIcon size={12} style={{ color: theme.accentColor }} />
              <span>{event.category || 'General'}</span>
            </span>

            {/* If Student is registered */}
            {event.registered && (
              <span
                style={{
                  background: '#15803d',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 6px rgba(21, 128, 61, 0.4)'
                }}
              >
                <CheckCircle2 size={11} />
                <span>REGISTERED</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Overlay Strip: Status Pill */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.3,
              backdropFilter: 'blur(8px)',
              background: isRegOpen
                ? 'rgba(21, 128, 61, 0.85)'
                : isCompleted
                ? 'rgba(71, 85, 105, 0.85)'
                : isOngoing
                ? 'rgba(37, 99, 235, 0.85)'
                : isCancelled
                ? 'rgba(220, 38, 38, 0.85)'
                : 'rgba(217, 119, 6, 0.85)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            {isRegOpen ? '● Registration Open' : isCompleted ? 'Completed' : isOngoing ? '● Ongoing' : isCancelled ? 'Cancelled' : 'Closed'}
          </span>

          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {event.startTime ? event.startTime.slice(0, 5) : '09:30'} {event.endTime ? `– ${event.endTime.slice(0, 5)}` : ''}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. POSTER BODY DETAILS */}
      {/* ============================================================== */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* Title */}
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text)',
              margin: '0 0 4px',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            title={event.title}
          >
            {event.title}
          </h3>
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-light)',
              margin: 0,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>Organized by:</span>
            <strong style={{ color: 'var(--text-muted)' }}>{event.organizer || event.department || 'Aditya University'}</strong>
          </p>
        </div>

        {/* Date & Venue Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Calendar size={14} style={{ color: '#d97706', flexShrink: 0 }} />
            <span>{formatDate(event.eventDate)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <MapPin size={14} style={{ color: '#0f766e', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.venue || 'Aditya University Campus'}
            </span>
          </div>
        </div>

        {/* Capacity / Participant Progress Bar */}
        <div style={{ background: 'var(--surface-secondary)', padding: '8px 10px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
            <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={12} />
              <span>{count} / {maxCap} Seats</span>
            </span>
            <span style={{ color: fillPct >= 90 ? '#dc2626' : 'var(--text-muted)' }}>
              {fillPct}% Filled
            </span>
          </div>
          {/* Progress fill bar */}
          <div style={{ width: '100%', height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${fillPct}%`,
                height: '100%',
                background: fillPct >= 90 ? '#dc2626' : fillPct >= 60 ? '#d97706' : '#2563eb',
                borderRadius: 3,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Registration Deadline Pill if upcoming */}
        {event.registrationDeadline && isRegOpen && (
          <div style={{ fontSize: 11, color: '#b45309', background: '#fef3c7', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
            <Clock size={12} />
            <span>Registration closes: {formatDate(event.registrationDeadline)}</span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. CARD BOTTOM ACTION BAR */}
      {/* ============================================================== */}
      <div
        className="no-card-nav"
        style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        {/* Primary View Details Button */}
        <button
          type="button"
          onClick={() => navigate(detailsUrl)}
          className="btn btn-sm btn-ghost"
          style={{
            flex: 1,
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--text)',
            gap: 4
          }}
        >
          <span>View Details</span>
          <ChevronRight size={14} />
        </button>

        {/* STUDENT ROLE: Register or Cancel Button */}
        {role === 'STUDENT' && isRegOpen && (
          event.registered ? (
            <button
              type="button"
              disabled={isRegistering}
              onClick={(e) => { e.stopPropagation(); onCancelRegistration?.(event.id) }}
              className="btn btn-sm"
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#dc2626',
                border: '1px solid #fca5a5',
                background: '#fef2f2'
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              disabled={isRegistering}
              onClick={(e) => { e.stopPropagation(); onRegister?.(event.id) }}
              className="btn btn-sm btn-primary"
              style={{
                fontSize: 11,
                fontWeight: 800,
                background: '#d97706',
                borderColor: '#d97706',
                gap: 4
              }}
            >
              <span>Register</span>
            </button>
          )
        )}

        {/* FACULTY / ADMIN Extra Action Buttons */}
        {extraActions}

        {/* ADMIN ROLE: Manage Menu Dropdown */}
        {showManageMenu && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveMenuId(activeMenuId === event.id ? null : event.id)
              }}
              className="btn btn-sm"
              style={{
                padding: '0 10px',
                fontSize: 12,
                fontWeight: 700,
                borderColor: '#d97706',
                color: '#d97706',
                background: 'transparent'
              }}
            >
              <span>Manage</span>
            </button>

            {activeMenuId === event.id && (
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
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                  padding: 6,
                  zIndex: 60
                }}
              >
                {menuContent}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

