import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(22, 163, 74); // Brand Green
  doc.text('GigSphere', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('123 Freelance Blvd, Tech City, TC 90210', 14, 28);
  doc.text('contact@gigsphere.com', 14, 33);
  
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('INVOICE', 150, 20);
  
  doc.setFontSize(10);
  doc.text(`Invoice Number: INV-${order.id}`, 150, 28);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 33);
  
  // Client Info
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Billed To:', 14, 50);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(order.client, 14, 56);
  
  // Table
  const serviceFee = order.amount * 0.05;
  const total = order.amount + serviceFee;
  
  doc.autoTable({
    startY: 65,
    head: [['Description', 'Amount']],
    body: [
      [order.gig, `₹${order.amount.toFixed(2)}`],
      ['GigSphere Service Fee (5%)', `₹${serviceFee.toFixed(2)}`],
    ],
    foot: [['Total', `₹${total.toFixed(2)}`]],
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    styles: { font: 'helvetica' }
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your business!', 14, pageHeight - 20);
  
  // Download PDF
  doc.save(`Invoice_${order.id}.pdf`);
};
