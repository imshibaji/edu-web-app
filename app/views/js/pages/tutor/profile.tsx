import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Save, Clock, ImagePlus, CreditCard, Banknote, Shield } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import Avatar from '@/components/larnr/avatar';
import { FORMAT_LABELS, LEVEL_LABELS } from '@/utils/tutor';
import { SYMBOLS, type CurrencyCode } from '@/utils/currency';
import type { TutorProfileProps, AuthProps } from '@/types';

function toDollars(cents: number): number {
    return (Number(cents) || 0) / 100;
}

export default function TutorProfile(props: TutorProfileProps) {
    const { auth } = usePage().props as { auth: AuthProps };
    const [preview, setPreview] = useState<string | null>(null);

    const source = props.pending ?? props.profile;

    const { data, setData, post, processing } = useForm({
        fullName: source.full_name ?? '',
        headline: source.headline ?? '',
        bio: source.bio ?? '',
        city: source.city ?? '',
        format: source.format ?? 'ONLINE',
        experience: source.experience_level ?? 'ENTRY',
        rate: toDollars(source.hourly_rate),
        currency: source.currency ?? 'USD',
        stripeAccountId: source.stripe_account_id ?? '',
        payoutMethod: source.payout_method ?? '',
        payoutDetails: source.payout_details ?? '',
        username: source.username ?? '',
        avatar: null as File | null,
    });

    const [usernameAvailability, setUsernameAvailability] = useState<'available' | 'taken' | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    const generateUsername = (name: string): string => {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s]+/g, '-')
            .replace(/[-]+/g, '-')
            .trim('-');
    };

    const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setData('fullName', name);
        const generated = generateUsername(name);
        setData('username', generated);
        setUsernameAvailability(null);
        setIsCheckingUsername(false);
    };

    const checkUsernameAvailability = async (username: string) => {
        if (!username.trim()) {
            setUsernameAvailability(null);
            return;
        }
        setIsCheckingUsername(true);
        try {
            const response = await fetch('/username-available', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });
            const data = await response.json();
            setUsernameAvailability(data.available ? 'available' : 'taken');
        } catch (error) {
            setUsernameAvailability('taken');
        } finally {
            setIsCheckingUsername(false);
        }
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/tutor/profile', { forceFormData: true });
    };

    const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('avatar', file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const displayedAvatar = preview ?? (props.pending?.avatar_url || props.profile?.avatar_url);

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Edit public profile" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="space-y-6 py-6">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        {props.pending && (
                            <div className="card card-border border-warning/30 bg-warning/10">
                                <div className="card-body flex-row items-center gap-3 py-3">
                                    <Clock className="size-4 shrink-0 text-warning" />
                                    <p className="text-sm text-base-content/80">
                                        Your submitted changes are pending admin review. They will
                                        appear on your public profile once approved. The public
                                        profile still shows the last approved version.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                Tutor profile
                            </span>
                            <h1 className="font-display mt-2 text-2xl font-bold text-base-content">
                                Edit public profile
                            </h1>
                            <p className="text-sm text-base-content/60">
                                Changes you save are submitted for admin review before they go
                                public. Payment information is updated immediately.
                            </p>
                        </div>

                        <form onSubmit={submit} className="mt-6 space-y-5">
                            <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                                <div className="card-body gap-5">
                                    <div className="flex items-center gap-4">
                                        <Avatar
                                            src={displayedAvatar}
                                            name={source.full_name}
                                            className="size-16 shadow-lg shadow-primary/20"
                                            textClass="text-lg"
                                        />
                                        <label className="cursor-pointer">
                                            <span className="btn btn-outline btn-sm rounded-full border-base-content/15 text-base-content/80 hover:bg-base-content/5">
                                                <ImagePlus className="size-4" />
                                                {displayedAvatar ? 'Change photo' : 'Upload photo'}
                                            </span>
                                            <input
                                                type="file"
                                                name="avatar"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                className="hidden"
                                                onChange={onAvatarChange}
                                            />
                                        </label>
                                        <p className="text-xs text-base-content/50">
                                            JPG, PNG, WebP or GIF. Under 5MB.
                                        </p>
                                    </div>
                                    {props.errors?.avatar && (
                                        <span className="text-xs text-error">{props.errors.avatar}</span>
                                    )}

                                    <div className="divider divider-neutral my-0" />

<div className="grid gap-4 sm:grid-cols-2">
                                        <div className="fieldset sm:col-span-2">
                                            <legend className="fieldset-legend">Full name</legend>
                                            <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={data.fullName}
                                                    onChange={(e) => setData('fullName', e.target.value)}
                                                />
                                            </label>
                                            {props.errors?.fullName && (
                                                <span className="text-xs text-error">{props.errors.fullName}</span>
                                            )}
                                        </div>

                                        <div className="fieldset">
                                            <legend className="fieldset-legend">Username</legend>
                                            <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={data.username}
                                                    onChange={(e) => setData('username', e.target.value)}
                                                    onBlur={() => checkUsernameAvailability(data.username)}
                                                    placeholder="e.g. ananya-math-tutor"
                                                />
                                            </label>
                                            {props.errors?.username && (
                                                <span className="text-xs text-error">{props.errors.username}</span>
                                            )}
                                            {usernameAvailability !== null && (
                                                <span className="text-xs mt-1 flex items-center gap-1.5">
                                                    {usernameAvailability === 'available' && <span className="text-success">Available</span>}
                                                    {usernameAvailability === 'taken' && <span className="text-error">Taken</span>}
                                                </span>
                                            )}
                                        </div>

                                        <div className="fieldset sm:col-span-2">
                                            <legend className="fieldset-legend">Headline</legend>
                                            <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                                <input
                                                    type="text"
                                                    name="headline"
                                                    placeholder="e.g. Experienced Algebra & Calculus tutor"
                                                    value={data.headline}
                                                    onChange={(e) => setData('headline', e.target.value)}
                                                />
                                            </label>
                                            {props.errors?.headline && (
                                                <span className="text-xs text-error">{props.errors.headline}</span>
                                            )}
                                        </div>

                                        <div className="fieldset sm:col-span-2">
                                            <legend className="fieldset-legend">Bio</legend>
                                            <label className="textarea w-full rounded-xl border-base-content/10 bg-base-content/5">
                                                <textarea
                                                    name="bio"
                                                    rows={4}
                                                    className="resize-none w-full bg-transparent text-base-content/80 placeholder:text-base-content/50 focus:outline-none"
                                                    placeholder="Tell students about your background and teaching style."
                                                    value={data.bio}
                                                    onChange={(e) => setData('bio', e.target.value)}
                                                />
                                            </label>
                                            {props.errors?.bio && (
                                                <span className="text-xs text-error">{props.errors.bio}</span>
                                            )}
                                        </div>

                                        <div className="fieldset">
                                            <legend className="fieldset-legend">City</legend>
                                            <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={data.city}
                                                    onChange={(e) => setData('city', e.target.value)}
                                                />
                                            </label>
                                            {props.errors?.city && (
                                                <span className="text-xs text-error">{props.errors.city}</span>
                                            )}
                                        </div>

                                        <div className="fieldset">
                                            <legend className="fieldset-legend">Teaching format</legend>
                                            <select
                                                name="format"
                                                className="select w-full rounded-xl appearance-none border-base-content/10 bg-base-content/5"
                                                value={data.format}
                                                onChange={(e) => setData('format', e.target.value)}
                                            >
                                                {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                            {props.errors?.format && (
                                                <span className="text-xs text-error">{props.errors.format}</span>
                                            )}
                                        </div>

                                        <div className="fieldset">
                                            <legend className="fieldset-legend">Experience level</legend>
                                            <select
                                                name="experience"
                                                className="select w-full rounded-xl appearance-none border-base-content/10 bg-base-content/5"
                                                value={data.experience}
                                                onChange={(e) => setData('experience', e.target.value)}
                                            >
                                                {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                            {props.errors?.experience && (
                                                <span className="text-xs text-error">{props.errors.experience}</span>
                                            )}
                                        </div>

                                        <div className="fieldset">
                                            <legend className="fieldset-legend">Hourly rate</legend>
                                            <div className="flex gap-2">
                                                <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                                    <span className="text-base-content/50">{SYMBOLS[data.currency as CurrencyCode] ?? '$'}</span>
                                                    <input
                                                        type="number"
                                                        name="rate"
                                                        min="0"
                                                        step="0.01"
                                                        value={data.rate}
                                                        onChange={(e) => setData('rate', e.target.value)}
                                                    />
                                                </label>
                                                <select
                                                    name="currency"
                                                    className="select appearance-none w-28 shrink-0 rounded-xl border-base-content/10 bg-base-content/5"
                                                    value={data.currency}
                                                    onChange={(e) => setData('currency', e.target.value)}
                                                >
                                                    {['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'].map((c) => (
                                                        <option key={c} value={c}>
                                                            {c}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {props.errors?.rate && (
                                                <span className="text-xs text-error">{props.errors.rate}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card card-border border-base-content/10 bg-base-content/[0.04]">
                                <div className="card-body gap-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <CreditCard className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-display text-lg font-semibold text-base-content">
                                                Payout information
                                            </h3>
                                            <p className="text-sm text-base-content/60">
                                                Connect your Stripe account to receive payments.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="divider divider-neutral my-0" />

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="fieldset sm:col-span-2">
                                            <legend className="fieldset-legend">Stripe Connect Account ID</legend>
                                            <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                                <input
                                                    type="text"
                                                    name="stripeAccountId"
                                                    placeholder="acct_..."
                                                    value={data.stripeAccountId}
                                                    onChange={(e) => setData('stripeAccountId', e.target.value)}
                                                />
                                            </label>
                                            <p className="text-xs text-base-content/50">
                                                Enter your Stripe Connect account ID (starts with <code>acct_</code>).
                                            </p>
                                        </div>

                                        <div className="fieldset">
                                            <legend className="fieldset-legend">Payout method</legend>
                                            <select
                                                name="payoutMethod"
                                                className="select w-full rounded-xl appearance-none border-base-content/10 bg-base-content/5"
                                                value={data.payoutMethod}
                                                onChange={(e) => setData('payoutMethod', e.target.value)}
                                            >
                                                <option value="">Select method</option>
                                                <option value="stripe">Stripe Connect</option>
                                                <option value="bank_transfer">Bank transfer</option>
                                                <option value="paypal">PayPal</option>
                                            </select>
                                        </div>

                                        <div className="fieldset sm:col-span-2">
                                            <legend className="fieldset-legend">Payout details (JSON)</legend>
                                            <label className="textarea w-full rounded-xl border-base-content/10 bg-base-content/5">
                                                <textarea
                                                    name="payoutDetails"
                                                    rows={3}
                                                    className="resize-none w-full bg-transparent text-base-content/80 placeholder:text-base-content/50 focus:outline-none font-mono text-xs"
                                                    placeholder='{"bank_name": "Chase", "last4": "1234", "routing": "021000021"}'
                                                    value={data.payoutDetails}
                                                    onChange={(e) => setData('payoutDetails', e.target.value)}
                                                />
                                            </label>
                                            <p className="text-xs text-base-content/50">
                                                Optional JSON with additional payout info (bank name, last 4 digits, etc.)
                                            </p>
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
                                    {processing ? 'Submitting...' : 'Submit for review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}