import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from '@/contexts/currency-context';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Users, 
  Building,
  Store,
  Briefcase,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { formatAmount } = useCurrency();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: topCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers/with-stats"],
  });

  if (statsLoading || invoicesLoading || customersLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const recentInvoices = (invoices && Array.isArray(invoices)) ? invoices.slice(0, 5) : [];
  const displayCustomers = (topCustomers && Array.isArray(topCustomers)) ? topCustomers.slice(0, 3) : [];

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

  const customerIcons = [Building, Store, Briefcase];

  return (
    <div className="p-6">
      {/* Print Button */}
      <div className="mb-6 flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => window.print()}
          className="no-print"
        >
          <Printer className="ml-2" size={16} />
          طباعة التقرير
        </Button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الايرادات</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-sales">
                  {formatAmount((stats as any)?.totalSales || "0")}
                </p>
                <p className="text-sm text-success">+12.5% عن الشهر السابق</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-success text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الفواتير المدفوعة</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-paid-invoices">
                  {(stats as any)?.paidInvoices || 0}
                </p>
                <p className="text-sm text-success">+5.2% عن الشهر السابق</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الفواتير المعلقة</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-pending-invoices">
                  {(stats as any)?.pendingInvoices || 0}
                </p>
                <p className="text-sm text-warning">قيد الانتظار</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="text-warning text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">العملاء النشطون</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-customers">
                  {(stats as any)?.activeCustomers || 0}
                </p>
                <p className="text-sm text-success">+8.1% عن الشهر السابق</p>
              </div>
              <div className="w-12 h-12 bg-gray-500/10 rounded-lg flex items-center justify-center">
                <Users className="text-gray-500 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Invoices and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">الفواتير الأخيرة</h3>
                <a href="/invoices" className="text-primary text-sm font-medium hover:text-blue-700" data-testid="link-view-all-invoices">
                  عرض الكل
                </a>
              </div>
            </div>
            <div className="overflow-hidden">
              {recentInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          رقم الفاتورة
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentInvoices.map((invoice: any) => (
                        <tr key={invoice.id} className="hover:bg-gray-50" data-testid={`invoice-row-${invoice.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatAmount(invoice.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(invoice.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invoice.date).toLocaleDateString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500" data-testid="empty-invoices">
                  لا توجد فواتير حالياً
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Top Customers */}
        <div>
          <Card className="border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">أهم العملاء</h3>
            </div>
            <div className="p-6">
              {displayCustomers.length > 0 ? (
                <div className="space-y-4">
                  {displayCustomers.map((customer: any, index: number) => {
                    const Icon = customerIcons[index % customerIcons.length];
                    const iconColors = ["text-primary", "text-gray-500", "text-warning"];
                    const bgColors = ["bg-primary/10", "bg-gray-500/10", "bg-warning/10"];
                    
                    return (
                      <div key={customer.id} className="flex items-center justify-between" data-testid={`customer-${customer.id}`}>
                        <div className="flex items-center space-x-reverse space-x-3">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", bgColors[index % bgColors.length])}>
                            <Icon className={cn(iconColors[index % iconColors.length])} size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.totalInvoices} فاتورة</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {formatAmount(customer.totalAmount)}
                          </p>
                          <p className="text-xs text-success">+5.2%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500" data-testid="empty-customers">
                  لا يوجد عملاء حالياً
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
