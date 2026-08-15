import { money } from "@/utils/tutor.jsx";

export const CURRENCIES = [
    { code: "USD", label: "USD · US Dollar" },
    { code: "INR", label: "INR · Indian Rupee" },
    { code: "EUR", label: "EUR · Euro" },
    { code: "GBP", label: "GBP · British Pound" },
    { code: "AED", label: "AED · UAE Dirham" },
    { code: "SGD", label: "SGD · Singapore Dollar" },
];

export const RATES = {
    USD: 1,
    INR: 83.5,
    EUR: 0.92,
    GBP: 0.79,
    AED: 3.67,
    SGD: 1.35,
};

export const rateOf = (code) => RATES[code] ?? 1;

export function convertCents(cents, from, to) {
    if (!from || !to || from === to) return Number(cents) || 0;
    return Math.round(((Number(cents) || 0) * rateOf(to)) / rateOf(from));
}

export function displayAmount(cents, currency, auth) {
    const user = auth?.user;
    const base = user?.base_currency;
    const native = money(cents, currency);

    if (!base || base === currency) {
        return { text: native, note: null, native };
    }

    const converted = money(convertCents(cents, currency, base), base);

    if (user?.role === "ADMIN") {
        return { text: converted, note: native, native };
    }

    return { text: converted, note: null, native };
}
