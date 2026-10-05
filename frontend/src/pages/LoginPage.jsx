import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { toast } from '../components/Toast'
import { Spinner } from '../components/Loading'
import AuLogo from '../components/common/AuLogo'
import ThemeToggle from '../components/common/ThemeToggle'
import AntigravityCanvas from '../components/common/AntigravityCanvas'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

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
                University Email / Roll No. / Staff ID
              </label>
              <div className="au-input-wrapper">
                <input
                  id="au-email-input"
                  className="au-input"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. Roll No. / Staff ID or email"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="au-field-group">
              <div className="au-label-row">
                <label htmlFor="au-password-input" className="au-label">
                  Account Password
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
                  <span>Logging in…</span>
                </>
              ) : (
                'Login to Portal'
              )}
            </button>
          </form>

        </div>

        {/* ── Public Certificate Verification Section (No Login Required) ── */}
        <div style={{
          marginTop: '24px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(217, 119, 6, 0.2)',
            color: '#fbbf24',
            marginBottom: '10px'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#f8fafc',
            marginBottom: '6px'
          }}>
            Certificate Verification
          </div>
          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: '0 auto 16px',
            maxWidth: '300px',
            lineHeight: 1.5
          }}>
            Publicly verify credentials and awards issued by Aditya University without logging in.
          </p>
          <Link
            to="/verify/certificate"
            id="public-verify-cert-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '11px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(30, 58, 138, 0.35)'
            }}
          >
            <ShieldCheck size={16} />
            <span>Verify Certificate</span>
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
