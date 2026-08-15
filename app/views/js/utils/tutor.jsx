export const FORMAT_LABELS = {
    ONLINE: "Online",
    IN_PERSON: "In-person",
    BOTH: "Online & In-person",
};

export const LEVEL_LABELS = {
    ENTRY: "Entry",
    MID: "Mid",
    SENIOR: "Senior",
};

export const STATUS_BADGE = {
    PENDING_PAYMENT: "badge-warning",
    CONFIRMED: "badge-info",
    COMPLETED: "badge-success",
    CANCELLED: "badge-neutral",
    DISPUTED: "badge-error",
};

export function statusLabel(status) {
    return (status ?? "").replaceAll("_", " ");
}

export function formatDateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export function money(cents, currency = "USD") {
    const n = Number(cents) || 0;
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: n % 100 === 0 ? 0 : 2,
    }).format(n / 100);
}
