export default function CertificatePreview({
  template = {},
  sampleData = {},
  mode = 'full', // 'full' | 'mini'
  className = '',
  scale = 1
}) {
  const {
    title = 'CERTIFICATE OF ACHIEVEMENT',
    subtitle = 'This certificate is proudly presented to',
    collegeName = 'ADITYA UNIVERSITY',
    description = '',
    bodyTemplate = '',
    primaryColor = '#1e3a8a',
    secondaryColor = '#d99b26',
    textColor = '#0f172a',
    backgroundColor = '#fdfbf7',
    borderWidth = 4,
    fontFamily = 'Playfair Display, Georgia, serif',
    signatoryName = 'Dr. R. Srinivas',
    signatoryTitle = 'Dean, Student Affairs',
    templateType = 'WINNER'
  } = template

  const studentName = sampleData.studentName || template.studentName || 'Vijay Kumar'
  const eventName = sampleData.eventName || template.eventName || 'TECH-QUIZ'
  const position = sampleData.position || template.position || (templateType === 'WINNER' ? 'First Position' : templateType === 'RUNNER_UP' ? 'Second Position' : 'Participation')
  const dateStr = sampleData.date || sampleData.issueDate || template.issueDate || '10 May 2026'
  const certId = sampleData.certificateId || template.certificateId || 'SIS-EVT-2026-0001'

  // Format body text
  let citation = bodyTemplate || description || `for securing ${position} in ${eventName}`
  citation = citation
    .replace(/\{\{STUDENT_NAME\}\}/g, studentName)
    .replace(/\{\{EVENT_NAME\}\}/g, eventName)
    .replace(/\{\{POSITION\}\}/g, position)
    .replace(/\{\{EVENT_DATE\}\}/g, dateStr)
    .replace(/\{\{VENUE\}\}/g, sampleData.venue || 'BB Bhavan, Aditya University')
    .replace(/\{\{DEPARTMENT\}\}/g, sampleData.department || 'Computer Science & Engineering')
    .replace(/\{\{COLLEGE_NAME\}\}/g, collegeName)
    .replace(/\{\{CERTIFICATE_ID\}\}/g, certId)
    .replace(/\{\{ISSUE_DATE\}\}/g, dateStr)

  const isMini = mode === 'mini'

  return (
    <div
      className={`cert-preview-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1.414 / 1', // Standard A4 Landscape
        background: backgroundColor || '#fffefb',
        color: textColor || '#1e293b',
        fontFamily: fontFamily || 'Georgia, serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: isMini ? 6 : 8,
        boxShadow: isMini ? '0 2px 8px rgba(0,0,0,0.08)' : '0 8px 30px rgba(0,0,0,0.12)',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isMini ? '10px 14px' : '28px 36px',
        userSelect: 'none'
      }}
    >
      {/* Ornate Outer Border */}
      <div
        style={{
          position: 'absolute',
          inset: isMini ? 4 : 10,
          border: `${isMini ? Math.max(1, Math.round(borderWidth / 2)) : borderWidth}px solid ${secondaryColor || '#d99b26'}`,
          borderRadius: isMini ? 4 : 6,
          pointerEvents: 'none'
        }}
      />

      {/* Ornate Inner Border */}
      <div
        style={{
          position: 'absolute',
          inset: isMini ? 7 : 16,
          border: `1px solid ${secondaryColor || '#d99b26'}88`,
          borderRadius: isMini ? 2 : 4,
          pointerEvents: 'none'
        }}
      />

      {/* Corner Filigree / Flourish Accents */}
      <svg
        style={{ position: 'absolute', top: isMini ? 6 : 12, left: isMini ? 6 : 12, width: isMini ? 16 : 36, height: isMini ? 16 : 36, pointerEvents: 'none' }}
        viewBox="0 0 40 40"
      >
        <path d="M 0 0 L 35 0 C 15 5, 5 15, 0 35 Z" fill={secondaryColor || '#d99b26'} opacity="0.8" />
        <path d="M 2 2 L 25 2 C 10 5, 5 10, 2 25 Z" fill={backgroundColor || '#fff'} />
      </svg>
      <svg
        style={{ position: 'absolute', top: isMini ? 6 : 12, right: isMini ? 6 : 12, width: isMini ? 16 : 36, height: isMini ? 16 : 36, pointerEvents: 'none' }}
        viewBox="0 0 40 40"
      >
        <path d="M 40 0 L 5 0 C 25 5, 35 15, 40 35 Z" fill={secondaryColor || '#d99b26'} opacity="0.8" />
        <path d="M 38 2 L 15 2 C 30 5, 35 10, 38 25 Z" fill={backgroundColor || '#fff'} />
      </svg>
      <svg
        style={{ position: 'absolute', bottom: isMini ? 6 : 12, left: isMini ? 6 : 12, width: isMini ? 16 : 36, height: isMini ? 16 : 36, pointerEvents: 'none' }}
        viewBox="0 0 40 40"
      >
        <path d="M 0 40 L 35 40 C 15 35, 5 25, 0 5 Z" fill={secondaryColor || '#d99b26'} opacity="0.8" />
        <path d="M 2 38 L 25 38 C 10 35, 5 30, 2 15 Z" fill={backgroundColor || '#fff'} />
      </svg>
      <svg
        style={{ position: 'absolute', bottom: isMini ? 6 : 12, right: isMini ? 6 : 12, width: isMini ? 16 : 36, height: isMini ? 16 : 36, pointerEvents: 'none' }}
        viewBox="0 0 40 40"
      >
        <path d="M 40 40 L 5 40 C 25 35, 35 25, 40 5 Z" fill={secondaryColor || '#d99b26'} opacity="0.8" />
        <path d="M 38 38 L 15 38 C 30 35, 35 30, 38 15 Z" fill={backgroundColor || '#fff'} />
      </svg>

      {/* Certificate Header */}
      <div style={{ textAlign: 'center', zIndex: 1, marginTop: isMini ? 2 : 4 }}>
        {/* Shield / Crest Icon */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: isMini ? 2 : 6 }}>
          <svg width={isMini ? 18 : 34} height={isMini ? 22 : 40} viewBox="0 0 36 44" fill="none">
            <path d="M18 2L3 8V20C3 31 18 42 18 42C18 42 33 31 33 20V8L18 2Z" fill={primaryColor || '#1e3a8a'} stroke={secondaryColor || '#d99b26'} strokeWidth="2" />
            <path d="M18 7L8 12V20C8 28 18 36 18 36C18 36 28 28 28 20V12L18 7Z" fill={secondaryColor || '#d99b26'} opacity="0.3" />
            <text x="18" y="24" fontSize="14" fontWeight="bold" fill="#fff" textAnchor="middle" fontFamily="serif">AU</text>
          </svg>
        </div>

        <div style={{
          fontSize: isMini ? 9 : 15,
          fontWeight: 800,
          color: primaryColor || '#1e3a8a',
          letterSpacing: isMini ? '0.5px' : '2px',
          textTransform: 'uppercase',
          lineHeight: 1.1
        }}>
          {collegeName || 'ADITYA UNIVERSITY'}
        </div>
        <div style={{
          fontSize: isMini ? 6 : 9,
          fontWeight: 600,
          color: secondaryColor || '#d97706',
          letterSpacing: isMini ? '0.5px' : '1.5px',
          textTransform: 'uppercase',
          marginTop: 1
        }}>
          SURAMPALEM, ANDHRA PRADESH
        </div>
      </div>

      {/* Certificate Title & Subtitle */}
      <div style={{ textAlign: 'center', zIndex: 1, margin: isMini ? '2px 0' : '6px 0' }}>
        <h2 style={{
          fontSize: isMini ? 10 : 22,
          fontWeight: 800,
          letterSpacing: isMini ? '0.5px' : '1.5px',
          color: secondaryColor || '#d99b26',
          margin: '0 0 2px',
          textTransform: 'uppercase',
          fontFamily: 'Cinzel, Georgia, serif',
          textShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: isMini ? 7 : 12,
          fontStyle: 'italic',
          color: '#64748b',
          margin: 0
        }}>
          {subtitle}
        </p>
      </div>

      {/* Recipient Name */}
      <div style={{ textAlign: 'center', zIndex: 1, margin: isMini ? '2px 0' : '8px 0' }}>
        <div style={{
          fontSize: isMini ? 14 : 32,
          fontFamily: '"Brush Script MT", "Playfair Display", Georgia, cursive',
          fontWeight: 700,
          color: primaryColor || '#1e3a8a',
          lineHeight: 1.1,
          borderBottom: isMini ? `1px solid ${secondaryColor}66` : `2px solid ${secondaryColor}88`,
          display: 'inline-block',
          padding: isMini ? '0 10px 1px' : '0 30px 4px',
          maxWidth: '85%'
        }}>
          {studentName}
        </div>
      </div>

      {/* Citation / Body Text */}
      <div style={{ textAlign: 'center', zIndex: 1, margin: isMini ? '2px 0' : '4px 0' }}>
        <p style={{
          fontSize: isMini ? 6.5 : 12,
          lineHeight: 1.4,
          color: textColor || '#334155',
          margin: '0 auto',
          maxWidth: isMini ? '90%' : '75%'
        }}>
          {citation}
        </p>
      </div>

      {/* Certificate Footer: Date, Seal, Signatures */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        zIndex: 1,
        paddingTop: isMini ? 2 : 8,
        borderTop: isMini ? '0.5px solid #e2e8f0' : '1px solid #f1f5f9'
      }}>
        {/* Left: Issue Date & ID */}
        <div style={{ fontSize: isMini ? 5.5 : 10, color: '#64748b', lineHeight: 1.4 }}>
          <div><strong>Date:</strong> {dateStr}</div>
          <div><strong>Certificate ID:</strong> {certId}</div>
        </div>

        {/* Center: Official Gold Seal */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: isMini ? 20 : 44,
            height: isMini ? 20 : 44,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${secondaryColor || '#d99b26'} 0%, #b45309 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(180,83,9,0.3)',
            border: isMini ? '1px dashed #fff' : '2px dashed #fff'
          }}>
            <svg width={isMini ? 10 : 22} height={isMini ? 10 : 22} viewBox="0 0 24 24" fill="#fff">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span style={{ fontSize: isMini ? 4.5 : 8, fontWeight: 700, color: secondaryColor || '#d97706', marginTop: 1, letterSpacing: '0.5px' }}>
            OFFICIAL SEAL
          </span>
        </div>

        {/* Right: Signature */}
        <div style={{ textAlign: 'right', fontSize: isMini ? 5.5 : 10, color: '#334155' }}>
          {/* Cursive Signature Stroke */}
          <div style={{
            fontFamily: '"Brush Script MT", cursive',
            fontSize: isMini ? 9 : 18,
            color: primaryColor || '#1e3a8a',
            lineHeight: 1,
            marginBottom: 2
          }}>
            {signatoryName}
          </div>
          <div style={{ borderTop: isMini ? '0.5px solid #94a3b8' : '1px solid #94a3b8', paddingTop: 2 }}>
            <div style={{ fontWeight: 700 }}>{signatoryName}</div>
            <div style={{ color: '#64748b', fontSize: isMini ? 5 : 9 }}>{signatoryTitle}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
