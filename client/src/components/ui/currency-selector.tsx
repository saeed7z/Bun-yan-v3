import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency, currencies, Currency } from "@/contexts/currency-context";
import { DollarSign } from "lucide-react";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <DollarSign size={16} className="text-gray-500" />
      <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="اختر العملة" />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {Object.values(currencies).map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{curr.symbol}</span>
                <span>{curr.nameAr}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}