import { money } from '@/utils/tutor';

export interface CurrencyMeta {
    code: string;
    label: string;
    symbol: string;
    rate: number;
    is_active: boolean;
}

export const FALLBACK_CURRENCIES: CurrencyMeta[] = [
    { code: 'INR', label: 'INR · Indian Rupee', symbol: '₹', rate: 1.0, is_active: true },
    { code: 'USD', label: 'USD · US Dollar', symbol: '$', rate: 0.010, is_active: true },
    { code: 'EUR', label: 'EUR · Euro', symbol: '€', rate: 0.0090, is_active: true },
    { code: 'GBP', label: 'GBP · British Pound', symbol: '£', rate: 0.0077, is_active: true },
    { code: 'AED', label: 'AED · UAE Dirham', symbol: 'د.إ', rate: 0.038, is_active: true },
    { code: 'SGD', label: 'SGD · Singapore Dollar', symbol: 'S$', rate: 0.013, is_active: true },
];

export type CurrencyCode = string;

let _currencies: CurrencyMeta[] = [...FALLBACK_CURRENCIES];
let _baseCurrency: CurrencyCode = 'INR';
let _ratesLoaded = false;
let _ratesPromise: Promise<void> | null = null;

/**
 * Fetch exchange rates + currency metadata from the server API.
 * Falls back to defaults if the fetch fails.
 */
export async function loadRatesFromAPI(): Promise<void> {
    if (_ratesLoaded) return;
    if (_ratesPromise) return _ratesPromise;

    _ratesPromise = fetch('/api/currency-rates')
        .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch rates');
            return res.json();
        })
        .then((data) => {
            if (data?.rates) {
                const base = data.base || 'INR';
                _baseCurrency = base;
                const list: CurrencyMeta[] = [];

                for (const [code, info] of Object.entries(data.rates) as [string, { rate: number; symbol?: string; is_active?: boolean }][] ) {
                    const fallback = FALLBACK_CURRENCIES.find(f => f.code === code);
                    list.push({
                        code,
                        label: fallback?.label ?? code,
                        symbol: info.symbol || fallback?.symbol || (code + ' '),
                        rate: info.rate,
                        is_active: info.is_active ?? true,
                    });
                }

                // Ensure the base currency is in the list
                if (!list.find(c => c.code === base)) {
                    list.unshift({
                        code: base,
                        label: FALLBACK_CURRENCIES.find(f => f.code === base)?.label ?? base,
                        symbol: FALLBACK_CURRENCIES.find(f => f.code === base)?.symbol ?? '₹',
                        rate: 1.0,
                        is_active: true,
                    });
                }

                _currencies = list;
            }
            _ratesLoaded = true;
        })
        .catch(() => {
            _currencies = [...FALLBACK_CURRENCIES];
            _ratesLoaded = true;
        })
        .finally(() => {
            _ratesPromise = null;
        });

    return _ratesPromise;
}

// ── Getters ──────────────────────────────────────────────────────────

/** All currencies (active + inactive), as currently loaded from API. */
export function getAllCurrencies(): CurrencyMeta[] {
    return _currencies;
}

/** Only active currencies, for user-facing dropdowns. */
export function getActiveCurrencies(): CurrencyMeta[] {
    return _currencies.filter(c => c.is_active);
}

/** The platform base currency code. */
export function getBaseCurrencyCode(): CurrencyCode {
    return _baseCurrency;
}

/** Symbol for a currency code. */
export function symbolOf(code: string): string {
    return _currencies.find(c => c.code === code)?.symbol ?? (code + ' ');
}

/** Rate for a currency code. */
export function rateOf(code: CurrencyCode): number {
    return _currencies.find(c => c.code === code)?.rate ?? 1;
}

/** Currency code validation — pass through if it looks valid. */
export function asCurrencyCode(code: string): CurrencyCode {
    return code || 'INR';
}

// ── Conversion ───────────────────────────────────────────────────────

export function convertCents(cents: number | string, from: CurrencyCode, to: CurrencyCode): number {
    if (!from || !to || from === to) return Number(cents) || 0;
    return Math.round((Number(cents) || 0) * rateOf(to) / rateOf(from));
}

export function reverseConvertCents(cents: number | string, from: CurrencyCode, to: CurrencyCode): number {
    if (!from || !to || from === to) return Number(cents) || 0;
    return Math.round((Number(cents) || 0) * rateOf(from) / rateOf(to));
}

// ── displayAmount ────────────────────────────────────────────────────

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

export function displayAmount(cents: number | string, currency: string, auth: AuthProps, _tutor = false): DisplayAmountResult {
    const user = auth?.user;
    const cookieCurrency = getCurrencyCookie();
    const base = cookieCurrency || asCurrencyCode(user?.base_currency ?? _baseCurrency);
    const currencyCode = asCurrencyCode(currency);
    const native = money(cents, currencyCode as any);

    if (!base || base === currencyCode) {
        return { text: native, note: null, native };
    }

    const converted = money(convertCents(cents, currencyCode, base), currencyCode as any);

    if (user?.role === 'ADMIN') {
        return { text: converted, note: native, native };
    }

    return { text: converted, note: null, native };
}

// ── Backwards-compatible re-exports ──────────────────────────────────

/** @deprecated Use getActiveCurrencies() instead */
export const CURRENCIES = FALLBACK_CURRENCIES.map(c => ({ code: c.code, label: c.label })) as const;

/** @deprecated Use symbolOf() instead */
export const SYMBOLS: Record<string, string> = Object.fromEntries(
    FALLBACK_CURRENCIES.map(c => [c.code, c.symbol])
);

// ── Cookie helpers ───────────────────────────────────────────────────

export const setCurrencyCookie = (code: CurrencyCode): void => {
    document.cookie = `lnr_currency=${code}; max-age=30*24*60*60; path=/; SameSite=Lax`;
};

export const getCurrencyCookie = (): CurrencyCode => {
    const match = document.cookie.match(/(?:^|; )lnr_currency=([^;]+)/);
    return asCurrencyCode(match ? match[1] : 'INR');
};
