import { Link, useLocation } from "wouter";
import { Calculator, BarChart3, Users, FileText, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "لوحة التحكم", href: "/dashboard", icon: BarChart3, testId: "nav-dashboard" },
  { name: "الحسابات", href: "/customers", icon: Users, testId: "nav-customers" },
  { name: "الفواتير", href: "/invoices", icon: FileText, testId: "nav-invoices" },
];

const secondaryNavigation = [
  { name: "الإعدادات العامة", href: "/settings", icon: Settings, testId: "nav-settings" },
  { name: "تسجيل الخروج", href: "/logout", icon: LogOut, testId: "nav-logout" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-l border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-reverse space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Calculator className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">نظام المحاسبة</h1>
            <p className="text-sm text-gray-500">إدارة الحسابات والفواتير</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    data-testid={item.testId}
                  >
                    <item.icon className="ml-3 text-current" size={18} />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>

          {/* Secondary Navigation */}
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              إعدادات
            </h3>
            <div className="mt-2 space-y-1">
              {secondaryNavigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className="text-gray-700 hover:bg-gray-100 group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                    data-testid={item.testId}
                  >
                    <item.icon className="ml-3 text-gray-400 group-hover:text-gray-700" size={18} />
                    {item.name}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
