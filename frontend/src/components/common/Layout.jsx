import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/api'
import {
  Menu, X, Bell, LogOut, User as UserIcon,
  Check, Shield, BookOpen, GraduationCap
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
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

            {/* Profile Pill */}
            <div className="profile-pill">
              <div className="profile-avatar">
                {user?.name?.slice(0, 1).toUpperCase()}
              </div>
              <span className="profile-name">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  )
}
