import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { certificateService } from '../../../services/api'
import { toast } from '../../../components/Toast'
import { TableSkeleton, Spinner } from '../../../components/Loading'
import { Modal, ConfirmModal } from '../../../components/Modal'
import { formatDate } from '../../../utils/helpers'
import CertificatePreview from '../../../components/certificates/CertificatePreview'
import {
  FileText, Plus, Search, Filter, Eye, Edit2, MoreVertical,
  Copy, Trash2, CheckCircle2, Clock, X, Download, Archive,
  Award, ShieldCheck, ShieldAlert, AlertTriangle, ExternalLink
} from 'lucide-react'

export default function CertificateTemplatesList() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('templates') // 'templates' | 'issued'

  // Templates State
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const menuRef = useRef(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Issued Certificates State (Requirement 19)
  const [issuedCerts, setIssuedCerts] = useState([])
  const [loadingIssued, setLoadingIssued] = useState(false)
  const [issuedSearch, setIssuedSearch] = useState('')
  const [issuedTypeFilter, setIssuedTypeFilter] = useState('ALL')
  const [issuedStatusFilter, setIssuedStatusFilter] = useState('ALL')
  const [viewCertModal, setViewCertModal] = useState(null)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [revoking, setRevoking] = useState(false)

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await certificateService.getTemplates()
      setTemplates(res.data || [])
    } catch {
      toast.error('Failed to load certificate templates.')
    } finally {
      setLoading(false)
    }
  }

  const loadIssuedCertificates = async () => {
    setLoadingIssued(true)
    try {
      const res = await certificateService.getAll()
      setIssuedCerts(res.data || [])
    } catch {
      toast.error('Failed to load issued certificates.')
    } finally {
      setLoadingIssued(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (activeTab === 'issued') {
      loadIssuedCertificates()
    }
  }, [activeTab])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDuplicate = async (id) => {
    try {
      await certificateService.duplicateTemplate(id)
      toast.success('Template duplicated successfully!')
      setActiveMenuId(null)
      loadTemplates()
    } catch {
      toast.error('Failed to duplicate template.')
    }
  }

  const handleTogglePublish = async (t) => {
    try {
      await certificateService.publishTemplate(t.id)
      toast.success(t.status === 'PUBLISHED' ? 'Template unpublished to draft.' : 'Template published successfully!')
      setActiveMenuId(null)
      loadTemplates()
    } catch {
      toast.error('Failed to update template status.')
    }
  }

  const handleArchive = async (id) => {
    try {
      await certificateService.archiveTemplate(id)
      toast.success('Template archived successfully!')
      setActiveMenuId(null)
      loadTemplates()
    } catch {
      toast.error('Failed to archive template.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await certificateService.deleteTemplate(deleteTarget.id)
      toast.success('Template deleted successfully.')
      setDeleteTarget(null)
      loadTemplates()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete template.')
    }
  }

  const handleRevokeSubmit = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await certificateService.revoke(revokeTarget.id, revokeReason || 'Administrative correction')
      toast.success(`Certificate ${revokeTarget.certificateId} has been revoked.`)
      setRevokeTarget(null)
      setRevokeReason('')
      loadIssuedCertificates()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke certificate.')
    } finally {
      setRevoking(false)
    }
  }

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'ALL' || t.templateType === typeFilter
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const filteredIssued = issuedCerts.filter(c => {
    const matchesSearch = !issuedSearch ||
      c.certificateId?.toLowerCase().includes(issuedSearch.toLowerCase()) ||
      c.studentName?.toLowerCase().includes(issuedSearch.toLowerCase()) ||
      c.eventName?.toLowerCase().includes(issuedSearch.toLowerCase()) ||
      c.rollNumber?.toLowerCase().includes(issuedSearch.toLowerCase())
    const matchesType = issuedTypeFilter === 'ALL' || c.certificateType === issuedTypeFilter
    const matchesStatus = issuedStatusFilter === 'ALL' || c.status === issuedStatusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'WINNER':
        return { bg: '#f3e8ff', color: '#7e22ce', label: 'Winner' }
      case 'PARTICIPATION':
        return { bg: '#dcfce7', color: '#15803d', label: 'Participation' }
      case 'RUNNER_UP':
        return { bg: '#fef3c7', color: '#d97706', label: 'Runner-up' }
      case 'SPECIAL_RECOGNITION':
        return { bg: '#fce7f3', color: '#be185d', label: 'Special Recognition' }
      default:
        return { bg: '#eff6ff', color: '#2563eb', label: type || 'General' }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header matching Reference Image 2 Top */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Certificate Templates
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Create and manage certificate designs used for university events.
          </p>
        </div>

        {/* "+ Create Template" Button (Gold) */}
        <button
          onClick={() => navigate('/admin/certificates/templates/new')}
          className="btn btn-primary"
          style={{
            background: '#d97706',
            borderColor: '#d97706',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            padding: '0 18px',
            height: 40,
            gap: 8,
            boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
            borderRadius: 10
          }}
        >
          <Plus size={16} />
          <span>Create Template</span>
        </button>
      </div>

      {/* Tabs: Certificate Templates vs Issued Certificates (Requirement 19) */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 2
      }}>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'templates' ? '2px solid #d97706' : '2px solid transparent',
            color: activeTab === 'templates' ? '#d97706' : 'var(--text-muted)',
            fontWeight: activeTab === 'templates' ? 800 : 600,
            fontSize: 14,
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <FileText size={16} />
          <span>Certificate Templates ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('issued')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'issued' ? '2px solid #d97706' : '2px solid transparent',
            color: activeTab === 'issued' ? '#d97706' : 'var(--text-muted)',
            fontWeight: activeTab === 'issued' ? 800 : 600,
            fontSize: 14,
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Award size={16} />
          <span>Issued Certificates ({issuedCerts.length})</span>
        </button>
      </div>

      {activeTab === 'templates' ? (
        <>
          {/* Filter Row matching Reference Image 2 Top */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap'
          }}>
            {/* Search input */}
            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 36, height: 38, fontSize: 13, borderRadius: 10 }}
                placeholder="Search certificate templates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-light)' }} />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 10, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Type dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Type:</span>
              <select
                className="form-select"
                style={{ height: 38, fontSize: 13, width: 160, borderRadius: 10 }}
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="WINNER">Winner</option>
                <option value="PARTICIPATION">Participation</option>
                <option value="RUNNER_UP">Runner-up</option>
                <option value="SPECIAL_RECOGNITION">Special Recognition</option>
                <option value="ACHIEVEMENT">Achievement</option>
              </select>
            </div>

            {/* Status dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
              <select
                className="form-select"
                style={{ height: 38, fontSize: 13, width: 140, borderRadius: 10 }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Templates Grid matching Image 2 Top (with REAL visual certificate previews) */}
          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : filteredTemplates.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 14 }}>
              <FileText size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No Templates Found</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 20px' }}>
                {search || typeFilter !== 'ALL' ? 'No certificate templates match your filters.' : 'Create your first certificate template for Aditya University.'}
              </p>
              <button
                onClick={() => navigate('/admin/certificates/templates/new')}
                className="btn btn-primary"
                style={{ background: '#d97706', borderColor: '#d97706' }}
              >
                <Plus size={16} /> Create Template
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24
            }}>
              {filteredTemplates.map(t => {
                const badge = getTypeBadgeStyle(t.templateType)
                const isMenuOpen = activeMenuId === t.id
                const isPublished = t.status === 'PUBLISHED'
                const isArchived = t.status === 'ARCHIVED'

                return (
                  <div
                    key={t.id}
                    className="card card-hover"
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      position: 'relative'
                    }}
                  >
                    {/* Visual Certificate Preview Thumbnail matching Reference Image 2 */}
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/admin/certificates/templates/${t.id}/preview`)}
                      title="Click to preview full certificate"
                    >
                      <CertificatePreview
                        template={t}
                        mode="mini"
                        sampleData={{
                          studentName: 'Vijay Kumar',
                          eventName: 'TECH-QUIZ',
                          position: badge.label,
                          date: '10 May 2026',
                          certificateId: 'SIS-EVT-2026-0001'
                        }}
                      />
                    </div>

                    {/* Template Info */}
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
                        {t.name}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 12,
                            background: badge.bg,
                            color: badge.color,
                            display: 'inline-block'
                          }}
                        >
                          {badge.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                          v{t.version || 1}
                        </span>
                      </div>

                      <p style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {t.description || `Certificate for event ${badge.label.toLowerCase()}s.`}
                      </p>
                    </div>

                    {/* Footer: Updated date & Published Status */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      paddingTop: 8,
                      borderTop: '1px solid var(--border)'
                    }}>
                      <span>Updated: {formatDate(t.updatedAt || t.createdAt)}</span>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontWeight: 700,
                        color: isPublished ? '#15803d' : isArchived ? '#64748b' : '#2563eb'
                      }}>
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: isPublished ? '#16a34a' : isArchived ? '#94a3b8' : '#2563eb'
                        }} />
                        {isPublished ? 'Published' : isArchived ? 'Archived' : 'Draft'}
                      </span>
                    </div>

                    {/* Action Buttons: [ Preview ], [ Edit ], [...] */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => navigate(`/admin/certificates/templates/${t.id}/preview`)}
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>

                      {!isArchived ? (
                        <button
                          onClick={() => navigate(`/admin/certificates/templates/${t.id}/edit`)}
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#d97706' }}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <span
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#64748b',
                            background: '#f1f5f9',
                            borderRadius: 6,
                            padding: '4px 8px'
                          }}
                        >
                          <Archive size={13} />
                          <span>Archived</span>
                        </span>
                      )}

                      {/* 3 dots menu */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setActiveMenuId(isMenuOpen ? null : t.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: 6 }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            style={{
                              position: 'absolute',
                              right: 0,
                              bottom: 'calc(100% + 4px)',
                              width: 170,
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 10,
                              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                              padding: 6,
                              zIndex: 50
                            }}
                          >
                            <button
                              onClick={() => handleDuplicate(t.id)}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
                                color: 'var(--text)', fontSize: 12, cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Copy size={13} />
                              <span>Duplicate</span>
                            </button>

                            <button
                              onClick={() => handleTogglePublish(t)}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
                                color: 'var(--text)', fontSize: 12, cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <CheckCircle2 size={13} style={{ color: isPublished ? '#dc2626' : '#16a34a' }} />
                              <span>{isPublished ? 'Unpublish to Draft' : 'Publish Template'}</span>
                            </button>

                            {!isArchived && (
                              <button
                                onClick={() => handleArchive(t.id)}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
                                  color: 'var(--text)', fontSize: 12, cursor: 'pointer', textAlign: 'left'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <Archive size={13} style={{ color: '#d97706' }} />
                                <span>Archive Template</span>
                              </button>
                            )}

                            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                            <button
                              onClick={() => { setActiveMenuId(null); setDeleteTarget(t); }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
                                color: '#dc2626', fontSize: 12, cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Trash2 size={13} />
                              <span>Delete Template</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* Issued Certificates Management (Requirement 19) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search & Filters */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 36, height: 38, fontSize: 13, borderRadius: 10 }}
                placeholder="Search certificates, students, events..."
                value={issuedSearch}
                onChange={e => setIssuedSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-light)' }} />
              {issuedSearch && (
                <button
                  onClick={() => setIssuedSearch('')}
                  style={{ position: 'absolute', right: 10, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Type:</span>
              <select
                className="form-select"
                style={{ height: 38, fontSize: 13, width: 160, borderRadius: 10 }}
                value={issuedTypeFilter}
                onChange={e => setIssuedTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="WINNER">Winner</option>
                <option value="RUNNER_UP">Runner-up</option>
                <option value="PARTICIPATION">Participation</option>
                <option value="SPECIAL_RECOGNITION">Special Recognition</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
              <select
                className="form-select"
                style={{ height: 38, fontSize: 13, width: 140, borderRadius: 10 }}
                value={issuedStatusFilter}
                onChange={e => setIssuedStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="VALID">Valid</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </div>

          {/* Certificates Table (Requirement 19: Columns: Certificate ID, Student, Event, Type, Issue Date, Status, Actions) */}
          {loadingIssued ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filteredIssued.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 14 }}>
              <Award size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No Issued Certificates</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {issuedSearch ? 'No certificates match the current search filters.' : 'Certificates will appear here once generated by assigned event faculty.'}
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
              <div className="table-responsive">
                <table className="table" style={{ margin: 0, fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Certificate ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Student</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Event</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Certificate Type</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Issue Date</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssued.map(cert => {
                      const badge = getTypeBadgeStyle(cert.certificateType)
                      const isRevoked = cert.status === 'REVOKED'

                      return (
                        <tr key={cert.id} style={{ borderBottom: '1px solid var(--border)', background: isRevoked ? '#fff7ed' : 'transparent' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>
                            {cert.certificateId}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{cert.studentName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cert.rollNumber}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>
                            {cert.eventName}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: badge.bg,
                              color: badge.color
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                            {formatDate(cert.issueDate || cert.generatedAt)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: isRevoked ? '#fee2e2' : '#dcfce7',
                              color: isRevoked ? '#b91c1c' : '#15803d'
                            }}>
                              {cert.status || 'VALID'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                onClick={() => setViewCertModal(cert)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', fontSize: 12, gap: 4 }}
                                title="View Certificate"
                              >
                                <Eye size={13} />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() => certificateService.downloadPdf(cert.certificateId, cert)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', fontSize: 12, gap: 4, color: '#16a34a' }}
                                title="Download PDF"
                              >
                                <Download size={13} />
                                <span>Download</span>
                              </button>

                              <a
                                href={`/certificates/verify/${cert.certificateId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', fontSize: 12, gap: 4, color: '#2563eb', textDecoration: 'none' }}
                                title="Verify Public URL"
                              >
                                <ShieldCheck size={13} />
                                <span>Verify</span>
                              </a>

                              {!isRevoked && (
                                <button
                                  onClick={() => { setRevokeTarget(cert); setRevokeReason(''); }}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '4px 8px', fontSize: 12, gap: 4, color: '#dc2626' }}
                                  title="Revoke Certificate"
                                >
                                  <ShieldAlert size={13} />
                                  <span>Revoke</span>
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
        </div>
      )}

      {/* View Certificate Modal */}
      {viewCertModal && (
        <Modal
          isOpen={Boolean(viewCertModal)}
          onClose={() => setViewCertModal(null)}
          title={`Certificate: ${viewCertModal.certificateId}`}
          size="lg"
        >
          <div style={{ padding: '10px 0' }}>
            <CertificatePreview
              template={templates.find(t => t.id === viewCertModal.templateId) || {}}
              mode="full"
              sampleData={{
                studentName: viewCertModal.studentName,
                eventName: viewCertModal.eventName,
                position: viewCertModal.position || viewCertModal.certificateType,
                date: viewCertModal.issueDate || '10 May 2026',
                certificateId: viewCertModal.certificateId,
                collegeName: viewCertModal.collegeName
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => certificateService.downloadPdf(viewCertModal.certificateId, viewCertModal)}
                className="btn btn-primary"
                style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Revoke Certificate Modal (Requirement 21) */}
      {revokeTarget && (
        <Modal
          isOpen={Boolean(revokeTarget)}
          onClose={() => setRevokeTarget(null)}
          title="Revoke Certificate"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              borderRadius: 8,
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 13
            }}>
              <AlertTriangle size={20} />
              <div>
                <strong>Warning:</strong> Revoking will permanently invalidate Certificate ID: <strong>{revokeTarget.certificateId}</strong>.
                The audit log will record this action.
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Reason for Revocation *
              </label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g. Assigned to incorrect student / event result modified by department..."
                value={revokeReason}
                onChange={e => setRevokeReason(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setRevokeTarget(null)}
                className="btn btn-ghost"
                disabled={revoking}
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeSubmit}
                disabled={revoking}
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
              >
                {revoking ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Template Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Certificate Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Already generated certificates will NOT be affected, but no new certificates can use this template.`}
        confirmText="Delete Template"
        danger
      />
    </div>
  )
}
