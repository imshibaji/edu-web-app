import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Save, DollarSign, TrendingUp, Info, Plus, Trash2, Star } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import { useAuth } from '@/utils/index';
import { symbolOf, type AuthProps } from '@/utils/currency';

interface CurrencySetting {
    code: string;
    rate: number;
    symbol: string;
    is_active: boolean;
    is_base?: boolean;
}

interface AdminCurrenciesProps {
    currencies: Record<string, CurrencySetting>;
    baseCurrency: string;
    errors: Record<string, string>;
    auth: AuthProps;
}

export default function AdminCurrencies(props: AdminCurrenciesProps) {
    const auth = useAuth();

    const entries = Object.values(props.currencies);
    const activeCount = entries.filter((c) => c.is_active).length;

    const { data, setData, post, processing } = useForm({
        rates: entries.map((c) => ({
            code: c.code,
            rate: String(c.rate),
            is_active: c.is_active,
        })),
    });

    const [showAdd, setShowAdd] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newRate, setNewRate] = useState('');
    const [newSymbol, setNewSymbol] = useState('');
    const [removeCode, setRemoveCode] = useState<string | null>(null);

    const updateRate = (index: number, field: string, value: string | boolean) => {
        const updated = [...data.rates];
        updated[index] = { ...updated[index], [field]: value };
        setData('rates', updated);
    };

    const submitRates = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/admin/currencies');
    };

    const submitAdd = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.post('/admin/currencies/add', {
            code: newCode.toUpperCase().trim(),
            rate: newRate,
            symbol: newSymbol || undefined,
        }, { preserveScroll: true });
        setShowAdd(false);
        setNewCode('');
        setNewRate('');
        setNewSymbol('');
    };

    const doRemove = () => {
        if (!removeCode) return;
        router.post('/admin/currencies/remove', { code: removeCode }, { preserveScroll: true });
        setRemoveCode(null);
    };

    const doSetBase = (code: string) => {
        router.post('/admin/currencies/base', { code }, { preserveScroll: true });
    };

    const stats = [
        { label: 'Total currencies', value: String(entries.length), icon: DollarSign },
        { label: 'Active', value: String(activeCount), icon: TrendingUp },
        { label: 'Base currency', value: props.baseCurrency, icon: Info },
    ];

    return (
        <AdminLayout
            auth={auth}
            section="currencies"
            title="Currency Setup"
            heading="Currency Setup"
            description="Manage supported currencies and exchange rates. All conversions use these rates."
        >
            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="card card-border border-base-content/10 bg-base-content/[0.04]"
                    >
                        <div className="card-body gap-1 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
                                    {stat.label}
                                </p>
                                <stat.icon className="size-4 text-base-content/40" />
                            </div>
                            <p className="font-display text-xl font-bold text-base-content">
                                {stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rate editing */}
            <form onSubmit={submitRates} className="mt-6">
                <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-display text-lg font-semibold text-base-content">
                                    Exchange Rates
                                </h2>
                                <p className="text-xs text-base-content/50">
                                    Rates are relative to the base currency ({props.baseCurrency} = 1.0).
                                    All tutor rates, bookings and payouts convert using these values.
                                </p>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm rounded-full px-5"
                                disabled={processing}
                            >
                                <Save className="size-4" />
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        <div className="mt-4 overflow-x-auto rounded-xl border border-base-content/10">
                            <table className="table">
                                <thead>
                                    <tr className="text-xs text-base-content/50">
                                        <th className="font-medium">Currency</th>
                                        <th className="font-medium">Symbol</th>
                                        <th className="font-medium">Rate (vs {props.baseCurrency})</th>
                                        <th className="font-medium">Active</th>
                                        <th className="text-right font-medium">Example</th>
                                        <th className="text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.rates.map((item, index) => {
                                        const rate = parseFloat(item.rate) || 0;
                                        const exampleBase = 100;
                                        const converted = Math.round(exampleBase * rate);
                                        const isBase = item.code === props.baseCurrency;
                                        const sym = symbolOf(item.code);

                                        return (
                                            <tr
                                                key={item.code}
                                                className={`hover:bg-base-content/[0.03] ${
                                                    !item.is_active ? 'opacity-50' : ''
                                                }`}
                                            >
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-display text-sm font-bold text-base-content">
                                                            {item.code}
                                                        </span>
                                                        {isBase && (
                                                            <span className="badge badge-xs badge-primary">
                                                                Base
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-base-content/60 text-lg">
                                                        {sym}
                                                    </span>
                                                </td>
                                                <td>
                                                    <label className="input input-sm w-36 rounded-xl border-base-content/10 bg-base-content/5">
                                                        <input
                                                            type="number"
                                                            min="0.000001"
                                                            step="0.000001"
                                                            value={item.rate}
                                                            onChange={(e) =>
                                                                updateRate(index, 'rate', e.target.value)
                                                            }
                                                            disabled={isBase}
                                                            className="bg-transparent"
                                                        />
                                                    </label>
                                                    {props.errors?.['rates.' + index + '.rate'] && (
                                                        <span className="mt-1 block text-xs text-error">
                                                            {props.errors['rates.' + index + '.rate']}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="toggle toggle-sm toggle-primary"
                                                        checked={item.is_active}
                                                        onChange={(e) =>
                                                            updateRate(index, 'is_active', e.target.checked)
                                                        }
                                                        disabled={isBase}
                                                    />
                                                </td>
                                                <td className="text-right">
                                                    <span className="text-sm text-base-content/60">
                                                        {symbolOf(props.baseCurrency)}
                                                        {exampleBase.toLocaleString()} →{' '}
                                                        {sym}
                                                        {converted.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {!isBase && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs"
                                                                    title={`Set ${item.code} as base currency`}
                                                                    onClick={() => doSetBase(item.code)}
                                                                >
                                                                    <Star className="size-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs text-error"
                                                                    title={`Remove ${item.code}`}
                                                                    onClick={() => setRemoveCode(item.code)}
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </form>

            {/* Add currency button + modal */}
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    className="btn btn-outline btn-sm rounded-full"
                    onClick={() => setShowAdd(!showAdd)}
                >
                    <Plus className="size-4" />
                    Add Currency
                </button>
            </div>

            {showAdd && (
                <form onSubmit={submitAdd} className="card card-border mt-3 border-base-content/10 bg-base-content/[0.04]">
                    <div className="card-body">
                        <h3 className="font-display text-sm font-semibold text-base-content">
                            Add New Currency
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="fieldset">
                                <legend className="fieldset-legend">Currency code</legend>
                                <input
                                    type="text"
                                    placeholder="e.g. JPY"
                                    maxLength={10}
                                    required
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                    className="input w-full rounded-xl border-base-content/10 bg-base-content/5"
                                />
                            </div>
                            <div className="fieldset">
                                <legend className="fieldset-legend">Rate (vs {props.baseCurrency})</legend>
                                <input
                                    type="number"
                                    min="0.000001"
                                    step="0.000001"
                                    placeholder="e.g. 1.23"
                                    required
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    className="input w-full rounded-xl border-base-content/10 bg-base-content/5"
                                />
                            </div>
                            <div className="fieldset">
                                <legend className="fieldset-legend">Symbol (optional)</legend>
                                <input
                                    type="text"
                                    placeholder="e.g. ¥"
                                    maxLength={10}
                                    value={newSymbol}
                                    onChange={(e) => setNewSymbol(e.target.value)}
                                    className="input w-full rounded-xl border-base-content/10 bg-base-content/5"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowAdd(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm rounded-full px-5"
                            >
                                <Plus className="size-4" />
                                Add
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Remove confirmation dialog */}
            {removeCode && (
                <dialog className="modal modal-open">
                    <div className="modal-box rounded-2xl">
                        <h3 className="font-display text-lg font-bold text-base-content">
                            Remove {removeCode}?
                        </h3>
                        <p className="py-4 text-sm text-base-content/60">
                            This will permanently delete this currency. It cannot be removed if any tutor
                            is using it or if it is the base currency.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setRemoveCode(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error btn-sm rounded-full px-5"
                                onClick={doRemove}
                            >
                                <Trash2 className="size-4" />
                                Remove
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop" onClick={() => setRemoveCode(null)}>
                        <button>close</button>
                    </form>
                </dialog>
            )}

            {/* Info box */}
            <div className="mt-6 rounded-xl border border-info/20 bg-info/5 p-4">
                <div className="flex items-start gap-3">
                    <Info className="mt-0.5 size-4 shrink-0 text-info" />
                    <div className="text-xs text-base-content/60 space-y-1">
                        <p>
                            <strong>Base currency ({props.baseCurrency})</strong> always has rate 1.0
                            and cannot be deactivated.
                        </p>
                        <p>
                            <strong>Rate formula:</strong> 1 {props.baseCurrency} = [rate] of the target
                            currency. For example, if USD rate is 95.45, then ₹1 INR = $95.45 USD
                            (displayed as $1 USD ≈ ₹1.05 INR).
                        </p>
                        <p>
                            <strong>Deactivating</strong> a currency hides it from user-facing dropdowns
                            but does not affect existing bookings or tutor profiles using that currency.
                        </p>
                        <p>
                            <strong>Adding a currency:</strong> Provide the ISO code (or a custom code),
                            its exchange rate relative to the base, and an optional display symbol.
                        </p>
                        <p>
                            Changes take effect <strong>immediately</strong> for all users. The frontend
                            fetches updated rates on each page load.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
