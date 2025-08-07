import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Download, Trash2, Edit } from "lucide-react";
import InvoiceForm from "@/components/invoice/invoice-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Invoices() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => apiRequest("DELETE", `/api/invoices/${invoiceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الفاتورة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في حذف الفاتورة",
        variant: "destructive",
      });
    },
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find((c: any) => c.id === customerId);
    return customer?.name || "عميل غير معروف";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "مدفوعة", className: "status-paid" },
      pending: { label: "معلقة", className: "status-pending" },
      overdue: { label: "متأخرة", className: "status-overdue" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={cn("status-badge", config.className)} data-testid={`status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const filteredInvoices = invoices?.filter((invoice: any) => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getCustomerName(invoice.customerId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الفاتورة "${invoiceNumber}"؟`)) {
      deleteInvoiceMutation.mutate(invoiceId);
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "تم التنزيل بنجاح",
        description: "تم تنزيل الفاتورة بصيغة PDF",
      });
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "فشل في تنزيل الفاتورة",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-96 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-reverse space-x-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="البحث في الفواتير..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-80"
              data-testid="input-search-invoices"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="paid">مدفوعة</SelectItem>
              <SelectItem value="pending">معلقة</SelectItem>
              <SelectItem value="overdue">متأخرة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-blue-700" data-testid="button-add-invoice">
              <Plus className="ml-2" size={16} />
              إنشاء فاتورة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
            </DialogHeader>
            <InvoiceForm onSuccess={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الفاتورة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-gray-50" data-testid={`invoice-row-${invoice.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCustomerName(invoice.customerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₪{parseFloat(invoice.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-reverse space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice.id, invoice.number)}
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <Download size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingInvoice(invoice)}
                          data-testid={`button-edit-${invoice.id}`}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.number)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${invoice.id}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500" data-testid="empty-invoices-list">
              {searchQuery || statusFilter !== "all" 
                ? "لم يتم العثور على فواتير مطابقة للبحث" 
                : "لا توجد فواتير حالياً"
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Invoice Modal */}
      <Dialog open={!!editingInvoice} onOpenChange={(open) => !open && setEditingInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الفاتورة</DialogTitle>
          </DialogHeader>
          {editingInvoice && (
            <InvoiceForm
              invoice={editingInvoice}
              onSuccess={() => setEditingInvoice(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
