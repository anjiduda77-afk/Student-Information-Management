import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { feeService } from '../services/api'
import { Spinner } from '../components/Loading'
import { formatDate } from '../utils/helpers'
import { resolveFeeReceiptNumber } from '../utils/urlParamResolver'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  ShieldCheck,
  Building,
  ArrowLeft,
  FileText,
  DollarSign
} from 'lucide-react'

export default function FeeVerificationPage() {
  const { receiptNumber: paramReceiptNumber } = useParams()
  const [searchParams] = useSearchParams()

  const extractReceiptNum = (raw) => {
    return resolveFeeReceiptNumber(raw, searchParams)
  }

  const initialTarget = resolveFeeReceiptNumber(paramReceiptNumber || '', searchParams)
  const [query, setQuery] = useState(initialTarget || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const verifyReceipt = async (numberToVerify) => {
    const cleanNumber = extractReceiptNum(numberToVerify)
    if (!cleanNumber) return
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await feeService.verifyReceipt(cleanNumber)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'No valid university fee receipt found with this reference number.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const target = paramReceiptNumber || queryParam
    if (target) {
      const clean = extractReceiptNum(target)
      setQuery(clean)
      verifyReceipt(clean)
    }
  }, [paramReceiptNumber, queryParam])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query) {
      verifyReceipt(query)
    }
  }

  const handleDownloadPdf = async () => {
    if (!data?.receiptNumber) return
    setDownloading(true)
    try {
      const res = await feeService.downloadReceiptPdf(data.receiptNumber)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Fee_Receipt_${data.receiptNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Could not download official PDF receipt.')
    } finally {
      setDownloading(false)
    }
  }

  const formatCurrency = (amt) => {
    return Number(amt || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #f8fafc)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Back Link */}
        <div>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: '#d97706',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} /> Back to SIS Portal
          </Link>
        </div>

        {/* Verification Card Header */}
        <div className="card" style={{ padding: 28, borderRadius: 18, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: 12, borderRadius: 16, background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', marginBottom: 12 }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', margin: '0 0 6px' }}>
            Official Fee Receipt Verification Registry
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Public financial verification portal for Aditya University autonomous tuition, examination, and campus fees.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginTop: 20, maxWidth: 500, margin: '20px auto 0' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Receipt Number (e.g. AU-FEE-2026-00001)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ fontSize: 13 }}
            />
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ gap: 6, fontWeight: 800 }}>
              <Search size={15} /> Verify
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Spinner size={32} />
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
              Verifying record against institutional financial ledger...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card" style={{ padding: 32, borderRadius: 18, textAlign: 'center', border: '1px solid #fecaca', background: '#fef2f2' }}>
            <XCircle size={40} color="#dc2626" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ margin: 0, color: '#991b1b', fontSize: 17, fontWeight: 800 }}>Verification Unsuccessful</h3>
            <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 6 }}>{error}</p>
          </div>
        )}

        {/* Valid Result Display */}
        {data && !loading && (
          <div className="card" style={{ padding: 28, borderRadius: 18, border: '2px solid #bbf7d0', background: 'var(--surface)' }}>
            {/* Stamp Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <span className="badge badge-success" style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', gap: 6 }}>
                  <CheckCircle size={14} /> VERIFIED INSTITUTIONAL RECORD
                </span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {data.institution}
                </div>
              </div>
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="btn btn-primary btn-sm"
                style={{ gap: 6, background: '#2563eb', borderColor: '#2563eb' }}
              >
                <Download size={14} /> Download Official PDF
              </button>
            </div>

            {/* Receipt Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>RECEIPT NUMBER</span>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 15, color: '#2563eb' }}>
                  {data.receiptNumber}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>STUDENT NAME</span>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{data.studentName}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>ROLL NUMBER</span>
                <div style={{ fontWeight: 800, fontFamily: 'monospace' }}>{data.rollNumber}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>DEPARTMENT / BRANCH</span>
                <div style={{ fontWeight: 700 }}>{data.department || 'Aditya University'}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>FEE PARTICULARS</span>
                <div style={{ fontWeight: 700 }}>{data.feeName}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>AMOUNT RECEIVED</span>
                <div style={{ fontWeight: 900, color: '#16a34a', fontSize: 16 }}>
                  {formatCurrency(data.amountPaid)}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>PAYMENT MODE</span>
                <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{data.paymentMode}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>TRANSACTION REF / UTR</span>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{data.transactionReference}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>PAYMENT DATE</span>
                <div style={{ fontWeight: 700 }}>{formatDate(data.paymentDate)}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>PAYMENT STATUS</span>
                <div>
                  <span className="badge badge-success" style={{ fontWeight: 800 }}>{data.status}</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Note */}
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#16a34a" />
              <span>Cryptographically signed &amp; verified by Aditya University Central Financial Registry.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
