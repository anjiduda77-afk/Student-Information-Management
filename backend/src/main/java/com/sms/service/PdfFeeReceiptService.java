package com.sms.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.sms.entity.FeeRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class PdfFeeReceiptService {

    private static final Color GOLD = new Color(217, 155, 38);
    private static final Color NAVY = new Color(30, 58, 138);
    private static final Color DARK = new Color(15, 23, 42);
    private static final Color SLATE = new Color(71, 85, 105);
    private static final Color LIGHT_BG = new Color(254, 253, 250);
    private static final Color SUCCESS_GREEN = new Color(22, 163, 74);
    private static final Color BORDER_GRAY = new Color(226, 232, 240);

    @Value("${app.frontend-url:${APP_FRONTEND_URL:http://localhost:5173}}")
    private String appFrontendUrl;

    public byte[] generateFeeReceiptPdf(FeeRecord record) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            // Background & Border
            PdfContentByte cb = writer.getDirectContent();
            cb.setColorFill(LIGHT_BG);
            cb.rectangle(20, 20, 555, 802);
            cb.fill();

            cb.setColorStroke(GOLD);
            cb.setLineWidth(2.5f);
            cb.rectangle(25, 25, 545, 792);
            cb.stroke();

            cb.setColorStroke(NAVY);
            cb.setLineWidth(1.0f);
            cb.rectangle(30, 30, 535, 782);
            cb.stroke();

            // Document Content
            Font fontUniv = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, NAVY);
            Font fontSub = FontFactory.getFont(FontFactory.HELVETICA, 9, SLATE);
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, GOLD);
            Font fontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, DARK);
            Font fontRegular = FontFactory.getFont(FontFactory.HELVETICA, 10, DARK);
            Font fontSmall = FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE);

            // Header
            Paragraph pUniv = new Paragraph("ADITYA UNIVERSITY", fontUniv);
            pUniv.setAlignment(Element.ALIGN_CENTER);
            pUniv.setSpacingAfter(2);
            document.add(pUniv);

            Paragraph pAffil = new Paragraph("Accredited by NAAC with 'A++' Grade | Approved by AICTE & UGC\nSurampalem, Kakinada District, Andhra Pradesh 533437", fontSub);
            pAffil.setAlignment(Element.ALIGN_CENTER);
            pAffil.setSpacingAfter(10);
            document.add(pAffil);

            Paragraph pTitle = new Paragraph("OFFICIAL E-FEE PAYMENT RECEIPT", fontTitle);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            pTitle.setSpacingAfter(14);
            document.add(pTitle);

            // Verified Badge Table
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{1.5f, 1.0f});

            PdfPCell cellLeft = new PdfPCell();
            cellLeft.setBorder(Rectangle.NO_BORDER);
            cellLeft.addElement(new Paragraph("Receipt Number: " + (record.getReceiptNumber() != null ? record.getReceiptNumber() : "AU-FEE-PENDING"), fontBold));
            cellLeft.addElement(new Paragraph("Date: " + (record.getPaymentDate() != null ? record.getPaymentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))), fontRegular));
            cellLeft.addElement(new Paragraph("Payment Mode: " + (record.getPaymentMode() != null ? record.getPaymentMode() : "ONLINE"), fontRegular));
            cellLeft.addElement(new Paragraph("Transaction Ref: " + (record.getTransactionReference() != null ? record.getTransactionReference() : "—"), fontRegular));

            PdfPCell cellRight = new PdfPCell();
            cellRight.setBorder(Rectangle.NO_BORDER);
            cellRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph badge = new Paragraph("✓ PAYMENT VERIFIED", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, SUCCESS_GREEN));
            badge.setAlignment(Element.ALIGN_RIGHT);
            cellRight.addElement(badge);

            metaTable.addCell(cellLeft);
            metaTable.addCell(cellRight);
            metaTable.setSpacingAfter(14);
            document.add(metaTable);

            // Student Information
            PdfPTable studentTable = new PdfPTable(2);
            studentTable.setWidthPercentage(100);
            studentTable.setWidths(new float[]{1.0f, 1.0f});
            studentTable.setSpacingAfter(14);

            String studentName = record.getStudent() != null ? record.getStudent().getName() : "Student";
            String rollNo = record.getStudent() != null && record.getStudent().getRollNumber() != null ? record.getStudent().getRollNumber() : "—";
            String dept = record.getStudent() != null && record.getStudent().getDepartment() != null ? record.getStudent().getDepartment() : "General";
            Integer sem = record.getStudent() != null ? record.getStudent().getSemester() : 1;

            PdfPCell sCell1 = new PdfPCell();
            sCell1.setBackgroundColor(new Color(248, 250, 252));
            sCell1.setPadding(8);
            sCell1.setBorderColor(BORDER_GRAY);
            sCell1.addElement(new Paragraph("Student Name: " + studentName, fontBold));
            sCell1.addElement(new Paragraph("Roll Number: " + rollNo, fontRegular));

            PdfPCell sCell2 = new PdfPCell();
            sCell2.setBackgroundColor(new Color(248, 250, 252));
            sCell2.setPadding(8);
            sCell2.setBorderColor(BORDER_GRAY);
            sCell2.addElement(new Paragraph("Department: " + dept, fontBold));
            sCell2.addElement(new Paragraph("Semester: Semester " + (sem != null ? sem : 1), fontRegular));

            studentTable.addCell(sCell1);
            studentTable.addCell(sCell2);
            document.add(studentTable);

            // Fee Breakdown Table
            PdfPTable feeTable = new PdfPTable(4);
            feeTable.setWidthPercentage(100);
            feeTable.setWidths(new float[]{2.5f, 1.0f, 1.0f, 1.2f});
            feeTable.setSpacingAfter(16);

            // Header row
            String[] headers = {"Fee Particulars / Category", "Assessed (₹)", "Concession (₹)", "Amount Paid (₹)"};
            for (String h : headers) {
                PdfPCell th = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                th.setBackgroundColor(NAVY);
                th.setPadding(6);
                th.setHorizontalAlignment(Element.ALIGN_CENTER);
                feeTable.addCell(th);
            }

            // Particulars row
            String feeName = record.getFeeStructure() != null ? record.getFeeStructure().getName() : "Institutional Fee";
            BigDecimal due = record.getAmountDue() != null ? record.getAmountDue() : BigDecimal.ZERO;
            BigDecimal conc = record.getConcession() != null ? record.getConcession() : BigDecimal.ZERO;
            BigDecimal paid = record.getAmountPaid() != null ? record.getAmountPaid() : BigDecimal.ZERO;

            PdfPCell tdDesc = new PdfPCell(new Phrase(feeName, fontRegular));
            tdDesc.setPadding(6);
            tdDesc.setBorderColor(BORDER_GRAY);
            feeTable.addCell(tdDesc);

            PdfPCell tdDue = new PdfPCell(new Phrase("₹" + due.toPlainString(), fontRegular));
            tdDue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            tdDue.setPadding(6);
            tdDue.setBorderColor(BORDER_GRAY);
            feeTable.addCell(tdDue);

            PdfPCell tdConc = new PdfPCell(new Phrase("₹" + conc.toPlainString(), fontRegular));
            tdConc.setHorizontalAlignment(Element.ALIGN_RIGHT);
            tdConc.setPadding(6);
            tdConc.setBorderColor(BORDER_GRAY);
            feeTable.addCell(tdConc);

            PdfPCell tdPaid = new PdfPCell(new Phrase("₹" + paid.toPlainString(), fontBold));
            tdPaid.setHorizontalAlignment(Element.ALIGN_RIGHT);
            tdPaid.setPadding(6);
            tdPaid.setBorderColor(BORDER_GRAY);
            feeTable.addCell(tdPaid);

            // Total row
            PdfPCell tdTotalLabel = new PdfPCell(new Phrase("TOTAL AMOUNT RECEIVED", fontBold));
            tdTotalLabel.setColspan(3);
            tdTotalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            tdTotalLabel.setPadding(7);
            tdTotalLabel.setBackgroundColor(new Color(241, 245, 249));
            tdTotalLabel.setBorderColor(BORDER_GRAY);
            feeTable.addCell(tdTotalLabel);

            PdfPCell tdTotalVal = new PdfPCell(new Phrase("₹" + paid.toPlainString(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, SUCCESS_GREEN)));
            tdTotalVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            tdTotalVal.setPadding(7);
            tdTotalVal.setBackgroundColor(new Color(241, 245, 249));
            tdTotalVal.setBorderColor(BORDER_GRAY);
            feeTable.addCell(tdTotalVal);

            document.add(feeTable);

            // Remarks & Verification Notice
            Paragraph pRemarks = new Paragraph("Remarks: " + (record.getRemarks() != null ? record.getRemarks() : "Payment successfully recorded."), fontSmall);
            pRemarks.setSpacingAfter(8);
            document.add(pRemarks);

            String verifyUrl = appFrontendUrl.replaceAll("/+$", "") + "/verify/fee-receipt/" + (record.getReceiptNumber() != null ? record.getReceiptNumber() : "");
            Paragraph pVerify = new Paragraph("Online Verification URL: " + verifyUrl + "\nThis is a digitally generated fee receipt. No physical signature is required.", fontSmall);
            pVerify.setSpacingAfter(20);
            document.add(pVerify);

            // Signatures
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setWidths(new float[]{1.0f, 1.0f});

            PdfPCell sLeft = new PdfPCell(new Phrase("Depositor / Student", fontSmall));
            sLeft.setBorder(Rectangle.NO_BORDER);

            PdfPCell sRight = new PdfPCell(new Phrase("Finance Officer / Accounts Directorate\nAditya University", fontBold));
            sRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
            sRight.setBorder(Rectangle.NO_BORDER);

            signTable.addCell(sLeft);
            signTable.addCell(sRight);
            document.add(signTable);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF receipt:", e);
            throw new RuntimeException("Could not generate fee receipt PDF", e);
        }
    }
}
