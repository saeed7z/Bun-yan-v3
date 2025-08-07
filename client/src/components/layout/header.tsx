import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InvoiceForm from "@/components/invoice/invoice-form";
import { useLocation } from "wouter";

const pageConfig = {
  "/": { title: "لوحة التحكم", subtitle: "نظرة عامة على أداء أعمالك" },
  "/dashboard": { title: "لوحة التحكم", subtitle: "نظرة عامة على أداء أعمالك" },
  "/customers": { title: "إدارة الحسابات", subtitle: "إدارة حسابات العملاء والموردين" },
  "/invoices": { title: "إدارة الفواتير", subtitle: "إنشاء ومتابعة الفواتير" },
};

export default function Header() {
  const [location] = useLocation();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const config = pageConfig[location as keyof typeof pageConfig] || pageConfig["/"];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">
              {config.title}
            </h2>
            <p className="text-sm text-gray-600" data-testid="page-subtitle">
              {config.subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-4">
            <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-blue-700" data-testid="button-new-invoice">
                  <Plus className="ml-2" size={16} />
                  فاتورة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
                </DialogHeader>
                <InvoiceForm onSuccess={() => setIsInvoiceModalOpen(false)} />
              </DialogContent>
            </Dialog>
            
            <div className="relative">
              <Input
                type="text"
                placeholder="البحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-100 border-0 rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
