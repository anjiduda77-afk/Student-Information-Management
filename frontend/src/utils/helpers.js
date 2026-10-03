// Format numbers, dates, grades — consistent display helpers

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const date = new Date()
  date.setHours(parseInt(h), parseInt(m))
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function gradeColor(grade) {
  if (!grade) return '#94a3b8'
  const g = grade.toUpperCase()
  if (g === 'O') return '#16a34a'
  if (g === 'A+') return '#059669'
  if (g === 'A') return '#0891b2'
  if (g === 'B+') return '#7c3aed'
  if (g === 'B') return '#2563eb'
  if (g === 'C') return '#d97706'
  if (g === 'F') return '#dc2626'
  return '#64748b'
}

export function gradeLabel(grade) {
  const map = { O: 'Outstanding', 'A+': 'Excellent', A: 'Very Good', 'B+': 'Good', B: 'Average', C: 'Pass', F: 'Fail' }
  return map[grade?.toUpperCase()] || grade
}

export function attendanceStatusClass(status) {
  switch (status?.toUpperCase()) {
    case 'PRESENT': return 'badge-success'
    case 'ABSENT':  return 'badge-danger'
    case 'LATE':    return 'badge-warning'
    case 'EXCUSED': return 'badge-info'
    default:        return 'badge-neutral'
  }
}

export function eventStatusClass(status) {
  switch (status?.toUpperCase()) {
    case 'REGISTRATION_OPEN':   return 'badge-success'
    case 'REGISTRATION_CLOSED': return 'badge-warning'
    case 'ONGOING':             return 'badge-primary'
    case 'COMPLETED':           return 'badge-neutral'
    case 'CANCELLED':           return 'badge-danger'
    case 'DRAFT':               return 'badge-purple'
    default:                    return 'badge-neutral'
  }
}

export function eventStatusLabel(status) {
  const map = {
    REGISTRATION_OPEN:   'Registration Open',
    REGISTRATION_CLOSED: 'Registration Closed',
    ONGOING:             'Ongoing',
    COMPLETED:           'Completed',
    CANCELLED:           'Cancelled',
    DRAFT:               'Draft',
  }
  return map[status] || status
}

export function correctionStatusClass(status) {
  switch (status?.toUpperCase()) {
    case 'PENDING':  return 'badge-warning'
    case 'APPROVED': return 'badge-success'
    case 'REJECTED': return 'badge-danger'
    default:         return 'badge-neutral'
  }
}

export function avatarBg(name = '') {
  const colors = ['#e3f0ff','#fce7f3','#fef3c7','#dcfce7','#ede9fe','#cffafe','#fff7ed']
  const fgColors = ['#2563eb','#db2777','#d97706','#16a34a','#7c3aed','#0891b2','#ea580c']
  const idx = (name.charCodeAt(0) || 0) % colors.length
  return { bg: colors[idx], fg: fgColors[idx] }
}

export function truncate(text = '', max = 80) {
  return text.length > max ? text.slice(0, max) + '…' : text
}
