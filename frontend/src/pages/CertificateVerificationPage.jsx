import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { certificateService } from '../services/api'
import { Spinner } from '../components/Loading'
import { downloadCertificatePDF } from '../utils/certificateGenerator'
import QRCode from 'qrcode'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  Eye,
  ShieldCheck,
  Copy,
  Check,
  Award,
  Calendar,
  User,
  Hash,
  Building,
  ArrowLeft,
  X
} from 'lucide-react'

const AU_LOGO_URL = '/aditya-crest.png'

export default function CertificateVerificationPage() {
  const { certificateId: routeCertId } = useParams()
  const [searchId, setSearchId] = useState(routeCertId || '')
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [downloading, setDownloading] = useState(false)

  // Auto-verify if certificateId is present in URL
  useEffect(() => {
    if (routeCertId && routeCertId.trim()) {
      setSearchId(routeCertId.trim())
      verify(routeCertId.trim())
    }
  }, [routeCertId])

  // Generate QR code whenever a valid certificate is loaded
  useEffect(() => {
    if (cert && cert.status === 'VALID' && cert.certificateId) {
      const frontendBase = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const publicVerifyUrl = `${frontendBase.replace(/\/+$/, '')}/verify/certificate/${cert.certificateId}`
      QRCode.toDataURL(publicVerifyUrl, {
        margin: 1,
        width: 160,
        color: { dark: '#1e3a8a', light: '#ffffff' }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('Failed to generate QR:', err))
    } else {
      setQrCodeDataUrl('')
    }
  }, [cert])

  const verify = async (idToVerify) => {
    const cleanId = (idToVerify || '').trim()
    if (!cleanId) return

    setLoading(true)
    setErrorMsg(null)
    setSearched(true)
    setCert(null)

    try {
      const res = await certificateService.verify(cleanId)
      const data = res.data
      setCert(data)

      if (data.status === 'INVALID' || !data.isValid) {
        setErrorMsg(data.message || 'This Certificate ID does not match any certificate issued by Aditya University.')
      }
    } catch (err) {
      setCert({
        status: 'INVALID',
        isValid: false,
        certificateId: cleanId,
        message: err.response?.data?.message || 'This Certificate ID does not match any certificate issued by Aditya University.'
      })
      setErrorMsg(err.response?.data?.message || 'This Certificate ID does not match any certificate issued by Aditya University.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    verify(searchId)
  }

  const handleCopyId = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = async () => {
    if (!cert || cert.status !== 'VALID') return
    setDownloading(true)
    try {
      await certificateService.downloadPdf(cert.certificateId, cert)
    } catch (e) {
      console.warn('Fallback to client-side PDF generation:', e)
      await downloadCertificatePDF(cert)
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const [y, m, d] = dateStr.split('-')
      if (y && m && d) return `${d}/${m}/${y}`
      return dateStr
    } catch {
      return dateStr
    }
  }

  const isValidCert = cert && cert.status === 'VALID'
  const isRevokedCert = cert && (cert.status === 'REVOKED' || cert.isRevoked)
  const isInvalidCert = (searched && !loading && (!cert || cert.status === 'INVALID')) || (!loading && errorMsg && !isValidCert && !isRevokedCert)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0b1329 0%, #0f172a 100%)',
      color: '#e2e8f0',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ── Public University Header (NO private navigation) ── */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(217, 119, 6, 0.25)',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Brand */}
          <Link to="/verify/certificate" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: '#fff' }}>
            <img
              src={AU_LOGO_URL}
              alt="Aditya University Logo"
              style={{
                width: 44,
                height: 44,
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(217, 119, 6, 0.4))'
              }}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/aditya-logo.png'
              }}
            />
            <div>
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: '#ffffff',
                lineHeight: 1.2
              }}>
                ADITYA UNIVERSITY
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#fbbf24',
                letterSpacing: '0.03em'
              }}>
                Smart Student Information System
              </div>
            </div>
          </Link>

          {/* Right Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
              PUBLIC VERIFICATION REGISTRY
            </span>

            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeft size={14} />
              <span>Portal Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main style={{ flex: 1, maxWidth: 940, width: '100%', margin: '0 auto', padding: '36px 20px 60px' }}>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(217, 119, 6, 0.25))',
            border: '1px solid rgba(217, 119, 6, 0.4)',
            color: '#fbbf24',
            marginBottom: 16,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 10px',
            letterSpacing: '-0.02em'
          }}>
            Official Certificate Verification
          </h1>
          <p style={{
            fontSize: 14,
            color: '#94a3b8',
            maxWidth: 580,
            margin: '0 auto 28px',
            lineHeight: 1.6
          }}>
            Verify the authenticity of academic credentials, event awards, and participation certificates issued by <strong style={{ color: '#fbbf24' }}>Aditya University</strong>. No login required.
          </p>

          {/* Search Box Form */}
          <form
            onSubmit={handleSearch}
            style={{
              maxWidth: 620,
              margin: '0 auto',
              display: 'flex',
              gap: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              padding: 8,
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Hash size={18} style={{ position: 'absolute', left: 14, color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="text"
                id="cert-id-input"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. AU-SIS-CERT-2026-X7K9P4M2Q8)"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 10,
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  outline: 'none',
                  letterSpacing: '0.04em'
                }}
                required
              />
            </div>

            <button
              type="submit"
              id="verify-submit-btn"
              disabled={loading || !searchId.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                border: '1px solid rgba(96, 165, 250, 0.5)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading || !searchId.trim() ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s ease',
                opacity: loading || !searchId.trim() ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <Spinner size={16} color="#fff" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Verify Now</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Fast Testing */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick test IDs:
            </span>
            <button
              type="button"
              onClick={() => { setSearchId('AU-SIS-CERT-2026-X7K9P4M2Q8'); verify('AU-SIS-CERT-2026-X7K9P4M2Q8') }}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Valid: AU-SIS-CERT-2026-X7K9P4M2Q8
            </button>
            <button
              type="button"
              onClick={() => { setSearchId('AU-SIS-CERT-2026-REVOKED01'); verify('AU-SIS-CERT-2026-REVOKED01') }}
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Revoked: AU-SIS-CERT-2026-REVOKED01
            </button>
            <button
              type="button"
              onClick={() => { setSearchId('AU-SIS-INVALID-DEMO'); verify('AU-SIS-INVALID-DEMO') }}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Invalid ID
            </button>
          </div>
        </div>

        {/* ── Loading Animation ── */}
        {loading && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 18,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: 48,
            textAlign: 'center',
            marginBottom: 32
          }}>
            <Spinner size={38} color="#fbbf24" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginTop: 16, marginBottom: 6 }}>
              Verifying Certificate with Aditya University Registry…
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              Checking cryptographic signature and institutional database records.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            CASE 1: VALID CERTIFICATE
           ════════════════════════════════════════════════════════════ */}
        {!loading && isValidCert && (
          <div id="valid-certificate-result" style={{
            background: '#ffffff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
            border: '1px solid #e2e8f0',
            color: '#0f172a',
            marginBottom: 32
          }}>
            {/* Banner Header: ✓ CERTIFICATE VERIFIED */}
            <div style={{
              background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
              color: '#ffffff',
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  <CheckCircle size={32} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <span>✓ CERTIFICATE VERIFIED</span>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      padding: '3px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.08em'
                    }}>
                      VALID
                    </span>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.95, marginTop: 4 }}>
                    This certificate has been issued by: <strong>ADITYA UNIVERSITY</strong>
                  </div>
                </div>
              </div>

              {/* Certificate Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  id="view-original-cert-btn"
                  onClick={() => setShowPreviewModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#ffffff',
                    color: '#15803d',
                    fontSize: 13,
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Eye size={16} />
                  <span>VIEW ORIGINAL CERTIFICATE</span>
                </button>

                <button
                  type="button"
                  id="download-cert-btn"
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: downloading ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Download size={16} />
                  <span>{downloading ? 'Preparing PDF…' : 'DOWNLOAD CERTIFICATE'}</span>
                </button>
              </div>
            </div>

            {/* Certificate Details Container */}
            <div style={{ padding: '32px 36px' }}>
              {/* Institution Seal & Certificate ID Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 20,
                borderBottom: '1px solid #e2e8f0',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img
                    src={AU_LOGO_URL}
                    alt="AU"
                    style={{ width: 44, height: 44, objectFit: 'contain' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/aditya-logo.png' }}
                  />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.04em' }}>
                      ADITYA UNIVERSITY
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Official Registry Accreditation Record
                    </div>
                  </div>
                </div>

                {/* Certificate ID Pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '8px 14px'
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Certificate ID:
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#1e3a8a' }}>
                    {cert.certificateId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(cert.certificateId)}
                    title="Copy Certificate ID"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: copied ? '#16a34a' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Exact Fields Specified in Requirements */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px 28px'
              }}>
                {/* Student Name */}
                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} color="#3b82f6" /> Student Name
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                    {cert.studentName || '—'}
                  </div>
                </div>

                {/* Student ID */}
                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Hash size={14} color="#3b82f6" /> Student ID / Roll Number
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a', marginTop: 4, fontFamily: 'monospace' }}>
                    {cert.studentId || cert.rollNumber || 'AU1122'}
                  </div>
                </div>

                {/* Event */}
                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Award size={14} color="#d97706" /> Event
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {cert.eventName || 'Annual Technical Fest 2026'}
                  </div>
                </div>

                {/* Position */}
                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Award size={14} color="#16a34a" /> Position / Standing
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#d97706',
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>{cert.position || cert.certificateType || 'Winner'}</span>
                  </div>
                </div>

                {/* Department */}
                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building size={14} color="#6366f1" /> Department
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {cert.department || cert.departmentName || 'AI & ML'}
                  </div>
                </div>

                {/* Issue Date */}
                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color="#059669" /> Issue Date
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {formatDate(cert.issueDate)}
                  </div>
                </div>

                {/* Status */}
                <div style={{ background: '#f0fdf4', padding: '16px 18px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} color="#16a34a" /> Verification Status
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#15803d',
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <CheckCircle size={18} color="#16a34a" /> VALID
                  </div>
                </div>
              </div>

              {/* Bottom Verification Seal & Notice */}
              <div style={{
                marginTop: 28,
                paddingTop: 20,
                borderTop: '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {qrCodeDataUrl && (
                    <img
                      src={qrCodeDataUrl}
                      alt="Verification QR"
                      style={{ width: 64, height: 64, borderRadius: 8, border: '1px solid #cbd5e1' }}
                    />
                  )}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                      Aditya University Digital Verification Token
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Scan QR code or open direct link: <code style={{ color: '#1e3a8a', fontWeight: 600 }}>/verify/certificate/{cert.certificateId}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 16px',
                      borderRadius: 8,
                      background: '#1e3a8a',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={15} /> [ VIEW ORIGINAL CERTIFICATE ]
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 16px',
                      borderRadius: 8,
                      background: '#15803d',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={15} /> [ DOWNLOAD CERTIFICATE ]
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            CASE 2: INVALID CERTIFICATE (ID Does Not Exist)
           ════════════════════════════════════════════════════════════ */}
        {isInvalidCert && (
          <div id="invalid-certificate-result" style={{
            background: '#ffffff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
            border: '1px solid #fecaca',
            color: '#0f172a',
            marginBottom: 32
          }}>
            {/* Red Header: ✕ CERTIFICATE INVALID */}
            <div style={{
              background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
              color: '#ffffff',
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <XCircle size={32} color="#ffffff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <span>✕ CERTIFICATE INVALID</span>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em'
                  }}>
                    INVALID
                  </span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.95, marginTop: 4 }}>
                  The entered Certificate ID could not be verified.
                </div>
              </div>
            </div>

            {/* Invalid Body */}
            <div style={{ padding: '32px 36px', textAlign: 'center' }}>
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 14,
                padding: '24px',
                maxWidth: 580,
                margin: '0 auto 24px'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: 6 }}>
                  Certificate Status: INVALID
                </div>
                <p style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#b91c1c',
                  margin: '0 0 12px',
                  lineHeight: 1.5
                }}>
                  "This Certificate ID does not match any certificate issued by Aditya University."
                </p>
                <div style={{ fontSize: 12, color: '#7f1d1d' }}>
                  Searched ID: <strong style={{ fontFamily: 'monospace' }}>{searchId || '—'}</strong>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 12,
                color: '#64748b'
              }}>
                <ShieldCheck size={18} color="#64748b" />
                <span>
                  Do NOT display private student information. Do NOT display a certificate. Do NOT redirect to login.
                </span>
              </div>

              <div style={{ marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => { setSearchId(''); setCert(null); setSearched(false); setErrorMsg(null) }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: '#1e3a8a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Enter Another Certificate ID
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            CASE 3: REVOKED CERTIFICATE
           ════════════════════════════════════════════════════════════ */}
        {!loading && isRevokedCert && (
          <div id="revoked-certificate-result" style={{
            background: '#ffffff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
            border: '2px solid #f59e0b',
            color: '#0f172a',
            marginBottom: 32
          }}>
            {/* Amber Header: ⚠ CERTIFICATE REVOKED */}
            <div style={{
              background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
              color: '#ffffff',
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={32} color="#ffffff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <span>⚠ CERTIFICATE REVOKED</span>
                  <span style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em'
                  }}>
                    REVOKED
                  </span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.95, marginTop: 4 }}>
                  Certificate ID: <strong>{cert.certificateId}</strong>
                </div>
              </div>
            </div>

            {/* Revoked Body */}
            <div style={{ padding: '32px 36px', textAlign: 'center' }}>
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: 14,
                padding: '24px',
                maxWidth: 580,
                margin: '0 auto 20px'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 6 }}>
                  Status: REVOKED
                </div>
                <p style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#b45309',
                  margin: '0 0 10px'
                }}>
                  "This certificate is no longer valid."
                </p>
                {cert.revocationReason && (
                  <p style={{ fontSize: 13, color: '#78350f', margin: '4px 0 0' }}>
                    Reason: <em>{cert.revocationReason}</em>
                  </p>
                )}
                {cert.revokedAt && (
                  <p style={{ fontSize: 11, color: '#92400e', marginTop: 8 }}>
                    Revocation Date: {cert.revokedAt}
                  </p>
                )}
              </div>

              {/* Security Enforcements Notice */}
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                padding: '14px 20px',
                maxWidth: 580,
                margin: '0 auto',
                fontSize: 12,
                color: '#991b1b',
                lineHeight: 1.5
              }}>
                <strong>Security Enforcement Notice:</strong><br />
                Do NOT display it as VALID. Do NOT allow download as a valid certificate. Do NOT redirect to login.
              </div>

              <div style={{ marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => { setSearchId(''); setCert(null); setSearched(false); setErrorMsg(null) }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: '#1e3a8a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Verify Another Certificate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Instructional Guidelines when not searched ── */}
        {!searched && !loading && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 18,
            padding: '28px 32px'
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#fbbf24" />
              Institutional Verification Protocol
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
              fontSize: 13,
              color: '#94a3b8',
              lineHeight: 1.6
            }}>
              <div>
                <strong style={{ color: '#e2e8f0' }}>1. Unrestricted Public Access</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Anyone (employers, academic evaluators, recruiters) can verify a certificate directly without logging in.
                </p>
              </div>
              <div>
                <strong style={{ color: '#e2e8f0' }}>2. Direct URL & QR Code</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Scan the QR code printed on the certificate or navigate to <code>/verify/certificate/:certificateId</code>.
                </p>
              </div>
              <div>
                <strong style={{ color: '#e2e8f0' }}>3. Cryptographic Authenticity</strong>
                <p style={{ margin: '4px 0 0' }}>
                  Each credential is verified against the central institutional database to guarantee integrity.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Public Footer ── */}
      <footer style={{
        background: '#070d1d',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '28px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: '#64748b'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 8,
            color: '#94a3b8',
            fontWeight: 700
          }}>
            <span>ADITYA UNIVERSITY</span>
            <span>•</span>
            <span>Smart Student Information System</span>
            <span>•</span>
            <Link to="/verify/certificate" style={{ color: '#fbbf24', textDecoration: 'none' }}>Verify Certificate</Link>
          </div>
          <p style={{ margin: '0 0 6px' }}>
            Official Certificate Verification & Authentication Registry • Surampalem, Andhra Pradesh, India
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>
            Approved by AICTE • Accredited by NAAC • Strictly Read-Only Public Registry
          </p>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════
          ORIGINAL CERTIFICATE PREVIEW MODAL [ VIEW ORIGINAL CERTIFICATE ]
         ════════════════════════════════════════════════════════════ */}
      {showPreviewModal && isValidCert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: 960,
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Modal Top Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="#15803d" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  Official Certificate Document Viewer
                </span>
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 800
                }}>
                  AUTHENTIC
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: '#1e3a8a',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} /> Download PDF
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    background: '#e2e8f0',
                    border: 'none',
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* High-Resolution Certificate Document Canvas */}
            <div style={{ padding: '32px 40px', background: '#fafaf9' }}>
              <div style={{
                background: '#fffdfa',
                border: '6px double #d97706',
                borderRadius: 12,
                padding: '40px 48px',
                position: 'relative',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)'
              }}>
                {/* Decorative Inner Border */}
                <div style={{
                  border: '1.5px solid #1e3a8a',
                  padding: '28px',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  {/* Header: Logo & Aditya University */}
                  <img
                    src={AU_LOGO_URL}
                    alt="Aditya University"
                    style={{ width: 68, height: 68, objectFit: 'contain', margin: '0 auto 12px' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/aditya-logo.png' }}
                  />
                  <div style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: '#1e3a8a',
                    letterSpacing: '0.08em',
                    lineHeight: 1.1
                  }}>
                    ADITYA UNIVERSITY
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#64748b',
                    letterSpacing: '0.05em',
                    marginTop: 4
                  }}>
                    Approved by AICTE • Accredited by NAAC • Surampalem, Andhra Pradesh, India
                  </div>

                  {/* Title */}
                  <div style={{
                    marginTop: 28,
                    marginBottom: 20
                  }}>
                    <div style={{
                      display: 'inline-block',
                      borderBottom: '2px solid #d97706',
                      paddingBottom: 6
                    }}>
                      <span style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: '#d97706',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase'
                      }}>
                        {cert.certificateType === 'WINNER' ? 'CERTIFICATE OF EXCELLENCE' : (cert.templateTitle || 'CERTIFICATE OF PARTICIPATION')}
                      </span>
                    </div>
                  </div>

                  {/* Body text */}
                  <p style={{
                    fontSize: 14,
                    color: '#475569',
                    fontStyle: 'italic',
                    margin: '0 auto 12px',
                    maxWidth: 540
                  }}>
                    This is proudly presented to
                  </p>
                  <div style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: '#0f172a',
                    fontFamily: 'serif',
                    letterSpacing: '0.02em',
                    borderBottom: '1px dashed #cbd5e1',
                    display: 'inline-block',
                    padding: '0 32px 6px',
                    marginBottom: 14
                  }}>
                    {cert.studentName}
                  </div>

                  <p style={{
                    fontSize: 14,
                    color: '#334155',
                    maxWidth: 620,
                    margin: '0 auto 28px',
                    lineHeight: 1.8
                  }}>
                    Student ID: <strong style={{ color: '#1e3a8a' }}>{cert.studentId || 'AU1122'}</strong>, Department of <strong style={{ color: '#1e3a8a' }}>{cert.department || 'AI & ML'}</strong>, for outstanding achievement and securing <strong style={{ color: '#d97706', textTransform: 'uppercase' }}>{cert.position || 'Winner'}</strong> in the event <strong style={{ color: '#1e3a8a' }}>"{cert.eventName || 'Annual Technical Fest 2026'}"</strong> conducted by Aditya University.
                  </p>

                  {/* Signatures & Verification Stamp Table */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'flex-end',
                    gap: 20,
                    paddingTop: 24,
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    {/* Left: Convener Signature */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontFamily: 'serif', fontStyle: 'italic', color: '#1e3a8a', fontWeight: 700, marginBottom: 4 }}>
                        Dr. Priya Sharma
                      </div>
                      <div style={{ width: 140, height: 1, background: '#d97706', margin: '0 auto 4px' }}></div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Dr. Priya Sharma</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Faculty Convener & HOD</div>
                    </div>

                    {/* Center: Official Seal & QR Code */}
                    <div style={{ textAlign: 'center' }}>
                      {qrCodeDataUrl && (
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code"
                          style={{
                            width: 76,
                            height: 76,
                            margin: '0 auto',
                            display: 'block',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0'
                          }}
                        />
                      )}
                      <div style={{
                        fontSize: 9,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: '#1e3a8a',
                        marginTop: 4
                      }}>
                        {cert.certificateId}
                      </div>
                      <div style={{ fontSize: 9, color: '#15803d', fontWeight: 700 }}>
                        ✓ OFFICIAL ACCREDITED
                      </div>
                    </div>

                    {/* Right: Dean / VC Signature */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontFamily: 'serif', fontStyle: 'italic', color: '#1e3a8a', fontWeight: 700, marginBottom: 4 }}>
                        Dr. N. Satish Reddy
                      </div>
                      <div style={{ width: 140, height: 1, background: '#d97706', margin: '0 auto 4px' }}></div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Dr. N. Satish Reddy</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Vice Chancellor / Dean</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
