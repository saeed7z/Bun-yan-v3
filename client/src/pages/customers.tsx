import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import CustomerForm from "@/components/customer/customer-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Customers() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (customerId: string) => apiRequest("DELETE", `/api/customers/${customerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف العميل بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في حذف العميل",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers?.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${customerName}"؟`)) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative">
          <Input
            type="text"
            placeholder="البحث في العملاء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 w-80"
            data-testid="input-search-customers"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-blue-700" data-testid="button-add-customer">
              <Plus className="ml-2" size={16} />
              إضافة عميل جديد
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة عميل جديد</DialogTitle>
            </DialogHeader>
            <CustomerForm onSuccess={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer: any) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow" data-testid={`customer-card-${customer.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {customer.name}
                  </CardTitle>
                  <div className="flex space-x-reverse space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCustomer(customer)}
                      data-testid={`button-edit-customer-${customer.id}`}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-customer-${customer.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="ml-2" size={14} />
                      <span className="ltr-text">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="ml-2" size={14} />
                      <span className="ltr-text">{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="ml-2" size={14} />
                      <span>{customer.address}</span>
                    </div>
                  )}
                  <div className="pt-2 text-xs text-gray-500">
                    تاريخ الإضافة: {new Date(customer.createdAt).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500" data-testid="empty-customers-list">
              {searchQuery ? "لم يتم العثور على عملاء مطابقين للبحث" : "لا يوجد عملاء حالياً"}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Customer Modal */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => setEditingCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
