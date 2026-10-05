import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/Toast'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import StudentDashboard from './pages/StudentDashboard'
import CertificateVerificationPage from './pages/CertificateVerificationPage'
import { Spinner } from './components/Loading'

// ✅ Official Aditya University Logo URL
const AU_LOGO = '/aditya-crest.png'

// Protected route: requires auth, optional role check
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src={AU_LOGO}
            alt="Aditya University"
            onError={(e) => { e.target.onerror = null; e.target.src = '/aditya-logo.png' }}
            style={{
              width: 88, height: 88, marginBottom: 24,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 20px rgba(217,155,38,0.8))',
              animation: 'spin 3s linear infinite'
            }}
          />
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          <Spinner size={32} />
          <p style={{
            marginTop: 16, color: '#d99b26', fontSize: 13,
            fontFamily: 'Inter, sans-serif', letterSpacing: 1.5,
            textTransform: 'uppercase', fontWeight: 600
          }}>
            Aditya University SIS
          </p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />
    return <Navigate to="/student/dashboard" replace />
  }

  return children
}

// If already logged in, redirect away from /login
function LoginGuard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />
    return <Navigate to="/student/dashboard" replace />
  }
  return children
}

// Root redirect based on role
function RoleRouter() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />
  return <Navigate to="/student/dashboard" replace />
}

// Professional 404 page — Aditya University branded
function NotFoundPage() {
  const { user } = useAuth()
  const dashboardPath = user?.role === 'ADMIN' ? '/admin/dashboard'
    : user?.role === 'FACULTY' ? '/faculty/dashboard'
    : user ? '/student/dashboard'
    : '/login'

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 24px' }}>
        {/* Official Logo */}
        <img
          src={AU_LOGO}
          alt="Aditya University"
          onError={(e) => { e.target.onerror = null; e.target.src = '/aditya-logo.png' }}
          style={{
            width: 96, height: 96, marginBottom: 24, objectFit: 'contain',
            filter: 'drop-shadow(0 0 16px rgba(217,155,38,0.6))'
          }}
        />
        <div style={{
          fontSize: 90, fontWeight: 900,
          color: 'rgba(255,255,255,0.08)',
          lineHeight: 1, marginBottom: 8, letterSpacing: -4
        }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 28px', lineHeight: 1.7 }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href={dashboardPath} style={{
            padding: '11px 22px',
            background: 'linear-gradient(135deg, #d99b26, #b8860b)',
            color: '#0f172a', borderRadius: 10,
            textDecoration: 'none', fontSize: 14, fontWeight: 700,
            boxShadow: '0 4px 14px rgba(217,155,38,0.35)'
          }}>
            Go to Dashboard
          </a>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '11px 22px',
              background: 'rgba(255,255,255,0.08)',
              color: '#f1f5f9', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.18)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: '#475569' }}>
          Aditya University — Smart Student Information System
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>

              {/* ── Public routes ─────────────────────────────────── */}
              <Route path="/login" element={<LoginGuard><LoginPage /></LoginGuard>} />

              {/* Certificate public verification — no login required */}
              <Route path="/verify/certificate" element={<CertificateVerificationPage />} />
              <Route path="/verify/certificate/:certificateId" element={<CertificateVerificationPage />} />
              <Route path="/verify" element={<CertificateVerificationPage />} />
              <Route path="/verify/:certificateId" element={<CertificateVerificationPage />} />
              <Route path="/certificates/verify" element={<CertificateVerificationPage />} />
              <Route path="/certificates/verify/:certificateId" element={<CertificateVerificationPage />} />

              {/* Root redirect */}
              <Route path="/" element={<RoleRouter />} />

              {/* ── Student routes ─────────────────────────────────── */}
              <Route
                path="/student/*"
                element={
                  <ProtectedRoute roles={['STUDENT', 'FACULTY', 'ADMIN']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ── Faculty routes ─────────────────────────────────── */}
              <Route
                path="/faculty/*"
                element={
                  <ProtectedRoute roles={['FACULTY', 'ADMIN']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ── Admin routes (includes /admin/certificates/*) ──── */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ── 404 ───────────────────────────────────────────── */}
              <Route path="*" element={<NotFoundPage />} />

            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
