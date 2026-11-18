import { useState, useEffect } from 'react'
import { feeService } from '../../services/api'
import { toast } from '../Toast'
import { TableSkeleton } from '../Loading'
import { Modal } from '../Modal'
import { formatDate } from '../../utils/helpers'
import PaymentGatewayModal from './PaymentGatewayModal'
import FeeReceiptModal from './FeeReceiptModal'
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, FileText,
  Download, ArrowRight, ShieldCheck, DollarSign, RefreshCw,
  UploadCloud, ExternalLink, Award, CheckCircle, AlertCircle
} from 'lucide-react'

export default function StudentFeesHub() {
  const [records, setRecords] = useState([])
  const [offlineSubmissions, setOfflineSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [activePayRecord, setActivePayRecord] = useState(null)
  const [activeReceiptRecord, setActiveReceiptRecord] = useState(null)

  // Offline Payment Submission Modal
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [selectedFeeForOffline, setSelectedFeeForOffline] = useState('')
  const [offlineForm, setOfflineForm] = useState({
    amount: '',
    paymentMode: 'BANK_CHALLAN', // BANK_CHALLAN | NEFT | RTGS | DEMAND_DRAFT | UPI_DIRECT
    transactionReference: '',
    bankName: '',
    paymentDate: new Date().toISOString().split('T')[0],
    proofDocumentUrl: '',
    remarks: ''
  })
  const [offlineSubmitting, setOfflineSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [recRes, offRes] = await Promise.all([
        feeService.getMyRecords().catch(() => ({ data: [] })),
        feeService.getMyOfflineSubmissions().catch(() => ({ data: [] }))
      ])
      setRecords(recRes.data || [])
      setOfflineSubmissions(offRes.data || [])
    } catch {
      toast.error('Failed to load fee records. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate totals
  const totalDue = records.reduce((sum, r) => sum + Number(r.amountDue || 0), 0)
  const totalPaid = records.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0)
  const totalConcession = records.reduce((sum, r) => sum + Number(r.concession || 0), 0)
  const totalBalance = records.reduce((sum, r) => {
    const bal = Number(r.amountDue || 0) - Number(r.amountPaid || 0) - Number(r.concession || 0)
    return sum + (bal > 0 ? bal : 0)
  }, 0)
  const isFullyCleared = totalBalance <= 0 && records.length > 0

  const filteredRecords = records.filter(r => {
    if (categoryFilter === 'ALL') return true
    return r.feeCategory?.toUpperCase() === categoryFilter.toUpperCase()
  })

  const formatCurrency = (amt) => {
    return Number(amt || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })
  }

  const handleSubmitOfflinePayment = async (e) => {
    e.preventDefault()
    if (!selectedFeeForOffline) {
      toast.error('Please select the fee item you are submitting payment for.')
      return
    }
    setOfflineSubmitting(true)
    try {
      await feeService.submitOfflinePayment({
        feeRecordId: Number(selectedFeeForOffline),
        amount: Number(offlineForm.amount),
        paymentMode: offlineForm.paymentMode,
        transactionReference: offlineForm.transactionReference,
        bankName: offlineForm.bankName,
        paymentDate: offlineForm.paymentDate,
        proofDocumentUrl: offlineForm.proofDocumentUrl,
        remarks: offlineForm.remarks
      })
      toast.success('Offline payment counterfoil submitted for university bursar verification!')
      setShowOfflineModal(false)
      setOfflineForm({
        amount: '',
        paymentMode: 'BANK_CHALLAN',
        transactionReference: '',
        bankName: '',
        paymentDate: new Date().toISOString().split('T')[0],
        proofDocumentUrl: '',
        remarks: ''
      })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit offline payment details.')
    } finally {
      setOfflineSubmitting(false)
    }
  }

  const handleDownloadPdf = async (receiptNumber) => {
    try {
      const res = await feeService.downloadReceiptPdf(receiptNumber)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Fee_Receipt_${receiptNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Official PDF receipt downloaded!')
    } catch {
      toast.error('Failed to download PDF receipt.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Fee Payments &amp; Financial Clearance</h2>
            <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 800 }}>ACADEMIC DUES</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Autonomous academic tuition, transit bus pass, examination fees, scholarship concessions, and verified digital receipts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadData} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
            <RefreshCw size={14} /> Refresh Dues
          </button>
          <button
            onClick={() => {
              const pendingFee = records.find(r => r.status !== 'PAID' && r.status !== 'WAIVED')
              if (pendingFee) {
                setSelectedFeeForOffline(String(pendingFee.id))
                const bal = Number(pendingFee.amountDue) - Number(pendingFee.amountPaid || 0) - Number(pendingFee.concession || 0)
                setOfflineForm(prev => ({ ...prev, amount: String(bal > 0 ? bal : pendingFee.amountDue) }))
              }
              setShowOfflineModal(true)
            }}
            className="btn btn-secondary btn-sm"
            style={{ gap: 6 }}
          >
            <UploadCloud size={14} /> Submit Bank Challan / UTR
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16
      }}>
        <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL ASSESSMENT</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '6px 0 2px' }}>
            {formatCurrency(totalDue)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Academic Year 2026–27 Assessment</div>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>TOTAL FEES PAID</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', margin: '6px 0 2px' }}>
            {formatCurrency(totalPaid)}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a' }}>Official Receipts Generated</div>
        </div>

        {totalConcession > 0 && (
          <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #9333ea' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9333ea' }}>SCHOLARSHIP / WAIVER</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#9333ea', margin: '6px 0 2px' }}>
              - {formatCurrency(totalConcession)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Institutional Concession Applied</div>
          </div>
        )}

        <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706' }}>OUTSTANDING DUES</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: totalBalance > 0 ? '#dc2626' : '#16a34a', margin: '6px 0 2px' }}>
            {formatCurrency(totalBalance)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
            {totalBalance > 0 ? 'Pay before due date to avoid fine' : 'All Dues Fully Settled'}
          </div>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>HALL TICKET ELIGIBILITY</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: isFullyCleared ? '#16a34a' : '#d97706', margin: '8px 0 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isFullyCleared ? <CheckCircle2 size={18} /> : <Clock size={18} />}
            <span>{isFullyCleared ? 'Eligible for SEE Hall Ticket' : 'Clearance Pending'}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
            {isFullyCleared ? 'No Due Certificate Valid' : 'Settle pending dues for hall ticket'}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Filter Portfolio:</span>
        {['ALL', 'TUITION', 'EXAM', 'TRANSPORT', 'HOSTEL'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: categoryFilter === cat ? 800 : 600,
              cursor: 'pointer',
              background: categoryFilter === cat ? '#0f766e' : 'var(--surface)',
              color: categoryFilter === cat ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            {cat === 'ALL' ? 'All Portfolios' : cat}
          </button>
        ))}
      </div>

      {/* Fee Table */}
      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : filteredRecords.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
          <h3 style={{ margin: 0, fontSize: 16 }}>No Fee Dues Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            You have no outstanding fee assessments in this portfolio.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fee Particulars</th>
                  <th>Category</th>
                  <th>Due Date</th>
                  <th>Assessed Amount</th>
                  <th>Concession / Waiver</th>
                  <th>Remaining Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => {
                  const isPaid = rec.status === 'PAID' || rec.status === 'WAIVED'
                  const concessionAmt = Number(rec.concession || 0)
                  const bal = Math.max(0, Number(rec.amountDue || 0) - Number(rec.amountPaid || 0) - concessionAmt)

                  return (
                    <tr key={rec.id}>
                      <td>
                        <strong style={{ color: 'var(--text)' }}>{rec.feeStructureName}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {rec.academicYear} &bull; {rec.remarks || 'Standard autonomous assessment'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                          {rec.feeCategory?.toLowerCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {formatDate(rec.dueDate)}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatCurrency(rec.amountDue)}
                      </td>
                      <td>
                        {concessionAmt > 0 ? (
                          <span className="badge badge-success" style={{ fontSize: 11, gap: 4 }}>
                            <Award size={11} /> -{formatCurrency(concessionAmt)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 800, color: bal > 0 ? '#dc2626' : '#16a34a' }}>
                        {formatCurrency(bal)}
                      </td>
                      <td>
                        <span className={`badge ${
                          isPaid ? 'badge-success' :
                          rec.status === 'PARTIAL' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {isPaid ? (
                            <>
                              <button
                                onClick={() => setActiveReceiptRecord(rec)}
                                className="btn btn-sm btn-ghost"
                                style={{ color: '#0f766e', fontWeight: 700, gap: 5, fontSize: 12 }}
                              >
                                <FileText size={14} />
                                <span>Receipt</span>
                              </button>
                              {rec.receiptNumber && (
                                <button
                                  onClick={() => handleDownloadPdf(rec.receiptNumber)}
                                  className="btn btn-sm btn-ghost"
                                  style={{ color: '#2563eb', fontWeight: 700, gap: 4, fontSize: 12 }}
                                  title="Download Official PDF Receipt"
                                >
                                  <Download size={13} />
                                  <span>PDF</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => setActivePayRecord(rec)}
                              className="btn btn-sm btn-primary"
                              style={{ background: '#059669', borderColor: '#059669', fontWeight: 700, fontSize: 12, gap: 4 }}
                            >
                              <CreditCard size={13} />
                              <span>Pay ₹{bal.toLocaleString('en-IN')}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offline Submissions Tracker Strip */}
      {offlineSubmissions.length > 0 && (
        <div className="card" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UploadCloud size={18} color="#2563eb" /> Bank Challan &amp; Offline Payment Submissions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offlineSubmissions.map(sub => (
              <div key={sub.id} style={{
                padding: 12,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{sub.feeStructureName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {sub.paymentMode} &bull; UTR / Ref: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{sub.transactionReference}</span> &bull; Bank: {sub.bankName || 'Direct'} &bull; Date: {formatDate(sub.paymentDate)}
                  </div>
                  {sub.rejectionReason && (
                    <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} /> Reason: {sub.rejectionReason}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>{formatCurrency(sub.amount)}</div>
                  <span className={`badge ${
                    sub.status === 'VERIFIED' ? 'badge-success' :
                    sub.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                  }`} style={{ fontSize: 10 }}>
                    {sub.status === 'VERIFIED' ? '✓ VERIFIED & CREDITED' :
                     sub.status === 'REJECTED' ? '✕ REJECTED' : '⧖ PENDING REVIEW'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Offline Payment Modal */}
      <Modal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        title="Submit Offline Payment Proof (Bank Challan / UTR)"
        size="md"
      >
        <form onSubmit={handleSubmitOfflinePayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Select Fee Item *
            </label>
            <select
              className="form-control"
              required
              value={selectedFeeForOffline}
              onChange={(e) => {
                setSelectedFeeForOffline(e.target.value)
                const rec = records.find(r => String(r.id) === e.target.value)
                if (rec) {
                  const bal = Math.max(0, Number(rec.amountDue) - Number(rec.amountPaid || 0) - Number(rec.concession || 0))
                  setOfflineForm(prev => ({ ...prev, amount: String(bal > 0 ? bal : rec.amountDue) }))
                }
              }}
            >
              <option value="">-- Select Pending Fee --</option>
              {records.map(r => (
                <option key={r.id} value={r.id}>
                  {r.feeStructureName} (Due: {formatCurrency(r.amountDue)})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Payment Mode *
              </label>
              <select
                className="form-control"
                value={offlineForm.paymentMode}
                onChange={(e) => setOfflineForm({ ...offlineForm, paymentMode: e.target.value })}
              >
                <option value="BANK_CHALLAN">Bank Counter Challan (Cash/Transfer)</option>
                <option value="NEFT">NEFT National Electronic Funds Transfer</option>
                <option value="RTGS">RTGS Real Time Gross Settlement</option>
                <option value="DEMAND_DRAFT">Demand Draft (DD)</option>
                <option value="UPI_DIRECT">Direct Institutional UPI / QR</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="form-control"
                required
                placeholder="Amount"
                value={offlineForm.amount}
                onChange={(e) => setOfflineForm({ ...offlineForm, amount: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Transaction Ref / UTR / Challan No. *
              </label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. SBIN123456789012"
                value={offlineForm.transactionReference}
                onChange={(e) => setOfflineForm({ ...offlineForm, transactionReference: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Bank Name
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. State Bank of India (Kakinada / Surampalem)"
                value={offlineForm.bankName}
                onChange={(e) => setOfflineForm({ ...offlineForm, bankName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Payment Date *
              </label>
              <input
                type="date"
                className="form-control"
                required
                value={offlineForm.paymentDate}
                onChange={(e) => setOfflineForm({ ...offlineForm, paymentDate: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Proof / Counterfoil URL (Optional)
              </label>
              <input
                type="url"
                className="form-control"
                placeholder="https://drive.google.com/... or uploaded document link"
                value={offlineForm.proofDocumentUrl}
                onChange={(e) => setOfflineForm({ ...offlineForm, proofDocumentUrl: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Additional Remarks
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Paid at Aditya University campus branch counter"
              value={offlineForm.remarks}
              onChange={(e) => setOfflineForm({ ...offlineForm, remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setShowOfflineModal(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={offlineSubmitting} className="btn btn-primary">
              {offlineSubmitting ? 'Submitting...' : 'Submit Counterfoil'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={Boolean(activePayRecord)}
        onClose={() => setActivePayRecord(null)}
        feeRecord={activePayRecord}
        onSuccess={(updatedRec) => {
          loadData()
          setActiveReceiptRecord(updatedRec)
        }}
      />

      {/* Fee Receipt Modal */}
      <FeeReceiptModal
        isOpen={Boolean(activeReceiptRecord)}
        onClose={() => setActiveReceiptRecord(null)}
        record={activeReceiptRecord}
      />
    </div>
  )
}
