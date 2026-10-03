import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

/**
 * Generates and downloads an official University Certificate PDF.
 * @param {Object} cert - Certificate data object
 */
export async function downloadCertificatePDF(cert) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4' // 297mm x 210mm
  })

  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  // Generate QR Code data URL for verification
  const verifyUrl = `${window.location.origin}/verify/${cert.certificateId}`
  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 256,
      color: { dark: '#1e3a8a', light: '#ffffff' }
    })
  } catch (err) {
    console.error('QR generation error:', err)
  }

  // --- Background Border ---
  // Outer decorative border
  doc.setDrawColor(30, 58, 138) // Deep Navy (#1e3a8a)
  doc.setLineWidth(3)
  doc.rect(10, 10, width - 20, height - 20)

  // Inner gold border
  doc.setDrawColor(217, 119, 6) // Gold (#d97706)
  doc.setLineWidth(1)
  doc.rect(14, 14, width - 28, height - 28)

  // Subtle corner ornaments
  const corners = [
    [15, 15], [width - 25, 15],
    [15, height - 25], [width - 25, height - 25]
  ]
  corners.forEach(([x, y]) => {
    doc.setFillColor(217, 119, 6)
    doc.circle(x + 5, y + 5, 2.5, 'F')
  })

  // --- Header ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(30, 58, 138)
  doc.text('ADITYA UNIVERSITY', width / 2, 34, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('Accredited by NAAC with Grade A+ | Approved by AICTE & UGC', width / 2, 41, { align: 'center' })
  doc.text('Aditya Nagar, ADB Road, Surampalem, Andhra Pradesh 533437', width / 2, 46, { align: 'center' })

  // Decorative divider
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(0.8)
  doc.line(60, 51, width - 60, 51)

  // --- Certificate Title ---
  const isWinner = cert.certificateType === 'WINNER' || cert.certificateType === 'EXCELLENCE'
  const certTitle = isWinner ? 'CERTIFICATE OF EXCELLENCE' : 'CERTIFICATE OF PARTICIPATION'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(isWinner ? 180 : 37, isWinner ? 83 : 99, isWinner ? 9 : 235) // Gold or Indigo
  doc.text(certTitle, width / 2, 64, { align: 'center' })

  // Subtitle
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  doc.text('This is proudly presented to', width / 2, 74, { align: 'center' })

  // Recipient Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(15, 23, 42)
  doc.text((cert.studentName || 'STUDENT NAME').toUpperCase(), width / 2, 88, { align: 'center' })

  // Roll Number & Department
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  const idInfo = cert.studentRollNumber
    ? `Roll No: ${cert.studentRollNumber} | Department of Computer Science & Engineering`
    : 'Aditya University'
  doc.text(idInfo, width / 2, 96, { align: 'center' })

  // Citation Body
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11.5)
  doc.setTextColor(30, 41, 59)

  let body = ''
  if (isWinner && cert.position) {
    body = `for securing ${cert.position.toUpperCase()} POSITION in ${cert.eventName || 'the collegiate festival'}, organized on ${cert.issueDate || '2026'}. Their exemplary dedication, technical acumen, and outstanding performance are highly commended.`
  } else {
    body = `for active and successful participation in ${cert.eventName || 'the university event'}, held on ${cert.issueDate || '2026'} at Aditya University.`
  }

  const splitBody = doc.splitTextToSize(body, width - 80)
  doc.text(splitBody, width / 2, 112, { align: 'center', lineHeightFactor: 1.5 })

  // --- Footer / Signatures ---
  const signY = 162

  // Dean signature line
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.5)
  doc.line(40, signY, 100, signY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('Dr. Priya Sharma', 70, signY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Dean of Academic Affairs', 70, signY + 11, { align: 'center' })

  // Principal signature line
  doc.line(width - 100, signY, width - 40, signY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('Dr. V. K. Ramanathan', width - 70, signY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Principal & Director', width - 70, signY + 11, { align: 'center' })

  // --- Center: Verification QR Code & ID ---
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', (width / 2) - 15, signY - 18, 30, 30)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(30, 58, 138)
  doc.text(`CERTIFICATE ID: ${cert.certificateId}`, width / 2, signY + 18, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Scan QR code or visit university portal to verify authenticity', width / 2, signY + 22, { align: 'center' })

  // Save the PDF
  const safeFilename = `${cert.certificateId || 'Certificate'}_${(cert.studentName || 'Student').replace(/\s+/g, '_')}.pdf`
  doc.save(safeFilename)
}
