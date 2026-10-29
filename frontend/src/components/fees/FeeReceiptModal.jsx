import { useRef } from 'react'
import { Modal } from '../Modal'
import { Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function FeeReceiptModal({ isOpen, onClose, record }) {
  const printRef = useRef(null)
  if (!record) return null

  const handlePrint = () => {
    window.print()
  }

  const amount = Number(record.amountPaid || record.amountDue || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR'
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official University Fee Receipt" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Printable Receipt Container */}
        <div
          ref={printRef}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 12,
            padding: 24,
            background: 'var(--surface)',
            position: 'relative'
          }}
        >
          {/* Watermark Seal */}
          <div
            style={{
              position: 'absolute',
              right: 24,
              top: 24,
              border: '2px solid #16a34a',
              borderRadius: 8,
              padding: '6px 14px',
              color: '#16a34a',
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: 2,
              textTransform: 'uppercase',
              transform: 'rotate(-10deg)',
              opacity: 0.85,
              pointerEvents: 'none'
            }}
          >
            ✓ PAID &bull; VERIFIED
          </div>

          {/* Receipt Header */}
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Aditya University &bull; Directorate of Finance & Accounts
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', margin: '4px 0 2px' }}>
              Official E-Fee Payment Receipt
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Accredited by NAAC with 'A++' Grade &bull; Autonomous Institution
            </div>
          </div>

          {/* Receipt Meta Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            background: 'var(--surface-secondary)',
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 16
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Receipt Number: </span>
              <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{record.receiptNumber || 'AU-FEE-2026-PENDING'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Payment Date: </span>
              <strong>{formatDate(record.paymentDate || new Date().toISOString())}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Payment Mode: </span>
              <strong style={{ textTransform: 'uppercase' }}>{record.paymentMode || 'ONLINE UPI'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Transaction Ref: </span>
              <strong style={{ fontFamily: 'monospace' }}>{record.transactionReference || 'TXN-ONLINE'}</strong>
            </div>
          </div>

          {/* Student Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13, marginBottom: 16 }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Student Name: </span>
              <strong style={{ color: 'var(--text)' }}>{record.studentName || 'Rahul Gupta'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Roll Number: </span>
              <strong style={{ color: 'var(--text)' }}>{record.rollNumber || 'CSE2023001'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Department / Branch: </span>
              <strong style={{ color: 'var(--text)' }}>{record.department || 'Computer Science & Engineering'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Academic Term: </span>
              <strong style={{ color: 'var(--text)' }}>Sem {record.semester || 4} &bull; AY {record.academicYear || '2026-27'}</strong>
            </div>
          </div>

          {/* Particulars Table */}
          <table className="data-table" style={{ width: '100%', marginBottom: 16, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Fee Particulars & Description</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{record.feeStructureName || record.name}</strong>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {record.remarks || 'Institutional autonomous fee clearance'}
                  </div>
                </td>
                <td>
                  <span className="badge badge-purple" style={{ fontSize: 11 }}>
                    {record.feeCategory || 'FEE'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 900, color: '#16a34a' }}>
                  {amount}
                </td>
              </tr>
              <tr style={{ background: 'var(--surface-secondary)', fontWeight: 800 }}>
                <td colSpan={2} style={{ textAlign: 'right' }}>Total Amount Paid (INR):</td>
                <td style={{ textAlign: 'right', fontSize: 15, color: '#16a34a' }}>{amount}</td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Security Note */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11, color: 'var(--text-muted)', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} style={{ color: '#16a34a' }} />
              <span>Electronically generated university document. No physical signature required.</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>Finance Officer</strong><br />Aditya University
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ background: '#d97706', borderColor: '#d97706', gap: 6, fontWeight: 700 }}
          >
            <Printer size={15} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

