import { format } from 'date-fns';

const CURRENCY_LOCALES: Record<string, string> = {
  NGN: 'en-NG',
  USD: 'en-US',
  EUR: 'en-DE',
  GBP: 'en-GB',
  GHS: 'en-GH',
  KES: 'en-KE',
  ZAR: 'en-ZA',
  INR: 'en-IN',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

export function getUserCurrency(): string {
  if (typeof window === 'undefined') return 'NGN';
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.currency || 'NGN';
    } catch { /* fallback */ }
  }
  return 'NGN';
}

export function formatCurrency(amount: number, currency?: string): string {
  const curr = currency || getUserCurrency();
  const locale = CURRENCY_LOCALES[curr] || 'en-NG';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: curr,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return format(date, 'MMMM yyyy');
}

export const SUPPORTED_CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '\u20A6' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '\u20AC' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00A3' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH\u20B5' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00A5' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];
