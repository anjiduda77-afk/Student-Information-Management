import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { toast } from '../components/Toast'
import { Spinner } from '../components/Loading'
import AuLogo from '../components/common/AuLogo'
import ThemeToggle from '../components/common/ThemeToggle'
import AntigravityCanvas from '../components/common/AntigravityCanvas'
import { Shield, Eye, EyeOff, ShieldCheck, GraduationCap, Users } from 'lucide-react'

import { isValidEmail } from '../utils/validators'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const logoRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanId = identifier.trim()
    const cleanPw = password.trim()

    if (!cleanId) {
      toast.warning('Please enter your university email or ID.')
      return
    }
    if (cleanId.includes('@') && !isValidEmail(cleanId)) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (!cleanPw) {
      toast.warning('Please enter your password.')
      return
    }
    setLoading(true)
    try {
      const user = await login(cleanId, cleanPw)
      toast.success(`Welcome to Aditya University, ${user.name?.split(' ')[0] || 'User'}!`)
      const role = user.role?.toUpperCase()
      if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true })
      else if (role === 'FACULTY') navigate('/faculty/dashboard', { replace: true })
      else navigate('/student/dashboard', { replace: true })
    } catch (e) {
      console.error('Login failure:', e)
      const msg = e?.response?.data?.message || e?.message || 'Invalid credentials. Please verify your email/ID and password.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    const creds = {
      admin:   { id: '1122',                           pw: 'aditya1' },
      faculty: { id: 'priya.sharma@apex.edu.in',        pw: 'faculty123' },
      student: { id: 'rahul.gupta@student.apex.edu.in', pw: 'student123' },
    }
    setIdentifier(creds[role].id)
    setPassword(creds[role].pw)
    toast.info(`Filled demo ${role} credentials`)
  }

  return (
    <div className={`au-login-viewport ${isDark ? 'mode-dark' : 'mode-bright'}`}>
      {/* 5 Interactive Floating 3D Antigravity Balls moving freely across entire screen */}
      <AntigravityCanvas isDark={isDark} cardRef={cardRef} logoRef={logoRef} />

      {/* Top Header Bar with Theme Toggle only */}
      <header className="au-login-header">
        <div className="au-header-left" />
        <div className="au-header-right">
          <ThemeToggle />
        </div>
      </header>

      {/* Central Content Container */}
      <main className="au-login-center-wrapper">
        {/* University Brand Header above card */}
        <div ref={logoRef} className="au-brand-header">
          <AuLogo size={48} className="au-brand-logo-bounce" />
          <div className="au-brand-text-block">
            <h1 className="au-brand-title">ADITYA</h1>
            <p className="au-brand-subtitle">UNIVERSITY</p>
          </div>
        </div>

        {/* The Professional Glassy Login Card */}
        <div ref={cardRef} className="au-login-card au-glass-card">
          <form onSubmit={handleSubmit} className="au-login-form">
            <div className="au-field-group">
              <label htmlFor="au-email-input" className="au-label">
                University Email or ID
              </label>
              <div className="au-input-wrapper">
                <input
                  id="au-email-input"
                  className="au-input"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. 1122 or name@adityauniversity.in"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="au-field-group">
              <div className="au-label-row">
                <label htmlFor="au-password-input" className="au-label">
                  Password
                </label>
              </div>
              <div className="au-input-wrapper password-wrapper">
                <input
                  id="au-password-input"
                  className="au-input password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="au-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="au-btn au-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size={16} color="#0f172a" />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="au-demo-section">
            <p className="au-demo-title">Quick Demo Access</p>
            <div className="au-demo-buttons">
              <button
                type="button"
                onClick={() => fillDemo('student')}
                className="au-demo-btn"
                title="Fill Student Demo"
              >
                <GraduationCap size={14} />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('faculty')}
                className="au-demo-btn"
                title="Fill Faculty Demo"
              >
                <Users size={14} />
                <span>Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="au-demo-btn"
                title="Fill Administrator Demo"
              >
                <Shield size={14} />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <p className="au-card-role-hint">
            Your role decides the portal you see: Student, Faculty or Administration.
          </p>
        </div>

        {/* Visually Separate Certificate Verification Link */}
        <div className="au-verify-wrapper">
          <Link to="/verify" className="au-verify-link">
            <ShieldCheck size={16} className="au-verify-icon" />
            <span>Verify a certificate</span>
          </Link>
        </div>
      </main>

      {/* Subtle Academic Footer */}
      <footer className="au-login-footer">
        <p>© {new Date().getFullYear()} Aditya University &bull; Student Information System</p>
      </footer>
    </div>
  )
}
