package com.sms.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.sms.entity.Certificate;
import com.sms.entity.CertificateTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class PdfCertificateService {

    // Palette
    private static final Color GOLD = new Color(217, 155, 38);
    private static final Color DARK_GOLD = new Color(179, 124, 21);
    private static final Color NAVY = new Color(30, 58, 138);
    private static final Color DARK_BLUE = new Color(15, 23, 42);
    private static final Color SLATE_GRAY = new Color(71, 85, 105);
    private static final Color LIGHT_BG = new Color(254, 253, 250);

    public byte[] generateCertificatePdf(Certificate cert, CertificateTemplate template) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // A4 Landscape: 842 x 595 pt
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            PdfContentByte cb = writer.getDirectContent();

            // 1. Background fill
            cb.setColorFill(LIGHT_BG);
            cb.rectangle(10, 10, 822, 575);
            cb.fill();

            // 2. Ornate Double Border
            // Outer Gold Border
            cb.setColorStroke(GOLD);
            cb.setLineWidth(4.0f);
            cb.rectangle(24, 24, 794, 547);
            cb.stroke();

            // Inner Navy Border
            cb.setColorStroke(NAVY);
            cb.setLineWidth(1.5f);
            cb.rectangle(32, 32, 778, 531);
            cb.stroke();

            // Corner embellishments
            drawCornerAccents(cb, 32, 32, 778, 531);

            // Watermark / Seal in background
            drawEmblemSeal(cb, 421, 280);

            // 3. Document Content Table
            PdfPTable mainTable = new PdfPTable(1);
            mainTable.setWidthPercentage(90);
            mainTable.setSpacingBefore(18);

            // Header - Aditya University
            String universityName = (cert.getCollegeName() != null && !cert.getCollegeName().isBlank())
                    ? cert.getCollegeName().toUpperCase()
                    : "ADITYA UNIVERSITY";

            Font univFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, NAVY);
            Paragraph univPara = new Paragraph(universityName, univFont);
            univPara.setAlignment(Element.ALIGN_CENTER);
            PdfPCell univCell = new PdfPCell(univPara);
            univCell.setBorder(Rectangle.NO_BORDER);
            univCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            univCell.setPaddingBottom(2);
            mainTable.addCell(univCell);

            // Subheader
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA, 10, SLATE_GRAY);
            Paragraph subPara = new Paragraph("Approved by AICTE • Accredited by NAAC • Surampalem, Andhra Pradesh, India", subHeaderFont);
            subPara.setAlignment(Element.ALIGN_CENTER);
            PdfPCell subCell = new PdfPCell(subPara);
            subCell.setBorder(Rectangle.NO_BORDER);
            subCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            subCell.setPaddingBottom(12);
            mainTable.addCell(subCell);

            // Dividing decorative line
            PdfPCell dividerCell = new PdfPCell();
            dividerCell.setBorder(Rectangle.NO_BORDER);
            dividerCell.setPaddingBottom(10);
            mainTable.addCell(dividerCell);

            // Certificate Title
            String certTitle = (template != null && template.getTitle() != null)
                    ? template.getTitle()
                    : "CERTIFICATE OF " + (cert.getCertificateType() != null ? cert.getCertificateType().toUpperCase() : "EXCELLENCE");

            Font titleFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 24, GOLD);
            Paragraph titlePara = new Paragraph(certTitle, titleFont);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            PdfPCell titleCell = new PdfPCell(titlePara);
            titleCell.setBorder(Rectangle.NO_BORDER);
            titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            titleCell.setPaddingBottom(8);
            mainTable.addCell(titleCell);

            // Presentation line
            Font presentFont = FontFactory.getFont(FontFactory.HELVETICA, 11, SLATE_GRAY);
            Paragraph presentPara = new Paragraph("THIS IS PROUDLY PRESENTED TO", presentFont);
            presentPara.setAlignment(Element.ALIGN_CENTER);
            PdfPCell presentCell = new PdfPCell(presentPara);
            presentCell.setBorder(Rectangle.NO_BORDER);
            presentCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            presentCell.setPaddingBottom(10);
            mainTable.addCell(presentCell);

            // Student Name (Prominent & Styled)
            String studentName = cert.getStudentName() != null ? cert.getStudentName() : "Student";
            Font nameFont = FontFactory.getFont(FontFactory.TIMES_BOLDITALIC, 28, DARK_BLUE);
            Paragraph namePara = new Paragraph(studentName, nameFont);
            namePara.setAlignment(Element.ALIGN_CENTER);
            PdfPCell nameCell = new PdfPCell(namePara);
            nameCell.setBorder(Rectangle.NO_BORDER);
            nameCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            nameCell.setPaddingBottom(6);
            mainTable.addCell(nameCell);

            // Student Metadata (Roll No & Department)
            String rollNum = (cert.getStudent() != null && cert.getStudent().getRollNumber() != null) ? cert.getStudent().getRollNumber() : "";
            String dept = cert.getDepartmentName() != null ? cert.getDepartmentName() : "Engineering";
            String studentMeta = (!rollNum.isBlank() ? "Roll No: " + rollNum + "   |   " : "") + "Department: " + dept;

            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, NAVY);
            Paragraph metaPara = new Paragraph(studentMeta, metaFont);
            metaPara.setAlignment(Element.ALIGN_CENTER);
            PdfPCell metaCell = new PdfPCell(metaPara);
            metaCell.setBorder(Rectangle.NO_BORDER);
            metaCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            metaCell.setPaddingBottom(12);
            mainTable.addCell(metaCell);

            // Body Citation / Description Text
            String position = cert.getPosition() != null ? cert.getPosition() : "Participant";
            String eventName = cert.getEventName() != null ? cert.getEventName() : "University Event";
            String eventDateStr = cert.getEvent() != null && cert.getEvent().getEventDate() != null
                    ? cert.getEvent().getEventDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"))
                    : (cert.getIssueDate() != null ? cert.getIssueDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")) : "2026");
            String venue = cert.getEvent() != null && cert.getEvent().getVenue() != null ? cert.getEvent().getVenue() : "Aditya University Campus";

            String bodyText;
            if (template != null && template.getBodyTemplate() != null && !template.getBodyTemplate().isBlank()) {
                bodyText = template.getBodyTemplate()
                        .replace("{{STUDENT_NAME}}", studentName)
                        .replace("{{STUDENT_ID}}", rollNum)
                        .replace("{{EVENT_NAME}}", eventName)
                        .replace("{{POSITION}}", position)
                        .replace("{{EVENT_DATE}}", eventDateStr)
                        .replace("{{VENUE}}", venue)
                        .replace("{{DEPARTMENT}}", dept)
                        .replace("{{COLLEGE_NAME}}", universityName)
                        .replace("{{CERTIFICATE_ID}}", cert.getCertificateId())
                        .replace("{{ISSUE_DATE}}", cert.getIssueDate() != null ? cert.getIssueDate().toString() : "");
            } else {
                bodyText = String.format("for outstanding achievement and securing %s in the event \"%s\" organized by the Department of %s, conducted on %s at %s.",
                        position.toUpperCase(), eventName, dept, eventDateStr, venue);
            }

            Font bodyFont = FontFactory.getFont(FontFactory.TIMES_ROMAN, 12, DARK_BLUE);
            Paragraph bodyPara = new Paragraph(bodyText, bodyFont);
            bodyPara.setAlignment(Element.ALIGN_CENTER);
            bodyPara.setLeading(18);
            PdfPCell bodyCell = new PdfPCell(bodyPara);
            bodyCell.setBorder(Rectangle.NO_BORDER);
            bodyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            bodyCell.setPaddingLeft(30);
            bodyCell.setPaddingRight(30);
            bodyCell.setPaddingBottom(24);
            mainTable.addCell(bodyCell);

            document.add(mainTable);

            // 4. Signatures & Certificate Identification Footer Table
            PdfPTable footerTable = new PdfPTable(3);
            footerTable.setWidthPercentage(88);
            footerTable.setWidths(new float[]{30f, 40f, 30f});

            // Left: Signatory 1
            String sig1Name = template != null && template.getSignatoryName() != null ? template.getSignatoryName() : "Dr. Priya Sharma";
            String sig1Title = template != null && template.getSignatoryTitle() != null ? template.getSignatoryTitle() : "Faculty Convener & HOD";

            Paragraph sig1Para = new Paragraph();
            sig1Para.add(new Chunk("___________________________\n", FontFactory.getFont(FontFactory.HELVETICA, 10, GOLD)));
            sig1Para.add(new Chunk(sig1Name + "\n", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, DARK_BLUE)));
            sig1Para.add(new Chunk(sig1Title, FontFactory.getFont(FontFactory.HELVETICA, 9, SLATE_GRAY)));
            sig1Para.setAlignment(Element.ALIGN_CENTER);
            PdfPCell sig1Cell = new PdfPCell(sig1Para);
            sig1Cell.setBorder(Rectangle.NO_BORDER);
            sig1Cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            footerTable.addCell(sig1Cell);

            // Center: Certificate ID & Seal
            String issueDateStr = cert.getIssueDate() != null
                    ? cert.getIssueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : "";
            Paragraph centerPara = new Paragraph();
            centerPara.add(new Chunk("CERTIFICATE ID\n", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, SLATE_GRAY)));
            centerPara.add(new Chunk(cert.getCertificateId() + "\n", FontFactory.getFont(FontFactory.COURIER_BOLD, 11, NAVY)));
            centerPara.add(new Chunk("Issued: " + issueDateStr + "  •  Status: " + cert.getStatus() + "\n", FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_GRAY)));
            centerPara.add(new Chunk("Official Academic Accreditation", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, DARK_GOLD)));
            centerPara.setAlignment(Element.ALIGN_CENTER);
            PdfPCell centerCell = new PdfPCell(centerPara);
            centerCell.setBorder(Rectangle.NO_BORDER);
            centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            footerTable.addCell(centerCell);

            // Right: Signatory 2
            String sig2Name = template != null && template.getSignatory2Name() != null ? template.getSignatory2Name() : "Dr. N. Satish Reddy";
            String sig2Title = template != null && template.getSignatory2Title() != null ? template.getSignatory2Title() : "Vice Chancellor / Dean";

            Paragraph sig2Para = new Paragraph();
            sig2Para.add(new Chunk("___________________________\n", FontFactory.getFont(FontFactory.HELVETICA, 10, GOLD)));
            sig2Para.add(new Chunk(sig2Name + "\n", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, DARK_BLUE)));
            sig2Para.add(new Chunk(sig2Title, FontFactory.getFont(FontFactory.HELVETICA, 9, SLATE_GRAY)));
            sig2Para.setAlignment(Element.ALIGN_CENTER);
            PdfPCell sig2Cell = new PdfPCell(sig2Para);
            sig2Cell.setBorder(Rectangle.NO_BORDER);
            sig2Cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            footerTable.addCell(sig2Cell);

            document.add(footerTable);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate certificate PDF for cert ID: {}", cert.getCertificateId(), e);
            throw new RuntimeException("Could not generate certificate PDF: " + e.getMessage(), e);
        }
    }

    private void drawCornerAccents(PdfContentByte cb, float x, float y, float width, float height) {
        cb.setColorStroke(GOLD);
        cb.setLineWidth(2.0f);

        float cornerSize = 16f;

        // Bottom Left
        cb.moveTo(x, y + cornerSize);
        cb.lineTo(x, y);
        cb.lineTo(x + cornerSize, y);
        cb.stroke();

        // Top Left
        cb.moveTo(x, y + height - cornerSize);
        cb.lineTo(x, y + height);
        cb.lineTo(x + cornerSize, y + height);
        cb.stroke();

        // Bottom Right
        cb.moveTo(x + width - cornerSize, y);
        cb.lineTo(x + width, y);
        cb.lineTo(x + width, y + cornerSize);
        cb.stroke();

        // Top Right
        cb.moveTo(x + width - cornerSize, y + height);
        cb.lineTo(x + width, y + height);
        cb.lineTo(x + width, y + height - cornerSize);
        cb.stroke();
    }

    private void drawEmblemSeal(PdfContentByte cb, float centerX, float centerY) {
        cb.saveState();
        cb.setColorStroke(new Color(217, 155, 38, 28)); // Very subtle gold watermark
        cb.setLineWidth(1.5f);
        cb.circle(centerX, centerY, 80);
        cb.stroke();

        cb.setColorStroke(new Color(30, 58, 138, 20));
        cb.setLineWidth(1f);
        cb.circle(centerX, centerY, 72);
        cb.stroke();
        cb.restoreState();
    }
}
