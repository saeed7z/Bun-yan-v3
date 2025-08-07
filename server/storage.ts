import { type Customer, type InsertCustomer, type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem, type InvoiceWithCustomer, type CustomerWithStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getCustomersWithStats(): Promise<CustomerWithStats[]>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceWithDetails(id: string): Promise<InvoiceWithCustomer | undefined>;
  createInvoice(invoice: InsertInvoice, items: Omit<InsertInvoiceItem, 'invoiceId'>[]): Promise<InvoiceWithCustomer>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  getInvoicesByCustomer(customerId: string): Promise<Invoice[]>;

  // Invoice items operations
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: string): Promise<boolean>;

  // Statistics
  getDashboardStats(): Promise<{
    totalSales: string;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    activeCustomers: number;
  }>;
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private invoiceItems: Map<string, InvoiceItem> = new Map();

  constructor() {
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample customers
    const customer1 = await this.createCustomer({
      name: "شركة الأحلام للتجارة",
      email: "info@dreams-trading.com",
      phone: "+970-123-456-789",
      address: "رام الله، فلسطين"
    });

    const customer2 = await this.createCustomer({
      name: "مؤسسة النور التجارية",
      email: "contact@alnoor.com",
      phone: "+970-987-654-321",
      address: "نابلس، فلسطين"
    });

    const customer3 = await this.createCustomer({
      name: "شركة المستقبل للخدمات",
      email: "info@future-services.com",
      phone: "+970-555-123-456",
      address: "الخليل، فلسطين"
    });

    // Create sample invoices
    const invoice1 = await this.createInvoice({
      number: "INV-2024-001",
      customerId: customer1.id,
      date: new Date("2024-01-15"),
      dueDate: new Date("2024-02-15"),
      status: "paid",
      type: "monthly",
      subtotal: "2777.78",
      tax: "472.22",
      discount: "0",
      total: "3250.00",
      notes: "فاتورة خدمات استشارية"
    }, [
      {
        description: "استشارات تطوير الأعمال",
        quantity: "20",
        price: "138.89",
        total: "2777.78"
      }
    ]);

    const invoice2 = await this.createInvoice({
      number: "INV-2024-002",
      customerId: customer2.id,
      date: new Date("2024-01-14"),
      dueDate: new Date("2024-02-14"),
      status: "pending",
      type: "commercial",
      subtotal: "1602.56",
      tax: "272.44",
      discount: "0",
      total: "1875.00",
      notes: ""
    }, [
      {
        description: "خدمات تسويق رقمي",
        quantity: "15",
        price: "106.84",
        total: "1602.56"
      }
    ]);

    const invoice3 = await this.createInvoice({
      number: "INV-2024-003",
      customerId: customer3.id,
      date: new Date("2024-01-10"),
      dueDate: new Date("2024-01-25"),
      status: "overdue",
      type: "monthly",
      subtotal: "4632.48",
      tax: "787.52",
      discount: "0",
      total: "5420.00",
      notes: "خدمات تقنية متقدمة"
    }, [
      {
        description: "تطوير نظام إدارة",
        quantity: "25",
        price: "185.30",
        total: "4632.48"
      }
    ]);
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      name: insertCustomer.name,
      email: insertCustomer.email || null,
      phone: insertCustomer.phone || null,
      address: insertCustomer.address || null,
      id,
      balance: "0",
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;

    const updated: Customer = { ...existing, ...customerUpdate };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async getCustomersWithStats(): Promise<CustomerWithStats[]> {
    const customers = Array.from(this.customers.values());
    const result: CustomerWithStats[] = [];

    for (const customer of customers) {
      const invoices = Array.from(this.invoices.values()).filter(inv => inv.customerId === customer.id);
      const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

      result.push({
        ...customer,
        totalInvoices: invoices.length,
        totalAmount: totalAmount.toFixed(2),
        accountBalance: customer.balance
      });
    }

    return result.sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceWithDetails(id: string): Promise<InvoiceWithCustomer | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    const customer = this.customers.get(invoice.customerId);
    if (!customer) return undefined;

    const items = Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === id);

    return {
      ...invoice,
      customer,
      items
    };
  }

  async createInvoice(insertInvoice: InsertInvoice, items: Omit<InsertInvoiceItem, 'invoiceId'>[]): Promise<InvoiceWithCustomer> {
    const id = randomUUID();
    const invoice: Invoice = {
      number: insertInvoice.number,
      customerId: insertInvoice.customerId,
      date: insertInvoice.date,
      dueDate: insertInvoice.dueDate || null,
      status: insertInvoice.status || "pending",
      type: insertInvoice.type || "monthly",
      subtotal: insertInvoice.subtotal,
      tax: insertInvoice.tax || "0",
      discount: insertInvoice.discount || "0",
      total: insertInvoice.total,
      notes: insertInvoice.notes || null,
      id,
      createdAt: new Date(),
    };
    this.invoices.set(id, invoice);

    // Create invoice items
    const createdItems: InvoiceItem[] = [];
    for (const item of items) {
      const itemId = randomUUID();
      const invoiceItem: InvoiceItem = {
        ...item,
        id: itemId,
        invoiceId: id,
        documentNumber: item.documentNumber || null,
      };
      this.invoiceItems.set(itemId, invoiceItem);
      createdItems.push(invoiceItem);
    }

    // Update customer balance based on invoice type
    if (invoice.type === "monthly" || invoice.type === "commercial") {
      const customer = this.customers.get(invoice.customerId);
      if (customer) {
        const currentBalance = parseFloat(customer.balance);
        const invoiceAmount = parseFloat(invoice.total);
        const newBalance = currentBalance + invoiceAmount;
        
        const updatedCustomer: Customer = { 
          ...customer, 
          balance: newBalance.toFixed(2) 
        };
        this.customers.set(invoice.customerId, updatedCustomer);
      }
    } else if (invoice.type === "revenue") {
      const customer = this.customers.get(invoice.customerId);
      if (customer) {
        const currentBalance = parseFloat(customer.balance);
        const revenueAmount = parseFloat(invoice.total);
        const newBalance = Math.max(0, currentBalance - revenueAmount); // Don't go below zero
        
        const updatedCustomer: Customer = { 
          ...customer, 
          balance: newBalance.toFixed(2) 
        };
        this.customers.set(invoice.customerId, updatedCustomer);
      }
    }

    const customer = this.customers.get(invoice.customerId)!;
    return {
      ...invoice,
      customer,
      items: createdItems
    };
  }

  async updateInvoice(id: string, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existing = this.invoices.get(id);
    if (!existing) return undefined;

    const updated: Invoice = { ...existing, ...invoiceUpdate };
    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    // Delete associated items first
    const items = Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === id);
    items.forEach(item => this.invoiceItems.delete(item.id));
    
    return this.invoices.delete(id);
  }

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(inv => inv.customerId === customerId);
  }

  // Invoice items operations
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = randomUUID();
    const invoiceItem: InvoiceItem = { 
      ...item, 
      id,
      documentNumber: item.documentNumber || null 
    };
    this.invoiceItems.set(id, invoiceItem);
    return invoiceItem;
  }

  async updateInvoiceItem(id: string, itemUpdate: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const existing = this.invoiceItems.get(id);
    if (!existing) return undefined;

    const updated: InvoiceItem = { ...existing, ...itemUpdate };
    this.invoiceItems.set(id, updated);
    return updated;
  }

  async deleteInvoiceItem(id: string): Promise<boolean> {
    return this.invoiceItems.delete(id);
  }

  // Statistics
  async getDashboardStats(): Promise<{
    totalSales: string;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    activeCustomers: number;
  }> {
    const invoices = Array.from(this.invoices.values());
    
    const totalSales = invoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    const paidInvoices = invoices.filter(inv => inv.status === "paid").length;
    const pendingInvoices = invoices.filter(inv => inv.status === "pending").length;
    const overdueInvoices = invoices.filter(inv => inv.status === "overdue").length;
    const activeCustomers = this.customers.size;

    return {
      totalSales: totalSales.toFixed(2),
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      activeCustomers
    };
  }
}

export const storage = new MemStorage();
