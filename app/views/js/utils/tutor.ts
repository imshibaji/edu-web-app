export const FORMAT_LABELS = {
    ONLINE: 'Online',
    IN_PERSON: 'In-person',
    BOTH: 'Online & In-person',
} as const;

export const LEVEL_LABELS = {
    ENTRY: 'Entry',
    MID: 'Mid',
    SENIOR: 'Senior',
} as const;

export const STATUS_BADGE = {
    PENDING_PAYMENT: 'badge-warning',
    CONFIRMED: 'badge-info',
    COMPLETED: 'badge-success',
    CANCELLED: 'badge-neutral',
    DISPUTED: 'badge-error',
} as const;

export function statusLabel(status: string | null | undefined): string {
    return (status ?? '').replaceAll('_', ' ');
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export function money(cents: number | string, currency = 'INR'): string {
    const n = Number(cents) || 0;
    const amount = n / 100;
    const formatted = amount % 1 === 0 ? amount.toLocaleString() : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            maximumFractionDigits: n % 100 === 0 ? 0 : 2,
        }).format(amount);
    } catch {
        // Non-ISO currency code — fall back to symbol + formatted number
        return `${currency} ${formatted}`;
    }
}