import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, TrendingDown, Printer } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/currency-context";

export default function Expenses() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  // Placeholder data - will be implemented with proper backend
  const expenses = [
    { id: 1, description: "صيانة المصاعد", amount: "600.00", date: "2024-01-15", category: "صيانة" },
    { id: 2, description: "فاتورة كهرباء المبنى", amount: "1200.00", date: "2024-01-14", category: "كهرباء" },
    { id: 3, description: "راتب الحارس", amount: "2500.00", date: "2024-01-01", category: "رواتب" },
  ];

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative">
          <Input
            type="text"
            placeholder="البحث في المصروفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 w-80"
            data-testid="input-search-expenses"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>
        
        <div className="flex space-x-reverse space-x-3">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            data-testid="button-print-expenses"
          >
            <Printer className="ml-2" size={16} />
            طباعة القائمة
          </Button>
          
          <Button className="bg-danger text-white hover:bg-red-700" data-testid="button-add-expense">
            <Plus className="ml-2" size={16} />
            إضافة مصروف جديد
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mb-6">
        <Card className="border border-danger/20 bg-danger/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي المصروفات</p>
                <p className="text-3xl font-bold text-danger" data-testid="total-expenses">
                  {formatAmount(totalExpenses.toString())}
                </p>
                <p className="text-sm text-danger">هذا الشهر</p>
              </div>
              <div className="w-16 h-16 bg-danger/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-danger text-2xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length > 0 ? (
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
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50" data-testid={`expense-row-${expense.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-danger/10 text-danger">
                        {expense.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-danger font-medium">
                      {formatAmount(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-reverse space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.print()}
                          data-testid={`button-print-expense-${expense.id}`}
                        >
                          <Printer size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-expense-${expense.id}`}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-expense-${expense.id}`}
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
            <div className="text-gray-500" data-testid="empty-expenses-list">
              {searchQuery ? "لم يتم العثور على مصروفات مطابقة للبحث" : "لا توجد مصروفات حالياً"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}