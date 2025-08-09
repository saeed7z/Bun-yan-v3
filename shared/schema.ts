import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  meterNumber: text("meter_number"), // رقم العداد التجاري للعميل
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull().unique(),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  type: text("type").notNull().default("monthly"), // monthly, commercial, statement, revenue, expense
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  documentNumber: text("document_number"), // Optional document number field
  // Commercial meter fields
  meterNumber: text("meter_number"), // رقم العداد
  previousReading: decimal("previous_reading", { precision: 10, scale: 2 }), // القراءة السابقة
  currentReading: decimal("current_reading", { precision: 10, scale: 2 }), // القراءة الحالية
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }), // قيمة الوحدة
  // Regular fields - price can be null for commercial invoices (auto-calculated)
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

// Extended types for API responses
export type InvoiceWithCustomer = Invoice & {
  customer: Customer;
  items: InvoiceItem[];
};

export type CustomerWithStats = Customer & {
  totalInvoices: number;
  totalAmount: string;
  accountBalance: string;
};
