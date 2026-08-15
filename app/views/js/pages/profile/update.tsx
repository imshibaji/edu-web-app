import { Head, useForm, usePage } from '@inertiajs/react';
import { Mail, Lock, Save, Coins } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { getInitials } from '@/utils/index';
import { CURRENCIES } from '@/utils/currency';
import type { AuthProps } from '@/types';

interface Props {
    name: string;
    email: string;
    errors: Record<string, string>;
    baseCurrency: string;
}

export default function ProfileSettings({ name, email, errors, baseCurrency }: Props) {
    const { auth } = usePage().props as { auth: AuthProps };
    const { data, setData, patch, processing } = useForm({
        email: email ?? '',
        password: '',
        baseCurrency: baseCurrency ?? 'USD',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch('/settings/profile');
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Profile settings" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Settings
                    </span>
                    <h1 className="font-display mt-2 text-2xl font-bold text-base-content">
                        Profile settings
                    </h1>
                    <p className="text-sm text-base-content/60">
                        Update your email or password. Profile details are managed by your
                        educator profile.
                    </p>

                    <div className="card card-border mt-6 border-base-content/10 bg-base-content/[0.04]">
                        <div className="card-body">
                            <div className="flex items-center gap-4 border-b border-base-content/10 pb-5">
                                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-lg font-bold text-white">
                                    {getInitials(name || 'U')}
                                </span>
                                <div>
                                    <p className="font-display text-lg font-semibold text-base-content">
                                        {name ?? 'User'}
                                    </p>
                                    <p className="text-sm text-base-content/60">
                                        {email ?? 'No email set'}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submit} className="mt-6 space-y-5">
                                <div className="fieldset">
                                    <legend className="fieldset-legend">Email</legend>
                                    <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                        <Mail className="size-4 text-base-content/50" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                    </label>
                                    {errors?.email && (
                                        <span className="text-xs text-error">{errors.email}</span>
                                    )}
                                </div>

                                <div className="fieldset">
                                    <legend className="fieldset-legend">
                                        New password (leave blank to keep current)
                                    </legend>
                                    <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                        <Lock className="size-4 text-base-content/50" />
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="••••••••"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                        />
                                    </label>
                                    {errors?.password && (
                                        <span className="text-xs text-error">{errors.password}</span>
                                    )}
                                </div>

                                <div className="fieldset">
                                    <legend className="fieldset-legend">Base currency</legend>
                                    <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                        <Coins className="size-4 text-base-content/50" />
                                        <select
                                            name="baseCurrency"
                                            className="w-full cursor-pointer bg-transparent"
                                            value={data.baseCurrency}
                                            onChange={(e) => setData('baseCurrency', e.target.value)}
                                        >
                                            {CURRENCIES.map((c) => (
                                                <option key={c.code} value={c.code}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <p className="text-xs text-base-content/50">
                                        Amounts across Larnr are shown in this currency. Tutors and
                                        students see converted amounts; admins see both.
                                    </p>
                                    {errors?.baseCurrency && (
                                        <span className="text-xs text-error">{errors.baseCurrency}</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary rounded-full px-6"
                                        disabled={processing}
                                    >
                                        <Save className="size-4" />
                                        {processing ? 'Saving...' : 'Save changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}