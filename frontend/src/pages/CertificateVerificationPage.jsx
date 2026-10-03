import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { certificateService } from '../services/api'
import { Spinner } from '../components/Loading'
import { downloadCertificatePDF } from '../utils/certificateGenerator'
import { Award, CheckCircle, XCircle, Search, Download, ArrowLeft, ShieldCheck } from 'lucide-react'

export default function CertificateVerificationPage() {
  const { certificateId: routeCertId } = useParams()
  const [searchId, setSearchId] = useState(routeCertId || '')
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(null)

  const verify = async (idToVerify) => {
    if (!idToVerify?.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await certificateService.verify(idToVerify.trim())
      setCert(res.data)
    } catch (err) {
      setCert(null)
      setError(err.response?.data?.message || 'Certificate not found or verification failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (routeCertId) {
      verify(routeCertId)
    }
  }, [routeCertId])

  const handleSearch = (e) => {
    e.preventDefault()
    verify(searchId)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{
        background: '#1e3a8a', color: '#fff', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>🎓</div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.2, letterSpacing: '0.5px' }}>
              ADITYA UNIVERSITY
            </h1>
            <p style={{ fontSize: 11, margin: 0, opacity: 0.85 }}>
              Official Certificate Verification & Authentication Registry
            </p>
          </div>
        </div>
        <Link to="/login" style={{
          display: 'flex', alignItems: 'center', gap: 6, color: '#fff',
          textDecoration: 'none', fontSize: 13, fontWeight: 600,
          background: 'rgba(255,255,255,0.12)', padding: '8px 14px', borderRadius: 8
        }}>
          <ArrowLeft size={16} /> Portal Login
        </Link>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 860, margin: '40px auto', padding: '0 20px' }}>
        {/* Search Banner */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 32, textAlign: 'center'
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: '#dbeafe',
            color: '#2563eb', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
            E-Certificate Verification System
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Verify credentials, event awards, and participation credentials issued by Aditya University. Enter the unique Certificate ID printed or scanned from the certificate QR code.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto' }}>
            <input
              type="text"
              className="form-input"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="e.g. CERT-2026-CSE-94827"
              style={{ fontSize: 15, padding: '12px 16px', fontWeight: 600, textTransform: 'uppercase' }}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '12px 24px', fontSize: 14, flexShrink: 0 }}
            >
              {loading ? <Spinner size={16} color="#fff" /> : <><Search size={16} /> Verify Now</>}
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spinner size={36} />
            <p style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Authenticating certificate registry records…</p>
          </div>
        )}

        {/* Verification Success Result */}
        {!loading && cert && (
          <div style={{
            background: '#fff', borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0'
          }}>
            {/* Status Header */}
            <div style={{
              background: '#f0fdf4', borderBottom: '1px solid #bbf7d0',
              padding: '20px 28px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={28} className="text-green-600" style={{ color: '#16a34a' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>
                      OFFICIALLY VERIFIED & AUTHENTIC
                    </span>
                    <span className="badge badge-success">ACTIVE</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#166534', margin: '2px 0 0' }}>
                    Record validated against Aditya University central database
                  </p>
                </div>
              </div>

              <a
                href={`/api/certificates/${cert.certificateId}/download`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, textDecoration: 'none' }}
              >
                <Download size={16} /> Download Official PDF
              </a>
            </div>

            {/* Certificate Details Card */}
            <div style={{ padding: 32 }}>
              <div style={{
                border: '2px solid #d97706', borderRadius: 14,
                padding: '28px', background: '#fffbeb', position: 'relative'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#92400e', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    ADITYA UNIVERSITY
                  </p>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a', marginTop: 4 }}>
                    {cert.certificateType === 'WINNER' ? 'CERTIFICATE OF EXCELLENCE' : 'CERTIFICATE OF PARTICIPATION'}
                  </h3>
                  <p style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b', marginTop: 2 }}>
                    Certificate ID: <strong style={{ color: '#1e3a8a' }}>{cert.certificateId}</strong>
                  </p>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16, marginTop: 24, padding: 20, background: '#fff', borderRadius: 12,
                  border: '1px solid #fef3c7'
                }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Recipient Name</span>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>{cert.studentName}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Roll Number / ID</span>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '4px 0 0' }}>{cert.studentRollNumber || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Event / Program</span>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#2563eb', margin: '4px 0 0' }}>{cert.eventName}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Recognition / Standing</span>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#d97706', margin: '4px 0 0' }}>
                      {cert.position || 'Participation'}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Date of Issue</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', margin: '4px 0 0' }}>{cert.issueDate || '2026'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Issuing Authority</span>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', margin: '4px 0 0' }}>Dean, Academic Affairs</p>
                  </div>
                </div>

                {cert.remarks && (
                  <p style={{ fontSize: 13, color: '#475569', marginTop: 16, fontStyle: 'italic', textAlign: 'center' }}>
                    "{cert.remarks}"
                  </p>
                )}

                {/* Cryptographic hash */}
                {cert.verificationCode && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Cryptographic Verification Hash
                    </span>
                    <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', margin: '2px 0 0', wordBreak: 'break-all' }}>
                      {cert.verificationCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!loading && searched && error && (
          <div style={{
            background: '#fff', borderRadius: 20, padding: 40,
            textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#fee2e2',
              color: '#dc2626', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <XCircle size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Certificate Not Verified
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.6 }}>
              {error} Please check the Certificate ID for typographical errors or contact the Examination / Academic Office.
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Academic Office Helpline: +91 80 2671 0000 | verify@apex.edu.in
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
