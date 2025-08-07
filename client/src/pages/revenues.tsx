import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, TrendingUp, Printer } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Revenues() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Placeholder data - will be implemented with proper backend
  const revenues = [
    { id: 1, description: "رسوم شهرية - شقة 101", amount: "1500.00", date: "2024-01-15", category: "رسوم شهرية" },
    { id: 2, description: "فاتورة كهرباء - محل تجاري", amount: "850.00", date: "2024-01-14", category: "عداد تجاري" },
    { id: 3, description: "رسوم صيانة", amount: "300.00", date: "2024-01-13", category: "أخرى" },
  ];

  const filteredRevenues = revenues.filter((revenue) =>
    revenue.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenues = revenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount), 0);

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative">
          <Input
            type="text"
            placeholder="البحث في الإيرادات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 w-80"
            data-testid="input-search-revenues"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>
        
        <div className="flex space-x-reverse space-x-3">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            data-testid="button-print-revenues"
          >
            <Printer className="ml-2" size={16} />
            طباعة القائمة
          </Button>
          
          <Button className="bg-success text-white hover:bg-green-700" data-testid="button-add-revenue">
            <Plus className="ml-2" size={16} />
            إضافة إيراد جديد
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mb-6">
        <Card className="border border-success/20 bg-success/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-success" data-testid="total-revenues">
                  ₪{totalRevenues.toLocaleString()}
                </p>
                <p className="text-sm text-success">هذا الشهر</p>
              </div>
              <div className="w-16 h-16 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-success text-2xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenues Table */}
      {filteredRevenues.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الوصف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفئة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
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
                {filteredRevenues.map((revenue) => (
                  <tr key={revenue.id} className="hover:bg-gray-50" data-testid={`revenue-row-${revenue.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {revenue.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-success/10 text-success">
                        {revenue.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-success font-medium">
                      ₪{parseFloat(revenue.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(revenue.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-reverse space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.print()}
                          data-testid={`button-print-revenue-${revenue.id}`}
                        >
                          <Printer size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-revenue-${revenue.id}`}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-revenue-${revenue.id}`}
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
            <div className="text-gray-500" data-testid="empty-revenues-list">
              {searchQuery ? "لم يتم العثور على إيرادات مطابقة للبحث" : "لا توجد إيرادات حالياً"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}