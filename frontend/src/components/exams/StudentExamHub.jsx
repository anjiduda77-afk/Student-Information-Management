import { useState, useEffect, useRef } from 'react'
import { feeService } from '../../services/api'
import { toast } from '../Toast'
import PaymentGatewayModal from '../fees/PaymentGatewayModal'
import {
  FileText, Calendar, Clock, MapPin, Printer, Download,
  CheckCircle2, AlertTriangle, ShieldCheck, QrCode, CreditCard,
  GraduationCap, Award, User
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function StudentExamHub({ user }) {
  const hallTicketRef = useRef(null)
  const [examFee, setExamFee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payModalOpen, setPayModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await feeService.getMyRecords()
      const eFee = (res.data || []).find(r => r.feeCategory === 'EXAM')
      setExamFee(eFee || null)
    } catch {
      console.warn('Could not load exam fee record.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const isFeePaid = examFee?.status === 'PAID'

  const handlePrintHallTicket = () => {
    window.print()
  }

  const subjects = [
    { code: 'CS401', name: 'Advanced Data Structures & Algorithms', date: '2026-12-10', time: '10:00 AM – 01:00 PM', session: 'Morning', room: 'Hall A-101' },
    { code: 'CS402', name: 'Database Management Systems & SQL', date: '2026-12-12', time: '10:00 AM – 01:00 PM', session: 'Morning', room: 'Hall A-101' },
    { code: 'CS403', name: 'Operating Systems & System Programming', date: '2026-12-15', time: '10:00 AM – 01:00 PM', session: 'Morning', room: 'Hall A-101' },
    { code: 'CS404', name: 'Artificial Intelligence & Neural Systems', date: '2026-12-18', time: '10:00 AM – 01:00 PM', session: 'Morning', room: 'Hall A-101' },
    { code: 'CS405', name: 'Software Engineering & Design Patterns', date: '2026-12-21', time: '10:00 AM – 01:00 PM', session: 'Morning', room: 'Hall A-101' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Examinations &amp; Official Hall Ticket</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Semester End Examinations (SEE), internal assessment schedules, and official admit credentials.
          </p>
        </div>

        {isFeePaid ? (
          <button
            onClick={handlePrintHallTicket}
            className="btn btn-primary btn-sm"
            style={{ background: '#d97706', borderColor: '#d97706', gap: 6, fontWeight: 700 }}
          >
            <Printer size={15} />
            <span>Print Hall Ticket</span>
          </button>
        ) : (
          <button
            onClick={() => setPayModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ background: '#059669', borderColor: '#059669', gap: 6, fontWeight: 700 }}
          >
            <CreditCard size={15} />
            <span>Pay Exam Fee (₹2,500)</span>
          </button>
        )}
      </div>

      {/* Exam Fee & Clearance Notification Strip */}
      <div style={{
        background: isFeePaid ? '#ecfdf5' : '#fffbeb',
        border: `1px solid ${isFeePaid ? '#a7f3d0' : '#fde68a'}`,
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isFeePaid ? (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} />
            </div>
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} />
            </div>
          )}
          <div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: isFeePaid ? '#065f46' : '#92400e' }}>
              {isFeePaid ? 'Examination Fee Cleared & Hall Ticket Verified' : 'Examination Fee Pending Clearance'}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: isFeePaid ? '#047857' : '#b45309' }}>
              {isFeePaid
                ? `Receipt ${examFee?.receiptNumber || 'AU-FEE-EXAM-VERIFIED'} &bull; Candidate is fully permitted for Odd Semester Examinations.`
                : 'Candidates must clear exam fees before the deadline to download their official admit card.'}
            </p>
          </div>
        </div>

        {!isFeePaid && (
          <button
            onClick={() => setPayModalOpen(true)}
            className="btn btn-sm"
            style={{ background: '#d97706', color: '#fff', fontWeight: 800, border: 'none', gap: 6 }}
          >
            <CreditCard size={14} /> Pay ₹2,500 Now
          </button>
        )}
      </div>

      {/* ================================================================ */}
      {/* OFFICIAL UNIVERSITY HALL TICKET (ADMIT CARD) */}
      {/* ================================================================ */}
      <div
        ref={hallTicketRef}
        className="card"
        style={{
          padding: 28,
          borderRadius: 16,
          border: '2px solid var(--border)',
          background: 'var(--surface)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
      >
        {/* Hall Ticket Watermark Status */}
        <div
          style={{
            position: 'absolute',
            right: 28,
            top: 24,
            border: `2px solid ${isFeePaid ? '#16a34a' : '#d97706'}`,
            borderRadius: 8,
            padding: '4px 12px',
            color: isFeePaid ? '#16a34a' : '#d97706',
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: 1.5,
            transform: 'rotate(-5deg)',
            opacity: 0.9
          }}
        >
          {isFeePaid ? '✓ ELIGIBLE &bull; HALL TICKET' : 'PROVISIONAL'}
        </div>

        {/* Institution Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#d97706', letterSpacing: 2, textTransform: 'uppercase' }}>
            ADITYA UNIVERSITY (AUTONOMOUS)
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', margin: '4px 0 2px' }}>
            SEMESTER END THEORY EXAMINATIONS (SEE) &bull; HALL TICKET
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Odd Semester 2026–27 &bull; Examination Center: Central Campus Examination Hall A
          </div>
        </div>

        {/* Candidate & Exam Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 1fr',
          gap: 20,
          background: 'var(--surface-secondary)',
          padding: 16,
          borderRadius: 12,
          alignItems: 'center'
        }}>
          {/* Candidate Photo Placeholder */}
          <div style={{
            width: 100,
            height: 120,
            background: 'var(--border)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            padding: 4
          }}>
            <User size={40} style={{ color: '#64748b' }} />
            <span style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>PHOTO ID</span>
          </div>

          {/* Details Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Candidate Name: </span><strong>{user?.name || 'Rahul Gupta'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>University Roll No: </span><strong style={{ color: '#2563eb' }}>{user?.rollNumber || 'CSE2023001'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Degree &amp; Branch: </span><strong>B.Tech Computer Science &amp; Engg</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Semester: </span><strong>4th Semester (Autonomous)</strong></div>
          </div>

          {/* Details Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Admit Card No: </span><strong style={{ fontFamily: 'monospace' }}>HT-2026-CSE-401</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Exam Center: </span><strong>Block A Examination Wing</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Desk / Seat Allocation: </span><strong>Row 4, Seat 28</strong></div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Fee Clearance: </span>
              <strong style={{ color: isFeePaid ? '#16a34a' : '#d97706' }}>{isFeePaid ? 'Cleared (Paid)' : 'Pending Clearance'}</strong>
            </div>
          </div>
        </div>

        {/* Examination Subjects Timetable */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px', color: 'var(--text)' }}>
            Course Evaluation Schedule
          </h4>
          <div className="table-container">
            <table className="data-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Paper Code</th>
                  <th>Course Title</th>
                  <th>Examination Date</th>
                  <th>Session &amp; Timings</th>
                  <th>Hall / Room</th>
                  <th style={{ textAlign: 'center' }}>Invigilator Sign</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.code}>
                    <td><strong style={{ color: '#1e3a8a' }}>{s.code}</strong></td>
                    <td>{s.name}</td>
                    <td><Calendar size={13} style={{ display: 'inline', marginRight: 5, color: '#d97706' }} />{formatDate(s.date)}</td>
                    <td><Clock size={13} style={{ display: 'inline', marginRight: 5, color: '#2563eb' }} />{s.time}</td>
                    <td>{s.room}</td>
                    <td style={{ textAlign: 'center', borderBottom: '1px dashed var(--border)', color: '#94a3b8' }}>________________</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions & Signature Block */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          alignItems: 'center'
        }}>
          {/* Instructions */}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong>Important Instructions for Candidates:</strong><br />
            1. Candidates must occupy their allotted seats 15 minutes prior to commencement.<br />
            2. Electronic gadgets, mobile phones, and programmable calculators are strictly prohibited in the hall.<br />
            3. This Admit Card and Student ID card must be presented on each day of examination.
          </div>

          {/* Barcode & Controller of Examination Stamp */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <QrCode size={40} style={{ color: '#0f172a' }} />
              <div style={{ fontSize: 9, fontFamily: 'monospace', textAlign: 'left' }}>
                DIGITAL VERIFIED<br />
                COE-AUTONOMOUS<br />
                SEC-2026-9921
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)' }}>
              Controller of Examinations
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Aditya University, AP
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal if fee is pending */}
      {examFee && (
        <PaymentGatewayModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          feeRecord={examFee}
          onSuccess={() => {
            loadData()
          }}
        />
      )}
    </div>
  )
}

