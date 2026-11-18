import { useState, useEffect } from 'react'
import { feeService } from '../../services/api'
import { toast } from '../Toast'
import { TableSkeleton } from '../Loading'
import { formatDate } from '../../utils/helpers'
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, FileText,
  Search, Filter, RefreshCw, Users, ShieldCheck, CheckCircle,
  HelpCircle, ChevronRight, AlertCircle
} from 'lucide-react'

export default function FacultyFeeClearance() {
  const [summary, setSummary] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [semesterFilter, setSemesterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const loadData = async () => {
    setLoading(true)
    try {
      const sem = semesterFilter ? Number(semesterFilter) : undefined
      const [sumRes, recRes] = await Promise.all([
        feeService.getFacultyClearanceSummary({ semester: sem }).catch(() => ({ data: null })),
        feeService.getFacultyClearanceRecords({
          semester: sem,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          page,
          size: 20
        }).catch(() => ({ data: { content: [], totalPages: 1, totalElements: 0 } }))
      ])

      setSummary(sumRes.data)
      setRecords(recRes.data?.content || [])
      setTotalPages(recRes.data?.totalPages || 1)
      setTotalElements(recRes.data?.totalElements || 0)
    } catch {
      toast.error('Failed to load faculty fee clearance roster.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [semesterFilter, statusFilter, page])

  const formatCurrency = (amt) => {
    return Number(amt || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })
  }

  const filteredRecords = records.filter(r => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      (r.studentName && r.studentName.toLowerCase().includes(term)) ||
      (r.rollNumber && r.rollNumber.toLowerCase().includes(term)) ||
      (r.receiptNumber && r.receiptNumber.toLowerCase().includes(term))
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Department Fee Clearance &amp; Exam Eligibility</h2>
            <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 800 }}>FACULTY READ-ONLY</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Verify student fee clearance status for semester-end examination (SEE) hall ticket verification and academic progression.
          </p>
        </div>
        <button onClick={loadData} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
          <RefreshCw size={14} /> Refresh Roster
        </button>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16
        }}>
          <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>DEPARTMENT ENROLMENT</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '6px 0 2px' }}>
              {summary.totalStudents} Students
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
              {summary.department || 'Assigned Department'} {summary.semester ? `• Sem ${summary.semester}` : ''}
            </div>
          </div>

          <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>FEE CLEARED (ELIGIBLE)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', margin: '6px 0 2px' }}>
              {summary.clearedCount}
            </div>
            <div style={{ fontSize: 11, color: '#16a34a' }}>
              Eligible for Hall Ticket Issuance
            </div>
          </div>

          <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #d97706' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706' }}>PENDING DUES</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '6px 0 2px' }}>
              {summary.pendingCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
              {summary.overdueCount || 0} overdue accounts
            </div>
          </div>

          <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6' }}>DEPARTMENT CLEARANCE RATE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#8b5cf6', margin: '6px 0 2px' }}>
              {summary.clearancePercentage}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
              Institutional financial compliance
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="card" style={{ padding: 16, borderRadius: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              Search Student Name / Roll Number
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 30, fontSize: 12 }}
                placeholder="e.g. Rahul or CSE2023001"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              Semester
            </label>
            <select
              className="form-control"
              style={{ fontSize: 12 }}
              value={semesterFilter}
              onChange={(e) => { setSemesterFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              Clearance Status
            </label>
            <select
              className="form-control"
              style={{ fontSize: 12 }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID (Cleared)</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="PENDING">PENDING</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clearance Roster Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Department &amp; Sem</th>
                  <th>Fee Structure</th>
                  <th>Total Due</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Exam Eligibility</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No student fee clearance records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(r => {
                    const isPaid = r.status === 'PAID' || r.status === 'WAIVED'
                    const bal = Math.max(0, Number(r.amountDue || 0) - Number(r.amountPaid || 0) - Number(r.concession || 0))

                    return (
                      <tr key={r.id}>
                        <td>
                          <strong style={{ color: 'var(--text)' }}>{r.studentName}</strong>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {r.rollNumber}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {r.department} &bull; Sem {r.semester} {r.section ? `(${r.section})` : ''}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {r.feeStructureName}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {formatCurrency(r.amountDue)}
                        </td>
                        <td style={{ fontWeight: 800, color: '#16a34a' }}>
                          {formatCurrency(r.amountPaid)}
                        </td>
                        <td style={{ fontWeight: 800, color: bal > 0 ? '#dc2626' : '#16a34a' }}>
                          {formatCurrency(bal)}
                        </td>
                        <td>
                          <span className={`badge ${
                            isPaid ? 'badge-success' :
                            r.status === 'PARTIAL' ? 'badge-info' :
                            r.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isPaid ? (
                              <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={14} /> Eligible for SEE
                              </span>
                            ) : (
                              <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertCircle size={14} /> Dues Pending
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-muted)'
          }}>
            <div>Showing page {page + 1} of {totalPages} ({totalElements} total student fee statements)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="btn btn-ghost btn-xs"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-ghost btn-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advisory Note */}
      <div style={{
        background: 'var(--surface-secondary)',
        padding: 14,
        borderRadius: 12,
        fontSize: 12,
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <ShieldCheck size={18} color="#2563eb" />
        <div>
          <strong>Faculty Policy Notice:</strong> This interface provides verified institutional fee clearance statuses to facilitate hall ticket verification. All financial modifications and receipts are securely managed by the University Finance Officer.
        </div>
      </div>
    </div>
  )
}
