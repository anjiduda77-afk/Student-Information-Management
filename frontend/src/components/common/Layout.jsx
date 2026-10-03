import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationService, authService } from '../../services/api'
import {
  Menu, X, Bell, LogOut, User as UserIcon,
  Check, Shield, BookOpen, GraduationCap,
  KeyRound, Lock, Eye, EyeOff, ChevronDown
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import { Modal } from '../Modal'
import { toast } from '../Toast'
import AuLogo from './AuLogo'
import ThemeToggle from './ThemeToggle'
import AmbientBackground from './AmbientBackground'

export default function Layout({ children, navItems, role, basePath, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Update document title
  useEffect(() => {
    const title = pageTitle || navItems?.find(n => location.pathname.startsWith(`${basePath}/${n.path}`)
      || (n.path === '' && location.pathname === basePath)
      || (n.path === 'dashboard' && (location.pathname === basePath || location.pathname === `${basePath}/dashboard`))
    )?.label
    document.title = title ? `${title} | Aditya University SIS` : 'Aditya University SIS'
  }, [location.pathname, navItems, basePath, pageTitle])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Load notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationService.getMyNotifications()
        const data = res.data || []
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      } catch (e) {
        // silent fail
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (e) {
      // silent
    }
  }

  const handleMarkOneRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      // silent
    }
  }

  const [profileOpen, setProfileOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passLoading, setPassLoading] = useState(false)
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.')
      return
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New password and confirm password do not match.')
      return
    }
    setPassLoading(true)
    try {
      await authService.changePassword(passForm)
      toast.success('Password updated successfully!')
      setShowPasswordModal(false)
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password. Please check your current password.')
    } finally {
      setPassLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleTheme = {
    ADMIN:   { color: '#1e3a8a', title: 'Administrator Portal', badge: 'ADMIN', icon: Shield },
    FACULTY: { color: '#0f766e', title: 'Faculty Portal', badge: 'FACULTY', icon: BookOpen },
    STUDENT: { color: '#2563eb', title: 'Student Portal', badge: 'STUDENT', icon: GraduationCap }
  }[role] || { color: '#1e3a8a', title: 'University Portal', badge: role, icon: Shield }

  // Determine current page label for header
  const currentLabel = navItems?.find(n => {
    const fullPath = n.path ? `${basePath}/${n.path}` : basePath
    return location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`)
  })?.label || (location.pathname === basePath || location.pathname === `${basePath}/` ? navItems?.[0]?.label : 'Portal')

  return (
    <div className="app-shell">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <AuLogo size={36} />
          <div className="brand-text">
            <h2 className="brand-name">ADITYA UNIVERSITY</h2>
            <p className="brand-role">{roleTheme.title}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close-btn"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.slice(0, 2).toUpperCase() || 'AU'}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.name || 'User'}</p>
            <p className="user-id">{user?.studentId || user?.facultyId || user?.email}</p>
          </div>
          <span className="badge badge-primary" style={{ fontSize: 10, padding: '2px 6px', flexShrink: 0 }}>
            {roleTheme.badge}
          </span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems?.map(item => {
            const fullPath = item.path ? `${basePath}/${item.path}` : basePath
            const isActive = item.path === 'dashboard' || item.path === ''
              ? (location.pathname === basePath || location.pathname === `${basePath}/` || location.pathname === `${basePath}/dashboard`)
              : location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`)

            const Icon = item.icon

            return (
              <button
                key={item.path || 'dash'}
                onClick={() => {
                  navigate(fullPath)
                  setSidebarOpen(false)
                }}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                {Icon && <Icon size={18} className="nav-icon" />}
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge badge ${item.badgeColor || 'badge-primary'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Subtle Ambient floating background */}
        <AmbientBackground />

        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(true)}
              className="hamburger-btn"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="header-title-block">
              <h1 className="header-title">{currentLabel}</h1>
              <p className="header-subtitle">
                Aditya University &bull;{' '}
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="header-right">
            {/* Theme Toggle in Header */}
            <ThemeToggle className="header-theme-toggle" />

            {/* Notification Bell */}
            <div className="notif-wrapper">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="icon-btn"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notif-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>Notifications ({unreadCount} unread)</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="mark-all-btn">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">No notifications yet.</div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div
                          key={n.id}
                          onClick={() => !n.read && handleMarkOneRead(n.id)}
                          className={`notif-item ${!n.read ? 'notif-unread' : ''}`}
                        >
                          <div className="notif-dot" />
                          <div className="notif-content">
                            <p className="notif-title">{n.title}</p>
                            <p className="notif-msg">{n.message}</p>
                            <span className="notif-time">{formatDate(n.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill & Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="profile-pill"
                style={{ cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}
                aria-label="User profile menu"
              >
                <div className="profile-avatar">
                  {user?.name?.slice(0, 1).toUpperCase()}
                </div>
                <span className="profile-name">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              {profileOpen && (
                <div
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 230, background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                    padding: 8, zIndex: 100
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{user?.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</p>
                    <span className="badge badge-primary" style={{ marginTop: 6, fontSize: 10, display: 'inline-block' }}>{roleTheme.badge}</span>
                  </div>

                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      setShowPasswordModal(true)
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                      color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <KeyRound size={15} style={{ color: '#d97706' }} />
                    <span>Change Password</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent',
                      color: '#dc2626', fontSize: 13, cursor: 'pointer', textAlign: 'left', marginTop: 2
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="page-body">
          {children}
        </main>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Account Password"
        size="sm"
      >
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Ensure your account is using a long, random password to stay secure.
          </p>

          <div className="form-group">
            <label className="form-label">Current Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass.current ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: 36 }}
                value={passForm.currentPassword}
                onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                required
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showPass.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password * (Min 8 chars)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass.new ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: 36 }}
                value={passForm.newPassword}
                onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                required
                minLength={8}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass.confirm ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: 36 }}
                value={passForm.confirmPassword}
                onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                required
                minLength={8}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="btn btn-ghost"
              disabled={passLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={passLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <KeyRound size={16} />
              {passLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
