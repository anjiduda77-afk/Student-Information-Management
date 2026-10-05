import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

/**
 * Converts a hex color string like '#1e3a8a' to RGB array [30, 58, 138]
 */
function hexToRgb(hex, defaultRgb = [30, 58, 138]) {
  if (!hex || typeof hex !== 'string') return defaultRgb
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16)
    ]
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    ]
  }
  return defaultRgb
}

/**
 * Generates and downloads an official University Certificate PDF.
 * @param {Object} cert - Certificate data object (or student sample data)
 * @param {Object} [template] - Optional template styling & custom fields
 */
export async function downloadCertificatePDF(cert = {}, template = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4' // 297mm x 210mm
  })

  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  // Extract config
  const collegeName = template.collegeName || cert.collegeName || 'ADITYA UNIVERSITY'
  const isWinner = cert.certificateType === 'WINNER' ||
    cert.certificateType === 'EXCELLENCE' ||
    cert.position === 'First Position' ||
    cert.position === 'Winner' ||
    template.templateType === 'WINNER'

  const certTitle = template.title || cert.title ||
    (isWinner ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF PARTICIPATION')

  const subtitle = template.subtitle || cert.subtitle || 'This is proudly presented to'

  const primaryRgb = hexToRgb(template.primaryColor || '#1e3a8a', [30, 58, 138])
  const secondaryRgb = hexToRgb(template.secondaryColor || '#d97706', [217, 119, 6])
  const textRgb = hexToRgb(template.textColor || '#0f172a', [15, 23, 42])

  const studentName = (cert.studentName || 'STUDENT NAME').toUpperCase()
  const eventName = cert.eventName || 'University Technical Symposium'
  const position = cert.position || (isWinner ? 'First Position' : 'Participant')
  const dateStr = cert.issueDate || cert.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const certId = cert.certificateId || 'AU-SIS-CERT-2026'

  // Generate QR Code data URL for verification
  const verifyUrl = `${window.location.origin}/verify/${certId}`
  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 256,
      color: { dark: template.primaryColor || '#1e3a8a', light: '#ffffff' }
    })
  } catch (err) {
    console.error('QR generation error:', err)
  }

  // --- Background Fill ---
  if (template.backgroundColor && template.backgroundColor !== '#ffffff') {
    const bgRgb = hexToRgb(template.backgroundColor, [254, 253, 250])
    doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2])
    doc.rect(5, 5, width - 10, height - 10, 'F')
  }

  // --- Borders ---
  // Outer decorative border
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
  doc.setLineWidth(3)
  doc.rect(10, 10, width - 20, height - 20)

  // Inner gold border
  doc.setDrawColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2])
  doc.setLineWidth(1)
  doc.rect(14, 14, width - 28, height - 28)

  // Corner ornaments
  const corners = [
    [15, 15], [width - 25, 15],
    [15, height - 25], [width - 25, height - 25]
  ]
  corners.forEach(([x, y]) => {
    doc.setFillColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2])
    doc.circle(x + 5, y + 5, 2.5, 'F')
  })

  // --- Header ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
  doc.text(collegeName.toUpperCase(), width / 2, 33, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Accredited by NAAC with Grade A+ | Approved by AICTE & UGC', width / 2, 40, { align: 'center' })
  doc.text('Surampalem, Kakinada District, Andhra Pradesh 533437', width / 2, 45, { align: 'center' })

  // Decorative divider
  doc.setDrawColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2])
  doc.setLineWidth(0.8)
  doc.line(60, 50, width - 60, 50)

  // --- Certificate Title ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2])
  doc.text(certTitle.toUpperCase(), width / 2, 63, { align: 'center' })

  // Subtitle
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  doc.text(subtitle, width / 2, 73, { align: 'center' })

  // Recipient Name
  doc.setFont('times', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2])
  doc.text(studentName, width / 2, 87, { align: 'center' })

  // Roll Number & Department
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
  const rollStr = cert.studentRollNumber || cert.rollNumber || ''
  const deptStr = cert.departmentName || cert.department || 'Department of Computer Science & Engineering'
  const idInfo = rollStr ? `Roll No: ${rollStr}   |   ${deptStr}` : deptStr
  doc.text(idInfo, width / 2, 95, { align: 'center' })

  // Citation Body
  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59)

  let body = ''
  if (template.bodyTemplate) {
    body = template.bodyTemplate
      .replace(/\{\{STUDENT_NAME\}\}/g, cert.studentName || 'Student')
      .replace(/\{\{EVENT_NAME\}\}/g, eventName)
      .replace(/\{\{POSITION\}\}/g, position)
      .replace(/\{\{EVENT_DATE\}\}/g, dateStr)
      .replace(/\{\{VENUE\}\}/g, cert.venue || 'Aditya University Campus')
      .replace(/\{\{DEPARTMENT\}\}/g, deptStr)
      .replace(/\{\{COLLEGE_NAME\}\}/g, collegeName)
      .replace(/\{\{CERTIFICATE_ID\}\}/g, certId)
      .replace(/\{\{ISSUE_DATE\}\}/g, dateStr)
  } else if (isWinner && cert.position) {
    body = `for securing ${position.toUpperCase()} in the event "${eventName}", organized by the ${deptStr}, conducted on ${dateStr}. Their exemplary dedication, technical acumen, and outstanding performance are highly commended.`
  } else {
    body = `for active and successful participation in "${eventName}", conducted on ${dateStr} at ${collegeName}.`
  }

  const splitBody = doc.splitTextToSize(body, width - 70)
  doc.text(splitBody, width / 2, 109, { align: 'center', lineHeightFactor: 1.5 })

  // --- Signatures Footer ---
  const signY = 163

  // Left Signature: Convener / HOD
  const sig1Name = template.signatoryName || cert.signatoryName || 'Dr. Priya Sharma'
  const sig1Title = template.signatoryTitle || cert.signatoryTitle || 'Faculty Convener & HOD'

  doc.setDrawColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2])
  doc.setLineWidth(0.6)
  doc.line(35, signY, 95, signY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2])
  doc.text(sig1Name, 65, signY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(sig1Title, 65, signY + 11, { align: 'center' })

  // Right Signature: Dean / Principal
  const sig2Name = template.signatory2Name || cert.signatory2Name || 'Dr. V. K. Ramanathan'
  const sig2Title = template.signatory2Title || cert.signatory2Title || 'Principal & Director'

  doc.setDrawColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2])
  doc.setLineWidth(0.6)
  doc.line(width - 95, signY, width - 35, signY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2])
  doc.text(sig2Name, width - 65, signY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(sig2Title, width - 65, signY + 11, { align: 'center' })

  // Center: Verification QR Code & ID
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', (width / 2) - 13, signY - 18, 26, 26)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2])
  doc.text(`CERTIFICATE ID: ${certId}`, width / 2, signY + 13, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(`Official Academic Credential • Issue Date: ${dateStr}`, width / 2, signY + 17, { align: 'center' })

  // Save the PDF
  const safeFilename = `Certificate_${certId}_${(cert.studentName || 'Student').replace(/\s+/g, '_')}.pdf`
  doc.save(safeFilename)
  return doc
}
