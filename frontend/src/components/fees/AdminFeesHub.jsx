import { useState, useEffect } from 'react'
import { feeService, adminService } from '../../services/api'
import { toast } from '../Toast'
import { TableSkeleton } from '../Loading'
import { Modal } from '../Modal'
import { formatDate } from '../../utils/helpers'
import FeeReceiptModal from './FeeReceiptModal'
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, FileText,
  Download, ArrowRight, ShieldCheck, DollarSign, RefreshCw,
  Plus, Users, Search, Filter, Check, X, Building, BookOpen,
  PieChart, Tag, Layers, ChevronRight, CheckCircle, HelpCircle,
  ExternalLink, Award, FileSpreadsheet, Eye
} from 'lucide-react'

export default function AdminFeesHub() {
  const [activeTab, setActiveTab] = useState('overview') // overview | structures | categories | bulk-assign | concessions | offline-approvals | transactions
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  // Structures & Categories state
  const [structures, setStructures] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])

  // Modal states
  const [showCreateStructureModal, setShowCreateStructureModal] = useState(false)
  const [editingStructure, setEditingStructure] = useState(null)
  const [structureForm, setStructureForm] = useState({
    name: '',
    category: 'TUITION',
    categoryCode: 'TUITION',
    academicYear: '2026-27',
    department: '',
    semester: '',
    amount: '',
    dueDate: '',
    lateFinePerDay: '0',
    description: '',
    status: 'ACTIVE'
  })

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true
  })

  // Bulk assignment state
  const [bulkForm, setBulkForm] = useState({
    feeStructureId: '',
    department: 'ALL',
    semester: '',
    section: 'ALL',
    batch: ''
  })
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)

  // Concessions state
  const [concessions, setConcessions] = useState([])
  const [showConcessionModal, setShowConcessionModal] = useState(false)
  const [concessionForm, setConcessionForm] = useState({
    studentId: '',
    feeStructureId: '',
    concessionType: 'MERIT',
    discountPercentage: '',
    amount: '',
    reason: '',
    supportingDocumentUrl: ''
  })

  // Offline approvals state
  const [pendingOffline, setPendingOffline] = useState([])
  const [reviewModalData, setReviewModalData] = useState(null)
  const [reviewRemarks, setReviewRemarks] = useState('')

  // Transactions Ledger state (Server-side paged for 10,000+ students)
  const [transactions, setTransactions] = useState([])
  const [txSearch, setTxSearch] = useState('')
  const [txCategory, setTxCategory] = useState('ALL')
  const [txStatus, setTxStatus] = useState('ALL')
  const [txDept, setTxDept] = useState('ALL')
  const [txPage, setTxPage] = useState(0)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txTotalElements, setTxTotalElements] = useState(0)
  const [txLoading, setTxLoading] = useState(false)

  // Active Receipt Modal
  const [activeReceiptRecord, setActiveReceiptRecord] = useState(null)

  // Load Overview & Initial Lookups
  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [ovRes, stRes, catRes, deptRes] = await Promise.all([
        feeService.getOverview().catch(() => ({ data: null })),
        feeService.getStructures().catch(() => ({ data: [] })),
        feeService.getCategories().catch(() => ({ data: [] })),
        adminService.getDepartments().catch(() => ({ data: [] }))
      ])
      setOverview(ovRes.data)
      setStructures(stRes.data || [])
      setCategories(catRes.data || [])
      setDepartments(deptRes.data || [])
    } catch (err) {
      toast.error('Failed to initialize fee management data.')
    } finally {
      setLoading(false)
    }
  }

  // Load Concessions
  const loadConcessions = async () => {
    try {
      const res = await feeService.getAllConcessions()
      setConcessions(res.data || [])
    } catch {
      toast.error('Could not load concessions list.')
    }
  }

  // Load Pending Offline Submissions
  const loadPendingOffline = async () => {
    try {
      const res = await feeService.getPendingOfflineSubmissions()
      setPendingOffline(res.data || [])
    } catch {
      toast.error('Could not load pending offline submissions.')
    }
  }

  // Load Transactions (Paged)
  const loadTransactions = async () => {
    setTxLoading(true)
    try {
      const params = {
        search: txSearch || undefined,
        category: txCategory !== 'ALL' ? txCategory : undefined,
        status: txStatus !== 'ALL' ? txStatus : undefined,
        department: txDept !== 'ALL' ? txDept : undefined,
        page: txPage,
        size: 15
      }
      const res = await feeService.getAdminFeeRecords(params)
      setTransactions(res.data?.content || [])
      setTxTotalPages(res.data?.totalPages || 1)
      setTxTotalElements(res.data?.totalElements || 0)
    } catch {
      toast.error('Failed to load transaction records.')
    } finally {
      setTxLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'concessions') loadConcessions()
    if (activeTab === 'offline-approvals') loadPendingOffline()
    if (activeTab === 'transactions') loadTransactions()
  }, [activeTab, txPage, txCategory, txStatus, txDept])

  const formatCurrency = (amt) => {
    return Number(amt || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })
  }

  // ================= Structure Handlers =================
  const handleSaveStructure = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...structureForm,
        semester: structureForm.semester ? Number(structureForm.semester) : null,
        amount: Number(structureForm.amount),
        lateFinePerDay: Number(structureForm.lateFinePerDay || 0)
      }

      if (editingStructure) {
        await feeService.updateStructure(editingStructure.id, payload)
        toast.success('Fee structure updated successfully!')
      } else {
        await feeService.createStructure(payload)
        toast.success('Fee structure created successfully!')
      }
      setShowCreateStructureModal(false)
      setEditingStructure(null)
      loadInitialData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save fee structure.')
    }
  }

  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Are you sure you want to remove or deactivate this fee structure? Historical records will be safely preserved.')) {
      return
    }
    try {
      await feeService.deleteStructure(id)
      toast.success('Fee structure updated.')
      loadInitialData()
    } catch (err) {
      toast.error('Failed to delete/deactivate structure.')
    }
  }

  // ================= Category Handlers =================
  const handleSaveCategory = async (e) => {
    e.preventDefault()
    try {
      await feeService.createCategory(categoryForm)
      toast.success(`Fee category '${categoryForm.code}' added!`)
      setShowCategoryModal(false)
      setCategoryForm({ code: '', name: '', description: '', isActive: true })
      loadInitialData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create fee category.')
    }
  }

  const handleToggleCategory = async (id) => {
    try {
      await feeService.toggleCategory(id)
      toast.success('Category status updated.')
      loadInitialData()
    } catch {
      toast.error('Failed to update category status.')
    }
  }

  // ================= Bulk Assign Handlers =================
  const handleBulkAssign = async (e) => {
    e.preventDefault()
    if (!bulkForm.feeStructureId) {
      toast.error('Please select a fee structure.')
      return
    }
    setBulkSubmitting(true)
    setBulkResult(null)
    try {
      const res = await feeService.bulkAssign({
        feeStructureId: Number(bulkForm.feeStructureId),
        department: bulkForm.department !== 'ALL' ? bulkForm.department : null,
        semester: bulkForm.semester ? Number(bulkForm.semester) : null,
        section: bulkForm.section !== 'ALL' ? bulkForm.section : null,
        batch: bulkForm.batch || null
      })
      setBulkResult(res.data)
      toast.success(`Bulk Fee Assignment Completed! Assigned to ${res.data.newlyAssigned} students.`)
      loadInitialData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk assignment failed.')
    } finally {
      setBulkSubmitting(false)
    }
  }

  // ================= Concession Handlers =================
  const handleSaveConcession = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        studentId: Number(concessionForm.studentId),
        feeStructureId: Number(concessionForm.feeStructureId),
        concessionType: concessionForm.concessionType,
        discountPercentage: concessionForm.discountPercentage ? Number(concessionForm.discountPercentage) : null,
        amount: Number(concessionForm.amount),
        reason: concessionForm.reason,
        supportingDocumentUrl: concessionForm.supportingDocumentUrl
      }
      await feeService.addConcession(payload)
      toast.success('Scholarship / Concession applied and fee balance adjusted!')
      setShowConcessionModal(false)
      loadConcessions()
      loadInitialData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply concession.')
    }
  }

  // ================= Offline Review Handlers =================
  const handleReviewOffline = async (approve) => {
    if (!reviewModalData) return
    try {
      await feeService.reviewOfflineSubmission(reviewModalData.id, {
        approve,
        remarks: reviewRemarks || (approve ? 'Verified with bank statement' : 'Invalid transaction reference')
      })
      toast.success(approve ? 'Offline payment verified and receipt generated!' : 'Offline payment submission rejected.')
      setReviewModalData(null)
      setReviewRemarks('')
      loadPendingOffline()
      loadInitialData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed.')
    }
  }

  // Download PDF receipt directly
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
    } catch {
      toast.error('Failed to download official PDF receipt.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Institutional Fee Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Institutional Fee Management &amp; Accounts</h2>
            <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 800 }}>ENTERPRISE FINANCES</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Fee structures, automated student billing, scholarship concessions, Razorpay reconciliation, and bank challan verification.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { loadInitialData(); if (activeTab === 'transactions') loadTransactions(); }} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
          <button
            onClick={() => {
              setEditingStructure(null)
              setStructureForm({
                name: '',
                category: 'TUITION',
                categoryCode: 'TUITION',
                academicYear: '2026-27',
                department: '',
                semester: '',
                amount: '',
                dueDate: '',
                lateFinePerDay: '0',
                description: '',
                status: 'ACTIVE'
              })
              setShowCreateStructureModal(true)
            }}
            className="btn btn-primary btn-sm"
            style={{ gap: 6 }}
          >
            <Plus size={15} /> Create Fee Structure
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Strip */}
      {overview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16
        }}>
          <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL FEE DEMAND</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '6px 0 2px' }}>
              {formatCurrency(overview.totalDue)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
              Assessed across {overview.totalRecords?.toLocaleString() || 0} student ledgers
            </div>
          </div>

          <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>RECONCILED COLLECTION</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', margin: '6px 0 2px' }}>
              {formatCurrency(overview.totalCollected)}
            </div>
            <div style={{ fontSize: 11, color: '#16a34a' }}>
              {overview.paidCount || 0} fully settled accounts
            </div>
          </div>

          <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #dc2626' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626' }}>OUTSTANDING DUES</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', margin: '6px 0 2px' }}>
              {formatCurrency(overview.totalOutstanding)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
              {overview.pendingCount || 0} pending dues &bull; {overview.overdueCount || 0} overdue
            </div>
          </div>

          <div className="card" style={{ padding: 18, borderRadius: 14, borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6' }}>COLLECTION EFFICIENCY</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#8b5cf6', margin: '6px 0 2px' }}>
              {overview.collectionPercentage || 0}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
              {structures.length} Active institutional fee structures
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 2,
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Financial Overview', icon: PieChart },
          { id: 'structures', label: 'Fee Structures', icon: Layers },
          { id: 'categories', label: 'Fee Categories', icon: Tag },
          { id: 'bulk-assign', label: 'Bulk Student Billing', icon: Users },
          { id: 'concessions', label: 'Scholarships & Waivers', icon: Award },
          { id: 'offline-approvals', label: `Challan Approvals ${pendingOffline.length > 0 ? `(${pendingOffline.length})` : ''}`, icon: ShieldCheck },
          { id: 'transactions', label: 'Audit Ledger & Transactions', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                borderBottom: isActive ? '3px solid #d97706' : '3px solid transparent',
                background: 'transparent',
                color: isActive ? '#d97706' : 'var(--text-muted)',
                fontWeight: isActive ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: Financial Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Category-wise Breakdown */}
            <div className="card" style={{ padding: 22, borderRadius: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag size={18} color="#d97706" /> Institutional Fee Portfolios
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {categories.map(cat => {
                  const matchingStructures = structures.filter(s => s.categoryCode === cat.code || s.category === cat.code)
                  const totalCategoryAmount = matchingStructures.reduce((sum, s) => sum + Number(s.amount || 0), 0)
                  return (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface-secondary)', borderRadius: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat.code} &bull; {matchingStructures.length} structures active</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: 'var(--text)' }}>{formatCurrency(totalCategoryAmount)}</div>
                        <span className={`badge ${cat.isActive ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: 10 }}>
                          {cat.isActive ? 'Active' : 'Archived'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions & Recent Structures */}
            <div className="card" style={{ padding: 22, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#2563eb" /> Active Fee Structures
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {structures.slice(0, 5).map(s => (
                  <div key={s.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {s.academicYear} &bull; {s.department || 'All Departments'} &bull; Due: {formatDate(s.dueDate)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(s.amount)}</div>
                      <button
                        onClick={() => {
                          setBulkForm(prev => ({ ...prev, feeStructureId: String(s.id) }))
                          setActiveTab('bulk-assign')
                        }}
                        className="btn btn-ghost btn-xs"
                        style={{ color: '#2563eb', padding: '2px 6px', fontSize: 11 }}
                      >
                        Bulk Assign &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('structures')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: 'auto' }}
              >
                View All {structures.length} Structures
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Fee Structures */}
      {activeTab === 'structures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Configured Institutional Fee Structures</h3>
            <button
              onClick={() => {
                setEditingStructure(null)
                setShowCreateStructureModal(true)
              }}
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
            >
              <Plus size={15} /> Add Structure
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Structure Name</th>
                    <th>Category</th>
                    <th>Academic Year</th>
                    <th>Dept &amp; Semester</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {structures.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong style={{ color: 'var(--text)' }}>{s.name}</strong>
                        {s.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.description}</div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: 11 }}>
                          {s.categoryCode || s.category}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{s.academicYear}</td>
                      <td style={{ fontSize: 12 }}>
                        {s.department || 'All Departments'}
                        {s.semester ? ` • Sem ${s.semester}` : ' • All Semesters'}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--text)' }}>
                        {formatCurrency(s.amount)}
                      </td>
                      <td style={{ fontSize: 12 }}>{formatDate(s.dueDate)}</td>
                      <td>
                        <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => {
                              setEditingStructure(s)
                              setStructureForm({
                                name: s.name,
                                category: s.category || 'TUITION',
                                categoryCode: s.categoryCode || 'TUITION',
                                academicYear: s.academicYear || '2026-27',
                                department: s.department || '',
                                semester: s.semester ? String(s.semester) : '',
                                amount: String(s.amount),
                                dueDate: s.dueDate || '',
                                lateFinePerDay: String(s.lateFinePerDay || 0),
                                description: s.description || '',
                                status: s.status || 'ACTIVE'
                              })
                              setShowCreateStructureModal(true)
                            }}
                            className="btn btn-ghost btn-xs"
                            title="Edit Structure"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setBulkForm(prev => ({ ...prev, feeStructureId: String(s.id) }))
                              setActiveTab('bulk-assign')
                            }}
                            className="btn btn-ghost btn-xs"
                            style={{ color: '#2563eb' }}
                            title="Assign to Students"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => handleDeleteStructure(s.id)}
                            className="btn btn-ghost btn-xs"
                            style={{ color: '#dc2626' }}
                            title="Deactivate or Remove"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Fee Categories */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Configurable Fee Categories</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                System-wide institutional portfolios for autonomous academic assessments, transit, residential, and co-curricular charges.
              </p>
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
            >
              <Plus size={15} /> Add Custom Category
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {categories.map(cat => (
              <div key={cat.id} className="card" style={{ padding: 18, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: '#d97706', background: 'rgba(217, 119, 6, 0.1)', padding: '2px 8px', borderRadius: 6 }}>
                      {cat.code}
                    </span>
                    <h4 style={{ margin: '8px 0 2px', fontSize: 15, fontWeight: 800 }}>{cat.name}</h4>
                  </div>
                  <button
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`badge ${cat.isActive ? 'badge-success' : 'badge-neutral'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, minHeight: 36 }}>
                  {cat.description || 'Institutional fee portfolio.'}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-light)' }}>
                  <span>Created {formatDate(cat.createdAt)}</span>
                  <span style={{ fontWeight: 700, color: cat.isActive ? '#16a34a' : '#94a3b8' }}>
                    {cat.isActive ? 'Available for Billing' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Bulk Student Billing */}
      {activeTab === 'bulk-assign' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24, borderRadius: 16, maxWidth: 800 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="#2563eb" /> Institutional Bulk Fee Assignment
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
              Automatically generate fee records for students across specific programmes, departments, semesters, and sections. Duplicate fee records are automatically prevented.
            </p>

            <form onSubmit={handleBulkAssign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Target Fee Structure *
                </label>
                <select
                  className="form-control"
                  value={bulkForm.feeStructureId}
                  onChange={(e) => setBulkForm({ ...bulkForm, feeStructureId: e.target.value })}
                  required
                >
                  <option value="">-- Select Active Fee Structure --</option>
                  {structures.filter(s => s.status === 'ACTIVE').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.academicYear}) – {formatCurrency(s.amount)} [{s.department || 'All Depts'}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Department / Programme
                  </label>
                  <select
                    className="form-control"
                    value={bulkForm.department}
                    onChange={(e) => setBulkForm({ ...bulkForm, department: e.target.value })}
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Semester
                  </label>
                  <select
                    className="form-control"
                    value={bulkForm.semester}
                    onChange={(e) => setBulkForm({ ...bulkForm, semester: e.target.value })}
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Section
                  </label>
                  <select
                    className="form-control"
                    value={bulkForm.section}
                    onChange={(e) => setBulkForm({ ...bulkForm, section: e.target.value })}
                  >
                    <option value="ALL">All Sections</option>
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Batch / Admission Year (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 2024"
                    value={bulkForm.batch}
                    onChange={(e) => setBulkForm({ ...bulkForm, batch: e.target.value })}
                  />
                </div>
              </div>

              {/* Assignment summary preview */}
              <div style={{ background: 'var(--surface-secondary)', padding: 14, borderRadius: 10, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>Enterprise Batch Protection:</div>
                <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                  Students who already have this fee record will not be charged twice. The system maintains idempotent financial ledgers.
                </div>
              </div>

              <button
                type="submit"
                disabled={bulkSubmitting}
                className="btn btn-primary"
                style={{ padding: '12px 20px', fontWeight: 800, gap: 8 }}
              >
                {bulkSubmitting ? 'Processing Bulk Assignment...' : 'Generate Student Fee Statements Now'}
              </button>
            </form>

            {bulkResult && (
              <div style={{ marginTop: 20, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
                <h4 style={{ margin: '0 0 6px', color: '#16a34a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={18} /> Assignment Successfully Completed
                </h4>
                <div style={{ fontSize: 13, color: '#166534' }}>
                  Fee Structure: <strong>{bulkResult.feeStructureName}</strong>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 12 }}>
                  <div>Total Matched Students: <strong>{bulkResult.totalMatched}</strong></div>
                  <div>Newly Assigned: <strong>{bulkResult.newlyAssigned}</strong></div>
                  <div>Already Assigned (Protected): <strong>{bulkResult.alreadyAssigned}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Scholarships & Concessions */}
      {activeTab === 'concessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Institutional Scholarships &amp; Concessions</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Merit-based waivers, sports quotas, sibling concessions, and bursary adjustments applied to student ledgers.
              </p>
            </div>
            <button
              onClick={() => setShowConcessionModal(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
            >
              <Award size={15} /> Grant Concession / Waiver
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Fee Structure</th>
                    <th>Concession Category</th>
                    <th>Waiver Amount</th>
                    <th>Approved By</th>
                    <th>Reason / Justification</th>
                    <th>Date Granted</th>
                  </tr>
                </thead>
                <tbody>
                  {concessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        No scholarship or concession records found.
                      </td>
                    </tr>
                  ) : (
                    concessions.map(c => (
                      <tr key={c.id}>
                        <td><strong style={{ color: 'var(--text)' }}>{c.studentName}</strong></td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.rollNumber}</td>
                        <td style={{ fontSize: 12 }}>{c.feeStructureName}</td>
                        <td>
                          <span className="badge badge-purple" style={{ fontSize: 11 }}>
                            {c.concessionType} {c.discountPercentage ? `(${c.discountPercentage}%)` : ''}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#16a34a' }}>
                          - {formatCurrency(c.amount)}
                        </td>
                        <td style={{ fontSize: 12 }}>{c.approvedByName || 'Authorized Officer'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.reason || '—'}</td>
                        <td style={{ fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Offline Challan Approvals */}
      {activeTab === 'offline-approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Pending Bank Challan &amp; Offline Submissions</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Verify NEFT / RTGS / Bank Challan counterfoils submitted by students. Approving creates verified university receipts.
              </p>
            </div>
            <button onClick={loadPendingOffline} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
              <RefreshCw size={14} /> Refresh Submissions
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Fee Structure</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Bank &amp; UTR / Ref</th>
                    <th>Payment Date</th>
                    <th>Proof / Counterfoil</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOffline.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                        <CheckCircle size={36} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 700 }}>All offline payment submissions cleared!</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          No pending bank challans awaiting bursar review.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingOffline.map(sub => (
                      <tr key={sub.id}>
                        <td>
                          <strong style={{ color: 'var(--text)' }}>{sub.studentName}</strong>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {sub.rollNumber}
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{sub.feeStructureName}</td>
                        <td style={{ fontWeight: 800, color: 'var(--text)' }}>{formatCurrency(sub.amount)}</td>
                        <td>
                          <span className="badge badge-primary" style={{ fontSize: 11 }}>
                            {sub.paymentMode}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{sub.transactionReference}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.bankName || 'Direct Deposit'}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{formatDate(sub.paymentDate)}</td>
                        <td>
                          {sub.proofDocumentUrl ? (
                            <a
                              href={sub.proofDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-xs"
                              style={{ color: '#2563eb', gap: 4 }}
                            >
                              <ExternalLink size={12} /> View Proof
                            </a>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No file attached</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setReviewModalData(sub)
                              setReviewRemarks('')
                            }}
                            className="btn btn-primary btn-xs"
                            style={{ gap: 4 }}
                          >
                            Review &amp; Verify
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Audit Ledger & All Transactions */}
      {activeTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search & Filters */}
          <div className="card" style={{ padding: 16, borderRadius: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                  Search by Student / Roll / Receipt / UTR
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: 30, fontSize: 12 }}
                    placeholder="e.g. CSE2023001 or AU-FEE..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadTransactions()}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                  Category
                </label>
                <select
                  className="form-control"
                  style={{ fontSize: 12 }}
                  value={txCategory}
                  onChange={(e) => { setTxCategory(e.target.value); setTxPage(0); }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="TUITION">Tuition</option>
                  <option value="EXAM">Exam</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="HOSTEL">Hostel</option>
                  <option value="LIBRARY">Library</option>
                  <option value="LAB">Lab</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                  Payment Status
                </label>
                <select
                  className="form-control"
                  style={{ fontSize: 12 }}
                  value={txStatus}
                  onChange={(e) => { setTxStatus(e.target.value); setTxPage(0); }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">PAID</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="PENDING">PENDING</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="WAIVED">WAIVED</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                  Department
                </label>
                <select
                  className="form-control"
                  style={{ fontSize: 12 }}
                  value={txDept}
                  onChange={(e) => { setTxDept(e.target.value); setTxPage(0); }}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: '100%' }}>
                <button
                  onClick={() => { setTxPage(0); loadTransactions(); }}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, height: 36, gap: 6 }}
                >
                  <Search size={14} /> Filter Ledger
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {txLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Student</th>
                      <th>Roll Number</th>
                      <th>Fee Particulars</th>
                      <th>Due</th>
                      <th>Paid</th>
                      <th>Status</th>
                      <th>Payment Date</th>
                      <th>Official Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                          No transaction records matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      transactions.map(tx => (
                        <tr key={tx.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#2563eb' }}>
                            {tx.receiptNumber || '—'}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--text)' }}>{tx.studentName}</strong>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.department} &bull; Sem {tx.semester}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{tx.rollNumber}</td>
                          <td style={{ fontSize: 12 }}>{tx.feeStructureName}</td>
                          <td style={{ fontWeight: 700 }}>{formatCurrency(tx.amountDue)}</td>
                          <td style={{ fontWeight: 800, color: '#16a34a' }}>{formatCurrency(tx.amountPaid)}</td>
                          <td>
                            <span className={`badge ${
                              tx.status === 'PAID' ? 'badge-success' :
                              tx.status === 'PARTIAL' ? 'badge-info' :
                              tx.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12 }}>{formatDate(tx.paymentDate)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {tx.receiptNumber ? (
                                <>
                                  <button
                                    onClick={() => setActiveReceiptRecord(tx)}
                                    className="btn btn-ghost btn-xs"
                                    style={{ color: '#0f766e', gap: 4 }}
                                    title="View E-Receipt"
                                  >
                                    <Eye size={12} /> View
                                  </button>
                                  <button
                                    onClick={() => handleDownloadPdf(tx.receiptNumber)}
                                    className="btn btn-ghost btn-xs"
                                    style={{ color: '#2563eb', gap: 4 }}
                                    title="Download OpenPDF Stamp"
                                  >
                                    <Download size={12} /> PDF
                                  </button>
                                </>
                              ) : (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unpaid</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                borderTop: '1px solid var(--border)',
                fontSize: 12,
                color: 'var(--text-muted)'
              }}>
                <div>Showing page {txPage + 1} of {txTotalPages} ({txTotalElements} total records)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={txPage === 0}
                    onClick={() => setTxPage(p => Math.max(0, p - 1))}
                    className="btn btn-ghost btn-xs"
                  >
                    Previous
                  </button>
                  <button
                    disabled={txPage >= txTotalPages - 1}
                    onClick={() => setTxPage(p => p + 1)}
                    className="btn btn-ghost btn-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Fee Structure Modal */}
      <Modal
        isOpen={showCreateStructureModal}
        onClose={() => setShowCreateStructureModal(false)}
        title={editingStructure ? 'Edit Fee Structure' : 'Create New Fee Structure'}
        size="md"
      >
        <form onSubmit={handleSaveStructure} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Fee Structure Name *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. B.Tech Autonomous Tuition Fee – Odd Sem"
              value={structureForm.name}
              onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Category Portfolio *</label>
              <select
                className="form-control"
                value={structureForm.categoryCode}
                onChange={(e) => {
                  const val = e.target.value
                  setStructureForm({
                    ...structureForm,
                    categoryCode: val,
                    category: val
                  })
                }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Academic Year *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="2026-27"
                value={structureForm.academicYear}
                onChange={(e) => setStructureForm({ ...structureForm, academicYear: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Department Scope</label>
              <select
                className="form-control"
                value={structureForm.department}
                onChange={(e) => setStructureForm({ ...structureForm, department: e.target.value })}
              >
                <option value="">All Departments (Campus-wide)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Semester Scope</label>
              <select
                className="form-control"
                value={structureForm.semester}
                onChange={(e) => setStructureForm({ ...structureForm, semester: e.target.value })}
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Fee Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="form-control"
                required
                placeholder="65000"
                value={structureForm.amount}
                onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Due Date *</label>
              <input
                type="date"
                className="form-control"
                required
                value={structureForm.dueDate}
                onChange={(e) => setStructureForm({ ...structureForm, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Late Fine / Day (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="50"
                value={structureForm.lateFinePerDay}
                onChange={(e) => setStructureForm({ ...structureForm, lateFinePerDay: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Status</label>
              <select
                className="form-control"
                value={structureForm.status}
                onChange={(e) => setStructureForm({ ...structureForm, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Terms, laboratory inclusions, exam valuation details..."
              value={structureForm.description}
              onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setShowCreateStructureModal(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingStructure ? 'Update Fee Structure' : 'Save & Publish Structure'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Custom Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Create Configurable Fee Category"
        size="sm"
      >
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Category Code *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. CONVOCATION"
              value={categoryForm.code}
              onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Display Name *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Annual Convocation & Robes Fee"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Purpose and applicability..."
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Concession / Waiver Modal */}
      <Modal
        isOpen={showConcessionModal}
        onClose={() => setShowConcessionModal(false)}
        title="Grant Institutional Scholarship / Concession"
        size="md"
      >
        <form onSubmit={handleSaveConcession} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Student User ID *</label>
            <input
              type="number"
              className="form-control"
              required
              placeholder="e.g. 5"
              value={concessionForm.studentId}
              onChange={(e) => setConcessionForm({ ...concessionForm, studentId: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Target Fee Structure *</label>
            <select
              className="form-control"
              required
              value={concessionForm.feeStructureId}
              onChange={(e) => setConcessionForm({ ...concessionForm, feeStructureId: e.target.value })}
            >
              <option value="">-- Select Fee Structure --</option>
              {structures.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.amount)})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Concession Category *</label>
              <select
                className="form-control"
                value={concessionForm.concessionType}
                onChange={(e) => setConcessionForm({ ...concessionForm, concessionType: e.target.value })}
              >
                <option value="MERIT">Merit Scholarship</option>
                <option value="SPORTS">Sports Excellence Quota</option>
                <option value="NEED_BASED">Need-Based Financial Aid</option>
                <option value="SIBLING">Sibling Discount</option>
                <option value="STAFF_WARD">Staff Ward Concession</option>
                <option value="SPECIAL">Special Dean Waiver</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Waiver Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="form-control"
                required
                placeholder="e.g. 25000"
                value={concessionForm.amount}
                onChange={(e) => setConcessionForm({ ...concessionForm, amount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Approval Reason / Justification</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Top 1% rank in autonomous entrance / State championship gold medal"
              value={concessionForm.reason}
              onChange={(e) => setConcessionForm({ ...concessionForm, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setShowConcessionModal(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Apply Concession &amp; Adjust Dues
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Offline Submission Modal */}
      {reviewModalData && (
        <Modal
          isOpen={Boolean(reviewModalData)}
          onClose={() => setReviewModalData(null)}
          title="Review Bank Challan / Offline Deposit"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface-secondary)', padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                <div>Student: <strong>{reviewModalData.studentName}</strong></div>
                <div>Roll Number: <strong style={{ fontFamily: 'monospace' }}>{reviewModalData.rollNumber}</strong></div>
                <div>Fee Particulars: <strong>{reviewModalData.feeStructureName}</strong></div>
                <div>Amount: <strong style={{ color: '#16a34a', fontSize: 15 }}>{formatCurrency(reviewModalData.amount)}</strong></div>
                <div>Mode: <strong>{reviewModalData.paymentMode}</strong></div>
                <div>Bank: <strong>{reviewModalData.bankName || 'Direct Transfer'}</strong></div>
                <div>UTR / Ref: <strong style={{ fontFamily: 'monospace' }}>{reviewModalData.transactionReference}</strong></div>
                <div>Payment Date: <strong>{formatDate(reviewModalData.paymentDate)}</strong></div>
              </div>
            </div>

            {reviewModalData.proofDocumentUrl && (
              <div style={{ textAlign: 'center', padding: 8 }}>
                <a
                  href={reviewModalData.proofDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 6 }}
                >
                  <ExternalLink size={14} /> Open Counterfoil Document in New Tab
                </a>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Review Notes / Verification Remarks
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Verified against university SBI current account statement..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => handleReviewOffline(false)}
                className="btn btn-danger"
                style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
              >
                Reject Submission
              </button>
              <button
                type="button"
                onClick={() => handleReviewOffline(true)}
                className="btn btn-success"
                style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
              >
                Approve &amp; Generate Official Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Fee Receipt Viewer Modal */}
      <FeeReceiptModal
        isOpen={Boolean(activeReceiptRecord)}
        onClose={() => setActiveReceiptRecord(null)}
        record={activeReceiptRecord}
      />
    </div>
  )
}
