import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { certificateService } from '../../../services/api'
import { toast } from '../../../components/Toast'
import { TableSkeleton } from '../../../components/Loading'
import CertificatePreview from '../../../components/certificates/CertificatePreview'
import { downloadCertificatePDF } from '../../../utils/certificateGenerator'
import {
  FileText, Layout, Type, Image as ImageIcon, PenTool,
  Sliders, Eye, RotateCcw, RotateCw, Maximize2,
  Download, Plus, X
} from 'lucide-react'

export default function CertificateTemplateEditor({ isNew = false }) {
  const { templateId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic') // basic | design | text | logo | signature | border | preview
  const [selectedFieldToAdd, setSelectedFieldToAdd] = useState('{{STUDENT_NAME}}')

  // History for undo/redo
  const [history, setHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)

  // Zoom / Fit state
  const [fitToScreen, setFitToScreen] = useState(false)

  // Certificate template state
  const [form, setForm] = useState({
    name: 'Event Winner Certificate',
    templateType: 'WINNER',
    title: 'CERTIFICATE OF ACHIEVEMENT',
    subtitle: 'This certificate is proudly presented to',
    collegeName: 'ADITYA UNIVERSITY',
    description: 'Certificate for event winners.',
    bodyTemplate: 'for securing First Position in TECH-QUIZ',
    borderStyle: 'CLASSIC_GOLD',
    borderWidth: 4,
    borderColor: '#d99b26',
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize: 16,
    fontWeight: 'bold',
    textAlignment: 'CENTER',
    textColor: '#1e293b',
    primaryColor: '#1e3a8a',
    secondaryColor: '#d99b26',
    backgroundColor: '#fffefb',
    signatoryName: 'Dr. R. Srinivas',
    signatoryTitle: 'Dean, Student Affairs',
    signatory2Name: 'Dr. M. Sreenivasa Rao',
    signatory2Title: 'Principal, Technical Campus',
    status: 'PUBLISHED'
  })

  // Dynamic field chips
  const [dynamicChips, setDynamicChips] = useState([
    '{{STUDENT_NAME}}',
    '{{EVENT_NAME}}',
    '{{POSITION}}',
    '{{EVENT_DATE}}',
    '{{VENUE}}',
    '{{CERTIFICATE_ID}}'
  ])

  // Sample data for live preview
  const [sampleData, setSampleData] = useState({
    studentName: 'Vijay Kumar',
    eventName: 'TECH-QUIZ',
    position: 'First Position',
    date: '10 May 2026',
    venue: 'BB Bhavan, Aditya University',
    department: 'Computer Science & Engineering',
    certificateId: 'SIS-EVT-2026-0001'
  })

  useEffect(() => {
    if (!isNew && templateId) {
      setLoading(true)
      certificateService.getTemplate(templateId)
        .then(res => {
          if (res.data) {
            setForm(res.data)
            // Push initial state to history
            setHistory([res.data])
            setHistoryIdx(0)
          }
        })
        .catch(() => toast.error('Failed to load template.'))
        .finally(() => setLoading(false))
    } else {
      setHistory([form])
      setHistoryIdx(0)
    }
  }, [templateId, isNew])

  const updateForm = (updates) => {
    const updated = { ...form, ...updates }
    setForm(updated)
    // Add to history
    const nextHistory = history.slice(0, historyIdx + 1)
    nextHistory.push(updated)
    setHistory(nextHistory)
    setHistoryIdx(nextHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1)
      setForm(history[historyIdx - 1])
    }
  }

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1)
      setForm(history[historyIdx + 1])
    }
  }

  const handleAddFieldChip = () => {
    if (!dynamicChips.includes(selectedFieldToAdd)) {
      setDynamicChips([...dynamicChips, selectedFieldToAdd])
    }
    // Also append to bodyTemplate
    const newBody = form.bodyTemplate ? `${form.bodyTemplate} ${selectedFieldToAdd}` : selectedFieldToAdd
    updateForm({ bodyTemplate: newBody })
    toast.info(`Field ${selectedFieldToAdd} inserted!`)
  }

  const handleRemoveChip = (chipToRemove) => {
    setDynamicChips(dynamicChips.filter(c => c !== chipToRemove))
  }

  const handleSave = async (statusToSet) => {
    if (!form.name.trim()) {
      toast.error('Template name is required.')
      return
    }
    setSaving(true)
    const payload = { ...form, status: statusToSet }
    try {
      if (!isNew && templateId) {
        await certificateService.updateTemplate(templateId, payload)
        toast.success(`Template saved as ${statusToSet}!`)
      } else {
        await certificateService.createTemplate(payload)
        toast.success(`Template created and saved as ${statusToSet}!`)
      }
      navigate('/admin/certificates')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save certificate template.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <TableSkeleton rows={6} cols={3} />

  const TABS = [
    { id: 'basic', label: 'Basic Information', icon: FileText },
    { id: 'design', label: 'Design & Layout', icon: Layout },
    { id: 'text', label: 'Text Elements', icon: Type },
    { id: 'logo', label: 'University Logo', icon: ImageIcon },
    { id: 'signature', label: 'Signature', icon: PenTool },
    { id: 'border', label: 'Background & Border', icon: Sliders },
    { id: 'preview', label: 'Preview & Export', icon: Eye }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Breadcrumbs matching Reference Image 2 Bottom */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
            Certificates &gt; Templates &gt; {isNew ? 'New' : 'Edit'}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {isNew ? 'Create Certificate Template' : 'Edit Certificate Template'}
          </h1>
        </div>

        {/* Top Header Toolbar: Undo, Redo, Fit to Screen, Download Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 10px' }}
            title="Undo"
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 10px' }}
            title="Redo"
          >
            <RotateCw size={15} />
          </button>

          <button
            onClick={() => setFitToScreen(!fitToScreen)}
            className="btn btn-ghost btn-sm"
            style={{ gap: 6, fontSize: 12 }}
          >
            <Maximize2 size={14} />
            <span>Fit to Screen</span>
          </button>

          <button
            onClick={async () => {
              try {
                toast.info('Generating certificate PDF preview...')
                await downloadCertificatePDF(sampleData, form)
                toast.success('Certificate PDF downloaded successfully!')
              } catch (err) {
                console.error('PDF preview error:', err)
                toast.error('Could not generate PDF preview.')
              }
            }}
            className="btn btn-sm"
            style={{
              background: '#d97706',
              borderColor: '#d97706',
              color: '#fff',
              gap: 6,
              fontWeight: 700,
              fontSize: 12
            }}
          >
            <Download size={14} />
            <span>Download Preview</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Editor Layout matching Reference Image 2 Bottom */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px minmax(320px, 1.2fr) minmax(380px, 1.6fr)',
        gap: 20,
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: Vertical Navigation Tabs matching Image 2 */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? '#fef3c7' : 'transparent',
                  color: isActive ? '#d97706' : 'var(--text)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} style={{ color: isActive ? '#d97706' : 'var(--text-light)' }} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* MIDDLE COLUMN: Form Controls according to selected tab */}
        <div className="card" style={{ padding: 22, borderRadius: 14, minHeight: 480 }}>
          {/* TAB 1: BASIC INFORMATION matching Image 2 */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                Basic Information
              </h3>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Template Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => updateForm({ name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Certificate Type *</label>
                  <select
                    className="form-select"
                    value={form.templateType}
                    onChange={e => updateForm({ templateType: e.target.value })}
                  >
                    <option value="WINNER">Winner</option>
                    <option value="RUNNER_UP">Runner-up</option>
                    <option value="SECOND_RUNNER_UP">Second Runner-up</option>
                    <option value="SPECIAL_RECOGNITION">Special Recognition</option>
                    <option value="PARTICIPATION">Participation</option>
                    <option value="ACHIEVEMENT">Achievement</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Certificate Title *</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={e => updateForm({ title: e.target.value })}
                  placeholder="e.g. CERTIFICATE OF ACHIEVEMENT"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle *</label>
                <input
                  className="form-input"
                  value={form.subtitle}
                  onChange={e => updateForm({ subtitle: e.target.value })}
                  placeholder="e.g. This certificate is proudly presented to"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Description (Optional)</label>
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                    {(form.description || '').length}/200
                  </span>
                </div>
                <textarea
                  className="form-input"
                  rows={2}
                  maxLength={200}
                  value={form.description || ''}
                  onChange={e => updateForm({ description: e.target.value })}
                  placeholder="e.g. Certificate for event winners."
                />
              </div>

              {/* Dynamic Fields Section matching Image 2 */}
              <div style={{
                background: 'var(--surface-secondary)',
                padding: 14,
                borderRadius: 10,
                border: '1px solid var(--border)'
              }}>
                <label className="form-label" style={{ marginBottom: 4 }}>Dynamic Fields</label>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px' }}>
                  Add dynamic fields to use in certificate template.
                </p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <select
                    className="form-select"
                    style={{ flex: 1, fontSize: 12 }}
                    value={selectedFieldToAdd}
                    onChange={e => setSelectedFieldToAdd(e.target.value)}
                  >
                    <option value="{{STUDENT_NAME}}">{'{{STUDENT_NAME}}'}</option>
                    <option value="{{STUDENT_ID}}">{'{{STUDENT_ID}}'}</option>
                    <option value="{{EVENT_NAME}}">{'{{EVENT_NAME}}'}</option>
                    <option value="{{POSITION}}">{'{{POSITION}}'}</option>
                    <option value="{{EVENT_DATE}}">{'{{EVENT_DATE}}'}</option>
                    <option value="{{VENUE}}">{'{{VENUE}}'}</option>
                    <option value="{{DEPARTMENT}}">{'{{DEPARTMENT}}'}</option>
                    <option value="{{COLLEGE_NAME}}">{'{{COLLEGE_NAME}}'}</option>
                    <option value="{{CERTIFICATE_ID}}">{'{{CERTIFICATE_ID}}'}</option>
                    <option value="{{ISSUE_DATE}}">{'{{ISSUE_DATE}}'}</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddFieldChip}
                    className="btn btn-sm btn-primary"
                    style={{ background: '#d97706', borderColor: '#d97706', fontSize: 12, padding: '0 12px' }}
                  >
                    <Plus size={14} /> Add Field
                  </button>
                </div>

                {/* Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {dynamicChips.map(chip => (
                    <span
                      key={chip}
                      style={{
                        fontSize: 11,
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '3px 8px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: 'monospace'
                      }}
                    >
                      {chip}
                      <button
                        type="button"
                        onClick={() => handleRemoveChip(chip)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESIGN & LAYOUT matching Image 2 Dark/Bright Mode */}
          {activeTab === 'design' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                Design & Layout
              </h3>

              <div className="form-group">
                <label className="form-label">Border Style</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { id: 'CLASSIC_GOLD', label: 'Classic Gold' },
                    { id: 'ROYAL_NAVY', label: 'Royal Navy' },
                    { id: 'MODERN_MINIMAL', label: 'Minimal' },
                    { id: 'DOUBLE_LINE', label: 'Double Line' }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => updateForm({ borderStyle: b.id })}
                      className={`btn btn-sm ${form.borderStyle === b.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: 11, padding: '8px 4px', justifyContent: 'center' }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Border Width</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{form.borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={form.borderWidth}
                  onChange={e => updateForm({ borderWidth: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#d97706' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Corner Style</label>
                <select
                  className="form-select"
                  value={form.cornerStyle || 'Elegant'}
                  onChange={e => updateForm({ cornerStyle: e.target.value })}
                >
                  <option value="Elegant">Elegant</option>
                  <option value="Square">Square</option>
                  <option value="Rounded">Rounded</option>
                  <option value="Flourish">Flourish</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Background Style</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Classic', 'Modern', 'Minimal', 'Academic'].map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => updateForm({
                        backgroundStyle: bg,
                        backgroundColor: bg === 'Classic' ? '#fffdf7' : bg === 'Academic' ? '#f8fafc' : '#ffffff'
                      })}
                      className={`btn btn-sm ${form.backgroundStyle === bg ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, fontSize: 11 }}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers: Primary, Secondary, Text */}
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Primary Colour</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="color"
                      value={form.primaryColor || '#1e3a8a'}
                      onChange={e => updateForm({ primaryColor: e.target.value })}
                      style={{ width: 34, height: 34, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{form.primaryColor}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Colour</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="color"
                      value={form.secondaryColor || '#d99b26'}
                      onChange={e => updateForm({ secondaryColor: e.target.value })}
                      style={{ width: 34, height: 34, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{form.secondaryColor}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Text Colour</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="color"
                      value={form.textColor || '#1e293b'}
                      onChange={e => updateForm({ textColor: e.target.value })}
                      style={{ width: 34, height: 34, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{form.textColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEXT ELEMENTS */}
          {activeTab === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                Text Elements & Typography
              </h3>

              <div className="form-group">
                <label className="form-label">Font Family</label>
                <select
                  className="form-select"
                  value={form.fontFamily}
                  onChange={e => updateForm({ fontFamily: e.target.value })}
                >
                  <option value="Playfair Display, Georgia, serif">Playfair Display (Academic)</option>
                  <option value="Cinzel, Georgia, serif">Cinzel (Diplomatic Serif)</option>
                  <option value="Georgia, serif">Georgia (Classic Roman)</option>
                  <option value="Times New Roman, serif">Times New Roman (Traditional)</option>
                  <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Citation / Body Template Text</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={form.bodyTemplate || ''}
                  onChange={e => updateForm({ bodyTemplate: e.target.value })}
                  placeholder="e.g. for securing {{POSITION}} in {{EVENT_NAME}} organized by {{COLLEGE_NAME}}"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Text Alignment</label>
                  <select
                    className="form-select"
                    value={form.textAlignment}
                    onChange={e => updateForm({ textAlignment: e.target.value })}
                  >
                    <option value="CENTER">Center</option>
                    <option value="LEFT">Left</option>
                    <option value="RIGHT">Right</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Font Weight</label>
                  <select
                    className="form-select"
                    value={form.fontWeight}
                    onChange={e => updateForm({ fontWeight: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="600">Semi-Bold</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: UNIVERSITY LOGO */}
          {activeTab === 'logo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                University Header & Branding
              </h3>

              <div className="form-group">
                <label className="form-label">University / Institution Name</label>
                <input
                  className="form-input"
                  value={form.collegeName}
                  onChange={e => updateForm({ collegeName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tagline / Location</label>
                <input
                  className="form-input"
                  value="SURAMPALEM, ANDHRA PRADESH"
                  disabled
                />
              </div>

              <div style={{ padding: 14, background: '#eff6ff', borderRadius: 10, fontSize: 12, color: '#1e40af' }}>
                Official Aditya University Crest with shield and academic insignia is embedded automatically into all generated certificates.
              </div>
            </div>
          )}

          {/* TAB 5: SIGNATURE */}
          {activeTab === 'signature' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                Signatory Details
              </h3>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Primary Signatory Name *</label>
                  <input
                    className="form-input"
                    value={form.signatoryName}
                    onChange={e => updateForm({ signatoryName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Signatory Title *</label>
                  <input
                    className="form-input"
                    value={form.signatoryTitle}
                    onChange={e => updateForm({ signatoryTitle: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Secondary Signatory Name</label>
                  <input
                    className="form-input"
                    value={form.signatory2Name || ''}
                    onChange={e => updateForm({ signatory2Name: e.target.value })}
                    placeholder="e.g. Dr. M. Sreenivasa Rao"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Signatory Title</label>
                  <input
                    className="form-input"
                    value={form.signatory2Title || ''}
                    onChange={e => updateForm({ signatory2Title: e.target.value })}
                    placeholder="e.g. Principal / Vice Chancellor"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BACKGROUND & BORDER */}
          {activeTab === 'border' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                Background & Border Embellishments
              </h3>

              <div className="form-group">
                <label className="form-label">Border Accent Colour</label>
                <input
                  type="color"
                  value={form.borderColor || '#d99b26'}
                  onChange={e => updateForm({ borderColor: e.target.value })}
                  style={{ width: 44, height: 38, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parchment Warmth</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: '#fffefb', label: 'Warm Cream' },
                    { id: '#ffffff', label: 'Pure White' },
                    { id: '#fdf8ec', label: 'Antique Gold' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => updateForm({ backgroundColor: c.id })}
                      className={`btn btn-sm ${form.backgroundColor === c.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex: 1, fontSize: 11 }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PREVIEW & EXPORT */}
          {activeTab === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
                Sample Preview Data
              </h3>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Sample Student Name</label>
                  <input
                    className="form-input"
                    value={sampleData.studentName}
                    onChange={e => setSampleData({ ...sampleData, studentName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sample Event</label>
                  <input
                    className="form-input"
                    value={sampleData.eventName}
                    onChange={e => setSampleData({ ...sampleData, eventName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Sample Position</label>
                  <input
                    className="form-input"
                    value={sampleData.position}
                    onChange={e => setSampleData({ ...sampleData, position: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sample Date</label>
                  <input
                    className="form-input"
                    value={sampleData.date}
                    onChange={e => setSampleData({ ...sampleData, date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Certificate Preview matching Reference Image 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Live Preview
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Sample data is shown for preview.
              </p>
            </div>
          </div>

          {/* Certificate Live Preview Box */}
          <div style={{
            background: 'var(--surface-secondary)',
            padding: 12,
            borderRadius: 14,
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <CertificatePreview
              template={form}
              mode="full"
              sampleData={sampleData}
              scale={fitToScreen ? 0.95 : 1}
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar matching Reference Image 2 Bottom: Cancel, Save Draft, Save & Publish */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
        marginTop: 12
      }}>
        <button
          type="button"
          onClick={() => navigate('/admin/certificates')}
          className="btn btn-ghost"
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => handleSave('DRAFT')}
          className="btn btn-ghost"
          style={{ border: '1px solid var(--border)' }}
          disabled={saving}
        >
          Save Draft
        </button>

        <button
          type="button"
          onClick={() => handleSave('PUBLISHED')}
          className="btn btn-primary"
          style={{
            background: '#d97706',
            borderColor: '#d97706',
            fontWeight: 800,
            padding: '0 24px',
            height: 42,
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
          }}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save & Publish'}
        </button>
      </div>
    </div>
  )
}
