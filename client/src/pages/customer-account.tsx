import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, DollarSign, Calendar, Hash } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

interface CustomerAccountData {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    balance: string;
  };
  transactions: Array<{
    id: string;
    type: 'debit' | 'credit';
    entryNumber: number;
    amount: string;
    description: string;
    documentNumber: string;
    date: string;
    invoiceNumber: string;
  }>;
  totals: {
    totalDebit: string;
    totalCredit: string;
    currentBalance: string;
  };
}

export default function CustomerAccount() {
  const params = useParams();
  const customerId = params.id;

  const { data: accountData, isLoading, error } = useQuery<CustomerAccountData>({
    queryKey: [`/api/customers/${customerId}/account`],
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="animate-pulse">
          <CardContent className="p-12">
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !accountData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-500">خطأ في تحميل بيانات العميل</div>
            <Link href="/customers">
              <Button className="mt-4" variant="outline">
                <ArrowRight className="ml-2" size={16} />
                العودة للعملاء
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const debitTransactions = accountData.transactions.filter(t => t.type === 'debit');
  const creditTransactions = accountData.transactions.filter(t => t.type === 'credit');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">كشف حساب العميل</h1>
          <p className="text-gray-600 mt-1">{accountData.customer.name}</p>
        </div>
        <Link href="/customers">
          <Button variant="outline">
            <ArrowRight className="ml-2" size={16} />
            العودة للعملاء
          </Button>
        </Link>
      </div>

      {/* Customer Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            معلومات العميل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">اسم العميل</p>
              <p className="font-medium">{accountData.customer.name}</p>
            </div>
            {accountData.customer.email && (
              <div>
                <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                <p className="font-medium ltr-text">{accountData.customer.email}</p>
              </div>
            )}
            {accountData.customer.phone && (
              <div>
                <p className="text-sm text-gray-600">رقم الهاتف</p>
                <p className="font-medium ltr-text">{accountData.customer.phone}</p>
              </div>
            )}
          </div>
          {accountData.customer.address && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">العنوان</p>
              <p className="font-medium">{accountData.customer.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={20} />
            ملخص الحساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 font-semibold">إجمالي المدين</p>
              <p className="text-2xl font-bold text-red-700">₪{parseFloat(accountData.totals.totalDebit).toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-600 font-semibold">إجمالي الدائن</p>
              <p className="text-2xl font-bold text-green-700">₪{parseFloat(accountData.totals.totalCredit).toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-600 font-semibold">الرصيد الحالي</p>
              <p className={`text-2xl font-bold ${parseFloat(accountData.totals.currentBalance) >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                ₪{Math.abs(parseFloat(accountData.totals.currentBalance)).toFixed(2)}
                {parseFloat(accountData.totals.currentBalance) >= 0 ? ' مديون' : ' دائن'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debit Side (المدين) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              الجانب المدين (الفواتير)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debitTransactions.length > 0 ? (
              <div className="space-y-4">
                {debitTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive" className="text-xs">
                        قيد رقم {transaction.entryNumber}
                      </Badge>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(transaction.date).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ:</span>
                        <span className="font-semibold text-red-700">₪{parseFloat(transaction.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">البيان:</span>
                        <span className="font-medium">{transaction.description}</span>
                      </div>
                      {transaction.documentNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">رقم السند:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Hash size={12} />
                            {transaction.documentNumber}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الفاتورة:</span>
                        <span className="font-medium text-blue-600">{transaction.invoiceNumber}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                لا توجد معاملات مدينة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Side (الدائن) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              الجانب الدائن (المدفوعات)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditTransactions.length > 0 ? (
              <div className="space-y-4">
                {creditTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        قيد رقم {transaction.entryNumber}
                      </Badge>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(transaction.date).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ:</span>
                        <span className="font-semibold text-green-700">₪{parseFloat(transaction.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">البيان:</span>
                        <span className="font-medium">{transaction.description}</span>
                      </div>
                      {transaction.documentNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">رقم السند:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Hash size={12} />
                            {transaction.documentNumber}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">رقم الفاتورة:</span>
                        <span className="font-medium text-blue-600">{transaction.invoiceNumber}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                لا توجد مدفوعات مسجلة
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}