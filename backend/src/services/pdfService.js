import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = async (invoice, outputFilePath = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });

      let stream;
      let finalPath = outputFilePath;

      if (!finalPath) {
        const invoicesDir = path.resolve(__dirname, '../../uploads/invoices');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }
        finalPath = path.join(invoicesDir, `Invoice-${invoice.invoiceNumber}.pdf`);
      }

      stream = fs.createWriteStream(finalPath);
      doc.pipe(stream);

      // --- Header / Brand ---
      doc.rect(0, 0, doc.page.width, 10).fill('#ff5121'); // Top Accent bar
      doc.moveDown(1.5);

      // Title & Number
      doc.font('Helvetica-Bold').fontSize(24).fillColor('#111116').text('CINECRAFT MEDIA', 45, 45);
      doc.font('Helvetica').fontSize(9).fillColor('#666677').text('Pioneering Cinematic Excellence & Visual Production', 45, 75);
      doc.text('742 Evergreen Studio Complex, Los Angeles, CA 90028', 45, 88);
      doc.text('billing@cinecraftmedia.com | +1 (555) 019-2834', 45, 101);

      // Invoice Meta Right-aligned
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#ff5121').text('INVOICE', 380, 45, { align: 'right' });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#22222b').text(`#${invoice.invoiceNumber}`, 380, 68, { align: 'right' });
      
      doc.font('Helvetica').fontSize(9).fillColor('#555566');
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 380, 85, { align: 'right' });
      doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 380, 98, { align: 'right' });
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 380, 111, { align: 'right' });

      // Horizontal separator line
      doc.moveTo(45, 135).lineTo(550, 135).strokeColor('#e2e4e9').lineWidth(1).stroke();

      // --- Client Bill To Box ---
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#ff5121').text('BILLED TO:', 45, 150);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111116').text(invoice.clientName, 45, 166);
      doc.font('Helvetica').fontSize(9).fillColor('#444455');
      if (invoice.clientCompany) {
        doc.text(invoice.clientCompany, 45, 182);
      }
      doc.text(invoice.clientEmail, 45, invoice.clientCompany ? 195 : 182);
      if (invoice.clientAddress) {
        doc.text(invoice.clientAddress, 45, invoice.clientCompany ? 208 : 195);
      }

      // --- Line Items Table Header ---
      const tableTop = 240;
      doc.rect(45, tableTop, 505, 24).fill('#17171e');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
      doc.text('ITEM DESCRIPTION', 55, tableTop + 7);
      doc.text('QTY', 330, tableTop + 7, { width: 40, align: 'right' });
      doc.text('UNIT PRICE', 380, tableTop + 7, { width: 70, align: 'right' });
      doc.text('TOTAL', 460, tableTop + 7, { width: 80, align: 'right' });

      let currentY = tableTop + 30;
      const curr = invoice.currency || 'USD';

      // Rows
      doc.font('Helvetica').fontSize(9).fillColor('#22222b');
      invoice.items.forEach((item, index) => {
        // alternating background row
        if (index % 2 === 1) {
          doc.rect(45, currentY - 5, 505, 22).fill('#f8f9fa');
        }

        doc.fillColor('#22222b').text(item.description, 55, currentY);
        doc.text(item.quantity.toString(), 330, currentY, { width: 40, align: 'right' });
        doc.text(`${curr} ${item.unitPrice.toFixed(2)}`, 380, currentY, { width: 70, align: 'right' });
        doc.text(`${curr} ${item.amount.toFixed(2)}`, 460, currentY, { width: 80, align: 'right' });

        currentY += 22;
      });

      // Bottom border of table
      doc.moveTo(45, currentY + 5).lineTo(550, currentY + 5).strokeColor('#e2e4e9').lineWidth(1).stroke();
      currentY += 15;

      // --- Totals Section (Right-aligned) ---
      const totalsLeft = 350;
      doc.font('Helvetica').fontSize(9).fillColor('#555566');
      
      doc.text('Subtotal:', totalsLeft, currentY);
      doc.font('Helvetica-Bold').text(`${curr} ${invoice.subtotal.toFixed(2)}`, 450, currentY, { width: 90, align: 'right' });
      currentY += 16;

      if (invoice.discountAmount > 0) {
        doc.font('Helvetica').text(`Discount (${invoice.discountPercentage}%):`, totalsLeft, currentY);
        doc.font('Helvetica-Bold').text(`-${curr} ${invoice.discountAmount.toFixed(2)}`, 450, currentY, { width: 90, align: 'right' });
        currentY += 16;
      }

      if (invoice.taxAmount > 0) {
        doc.font('Helvetica').text(`Tax / VAT (${invoice.taxPercentage}%):`, totalsLeft, currentY);
        doc.font('Helvetica-Bold').text(`+${curr} ${invoice.taxAmount.toFixed(2)}`, 450, currentY, { width: 90, align: 'right' });
        currentY += 16;
      }

      // Grand Total Box
      doc.rect(totalsLeft - 10, currentY, 210, 28).fill('#ff5121');
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff').text('TOTAL BALANCE DUE:', totalsLeft, currentY + 8);
      doc.fontSize(12).text(`${curr} ${invoice.totalAmount.toFixed(2)}`, 430, currentY + 8, { width: 110, align: 'right' });

      currentY += 45;

      // --- Notes & Terms ---
      if (invoice.notes) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#111116').text('Terms & Instructions:', 45, currentY);
        doc.font('Helvetica').fontSize(8.5).fillColor('#666677').text(invoice.notes, 45, currentY + 14, { width: 280 });
      }

      // --- Footer ---
      doc.fontSize(8).fillColor('#9999aa').text(
        'Thank you for your business. For billing inquiries, contact billing@cinecraftmedia.com',
        45,
        doc.page.height - 40,
        { align: 'center', width: 505 }
      );

      doc.end();

      stream.on('finish', () => resolve(finalPath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
