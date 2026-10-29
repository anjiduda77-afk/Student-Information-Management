import { useState, useEffect } from 'react'
import { feeService } from '../../services/api'
import { toast } from '../Toast'
import PaymentGatewayModal from '../fees/PaymentGatewayModal'
import FeeReceiptModal from '../fees/FeeReceiptModal'
import {
  Bus, MapPin, Clock, Phone, ShieldCheck, QrCode,
  CheckCircle2, AlertTriangle, ArrowRight, CreditCard,
  Calendar, FileText, UserCheck
} from 'lucide-react'

export default function StudentTransportHub({ user }) {
  const [transportFee, setTransportFee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await feeService.getMyRecords()
      const tFee = (res.data || []).find(r => r.feeCategory === 'TRANSPORT')
      setTransportFee(tFee || null)
    } catch {
      console.warn('Could not load transport fee record.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const isPaid = transportFee?.status === 'PAID'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h2 className="section-title" style={{ margin: 0 }}>University Transit &amp; Fleet Pass</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Autonomous campus transit routes, boarding stops, live driver contact, and verified digital bus pass.
        </p>
      </div>

      {/* Main Grid: Digital Bus Pass (Left) & Route Schedule (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1.8fr)',
        gap: 24
      }}>
        {/* Left: DIGITAL BUS PASS ID CARD */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #0d9488 100%)',
          borderRadius: 20,
          padding: 24,
          color: '#fff',
          boxShadow: '0 10px 25px rgba(15, 118, 110, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 380,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Watermark icon */}
          <Bus size={200} style={{
            position: 'absolute', right: -30, bottom: -30, color: 'rgba(255,255,255,0.06)', pointerEvents: 'none'
          }} />

          {/* Top Header of Pass */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85, fontWeight: 800 }}>
                Aditya University &bull; Transport Dept
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 0' }}>
                DIGITAL TRANSIT PASS
              </h3>
            </div>
            <span style={{
              background: isPaid ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 900,
              padding: '4px 10px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              {isPaid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              <span>{isPaid ? 'ACTIVE PASS' : 'FEE PENDING'}</span>
            </span>
          </div>

          {/* Pass Body Info */}
          <div style={{ position: 'relative', zIndex: 2, margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Assigned Route</div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>
                Route 14 &bull; Kakinada Campus Express
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              <div>
                <span style={{ opacity: 0.75 }}>Student: </span>
                <strong>{user?.name || 'Rahul Gupta'}</strong>
              </div>
              <div>
                <span style={{ opacity: 0.75 }}>Roll No: </span>
                <strong>{user?.rollNumber || 'CSE2023001'}</strong>
              </div>
              <div>
                <span style={{ opacity: 0.75 }}>Boarding: </span>
                <strong>RTC Complex Bay 3</strong>
              </div>
              <div>
                <span style={{ opacity: 0.75 }}>Pickup: </span>
                <strong>07:45 AM Daily</strong>
              </div>
              <div>
                <span style={{ opacity: 0.75 }}>Vehicle: </span>
                <strong>AP-05-TX-1024 (AC)</strong>
              </div>
              <div>
                <span style={{ opacity: 0.75 }}>Validity: </span>
                <strong>AY 2026–27</strong>
              </div>
            </div>
          </div>

          {/* Pass Bottom QR Code & Actions */}
          <div style={{
            position: 'relative', zIndex: 2, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#fff', padding: 4, borderRadius: 6, display: 'flex' }}>
                <QrCode size={36} style={{ color: '#0f172a' }} />
              </div>
              <div style={{ fontSize: 10, opacity: 0.9 }}>
                Scan at bus entrance<br />
                <strong style={{ fontFamily: 'monospace' }}>PASS-RT14-2026</strong>
              </div>
            </div>

            {/* If paid -> show receipt button, else -> show Pay Now */}
            {isPaid ? (
              <button
                type="button"
                onClick={() => setReceiptModalOpen(true)}
                className="btn btn-sm"
                style={{ background: '#fff', color: '#0f766e', fontWeight: 800, fontSize: 11 }}
              >
                <FileText size={13} /> View Receipt
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPayModalOpen(true)}
                className="btn btn-sm"
                style={{ background: '#d97706', borderColor: '#d97706', color: '#fff', fontWeight: 800, fontSize: 11, gap: 4 }}
              >
                <CreditCard size={13} /> Pay Fee (₹18,000)
              </button>
            )}
          </div>
        </div>

        {/* Right: ROUTE STOPS & LIVE TIMINGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Driver Contact Pill Card */}
          <div className="card" style={{ padding: 18, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>M. Rambabu (Driver &amp; In-charge)</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Fleet Vehicle: AP-05-TX-1024 &bull; Ashok Leyland 55-Seater</p>
              </div>
            </div>
            <a
              href="tel:+919848022334"
              className="btn btn-sm btn-ghost"
              style={{ color: '#0f766e', fontWeight: 700, gap: 6, border: '1px solid var(--border)' }}
            >
              <Phone size={14} /> Call Driver (+91 98480 22334)
            </a>
          </div>

          {/* Route Stops Table */}
          <div className="card" style={{ padding: 20, borderRadius: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px' }}>
              Route 14 Stops &amp; Schedule (Morning &amp; Return)
            </h3>
            <div className="table-container">
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Stop Sequence</th>
                    <th>Boarding Point Landmark</th>
                    <th>Morning Pickup</th>
                    <th>Evening Return Drop</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { stop: 'Stop 1 (Origin)', name: 'RTC Complex Bay 3 (Opp Main Gate)', morning: '07:45 AM', return: '05:40 PM', current: true },
                    { stop: 'Stop 2', name: 'Bhanugudi Junction (Near Signal)', morning: '07:55 AM', return: '05:30 PM' },
                    { stop: 'Stop 3', name: 'Atchampeta Junction & Flyover', morning: '08:10 AM', return: '05:15 PM' },
                    { stop: 'Stop 4', name: 'Samalkot Bypass Highway Circle', morning: '08:25 AM', return: '05:00 PM' },
                    { stop: 'Stop 5 (Destination)', name: 'University Campus Transit Terminal', morning: '08:50 AM', return: '04:35 PM (Departure)' }
                  ].map(s => (
                    <tr key={s.stop} style={{ background: s.current ? 'rgba(15, 118, 110, 0.05)' : undefined }}>
                      <td>
                        <strong>{s.stop}</strong>
                        {s.current && <span className="badge badge-success" style={{ marginLeft: 6, fontSize: 10 }}>YOUR STOP</span>}
                      </td>
                      <td>{s.name}</td>
                      <td><strong style={{ color: '#0f766e' }}>{s.morning}</strong></td>
                      <td><span style={{ color: 'var(--text-muted)' }}>{s.return}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {transportFee && (
        <PaymentGatewayModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          feeRecord={transportFee}
          onSuccess={(updatedRec) => {
            setTransportFee(updatedRec)
            loadData()
          }}
        />
      )}

      {/* Receipt Modal */}
      {transportFee && (
        <FeeReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          record={transportFee}
        />
      )}
    </div>
  )
}

