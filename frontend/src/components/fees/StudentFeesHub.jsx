import { useState, useEffect } from 'react'
import { feeService } from '../../services/api'
import { toast } from '../Toast'
import { TableSkeleton } from '../Loading'
import { formatDate } from '../../utils/helpers'
import PaymentGatewayModal from './PaymentGatewayModal'
import FeeReceiptModal from './FeeReceiptModal'
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, FileText,
  Download, ArrowRight, ShieldCheck, DollarSign, RefreshCw
} from 'lucide-react'

export default function StudentFeesHub() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [activePayRecord, setActivePayRecord] = useState(null)
  const [activeReceiptRecord, setActiveReceiptRecord] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await feeService.getMyRecords()
      setRecords(res.data || [])
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
  const totalBalance = records.reduce((sum, r) => sum + Number(r.balance || (r.status === 'PAID' ? 0 : r.amountDue) || 0), 0)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Fee Payments &amp; Financial Clearance</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Academic tuition, transit bus pass, examination fees, and digital payment receipts.
          </p>
        </div>
        <button onClick={loadData} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
          <RefreshCw size={14} /> Refresh Dues
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL ASSESSMENT</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '6px 0 2px' }}>
            {formatCurrency(totalDue)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Academic Year 2026–27</div>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>TOTAL FEES PAID</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', margin: '6px 0 2px' }}>
            {formatCurrency(totalPaid)}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a' }}>Official Receipts Available</div>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>OUTSTANDING DUES</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: totalBalance > 0 ? '#dc2626' : '#16a34a', margin: '6px 0 2px' }}>
            {formatCurrency(totalBalance)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
            {totalBalance > 0 ? 'Pay before due date to avoid late fine' : 'All Dues Cleared'}
          </div>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 14, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>CLEARANCE STATUS</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: isFullyCleared ? '#16a34a' : '#d97706', margin: '8px 0 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isFullyCleared ? <CheckCircle2 size={18} /> : <Clock size={18} />}
            <span>{isFullyCleared ? 'Eligible for SEE Hall Ticket' : 'Pending Clearance'}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>No Due Certificate Status</div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Filter Category:</span>
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
            {cat === 'ALL' ? 'All Fees' : cat}
          </button>
        ))}
      </div>

      {/* Fee Table */}
      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : filteredRecords.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
          <h3 style={{ margin: 0, fontSize: 16 }}>No Records Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            No fee dues matching the selected category.
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
                  <th>Amount</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Action / Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => {
                  const isPaid = rec.status === 'PAID'
                  const bal = Number(rec.balance || (isPaid ? 0 : rec.amountDue))

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
                      <td style={{ fontWeight: 800, color: bal > 0 ? '#dc2626' : '#16a34a' }}>
                        {formatCurrency(bal)}
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                          {isPaid ? '● PAID' : 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {isPaid ? (
                            <button
                              onClick={() => setActiveReceiptRecord(rec)}
                              className="btn btn-sm btn-ghost"
                              style={{ color: '#0f766e', fontWeight: 700, gap: 5, fontSize: 12 }}
                            >
                              <FileText size={14} />
                              <span>Receipt</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setActivePayRecord(rec)}
                              className="btn btn-sm btn-primary"
                              style={{ background: '#059669', borderColor: '#059669', fontWeight: 700, fontSize: 12, gap: 4 }}
                            >
                              <CreditCard size={13} />
                              <span>Pay Now</span>
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

