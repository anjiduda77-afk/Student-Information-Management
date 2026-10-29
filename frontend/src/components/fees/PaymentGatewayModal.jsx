import { useState } from 'react'
import { Modal } from '../Modal'
import { feeService } from '../../services/api'
import { toast } from '../Toast'
import {
  CreditCard, Smartphone, Building, ShieldCheck, CheckCircle2,
  Lock, ArrowRight, Loader2, QrCode
} from 'lucide-react'

export default function PaymentGatewayModal({ isOpen, onClose, feeRecord, onSuccess }) {
  const [payMode, setPayMode] = useState('UPI') // 'UPI' | 'CARD' | 'NETBANKING'
  const [processing, setProcessing] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821')
  const [cardExpiry, setCardExpiry] = useState('08/29')
  const [cardCvv, setCardCvv] = useState('•••')
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)')

  if (!feeRecord) return null

  const amountToPay = feeRecord.balance || feeRecord.amountDue || feeRecord.amount || 0
  const formattedAmount = Number(amountToPay).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR'
  })

  const handleProcessPayment = async (e) => {
    e.preventDefault()
    setProcessing(true)

    try {
      // Simulate real bank authorization round-trip
      await new Promise(r => setTimeout(r, 1200))

      const txRef = 'TXN-' + payMode + '-' + Date.now().toString().slice(-6)
      const res = await feeService.payFee({
        studentId: feeRecord.studentId,
        feeStructureId: feeRecord.feeStructureId || feeRecord.id,
        amountPaid: Number(amountToPay),
        paymentMode: payMode,
        transactionReference: txRef,
        remarks: `Paid ${feeRecord.feeCategory || 'Fee'} via ${payMode}`
      })

      toast.success(`Payment of ${formattedAmount} successful! Receipt: ${res.data.receiptNumber}`)
      onSuccess?.(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Institutional Fee Payment" size="md">
      <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Fee Summary Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 12,
          padding: '16px 20px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
              {feeRecord.feeCategory || 'ACADEMIC FEE'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>
              {feeRecord.feeStructureName || feeRecord.name}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Payable</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8' }}>
              {formattedAmount}
            </div>
          </div>
        </div>

        {/* Payment Modes Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-secondary)', padding: 4, borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setPayMode('UPI')}
            className={`btn btn-sm ${payMode === 'UPI' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, gap: 6, fontSize: 12, borderRadius: 8 }}
          >
            <Smartphone size={14} /> UPI Apps
          </button>
          <button
            type="button"
            onClick={() => setPayMode('CARD')}
            className={`btn btn-sm ${payMode === 'CARD' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, gap: 6, fontSize: 12, borderRadius: 8 }}
          >
            <CreditCard size={14} /> Cards
          </button>
          <button
            type="button"
            onClick={() => setPayMode('NETBANKING')}
            className={`btn btn-sm ${payMode === 'NETBANKING' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, gap: 6, fontSize: 12, borderRadius: 8 }}
          >
            <Building size={14} /> NetBanking
          </button>
        </div>

        {/* Tab 1: UPI */}
        {payMode === 'UPI' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'var(--surface)'
            }}>
              <div style={{
                width: 72,
                height: 72,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <QrCode size={40} style={{ color: '#0f172a' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>SCAN &amp; PAY</span>
              </div>
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 800, color: 'var(--text)' }}>Institutional UPI QR Code</div>
                <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                  Scan with GPay, PhonePe, Paytm, or BHIM to pay instantly.
                </div>
                <div style={{ color: '#059669', fontWeight: 700, marginTop: 4 }}>
                  VPA: aditya.finance@sbi
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Or enter your UPI ID</label>
              <input
                className="form-input"
                placeholder="username@okhdfcbank / mobile@upi"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: CARD */}
        {payMode === 'CARD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input
                className="form-input"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                placeholder="16-digit card number"
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Valid Thru</label>
                <input
                  className="form-input"
                  value={cardExpiry}
                  onChange={e => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                />
              </div>
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input
                  className="form-input"
                  type="password"
                  maxLength={4}
                  value={cardCvv}
                  onChange={e => setCardCvv(e.target.value)}
                  placeholder="3 digits"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: NETBANKING */}
        {payMode === 'NETBANKING' && (
          <div className="form-group">
            <label className="form-label">Select Your Bank</label>
            <select
              className="form-select"
              value={selectedBank}
              onChange={e => setSelectedBank(e.target.value)}
            >
              <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="Axis Bank">Axis Bank</option>
              <option value="Punjab National Bank">Punjab National Bank</option>
              <option value="Canara Bank">Canara Bank</option>
            </select>
          </div>
        )}

        {/* Trust & Encryption Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#16a34a',
          background: '#f0fdf4',
          padding: '6px 10px',
          borderRadius: 6
        }}>
          <Lock size={12} />
          <span>256-bit SSL Bank Encrypted Payment &bull; Instant Official Receipt Generated</span>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button type="button" onClick={onClose} disabled={processing} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="btn btn-primary"
            style={{
              background: '#059669',
              borderColor: '#059669',
              fontWeight: 800,
              gap: 8,
              minWidth: 160
            }}
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authorizing…</span>
              </>
            ) : (
              <>
                <span>Pay {formattedAmount}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

