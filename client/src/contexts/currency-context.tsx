import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'YER' | 'SAR' | 'USD';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  nameAr: string;
}

export const currencies: Record<Currency, CurrencyInfo> = {
  YER: { code: 'YER', symbol: '﷼', name: 'Yemeni Rial', nameAr: 'الريال اليمني' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', nameAr: 'الريال السعودي' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', nameAr: 'الدولار الأمريكي' }
};

interface CurrencyContextType {
  currency: Currency;
  currencyInfo: CurrencyInfo;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: string | number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('selected-currency');
    return (saved as Currency) || 'YER';
  });

  const currencyInfo = currencies[currency];

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('selected-currency', newCurrency);
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    // Format number with commas for thousands separator
    const formatted = numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${currencyInfo.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencyInfo, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}