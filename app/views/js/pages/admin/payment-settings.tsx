import { Head, useForm } from '@inertiajs/react';
import { Save, Settings, DollarSign, CreditCard, Banknote } from 'lucide-react';

import AdminLayout from '@/components/larnr/admin-layout';
import FlashToast from '@/components/larnr/flash-toast';
import type { AdminPaymentSettingsProps, AuthProps } from '@/types';

export default function AdminPaymentSettings(props: AdminPaymentSettingsProps) {
    const { data, setData, post, processing } = useForm({
        platform_fee_percent: props.platformFeePercent,
        processing_fee_percent: props.processingFeePercent,
        processing_fee_fixed: props.processingFeeFixed,
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/admin/payment-settings', { forceFormData: true });
    };

    return (
        <AdminLayout
            auth={props.auth}
            section="payments"
            title="Payment Settings"
            heading="Payment Settings"
            description="Configure platform fees and payment processing options."
        >
            <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <DollarSign className="size-6" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-base-content">
                            Payment Settings
                        </h1>
                        <p className="text-sm text-base-content/60">
                            Configure how payments are processed and platform fees.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                        <div className="card-body gap-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Settings className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-display text-lg font-semibold text-base-content">
                                        Platform Fee
                                    </h3>
                                    <p className="text-sm text-base-content/60">
                                        Percentage taken from each lesson payment as platform revenue.
                                    </p>
                                </div>
                            </div>

                            <div className="divider divider-neutral my-0" />

                            <div className="fieldset">
                                <legend className="fieldset-legend">Platform Fee Percentage</legend>
                                <label className="input w-full max-w-xs rounded-xl border-base-content/10 bg-base-content/5">
                                    <span className="text-base-content/50">{data.platform_fee_percent}%</span>
                                    <input
                                        type="number"
                                        name="platform_fee_percent"
                                        min="0"
                                        max="50"
                                        step="1"
                                        value={data.platform_fee_percent}
                                        onChange={(e) => setData('platform_fee_percent', e.target.value)}
                                    />
                                </label>
                                <p className="text-xs text-base-content/50">
                                    The percentage taken from each lesson payment as platform revenue.
                                    Tutors receive the remaining amount after this fee and processing fees.
                                </p>
                                {props.errors?.platform_fee_percent && (
                                    <span className="text-xs text-error">{props.errors.platform_fee_percent}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                        <div className="card-body gap-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-info/10 text-info">
                                    <CreditCard className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-display text-lg font-semibold text-base-content">
                                        Payment Processing Fees
                                    </h3>
                                    <p className="text-sm text-base-content/60">
                                        Stripe processing fees (percentage + fixed per transaction).
                                    </p>
                                </div>
                            </div>

                            <div className="divider divider-neutral my-0" />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="fieldset">
                                    <legend className="fieldset-legend">Processing Fee Percentage</legend>
                                    <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                        <span className="text-base-content/50">{data.processing_fee_percent}%</span>
                                        <input
                                            type="number"
                                            name="processing_fee_percent"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={data.processing_fee_percent}
                                            onChange={(e) => setData('processing_fee_percent', e.target.value)}
                                        />
                                    </label>
                                    <p className="text-xs text-base-content/50">
                                        Percentage fee per transaction (e.g., 2.9% for Stripe).
                                    </p>
                                    {props.errors?.processing_fee_percent && (
                                        <span className="text-xs text-error">{props.errors.processing_fee_percent}</span>
                                    )}
                                </div>

                                <div className="fieldset">
                                    <legend className="fieldset-legend">Processing Fee Fixed (cents)</legend>
                                    <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                        <span className="text-base-content/50">{data.processing_fee_fixed}¢</span>
                                        <input
                                            type="number"
                                            name="processing_fee_fixed"
                                            min="0"
                                            max="500"
                                            step="1"
                                            value={data.processing_fee_fixed}
                                            onChange={(e) => setData('processing_fee_fixed', e.target.value)}
                                        />
                                    </label>
                                    <p className="text-xs text-base-content/50">
                                        Fixed fee per transaction in cents (e.g., 30¢ for Stripe).
                                    </p>
                                    {props.errors?.processing_fee_fixed && (
                                        <span className="text-xs text-error">{props.errors.processing_fee_fixed}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                        <div className="card-body gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                                    <Banknote className="size-5" />
                                </div>
                                <div className="text-sm text-base-content/70">
                                    <p><strong>Total deduction per $100 lesson:</strong></p>
                                    <p>
                                        Platform: ${(Number(props.platformFeePercent)).toFixed(2)} 
                                        + Processing: ${(100 * Number(props.processingFeePercent) / 100 + Number(props.processingFeeFixed) / 100).toFixed(2)}
                                        = ${(Number(props.platformFeePercent) + 100 * Number(props.processingFeePercent) / 100 + Number(props.processingFeeFixed) / 100).toFixed(2)} total
                                    </p>
                                    <p className="text-success">Tutor receives: ${(100 - Number(props.platformFeePercent) - 100 * Number(props.processingFeePercent) / 100 - Number(props.processingFeeFixed) / 100).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="submit"
                            className="btn btn-primary rounded-full px-6"
                            disabled={processing}
                        >
                            <Save className="size-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}