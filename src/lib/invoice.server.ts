// Server function to generate PDF invoice
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// This is a placeholder - you'll need to install a PDF library like 'pdfkit' or use 'jspdf'
export const generateInvoicePDF = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    orderId: z.string(),
    customerName: z.string(),
    customerPhone: z.string(),
    address: z.string(),
    waterType: z.string(),
    size: z.number(),
    total: z.number(),
    orderDate: z.string(),
  }))
  .handler(async ({ data }) => {
    // Generate PDF invoice
    // This example uses basic JSON response - integrate with pdfkit or similar
    
    const invoiceHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #1e40af; }
            .invoice-details { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #1e40af; color: white; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">PAPPU BHAI TANKER WALE</div>
            <p>📞 9214775938 | Beawar, Rajasthan</p>
          </div>
          
          <div class="invoice-details">
            <h2>Invoice #${data.orderId}</h2>
            <p><strong>Date:</strong> ${data.orderDate}</p>
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <p><strong>Phone:</strong> ${data.customerPhone}</p>
            <p><strong>Address:</strong> ${data.address}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${data.waterType} Water - ${data.size}L</td>
                <td>1</td>
                <td>₹${data.total}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Amount: ₹${data.total.toLocaleString('en-IN')}
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>GST Invoice • Payment received via ${data.total > 0 ? 'Online/Cash' : 'Pending'}</p>
          </div>
        </body>
      </html>
    `;

    return {
      html: invoiceHTML,
      fileName: `invoice_${data.orderId}.pdf`,
    };
  });

// API endpoint for downloading invoice
export const invoiceHandler = async (req: Request, orderId: string) => {
  // Fetch order details from database
  // Generate PDF using pdfkit or similar
  // Return PDF file as response

  return new Response("PDF Invoice", {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice_${orderId}.pdf"`,
    },
  });
};
