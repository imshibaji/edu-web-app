import { money } from '@/utils/tutor';

export const CURRENCIES = [
    { code: 'INR', label: 'INR · Indian Rupee' },
    { code: 'USD', label: 'USD · US Dollar' },
    { code: 'EUR', label: 'EUR · Euro' },
    { code: 'GBP', label: 'GBP · British Pound' },
    { code: 'AED', label: 'AED · UAE Dirham' },
    { code: 'SGD', label: 'SGD · Singapore Dollar' },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]['code'];

export const SYMBOLS: Record<CurrencyCode, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    SGD: '$',
};

export const RATES: Record<CurrencyCode, number> = {
    INR: 1.0,
    USD: 95.45,
    EUR: 110.38,
    GBP: 129.41,
    AED: 25.99,
    SGD: 74.62,
};

export const rateOf = (code: CurrencyCode): number => RATES[code] ?? 1;

export function convertCents(cents: number | string, from: CurrencyCode, to: CurrencyCode): number {
    if (!from || !to || from === to) return Number(cents) || 0;
    return Math.round((Number(cents) || 0) * rateOf(to) / rateOf(from));
}

export function reverseConvertCents(cents: number | string, from: CurrencyCode, to: CurrencyCode): number {
    if (!from || !to || from === to) return Number(cents) || 0;
    return Math.round((Number(cents) || 0) * rateOf(from) / rateOf(to));
}

export interface DisplayAmountResult {
    text: string;
    note: string | null;
    native: string;
}

export interface AuthUser {
    base_currency?: string;
    role?: string;
}

export interface AuthProps {
    user: AuthUser | null;
}

function asCurrencyCode(code: string): CurrencyCode {
    return (CURRENCIES.find(c => c.code === code)?.code ?? 'INR') as CurrencyCode;
}

export function displayAmount(cents: number | string, currency: string, auth: AuthProps, _tutor = false): DisplayAmountResult {
    const user = auth?.user;
    const base = asCurrencyCode(user?.base_currency ?? 'INR');
    const currencyCode = asCurrencyCode(currency);
    const native = money(cents, currencyCode);

    if (!base || base === currencyCode) {
        return { text: native, note: null, native };
    }

    const converted = money(convertCents(cents, currencyCode, base), currencyCode);

    if (user?.role === 'ADMIN') {
        return { text: converted, note: native, native };
    }

    return { text: converted, note: null, native };
}

export const setCurrencyCookie = (code: CurrencyCode): void => {
    document.cookie = `lnr_currency=${code}; max-age=30*24*60*60; path=/; SameSite=Lax`;
};

export const getCurrencyCookie = (): CurrencyCode => {
    const match = document.cookie.match(/(?:^|; )lnr_currency=([^;]+)/);
    return asCurrencyCode(match ? match[1] : 'INR');
};