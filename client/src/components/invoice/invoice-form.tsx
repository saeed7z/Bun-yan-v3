import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Printer } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertInvoiceSchema, insertInvoiceItemSchema } from "@shared/schema";

const createInvoiceFormSchema = (invoiceType?: string) => z.object({
  customerId: z.string().min(1, "يجب اختيار العميل"),
  date: z.string().min(1, "يجب تحديد التاريخ"),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "يجب إدخال وصف الخدمة"),
    documentNumber: z.string().optional(),
    // Commercial meter fields
    meterNumber: invoiceType === "commercial" ? z.string().min(1, "يجب إدخال رقم العداد") : z.string().optional(),
    previousReading: invoiceType === "commercial" ? z.string().min(1, "يجب إدخال القراءة السابقة") : z.string().optional(),
    currentReading: invoiceType === "commercial" ? z.string().min(1, "يجب إدخال القراءة الحالية") : z.string().optional(),
    unitPrice: invoiceType === "commercial" ? z.string().min(1, "يجب إدخال قيمة الوحدة") : z.string().optional(),
    // Regular price field - optional for commercial invoices (auto-calculated)
    price: z.string().optional(),
  })).min(1, "يجب إضافة عنصر واحد على الأقل"),
  discount: z.string().optional(),
});

const invoiceFormSchema = createInvoiceFormSchema();
type FormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: any;
  invoiceType?: string;
  onSuccess: () => void;
}

export default function InvoiceForm({ invoice, invoiceType = "monthly", onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(createInvoiceFormSchema(invoiceType)),
    defaultValues: {
      customerId: invoice?.customerId || "",
      date: invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: invoice?.notes || "",
      discount: invoice?.discount || "0",
      items: invoice?.items ? invoice.items.map((item: any) => ({
        description: item.description,
        documentNumber: item.documentNumber || "",
        meterNumber: item.meterNumber || "",
        previousReading: item.previousReading || "",
        currentReading: item.currentReading || "",
        unitPrice: item.unitPrice || "",
        price: item.price || "0",
      })) : [{ description: invoiceType === "payment" ? "سداد فاتورة" : "", documentNumber: "", meterNumber: "", previousReading: "", currentReading: "", unitPrice: "", price: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount") || "0";
  const watchedCustomerId = form.watch("customerId");

  // Auto-fill commercial meter data when customer is selected
  useEffect(() => {
    if (watchedCustomerId && invoiceType === "commercial" && !invoice) {
      // Only auto-fill for new commercial invoices
      const fetchLastReading = async () => {
        try {
          const response = await fetch(`/api/customers/${watchedCustomerId}/last-reading`);
          if (response.ok) {
            const data = await response.json();
            
            // Auto-fill the first item with commercial meter data
            const currentItems = form.getValues("items");
            if (currentItems.length > 0) {
              form.setValue("items.0.description", "فاتورة العداد التجاري 10 ايام");
              form.setValue("items.0.meterNumber", data.meterNumber || "");
              form.setValue("items.0.previousReading", data.previousReading || "");
              // Leave current reading and unit price empty for user input
            }
          }
        } catch (error) {
          console.error("Error fetching last reading:", error);
        }
      };

      fetchLastReading();
    }
  }, [watchedCustomerId, invoiceType, invoice, form]);

  // Generate unique invoice number
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}-${randomNum}`;
  };

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إنشاء الفاتورة بنجاح",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في إنشاء الفاتورة",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/invoices/${invoice.id}`, data.invoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث الفاتورة بنجاح",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في تحديث الفاتورة",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  useEffect(() => {
    let newSubtotal = 0;
    
    watchedItems?.forEach((item: any, index: number) => {
      // For commercial meter items, calculate based on meter readings
      if (invoiceType === "commercial") {
        const previousReading = parseFloat(item.previousReading) || 0;
        const currentReading = parseFloat(item.currentReading) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        
        // Calculate if all required fields have values
        if (previousReading >= 0 && currentReading > 0 && unitPrice > 0 && currentReading >= previousReading) {
          const consumption = currentReading - previousReading;
          const calculatedTotal = consumption * unitPrice;
          
          // Update the price field with calculated total
          const currentPrice = parseFloat(item.price) || 0;
          if (Math.abs(currentPrice - calculatedTotal) > 0.01) {
            // Use setTimeout to avoid infinite loop
            setTimeout(() => {
              form.setValue(`items.${index}.price`, calculatedTotal.toFixed(2), { shouldValidate: false });
            }, 0);
          }
          newSubtotal += calculatedTotal;
        } else {
          // Use manual price if calculation is not possible
          const price = parseFloat(item.price) || 0;
          newSubtotal += price;
        }
      } else {
        // Regular calculation for non-meter items
        const price = parseFloat(item.price) || 0;
        newSubtotal += price;
      }
    });

    const discount = parseFloat(watchedDiscount) || 0;
    const discountAmount = (newSubtotal * discount) / 100;
    const subtotalAfterDiscount = newSubtotal - discountAmount;
    const newTotal = subtotalAfterDiscount;

    setSubtotal(newSubtotal);
    setTax(0);
    setTotal(newTotal);
  }, [watchedItems, watchedDiscount, invoiceType, form]);

  const onSubmit = (data: FormData) => {
    const invoiceData = {
      number: invoice?.number || generateInvoiceNumber(),
      customerId: data.customerId,
      date: new Date(data.date),
      dueDate: null,
      status: invoice?.status || (invoiceType === "payment" ? "paid" : "pending"),
      type: invoiceType || "monthly",
      subtotal: subtotal.toFixed(2),
      tax: "0", // Always 0 now
      discount: invoiceType === "payment" ? "0" : ((subtotal * (parseFloat(data.discount || "0") / 100))).toFixed(2),
      total: total.toFixed(2),
      notes: data.notes || "",
    };

    const items = data.items.map((item: any) => ({
      description: item.description,
      documentNumber: item.documentNumber || null,
      meterNumber: item.meterNumber || null,
      previousReading: item.previousReading || null,
      currentReading: item.currentReading || null,
      unitPrice: item.unitPrice || null,
      price: item.price || "0",
      total: parseFloat(item.price || "0").toFixed(2),
    }));

    if (invoice) {
      updateInvoiceMutation.mutate({ invoice: invoiceData, items });
    } else {
      createInvoiceMutation.mutate({ invoice: invoiceData, items, isPayment: invoiceType === "payment" });
    }
  };

  const handlePrintPreview = () => {
    const customerName = customers && Array.isArray(customers) ? customers.find((c: any) => c.id === form.watch("customerId"))?.name || "غير محدد" : "غير محدد";
    const invoiceData = {
      number: invoice?.number || generateInvoiceNumber(),
      date: form.watch("date"),
      customer: { name: customerName },
      items: form.watch("items").map((item: any, index: number) => ({
        description: item.description || `عنصر ${index + 1}`,
        documentNumber: item.documentNumber || "",
        meterNumber: item.meterNumber || "",
        previousReading: item.previousReading || "",
        currentReading: item.currentReading || "",
        unitPrice: item.unitPrice || "",
        price: item.price || "0",
        total: (parseFloat(item.price) || 0).toFixed(2)
      })),
      subtotal: subtotal.toFixed(2),
      tax: "0", // Always 0
      discount: ((subtotal * (parseFloat(form.watch("discount") || "0") / 100))).toFixed(2),
      total: total.toFixed(2),
      notes: form.watch("notes") || ""
    };

    const htmlContent = generatePreviewHTML(invoiceData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const generatePreviewHTML = (invoiceData: any) => {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>معاينة الفاتورة ${invoiceData.number}</title>
    <style>
        @page { size: A5; margin: 15mm; }
        body { font-family: Arial, sans-serif; direction: rtl; margin: 0; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .invoice-details { margin: 15px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 6px; text-align: center; font-size: 11px; }
        .items-table th { background-color: #f5f5f5; }
        .totals { margin-top: 15px; text-align: left; }
        .total-row { margin: 3px 0; }
        .print-button { position: fixed; top: 10px; left: 10px; z-index: 1000; }
        @media print { .print-button { display: none; } }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">طباعة سريعة</button>
    <div class="header">
        <h1>فاتورة</h1>
        <h2>${invoiceData.number}</h2>
    </div>
    
    <div class="invoice-details">
        <p><strong>العميل:</strong> ${invoiceData.customer.name}</p>
        <p><strong>التاريخ:</strong> ${new Date(invoiceData.date).toLocaleDateString('ar-SA')}</p>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                ${invoiceType === "commercial" ? `
                    <th>الوصف</th>
                    <th>رقم العداد</th>
                    <th>القراءة السابقة</th>
                    <th>القراءة الحالية</th>
                    <th>قيمة الوحدة</th>
                    <th>الإجمالي</th>
                ` : `
                    <th>الوصف</th>
                    <th>المبلغ</th>
                `}
            </tr>
        </thead>
        <tbody>
            ${(invoiceData.items || []).map((item: any) => `
                <tr>
                    ${invoiceType === "commercial" ? `
                        <td>${item.description}</td>
                        <td>${item.meterNumber || ''}</td>
                        <td>${item.previousReading || ''}</td>
                        <td>${item.currentReading || ''}</td>
                        <td>﷼${parseFloat(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>﷼${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    ` : `
                        <td>${item.description}</td>
                        <td>﷼${parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    `}
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="total-row"><strong>المجموع الجزئي: ﷼${parseFloat(invoiceData.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
        ${parseFloat(invoiceData.discount) > 0 ? `<div class="total-row"><strong>الخصم: ﷼${parseFloat(invoiceData.discount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>` : ''}
        <div class="total-row" style="font-size: 18px;"><strong>المجموع الإجمالي: ﷼${parseFloat(invoiceData.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    </div>

    ${invoiceData.notes ? `<div style="margin-top: 30px;"><strong>ملاحظات:</strong><br>${invoiceData.notes}</div>` : ''}
</body>
</html>`;
  };

  const isLoading = createInvoiceMutation.isPending || updateInvoiceMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>العميل *</Label>
          <Select 
            value={form.watch("customerId")} 
            onValueChange={(value) => form.setValue("customerId", value)}
          >
            <SelectTrigger className="mt-1" data-testid="select-customer">
              <SelectValue placeholder="اختر العميل" />
            </SelectTrigger>
            <SelectContent>
              {customers && Array.isArray(customers) ? customers.map((customer: any) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
          {form.formState.errors.customerId && (
            <p className="text-sm text-destructive mt-1" data-testid="error-customer">
              {form.formState.errors.customerId.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="date">تاريخ الفاتورة *</Label>
          <Input
            id="date"
            type="date"
            {...form.register("date")}
            className="mt-1"
            data-testid="input-invoice-date"
          />
          {form.formState.errors.date && (
            <p className="text-sm text-destructive mt-1" data-testid="error-date">
              {form.formState.errors.date.message}
            </p>
          )}
        </div>
      </div>


      {/* Invoice Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>عناصر الفاتورة *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", documentNumber: "", meterNumber: "", previousReading: "", currentReading: "", unitPrice: "", price: "" })}
            data-testid="button-add-item"
          >
            <Plus className="ml-1" size={16} />
            إضافة عنصر
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4 bg-gray-50">
              {invoiceType === "commercial" ? (
                // Commercial meter layout
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <Input
                      {...form.register(`items.${index}.description`)}
                      placeholder="وصف الخدمة/المنتج"
                      className="text-sm"
                      data-testid={`input-item-description-${index}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      {...form.register(`items.${index}.meterNumber`)}
                      placeholder="رقم العداد"
                      className="text-sm"
                      data-testid={`input-item-meter-number-${index}`}
                    />
                  </div>
                  <div className="col-span-1">
                    <FormattedNumberInput
                      value={form.watch(`items.${index}.previousReading`)}
                      onChange={(value) => form.setValue(`items.${index}.previousReading`, value)}
                      placeholder="القراءة السابقة"
                      className="text-sm"
                      data-testid={`input-item-previous-reading-${index}`}
                    />
                  </div>
                  <div className="col-span-1">
                    <FormattedNumberInput
                      value={form.watch(`items.${index}.currentReading`)}
                      onChange={(value) => form.setValue(`items.${index}.currentReading`, value)}
                      placeholder="القراءة الحالية"
                      className="text-sm"
                      data-testid={`input-item-current-reading-${index}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormattedNumberInput
                      value={form.watch(`items.${index}.unitPrice`)}
                      onChange={(value) => form.setValue(`items.${index}.unitPrice`, value)}
                      placeholder="قيمة الوحدة (﷼)"
                      className="text-sm"
                      data-testid={`input-item-unit-price-${index}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <FormattedNumberInput
                        value={form.watch(`items.${index}.price`)}
                        onChange={(value) => form.setValue(`items.${index}.price`, value)}
                        placeholder="الإجمالي (﷼)"
                        className="text-sm bg-gray-100"
                        readOnly
                        data-testid={`input-item-price-${index}`}
                      />
                      {/* Show calculation formula */}
                      {(() => {
                        const item = form.watch(`items.${index}`);
                        const previousReading = parseFloat(item?.previousReading || "0");
                        const currentReading = parseFloat(item?.currentReading || "0");
                        const unitPrice = parseFloat(item?.unitPrice || "0");
                        
                        if (previousReading >= 0 && currentReading > 0 && unitPrice > 0 && currentReading >= previousReading) {
                          const consumption = currentReading - previousReading;
                          return (
                            <div className="text-xs text-gray-500 text-center">
                              ({currentReading} - {previousReading}) × {unitPrice} = {consumption} × {unitPrice}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-remove-item-${index}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // Regular invoice layout (monthly invoices without document number)
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-8">
                    <Input
                      {...form.register(`items.${index}.description`)}
                      placeholder="وصف الخدمة/المنتج"
                      className="text-sm"
                      data-testid={`input-item-description-${index}`}
                    />
                  </div>
                  <div className="col-span-3">
                    <FormattedNumberInput
                      value={form.watch(`items.${index}.price`)}
                      onChange={(value) => form.setValue(`items.${index}.price`, value)}
                      placeholder="المبلغ (﷼)"
                      className="text-sm"
                      data-testid={`input-item-price-${index}`}
                    />
                  </div>
                  <div className="col-span-1">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-remove-item-${index}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {form.formState.errors.items?.[index] && (
                <div className="mt-2 text-sm text-destructive">
                  {form.formState.errors.items[index]?.description?.message ||
                   form.formState.errors.items[index]?.documentNumber?.message ||
                   form.formState.errors.items[index]?.meterNumber?.message ||
                   form.formState.errors.items[index]?.previousReading?.message ||
                   form.formState.errors.items[index]?.currentReading?.message ||
                   form.formState.errors.items[index]?.unitPrice?.message ||
                   form.formState.errors.items[index]?.price?.message}
                </div>
              )}
            </Card>
          ))}
        </div>

        {form.formState.errors.items && (
          <p className="text-sm text-destructive mt-2" data-testid="error-items">
            {form.formState.errors.items.message}
          </p>
        )}
      </div>

      {/* Invoice Totals */}
      <div className="border-t border-gray-200 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              rows={4}
              placeholder="ملاحظات إضافية..."
              className="mt-1"
              data-testid="input-notes"
            />
          </div>
          
          <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المجموع الجزئي:</span>
                <span className="font-medium" data-testid="text-subtotal">﷼{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">الخصم (%):</span>
                <FormattedNumberInput
                  value={form.watch("discount")}
                  onChange={(value) => form.setValue("discount", value)}
                  min="0"
                  max="100"
                  className="w-20 h-8 text-xs text-center"
                  placeholder="0"
                  data-testid="input-discount"
                />
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>المجموع الإجمالي:</span>
                  <span className="text-primary" data-testid="text-total">﷼{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Actions */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel-invoice">
            إلغاء
          </Button>
          <div className="flex space-x-reverse space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrintPreview}
              data-testid="button-print-preview"
            >
              <Printer className="ml-2" size={16} />
              معاينة وطباعة
            </Button>
            <Button type="submit" disabled={isLoading} data-testid="button-save-invoice">
              {isLoading ? "جاري الحفظ..." : invoice ? "تحديث الفاتورة" : "إنشاء الفاتورة"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
