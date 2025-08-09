import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertCustomerSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type FormData = z.infer<typeof insertCustomerSchema>;

interface CustomerFormProps {
  customer?: any;
  onSuccess: () => void;
}

export default function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      meterNumber: customer?.meterNumber || "",
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إضافة العميل بنجاح",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في إضافة العميل",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("PUT", `/api/customers/${customer.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات العميل بنجاح",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "حدث خطأ",
        description: "فشل في تحديث بيانات العميل",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (customer) {
      updateCustomerMutation.mutate(data);
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const isLoading = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">اسم العميل *</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="أدخل اسم العميل"
          className="mt-1"
          data-testid="input-customer-name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1" data-testid="error-customer-name">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="أدخل البريد الإلكتروني"
          className="mt-1 ltr-text"
          data-testid="input-customer-email"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive mt-1" data-testid="error-customer-email">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">رقم الهاتف</Label>
        <Input
          id="phone"
          {...form.register("phone")}
          placeholder="أدخل رقم الهاتف"
          className="mt-1 ltr-text"
          data-testid="input-customer-phone"
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive mt-1" data-testid="error-customer-phone">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="address">العنوان</Label>
        <Textarea
          id="address"
          {...form.register("address")}
          placeholder="أدخل العنوان"
          className="mt-1"
          rows={3}
          data-testid="input-customer-address"
        />
        {form.formState.errors.address && (
          <p className="text-sm text-destructive mt-1" data-testid="error-customer-address">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="meterNumber">رقم العداد التجاري</Label>
        <Input
          id="meterNumber"
          {...form.register("meterNumber")}
          placeholder="أدخل رقم العداد التجاري"
          className="mt-1 ltr-text"
          data-testid="input-customer-meter-number"
        />
        {form.formState.errors.meterNumber && (
          <p className="text-sm text-destructive mt-1" data-testid="error-customer-meter-number">
            {form.formState.errors.meterNumber.message}
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel-customer">
          إلغاء
        </Button>
        <Button type="submit" disabled={isLoading} data-testid="button-save-customer">
          {isLoading ? "جاري الحفظ..." : customer ? "تحديث العميل" : "إضافة العميل"}
        </Button>
      </div>
    </form>
  );
}
