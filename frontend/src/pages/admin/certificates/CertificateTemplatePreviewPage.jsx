import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { certificateService } from '../../../services/api'
import { toast } from '../../../components/Toast'
import { Spinner } from '../../../components/Loading'
import CertificatePreview from '../../../components/certificates/CertificatePreview'
import { downloadCertificatePDF } from '../../../utils/certificateGenerator'
import {
  ArrowLeft, Edit2, Printer, Download, ZoomIn, ZoomOut,
  RotateCcw, Award
} from 'lucide-react'

export default function CertificateTemplatePreviewPage() {
  const { templateId } = useParams()
  const navigate = useNavigate()

  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [zoomScale, setZoomScale] = useState(1)
  const [downloading, setDownloading] = useState(false)
  const previewRef = useRef(null)

  useEffect(() => {
    if (!templateId) return
    setLoading(true)
    certificateService.getTemplate(templateId)
      .then(res => {
        if (res.data) setTemplate(res.data)
      })
      .catch(() => toast.error('Failed to load template details.'))
      .finally(() => setLoading(false))
  }, [templateId])

  const sampleData = {
    studentName: 'Sai Teja R',
    rollNumber: 'AU23AIM001',
    eventName: 'Tech-Quiz 2026',
    position: template?.templateType === 'WINNER' ? 'Winner' :
              template?.templateType === 'RUNNER_UP' ? 'Runner-up' :
              template?.templateType === 'SPECIAL_RECOGNITION' ? 'Special Recognition' : 'Participant',
    date: '10 May 2026',
    issueDate: '10 May 2026',
    venue: 'BB Bhavan, Aditya University',
    department: 'Computer Science & Engineering',
    collegeName: template?.collegeName || 'ADITYA UNIVERSITY',
    certificateId: 'AU-SIS-CERT-2026-SAMPLE'
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadSample = async () => {
    setDownloading(true)
    try {
      toast.info('Generating sample PDF...')
      await downloadCertificatePDF(sampleData, template)
      toast.success('Sample certificate PDF downloaded successfully!')
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error('Could not generate sample PDF.')
    } finally {
      setDownloading(false)
    }
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'WINNER':
        return { bg: '#f3e8ff', color: '#7e22ce', label: 'Winner' }
      case 'RUNNER_UP':
        return { bg: '#fef3c7', color: '#d97706', label: 'Runner-up' }
      case 'PARTICIPATION':
        return { bg: '#dcfce7', color: '#15803d', label: 'Participation' }
      case 'SPECIAL_RECOGNITION':
        return { bg: '#fce7f3', color: '#be185d', label: 'Special Recognition' }
      default:
        return { bg: '#eff6ff', color: '#2563eb', label: type || 'General' }
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <Award size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Template Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          The requested certificate template could not be located.
        </p>
        <button
          onClick={() => navigate('/admin/certificates')}
          className="btn btn-primary"
          style={{ background: '#d97706', borderColor: '#d97706' }}
        >
          <ArrowLeft size={16} /> Back to Templates
        </button>
      </div>
    )
  }

  const badge = getTypeBadge(template.templateType)
  const isPublished = template.status === 'PUBLISHED'
  const isArchived = template.status === 'ARCHIVED'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/admin/certificates')}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: 8, padding: '6px 12px', gap: 6 }}
          >
            <ArrowLeft size={16} />
            <span>Templates</span>
          </button>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
              Certificates &gt; Templates &gt; {template.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                {template.name}
              </h1>
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
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#f1f5f9',
                color: '#475569'
              }}>
                v{template.version || 1}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                background: isPublished ? '#dcfce7' : isArchived ? '#f1f5f9' : '#eff6ff',
                color: isPublished ? '#15803d' : isArchived ? '#64748b' : '#2563eb'
              }}>
                {template.status || 'DRAFT'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Zoom controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setZoomScale(s => Math.max(0.6, Number((s - 0.1).toFixed(1))))}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px 8px', borderRadius: 0 }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '0 6px', color: 'var(--text-muted)' }}>
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(s => Math.min(1.5, Number((s + 0.1).toFixed(1))))}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px 8px', borderRadius: 0 }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoomScale(1)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px 8px', borderRadius: 0, borderLeft: '1px solid var(--border)' }}
              title="Reset Zoom"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="btn btn-ghost btn-sm"
            style={{ gap: 6, fontSize: 12, fontWeight: 700 }}
          >
            <Printer size={15} />
            <span>Print Preview</span>
          </button>

          <button
            onClick={handleDownloadSample}
            disabled={downloading}
            className="btn btn-outline btn-sm"
            style={{ gap: 6, fontSize: 12, fontWeight: 700 }}
          >
            <Download size={15} />
            <span>{downloading ? 'Downloading...' : 'Download Sample PDF'}</span>
          </button>

          {!isArchived && (
            <button
              onClick={() => navigate(`/admin/certificates/templates/${template.id}/edit`)}
              className="btn btn-primary btn-sm"
              style={{
                background: '#d97706',
                borderColor: '#d97706',
                color: '#fff',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 8
              }}
            >
              <Edit2 size={14} />
              <span>Edit Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Info notice bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: '#fffbeb',
        border: '1px solid #fef3c7',
        borderRadius: 8,
        fontSize: 12,
        color: '#b45309'
      }}>
        <Award size={16} />
        <span>
          <strong>Sample Preview:</strong> This preview displays realistic sample event and student data. Actual certificates generated by faculty will use real verified database records and unique permanent Certificate IDs.
        </span>
      </div>

      {/* Certificate Display Container */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '30px 10px',
        background: 'var(--surface-secondary)',
        borderRadius: 14,
        border: '1px solid var(--border)',
        overflow: 'auto',
        minHeight: 520
      }}>
        <div
          ref={previewRef}
          style={{
            width: '100%',
            maxWidth: 960,
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}
        >
          <CertificatePreview
            template={template}
            mode="full"
            sampleData={sampleData}
          />
        </div>
      </div>
    </div>
  )
}
