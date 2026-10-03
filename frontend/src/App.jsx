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

// Protected route: requires auth, optional role check
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner size={36} />
          <p style={{ marginTop: 16, color: '#64748b', fontSize: 14 }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    // Redirect to the correct dashboard based on actual role
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

// Professional 404 page
function NotFoundPage() {
  const { user } = useAuth()
  const dashboardPath = user?.role === 'ADMIN' ? '/admin/dashboard'
    : user?.role === 'FACULTY' ? '/faculty/dashboard'
    : user ? '/student/dashboard'
    : '/login'

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
        <div style={{
          fontSize: 80, fontWeight: 900, color: '#e2e8f0', lineHeight: 1,
          marginBottom: 8, letterSpacing: -4
        }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href={dashboardPath} style={{
            padding: '10px 20px', background: '#2563eb', color: '#fff',
            borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600
          }}>
            Go to Dashboard
          </a>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '10px 20px', background: '#fff', color: '#475569',
              borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
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
              {/* Public routes */}
              <Route path="/login" element={<LoginGuard><LoginPage /></LoginGuard>} />
              <Route path="/verify" element={<CertificateVerificationPage />} />
              <Route path="/verify/:certificateId" element={<CertificateVerificationPage />} />

              {/* Root redirect */}
              <Route path="/" element={<RoleRouter />} />

              {/* Student routes */}
              <Route
                path="/student/*"
                element={
                  <ProtectedRoute roles={['STUDENT', 'FACULTY', 'ADMIN']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Faculty routes */}
              <Route
                path="/faculty/*"
                element={
                  <ProtectedRoute roles={['FACULTY', 'ADMIN']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
