import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertInvoiceSchema, insertInvoiceItemSchema } from "@shared/schema";
import { z } from "zod";

const createInvoiceWithItemsSchema = z.object({
  invoice: insertInvoiceSchema,
  items: z.array(insertInvoiceItemSchema.omit({ invoiceId: true }))
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Customer routes
  app.get("/api/customers", async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/with-stats", async (_req, res) => {
    try {
      const customers = await storage.getCustomersWithStats();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers with stats" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (_req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoiceWithDetails(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const { invoice, items } = createInvoiceWithItemsSchema.parse(req.body);
      const createdInvoice = await storage.createInvoice(invoice, items);
      res.status(201).json(createdInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const success = await storage.deleteInvoice(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Generate PDF for invoice
  app.get("/api/invoices/:id/pdf", async (req, res) => {
    try {
      const invoice = await storage.getInvoiceWithDetails(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Simple PDF generation using HTML content
      const htmlContent = generateInvoiceHTML(invoice);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.number}.pdf"`);
      
      // For production, you would use a proper PDF library like puppeteer or jsPDF
      // For now, sending HTML content that browsers can convert to PDF
      res.send(htmlContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateInvoiceHTML(invoice: any): string {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>فاتورة ${invoice.number}</title>
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        .items-table th { background-color: #f5f5f5; }
        .totals { margin-top: 20px; text-align: left; }
        .total-row { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>فاتورة</h1>
        <h2>${invoice.number}</h2>
    </div>
    
    <div class="invoice-details">
        <p><strong>العميل:</strong> ${invoice.customer.name}</p>
        <p><strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleDateString('ar-SA')}</p>
        <p><strong>الحالة:</strong> ${invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'pending' ? 'معلقة' : 'متأخرة'}</p>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>المجموع</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.items.map((item: any) => `
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>₪${parseFloat(item.price).toFixed(2)}</td>
                    <td>₪${parseFloat(item.total).toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="total-row"><strong>المجموع الجزئي: ₪${parseFloat(invoice.subtotal).toFixed(2)}</strong></div>
        <div class="total-row"><strong>الضريبة: ₪${parseFloat(invoice.tax).toFixed(2)}</strong></div>
        <div class="total-row"><strong>الخصم: ₪${parseFloat(invoice.discount).toFixed(2)}</strong></div>
        <div class="total-row" style="font-size: 18px;"><strong>المجموع الإجمالي: ₪${parseFloat(invoice.total).toFixed(2)}</strong></div>
    </div>

    ${invoice.notes ? `<div style="margin-top: 30px;"><strong>ملاحظات:</strong><br>${invoice.notes}</div>` : ''}
</body>
</html>`;
}
