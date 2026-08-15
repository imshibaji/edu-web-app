import { money } from "@/utils/tutor.jsx";

export const CURRENCIES = [
    { code: "INR", label: "INR · Indian Rupee" },
    { code: "USD", label: "USD · US Dollar" },
    { code: "EUR", label: "EUR · Euro" },
    { code: "GBP", label: "GBP · British Pound" },
    { code: "AED", label: "AED · UAE Dirham" },
    { code: "SGD", label: "SGD · Singapore Dollar" },
];

export const SYMBOLS = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    SGD: "$",
}

export const RATES = {
    INR: 1.0,
    USD: 95.45,
    EUR: 110.38,
    GBP: 129.41,
    AED: 25.99,
    SGD: 74.62,
};

export const rateOf = (code) => RATES[code] ?? 1;

export function convertCents(cents, from, to) {
    if (!from || !to || from === to) return Number(cents) || 0;
    return Math.round((Number(cents) || 0) * rateOf(to) / rateOf(from));
}

export function reverseConvertCents(cents, from, to) {
    if (!from || !to || from === to) return Number(cents) || 0;
    return Math.round((Number(cents) || 0) * rateOf(from) / rateOf(to));
}

export function displayAmount(cents, currency, auth, tutor = false) {
    const user = auth?.user;
    const base = user?.base_currency || "INR";
    const native = money(cents, currency);

    if (!base || base === currency) {
        return { text: native, note: null, native };
    }

    const converted = money(convertCents(cents, currency, base), currency);

    if (user?.role === "ADMIN") {
        return { text: converted, note: native, native };
    }

    return { text: converted, note: null, native };
}

export const setCurrencyCookie = (code) => {
    document.cookie = `lnr_currency=${code}; max-age=30*24*60*60; path=/; SameSite=Lax`;
};

export const getCurrencyCookie = () => {
    const match = document.cookie.match `(?:^|; )lnr_currency=([^;]+)`;
    return match ? match[1] : 'INR';
};
